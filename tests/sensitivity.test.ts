import { describe, it, expect } from 'vitest';
import { evaluateTrigger, matchingRules } from '../src/engine/sensitivity';

describe('sensitivity predicate evaluator', () => {
  it('matches literal equality and comparators', () => {
    expect(evaluateTrigger({ color: 'Indigo' }, { color: 'Indigo' })).toBe(true);
    expect(evaluateTrigger({ color: 'Indigo' }, { color: 'Blue' })).toBe(false);
    expect(evaluateTrigger({ heightUnits: { gt: 35 } }, { heightUnits: 40 })).toBe(true);
    expect(evaluateTrigger({ heightUnits: { gt: 35 } }, { heightUnits: 20 })).toBe(false);
    expect(evaluateTrigger({ heightUnits: { lt: 20 } }, { heightUnits: 10 })).toBe(true);
  });

  it('handles in / notIn / not', () => {
    expect(evaluateTrigger({ color: { in: ['Red', 'Blue'] } }, { color: 'Blue' })).toBe(true);
    expect(evaluateTrigger({ color: { notIn: ['Red', 'Blue'] } }, { color: 'Green' })).toBe(true);
    expect(evaluateTrigger({ pattern: { not: 'No Pattern' } }, { pattern: 'Holed' })).toBe(true);
    expect(evaluateTrigger({ pattern: { not: 'No Pattern' } }, { pattern: 'No Pattern' })).toBe(false);
  });

  it('resolves pattern substring families via includes', () => {
    expect(evaluateTrigger({ pattern: { includes: 'Ringed/Striped' } }, { pattern: 'Ringed/Striped Black' })).toBe(true);
    expect(evaluateTrigger({ pattern: { includes: 'Black' } }, { pattern: 'Spotted Black' })).toBe(true);
    expect(evaluateTrigger({ pattern: { includes: 'Black' } }, { pattern: 'Spotted White' })).toBe(false);
  });

  it('handles the or combinator (noEdgeGrowth)', () => {
    const trig = { or: [{ fungalType: 'mold' }, { pattern: { includes: 'Holed' } }] };
    expect(evaluateTrigger(trig, { fungalType: 'mold', pattern: 'No Pattern' })).toBe(true);
    expect(evaluateTrigger(trig, { fungalType: 'toadstool', pattern: 'Holed' })).toBe(true);
    expect(evaluateTrigger(trig, { fungalType: 'toadstool', pattern: 'No Pattern' })).toBe(false);
  });

  it('defers unknown colony operands in lenient mode only', () => {
    const trig = { color: 'Violet', adjacentToWhiteMycelium: true };
    // strict: colony operand unknown -> fails
    expect(evaluateTrigger(trig, { color: 'Violet' }, false)).toBe(false);
    // lenient: colony operand deferred -> passes on static part
    expect(evaluateTrigger(trig, { color: 'Violet' }, true)).toBe(true);
  });

  it('matchingRules attaches white+ringed as poisonous', () => {
    const ids = matchingRules({
      fungalType: 'toadstool',
      color: 'White',
      pattern: 'Ringed/Striped White',
    }).map((r) => r.id);
    expect(ids).toContain('whiteRingedPoisonous');
  });
});
