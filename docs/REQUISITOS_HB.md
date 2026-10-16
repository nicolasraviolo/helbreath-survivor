# Requisitos de equipo y hechizos (datos originales de Helbreath)

Tabla de referencia para diseñar qué puede usar cada personaje. Los números son los **originales** del juego; el multiplicador global de escala se aplica al leerlos (ver más abajo).

## Fuente y fórmulas

- Datos: `reference/Item.cfg`, `Item2.cfg`, `Item3.cfg` y `Magic.cfg` (configuración original del servidor). `sp-client` no los guarda: solo trae nombres y sprites.
- **Armas, requisito para usarlas al 100% (full swing):** `velocidad del arma × 13` de Str. En el original la velocidad baja 1 punto por cada 13 de Str, hasta 0 (`reference/Server.cpp`, ~línea 12896). Ejemplo: Flameberge, velocidad 10 → 130 Str.
- **Armas, Str para equiparlas:** `peso / 100` redondeado hacia arriba (`Server.cpp` ~12653; `Client.cpp` ~30786). Flameberge pesa 6000 → 60 Str. En el survivors **no se usa**: siempre es menor que el de full swing.
- **Armaduras, cascos, escudos:** solo tienen el Str de `peso / 100`. Algunas añaden un segundo stat (Mag, Dex...), que se lee de `EffectValue4` (10 Str, 11 Dex, 12 Vit, 13 Int, 14 Mag, 15 Chr) y `EffectValue5` (el mínimo).
- **Hechizos:** piden **Int** (`ReqInt` en `Magic.cfg`).
- **Los robes y gorros de mago piden Mag**, no Int.
- **Puntos de stat:** 70 puntos en total al empezar y +3 por nivel (`Client.cpp` ~26422). Tope por stat: 200 por defecto (`Server.cpp` ~5423).
- El original pide además un **nivel mínimo de personaje** en algunos objetos (columna "Nivel"). **No se usa** en el survivors: un objeto aparece en las cartas solo por su requisito de Str o Int, sin importar el nivel del personaje.

## Decisiones de diseño (acordadas)

1. **Un solo requisito por objeto.** Se usa el 100% del arma si se cumple y, si no, el objeto no aparece en las cartas. No hay uso progresivo (no hay inventario donde cambiar un arma lenta).
2. **Multiplicador global `REQ_SCALE`, valor inicial 0.4.** En los datos se guardan los números originales; al leerlos: `Math.ceil(original * REQ_SCALE)`. Para ajustar la dificultad se cambia un solo número.
3. **La clase elegida filtra lo que se ve.** El Mago no ve espadas, martillos ni armaduras. El Guerrero no ve magias ni robes.
4. Los números viven en `survivors/src/data/*.ts`, no en la lógica.
5. **Solo cuenta el requisito de Str (armas y armaduras) o Int (hechizos).** No hay niveles de arma ni se usa el nivel mínimo de personaje del original.

Ejemplos con el multiplicador en 0.4: Flameberge 130 → 52 · Claymore 91 → 37 · Long Sword 78 → 32 · Battle Axe 169 → 68 · Meteor Strike 169 Int → 68.

## Armas del Guerrero

"Manos": 1 = una mano, 2 = dos manos (bloquea el escudo). **Requisito = Str full swing.**

### Dagas y espadas cortas

| Arma | Manos | Requisito Str (original) | Con REQ_SCALE 0.4 | Str para equipar (ref.) | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| Dagger | 1 | 0 | 0 | 2 | - |
| Dirk | 1 | 0 | 0 | 2 | - |
| KightDagger | 1 | 0 | 0 | 2 | - |
| Gradius | 1 | 26 | 11 | 8 | - |
| MainGauche | 1 | 26 | 11 | 8 | - |
| ShortSword | 1 | 26 | 11 | 8 | - |

### Espadas

