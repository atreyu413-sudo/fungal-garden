# Simulation Engine

Pure, deterministic, Foundry-independent simulation core. Nothing here imports a
Foundry global — the engine is unit-tested in Node (see `tests/`) and wrapped by a thin
Foundry adapter in Phase 4. See [`../../docs/04-Automation.md`](../../docs/04-Automation.md)
for the design.

## Modules

| File | Responsibility |
|---|---|
| `rng.ts` | Seeded deterministic PRNG (mulberry32) + `deriveSeed`/`rngFor` for per-day/per-stage sub-streams |
| `dice.ts` | Rolls the dice-formula strings from `data/types.json` (`"8d4"`, `"volvaDiameter + d12"`, `"capDiameter / 2"`) |
| `data.ts` | Typed accessors over the JSON data library + pattern/color helpers |
| `hex.ts` | Axial hex-grid builder and neighbor topology |
| `sensitivity.ts` | Generic evaluator for the sensitivity predicate grammar (D10) |
| `species-generator.ts` | Rolls a complete immutable wild Species from a seed |
| `breeding.ts` | Coin-flip-per-row hybrid resolution with the hard exceptions + D9 reverse index |
| `garden.ts` | Garden factory, species registry, colony cultivation |
| `pipeline.ts` | The nine-stage per-day pipeline and `advanceDay` / `advanceDays` |
| `index.ts` | Public API barrel |

## The daily pipeline

`advanceDay(bundle, actions?)` runs, in fixed order:

```
Weather → Nutrients → Growth → Competition → Breeding → Mutation → Decay → Harvest → Summary
```

- **Weather, Nutrients, Mutation** are reserved **no-op hooks** (decisions D1/D14) — present
  so rules can be added later without reshaping the pipeline.
- **Growth** advances mycelium age, begins maturation once initiation requirements are met,
  spreads mycelium at each ROMG boundary, and accrues RTFM (mold also requires MRUOM to
  count as fully matured, per RULES-SPEC §3).
- **Competition** merges adjacent same-species colonies (D12) and applies the mixed-pattern
  adjacency mycelium bonus.
- **Breeding** resolves player-requested crosses into new Species (+ registry entries).
- **Decay** removes below-MRUOM colonies that are boxed in with no room to recover.
- **Harvest** produces inventory items and resets maturation (D21, no immediate regrowth).
- **Summary** handles ecosystem auto-resume and increments `campaignDay`.

Each stage gets its own RNG derived from `(seed, campaignDay, stageIndex)`, so runs are
fully replayable: same seed + same actions ⇒ byte-identical garden state (verified in
`tests/determinism.test.ts`).

## Player actions

`advanceDay` takes an optional `DayActions`:

```ts
advanceDay(bundle, {
  breeds: [{ parentColonyIdA, parentColonyIdB, cultivateTileId }],
  harvests: [colonyId],
});
```

## Known v1 simplifications

These are deliberate scope cuts for the first engine, documented so Phase 4/5 can revisit:

- **Shade** is modeled lightly; mold's shade-to-initiate requirement is relaxed (it begins
  on 1 mycelium unit). Full shade geometry (cap footprints, transparency) is deferred.
- **Diagonal growth** height penalty is tracked on the Colony but not yet applied to
  collapse/height math.
- **Ecosystem collapse** (the d100 height check) is scaffolded in the state machine but the
  damage entry-points are driven externally; the collapse resolution is not yet wired into
  the daily Decay stage.
- **Breeding** is invoked via explicit player actions; the once-per-dawn cadence limit and
  replication tracking are enforced at the UI/action layer, not the resolver.
