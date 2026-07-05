// The per-day simulation pipeline. Advancing one campaignDay runs nine stages
// in fixed order: Weather -> Nutrients -> Growth -> Competition -> Breeding ->
// Mutation -> Decay -> Harvest -> Summary. Each stage gets its own seeded RNG
// (derived from seed+day+stageIndex) and appends GardenEvents; state is applied
// through those events. Weather, Nutrients, and Mutation are reserved no-op
// hooks (decisions D1/D14) — present in the pipeline, currently doing nothing.

import {
  ColonyStage,
  type Colony,
  type Garden,
  type GardenEvent,
  type GardenEventType,
  type HarvestedItem,
  type Species,
} from '../data/types';
import { growthRules } from './data';
import { indexTiles } from './hex';
import { rngFor, SeededRng } from './rng';
import { breedSpecies } from './breeding';
import {
  cultivate,
  registerSpecies,
  vacate,
  type GardenWithRegistry,
} from './garden';
import { idFromRng } from './species-generator';

export interface BreedRequest {
  parentColonyIdA: string;
  parentColonyIdB: string;
  cultivateTileId?: string;
}

export interface DayActions {
  breeds?: BreedRequest[];
  harvests?: string[]; // colony ids to harvest this day
}

interface StageCtx {
  bundle: GardenWithRegistry;
  garden: Garden;
  day: number;
  rng: SeededRng;
  actions: DayActions;
  speciesById: Map<string, Species>;
  tileById: ReturnType<typeof indexTiles>;
}

const STAGES = [
  'weather',
  'nutrients',
  'growth',
  'competition',
  'breeding',
  'mutation',
  'decay',
  'harvest',
  'summary',
] as const;

/** Advance the garden by one campaign day, running the full pipeline. */
export function advanceDay(bundle: GardenWithRegistry, actions: DayActions = {}): GardenEvent[] {
  const { garden } = bundle;
  const day = garden.campaignDay;
  const before = garden.events.length;

  STAGES.forEach((stage, i) => {
    const ctx: StageCtx = {
      bundle,
      garden,
      day,
      rng: rngFor(garden.randomSeed, day, i),
      actions,
      speciesById: new Map(garden.species.map((s) => [s.id, s])),
      tileById: indexTiles(garden.tiles),
    };
    STAGE_FNS[stage](ctx);
  });

  return garden.events.slice(before);
}

/** Advance N days in sequence (each day may take its own actions via a callback). */
export function advanceDays(
  bundle: GardenWithRegistry,
  count: number,
  actionsFor?: (day: number) => DayActions,
): void {
  for (let i = 0; i < count; i++) {
    advanceDay(bundle, actionsFor ? actionsFor(bundle.garden.campaignDay) : {});
  }
}

// --- event helper ---
function emit(
  garden: Garden,
  day: number,
  type: GardenEventType,
  description: string,
  source?: string,
  target?: string,
): void {
  garden.events.push({ day, type, source, target, description });
}

// --- stages ---

const STAGE_FNS: Record<(typeof STAGES)[number], (ctx: StageCtx) => void> = {
  weather: () => {
    /* no-op reserved hook (D1) */
  },
  nutrients: () => {
    /* no-op reserved hook (D1) */
  },
  growth: stageGrowth,
  competition: stageCompetition,
  breeding: stageBreeding,
  mutation: () => {
    /* no-op reserved hook (D14) */
  },
  decay: stageDecay,
  harvest: stageHarvest,
  summary: stageSummary,
};

function initiationThreshold(species: Species): number {
  const t = species.physical.fungalType;
  if (t === 'mold') return 1;
  if (t === 'shelfToadstool') return species.physical.dimensions.capDiameter ?? 1;
  return species.physical.dimensions.volvaDiameter ?? 1;
}

