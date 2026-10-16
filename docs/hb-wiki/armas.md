# Armas (wiki)

> Copia de referencia de la wiki de Helbreath (servidor Olympia), descargada el 2026-10-16.
> Fuente: <https://www.helbreath.net/wiki/Weapons/> · <https://www.helbreath.net/wiki/Weapon_damage/>
> Armas por familia: daño base, Str para velocidad máxima, Str por peso, índice de velocidad y duración del ataque.
> Los valores son los de ese servidor y pueden diferir del Helbreath original (`docs/REQUISITOS_HB.md`, sacado de los `.cfg` originales). Úsalos como guía de proporciones, no como verdad absoluta. Índice: `README.md`.

## Weapons

Weapon attributes, attack-speed rules and base stats for ordinary weapon families.

### Attributes

| Attribute | Effect |
|---|---|
| Light | Reduces item weight and can reduce weight-related equip and full-speed STR requirements. |
| Agile | Improves attack speed by one speed step, subject to the fastest-speed limit. |
| Strong | Increases maximum endurance. |
| Critical | Adds critical-attack damage when a critical is available and a critical attack is made. |
| Poison | Applies poison on eligible successful hits, subject to resistance and existing poison. Poison damage is a separate periodic effect; see Spells. |
| Sharp | Adds 1 to base weapon damage. |
| Ancient | Adds 2 to base weapon damage. |
| Righteous | Adds damage against a player with lower reputation; see the example below. |
| Crush Chance | Increases the chance of a crushing hit. |
| Crush Damage | Increases the damage multiplier used for a crushing hit. |
| Superior / Exceptional | Separate item templates; use their own values rather than a universal adjustment rule. |

Light and Strong modify the item instance. Critical and crush effects are conditional, not unconditional additions to every hit.

Righteous adds intermediate PvP damage, not guaranteed extra HP loss.

In the archived Righteous example, attacker reputation 400 against target reputation 0 adds 8 intermediate damage. This bonus is applied after the preceding damage multiplier.

### Speed

Attack speed improves in integer STR steps until the weapon-family floor is reached. Short swords have the fastest floor, followed by fencing, then the other listed families. Agile and the Merien talent can improve speed after that floor is applied, but cannot exceed the fastest speed.

The table gives nominal client animation durations for unfrozen human normal attacks without relic slowdown. These are not guaranteed server attack intervals.

| Legacy speed index | Nominal animation duration (ms) |
|---|---|
| 15 | 448 |
| 14 | 536 |
| 13 | 624 |
| 0–12 | 1768–712 |

The nominal client animation duration in milliseconds is 8·(56+(15−v)·11), using the archived speed index v.

### Short Swords

These are base-template values, not complete instance stats or complete equip eligibility. Base weight STR and extra stat gates are separate. Manufactured equipment bypasses the level requirement only. Template endurance excludes Strong, manufacturing, sockets and upgrade modifiers. Armor PA applies at its hit location; shield PA applies only on a successful block. Defense ratio is not absorption. See Reading equipment stats.

Short-sword critical regeneration has a talent-dependent condition; see Talents.

| Name | Weapon skill | Base equip level | Base weapon damage | Base full-speed STR | Base weight STR check | Extra equip stat requirement | Base speed index |
|---|---|---|---|---|---|---|---|
| Dagger | Short Sword | 0 | 2 | 18 | 10 | None | 2 |
| Superior Dagger | Short Sword | 5 | 3 | 22 | 10 | None | 2 |
| Exceptional Dagger | Short Sword | 15 | 4 | 26 | 10 | None | 2 |
| Exceptional Gladius | Short Sword | 35 | 6 | 65 | 35 | None | 5 |
| Main Gauche | Short Sword | 10 | 3 | 31 | 20 | None | 3 |
| Superior Main Gauche | Short Sword | 15 | 4 | 35 | 20 | None | 3 |
| Exceptional Main Gauche | Short Sword | 25 | 5 | 39 | 20 | None | 3 |
| Gladius | Short Sword | 20 | 4 | 57 | 35 | None | 5 |
| Superior Gladius | Short Sword | 25 | 5 | 61 | 35 | None | 5 |
| Falchion | Short Sword | 40 | 6 | 70 | 45 | None | 6 |
| Superior Falchion | Short Sword | 45 | 7 | 74 | 45 | None | 6 |
| Exceptional Falchion | Short Sword | 55 | 8 | 78 | 45 | None | 6 |

### Long Swords

