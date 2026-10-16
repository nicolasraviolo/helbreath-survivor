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
| Arma | + Pasiva | Evolución |
|---|---|---|
| Energy Bolt | Inteligencia | Triple Energy Bolt |
| Fire Ball | Fuerza | Mass Fire Strike |
| Ice Strike | Vitalidad | Blizzard / Mass Blizzard |
| Lightning Bolt | Destreza | Mass Lightning Strike |

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
