import { RollTableEntry, FungalType, PrepMethod } from './types';

// ---------------------------------------------------------------------------
// 1. Fungal Type (D10)
// ---------------------------------------------------------------------------
export const FUNGAL_TYPE_TABLE: RollTableEntry<FungalType>[] = [
  { min: 1, max: 4, value: 'toadstool' },
  { min: 5, max: 5, value: 'shelfToadstool' },
  { min: 6, max: 8, value: 'mold' },
  { min: 9, max: 10, value: 'mushroom' },
];

// ---------------------------------------------------------------------------
// 2. Dimension & Rate dice formulas per type
// Each entry is a dice expression string; roll with your dice-roller of choice
// (e.g. "2D12" = roll 2 D12 and sum). ODOV = already-rolled Optimum Diameter Of Volva.
// ---------------------------------------------------------------------------
export const DIMENSION_FORMULAS = {
  toadstool: {
    optimumVolvaDiameter: 'D8', // round down
    optimumStemHeight: '8D4',
    optimumCapDiameter: 'ODOV + D12',
    optimumCapHeight: '2D12', // round up
    rtfm: 'D6', // months
    mruom: '2D4',
    romg: 'D8', // weeks
  },
  shelfToadstool: {
    optimumCapDiameter: '2D10',
    optimumCapHeight: 'capDiameter / 2 (round up)',
    rtfm: 'D6', // months
    mruom: '3D4',
    romg: 'D8', // weeks
  },
  mold: {
    optimumHeight: 'D4', // round down
    rtfm: 'D4', // weeks
    mruom: '5D4',
    romg: 'D4', // weeks
  },
  mushroom: {
    optimumVolvaDiameter: 'D6', // round down
    optimumStemHeight: '3D4',
    optimumCapDiameter: 'ODOV + D8',
    optimumCapHeight: '4D4',
    rtfm: 'D6', // months
    mruom: '2D4',
    romg: 'D8', // weeks
  },
} as const;

// ---------------------------------------------------------------------------
// 3. Odor (D20)
// ---------------------------------------------------------------------------
export const ODOR_TABLE: RollTableEntry<string>[] = [
  { min: 1, max: 3, value: 'Foul Stench' },
  { min: 4, max: 9, value: 'Musky' },
  { min: 10, max: 17, value: 'No Scent' },
  { min: 18, max: 19, value: 'Lightly Sweet' },
  { min: 20, max: 20, value: 'Smells Delectable' },
];

// ---------------------------------------------------------------------------
// 4. Flavor Intensity (D6)
// ---------------------------------------------------------------------------
export const FLAVOR_INTENSITY_TABLE: RollTableEntry<string>[] = [
  { min: 1, max: 1, value: 'Very Faint' },
  { min: 2, max: 2, value: 'Mild' },
  { min: 3, max: 3, value: 'Noticeable' },
  { min: 4, max: 4, value: 'Rich' },
  { min: 5, max: 5, value: 'Strong' },
  { min: 6, max: 6, value: 'Overpowering' },
];

// ---------------------------------------------------------------------------
// 5. Flavor (D20)
// ---------------------------------------------------------------------------
export const FLAVOR_TABLE: RollTableEntry<string>[] = [
  { min: 1, max: 1, value: 'Bitter' },
  { min: 2, max: 2, value: 'Spicy' },
  { min: 3, max: 3, value: 'Bitter' },
  { min: 4, max: 4, value: 'Tart' },
  { min: 5, max: 5, value: 'Bitter' },
  { min: 6, max: 6, value: 'Earthy' },
  { min: 7, max: 7, value: 'Bitter' },
  { min: 8, max: 8, value: 'Nutty' },
  { min: 9, max: 9, value: 'Bitter' },
  { min: 10, max: 10, value: 'No Flavor' },
  { min: 11, max: 11, value: 'Savory' },
  { min: 12, max: 12, value: 'Minty' },
  { min: 13, max: 13, value: 'Savory' },
  { min: 14, max: 14, value: 'Floral' },
  { min: 15, max: 15, value: 'Savory' },
  { min: 16, max: 16, value: 'Fruity' },
  { min: 17, max: 17, value: 'Savory' },
  { min: 18, max: 18, value: 'Maple-Like' },
  { min: 19, max: 19, value: 'Savory' },
  { min: 20, max: 20, value: 'Chocolatey' },
];
// Note (sensitivity): Tart fungus is always Overpowering intensity, overriding the D6 roll.

