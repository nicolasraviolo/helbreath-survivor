# Plan de desarrollo

Leer solo la sección de la fase en curso. Cada fase: plan corto → OK del propietario → código → `/checkpoint`. No avanzar sin que el propietario haya probado la fase.

Datos de referencia del Helbreath (hechizos, armas, armaduras, combate, monstruos): `docs/hb-wiki/README.md` dice qué archivo y qué sección leer en cada fase.

## Arquitectura técnica (referencia para todas las fases)

| Tema | Decisión | Motivo |
|---|---|---|
| Motor | Phaser 3 (misma versión que `sp-client`, ^3.90) | Ya sabe leer `.spr` y `.amd` |
| Lenguaje / build | TypeScript estricto + Vite + pnpm | Igual que la base |
| UI | Escenas de Phaser, **sin React** | Menos piezas; un Survivors tiene poca UI |
| Física | Arcade Physics + pooling | Suficiente para 300+ enemigos. Si no llega, spatial hash (ver `sp-client/src/utils/SpatialGrid.ts`) |
| Movimiento | Libre en píxeles, **solo en las 8 direcciones del original** (16-oct-2026, a prueba; `MOVE_DIRECTIONS` en `gameConfig.ts`, 0 = cualquier ángulo); animación en 8 direcciones | La base es por casillas de 32 px; no reutilizar `Player.ts`/`Monster.ts` |
| Controles | Teclado + **mando tipo Xbox** (Gamepad API estándar vía `input.gamepad` de Phaser) + táctil. `InputSystem` traduce todo a **acciones** (`move` como vector, `confirm`, `back`, `pause`, `navigate`); el resto del juego nunca lee teclas ni botones directamente | Añadir un dispositivo nuevo no obliga a tocar escenas ni entidades |
| Reutilización | Portar `HBSprite.ts`, `HBMap.ts` y utilidades de animación/apariencia a `survivors/src/hb/` | Es la parte difícil y ya está resuelta |
| Assets en dev | `publicDir: '../sp-client/public'` en `vite.config.ts` | No duplicar ~290 MB |
| Assets en prod | `scripts/sync-assets.mjs` copia solo lo listado en `assetManifest.ts` a `survivors/public/` (ignorado por git) | Descarga pequeña |
| Despliegue | Estático: Cloudflare Pages o itch.io (HTML5) | Gratis, es un enlace |

### Estructura objetivo de `survivors/`
```
survivors/
├── index.html · package.json · tsconfig.json · vite.config.ts
├── PROGRESS.md · NOTES.md
├── scripts/sync-assets.mjs
└── src/
    ├── main.ts
    ├── config/      gameConfig.ts, assetManifest.ts
    ├── data/        characters.ts, weapons.ts, passives.ts, evolutions.ts, enemies.ts, waves.ts
    ├── hb/          HBSprite.ts, HBMap.ts, animations.ts, playerAppearance.ts, mapRenderer.ts  (portado, MIT)
    ├── scenes/      Boot, Preload, MainMenu, CharacterSelect, Game, Hud, LevelUp, Pause, GameOver
    ├── entities/    Player, Enemy, Projectile, XpGem, Pickup
    ├── weapons/     Weapon.ts (base) + una clase por arma
    ├── systems/     Input, Spawn, Weapon, Combat, Xp, Upgrade, DamageNumbers, Audio, Debug
    └── utils/       Pool.ts, math.ts, rng.ts
```

### Problemas conocidos del repo base (no perder tiempo)
- Abaddon, Fire Elemental y Magma Bull están incompletos: no usarlos.
- Algunos sprites tienen artefactos verdes/azules y algunos pivotes de efectos están desajustados (se corrigen con offsets, ver `Effects.ts`).
- Magic Missile, Lightning Arrow, Fire Field, Hellfire y Fury of Thor no existen.

---

