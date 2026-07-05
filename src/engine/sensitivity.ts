// Sensitivity predicate evaluator. Evaluates the trigger grammar from
// data/sensitivities.json (decision D10) generically against a context object.
// The same evaluator serves generation-time (species-static) and runtime
// (colony/neighbor) checks — the `lenient` flag decides how to treat colony
// operands that aren't known yet.

import { patternIncludes, sensitivities, type SensitivityRuleData } from './data';

/** Fields the evaluator understands. Species-static plus colony/neighbor. */
export interface SensitivityContext {
  // species-static
  fungalType?: string;
  color?: string;
  pattern?: string;
  bioluminescent?: boolean;
  transparent?: boolean;
  heightUnits?: number;
  edible?: boolean;
  flavor?: string;
  hasFunction?: string;
  // colony / neighbor (runtime only)
  stage?: string;
  myceliumContactPoints?: number;
  adjacentDistinctPatternCount?: number;
  adjacentToWhiteMycelium?: boolean;
  edgeAdjacent?: boolean;
}

const COLONY_OPERANDS = new Set([
  'stage',
  'myceliumContactPoints',
  'adjacentDistinctPatternCount',
  'adjacentToWhiteMycelium',
  'edgeAdjacent',
]);

/**
 * Evaluate a trigger predicate against a context.
 * When `lenient` is true, a colony operand that is absent from the context is
 * treated as satisfied (used at generation time to decide whether a rule
 * *applies* to a species by its static traits, deferring the live check).
 */
export function evaluateTrigger(
  trigger: Record<string, unknown>,
  ctx: SensitivityContext,
  lenient = false,
): boolean {
  for (const [key, operand] of Object.entries(trigger)) {
    if (key === 'or') {
      const subs = operand as Array<Record<string, unknown>>;
      if (!subs.some((s) => evaluateTrigger(s, ctx, lenient))) return false;
      continue;
    }
    if (key === 'and') {
      const subs = operand as Array<Record<string, unknown>>;
      if (!subs.every((s) => evaluateTrigger(s, ctx, lenient))) return false;
      continue;
    }
    if (!matchField(key, operand, ctx, lenient)) return false;
  }
  return true;
}

function matchField(
  field: string,
  operand: unknown,
  ctx: SensitivityContext,
  lenient: boolean,
): boolean {
  const actual = (ctx as Record<string, unknown>)[field];

  if (actual === undefined) {
    // Unknown value: colony operands are deferred under lenient mode.
    return lenient && COLONY_OPERANDS.has(field);
  }

  if (operand !== null && typeof operand === 'object') {
    const cmp = operand as Record<string, unknown>;
    for (const [op, val] of Object.entries(cmp)) {
      if (!matchComparator(field, actual, op, val)) return false;
    }
    return true;
  }
  // literal equality
  return actual === operand;
}

function matchComparator(field: string, actual: unknown, op: string, val: unknown): boolean {
  switch (op) {
    case 'gt':
      return typeof actual === 'number' && actual > (val as number);
    case 'gte':
      return typeof actual === 'number' && actual >= (val as number);
    case 'lt':
      return typeof actual === 'number' && actual < (val as number);
    case 'lte':
      return typeof actual === 'number' && actual <= (val as number);
    case 'eq':
      return actual === val;
    case 'not':
      return actual !== val;
    case 'in':
      return (val as unknown[]).includes(actual);
    case 'notIn':
      return !(val as unknown[]).includes(actual);
    case 'includes':
      if (field === 'pattern' && typeof actual === 'string') {
        return patternIncludes(actual, val as string);
      }
      return typeof actual === 'string' && actual.includes(val as string);
    default:
      throw new Error(`Unknown comparator "${op}"`);
  }
}

/** All rules whose trigger matches (lenient) — i.e. the sensitivities that apply
 * to a species given its static traits, deferring live colony checks. */
export function matchingRules(ctx: SensitivityContext): SensitivityRuleData[] {
  return sensitivities.rules.filter((r) => evaluateTrigger(r.trigger, ctx, true));
}

/** Rules for a given phase whose trigger strictly matches the context. */
export function firingRules(
  ctx: SensitivityContext,
  phase: SensitivityRuleData['appliesAt'],
): SensitivityRuleData[] {
  return sensitivities.rules.filter(
    (r) => r.appliesAt === phase && evaluateTrigger(r.trigger, ctx, false),
  );
}