| Name | Weapon skill | Base equip level | Base weapon damage | Base full-speed STR | Base weight STR check | Extra equip stat requirement | Base speed index |
|---|---|---|---|---|---|---|---|
| Long Sword | Long Sword | 0 | 5 | 18 | 12 | None | 4 |
| Superior Long Sword | Long Sword | 5 | 6 | 22 | 12 | None | 4 |
| Exceptional Long Sword | Long Sword | 15 | 7 | 26 | 12 | None | 4 |
| Scimitar | Long Sword | 10 | 7 | 31 | 18 | None | 5 |
| Superior Scimitar | Long Sword | 15 | 8 | 35 | 18 | None | 5 |
| Exceptional Scimitar | Long Sword | 25 | 9 | 39 | 18 | None | 5 |
| Templar Sword | Long Sword | 10 | 5 | 39 | 12 | None | 5 |
| Broad Sword | Long Sword | 20 | 9 | 57 | 28 | None | 7 |
| Superior Broad Sword | Long Sword | 25 | 10 | 61 | 28 | None | 7 |
| Exceptional Broad Sword | Long Sword | 35 | 11 | 65 | 28 | None | 7 |
| Bastard Sword | Long Sword | 30 | 10 | 70 | 33 | None | 8 |
| Superior Bastard Sword | Long Sword | 35 | 11 | 74 | 33 | None | 8 |
| Exceptional Bastard Sword | Long Sword | 45 | 12 | 78 | 33 | None | 8 |
| Claymore | Long Sword | 40 | 11 | 83 | 40 | None | 9 |
| Superior Claymore | Long Sword | 45 | 12 | 87 | 40 | None | 9 |
| Exceptional Claymore | Long Sword | 55 | 13 | 91 | 40 | None | 9 |
| Great Sword | Long Sword | 50 | 12 | 96 | 52 | None | 10 |
| Superior Great Sword | Long Sword | 55 | 13 | 100 | 52 | None | 10 |
| Exceptional Great Sword | Long Sword | 65 | 14 | 104 | 52 | None | 10 |
| Flamberge | Long Sword | 60 | 13 | 122 | 60 | None | 12 |
| Superior Flamberge | Long Sword | 65 | 14 | 126 | 60 | None | 12 |
| Exceptional Flamberge | Long Sword | 75 | 15 | 130 | 60 | None | 12 |
| Blood Sword | Long Sword | 100 | 20 | 143 | 131 | None | 13 |
| Xelima's Blade | Long Sword | 120 | 21 | 143 | 120 | None | 13 |
| Sword of Medusa | Long Sword | 120 | 23 | 130 | 100 | None | 12 |
| Sword of Ice Elemental | Long Sword | 100 | 20 | 130 | 100 | None | 12 |
| Giant Sword | Long Sword | 75 | 15 | 148 | 130 | None | 14 |
| Demon Slayer | Long Sword | 100 | 23 | 156 | 120 | None | 14 |
| Superior Giant Sword | Long Sword | 85 | 16 | 152 | 130 | None | 14 |
| Storm Bringer | Long Sword | 140 | 21 | 130 | 110 | INT 65 | 12 |
| The Devastator | Long Sword | 140 | 26 | 200 | 200 | None | 17 |
| Dark Executor | Long Sword | 100 | 20 | 169 | 140 | None | 15 |
| Lighting Blade | Long Sword | 100 | 20 | 169 | 140 | None | 15 |
| Kloness Blade | Long Sword | 120 | 21 | 156 | 120 | None | 14 |
| Sword of Thirst | Long Sword | 100 | 20 | 169 | 150 | None | 15 |
| Sword of Heavens | Long Sword | 100 | 18 | 143 | 131 | None | 13 |

### Fencing

The Fencing talent permits spellcasting with a fencing weapon and an equipped shield; other spell checks still apply.

| Name | Weapon skill | Base equip level | Base weapon damage | Base full-speed STR | Base weight STR check | Extra equip stat requirement | Base speed index |
|---|---|---|---|---|---|---|---|
| Sabre | Fencing | 30 | 7 | 70 | 65 | None | 7 |
| Superior Sabre | Fencing | 35 | 8 | 74 | 65 | None | 7 |
| Esterk | Fencing | 20 | 5 | 44 | 12 | None | 5 |
| Superior Esterk | Fencing | 25 | 6 | 48 | 12 | None | 5 |
| Exceptional Esterk | Fencing | 35 | 7 | 52 | 12 | None | 5 |
| Rapier | Fencing | 0 | 4 | 31 | 11 | None | 4 |
| Superior Rapier | Fencing | 15 | 5 | 35 | 11 | None | 4 |
| Exceptional Rapier | Fencing | 25 | 6 | 39 | 11 | None | 4 |
| Blood Rapier | Fencing | 70 | 13 | 52 | 11 | None | 5 |
| Exceptional Sabre | Fencing | 45 | 9 | 78 | 65 | None | 7 |
| Xelima's Rapier | Fencing | 120 | 12 | 52 | 11 | None | 5 |
| Kloness Esterk | Fencing | 120 | 13 | 78 | 50 | None | 7 |

