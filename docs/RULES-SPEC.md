# Fungal Garden — Rules Spec

Distilled from `Fungal_Garden_Thesis__Draft_.pdf` and `Fungal Breeding Matrix`. This is the
mechanical spec Claude Code should build against. It does not re-explain flavor text — it states
the rules as logic.

---

## 1. The Shell (Swampsworn Shellstump)

- Ogeez's shell is a hex grid. Each hex holds at most one unit of mycelium or one fungal growth.
- Fungi on the shell are immune to all damage types except bludgeoning, slashing, cold, fire.
- If Ogeez takes b/s/c/f damage from a failed save or while flanked → the ecosystem RTFM (see §3)
  halts for **1 week**. State = `damaged`.
- On a critical fail (or repeat b/s/c/f damage before RTFM resumes): roll D100. Any growth taller
  than the roll **collapses** (loses potency, unharvestable).
- A second such trigger after the first collapse → **all remaining growths collapse**. Collapsed
  growths must be manually cleared before ecosystem RTFM can resume.
- `Plant Growth` (1/day):
  - If ecosystem is `damaged` (halted, not yet collapsed): resets all RTFM cycles, restores
    `damaged` → `healthy`.
  - Otherwise (Growth Management use, §6): accelerates healthy growth — 1 action casting = 1
    month of progress (4 weeks of ROMG/RTFM/mycelium-movement, 28 days of hybrid spore
    accumulation); 8-hour casting = 1 year (52 weeks / 365 days).
  - Ecosystem also self-resumes from `damaged` → `healthy` after 1 week if left unharmed.
- Flavor detail: shell leaves a musky puddle after Ogeez's long rest (cosmetic, not mechanical).

State machine per ecosystem: `healthy → damaged (RTFM halted) → collapsing (D100 height check
applied) → collapsed (cleared) → healthy`.

---

## 2. Fungal Types

Roll D10 on colony creation:

| Roll | Type |
|---|---|
| 1–4 | Traditionally Shaped Toadstool |
| 5 | Shelf Toadstool |
| 6–8 | Mold |
| 9–10 | Mushroom |

Shape rules:
- **Traditionally Shaped Toadstool / Mushroom**: round volva base, stem grows straight up into a
  cap wider than the base.
- **Shelf Toadstool**: cap grows directly out of the shell as a horizontal semicircle. Base length
  = cap diameter. Height = cap radius. Cannot grow diagonally (see §6).
- **Mold**: grows straight up, uniform width base-to-top.

---

## 3. Maturation (RTFM)

RTFM = Rate To Full Maturation. Only fully matured growths (at optimum dimensions) provide
functional benefits. Harvesting a growth resets it — RTFM must run again before next harvest.

Initiation requirements before RTFM can begin:
- **Traditionally Shaped Toadstool / Mushroom**: mycelium must fill the full hex area of the
  fungus' optimum volva diameter.
- **Shelf Toadstool**: mycelium must fill a horizontal line of hexes as long as the optimum cap
  diameter.
- **Mold**: needs only 1 mycelium unit **and** shade (see below) to *begin* RTFM, but only counts
  as fully matured once it reaches MRUOM. Harvestable area = MRUOM.

Shade definition:
- Any hex directly beneath the cap of a mushroom/traditional toadstool that would otherwise be
  sun-exposed.
- For shelf toadstools: any growth shorter than the shelf toadstool's optimum cap height,
  adjacent to the shell-bottom-facing edge of the shelf toadstool, within its diameter.
- Transparent growths never provide shade (see §8).

---

## 4. Mycelium & Growth Management

- All fungi must maintain MRUOM (Minimum Required Units Of Mycelium) to survive; they don't need
  an active growth to stay alive.
- At the end of each ROMG (Rate Of Mycelium Growth) cycle, each mycelium unit duplicates into one
  adjacent empty hex (not already holding a growth). If fewer empty adjacent hexes exist than new
  units produced, excess dies — unless colony is already at/above MRUOM.
- ROMG for growth-bearing mycelium is suspended until that growth is removed; ROMG for
  non-bearing mycelium continues normally.
- If mycelium drops below MRUOM: it has exactly 1 ROMG cycle to recover to MRUOM or it dies
  completely.
