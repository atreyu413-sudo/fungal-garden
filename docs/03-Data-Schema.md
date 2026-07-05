# Fungal Garden — Data Schema

Prose description of the data model in `src/data/types.ts` (v0.2 architecture). The
single organizing principle is the **Species / Colony split**: a *Species* is an
immutable definition, a *Colony* is a mutable living instance. Everything else hangs off
that distinction. Where a field has an open question, this doc points at the relevant
`D#` in `02-Design-Decisions.md`.

---

## Why Species and Colony are separate

The v0.1 draft used a single `FungalColony` type that conflated "what this fungus *is*"
with "this particular patch of it growing on hex B4." That breaks the moment you have two
identical hybrids in different places, or a species that has gone extinct but should still
be remembered. v0.2 splits them:

- **Species** — the genetic/definitional record. Traits, functions, sensitivities,
  lineage, statistics. Rolled or bred **once**, then **never mutated**.
- **Colony** — a living instance of a Species occupying tiles. Tracks stage, age,
  mycelium, harvest readiness. There may be zero, one, or many Colonies of a Species.

A **Species is immutable; a Colony is mutable.** Any code that finds itself editing a
Species field after generation is a bug — that data belongs on the Colony (live state) or
is a new Species (breeding/mutation).

**Do not reintroduce `FungalColony`.** If any stale reference to it appears, the
Species/Colony pair in `types.ts` is the source of truth.

---

## Shared primitives

- **`FungalType`** — `'toadstool' | 'shelfToadstool' | 'mold' | 'mushroom'`.
- **`FunctionCategory`** — `'poison' | 'healing' | 'sporeVirility' | 'edible' | null`.
  `null` means an inert non-mushroom growth (still deals 1 poison damage if eaten, per
  Rulebook §6).
- **`PrepMethod`** — `'tea' | 'powder' | 'save' | 'contact' | 'inhaled' | 'ingested'`.
  The first three are healing prep windows; the last three are poison delivery methods.
- **`EcosystemState`** — `'healthy' | 'damaged' | 'collapsing' | 'collapsed'`, the shell
  state machine (Rulebook §1).
- **`ColonyStage`** (enum) — `SPORE → MYCELIUM → GROWING → MATURE → HARVESTED`, plus
  `DORMANT` and `DEAD`. The lifecycle a Colony moves through.
- **`RollTableEntry<T>`** — `{ min, max, value }`, one band of a dice table.
  `rollTableLookup(table, roll)` returns the `value` whose `[min,max]` covers `roll`, and
  throws if none does. Every generation table in `generation-tables.ts` and `mes-effects.ts`
  is an array of these.

---

## Species and its parts

### `Species`
The immutable record. Fields:

- **`id`** — permanent UUID. Colonies and registry entries reference this.
- **`displayName`** — human/UI name.
- **`generation`** — `0` for wild-rolled species, `1+` for bred hybrids
  (`max(parentGen) + 1`).
- **`parentSpeciesIds`** — immediate parents only (empty for gen 0, two ids for a
  hybrid). Full lineage is reconstructed through the registry, not stored here.
- **`physical`** — `PhysicalTraits`.
- **`function`** — `FunctionTraits`.
- **`sensitivity`** — `SensitivityTraits`.
- **`statistics`** — `SpeciesStatistics`.

### `PhysicalTraits`
- `fungalType`, `color`, `pattern` (strings from the color/pattern tables),
  `bioluminescent`, `transparent` (booleans).
- **`dimensions`** — a `Dimensions` object.
- **`flavor`** — `{ flavor1, flavor2?, intensity (1–6), odor }`. `flavor2` exists only on
  hybrids that stacked a second flavor (Rulebook §9).

### `Dimensions`
Optional fields, populated by type: `volvaDiameter`, `stemHeight` (toadstool/mushroom);
`capDiameter`, `capHeight` (all cap-bearing types); `moldHeight` (mold). There is **no
radius field** — radii are derived as diameter ÷ 2 when needed (see D11).

