// Data-library loader. Imports the JSON data files (data/*.json) and exposes
// them behind typed accessors. The engine reads all game rules from here — no
// tables are hardcoded. JSON is imported as modules so the same code works in
// Node (tests) and in a Vite/Foundry bundle.

import colorsJson from '../../data/colors.json';
import patternsJson from '../../data/patterns.json';
import typesJson from '../../data/types.json';
import functionsJson from '../../data/functions.json';
import sensitivitiesJson from '../../data/sensitivities.json';
import growthRulesJson from '../../data/growth-rules.json';
import breedingRulesJson from '../../data/breeding-rules.json';
import type { FungalType, RollTableEntry } from '../data/types';

// --- Roll-table helper (mirrors types.ts rollTableLookup, kept here so the
// engine has no dependency cycle with the Foundry-facing types module). ---
export function lookup<T>(table: RollTableEntry<T>[], roll: number): T {
  const hit = table.find((e) => roll >= e.min && roll <= e.max);
  if (!hit) throw new Error(`No table entry covers roll ${roll}`);
  return hit.value;
}

// --- Typed views over the JSON. Cast through unknown because the JSON's
// inferred literal types are narrower than the engine's working types. ---

export interface DiceField {
  formula: string;
  rounding?: 'up' | 'down';
  unit?: string;
  derivedFrom?: string;
}

export interface TypeDef {
  displayName: string;
  shape: { form: string; canGrowDiagonal: boolean; [k: string]: unknown };
  dimensions: Record<string, DiceField>;
  rates: { rtfm: DiceField; mruom: DiceField; romg: DiceField };
  totalHeight: string;
  notes?: string;
}

export const colors = colorsJson as unknown as {
  table: RollTableEntry<string>[];
  colors: string[];
  groupings: { primary: string[]; monochrome: string[]; brown: string[] };
};

export const patterns = patternsJson as unknown as {
  table: RollTableEntry<string>[];
  patterns: string[];
  families: Record<string, { includes: string[] }>;
};

export const types = typesJson as unknown as {
  fungalTypeTable: { table: RollTableEntry<FungalType>[] };
  types: Record<FungalType, TypeDef>;
  appearance: {
    bioluminescence: { table: RollTableEntry<boolean>[] };
    transparency: { table: RollTableEntry<boolean>[] };
  };
};

export interface HealingValue {
  effect: string;
  prepMethod: 'tea' | 'powder' | 'save';
  dc: number;
}
export interface PoisonValue {
  effect: string;
  dc: number;
  requiresCheckOnAnyInteraction?: boolean;
  override?: { color?: string; transparent?: boolean; requiresShade?: boolean; romgMonths?: number };
}

export const functions = functionsJson as unknown as {
  edibleRules: Record<string, unknown>;
  odor: { table: RollTableEntry<string>[] };
  flavorIntensity: { table: RollTableEntry<string>[]; ordinal: string[] };
  flavor: { table: RollTableEntry<string>[] };
  functionType: {
    toadstool: RollTableEntry<string>[];
    mold: RollTableEntry<string>[];
  };
  sporeVirility: { sporesPerMinute: { formula: string; moldPerGrowth: number } };
  healing: {
    toadstool: { table: RollTableEntry<HealingValue>[] };
    mold: { table: RollTableEntry<HealingValue>[] };
  };
  poison: { table: RollTableEntry<PoisonValue>[] };
  magicalEffectSpore: {
    rollTable: { table: RollTableEntry<{ name: string; cost: number }>[] };
    descriptions: Record<string, { spellAnalog: string; description: string }>;
  };
};

export interface SensitivityRuleData {
  id: string;
  trigger: Record<string, unknown>;
  restriction?: Record<string, unknown>;
  effect?: Record<string, unknown>;
  appliesAt: 'generation' | 'rtfmInitiation' | 'everyRomgCycle' | 'mature';
  precedence?: 'absolute';
  note?: string;
}

export const sensitivities = sensitivitiesJson as unknown as {
  grammar: Record<string, unknown>;
  rules: SensitivityRuleData[];
};

export const growthRules = growthRulesJson as unknown as {
  time: {
    daysPerWeek: number;
    daysPerMonth: number;
    plantGrowthAdvanceDays: { action: number; eightHour: number };
    ecosystemAutoResumeDays: number;
    prepMethodExpiryDays: Record<'save' | 'tea' | 'powder', number>;
  };
  rtfmInitiation: Record<string, string>;
  shade: Record<string, unknown>;
  mycelium: Record<string, unknown>;
  verticalGrowth: { diagonalPenalty: { heightLostPerUnits: number; perDiagonalUnits: number } };
  merge: Record<string, unknown>;
  harvest: Record<string, unknown>;
  ecosystem: Record<string, unknown>;
};

export const breedingRules = breedingRulesJson as unknown as {
  cadence: { generationFormula: string; newHybridsPerDawn: number };
  statRows: string[];
  exceptions: Record<string, { rule: string; appliesTo: string[] }>;
  reverseCauseIndex: {
    functions: Record<string, Array<Record<string, unknown>>>;
    sensitivities: Record<string, unknown>;
  };
};

// --- Pattern / color helpers used by the sensitivity evaluator ---

/** Does a pattern value match a substring family tag (e.g. "Ringed", "Black")? */
export function patternIncludes(pattern: string, needle: string): boolean {
  const fam = patterns.families[pattern];
  if (fam) return fam.includes.includes(needle);
  return pattern.includes(needle);
}

export function isBrownOrMonochrome(color: string): boolean {
  return color === 'Brown' || colors.groupings.monochrome.includes(color);
}
