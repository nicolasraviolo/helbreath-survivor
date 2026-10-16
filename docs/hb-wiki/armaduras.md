# Armaduras y accesorios (wiki)

> Copia de referencia de la wiki de Helbreath (servidor Olympia), descargada el 2026-10-16.
> Fuente: <https://www.helbreath.net/wiki/Armor/> · <https://www.helbreath.net/wiki/Equipment_basics/> · <https://www.helbreath.net/wiki/Necklaces_and_Rings/>
> Escudos, armaduras, cascos, piernas, botas, capas, collares y anillos: defensa, absorción y Str por peso.
> Los valores son los de ese servidor y pueden diferir del Helbreath original (`docs/REQUISITOS_HB.md`, sacado de los `.cfg` originales). Úsalos como guía de proporciones, no como verdad absoluta. Índice: `README.md`.

## Armor

Armor attributes, hit-location protection, shields and base equipment stats.

### Armor Attributes

| Attribute | Effect |
|---|---|
| Light | Reduces item weight and can lower the STR required to wear it. |
| Endurance | Increases maximum endurance. |
| Mana Conversion | Converts part of damage taken into mana. |
| Critical increase chance | Chance to restore a critical charge after a non-periodic damaging hit. / Combined item-stat chance is capped at 20%. |
| Experience | Increases the equipment experience bonus. |
| Gold | Increases the equipment gold-drop bonus. |
| Poison Resistance | Increases poison resistance. |
| Defense Ratio | Adds defense ratio for physical hit avoidance. |
| Magic Resistance | Adds magic resistance, used in spell hit/resist checks. |
| HP Recovery | Increases HP regeneration. |
| MP Recovery | Increases MP regeneration. |
| SP Recovery | Increases SP regeneration. |
| Physical Absorption | Adds physical absorption at the equipped armor location. |
| Magical Absorption | Adds magical absorption (global stat), with diminishing returns. / Effective absorption is capped at 80% before penetration modifiers and final rounding. |

A physical attack selects an armor location and uses that location’s protection. Shield absorption is a separate conditional reduction after armor absorption.

| Armor location | Approximate hit share |
|---|---|
| Chest | 50% |
| Legs | 25% |
| Hauberk | 15% |
| Head | 10% |

### Shields

Shield PA applies only on a successful block. See Reading equipment stats.

A shield adds defense ratio, but its Physical Absorption applies only when you block. Shields can block physical attacks from any direction except behind you: you cannot block an attacker who is facing the same direction as you. Blocking depends on your Shield skill. Shield attributes may add Magic Resistance or Magical Absorption.

| Name | Base equip level | Base defense ratio | Shield PA on block (%) | Base weight STR check | Extra equip stat requirement | Sex restriction |
|---|---|---|---|---|---|---|
| Wood Shield | 0 | 8 | 5 | 8 | None | None |
| Leather Shield | 10 | 10 | 6 | 10 | None | None |
| Targe Shield | 20 | 13 | 8 | 18 | None | None |
| Scutum Shield | 30 | 16 | 10 | 20 | None | None |
| Bronze Shield | 40 | 18 | 12 | 20 | None | None |
| Iron Shield | 50 | 22 | 14 | 25 | None | None |
| Lagi Shield | 60 | 26 | 17 | 30 | None | None |
| Kite Shield | 70 | 30 | 20 | 32 | None | None |
| Tower Shield | 80 | 35 | 23 | 40 | None | None |
| Merien's Shield | 100 | 50 | 33 | 40 | None | None |
| Devlin Shield | 50 | 10 | 6 | 15 | None | None |
| Superior Devlin Shield | 55 | 12 | 9 | 15 | None | None |
| Exceptional Devlin Shield | 60 | 14 | 12 | 15 | None | None |

### Body Armors

#### Chest armor

