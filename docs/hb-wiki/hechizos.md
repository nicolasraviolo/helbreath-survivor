# Hechizos (wiki)

> Copia de referencia de la wiki de Helbreath (servidor Olympia), descargada el 2026-10-16.
> Fuente: <https://www.helbreath.net/wiki/Spells/>
> Hechizos por círculo: Int requerida, maná, elemento, daño/efecto y área. Elementos y debilidades, efectos en el tiempo (quemadura, veneno, congelación).
> Los valores son los de ese servidor y pueden diferir del Helbreath original (`docs/REQUISITOS_HB.md`, sacado de los `.cfg` originales). Úsalos como guía de proporciones, no como verdad absoluta. Índice: `README.md`.

## Spells

Casting, elemental matchups, summoning and spell effects.

The listed spell amounts are base values, before character stats, equipment, talents, target defenses and map modifiers. The Area column gives the size of the target area, not casting range. Line spells also affect their path. A target may receive both direct and area damage.

### Spell casting

- Select a spell from the Magic List, prepare it, then click the target or ground tile.

- Stunning damage or knockback can interrupt preparation or clear the prepared targeting state. A failed casting-probability roll spends no mana, but the spell must be prepared again.

- Ground targeting does not automatically select a nearby unit. Location restrictions can prevent a cast.

#### Spell casting chance calculation

Casting chance depends on effective Magic skill, effective Intelligence, level, spell circle and equipped Casting Probability. Level includes rebirth and is capped at 140.

The calculated chance input is at least 1; results at least 100 bypass this roll. Below that threshold, the input is approximately the percentage of circle rolls that pass. Hunger or exhausted stamina can still cause a separate failure, and other casting and target checks still apply: passing this roll does not guarantee that the spell takes effect.

These formulas describe the calculation, but exact results at rounding-sensitive boundaries remain unverified.

Use level A=min(L+R,140) and mage level M=⌊A/10⌋, using displayed level L, rebirth level R, and circle C.

| Circle | Probability coefficient P | Penalty coefficient K |
|---|---|---|
| 1 | 300 | 5 |
| 2 | 250 | 5 |
| 3 | 200 | 8 |
| 4 | 150 | 8 |
| 5 | 100 | 10 |
| 6 | 80 | 14 |
| 7 | 70 | 28 |
| 8 | 60 | 32 |
| 9 | 50 | 36 |
| 10 | 40 | 40 |

The base input is

B=⌊((20+0.8S)/100)PC⌋+⌊max(I−50,0)/2⌋,

where S is effective Magic skill and I is effective Intelligence. Floor notation rounds nonnegative values down. If C<M, add 5(M−C). If C>M, subtract

(C−M)KC−⌊A−10M10(C−M)(C−M)KC⌋.

Add the equipped Casting Probability stat after the circle adjustment. The integer roll threshold introduces a very small rounding difference from the chance input.

### Notes about spell effects

- Direct and area damage are separate components. Units around the target receive only the components whose tiles they occupy. Line spells can revisit a unit along their path.

- Safe mode does not add a mana surcharge. Ally/party damage restrictions and arena exceptions are checked separately. Summons do not necessarily share player-safe-mode immunity.

- Beneficial spells can affect enemies when their target rules permit it.

- Defense Shield, Great Defense Shield, Protection from Magic and Absolute Magic Protection share the protection-effect slot. Existing protection prevents replacement through the normal spell path.

- Berserk can replace Minor Berserk, but not vice versa.

- Persistent damaging fields are normally blocked in towns and farms; Crusade changes that restriction. Their monster damage does not use ordinary player-attributed experience handling.

#### Effects over time

- Burn: can stun. It does not use the normal spell calculation for Magic Absorption. Protection effects and whether the game can still identify the attacker can change the result.

- Poison: Natural poison cannot kill player targets. This is not a universal guarantee for other targets. Reapplying poison normally leaves the existing poison in place; the Poison talent can request an extra tick.

- Freeze: slows movement. Ice spells can gain a different base-damage modifier against targets that were already frozen before the cast.