### `Rates`
`{ rtfmDays, mruom, romgDays }`. All time values are **days** — the thesis's months/weeks
are converted through `time.ts` `toDays()` at generation. (Note: `Rates` is defined but
the current `PhysicalTraits` does not embed it directly; rates live wherever the generator
places them per type. This is a known loose end for Phase 2/3 to tie down alongside the
dimension work.)

### `FunctionTraits`
- **`category`** — the `FunctionCategory`.
- Optional detail objects, present only for the matching category:
  - **`healing`** — `HealingProperty { effect, prepMethod, dc }`.
  - **`poison`** — `PoisonProperty { effect, dc, requiresCheckOnAnyInteraction? }`. The
    flag marks contact poisons (Rulebook §6).
  - **`sporeVirility`** — `SporeVirilityProperty { sporesPerMinute }` (d4 baseline; mold =
    1 per growth).
  - **`magicalEffect`** — `MagicalEffectProperty { name, cost }`, where `name` keys into
    `mes-effects.ts` `MES_EFFECT_DESCRIPTIONS`. Only possible when the species is
    bioluminescent and the colony isn't touching brown — so this is a *potential* the
    Colony realizes, not a guaranteed active effect.

### `SensitivityTraits`
A few convenience booleans (`requiresShade`, `requiresWhiteNeighbor`,
`requiresEdibleNeighbor`, `cannotTouchEdge`, `requiresMultipleColonies`,
`supportRequirement`) **plus the authoritative field `ruleIds: string[]`** — keys into
`sensitivities.ts` `SENSITIVITY_RULES`. The booleans are a denormalized cache for quick UI
checks; the `ruleIds` list is the real data the engine evaluates. See D10 for the rule
grammar those ids resolve to.

### `SpeciesStatistics`
`{ livingColonies, harvestCount, createdDay, createdBy?, extinctAt? }`. `createdDay` is a
campaign day. `extinctAt` is set when the last colony dies (the registry entry persists
regardless). Note `livingColonies` here overlaps the registry's `currentLivingColonies`
— see D19 for which is the source of truth.

---

## Colony — the living instance

### `Colony`
- **`id`**, **`speciesId`** — identity and its Species.
- **`tileIds`** — the hex(es) it occupies (one tile, or a line for shelf toadstools).
- **`stage`** — a `ColonyStage`.
- **`myceliumUnits`**, **`atMRUOM`** — current mycelium count and whether it meets the
  Species' minimum.
- **`myceliumAgeDays`** — **cumulative** days of mycelium life (see D13 — the type comment
  saying "resets each cycle" is wrong; a ROMG cycle boundary is every `romgDays`, detected
  by modulo).
- **`maturityAgeDays`** — RTFM progress toward `rates.rtfmDays`; **resets to 0 on harvest**
  (D21).
- **`diagonalGrowthUnits`** — count of diagonal stem segments, for the −1-per-2 height
  penalty (Rulebook §4).
- **`harvestReady`**, **`alive`** — flags.
- **`damagedSinceDay?`** — campaign day an RTFM halt began, for the one-week auto-resume
  timer.

Everything on a Colony is expected to change over time; nothing here duplicates immutable
Species data except by reference (`speciesId`).

---

## The shell: Tiles

### `Tile`
One hex. `{ id, q, r, occupied, colonyId?, shade, edge, neighbors[] }`.

- **`q`, `r`** — axial hex coordinates.
- **`occupied` / `colonyId`** — whether and by whom the hex is held. A Tile does **not**
  store fungus data; it points at a Colony.
- **`shade`** — a shade level (numeric), computed from surrounding caps.
- **`edge`** — whether this hex is on the shell's rim (matters for mold/holed growths,
  Rulebook §8).
- **`neighbors`** — adjacent tile ids, precomputed for fast adjacency queries.

