// Fungal Garden — core data model types (v0.2 architecture)
// Supersedes the v0.1 conflated FungalColony type. Species (immutable
// definition) is now separate from Colony (mutable living instance).
// See docs/RULES-SPEC.md for the underlying mechanics and
// docs/02-Design-Decisions.md for architecture rationale.

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type FungalType = 'toadstool' | 'shelfToadstool' | 'mold' | 'mushroom';

export type FunctionCategory = 'poison' | 'healing' | 'sporeVirility' | 'edible' | null;

export type PrepMethod = 'tea' | 'powder' | 'save' | 'contact' | 'inhaled' | 'ingested';

export type EcosystemState = 'healthy' | 'damaged' | 'collapsing' | 'collapsed';

export enum ColonyStage {
  SPORE = 'spore',
  MYCELIUM = 'mycelium',
  GROWING = 'growing',
  MATURE = 'mature',
  HARVESTED = 'harvested',
  DORMANT = 'dormant',
  DEAD = 'dead',
}

// A single roll table entry, generic over ranges (e.g. D100 1-9 -> "Bitter")
export interface RollTableEntry<T> {
  min: number;
  max: number;
  value: T;
}

export function rollTableLookup<T>(table: RollTableEntry<T>[], roll: number): T {
  const hit = table.find((e) => roll >= e.min && roll <= e.max);
  if (!hit) throw new Error(`No table entry covers roll ${roll}`);
  return hit.value;
}

// ---------------------------------------------------------------------------
// Species — immutable genetic/definitional record. Never changes after
// generation. Multiple Colonies may share one Species.
// ---------------------------------------------------------------------------

export interface Dimensions {
  volvaDiameter?: number; // toadstool/mushroom
  stemHeight?: number; // toadstool/mushroom
  capDiameter?: number; // all cap-bearing types
  capHeight?: number; // all cap-bearing types
  moldHeight?: number; // mold only
}

export interface Rates {
  rtfmDays: number; // unified to days; see time.ts for conversion from months/weeks
  mruom: number;
  romgDays: number; // unified to days
}

export interface PhysicalTraits {
  fungalType: FungalType;
  color: string;
  pattern: string;
  bioluminescent: boolean;
  transparent: boolean;
  dimensions: Dimensions;
  rates: Rates; // rtfmDays/mruom/romgDays; tied to PhysicalTraits per docs/03-Data-Schema.md loose-end note
  flavor: {
    flavor1: string;
    flavor2?: string; // hybrids may stack a second flavor
    intensity: number; // 1-6
    odor: string;
  };
}

export interface HealingProperty {
  effect: string; // e.g. "Heals 1D6 Hit Points" or "Cures Poisoned Condition"
  prepMethod: PrepMethod;
  dc: number;
}

export interface PoisonProperty {
  effect: string; // e.g. "Poisoned Condition for 1 Minute upon Contact" or "Makes Truth Serum"
  dc: number;
  requiresCheckOnAnyInteraction?: boolean; // contact-poison variants
}

export interface SporeVirilityProperty {
  sporesPerMinute: number; // D4 for toadstool/mushroom baseline; mold = 1 per growth
}

export interface MagicalEffectProperty {
  name: string; // key into mes-effects.ts MES_EFFECT_DESCRIPTIONS
  cost: number;
}

export interface FunctionTraits {
  category: FunctionCategory;
  healing?: HealingProperty;
  poison?: PoisonProperty;
  sporeVirility?: SporeVirilityProperty;
  magicalEffect?: MagicalEffectProperty; // only possible if bioluminescent and not touching brown
}

/**
 * Composable rule object. Replaces scattered prose like "black-spotted shelf
 * toadstools are poisonous" with data the engine evaluates generically.
 * `trigger` describes what must be true about the Species/Colony/neighbors
 * for `restriction` or `effect` to apply. See sensitivities.ts for the full
 * transcribed set and the trigger/effect field vocabulary.
 */
export interface SensitivityRule {
  id: string;
  trigger: Record<string, unknown>;
  restriction?: Record<string, unknown>;
  effect?: Record<string, unknown>;
}

export interface SensitivityTraits {
  requiresShade?: boolean;
  requiresWhiteNeighbor?: boolean;
  requiresEdibleNeighbor?: boolean;
  cannotTouchEdge?: boolean;
  requiresMultipleColonies?: boolean;
  supportRequirement?: boolean;
  ruleIds: string[]; // keys into sensitivities.ts SENSITIVITY_RULES for full rule objects
}

