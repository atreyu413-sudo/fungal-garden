// Unified time system. The thesis tracks weekly ROMG, monthly RTFM, dawn-based
// breeding, and spell-based acceleration as separate clocks. The engine
// collapses all of it to one incrementing `campaignDay` counter (see
// Garden.campaignDay in types.ts); everything else is derived.

export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 30; // thesis does not define a calendar; flat 30-day month assumed

/** Convert a Rates-style {rtfmValue, rtfmUnit} pair (see the original PDF tables)
 * into a flat day count for storage on Species.physical/rates. */
export function toDays(value: number, unit: 'days' | 'weeks' | 'months'): number {
  switch (unit) {
    case 'days':
      return value;
    case 'weeks':
      return value * DAYS_PER_WEEK;
    case 'months':
      return value * DAYS_PER_MONTH;
  }
}

export function isDawn(_campaignDay: number): boolean {
  // One breeding opportunity per day boundary; "dawn" = start of each new day.
  return true; // every campaignDay increment IS a dawn in this model
}

export function isWeekComplete(myceliumAgeDays: number, romgDays: number): boolean {
  return myceliumAgeDays > 0 && myceliumAgeDays % romgDays === 0;
}

export function isMaturityReached(maturityAgeDays: number, rtfmDays: number): boolean {
  return maturityAgeDays >= rtfmDays;
}

/**
 * Plant Growth acceleration (thesis §Growth Management):
 *  - 1-action casting = 1 month of healthy-growth progress (30 days)
 *  - 8-hour casting = 1 year of healthy-growth progress (365 days)
 * Applies to ROMG, RTFM, unburdened-mycelium-movement, and MES/hybrid-spore
 * accumulation uniformly since all of those now derive from campaignDay.
 */
export function plantGrowthAdvanceDays(castingType: 'action' | 'eightHour'): number {
  return castingType === 'action' ? 30 : 365;
}

/** Ecosystem RTFM halt (Swampsworn Shellstump damage state) auto-resumes after
 * 1 week if left unharmed. */
export const ECOSYSTEM_AUTO_RESUME_DAYS = DAYS_PER_WEEK;

/** Harvested-product effective windows, converted to days for HarvestedItem.expiresDay. */
export const PREP_METHOD_EXPIRY_DAYS: Record<'save' | 'tea' | 'powder', number> = {
  save: 1 / 24, // 1 hour
  tea: 1, // 24 hours
  powder: 7, // 1 week
};