// ---------------------------------------------------------------------------
// 6. Color (D100)
// ---------------------------------------------------------------------------
export const COLOR_TABLE: RollTableEntry<string>[] = [
  { min: 1, max: 5, value: 'Black' },
  { min: 6, max: 10, value: 'Brown' },
  { min: 11, max: 15, value: 'White' },
  { min: 16, max: 18, value: 'Orange' },
  { min: 19, max: 23, value: 'Brown' },
  { min: 24, max: 26, value: 'Green' },
  { min: 27, max: 31, value: 'White' },
  { min: 32, max: 36, value: 'Brown' },
  { min: 37, max: 41, value: 'Blue' },
  { min: 42, max: 46, value: 'Brown' },
  { min: 47, max: 51, value: 'Red' },
  { min: 52, max: 56, value: 'Yellow' },
  { min: 57, max: 61, value: 'Brown' },
  { min: 62, max: 64, value: 'Indigo' },
  { min: 65, max: 69, value: 'Brown' },
  { min: 70, max: 74, value: 'White' },
  { min: 75, max: 77, value: 'Violet' },
  { min: 78, max: 80, value: 'Brown' },
  { min: 81, max: 85, value: 'Pink' },
  { min: 86, max: 90, value: 'Grey' },
  { min: 91, max: 95, value: 'Brown' },
  { min: 96, max: 100, value: 'Black' },
];

// ---------------------------------------------------------------------------
// 7. Pattern (D100)
// ---------------------------------------------------------------------------
export const PATTERN_TABLE: RollTableEntry<string>[] = [
  { min: 1, max: 10, value: 'Holed' },
  { min: 11, max: 20, value: 'No Pattern' },
  { min: 21, max: 30, value: 'Ringed/Striped White' },
  { min: 31, max: 40, value: 'No Pattern' },
  { min: 41, max: 50, value: 'Ringed/Striped Black' },
  { min: 51, max: 60, value: 'No Pattern' },
  { min: 61, max: 70, value: 'Spotted White' },
  { min: 71, max: 80, value: 'No Pattern' },
  { min: 81, max: 90, value: 'Spotted Black' },
  { min: 91, max: 100, value: 'No Pattern' },
];

// ---------------------------------------------------------------------------
// 8. Bioluminescence (D100) — thesis lists this as 4 sub-bands of 1-24/25/etc,
// normalized here to a single continuous D100 table: only exact multiples of 25
// are bioluminescent, everything else is not.
// ---------------------------------------------------------------------------
export const BIOLUMINESCENCE_TABLE: RollTableEntry<boolean>[] = [
  { min: 1, max: 24, value: false },
  { min: 25, max: 25, value: true },
  { min: 26, max: 49, value: false },
  { min: 50, max: 50, value: true },
  { min: 51, max: 74, value: false },
  { min: 75, max: 75, value: true },
  { min: 76, max: 99, value: false },
  { min: 100, max: 100, value: true },
];

// ---------------------------------------------------------------------------
// 9. Transparency (non-mold fungi; D100). Mold is opaque by default per the
// worked examples, but individual poison products can force transparency
// (see POISON_TABLE "Makes Essence Of Ether").
// ---------------------------------------------------------------------------
export const TRANSPARENCY_TABLE: RollTableEntry<boolean>[] = [
  { min: 1, max: 45, value: false }, // Opaque
  { min: 46, max: 55, value: true }, // Transparent
  { min: 56, max: 100, value: false }, // Opaque
];

// ---------------------------------------------------------------------------
// 10. Function type (D10) — separate tables for Toadstool and Mold.
// Mushrooms skip this roll entirely (always 'edible').
// ---------------------------------------------------------------------------
export type ToadstoolMoldFunction = 'poison' | 'healing' | 'sporeVirility';

export const TOADSTOOL_FUNCTION_TABLE: RollTableEntry<ToadstoolMoldFunction>[] = [
  { min: 1, max: 1, value: 'poison' },
  { min: 2, max: 2, value: 'healing' },
  { min: 3, max: 3, value: 'poison' },
  { min: 4, max: 4, value: 'healing' },
  { min: 5, max: 5, value: 'sporeVirility' },
  { min: 6, max: 6, value: 'sporeVirility' },
  { min: 7, max: 7, value: 'poison' },
  { min: 8, max: 8, value: 'healing' },
  { min: 9, max: 9, value: 'poison' },
  { min: 10, max: 10, value: 'healing' },
];

