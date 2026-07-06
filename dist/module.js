var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const MODULE_ID = "fungal-garden";
const FLAG_KEY = "data";
class SeededRng {
  constructor(seed) {
    __publicField(this, "state");
    this.state = seed >>> 0;
  }
  /** Next float in [0, 1). */
  next() {
    this.state = this.state + 1831565813 >>> 0;
    let t = this.state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Roll a single die with `sides` faces (1..sides). */
  die(sides) {
    return this.int(1, sides);
  }
  /** Coin flip. */
  coin() {
    return this.next() < 0.5 ? "heads" : "tails";
  }
  /** Pick a uniformly random element. */
  pick(items) {
    if (items.length === 0) throw new Error("pick() from empty array");
    return items[this.int(0, items.length - 1)];
  }
}
function deriveSeed(base, ...coords) {
  let h = base >>> 0;
  for (const c of coords) {
    h = (h ^ c >>> 0) >>> 0;
    h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
  }
  return h >>> 0;
}
function rngFor(base, ...coords) {
  return new SeededRng(deriveSeed(base, ...coords));
}
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
function toDays(value, unit) {
  switch (unit) {
    case "days":
      return value;
    case "weeks":
      return value * DAYS_PER_WEEK;
    case "months":
      return value * DAYS_PER_MONTH;
  }
}
const DICE_RE = /^(\d*)d(\d+)$/i;
const INT_RE = /^-?\d+$/;
function rollFormula(formula, rng, vars = {}) {
  const tokens = tokenize(formula);
  let acc = evalTerm(tokens[0], rng, vars);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const rhs = evalTerm(tokens[i + 1], rng, vars);
    if (op === "+") acc += rhs;
    else if (op === "/") acc /= rhs;
    else throw new Error(`Unsupported operator "${op}" in formula "${formula}"`);
  }
  return acc;
}
function rollDice(expr, rng) {
  const m = DICE_RE.exec(expr.trim());
  if (!m) throw new Error(`Not a dice expression: "${expr}"`);
  const count = m[1] === "" ? 1 : parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  let total = 0;
  for (let i = 0; i < count; i++) total += rng.die(sides);
  return total;
}
function tokenize(formula) {
  return formula.split(/\s*([+/])\s*/).map((t) => t.trim()).filter((t) => t.length > 0);
}
function evalTerm(token, rng, vars) {
  if (DICE_RE.test(token)) return rollDice(token, rng);
  if (INT_RE.test(token)) return parseInt(token, 10);
  if (token in vars) return vars[token];
  throw new Error(`Unknown term "${token}" (not dice, integer, or a known variable)`);
}
function applyRounding(value, rounding) {
  if (rounding === "up") return Math.ceil(value);
  if (rounding === "down") return Math.floor(value);
  return Math.round(value);
}
const table$1 = [{ "min": 1, "max": 5, "value": "Black" }, { "min": 6, "max": 10, "value": "Brown" }, { "min": 11, "max": 15, "value": "White" }, { "min": 16, "max": 18, "value": "Orange" }, { "min": 19, "max": 23, "value": "Brown" }, { "min": 24, "max": 26, "value": "Green" }, { "min": 27, "max": 31, "value": "White" }, { "min": 32, "max": 36, "value": "Brown" }, { "min": 37, "max": 41, "value": "Blue" }, { "min": 42, "max": 46, "value": "Brown" }, { "min": 47, "max": 51, "value": "Red" }, { "min": 52, "max": 56, "value": "Yellow" }, { "min": 57, "max": 61, "value": "Brown" }, { "min": 62, "max": 64, "value": "Indigo" }, { "min": 65, "max": 69, "value": "Brown" }, { "min": 70, "max": 74, "value": "White" }, { "min": 75, "max": 77, "value": "Violet" }, { "min": 78, "max": 80, "value": "Brown" }, { "min": 81, "max": 85, "value": "Pink" }, { "min": 86, "max": 90, "value": "Grey" }, { "min": 91, "max": 95, "value": "Brown" }, { "min": 96, "max": 100, "value": "Black" }];
const colorsJson = {
  table: table$1
};
const table = [{ "min": 1, "max": 10, "value": "Holed" }, { "min": 11, "max": 20, "value": "No Pattern" }, { "min": 21, "max": 30, "value": "Ringed/Striped White" }, { "min": 31, "max": 40, "value": "No Pattern" }, { "min": 41, "max": 50, "value": "Ringed/Striped Black" }, { "min": 51, "max": 60, "value": "No Pattern" }, { "min": 61, "max": 70, "value": "Spotted White" }, { "min": 71, "max": 80, "value": "No Pattern" }, { "min": 81, "max": 90, "value": "Spotted Black" }, { "min": 91, "max": 100, "value": "No Pattern" }];
const families = { "Holed": { "includes": ["Holed"] }, "No Pattern": { "includes": [] }, "Ringed/Striped White": { "includes": ["Ringed/Striped", "Ringed", "White"] }, "Ringed/Striped Black": { "includes": ["Ringed/Striped", "Ringed", "Black"] }, "Spotted White": { "includes": ["Spotted", "White"] }, "Spotted Black": { "includes": ["Spotted", "Black"] } };
const patternsJson = {
  table,
  families
};
const fungalTypeTable = { "table": [{ "min": 1, "max": 4, "value": "toadstool" }, { "min": 5, "max": 5, "value": "shelfToadstool" }, { "min": 6, "max": 8, "value": "mold" }, { "min": 9, "max": 10, "value": "mushroom" }] };
const types$1 = { "toadstool": { "displayName": "Traditionally Shaped Toadstool", "shape": { "form": "capped", "base": "round volva", "growth": "stem grows straight up into a cap wider than the base", "canGrowDiagonal": true }, "dimensions": { "optimumVolvaDiameter": { "formula": "d8", "rounding": "down", "unit": "hexes" }, "optimumStemHeight": { "formula": "8d4", "unit": "hexes" }, "optimumCapDiameter": { "formula": "volvaDiameter + d12", "unit": "hexes", "derivedFrom": "volvaDiameter" }, "optimumCapHeight": { "formula": "2d12", "rounding": "up", "unit": "hexes" } }, "rates": { "rtfm": { "formula": "d6", "unit": "months" }, "mruom": { "formula": "2d4", "unit": "hexes" }, "romg": { "formula": "d8", "unit": "weeks" } }, "totalHeight": "stemHeight + capHeight" }, "shelfToadstool": { "displayName": "Shelf Toadstool", "shape": { "form": "shelf", "base": "cap grows directly out of the shell as a horizontal semicircle", "growth": "base length = cap diameter; height = cap radius", "canGrowDiagonal": false }, "dimensions": { "optimumCapDiameter": { "formula": "2d10", "unit": "hexes" }, "optimumCapHeight": { "formula": "capDiameter / 2", "rounding": "up", "unit": "hexes", "derivedFrom": "capDiameter" } }, "rates": { "rtfm": { "formula": "d6", "unit": "months" }, "mruom": { "formula": "3d4", "unit": "hexes" }, "romg": { "formula": "d8", "unit": "weeks" } }, "totalHeight": "capHeight" }, "mold": { "displayName": "Mold", "shape": { "form": "column", "base": "grows straight up, uniform width base-to-top", "growth": "uniform column", "canGrowDiagonal": true }, "dimensions": { "optimumHeight": { "formula": "d4", "rounding": "down", "unit": "hexes" } }, "rates": { "rtfm": { "formula": "d4", "unit": "weeks" }, "mruom": { "formula": "5d4", "unit": "hexes" }, "romg": { "formula": "d4", "unit": "weeks" } }, "totalHeight": "moldHeight", "notes": "Default opaque (transparency not rolled) unless a poison special product forces transparency. Begins RTFM with only 1 mycelium unit + shade; fully matured only at MRUOM; harvestable area = MRUOM. Produces 1 spore/MES per growth regardless of size." }, "mushroom": { "displayName": "Mushroom", "shape": { "form": "capped", "base": "round volva", "growth": "stem grows straight up into a cap wider than the base", "canGrowDiagonal": true }, "dimensions": { "optimumVolvaDiameter": { "formula": "d6", "rounding": "down", "unit": "hexes" }, "optimumStemHeight": { "formula": "3d4", "unit": "hexes" }, "optimumCapDiameter": { "formula": "volvaDiameter + d8", "unit": "hexes", "derivedFrom": "volvaDiameter" }, "optimumCapHeight": { "formula": "4d4", "unit": "hexes" } }, "rates": { "rtfm": { "formula": "d6", "unit": "months" }, "mruom": { "formula": "2d4", "unit": "hexes" }, "romg": { "formula": "d8", "unit": "weeks" } }, "totalHeight": "stemHeight + capHeight", "notes": "Always edible; no function roll (see functions.json). No transparency-forced exceptions." } };
const appearance = { "bioluminescence": { "table": [{ "min": 1, "max": 24, "value": false }, { "min": 25, "max": 25, "value": true }, { "min": 26, "max": 49, "value": false }, { "min": 50, "max": 50, "value": true }, { "min": 51, "max": 74, "value": false }, { "min": 75, "max": 75, "value": true }, { "min": 76, "max": 99, "value": false }, { "min": 100, "max": 100, "value": true }] }, "transparency": { "table": [{ "min": 1, "max": 45, "value": false }, { "min": 46, "max": 55, "value": true }, { "min": 56, "max": 100, "value": false }] } };
const typesJson = {
  fungalTypeTable,
  types: types$1,
  appearance
};
const odor = { "table": [{ "min": 1, "max": 3, "value": "Foul Stench" }, { "min": 4, "max": 9, "value": "Musky" }, { "min": 10, "max": 17, "value": "No Scent" }, { "min": 18, "max": 19, "value": "Lightly Sweet" }, { "min": 20, "max": 20, "value": "Smells Delectable" }] };
const flavorIntensity = { "table": [{ "min": 1, "max": 1, "value": "Very Faint" }, { "min": 2, "max": 2, "value": "Mild" }, { "min": 3, "max": 3, "value": "Noticeable" }, { "min": 4, "max": 4, "value": "Rich" }, { "min": 5, "max": 5, "value": "Strong" }, { "min": 6, "max": 6, "value": "Overpowering" }], "ordinal": ["Very Faint", "Mild", "Noticeable", "Rich", "Strong", "Overpowering"] };
const flavor = { "table": [{ "min": 1, "max": 1, "value": "Bitter" }, { "min": 2, "max": 2, "value": "Spicy" }, { "min": 3, "max": 3, "value": "Bitter" }, { "min": 4, "max": 4, "value": "Tart" }, { "min": 5, "max": 5, "value": "Bitter" }, { "min": 6, "max": 6, "value": "Earthy" }, { "min": 7, "max": 7, "value": "Bitter" }, { "min": 8, "max": 8, "value": "Nutty" }, { "min": 9, "max": 9, "value": "Bitter" }, { "min": 10, "max": 10, "value": "No Flavor" }, { "min": 11, "max": 11, "value": "Savory" }, { "min": 12, "max": 12, "value": "Minty" }, { "min": 13, "max": 13, "value": "Savory" }, { "min": 14, "max": 14, "value": "Floral" }, { "min": 15, "max": 15, "value": "Savory" }, { "min": 16, "max": 16, "value": "Fruity" }, { "min": 17, "max": 17, "value": "Savory" }, { "min": 18, "max": 18, "value": "Maple-Like" }, { "min": 19, "max": 19, "value": "Savory" }, { "min": 20, "max": 20, "value": "Chocolatey" }] };
const functionType = { "toadstool": [{ "min": 1, "max": 1, "value": "poison" }, { "min": 2, "max": 2, "value": "healing" }, { "min": 3, "max": 3, "value": "poison" }, { "min": 4, "max": 4, "value": "healing" }, { "min": 5, "max": 5, "value": "sporeVirility" }, { "min": 6, "max": 6, "value": "sporeVirility" }, { "min": 7, "max": 7, "value": "poison" }, { "min": 8, "max": 8, "value": "healing" }, { "min": 9, "max": 9, "value": "poison" }, { "min": 10, "max": 10, "value": "healing" }], "mold": [{ "min": 1, "max": 1, "value": "poison" }, { "min": 2, "max": 2, "value": "healing" }, { "min": 3, "max": 3, "value": "poison" }, { "min": 4, "max": 4, "value": "sporeVirility" }, { "min": 5, "max": 5, "value": "poison" }, { "min": 6, "max": 6, "value": "healing" }, { "min": 7, "max": 7, "value": "poison" }, { "min": 8, "max": 8, "value": "sporeVirility" }, { "min": 9, "max": 9, "value": "poison" }, { "min": 10, "max": 10, "value": "healing" }] };
const sporeVirility = { "sporesPerMinute": { "moldPerGrowth": 1 } };
const healing = { "toadstool": { "table": [{ "min": 1, "max": 7, "value": { "effect": "Heals 1D4 Hit Points", "prepMethod": "tea", "dc": 14 } }, { "min": 8, "max": 14, "value": { "effect": "Heals 1D6 Hit Points", "prepMethod": "tea", "dc": 14 } }, { "min": 15, "max": 20, "value": { "effect": "Heals 1D8 Hit Points", "prepMethod": "tea", "dc": 14 } }, { "min": 21, "max": 25, "value": { "effect": "Heals 2D4 Hit Points", "prepMethod": "tea", "dc": 16 } }, { "min": 26, "max": 30, "value": { "effect": "Heals 1D10 Hit Points", "prepMethod": "tea", "dc": 16 } }, { "min": 31, "max": 35, "value": { "effect": "Heals 1D12 Hit Points", "prepMethod": "tea", "dc": 16 } }, { "min": 36, "max": 37, "value": { "effect": "Heals 2D6 Hit Points", "prepMethod": "tea", "dc": 18 } }, { "min": 38, "max": 39, "value": { "effect": "Heals 3D4 Hit Points", "prepMethod": "tea", "dc": 18 } }, { "min": 40, "max": 41, "value": { "effect": "Heals 2D8 Hit Points", "prepMethod": "tea", "dc": 18 } }, { "min": 42, "max": 43, "value": { "effect": "Heals 3D6 Hit Points", "prepMethod": "tea", "dc": 18 } }, { "min": 44, "max": 45, "value": { "effect": "Heals 2D10 Hit Points", "prepMethod": "tea", "dc": 18 } }, { "min": 46, "max": 47, "value": { "effect": "Heals 2D12 Hit Points", "prepMethod": "tea", "dc": 18 } }, { "min": 48, "max": 48, "value": { "effect": "Heals 3D8 Hit Points", "prepMethod": "tea", "dc": 20 } }, { "min": 49, "max": 49, "value": { "effect": "Heals 3D10 Hit Points", "prepMethod": "tea", "dc": 20 } }, { "min": 50, "max": 50, "value": { "effect": "Heals 3D12 Hit Points", "prepMethod": "tea", "dc": 20 } }, { "min": 51, "max": 54, "value": { "effect": "Cures Blinded Condition", "prepMethod": "save", "dc": 16 } }, { "min": 55, "max": 58, "value": { "effect": "Cures Charmed Condition", "prepMethod": "tea", "dc": 16 } }, { "min": 59, "max": 62, "value": { "effect": "Cures Deafened Condition", "prepMethod": "powder", "dc": 16 } }, { "min": 63, "max": 64, "value": { "effect": "Cures Frightened Condition", "prepMethod": "tea", "dc": 16 } }, { "min": 65, "max": 66, "value": { "effect": "Cures Frightened Condition", "prepMethod": "powder", "dc": 16 } }, { "min": 67, "max": 70, "value": { "effect": "Cures Incapacitated Condition", "prepMethod": "tea", "dc": 16 } }, { "min": 71, "max": 72, "value": { "effect": "Cures Paralyzed Condition", "prepMethod": "save", "dc": 16 } }, { "min": 73, "max": 74, "value": { "effect": "Cures Paralyzed Condition", "prepMethod": "powder", "dc": 16 } }, { "min": 75, "max": 78, "value": { "effect": "Cures Petrified Condition", "prepMethod": "save", "dc": 16 } }, { "min": 79, "max": 80, "value": { "effect": "Cures Poisoned Condition", "prepMethod": "tea", "dc": 16 } }, { "min": 81, "max": 82, "value": { "effect": "Cures Poisoned Condition", "prepMethod": "save", "dc": 16 } }, { "min": 83, "max": 86, "value": { "effect": "Cures Stunned Condition", "prepMethod": "tea", "dc": 16 } }, { "min": 87, "max": 90, "value": { "effect": "Cures Unconscious Condition", "prepMethod": "powder", "dc": 16 } }, { "min": 91, "max": 100, "value": { "effect": "Cures One Point Of Exhaustion", "prepMethod": "tea", "dc": 16 } }] }, "mold": { "table": [{ "min": 1, "max": 3, "value": { "effect": "Cures Frightened Condition", "prepMethod": "powder", "dc": 16 } }, { "min": 4, "max": 5, "value": { "effect": "Cures Deafened Condition", "prepMethod": "powder", "dc": 16 } }, { "min": 6, "max": 7, "value": { "effect": "Cures Paralyzed Condition", "prepMethod": "save", "dc": 16 } }, { "min": 8, "max": 10, "value": { "effect": "Cures Poisoned Condition", "prepMethod": "save", "dc": 16 } }, { "min": 11, "max": 12, "value": { "effect": "Cures Paralyzed Condition", "prepMethod": "powder", "dc": 16 } }, { "min": 13, "max": 15, "value": { "effect": "Cures Blinded Condition", "prepMethod": "save", "dc": 16 } }, { "min": 16, "max": 18, "value": { "effect": "Cures Unconscious Condition", "prepMethod": "powder", "dc": 16 } }, { "min": 19, "max": 20, "value": { "effect": "Cures Petrified Condition", "prepMethod": "save", "dc": 16 } }] } };
const poison = { "table": [{ "min": 1, "max": 9, "value": { "effect": "Poisoned Condition for 1 Minute upon Contact", "dc": 16, "requiresCheckOnAnyInteraction": true } }, { "min": 10, "max": 16, "value": { "effect": "Makes Assassin's Blood", "dc": 17, "override": { "color": "Red" } } }, { "min": 17, "max": 19, "value": { "effect": "Poisoned Condition for 1 Minute when Inhaled", "dc": 16 } }, { "min": 20, "max": 26, "value": { "effect": "Makes Truth Serum", "dc": 17 } }, { "min": 27, "max": 29, "value": { "effect": "Poisoned Condition for 1 Minute when Ingested", "dc": 16 } }, { "min": 30, "max": 36, "value": { "effect": "Makes Drow Poison", "dc": 17, "override": { "requiresShade": true } } }, { "min": 37, "max": 39, "value": { "effect": "Poisoned Condition for 1 Minute upon Contact", "dc": 16, "requiresCheckOnAnyInteraction": true } }, { "min": 40, "max": 43, "value": { "effect": "Makes Malice", "dc": 18 } }, { "min": 44, "max": 49, "value": { "effect": "Poisoned Condition for 1 Minute when Inhaled", "dc": 16 } }, { "min": 50, "max": 53, "value": { "effect": "Makes Pale Tincture", "dc": 18, "override": { "color": "White" } } }, { "min": 54, "max": 59, "value": { "effect": "Poisoned Condition for 1 Minute when Ingested", "dc": 16 } }, { "min": 60, "max": 63, "value": { "effect": "Makes Essence Of Ether", "dc": 18, "override": { "transparent": true } } }, { "min": 64, "max": 69, "value": { "effect": "Poisoned Condition for 1 Minute upon Contact", "dc": 16, "requiresCheckOnAnyInteraction": true } }, { "min": 70, "max": 72, "value": { "effect": "IS Taggit (makes Oil Of Taggit)", "dc": 19 } }, { "min": 73, "max": 79, "value": { "effect": "Poisoned Condition for 1 Minute when Inhaled", "dc": 16 } }, { "min": 80, "max": 82, "value": { "effect": "IS Othur (makes Burnt Othur Fumes)", "dc": 19 } }, { "min": 83, "max": 89, "value": { "effect": "Poisoned Condition for 1 Minute when Ingested", "dc": 16 } }, { "min": 90, "max": 91, "value": { "effect": "Makes Torpor", "dc": 19 } }, { "min": 92, "max": 99, "value": { "effect": "Poisoned Condition for 1 Minute upon Contact", "dc": 16, "requiresCheckOnAnyInteraction": true } }, { "min": 100, "max": 100, "value": { "effect": "Makes Midnight Tears", "dc": 20, "override": { "romgMonths": 3 } } }] };
const functionsJson = {
  odor,
  flavorIntensity,
  flavor,
  functionType,
  sporeVirility,
  healing,
  poison
};
const rules = [{ "id": "tallGrowthNeedsEdibleNeighbor", "trigger": { "heightUnits": { "gt": 35 } }, "restriction": { "canMature": false }, "effect": { "unless": { "requiresEdibleNeighbor": true } }, "appliesAt": "rtfmInitiation" }, { "id": "shortToadstoolNeedsShade", "trigger": { "fungalType": "toadstool", "heightUnits": { "lt": 20 } }, "restriction": { "requiresShade": true }, "appliesAt": "rtfmInitiation" }, { "id": "veryTallNeedsTripleContact", "trigger": { "heightUnits": { "gt": 50 } }, "restriction": { "canMature": false }, "effect": { "unless": { "minMyceliumContactPoints": 3 } }, "appliesAt": "rtfmInitiation" }, { "id": "shelfCollapseUnsupported", "trigger": { "fungalType": "shelfToadstool", "stage": "mature", "heightUnits": { "gt": 12 } }, "effect": { "collapse": { "unless": { "maturedGrowthAdjacentAtShellBottomEdge": true } } }, "appliesAt": "mature" }, { "id": "tallGrowthNoHealing", "trigger": { "heightUnits": { "gt": 40 } }, "restriction": { "canHaveFunction": ["poison", "sporeVirility", "edible"] }, "appliesAt": "generation" }, { "id": "greyToadstoolMusky", "trigger": { "fungalType": "toadstool", "color": "Grey", "heightUnits": { "lt": 10 } }, "effect": { "forcesOdor": "Musky" }, "appliesAt": "generation" }, { "id": "noEdgeGrowth", "trigger": { "or": [{ "fungalType": "mold" }, { "pattern": { "includes": "Holed" } }] }, "restriction": { "cannotTouchEdge": true }, "appliesAt": "everyRomgCycle" }, { "id": "ringedVsSpotted", "trigger": { "pattern": { "includes": "Ringed/Striped" } }, "restriction": { "cannotTouchPattern": "Spotted" }, "appliesAt": "everyRomgCycle" }, { "id": "blackPatternMushroomContact", "trigger": { "fungalType": "mushroom", "pattern": { "includes": "Black" } }, "restriction": { "requiresWhiteNeighbor": true }, "appliesAt": "rtfmInitiation" }, { "id": "spottedToadstoolDoubleContact", "trigger": { "fungalType": "toadstool", "pattern": { "includes": "Spotted" } }, "restriction": { "requiresNonBrownContact": 2 }, "appliesAt": "rtfmInitiation" }, { "id": "whiteRingedPoisonous", "trigger": { "color": "White", "pattern": { "includes": "Ringed/Striped" } }, "effect": { "forcesPoisonous": true }, "appliesAt": "generation" }, { "id": "holedCannotTouch", "trigger": { "pattern": { "includes": "Holed" } }, "restriction": { "cannotTouchPattern": "Holed" }, "appliesAt": "everyRomgCycle" }, { "id": "blackSpottedShelfPoisonous", "trigger": { "fungalType": "shelfToadstool", "pattern": "Spotted Black" }, "effect": { "forcesPoisonous": true }, "appliesAt": "generation" }, { "id": "ringedBoostsGrowth", "trigger": { "pattern": { "includes": "Ringed" }, "myceliumContactPoints": { "gt": 3 } }, "effect": { "forcesRtfmInitiation": true }, "appliesAt": "rtfmInitiation", "note": "Per D17: satisfies the colony's contact/neighbor initiation gates (not the physical volva-fill requirement)." }, { "id": "mixedPatternAdjacencyBoost", "trigger": { "adjacentDistinctPatternCount": { "gte": 2 } }, "effect": { "myceliumBonus": 1 }, "appliesAt": "everyRomgCycle" }, { "id": "patternedMoldFoulSmell", "trigger": { "fungalType": "mold", "pattern": { "not": "No Pattern" } }, "effect": { "forcesOdor": "Foul Stench" }, "appliesAt": "generation" }, { "id": "blackToadstoolNeedsShade", "trigger": { "fungalType": "toadstool", "color": "Black" }, "restriction": { "requiresShade": true }, "appliesAt": "rtfmInitiation" }, { "id": "primaryColorMushroomContact", "trigger": { "fungalType": "mushroom", "color": { "in": ["Red", "Blue", "Yellow"] } }, "restriction": { "requiresBrownOrMonochromeContact": true }, "appliesAt": "rtfmInitiation" }, { "id": "yellowOrangeShelfEdible", "trigger": { "fungalType": "shelfToadstool", "color": { "in": ["Yellow", "Orange"] } }, "effect": { "forcesEdible": true }, "appliesAt": "generation" }, { "id": "indigoPoisonous", "trigger": { "color": "Indigo" }, "effect": { "forcesPoisonous": true }, "appliesAt": "generation" }, { "id": "violetWhiteYellowToadstoolMultiColony", "trigger": { "fungalType": "toadstool", "color": { "in": ["Violet", "White", "Yellow"] } }, "restriction": { "requiresSeparateColonies": 2 }, "appliesAt": "rtfmInitiation" }, { "id": "blueMoldEdible", "trigger": { "fungalType": "mold", "color": "Blue" }, "effect": { "forcesEdible": true }, "appliesAt": "generation" }, { "id": "chromaticShelfVsGreyMold", "trigger": { "fungalType": "shelfToadstool", "color": { "notIn": ["Brown", "Black", "White", "Grey"] } }, "restriction": { "cannotTouchColor": "Grey", "cannotTouchFungalType": "mold" }, "appliesAt": "everyRomgCycle" }, { "id": "whiteMoldExclusion", "trigger": { "fungalType": "mold", "color": "White" }, "restriction": { "cannotTouchColor": ["Pink", "Grey", "Blue"] }, "appliesAt": "everyRomgCycle" }, { "id": "redToadstoolDoubleBrownContact", "trigger": { "fungalType": "toadstool", "color": "Red" }, "restriction": { "requiresBrownContact": 2 }, "appliesAt": "rtfmInitiation" }, { "id": "greyNeverBioluminescent", "trigger": { "color": "Grey" }, "restriction": { "forcesBioluminescence": false }, "appliesAt": "generation", "precedence": "absolute" }, { "id": "greenBlackPatternPoisonous", "trigger": { "color": "Green", "pattern": { "includes": "Black" } }, "effect": { "forcesPoisonous": true }, "appliesAt": "generation" }, { "id": "orangeMoldNeedsEdibleContact", "trigger": { "fungalType": "mold", "color": "Orange" }, "restriction": { "requiresEdibleNeighbor": true }, "appliesAt": "rtfmInitiation" }, { "id": "brownIgnoresShade", "trigger": { "color": "Brown" }, "effect": { "requiresShade": false, "overridesAllShadeRules": true }, "appliesAt": "generation" }, { "id": "violetShrinksNearWhite", "trigger": { "color": "Violet", "adjacentToWhiteMycelium": true, "fungalType": { "not": "mold" } }, "effect": { "heightPenalty": 1, "appliesTo": "allDimensions" }, "appliesAt": "everyRomgCycle" }, { "id": "violetMushroomSavory", "trigger": { "fungalType": "mushroom", "color": "Violet" }, "effect": { "forcesFlavor": "Savory", "forcesFlavorIntensity": "Rich" }, "appliesAt": "generation" }, { "id": "tartAlwaysOverpowering", "trigger": { "flavor": "Tart" }, "effect": { "forcesFlavorIntensity": "Overpowering" }, "appliesAt": "generation", "precedence": "absolute" }, { "id": "bioluminescentNoScent", "trigger": { "bioluminescent": true }, "effect": { "forcesOdor": "No Scent" }, "appliesAt": "generation" }];
const sensitivitiesJson = {
  rules
};
const time = { "ecosystemAutoResumeDays": 7, "prepMethodExpiryDays": { "save": 0.0417, "tea": 1, "powder": 7 } };
const growthRulesJson = {
  time
};
const reverseCauseIndex = { "functions": { "poison": [{ "source": "whiteRingedPoisonous", "traits": { "color": "White", "pattern": { "includes": "Ringed/Striped" } } }, { "source": "blackSpottedShelfPoisonous", "traits": { "fungalType": "shelfToadstool", "pattern": "Spotted Black" } }, { "source": "indigoPoisonous", "traits": { "color": "Indigo" } }, { "source": "greenBlackPatternPoisonous", "traits": { "color": "Green", "pattern": { "includes": "Black" } } }, { "source": "functionRoll", "table": "functions.functionType", "appliesTo": ["toadstool", "mold"] }], "edible": [{ "source": "mushroomAlwaysEdible", "traits": { "fungalType": "mushroom" } }, { "source": "yellowOrangeShelfEdible", "traits": { "fungalType": "shelfToadstool", "color": { "in": ["Yellow", "Orange"] } } }, { "source": "blueMoldEdible", "traits": { "fungalType": "mold", "color": "Blue" } }], "healing": [{ "source": "functionRoll", "table": "functions.functionType", "appliesTo": ["toadstool", "mold"], "excludedWhen": { "heightUnits": { "gt": 40 } } }], "sporeVirility": [{ "source": "functionRoll", "table": "functions.functionType", "appliesTo": ["toadstool", "mold"] }] } };
const breedingRulesJson = {
  reverseCauseIndex
};
function lookup(table2, roll) {
  const hit = table2.find((e) => roll >= e.min && roll <= e.max);
  if (!hit) throw new Error(`No table entry covers roll ${roll}`);
  return hit.value;
}
const colors = colorsJson;
const patterns = patternsJson;
const types = typesJson;
const functions = functionsJson;
const sensitivities = sensitivitiesJson;
const growthRules = growthRulesJson;
const breedingRules = breedingRulesJson;
function patternIncludes(pattern, needle) {
  const fam = patterns.families[pattern];
  if (fam) return fam.includes.includes(needle);
  return pattern.includes(needle);
}
const COLONY_OPERANDS = /* @__PURE__ */ new Set([
  "stage",
  "myceliumContactPoints",
  "adjacentDistinctPatternCount",
  "adjacentToWhiteMycelium",
  "edgeAdjacent"
]);
function evaluateTrigger(trigger, ctx, lenient = false) {
  for (const [key, operand] of Object.entries(trigger)) {
    if (key === "or") {
      const subs = operand;
      if (!subs.some((s) => evaluateTrigger(s, ctx, lenient))) return false;
      continue;
    }
    if (key === "and") {
      const subs = operand;
      if (!subs.every((s) => evaluateTrigger(s, ctx, lenient))) return false;
      continue;
    }
    if (!matchField(key, operand, ctx, lenient)) return false;
  }
  return true;
}
function matchField(field, operand, ctx, lenient) {
  const actual = ctx[field];
  if (actual === void 0) {
    return lenient && COLONY_OPERANDS.has(field);
  }
  if (operand !== null && typeof operand === "object") {
    const cmp = operand;
    for (const [op, val] of Object.entries(cmp)) {
      if (!matchComparator(field, actual, op, val)) return false;
    }
    return true;
  }
  return actual === operand;
}
function matchComparator(field, actual, op, val) {
  switch (op) {
    case "gt":
      return typeof actual === "number" && actual > val;
    case "gte":
      return typeof actual === "number" && actual >= val;
    case "lt":
      return typeof actual === "number" && actual < val;
    case "lte":
      return typeof actual === "number" && actual <= val;
    case "eq":
      return actual === val;
    case "not":
      return actual !== val;
    case "in":
      return val.includes(actual);
    case "notIn":
      return !val.includes(actual);
    case "includes":
      if (field === "pattern" && typeof actual === "string") {
        return patternIncludes(actual, val);
      }
      return typeof actual === "string" && actual.includes(val);
    default:
      throw new Error(`Unknown comparator "${op}"`);
  }
}
function matchingRules(ctx) {
  return sensitivities.rules.filter((r) => evaluateTrigger(r.trigger, ctx, true));
}
function firingRules(ctx, phase) {
  return sensitivities.rules.filter(
    (r) => r.appliesAt === phase && evaluateTrigger(r.trigger, ctx, false)
  );
}
function idFromRng(rng) {
  const hex = () => rng.int(0, 65535).toString(16).padStart(4, "0");
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}
function stripOptimum(key) {
  const s = key.replace(/^optimum/, "");
  return s.charAt(0).toLowerCase() + s.slice(1);
}
function rollDimensions(def, rng) {
  const vars = {};
  const dims = {};
  for (const [key, field] of Object.entries(def.dimensions)) {
    const raw = rollFormula(field.formula, rng, vars);
    const value = applyRounding(raw, field.rounding);
    const name = stripOptimum(key);
    vars[name] = value;
    switch (name) {
      case "volvaDiameter":
        dims.volvaDiameter = value;
        break;
      case "stemHeight":
        dims.stemHeight = value;
        break;
      case "capDiameter":
        dims.capDiameter = value;
        break;
      case "capHeight":
        dims.capHeight = value;
        break;
      case "height":
        dims.moldHeight = value;
        break;
    }
  }
  return dims;
}
function rollRates(def, rng) {
  const rtfm = rollFormula(def.rates.rtfm.formula, rng);
  const mruom = rollFormula(def.rates.mruom.formula, rng);
  const romg = rollFormula(def.rates.romg.formula, rng);
  return {
    rtfmDays: toDays(rtfm, def.rates.rtfm.unit),
    mruom,
    romgDays: toDays(romg, def.rates.romg.unit)
  };
}
function computeHeightUnits(totalHeightExpr, dims) {
  const map = {
    stemHeight: dims.stemHeight ?? 0,
    capHeight: dims.capHeight ?? 0,
    moldHeight: dims.moldHeight ?? 0
  };
  return totalHeightExpr.split("+").map((t) => map[t.trim()] ?? 0).reduce((a, b) => a + b, 0);
}
function rollFunction(fungalType, rng) {
  if (fungalType === "mushroom") {
    return { category: "edible", traits: { category: "edible" } };
  }
  const funcTable = fungalType === "mold" ? functions.functionType.mold : functions.functionType.toadstool;
  const category = lookup(funcTable, rng.die(10));
  return materializeFunction(category, fungalType, rng);
}
function materializeFunction(category, fungalType, rng) {
  if (category === "edible" || fungalType === "mushroom") {
    return { category: "edible", traits: { category: "edible" } };
  }
  if (category === "poison") {
    const poison2 = lookup(functions.poison.table, rng.die(100));
    return {
      category,
      traits: {
        category,
        poison: {
          effect: poison2.effect,
          dc: poison2.dc,
          requiresCheckOnAnyInteraction: poison2.requiresCheckOnAnyInteraction
        }
      },
      override: poison2.override
    };
  }
  if (category === "healing") {
    const healTable = fungalType === "mold" ? functions.healing.mold.table : functions.healing.toadstool.table;
    const heal = lookup(healTable, rng.die(fungalType === "mold" ? 20 : 100));
    return { category, traits: { category, healing: { effect: heal.effect, prepMethod: heal.prepMethod, dc: heal.dc } } };
  }
  const spm = functions.sporeVirility.sporesPerMinute;
  const sporesPerMinute = fungalType === "mold" ? spm.moldPerGrowth : rng.die(4);
  return { category, traits: { category, sporeVirility: { sporesPerMinute } } };
}
function generateWildSpecies(rng, opts = {}) {
  const id = idFromRng(rng);
  const fungalType = opts.fungalType ?? lookup(types.fungalTypeTable.table, rng.die(10));
  const def = types.types[fungalType];
  const dimensions = rollDimensions(def, rng);
  const rates = rollRates(def, rng);
  let color = lookup(colors.table, rng.die(100));
  let pattern = lookup(patterns.table, rng.die(100));
  let bioluminescent = lookup(types.appearance.bioluminescence.table, rng.die(100));
  let transparent = fungalType === "mold" ? false : lookup(types.appearance.transparency.table, rng.die(100));
  let odor2 = lookup(functions.odor.table, rng.die(20));
  let flavor1 = lookup(functions.flavor.table, rng.die(20));
  let intensity = intensityToNumber(lookup(functions.flavorIntensity.table, rng.die(6)));
  const fn = rollFunction(fungalType, rng);
  const func = fn.traits;
  if (fn.override) {
    if (fn.override.color) color = fn.override.color;
    if (fn.override.transparent !== void 0) transparent = fn.override.transparent;
    if (fn.override.romgMonths !== void 0) rates.romgDays = toDays(fn.override.romgMonths, "months");
  }
  const heightUnits = computeHeightUnits(def.totalHeight, dimensions);
  const staticCtx = {
    fungalType,
    color,
    pattern,
    bioluminescent,
    transparent,
    heightUnits,
    edible: func.category === "edible",
    flavor: flavor1
  };
  const genRules = firingRules(staticCtx, "generation");
  const ordered = [...genRules].sort((a, b) => (a.precedence === "absolute" ? 1 : 0) - (b.precedence === "absolute" ? 1 : 0));
  for (const rule of ordered) {
    const e = rule.effect ?? {};
    const r = rule.restriction ?? {};
    if (e.forcesOdor) odor2 = e.forcesOdor;
    if (e.forcesFlavor) flavor1 = e.forcesFlavor;
    if (e.forcesFlavorIntensity) intensity = intensityToNumber(e.forcesFlavorIntensity);
    if (r.forcesBioluminescence === false) bioluminescent = false;
    if (e.forcesEdible) forceEdible(func);
    if (e.forcesPoisonous) forcePoisonous(func, fungalType, rng);
  }
  const physical = {
    fungalType,
    color,
    pattern,
    bioluminescent,
    transparent,
    dimensions,
    rates,
    flavor: { flavor1, intensity, odor: odor2 }
  };
  const applicable = matchingRules({ ...staticCtx, edible: physical.flavor && func.category === "edible" });
  const sensitivity = buildSensitivityTraits(applicable);
  const displayName = `${color} ${def.displayName}`;
  return {
    id,
    displayName,
    generation: 0,
    parentSpeciesIds: [],
    physical,
    function: func,
    sensitivity,
    statistics: {
      livingColonies: 0,
      harvestCount: 0,
      createdDay: opts.createdDay ?? 0,
      createdBy: opts.createdBy
    }
  };
}
function intensityToNumber(label) {
  const idx = functions.flavorIntensity.ordinal.indexOf(label);
  return idx >= 0 ? idx + 1 : 1;
}
function forceEdible(func) {
  func.category = "edible";
  delete func.poison;
  delete func.healing;
  delete func.sporeVirility;
}
function forcePoisonous(func, fungalType, rng) {
  if (fungalType === "mushroom") return;
  func.category = "poison";
  delete func.healing;
  delete func.sporeVirility;
  if (!func.poison) {
    const poison2 = lookup(functions.poison.table, rng.die(100));
    func.poison = {
      effect: poison2.effect,
      dc: poison2.dc,
      requiresCheckOnAnyInteraction: poison2.requiresCheckOnAnyInteraction
    };
  }
}
function buildSensitivityTraits(rules2) {
  const ruleIds = rules2.map((r) => r.id);
  const traits = { ruleIds };
  const brownOverridesShade = rules2.some((r) => {
    var _a;
    return ((_a = r.effect) == null ? void 0 : _a.overridesAllShadeRules) === true;
  });
  for (const r of rules2) {
    const rest = r.restriction ?? {};
    if (rest.requiresShade === true && !brownOverridesShade) traits.requiresShade = true;
    if (rest.cannotTouchEdge === true) traits.cannotTouchEdge = true;
    if (rest.requiresWhiteNeighbor === true) traits.requiresWhiteNeighbor = true;
    if (rest.requiresEdibleNeighbor === true) traits.requiresEdibleNeighbor = true;
    if (rest.requiresSeparateColonies) traits.requiresMultipleColonies = true;
  }
  return traits;
}
var ColonyStage = /* @__PURE__ */ ((ColonyStage2) => {
  ColonyStage2["SPORE"] = "spore";
  ColonyStage2["MYCELIUM"] = "mycelium";
  ColonyStage2["GROWING"] = "growing";
  ColonyStage2["MATURE"] = "mature";
  ColonyStage2["HARVESTED"] = "harvested";
  ColonyStage2["DORMANT"] = "dormant";
  ColonyStage2["DEAD"] = "dead";
  return ColonyStage2;
})(ColonyStage || {});
const AXIAL_DIRECTIONS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1]
];
function tileId(q, r) {
  return `${q},${r}`;
}
function buildShell(radius) {
  const coords = [];
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) coords.push([q, r]);
  }
  const idSet = new Set(coords.map(([q, r]) => tileId(q, r)));
  return coords.map(([q, r]) => {
    const neighbors = AXIAL_DIRECTIONS.map(([dq, dr]) => tileId(q + dq, r + dr)).filter(
      (id) => idSet.has(id)
    );
    const ring = hexDistance(0, 0, q, r);
    return {
      id: tileId(q, r),
      q,
      r,
      occupied: false,
      shade: 0,
      edge: ring === radius,
      neighbors
    };
  });
}
function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}
function indexTiles(tiles) {
  return new Map(tiles.map((t) => [t.id, t]));
}
const GARDEN_SCHEMA_VERSION = "0.2.0";
function createGarden(opts) {
  const tiles = buildShell(opts.radius ?? 3);
  return {
    version: GARDEN_SCHEMA_VERSION,
    ownerId: opts.ownerId,
    campaignDay: 0,
    randomSeed: opts.seed,
    tiles,
    colonies: [],
    species: [],
    inventory: { spores: [], powders: [], teas: [], toxins: [] },
    events: [],
    ecosystem: { state: "healthy", collapsedColonyIds: [] }
  };
}
function withRegistry(garden) {
  return { garden, registry: [] };
}
function registerSpecies(bundle, species, day) {
  const { garden, registry } = bundle;
  if (!garden.species.find((s) => s.id === species.id)) {
    garden.species.push(species);
  }
  if (!registry.find((e) => e.species.id === species.id)) {
    const grandparents = resolveGrandparents(species, garden.species);
    registry.push({
      species,
      lineage: { parents: species.parentSpeciesIds, grandparents },
      firstCultivatedDay: day,
      currentLivingColonies: 0
    });
  }
}
function resolveGrandparents(species, all) {
  const gps = /* @__PURE__ */ new Set();
  for (const pid of species.parentSpeciesIds) {
    const parent = all.find((s) => s.id === pid);
    parent == null ? void 0 : parent.parentSpeciesIds.forEach((gp) => gps.add(gp));
  }
  return [...gps];
}
function cultivate(bundle, species, tileId2, rng, day) {
  const { garden, registry } = bundle;
  const tileMap = indexTiles(garden.tiles);
  const tile = tileMap.get(tileId2);
  if (!tile || tile.occupied) return null;
  registerSpecies(bundle, species, day);
  const colony = {
    id: idFromRng(rng),
    speciesId: species.id,
    tileIds: [tile.id],
    stage: ColonyStage.MYCELIUM,
    myceliumUnits: 1,
    atMRUOM: false,
    myceliumAgeDays: 0,
    maturityAgeDays: 0,
    diagonalGrowthUnits: 0,
    harvestReady: false,
    alive: true
  };
  occupy(tile, colony.id);
  garden.colonies.push(colony);
  const entry = registry.find((e) => e.species.id === species.id);
  if (entry) entry.currentLivingColonies += 1;
  const sp = garden.species.find((s) => s.id === species.id);
  if (sp) sp.statistics.livingColonies += 1;
  return colony;
}
function occupy(tile, colonyId) {
  tile.occupied = true;
  tile.colonyId = colonyId;
}
function vacate(tile) {
  tile.occupied = false;
  delete tile.colonyId;
}
function pick(rng, a, b) {
  return rng.coin() === "heads" ? a : b;
}
function rollDimension(def, name, rng, vars) {
  const key = `optimum${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  const field = def.dimensions[key] ?? def.dimensions[name];
  if (!field) return 0;
  return applyRounding(rollFormula(field.formula, rng, vars), field.rounding);
}
function inheritDimensions(childType, a, b, rng) {
  const def = types.types[childType];
  const vars = {};
  const out = {};
  for (const key of Object.keys(def.dimensions)) {
    const name = key.replace(/^optimum/, "").replace(/^./, (c) => c.toLowerCase());
    const field = name === "height" ? "moldHeight" : name;
    const source = pick(rng, a, b);
    let value = source.physical.dimensions[field];
    if (value === void 0) value = rollDimension(def, name, rng, vars);
    vars[name] = value;
    out[field] = value;
  }
  return out;
}
function inheritRates(childType, a, b, rng) {
  const def = types.types[childType];
  const childIsMold = childType === "mold";
  const rtfmSource = pick(rng, a, b);
  const sourceIsMold = rtfmSource.physical.fungalType === "mold";
  const rtfmDays = sourceIsMold === childIsMold ? rtfmSource.physical.rates.rtfmDays : rerollRtfmDays(def, rng);
  const mruom = pick(rng, a, b).physical.rates.mruom;
  const romgDays = pick(rng, a, b).physical.rates.romgDays;
  return { rtfmDays, mruom, romgDays };
}
function rerollRtfmDays(def, rng) {
  const v = rollFormula(def.rates.rtfm.formula, rng);
  return toDays(v, def.rates.rtfm.unit);
}
function inheritFunction(childType, a, b, rng) {
  if (childType === "mushroom") return { category: "edible" };
  const catA = a.function.category;
  const catB = b.function.category;
  if (catA === catB && catA) {
    if (catA === "poison" || catA === "sporeVirility") {
      return pick(rng, a, b).function;
    }
    return pick(rng, a, b).function;
  }
  const category = rerollFunctionCategory(catA, catB, rng);
  if (!category) return { category: null };
  return materializeFunction(category, childType, rng).traits;
}
function rerollFunctionCategory(catA, catB, rng) {
  const index = breedingRules.reverseCauseIndex.functions;
  const pool = [];
  for (const cat of [catA, catB]) {
    if (!cat) continue;
    const causes = index[cat] ?? [];
    for (let i = 0; i < Math.max(1, causes.length); i++) pool.push(cat);
  }
  if (pool.length === 0) return null;
  return rng.pick(pool);
}
function breedSpecies(parentA, parentB, rng, createdDay = 0, createdBy) {
  const id = idFromRng(rng);
  const fungalType = pick(rng, parentA, parentB).physical.fungalType;
  const def = types.types[fungalType];
  const dimensions = inheritDimensions(fungalType, parentA, parentB, rng);
  const rates = inheritRates(fungalType, parentA, parentB, rng);
  const color = pick(rng, parentA, parentB).physical.color;
  const pattern = pick(rng, parentA, parentB).physical.pattern;
  const bioluminescent = pick(rng, parentA, parentB).physical.bioluminescent;
  const transparent = fungalType === "mold" ? false : pick(rng, parentA, parentB).physical.transparent;
  const flavor1 = pick(rng, parentA, parentB).physical.flavor.flavor1;
  const otherFlavor = pick(rng, parentA, parentB).physical.flavor.flavor2 ?? (parentA.physical.flavor.flavor1 === flavor1 ? parentB : parentA).physical.flavor.flavor1;
  const flavor2 = otherFlavor !== flavor1 ? otherFlavor : void 0;
  const intensity = pick(rng, parentA, parentB).physical.flavor.intensity;
  const odor2 = pick(rng, parentA, parentB).physical.flavor.odor;
  const func = inheritFunction(fungalType, parentA, parentB, rng);
  const physical = {
    fungalType,
    color,
    pattern,
    bioluminescent,
    transparent,
    dimensions,
    rates,
    flavor: flavor2 ? { flavor1, flavor2, intensity, odor: odor2 } : { flavor1, intensity, odor: odor2 }
  };
  const totalHeight = def.totalHeight.split("+").map((t) => {
    const n = t.trim();
    const map = {
      stemHeight: dimensions.stemHeight,
      capHeight: dimensions.capHeight,
      moldHeight: dimensions.moldHeight
    };
    return map[n] ?? 0;
  }).reduce((x, y) => x + y, 0);
  const ctx = {
    fungalType,
    color,
    pattern,
    bioluminescent,
    transparent,
    heightUnits: totalHeight,
    edible: func.category === "edible",
    flavor: flavor1
  };
  const ruleIds = matchingRules(ctx).map((r) => r.id);
  return {
    id,
    displayName: `${color} ${def.displayName} (hybrid)`,
    generation: Math.max(parentA.generation, parentB.generation) + 1,
    parentSpeciesIds: [parentA.id, parentB.id],
    physical,
    function: func,
    sensitivity: { ruleIds },
    statistics: { livingColonies: 0, harvestCount: 0, createdDay, createdBy }
  };
}
const STAGES = [
  "weather",
  "nutrients",
  "growth",
  "competition",
  "breeding",
  "mutation",
  "decay",
  "harvest",
  "summary"
];
function advanceDay(bundle, actions = {}) {
  const { garden } = bundle;
  const day = garden.campaignDay;
  const before = garden.events.length;
  STAGES.forEach((stage, i) => {
    const ctx = {
      bundle,
      garden,
      day,
      rng: rngFor(garden.randomSeed, day, i),
      actions,
      speciesById: new Map(garden.species.map((s) => [s.id, s])),
      tileById: indexTiles(garden.tiles)
    };
    STAGE_FNS[stage](ctx);
  });
  return garden.events.slice(before);
}
function advanceDays(bundle, count, actionsFor) {
  for (let i = 0; i < count; i++) {
    advanceDay(bundle, actionsFor ? actionsFor(bundle.garden.campaignDay) : {});
  }
}
function emit(garden, day, type, description, source, target) {
  garden.events.push({ day, type, source, target, description });
}
const STAGE_FNS = {
  weather: () => {
  },
  nutrients: () => {
  },
  growth: stageGrowth,
  competition: stageCompetition,
  breeding: stageBreeding,
  mutation: () => {
  },
  decay: stageDecay,
  harvest: stageHarvest,
  summary: stageSummary
};
function initiationThreshold(species) {
  const t = species.physical.fungalType;
  if (t === "mold") return 1;
  if (t === "shelfToadstool") return species.physical.dimensions.capDiameter ?? 1;
  return species.physical.dimensions.volvaDiameter ?? 1;
}
function stageGrowth(ctx) {
  const { garden, day, speciesById, tileById } = ctx;
  const ecosystemHalted = garden.ecosystem.state === "damaged";
  for (const colony of garden.colonies) {
    if (!colony.alive) continue;
    const species = speciesById.get(colony.speciesId);
    if (!species) continue;
    const rates = species.physical.rates;
    colony.myceliumAgeDays += 1;
    if (colony.stage === ColonyStage.MYCELIUM && colony.myceliumUnits >= initiationThreshold(species)) {
      colony.stage = ColonyStage.GROWING;
      emit(garden, day, "grow", `${species.displayName} began maturing`, colony.id);
    }
    if (colony.stage !== ColonyStage.MATURE && colony.myceliumAgeDays > 0 && colony.myceliumAgeDays % rates.romgDays === 0) {
      const added = spreadMycelium(ctx, colony);
      if (added > 0) {
        colony.myceliumUnits += added;
        emit(garden, day, "spread", `${species.displayName} spread +${added} mycelium`, colony.id);
      }
    }
    colony.atMRUOM = colony.myceliumUnits >= rates.mruom;
    if (colony.stage === ColonyStage.GROWING && !ecosystemHalted) {
      colony.maturityAgeDays += 1;
      const sizeMet = species.physical.fungalType !== "mold" || colony.myceliumUnits >= rates.mruom;
      if (colony.maturityAgeDays >= rates.rtfmDays && sizeMet) {
        colony.stage = ColonyStage.MATURE;
        colony.harvestReady = true;
        emit(garden, day, "mature", `${species.displayName} reached full maturity`, colony.id);
      }
    }
  }
}
function spreadMycelium(ctx, colony) {
  const { tileById } = ctx;
  const empties = [];
  const seen = new Set(colony.tileIds);
  for (const tid of colony.tileIds) {
    const tile = tileById.get(tid);
    if (!tile) continue;
    for (const nid of tile.neighbors) {
      if (seen.has(nid)) continue;
      const n = tileById.get(nid);
      if (n && !n.occupied) {
        empties.push(nid);
        seen.add(nid);
      }
    }
  }
  const capacity = Math.min(colony.myceliumUnits, empties.length);
  for (let i = 0; i < capacity; i++) {
    const tile = tileById.get(empties[i]);
    tile.occupied = true;
    tile.colonyId = colony.id;
    colony.tileIds.push(tile.id);
  }
  return capacity;
}
function stageCompetition(ctx) {
  const { garden, day, tileById } = ctx;
  const alive = garden.colonies.filter((c) => c.alive);
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i];
      const b = alive[j];
      if (!a.alive || !b.alive) continue;
      if (a.speciesId !== b.speciesId) continue;
      if (!coloniesAdjacent(a, b, tileById)) continue;
      a.myceliumUnits += b.myceliumUnits;
      a.maturityAgeDays = Math.max(a.maturityAgeDays, b.maturityAgeDays);
      a.myceliumAgeDays = b.myceliumAgeDays;
      for (const tid of b.tileIds) {
        const t = tileById.get(tid);
        if (t) t.colonyId = a.id;
        a.tileIds.push(tid);
      }
      b.alive = false;
      b.stage = ColonyStage.DEAD;
      b.tileIds = [];
      emit(garden, day, "spread", `Merged ${b.id} into ${a.id}`, a.id, b.id);
    }
  }
  for (const colony of garden.colonies) {
    if (!colony.alive) continue;
    const species = ctx.speciesById.get(colony.speciesId);
    if (!species) continue;
    if (!species.sensitivity.ruleIds.includes("mixedPatternAdjacencyBoost")) continue;
    const patterns2 = neighborPatterns(ctx, colony);
    if (patterns2.size >= 2) {
      colony.myceliumUnits += 1;
      emit(garden, day, "grow", `${species.displayName} +1 mycelium (mixed-pattern adjacency)`, colony.id);
    }
  }
}
function coloniesAdjacent(a, b, tileById) {
  const bTiles = new Set(b.tileIds);
  for (const tid of a.tileIds) {
    const t = tileById.get(tid);
    if (!t) continue;
    if (t.neighbors.some((n) => bTiles.has(n))) return true;
  }
  return false;
}
function neighborPatterns(ctx, colony) {
  const { tileById, garden, speciesById } = ctx;
  const colonyById = new Map(garden.colonies.map((c) => [c.id, c]));
  const patterns2 = /* @__PURE__ */ new Set();
  const own = new Set(colony.tileIds);
  for (const tid of colony.tileIds) {
    const t = tileById.get(tid);
    if (!t) continue;
    for (const nid of t.neighbors) {
      if (own.has(nid)) continue;
      const n = tileById.get(nid);
      if (!(n == null ? void 0 : n.colonyId)) continue;
      const other = colonyById.get(n.colonyId);
      if (!other || other.id === colony.id) continue;
      const sp = speciesById.get(other.speciesId);
      if (sp) patterns2.add(sp.physical.pattern);
    }
  }
  return patterns2;
}
function stageBreeding(ctx) {
  const { garden, bundle, day, rng, actions, speciesById } = ctx;
  const breeds = actions.breeds ?? [];
  const colonyById = new Map(garden.colonies.map((c) => [c.id, c]));
  for (const req of breeds) {
    const a = colonyById.get(req.parentColonyIdA);
    const b = colonyById.get(req.parentColonyIdB);
    if (!(a == null ? void 0 : a.alive) || !(b == null ? void 0 : b.alive)) continue;
    if (a.stage !== ColonyStage.MATURE || b.stage !== ColonyStage.MATURE) continue;
    const spA = speciesById.get(a.speciesId);
    const spB = speciesById.get(b.speciesId);
    if (!spA || !spB) continue;
    const child = breedSpecies(spA, spB, rng, day, garden.ownerId);
    registerSpecies(bundle, child, day);
    emit(garden, day, "breed", `Bred ${spA.displayName} x ${spB.displayName} -> ${child.displayName}`, spA.id, child.id);
    if (req.cultivateTileId) {
      const colony = cultivate(bundle, child, req.cultivateTileId, rng, day);
      if (colony) emit(garden, day, "grow", `Cultivated ${child.displayName}`, child.id, req.cultivateTileId);
    }
  }
}
function stageDecay(ctx) {
  const { garden, speciesById } = ctx;
  for (const colony of garden.colonies) {
    if (!colony.alive) continue;
    const species = speciesById.get(colony.speciesId);
    if (!species) continue;
    const rates = species.physical.rates;
    const hadOneCycle = colony.myceliumAgeDays >= rates.romgDays;
    if (hadOneCycle && colony.myceliumUnits < rates.mruom && !hasEmptyNeighbor(ctx, colony)) {
      killColony(ctx, colony, `${species.displayName} died (below MRUOM, no room to expand)`);
    }
  }
}
function hasEmptyNeighbor(ctx, colony) {
  const { tileById } = ctx;
  const own = new Set(colony.tileIds);
  for (const tid of colony.tileIds) {
    const t = tileById.get(tid);
    if (!t) continue;
    for (const nid of t.neighbors) {
      if (own.has(nid)) continue;
      const n = tileById.get(nid);
      if (n && !n.occupied) return true;
    }
  }
  return false;
}
function killColony(ctx, colony, reason) {
  const { garden, bundle, day, tileById, speciesById } = ctx;
  for (const tid of colony.tileIds) {
    const t = tileById.get(tid);
    if (t && t.colonyId === colony.id) vacate(t);
  }
  colony.alive = false;
  colony.stage = ColonyStage.DEAD;
  colony.tileIds = [];
  emit(garden, day, "decay", reason, colony.id);
  const species = speciesById.get(colony.speciesId);
  if (species) {
    species.statistics.livingColonies = Math.max(0, species.statistics.livingColonies - 1);
    const entry = bundle.registry.find((e) => e.species.id === species.id);
    if (entry) entry.currentLivingColonies = Math.max(0, entry.currentLivingColonies - 1);
    if (species.statistics.livingColonies === 0) {
      species.statistics.extinctAt = day;
    }
  }
}
const PREP_EXPIRY = growthRules.time.prepMethodExpiryDays;
function stageHarvest(ctx) {
  const { garden, day, actions, speciesById, rng } = ctx;
  const harvests = actions.harvests ?? [];
  const colonyById = new Map(garden.colonies.map((c) => [c.id, c]));
  for (const cid of harvests) {
    const colony = colonyById.get(cid);
    if (!(colony == null ? void 0 : colony.alive) || colony.stage !== ColonyStage.MATURE || !colony.harvestReady) continue;
    const species = speciesById.get(colony.speciesId);
    if (!species) continue;
    const item = makeHarvestedItem(species, colony.id, day, rng);
    bucketFor(garden, item.prepMethod, species.function.category).push(item);
    species.statistics.harvestCount += 1;
    colony.maturityAgeDays = 0;
    colony.harvestReady = false;
    colony.stage = ColonyStage.GROWING;
    emit(garden, day, "harvest", `Harvested ${species.displayName}`, colony.id);
  }
}
function makeHarvestedItem(species, colonyId, day, rng) {
  const fn = species.function;
  let prepMethod = "save";
  let effect = "Edible";
  if (fn.category === "healing" && fn.healing) {
    prepMethod = fn.healing.prepMethod;
    effect = fn.healing.effect;
  } else if (fn.category === "poison" && fn.poison) {
    prepMethod = "ingested";
    effect = fn.poison.effect;
  } else if (fn.category === "sporeVirility") {
    prepMethod = "powder";
    effect = "Spore virility";
  } else if (fn.category === "edible") {
    prepMethod = "tea";
    effect = "Goodberry (1 week)";
  }
  const expiryDays = PREP_EXPIRY[prepMethod];
  return {
    id: idFromRng(rng),
    speciesId: species.id,
    colonyId,
    prepMethod,
    harvestedDay: day,
    effect,
    expiresDay: expiryDays !== void 0 ? day + expiryDays : void 0
  };
}
function bucketFor(garden, prep, category) {
  if (category === "poison") return garden.inventory.toxins;
  if (prep === "powder") return garden.inventory.powders;
  if (prep === "tea") return garden.inventory.teas;
  if (category === "sporeVirility" || category === "edible") return garden.inventory.spores;
  return garden.inventory.teas;
}
function stageSummary(ctx) {
  const { garden } = ctx;
  if (garden.ecosystem.state === "damaged" && garden.ecosystem.damagedSinceDay !== void 0 && garden.campaignDay - garden.ecosystem.damagedSinceDay >= growthRules.time.ecosystemAutoResumeDays) {
    garden.ecosystem.state = "healthy";
    delete garden.ecosystem.damagedSinceDay;
    emit(garden, garden.campaignDay, "ecosystemResume", "Ecosystem recovered to healthy");
  }
  garden.campaignDay += 1;
}
const MIGRATIONS = [
  // Example of the shape future migrations take:
  // { from: '0.2.0', to: '0.3.0', apply: (b) => { /* transform */ return b; } },
];
function compareVersions(a, b) {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
function migrateBundle(raw) {
  let bundle = { garden: raw.garden, registry: raw.registry ?? [] };
  let version = bundle.garden.version ?? "0.0.0";
  if (compareVersions(version, GARDEN_SCHEMA_VERSION) < 0) {
    for (const m of MIGRATIONS) {
      if (compareVersions(version, m.from) === 0) {
        bundle = m.apply(bundle);
        version = m.to;
      }
    }
    bundle.garden.version = GARDEN_SCHEMA_VERSION;
  }
  return { garden: bundle.garden, registry: bundle.registry ?? [] };
}
function seedFromActor(actor) {
  let h = 2166136261 >>> 0;
  for (const ch of actor.id) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function loadBundle(actor) {
  const raw = actor.getFlag(MODULE_ID, FLAG_KEY);
  if (!raw || !raw.garden) return null;
  return migrateBundle(raw);
}
async function saveBundle(actor, bundle) {
  await actor.setFlag(MODULE_ID, FLAG_KEY, bundle);
}
async function clearBundle(actor) {
  await actor.unsetFlag(MODULE_ID, FLAG_KEY);
}
async function getOrCreateBundle(actor, opts = {}) {
  const existing = loadBundle(actor);
  if (existing) return existing;
  const bundle = withRegistry(
    createGarden({ ownerId: actor.id, seed: opts.seed ?? seedFromActor(actor), radius: opts.radius })
  );
  await saveBundle(actor, bundle);
  return bundle;
}
async function initGarden(actor, opts = {}) {
  return getOrCreateBundle(actor, opts);
}
function getGarden(actor) {
  return loadBundle(actor);
}
async function advanceGarden(actor, days = 1, actionsFor) {
  const bundle = await getOrCreateBundle(actor);
  advanceDays(bundle, days, actionsFor);
  await saveBundle(actor, bundle);
  return bundle;
}
async function plantSpecies(actor, tileId2, opts = {}) {
  const bundle = await getOrCreateBundle(actor);
  const { garden } = bundle;
  const salt = garden.colonies.length;
  const speciesRng = rngFor(garden.randomSeed, garden.campaignDay, 61453, salt);
  const species = generateWildSpecies(speciesRng, {
    fungalType: opts.fungalType,
    createdDay: garden.campaignDay,
    createdBy: actor.name
  });
  const cultivateRng = rngFor(garden.randomSeed, garden.campaignDay, 48879, salt);
  const colony = cultivate(bundle, species, tileId2, cultivateRng, garden.campaignDay);
  await saveBundle(actor, bundle);
  return { bundle, species: colony ? species : null };
}
async function stepGarden(actor, actions = {}) {
  return advanceGarden(actor, 1, () => actions);
}
const COLOR_HEX = {
  Black: "#20201e",
  Brown: "#6b4423",
  White: "#f2f0e6",
  Orange: "#e08a2b",
  Green: "#4a9e4a",
  Blue: "#3a6ea5",
  Red: "#b23b3b",
  Yellow: "#e8d44d",
  Indigo: "#4b3f8f",
  Violet: "#8a5fb0",
  Pink: "#e39ac0",
  Grey: "#9a9a9a"
};
const EMPTY_HEX = "#2b2f28";
const EDGE_STROKE = "#c9a24b";
const HEX_STROKE = "#12140f";
function colorToHex(color) {
  return COLOR_HEX[color] ?? "#8a8f7a";
}
function textOn(fill) {
  const m = /^#(..)(..)(..)$/.exec(fill);
  if (!m) return "#000";
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#111" : "#f4f4ef";
}
const STAGE_GLYPH = {
  [ColonyStage.SPORE]: "·",
  [ColonyStage.MYCELIUM]: "∴",
  [ColonyStage.GROWING]: "♣",
  [ColonyStage.MATURE]: "♠",
  [ColonyStage.HARVESTED]: "◇",
  [ColonyStage.DORMANT]: "○",
  [ColonyStage.DEAD]: "×"
};
function axialToPixel(q, r, size) {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * 1.5 * r;
  return { x, y };
}
function hexPolygonPoints(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return pts.join(" ");
}
function buildGardenViewModel(bundle, opts = {}) {
  const { garden, registry } = bundle;
  const size = opts.hexSize ?? 26;
  const pad = size + 4;
  const colonyById = new Map(garden.colonies.map((c) => [c.id, c]));
  const speciesById = new Map(garden.species.map((s) => [s.id, s]));
  const raw = garden.tiles.map((t) => ({ tile: t, ...axialToPixel(t.q, t.r, size) }));
  const minX = Math.min(...raw.map((p) => p.x));
  const minY = Math.min(...raw.map((p) => p.y));
  const maxX = Math.max(...raw.map((p) => p.x));
  const maxY = Math.max(...raw.map((p) => p.y));
  const hexes = raw.map(({ tile, x, y }) => {
    const cx = x - minX + pad;
    const cy = y - minY + pad;
    let fill = EMPTY_HEX;
    let colony;
    let species;
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
      colonyId: colony == null ? void 0 : colony.id,
      speciesName: species == null ? void 0 : species.displayName,
      stage: colony == null ? void 0 : colony.stage,
      bioluminescent: (species == null ? void 0 : species.physical.bioluminescent) && species.function.magicalEffect !== void 0 ? true : species == null ? void 0 : species.physical.bioluminescent,
      label: colony ? STAGE_GLYPH[colony.stage] ?? "" : "",
      textFill: textOn(fill)
    };
  });
  const width = maxX - minX + pad * 2;
  const height = maxY - minY + pad * 2;
  const living = garden.colonies.filter((c) => c.alive);
  const stats = {
    campaignDay: garden.campaignDay,
    totalTiles: garden.tiles.length,
    occupiedTiles: garden.tiles.filter((t) => t.occupied).length,
    livingColonies: living.length,
    matureColonies: living.filter((c) => c.stage === ColonyStage.MATURE).length,
    activeSpecies: garden.species.length,
    discoveredSpecies: registry.length,
    inventoryTotal: garden.inventory.spores.length + garden.inventory.powders.length + garden.inventory.teas.length + garden.inventory.toxins.length,
    ecosystemState: garden.ecosystem.state
  };
  const journal = registry.slice().sort((a, b) => a.firstCultivatedDay - b.firstCultivatedDay).map((e) => ({
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
    functionCategory: e.species.function.category ?? "inert"
  }));
  const eventLimit = opts.eventLimit ?? 40;
  const events = garden.events.slice(-eventLimit).reverse().map((e) => ({ day: e.day, type: e.type, description: e.description }));
  const inventory = {
    spores: garden.inventory.spores.length,
    powders: garden.inventory.powders.length,
    teas: garden.inventory.teas.length,
    toxins: garden.inventory.toxins.length
  };
  return { width, height, hexSize: size, hexes, stats, journal, events, inventory };
}
const TEMPLATE = `modules/${MODULE_ID}/templates/garden.hbs`;
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const _GardenApp = class _GardenApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options) {
    super(options);
    __publicField(this, "actorId");
    __publicField(this, "activeTab", "grid");
    __publicField(this, "selectedTileId", null);
    this.actorId = options.actorId;
  }
  get actor() {
    var _a;
    return (_a = game.actors) == null ? void 0 : _a.get(this.actorId);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _prepareContext(_options) {
    var _a;
    const actor = this.actor;
    const bundle = actor ? getGarden(actor) : null;
    const vm = bundle ? buildGardenViewModel(bundle) : null;
    let selected = null;
    if (vm && this.selectedTileId) {
      const hex = vm.hexes.find((h) => h.id === this.selectedTileId) ?? null;
      if ((hex == null ? void 0 : hex.colonyId) && bundle) {
        const colony = bundle.garden.colonies.find((c) => c.id === hex.colonyId);
        const species = colony ? bundle.garden.species.find((s) => s.id === colony.speciesId) : void 0;
        selected = { hex, colony, species };
      } else if (hex) {
        selected = { hex, colony: null, species: null };
      }
    }
    return {
      isGM: ((_a = game.user) == null ? void 0 : _a.isGM) ?? false,
      hasGarden: !!bundle,
      actorName: (actor == null ? void 0 : actor.name) ?? "Unknown",
      vm,
      selected,
      tab: this.activeTab,
      isGrid: this.activeTab === "grid",
      isJournal: this.activeTab === "journal",
      isStats: this.activeTab === "stats",
      isLog: this.activeTab === "log"
    };
  }
  // --- action handlers (Foundry calls these with `this` = the app instance) ---
  static onTab(_event, target) {
    const tab = target.dataset.tab;
    if (tab) {
      this.activeTab = tab;
      this.render();
    }
  }
  static async onAdvance(_event, target) {
    if (!this.actor) return;
    const days = Number(target.dataset.days ?? 1) || 1;
    await advanceGarden(this.actor, days);
    this.render();
  }
  static async onPlant(_event, target) {
    var _a;
    if (!this.actor) return;
    const tileId2 = target.dataset.tileId ?? this.firstEmptyTileId();
    if (!tileId2) {
      (_a = ui.notifications) == null ? void 0 : _a.warn("Fungal Garden: no empty tile to plant on.");
      return;
    }
    await plantSpecies(this.actor, tileId2);
    this.render();
  }
  static async onClear() {
    if (!this.actor) return;
    await clearBundle(this.actor);
    this.selectedTileId = null;
    this.render();
  }
  static async onHex(_event, target) {
    var _a;
    const tileId2 = target.dataset.tileId;
    if (!tileId2 || !this.actor) return;
    const bundle = getGarden(this.actor);
    const tile = bundle == null ? void 0 : bundle.garden.tiles.find((t) => t.id === tileId2);
    if (((_a = game.user) == null ? void 0 : _a.isGM) && tile && !tile.occupied) {
      await plantSpecies(this.actor, tileId2);
    }
    this.selectedTileId = tileId2;
    this.render();
  }
  firstEmptyTileId() {
    var _a;
    const bundle = this.actor ? getGarden(this.actor) : null;
    return ((_a = bundle == null ? void 0 : bundle.garden.tiles.find((t) => !t.occupied)) == null ? void 0 : _a.id) ?? null;
  }
};
__publicField(_GardenApp, "DEFAULT_OPTIONS", {
  id: "fungal-garden-app",
  classes: ["fungal-garden"],
  tag: "div",
  window: {
    title: "FUNGAL_GARDEN.title",
    icon: "fas fa-seedling",
    resizable: true
  },
  position: { width: 860, height: 760 },
  actions: {
    tab: _GardenApp.onTab,
    advance: _GardenApp.onAdvance,
    plant: _GardenApp.onPlant,
    clear: _GardenApp.onClear,
    hex: _GardenApp.onHex
  }
});
__publicField(_GardenApp, "PARTS", {
  main: { template: TEMPLATE, scrollable: [""] }
});
let GardenApp = _GardenApp;
function openGardenApp(actor) {
  const app = new GardenApp({ actorId: actor.id, window: { title: `${actor.name} — Fungal Garden` } });
  app.render(true);
  return app;
}
const TEMPLATES = [`modules/${MODULE_ID}/templates/garden.hbs`];
const api = {
  /** Open the garden window for an actor (or the id). */
  open: (actor) => openGardenApp(actor),
  /** Create (or fetch) the garden on an actor. */
  init: (actor, opts) => initGarden(actor, opts),
  /** Read an actor's garden bundle (or null). */
  get: (actor) => getGarden(actor),
  /** Advance the garden by N campaign days. GM only. */
  advance: (actor, days = 1) => gmOnly(() => advanceGarden(actor, days)),
  /** Advance one day, applying breed/harvest actions. GM only. */
  step: (actor, actions = {}) => gmOnly(() => stepGarden(actor, actions)),
  /** Generate a wild species and cultivate it onto a tile. GM only. */
  plant: (actor, tileId2, fungalType) => gmOnly(() => plantSpecies(actor, tileId2, { fungalType })),
  /** Delete an actor's garden. GM only. */
  clear: (actor) => gmOnly(() => clearBundle(actor)),
  /** The application class, for advanced callers. */
  GardenApp
};
function gmOnly(fn) {
  var _a;
  if (game.user && !game.user.isGM) {
    (_a = ui.notifications) == null ? void 0 : _a.warn("Fungal Garden: only the GM can change the garden.");
    throw new Error("Fungal Garden: GM-only operation");
  }
  return fn();
}
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Fungal Garden`);
  void loadTemplates(TEMPLATES);
});
Hooks.once("ready", () => {
  const mod = game.modules.get(MODULE_ID);
  if (mod) mod.api = api;
  globalThis.fungalGarden = api;
  console.log(
    `${MODULE_ID} | Ready — API at game.modules.get('${MODULE_ID}').api and globalThis.fungalGarden`
  );
});
Hooks.on("getActorSheetHeaderButtons", (...args) => {
  try {
    const [sheet, buttons] = args;
    const actor = sheet == null ? void 0 : sheet.actor;
    if (!actor || !Array.isArray(buttons)) return;
    buttons.unshift({
      label: "Garden",
      class: "fungal-garden-open",
      icon: "fas fa-seedling",
      onclick: () => openGardenApp(actor)
    });
  } catch (err) {
    console.warn(`${MODULE_ID} | could not add sheet header button`, err);
  }
});
//# sourceMappingURL=module.js.map
