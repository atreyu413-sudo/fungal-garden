# Fungal Garden — Automation

How the simulation runs, and how it plugs into Foundry. The engine is built and tested
**independently of Foundry** first (Phase 3); Foundry integration (Phase 4) is a thin
adapter on top.

---

## Core principles

1. **One clock.** The garden advances in whole `campaignDay` steps. Advancing "a week" is
   seven single-day advances; Plant Growth acceleration is 30 or 365 single-day advances
   (`time.ts plantGrowthAdvanceDays`). There is no other timer.
2. **Deterministic.** All randomness runs through the Garden's `randomSeed`. Given the same
   seed and the same starting Garden, every advance produces byte-identical results.
   Re-running the event log reproduces any state.
3. **Events, not mutations.** Each stage *queues* `GardenEvent`s describing what changed;
   state is applied through those events. Nothing reaches out and silently mutates a
   colony mid-stage. This is what makes replay, animation, and debugging possible.
4. **Species immutable, Colony mutable.** Stages read Species definitions and write Colony
   state (or create new Species via breeding). No stage edits an existing Species.

---

## The per-day pipeline

Advancing one `campaignDay` runs a single pipeline function whose stages execute **in this
fixed order**:

```
Weather → Nutrients → Growth → Competition → Breeding → Mutation → Decay → Harvest → Summary
```

Each stage takes the Garden and the day's seeded RNG, appends `GardenEvent`s, and hands
the Garden to the next stage. The order is deliberate: environment is set before growth;
growth before the colonies compete for space; competition settles the board before new
genetics (breeding, then mutation) are introduced; decay removes what died this tick;
harvest collects from what survived; summary closes the day.

### 1. Weather — **[OPEN, see D1]**
No weather mechanic exists in the thesis or RULES-SPEC. Reserved stage. **Current
behavior: no-op** — it exists as a hook so environmental rules can be added later without
reshaping the pipeline. Do not invent weather rules without owner sign-off.

### 2. Nutrients — **[OPEN, see D1]**
Likewise undefined by the source. Reserved no-op hook. If nutrients become a mechanic,
this is where per-tile resource accounting would run, before growth consumes it.

### 3. Growth
The heart of the sim, entirely spec-defined:

- **Mycelium spread** — at each colony's ROMG cycle boundary
  (`isWeekComplete(myceliumAgeDays, romgDays)`), every non-growth-bearing mycelium unit
  duplicates into one adjacent empty hex. Surplus beyond available empty neighbors dies
  unless already at/above MRUOM. Growth-bearing mycelium does not spread. Collisions over
  a shared empty hex resolve by seniority (D2).
- **Weekly move** — on `day % 7 === 0`, unburdened mycelium may move one hex; moving into
  another mycelium type consumes it. Resolved one unit at a time in seniority order (D3).