Natural poison first deals damage on the next eligible update. Its player timer then advances in 8-second steps. A monster’s next natural tick is due after 4 seconds, followed by 8-second steps. Polling can delay ticks. The resistance check begins after the second natural tick; an extra reapplication tick does not advance this timer.

#### Summon Creature

Target yourself or an eligible allied player to summon a follower. Use /hold to stop your living summoned followers and /free to release that hold. /tgt player directs them at an eligible enemy player on the same map; forced-party maps restrict this command. The table shows possible creatures at the listed effective Magic skill values, not their selection probabilities.

| Magic skill % | Possible creatures | Ordinary creature capacity |
|---|---|---|
| 10 | None | 0 |
| 20 | Slime, Giant Ant | 1 |
| 30 | Slime, Giant Ant, Snake | 1 |
| 40 | Giant Ant, Snake, Orc | 2 |
| 50 | Giant Ant, Snake, Orc, Skeleton | 2 |
| 60 | Snake, Orc, Skeleton, Clay Golem | 3 |
| 70 | Snake, Orc, Skeleton, Clay Golem, Stone Golem | 3 |
| 80 | Orc, Skeleton, Clay Golem, Stone Golem, Orc (spellcaster) | 4 |
| 90 | Orc, Skeleton, Clay Golem, Stone Golem, Orc (spellcaster), Helhound | 4 |
| 100 | Skeleton, Clay Golem, Stone Golem, Orc (spellcaster), Helhound, Cyclops | 5 |

Dead followers can continue consuming capacity until removed. Summoning is also subject to map/event restrictions.

### Elements

Against monsters, using their weak element increases this damage stage by 20%; using their own element reduces it by 20%. Other pairings in this table are neutral. Final damage need not differ by exactly that percentage.

| Attacking spell element | Earth monster | Lightning monster | Fire monster | Ice monster |
|---|---|---|---|---|
| Earth | Penalty | Bonus | No modifier | No modifier |
| Lightning | No modifier | Penalty | No modifier | Bonus |
| Fire | Bonus | No modifier | Penalty | No modifier |
| Ice | No modifier | No modifier | Bonus | Penalty |

Integer damage truncates after the elemental multiplier.

### Circle 1

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Magic Missile | 14 | 4 | Lightning | 10 base damage to target. | 1×1 | 400 gold |
| Heal | 14 | 8 | None | Restores 15 HP before Holy bonus. | 1×1 | 400 gold |
| Create Food | 10 | 18 | None | Creates food on an eligible ground tile. | 1×1 | 400 gold |
| Meditation | 40 | 20% caster max MP | None | Restores 30% of caster max MP to target; sets mana stock to 15% of caster max MP, or keeps larger existing stock, for the next eligible natural mana regeneration; restores 33 HP, or 66 with Holy. | 1×1 | Holy or Merien talent |
| Transfer Criticals | 10 | 35 | None | Transfers stored criticals to the target player. | 1×1 | Merien talent |
| Divine Touch | 20 | 13% caster max MP | None | Consumes 100 Faith. Deals 2 direct hits and 2 area hits, with base damage per hit based on the caster's displayed level. Also heals eligible allies. | 3×3 | Holy talent |

Meditation rounds down its mana restoration and mana stock amounts.

Divine Touch uses 3+⌊0.30L⌋ base damage per hit, where L is the caster's displayed level.

### Circle 2

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Energy Bolt | 24 | 13 | Lightning | 10 direct damage plus 7 area damage. | 3×3 | 600 gold |
| Stamina Drain | 22 | 14 | None | Drains 28 SP directly and 15 SP in the area, subject to target protection. | 3×3 | 600 gold |
| Recall | 10 | 0 | None | Recalls to town at level 120 or higher, otherwise to the farm. Recent player damage can block it; map restrictions apply. | 1×1 | 400 gold |
| Defense Shield | 26 | 19 | None | Player Defense Ratio addition 40 for 60 seconds, before facing/talent modifiers; not applied while the defender uses Archery or against distant arrow NPCs. | 1×1 | 600 gold |
| Celebrating Light | 25 | 10 | Lightning | Fireworks at the target tile. | 1×1 | 900 gold |
| Minor Berserk | 23 | 26 | None | Adds 40% to a player target’s noncritical physical-damage multiplier for 60 seconds. NPC damage uses a different modifier. | 1×1 | 1600 gold |

