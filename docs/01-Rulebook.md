# Fungal Garden — Rulebook

*The living fungal ecosystem on the shell of the Swampsworn Shellstump.*

This is the player-facing rulebook. It describes how the garden behaves in play. It
does not describe how the module implements any of it — for that see the Data Schema
and Automation docs.

---

## 1. The Shell

Your fungal garden grows on the back of the Swampsworn Shellstump. The shell is a
**hex grid**. Each hex holds at most **one** unit of mycelium *or* one fungal growth.

The fungi are hardy. Once established they are **immune to all damage except
bludgeoning, slashing, cold, and fire**.

### Damage and the ecosystem

- If the Shellstump takes bludgeoning, slashing, cold, or fire damage from a failed
  save, or while flanked, the whole ecosystem's maturation **halts for one week**. The
  garden is now **damaged**.
- If damage lands again *before* the garden recovers — or on a critical failure — roll
  a d100. **Any growth taller than the roll collapses**: it loses its potency and can
  no longer be harvested.
- If a second such collapse trigger happens after the first, **every remaining growth
  collapses**. Collapsed growths must be cleared away by hand before the garden can
  begin maturing again.

### Recovery

A damaged garden heals on its own after **one week** if left unharmed. You can also
speed things along with the *Plant Growth* spell (see below).

*Flavor: after each of the Shellstump's long rests, the shell leaves behind a musky
puddle. It means nothing mechanically — it's just how the old tortle sleeps.*

### Plant Growth (once per day)

- On a **damaged** garden, one casting resets all maturation timers and restores the
  garden to healthy.
- On a **healthy** garden, casting instead **accelerates growth**:
  - A **1-action** casting advances the garden by **one month**.
  - An **8-hour** casting advances it by **one year**.

---

## 2. Fungal Types

When a new colony first appears, its type is determined randomly:

| Roll (d10) | Type |
|---|---|
| 1–4 | Traditionally Shaped Toadstool |
| 5 | Shelf Toadstool |
| 6–8 | Mold |
| 9–10 | Mushroom |

**Shapes:**

- **Traditional Toadstool / Mushroom** — a round *volva* (base), a stem growing straight
  up, capped by a cap wider than the base.
- **Shelf Toadstool** — a cap that grows straight out of the shell as a horizontal
  semicircle. Its base length equals its cap diameter and its height equals its cap
  radius. **It cannot grow diagonally.**
- **Mold** — grows straight up at a uniform width from base to top.

---

## 3. Growth and Maturation

Fungi grow from mycelium. Only a **fully matured** growth — one that has reached its
optimum dimensions — provides any functional benefit. **Harvesting a growth resets it**;
it must mature all over again before it can be harvested a second time.

### Starting to mature

Before a growth can begin maturing, its mycelium must be established:

- **Traditional Toadstool / Mushroom** — mycelium must fill the full hex area of the
  growth's optimum volva diameter.
- **Shelf Toadstool** — mycelium must fill a horizontal line of hexes as long as the
  optimum cap diameter.
- **Mold** — needs only **one** mycelium unit *and* **shade** to begin. It is fully
  matured once it reaches its minimum required mycelium (its harvestable size is that
  same minimum).

### Shade

Some growths need shade. A hex is shaded when it sits:

- Directly beneath the cap of a mushroom or traditional toadstool that would otherwise
  be in the sun; or
- Beneath a shelf toadstool — specifically, any growth shorter than the shelf
  toadstool's cap height, next to the shelf's shell-facing edge and within its diameter.

**Transparent growths never cast shade.**

---

## 4. Mycelium

Mycelium is the living network under every fungus. A growth is optional; the mycelium
underneath is not.

- Every colony must maintain its **minimum required mycelium** to survive. It does not
  need an active growth to stay alive.
- At the end of each growth cycle, **each mycelium unit spreads into one adjacent empty
  hex** (never into a hex already holding a growth). If there aren't enough empty
  neighbors for the new units, the surplus dies — unless the colony is already at or
  above its minimum.
- Mycelium sitting directly under an active growth **stops spreading** until that growth
  is harvested. Mycelium without a growth keeps spreading normally.
- If a colony drops **below** its minimum, it has exactly **one cycle** to recover or it
  dies completely.