| Arma | Manos | Requisito Str (original) | Con REQ_SCALE 0.4 | Str para equipar (ref.) | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| Excaliber | 1 | 0 | 0 | 40 | - |
| Sabre | 1 | 65 | 26 | 12 | - |
| TemplerSword | 1 | 65 | 26 | 12 | - |
| KlonessEsterk | 1 | 65 | 26 | 50 | - |
| LongSword | 1 | 78 | 32 | 14 | - |
| Scimitar | 1 | 78 | 32 | 18 | - |
| Falchion | 1 | 78 | 32 | 22 | - |
| BroadSword | 2 | 78 | 32 | 28 | - |
| BastadSword | 2 | 78 | 32 | 33 | - |
| Claymore | 2 | 91 | 37 | 40 | - |
| DarkKnightGreatSword | 2 | 104 | 42 | 52 | - |
| GreatSword | 2 | 104 | 42 | 52 | - |
| KnightGreatSword | 2 | 104 | 42 | 52 | 85 |
| BlackKnightTemple | 2 | 130 | 52 | 60 | 120 |
| DarkKnightFlamebergW | 2 | 130 | 52 | 60 | - |
| DarkKnightFlameberge | 2 | 130 | 52 | 60 | - |
| DarkKnightGiantSword | 2 | 130 | 52 | 60 | 120 |
| Flameberge | 2 | 130 | 52 | 60 | - |
| KnightFlameberge | 2 | 130 | 52 | 60 | 95 |
| SangAhFlameberge | 2 | 130 | 52 | 60 | - |
| SangAhGiantSword | 2 | 130 | 52 | 60 | 120 |
| SwordofIceElemental | 2 | 130 | 52 | 100 | - |
| SwordofMedusa | 2 | 130 | 52 | 100 | - |
| StormBringer | 2 | 143 | 58 | 110 | - |
| XelimaBlade | 2 | 143 | 58 | 120 | - |
| BloodSword | 2 | 143 | 58 | 131 | - |
| DemonSlayer | 2 | 156 | 63 | 120 | - |
| KlonessBlade | 2 | 156 | 63 | 120 | - |
| GiantSword | 2 | 156 | 63 | 130 | 100 |
| DarkExecutor | 2 | 169 | 68 | 140 | - |
| LightingBlade | 2 | 169 | 68 | 140 | - |
| BlackShadowSword | 2 | 182 | 73 | 150 | 120 |
| KlonessAxe | 2 | 182 | 73 | 150 | - |
| The_Devastator | 2 | 195 | 78 | 200 | - |

### Esgrima

| Arma | Manos | Requisito Str (original) | Con REQ_SCALE 0.4 | Str para equipar (ref.) | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| BloodRapier | 1 | 39 | 16 | 11 | - |
| DarkKnightRapier | 1 | 39 | 16 | 11 | - |
| Rapier | 1 | 39 | 16 | 11 | - |
| XelimaRapier | 1 | 39 | 16 | 11 | - |
| KnightRapier | 1 | 39 | 16 | 12 | 95 |
| Esterk | 1 | 52 | 21 | 12 | - |

### Hachas

| Arma | Manos | Requisito Str (original) | Con REQ_SCALE 0.4 | Str para equipar (ref.) | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| LightAxe | 1 | 39 | 16 | 14 | - |
| Tomahoc | 1 | 52 | 21 | 17 | - |
| SexonAxe | 1 | 52 | 21 | 20 | - |
| DoubleAxe | 1 | 65 | 26 | 33 | - |
| 4BladeGoldenAxe | 1 | 78 | 32 | 20 | 60 |
| KnightWarAxe | 1 | 104 | 42 | 44 | 85 |
| WarAxe | 1 | 104 | 42 | 44 | - |
| BloodAxe | 1 | 104 | 42 | 61 | - |
| BattleAxe | 2 | 169 | 68 | 90 | - |
| XelimaAxe | 2 | 169 | 68 | 120 | - |

### Martillos

| Arma | Manos | Requisito Str (original) | Con REQ_SCALE 0.4 | Str para equipar (ref.) | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| Hammer | 2 | 156 | 63 | 90 | - |
| BattleHammer | 2 | 182 | 73 | 120 | 110 |
| GiantBattleHammer | 2 | 182 | 73 | 140 | 110 |
| BarbarianHammer | 2 | 195 | 78 | 200 | 110 |

## Armas del Mago y otras (para el futuro)

Solo hay 4 báculos en los datos originales; el resto del arsenal del mago habrá que diseñarlo nosotros (o serán los propios hechizos). Los arcos quedan anotados por si hubiese un tercer personaje.

| Objeto | Familia | Requisito Str (original) | Con 0.4 | Nivel (orig., no se usa) |
|---|---|---|---|---|
| BlackMageTemple | Báculo | 39 | 16 | 120 |
| DarkMageMagicStaff | Báculo | 39 | 16 | - |
| DarkMageMagicStaffW | Báculo | 39 | 16 | - |
| DarkMageMagicWand | Báculo | 39 | 16 | 120 |
| DarkElfBow | Arco | 52 | 21 | - |
| ShortBow | Arco | 52 | 21 | - |
| CompositeBow | Arco | 65 | 26 | 70 |
| LongBow | Arco | 65 | 26 | - |
| Fire-Bow | Arco | 78 | 32 | 70 |
| Direction-Bow | Arco | 104 | 42 | 70 |