| Name | Base equip level | Base defense ratio | Armor PA at hit location (%) | Base weight STR check | Extra equip stat requirement | Sex restriction |
|---|---|---|---|---|---|---|
| Leather Armor(M) | 50 | 11 | 13 | 15 | None | Male |
| Chain Mail(M) | 70 | 31 | 34 | 30 | None | Male |
| Scale Mail(M) | 60 | 16 | 22 | 20 | None | Male |
| Plate Mail(M) | 80 | 37 | 40 | 100 | None | Male |
| Bodice(W) | 0 | 6 | 8 | 2 | None | Female |
| Long Bodice(W) | 0 | 6 | 8 | 5 | None | Female |
| Leather Armor(W) | 50 | 11 | 13 | 15 | None | Female |
| Chain Mail(W) | 70 | 31 | 34 | 30 | None | Female |
| Scale Mail(W) | 60 | 16 | 22 | 20 | None | Female |
| Plate Mail(W) | 80 | 37 | 40 | 100 | None | Female |
| Tunic(M) | 0 | 6 | 8 | 5 | None | Male |
| Ring Mail(M) | 75 | 34 | 36 | 70 | None | Male |
| Ring Mail(W) | 75 | 34 | 36 | 70 | None | Female |
| Robe(M) | 55 | 12 | 16 | 10 | MAG 100 | Male |
| Robe(W) | 55 | 12 | 16 | 10 | MAG 100 | Female |
| Merien's Plate Mail(M) | 100 | 60 | 48 | 100 | None | Male |
| Merien's Plate Mail(W) | 100 | 60 | 48 | 100 | None | Female |
| Knight Plate Mail(M) | 90 | 40 | 42 | 100 | None | Male |
| Knight Plate Mail(W) | 90 | 40 | 42 | 100 | None | Female |
| Wizard Robe(M) | 90 | 14 | 18 | 10 | MAG 100 | Male |
| Wizard Robe(W) | 90 | 14 | 18 | 10 | MAG 100 | Female |

#### Hauberks

| Name | Base equip level | Base defense ratio | Armor PA at hit location (%) | Base weight STR check | Extra equip stat requirement | Sex restriction |
|---|---|---|---|---|---|---|
| Shirt(M) | 0 | 5 | 5 | 1 | None | Male |
| Hauberk(M) | 50 | 9 | 12 | 12 | None | Male |
| Chemise(W) | 0 | 5 | 5 | 1 | None | Female |
| Shirt(W) | 0 | 5 | 5 | 1 | None | Female |
| Hauberk(W) | 50 | 9 | 12 | 12 | None | Female |
| Wizard Hauberk(M) | 70 | 12 | 14 | 12 | MAG 100 | Male |
| Wizard Hauberk(W) | 70 | 12 | 14 | 12 | MAG 100 | Female |
| Knight Hauberk(M) | 70 | 12 | 14 | 12 | DEX 100 | Male |
| Knight Hauberk(W) | 70 | 12 | 14 | 12 | DEX 100 | Female |

### Headgear

| Name | Base equip level | Base defense ratio | Armor PA at hit location (%) | Base weight STR check | Extra equip stat requirement | Sex restriction |
|---|---|---|---|---|---|---|
| Helm(M) | 60 | 8 | 11 | 52 | None | Male |
| Full-Helm(M) | 80 | 10 | 21 | 85 | None | Male |
| Helm(W) | 60 | 8 | 11 | 52 | None | Female |
| Full-Helm(W) | 80 | 10 | 21 | 85 | None | Female |
| Knight Full Helm(M) | 90 | 12 | 22 | 85 | None | Male |
| Knight Full Helm(W) | 90 | 12 | 22 | 85 | None | Female |
| Horned Helm(M) | 120 | 19 | 28 | 160 | None | Male |
| Wings Helm(M) | 100 | 15 | 24 | 130 | None | Male |
| Wizard Cap(M) | 60 | 8 | 11 | 15 | MAG 110 | Male |
| Wizard Hat(M) | 90 | 10 | 19 | 15 | MAG 130 | Male |
| Horned Helm(W) | 120 | 19 | 28 | 160 | None | Female |
| Wings Helm(W) | 100 | 15 | 24 | 130 | None | Female |
| Wizard Cap(W) | 60 | 8 | 11 | 15 | MAG 110 | Female |
| Wizard Hat(W) | 90 | 10 | 19 | 15 | MAG 130 | Female |
| Cap(M) | 0 | 4 | 7 | 5 | None | Male |
| Cap(W) | 0 | 4 | 7 | 5 | None | Female |

### Leg Armor

| Name | Base equip level | Base defense ratio | Armor PA at hit location (%) | Base weight STR check | Extra equip stat requirement | Sex restriction |
|---|---|---|---|---|---|---|
| Trousers(M) | 0 | 5 | 8 | 1 | None | Male |
| Knee Trousers(M) | 0 | 4 | 7 | 1 | None | Male |
| Chain Hose(M) | 50 | 8 | 14 | 10 | None | Male |
| Plate Leggings(M) | 70 | 12 | 20 | 20 | None | Male |
| Skirt(W) | 0 | 5 | 8 | 1 | None | Female |
| Trousers(W) | 0 | 5 | 8 | 1 | None | Female |
| Knee Trousers(W) | 0 | 4 | 7 | 1 | None | Female |
| Chain Hose(W) | 50 | 8 | 14 | 10 | None | Female |
| Plate Leggings(W) | 70 | 12 | 20 | 20 | None | Female |
| Ring Hose(M) | 60 | 10 | 16 | 10 | None | Male |
| Ring Hose(W) | 60 | 10 | 16 | 10 | None | Female |
| Knight Plate Leggings(M) | 90 | 15 | 22 | 20 | None | Male |
| Knight Plate Leggings(W) | 90 | 15 | 22 | 20 | None | Female |

