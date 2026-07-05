# Fungal Garden — Design Decisions

Every ambiguity found while reading `RULES-SPEC.md` and the six data files
(`types.ts`, `generation-tables.ts`, `sensitivities.ts`, `mes-effects.ts`,
`breeding.ts`, `time.ts`) is recorded here. Each entry states the **question**, a
**resolution**, and the **rationale**. Resolutions are the intended behavior unless the
owner overrides them.

Entries are tagged:

- **[RESOLVED]** — a defensible answer follows from the spec, the data, or a clear
  reading of the thesis. Documented so it isn't silently re-decided later.
- **[OPEN — needs owner input]** — the source material genuinely does not answer this,
  and any answer would be new game/architecture design. These are **not** resolved here;
  they are surfaced to the owner before the phase that depends on them.

The **[OPEN]** items are collected at the top so they can't be missed.

---

## Open questions blocking later phases

These are listed first because they must be answered before Phase 2 (data library) or
Phase 3 (engine). Details are in the numbered sections below.

| # | Question | Blocks |
|---|---|---|
| D1 | The pipeline names **Weather**, **Nutrients**, and **Mutation** stages. None exist in the thesis or RULES-SPEC. What are their rules — or are they no-ops? | Phase 3 |
| D14 | Does **Mutation** happen at all, and if so before or after Breeding? The pipeline orders it after Breeding, but no mutation mechanic exists in the source. | Phase 3 |
| D9 | The breeding "re-roll function/sensitivity from the physical traits that could have caused either parent's version" needs a **trait → cause reverse index** that no data file currently provides. | Phase 2/3 |
| D19 | Where does the **Species Registry** physically live — per-actor with the Garden, or world-global? It must outlive any single Garden and survive extinction. | Phase 4 |
| D11 | `shelfCapDiameter` derivation conflicts between `RULES-SPEC` (§5) and `breeding.ts` (a stat-row comment). Which governs? | Phase 2/3 |

---

## Ecosystem and the shell