---

## Harvest inventory

### `HarvestedItem`
`{ id, speciesId, colonyId, prepMethod, harvestedDay, effect, expiresDay? }`. The `effect`
is copied from the Species' `FunctionTraits` at harvest time (so it survives even if the
Colony later dies). `expiresDay` comes from `time.ts` `PREP_METHOD_EXPIRY_DAYS` — save
1 hour, tea 24 hours, powder 1 week — converted to days (see D7 for the sub-day caveat).

### `HarvestInventory`
Four buckets: `spores`, `powders`, `teas`, `toxins` — each an array of `HarvestedItem`.
These map cleanly onto Foundry Items later.

---

## The event queue

Every change to the garden is recorded as a **`GardenEvent`**, not applied as an instant
silent mutation. This is what enables animation, replay, and debugging (a stated project
goal).

### `GardenEvent`
`{ day, type, source?, target?, description }`.

- **`type`** — a `GardenEventType`: `spread | grow | mature | breed | mutate | harvest |
  decay | collapse | shellDamage | ecosystemHalt | ecosystemResume`. These line up with
  the pipeline stages (see `04-Automation.md`). Note `mutate` exists here even though the
  mutation *mechanic* is unresolved (D14) — the event type is reserved regardless.
- **`source` / `target`** — colony/species/tile ids involved.
- **`description`** — human-readable log line.

---

## Garden — the root object

### `Garden`
One per tortle actor. `{ version, ownerId, campaignDay, randomSeed, tiles[], colonies[],
species[], inventory, events[], ecosystem }`.

- **`version`** — schema version for save migration; starts `"0.2.0"` (D22).
- **`ownerId`** — the actor id.
- **`campaignDay`** — the single unified clock (`time.ts`). Everything derives from this.
- **`randomSeed`** — stable per-Garden RNG seed; all randomness runs through it so a run
  replays identically.
- **`tiles`, `colonies`, `species`** — the live grid, instances, and active species list.
- **`inventory`** — the `HarvestInventory`.
- **`events`** — the append-only `GardenEvent` log.
- **`ecosystem`** — an `EcosystemStatus`.

### `EcosystemStatus`
`{ state, damagedSinceDay?, collapseRoll?, collapsedColonyIds[] }`. Holds the shell state
machine (Rulebook §1): the current `EcosystemState`, when damage began, the last d100
collapse roll, and which colonies have collapsed and await manual clearing.

---

## Species Registry — history that outlives the garden

The registry is **not** part of `Garden`. It is a permanent `SpeciesRegistryEntry[]` that
survives extinction (all colonies of a species dying). Its physical storage location is an
open question — see **D19**.

### `SpeciesRegistryEntry`
- **`species`** — the full immutable `Species` snapshot.
- **`lineage`** — `{ parents[], grandparents[] }`. Grandparents are **resolved once and
  cached** here so the UI can show ancestry without re-walking parent chains on every
  lookup.
- **`firstCultivatedDay`** — campaign day the species was first cultivated.
- **`currentLivingColonies`** — `0` when extinct; the entry is retained regardless. This is
  the recommended single source of truth for the living count (D19).

---

## Time (`time.ts`) — how the schema stays single-clocked

Not a stored type, but the schema depends on it. Constants: `DAYS_PER_WEEK = 7`,
`DAYS_PER_MONTH = 30`. Helpers: `toDays(value, unit)` (generation-time conversion),
`isDawn` (always true — every day is a dawn), `isWeekComplete(age, romgDays)` (ROMG cycle
boundary via modulo), `isMaturityReached(age, rtfmDays)`,
`plantGrowthAdvanceDays('action'|'eightHour')` → 30 or 365, `ECOSYSTEM_AUTO_RESUME_DAYS = 7`,
and `PREP_METHOD_EXPIRY_DAYS`. All stored durations are days; there is no other time unit
in persisted data.