### Axes

Most listed axes can be paired with a shield. Battle Axe occupies both hands. The Axe talent modifies crushing hits.

| Name | Weapon skill | Base equip level | Base weapon damage | Base full-speed STR | Base weight STR check | Extra equip stat requirement | Base speed index |
|---|---|---|---|---|---|---|---|
| Light Axe | Axe | 0 | 5 | 18 | 14 | None | 4 |
| Superior Light Axe | Axe | 5 | 6 | 22 | 14 | None | 4 |
| Exceptional Light Axe | Axe | 15 | 7 | 26 | 14 | None | 4 |
| Tomahawk | Axe | 10 | 6 | 31 | 17 | None | 5 |
| Superior Tomahawk | Axe | 15 | 7 | 35 | 17 | None | 5 |
| Exceptional Tomahawk | Axe | 25 | 8 | 39 | 17 | None | 5 |
| Saxon Axe | Axe | 20 | 7 | 44 | 20 | None | 6 |
| Superior Saxon Axe | Axe | 25 | 8 | 48 | 20 | None | 6 |
| Exceptional Saxon Axe | Axe | 35 | 9 | 52 | 20 | None | 6 |
| Double Axe | Axe | 30 | 8 | 57 | 33 | None | 7 |
| Superior Double Axe | Axe | 35 | 9 | 61 | 33 | None | 7 |
| Exceptional Double Axe | Axe | 45 | 10 | 65 | 33 | None | 7 |
| War Axe | Axe | 45 | 10 | 83 | 44 | None | 9 |
| Superior War Axe | Axe | 50 | 11 | 87 | 44 | None | 9 |
| Exceptional War Axe | Axe | 60 | 12 | 91 | 44 | None | 9 |
| Pick Axe | Axe | 0 | 5 | 104 | 10 | None | 10 |
| Golden Axe | Axe | 55 | 11 | 122 | 70 | None | 12 |
| Superior Golden Axe | Axe | 60 | 12 | 126 | 70 | None | 12 |
| Exceptional Golden Axe | Axe | 70 | 13 | 130 | 70 | None | 12 |
| Blood Axe | Axe | 100 | 19 | 104 | 61 | None | 10 |
| Battle Axe | Axe | 75 | 15 | 161 | 90 | None | 15 |
| Superior Battle Axe | Axe | 85 | 16 | 165 | 90 | None | 15 |
| Exceptional Battle Axe | Axe | 105 | 17 | 169 | 90 | None | 15 |
| Xelima's Axe | Axe | 120 | 24 | 169 | 120 | None | 15 |
| Kloness Axe | Axe | 120 | 21 | 169 | 150 | None | 15 |

### Hammers

Hammers interact with armor endurance; the Hammer talent changes physical-absorption handling.

| Name | Weapon skill | Base equip level | Base weapon damage | Base full-speed STR | Base weight STR check | Extra equip stat requirement | Base speed index |
|---|---|---|---|---|---|---|---|
| War Hammer | Hammer | 45 | 14 | 135 | 90 | None | 13 |
| Battle Hammer | Hammer | 60 | 15 | 174 | 120 | None | 16 |
| Giant Battle Hammer | Hammer | 120 | 23 | 182 | 140 | None | 16 |
| Barbarian Hammer | Hammer | 80 | 16 | 187 | 150 | None | 17 |
| Superior Battle Hammer | Hammer | 70 | 16 | 178 | 120 | None | 16 |
| Exceptional Battle Hammer | Hammer | 80 | 17 | 182 | 120 | None | 16 |
| Superior Barbarian Hammer | Hammer | 85 | 17 | 191 | 150 | None | 17 |
| Exceptional Barbarian Hammer | Hammer | 105 | 18 | 195 | 150 | None | 17 |
| Mallet | Hammer | 10 | 10 | 57 | 30 | None | 7 |
| Superior Mallet | Hammer | 15 | 11 | 61 | 30 | None | 7 |
| Exceptional Mallet | Hammer | 30 | 12 | 65 | 30 | None | 7 |

