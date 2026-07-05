// Dice-formula evaluator. Rolls the formula strings stored in data/types.json
// (e.g. "8d4", "d8", "2d12", "volvaDiameter + d12", "capDiameter / 2") using a
// seeded RNG so results are reproducible.
//
// Grammar (only what the data actually uses):
//   expr   := term (('+' | '/') term)*      evaluated left-to-right, no precedence
//   term   := dice | integer | variable
//   dice   := [N] 'd' M                      N optional (default 1)
//   variable := identifier resolved from `vars`
//
// Rounding is NOT applied here — the caller applies the dimension's rounding rule
// (round up/down) after evaluation, because the same formula can round either way.

import { SeededRng } from './rng';

const DICE_RE = /^(\d*)d(\d+)$/i;
const INT_RE = /^-?\d+$/;

export function rollFormula(
  formula: string,
  rng: SeededRng,
  vars: Record<string, number> = {},
): number {
  const tokens = tokenize(formula);
  let acc = evalTerm(tokens[0]!, rng, vars);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const rhs = evalTerm(tokens[i + 1]!, rng, vars);
    if (op === '+') acc += rhs;
    else if (op === '/') acc /= rhs;
    else throw new Error(`Unsupported operator "${op}" in formula "${formula}"`);
  }
  return acc;
}

/** Roll one dice term "NdM" / "dM" and return the summed result. */
export function rollDice(expr: string, rng: SeededRng): number {
  const m = DICE_RE.exec(expr.trim());
  if (!m) throw new Error(`Not a dice expression: "${expr}"`);
  const count = m[1] === '' ? 1 : parseInt(m[1]!, 10);
  const sides = parseInt(m[2]!, 10);
  let total = 0;
  for (let i = 0; i < count; i++) total += rng.die(sides);
  return total;
}

function tokenize(formula: string): string[] {
  // Split on + and / while keeping the operators as their own tokens.
  return formula
    .split(/\s*([+/])\s*/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function evalTerm(token: string, rng: SeededRng, vars: Record<string, number>): number {
  if (DICE_RE.test(token)) return rollDice(token, rng);
  if (INT_RE.test(token)) return parseInt(token, 10);
  if (token in vars) return vars[token]!;
  throw new Error(`Unknown term "${token}" (not dice, integer, or a known variable)`);
}

/** Apply a rounding rule ("up" | "down" | undefined) to a rolled value. */
export function applyRounding(value: number, rounding?: 'up' | 'down'): number {
  if (rounding === 'up') return Math.ceil(value);
  if (rounding === 'down') return Math.floor(value);
  return Math.round(value);
}