- **Once a week**, any number of mycelium units *not* carrying a growth may **move one
  hex** into an adjacent empty space. Moving into a hex holding another type of mycelium
  **consumes and replaces** it.
- Growth-bearing mycelium is **locked in place** until harvest.

### Vertical and diagonal growth

Every growth starts by rising straight up. After the first vertical unit, **mold,
mushrooms, and traditional toadstools** may angle diagonally in any direction. **Shelf
toadstools may not.**

Growing diagonally costs height: **−1 final height for every 2 units of diagonal stem**.
(Shade requirements and the shade a growth provides are still judged by its *intended*
height, not its shortened one.)

### Merging

If two identical colonies are cultivated into adjacent hexes, they **merge into one**
immediately. The merged colony takes on the growth-cycle timing of whichever was
cultivated most recently.

---

## 5. Dimensions and Rates

Every new growth rolls its optimum dimensions and its rates when it is created.

**Traditional Toadstool**

| Stat | Roll |
|---|---|
| Optimum Diameter of Volva | d8 hexes (round down) |
| Optimum Height of Stem | 8d4 |
| Optimum Diameter of Cap | (volva diameter) + d12 |
| Optimum Height of Cap | 2d12 (round up) |
| Rate to Full Maturation | d6 months |
| Minimum Mycelium | 2d4 hexes |
| Rate of Mycelium Growth | d8 weeks |

**Shelf Toadstool**

| Stat | Roll |
|---|---|
| Optimum Diameter of Cap | 2d10 hexes |
| Optimum Height of Cap | cap diameter ÷ 2 (round up) |
| Rate to Full Maturation | d6 months |
| Minimum Mycelium | 3d4 hexes |
| Rate of Mycelium Growth | d8 weeks |

**Mold**

| Stat | Roll |
|---|---|
| Optimum Height | d4 hexes (round down) |
| Rate to Full Maturation | d4 weeks |
| Minimum Mycelium | 5d4 hexes |
| Rate of Mycelium Growth | d4 weeks |

**Mushroom**

| Stat | Roll |
|---|---|
| Optimum Diameter of Volva | d6 hexes (round down) |
| Optimum Height of Stem | 3d4 |
| Optimum Diameter of Cap | (volva diameter) + d8 |
| Optimum Height of Cap | 4d4 |
| Rate to Full Maturation | d6 months |
| Minimum Mycelium | 2d4 hexes |
| Rate of Mycelium Growth | d8 weeks |

---

## 6. Function

Every growth has a **function** — what it does when harvested and prepared.

- **Mushrooms are always edible** and can have no other function, ever. One edible
  growth acts as a *Goodberry* whose effect lasts a full week.
- **Eating a non-mushroom that isn't edible deals 1 poison damage**, even if it carries
  no poison property.

Every fungus — edible or not — also rolls for scent and taste:

- **Odor** (d20): 1–3 Foul Stench, 4–9 Musky, 10–17 No Scent, 18–19 Lightly Sweet,
  20 Smells Delectable.
- **Flavor** (d20): a 20-entry table ranging from bitter, through savory, to chocolatey.
- **Flavor Intensity** (d6): 1 Very Faint up to 6 Overpowering.

Toadstools and mold roll a d10 for their function:

| Roll | Toadstool | Mold |
|---|---|---|
| 1 | Poison | Poison |
| 2 | Healing | Healing |
| 3 | Poison | Poison |
| 4 | Healing | Spore Virility |
| 5 | Spore Virility | Poison |
| 6 | Spore Virility | Healing |
| 7 | Poison | Poison |
| 8 | Healing | Spore Virility |
| 9 | Poison | Poison |
| 10 | Healing | Healing |

### Healing

Harvest and prepare with a Wisdom (Medicine) check (advantage if you're proficient in
herbalism). The full effect and DC come from the healing tables. Preparations keep for
a limited time: **saves** within 1 hour, **teas** within 24 hours, **powders** within
1 week.

### Poison

Prepare with an Intelligence (Nature) check (advantage with herbalism). **Contact**
poisons are dangerous just to handle: any interaction during maturation or after
plucking calls for an Intelligence (Nature) check to avoid being poisoned. The full
table covers delivery method, DC, and special products such as Truth Serum, Drow Poison,
and Oil of Taggit.

### Spore Virility

A fully matured spore-virile growth continuously puts out d4 necrotic spores per minute,
feeding the *Halo of Spores* feature. Mold produces spores only when fully mature, and
growing past its minimum mycelium does not increase the output.