function stageGrowth(ctx: StageCtx): void {
  const { garden, day, speciesById, tileById } = ctx;
  const ecosystemHalted = garden.ecosystem.state === 'damaged';

  for (const colony of garden.colonies) {
    if (!colony.alive) continue;
    const species = speciesById.get(colony.speciesId);
    if (!species) continue;
    const rates = species.physical.rates;

    colony.myceliumAgeDays += 1;

    // Begin maturing once initiation requirements are met.
    if (colony.stage === ColonyStage.MYCELIUM && colony.myceliumUnits >= initiationThreshold(species)) {
      colony.stage = ColonyStage.GROWING;
      emit(garden, day, 'grow', `${species.displayName} began maturing`, colony.id);
    }

    // ROMG spread (suspended for growth-bearing mature colonies).
    if (
      colony.stage !== ColonyStage.MATURE &&
      colony.myceliumAgeDays > 0 &&
      colony.myceliumAgeDays % rates.romgDays === 0
    ) {
      const added = spreadMycelium(ctx, colony);
      if (added > 0) {
        colony.myceliumUnits += added;
        emit(garden, day, 'spread', `${species.displayName} spread +${added} mycelium`, colony.id);
      }
    }
    colony.atMRUOM = colony.myceliumUnits >= rates.mruom;

    // RTFM accrual toward maturity (halted while ecosystem is damaged). Mold only
    // counts as fully matured once it also reaches MRUOM (RULES-SPEC §3); other
    // types satisfy their size requirement via initiation (volva/cap fill).
    if (colony.stage === ColonyStage.GROWING && !ecosystemHalted) {
      colony.maturityAgeDays += 1;
      const sizeMet = species.physical.fungalType !== 'mold' || colony.myceliumUnits >= rates.mruom;
      if (colony.maturityAgeDays >= rates.rtfmDays && sizeMet) {
        colony.stage = ColonyStage.MATURE;
        colony.harvestReady = true;
        emit(garden, day, 'mature', `${species.displayName} reached full maturity`, colony.id);
      }
    }

    void tileById;
  }
}

/** Duplicate mycelium into empty adjacent hexes; returns count added. */
function spreadMycelium(ctx: StageCtx, colony: Colony): number {
  const { tileById } = ctx;
  const empties: string[] = [];
  const seen = new Set(colony.tileIds);
  for (const tid of colony.tileIds) {
    const tile = tileById.get(tid);
    if (!tile) continue;
    for (const nid of tile.neighbors) {
      if (seen.has(nid)) continue;
      const n = tileById.get(nid);
      if (n && !n.occupied) {
        empties.push(nid);
        seen.add(nid);
      }
    }
  }
  // Each existing unit may duplicate into one empty neighbor.
  const capacity = Math.min(colony.myceliumUnits, empties.length);
  for (let i = 0; i < capacity; i++) {
    const tile = tileById.get(empties[i]!)!;
    tile.occupied = true;
    tile.colonyId = colony.id;
    colony.tileIds.push(tile.id);
  }
  return capacity;
}

function stageCompetition(ctx: StageCtx): void {
  const { garden, day, tileById } = ctx;

  // Merge adjacent same-species colonies (D12): union tiles, sum units, max
  // maturity, adopt the more-recently-cultivated colony's ROMG position.
  const alive = garden.colonies.filter((c) => c.alive);
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i]!;
      const b = alive[j]!;
      if (!a.alive || !b.alive) continue;
      if (a.speciesId !== b.speciesId) continue;
      if (!coloniesAdjacent(a, b, tileById)) continue;
      // b is later in the array => more recently cultivated.
      a.myceliumUnits += b.myceliumUnits;
      a.maturityAgeDays = Math.max(a.maturityAgeDays, b.maturityAgeDays);
      a.myceliumAgeDays = b.myceliumAgeDays;
      for (const tid of b.tileIds) {
        const t = tileById.get(tid);
        if (t) t.colonyId = a.id;
        a.tileIds.push(tid);
      }
      b.alive = false;
      b.stage = ColonyStage.DEAD;
      b.tileIds = [];
      emit(garden, day, 'spread', `Merged ${b.id} into ${a.id}`, a.id, b.id);
    }
  }

  // Adjacency mycelium bonus: a colony bordered by >=2 distinct neighbor patterns
  // gains +1 mycelium unit (mixedPatternAdjacencyBoost).
  for (const colony of garden.colonies) {
    if (!colony.alive) continue;
    const species = ctx.speciesById.get(colony.speciesId);
    if (!species) continue;
    if (!species.sensitivity.ruleIds.includes('mixedPatternAdjacencyBoost')) continue;
    const patterns = neighborPatterns(ctx, colony);
    if (patterns.size >= 2) {
      colony.myceliumUnits += 1;
      emit(garden, day, 'grow', `${species.displayName} +1 mycelium (mixed-pattern adjacency)`, colony.id);
    }
  }
}

