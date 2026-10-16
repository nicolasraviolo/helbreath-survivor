# Diseño del juego — Helbreath Survivors (demo)

Partida de 12–15 min. Movimiento libre, armas automáticas, oleadas, gemas de XP, elegir 1 de 3 mejoras al subir de nivel, jefe final. Alcance: 1 mapa, 3 personajes, ~8 armas, ~6 pasivas, ~25 enemigos, 2 minijefes, 1 jefe.

Fuera de alcance: multijugador, cuentas, tienda, inventario estilo Helbreath, NPCs, varios mapas.

## Personajes
| Personaje | Estilo Helbreath | Arma inicial | Bonus |
|---|---|---|---|
| Guerrero | Fuerza (STR) | Espada (tajo en arco hacia donde mira) | +20% vida, +10% daño físico |
| Mago | Inteligencia/Magia (INT/MAG) | Energy Bolt | +15% daño mágico, −10% cooldowns |
| Arquero | Destreza (DEX) | Arco (flecha al enemigo más cercano) | +10% velocidad, +1 proyectil a nivel 5 |

Apariencia compuesta por capas (cuerpo, pelo, armadura, arma) a partir de `sp-client/src/utils/PlayerAppearanceManager.ts`, con equipo acorde a cada clase.

## Armas (niveles 1–8)

> Nota (16-oct-2026): para el Guerrero ya no hay niveles de arma. Ver la sección **Guerrero** más abajo.

| Arma | Comportamiento | Visual a reutilizar (`sp-client/src/game/`) |
|---|---|---|
| Espada | Tajo en arco | Animación de ataque del jugador |
| Arco | Flecha al más cercano; niveles: +proyectiles, perforación | `effects/ArrowProjectile.ts` |
| Energy Bolt | Proyectil mágico al más cercano | `spells/EnergyBolt.ts` |
| Fire Ball | Proyectil con explosión en área | `spells/FireBall.ts` |
| Lightning Bolt | Rayo en línea que atraviesa | `spells/LightningBolt.ts` |
| Ice Strike | Impacto de hielo en área aleatoria, ralentiza | `spells/IceStrike.ts` |
| Fire Wall / Spike Field | Zona persistente que daña | `spells/FireWall.ts`, `spells/SpikeField.ts` |
| Meteor Strike | Meteoritos en puntos aleatorios en pantalla | `spells/MeteorStrike.ts` |

## Pasivas
Fuerza (+daño físico) · Inteligencia (+daño mágico) · Destreza (+velocidad de ataque) · Vitalidad (+vida máx y regeneración) · Botas (+velocidad) · Amuleto imán (+radio de recogida).

## Evoluciones (arma nivel 8 + pasiva)

> Nota (16-oct-2026): para el Guerrero las evoluciones pasan a ser eslabones por requisito de stat (Mago por confirmar). Ver la sección **Guerrero** más abajo.

| Arma | + Pasiva | Evolución |
|---|---|---|
| Energy Bolt | Inteligencia | Triple Energy Bolt |
| Fire Ball | Fuerza | Mass Fire Strike |
| Ice Strike | Vitalidad | Blizzard / Mass Blizzard |
| Lightning Bolt | Destreza | Mass Lightning Strike |

## Guerrero (borrador de diseño)

> Acordado con el propietario el 16-oct-2026. Sustituye, para el Guerrero, a los apartados "Armas (niveles 1–8)" y "Evoluciones". Requisitos exactos de objetos y hechizos: `docs/REQUISITOS_HB.md`.

Bonus de personaje (se mantiene): +20% vida, +10% daño físico.

### Stats
Seis stats de Helbreath: Str, Vit, Dex, Int, Mag y Chr. Efectos previstos (a equilibrar):
- **Str:** daño físico y puerta de entrada de armas y armaduras pesadas.
- **Vit:** vida máxima y regeneración.
- **Dex:** velocidad de ataque y de movimiento.
- **Int:** requisito de hechizos y daño mágico (poco útil para el Guerrero).
- **Mag:** maná y resistencia mágica.
- **Chr:** crítico y mejores drops.

Cada nivel da **+1 Str y +1 Vit automáticos**. Además hay cartas de stat: "+3 puntos a un stat a elegir" (son las pasivas Fuerza, Vitalidad, Destreza... de la sección Pasivas). Stats iniciales por definir (supuesto: Str ~12).