---

## 7. Appearance

Each growth rolls four independent appearance traits: **Color**, **Pattern**,
**Bioluminescence**, and **Transparency** (mold is normally opaque). The full tables
list every result.

- A **bioluminescent** growth loses its magic if it touches any **brown** growth.
- A fully matured bioluminescent growth produces **one Magical Effect Spore (MES) per
  day** (mold: one per growth, whatever its size).
- MES power a reaction that can enchant a creature entering or starting its turn within
  10 feet. There are a hundred possible effects, each with an MES cost and a 5e spell it
  mirrors. The target makes a Constitution save against your spell save DC; creatures
  that don't breathe or are immune to poison automatically succeed, and most effects
  allow a repeated save at end of turn to end early. You can hold growths of different
  effect types at once, but only spores of the matching type fuel a given effect.
- **Transparent** mycelium may grow *on top of* opaque mold less than 2 units tall.
  Transparent growths never cast shade.

---

## 8. Sensitivities

Beyond their base traits, growths have **sensitivities**: extra conditions that switch
on depending on a growth's height, color, pattern, or edibility. They aren't rolled
separately — they follow from what the growth already is. A sampling:

- Taller than 35 units → can't mature unless next to a fully matured edible growth.
- Taller than 50 units → needs three points of mycelium contact to begin maturing.
- Toadstool shorter than 20 units → needs shade.
- Shelf toadstool taller than 12 units → collapses without a fully grown support at its
  shell-facing edge.
- Taller than 40 units → cannot have the healing function.
- Certain color/pattern combinations force a growth to be **poisonous** (white +
  ringed/striped; indigo; green with a black pattern; a black-spotted shelf toadstool).
- Certain colors demand specific mycelium contact before maturing (a black-patterned
  mushroom needs to touch white mycelium; a red toadstool needs two points of contact
  with brown; violet, white, or yellow toadstools need two or more separate colonies).
- **Brown** fungi ignore every shade requirement.
- **Mold** and **holed** growths can't grow on the shell's edge; ringed/striped growths
  can't sit next to spotted ones.
- A growth flanked by two others of all-different patterns gains **+1 mycelium unit** per
  cycle.

The full set lives with the module's data. Your GM will apply them as your garden grows.

---

## 9. Breeding

- **Once per day**, you may cross-pollinate any two fully matured growths on the shell to
  produce a **hybrid**.
- The hybrid's traits are settled a row at a time down the breeding matrix — for each
  trait (type, rates, dimensions, color, pattern, luminescence, transparency, function,
  sensitivity, flavors, intensity, odor) you **flip a coin** to decide which parent it
  takes after.
- **Functions and sensitivities don't carry their trigger with them.** If both parents
  share the same function or sensitivity, the hybrid keeps it. If they differ (or only
  one parent has it), the hybrid re-rolls a new one from the physical traits that could
  have produced either parent's version.
- **Flavors and functions may stack** from both parents; each is still rolled
  independently.

**Hard rules that override the coin flip:**

- Mushrooms can never gain a non-edible function.
- Mold's maturation rate never crosses into a non-mold offspring (or vice versa).
- If **both** parents are poisonous, the poisons don't stack — flip to see which single
  poison the hybrid inherits.
- Spore virility follows the same don't-stack rule as poison.

Once a hybrid's traits are set, you may cultivate it on the shell wherever there's room.
It becomes mycelium and begins its own growth cycle.

- Only **one new** hybrid may be created per day. The same hybrid may be **replicated** —
  cultivated again, unchanged — on later days, until you make a new hybrid, at which
  point the old replicate's stats are lost.
- Two identical hybrids cultivated into adjacent hexes merge immediately, as in §4.

A never-before-seen hybrid is recorded permanently in your **species registry**. Even if
every colony of a species later dies, the species stays catalogued — extinct, but not
forgotten.

---

## 10. Harvesting

Harvest a fully matured growth to collect its product — a spore, powder, tea, or toxin,
depending on its function and preparation. Harvesting **resets** the growth's maturation:
the mycelium survives and the growth will regrow, but it must fully mature again before
it can be harvested a second time. Prepared products keep only for their window (saves 1
hour, teas 24 hours, powders 1 week) before they lose potency.