### Armor shop prices

Prices are in Gold per armor or shield item bought from the blacksmith. Men's and women's versions cost the same. Members of the recorded Heldenian Battlefield winning nation receive the 10% discount shown in the second price column. See Heldenian rewards.

| Armor or shield | Base price (Gold) | Battlefield winner price (Gold) |
|---|---|---|
| Hauberk | 400 | 360 |
| Knight Hauberk | 600 | 540 |
| Wizard Hauberk | 600 | 540 |
| Leather Armor | 450 | 405 |
| Scale Mail | 400 | 360 |
| Chain Mail | 600 | 540 |
| Plate Mail | 1000 | 900 |
| Knight Plate Mail | 2000 | 1800 |
| Robe | 500 | 450 |
| Wizard Robe | 750 | 675 |
| Helm | 400 | 360 |
| Full-Helm | 600 | 540 |
| Knight Full Helm | 800 | 720 |
| Wings Helm | 1000 | 900 |
| Horned Helm | 1200 | 1080 |
| Wizard Cap | 500 | 450 |
| Wizard Hat | 750 | 675 |
| Chain Hose | 400 | 360 |
| Plate Leggings | 700 | 630 |
| Knight Plate Leggings | 900 | 810 |
| Wood Shield | 200 | 180 |
| Leather Shield | 300 | 270 |
| Targe Shield | 400 | 360 |
| Scutum Shield | 500 | 450 |
| Bronze Shield | 600 | 540 |
| Iron Shield | 700 | 630 |
| Lagi Shield | 800 | 720 |
| Kite Shield | 900 | 810 |
| Tower Shield | 1500 | 1350 |

Merien's Shield is not sold by ordinary Gold shops. See Rare shields for its other sources.

### Footwear

| Name | Base equip level | Base defense ratio | Base weight STR check | Extra equip stat requirement | Sex restriction |
|---|---|---|---|---|---|
| Shoes | 0 | 1 | 2 | None | None |
| Long Boots | 0 | 1 | 5 | None | None |

### Capes

| Name | Base equip level | Base defense ratio | Base weight STR check | Extra equip stat requirement | Sex restriction |
|---|---|---|---|---|---|
| Cape | 0 | 2 | 2 | None | None |
| Combatant Cape | 0 | 2 | 2 | None | None |

### Reference scope

Omitted items are not evidence that an item is unavailable in game. Original male and female variants retain their separate identities.

Values are base template components, not final item or character stats. Light, Agile, upgrades, manufacturing, talents and built-in attributes can change instance behavior.

Weapon damage is a single physical base value, not dice, spell damage or final hit damage. Bows require ammunition.

Speed is an index, not seconds. Full-speed STR is the unmodified weapon's effective STR threshold for its skill's normal speed floor, including its weight check; it is not allocated STR or the fastest modified attack.

Equip checks are partial: listed weight STR, level, sex and extra stat gates do not guarantee an item can be equipped. Manufactured equipment bypasses the template level check only.

Armor PA applies at the struck location; shield PA is conditional on a successful eligible block, not added to armor PA. Neither is a whole-character damage-reduction percentage.

“Not applicable” means the field does not apply; “None” means no requirement of the listed kind; “Pending verification” means no verified value is supplied. Special-effect descriptions are not included.

Base weight is the unmodified template quantity divided by 100.

## Reading equipment stats

Base equipment values, examples and limitations.

### Base values

These are unmodified base values, not final item or character stats. Light, Agile, upgrades, manufacturing, talents and built-in attributes can change item behavior.

- Weapon damage: physical base damage, not dice, spell damage or final hit damage. Bows require ammunition.

- Speed: an index, not seconds.

- Full-speed STR: the effective STR an unmodified weapon needs for its skill's normal speed floor, including the weight check. It is not allocated STR or the fastest modified attack.

### Weapon examples

| Item | Base weapon damage | Base full-speed STR |
|---|---|---|
| Dagger | 2 | 18 |
| Superior Dagger | 3 | 22 |
| Exceptional Dagger | 4 | 26 |

### Weight check

The base weight STR check rounds weight up to whole effective STR. It is not full-speed STR. Even meeting the listed weight STR, level, sex and extra stat gates does not guarantee equip eligibility. Light changes item weight. Manufactured equipment bypasses only the template level check.

Calculation details S=⌈w⌉

