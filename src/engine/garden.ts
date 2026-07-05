// Garden factory + colony cultivation helpers. Pure data operations; no Foundry.

import {
  ColonyStage,
  type Colony,
  type Garden,
  type Species,
  type SpeciesRegistryEntry,
  type Tile,
} from '../data/types';
import { buildShell, indexTiles } from './hex';
import { SeededRng } from './rng';
import { idFromRng } from './species-generator';

export const GARDEN_SCHEMA_VERSION = '0.2.0';

export interface CreateGardenOptions {
  ownerId: string;
  seed: number;
  radius?: number; // shell radius in hex rings (default 3)
}

export function createGarden(opts: CreateGardenOptions): Garden {
  const tiles = buildShell(opts.radius ?? 3);
  return {
    version: GARDEN_SCHEMA_VERSION,
    ownerId: opts.ownerId,
    campaignDay: 0,
    randomSeed: opts.seed,
    tiles,
    colonies: [],
    species: [],
    inventory: { spores: [], powders: [], teas: [], toxins: [] },
    events: [],
    ecosystem: { state: 'healthy', collapsedColonyIds: [] },
  };
}

/** The species registry is kept alongside the garden (decision D19: on the actor). */
export interface GardenWithRegistry {
  garden: Garden;
  registry: SpeciesRegistryEntry[];
}

export function withRegistry(garden: Garden): GardenWithRegistry {
  return { garden, registry: [] };
}

/** Register a species in the garden's active list + the registry (if new). */
export function registerSpecies(
  bundle: GardenWithRegistry,
  species: Species,
  day: number,
): void {
  const { garden, registry } = bundle;
  if (!garden.species.find((s) => s.id === species.id)) {
    garden.species.push(species);
  }
  if (!registry.find((e) => e.species.id === species.id)) {
    const grandparents = resolveGrandparents(species, garden.species);
    registry.push({
      species,
      lineage: { parents: species.parentSpeciesIds, grandparents },
      firstCultivatedDay: day,
      currentLivingColonies: 0,
    });
  }
}

function resolveGrandparents(species: Species, all: Species[]): string[] {
  const gps = new Set<string>();
  for (const pid of species.parentSpeciesIds) {
    const parent = all.find((s) => s.id === pid);
    parent?.parentSpeciesIds.forEach((gp) => gps.add(gp));
  }
  return [...gps];
}

/**
 * Cultivate a species onto an empty tile, creating a new MYCELIUM-stage colony.
 * Returns the colony, or null if the tile is missing/occupied.
 */
export function cultivate(
  bundle: GardenWithRegistry,
  species: Species,
  tileId: string,
  rng: SeededRng,
  day: number,
): Colony | null {
  const { garden, registry } = bundle;
  const tileMap = indexTiles(garden.tiles);
  const tile = tileMap.get(tileId);
  if (!tile || tile.occupied) return null;

  registerSpecies(bundle, species, day);

  const colony: Colony = {
    id: idFromRng(rng),
    speciesId: species.id,
    tileIds: [tile.id],
    stage: ColonyStage.MYCELIUM,
    myceliumUnits: 1,
    atMRUOM: false,
    myceliumAgeDays: 0,
    maturityAgeDays: 0,
    diagonalGrowthUnits: 0,
    harvestReady: false,
    alive: true,
  };
  occupy(tile, colony.id);
  garden.colonies.push(colony);

  const entry = registry.find((e) => e.species.id === species.id);
  if (entry) entry.currentLivingColonies += 1;
  const sp = garden.species.find((s) => s.id === species.id);
  if (sp) sp.statistics.livingColonies += 1;

  return colony;
}

export function occupy(tile: Tile, colonyId: string): void {
  tile.occupied = true;
  tile.colonyId = colonyId;
}

export function vacate(tile: Tile): void {
  tile.occupied = false;
  delete tile.colonyId;
}