### Armas: sin niveles
- Las armas **no tienen nivel**. Mejoran por los stats del personaje y por cambiar de eslabón; al sustituir un arma por otra solo cambia el daño base.
- Cada **familia** es un arma automática con su comportamiento (borrador): Espada (tajo en arco), Esgrima (estocadas rápidas), Hacha (gira alrededor), Martillo (onda de choque en área). El escudo no ataca.
- Cada familia es una cadena de **eslabones reales de Helbreath** (ejemplo Espada: Short Sword → Long Sword → Claymore → Flameberge).
- **Requisito único:** Str de *full swing* original × `REQ_SCALE` (0.4 al inicio, ajustable). Si no se cumple, el eslabón no aparece en las cartas. No hay uso progresivo. Solo cuenta el Str: no importa el nivel del personaje, ni hay nivel de arma (el "nivel mínimo" que piden algunos objetos del original no se usa).
- Las armas a dos manos **no** bloquean el escudo.
- Pendiente: cuántas familias a la vez (propuesta: 4).

### Armadura
Tres huecos: **Cuerpo, Casco y Escudo** (las botas siguen siendo una pasiva). La carta ofrece la mejor pieza que el Str permite; al elegirla se equipa sola y cambia el aspecto.

### Cartas al subir de nivel (3 por subida)
| Carta | Qué ofrece |
|---|---|
| Stat | +3 puntos a un stat a elegir. Siempre disponible, así el reparto nunca se queda vacío |
| Arma nueva | Una familia que aún no tienes, solo si cumples su Str |
| Mejora de eslabón | El arma más fuerte de esa familia que el Str permite (puede saltarse eslabones). Se equipa sola |
| Armadura | La mejor pieza que el Str permite en Cuerpo, Casco o Escudo. Se equipa sola |

### Evoluciones y cofres
- Los eslabones **sustituyen** la evolución "arma nivel 8 + pasiva". El Guerrero evoluciona con Str; el Mago lo hará con Int (por confirmar).
- Los cofres de minijefe dan por ahora **un buff ofensivo o defensivo aleatorio**. Más adelante podrán dar otras cosas.
- Idea futura: algunos hechizos de apoyo (Berserk, Defense Shield, Protection From Arrow/Magic, Absolute Magic Protection...) como pickups temporales del mapa para cualquier clase. Ver `docs/REQUISITOS_HB.md`.

### Ritmo de la partida (estimación)
12–15 min ≈ 25–30 niveles. Con Str inicial ~12, +1 por nivel y 4–5 cartas de Str, el Str final ronda 50–57. Con `REQ_SCALE` 0.4 la Flameberge pide 52; Hammer y Battle Axe (63 y 68) quedan para builds muy de Str.

### Pendiente del Guerrero
- Etapas (Recluta → Leyenda), comprimidas a 25–30 niveles, y si dan bonus fijos.
- Caminos finales (Paladín de Elvine / Berserker de Aresden).
- Habilidad activa (Dash con espacio).
- Fórmula de daño: los datos originales traen dados de daño por arma, a verificar antes de usarlos como daño base.
- Si el Mago también pierde los niveles de hechizo.

## Oleadas (borrador; ajustar jugando)
| Minuto | Enemigos |
|---|---|
| 0–2 | Slime, Bunny, Ant |
| 2–4 | Orc, Snake, Scorpion, Giant Frog |
| 4–6 | Skeleton, Zombie, Dire Boar · **min 5: minijefe Ettin** |
| 6–8 | Troll, Ogre, Stalker, Werewolf |
| 8–10 | Cyclops, Lich, Hellhound, Dark Elf · **min 8: minijefe Demon** |
| 10–12 | Gargoyle, Hellclaw, Tigerworm, Minotaur |
| 12+ | **Jefe final: Fire Wyvern** (o Dragon si funciona bien). Matarlo = victoria |

Los nombres deben coincidir con `sp-client/src/constants/Monsters.ts`. Minijefes: más escala y vida, sueltan cofre. Para inspirar stats: `Monsters.ts` y `multiplayer/server/Config/Monsters.json`; el balance final es nuestro.

## Mapa
Uno tipo arena (decidido en Fase 0). Casillas bloqueadas del `.amd` = colisión del jugador. Enemigos: ignorar colisión o separación simple, según rendimiento.

## Gemas de XP
Usar un sprite de objeto en suelo de `Items.ts` (oro, gemas…). Si no hay uno adecuado, rombo con `Graphics` en 3 colores según valor.

## Audio
Música: `middleland.mp3` (partida), `dungeon.mp3` (minijefes), `abaddon.mp3` o `apocalypse.mp3` (jefe final). SFX de `sounds/` (C* personaje, E* efectos, M* monstruos). Máximo ~4 sonidos iguales a la vez.

## Créditos y aviso legal (mostrar en el juego)
"Helbreath © Siementech Co. Ltd. Base técnica: helbreath-base-game (MIT) de Erko Knoll. Proyecto fan no oficial, gratuito y sin ánimo de lucro."
- Sin anuncios ni pagos. No publicar en tiendas comerciales.
- El código copiado de la base conserva la licencia MIT.
- Todo asset pasa por `assetManifest.ts` para poder sustituirlo por arte propio en el futuro.