### Circle 3

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Fireball | 26 | 27 | Fire | 8 direct damage plus 11 area damage. | 3×3 | 1000 gold |
| Great Heal | 28 | 28 | None | Restores 33 HP before Holy bonus. | 1×1 | 1000 gold |
| Stamina Recovery | 20 | 20 | None | Restores 22 SP directly and 12 SP in the area before Holy bonus. | 3×3 | 700 gold |
| Protection from Arrows | 20 | 22 | None | Protects against ordinary arrow attacks for 60 seconds. | 1×1 | 700 gold |
| Hold Person | 26 | 24 | None | Prevents movement for a base 30 seconds; Holy and high-tier monster rules can change duration. Damage can clear or shorten it. Monsters do not regenerate HP while held or paralyzed. | 1×1 | 1000 gold |
| Possession | 26 | 25 | None | Picks up an item from an unoccupied target ground tile, subject to carry restrictions. | 1×1 | 1000 gold |
| Poison | 29 | 28 | None | Applies poison with base natural-tick damage 4, before Poison talent effects and the damage limit applied before the target’s other damage rules. Natural ticks cannot kill player targets; other targets use their own subsequent damage processing. See poison timing and reapplication. | 1×1 | 1200 gold |
| Great Stamina Recovery | 30 | 45 | None | Restores 40 SP directly and 23 SP in the area before Holy bonus. | 3×3 | 1300 gold |

### Circle 4

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Fire Strike | 34 | 36 | Fire | 8 direct damage plus 13 area damage. | 5×5 | 1500 gold |
| Summon Creature | 38 | 35 | None | Summons an allied creature for 5 minutes, subject to capacity and map restrictions. | 1×1 | 1500 gold |
| Invisibility | 30 | 31 | None | Makes an eligible target invisible for 60 seconds. | 1×1 | 1300 gold |
| Protection from Magic | 32 | 35 | None | Blocks ordinary lower-circle player spells through Circle 8; monster magic uses different rules. Lasts 60 seconds. | 1×1 | 2400 gold |
| Detect Invisibility | 30 | 33 | None | Removes invisibility around the target location. | 17×17 | 1200 gold |
| Paralyze | 36 | 35 | None | Prevents movement for a base 25 seconds; Holy and high-tier monster rules can change duration. Damage can clear or shorten it. Monsters do not regenerate HP while held or paralyzed. | 1×1 | 1500 gold |
| Cure | 35 | 32 | None | Cures poison. | 1×1 | 1200 gold |
| Lightning Arrow | 38 | 30 | Lightning | 30 base damage to target. | 1×1 | 1600 gold |
| Tremor | 33 | 34 | Earth | 5 direct damage plus 16 area damage. | 3×3 | 1500 gold |

