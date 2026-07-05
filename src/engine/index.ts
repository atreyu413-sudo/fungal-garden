// Public engine API. Foundry-independent — nothing here imports Foundry globals.

export { SeededRng, deriveSeed, rngFor } from './rng';
export { rollFormula, rollDice, applyRounding } from './dice';
export { buildShell, tileId, hexDistance, indexTiles } from './hex';
export { generateWildSpecies, materializeFunction, idFromRng } from './species-generator';
export { breedSpecies } from './breeding';
export { evaluateTrigger, matchingRules, firingRules } from './sensitivity';
export type { SensitivityContext } from './sensitivity';
export {
  createGarden,
  withRegistry,
  registerSpecies,
  cultivate,
  GARDEN_SCHEMA_VERSION,
} from './garden';
export type { GardenWithRegistry, CreateGardenOptions } from './garden';
export { advanceDay, advanceDays } from './pipeline';
export type { DayActions, BreedRequest } from './pipeline';