## Fase 0 — Reconocimiento (sin código del juego)
- Comprobar que `sp-client` arranca (`cd sp-client && pnpm install && pnpm dev` → http://localhost:8080).
- Con un subagente, leer `sp-client/.cursor/rules/*.md` y `sp-client/docs/`: SPRITE_FILE_FORMAT, ANIMATIONS_RENDERING, ASSET_LOADING, MAP_RENDERING, MONSTER_MECHANICS, SPELLS_AND_EFFECTS_MECHANICS, PLAYER_MECHANICS.
- Escribir `survivors/NOTES.md`: cómo se carga un `.spr`; cómo se indexan frames por animación y dirección; pivotes/offsets; cómo se compone la apariencia del jugador; cómo se pinta un mapa y se sabe qué casilla bloquea; lista de archivos a portar con sus dependencias.
- Evaluar mapas candidatos (fightzone1–9, huntzone1–4, zona abierta de middleland) y proponer uno.
- **Aceptación:** NOTES.md claro, lista de archivos a portar, mapa propuesto con motivo.

## Fase 1 — Esqueleto y primer sprite
- Crear el proyecto `survivors/` (Vite + TS + Phaser, sin React), scripts `dev`, `build`.
- `vite.config.ts` con `publicDir` apuntando a `../sp-client/public`.
- Portar `HBSprite.ts` y lo mínimo para crear animaciones. Crear `assetManifest.ts`.
- Escena de prueba: un **Orc** animado (idle y caminar) en 8 direcciones, cambiando con las flechas.
- **Aceptación:** se ve el Orc correctamente en las 8 direcciones, sin errores en consola, `pnpm build` funciona.

## Fase 2 — Mapa y jugador
- Portar `HBMap.ts` y el render del mapa elegido. Cámara que sigue al jugador, limitada al área de juego.
- Jugador con apariencia compuesta (Guerrero por defecto), idle/caminar en 8 direcciones.
- `InputSystem` con acciones: el vector de movimiento sale de WASD/flechas (normalizado en diagonal) **o** del stick izquierdo/cruceta del mando, con zona muerta (`data/` o `gameConfig.ts`).
- Colisión con casillas bloqueadas.
- `DebugSystem`: F1 muestra FPS, posición, hitboxes.
- **Aceptación:** el personaje camina suave en cualquier dirección y no atraviesa muros, con teclado y con mando Xbox; el stick analógico permite direcciones intermedias.

## Fase 3 — Enemigos
- `Pool.ts` genérico. `Enemy.ts` ligero: sprite, animación, vida, velocidad; persigue al jugador y orienta su animación.
- `SpawnSystem` básico: aparición en anillo fuera de cámara, ritmo creciente.
- Daño por contacto con breve invulnerabilidad, barra de vida, muerte del jugador → Game Over provisional.
- Muerte del enemigo con animación, desvanecer cadáver, devolver al pool.
- Debug: contador de enemigos; tecla para spawnear 100.
- **Aceptación:** 300 enemigos a ~60 FPS en un portátil normal (F1). Si no, optimizar antes de seguir.

## Fase 4 — Primera arma y combate
- `Weapon.ts` base + `WeaponSystem`. Arma inicial: Energy Bolt.
- `CombatSystem`: daño, destello al recibir golpe, knockback leve, muerte.
- `DamageNumbers` con pooling (inspirado en `FloatingText.ts`).
- Sonidos de impacto/muerte con límite de simultáneos.
- **Aceptación:** el arma dispara sola, mata, se ven números de daño y suena bien.

## Fase 5 — Experiencia y subida de nivel
> Actualizada el 16-oct-2026 según la sección **Guerrero** de `docs/DESIGN.md`: no hay "subir arma", porque las armas no tienen nivel.
- `XpGem` con pooling, radio de imán, barra de XP.
- Curva de nivel en `data/`.
- **Stats del personaje** en `data/` (Str, Vit, Dex, Int, Mag, Chr), con valores iniciales por personaje. El Guerrero gana +1 Str y +1 Vit automáticos por nivel.
- **Requisitos:** una función única (`meetsRequirement`) compara los stats con el requisito de cada objeto o hechizo. Los números son los originales de `docs/REQUISITOS_HB.md` multiplicados por `REQ_SCALE` (0.4 al inicio); todo vive en `data/`.
- Al subir: pausa + `LevelUpScene` con 3 cartas sacadas de un pool por tipos, cada una con icono, nombre y efecto. En esta fase se implementa la carta **Stat** (+3 puntos a un stat a elegir, siempre disponible); los tipos Arma nueva, Mejora de eslabón y Armadura se enchufan en la Fase 6.
- `HudScene`: vida, XP, nivel, tiempo, kills y stats principales.
- Las cartas de `LevelUpScene` se eligen con flechas/cruceta/stick + Enter/**A**, además del ratón; siempre hay una carta resaltada.
- **Aceptación:** se sube de nivel varias veces, las cartas de stat suben los stats y se nota en la partida (vida, daño); se puede elegir carta solo con el mando.
- 👉 Tras esta fase: `/nueva-skill añadir-mejora`.

## Fase 6 — Arsenal completo
> Partida en 3 bloques el 16-oct-2026:
> - **6A, Guerrero (hecho):** una sola arma en la mano; familias activas Short Swords y Long Swords, con números propios; Hammer, Fencing y Axe desactivadas. Armadura de cuerpo, casco y escudo.
> - **6B, Mago (hecho, falta probarlo):** un solo hechizo en la mano; familias Energy (Bolt → Triple → Energy Strike) y Fire (Fire Ball → Fire Strike → Mass Fire Strike) por Int; animación de lanzar; Robe → Wizard Robe y Wizard Cap → Wizard Hat por Mag; la varita es fija.
> - **6C (hecho, falta probarlo):** poción, imán (Crystal) y cofre (Gold Pocket, no desaparece) con Berserk o Defense Shield y sus efectos originales; pasivas Boots y Magnet Amulet con 5 rangos.
> Actualizada el 16-oct-2026 según la sección **Guerrero** de `docs/DESIGN.md` y `docs/REQUISITOS_HB.md`.
- **Armas por familia, sin niveles.** Cada familia es una cadena de eslabones reales de Helbreath, con su requisito de Str o Int (Guerrero primero: Espada, Esgrima, Hacha y Martillo; ver `docs/REQUISITOS_HB.md`). Las familias de los otros personajes se definen antes en `docs/DESIGN.md`.
- **Nuevos tipos de carta:**
  - *Arma nueva*: solo si se cumple el requisito.
  - *Mejora de eslabón*: el arma más fuerte de esa familia que el stat permite; se equipa sola y solo cambia el daño base.
  - *Armadura*: la mejor pieza que el Str permite en Cuerpo, Casco o Escudo; se equipa sola y cambia el aspecto.
- **Evoluciones = eslabones.** Sustituyen a "arma nivel 8 + pasiva con cofre". Pasivas: las de `docs/DESIGN.md` que sigan vigentes (Botas, Amuleto imán...).
- Reutilizar visuales de `sp-client/src/game/spells/` y `game/effects/` adaptados a disparo automático y pooling.
- **Animación de lanzar hechizo** (pedida el 16-oct-2026): estado Cast del cuerpo (base 64) al disparar. En el original la varita se oculta mientras lanza (`ARMAMENT_STATE_INDEX` = -1). Hay que decidir cómo combinarla con correr.
- Pickups: poción, imán, cofre. Por ahora el cofre da un buff ofensivo o defensivo temporal aleatorio.
- **Aceptación:** una partida de 10 min permite builds distintas según los stats y eslabones elegidos; al llegar al Str requerido aparece la carta del eslabón y al elegirla cambia el arma; la armadura cambia el aspecto.
- 👉 Tras esta fase: `/nueva-skill añadir-arma`.

## Fase 7 — Oleadas, jefes y final
> Completada el 17-oct-2026: oleadas por minuto, eventos "te rodean", minijefes Ettin y Demon que sueltan el cofre, Fire Wyvern final con bolas de fuego, GameOverScene de victoria y derrota, y música por momento. Monstruos con el comportamiento real del `NPC.cfg` original (ritmo, alcance, pega y huye, valentía). Ver `survivors/PROGRESS.md` y `docs/hb-wiki/monstruos-comportamiento.md`.
- `data/waves.ts` como línea de tiempo (minuto → enemigos, ritmo, eventos como "rodear al jugador").
- Minijefes con cofre; jefe final con barra de vida grande.
- Victoria/derrota; `GameOverScene` con tiempo, nivel, kills y armas.
- Música según el momento de la partida.
- **Aceptación:** partida completa de principio a fin con dificultad creciente.
- 👉 Tras esta fase: `/nueva-skill añadir-enemigo`.

## Fase 8 — Menús y personajes
> Completada el 17-oct-2026: menú principal, Settings (volúmenes y barra de vida, guardados), Credits, Achievements ("Coming soon") y pausa real, también al desconectar el mando. Ver `survivors/PROGRESS.md`.
> 17-oct-2026: la fase se hace **solo con el bloque 8A (menús)**. El **Arquero** (tercer personaje, con los arcos `mbo`/`wbo` del original) queda **para el futuro**, decidido por el propietario. El menú principal lleva también **Achievements**, de momento solo con un aviso de "Coming soon": los logros se diseñarán más adelante.
- `MainMenuScene` (Play, Achievements, Settings, Credits), `PauseScene`.
- `CharacterSelectScene` **ya existe** (adelantada el 16-oct-2026, con Warrior y Magician). Aquí falta: conectar Cancel al menú principal y, si se quiere, sexo, piel, pelo y ropa interior con las flechas. (El tercer personaje queda aplazado.)
- Créditos con el aviso legal de `docs/DESIGN.md` (en inglés, como todo el juego).
- Ajustes: opción para mostrar u ocultar la barra de vida sobre el personaje.
- Todos los menús navegables sin ratón: cruceta/stick para moverse, **A** confirmar, **B** volver, **Start** pausa. Si se desconecta el mando en partida → pausa automática.
- **Aceptación:** se juega con los personajes disponibles (2; el Arquero queda aplazado) y se vuelve al menú tras una partida; una partida completa (menú → juego → Game Over → menú) se puede hacer solo con el mando.

## Fase 9 — Web, móvil y publicación
> Completada el 17-oct-2026.
> - Juego en el móvil: joystick táctil (también en las franjas negras), botón de pausa, aviso de girar y pantalla completa.
> - Build con solo los assets necesarios; los monstruos se cargan por oleada (descarga inicial de 50 a 35 MB).
> - Publicado en GitHub Pages (https://nicolasraviolo.github.io/helbreath-survivor/) y en Cloudflare Pages (bloqueado en España los días de partido).
> - Ver `docs/PUBLICAR.md`.
- Joystick virtual táctil (aparece donde se toca), botón de pausa táctil.
- `Phaser.Scale.FIT`, probar vertical/horizontal; límite de enemigos menor en móvil si hace falta.
- `scripts/sync-assets.mjs`: objetivo de descarga inicial < 30–50 MB, cargar monstruos por oleada si es posible.
- `pnpm build` → `dist/`. Publicar en Cloudflare Pages (con despliegue automático desde GitHub) o itch.io (zip de `dist/`).
- **Aceptación:** enlace público que funciona en PC y en el móvil del propietario.

## Fase 10 — Pulido (opcional)
- **Móvil (pedido por el propietario, 17-oct-2026):** en el móvil todo se ve muy pequeño. Agrandar fuentes, menús, cartas y barra inferior en pantallas pequeñas.
Temblor de cámara, partículas, sombras, progresión entre partidas con `localStorage`, más mapas, récords locales. Mando: vibración al recibir daño, iconos de botones Xbox en pantalla cuando se usa mando, reasignar controles.