export interface SpeciesStatistics {
  livingColonies: number;
  harvestCount: number;
  createdDay: number; // campaign day, see time.ts
  createdBy?: string; // e.g. "Ogeez" or a player/character id
  extinctAt?: number; // campaign day all colonies died, if applicable; registry entry persists
}

export interface Species {
  id: string; // UUID, permanent
  displayName: string;
  generation: number; // 0 = wild-generated, 1+ = bred
  parentSpeciesIds: string[]; // immediate parents only; full lineage reconstructed via registry
  physical: PhysicalTraits;
  function: FunctionTraits;
  sensitivity: SensitivityTraits;
  statistics: SpeciesStatistics;
}

// ---------------------------------------------------------------------------
// Colony — mutable living instance of a Species. Tracks state, age, and
// occupied tiles. A Species may have zero, one, or many Colonies.
// ---------------------------------------------------------------------------

export interface Colony {
  id: string;
  speciesId: string;
  tileIds: string[]; // single tile, or a line of tiles for shelf toadstools
  stage: ColonyStage;
  myceliumUnits: number;
  atMRUOM: boolean;
  myceliumAgeDays: number; // days since last ROMG tick, resets each cycle
  maturityAgeDays: number; // days of RTFM progress accumulated toward rates.rtfmDays
  diagonalGrowthUnits: number; // count of diagonal stem segments (height penalty tracking)
  harvestReady: boolean;
  alive: boolean;
  damagedSinceDay?: number; // campaign day RTFM halt began (1-week auto-resume timer)
}

// ---------------------------------------------------------------------------
// Tile — one hex on the shell. Knows only its position, edge status,
// neighbors, shade, and current occupant. Does not store fungus data itself.
// ---------------------------------------------------------------------------

export interface Tile {
  id: string;
  q: number;
  r: number;
  occupied: boolean;
  colonyId?: string;
  shade: number;
  edge: boolean;
  neighbors: string[]; // tile ids
}

// ---------------------------------------------------------------------------
// Harvest Inventory — harvested product storage, groupable toward Foundry Items
// ---------------------------------------------------------------------------

export interface HarvestedItem {
  id: string;
  speciesId: string;
  colonyId: string;
  prepMethod: PrepMethod;
  harvestedDay: number;
  effect: string; // copied from the Species' FunctionTraits at harvest time
  expiresDay?: number; // save=1hr, tea=24hr, powder=1week converted to days, see time.ts
}

export interface HarvestInventory {
  spores: HarvestedItem[];
  powders: HarvestedItem[];
  teas: HarvestedItem[];
  toxins: HarvestedItem[];
}

// ---------------------------------------------------------------------------
// Event Queue — every garden change becomes a queued, resolved event.
// Enables animation, replay, and debugging.
// ---------------------------------------------------------------------------

export type GardenEventType =
  | 'spread'
  | 'grow'
  | 'mature'
  | 'breed'
  | 'mutate'
  | 'harvest'
  | 'decay'
  | 'collapse'
  | 'shellDamage'
  | 'ecosystemHalt'
  | 'ecosystemResume';

export interface GardenEvent {
  day: number;
  type: GardenEventType;
  source?: string; // colonyId or speciesId that initiated the event
  target?: string; // colonyId or tileId affected
  description: string;
}

// ---------------------------------------------------------------------------
// Garden — one per Tortle actor. Root object.
// ---------------------------------------------------------------------------

export interface Garden {
  version: string; // schema version, e.g. "0.1.0" — see save versioning notes
  ownerId: string; // actor id
  campaignDay: number; // unified clock, see time.ts
  randomSeed: number; // stable RNG seed for replay/debugging
  tiles: Tile[];
  colonies: Colony[];
  species: Species[]; // active species registry (see SpeciesRegistryEntry for full history)
  inventory: HarvestInventory;
  events: GardenEvent[];
  ecosystem: EcosystemStatus;
}

export interface EcosystemStatus {
  state: EcosystemState;
  damagedSinceDay?: number;
  collapseRoll?: number; // D100 result once rolled, height threshold for collapse
  collapsedColonyIds: string[];
}

// ---------------------------------------------------------------------------
// Species Registry — permanent historical record, independent of the Garden's
// active species list. Survives extinction (all colonies of a species dying).
// ---------------------------------------------------------------------------

export interface SpeciesRegistryEntry {
  species: Species;
  lineage: {
    parents: string[]; // immediate parent species ids
    grandparents: string[]; // resolved once, cached for display
  };
  firstCultivatedDay: number;
  currentLivingColonies: number; // 0 if extinct; entry is retained regardless
}
