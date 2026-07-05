import { defineConfig } from 'vite';

// Single config for both the Foundry library build and the Vitest engine tests.
// The build bundles src/module.ts (+ the engine and the imported JSON data) into
// dist/module.js, the ES module that module.json points at. Foundry globals
// (game, Hooks, ui, foundry) are left as free globals — Foundry provides them.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      entry: 'src/module.ts',
      formats: ['es'],
      fileName: () => 'module.js',
    },
    rollupOptions: {
      output: { entryFileNames: 'module.js' },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