export const MOLD_FUNCTION_TABLE: RollTableEntry<ToadstoolMoldFunction>[] = [
  { min: 1, max: 1, value: 'poison' },
  { min: 2, max: 2, value: 'healing' },
  { min: 3, max: 3, value: 'poison' },
  { min: 4, max: 4, value: 'sporeVirility' },
  { min: 5, max: 5, value: 'poison' },
  { min: 6, max: 6, value: 'healing' },
  { min: 7, max: 7, value: 'poison' },
  { min: 8, max: 8, value: 'sporeVirility' },
  { min: 9, max: 9, value: 'poison' },
  { min: 10, max: 10, value: 'healing' },
];

// ---------------------------------------------------------------------------
// 11. Healing tables
// ---------------------------------------------------------------------------
export interface HealingEntry {
  effect: string;
  prepMethod: PrepMethod;
  dc: number;
}

// Toadstool healing (D100)
export const TOADSTOOL_HEALING_TABLE: RollTableEntry<HealingEntry>[] = [
  { min: 1, max: 7, value: { effect: 'Heals 1D4 Hit Points', prepMethod: 'tea', dc: 14 } },
  { min: 8, max: 14, value: { effect: 'Heals 1D6 Hit Points', prepMethod: 'tea', dc: 14 } },
  { min: 15, max: 20, value: { effect: 'Heals 1D8 Hit Points', prepMethod: 'tea', dc: 14 } },
  { min: 21, max: 25, value: { effect: 'Heals 2D4 Hit Points', prepMethod: 'tea', dc: 16 } },
  { min: 26, max: 30, value: { effect: 'Heals 1D10 Hit Points', prepMethod: 'tea', dc: 16 } },
  { min: 31, max: 35, value: { effect: 'Heals 1D12 Hit Points', prepMethod: 'tea', dc: 16 } },
  { min: 36, max: 37, value: { effect: 'Heals 2D6 Hit Points', prepMethod: 'tea', dc: 18 } },
  { min: 38, max: 39, value: { effect: 'Heals 3D4 Hit Points', prepMethod: 'tea', dc: 18 } },
  { min: 40, max: 41, value: { effect: 'Heals 2D8 Hit Points', prepMethod: 'tea', dc: 18 } },
  { min: 42, max: 43, value: { effect: 'Heals 3D6 Hit Points', prepMethod: 'tea', dc: 18 } },
  { min: 44, max: 45, value: { effect: 'Heals 2D10 Hit Points', prepMethod: 'tea', dc: 18 } },
  { min: 46, max: 47, value: { effect: 'Heals 2D12 Hit Points', prepMethod: 'tea', dc: 18 } },
  { min: 48, max: 48, value: { effect: 'Heals 3D8 Hit Points', prepMethod: 'tea', dc: 20 } },
  { min: 49, max: 49, value: { effect: 'Heals 3D10 Hit Points', prepMethod: 'tea', dc: 20 } },
  { min: 50, max: 50, value: { effect: 'Heals 3D12 Hit Points', prepMethod: 'tea', dc: 20 } },
  { min: 51, max: 54, value: { effect: 'Cures Blinded Condition', prepMethod: 'save', dc: 16 } },
  { min: 55, max: 58, value: { effect: 'Cures Charmed Condition', prepMethod: 'tea', dc: 16 } },
  { min: 59, max: 62, value: { effect: 'Cures Deafened Condition', prepMethod: 'powder', dc: 16 } },
  { min: 63, max: 64, value: { effect: 'Cures Frightened Condition', prepMethod: 'tea', dc: 16 } },
  { min: 65, max: 66, value: { effect: 'Cures Frightened Condition', prepMethod: 'powder', dc: 16 } },
  { min: 67, max: 70, value: { effect: 'Cures Incapacitated Condition', prepMethod: 'tea', dc: 16 } },
  { min: 71, max: 72, value: { effect: 'Cures Paralyzed Condition', prepMethod: 'save', dc: 16 } },
  { min: 73, max: 74, value: { effect: 'Cures Paralyzed Condition', prepMethod: 'powder', dc: 16 } },
  { min: 75, max: 78, value: { effect: 'Cures Petrified Condition', prepMethod: 'save', dc: 16 } },
  { min: 79, max: 80, value: { effect: 'Cures Poisoned Condition', prepMethod: 'tea', dc: 16 } },
  { min: 81, max: 82, value: { effect: 'Cures Poisoned Condition', prepMethod: 'save', dc: 16 } },
  { min: 83, max: 86, value: { effect: 'Cures Stunned Condition', prepMethod: 'tea', dc: 16 } },
  { min: 87, max: 90, value: { effect: 'Cures Unconscious Condition', prepMethod: 'powder', dc: 16 } },
  { min: 91, max: 100, value: { effect: 'Cures One Point Of Exhaustion', prepMethod: 'tea', dc: 16 } },
];