## Armaduras, cascos, escudos y ropas

Requisito = Str (peso/100) y, si lo hay, un segundo stat. La columna **Clase** es una propuesta de reparto: "Ambos" son prendas básicas sin defensa real.

### Cuerpo

| Pieza | Clase | Str (original) | Stat extra (original) | Con 0.4 | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| Bodice | Ambos | 2 | - | Str 1 | - |
| LongBodice | Ambos | 2 | - | Str 1 | - |
| Tunic | Ambos | 5 | - | Str 2 | - |
| DarkMageRobe | Mago | 10 | Mag 100 | Str 4 + Mag 40 | - |
| DarkMageRobeW | Mago | 10 | Mag 100 | Str 4 + Mag 40 | - |
| Robe | Mago | 10 | Mag 100 | Str 4 + Mag 40 | - |
| WizardRobe | Mago | 10 | Mag 100 | Str 4 + Mag 40 | 80 |
| DarkMageLedderArmor | Mago | 15 | - | Str 6 | - |
| LeatherArmor | Guerrero | 15 | - | Str 6 | - |
| aHeroRobe | Mago | 15 | - | Str 6 | - |
| eHeroRobe | Mago | 15 | - | Str 6 | - |
| DarkMageScaleMail | Mago | 20 | - | Str 8 | - |
| ScaleMail | Guerrero | 20 | - | Str 8 | - |
| ChainMail | Guerrero | 30 | - | Str 12 | - |
| DarkMageChainMail | Mago | 30 | - | Str 12 | - |
| DarkMageChainMailW | Mago | 30 | - | Str 12 | - |
| DarkKnightPlateMail | Guerrero | 100 | - | Str 40 | - |
| DarkKnightPlateMailW | Guerrero | 100 | - | Str 40 | - |
| KnightPlateMail | Guerrero | 100 | - | Str 40 | 85 |
| MerienPlateMailM | Guerrero | 100 | - | Str 40 | - |
| MerienPlateMailW | Guerrero | 100 | - | Str 40 | - |
| PlateMail | Guerrero | 100 | - | Str 40 | - |
| SangAhPlateMail | Guerrero | 100 | - | Str 40 | - |
| aHeroArmor | Guerrero | 100 | - | Str 40 | - |
| eHeroArmor | Guerrero | 100 | - | Str 40 | - |

### Brazos (hauberk)

| Pieza | Clase | Str (original) | Stat extra (original) | Con 0.4 | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| Chemise | Ambos | 1 | - | Str 1 | - |
| Shirt | Ambos | 1 | - | Str 1 | - |
| DarkKnightHauberk | Guerrero | 12 | - | Str 5 | - |
| DarkKnightHauberkW | Guerrero | 12 | - | Str 5 | - |
| DarkMageHauberk | Mago | 12 | - | Str 5 | - |
| DarkMageHauberkW | Mago | 12 | - | Str 5 | - |
| Hauberk | Guerrero | 12 | - | Str 5 | - |
| KnightHauberk | Guerrero | 12 | Dex 100 | Str 5 + Dex 40 | 70 |
| SangAhHauberk | Guerrero | 12 | - | Str 5 | - |
| WizardHauberk | Mago | 12 | Mag 100 | Str 5 + Mag 40 | 90 |
| aHeroHauberk | Guerrero | 15 | - | Str 6 | - |
| eHeroHauberk | Guerrero | 15 | - | Str 6 | - |

### Piernas

| Pieza | Clase | Str (original) | Stat extra (original) | Con 0.4 | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| KneeTrousers | Ambos | 1 | - | Str 1 | - |
| Skirt | Ambos | 1 | - | Str 1 | - |
| Trousers | Ambos | 1 | - | Str 1 | - |
| ChainHose | Guerrero | 10 | - | Str 4 | - |
| aHeroLeggings | Guerrero | 15 | - | Str 6 | - |
| eHeroLeggings | Guerrero | 15 | - | Str 6 | - |
| DarkKnightLeggings | Guerrero | 20 | - | Str 8 | - |
| DarkKnightLeggingsW | Guerrero | 20 | - | Str 8 | - |
| DarkMageLeggings | Mago | 20 | - | Str 8 | - |
| DarkMageLeggingsW | Mago | 20 | - | Str 8 | - |
| KnightPlateLeg | Guerrero | 20 | - | Str 8 | 80 |
| PlateLeggings | Guerrero | 20 | - | Str 8 | - |
| SangAhLeggings | Guerrero | 20 | - | Str 8 | - |