- **Weekly**, any number of *unburdened* (non-growth-bearing) mycelium units may move 1 hex into
  an adjacent empty space. Moving into a hex with another mycelium type **consumes and replaces**
  it.
- Growth-bearing mycelium (directly beneath an active growth) is locked in place until harvest.
- Vertical growth: all growths start straight up from mycelium. After the first vertical unit,
  Mold, Mushroom, and Traditional Toadstool may angle diagonally in any direction as needed.
  **Shelf toadstools cannot grow diagonally.**
- Diagonal growth penalty: −1 final height per 2 units of diagonal stem growth. Shade
  requirements/provision remain based on the *intended* (non-penalized) height category.
- Identical hybrid colonies cultivated into adjacent hexes merge into a single colony
  immediately; the merged colony inherits the ROMG cycle position of the most recently cultivated
  one.

---

## 5. Dimensions & Rates (base generation formulas)

All values are dice rolls at generation time; ODOV = Optimum Diameter Of Volva (already rolled).

### Traditionally Shaped Toadstool
| Stat | Formula |
|---|---|
| Optimum Diameter of Volva | D8 hex units |
| Optimum Height of Stem | 8D4 units |
| Optimum Diameter of Cap | ODOV + D12 units |
| Optimum Height of Cap | 2D12 units |
| RTFM | D6 months |
| MRUOM | 2D4 hex units |
| ROMG | D8 weeks |

### Shelf Toadstool
| Stat | Formula |
|---|---|
| Optimum Diameter of Cap | 2D10 hex units |
| Optimum Height of Cap | Cap Diameter ÷ 2, rounded up |
| RTFM | D6 months |
| MRUOM | 3D4 hex units |
| ROMG | D8 weeks |

### Mold
| Stat | Formula |
|---|---|
| Optimum Height | D4 hex units |
| RTFM | D4 weeks |
| MRUOM | 5D4 hex units |
| ROMG | D4 weeks |

### Mushroom
| Stat | Formula |
|---|---|
| Optimum Diameter of Volva | D6 hex units |
| Optimum Height of Stem | 3D4 units |
| Optimum Diameter of Cap | ODOV + D8 units |
| Optimum Height of Cap | 4D4 units |
| RTFM | D6 months |
| MRUOM | 2D4 hex units |
| ROMG | D8 weeks |

Rounding notes carried from the breeding matrix sheet:
- Optimum Volva Diameter → round **down**
- Optimum Traditionally Shaped Cap Height → round **up**
- Optimum Traditionally Shaped Cap Radius → volva radius **added**, not independently rolled
- Optimum Shelf Toadstool Cap Height → round **up**
- Optimum Mold Growth Height → round **down**

---

## 6. Function

Mushrooms: **always edible**, no other function possible (hard rule, no exceptions on breeding —
see §9). One edible growth = 1 Goodberry effect, potency extended to 1 week. Eating an inedible
fungus (non-mushroom without edible trait) inflicts 1 poison damage even without an explicit
poison property.

Every fungus (regardless of edibility) rolls:
- **Odor** (D20): 1–3 Foul Stench, 4–9 Musky, 10–17 No Scent, 18–19 Lightly Sweet, 20 Smells
  Delectable.
- **Flavor** (D20): see full 20-entry table in `generation-tables.ts` (bitter-heavy 1–9 range,
  savory-heavy 11–19 range, no-flavor at 10, chocolatey at 20).
- **Flavor Intensity** (D6): 1 Very Faint → 6 Overpowering.

Toadstools & Mold roll D10 for function type:

| Roll | Toadstool | Mold |
|---|---|---|
| 1 | Poison | Poison |
| 2 | Healing | Healing |
| 3 | Poison | Poison |
| 4 | Healing | Spore Virility |
| 5 | Spore Virility | Poison |
| 6 | Spore Virility | Healing |
| 7 | Poison | Poison |
| 8 | Healing | Spore Virility |
| 9 | Poison | Poison |
| 10 | Healing | Healing |

### Spore Virility
Fully matured growth continuously produces D4 necrotic spores/minute. Feeds the "Halo Of Spores"
feature (min. 40/min at level 2, 60 at level 6, 80 at level 10, 100 at level 14). Mold: growth
must be fully mature to produce spores; exceeding MRUOM does not increase output per growth.

