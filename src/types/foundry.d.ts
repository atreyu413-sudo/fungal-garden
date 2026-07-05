// Minimal ambient Foundry VTT typings — just the surface this module uses.
// Phase 4 keeps this hand-rolled rather than pulling the full foundry-vtt-types
// package (heavy, and v13 coverage is uneven). The engine (src/engine/**) uses
// none of these; only the src/foundry/** adapter and src/module.ts do.

export {}; // make this a module-augmentation file while still declaring globals

declare global {
  /** A Foundry document with the flags API (Actor, in our case). */
  interface FoundryActor {
    id: string;
    name: string;
    getFlag(scope: string, key: string): unknown;
    setFlag(scope: string, key: string, value: unknown): Promise<FoundryActor>;
    unsetFlag(scope: string, key: string): Promise<FoundryActor>;
  }

  interface FoundryModule {
    id: string;
    active: boolean;
    api?: unknown;
  }

  const game: {
    actors?: { get(id: string): FoundryActor | undefined; contents: FoundryActor[] };
    modules: { get(id: string): FoundryModule | undefined };
    user?: { isGM: boolean };
    i18n?: { localize(key: string): string };
  };

  const Hooks: {
    once(hook: string, fn: (...args: unknown[]) => unknown): number;
    on(hook: string, fn: (...args: unknown[]) => unknown): number;
    callAll(hook: string, ...args: unknown[]): boolean;
  };

  const ui: {
    notifications?: {
      info(msg: string): void;
      warn(msg: string): void;
      error(msg: string): void;
    };
  };

  const foundry: {
    utils: {
      randomID(length?: number): string;
      deepClone<T>(obj: T): T;
    };
  };

  const CONFIG: Record<string, unknown>;
}
