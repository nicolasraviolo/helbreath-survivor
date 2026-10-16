# Personaje y stats (wiki)

> Copia de referencia de la wiki de Helbreath (servidor Olympia), descargada el 2026-10-16.
> Fuente: <https://www.helbreath.net/wiki/Character_Development/>
> Experiencia por nivel y qué hace cada stat (Str, Vit, Dex, Int, Mag, Luck).
> Los valores son los de ese servidor y pueden diferir del Helbreath original (`docs/REQUISITOS_HB.md`, sacado de los `.cfg` originales). Úsalos como guía de proporciones, no como verdad absoluta. Índice: `README.md`.

## Character Development

Verified character stats, XP thresholds, rebirth and Tutelary Angel progression.

### Leveling

Characters start at displayed level 1 and stop gaining displayed levels at 140. Each displayed level gained adds 3 allocatable stat points. At the cap, further experience earns Majestic points. Each Majestic costs the difference between the next experience threshold and the level-cap threshold: 1,895,000 XP. Surplus XP carries forward, even when an award earns several Majestics.

#### Level and displayed level

In this wiki, level means adjusted level unless stated otherwise: your displayed level plus your rebirth level, capped at the normal level cap.

Displayed level excludes rebirth levels. Rules that use displayed level say so explicitly.

HP gains from displayed level alternate between 2 and 3. MP and SP each gain 2 per displayed level; carrying capacity gains 5. These are base maxima: HP-changing equipment, the red slate and Xelima apply further modifiers.

Displayed level also determines base rechargeable critical capacity; see Combat for critical damage. Casting probability depends on level; see Spells.

Calculation details A=min(140,L+R)

Here, L is displayed level and R is rebirth level. For base resources, STR, VIT, INT and MAG are effective stats, including applicable angel and talent bonuses:

| Resource | Base maximum |
|---|---|
| HP | 2VIT+⌊5L/2⌋+⌊2STR/3⌋ |
| MP | 2MAG+2L+⌊INT/2⌋ |
| SP | 10+STR+2L |
| Carrying weight, displayed units | 5(STR+L) |

Base rechargeable critical capacity is ⌊L/10⌋.

#### Total experience thresholds

The table gives cumulative XP thresholds for displayed levels, not just the XP needed for the next level. XP awards and rebirth penalties do not change these thresholds.

| Level | Total XP | Level | Total XP | Level | Total XP | Level | Total XP |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 36 | 4,618,000 | 71 | 22,783,000 | 106 | 58,430,000 |
| 2 | 5,100 | 37 | 4,925,000 | 72 | 23,544,000 | 107 | 59,733,000 |
| 3 | 13,400 | 38 | 5,243,000 | 73 | 24,320,000 | 108 | 61,053,000 |
| 4 | 26,400 | 39 | 5,574,000 | 74 | 25,110,000 | 109 | 62,390,000 |
| 5 | 44,600 | 40 | 5,915,000 | 75 | 25,915,000 | 110 | 63,744,000 |
| 6 | 68,500 | 41 | 6,269,000 | 76 | 26,734,000 | 111 | 65,114,000 |
| 7 | 98,400 | 42 | 6,634,000 | 77 | 27,568,000 | 112 | 66,501,000 |
| 8 | 134,700 | 43 | 7,011,000 | 78 | 28,417,000 | 113 | 67,904,000 |
| 9 | 177,600 | 44 | 7,400,000 | 79 | 29,281,000 | 114 | 69,325,000 |
| 10 | 227,500 | 45 | 7,802,000 | 80 | 30,159,000 | 115 | 70,763,000 |
| 11 | 284,700 | 46 | 8,215,000 | 81 | 31,053,000 | 116 | 72,217,000 |
| 12 | 349,300 | 47 | 8,641,000 | 82 | 31,961,000 | 117 | 73,689,000 |
| 13 | 421,600 | 48 | 9,079,000 | 83 | 32,885,000 | 118 | 75,177,000 |
| 14 | 501,800 | 49 | 9,530,000 | 84 | 33,823,000 | 119 | 76,683,000 |
| 15 | 590,100 | 50 | 9,994,000 | 85 | 34,777,000 | 120 | 78,206,000 |
| 16 | 686,800 | 51 | 10,470,000 | 86 | 35,746,000 | 121 | 79,746,000 |
| 17 | 791,900 | 52 | 10,959,000 | 87 | 36,731,000 | 122 | 81,304,000 |
| 18 | 905,800 | 53 | 11,460,000 | 88 | 37,731,000 | 123 | 82,878,000 |
| 19 | 1,028,000 | 54 | 11,975,000 | 89 | 38,746,000 | 124 | 84,471,000 |
| 20 | 1,160,000 | 55 | 12,503,000 | 90 | 39,777,000 | 125 | 86,080,000 |
| 21 | 1,301,000 | 56 | 13,043,000 | 91 | 40,823,000 | 126 | 87,707,000 |
| 22 | 1,451,000 | 57 | 13,597,000 | 92 | 41,885,000 | 127 | 89,352,000 |
| 23 | 1,611,000 | 58 | 14,165,000 | 93 | 42,963,000 | 128 | 91,014,000 |
| 24 | 1,780,000 | 59 | 14,745,000 | 94 | 44,057,000 | 129 | 92,694,000 |
| 25 | 1,960,000 | 60 | 15,339,000 | 95 | 45,166,000 | 130 | 94,391,000 |
| 26 | 2,149,000 | 61 | 15,947,000 | 96 | 46,291,000 | 131 | 96,106,000 |
| 27 | 2,348,000 | 62 | 16,568,000 | 97 | 47,433,000 | 132 | 97,839,000 |
| 28 | 2,558,000 | 63 | 17,203,000 | 98 | 48,590,000 | 133 | 99,590,000 |
| 29 | 2,778,000 | 64 | 17,852,000 | 99 | 49,763,000 | 134 | 101,359,000 |
| 30 | 3,008,000 | 65 | 18,514,000 | 100 | 50,952,000 | 135 | 103,145,000 |
| 31 | 3,249,000 | 66 | 19,190,000 | 101 | 52,158,000 | 136 | 104,950,000 |
| 32 | 3,501,000 | 67 | 19,881,000 | 102 | 53,379,000 | 137 | 106,772,000 |
| 33 | 3,764,000 | 68 | 20,585,000 | 103 | 54,617,000 | 138 | 108,613,000 |
| 34 | 4,037,000 | 69 | 21,304,000 | 104 | 55,872,000 | 139 | 110,471,000 |
| 35 | 4,322,000 | 70 | 22,036,000 | 105 | 57,142,000 | 140 | 112,348,000 |