### Healing
Must be harvested and prepared correctly (Wisdom (Medicine) check, advantage if proficient in
herbalism). Harvesting resets RTFM. Full D100 (toadstool) and D20 (mold) tables with DCs and
prep-method (Tea/Save/Powder) are in `generation-tables.ts`. Effective windows: Saves within 1
hour, Teas within 24 hours, Powders within 1 week.

### Poison
Requires Intelligence (Nature) check to prepare correctly (advantage if proficient in
herbalism). Contact-poison variants require an Intelligence (Nature) check on **any** interaction
during RTFM or after plucking, to avoid being poisoned. Full D100 table (delivery method, DC,
special products like Truth Serum / Drow Poison / Oil of Taggit) in `generation-tables.ts`.

---

## 7. Appearance

Four independent D100 rolls per growth: Color, Pattern, Bioluminescence, Transparency (non-mold
only — mold is generally opaque per examples). Full tables in `generation-tables.ts`.

- Bioluminescent growths lose their magical property if touching any brown growth.
- Fully matured bioluminescent growth → 1 Magical Effect Spore (MES)/day (mold: 1 per growth
  regardless of size, same rule as spore virility).
- MES powers a reaction: enchant a creature entering/starting turn within 10 ft. 100-entry D100
  effect table (name, MES cost, 5e spell analog) lives in `mes-effects.ts`.
- Effect resolution: Constitution save vs. Ogeez's spell save DC; creatures that don't breathe or
  are poison-immune auto-succeed; repeatable end-of-turn save to end early (unless effect text
  says otherwise). Usable as many times/day as remaining MES; multiple growths with different MES
  types can be held at once but only matching-type spores fuel a given effect.
- **Transparency**: transparent mycelium may grow *on top of* opaque mold under 2 units tall.
  Transparent growths never provide shade.

---

## 8. Fungal Sensitivities / Variations (conditional rule triggers)

These are **conditions on top of** the base generation, not separately rolled — they trigger off
height, color, pattern, or edibility already determined. Encode each as a predicate + effect pair
so the engine can evaluate them at generation and at each maturation tick. Full list transcribed
into `sensitivities.ts`. Examples of the pattern:

- height > 35 units → cannot begin RTFM unless adjacent to a fully matured edible growth
- height > 50 units → requires 3 points of mycelium contact to begin RTFM
- toadstool height < 20 units → requires shade
- shelf toadstool height > 12 units → collapses without adjacent full-grown support at its
  shell-bottom edge
- height > 40 units → cannot have the healing function
- color/pattern combinations gate poison (e.g. white + ringed/striped = poisonous; indigo =
  poisonous; green + black pattern = poisonous; black-spotted shelf toadstool = poisonous)
- color/pattern combinations gate RTFM initiation contact requirements (e.g. black-patterned
  mushroom mycelium needs contact with white mycelium; red toadstool needs 2 points of contact
  with brown mycelium; violet/white/yellow toadstool needs 2+ separate mycelium colonies)
- brown fungi ignore all shade requirements
- mold/holed fungus cannot grow on the shell edge; ringed/striped cannot grow adjacent to spotted
- adjacency bonus: growth adjacent to 2 others of all differing patterns → +1 mycelium unit per
  ROMG cycle

---

## 9. Breeding

- **Once per dawn**: cross-pollinate any 2 fully matured growths on the shell → 1 hybrid spore.
- Resolution is a **coin flip per stat row** ("Heads"/"Tails") down the breeding matrix diagram —
  each individual stat (fungal type, RTFM, MRUOM, ROMG, color, pattern, bioluminescence,
  transparency, each dimension, function, sensitivity, flavor ×2, flavor intensity, odor) is
  independently assigned to one parent.
- Functions/sensitivities are **not** inherited as a package with their trigger condition —
  unless both parents show the *same* function/sensitivity, the inherited
  function/sensitivity is instead re-rolled at random from the pool of physical traits that could
  have caused either parent's version of it.