### Bows

Bows require arrows. The Archery talent includes additional-hit, ricochet and piercing behavior; see Talents.

| Name | Weapon skill | Base equip level | Base weapon damage | Base full-speed STR | Base weight STR check | Extra equip stat requirement | Base speed index |
|---|---|---|---|---|---|---|---|
| Short Bow | Archery | 0 | 3 | 39 | 10 | None | 5 |
| Long Bow | Archery | 35 | 4 | 52 | 12 | None | 6 |
| Composite Bow | Archery | 45 | 5 | 65 | 40 | None | 7 |
| Dark Elf's Bow | Archery | 120 | 10 | 80 | 80 | None | 6 |
| Fire Bow | Archery | 70 | 5 | 78 | 70 | None | 8 |
| Direction Bow | Archery | 60 | 6 | 104 | 100 | None | 10 |

### Wands

Mana saving reduces eligible spell costs by a percentage, not a fixed amount. Staff effects can also affect spell damage, hit ratio or casting probability.

| Wand | Mana-save contribution |
|---|---|
| Magic Wand(MS0) | 0% |
| Magic Wand(MS10) | 10% |
| Magic Wand(MS20) | 20% |
| Wizard Magic Staff(MS10) | 10% |
| Wizard Magic Staff(MS20) | 20% |

| Name | Weapon skill | Base equip level | Base weapon damage | Base full-speed STR | Base weight STR check | Extra equip stat requirement | Base speed index |
|---|---|---|---|---|---|---|---|
| Magic Wand(MS20) | Staff | 35 | 5 | 13 | 10 | None | 3 |
| Magic Wand(MS10) | Staff | 15 | 4 | 13 | 10 | None | 3 |
| Magic Wand(MS0) | Staff | 0 | 2 | 13 | 10 | None | 3 |
| Magic Wand(M.Shield) | Staff | 0 | 5 | 13 | 10 | None | 3 |
| Charge Wand | Staff | 0 | 5 | 13 | 10 | None | 3 |
| Wizard Magic Staff(MS20) | Staff | 70 | 7 | 13 | 10 | None | 3 |
| Wizard Magic Staff(MS10) | Staff | 60 | 7 | 13 | 10 | None | 3 |
| Berserk Magic Wand(MS20) | Staff | 120 | 7 | 13 | 10 | None | 3 |
| Berserk Magic Wand(MS10) | Staff | 120 | 7 | 13 | 10 | None | 3 |
| Kloness Magic Wand(MS20) | Staff | 120 | 3 | 13 | 10 | None | 3 |
| Kloness Magic Wand(MS10) | Staff | 120 | 3 | 13 | 10 | None | 3 |
| Resurrection Magic Wand(MS20) | Staff | 0 | 3 | 13 | 10 | None | 3 |
| Resurrection Magic Wand(MS10) | Staff | 0 | 3 | 13 | 10 | None | 3 |

### Reference scope

Omitted items are not evidence that an item is unavailable in game. Original male and female variants retain their separate identities.

Values are base template components, not final item or character stats. Light, Agile, upgrades, manufacturing, talents and built-in attributes can change instance behavior.

Weapon damage is a single physical base value, not dice, spell damage or final hit damage. Bows require ammunition.

Speed is an index, not seconds. Full-speed STR is the unmodified weapon's effective STR threshold for its skill's normal speed floor, including its weight check; it is not allocated STR or the fastest modified attack.

Equip checks are partial: listed weight STR, level, sex and extra stat gates do not guarantee an item can be equipped. Manufactured equipment bypasses the template level check only.

Armor PA applies at the struck location; shield PA is conditional on a successful eligible block, not added to armor PA. Neither is a whole-character damage-reduction percentage.

“Not applicable” means the field does not apply; “None” means no requirement of the listed kind; “Pending verification” means no verified value is supplied. Special-effect descriptions are not included.

Base weight is the unmodified template quantity divided by 100.

## Weapon damage

Weapon damage modifiers and crush expectation.

### Weapon damage

Normal weapon damage starts from base damage, then changes with Strength, skill, talent, attack type, upgrades, combo, crush and target mitigation. Listed damage is not final HP damage; see Combat.

For fixed stage damage D, crush probability p and total crush multiplier C, the isolated pre-rounding expectation is D(1+p(C−1)). This is the expectation of the stated two outcomes, not a full gameplay average. Physical crush combines its extra fraction with other damage modifiers; integer rounding and other random/conditional stages remain separate.