The shared server/client calculation for levels above 1 is X=round(84.72·12·L2.35), rounding a positive half upward. Round X downward to a multiple of 100 below 1,000,000, otherwise to a multiple of 1,000.

### Rebirth

Rebirth restarts displayed-level progression and adds allocatable stat points while retaining learned skills and spells. See Rebirth for eligibility, retained talents, costs, XP penalties, weight restrictions and Normal Mode switching.

### Character stats

The stats are Strength, Vitality, Dexterity, Intelligence, Magic and Luck. Each starts at a minimum of 10. Creation distributes 10 additional points, with each stat restricted to 10–14. Later allocation caps at 200 base points per stat; angels and talents can raise effective stats beyond that cap. Rebirth levels add to the base-stat allowance without applying the adjusted-level cap.

A stat-linked skill's effective mastery cannot exceed twice its effective governing stat or its stored mastery. Normal stored progression caps at 100%. For example, 25 Strength limits Mining to 50% effective mastery. Lowering the stat can lower effective mastery without erasing stored skill.

Redistribute stats through the Majestic stat-change interface, rebirth, or the Stat Change Ticket service. Talents and angels are separate bonuses, not allocations from the base-point pool.

For displayed level L and current rebirth level R, the total base-stat allowance is 70+3(L−1+R). At displayed level 140 with 20 rebirths, this is 547 total base points, or 487 allocatable points above the six stat minima: 10 creation points, 417 from normal levels and 60 from rebirths.

#### Strength

Strength governs Hand Attack, Mining and Manufacturing, and affects equipment requirements and attack speed. Each effective point contributes 1 SP and 5 displayed weight units; adding 3 Strength adds 2 HP before further HP modifiers.

Strength also increases bare-handed base damage and scales non-bow weapon damage. Bows gain their Strength damage bonus only with the matching Archery talent. See Combat for later modifiers.

The HP term is ⌊2STR/3⌋; bare-handed base damage is 1+⌊STR/20⌋.

For non-bow weapons, the full base-damage factor is 1+0.002STR, not just the added fraction. Bows instead gain ⌊STR/30⌋ with the matching talent. Later integer truncation is covered in Combat.

#### Vitality

Each effective Vitality point contributes 2 base HP. Vitality also affects HP and SP regeneration. In normal damage paths, a player target's effective Vitality of at least 10 can reduce spell damage before magical absorption, and physical damage before the hit roll and combo/crush stage. Equipment, target type and special effects can change later damage processing.

Define Q=round((VIT−10)0.6707/2.5), rounding positive halves upward. The normal player-target spell path subtracts Q before effective magical absorption; the physical path subtracts ⌊Q/2⌋ at its earlier stage.

#### Dexterity

Dexterity governs Short Sword, Long Sword, Fencing, Axe, Hammer, Archery, Shield and Fishing. It supplies base Defense Ratio; above 50 it also adds Physical Hit Ratio before the final talent multiplier. See Combat for skill, attack-type and facing rules.

Base Defense Ratio is 2DEX. The eligible Physical Hit Ratio addition is ⌊1.2(DEX−50)+0.5⌋.

#### Intelligence

Intelligence governs Farming and Alchemy, supplies base mana and is used by spell requirements. Above 50 it improves normal casting success, not the later Magic Hit Ratio roll against a target.

The base mana contribution is ⌊INT/2⌋. The eligible casting-probability gain is ⌊(INT−50)/2⌋ percentage points.

#### Magic

Magic governs the Magic and Staff skills and mana regeneration. Each effective point contributes 2 base MP and adds 0.3% of the initial spell-damage stage's damage. Later spell, equipment, talent, target and absorption stages remain separate.

Above 50, Magic also contributes magic resistance before Xelima's modifier and adds Magic Hit Ratio.

The initial positive spell-damage addition is rounded through the integer damage assignment. The eligible resistance contribution is MAG−50; the hit-ratio addition is ⌊1.15(MAG−50)+0.5⌋.

#### Luck

Luck adds 0.33 percentage points per effective point to the crush-roll chance parameter, alongside other bonuses. Crush is separate from critical attacks spent from the rechargeable pool.

For normal first drops, each Luck point adds 0.125% to the relative multiplier, not to the absolute chance of a particular item. Other applicable bonuses share that multiplier. Luck also affects a separate drop-quality/selection factor, so this term cannot predict complete loot results. See Drops and parties.

### Tutelary angels

Bound Angelic Pendants add bonuses to effective stats, separate from base-stat allocation. See Tutelary angel for pendant types, purchase and upgrade procedures, limits and costs.
