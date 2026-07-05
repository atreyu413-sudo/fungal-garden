// Wild Species generator. Rolls a complete immutable Species from the data
// library using a seeded RNG. Pure and deterministic: same seed + same call
// order => same Species. Ordering follows decision D15 (appearance, then
// function which resolves last and can override earlier appearance via poison
// special products, then sensitivity forces).

import type {
  Dimensions,
  FunctionCategory,
  FunctionTraits,
  FungalType,
  PhysicalTraits,
  Rates,
  SensitivityTraits,
  Species,
} from '../data/types';
import { toDays } from '../data/time';
import { SeededRng } from './rng';
import { rollFormula, applyRounding } from './dice';
import {
  colors,
  functions,
  lookup,
  patterns,
  types,
  type HealingValue,
  type PoisonValue,
  type TypeDef,
} from './data';
import { firingRules, matchingRules, type SensitivityContext } from './sensitivity';

export interface GenerateOptions {
  fungalType?: FungalType; // force a type instead of rolling
  createdDay?: number;
  createdBy?: string;
}

/** Deterministic id from the RNG stream (not a real UUID, but stable per seed). */
export function idFromRng(rng: SeededRng): string {
  const hex = () => rng.int(0, 0xffff).toString(16).padStart(4, '0');
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

function stripOptimum(key: string): string {
  const s = key.replace(/^optimum/, '');
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function rollDimensions(def: TypeDef, rng: SeededRng): Dimensions {
  const vars: Record<string, number> = {};
  const dims: Dimensions = {};
  for (const [key, field] of Object.entries(def.dimensions)) {
    const raw = rollFormula(field.formula, rng, vars);
    const value = applyRounding(raw, field.rounding);
    const name = stripOptimum(key); // volvaDiameter, capDiameter, stemHeight, capHeight, height
    vars[name] = value;
    switch (name) {
      case 'volvaDiameter':
        dims.volvaDiameter = value;
        break;
      case 'stemHeight':
        dims.stemHeight = value;
        break;
      case 'capDiameter':
        dims.capDiameter = value;
        break;
      case 'capHeight':
        dims.capHeight = value;
        break;
      case 'height': // mold
        dims.moldHeight = value;
        break;
    }
  }
  return dims;
}

function rollRates(def: TypeDef, rng: SeededRng): Rates {
  const rtfm = rollFormula(def.rates.rtfm.formula, rng);
  const mruom = rollFormula(def.rates.mruom.formula, rng);
  const romg = rollFormula(def.rates.romg.formula, rng);
  return {
    rtfmDays: toDays(rtfm, def.rates.rtfm.unit as 'days' | 'weeks' | 'months'),
    mruom,
    romgDays: toDays(romg, def.rates.romg.unit as 'days' | 'weeks' | 'months'),
  };
}

function computeHeightUnits(totalHeightExpr: string, dims: Dimensions): number {
  const map: Record<string, number> = {
    stemHeight: dims.stemHeight ?? 0,
    capHeight: dims.capHeight ?? 0,
    moldHeight: dims.moldHeight ?? 0,
  };
  return totalHeightExpr
    .split('+')
    .map((t) => map[t.trim()] ?? 0)
    .reduce((a, b) => a + b, 0);
}

function rollFunction(
  fungalType: FungalType,
  rng: SeededRng,
): { category: FunctionCategory; traits: FunctionTraits; override?: PoisonValue['override'] } {
  if (fungalType === 'mushroom') {
    return { category: 'edible', traits: { category: 'edible' } };
  }
  const funcTable = fungalType === 'mold' ? functions.functionType.mold : functions.functionType.toadstool;
  const category = lookup(funcTable, rng.die(10)) as FunctionCategory;
  return materializeFunction(category, fungalType, rng);
}

/** Build the FunctionTraits (and any poison override) for a known category. */
export function materializeFunction(
  category: FunctionCategory,
  fungalType: FungalType,
  rng: SeededRng,
): { category: FunctionCategory; traits: FunctionTraits; override?: PoisonValue['override'] } {
  if (category === 'edible' || fungalType === 'mushroom') {
    return { category: 'edible', traits: { category: 'edible' } };
  }
  if (category === 'poison') {
    const poison: PoisonValue = lookup(functions.poison.table, rng.die(100));
    return {
      category,
      traits: {
        category,
        poison: {
          effect: poison.effect,
          dc: poison.dc,
          requiresCheckOnAnyInteraction: poison.requiresCheckOnAnyInteraction,
        },
      },
      override: poison.override,
    };
  }
  if (category === 'healing') {
    const healTable = fungalType === 'mold' ? functions.healing.mold.table : functions.healing.toadstool.table;
    const heal: HealingValue = lookup(healTable, rng.die(fungalType === 'mold' ? 20 : 100));
    return { category, traits: { category, healing: { effect: heal.effect, prepMethod: heal.prepMethod, dc: heal.dc } } };
  }
  // sporeVirility
  const spm = functions.sporeVirility.sporesPerMinute;
  const sporesPerMinute = fungalType === 'mold' ? spm.moldPerGrowth : rng.die(4);
  return { category, traits: { category, sporeVirility: { sporesPerMinute } } };
}

/** Generate one wild (generation-0) Species. */
export function generateWildSpecies(rng: SeededRng, opts: GenerateOptions = {}): Species {
  const id = idFromRng(rng);
  const fungalType = opts.fungalType ?? lookup(types.fungalTypeTable.table, rng.die(10));
  const def = types.types[fungalType];

  const dimensions = rollDimensions(def, rng);
  const rates = rollRates(def, rng);

  // Appearance (D15: rolled before function).
  let color = lookup(colors.table, rng.die(100));
  let pattern = lookup(patterns.table, rng.die(100));
  let bioluminescent = lookup(types.appearance.bioluminescence.table, rng.die(100));
  let transparent = fungalType === 'mold' ? false : lookup(types.appearance.transparency.table, rng.die(100));

  // Sensory.
  let odor = lookup(functions.odor.table, rng.die(20));
  let flavor1 = lookup(functions.flavor.table, rng.die(20));
  let intensity = intensityToNumber(lookup(functions.flavorIntensity.table, rng.die(6)));

  // Function (resolves last; poison special product may override appearance/rates — D15).
  const fn = rollFunction(fungalType, rng);
  const func: FunctionTraits = fn.traits;
  if (fn.override) {
    if (fn.override.color) color = fn.override.color;
    if (fn.override.transparent !== undefined) transparent = fn.override.transparent;
    if (fn.override.romgMonths !== undefined) rates.romgDays = toDays(fn.override.romgMonths, 'months');
  }

  const heightUnits = computeHeightUnits(def.totalHeight, dimensions);

  // Sensitivity forces (applied after poison overrides — D15/D16).
  const staticCtx: SensitivityContext = {
    fungalType,
    color,
    pattern,
    bioluminescent,
    transparent,
    heightUnits,
    edible: func.category === 'edible',
    flavor: flavor1,
  };
  const genRules = firingRules(staticCtx, 'generation');
  // Non-absolute forces in array order, then absolutes last (D16).
  const ordered = [...genRules].sort((a, b) => (a.precedence === 'absolute' ? 1 : 0) - (b.precedence === 'absolute' ? 1 : 0));
  for (const rule of ordered) {
    const e = rule.effect ?? {};
    const r = rule.restriction ?? {};
    if (e.forcesOdor) odor = e.forcesOdor as string;
    if (e.forcesFlavor) flavor1 = e.forcesFlavor as string;
    if (e.forcesFlavorIntensity) intensity = intensityToNumber(e.forcesFlavorIntensity as string);
    if (r.forcesBioluminescence === false) bioluminescent = false;
    if (e.forcesEdible) forceEdible(func);
    if (e.forcesPoisonous) forcePoisonous(func, fungalType, rng);
  }

  const physical: PhysicalTraits = {
    fungalType,
    color,
    pattern,
    bioluminescent,
    transparent,
    dimensions,
    rates,
    flavor: { flavor1, intensity, odor },
  };

  // Attach all sensitivities that apply by static traits (defer live checks).
  const applicable = matchingRules({ ...staticCtx, edible: physical.flavor && func.category === 'edible' });
  const sensitivity = buildSensitivityTraits(applicable);

  const displayName = `${color} ${def.displayName}`;

  return {
    id,
    displayName,
    generation: 0,
    parentSpeciesIds: [],
    physical,
    function: func,
    sensitivity,
    statistics: {
      livingColonies: 0,
      harvestCount: 0,
      createdDay: opts.createdDay ?? 0,
      createdBy: opts.createdBy,
    },
  };
}

function intensityToNumber(label: string): number {
  const idx = functions.flavorIntensity.ordinal.indexOf(label);
  return idx >= 0 ? idx + 1 : 1;
}

function forceEdible(func: FunctionTraits): void {
  func.category = 'edible';
  delete func.poison;
  delete func.healing;
  delete func.sporeVirility;
}

function forcePoisonous(func: FunctionTraits, fungalType: FungalType, rng: SeededRng): void {
  if (fungalType === 'mushroom') return; // mushrooms are absolutely edible
  func.category = 'poison';
  delete func.healing;
  delete func.sporeVirility;
  if (!func.poison) {
    const poison: PoisonValue = lookup(functions.poison.table, rng.die(100));
    func.poison = {
      effect: poison.effect,
      dc: poison.dc,
      requiresCheckOnAnyInteraction: poison.requiresCheckOnAnyInteraction,
    };
  }
}

function buildSensitivityTraits(rules: ReturnType<typeof matchingRules>): SensitivityTraits {
  const ruleIds = rules.map((r) => r.id);
  const traits: SensitivityTraits = { ruleIds };
  const brownOverridesShade = rules.some((r) => r.effect?.overridesAllShadeRules === true);
  for (const r of rules) {
    const rest = r.restriction ?? {};
    if (rest.requiresShade === true && !brownOverridesShade) traits.requiresShade = true;
    if (rest.cannotTouchEdge === true) traits.cannotTouchEdge = true;
    if (rest.requiresWhiteNeighbor === true) traits.requiresWhiteNeighbor = true;
    if (rest.requiresEdibleNeighbor === true) traits.requiresEdibleNeighbor = true;
    if (rest.requiresSeparateColonies) traits.requiresMultipleColonies = true;
  }
  return traits;
}
