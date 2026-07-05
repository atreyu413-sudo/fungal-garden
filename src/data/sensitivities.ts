import { SensitivityRule } from './types';

// Fungal Sensitivities / Function Variations — encoded as composable rule
// objects instead of scattered prose conditionals. The engine evaluates
// `trigger` against a Species' physical/function traits (and, where noted,
// Colony state like height/adjacency); if it matches, `restriction` and/or
// `effect` apply.
//
// Field vocabulary used across triggers:
//   fungalType, color, pattern, bioluminescent, transparent, heightUnits,
//   edible, hasFunction
//
// Field vocabulary used across restrictions/effects:
//   requiresShade, requiresEdibleNeighbor, requiresWhiteNeighbor,
//   requiresBrownContact(count), requiresNonBrownContact(count),
//   requiresSeparateColonies(count), cannotTouchEdge, cannotTouchPattern,
//   cannotTouchColor, forcesPoisonous, forcesEdible, forcesBioluminescence,
//   canMature, canHaveFunction, collapseCondition, heightPenalty,
//   myceliumBonus, forcesOdor, forcesFlavorIntensity

export const SENSITIVITY_RULES: SensitivityRule[] = [
  {
    id: 'tallGrowthNeedsEdibleNeighbor',
    trigger: { heightUnits: { gt: 35 } },
    restriction: { canMature: false },
    effect: { unless: { requiresEdibleNeighbor: true } },
  },
  {
    id: 'shortToadstoolNeedsShade',
    trigger: { fungalType: 'toadstool', heightUnits: { lt: 20 } },
    restriction: { requiresShade: true },
  },
  {
    id: 'veryTallNeedsTripleContact',
    trigger: { heightUnits: { gt: 50 } },
    restriction: { canMature: false },
    effect: { unless: { minMyceliumContactPoints: 3 } },
  },
  {
    id: 'shelfCollapseUnsupported',
    trigger: { fungalType: 'shelfToadstool', stage: 'mature', heightUnits: { gt: 12 } },
    effect: {
      collapseCondition: 'no adjacent fully matured growth at shell-bottom-facing edge',
    },
  },
  {
    id: 'tallGrowthNoHealing',
    trigger: { heightUnits: { gt: 40 } },
    restriction: { canHaveFunction: ['poison', 'sporeVirility', 'edible'] }, // excludes healing
  },
  {
    id: 'greyToadstoolMusky',
    trigger: { fungalType: 'toadstool', color: 'Grey', heightUnits: { lt: 10 } },
    effect: { forcesOdor: 'Musky' },
  },
  {
    id: 'noEdgeGrowth',
    trigger: { or: [{ fungalType: 'mold' }, { pattern: 'Holed' }] },
    restriction: { cannotTouchEdge: true },
  },
  {
    id: 'ringedVsSpotted',
    trigger: { patternIncludes: 'Ringed/Striped' },
    restriction: { cannotTouchPattern: 'Spotted' },
  },
  {
    id: 'blackPatternMushroomContact',
    trigger: { fungalType: 'mushroom', patternIncludes: 'Black' },
    restriction: { requiresWhiteNeighbor: true, appliesAt: 'rtfmInitiation' },
  },
  {
    id: 'spottedToadstoolDoubleContact',
    trigger: { fungalType: 'toadstool', patternIncludes: 'Spotted' },
    restriction: { requiresNonBrownContact: 2, appliesAt: 'rtfmInitiation' },
  },
  {
    id: 'whiteRingedPoisonous',
    trigger: { color: 'White', patternIncludes: 'Ringed/Striped' },
    effect: { forcesPoisonous: true },
  },
  {
    id: 'holedCannotTouch',
    trigger: { pattern: 'Holed' },
    restriction: { cannotTouchPattern: 'Holed' },
  },
  {
    id: 'blackSpottedShelfPoisonous',
    trigger: { fungalType: 'shelfToadstool', pattern: 'Spotted Black' },
    effect: { forcesPoisonous: true },
  },
  {
    id: 'ringedBoostsGrowth',
    trigger: { patternIncludes: 'Ringed', myceliumContactPoints: { gt: 3 } },
    effect: { forcesRtfmInitiation: true },
  },
  {
    id: 'mixedPatternAdjacencyBoost',
    trigger: { adjacentDistinctPatternCount: { gte: 2 } },
    effect: { myceliumBonus: 1, appliesAt: 'everyRomgCycle' },
  },
  {
    id: 'patternedMoldFoulSmell',
    trigger: { fungalType: 'mold', pattern: { not: 'No Pattern' } },
    effect: { forcesOdor: 'Foul Stench' },
  },
  {
    id: 'blackToadstoolNeedsShade',
    trigger: { fungalType: 'toadstool', color: 'Black' },
    restriction: { requiresShade: true },
  },
  {
    id: 'primaryColorMushroomContact',
    trigger: { fungalType: 'mushroom', colorIn: ['Red', 'Blue', 'Yellow'] },
    restriction: { requiresBrownOrMonochromeContact: true, appliesAt: 'rtfmInitiation' },
  },
  {
    id: 'yellowOrangeShelfEdible',
    trigger: { fungalType: 'shelfToadstool', colorIn: ['Yellow', 'Orange'] },
    effect: { forcesEdible: true },
  },
  {
    id: 'indigoPoisonous',
    trigger: { color: 'Indigo' },
    effect: { forcesPoisonous: true },
  },
  {
    id: 'violetWhiteYellowToadstoolMultiColony',
    trigger: { fungalType: 'toadstool', colorIn: ['Violet', 'White', 'Yellow'] },
    restriction: { requiresSeparateColonies: 2, appliesAt: 'rtfmInitiation' },
  },
  {
    id: 'blueMoldEdible',
    trigger: { fungalType: 'mold', color: 'Blue' },
    effect: { forcesEdible: true },
  },
  {
    id: 'chromaticShelfVsGreyMold',
    trigger: { fungalType: 'shelfToadstool', colorNotIn: ['Brown', 'Black', 'White', 'Grey'] },
    restriction: { cannotTouchColor: 'Grey', cannotTouchFungalType: 'mold' },
  },
  {
    id: 'whiteMoldExclusion',
    trigger: { fungalType: 'mold', color: 'White' },
    restriction: { cannotTouchColor: ['Pink', 'Grey', 'Blue'] },
  },
  {
    id: 'redToadstoolDoubleBrownContact',
    trigger: { fungalType: 'toadstool', color: 'Red' },
    restriction: { requiresBrownContact: 2, appliesAt: 'rtfmInitiation' },
  },
  {
    id: 'greyNeverBioluminescent',
    trigger: { color: 'Grey' },
    restriction: { forcesBioluminescence: false },
  },
  {
    id: 'greenBlackPatternPoisonous',
    trigger: { color: 'Green', patternIncludes: 'Black' },
    effect: { forcesPoisonous: true },
  },
  {
    id: 'orangeMoldNeedsEdibleContact',
    trigger: { fungalType: 'mold', color: 'Orange' },
    restriction: { requiresEdibleNeighbor: true, appliesAt: 'rtfmInitiation' },
  },
  {
    id: 'brownIgnoresShade',
    trigger: { color: 'Brown' },
    effect: { requiresShade: false, overridesAllShadeRules: true },
  },
  {
    id: 'violetShrinksNearWhite',
    trigger: { color: 'Violet', adjacentToWhiteMycelium: true, fungalType: { not: 'mold' } },
    effect: { heightPenalty: 1, appliesTo: 'allDimensions' },
  },
  {
    id: 'violetMushroomSavory',
    trigger: { fungalType: 'mushroom', color: 'Violet' },
    effect: { forcesFlavor: 'Savory', forcesFlavorIntensity: 'Rich' },
  },
  {
    id: 'tartAlwaysOverpowering',
    trigger: { flavor: 'Tart' },
    effect: { forcesFlavorIntensity: 'Overpowering' },
  },
  {
    id: 'bioluminescentNoScent',
    trigger: { bioluminescent: true },
    effect: { forcesOdor: 'No Scent' },
  },
];
