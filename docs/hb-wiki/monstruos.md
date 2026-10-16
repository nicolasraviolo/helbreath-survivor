# Monstruos (wiki)

> Copia de referencia de la wiki de Helbreath (servidor Olympia), descargada el 2026-10-16.
> Fuente: <https://www.helbreath.net/wiki/Monsters_and_drops/> (y la ficha de cada monstruo) · <https://www.helbreath.net/wiki/Monster-mechanics/>
> Una fila por monstruo: vida, elemento, XP, ratios, absorción, resistencias, alcance de aggro, valentía, hechizos y habilidades. Sin drops ni ubicaciones. Ojo: la wiki no da el daño de ataque.
> Los valores son los de ese servidor y pueden diferir del Helbreath original (`docs/REQUISITOS_HB.md`, sacado de los `.cfg` originales). Úsalos como guía de proporciones, no como verdad absoluta. Índice: `README.md`.

## Tabla de monstruos (ordenada por tier)

| Tier | Monstruo | Base HP | Element | Base XP | Physical Hit Ratio | Defense Ratio | Physical absorption | Magical absorption | Magic Resistance | Poison resistance | Freeze resistance | Aggro range | Bravery | Hechizos | Habilidades |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Cat | 14 | Earth | 400 | 45 | 20 | 0% | 0% | 20 | 12% | 10% | 5 | 1–3 | None | Crush |
| 1 | Dummy | 200,000 | Neutral | 0 |  | 1 | 0% | 0% | 1 | 0% | 0% |  |  | None | Fixed damage-test target; does not attack |
| 1 | Giant Ant | 10 | Ice | 700–1,749 | 40 | 15 | 0% | 0% | 10 | 6% | Immune | 3 | 25–27 | None | Crush |
| 1 | Rabbit | 14 | Earth | 250 | 35 | 10 | 0% | 0% | 5 | 3% | 3% | 2 | 1–3 | None | Crush |
| 1 | Slime | 7 | Earth | 400–499 | 30 | 10 | 0% | 0% | 5 | 3% | 3% | 3 | 20–22 | None | Crush |
| 1 | Snake | 13 | Earth | 1,000–2,499 | 50 / Dash Attack: 65 | 30 | 0% | 0% | 20 | 12% | 10% | 4 | 20–22 | None | Crush; Dash |
| 2 | Giant Scorpion | 30 | Earth | 2,200–5,499 | 70 / Dash Attack: 91 | 45 | 10% | 24% | 30 | 18% | 15% | 4 | 30–32 | None | Crush; Dash |
| 2 | Orc | 20 | Fire | 1,300–3,249 | 60 / Dash Attack: 78 | 40 | 0% | 0% | 25 | 15% | 13% | 5 | 25–27 | None | Crush; Dash |
| 2 | Orc (spellcaster) | 59 | Fire | 3,250 | 100 / Dash Attack: 130 | 45 | 10% | 24% | 45 | 27% | 23% | 6 | 30–32 | Fire-Ball | Crush; Dash |
| 2 | Skeleton | 44 | Ice | 2,600–6,500 | 90 / Dash Attack: 117 | 65 | 10% | 23% | 40 | 24% | Immune | 5 | 80–82 | None | Crush; Dash |
| 2 | Zombie | 54 | Earth | 2,600–6,500 | 85 | 65 | 10% | 23% | 30 | 18% | 15% | 6 | 80–82 | None | Crush |
| 3 | Clay Golem | 140 | Fire | 4,400–11,000 | 135 / Dash Attack: 175 | 100 | 15% | 28% | 50 | 30% | 25% | 5 | 90–92 | None | Crush; Dash |
| 3 | Stone Golem | 120 | Earth | 4,000–9,999 | 135 / Dash Attack: 175 | 110 | 15% | 28% | 50 | 30% | 25% | 5 | 90–92 | None | Crush; Dash |
| 4 | Frog | 145 | Earth | 5,400–13,500 | 145 / Dash Attack: 188 | 85 | 15% | 33% | 60 | 36% | 30% | 7 | 100–102 | None | Crush; Dash |
| 4 | Helhound | 163 | Lightning | 5,200–12,999 | 170 / Dash Attack: 221 | 90 | 15% | 33% | 60 | 36% | 30% | 7 | 100–102 | Lightning; Lightning-Arrow | Crush; Dash |
| 4 | Rudolph | 187 | Ice | 5,900–14,750 | 180 / Dash Attack: 234 | 100 | 15% | 33% | 60 | 36% | Immune | 7 | 100–102 | None | Crush; Dash |
| 5 | Cannibal Plant | 480 | Earth | 16,249–26,000 | 230 | 110 | 20% | 37% | 84 | 50% | 42% | 7 | 100–102 | Lightning; Lightning-Arrow | Crush |
| 5 | Cyclops | 275 | Fire | 8,500–21,249 | 180 / Dash Attack: 234 | 110 | 20% | 37% | 78 | 46% | 39% | 7 | 100–102 | Fire-Strike | Crush; Dash |
| 5 | Troll | 258 | Earth | 6,500–16,250 | 200 / Dash Attack: 260 | 100 | 18% | 35% | 72 | 43% | 36% | 7 | 100–102 | None | Crush; Dash |
| 6 | Beholder | 400 | Lightning | 15,000–37,500 | 450 | 100 | 30% | 45% | 84 | 50% | 42% | 7 | 100–102 | None | Crush; Can apply a 5 s freeze before a non-adjacent physical attack; separate resistance check, not conditional on that attack hitting |
| 6 | Claw Turtle | 549 | Ice | 28,125–45,000 | 280 / Dash Attack: 364 | 200 | 20% | 37% | 96 | 57% | Immune | 8 | 100–102 | None | Crush; Dash |
| 6 | Direboar | 595 | Earth | 15,500–31,001 | 230 / Dash Attack: 299 | 80 | 20% | 37% | 72 | 43% | 36% | 7 | 100–102 | None | Crush; Dash |
| 6 | Giant Crayfish | 320 | Ice | 18,750–30,000 | 200 / Dash Attack: 260 | 150 | 20% | 37% | 72 | 43% | Immune | 5 | 100–102 | None | Crush; Dash |
| 6 | Giant Tree | 458 | Earth | 14,000 | 200 | 160 | 20% | 37% | 84 | 50% | 42% | 6 | 100–102 | None | Crush |
| 6 | Ice Golem | 458 | Ice | 10,000–24,999 | 100 | 80 | 20% | 37% | 78 | 46% | Immune | 7 | 100–102 | Ice-Whirlwind centered on itself when attacking an adjacent target | Crush |
| 6 | Ogre | 526 | Lightning | 19,375–38,750 | 230 | 150 | 20% | 37% | 84 | 50% | 42% | 7 | 100–102 | None | Crush |
| 6 | Tentocle | 366 | Earth | 39,999 | 180 / Dash Attack: 234 | 150 | 20% | 37% | 78 | 46% | 39% | 5 | 100–102 | Lightning; Lightning-Arrow | Crush; Dash |
| 6 | Werewolf | 601 | Earth | 25,624–51,249 | 300 / Dash Attack: 390 | 200 | 25% | 45% | 96 | 57% | 48% | 7 | 100–102 | None | Crush; Dash |
| 7 | Darkelf | 521 | Earth | 16,000–39,999 | 450 | 200 | 35% | 55% | 72 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 43% | 36% | 8 | 100–102 | None | Crush |
| 7 | Ettin | 786 | Lightning | 28,125–56,250 | 375 / Dash Attack: 487 | 325 | 43% | 52% | 108 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 64% | 54% | 8 | 100–102 | None | Crush; Dash; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 7 | Frost | 557 | Ice | 16,000–32,000 | 230 | 275 | 25% | 40% | 100 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 60% | Immune | 7 | 100–102 | Ice-Strike | Crush; Can apply a 5 s freeze before a non-adjacent physical attack; separate resistance check, not conditional on that attack hitting |
| 7 | Ghost | 400 | Neutral | 34,999 | 200 | 85 | 20% | 33% | 80 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 48% | 40% | 7 | 100–102 | None | Crush; Can acquire invisible targets |
| 7 | Liche | 579 | Ice | 15,500–38,750 | 230 | 275 | 25% | 42% | 90 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 54% | Immune | 7 | 100–102 | Lightning-Bolt | Crush |
| 7 | Mountain Giant | 499 | Earth | 19,375–38,750 | 230 | 250 | 24% | 40% | 90 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 54% | 45% | 7 | 100–102 | None | Crush |
| 7 | Stalker | 557 | Earth | 19,375–38,750 | 300 / Dash Attack: 390 | 200 | 25% | 42% | 96 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 57% | 48% | 7 | 100–102 | None | Crush; Dash |
| 8 | Centaur | 1,953 | Earth | 260,000 | 500 / Dash Attack: 650 | 350 | 25% | 36% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Paralyze; Energy-Strike | Crush; Dash; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 8 | Demon | 1,391 | Neutral | 110,000–220,001 | 500 / Dash Attack: 650 | 350 | 45% | 52% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Mass-Fire-Strike | Crush; Dash; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 8 | Gargoyle | 1,635 | Neutral | 150,000–300,000 | 500 | 350 | 45% | 52% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Mass-Fire-Strike | Crush; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 8 | Master Mage Orc | 1,303 | Fire | 64,000–128,000 | 375 / Dash Attack: 487 | 300 | 30% | 42% | 120 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 72% | 60% | 8 | 100–102 | Mass-Fire-Strike | Crush; Dash; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 8 | Minotaur | 2,023 | Earth | 260,000 | 500 / Dash Attack: 650 | 375 | 20% | 30% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | None | Crush; Dash; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 8 | Unicorn | 1,150 | Neutral | 100,000–200,000 | 500 | 350 | 41% | 48% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Paralyze; Energy-Strike | Crush; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 9 | Dragon | 2,864 | Fire | 120,000–240,000 | 500 / Dash Attack: 650 | 325 | 23% | 34% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Mass-Fire-Strike | Crush; Dash; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 9 | Giant Lizard | 5,688 | Ice | 252,000 | 400 / Dash Attack: 520 | 325 | 15% | 22% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Immune | 9 | 100–102 | Paralyze; Energy-Strike | Crush; Dash; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 9 | Nizie | 1,561 | Ice | 88,000–176,000 | 375 / Dash Attack: 487 | 300 | 25% | 36% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Immune | 9 | 100–102 | Ice-Strike | Crush; Dash; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP; Can apply a 5 s freeze before a non-adjacent physical attack; separate resistance check, not conditional on that attack hitting |
| 10 | Helclaw | 4,550 | Neutral | 300,000–600,000 | 1,000 | 350 | 43% | 65% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Mass-Fire-Strike | Crush; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 10 | Tiger Worm | 9,100 | Neutral | 750,000–1,500,000 | 1,200 | 350 | 43% | 65% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Lightning-Strike | Crush; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 11 | Abaddon | 200,000 | Neutral | 6,000,000 | 1,600 | 375 | 45% | 70% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Earth-Shock-Wave; Meteor-Strike | Crush; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 11 | Elementalist | 50,000 | Earth, Lightning, Fire or Ice / random initial element, may change during combat | 2,000,000 | 1,000 | 300 | 40% | 60% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Immune while Ice / Not verified in other elements | H: 12 / V: 9 | 100–102 | Earth: Tremor, Earthworm-Strike, Earth-Shock-Wave; Lightning: Lightning, Lightning-Strike, Mass-Magic-Missile, Fury-Of-Thor; Fire: Mass-Fire-Strike, Meteor-Strike, Hellfire; Ice: Mass-Ice-Strike, Mass-Chill-Wind, Blizzard; any element: Mass-Illusion-Movement against players; on death: Hellfire, Earth-Shock-Wave, Blizzard and Fury-Of-Thor | Crush; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP; Summons up to 3 living minions: Skeleton, Clay Golem, Stone Golem, Orc (spellcaster), Helhound or Cyclops; Element-dependent clustered spell attacks; elemental spell burst on death; Special attack and summon AI can continue while held; Further reduces player magic absorption to three quarters after the usual NPC attacker modifiers |
| 11 | Fire Wyvern | 21,629 | Fire | 1,000,000–2,000,000 | 1,300 | 375 | 40% | 55% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Not verified | 9 | 100–102 | Mass-Fire-Strike | Crush; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |
| 11 | Wyvern | 15,730 | Ice | 900,000–1,800,000 | 1,300 | 375 | 40% | 55% | 1 / Hold/paralyze: 3 s (Holy: 4 s) / Reapplication: 15 s | 0% | Immune | 9 | 100–102 | Blizzard; Mass-Chill-Wind | Crush; Returns 5% of damage taken to attacking players on the same map, rounded to nearest HP |

