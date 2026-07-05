// Breeding / Crossbreeding — v0.2 architecture.
// The thesis generates a "hybrid spore." This engine generates a new Species
// record instead: immutable, permanently catalogued in the Species Registry,
// with full lineage (parents + resolved grandparents). See
// docs/RULES-SPEC.md §9 for the narrative rules this encodes.

export type CoinResult = 'heads' | 'tails';

// The full ordered list of stat rows the breeding matrix resolves one at a
// time, each independently assigned to one parent via a coin flip. Order
// matches the original spreadsheet's top-down resolution list. These map
// onto fields of Species.physical / Species.function / Species.sensitivity.
export const BREEDING_STAT_ROWS = [
  'fungalType',
  'rtfmDays',
  'mruom',
  'romgDays',
  'color',
  'pattern',
  'bioluminescent',
  'transparent',
  'volvaDiameter',
  'stemHeight',
  'traditionalCapHeight',
  'traditionalCapRadius', // derived: + optimum radius of volva, per the resolved parent's volva
  'shelfCapRadius',
  'shelfCapDiameter', // derived: half of traditional cap radius, per original sheet note
  'moldGrowthHeight',
  'function1',
  'function2', // additional functions, if any
  'sensitivity1',
  'sensitivity2', // additional sensitivities, if any
  'flavor1',
  'flavor2',
  'flavorIntensity',
  'odor',
] as const;

export type BreedingStatRow = (typeof BREEDING_STAT_ROWS)[number];

/**
 * Hard exceptions to plain coin-flip inheritance, per the thesis text.
 * The breeding engine checks these BEFORE falling back to a coin flip on the
 * relevant row.
 */
export const BREEDING_EXCEPTIONS = {
  /** Mushrooms can never carry a non-edible function, regardless of what a
   * coin flip would otherwise assign from a poison/healing/sporeVirility
   * parent. */
  mushroomAlwaysEdible: (resolvedFungalType: string) => resolvedFungalType === 'mushroom',

  /** Mold's RTFM formula never crosses into a non-mold offspring and vice
   * versa. If the coin flip would assign a mold parent's rtfmDays to a
   * non-mold result (or the reverse), re-roll RTFM from the resolved
   * fungalType's own base formula (see generation-tables.ts
   * DIMENSION_FORMULAS) instead of inheriting it. */
  moldRtfmNoCrossover: true,

  /** If BOTH parents have the poison function: don't stack. Coin-flip which
   * single parent's poison effect is inherited. */
  poisonTieBreakNotStack: true,

  /** Same non-stacking tie-break rule as poison, but for spore virility. */
  sporeVirilityTieBreakNotStack: true,

  /** Functions and sensitivities are NOT inherited as a package with their
   * triggering condition. If both parents display the SAME function or
   * sensitivity, it carries over directly. If they differ (or only one
   * parent has it), the offspring's function/sensitivity is instead
   * re-rolled at random from the set of physical traits (color/pattern/
   * height/etc.) that could have originally caused either parent's version
   * of that function/sensitivity. */
  functionSensitivityInheritedAsRerollUnlessMatching: true,

  /** Flavors and functions may each stack from both parents (independently
   * rolled per row) — the default case, listed for completeness against the
   * non-stacking exceptions above. */
  flavorsAndFunctionsMayStack: true,
} as const;

export interface BreedingResolution {
  parentSpeciesIdA: string;
  parentSpeciesIdB: string;
  resolution: Record<BreedingStatRow, CoinResult>;
}

/**
 * Produces the immutable Species record a successful breeding creates.
 * `generation` = max(parentA.generation, parentB.generation) + 1.
 * `parentSpeciesIds` stores immediate parents only; grandparents are
 * resolved once and cached on the SpeciesRegistryEntry.lineage.grandparents
 * field (types.ts), not re-walked on every lookup.
 */
export interface NewSpeciesFromBreeding {
  generation: number;
  parentSpeciesIds: [string, string];
  // resultingTraits populated by applying `resolution` + BREEDING_EXCEPTIONS
  // against the two parent Species records, then constructing
  // PhysicalTraits / FunctionTraits / SensitivityTraits for the new Species.
  resultingTraits: {
    physical: Record<string, unknown>;
    function: Record<string, unknown>;
    sensitivity: Record<string, unknown>;
  };
}

/**
 * Cultivation notes (post-generation, not stat resolution):
 * - Once per dawn (== once per campaignDay increment, see time.ts isDawn):
 *   generate ONE new hybrid Species from two fully matured Colonies.
 * - The same hybrid's resolved traits may be REPLICATED — cultivated again
 *   as a new Colony of the SAME Species — on each subsequent dawn, until a
 *   new hybrid roll is made. A replicate is a new Colony, not a new Species;
 *   it does not re-trigger Species generation or registry entry creation.
 * - Cultivating a spore requires an available empty Tile; the tile becomes
 *   occupied, gets a new Colony at ColonyStage.MYCELIUM, and begins its own
 *   ROMG cycle.
 * - Two or more Colonies OF THE SAME SPECIES cultivated into ADJACENT tiles
 *   merge immediately into a single Colony. The merged Colony adopts the
 *   myceliumAgeDays of whichever Colony was cultivated most recently.
 * - On first successful breeding of a never-before-seen trait combination,
 *   create a SpeciesRegistryEntry (types.ts) with firstCultivatedDay =
 *   current campaignDay and currentLivingColonies = 1. If all Colonies of a
 *   Species later die, the registry entry persists with
 *   currentLivingColonies = 0 — the species is "extinct" but not forgotten.
 */