### Cascos

| Pieza | Clase | Str (original) | Stat extra (original) | Con 0.4 | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| Wizard-Cap | Mago | 15 | Mag 110 | Str 6 + Mag 44 | 90 |
| Wizard-Hat | Mago | 15 | Mag 130 | Str 6 + Mag 52 | 120 |
| aHeroCap | Guerrero | 15 | - | Str 6 | - |
| eHeroCap | Guerrero | 15 | - | Str 6 | - |
| Helm | Guerrero | 52 | - | Str 21 | - |
| DarkKnightFullHelm | Guerrero | 85 | - | Str 34 | - |
| DarkKnightFullHelmW | Guerrero | 85 | - | Str 34 | - |
| FullHelm | Guerrero | 85 | - | Str 34 | - |
| KnightFullHelm | Guerrero | 85 | - | Str 34 | 80 |
| SangAhFullHel | Guerrero | 85 | - | Str 34 | - |
| aHeroHelm | Guerrero | 100 | - | Str 40 | - |
| eHeroHelm | Guerrero | 100 | - | Str 40 | - |
| Wings-Helm | Guerrero | 130 | - | Str 52 | 100 |
| Horned-Helm | Guerrero | 160 | - | Str 64 | 120 |

### Botas

| Pieza | Clase | Str (original) | Stat extra (original) | Con 0.4 | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| Shoes | Ambos | 2 | - | Str 1 | - |
| LongBoots | Ambos | 5 | - | Str 2 | - |

### Escudos

| Pieza | Clase | Str (original) | Stat extra (original) | Con 0.4 | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| WoodShield | Guerrero | 8 | - | Str 4 | - |
| GM-Shield | Guerrero | 10 | - | Str 4 | - |
| LeatherShield | Guerrero | 10 | - | Str 4 | - |
| TargeShield | Guerrero | 18 | - | Str 8 | - |
| BlondeShield | Guerrero | 20 | - | Str 8 | - |
| ScootermShield | Guerrero | 20 | - | Str 8 | - |
| IronShield | Guerrero | 25 | - | Str 10 | - |
| LagiShield | Guerrero | 30 | - | Str 12 | - |
| KnightShield | Guerrero | 32 | - | Str 13 | - |
| MerienShield | Guerrero | 40 | - | Str 16 | - |
| TowerShield | Guerrero | 40 | - | Str 16 | - |

### Capas

| Pieza | Clase | Str (original) | Stat extra (original) | Con 0.4 | Nivel (orig., no se usa) |
|---|---|---|---|---|---|
| AresdenHeroCape | Ambos | 2 | - | Str 1 | - |
| Cape | Ambos | 2 | - | Str 1 | - |
| ElvineHeroCape | Ambos | 2 | - | Str 1 | - |

## Hechizos (requisito Int)

Solo los ve el Mago. Maná y "dado" son los del original. El dado es una **interpretación sin verificar** de las columnas de efecto (nº de dados, caras y bonus); úsalo solo como orientación para el balance. El requisito escalado es `ceil(Int × REQ_SCALE)`.