- **RTFM progress** — colonies that have met their initiation requirements (volva fill /
  cap-line fill / mold's 1-unit-plus-shade) accrue `maturityAgeDays`. On reaching
  `rtfmDays` (`isMaturityReached`), the colony's stage advances to `MATURE` and a `mature`
  event fires.
- **Vertical/diagonal** — new stem segments track `diagonalGrowthUnits`; final height
  applies the −1-per-2 penalty. Shade math uses **intended** height (Rulebook §4, D6).
- **Below-MRUOM recovery** — a colony under MRUOM has exactly one ROMG cycle to recover or
  it is marked for death (handled in Decay).

Emits `spread`, `grow`, `mature` events.

### 4. Competition
Resolves interactions between colonies now that they've grown this tick:

- **Adjacency-driven sensitivities** — `mixedPatternAdjacencyBoost` (+1 mycelium unit for
  a growth flanked by two all-different patterns), `ringedVsSpotted` / `holedCannotTouch` /
  `noEdgeGrowth` exclusions, `cannotTouchColor`/`cannotTouchFungalType` conflicts. Rules
  tagged `appliesAt: 'everyRomgCycle'` fire here.
- **Merging** — identical/same-Species colonies now adjacent merge into one (Rulebook §4);
  units summed, tiles unioned, ROMG position from the most recent, maturity from the max
  (D12).
- **Shade recomputation** — update each Tile's `shade` from current cap heights and
  transparency, so the next tick's growth sees correct shade.

Emits `grow` (for the mycelium bonus) and merge-related `spread` events.

### 5. Breeding
Once per day (every day is a dawn, `isDawn` ≡ true):

- If the player has designated two fully matured colonies to cross, resolve the hybrid by
  coin-flipping each `BREEDING_STAT_ROWS` entry against the two parent Species, applying
  `BREEDING_EXCEPTIONS` **before** each relevant flip (mushroom-always-edible, mold-RTFM
  no-crossover, poison/spore-virility don't-stack, function/sensitivity reroll — the last
  of which is **blocked on D9**).
- Resolve `fungalType` first, then skip/re-roll type-mismatched dimension rows (D20).
- A brand-new trait combination creates a new immutable **Species** (generation =
  max(parents)+1) and a **`SpeciesRegistryEntry`** (`firstCultivatedDay` = today,
  `currentLivingColonies` = 1). A replicate of an existing hybrid creates a new **Colony**
  of the existing Species — no new Species, no new registry entry.
- Cultivating requires an empty tile; the tile becomes a `MYCELIUM`-stage colony starting
  its own ROMG cycle.

Emits `breed` events. Note this stage is largely player-driven (the GM/player chooses the
cross); the engine validates and resolves rather than auto-breeding.

### 6. Mutation — **[OPEN, see D14]**
No spontaneous-mutation mechanic exists in the source. Reserved stage, **currently a
no-op**. Placed after Breeding so a hybrid created this tick isn't mutated the same day.
The `mutate` `GardenEventType` is reserved regardless of whether the mechanic is ever
defined. Do not implement mutation rules without owner sign-off.

### 7. Decay
Removes what died this tick:

- Colonies marked below-MRUOM-past-recovery, colonies whose last tile was lost, colonies
  that failed a sensitivity `collapseCondition` (e.g. unsupported tall shelf toadstool,
  D8).
- Ecosystem collapse resolution when the shell is `collapsing`: apply the d100 height
  check (D4 — penalized actual height), collapse taller growths, escalate to
  all-growths-collapse on a repeat trigger.
- When a Species' last Colony dies, set `Species.statistics.extinctAt` / registry
  `currentLivingColonies = 0`; the registry entry persists.

Emits `decay`, `collapse` events.

### 8. Harvest
Collects from colonies flagged ready (player/GM-initiated within the day):

- Produce a `HarvestedItem` (spore/powder/tea/toxin) from the Species' `FunctionTraits`,
  stamped with `harvestedDay` and computed `expiresDay`.
- **Reset the growth** (D21): `maturityAgeDays → 0`, stage back to `GROWING`/`MYCELIUM`;
  mycelium survives. No immediate regrowth.
- Increment `Species.statistics.harvestCount`.

Emits `harvest` events.

### 9. Summary
Closes the day: increments `campaignDay`, rolls up the day's events into a digest for the
UI (what grew, matured, bred, decayed, was harvested), and advances the ecosystem
auto-resume timer (`damaged → healthy` after `ECOSYSTEM_AUTO_RESUME_DAYS`). No new state
beyond bookkeeping; purely a fold over the events already queued.

---

## Ecosystem state machine (cross-cutting)

Runs alongside the pipeline, driven by external damage events rather than the daily tick:

```
healthy → damaged (RTFM halted) → collapsing (d100 height check) → collapsed (cleared) → healthy
```

- b/s/c/f damage from a failed save or while flanked → `ecosystemHalt`, state `damaged`,
  RTFM frozen for all colonies.
- Repeat damage before recovery, or a crit fail → `collapsing`; Decay applies the d100
  check next tick.
- `Plant Growth` on a damaged garden → immediate `ecosystemResume` (resets RTFM cycles,
  `damaged → healthy`). Left alone, auto-resumes after one week.

---

## Randomness and replay

- The Garden holds one `randomSeed`. The pipeline derives a **per-day, per-stage** sub-seed
  from `(randomSeed, campaignDay, stageIndex)` so stages are independently reproducible and
  reordering-safe for debugging.
- Dice tables (`generation-tables.ts`, `mes-effects.ts`) are rolled through the seeded RNG
  via `rollTableLookup`.
- Because state is applied through the queued `events` log, a Garden can be rebuilt from
  `(initial state + seed + event log)` — the basis for the "deterministic" project goal and
  for a future replay/scrubber UI.

---

## Foundry integration (Phase 4 — thin adapter)

- **Storage.** The `Garden` object lives on the **actor** (the tortle), via an actor flag
  (e.g. `actor.flags["fungal-garden"].garden`), carrying its `version` for migration. **No
  journal-based storage.** On load, a migration keyed on `Garden.version` upgrades older
  gardens (D22).
- **Species Registry storage is unresolved (D19)** — on the actor alongside the Garden, or
  a world-level collection. Must be decided before Phase 4 wiring.
- **Advancing time.** A GM control (and/or a hook on the world calendar/`Plant Growth`
  usage) calls the pipeline `advanceDay(garden)` N times. The engine is pure and
  synchronous; Foundry only supplies the trigger and persists the result.
- **Rendering.** The hex grid can be a Foundry scene backed by the canvas grid, or a custom
  data-driven render in an ApplicationV2 window (Phase 5). Tiles carry axial `q,r` either
  way.
- **Items.** `HarvestInventory` buckets map to Foundry Items on the actor when a player
  chooses to materialize a harvested product (consumables, poisons).
- **Determinism across clients.** Because the engine is seeded and pure, the GM's machine
  is authoritative; results are persisted to the actor flag and replicated by Foundry's
  normal document sync. Clients render from the stored Garden, they don't re-simulate.
- **Events → UI.** The `events[]` log drives the timeline/discovery-journal UI (Phase 5)
  and can be animated in order.

---

## Build/test posture

- Phase 3 engine is a plain TypeScript library with **no Foundry imports** — unit-tested
  with seeded fixtures (advance a known Garden N days, assert the event log and end state).
- Foundry globals (`game`, `Hooks`, `Actor`) appear only in the Phase 4 adapter layer, kept
  out of the engine so tests run in Node without a Foundry mock.