### Circle 5

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Firewall | 45 | 42 | Fire | Creates damaging tiles. Each tile applies 3 base damage in the surrounding 3×3 area, normally once every 3 seconds. Actual timing may vary. Lifetime depends on weather and existing tile state; recasting on an existing fire tile does not restart its lifetime. | 1×5 (or diagonal line) | 1700 gold |
| Fire Field | 48 | 48 | Fire | Creates damaging tiles. Each tile applies 3 base damage in the surrounding 3×3 area, normally once every 3 seconds. Actual timing may vary. Lifetime depends on weather and existing tile state; recasting on an existing fire tile does not restart its lifetime. | 3×3 | 1900 gold |
| Confuse Language | 42 | 40 | None | Can scramble outgoing chat for 120 seconds on eligible enemy players. | 1×1 | 1800 gold |
| Lightning | 47 | 40 | Lightning | 41 base damage to target. | 1×1 | 2100 gold |
| Great Defense Shield | 46 | 45 | None | Player Defense Ratio addition 100 for 40 seconds, before facing/talent modifiers; not applied while the defender uses Archery or against distant arrow NPCs. | 1×1 | 1900 gold |
| Chill Wind | 50 | 48 | Ice | 1 area hit of 19 base damage. Freeze requires the Ice talent; already-frozen targets use a modified base amount. | 3×3 | 2300 gold |
| Poison Cloud | 49 | 48 | None | Creates damaging tiles. Each tile applies 3 base damage in the surrounding 3×3 area, normally once every 3 seconds. Actual timing may vary. A new tile is initially set to last 31–34 seconds. Reusing an existing tile or later updates can change when it expires. May apply poison. | 3×3 | 2200 gold |
| Triple Energy Bolt | 45 | 40 | Lightning | 10 direct damage plus 19 area damage. | 5×5 | 2100 gold |
| Scan | 50 | 50 | None | Reports the target’s current HP and MP. | 1×1 | 2300 gold |

### Circle 6

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Berserk | 59 | 57 | None | Adds 100% to a player target’s noncritical physical-damage multiplier for 60 seconds. NPC damage uses a different modifier. | 1×1 | 4500 gold |
| Lightning Bolt | 50 | 58 | Lightning | Path and target-area passes deal 12 each; the direct target also receives 30. Hit count depends on overlapping path visits. | 3×3 | 2600 gold |
| Haste | 62 | 60 | None | Hastes another eligible player for 6 seconds; cannot normally target yourself. Run-animation frame duration is reduced by 25% before other animation modifiers. | 1×1 | Manual |
| Mass Poison | 52 | 54 | None | Applies poison with base natural-tick damage 10, before Poison talent effects and the damage limit applied before the target’s other damage rules. Natural ticks cannot kill player targets; other targets use their own subsequent damage processing. See poison timing and reapplication. | 1×1 | 2400 gold |
| Spike Field | 56 | 56 | Lightning | Entering a spike tile applies base damage 5 to players and 8 to monsters before their damage handling; not a per-step chance roll. | 5×5 | 2500 gold |
| Ice Storm | 59 | 70 | Ice | 20 base damage per field hit, before magic-crush and target-specific adjustments; can freeze affected units. | 5×5 | Manual |
| Mass Lightning Arrow | 53 | 53 | Lightning | 55 base damage to target. | 1×1 | 2900 gold |
| Ice Strike | 60 | 59 | Ice | 1 area hit of 33 base damage. Freeze requires the Ice talent; already-frozen targets use a modified base amount. | 5×5 | 3600 gold |
| Mass Heal | 60 | 56 | None | Heals up to 3 non-enemy targets for 52 HP with Holy; the underlying heal is 26 before that modifier. | 5×5 | Holy talent |

### Circle 7

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Energy Strike | 67 | 65 | Lightning | 42 area damage. | 5×5 | 4000 gold |
| Mass Fire Strike | 75 | 72 | Fire | 11 direct damage plus 43 area damage. | 5×5 | 4400 gold |
| Confusion | 75 | 78 | None | Obscures allegiance for 20 seconds on eligible enemy players. | 3×3 | 5100 gold |
| Mass Chill Wind | 85 | 85 | Ice | 2 area hits of 17 base damage. Freeze requires the Ice talent; already-frozen targets use a modified base amount. | 5×5 | 6000 gold |
| Earthworm Strike | 97 | 80 | Earth | 49 area damage. | 3×3 | 6700 gold |
| Absolute Magic Protection | 112 | 100 | None | Protection against ordinary player spell damage; Cancellation can remove it. Monster magic is handled differently. | 1×1 | 7200 gold |
| Armor Break | 97 | 120 | None | 2 area hits of 15; damages eligible worn armor endurance. | 3×3 | 9100 gold |

