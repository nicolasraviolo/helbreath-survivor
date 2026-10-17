# Comportamiento real de los monstruos (NPC.cfg y código del servidor)

Investigación del 17-oct-2026. Datos sacados de servidores de Helbreath publicados en GitHub:
- `NPC.cfg` (3.51): [centuu/HelbreathServer → Files/NPC.cfg](https://github.com/centuu/HelbreathServer/blob/main/Files/NPC.cfg). Es la fuente principal de la tabla.
- `NPC.cfg` (HBX), para contrastar: [Helbreath/server → bin/game_configs/hbx configs/Npc.cfg](https://github.com/Helbreath/server). Valores casi idénticos. Solo cambia el Fire Wyvern: 500 ms y alcance 6.
- Código del servidor: [centuu/HelbreathServer → HGServer/Game.cpp](https://github.com/centuu/HelbreathServer) (~10380–10700 y 16290–16420) y [Helbreath/hgserver-hbxdevteam → Game.h](https://github.com/Helbreath/hgserver-hbxdevteam). Nuestro `reference/Server.cpp` es el mismo código, pero sin las cabeceras ni los `.cfg`.

## Qué significa cada columna (las que nos interesan)
- **ATime:** milisegundos entre dos *acciones* del monstruo. Una acción es dar un paso de una casilla o hacer un ataque.
  - Al atacar, el servidor resta al azar 0, 100, 200, 300, 400, 600 o 700 ms, con un mínimo de 600 (`NpcProcess`).
  - Así, un Ettin (700) ataca cada 0,6–0,7 s y un Slime (2100), cada 1,4–2,1 s.
  - Congelado (hielo): +50%.
- **AttkRange:** alcance de ataque en casillas.
  - Con más de 1, si el jugador está a esa distancia o menos (en cada eje), el monstruo hace un **ataque especial a distancia** (tipo 20, "필살기") sin acercarse.
  - El Dark Elf dispara flechas (tipo 2).
  - Frost y Nizie congelan; Beholder tiene el suyo.
- **MinBrvy:** valentía. Cuando le queda ≤7% de vida, tira 1..Bravery y **huye** si sale ≤8. Las criaturas pequeñas (1–4) huyen casi siempre; las de 100, casi nunca. Ver `monstruos.md` → Monster Bravery.
- **ADT·dADR:** daño de un golpe (dados). Por ejemplo, Ettin 8d9 = 8 a 72, unos 40 de media.
- **HitDice:** vida (dados).
- **Search:** distancia en casillas a la que detecta al jugador.
- **Magic:** nivel de magia. Algunos lanzan hechizos según su maná y su `AILevel`; en ese caso esperan 2 s tras lanzar.

## "Pega y se aleja": estrategias de ataque
Cada monstruo, **al aparecer**, recibe una estrategia al azar con un dado de 1 a 10 (`pNpc->m_iAttackStrategy = iDice(1,10)`). No va por tipo de monstruo:

| Dado | Estrategia (`Game.h`) | Qué hace | Probabilidad |
|---|---|---|---|
| 1 | `DEF_ATTACKAI_NORMAL` | Ataca sin parar | 10% |
| 2 | `DEF_ATTACKAI_EXCHANGEATTACK` | **Pega una vez y huye** durante 2 acciones; luego vuelve a atacar | 10% |
| 3 | `DEF_ATTACKAI_TWOBYONEATTACK` | **Pega dos veces y huye** 2 acciones; luego vuelve | 10% |
| 4–10 | (ninguna) | Ataca sin parar; si huye por poca vida, puede pedir ayuda a los de alrededor | 70% |

- Las torres y armas de asedio (tipos 43–47) siempre son NORMAL.
- Mientras huye (`NpcBehavior_Flee`), da pasos alejándose. A las 2 acciones vuelve a ATTACK. Si lleva más de 10, se rinde, pasa a MOVE y recupera algo de vida si casi no le quedaba.
- Además, cada monstruo tiene un `AILevel` = 1d3, que decide si usa magia con más o menos inteligencia.

## Tabla de nuestros monstruos (NPC.cfg 3.51)
*El Fire Wyvern aparece como "Fire-Wyvern" con una columna desalineada en este archivo; se usa la fila del Wyvern, casi igual.*

| Nuestro | NPC.cfg | ATime (ms) | AttkRange (casillas) | Bravery | Daño (ADT·dADR) | HitDice | Search | Magia |
|---|---|---|---|---|---|---|---|---|
| Slime | Slime | 2100 | 1 | 1 | 1d4 | 2 | 2 | 0 |
| Bunny | Rabbit | 1500 | 1 | 2 | 1d5 | 4 | 2 | 0 |
| Ant | Giant-Ant | 1200 | 1 | 2 | 2d3 | 3 | 2 | 0 |
| Orc | Orc | 1200 | 1 | 2 | 3d3 | 4 | 5 | 0 |
| Snake | Amphis | 1000 | 1 | 1 | 2d4 | 4 | 3 | 0 |
| Scorpion | Scorpion | 1200 | 1 | 3 | 5d3 | 6 | 4 | 0 |
| Giant Frog | Giant-Frog | 900 | 2 | 4 | 7d5 | 35 | 7 | 0 |
| Skeleton | Skeleton | 800 | 2 | 100 | 5d4 | 8 | 5 | 0 |
| Zombie | Zombie | 1500 | 1 | 100 | 4d4 | 10 | 6 | 0 |
| Dire Boar | DireBoar | 800 | 1 | 100 | 8d8 | 130 | 7 | 0 |
| Troll | Troll | 700 | 1 | 100 | 8d5 | 55 | 7 | 0 |
| Ogre | Orge | 700 | 3 | 100 | 8d7 | 115 | 7 | 0 |
| Stalker | Stalker | 600 | 4 | 100 | 8d9 | 130 | 7 | 0 |
| Werewolf | WereWolf | 700 | 1 | 100 | 8d8 | 140 | 7 | 0 |
| Cyclops | Cyclops | 1200 | 3 | 805 | 8d6 | 60 | 7 | 5 |
| Lich | Liche | 700 | 5 | 100 | 8d6 | 130 | 7 | 6 |
| Hellhound | Hellbound | 900 | 1 | 4 | 7d5 | 35 | 7 | 5 |
| Dark Elf | Dark-Elf | 700 | 8 | 100 | 8d4 | 140 | 8 | 0 |
| Gargoyle | Gagoyle | 700 | 5 | 100 | 13d10 | 400 | 7 | 7 |
| Hellclaw | Hellclaw | 600 | 5 | 100 | 15d14 | 1000 | 7 | 7 |
| Tigerworm | Tigerworm | 600 | 6 | 100 | 18d17 | 2000 | 7 | 9 |
| Minotaur | Minotaurs | 500 | 2 | 100 | 13d11 | 340 | 5 | 0 |
| Ettin | Ettin | 700 | 3 | 100 | 8d9 | 180 | 7 | 0 |
| Demon | Demon | 700 | 4 | 100 | 10d10 | 340 | 7 | 7 |
| Fire Wyvern | Wyvern* | 600 | 7 | 100 | 20d18 | 2500 | 8 | 12 |

## Qué nos dice para el survivors
- **Ritmo de ataque:** los grandes atacan cada 0,6–0,7 s; los pequeños mucho más despacio (Slime 2,1 s). Nuestra animación de ataque dura ~0,46 s; el resto del ATime es espera.
- **Alcance:**
  - pegan desde lejos: Ettin, Ogre y Cyclops (3), Stalker y Demon (4), Lich, Gargoyle y Hellclaw (5), Tigerworm (6), Wyvern (7);
  - Dark Elf: 8, con flechas;
  - Skeleton, Frog y Minotaur: 2.
- **Pega y se aleja:** solo 2 de cada 10 monstruos (estrategias 2 y 3), elegido al aparecer. Eso explica que "a veces" pasara.
- **Moverse:** también es una acción por casilla.
  - Al **perseguir** (modo ataque), la acción dura ATime − 0..700 ms, con un mínimo de 600 ms. Así, todos los monstruos grandes persiguen a la misma velocidad: 1 casilla cada ~0,6 s, unos 53 px/s.
  - Los pequeños van más lentos: Slime ~1,8 s por casilla.
  - El jugador del original corría 1 casilla cada 0,18 s (`sp-client`): más de 3 veces más rápido que cualquier monstruo.
  - Aplicado en `data/enemies.ts` → `enemySpeed`.