## Monster mechanics

Monster bravery, fleeing and experience awards.

### Monster Bravery

Bravery affects low-HP fleeing and resistance to nearby danger. The displayed range covers variation between spawns.

A monster receives a fixed Bravery value when it spawns. The value is the configured base plus a random 0–2; Wild and Berserked statuses do not change it.

Both fleeing checks apply during normal combat with a living target, not while held or paralyzed; special behavior can bypass them.

At 7% HP or lower, a normal fleeing check rolls an integer from 1 through Bravery. A result of 8 or lower triggers fleeing. Values up to 8 always pass this roll; above 8, higher Bravery reduces the chance. This is a behavior check, not a chance rolled for each hit or each second.

Nearby danger is measured within 2 tiles along each axis, centered on the monster. Fire adds 1 per tile; a unit on another side adds 1, while a unit on the monster's side subtracts 1. The monster flees when this total exceeds its Bravery. Danger cannot exceed 50 in this area, so Bravery of 50 or higher prevents danger-based fleeing, not low-HP fleeing.

### Monster experience

For normal player kills of nonsummoned monsters outside arenas, XP can be awarded during the fight and at death. Base XP is an allocation budget, not a promise of the XP a character receives.

Accepted nonlethal physical damage can pay XP directly to the attacker from a finite damage reserve. These payments are not party-shared. A killing hit uses the death award rather than receiving an additional normal nonlethal payment. Spell damage has different immediate-award conditions, so the physical example below is not a general spell-XP calculation.