### Circle 8

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Bloody Shock Wave | 105 | 120 | Lightning | Path and target-area passes deal 27 each; the direct target also receives 52. Hit count depends on overlapping path visits. | 3×3 | Manual |
| Mass Confusion | 130 | 125 | None | Obscures allegiance for 60 seconds on eligible enemy players. | 5×5 | 7700 gold |
| Mass Ice Strike | 118 | 115 | Ice | 2 area hits of 25 base damage. Freeze requires the Ice talent; already-frozen targets use a modified base amount. | 5×5 | 9400 gold |
| Cloud Kill | 120 | 130 | None | Creates damaging tiles. Each tile applies 5 base damage in the surrounding 3×3 area, normally once every 3 seconds. Actual timing may vary. A new tile is initially set to last 31–34 seconds. Reusing an existing tile or later updates can change when it expires. May apply poison. | 5×5 | 9100 gold |
| Lightning Strike | 123 | 85 | Lightning | 50 area damage. | 5×5 | 9600 gold |
| Ice Whirlwind | 200 | 120 | Ice | 2 area hits of 33 base damage. Freeze requires the Ice talent; already-frozen targets use a modified base amount. | 3×3 | Monster spell |
| Cancellation | 135 | 835 | None | Removes cancellable effects. Preparation starts a 60-second cooldown. Eligible preparation requests have approximately 15% extra chance to lose 1 charge while more than 2 remain, including requests rejected during preparation; a completed cast separately spends 1 charge. | 1×1 | Wand |
| Illusion Movement | 160 | 150 | None | Reverses movement for 20 seconds on eligible enemy players. | 3×3 | 11200 gold |

### Circle 9

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Illusion | 150 | 143 | None | Obscures other players with a shared altered appearance for 20 seconds on eligible enemy players. | 3×3 | 11000 gold |
| Meteor Strike | 155 | 120 | Fire | 33 direct damage plus 55 area damage. | 3×3 | 12100 gold |
| Mass Magic Missile | 150 | 105 | Lightning | 42 direct damage plus 48 area damage; can move affected units. | 3×3 | 12700 gold |
| Inhibition Casting | 150 | 160 | None | Inhibits casting for 40 seconds on eligible enemy players; protection can shorten or block it. | 1×1 | Manual or wand |

### Circle 10

| Spell | INT | Base mana | Element | Effect | Area | Learning |
|---|---|---|---|---|---|---|
| Mass Illusion | 180 | 200 | None | Obscures other players with a shared altered appearance for 60 seconds on eligible enemy players. | 3×3 | 12800 gold |
| Blizzard | 195 | 185 | Ice | Path and target-area passes deal 46 each; the direct target also receives 46. Already-frozen targets use a modified base amount; total hits depend on path overlap. | 5×5 | Ice talent |
| Resurrection | 0 | 200 | None | On acceptance, resurrects the dead player with half maximum HP; wand and map restrictions apply. | 1×1 | Wand |
| Mass Illusion Movement | 200 | 200 | None | Reverses movement for 25 seconds on eligible enemy players. | 3×3 | Manual or wand |
| Earth Shock Wave | 190 | 185 | Earth | Path and area visits apply 33 then 33; the direct target also receives 33 then 33. Total hit count depends on path overlap. | 3×3 | Earth talent |
| Hellfire | 200 | 185 | Fire | 2 direct hits of 30 and 2 area hits of 30. | 5×5 | Fire talent |
| Fury of Thor | 182 | 170 | Lightning | Path and target-area passes deal 48 each; the direct target also receives 48. Hit count depends on overlapping path visits. | 5×5 | Lightning talent |

Resurrection's restored HP is rounded down.

#### Circle contribution to spell hit ratio

Spell circle also modifies spell hit ratio according to the caster's level. At level 140, the lower-circle bonus adds 20 for Circle 10 spells, 50 for Paralyze, and 55 for Hold Person. These are circle contributions, not final hit ratios or success percentages.

For a lower circle, add 5(M−C); for a higher circle, use the penalty expression in the casting-chance calculation above, with the same rounding-boundary qualification. M is mage level and C is spell circle, as defined there. The lower-circle contribution is an integer.

### Holy duration

The spell caster's Holy talent grants the longer hold or paralyze duration shown.
