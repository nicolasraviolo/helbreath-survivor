# Revisión del original (31-oct-2026)

Investigación pedida por el propietario: golpes y magias, atributos del botín, vida de los monstruos, tintes, hachas, martillo y Stone of Xelima. Fuentes: `reference/Server.cpp`, `reference/Client.cpp`, `reference/Item*.cfg`, `docs/hb-wiki/`. Nada de esto está hecho aún: es la base para el plan.

## 1. Probabilidad de golpe (original)
Todo pasa por `iCalculateAttackEffect` (Server.cpp:53374). Fórmula: `chance = clamp(H / D * 50, mín, 99)`; tirada `1d100 <= chance`. Mínimo: 15 % si ataca un jugador, 7 % si ataca un monstruo (wiki). Sin término de nivel.
- **Jugador → monstruo:** `H = maestría del arma (0–100) + 50 + (Dex − 50 si Dex > 50) + atributo Hitting Probability`. Crit +100, embestida +20. `D = DefenseRatio del monstruo`.
- **Monstruo → jugador:** `H = HitRatio del monstruo`; `D = 2·Dex + DR de la armadura`. **Por la espalda, D a la mitad** (ya lo tenemos).
- **Magias del jugador:** primero tirada de lanzar (círculo, Int), luego resistencia: `chance = Hm / R * 50`, `Hm = maestría mágica + (Mag − 50)`, `R = MagicResist del monstruo`.
- **Magias de monstruos:** `Hm = 1000` → aciertan casi siempre (nosotros: 25–95 % según MR, decisión de la Fase 18B).
- Absorción y Vit reducen daño, no la probabilidad.

Tabla de monstruos (HitRatio / DefenseRatio / MagicResist), de `docs/hb-wiki/monstruos.md`: Slime 30/10/5 · Rabbit 35/10/5 · Ant 40/15/10 · Snake 50/30/20 · Orc 60/40/25 · Skeleton 90/65/40 · Zombie 85/65/30 · Stone Golem 135/110/50 · Helhound 170/90/60 · Cyclops 180/110/78 · Troll 200/100/72 · Ogre 230/150/84 · Werewolf 300/200/96 · Ettin 375/325/108 · Liche 230/275/90 · Demon/Gargoyle/Unicorn 500/350/1 · Dragon 500/325/1.

**Nuestro juego hoy:** el jugador **nunca falla** (`CombatSystem.hitEnemy`). Los monstruos sí fallan contra el jugador (`data/defense.ts`, fórmula del original adaptada, 25–95 %).

## 2. Atributos del botín (original)
`NpcDeadItemGenerator` (Server.cpp:48238). `m_dwAttribute`: primario (tipo >>20, valor >>16), secundario (tipo >>12, valor >>8), mejora +N (>>28).

**Tabla de valores** (igual para todo, `1d30000`): 1 = 33,3 % · 2 = 24,7 % · 3 = 16,7 % · 4 = 10 % · 5 = 6,7 % · 6 = 3,3 % · 7 = 1,7 % · 8 = 1,3 % · 9 = 1 % · 10 = 0,67 % · 11 = 0,33 % · 12 = 0,23 % · 13 = 0,1 %. En monstruos flojos (`iGenLevel <= 2`) tope 7.

**Armas, primario:** Light 3 % (≥4) · Strong 7 % (≥2) · Critical 15 % (≥5) · Agile 20 % · Righteous 20 % · Poisoning 16 % (≥4) · Sharp 16 % · Ancient 3 %.
**Armas, secundario (40 %):** Hitting Probability 50 % (≥3) · Consecutive Attack Damage 35 % (≤7) · Gold +50 % 10 % · Experience +20 % 5 %.
**Armaduras (capas y botas incluidas), primario:** Strong 60 % (≥2) · Light 30 % (≥4) · Mana Converting ~5,5 % · Crit Chance ~4,5 %.
**Armaduras, secundario (40 %):** Defense Ratio 10 % (≥3) · Poison Resistance 30 % (≥3) · SP Recovery 15 % · HP Recovery 10 % · MP Recovery 10 % · Magic Resistance 19 % (≥3) · Physical Absorption 4 % (≥3) · Magic Absorption 2 % (≥3).
**Valor → efecto:** secundarios 1–7 (PR, HitProb, DR, HP/SP/MP rec, MR) = `valor × 7 %` (de ahí 21, 28, 35…); absorciones = `valor × 3 %`; Consecutive = valor; Exp/Gold = `valor × 10 %`. Primarios: Critical +v, Poison +5v, Light peso −4v %, Strong +7v.

**Nuestro juego hoy:** un solo atributo por objeto y valor fijo (`data/attributes.ts`: Sharp +10 %, Ancient +20 %, Poison; armadura HP Rec +30 %, DR +10, MR +8, MP Rec +30 %).

## 3. Vida de los monstruos (nuestro juego)
`monsterBaseHp` (data/enemies.ts): `60 × (maxHp/60)^0.75 × 1,2`. La potencia 0,75 aplasta a los grandes (Ogre 1040 → 612). **La vida no sube con el minuto** (comentario en waves.ts: a propósito). El daño del jugador multiplica Str × Power (+4 %/nivel) × Xelima × atributo × mejoras, así que con Level permanente todo cae de un golpe. Ej.: Guerrero Level 20 con Long Sword ≈ 97–200 por golpe; Werewolf ≈ 374–600.

## 4. Tintes (original)
`m_cItemColor` 0–15 por objeto. Dye(X) solo en categoría 11 (ropa: Robe, Shirt…) y 12 (Cape, Boots, Shoes); armaduras de metal no. Tinte **aditivo**: `pixel + (color − (100,100,100))` (`PutSpriteRGB`, Sprite.cpp:2288).
Colores (Client.cpp:713-729): 1 Indigo (40,40,96) · 2 (79,79,62) · 3 Gold (135,104,30) · 4 Crimson (127,18,0) · 5 Green (10,60,10) · 6 Gray (40,40,40) · 7 Aqua (47,79,80) · 8 Pink (127,52,90) · 9 Violet (90,60,90) · 10 Blue (0,35,60) · 11 Tan (105,90,70) · 12 Khaki (94,91,53) · 13 Yellow (85,85,8) · 14 Red (75,10,10) · 15 Black (48,48,48).
**Nuestro juego:** las capas ya admiten `added` (aditivo) en `GearLayer` (hb/playerAppearance.ts); falta guardar un color por objeto (`OwnedItem`) y pasarlo en `equipmentLook` (data/items.ts). Piezas: `cape`, `shoes`, `longBoots`, `robe`, `wizardRobe` (este ya es la Robe con tinte fijo).

## 5. Armas (nuestro juego)
- **Hachas** (torbellino 360°): 25–35 % menos daño por segundo que la espada larga del mismo Str; el Battle Axe (Str 80) rinde menos que la Great Sword (Str 52). El martillo también hace 360° y pega más, así que el hacha no tiene hueco.
- **Martillo:** cada golpe normal es golpe al suelo con polvo, temblor y grieta (`WeaponSystem.hitMelee` → `groundSlam`). El Critical Strike usa el mismo `groundSlam` más grande.

## 6. Stone of Xelima
`LOOT_XELIMA_CHANCE` 1/2000 por monstruo normal (data/loot.ts). Con 1.000–3.000 muertes por partida salen ~0,5–1,5 por partida.
