// Breeding resolver. Produces a new immutable Species from two parents by a
// coin flip per stat row (breeding-rules.json statRows) with the hard
// exceptions applied before the relevant flips. Implements:
//   - mushroomAlwaysEdible
//   - moldRtfmNoCrossover + type-mismatch dimension reroll (D20)
//   - poison / spore-virility don't-stack tie-breaks
//   - function/sensitivity reroll via the D9 reverse cause-index
// Sensitivities are re-derived from the child's physical traits (they are not
// inherited as a package), which is exactly the v0.2 data-driven behavior.

import type {
  Dimensions,
  FunctionCategory,
  FunctionTraits,
  FungalType,
  PhysicalTraits,
  Rates,
  Species,
} from '../data/types';
import { toDays } from '../data/time';
import { SeededRng } from './rng';
import { rollFormula, applyRounding } from './dice';
import { breedingRules, types, type TypeDef } from './data';
import { matchingRules, type SensitivityContext } from './sensitivity';
import { idFromRng, materializeFunction } from './species-generator';

function pick<T>(rng: SeededRng, a: T, b: T): T {
  return rng.coin() === 'heads' ? a : b;
}

function rollDimension(def: TypeDef, name: string, rng: SeededRng, vars: Record<string, number>): number {
  const key = `optimum${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  const field = def.dimensions[key] ?? def.dimensions[name];
  if (!field) return 0;
  return applyRounding(rollFormula(field.formula, rng, vars), field.rounding);
}

function inheritDimensions(
  childType: FungalType,
  a: Species,
  b: Species,
  rng: SeededRng,
): Dimensions {
  const def = types.types[childType];
  const vars: Record<string, number> = {};
  const out: Dimensions = {};
  // Only the dimensions the child type actually has, in definition order.
  for (const key of Object.keys(def.dimensions)) {
    const name = key.replace(/^optimum/, '').replace(/^./, (c) => c.toLowerCase());
    const field: keyof Dimensions =
      name === 'height' ? 'moldHeight' : (name as keyof Dimensions);
    // Coin-flip a parent; if that parent lacks this dimension (different type), reroll (D20).
    const source = pick(rng, a, b);
    let value = source.physical.dimensions[field];
    if (value === undefined) value = rollDimension(def, name, rng, vars);
    vars[name] = value;
    out[field] = value;
  }
  return out;
}

function inheritRates(childType: FungalType, a: Species, b: Species, rng: SeededRng): Rates {
  const def = types.types[childType];
  const childIsMold = childType === 'mold';

  // rtfmDays: moldRtfmNoCrossover — if the flipped parent's mold-ness differs
  // from the child, reroll from the child's own formula.
  const rtfmSource = pick(rng, a, b);
  const sourceIsMold = rtfmSource.physical.fungalType === 'mold';
  const rtfmDays =
    sourceIsMold === childIsMold
      ? rtfmSource.physical.rates.rtfmDays
      : rerollRtfmDays(def, rng);

  const mruom = pick(rng, a, b).physical.rates.mruom;
  const romgDays = pick(rng, a, b).physical.rates.romgDays;
  return { rtfmDays, mruom, romgDays };
}

function rerollRtfmDays(def: TypeDef, rng: SeededRng): number {
  const v = rollFormula(def.rates.rtfm.formula, rng);
  return toDays(v, def.rates.rtfm.unit as 'days' | 'weeks' | 'months');
}

/** Resolve the child's function per the exceptions and the D9 reverse index. */
function inheritFunction(
  childType: FungalType,
  a: Species,
  b: Species,
  rng: SeededRng,
): FunctionTraits {
  if (childType === 'mushroom') return { category: 'edible' }; // mushroomAlwaysEdible

  const catA = a.function.category;
  const catB = b.function.category;

  // Same function on both parents: carries over directly (coin-flip the detail).
  if (catA === catB && catA) {
    if (catA === 'poison' || catA === 'sporeVirility') {
      // don't-stack tie-break: inherit one parent's single effect.
      return pick(rng, a, b).function;
    }
    return pick(rng, a, b).function;
  }

  // Differ (or only one has it): reroll from the union of causal categories (D9).
  const category = rerollFunctionCategory(catA, catB, rng);
  if (!category) return { category: null };
  return materializeFunction(category, childType, rng).traits;
}

function rerollFunctionCategory(
  catA: FunctionCategory,
  catB: FunctionCategory,
  rng: SeededRng,
): FunctionCategory {
  // Gather causal entries for each present parent category from the reverse index.
  const index = breedingRules.reverseCauseIndex.functions;
  const pool: FunctionCategory[] = [];
  for (const cat of [catA, catB]) {
    if (!cat) continue;
    const causes = index[cat] ?? [];
    // Each causal entry contributes one weighted chance toward that category.
    for (let i = 0; i < Math.max(1, causes.length); i++) pool.push(cat);
  }
  if (pool.length === 0) return null;
  return rng.pick(pool);
}

/** Breed two parent Species into a new immutable child Species. */
export function breedSpecies(
  parentA: Species,
  parentB: Species,
  rng: SeededRng,
  createdDay = 0,
  createdBy?: string,
): Species {
  const id = idFromRng(rng);

  // Row 1: fungalType resolves first (everything type-specific keys off it).
  const fungalType = pick(rng, parentA, parentB).physical.fungalType;
  const def: TypeDef = types.types[fungalType];

  const dimensions = inheritDimensions(fungalType, parentA, parentB, rng);
  const rates = inheritRates(fungalType, parentA, parentB, rng);

  const color = pick(rng, parentA, parentB).physical.color;
  const pattern = pick(rng, parentA, parentB).physical.pattern;
  const bioluminescent = pick(rng, parentA, parentB).physical.bioluminescent;
  const transparent = fungalType === 'mold' ? false : pick(rng, parentA, parentB).physical.transparent;

  // Flavors may stack (independently rolled/inherited).
  const flavor1 = pick(rng, parentA, parentB).physical.flavor.flavor1;
  const otherFlavor = pick(rng, parentA, parentB).physical.flavor.flavor2 ??
    (parentA.physical.flavor.flavor1 === flavor1 ? parentB : parentA).physical.flavor.flavor1;
  const flavor2 = otherFlavor !== flavor1 ? otherFlavor : undefined;
  const intensity = pick(rng, parentA, parentB).physical.flavor.intensity;
  const odor = pick(rng, parentA, parentB).physical.flavor.odor;

  const func = inheritFunction(fungalType, parentA, parentB, rng);

  const physical: PhysicalTraits = {
    fungalType,
    color,
    pattern,
    bioluminescent,
    transparent,
    dimensions,
    rates,
    flavor: flavor2 ? { flavor1, flavor2, intensity, odor } : { flavor1, intensity, odor },
  };

  // Sensitivities re-derived from the child's traits (not inherited as a package).
  const totalHeight = def.totalHeight
    .split('+')
    .map((t) => {
      const n = t.trim();
      const map: Record<string, number | undefined> = {
        stemHeight: dimensions.stemHeight,
        capHeight: dimensions.capHeight,
        moldHeight: dimensions.moldHeight,
      };
      return map[n] ?? 0;
    })
    .reduce((x, y) => x + y, 0);

  const ctx: SensitivityContext = {
    fungalType,
    color,
    pattern,
    bioluminescent,
    transparent,
    heightUnits: totalHeight,
    edible: func.category === 'edible',
    flavor: flavor1,
  };
  const ruleIds = matchingRules(ctx).map((r) => r.id);

  return {
    id,
    displayName: `${color} ${def.displayName} (hybrid)`,
    generation: Math.max(parentA.generation, parentB.generation) + 1,
    parentSpeciesIds: [parentA.id, parentB.id],
    physical,
    function: func,
    sensitivity: { ruleIds },
    statistics: { livingColonies: 0, harvestCount: 0, createdDay, createdBy },
  };
}
