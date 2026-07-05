// Save-compatibility migration. Every stored Garden carries a `version`
// (Garden.version, decision D22 — starts "0.2.0"). On load we run any forward
// migrations needed to bring an older stored bundle up to the current schema,
// keyed on that version. The mechanism is in place now even though 0.2.0 is the
// baseline and there are no migrations to run yet.

import type { Garden, SpeciesRegistryEntry } from '../data/types';
import { GARDEN_SCHEMA_VERSION, type GardenWithRegistry } from '../engine/garden';

export interface StoredBundle {
  garden: Garden;
  registry?: SpeciesRegistryEntry[];
}

/** Ordered forward migrations. Each takes a bundle at `from` and returns it at `to`. */
interface Migration {
  from: string;
  to: string;
  apply(bundle: StoredBundle): StoredBundle;
}

const MIGRATIONS: Migration[] = [
  // Example of the shape future migrations take:
  // { from: '0.2.0', to: '0.3.0', apply: (b) => { /* transform */ return b; } },
];

/** Compare dotted semver-ish strings ("0.2.0"). Returns <0, 0, >0. */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Normalize a raw stored bundle into a current-schema GardenWithRegistry,
 * applying migrations in order. Missing registry (older saves) defaults to [].
 */
export function migrateBundle(raw: StoredBundle): GardenWithRegistry {
  let bundle: StoredBundle = { garden: raw.garden, registry: raw.registry ?? [] };
  let version = bundle.garden.version ?? '0.0.0';

  if (compareVersions(version, GARDEN_SCHEMA_VERSION) < 0) {
    for (const m of MIGRATIONS) {
      if (compareVersions(version, m.from) === 0) {
        bundle = m.apply(bundle);
        version = m.to;
      }
    }
    // Stamp to current even if only additive/no-op changes were needed.
    bundle.garden.version = GARDEN_SCHEMA_VERSION;
  }

  return { garden: bundle.garden, registry: bundle.registry ?? [] };
}