Here S is the base weight STR check and w is the scaled base weight.

### Protection and limits

- Defense Ratio helps avoid physical hits; it is not damage absorption. Base values exclude instance upgrades, manufacturing and attributes.

- Armor PA applies at the struck location. Shield PA applies only on a successful eligible block and is not added to armor PA. Neither is a whole-character damage-reduction percentage.

- Not applicable: the field does not apply. None: no requirement of that kind. Pending verification: no verified value supplied.

Special-effect descriptions are not included.

Item reference

## Necklaces & Rings

Crafting-vessel procedure and upgrade recipes for defense, damage, mana-saving and magic-resistance necklaces.

### Magic Necklaces

Get a Crafting Vessel at the City Shop, then drag the recipe ingredients into it. Stone-upgraded necklaces cannot be used in these recipes.

Each necklace recipe costs 10 Contribution points. The points are required to attempt the craft but are spent only on success. Successful crafting consumes the listed ingredients. On failure, any included Stone of Merien is consumed and other ingredients may be lost.

For rings and other jewelry, see Rare items.

### Upgradable Magic Necklaces

#### Magic Necklace (DF10)

| Necklace | Defense Ratio | Base equip level | Required ingredients |
|---|---|---|---|
| Magic Necklace(DF+10) | 10 | 25 | Base ingredient; not a recipe in this table |
| Magic Necklace(DF+15) | 15 | 40 | 1 × Silver Nugget; 1 × Gold Nugget; 2 × Magic Necklace(DF+10) |
| Magic Necklace(DF+20) | 20 | 55 | 1 × Magic Necklace(DF+15); 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(DF+10) |
| Magic Necklace(DF+25) | 25 | 70 | 1 × Magic Necklace(DF+20); 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(DF+10) |
| Magic Necklace(DF+30) | 30 | 85 | 1 × Magic Necklace(DF+25); 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(DF+10) |

#### Magic Necklace (DM+1)

| Necklace | Physical damage | Base equip level | Required ingredients |
|---|---|---|---|
| Magic Necklace(DM+1) | 1 | 25 | Base ingredient; not a recipe in this table |
| Magic Necklace(DM+2) | 2 | 50 | 1 × Stone of Merien; 1 × Silver Nugget; 1 × Gold Nugget; 2 × Magic Necklace(DM+1) |
| Magic Necklace(DM+3) | 3 | 75 | 1 × Magic Necklace(DM+2); 1 × Stone of Merien; 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(DM+1) |
| Magic Necklace(DM+4) | 4 | 100 | 1 × Magic Necklace(DM+3); 1 × Stone of Merien; 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(DM+1) |
| Magic Necklace(DM+5) | 5 | 120 | 1 × Magic Necklace(DM+4); 1 × Stone of Merien; 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(DM+1) |

#### Magic Necklace (MS10)

| Necklace | Mana Save | Base equip level | Required ingredients |
|---|---|---|---|
| Magic Necklace(MS10) | 10% | 25 | Base ingredient; not a recipe in this table |
| Magic Necklace(MS12) | 12% | 40 | 1 × Stone of Merien; 1 × Silver Nugget; 1 × Gold Nugget; 2 × Magic Necklace(MS10) |
| Magic Necklace(MS14) | 14% | 55 | 1 × Magic Necklace(MS12); 1 × Stone of Merien; 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(MS10) |
| Magic Necklace(MS16) | 16% | 70 | 1 × Magic Necklace(MS14); 1 × Stone of Merien; 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(MS10) |
| Magic Necklace(MS18) | 18% | 85 | 1 × Magic Necklace(MS16); 1 × Stone of Merien; 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(MS10) |

Mana Save reduces fixed mana costs, but not costs based on your maximum MP. Mana Save from your equipment adds together, up to the cap.

#### Magic Necklace (MR10)

| Necklace | Magic Resistance | Base equip level | Required ingredients |
|---|---|---|---|
| Magic Necklace(MR+10) | 10 | 25 | Base ingredient; not a recipe in this table |
| Magic Necklace(MR+15) | 15 | 40 | 1 × Silver Nugget; 1 × Gold Nugget; 2 × Magic Necklace(MR+10) |
| Magic Necklace(MR+20) | 20 | 55 | 1 × Magic Necklace(MR+15); 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(MR+10) |
| Magic Necklace(MR+25) | 25 | 70 | 1 × Magic Necklace(MR+20); 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(MR+10) |
| Magic Necklace(MR+30) | 30 | 85 | 1 × Magic Necklace(MR+25); 1 × Silver Nugget; 1 × Gold Nugget; 1 × Magic Necklace(MR+10) |

The listed MR adds to your Magic Resistance.
