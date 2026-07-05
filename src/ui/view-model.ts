// Pure view-model for the Garden UI. Turns a GardenWithRegistry into everything a
// template needs to render — hex geometry, fills, stats, the discovery journal,
// and a recent-event log — with no Foundry or DOM dependency, so it is unit
// tested directly (see tests/view-model.test.ts).

import { ColonyStage, type Colony, type Species } from '../data/types';
import type { GardenWithRegistry } from '../engine/garden';
import { colorToHex, EMPTY_HEX, EDGE_STROKE, HEX_STROKE, textOn } from './colors';

export interface HexView {
  id: string;
  q: number;
  r: number;
  cx: number;
  cy: number;
  points: string; // SVG polygon points
  fill: string;
  stroke: string;
  occupied: boolean;
  edge: boolean;
  colonyId?: string;
  speciesName?: string;
  stage?: string;
  bioluminescent?: boolean;
  label?: string; // short glyph for the stage
  textFill?: string; // readable text color over `fill`
}

export interface StatsView {
  campaignDay: number;
  totalTiles: number;
  occupiedTiles: number;
  livingColonies: number;
  matureColonies: number;
  activeSpecies: number;
  discoveredSpecies: number;
  inventoryTotal: number;
  ecosystemState: string;
}

export interface JournalEntryView {
  id: string;
  name: string;
  generation: number;
  fungalType: string;
  color: string;
  swatch: string;
  parents: string[];
  grandparents: string[];
  livingColonies: number;
  firstCultivatedDay: number;
  extinct: boolean;
  functionCategory: string;
}

export interface EventView {
  day: number;
  type: string;
  description: string;
}

export interface GardenViewModel {
  width: number;
  height: number;
  hexSize: number;
  hexes: HexView[];
  stats: StatsView;
  journal: JournalEntryView[];
  events: EventView[];
  inventory: { spores: number; powders: number; teas: number; toxins: number };
}

const STAGE_GLYPH: Record<string, string> = {
  [ColonyStage.SPORE]: '·',
  [ColonyStage.MYCELIUM]: '∴',
  [ColonyStage.GROWING]: '♣',
  [ColonyStage.MATURE]: '♠',
  [ColonyStage.HARVESTED]: '◇',
  [ColonyStage.DORMANT]: '○',
  [ColonyStage.DEAD]: '×',
};

/** Pointy-top axial hex -> pixel center. */
function axialToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * 1.5 * r;
  return { x, y };
}

function hexPolygonPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return pts.join(' ');
}

export function buildGardenViewModel(
  bundle: GardenWithRegistry,
  opts: { hexSize?: number; eventLimit?: number } = {},
): GardenViewModel {
  const { garden, registry } = bundle;
  const size = opts.hexSize ?? 26;
  const pad = size + 4;

  const colonyById = new Map(garden.colonies.map((c) => [c.id, c]));
  const speciesById = new Map(garden.species.map((s) => [s.id, s]));

  // First pass: raw pixel centers, to compute bounds.
  const raw = garden.tiles.map((t) => ({ tile: t, ...axialToPixel(t.q, t.r, size) }));
  const minX = Math.min(...raw.map((p) => p.x));
  const minY = Math.min(...raw.map((p) => p.y));
  const maxX = Math.max(...raw.map((p) => p.x));
  const maxY = Math.max(...raw.map((p) => p.y));

  const hexes: HexView[] = raw.map(({ tile, x, y }) => {
    const cx = x - minX + pad;
    const cy = y - minY + pad;
    let fill = EMPTY_HEX;
    let colony: Colony | undefined;
    let species: Species | undefined;
    if (tile.colonyId) {
      colony = colonyById.get(tile.colonyId);
      if (colony) species = speciesById.get(colony.speciesId);
      if (species) fill = colorToHex(species.physical.color);
    }
    return {
      id: tile.id,
      q: tile.q,
      r: tile.r,
      cx,
      cy,
      points: hexPolygonPoints(cx, cy, size),
      fill,
      stroke: tile.edge ? EDGE_STROKE : HEX_STROKE,
      occupied: tile.occupied,
      edge: tile.edge,
      colonyId: colony?.id,
      speciesName: species?.displayName,
      stage: colony?.stage,
      bioluminescent: species?.physical.bioluminescent && species.function.magicalEffect !== undefined
        ? true
        : species?.physical.bioluminescent,
      label: colony ? (STAGE_GLYPH[colony.stage] ?? '') : '',
      textFill: textOn(fill),
    };
  });

  const width = maxX - minX + pad * 2;
  const height = maxY - minY + pad * 2;

  const living = garden.colonies.filter((c) => c.alive);
  const stats: StatsView = {
    campaignDay: garden.campaignDay,
    totalTiles: garden.tiles.length,
    occupiedTiles: garden.tiles.filter((t) => t.occupied).length,
    livingColonies: living.length,
    matureColonies: living.filter((c) => c.stage === ColonyStage.MATURE).length,
    activeSpecies: garden.species.length,
    discoveredSpecies: registry.length,
    inventoryTotal:
      garden.inventory.spores.length +
      garden.inventory.powders.length +
      garden.inventory.teas.length +
      garden.inventory.toxins.length,
    ecosystemState: garden.ecosystem.state,
  };

  const journal: JournalEntryView[] = registry
    .slice()
    .sort((a, b) => a.firstCultivatedDay - b.firstCultivatedDay)
    .map((e) => ({
      id: e.species.id,
      name: e.species.displayName,
      generation: e.species.generation,
      fungalType: e.species.physical.fungalType,
      color: e.species.physical.color,
      swatch: colorToHex(e.species.physical.color),
      parents: e.lineage.parents,
      grandparents: e.lineage.grandparents,
      livingColonies: e.currentLivingColonies,
      firstCultivatedDay: e.firstCultivatedDay,
      extinct: e.currentLivingColonies === 0,
      functionCategory: e.species.function.category ?? 'inert',
    }));

  const eventLimit = opts.eventLimit ?? 40;
  const events: EventView[] = garden.events
    .slice(-eventLimit)
    .reverse()
    .map((e) => ({ day: e.day, type: e.type, description: e.description }));

  const inventory = {
    spores: garden.inventory.spores.length,
    powders: garden.inventory.powders.length,
    teas: garden.inventory.teas.length,
    toxins: garden.inventory.toxins.length,
  };

  return { width, height, hexSize: size, hexes, stats, journal, events, inventory };
}
