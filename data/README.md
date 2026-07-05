# Data Library

The JSON data library that backs the simulation. Everything a Species needs at runtime is
a **pure data lookup** against these files — no game rules are hardcoded in the engine.
Files are transcribed from `src/data/*.ts` (the original prepared source) and normalized
per the decisions in [`../docs/02-Design-Decisions.md`](../docs/02-Design-Decisions.md).

## Files

| File | Contents | Transcribed from |
|---|---|---|
| `colors.json` | Color d100 table + color groupings (primary / monochrome / brown) | `generation-tables.ts` COLOR_TABLE |
| `patterns.json` | Pattern d100 table + pattern family substring tags | `generation-tables.ts` PATTERN_TABLE |
| `types.json` | Fungal type d10 table, per-type dimension/rate formulas, shape rules, rounding, bioluminescence + transparency generation | `generation-tables.ts` FUNGAL_TYPE_TABLE / DIMENSION_FORMULAS / BIOLUMINESCENCE_TABLE / TRANSPARENCY_TABLE |
| `functions.json` | Function d10 tables, healing (toadstool d100 / mold d20), poison d100, spore virility, odor/flavor/intensity, MES roll table + effect descriptions, edible rules | `generation-tables.ts` (function/healing/poison, odor/flavor) + `mes-effects.ts` |
| `sensitivities.json` | All 33 sensitivity rules in the normalized predicate grammar | `sensitivities.ts` SENSITIVITY_RULES |
| `growth-rules.json` | Growth/maturation/mycelium/ecosystem mechanics + time constants | `RULES-SPEC.md` §1/§3/§4, `time.ts` |
| `breeding-rules.json` | Breeding stat rows, exceptions, and the function/sensitivity reverse cause-index | `breeding.ts` |

## Why these seven files

Appearance is split by trait: color and pattern get their own files because they are large
d100 tables with rich groupings that many sensitivities key off. The two small boolean
appearance tables (bioluminescence, transparency) live in `types.json` alongside type
generation rather than getting their own files. Odor, flavor, and flavor intensity live in
`functions.json` because `RULES-SPEC.md` §6 groups them under Function.

## Roll table format

Every dice table is an array of `{ "min", "max", "value" }` bands covering a die's range,
matching `RollTableEntry<T>` in `src/data/types.ts`. Look up a roll by finding the band
whose `[min,max]` contains it (`rollTableLookup`). Dice formulas elsewhere (e.g.
`"8d4"`, `"volvaDiameter + d12"`) are strings evaluated by the engine's seeded roller.

## Sensitivity predicate grammar

`sensitivities.json` carries a `grammar` block describing the trigger/effect vocabulary
(see decision **D10**). In short:

- **Species-static operands** evaluate from a Species alone: `fungalType`, `color`,
  `pattern`, `bioluminescent`, `transparent`, `heightUnits`, `edible`, `flavor`,
  `hasFunction`.
- **Colony/neighbor operands** need live state: `stage`, `myceliumContactPoints`,
  `adjacentDistinctPatternCount`, `adjacentToWhiteMycelium`, `edgeAdjacent`.
- **Comparators**: `{gt,gte,lt,lte,eq}`, `{in:[...]}`, `{notIn:[...]}`,
  `{includes:"..."}`, `{not: value}`. **Combinators**: `and`, `or`, `not`.
- Each rule has an **`appliesAt`** phase: `generation`, `rtfmInitiation`,
  `everyRomgCycle`, or `mature`.
- Array order matters for competing `forces*` effects; two rules
  (`greyNeverBioluminescent`, `tartAlwaysOverpowering`) carry `precedence: "absolute"`
  (D16).

## Applied decisions

These files bake in the recommended answers to the Phase 1 open questions:

- **D9** — `breeding-rules.json` includes a `reverseCauseIndex` mapping functions back to
  the physical traits that cause them (option 1, build the reverse index).
- **D11** — shelf cap diameter uses `2d10` from `types.json` (generation-tables governs);
  the conflicting breeding-sheet note is flagged in `breeding-rules.json`.
- **D5** — one month = 30 days throughout (`growth-rules.json` time block).

Weather/Nutrients/Mutation (D1/D14) and registry storage (D19) are engine/integration
concerns and do not appear in this data library; they are handled in Phases 3–4.

## `$schema` fields

Each file's `$schema` points at a `./schema/*.md` doc that does not exist yet — these are
placeholders naming the intended schema doc, to be filled in if formal JSON Schema
validation is added later. They are inert and safe to ignore for now.