function coloniesAdjacent(a: Colony, b: Colony, tileById: StageCtx['tileById']): boolean {
  const bTiles = new Set(b.tileIds);
  for (const tid of a.tileIds) {
    const t = tileById.get(tid);
    if (!t) continue;
    if (t.neighbors.some((n) => bTiles.has(n))) return true;
  }
  return false;
}

function neighborPatterns(ctx: StageCtx, colony: Colony): Set<string> {
  const { tileById, garden, speciesById } = ctx;
  const colonyById = new Map(garden.colonies.map((c) => [c.id, c]));
  const patterns = new Set<string>();
  const own = new Set(colony.tileIds);
  for (const tid of colony.tileIds) {
    const t = tileById.get(tid);
    if (!t) continue;
    for (const nid of t.neighbors) {
      if (own.has(nid)) continue;
      const n = tileById.get(nid);
      if (!n?.colonyId) continue;
      const other = colonyById.get(n.colonyId);
      if (!other || other.id === colony.id) continue;
      const sp = speciesById.get(other.speciesId);
      if (sp) patterns.add(sp.physical.pattern);
    }
  }
  return patterns;
}

function stageBreeding(ctx: StageCtx): void {
  const { garden, bundle, day, rng, actions, speciesById } = ctx;
  const breeds = actions.breeds ?? [];
  const colonyById = new Map(garden.colonies.map((c) => [c.id, c]));

  for (const req of breeds) {
    const a = colonyById.get(req.parentColonyIdA);
    const b = colonyById.get(req.parentColonyIdB);
    if (!a?.alive || !b?.alive) continue;
    if (a.stage !== ColonyStage.MATURE || b.stage !== ColonyStage.MATURE) continue;
    const spA = speciesById.get(a.speciesId);
    const spB = speciesById.get(b.speciesId);
    if (!spA || !spB) continue;

    const child = breedSpecies(spA, spB, rng, day, garden.ownerId);
    registerSpecies(bundle, child, day);
    emit(garden, day, 'breed', `Bred ${spA.displayName} x ${spB.displayName} -> ${child.displayName}`, spA.id, child.id);

    if (req.cultivateTileId) {
      const colony = cultivate(bundle, child, req.cultivateTileId, rng, day);
      if (colony) emit(garden, day, 'grow', `Cultivated ${child.displayName}`, child.id, req.cultivateTileId);
    }
  }
}

function stageDecay(ctx: StageCtx): void {
  const { garden, speciesById } = ctx;
  for (const colony of garden.colonies) {
    if (!colony.alive) continue;
    const species = speciesById.get(colony.speciesId);
    if (!species) continue;
    const rates = species.physical.rates;

    // Below-MRUOM death: a colony that is below its minimum, has had at least one
    // ROMG cycle to establish, and is boxed in (no empty neighbor to expand into)
    // cannot recover, so it dies (growthRules.mycelium.belowMruomRecovery). A young
    // colony still with room to grow toward MRUOM is spared.
    const hadOneCycle = colony.myceliumAgeDays >= rates.romgDays;
    if (hadOneCycle && colony.myceliumUnits < rates.mruom && !hasEmptyNeighbor(ctx, colony)) {
      killColony(ctx, colony, `${species.displayName} died (below MRUOM, no room to expand)`);
    }
  }
}

function hasEmptyNeighbor(ctx: StageCtx, colony: Colony): boolean {
  const { tileById } = ctx;
  const own = new Set(colony.tileIds);
  for (const tid of colony.tileIds) {
    const t = tileById.get(tid);
    if (!t) continue;
    for (const nid of t.neighbors) {
      if (own.has(nid)) continue;
      const n = tileById.get(nid);
      if (n && !n.occupied) return true;
    }
  }
  return false;
}