The death pool combines a fixed death portion with the unused damage reserve. In a stable solo kill, the player receives the whole death pool. Otherwise, allocations follow retained player or party damage credit. Only a party's allocation enters party sharing, subject to member eligibility, not the monster's entire Base XP. Personal bonuses, penalties, rebirth and rested XP then affect the actual awards.

Credit can change during a prolonged fight. Variant adjustments and rounding can change the split, so the listed Base XP alone is not enough to reconstruct every award.

With multiple retained entries, or a sole party entry, each entry's calculated allocation is:

Ai=trunc(1+Edi∑jdj).

E is the death pool, not Base XP; di is that entry's retained damage credit. A sole party entry is allocated the death pool plus 1 before party sharing. A sole direct-player entry instead uses the whole-death-pool branch. These are allocations, not guaranteed payments to every recorded contributor.

Consider a normal, non-Wild, non-Berserk Slime with 7 HP and 400 Base XP. The initial damage reserve is 267 and the fixed death portion is 133. The same living player makes separate physical attacks removing 3 HP, then the remaining 4 HP. Assume no regeneration, changing credit, extra hits or special encounter rules.

| Stage | XP before personal modifiers |
|---|---|
| Nonlethal payment to attacker | 3 |
| Remaining damage reserve | 264 |
| Death pool | 397 |
| Solo total | 400 |

Now put that attacker in a stable two-member party, with both members eligible for sharing at the monster's death. All damage credit belongs to the party. Its death allocation is 398, and each member's share is trunc(0.5+398·1.2/2)=239. The attacker also keeps the direct payment of 3: the totals are 242 for the attacker and 239 for the teammate, before personal modifiers. These are separate awards, not a single received-XP prediction.