- Flavors and functions **may stack** from both parents; each is still independently rolled.
- **Hard exceptions**:
  - Mushrooms can never have a non-edible function (edibility is absolute).
  - Mold RTFM never crosses over to a non-mold breed.
  - Poison: if both parents are poisonous, effects don't stack — roll to determine which single
    poison effect is inherited.
  - Spore Virility: same tie-break-don't-stack rule as poison.
- After configuring hybrid stats, may cultivate on shell if space is available → becomes
  mycelium, begins its own ROMG.
- Only 1 *new* hybrid spore per dawn, but the same hybrid's stats may be **replicated** (spore
  cultivated again, unchanged) on each subsequent dawn until a new hybrid roll is made — at which
  point the old replicate stats are lost.
- Two or more identical hybrid spores cultivated into adjacent hexes → mycelium merges
  immediately into one colony (see §4 merge rule).

---

## 10. Data Model Notes for Implementation (v0.2 architecture)

**Species and Colony are separate objects.** A Species is the immutable genetic/definitional
record (traits, functions, sensitivities, lineage); a Colony is the mutable living instance
occupying tiles on the shell. Many Colonies may share one Species. This replaces an earlier draft
that conflated the two into a single `FungalColony` type — that version does not distinguish
"this hybrid's definition" from "this particular patch of it growing on hex B4," which breaks
down as soon as identical hybrids are cultivated in multiple places or a species goes extinct but
should still be remembered.

Nine core objects (see `types.ts` for full TS definitions):

```
Garden          — one per Tortle actor. version, ownerId, campaignDay, randomSeed,
                  tiles[], colonies[], species[], inventory, events[], ecosystem
Tile            — one hex. id, q, r, occupied, colonyId?, shade, edge, neighbors[]
Colony          — mutable instance. id, speciesId, tileIds[], stage (ColonyStage enum),
                  myceliumUnits, atMRUOM, myceliumAgeDays, maturityAgeDays,
                  diagonalGrowthUnits, harvestReady, alive, damagedSinceDay?
Species         — immutable. id (UUID), displayName, generation, parentSpeciesIds[],
                  physical (PhysicalTraits), function (FunctionTraits),
                  sensitivity (SensitivityTraits), statistics
PhysicalTraits  — fungalType, color, pattern, bioluminescent, transparent, dimensions, flavor
FunctionTraits  — category, healing?, poison?, sporeVirility?, magicalEffect?
SensitivityTraits — boolean flags + ruleIds[] pointing at composable SensitivityRule objects
HarvestInventory  — spores[], powders[], teas[], toxins[] (HarvestedItem records)
GardenEvent       — day, type, source?, target?, description (queued, not resolved instantly)
```

A tenth object, the **Species Registry**, is not part of `Garden` — it is a permanent historical
record (`SpeciesRegistryEntry[]`) that persists even after every Colony of a Species has died, so
extinction doesn't erase discovery. Each entry caches resolved grandparent lineage so the UI can
show ancestry without re-walking parent chains on every lookup.

**Time is unified.** Instead of separately tracking weekly ROMG, monthly RTFM, dawn-based
breeding, and spell-based acceleration, everything derives from `Garden.campaignDay`, a single
incrementing counter. See `time.ts`: weekly checks become `day % 7 === 0`, monthly maturation
becomes a flat 30-day timer, Plant Growth acceleration adds 30 or 365 days directly to the
relevant age counters. This is a deliberate simplification of the thesis's mixed-unit clocks and
should be treated as the source of truth going forward.

**Sensitivities are composable rule objects**, not scattered prose conditionals. Each
`SensitivityRule` (see `sensitivities.ts`) has a `trigger` (what must be true) and a
`restriction`/`effect` (what happens). The engine evaluates these generically against a Species'
traits and a Colony's live state (height, adjacency, mycelium contact) rather than hardcoding each
one as a bespoke conditional. This is what lets new species be added as pure data later.

**Breeding produces a new Species, not a "hybrid spore."** Once cultivated, a hybrid exists
permanently as a catalogued Species (see `breeding.ts`); replicating it on a later dawn creates a
new Colony of that same Species rather than re-rolling stats.

Grid: hex coordinate system for the shell (axial or offset — Foundry's canvas grid can back this
directly if the shell is represented as a scene, or it can be abstracted as a pure data grid with
a custom render).
