// The Garden window — a Foundry v13 ApplicationV2 that renders the hex grid,
// discovery journal, stats, and event log, with a GM control panel. All the
// render data comes from the tested pure view-model (view-model.ts); this class
// only bridges Foundry (actor lookup, persistence, click actions) to it.
//
// Interactions are wired with explicit DOM listeners in _onRender rather than the
// declarative ApplicationV2 `actions` map — the declarative path proved
// unreliable in a live world, and manual listeners are simple and predictable.
// Tab switching toggles panel visibility directly (no re-render); GM actions
// mutate the garden and then re-render.

import { MODULE_ID } from '../foundry/constants';
import { advanceGarden, getGarden, plantSpecies } from '../foundry/actor-garden';
import { clearBundle } from '../foundry/store';
import { buildGardenViewModel } from './view-model';

const TEMPLATE = `modules/${MODULE_ID}/templates/garden.hbs`;
type TabName = 'grid' | 'journal' | 'stats' | 'log';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class GardenApp extends HandlebarsApplicationMixin(ApplicationV2) {
  actorId: string;
  private activeTab: TabName = 'grid';
  private selectedTileId: string | null = null;

  constructor(options: { actorId: string } & Record<string, unknown>) {
    super(options);
    this.actorId = options.actorId;
  }

  static DEFAULT_OPTIONS = {
    id: 'fungal-garden-app',
    classes: ['fungal-garden'],
    tag: 'div',
    window: {
      title: 'FUNGAL_GARDEN.title',
      icon: 'fas fa-seedling',
      resizable: true,
    },
    position: { width: 860, height: 760 },
  };

  static PARTS = {
    main: { template: TEMPLATE, scrollable: [''] },
  };

  get actor(): FoundryActor | undefined {
    return game.actors?.get(this.actorId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _prepareContext(_options: unknown): Promise<Record<string, unknown>> {
    const actor = this.actor;
    const bundle = actor ? getGarden(actor) : null;
    const vm = bundle ? buildGardenViewModel(bundle) : null;

    // Detail for the currently selected tile, if any.
    let selected: Record<string, unknown> | null = null;
    if (vm && this.selectedTileId) {
      const hex = vm.hexes.find((h) => h.id === this.selectedTileId) ?? null;
      if (hex?.colonyId && bundle) {
        const colony = bundle.garden.colonies.find((c) => c.id === hex.colonyId);
        const species = colony ? bundle.garden.species.find((s) => s.id === colony.speciesId) : undefined;
        selected = { hex, colony, species };
      } else if (hex) {
        selected = { hex, colony: null, species: null };
      }
    }

    return {
      isGM: game.user?.isGM ?? false,
      hasGarden: !!bundle,
      actorName: actor?.name ?? 'Unknown',
      vm,
      selected,
      activeTab: this.activeTab,
    };
  }

  /** Attach DOM listeners after each render. Foundry calls this post-render. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onRender(_context: unknown, _options: unknown): void {
    const root = this.element as HTMLElement | undefined;
    if (!root) return;

    // Tabs — instant show/hide, no re-render.
    root.querySelectorAll<HTMLElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => this.showTab(btn.dataset.tab as TabName));
    });
    this.showTab(this.activeTab);

    // GM control buttons.
    root.querySelectorAll<HTMLElement>('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => void this.runAction(btn.dataset.act ?? '', btn.dataset));
    });

    // Hex clicks.
    root.querySelectorAll<HTMLElement>('[data-tile-id]').forEach((g) => {
      g.addEventListener('click', () => void this.onHex(g.dataset.tileId ?? ''));
    });
  }

  private showTab(tab: TabName): void {
    this.activeTab = tab;
    const root = this.element as HTMLElement | undefined;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    root.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => {
      p.classList.toggle('active', p.dataset.panel === tab);
    });
  }

  private async runAction(act: string, data: DOMStringMap): Promise<void> {
    if (!this.actor) return;
    switch (act) {
      case 'advance': {
        await advanceGarden(this.actor, Number(data.days ?? 1) || 1);
        break;
      }
      case 'plant': {
        const tileId = this.firstEmptyTileId();
        if (!tileId) {
          ui.notifications?.warn('Fungal Garden: no empty tile to plant on.');
          return;
        }
        await plantSpecies(this.actor, tileId);
        break;
      }
      case 'clear': {
        await clearBundle(this.actor);
        this.selectedTileId = null;
        break;
      }
      default:
        return;
    }
    await this.render();
  }

  private async onHex(tileId: string): Promise<void> {
    if (!tileId || !this.actor) return;
    const bundle = getGarden(this.actor);
    const tile = bundle?.garden.tiles.find((t) => t.id === tileId);
    // GM click on an empty tile plants there; otherwise just select for detail.
    if (game.user?.isGM && tile && !tile.occupied) {
      await plantSpecies(this.actor, tileId);
    }
    this.selectedTileId = tileId;
    await this.render();
  }

  private firstEmptyTileId(): string | null {
    const bundle = this.actor ? getGarden(this.actor) : null;
    return bundle?.garden.tiles.find((t) => !t.occupied)?.id ?? null;
  }

  // provided by ApplicationV2 base (loosely typed shim)
  declare element: HTMLElement;
  declare render: (force?: boolean) => Promise<unknown>;
}

/** Open (or focus) the garden window for an actor. */
export function openGardenApp(actor: FoundryActor): GardenApp {
  const app = new GardenApp({ actorId: actor.id, window: { title: `${actor.name} — Fungal Garden` } });
  app.render(true);
  return app;
}