| Int (original) | Con 0.4 | Id | Hechizo | Maná | Dado |
|---|---|---|---|---|---|
| 0 | 0 | 94 | Resurrection | 200 | - |
| 18 | 8 | 0 | Magic Missile | 8 | 1d8+0 |
| 18 | 8 | 2 | Create Food | 18 | - |
| 20 | 8 | 1 | Heal | 15 | 2d6+10 |
| 20 | 8 | 12 | Recall | 15 | - |
| 20 | 8 | 23 | Staminar Recovery | 20 | 4d8+8 |
| 20 | 8 | 24 | Protection From Arrow | 22 | - |
| 22 | 9 | 11 | Staminar Drain | 14 | 4d6+10 |
| 24 | 10 | 10 | Energy Bolt | 15 | 2d4+1 |
| 25 | 10 | 14 | Celebrating Light | 20 | - |
| 26 | 11 | 13 | Defense Shield | 19 | - |
| 26 | 11 | 20 | Fire Ball | 27 | 2d6+2 |
| 26 | 11 | 25 | Hold Person | 24 | - |
| 26 | 11 | 26 | Possession | 25 | - |
| 28 | 12 | 21 | Great Heal | 28 | 4d10+20 |
| 29 | 12 | 27 | Poison | 28 | 1d15+0 |
| 30 | 12 | 28 | Great Staminar Recov. | 45 | 4d16+16 |
| 30 | 12 | 32 | Invisibility | 31 | - |
| 30 | 12 | 34 | Detect Invisibility | 33 | - |
| 32 | 13 | 33 | Protection From Magic | 35 | - |
| 33 | 14 | 38 | Tremor | 34 | 3d4+3 |
| 34 | 14 | 30 | Fire Strike | 36 | 2d8+3 |
| 35 | 14 | 36 | Cure | 32 | - |
| 36 | 15 | 35 | Paralyze | 35 | - |
| 38 | 16 | 31 | Summon Creature | 35 | 1d1+0 |
| 38 | 16 | 37 | Lightning Arrow | 32 | 4d5+10 |
| 42 | 17 | 42 | Confuse Language | 40 | - |
| 45 | 18 | 40 | Fire Wall | 42 | 2d8+0 |
| 45 | 18 | 47 | Triple Energy Bolt | 40 | 2d4+2 |
| 46 | 19 | 44 | Great Defense Shield | 45 | - |
| 47 | 19 | 43 | Lightning | 44 | 4d7+12 |
| 48 | 20 | 41 | Fire Field | 48 | 2d8+0 |
| 49 | 20 | 46 | Poison Cloud | 48 | 0d15+0 |
| 50 | 20 | 45 | Chill Wind | 48 | 2d8+3 |
| 52 | 21 | 53 | Mass Poison | 54 | 1d40+0 |
| 53 | 22 | 56 | Mass Lightning Arrow | 55 | 5d6+20 |
| 56 | 23 | 54 | Spike Field | 56 | 2d8+0 |
| 58 | 24 | 51 | Lightning Bolt | 58 | 4d5+18 |
| 59 | 24 | 50 | Berserk | 57 | - |
| 59 | 24 | 55 | Ice Storm | 58 | - |
| 60 | 24 | 57 | Ice Strike | 59 | 5d6+12 |
| 67 | 27 | 60 | Energy Strike | 65 | - |
| 70 | 28 | 67 | Scan | 50 | - |
| 75 | 30 | 62 | Confusion | 78 | - |
| 85 | 34 | 61 | Mass Fire Strike | 80 | 5d6+12 |
| 93 | 38 | 63 | Mass Chill Wind | 90 | 3d8+6 |
| 97 | 39 | 64 | Earthworm Strike | 80 | 7d6+17 |
| 97 | 39 | 66 | Armor Break | 90 | 7d6+17 |
| 105 | 42 | 70 | Bloody Shock Wave | 120 | 5d8+20 |
| 112 | 45 | 65 | Absolute Magic Protect. | 90 | - |
| 120 | 48 | 73 | Cloud Kill | 130 | 0d40+0 |
| 123 | 50 | 74 | Lightning Strike | 90 | - |
| 130 | 52 | 71 | Mass Confusion | 125 | - |
| 133 | 54 | 72 | Mass Ice Strike | 120 | 7d8+25 |
| 135 | 54 | 76 | Cancellation | 120 | - |
| 150 | 60 | 78 | Haste | 60 | - |
| 150 | 60 | 80 | Illusion | 143 | - |
| 160 | 64 | 77 | Illusion Movement | 130 | - |
| 169 | 68 | 81 | Meteor Strike | 120 | 6d8+12 |
| 180 | 72 | 83 | Inhibition Casting | 180 | 8d20+30 |
| 180 | 72 | 90 | Mass Illusion | 200 | - |
| 185 | 74 | 82 | Mass Magic Missile | 160 | - |
| 195 | 78 | 91 | Blizzard | 170 | 5d1+20 |
| 200 | 80 | 95 | Mass Illusion Movement | 200 | - |
| 200 | 80 | 96 | Earth Shock Wave | 180 | 5d1+20 |

## Pendiente de decidir

- **Buffs de mapa y cofres (idea, a definir en etapas posteriores):** Berserk, Defense Shield, Great Defense Shield, Protection From Arrow, Protection From Magic y Absolute Magic Protection se pensarán como pickups temporales del mapa, válidos para cualquier clase, en lugar de magias fijas del Mago. Candidatas a revisar también: Haste, Invisibility, Heal, Great Heal, Cure y Resurrection. Idea: usar el Int original como nivel de rareza. Por ahora los cofres de minijefe darán un buff ofensivo o defensivo aleatorio; más adelante podrán dar otras cosas. Mientras tanto estos hechizos siguen apareciendo en la tabla de arriba.
- Valor definitivo de `REQ_SCALE` tras probar el juego (hoy 0.4).
- Reparto final de las prendas "Ambos" y de las ropas "DarkMage".
- Con qué se arma el Mago además de hechizos (solo hay 4 báculos en los datos).