function killColony(ctx: StageCtx, colony: Colony, reason: string): void {
  const { garden, bundle, day, tileById, speciesById } = ctx;
  for (const tid of colony.tileIds) {
    const t = tileById.get(tid);
    if (t && t.colonyId === colony.id) vacate(t);
  }
  colony.alive = false;
  colony.stage = ColonyStage.DEAD;
  colony.tileIds = [];
  emit(garden, day, 'decay', reason, colony.id);

  const species = speciesById.get(colony.speciesId);
  if (species) {
    species.statistics.livingColonies = Math.max(0, species.statistics.livingColonies - 1);
    const entry = bundle.registry.find((e) => e.species.id === species.id);
    if (entry) entry.currentLivingColonies = Math.max(0, entry.currentLivingColonies - 1);
    if (species.statistics.livingColonies === 0) {
      species.statistics.extinctAt = day;
    }
  }
}

const PREP_EXPIRY = growthRules.time.prepMethodExpiryDays;

function stageHarvest(ctx: StageCtx): void {
  const { garden, day, actions, speciesById, rng } = ctx;
  const harvests = actions.harvests ?? [];
  const colonyById = new Map(garden.colonies.map((c) => [c.id, c]));

  for (const cid of harvests) {
    const colony = colonyById.get(cid);
    if (!colony?.alive || colony.stage !== ColonyStage.MATURE || !colony.harvestReady) continue;
    const species = speciesById.get(colony.speciesId);
    if (!species) continue;

    const item = makeHarvestedItem(species, colony.id, day, rng);
    bucketFor(garden, item.prepMethod, species.function.category).push(item);
    species.statistics.harvestCount += 1;

    // Harvest resets RTFM (D21) — no immediate regrowth.
    colony.maturityAgeDays = 0;
    colony.harvestReady = false;
    colony.stage = ColonyStage.GROWING;
    emit(garden, day, 'harvest', `Harvested ${species.displayName}`, colony.id);
  }
}

function makeHarvestedItem(species: Species, colonyId: string, day: number, rng: SeededRng): HarvestedItem {
  const fn = species.function;
  let prepMethod: HarvestedItem['prepMethod'] = 'save';
  let effect = 'Edible';
  if (fn.category === 'healing' && fn.healing) {
    prepMethod = fn.healing.prepMethod;
    effect = fn.healing.effect;
  } else if (fn.category === 'poison' && fn.poison) {
    prepMethod = 'ingested';
    effect = fn.poison.effect;
  } else if (fn.category === 'sporeVirility') {
    prepMethod = 'powder';
    effect = 'Spore virility';
  } else if (fn.category === 'edible') {
    prepMethod = 'tea';
    effect = 'Goodberry (1 week)';
  }
  const expiryDays = PREP_EXPIRY[prepMethod as 'save' | 'tea' | 'powder'];
  return {
    id: idFromRng(rng),
    speciesId: species.id,
    colonyId,
    prepMethod,
    harvestedDay: day,
    effect,
    expiresDay: expiryDays !== undefined ? day + expiryDays : undefined,
  };
}

function bucketFor(garden: Garden, prep: HarvestedItem['prepMethod'], category: string | null): HarvestedItem[] {
  if (category === 'poison') return garden.inventory.toxins;
  if (prep === 'powder') return garden.inventory.powders;
  if (prep === 'tea') return garden.inventory.teas;
  if (category === 'sporeVirility' || category === 'edible') return garden.inventory.spores;
  return garden.inventory.teas;
}

function stageSummary(ctx: StageCtx): void {
  const { garden } = ctx;
  // Ecosystem auto-resume from damaged -> healthy after one week.
  if (
    garden.ecosystem.state === 'damaged' &&
    garden.ecosystem.damagedSinceDay !== undefined &&
    garden.campaignDay - garden.ecosystem.damagedSinceDay >= growthRules.time.ecosystemAutoResumeDays
  ) {
    garden.ecosystem.state = 'healthy';
    delete garden.ecosystem.damagedSinceDay;
    emit(garden, garden.campaignDay, 'ecosystemResume', 'Ecosystem recovered to healthy');
  }
  // Close the day.
  garden.campaignDay += 1;
}
