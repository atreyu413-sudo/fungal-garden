// Minimal ambient shim so the Foundry entry point (src/module.ts) typechecks
// without the full Foundry VTT type package. Phase 4 replaces this with proper
// Foundry types. The engine (src/engine/**) does not depend on any of these.

declare const Hooks: {
  once(hook: string, fn: (...args: unknown[]) => void): void;
  on(hook: string, fn: (...args: unknown[]) => void): void;
};

declare const game: Record<string, unknown>;
declare const CONFIG: Record<string, unknown>;