### D2 — Two colonies spread into the same empty hex on the same tick [RESOLVED]
*(the owner's named example)*

**Question.** §4 says each mycelium unit duplicates into an adjacent empty hex each
cycle. If two different colonies both have that empty hex as their only/chosen target on
the same tick, who gets it?

**Resolution.** Deterministic order by colony seniority: the colony with the **lower
`createdDay`** (ties broken by the lexicographically smaller colony `id`) claims the hex;
the other's surplus unit dies that tick unless it has another empty neighbor, in which
case it spreads there instead. The whole resolution is driven by the Garden's stable
random seed so it replays identically.

**Rationale.** The spec gives no priority rule, but the engine requires a total order to
be deterministic (a stated project goal — "Deterministic: every simulation can be
reproduced"). Seniority + id is stable, seed-independent for the tiebreak, and easy to
explain. Note the *replacement* rule (moving into another mycelium type consumes it)
applies only to the **weekly move**, not to spreading — spreading only ever targets
**empty** hexes, so two spreads never "fight" over an occupied hex, only an empty one.

### D3 — Simultaneous weekly moves into the same hex [RESOLVED]

**Question.** The weekly move lets unburdened mycelium move into an adjacent empty hex,
and moving into another mycelium type consumes it. If two units target the same hex, or
A moves into B's hex while B moves into A's, what happens?

**Resolution.** Weekly moves resolve in the same seniority order as D2, one unit at a
time, re-checking occupancy before each move. A unit that finds its target no longer
empty (and not a consumable other-type) forfeits its move that week. No swaps: if A
moves into B's hex, B is consumed before B gets to act.

**Rationale.** One-at-a-time resolution with a fixed order is the only way to keep the
"consume and replace" rule deterministic. Consistent with D2.

### D4 — Collapse height check: which height? [RESOLVED]

**Question.** §1 collapse rolls a d100; "any growth taller than the roll collapses." Is
"taller" the intended optimum height or the diagonal-penalized actual height?

**Resolution.** Use the **actual (penalized) current height** of the growth at collapse
time. A growth that is still maturing uses its current height, not its optimum.

**Rationale.** Collapse is a physical event ("too tall, it topples"), so the physical
height is what matters — unlike shade, which the spec explicitly ties to *intended*
height (§4). Kept distinct from D6 on purpose.

### D5 — "Month" = 30 days vs. "4 weeks" = 28 days [RESOLVED, inconsistency noted]

**Question.** `time.ts` sets `DAYS_PER_MONTH = 30` and `plantGrowthAdvanceDays('action')`
returns 30. But `RULES-SPEC` §1 describes a 1-action Plant Growth as "4 weeks of
ROMG/RTFM/mycelium-movement, 28 days of hybrid spore accumulation." 4 weeks = 28 days ≠
30.

**Resolution.** `time.ts` is the source of truth (per §10: "the unified clock should be
treated as the source of truth going forward"). **One month = 30 days everywhere**,
including Plant Growth acceleration and RTFM month conversion. The §1 parenthetical (28
days) is a thesis-era artifact and is superseded.

**Rationale.** §10 explicitly declares the unified clock authoritative and calls the
mixed-unit thesis clocks a "deliberate simplification." Picking 30 uniformly removes the
only place where "month" and "4 weeks" would diverge.

### D6 — Which "height" do sensitivity thresholds use? [RESOLVED]

**Question.** `sensitivities.ts` triggers on `heightUnits` (e.g. `> 35`, `< 20`). Is that
the optimum height, the intended height, or the penalized actual height? And for a
multi-part growth (stem + cap), is "height" the total or a component?

**Resolution.** `heightUnits` means the growth's **intended total optimum height** — for
toadstools/mushrooms, `stemHeight + capHeight`; for shelf toadstools, `capHeight`; for
mold, `moldHeight`. It uses the **intended** value (before diagonal penalty), consistent
with how the spec treats shade. It does **not** change as the growth matures — a
sensitivity is a property of the species, evaluated from its definition.

**Rationale.** Sensitivities are described in §8 as conditions that "trigger off height,
color, pattern... already determined" — i.e. determined at generation, from the species,
not from live partial-growth state. Tying them to the immutable intended optimum keeps
them a pure Species-level data lookup (§10's stated goal). The one exception is
`shelfCollapseUnsupported`, which is explicitly `stage: 'mature'` and is a Colony-state
rule — see D8.

### D7 — Save-prep items and the whole-day clock [RESOLVED, limitation noted]

**Question.** `PREP_METHOD_EXPIRY_DAYS.save = 1/24` (one hour), but the campaign clock is
integer days. A one-hour window can't be a whole number of days.

**Resolution.** Store the fractional `expiresDay` as written (`harvestedDay + 1/24`).
Because the garden only advances a full day at a time, **any save-prep item is expired by
the next day advance** — effectively "usable only on the day it was prepared, within the
fiction's one-hour window that the GM adjudicates in real scene time." The module does
not simulate sub-day time; the one-hour limit is a table-adjudicated fact, and the clock
just guarantees the item is gone by the next tick.

**Rationale.** The unified clock (§10) intentionally discards sub-day resolution.
Preserving the fractional number keeps the data honest for a future finer clock without
pretending the engine tracks hours.

---

## Growth, maturation, and mycelium

### D8 — `shelfCollapseUnsupported` uses an un-parseable prose condition [RESOLVED]

**Question.** In `sensitivities.ts`, `shelfCollapseUnsupported` has
`effect.collapseCondition: 'no adjacent fully matured growth at shell-bottom-facing edge'`
— a free-text string, not something the engine can evaluate, despite sensitivities being
"composable rule objects."

**Resolution.** Treat this string as a **placeholder for a structured predicate** to be
authored in Phase 2's `sensitivities.json`. The structured form: *at maturity, if no
tile adjacent to the shelf toadstool's shell-facing edge holds a fully matured growth,
the colony collapses.* The Phase 2 conversion must replace every prose `collapseCondition`
and `effect.unless`/`restriction` string with structured operands (see D10).

**Rationale.** §10 says sensitivities must be engine-evaluable data, "not scattered
prose." A prose string inside the effect object contradicts that and must be normalized
during the JSON conversion.

### D9 — Breeding function/sensitivity re-roll needs a reverse cause index [OPEN — needs owner input]

**Question.** `breeding.ts`
`functionSensitivityInheritedAsRerollUnlessMatching` and §9 both say: when parents differ
on a function/sensitivity, the hybrid **re-rolls it from "the set of physical traits that
could have originally caused either parent's version."** No data file maps a
function/sensitivity **back** to the physical traits that cause it. `sensitivities.ts`
maps trait → effect (forward); there is no effect → trait index, and functions come from
d10 rolls unrelated to appearance.

**Options.**
1. **Build a reverse index** as new Phase 2 data (e.g. `poisonous` ← {white+ringed,
   indigo, green+black-pattern, black-spotted-shelf, ...}), then re-roll uniformly among
   the union of both parents' causal trait sets and re-derive the function.
2. **Simplify:** re-roll the function/sensitivity from its *original generation table*
   (e.g. re-roll the d10 function table for the hybrid's resolved type), ignoring the
   "causal traits" clause. Loses fidelity to the thesis wording but needs no new index.
3. **Coin-flip anyway** (pick one parent's version outright), treating the re-roll clause
   as flavor.

**Why open.** This is a genuine design fork with real fidelity/complexity trade-offs, and
option 1 requires authoring a data artifact the source doesn't contain. Recommending
**option 1** for fidelity, but not proceeding without confirmation.

### D10 — The SensitivityRule trigger/effect grammar is undocumented and inconsistent [RESOLVED]

**Question.** `SensitivityRule.trigger/restriction/effect` are typed `Record<string,
unknown>`. The header comment lists a vocabulary, but the actual rules use many operators
and keys not in it: `patternIncludes`, `colorIn`, `colorNotIn`, `myceliumContactPoints`,
`adjacentDistinctPatternCount`, `adjacentToWhiteMycelium`, `stage`, comparison objects
(`{gt}`, `{lt}`, `{gte}`), boolean combinators (`or`, `not`), and effect keys like
`forcesRtfmInitiation`, `overridesAllShadeRules`, `requiresBrownOrMonochromeContact`,
`minMyceliumContactPoints`, `appliesTo`, `appliesAt`. The vocabulary and the data have
drifted.

**Resolution.** Phase 2 defines a **formal predicate grammar** for `sensitivities.json`
and normalizes all 33 rules to it. The grammar has three field classes:

- **Species-static operands** (evaluable from a Species alone): `fungalType`, `color`,
  `pattern`, `bioluminescent`, `transparent`, `heightUnits`, `edible`, `flavor`,
  `hasFunction`. Supports comparison objects `{gt,gte,lt,lte,eq}`, membership
  `{in:[...]}`/`{notIn:[...]}`, substring `{includes:'...'}`, and `{not: value}`.
- **Colony/neighbor operands** (need live state): `stage`, `myceliumContactPoints`,
  `adjacentDistinctPatternCount`, `adjacentToWhiteMycelium`, `edgeAdjacent`.
- **Combinators:** `or`, `and`, `not` over sub-triggers.

Effects/restrictions become a closed enum of typed actions (`forcesPoisonous`,
`forcesEdible`, `forcesOdor`, `forcesFlavor`, `forcesFlavorIntensity`,
`forcesBioluminescence`, `requiresShade`, `requiresShade:false`+`overridesAllShadeRules`,
`requiresEdibleNeighbor`, `requiresWhiteNeighbor`, `requiresBrownContact(n)`,
`requiresNonBrownContact(n)`, `requiresSeparateColonies(n)`, `cannotTouchEdge`,
`cannotTouchPattern`, `cannotTouchColor`, `cannotTouchFungalType`, `canMature`,
`canHaveFunction[]`, `collapseCondition`(structured), `heightPenalty`, `myceliumBonus`,
`appliesAt`, `unless`). Each carries an `appliesAt` phase tag: `generation`,
`rtfmInitiation`, `everyRomgCycle`, or `mature`.

**Rationale.** §10 requires generic evaluation. Freezing the grammar now (rather than
letting each rule invent keys) is what makes "new species = pure data" true later. This
normalization is bookkeeping, not new game design, so it is resolved rather than opened.

### D11 — `shelfCapDiameter` derivation conflict [OPEN — needs owner input]

**Question.** `RULES-SPEC` §5 and `generation-tables.ts` say a shelf toadstool's cap
height = cap diameter ÷ 2 (round up), with cap diameter rolled as `2D10`. But
`breeding.ts` `BREEDING_STAT_ROWS` comments say `shelfCapDiameter` is "half of
traditional cap radius, per original sheet note" and lists `traditionalCapRadius` as
"+ optimum radius of volva." These two describe different geometry, and the
`Dimensions` type stores only diameters/heights (no radius field).

**Options.**
1. **Generation-tables governs:** shelf cap diameter = `2D10`; ignore the breeding-sheet
   "half of traditional cap radius" note as a stale spreadsheet cross-reference.
2. **Breeding-sheet governs** for *bred* shelf toadstools only: a hybrid shelf's cap
   diameter derives from the traditional-toadstool parent's cap radius.

**Why open.** The two sources genuinely disagree and this changes hybrid dimensions.
Recommending **option 1** (generation-tables is the cleaner, self-consistent rule and
§5 is authoritative for dimensions), but flagging because a spreadsheet note explicitly
says otherwise and the owner may know the original intent.

### D12 — Merged colony mycelium count [RESOLVED]

**Question.** §4 and `breeding.ts` say identical/same-species adjacent colonies merge,
adopting the most-recent one's ROMG cycle position. Neither says how the merged mycelium
**count** combines.

**Resolution.** The merged colony's `myceliumUnits` = **sum** of the merged colonies'
units, and its `tileIds` = union. `atMRUOM` is recomputed against the (unchanged, from the
shared Species) minimum. `myceliumAgeDays` is taken from the most recently cultivated
colony (per the explicit ROMG-position rule); `maturityAgeDays` takes the **maximum** of
the merged colonies (the more-matured growth is not set back).

**Rationale.** Summing units is the only reading consistent with "merge into a single
colony" — the biomass doesn't vanish. Taking max maturity avoids a merge griefing a
nearly-mature growth. The ROMG position is spelled out by the spec; maturity is the one
gap, resolved conservatively.

### D13 — `Colony.myceliumAgeDays`: cumulative or reset each cycle? [RESOLVED]

**Question.** The `types.ts` comment says `myceliumAgeDays` "resets each cycle," but
`time.ts isWeekComplete` checks `myceliumAgeDays % romgDays === 0`, which only makes sense
if the value is **cumulative** (a reset value would just be compared with `=== romgDays`).

**Resolution.** `myceliumAgeDays` is **cumulative** — it counts days since the colony
began, never reset. A ROMG cycle completes whenever `myceliumAgeDays > 0 &&
myceliumAgeDays % romgDays === 0`, exactly as `isWeekComplete` implements. The type
comment is corrected to "cumulative days of mycelium life; cycle boundary is every
`romgDays`." `maturityAgeDays` stays as-is (accumulates toward `rtfmDays`, reset on
harvest).

**Rationale.** The function is the concrete implementation and the modulo only works for a
cumulative counter. Fixing the comment is cheaper and safer than rewriting the time
helper.

---

## Function, appearance, and ordering

### D14 — Does Mutation exist, and when? [OPEN — needs owner input]
*(the owner's named example)*

**Question.** The pipeline includes a **Mutation** stage after Breeding. The thesis and
RULES-SPEC contain **no spontaneous-mutation mechanic** — the only genetic change is
deliberate breeding. The example question "does mutation happen before or after breeding"
presupposes a mechanic that the source doesn't define.

**Options.**
1. **No mutation.** The stage is a reserved no-op hook for future content; the engine runs
   it but it does nothing until rules exist.
2. **Define mutation now** (new design): e.g. a low per-day chance that a maturing colony
   re-rolls one appearance/sensitivity trait, creating a new one-off Species. Needs rates,
   trigger, and whether it produces a registry entry.

**If it exists, ordering:** after Breeding (as the pipeline lists) so a freshly bred
hybrid isn't mutated the same tick it's created; Decay then removes anything the mutation
killed.

**Why open.** Adding a mutation mechanic is net-new game design with no source basis.
Recommending **option 1 (no-op hook)** to stay faithful to the thesis, but not inventing
rules without the owner. The pipeline stage stays in the architecture either way.

### D15 — Poison special-products override appearance: roll ordering [RESOLVED]

**Question.** `POISON_TABLE` entries force appearance/rate after the fact — "Assassin's
Blood (automatically red)", "Pale Tincture (automatically white)", "Essence of Ether
(automatically transparent)", "Midnight Tears (automatically 3-month ROMG)". Appearance
(color/transparency) and ROMG are rolled independently in §5/§7. Which wins?

**Resolution.** Generation order is: (1) type, dimensions, rates; (2) appearance
(color/pattern/luminescence/transparency); (3) function (odor/flavor/intensity, then
poison/healing/spore-virility). A poison special product that specifies an appearance or
rate **overwrites** the earlier roll for that field (red / white / transparent / 3-month
ROMG). Sensitivity `forces*` effects (D16) are applied **after** poison overrides.

**Rationale.** The poison entries say "automatically," i.e. they are deterministic
overrides, and they can only be known after the function roll — so function must resolve
last and win over the earlier independent rolls. This also gives a single, well-defined
place for the Phase 3 generator to apply overrides.

### D16 — Order of competing `forces*` sensitivities [RESOLVED]

**Question.** Multiple sensitivities can force the same field (e.g. several force odor;
`tartAlwaysOverpowering` and `violetMushroomSavory` both touch flavor/intensity;
`greyNeverBioluminescent` vs. a bioluminescence roll). What order, and who wins ties?

**Resolution.** Sensitivity `forces*` effects apply in **rule declaration order** (array
order in `sensitivities.json`), each overwriting the field. Two hard precedence rules on
top: **`forcesBioluminescence:false` (grey) always wins** over any luminescence roll or
other force; **`tartAlwaysOverpowering` always wins** over any other flavor-intensity
force. These two are called out because the thesis states them as absolutes
("always", "never").

**Rationale.** Declaration order gives determinism for the common case; the two absolute
rules are elevated because the source uses absolute language. Documented so the JSON
author preserves the intended array order rather than sorting alphabetically.

### D17 — `ringedBoostsGrowth` / `forcesRtfmInitiation` meaning [RESOLVED]

**Question.** `ringedBoostsGrowth` triggers on `patternIncludes:'Ringed'` +
`myceliumContactPoints > 3` with `effect.forcesRtfmInitiation:true`. §8's prose doesn't
describe this rule, and "forces RTFM initiation" is undefined.

**Resolution.** `forcesRtfmInitiation:true` means: **the colony's normal
initiation-contact requirements are treated as satisfied** — a ringed growth with more
than 3 mycelium contact points may **begin maturing immediately** regardless of other
`rtfmInitiation`-phase restrictions on it. It does not skip the dimensional
fill-the-volva requirement (§3), only the contact/neighbor gates.

**Rationale.** It's the natural dual of the many `appliesAt:'rtfmInitiation'` *restriction*
rules — this is the one that *removes* a gate rather than adding one. Scoping it to the
contact gates (not the physical volva-fill) keeps it from trivializing maturation.

### D18 — Bioluminescence is only 4% (multiples of 25) [RESOLVED, noted]

**Question.** `BIOLUMINESCENCE_TABLE` marks only exact 25/50/75/100 as luminescent — a 4%
chance — and the comment admits this "normalized" four thesis sub-bands into one table.

**Resolution.** Keep the table exactly as given (4% luminescent). It is faithful to the
transcribed normalization and is a deliberate rarity, not a bug.

**Rationale.** The comment documents the transformation and the owner prepared it this
way; changing the odds would be a design change, not a fix. Flagged only so no one
"corrects" it later thinking it's a typo.

---

## Data model and registry

### D19 — Where does the Species Registry live? [OPEN — needs owner input]

**Question.** `types.ts` says the `SpeciesRegistryEntry[]` registry is "not part of
`Garden`... a permanent historical record" that survives extinction, but the Phase 4
constraint says "Garden data lives on the actor... No separate journal-based storage."
`Garden.species` (active) and `SpeciesRegistryEntry` (historical) also duplicate a living
count (`Species.statistics.livingColonies` vs. `currentLivingColonies`).

**Options.**
1. **Registry on the actor**, alongside the Garden (e.g. a sibling flag), scoped to that
   one tortle. Simple; but a species discovered by one tortle isn't visible to another.
2. **Registry world-global** (a world-level setting/collection). Matches "permanent
   historical record" and cross-character discovery, but is "separate storage," which the
   Phase 4 constraint discourages.

**And:** pick a single source of truth for living-colony count (recommend
`currentLivingColonies` on the registry entry, with `Species.statistics.livingColonies`
either dropped or documented as a cache).

**Why open.** This is an architecture decision the spec pulls in two directions on. Not
picking silently per the owner's standing instruction. Recommending **option 1** (on the
actor) to honor the Phase-4 "no separate storage" rule, treating "permanent" as
"permanent within this character's garden."

### D20 — Type-specific breeding stat rows for the wrong type [RESOLVED]

**Question.** `BREEDING_STAT_ROWS` lists every dimension row (`volvaDiameter`,
`stemHeight`, `traditionalCapHeight`, `shelfCapRadius`, `moldGrowthHeight`, ...) but a
given hybrid resolves to **one** `fungalType`. Coin-flipping a `moldGrowthHeight` for a
mushroom offspring is meaningless.

**Resolution.** Resolve `fungalType` first (row 1). Then, for each dimension/rate row,
**only apply rows relevant to the resolved type**; irrelevant rows are skipped. If the
coin flip would inherit a dimension from a parent of a *different* type than the resolved
offspring (so the parent has no value for the offspring's needed dimension), **re-roll
that dimension from the resolved type's own base formula** (`DIMENSION_FORMULAS`) — the
same "no crossover" logic the spec already mandates for mold RTFM
(`moldRtfmNoCrossover`).

**Rationale.** Generalizes the one crossover exception the data already states into the
obvious consistent rule for all type-specific dimensions, rather than producing
nonsensical cross-type dimensions. Row 1 must resolve first for this to work; the row
order in `breeding.ts` already puts `fungalType` first.

### D21 — Harvested mushroom regrowth timing [RESOLVED]
*(the owner's named example)*

**Question.** Can a harvested mushroom (or any growth) regrow immediately?

**Resolution.** **No.** Harvest resets maturation (§3): the mycelium survives, but the
growth must run its full `rtfmDays` again before it can be harvested a second time. There
is no immediate regrowth and no partial credit — `maturityAgeDays` resets to 0 at harvest.
The colony's `stage` returns to `GROWING` (or `MYCELIUM` if the growth itself is removed),
not `MATURE`.

**Rationale.** §3 states harvesting resets RTFM plainly; "immediately" would contradict
the maturation model and make rates meaningless.

### D22 — `Garden.version` starting value and bump policy [RESOLVED]

**Question.** `types.ts` comments show `version` examples of both "0.1.0" and, in prose,
"0.2 architecture." What value ships, and when does it bump?

**Resolution.** The Garden schema `version` starts at **"0.2.0"** (matching the v0.2
architecture these types encode). It bumps whenever a stored-shape change would break
loading an older Garden; a migration keyed on this field runs at load (Phase 4). This is
the **data schema** version, independent of `module.json`'s module version.

**Rationale.** The types are explicitly "v0.2 architecture," so the persisted schema
should say 0.2.0, not 0.1.0. Separating it from the module version prevents cosmetic
module releases from forcing garden migrations.

---

## Minor notes carried forward (no decision needed)

- **Color weighting.** Brown occupies ~40% of the d100 color table across many bands; this
  is intentional (brown has special shade-ignoring behavior and is the "common" color).
- **`isDawn` always true.** By design every `campaignDay` increment is one dawn, so "once
  per dawn" == "once per day." Not an ambiguity, just a modeling choice to remember.
- **`Dimensions` has no radius field.** Radii referenced in breeding rows are derived
  on the fly (diameter ÷ 2); nothing is stored. See D11 for the one place this bites.
- **MES effects hard-code "Ogeez."** The 100 effect descriptions name the caster "Ogeez";
  in the module this is the owning actor. Text is display-only.