// Mold healing (D20)
export const MOLD_HEALING_TABLE: RollTableEntry<HealingEntry>[] = [
  { min: 1, max: 3, value: { effect: 'Cures Frightened Condition', prepMethod: 'powder', dc: 16 } },
  { min: 4, max: 5, value: { effect: 'Cures Deafened Condition', prepMethod: 'powder', dc: 16 } },
  { min: 6, max: 7, value: { effect: 'Cures Paralyzed Condition', prepMethod: 'save', dc: 16 } },
  { min: 8, max: 10, value: { effect: 'Cures Poisoned Condition', prepMethod: 'save', dc: 16 } },
  { min: 11, max: 12, value: { effect: 'Cures Paralyzed Condition', prepMethod: 'powder', dc: 16 } },
  { min: 13, max: 15, value: { effect: 'Cures Blinded Condition', prepMethod: 'save', dc: 16 } },
  { min: 16, max: 18, value: { effect: 'Cures Unconscious Condition', prepMethod: 'powder', dc: 16 } },
  { min: 19, max: 20, value: { effect: 'Cures Petrified Condition', prepMethod: 'save', dc: 16 } },
];
// Effective windows (all healing): Saves usable within 1 hour, Teas within 24 hours,
// Powders within 1 week of preparation.

// ---------------------------------------------------------------------------
// 12. Poison table (D100) — shared by toadstool and mold per the thesis text.
// "Contact" delivery requires an Int (Nature) check on ANY interaction during
// RTFM or after plucking to avoid being poisoned (requiresCheckOnAnyInteraction).
// ---------------------------------------------------------------------------
export interface PoisonEntry {
  effect: string;
  dc: number;
  requiresCheckOnAnyInteraction?: boolean;
}

export const POISON_TABLE: RollTableEntry<PoisonEntry>[] = [
  { min: 1, max: 9, value: { effect: 'Poisoned Condition for 1 Minute upon Contact', dc: 16, requiresCheckOnAnyInteraction: true } },
  { min: 10, max: 16, value: { effect: "Makes Assassin's Blood (automatically red)", dc: 17 } },
  { min: 17, max: 19, value: { effect: 'Poisoned Condition for 1 Minute when Inhaled', dc: 16 } },
  { min: 20, max: 26, value: { effect: 'Makes Truth Serum', dc: 17 } },
  { min: 27, max: 29, value: { effect: 'Poisoned Condition for 1 Minute when Ingested', dc: 16 } },
  { min: 30, max: 36, value: { effect: "Makes Drow Poison (automatically requires shade)", dc: 17 } },
  { min: 37, max: 39, value: { effect: 'Poisoned Condition for 1 Minute upon Contact', dc: 16, requiresCheckOnAnyInteraction: true } },
  { min: 40, max: 43, value: { effect: 'Makes Malice', dc: 18 } },
  { min: 44, max: 49, value: { effect: 'Poisoned Condition for 1 Minute when Inhaled', dc: 16 } },
  { min: 50, max: 53, value: { effect: 'Makes Pale Tincture (automatically white)', dc: 18 } },
  { min: 54, max: 59, value: { effect: 'Poisoned Condition for 1 Minute when Ingested', dc: 16 } },
  { min: 60, max: 63, value: { effect: 'Makes Essence Of Ether (automatically transparent)', dc: 18 } },
  { min: 64, max: 69, value: { effect: 'Poisoned Condition for 1 Minute upon Contact', dc: 16, requiresCheckOnAnyInteraction: true } },
  { min: 70, max: 72, value: { effect: 'IS Taggit (makes Oil Of Taggit)', dc: 19 } },
  { min: 73, max: 79, value: { effect: 'Poisoned Condition for 1 Minute when Inhaled', dc: 16 } },
  { min: 80, max: 82, value: { effect: 'IS Othur (makes Burnt Othur Fumes)', dc: 19 } },
  { min: 83, max: 89, value: { effect: 'Poisoned Condition for 1 Minute when Ingested', dc: 16 } },
  { min: 90, max: 91, value: { effect: 'Makes Torpor', dc: 19 } },
  { min: 92, max: 99, value: { effect: 'Poisoned Condition for 1 Minute upon Contact', dc: 16, requiresCheckOnAnyInteraction: true } },
  { min: 100, max: 100, value: { effect: 'Makes Midnight Tears (automatically has a 3 month ROMG)', dc: 20 } },
];
