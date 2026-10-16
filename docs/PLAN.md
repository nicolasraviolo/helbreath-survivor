# Plan de desarrollo

Leer solo la sección de la fase en curso. Cada fase: plan corto → OK del propietario → código → `/checkpoint`. No avanzar sin que el propietario haya probado la fase.

## Arquitectura técnica (referencia para todas las fases)

| Tema | Decisión | Motivo |
|---|---|---|
| Motor | Phaser 3 (misma versión que `sp-client`, ^3.90) | Ya sabe leer `.spr` y `.amd` |
| Lenguaje / build | TypeScript estricto + Vite + pnpm | Igual que la base |
| UI | Escenas de Phaser, **sin React** | Menos piezas; un Survivors tiene poca UI |
| Física | Arcade Physics + pooling | Suficiente para 300+ enemigos. Si no llega, spatial hash (ver `sp-client/src/utils/SpatialGrid.ts`) |
| Movimiento | Libre en píxeles; animación en 8 direcciones según el ángulo de la velocidad | La base es por casillas de 32 px; no reutilizar `Player.ts`/`Monster.ts` |
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
- Jugador con apariencia compuesta (Guerrero por defecto), movimiento libre WASD/flechas normalizado en diagonal, idle/caminar en 8 direcciones.
- Colisión con casillas bloqueadas.
- `DebugSystem`: F1 muestra FPS, posición, hitboxes.
- **Aceptación:** el personaje camina suave en cualquier dirección y no atraviesa muros.

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
- `XpGem` con pooling, radio de imán, barra de XP.
- Curva de nivel en `data/`. Al subir: pausa + `LevelUpScene` con 3 cartas (arma nueva, subir arma, pasiva) con icono, nombre y efecto.
- `HudScene`: vida, XP, nivel, tiempo, kills.
- **Aceptación:** se sube de nivel varias veces y las mejoras se notan.
- 👉 Tras esta fase: `/nueva-skill añadir-mejora`.

## Fase 6 — Arsenal completo
- Armas, pasivas y evoluciones de `docs/DESIGN.md`, reutilizando visuales de `sp-client/src/game/spells/` y `game/effects/` adaptados a disparo automático y pooling.
- Pickups: poción, imán, cofre.
- **Aceptación:** una partida de 10 min permite builds distintas; las evoluciones funcionan.
- 👉 Tras esta fase: `/nueva-skill añadir-arma`.

## Fase 7 — Oleadas, jefes y final
- `data/waves.ts` como línea de tiempo (minuto → enemigos, ritmo, eventos como "rodear al jugador").
- Minijefes con cofre; jefe final con barra de vida grande.
- Victoria/derrota; `GameOverScene` con tiempo, nivel, kills y armas.
- Música según el momento de la partida.
- **Aceptación:** partida completa de principio a fin con dificultad creciente.
- 👉 Tras esta fase: `/nueva-skill añadir-enemigo`.

## Fase 8 — Menús y personajes
- `MainMenuScene` (Jugar, Créditos, volumen), `CharacterSelectScene` (3 personajes), `PauseScene`.
- Créditos con el aviso legal de `docs/DESIGN.md`.
- **Aceptación:** se juega con los 3 personajes y se vuelve al menú tras una partida.

## Fase 9 — Web, móvil y publicación
- Joystick virtual táctil (aparece donde se toca), botón de pausa táctil.
- `Phaser.Scale.FIT`, probar vertical/horizontal; límite de enemigos menor en móvil si hace falta.
- `scripts/sync-assets.mjs`: objetivo de descarga inicial < 30–50 MB, cargar monstruos por oleada si es posible.
- `pnpm build` → `dist/`. Publicar en Cloudflare Pages (con despliegue automático desde GitHub) o itch.io (zip de `dist/`).
- **Aceptación:** enlace público que funciona en PC y en el móvil del propietario.

## Fase 10 — Pulido (opcional)
Temblor de cámara, partículas, sombras, progresión entre partidas con `localStorage`, más mapas, récords locales.
