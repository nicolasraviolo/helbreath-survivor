# Notas técnicas

Lo que hemos aprendido de `sp-client` y de los assets. Resumen para no tener que releer el código base.
Rutas de código relativas a `sp-client/src/` salvo que se indique.

> **No leer entero** (más de 40 KB). Buscar el tema en este índice y leer solo esa sección: `grep -n "^## " survivors/NOTES.md` da la línea donde empieza, y luego se lee desde ahí. Al añadir una sección nueva, añadirla también al índice.

**Índice**
- Sprites (`.spr`): formato y carga
- Animaciones: frames por estado y dirección
- Pivotes y desajustes
- Apariencia del jugador (capas)
- Monstruos útiles y a evitar
- Hechizos y efectos
- Profundidad y rendimiento
- Mapas (`.amd`)
- Archivos a portar
- Cómo arranca la base
- Aprendido en la Fase 1
- Aprendido en la Fase 2
- Aprendido en la Fase 3
- Requisitos de equipo y hechizos (datos originales)
- Efectos y sonidos (Fase 4)
- Barra inferior (HUD) original
- Objetos en el suelo y gemas de XP
- Texto y fuentes en Phaser
- Pantalla "Create New Character" (sp-client no la tiene)
- Ataque cuerpo a cuerpo del jugador (sp-client PlayerAppearanceManager.ts)
- Sonidos ajustados a la animación (sp-client SoundManager.calculatePlaybackRate)
- Hechizos portados (sp-client game/spells, constants/Effects.ts)
- Buffs y objetos (sp-client)
- Nombres de las letras (24-oct-2026)
- Fuente dibujada del original (`sprfonts.spr`)
- Monstruos de las oleadas (sp-client Monsters.ts)
- Ataques de monstruos y golpe (original)
- Arte de menús del original (Fase 8)
- Táctil y móvil (Fase 9)
- Build y publicación (Fase 9)
- Assets para la segunda etapa (investigado el 17-oct-2026, ver `docs/PLAN-2.md`)
- Interfaz en el móvil (Fase 10)
- Capturas y sprites para la guía (17-oct-2026)
- Pruebas automáticas (`pnpm check`, 17-oct-2026)
- Sensación de impacto (Fase 10, bloque 10C)
- Interfaz (Fase 11)
- App instalable (Fase 12, bloque 12A)
- Partidas guardadas (Fase 12, bloque 12B)
- Settings táctil (Fase 12C)
- Pestañas de Settings (M13)
- Portal del final (Fase 13)
- Partida simulada y equilibrio (Fase 13C)
- Logros (Fase 14B)
- Métricas (Fase 14A)
- Código de traspaso (Fase 27½)
- Apuntado automático (Fase 15A)
- Apuntado manual (Fase 15B)
- Stick de apuntar en el móvil (Fase 15C)
- Minimapa (Fase 16A)
- Tótems (Fase 16B)
- Personajes guardados (Fase 17A)
- Aspecto del personaje (Fase 17B)
- Esquiva física (Fase 18A)
- Resistencia mágica (Fase 18B)
- Critical Strike (Fase 19A)
- Meteor Strike, hechizo activo del Mago (Fase 19B)
- Vibración del mando y controles cambiables (Fase 19C)
- Medir crit y meteoro (cierre Fase 19)
- Ventana Character y Level permanente (Fase 20A)
- Equipo y pantalla Equipment (Fase 20B)
- Cartas de Power (Fase 20C)
- Hechizos equipables del Mago (Fase 20D)
- Arreglos del bloque A de bugs (19-oct-2026)
- Estela del tajo del guerrero (M15, 20-oct-2026)
- Monstruos élite (M2)
- Bugs del bloque B (20-oct-2026)
- Pantalla de carga (M8)
- Equipo sobre el cuerpo en la ventana Character (M17)
- Botín en partida (Fase 21A)
- Atributos y varitas (Fase 21B)
- Baúl, "solo lo que tienes" y Zem (Fase 21D)
- Abaddon's Blood: resurrección permanente (Fase 21E)
- Varios mapas y Select Map (Fase 22A)
- Carga por mapa y tiempos de carga (Fase 22B)
- Elvine Garden (Fase 22D)
- Middleland (Fase 22E)
- Sombras del jugador y los monstruos (Fase 22G)
- La ciudad (Fase 23A) y NPCs (23B)
- Rareza de las cartas (Fase 21½A)
- Reroll y Skip (Fase 21½B)
- Evento Champion (Fase 21½C)
- Oro, botín especial y muerte a medias (Fase 24A)
- Tienda (Fase 24B)
- Herrero y Stone of Xelima (Fase 24C)
- Mejorar armas en el herrero (Fase 24D)
- Revisión de la dificultad: `pnpm balance` (22-oct-2026)
- Dificultad de Traveler Zone (Fase 28½B, 25-oct-2026)
- Nitidez: lienzo a la resolución real (RENDER_SCALE)
- Maná del Spell 2 (Fase 26A)
- Apuntar el Spell 2 en el móvil (Fase 26B)
- Hechizos nuevos: Lightning Arrow, Chill Wind y Lightning Bolt (Fase 26C)
- Ice Strike, Mass Ice Strike y ralentizar (Fase 26D)
- Hechizos en línea y Libro Azul (Fase 26E)
- Pantalla completa y consolas (Fase 25)
- Monstruos que se mueven distinto (Fase 27)
- Ataques de los monstruos como el original (28-oct-2026)
- Magias pasivas de la partida (Fase 28)
- Sprites suaves: filtro xBR (Fase 28¾)
- Zoom del mundo en el móvil (25-oct-2026)
- Hachas: giro en torbellino (bloque B, 25-oct-2026)
- Martillos: golpe al suelo y grieta (bloque C, 26-oct-2026)
- Equilibrio de los martillos (26-oct-2026)
- Rescates y Guards (Fase 29A, 27-oct-2026; logros y Missions, 29B)
- Hechizos de impacto con marca en el suelo (27-oct-2026)
- Icebound (Fase 30A)
- Arreglos del 27-oct-2026 (sonidos, "!" y Select Map)
- Objetos únicos (Fase 30B)

## Sprites (`.spr`): formato y carga
- **Binario little-endian:**
  - Cabecera `int16 spriteCount`. "Sprite" aquí significa una hoja (sheet).
  - Por cada hoja: `int16 frameCount`, `int32 imageLength`, `int32 w` y `int32 h` (sin uso), `1 byte` y `frameCount ×` registros de 12 bytes `int16 left, top, width, height, pivotX, pivotY`.
  - Después, por cada hoja: `int32 startLocation` (se salta) y `imageLength` bytes de **PNG completo con alfa**. Cada frame es un rectángulo dentro de ese PNG.
- **Carga en `game/assets/HBSprite.ts`:**
  1. `load.binary` deja el `.spr` en la caché binaria.
  2. `new HBSpriteFile(key, SpriteType, …).load(scene)` lo convierte, por cada hoja, en PNG → Blob → `createImageBitmap` → canvas → `textures.addCanvas()`.
  3. Añade los frames con `texture.add(i, 0, x, y, w, h)`, con filtro `NEAREST`.
  4. Libera el buffer y cierra el ImageBitmap.
- **Claves:**
  - Textura: `{assetKey}-{sheet}` (p. ej. `sprite-orc-8`).
  - Casillas de mapa: `map-tile-N`.
  - `HBAnimation` crea **una animación por hoja**, a 10 fps y en bucle. No lo hace con Tiles, Interface ni packs de items.
- **Tipos (`SpriteType`):** Human, Monster, EquipmentPack, HairAndUndies, Bows, Weapons, Shields, Effect, Tiles, Interface, ItemPack, ItemGround.
- **Visor de sprites (`sprites.html`, `src/tools/spriteViewer.ts`):** lee los `.spr` sin Phaser con `readSprFile` (`src/hb/HBSprite.ts`). Los nombres salen de `/sprite-catalog.json`, que `vite.config.ts` genera solo en desarrollo ejecutando los `.ts` de datos de sp-client (`scripts/spriteCatalog.ts`): `Items.ts` (icono en `item-pack.spr` = hoja `itemSheetIndex`, frame `itemSpriteIndex`), `Monsters.ts`, `NPCs.ts` y `Effects.ts`. No entra en el build.
- **Origen:** `.pak` originales convertidos con `tools/PakToSprConverter`. Toma como transparente el color exacto del píxel (0,0), así que pueden quedar **bordes verdes o azules** en algunos sprites. Es una deducción nuestra; si molesta, se tapa con tinte o se reconvierte.
- **`.pak` de servidores privados (21-oct-2026):** probados 44 de los repos `Saritagala/HBGhost` e `irwinlopez1023/Helbreath-Xsilium` (carpeta `Apks convertidos a paks`). Todos sin cifrar y convertibles. Dos rarezas:
  - Algunos (dragones, wyverns, BlackDemon, GhostAbby de HBGhost) traen **basura en el campo "número de hojas"** (byte 20). La tabla de hojas está bien: la cantidad real es `(inicio de la primera hoja − 24) / 8`. El conversor original fallaría con ellos.
  - `Gate.pak` tiene hojas vacías (BMP de 0×0).
  - Los wyverns traen 24 hojas (no 40) y BlackDemon 39: el archivo termina ahí, no falta nada. Su reparto por estados hay que averiguarlo antes de usarlos.
  - Sin SDK de .NET en el equipo; la conversión se hizo con un script de Node equivalente (verificado: el `Orc.pak` de HBGhost da exactamente nuestro `orc.spr`, 0 píxeles distintos).

## Animaciones: frames por estado y dirección
- **Direcciones** (`utils/CoordinateUtils.ts`): `0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW`. Normalmente hay **una hoja por dirección**.
- **Monstruos:** `hoja = baseEstado + dir`, con bases Idle 0, Move 8, Attack 16, TakeDamage 24 y Dead 32.
  - 8 frames por hoja por defecto.
  - Ritmo = 10 fps × (frames/8) × `temporalCoefficient`.
  - Idle y Move en bucle; Attack, TakeDamage y Dead una sola vez. El golpe del ataque cae en el frame 2.
  - Excepciones en `constants/Monsters.ts` (`states.X.animation = {startSpriteSheet, startAnimationFrame, animationFrames, spriteName}`):
    - Lich, Ogre (`orge`) y Troll: idle 4, attack 6, death 6.
    - Wyverns: ataque = frames 4–7 de las hojas idle, con `startAnimationFrame: 3` obligatorio porque otros valores rompen Phaser.
    - Giant Frog: move en frames 3–7.
    - Beholder: 12 frames de ataque.
- **Jugador:** `hoja humano = BASE[estado] + dir`. Armaduras, pelo y ropa usan **una hoja por estado con 8 frames por dirección dentro** (frames `dir×8 … dir×8+7`).

  | Estado | Base humano | Base armadura | Frames |
  |---|---|---|---|
  | IdlePeace / IdleCombat | 0 / 8 | 0 / 1 | 8 |
  | WalkPeace / WalkCombat | 16 / 24 | 2 / 3 | 8 |
  | Run | 32 | 4 | 8 |
  | Melee | 48 | 6 | 8 |
  | Cast | 64 | 8 | 16 |
  | TakeDamage | 80 | 10 | 4 |
  | Die | 88 | 11 | 8 |
- **Efectos** (`constants/Effects.ts`, `EffectConfig`):
  - Campos: `sprite` (p. ej. `effect11`), `spriteSheetIndex`, `frameRate`, `animationFrames [inicio, fin]`, `depthOffset` (+80), `offsetX/Y` y `drawLightRadius`.
  - `EffectUtils.ensureEffectAnimation` cachea las animaciones.

## Pivotes y desajustes
- `pivotX/pivotY` van **por frame**, son desplazamientos relativos y a menudo negativos.
- `GameAsset` pone el origen del sprite en (0,0). **En cada cambio de frame** coloca el sprite en `(baseX + pivotX, baseY + pivotY)`. Sin esto, los sprites "bailan".
- La posición lógica de una entidad es el centro de su casilla en el original (`world*32 + 16`). Para nosotros será su posición en píxeles.
- **Desajustes conocidos:**
  - Fire Elemental y Magma Bull tienen pivotes malos.
  - Abaddon (`yspro`) está incompleto.
  - Storm Bringer (effect11, hoja 11) necesita `offset 75,64`.
  - Efectos marcados "(bugged)": Vortex, Unknown Effect 7 y Weapon Special Power Activation 2.
- Los recuadros verdes y azules del **modo debug** del original son depuración, no fallos del asset.

## Apariencia del jugador (capas)
- **Cuerpo:** `wm`/`ym`/`bm` (hombre, piel clara/morena/oscura) y `ww`/`yw`/`bw` (mujer). Por defecto `wm`.
- **Pelo y ropa interior:**
  - Pelo: `mhr`/`whr`, hoja = `estilo*12 + baseArmadura`.
  - Ropa interior: hoja = `color*12 + baseArmadura`.
- **Equipo:**
  - Cota, pantalón, botas, casco, armadura y capa usan la hoja `baseArmadura` con frames por dirección dentro.
  - **Arma:** hoja = `base + ARMAMENT_STATE_INDEX[estado]*8 + dir`.
  - Escudo: frames por dirección dentro de la hoja.
- **Orden de dibujo:** humano → pelo → ropa interior → cota → pantalón → botas → casco → armadura → (escudo/arma) → accesorio.
  - La **capa** va en una posición u otra según la dirección (`MANTLE_DRAWING_ORDER=[1,1,1,0,0,0,2,2]`).
  - El escudo va antes o después del arma según la dirección.
  - Lo implementa `getGearRenderOrder` en `utils/PlayerAppearanceManager.ts`. Lo copiaremos tal cual.
- Las hachas masculinas `maxe1–5` en IdleCombat están rotas; el original las cambia por `waxe*` (`WEAPON_SPRITE_OVERWRITES`).

## Monstruos útiles y a evitar
- **Disponibles** (nombre → sprite):
  - Orc `orc`, Skeleton `ske`, Zombie `zom`, Slime `slm`, Ant `ant`, Scorpion `scp`
  - Werewolf `werewolf`, Cyclops `cyc`, Ettin `ettin`, Demon `demon`, Hellhound `helb`
  - Stone Golem `gol`, Clay Golem `cla`, Ice Golem `icegolem`, Minotaur `minotaurs`, Gargoyle `gagoyle` (errata en el archivo)
  - Dark Elf `darkelf`, Beholder `beholder`, Giant Lizard `giantlizard`, Tigerworm `tigerworm`, Lich `liche`, Ogre `orge`, Troll `troll`, Wyverns, Dragon `barlog`…
- **No usar:** Fire Elemental, Magma Bull y Abaddon. Tampoco Catapult, Guard Tower ni Dummy (no son enemigos).
- **Sombra:** se dibuja con el propio sprite y tiene que ir sincronizada frame a frame, o parpadea.

## Hechizos y efectos
- **24 hechizos existen**, cada uno con su clase en `game/spells/`:
  - Energy Bolt, Fire Ball, Fire Strike, Fire Wall, Chill Wind, Poison Cloud, Triple Energy Bolt, Lightning Bolt
  - Spike Field, Ice Storm, Ice Strike, Energy Strike, Mass Fire Strike, Mass Chill Wind, Earthworm Strike, Armor Break
  - Bloody Shock Wave, Mass Ice Strike, Lightning Strike, Meteor Strike, Mass Lightning Strike, Blizzard, Earth Shock Wave, Mass Blizzard
- **No existen:** Magic Missile, Lightning Arrow, Fire Field, Hellfire y Fury of Thor.
- **Patrones de hechizo:**
  - proyectil → impacto;
  - **rayo dibujado con `Graphics`**, no con sprites (lightning);
  - área con varios efectos;
  - línea o cono;
  - persistente (~30 s).
- Unos 131 efectos en `constants/Effects.ts`. Otros: `CriticalStrikeProjectile`, `ArrowProjectile`.

## Profundidad y rendimiento
- **Profundidad:**
  - Orden por Y: `y*100 + offset`; efectos +80.
  - Suelo a -1000 en la doc y -10000 en las reglas. Usaremos un valor muy negativo propio.
  - Nosotros calcularemos la profundidad con la **Y en píxeles**.
- **Rendimiento:**
  - Suelo = una sola capa Tilemap.
  - `SpatialGrid` para buscar vecinos.
  - Overlays estáticos dibujados una vez.
  - Pooling, `NEAREST`, liberar buffers tras cargar.
- **Carga bajo demanda:** `utils/MapAssets.ts` mira qué índices de sprite usa el mapa y solo carga esos `.spr` de casillas. Nos sirve para cargar solo el recorte de middleland.
- **Rangos de `map-tile-N`:**

  | Pack | Índices |
  |---|---|
  | maptiles1 | 0–49 |
  | structures1 | 50–69 |
  | sinside1 | 70–99 |
  | trees1 | 100–145 |
  | treeshadows | 150–199 |
  | objects1 | 200+ |

## Mapas (`.amd`)
- **Formato:** cabecera ASCII de 256 bytes (`MAPSIZEX = 100 MAPSIZEY = 100 TILESIZE = 10`) y luego una ficha por casilla, por filas (Y y después X).
- **Ficha de cada casilla:** Int16LE `sprite`, `spriteFrame`, `objectSprite`, `objectSpriteFrame` y un byte `flags`.
  - `TILESIZE` vale **10** en todos los mapas que hemos medido, aunque la doc dice "típicamente 9". Hay que leerlo siempre de la cabecera.
- **Flags:**
  - `0x80` = bloqueada;
  - `0x40` = teletransporte;
  - `0x20` = cultivable.
  - **Agua** = `sprite === 19`, y la tratamos también como no transitable.
- La casilla mide 32 px. Con movimiento libre: `walkable(px, py) = tile(floor(px/32), floor(py/32))` sin bloqueo ni agua.

### Evaluación de candidatos
Medido con un script sobre los `.amd`. "Ventana" = cuadrado de N×N casillas con el mayor % de casillas libres.

| Mapa | Tamaño | % libre | Mejor ventana | Comentario |
|---|---|---|---|---|
| fightzone1–3, 9 | 100×100 | 6% | arena 18×18 | Demasiado pequeño (menos de 1 pantalla) |
| fightzone4 | 80×80 | 5% | 9×9 | Demasiado pequeño |
| fightzone5–8 | 120×120 | 33–37% | 40×40 al 75% | Pasillos estrechos |
| huntzone1 | 200×200 | 41% | 80×80 al 87% | Muchos acantilados |
| **huntzone2** | 200×200 | 46% | 80×80 al 84% en (88,90) · 100×100 al 80% en (72,70) | **Elegido por el propietario.** Río y ruinas en el centro, con algunos muros |
| huntzone3 | 200×200 | 32% | 60×60 al 80% | Mucho agua y acantilado |
| huntzone4 | 200×200 | 43% | 80×80 al 80% | Laberíntico |
| middled1n / 1x | 220 / 200 | 23–24% | 16×16 | Mazmorras: estrecho |
| 2ndmiddle | 250×250 | 55% | 100×100 al 90% | Variado, con agua dispersa |
| middleland | 524×524 | 62% | 100×100 al 99% en (364,340) | Pradera casi vacía; era la propuesta técnica, pero algo monótona |
| **bisle** (Bleeding Isle) | 274×250 | 51% | 100×100 al 99% en (46,78) · **150×150 al 95% en (66,52)** (zona usada) · 200×200 al 81% (entra la costa) | Todo lo transitable está conectado (una sola región). **Mapa del juego desde el 18-oct-2026** |

### Decisión: `huntzone2` (elegido por el propietario el 2026-10-16)
- Mapa entero de 200×200 casillas (6400×6400 px) con un único bloque transitable: no hay zonas aisladas.
- **Zona de juego:** ventana de unas 100×100 casillas desde (72,70), con un 80% libre. Incluye el santuario central con el anillo de río y las praderas de alrededor. Si en la Fase 2 resulta estrecha, se puede usar el mapa entero.
- **Riesgos para un Survivors:**
  - los acantilados y el río crean muros en los que los enemigos se pueden atascar persiguiendo en línea recta;
  - en la Fase 3 hay que comprobar que la persecución simple funciona o añadir un "deslizamiento" a lo largo del muro;
  - el spawn en anillo debe descartar puntos en casillas bloqueadas o en agua.
- Tiene 30 casillas de teletransporte (flag `0x40`). Las ignoramos y las tratamos como suelo normal si no están bloqueadas.
- El `.amd` pesa 400 KB. En la Fase 2 se cargan solo los `.spr` de casillas que use el mapa (como `utils/MapAssets.ts`).
- Alternativa descartada: `middleland` (recorte de 100×100 desde (364,340), 99% libre), más fácil para el juego pero monótona.

## Archivos a portar
Los copiamos a `survivors/src/hb/` con la cabecera de licencia (regla 2 de CLAUDE.md).

**Pistas generales**
- Phaser `^3.90.0`.
- Los assets se sirven desde `public/assets/{sprites,maps,sounds,music,images}`: 359 `.spr`.
- Los loaders usan `load.binary(key, 'sprites/<x>.spr')`, con el path del loader en `assets/`.
- `HBSpriteFile.load()` lee de `scene.cache.binary`, así que hay que llamar antes a `load.binary`.
- Claves de animación: `sprite-{name}-{sheetIndex}`.

### Fase 1: sprite y Orc animado
| Archivo origen | Líneas | Qué hacer |
|---|---|---|
| `utils/AnimationUtils.ts` | 22 | Portar tal cual (frame rate y duración) |
| `Types.ts` | 142 | Solo `PivotFrame` y `PivotData` |
| `Config.ts` | 247 | Solo las constantes usadas (`DEPTH_MULTIPLIER`, `DEFAULT_ANIMATION_FRAME_RATE`…) → `config/gameConfig.ts` |
| `game/assets/HBSprite.ts` | ~800 | Portar con cambios: quitar la exportación a data-URL, el tintado de items, EventBus y Items. Sustituir el guardado de pivotes en `RegistryUtils` por un mapa del módulo |
| `utils/CoordinateUtils.ts` | ~370 | Portar tal cual y añadir `isWalkableAtPixel` y "dirección de 8 a partir de un vector" |
| `game/objects/GameAsset.ts` | ~1800 | **Reescribir en pequeño** (~200 líneas): sprite con pivote, `playAnimationWithDirection` y profundidad |
| `constants/Monsters.ts` | ~1090 | Portar solo los datos (`spriteName`, ajustes por estado, `temporalCoefficient`) e incluir el enum `MonsterShadow` |
| `game/scenes/LoadingScreen.ts` | ~520 | **Reescribir** como `PreloadScene`: binarios primero y luego decodificación asíncrona |

### Fase 2: mapa y jugador
| Archivo origen | Líneas | Qué hacer |
|---|---|---|
| `game/assets/HBMap.ts` | ~1220 | Portar con cambios: quitar resaltados y depuración (~líneas 670–1100) y usar el GameAsset reducido |
| `utils/MapAssets.ts` | 167 | Portar con cambios: sin registry, con una lista simple de precarga |
| `utils/SpriteUtils.ts` | ~180 | Solo `isTreeSpriteIndex` y `getSpriteFrameHeight` |
| `utils/SpatialGrid.ts` | 185 | Portar y hacerlo genérico `<T extends {x,y}>` |
| `utils/PlayerAppearanceManager.ts` | ~1400 | Portar solo la tabla de orden de capas, el mapeo estado→hoja y el equipo fijo de Guerrero (sin género, pelo ni Items) |
| `utils/ShadowManager.ts` | ~450 | Opcional, más adelante |

### Fases 4 y 6: efectos, hechizos y números de daño
| Archivo origen | Líneas | Qué hacer |
|---|---|---|
| `constants/Effects.ts` | ~1150 | Portar recortado a los efectos que usemos |
| `utils/EffectUtils.ts` | 164 | Portar tal cual, con el sonido opcional |
| `game/effects/Effect.ts` | 202 | Portar con el sonido opcional |
| `game/effects/DirectionalProjectile.ts`, `ArrowProjectile.ts` | 119 / 216 | Portar con cambios: posición en píxeles y pooling |
| `game/spells/*` | 31 archivos | Selección: EnergyBolt, LightningBlast, FireBall, LightningBolt, Blizzard(+Shard), ChillWind, MeteorStrike |
| `game/effects/FloatingText.ts` | 74 | **Reescribir** con `Phaser.Text`/`BitmapText` + tween. El original lo pinta el overlay de React |

### No portar
- `Player.ts`, `Monster.ts` y `GameObject.ts`: lógica por casillas, React stores y estado global. Solo como referencia de tiempos.
- `CastManager.ts`, `GameStateManager`, `InventoryManager`, `LootManager`, `MapManager`, `CameraManager`, `RendererUtils`, `RegistryUtils`, `constants/Items.ts`, `constants/Assets.ts`, `Boot.ts`, todo `ui/`, `App.tsx` y `PhaserGame.tsx`.

## Cómo arranca la base
- `pnpm --dir sp-client dev` → http://localhost:8080 → "About" → "Got it" → "Log in" → aparece el personaje en un pueblo, con un panel de controles para probar monstruos, hechizos y mapas.
- En el navegador interno salen errores `Cannot suspend/resume a closed AudioContext`. Son del audio cuando la pestaña está en segundo plano y no afectan.
- Minimapas de referencia en `public/assets/images/minimaps/*.jpg` (1500×1500). No hay de las fightzones.

## Aprendido en la Fase 1
- **Pivotes nativos de Phaser:**
  - En lugar de recolocar el sprite en cada cambio de frame (como `GameAsset`), `HBSprite.ts` marca cada frame con `customPivot = true` y `pivotX = -pivotX/width`, `pivotY = -pivotY/height`.
  - Phaser aplica ese origen solo en `setFrame` y en cada frame de animación (`AnimationState.setCurrentFrame`).
  - Resultado: `sprite.x/y` es directamente la posición de los pies, sin listeners. Es más barato con cientos de enemigos y sirve también para sprites estáticos y para el pooling.
  - Los frames de 0×0 se dejan sin pivote, como en el original.
- **El Orc tiene 4 frames por hoja** en sus 40 hojas, no 8. Con la regla del original (10 fps × frames/8) cada animación dura 0,8 s igualmente. No hay que suponer 8 frames: se lee de la animación.
- **Texturas:**
  - Las de monstruo se crean con `textures.create(key, ImageBitmap)` y el bitmap se cierra justo después, lo que solo es seguro con WebGL. Por eso `main.ts` fuerza `Phaser.WEBGL`.
  - Las casillas de mapa (Fase 2) van por canvas, como en el original.
- **Claves:** la del binario, las texturas y las animaciones salen de la clave del manifest: `enemy.orc` → texturas/animaciones `enemy.orc-0` … `enemy.orc-39`.
- **pnpm 12:** bloquea el postinstall de esbuild si no está en `allowBuilds` de `pnpm-workspace.yaml`. Por eso `survivors/` tiene su propio `pnpm-workspace.yaml`, igual que `sp-client`.
- **Build:**
  - Vite usa `publicDir: '../sp-client/public'` en dev, y en build `copyPublicDir: false`. Así `dist/` todavía **no incluye assets**: se resolverá en la Fase 9 con `sync-assets`.
  - Phaser ocupa ~1,5 MB sin comprimir (~340 KB gzip).
- **Pendiente fuera de `survivors/`:** el `.gitignore` de la raíz tiene en su última línea, como texto literal, el comando `echo ".claude/settings.local.json" >> .gitignore`, así que esa regla no funciona. No lo toco sin permiso.

## Aprendido en la Fase 2
- **Anclaje (importante):** los pivotes de personajes, monstruos y objetos de mapa apuntan desde **los pies / la base**. En el cliente original ese punto es el **centro** de la casilla; el suelo se pinta desde la esquina.
  - `sp-client` coloca todo en la esquina (`x*32`), con lo que árboles y personajes quedan desplazados 16 px respecto a sus casillas bloqueadas.
  - Nosotros: el suelo va desde la esquina, los objetos en `x*32 + 16` (`TILE_ANCHOR_OFFSET`) y las entidades se dibujan en su posición tal cual (x/y = pies).
  - Con esto, los troncos coinciden con las casillas rojas del modo depuración.
- **huntzone2 usa pocos paquetes:** suelo `maptiles1`, `maptiles2` (301) y `maptiles4` (320); objetos solo árboles (100–122), más sus sombras (`treeshadows`). Los objetos 6 y 9 aparecen en el `.amd`, pero se ignoran como en el original.
- Las casillas de suelo tienen pivote 0 y miden 32×32: se copian tal cual al tileset.
- **Jugador por capas:**
  - Es un `Container` con 10 sprites. Un único reloj elige el frame de todas las capas, así que nunca se desincronizan.
  - El orden de capas se recalcula solo al cambiar dirección o estado (`getGearRenderOrder`).
  - Los frames de cada estado están en las notas de la Fase 0. Correr = estado Run (hoja humano 32+dir, armadura hoja 4, arma `start + 6*8 + dir`, escudo `start + 6`).
- **Choque:** cuadrado de 16 px centrado en los pies. Se mueve primero en X y luego en Y, y así se desliza a lo largo de los muros en diagonal.
- **Navegador interno:** con el panel oculto, `requestAnimationFrame` se para: la carga tarda o se queda "congelada" y la cámara se retrasa. Para probar, mostrar el panel.
  - El personaje se ve pequeño en capturas reducidas. Para comprobar detalles, usar `__game` (solo en dev, ver `main.ts`) y `cameras.main.setZoom(4)`.
- **El plugin de mando de Phaser 3.90 no es fiable:**
  - `Gamepad.update` descarta el mando si `pad.timestamp < _created`.
  - Con un mando real el propietario no consiguió moverse. Por eso `InputSystem` lee `navigator.getGamepads()` directamente cada frame, sin `input.gamepad` en la config.
  - Los navegadores solo muestran el mando **después de pulsar un botón** con la página enfocada.
- **Mando sin mando físico:** basta con sobrescribir `navigator.getGamepads` y devolver un objeto con `axes`, `buttons`, `mapping: 'standard'` y `connected: true`.
- **Ratón:** mientras se mantiene el clic izquierdo, el jugador corre hacia el cursor, con velocidad gradual hasta 64 px (`POINTER_*` en `gameConfig.ts`).

## Aprendido en la Fase 3
- **Rendimiento:** con 312 enemigos (un sprite más la sombra cada uno), el juego va a unos 138 FPS en el navegador interno. La lógica de todos los enemigos (rejilla, separación, persecución) cuesta **0,14 ms por frame**. Hay mucho margen antes de necesitar optimizaciones.
- **Sombra de monstruo** (`MonsterShadow.BodyShadow` en sp-client):
  - Es una copia del frame con tinte negro, `alpha 0,5`, rotación −45° y `scaleY 0,5`, con origen en el centro inferior del frame.
  - Ojo: `setTexture` aplica el pivote propio del frame (customPivot), así que hay que llamar a `setOrigin(0.5, 1)` **después**.
  - Slime, Ant y Scorpion no tienen sombra en el original.
- **Velocidades del servidor** (`multiplayer/server/Config/Monsters.json`): están en **ms por casilla** (Slime 800, Orc 700, Ant/Bunny/Zombie 220). El resto de stats son por defecto (`Settings.json`: hp 100, daño 1–5). No hay campo de experiencia: el balance es nuestro.
- **`temporalCoefficient`:** el original pone 0,5 en casi todos. Nosotros dejamos 1, porque con la regla `10 fps × frames/8` ya se ve bien (decidido en la Fase 1).
- **El río de huntzone2 atasca enemigos:** persiguen en línea recta y, al chocar, se deslizan de lado.
  - Los que quedan muy lejos (más de 1,8 × media diagonal de pantalla) se recolocan cada segundo en el anillo de aparición (`SPAWN.relocate*`).
  - Los que se atascan en la orilla visible esperan hasta que el jugador se aleje.
- **Monstruos junto al agua:** el sprite se dibuja hacia arriba desde los pies, así que uno en la orilla sur "parece" estar dentro del río. Es correcto.
- **Muerte del jugador:** en el estado Die el original oculta arma y escudo. Lo replicamos devolviendo `undefined` en `getLayerFrame`.

## Requisitos de equipo y hechizos (datos originales)
Tabla completa en `docs/REQUISITOS_HB.md`. Lo no obvio:
- **Los datos no están en `sp-client`:** `Items.ts` y `Spells.ts` solo tienen nombre y sprites. Los requisitos reales están en `reference/Item*.cfg` y `reference/Magic.cfg` (formato de columnas fijo, orden en `reference/Server.cpp`).
- **Dos umbrales de Str en las armas:** equiparla pide `peso/100`; el *full swing* pide `velocidad × 13` (Flameberge: 60 y 130). En el survivors usamos solo el de full swing.
- **Armaduras:** solo piden `peso/100` de Str, más un segundo stat en algunas piezas (`EffectValue4` = tipo, `EffectValue5` = mínimo).
- **Robes y gorros de mago piden Mag**, no Int. Int solo gobierna los hechizos (`ReqInt`).
- **Puntos de stat del original:** 70 al empezar, +3 por nivel, tope 200 por stat.
- **Escala:** se guardan los números originales y se aplica un multiplicador global `REQ_SCALE` (inicial 0.4) al leerlos.

## Efectos y sonidos (Fase 4)
- `effect.spr` tiene 10 hojas. Los pivotes vienen centrados en el propio `.spr` (p. ej. -12,-11 para un frame de 24×21), así que un `Sprite` normal queda bien colocado sin offsets.
  - Energy Bolt en vuelo: hoja 0, frames 2–5 (6 frames en total), 20 fps, en bucle.
  - Explosión: hoja 6, 15 frames a 50 fps (0,3 s). El último frame mide 200×120 px. El original lo desvanece desde el frame 6.
- `registerSheetAnimation` crea animaciones con la hoja entera. Para usar un rango de frames, `config/effects.ts` registra animaciones propias con clave `fx.*`.
- Sonidos: `.mp3` en `assets/sounds/`, nombrados `C*` (personaje), `E*` (efectos) y `M*` (monstruos).
  - Cada monstruo tiene sus sonidos en `sp-client/src/constants/Monsters.ts` (move/attack/takeDamage/death). Suelen ser números seguidos (Slime M1–M4, Orc M9–M12, Ant M29–M32); Bunny es la excepción (M71/M75/M79/M83).
  - El original no limita los sonidos simultáneos; el límite es nuestro (`AudioSystem`).
- En el original, un monstruo golpeado no se tiñe: solo reproduce la animación TakeDamage (hojas 24–31). El destello blanco (`setTintFill`) es nuestro.
- Wiki (`docs/hb-wiki/`): el área del hechizo también golpea al objetivo directo, por eso el Energy Bolt hace 10 + 7 al enemigo alcanzado.


## Barra inferior (HUD) original
- `sp-client` **no dibuja** la barra inferior (su interfaz son diálogos React), pero el arte está en `sprites/gamedialog86.spr`, **hoja 6** (versión 800×600; `gamedialog*.spr` sin 86 son la de 640×480).
- Frames de la hoja 6:
  - 14: barra completa 800×51, con vida, maná y XP dibujadas **llenas**.
  - 12: barra gris vacía 104×16 (vida y maná).
  - 13: barra gris vacía 170×11 (XP).
  - 6–11: los 6 botones iluminados (personaje, inventario, magia, habilidades, mensajes, sistema).
  - 0–5, 15, 16, 23: cruces, esferas e iconos sin uso conocido; 17–22: iconos de hechizos 24×24.
- Para mostrar la vida se pinta la barra llena y se tapa la parte que falta con el frame gris recortado (`setCrop`).
- Posiciones medidas por correlación de imagen sobre el frame 14 (relativas a su esquina): vida (102,10), maná (102,32), XP (226,8), botones desde x=492 cada 37 px con y=7. Están en `config/hud.ts`.
- Boceto y catálogo numerado de las piezas: `docs/mockups/hud/` (se ve con `mockups` de `.claude/launch.json` → http://localhost:8095/hud/).
- Playwright: `keyboard.press` y `mouse.click` sueltan en el mismo frame y Phaser no ve el `JustDown`. En pruebas, mantener la tecla o el clic ~80 ms.

## Objetos en el suelo y gemas de XP
- `sprites/item-ground.spr` tiene 20 hojas.
- Cada objeto de `sp-client/src/constants/Items.ts` indica su hoja (`itemSheetIndexMale`) y su frame (`itemSpriteIndexMale`, o `droppedItemSpriteIndexMale` en el suelo).
- Gemas en la hoja 15 (12–15 px):
  - Diamond 42, Ruby 43, Sapphire 44, Emerald 45, Crystal 46.
  - Gold Nugget 21, Silver Nugget 23.
- La hoja 19 tiene versiones "Magic" más pequeñas.
- Sonidos de objetos (`SoundFileNames.ts`): coger E20, a la bolsa E29, soltar E12, equipar E28.
- No hay sonido ni efecto de "subir de nivel" en el cliente.
- `HBSpriteFile` ya no registra animaciones para ItemGround/ItemPack: son imágenes sueltas, como Interface.
- **Phaser:** una escena no puede tener una propiedad llamada `data`, porque choca con su DataManager.

## Texto y fuentes en Phaser
- Phaser dibuja cada texto una sola vez en un canvas. Si la fuente web aún no ha cargado, se queda con la de respaldo.
  Por eso `main.ts` espera `document.fonts.load()` antes de crear el juego (`config/ui.ts`, `loadUiFont`).
- "MS Sans Serif" es una fuente de mapa de bits que Chrome no dibuja. Windows la cambia por "Microsoft Sans Serif" (TrueType).

## Pantalla "Create New Character" (sp-client no la tiene)
- **Fondo:** `gamedialog.spr` hoja 9 (640×480), idéntica en `gamedialog86.spr` hoja 9.
  - Trae ya dibujados el título, las flechas ←→ y los botones +/−.
  - Todos los textos los pintaba el cliente.
  - La hoja 8 es la pantalla de elegir personaje (4 huecos).
- **`dialogtext.spr` hoja 1:** 70 botones de 74×20 con el texto dibujado; el frame siguiente es la versión iluminada. Índices útiles:
  - Ok 0, Master 8, Disagree 14, Cancel 16, Create 24;
  - Magician 65, Warrior 67;
  - los frames 50–60 son botones anchos (Start, Create New Character...);
  - los frames 61–62 son retratos con "Name / Lev / Exp".

## Ataque cuerpo a cuerpo del jugador (sp-client PlayerAppearanceManager.ts)
- **MeleeAttack:**
  - hoja del cuerpo 48 + dirección;
  - hoja de armadura 6;
  - `ARMAMENT_STATE_INDEX` 4 (el arma se ve: hoja = inicio + 4·8 + dirección; escudo = inicio + 4);
  - 8 frames a 12,5 fps;
  - el golpe cae en el frame 2.
- **Cast:**
  - hoja del cuerpo 64, de armadura 8;
  - 16 frames;
  - el arma se oculta.
- **Sonidos:** tajo C18 (el mismo para todas las armas), golpe con filo en un monstruo C6, lanzar hechizo C16.
- **`msw.spr`:** cada espada ocupa 56 hojas (7 estados × 8 direcciones):
  - Dagger 0, Short Sword 56, Long Sword 112, Sabre 168, Scimitar 224, Falchion 280, Rapier 336;
  - Broad 392, Bastard 448, Claymore 504, Great Sword 560, Flamberge 616;
  - Giant Sword está en `msw2`.
- **`msh.spr`:** 7 hojas por escudo:
  - Leather 7, Targe 14, Scooterm 21, Blonde 28, Iron 35, Lagi 42, Knight 49, Tower 56;
  - Wood Shield no tiene índice en Items.ts.
- **Ropa básica:** Shirt `mshirt` (hueco hauberk), Trousers `mtrouser` (hueco leggings). No hay Main Gauche ni Esterk con sprite.
- **Martillos de mujer:** sp-client usa el sprite de hombre, aunque existen `whammer`/`wbhammer`.
- **Objetos en el suelo:** no hay sprites de imán ni de cofre. Alternativas: las bolsas de oro (`item-ground` hoja 5, frames 118–122) y las pociones (5/1, 5/2).

## Sonidos ajustados a la animación (sp-client SoundManager.calculatePlaybackRate)
- **Velocidad del sonido** = duración del sonido / duración de la animación.
- **Tajo C18:** dura 0,93 s y se reproduce comprimido al ataque, que por defecto son 8 frames a 12,5 fps (640 ms), es decir a ×1,45. Suena en el frame 2. A velocidad normal suena lento y grave.
- **Pasos:**
  - al correr, C10 (0,34 s) en bucle, 2 veces por ciclo de carrera;
  - al andar, C8;
  - polvo: `effect2` hoja 1, frames 28–32, en cada casilla.
- **Golpe con filo en un monstruo:** C6, que el original reproduce en el frame 4 de su animación de recibir daño.
- **Ojo:** los sonidos de Phaser son del juego entero, no de la escena. Un bucle sigue sonando si la escena se pausa, así que hay que pararlo a mano.

## Hechizos portados (sp-client game/spells, constants/Effects.ts)
- **Fire Ball:**
  - proyectil direccional `effect.spr` hoja 5, 4 frames por dirección (dir·4 … dir·4+3), 20 fps;
  - explosión `effect.spr` hoja 3, 20 fps;
  - sonido E4.
- **Fire Strike:** 4 explosiones en (0,0,0 ms), (20,30,60), (35,−30,100) y (−30,−15,140). Su comentario dice "3", pero son 4.
- **Mass Fire Strike:** `effect3` hoja 1 en el centro; luego `effect3` hoja 2 en (−30,−15,60), (35,−30,100) y (20,30,140).
- **Triple Energy Bolt:** 3 Energy Bolts a la vez. Como en el original, caen en una zona pequeña: una en el objetivo y dos a una casilla en diagonal (`aim: 'pattern'`, desde el 20-oct-2026; antes iban a 3 enemigos distintos).
- **Energy Strike:**
  - 8 proyectiles (`effect.spr` hoja 0 frame 0, sin animar), uno cada 80 ms, a casillas al azar a ±2 del objetivo;
  - impacto: `effect3` hoja 5 + `effect11` hoja 8 (15 fps).
- **Lanzar hechizo:** el original no tiene frame de "suelta": tras la animación Cast (1500 ms) espera un clic en CastReady. Para disparo automático elegimos nosotros el momento.
- **Colores de objeto:** `reference/Client.cpp:702-729`, tabla m_wR/G/B.
  - Se suma (color − color 0) a cada píxel. El color 0 es (100,100,100).
  - Wizard Robe = Robe con color 11 "Tan" (105,90,70), es decir +5 −10 −30.
  - Phaser tiñe multiplicando, así que es una aproximación (`WIZARD_ROBE_TINT`).
- **Ropa básica femenina:** Bodice `wbodice1` y Skirt `wskirt`. Las usamos en los huecos hauberk y leggings, para que la túnica las tape.

## Buffs y objetos (sp-client)
- **Berserk:**
  - al lanzarlo, `effect8` hoja 1 bajo los pies (depthOffset −1) y sonido E5;
  - mientras dura, `GameAsset.setBerserkOverlay`: una copia de cada capa en modo ADD, con tinte 0xff4444 y 50% de opacidad.
- **Defense Shield:**
  - `effect8` hoja 6 al lanzarlo;
  - "Defense Shield Buff" = `effect9` hoja 14, que sp-client define pero no usa en ningún sitio. Lo usamos como aura.
  - **Ojo:** los pivotes de sus frames lo dibujan unos 95 px a la izquierda y 147 px por encima del punto de anclaje. Lo corregimos con `offsetX` 72 y `offsetY` 105 en `config/effects.ts`, para dejarlo centrado en los pies (pedido por el propietario). Los efectos de lanzar (`effect8` hojas 1 y 6) sí están centrados en los pies.
- **Objetos en el suelo** (`item-ground.spr`):
  - Red Potion 5/1 (al beber, C19);
  - Gold Pocket 1–5: 5/118–122;
  - Crystal 15/46;
  - objeto que cae al suelo: E12.
- No hay imán ni cofre en los gráficos del juego.

## Nombres de las letras (24-oct-2026)
Para hablar con el propietario, tres letras con nombre:
- **Letra de títulos** = la caligráfica del original (`SpriteText`, fuente `'calligraphy'`, `sprfonts.spr` hoja 0): títulos de los menús, "Victory!", "Select Map", opciones de los menús, avisos como "Level Up" de la ciudad.
- **Letra de cartas** = la negrita de 13 px (`SpriteText`, fuente `'title'`, `interface2.spr` hoja 1): títulos de las cartas de Power. Ojo: en el código se llama `'title'`, pero no es la "letra de títulos".
- **Letra de texto** = Comic Neue (`UI_TEXT`): todo lo demás. Números de daño en Georgia.

## Fuente dibujada del original (`sprfonts.spr`)
- **Hoja 0 (FONT1):**
  - la letra caligráfica de los diálogos, del libro de hechizos y de mensajes como "Connection Lost!";
  - un frame por carácter, de '!' (33) a 'z' (122): frame = código − 33;
  - glifos negros con transparencia.
- **Cómo la pinta el original** (`reference/Client.cpp`, `PutString_SprFont2` ~7880):
  - el carácter sin color en (+1,0) y (+1,+1), que hace de sombra;
  - encima, la versión coloreada (`PutSpriteRGB`);
  - el avance de cada letra sale de la tabla `__cSpace`; el espacio son 5 px.
  - Nosotros coloreamos con `setTintFill`, porque un tinte normal (multiplicar) sobre negro sigue siendo negro.
- **Hoja 1 (FONT2):** otra variante, que no usamos.

## Monstruos de las oleadas (sp-client Monsters.ts)
- **Sprites:**
  - Snake `amp`, Scorpion `scp`, Frog `giantfrog`, Skeleton `ske`, Zombie `zom`, Dire Boar `direboar`;
  - Troll `troll`, Ogre `orge`, Stalker `stalker`, Werewolf `werewolf`, Cyclops `cyc`, Lich `liche`;
  - Hellhound `helb`, Dark Elf `darkelf`, Gargoyle `gagoyle` (con la errata), Hellclaw `hellclaw`, Tigerworm `tigerworm`;
  - Minotaur `minotaurs`, Ettin `ettin`, Demon `demon`, Fire Wyvern `firewyvern`;
  - Fase 13B: Clay Golem `cla`, Stone Golem `gol`, Mountain Giant `mtgiant`, Cannibal Plant `canplant` (sin animaciones especiales; los golems con `temporalCoefficient` 0,5).
- **Mage-Orc ("Orc (spellcaster)" en la wiki, `Orc-Mage` en el NPC.cfg):** sp-client no lo tiene; en el original se ve igual que el Orc. Usamos `orc.spr` y sus sonidos. Su `AttkRange` del cfg es 1 (la bola de fuego es su hechizo, magia 3): le damos alcance 5 para que lance desde lejos.
- **Sonidos reutilizados:**
  - Stalker usa los del Orc (M11/M12);
  - Gargoyle y Hellclaw, los del Cyclops (M43);
  - Tigerworm y los Wyverns no tienen sonido de golpe;
  - Minotaur: su sonido de ataque apunta a M123 (debería ser M104, que falta).
- **Animaciones especiales:**
  - Giant Frog anda con los frames 3–7;
  - Troll, Ogre, Liche y Werewolf tienen 4–6 frames en algunos estados, lo que la regla de fps ya compensa;
  - Wyverns:
    - reposo = hoja 0, frames 0–3;
    - ataque = hoja 0, desde el frame 3 (otros valores rompen Phaser);
    - muerte = hojas 16+;
    - opacidad 0,7.
- **Disparos:** solo Dark Elf y Elf Master tienen `bowAttack` (`effect.spr` hoja 7, 16 frames direccionales). Las bolas del Fire Wyvern y del Mage-Orc son nuestras: reutilizan el Fire Ball.
- **Música** (`public/assets/music`): abaddon, apocalypse, aresden, default, dungeon, elvine y middleland. sp-client la toca en bucle con `MusicManager`.
- **Ajuste de oleadas (18-oct-2026, antes de la Fase 16):** un monstruo nuevo cada ~minuto (los débiles siguen saliendo poco, por variedad), tope de vivos 100→260, **con un jefe vivo no sale nadie de las oleadas** (`SpawnSystem`; desde el 20-oct-2026, con un mini jefe las oleadas siguen a medio ritmo y medio tope, `SPAWN.duringBoss`; solo el jefe final las para), monstruos normales con vida y XP ×2 y daño ×1,4 (jefes igual que antes). Simulación: 900–1.400 muertes por partida (antes 2.400–3.300), ~8% mueren de un golpe (antes 15–21%), nivel 25–26, Ettin ~30–65 s, Wyvern ~2:15–2:55. La partida simulada ahora da también `aliveByMinute` y `oneHitKillShare`.

## Ataques de monstruos y golpe (original)
- **sp-client no guarda alcance de ataque por monstruo:** `attackDistance` viene del diálogo de pruebas.
  - El servidor (`multiplayer/.../Monsters.json`) solo lo trae para Dark Elf (10, a distancia), Giant Tree, Stone Golem, Guard y Sorceress.
  - El alcance largo del Ettin lo ha observado el propietario.
- **Ataque:**
  - 8 frames a 5 + (velocidad/100)·25 fps; con la velocidad por defecto (50) son 17,5 fps, unos 457 ms (×2 con temporalCoefficient 0,5);
  - el golpe cae en el frame 2;
  - el sonido suena al empezar, comprimido a la animación;
  - no hay espera entre ataques.
- **Golpe normal (Client.cpp, `bAddNewEffect` tipo 1 "coup normal"):** `m_pEffectSpr[8]`, es decir `effect.spr` hoja 8: 3 frames de chispas azuladas, dibujados aditivos a la altura del atacado (−35 px). **No hay efecto de sangre** en el original.
- **Jugador golpeado:**
  - sonido C5 (`PLAYER_TAKE_UNARMED_DAMAGE`, igual para hombre y mujer);
  - animación TakeDamage: hoja de cuerpo 80, de armadura 10, arma índice 5, 4 frames por dirección, 267 ms;
  - aturdimiento de 100 ms.
- **Velocidad real de ataque de cada monstruo:** encontrada el 17-oct-2026 en el `NPC.cfg` de [centuu/HelbreathServer](https://github.com/centuu/HelbreathServer) (y de Helbreath/server, HBX). Ver `docs/hb-wiki/monstruos-comportamiento.md`, que tiene la tabla completa y las estrategias de ataque.

## Arte de menús del original (Fase 8)
- `new-dialog.spr`: 3 hojas, cada una con un fondo de 640×480 en el frame 0.
  - Hoja 0: "Loading Data", con la maga y "Helbreath Apocalypse".
  - Hoja 1: el título "Helbreath The Heldenian". Trae dibujados los botones Log In / New Account / Exit y la línea "PlayHelbreath.com". Sus frames 1–3 son esos botones iluminados.
  - Hoja 2: "Thank you for playing".
- `hb_lgn.spr`: el mismo fondo con el formulario de crear cuenta dibujado.
- `logindialog.spr`: el login con sus campos.
- **Paneles en `gamedialog86.spr`:**
  - hoja 0: frame 1, la piedra con hexagrama (258×328); frame 2, panel pequeño (270×104);
  - hoja 1: frames 5–6, paneles redondeados;
  - hoja 3: frame 3, el castillo con esquinas de plata (338×202; el que usamos), y frame 1, "Spells".
- **Botoncitos de `gamedialog86.spr` hoja 1:**
  - 7: flecha ◄ naranja de 15×15 (no hay ►: se voltea);
  - 8: flecha ▼;
  - 17–20: + y − naranjas de 12×12;
  - 9–16 y 21–23: flechas y círculos sueltos.
- **`dialogtext.spr` hoja 1, fila de arriba:** Ok 0, No 2, Quest 4, Continue 6, **Log Out 8**.
- No hay botones con texto de Play, Settings o Credits: los menús usan la fuente dibujada (`SpriteText`).
- Para ver las hojas sin `sharp`, el PNG de cada hoja está tal cual dentro del `.spr`. Formato:
  - cabecera: número de hojas (u16);
  - por cada hoja: frames (u16), longitud (i32), ancho (i32), alto (i32), 1 byte, y 12 bytes por frame;
  - después, por cada hoja: 4 bytes y el PNG.
- **Phaser:** `keyboard.addKey` devuelve el mismo objeto para la misma tecla. Esc está en `Pause` y en `Back`: si se comprueba `Pause` primero, gasta el `JustDown` y `Back` ya no lo ve. Comprobar las dos con `||`.
- **Navegador integrado:** si su panel está oculto, el juego va a ~1 FPS y los scripts tardan muchísimo. Abrir el panel antes de probar.

## Táctil y móvil (Fase 9)
- Phaser lee `pageX`/`pageY` de cada toque. Para simular toques en pruebas, crea `new Touch({... clientX, clientY, pageX, pageY})`: sin `pageX` el toque cae en x = −left.
- **Navegador integrado:** la vista "mobile" (o cualquier ancho < 768) simula un móvil táctil (`maxTouchPoints` 5), pero el tamaño se aplica a cada pestaña por separado. Al recargar con otro tamaño, Phaser vuelve a detectar si es táctil (`device.input.touch`).
- `scale.startFullscreen()` solo funciona dentro de un gesto del usuario. Phaser procesa los clics y toques al momento, así que funciona desde la opción del menú.
- **Toques fuera del dibujo del juego (franjas negras):**
  - Phaser sí avisa del dedo apoyado (`POINTER_DOWN_OUTSIDE`, por su escucha en `window`).
  - Pero **ignora los movimientos** mientras el dedo no esté sobre el canvas (`InputManager.onTouchMove` comprueba `isOver`).
  - Por eso el joystick lee `touchmove`/`touchend` del navegador y los pasa a coordenadas del juego con `scale.transformX/Y(pageX/pageY)`.
  - Cambiar `input.touch.target` al div no sirve: los toques llegarían dos veces (div y `window`).
- Una escena en pausa no ve el dedo levantarse. Por eso el joystick se suelta solo cuando la partida se pausa.

## Build y publicación (Fase 9)
- `HBSpriteFile.load(scene)` solo usa cosas comunes a todo el juego (caché, texturas, animaciones). Por eso se pueden cargar sprites desde cualquier escena y en mitad de la partida: `fetch` → `game.cache.binary.add(key, buffer)` → `new HBSpriteFile(...).load(scene)`. Así lo hace `AssetStreamer`.
- Para saber si un sprite está listo: `textures.exists(getSheetKey(key, 0))`.
- `window.__game` solo existe en desarrollo. En `pnpm preview` no está.
- Los `.spr` llevan PNG dentro (ya comprimido): la compresión del servidor apenas reduce su tamaño.
- Cloudflare Pages: 25 MiB máximo por archivo (el mayor es `tile489-522.spr`, 5,2 MB) y 20 000 archivos por despliegue.

## Assets para la segunda etapa (investigado el 17-oct-2026, ver `docs/PLAN-2.md`)
- **Crítico del original:** se lanza con Alt; cargas = nivel/10, +1 cada ~13 s (S:4117). Grito `C23` (hombre) / `C24` (mujer). Icono del HUD al mantener Alt: GameDialog hoja 6 frame 3 (el icono rojo con el número es el frame 5; ver "Critical Strike (Fase 19A)").
- **Zem** (Zemstone of Sacrifice): `item-ground`/`item-pack` hoja 15 frame 39. Efecto Resurrection: `effect11` hoja 10 (21 frames; el código pide 30).
- **Minimapa original:** `telescope.spr` hoja 0, miniaturas de 128×128. Frame por mapa: huntzone2 9, middleland 4, arefarm 6, elvfarm 5, dglv4 14, icebound 24, druncncity 25. Punto del jugador: GameDialog hoja 4 frame 37. También hay `images/minimaps/<mapa>.jpg` (1500×1500).
- **Bolsa original:** GameDialog hoja 7 frame 0 (226×188); objetos dibujados en (32+x, 44+y).
- **Objetos Hero por bando:** Aresden = sufijo 2 en armaduras y `mantle01`/`04` en capas; Elvine = sufijo 1 y `mantle02`/`05`. Banderas en el suelo: 5/56 Aresden, 5/57 Elvine.
- **Monstruos sin usar con sprite:** Frost, Ice Golem, Wyvern (el "de hielo", 3,6 MB), Dragon (`barlog`), Beholder, Stone/Clay Golem, Claw Turtle, Nizie, Tentocle, Giant Crayfish, Giant Lizard, Master Mage Orc, Centaurus, Sorceress, Rudolph, Mountain Giant, Unicorn, Guard. **No existen:** Yeti, Ice Lizard, otros dragones.
- **Mapas medidos** (mejor 100×100 libre / descarga completa): icebound 91% / 9,2 MB; dglv4 63% (99% en 60×60) / 4,9 MB; druncncity 86% / 8,5 MB; arefarm/elvfarm 93–95% / 16,2 MB; aresden/elvine 92–96% / 22,2 MB.
- **17-oct-2026:** `helbreath-survivor.pages.dev` publicado bien, pero desde la red del propietario no conectaba.
  - Su DNS daba 188.114.96.5 / 188.114.97.5 y la conexión se quedaba colgada.
  - Forzando otra IP de Cloudflare (172.66.44.100) respondía 200 con el juego y los `.spr`.
  - Es un bloqueo de IPs de Cloudflare del proveedor (típico en España con LaLiga), no un problema del juego.

## Interfaz en el móvil (Fase 10)
- El juego es 800x600 con `Scale.FIT`: en un móvil en horizontal (p. ej. 844x390) se dibuja a ~520x390, al 65 %. Por eso hay un modo "compacto" (`config/device.ts`, `byDevice(pc, móvil)`), que se puede forzar con `?ui=compact` / `?ui=normal`.
- Phaser 3.90 dibuja cada `Text` a resolución 1 si el estilo no dice otra cosa (no hay ajuste global). Por eso todos los estilos de la interfaz parten de `UI_TEXT`, que lleva `resolution`.
- La barra inferior (800x51) se puede escalar ×1,25 centrada: el dibujo original solo tiene madera vacía en sus primeros y últimos ~85 px.
- Pruebas con el navegador integrado: si el panel está oculto, el juego no avanza y las capturas salen viejas. Para capturar el lienzo tal cual sirve `__game.renderer.snapshot(...)`.


## Capturas y sprites para la guía (17-oct-2026)
- Playwright va a ~2 FPS: avanzar el juego con `game.step(t, 16.67)` en bucle. Con el escalado de Windows al 125 %, `screenshot` sale recortado: usar `game.renderer.snapshot`.
- Las texturas `.spr` se suben a la GPU y su `ImageBitmap` se cierra: `textures.getBase64` falla. Para exportar un frame hay que dibujarlo en un `RenderTexture` nuevo (redimensionarlo no cambia su tamaño real) y llamar a `rt.render()` antes de `snapshot`.
- La página del servidor de desarrollo se recarga cuando se escribe un archivo dentro del repo.
- Detalles y recetas: `docs/guia/README.md`.
- `dialogsv2.spr` hoja 0 (interfaz "V2" del original): 0 = hueco grande 176x35, 2 = marco de barra vacío 171x12 (el hueco interior, 167x9, empieza en (2, 1)), 3 / 4 = relleno rojo / azul 106x11 (hay que estirarlo), 5 = relleno verde 167x9. De 6 a 23, 26, 27 y 29: botones de icono de 40x47 o 49x47, normal + iluminado (el casco es 6/7). 28 = panel con adornos de 160x50. La hoja 5 tiene más paneles y barras de 63x7.
- Pruebas sin depender del panel del navegador: Chrome sin ventana con Playwright (está en la caché de npx). Con `isMobile` + `hasTouch` y 844x390, el juego detecta un móvil de verdad (`pointer: coarse`).


## Pruebas automáticas (`pnpm check`, 17-oct-2026)
- `scripts/check.mjs` usa `playwright-core` con el Chrome instalado (`channel: 'chrome'`): no descarga navegadores. Si el puerto 8090 está libre, arranca Vite y lo para al terminar.
- Lee el estado con `window.__game` (solo existe en desarrollo). Los campos privados de TypeScript se pueden leer desde la página (`g.enemies.alive`, `g.spawner`...).
- En `create()` el reloj de la escena (`this.time.now`) todavía no está al día en la primera partida: para esperar "X ms desde el inicio" hay que sumar `delta` en `update()`. Además, en el primer fotograma la cámara aún no ha colocado su vista, así que `spawnMany` no encuentra sitio: los atajos `?debug=` esperan 500 ms.

## Sensación de impacto (Fase 10, bloque 10C)
- **Temblor de cámara del original:** `sp-client/src/utils/CameraManager.ts` (`setCameraShake`). Fuerza = (5 − casillas de distancia) × 2, a veces con un multiplicador. Se ignora si es ≤ 2 y baja 1 por frame. Se puede quitar en las opciones (CameraDialog).
  - Lo usan las explosiones de Fire Ball, Fire Strike, Mass Fire Strike, Energy Strike, Earth Shock Wave, Meteor, Lightning Blast, Blizzard e Ice Strike.
  - Nosotros: `systems/ScreenShake.ts`, con los números en `data/feedback.ts`. Recibir daño: temblor suave; si pega un jefe (golpe o bola de fuego), más fuerte. Explosiones grandes de tus hechizos (`impactShakePx`): solo con golpe crítico y como mucho una vez cada 2,5 s (el propietario vio que, si no, el temblor era constante y molesto).
- **Muerte de un monstruo en el original:** solo el sonido, la animación Dead (hojas 32–39) y el cadáver desvaneciéndose. Ni humo ni sangre: el polvo y las chispas de `systems/HitParticles.ts` son nuestros.
- **Golpe crítico en el original** (cuerpo a cuerpo): `CriticalStrikeProjectile`, effect.spr hoja 8 viajando del atacante al objetivo, con sonido C23 (hombre) o C24 (mujer). Aún no lo usamos.
- **Sonidos:** muerte del jugador C14 (hombre) y C15 (mujer). sp-client **no** tiene sonido de subir de nivel. El propietario aportó las voces originales (hombre y mujer), que están en `survivors/custom-assets/sounds/`.
- **Assets propios** (`survivors/custom-assets/`, con la misma estructura que `sp-client/public/assets`): en desarrollo los sirve un plugin de `vite.config.ts` y en el build los copia `scripts/sync-assets.mjs`, que los busca antes que en sp-client. Se registran en el manifest como cualquier otro (`sounds/level-up-male.mp3`).
- **Ajustes posibles del temblor**, si el propietario los pide (`data/feedback.ts`): acortar la pausa entre explosiones críticas (2,5 s), contar cualquier crítico de la explosión, o añadir temblor a los críticos cuerpo a cuerpo.

## Interfaz (Fase 11)
- La fuente dibujada de los menús (`SpriteText`) no tiene "&" (y quizá otros signos): en títulos y valores de menú, solo letras. Por eso la página es "Keyboard" y no "Keyboard & Mouse".
- Los árboles del mapa son imágenes sueltas (una por objeto, `MapView.trees`), con su sombra aparte: se pueden ocultar o volver transparentes sin redibujar el mapa.
- La selección de personaje es la imagen original de 640×480 ampliada: las cajas son fijas y en el móvil los textos no caben por encima de 17–18 px. Para botones fáciles de tocar, agrandar la zona de toque (`hitArea`) en vez de la imagen.
- Un menú en pausa (debajo de otro) no cuenta como activo en `scene.isActive`: `pnpm check` espera a la escena de encima (`?open=`).

## App instalable (Fase 12, bloque 12A)
- Archivos en `survivors/pwa/` (manifiesto, `sw.js`, iconos). Solo van en el build: el plugin `installableApp` de `vite.config.ts` los copia junto a `index.html` y enlaza el manifiesto. En `pnpm dev` no hay manifiesto ni service worker (a propósito).
- Iconos: los diseñó el propietario (originales en `custom-assets/iconos-HS/`, fuera de git). En `pwa/` van solo los que se usan: `favicon.ico` + `icon-16/32` (pestaña), `apple-touch-icon` (iPhone), `icon-192/512` y `maskable-192/512` (Android). En `pnpm dev` el plugin `devIcons` sirve las imágenes de `pwa/` para que la pestaña también tenga icono.
- El service worker solo intercepta la página (`mode === 'navigate'`), siempre primero a internet con `cache: 'no-cache'`. El JS lleva hash en el nombre, así que una versión publicada nueva llega sola. No guarda sprites: el juego no funciona sin conexión.
- Comprobar si Chrome lo ve instalable: `pnpm build`, `pnpm exec vite preview`, y en Playwright con **perfil persistente** (`launchPersistentContext`; con `launch` normal da `in-incognito`) la orden CDP `Page.getInstallabilityErrors` debe devolver `[]`. El evento `beforeinstallprompt` no salta en Chrome sin ventana: para ver la opción Install se simula con un `Event('beforeinstallprompt')` que tenga `prompt()`.
- `beforeinstallprompt` puede llegar con el menú ya abierto: `MainMenuScene` rehace la lista (`MenuList.destroy()`). Con más de 6 opciones las filas se juntan (`MAIN_MENU.itemsAtFullSpacing`); con 8 (Continue en 12B) quedarían a ~23 px y se tocarían.

## Partidas guardadas (Fase 12, bloque 12B)
- Clave `hb-survivors.runs` en localStorage: `{ version, slots: [RunSnapshot | null] × 3 }`. `SaveStore.readSnapshot` valida cada campo: ids desconocidos se descartan (no rompen la partida); si falta clase, nivel, minuto o un stat, la ranura se da por vacía.
- Al cambiar `RunSnapshot` de forma incompatible: subir `SAVE_VERSION` y convertir en `migrate()`. Una versión **más nueva** que la del código (copia vieja en caché) se ignora sin borrarla... hasta que se guarde encima.
- `BossSystem.track(enemy, id)`: los `EnemyDef` no llevan su id, así que el jefe recuerda su nombre al registrarse (lo da el evento de oleada).
- Continue: `registry` `RESUME_SLOT_KEY` → `GameScene.create` lo lee y lo borra (así Restart del fin de partida empieza una nueva). `SpawnSystem.resumeAt` salta los eventos ya pasados y devuelve los jefes al acabar la calma; si se guarda durante la calma, esos jefes cuentan (`bossesWaiting`).
- Para probar la pausa automática en Playwright: redefinir `document.visibilityState` a `'hidden'` y lanzar `visibilitychange`. Las teclas en Playwright hay que mantenerlas pulsadas ~100 ms (`keyboard.down`/`up`): un `press` corto a veces no llega al juego.
- **Sin Continue en el menú (21-oct-2026):** solo Play. En Select Character, un personaje con partida guardada abre `scenes/RunChoiceScene.ts`: Continue la sigue; New Run avisa ("No" va primero) y, con Yes, borra la partida (`saveStore.clear`, se pierden su EXP y su botín) y empieza otra. `startCharacterRun` es el único sitio que arranca la partida desde ahí. Ver con `check runchoice` (`?open=runchoice`). Cuando llegue Select Map (Fase 22), la partida nueva pasará por ahí.

## Settings táctil (Fase 12C)
- `MenuList` tiene filas con casilla (`checked`), dibujadas con `Graphics`: el original no tiene sprite de casilla (sp-client la hace en React). Se probó una barra deslizante para el volumen y el propietario prefirió las flechas con el número (18-oct-2026).
- App instalada: `(display-mode: fullscreen)` también se cumple con Chrome a pantalla completa (F11, o abierto así por Steam). **Desde la Fase 25 no cuenta:** la app se reconoce por `?app=1` (el `start_url` del manifiesto), `display-mode: standalone` o `navigator.standalone`. Ver "Pantalla completa y consolas (Fase 25)".
- Large Trees solo On/Off: un `'transparent'` guardado (Fase 11) no está en `TREE_MODES` y se carga como el valor por defecto (On), sin migración.
- En Playwright, esperar a que la escena exista (`waitForFunction`) antes de pulsar teclas: con `?open=` la pantalla tarda algo más de 1,5 s.

## Pantalla completa y consolas (Fase 25)
- **Antes** el botón de pantalla completa desaparecía en todas partes con Chrome a pantalla completa: el juego lo tomaba por la app instalada (ver "Settings táctil"). Ahora la app abre `./?app=1`; el service worker busca la copia sin conexión con `ignoreSearch`.
- La pantalla completa del **navegador** (F11, Steam) no se puede quitar desde la web: `exitFullscreen` solo deshace la que pidió la página.
- Botón redondo en pantallas táctiles (`addTouchFullscreenButton`, `TOUCH_FULLSCREEN_BUTTON`): en la partida a la izquierda del botón de stats del HUD compacto (x 640), en la ciudad junto a la pausa (`townX`). Los sticks no se abren encima (`onTouchFullscreenButton`). La barra del jefe se estrechó en el móvil para no tocarlo.
- Modo móvil (`config/device.ts`): además de táctil y pequeña, la pantalla no debe tener un puntero fino (`any-pointer: fine`): la Steam Deck y la Legion Go tienen touchpad y se quedan en modo PC (con los botones táctiles, porque `device.input.touch` sigue siendo cierto).
- Stats en el móvil: `CHARACTER_INFO_BIG_STEPPER`, panel a la derecha de la ventana Character con el stat elegido y − / + de 84 px; los botoncitos del original siguen (no caben más grandes: hay 13 px hasta el borde).

## Pestañas de Settings (M13)
- Dos pestañas en móvil y ordenador: "Audio & Display" y "Gameplay" (`SETTINGS_MENU.tabNames`). Qué fila va en cada una: `audioDisplayRows` / `gameplayRows` de `SettingsScene`. Caben unas 6 filas más Back por pestaña; con más, otra pestaña o bajar `itemSpacing`.
- **Teclado y mando:** la barra de pestañas es la fila 0 de la `MenuList`, una fila `keyboardOnly` (sin texto ni zona de clic); la escena dibuja las pestañas y mira `list.selectedIndex` para iluminar ◄ ►. Al cambiar de pestaña la lista se destruye y se crea otra: el cambio se aplica en `update()` después de leer la entrada (`pendingTab`), no dentro de `handleInput`.
- La última pestaña se recuerda mientras la página está abierta (variable del módulo, no se guarda). `?open=settings&tab=gameplay` abre la segunda.

## Portal del final (Fase 13)
- Efecto `fx.portal` = sp-client EFFECT_PORTAL_1: `effect11.spr` hoja 12, 30 frames a 15 fps. Ya lo carga el juego (no añade descarga).
- Sus frames tienen el pivote desplazado: el dibujo queda ~97 px a la derecha y ~77 px por debajo del ancla. Se corrige con `offsetX/offsetY` en `config/effects.ts` (medido con `getBounds()` en partida). Mide unos 115–165 × 60–90 px según el frame.
- Los primeros frames son pequeños y crecen; en bucle no se nota un salto molesto.
- La tecla K (`?debug=kill`) mata con `combat.killAll(undefined, vista)`: cuenta como baja normal (XP, objetos, cofre del jefe). Antes usaba `enemy.kill()` a pelo y el jefe final no soltaba nada.
- `AssetStreamer` descarga también los esbirros de cada jefe (`BOSS_MINIONS`), con el minuto de su jefe.
- Para probar con `pnpm check`: las cartas de subir de nivel pausan la partida (y la cuenta atrás del portal). En un `--eval` hay que elegirlas a mano: `game.scene.getScene('LevelUp').params.onChoose(...)`.

## Partida simulada y equilibrio (Fase 13C)
- Todo el juego avanza con el `delta` de `update()` (no hay `delayedCall` ni tweens en la partida, solo en la música), así que la simulación llama varias veces por fotograma a `GameScene.step(33 ms)` sin romper nada. Va ~100× más rápido en Chrome sin ventana.
- `EnemySystem.landedDamage` es el **mayor** golpe del fotograma, no la suma. Para medir solo a los jefes está `landedBossDamage`.
- El Wyvern ataca desde 7 casillas: un jugador quieto no le da con la espada; hay que acercarse.
- Los jefes no se recolocan si se atascan detrás de un obstáculo: el bot de la simulación los perseguía para siempre (de ahí el "se rinde a los 3 s").
- Gema de diamante: `item-ground.spr` hoja 15, frame 42 (esmeralda 45, zafiro 44, rubí 43).
- **Guerrero frente a Mago**, igualados en el 13C (18-oct-2026; con crit y meteoro, otra vez al cerrar la Fase 19): Str y Mag dan +3% de daño por punto, el Mago gana +1 Int y +1 Mag por nivel, espadas ×1,5 y Energy Strike 8 por descarga (antes 14). Simulación: Wyvern en ~2:50 (Guerrero) y ~2:10 (Mago), nivel 24–27 los dos.

## Logros (Fase 14B)
- Lo que se guarda es el **id** de cada logro (`survive5`, `killWyvern`...), no su nombre: se puede cambiar el nombre o la descripción sin perder nada, pero **nunca el id**.
- Los jefes se reconocen comparando su definición (`ENEMIES[id] === enemy.def`): todos los monstruos de una clase comparten el mismo objeto de `data/enemies.ts`.
- La escena de cartas pausa la partida: el vigilante no corre mientras tanto y el aviso del HUD espera (`scene.isPaused`). Por eso el logro de nivel sale después de elegir la carta.
- En las pruebas automáticas, la partida se queda en las cartas si no se usa `--cards` (el script responde por su cuenta llamando a `onChoose` de LevelUp; los eventos de teclado sintéticos no llegan a Phaser).
- **Logros que se acumulan (Fase 29C):** meta `killTotal` (monstruo + cifra). `AchievementStore` guarda en la misma clave (`hb-survivors.achievements`, versión **2**; la 1 se migra con contadores a 0) cuántos se han matado de **cada** tipo, en todas las partidas y de los dos personajes juntos; se cuentan todos los tipos, no solo los que tienen logro, así uno nuevo sale ya con lo matado. `AchievementTracker.onKill` junta las bajas y `saveKills()` las escribe cada 500 ms (`ACHIEVEMENT_CHECK_EVERY_MS`), al guardar la partida (`saveRun`, también al salir o pasar a segundo plano) y al terminar. Los jefes son otro tipo (`stoneGolemBoss`…) y no cuentan; Champions y élites sí. Apagado en la partida simulada y con `?debug=dodge`. Al abrir el juego se repasan las metas ya cumplidas (como los rescates). La pantalla Achievements añade "(312 / 3,000)" a los pendientes. `?kills=slime:2999,orc:1500`, `check achievementprogress` (para ver la última página: `--eval="(s => { s.page = s.pageCount - 1; s.showPage(); return s.page })(game.scene.getScene('Achievements'))"`) y `check killcount --cards --wait=40000` (sale "Slime Squasher").
- **Cifras de 29C:** pensadas para ~8–10 partidas del mapa donde más sale cada monstruo. Por partida completa, matando ~65 % de lo que sale: Traveler ~450 Slimes y ~680 Snakes; Elvine ~225 Orcs, ~250 Trolls, ~215 Werewolves, ~235 Giant Trees; Middleland ~195 Skeletons, ~255 Werewolves, ~255 Cyclops; Bleeding Isle un poco de todo (~155 Orcs, ~170 Skeletons). Calculado sobre el papel con las oleadas y eventos de `data/waves.ts`; comprobar con partidas reales.

## Métricas (Fase 14A)
- **Servidor:** `metrics-server/` (Cloudflare Worker + D1 `helbreath-survivors-metrics`, cuenta del propietario). Dirección: https://helbreath-survivors-metrics.nicolasraviolo.workers.dev (la raíz es la página de gráficas; pide la clave).
- **Clave de las gráficas:** secreto `DASHBOARD_KEY` del Worker. Copia local en `metrics-server/.dev.vars` (ignorado por git). Cambiarla: `pnpm --dir survivors exec wrangler secret put DASHBOARD_KEY --config metrics-server/wrangler.toml`.
- **Formato:** `src/config/metrics.ts` (`RunReport`). El Worker importa ese tipo; al añadir un campo: tipo + `readReport` y `INSERT` en `metrics-server/src/index.ts` + columna nueva con `ALTER TABLE` en D1 (y en `schema.sql`). Luego `pnpm --dir survivors metrics:deploy`.
- **Tipos del Worker:** `worker-configuration.d.ts` lo genera `pnpm metrics:types` (600 KB, ignorado por git). Hace falta antes de `pnpm metrics:check`/`metrics:deploy` en un clon nuevo.
- **Qué se envía:** además de lo básico, nivel al final de cada minuto, daño recibido por monstruo (los 10 que más), vida más baja (%), pociones, y cada jefe con su llegada, su muerte (-1 si sigue vivo) y su golpe más fuerte (tras armadura). Lo recoge `systems/RunMetrics.ts`.
- **Cuándo se envía:** al ganar, al morir y al salir con "Quit to menu" (`result: 'quit'`, evento `QUIT_RUN_EVENT`). La partida sigue guardada: si se continúa y se termina, llega otra fila con `resumed = 1`. Nunca en la partida simulada; en `pnpm dev` solo con `?metrics=send`. Si falla, en silencio. Lo recogido viaja en la partida guardada (`metrics`), así Continue no lo pierde.
- **Base de datos vaciada** de pruebas al publicar la Fase 14 (18-oct-2026): todo lo que hay es de jugadores de verdad (o de `?metrics=send`).
- **Seguridad:** el Worker solo acepta envíos desde github.io y localhost (cabecera Origin), máx. 8 KB, y comprueba cada campo. No guarda IP ni nada personal. Cuerpo `text/plain` para que el navegador no haga petición previa (CORS).
- **Probar la página en local** con datos de mentira: `metrics-local` en `.claude/launch.json` (puerto 8787, clave `localtest`, base de datos local en `metrics-server/.wrangler/`).
- **Ojo:** la red del propietario bloquea a veces las IPs de Cloudflare (LaLiga, Fase 9). Si la página no abre, probar con datos móviles o más tarde.

## Código de traspaso (Fase 27½)
- **Reglas** (alfabeto, 6 letras, 24 h, 256 KB, claves que viajan, comprobación del paquete): `src/config/transfer.ts`, importado por el juego y por el Worker. Viajan las claves de `TRANSFER_KEYS` tal cual están en localStorage; los ajustes no. Si se añade una clave nueva de guardado, **añadirla ahí** o no viajará.
- **Servidor:** `metrics-server/src/transfer.ts`, tabla `transfers` (en `schema.sql`). `POST /transfer` (cuerpo = `TransferPackage`) → `{ code, expiresAt }`; `POST /transfer/claim` (cuerpo = código, admite minúsculas, espacios y guion) → la partida, o 404 si no existe o caducó. Canjear borra la fila con `DELETE … RETURNING`: un código sirve una sola vez aunque dos dispositivos lo intenten a la vez. Los caducados se borran al crear uno nuevo. Máx. 5.000 códigos vivos (si no, 503).
- **Mismo control de origen** que `/run` (github.io y localhost). Cuerpos `text/plain`.
- **Publicar** (cuenta del propietario): crear la tabla en la base real, `pnpm --dir survivors exec wrangler d1 execute helbreath-survivors-metrics --remote --config metrics-server/wrangler.toml --file metrics-server/schema.sql` (todo es `IF NOT EXISTS`, no toca `runs`), y luego `pnpm --dir survivors metrics:deploy`.
- **Probar en local:** `wrangler d1 execute … --local --file metrics-server/schema.sql`, arrancar `metrics-local` (puerto 8787) y llamar con `curl -H "Origin: http://localhost:8090" --data-binary …`. Probado (24-oct-2026): crear, canjear, segundo canje 404, inventado 404, caducado 404, 300 KB 413, clave de ajustes 400, otra web 403, UTF-8 intacto.
- **Juego (27½B):** `systems/TransferClient.ts` (juntar, subir, canjear, escribir, recargar) y `scenes/TransferScene.ts` (Settings → Gameplay → Transfer Save, **solo** si Settings se abrió desde el menú principal; `?open=transfer`, `check transfer`). Errores: sin red, Cloudflare bloqueado o más de 10 s = `offline`; 404 = `notFound` (sin Try Again). Primero se confirma y **luego** se canjea, para no gastar el código si el jugador dice No.
- **La casilla del código es un `<input>` HTML** encima del lienzo (teclado del móvil y pegar), recolocado cada frame con `getBoundingClientRect`. Phaser escucha las teclas en `window` y bloquea WASD y otras: la casilla hace `stopPropagation` en keydown/keyup, o no se podrían escribir esas letras.
- **Antes de sustituir** se guarda la partida vieja en `hb-survivors.transfer-backup` (no viaja). Las claves que el paquete no trae se **borran**, para no mezclar partidas. Luego se recarga quitando los parámetros de depuración (`?characters=demo` volvería a pisar la partida); solo se conserva `?app=1`.
- **Probado (25-oct-2026)** con dos navegadores de Playwright y el servidor real: todo igual en B, Copy al portapapeles, WASD en la casilla, segundo canje "not found" sin tocar nada, sin red "Can't reach the server". Para pulsar teclas con Playwright hay que mantenerlas ~100 ms (`keyboard.down`/`up`): un `press` instantáneo no llega a `justPressed`.

## Apuntado automático (Fase 15A)
- **Un solo sitio decide a quién se ataca:** `systems/Targeting.ts` (`findTarget`, `findTargets`), usado por todas las armas a través de `WeaponContext`. Un jefe (`def.boss`) a menos de `AUTO_AIM.bossPriorityRadius` (250 px, `data/targeting.ts`) y al alcance del arma va primero; si no, el más cercano. El apuntado manual del 15B debe entrar aquí, por encima de todo.
- **Elegir al jefe no bastaba:** los proyectiles explotan con el primer monstruo que tocan, y los pequeños que rodean al jefe se comían casi todos (medido: 67 de daño al Ettin en 20 s con la Maga a nivel 1). Por eso un proyectil lanzado a un jefe lleva `Projectile.target` y **solo choca con él** (atraviesa a los demás); si el jefe muere en vuelo, vuelve a chocar con cualquiera. Con eso: 396 en 20 s.
- **Ojo al medir con `pnpm check`:** sin `--cards` la partida se queda parada en la primera subida de nivel, y parece que el jefe no recibe daño.
- La partida simulada (`levelpace`) no sirve para medir esto: el jugador simulado huye del jefe y casi nunca está a menos de 250 px.

## Apuntado manual (Fase 15B)
- **Quién lo lee:** `InputSystem.getManualAim()`, cada frame. El stick derecho (zona muerta `MANUAL_AIM.stickDeadzone`) va antes que el clic derecho; el clic derecho da además el punto del cursor. `GameScene` se lo pasa a `WeaponSystem.setManualAim` → `Targeting.manual`. La partida simulada y el jugador muerto nunca apuntan a mano.
- **Qué hacen las armas:** si hay **algún** enemigo al alcance (`inReach`), atacan hacia `manualAimAngle` (desde su propio origen: el cuerpo en los tajos, los pies en los hechizos). Triple Energy Bolt sale en abanico (`fanDegrees`). Energy Strike cae en el cursor (como mucho a su alcance) o, con el stick, a `stickAreaDistance` × alcance. En manual los proyectiles **no** atraviesan monstruos aunque haya un jefe.
- **Ratón:** solo el botón **izquierdo** mueve y confirma (`leftButtonDown()`; un dedo también cuenta como izquierdo). Antes cualquier botón movía. El menú del navegador está quitado con `disableContextMenu` en `main.ts`.
- **Flecha:** `ui/AimArrow.ts`, un triángulo dibujado una vez y rotado; medidas en `data/targeting.ts`.
- **Probar sin ratón:** `?debug=aim` apunta a la derecha todo el rato (se puede combinar con `boss` para ver que el manual manda sobre el jefe).

## Stick de apuntar en el móvil (Fase 15C)
- **Dos sticks, una clase:** `ui/TouchJoystick.ts` recibe su estilo (`TOUCH_JOYSTICK` o `TOUCH_AIM_STICK`, `config/touch.ts`) y una función `accepts(x, y, maxY)` que decide si un dedo que se apoya ahí le toca. `GameScene` crea los dos: con `settings.aimStick` la mitad izquierda (x < 400, también la franja negra izquierda) mueve y la derecha apunta; sin él, el de mover acepta todo y el de apuntar nada. La casilla se lee en cada toque, así que cambiarla en la Pausa vale al momento.
- **Lectura:** `InputSystem.updateAim` mira el stick de apuntar justo después del stick derecho del mando. Solo cuenta cuando el dedo ya ha salido de la zona muerta (`pushed`); si vuelve al centro sin levantarse, se queda la última dirección. Sin punto (como el mando): Energy Strike cae a `stickAreaDistance` × alcance.
- **Esquina reservada:** `TOUCH_RESERVED_CORNER` (abajo a la derecha de la zona de juego) no abre ningún stick: ahí irá el botón del crit (Fase 19). El botón de pausa es de la escena del HUD, que va encima y se queda el toque.
- **Dedos:** `TOUCH_POINTERS = 3` (mover + apuntar + botón).
- **Settings en el móvil:** con la fila "Aim Stick" llegaron a ser 11 filas apretadas. Desde el M13 van en dos pestañas (ver "Pestañas de Settings (M13)").
- **How to Play en el móvil:** caben **6 filas** por página; la 7ª pisa el selector "Page". En el 15C se juntaron filas ("C / Esc", "Stats / Pause buttons") y se acortaron textos para que quepan.
- **Probar:** `?debug=aimstick` (con `--mobile`) pone un dedo de mentira empujando a la derecha. Para dedos de verdad en `pnpm check --eval`, crear `Touch` con `clientX/pageX/screenX` (si falta `pageX`, Phaser lo lee como 0) y lanzar `touchstart` en el canvas y `touchmove/touchend` en `window`. Ojo: un `import('/src/...')` desde `--eval` carga **otra copia** del módulo (Vite lo sirve con `?t=...`); para tocar los ajustes de verdad hay que importar la URL exacta de `performance.getEntriesByType('resource')`.


## Minimapa (Fase 16A)
- Imágenes ya hechas en `sp-client/public/assets/images/minimaps/<mapa>.jpg`, una por mapa y del mapa **entero** (bisle: 1500×1369 para 274×250 casillas, ~5,47 px por casilla en los dos ejes). sp-client marca bisle como `Minimap.NONE`, pero la imagen existe y cuadra con el mapa.
- `ui/Minimap.ts` recorta la zona de juego como un frame de la textura (`playArea`), calculado con el tamaño de la imagen entre el del mapa: vale para cualquier mapa sin medir nada a mano.
- `telescope.spr` (el GuideMap del original) no lo usa sp-client y no tiene índice documentado: no se usa.
- Solo marca jugador y jefes (y tótems en el 16B), por decisión del propietario. En mapas con NPCs (Fase 23, la ciudad), también ellos.

## Tótems (Fase 16B)
- `manastone.spr` tiene 40 hojas, pero todas son **la misma imagen** (56×100, base a 86 px del borde de arriba): se usa la hoja 0. sp-client no la usa.
- Brillo: Casting Circle (`effect5` hoja 7), dorado. Para teñirlo de otro color hay que usar `setTintFill` (con `setTint` normal el azul casi desaparece, porque el dibujo apenas tiene azul). Con el modo aditivo queda un círculo de luz del color puro.
- Zona de recogida (`entities/Totem.ts`): casillas que tapa el dibujo en al menos 8 px por eje, y siempre la de la base. Según dónde caiga, la Mana Stone ocupa 2×4 o 3×4 casillas.
- Freeze: pausa la animación del monstruo y lo tiñe de azul. Los Slimes, que son verdes y semitransparentes, se ven **verde azulado oscuro** (parecen matas). Es normal.
- Freeze solo afecta a los monstruos que se ven al cogerlo (`cameras.main.worldView`). En `?debug=horde`, los primeros segundos aún no hay ninguno en pantalla.
- Los cofres dan carta con `chestCards` en GameScene (se guarda en la partida). Va detrás de las cartas de nivel y también sale después del jefe final, cuando las subidas de nivel ya no dan cartas.
- Descarga inicial: +0,9 MB (`effect5.spr` 0,72 MB y `manastone.spr` 0,19 MB). Full HP usa el efecto Resurrection (`effect11`) y Freeze, `effect8` hoja 5; los dos ya se cargaban.

## Personajes guardados (Fase 17A)
- **Pantalla "Select Character":** `scenes/CharacterSlotsScene.ts`, con números en `config/characterSlots.ts`. El fondo (`gamedialog86.spr`, hoja 8) **ya trae dibujados** los marcos de los 4 huecos, los rótulos Name, Lev y Exp y los 5 botones de la derecha (Start, Create New Character, Delete Character, Change Password y Log Out). Encima solo se pintan los marcos marcados (`dialogtext` 61/62) y los botones iluminados (51–55 normales, +5 iluminados). Change Password se tapa con un rectángulo oscuro.
- **Guardado:** `systems/CharacterStore.ts`, en la clave `hb-survivors.characters` (con versión). Cada personaje tiene un `uid` fijo. La partida guardada lo lleva en `RunSnapshot.characterUid`, y así el mejor nivel va al personaje correcto aunque se borre y se rehaga el hueco. Lo apunta `GameScene` en cada frame con `characterStore.recordLevel` (solo escribe si es un récord).
- **Personaje activo:** se guarda en `registry` con `ACTIVE_CHARACTER_KEY`, además de `CHOSEN_CHARACTER_KEY` (la clase). Al continuar una partida manda su `characterUid`, no el registry.
- **Animación del menú:** como en el original, caminando en el sitio (`PlayerState.Walk`: hoja del cuerpo 24, armadura 3 y arma 3) y girando a la vez cada 6,4 s.
- **Escribir el nombre (`ui/TextInput.ts`, borrado el 22-oct-2026 con los personajes fijos):** usa un `<input>` invisible. Mientras tiene el foco hay que llamar a `keyboard.disableGlobalCapture()`, porque si no Phaser se traga W, A, S, D, el espacio y el retroceso. Además, `InputSystem.setKeyboardEnabled(false)` evita que las letras muevan menús. Al cerrar la escena no se puede redibujar el texto (error `drawImage` de null), por eso existe la bandera `destroyed`.
- **Pruebas con Playwright:** `keyboard.press()` suelta la tecla en el mismo frame y a veces Phaser no la ve (pasa con Supr). Hay que usar `down`, esperar ~120 ms y luego `up`. Antes de usar teclas, hacer clic en la página para que tenga el foco.
- **Atajos:** `?open=slots` y `?characters=demo|reset`. Situaciones `slots` y `slotsempty` en `pnpm check`.
- **Una partida por personaje (decidido el 18-oct-2026):** la partida del hueco i es la del personaje del hueco i (`SAVE_SLOT_COUNT = CHARACTER_SLOT_COUNT`). Continue y Play abren `CharacterSlotsScene` (`mode: 'continue' | 'play'`). En Continue solo se eligen los personajes con partida. Elegir un personaje con partida la **continúa**, también desde Play. Borrar o crear un personaje borra la partida de ese hueco. `SaveSlotsScene` se eliminó.
- **Personajes fijos (22-oct-2026):** `FIXED_CHARACTERS` en `data/characterSlots.ts` (Gorn en el hueco 0, Kaila en el 1); los demás huecos son `isLockedSlot` y salen con "Locked" y una silueta (`SLOTS_LOCKED`: el Guerrero con `setTint(0x000000)` y transparente, quieto). `CharacterStore.fillFixedCharacters()` los crea a Level 1 si faltan y les devuelve el nombre fijo. Versión 9 del guardado: lo anterior se tira entero, partidas incluidas. Ya no existen `CharacterSelectScene`, `ui/TextInput.ts`, `create`, `delete` ni `firstFree`. `?play` juega siempre con el personaje fijo de la clase; `?characters=reset` = Gorn y Kaila nuevos. Para un personaje desbloqueable nuevo: añadirlo a `FIXED_CHARACTERS` (o, si debe ganarse, una condición de desbloqueo en `fillFixedCharacters`).
- **Partidas sin dueño:** al arrancar, `characterStore.linkRuns()` pone cada partida en el hueco de su `characterUid`. Las que no tienen dueño se pierden (desde los personajes fijos; antes se convertían en un personaje nuevo). Una partida sin personaje no se guarda (`saveSlot = -1`).

## Aspecto del personaje (Fase 17B)
- **Datos:** `data/appearance.ts`. Sexo, piel (wm/ym/bm, ww/yw/bw), peinado (8, el 2 es calvo), color de pelo (8 de los 16 del original) y ropa interior (8). Cada personaje lo guarda en `SavedCharacter.look` (CharacterStore, versión 2; los de la versión 1 reciben `DEFAULT_LOOKS` de su clase).
- **Ropa por sexo:** clases y armaduras siguen escritas con un solo sexo. `CharacterSprite.setLayer` cambia cada pieza por la del otro sexo con `gearForGender` (tablas `TO_FEMALE` y `TO_MALE`). Las versiones de hombre y de mujer tienen las mismas hojas (msw/wsw 672, msh/wsh 63...), así que `startSheet` vale igual. No hay corpiño ni falda de hombre: el Mago hombre lleva Shirt y Trousers.
- **Descarga bajo demanda:** las piezas nuevas (`ON_DEMAND_SPRITES`, ~6,5 MB) no se cargan al empezar. `systems/LookLoader.ts` las baja cuando algo las dibuja; mientras, esa capa no se ve. `GameScene` pide al empezar todo lo que el personaje puede ponerse (`runSprites`).
- **Color de pelo:** el original suma color (`PutSpriteRGB`, escala 0..31). Phaser solo multiplica, así que `hb/additiveTint.ts` hace una copia teñida de cada hoja la primera vez (clave `{hoja}~hair{n}`). Para eso la hoja debe ser **canvas**: las texturas normales vienen de un `ImageBitmap` que HBSprite cierra al subirlo a la GPU (error "image source is detached"). Por eso `HairAndUndies` se carga como canvas, igual que los Tiles. `getSourceImage()` falla en nuestras hojas (no tienen frame `__BASE`): usar `texture.source[0].image`.
- **Colores probados en pantalla:** varios de los 16 salen casi iguales (el 15 "rubio" sale verde oliva y el 0 rojo oscuro se parece al 1). Los 8 elegidos están en `HAIR_COLORS`, con su número del original.
- **Casco:** como en el original, oculta el pelo.
- **Voz y grito:** van por sexo (`GENDER_SOUNDS`), no por clase.

## Esquiva física (Fase 18A)
- Fórmula y números en `src/data/defense.ts`: probabilidad de que un golpe acierte = 50·puntería / defensa, entre 25% y 95%.
- **Puntería** (`hitRatio` en `data/enemies.ts`) = la original de la wiki, sin el "Dash Attack". Se comprime al usarla (8,3 × puntería^0,53) porque va de 30 a 1.300. Hellhound no está en la wiki: le puse 200 (como un Troll).
- **Defensa del jugador** = 2·Dex + `defenseRatio` de cada pieza (valor original de `docs/hb-wiki/armaduras.md`; Knight Shield no está en la wiki y usa el del Kite Shield, 30). La reducción de daño de antes (`defense`) sigue igual: la armadura ayuda dos veces.
- El dado se tira **por golpe** en `Enemy.strike` (antes de juntar los golpes del frame) y en `EnemyProjectileSystem` para las flechas (`physical: true`). Una flecha esquivada sigue volando de largo. Las bolas de fuego son magia: no se esquivan (18B).
- Sin texto "Miss" (decisión del propietario): el golpe esquivado no hace nada, ni parpadeo ni animación de daño.
- Valores con el mejor equipo: guerrero 125 de defensa (Orc acierta 29%, Werewolf 68%, Ettin 77%); Maga 44 (casi todo entra).
- Desde la 18B el panel y las cartas no nombran monstruos: % **general** contra `DODGE.referenceHitRatio` (150).
- Partida simulada: el informe trae `blows` (golpes que acertaron/total por monstruo) y `pnpm check levelpace` lo escribe. Primera medida (18-oct-2026): el guerrero esquiva ~24% del daño de la partida y la Maga ~5%. Contra el Ettin (minuto 5) el guerrero aún esquiva poco porque le falta armadura.

## Resistencia mágica (Fase 18B)
- Fórmula en `src/data/defense.ts` (`MAGIC_RESIST`): probabilidad de que un hechizo entre = 50·puntería mágica / resistencia, entre 25% y 95%. Sin compresión (los números son nuestros y pequeños).
- **Puntería mágica** = `magicHitRatio` del ataque a distancia (`EnemyRangedAttack` en `data/enemies.ts`): Mage-Orc 45, Fire Wyvern 80. Un ataque sin `physical` ni `magicHitRatio` entra siempre.
- **Resistencia** = Mag + `magicResistance` de cada pieza (`data/armor.ts`, números nuestros: la wiki no la da por pieza). Fija: no sube sola como la habilidad del original.
- La tirada va en `EnemyProjectileSystem.update` después de la de esquiva. Resistida: explota (efecto y sonido) sin daño y llama a `onResist` → `DamageNumbers.showWord` ("Resist", del mismo pool que los números).
- Panel y cartas: % general contra `MAGIC_RESIST.referenceHitRatio` (= la bola del Mage-Orc). Si se cambia la del Mage-Orc, cambiar también la referencia.
- La partida simulada cuenta los hechizos junto a los golpes (`blows`).
- Varios "Resist" casi a la vez (las 3 bolas del Wyvern) se apilan hacia arriba (`WORD_STACK_MS`/`WORD_STACK_PX` en `DamageNumbers.ts`).
- `Equipment` guarda los totales de la armadura (`totals`) y los recalcula solo en `wear()`, porque se leen cada frame. La armadura solo se cambia con `wear()` (`armor` es de solo lectura). Para la vista previa de las cartas: `totalWith(pieza, 'magicResistance')`, etc.

## Critical Strike (Fase 19A)
- **Iconos de `gamedialog86.spr` hoja 6** (la del HUD): frames 0/1/2 = espadas azul / roja / gris en un rectángulo (36×44); frames 3/4/5 = esferas violeta / amarilla / **roja** con espada (32×32). El propietario eligió la **roja (5)** con las cargas encima, que pasa a la **violeta (3)** un momento al lanzar ("pulsada"). Va centrada en el hueco cuadrado de la barra, a la izquierda de los botones (x≈448–484).
- Esos frames traen el punto de anclaje del original: con `origin` por defecto quedan descolocados. Usar `setOrigin(0.5)` y `setFrame(f, false, false)` (si no, `setFrame` vuelve a poner el anclaje del frame).
- Efecto: `effect6.spr` **hoja 1** (elegida en el visor). En sp-client esa hoja es "Earth Worm Attack Helix"; la tarjeta del visor dice "Base" porque "Base" es la hoja 4 del mismo archivo. `effect6.spr` pesa ~0,48 MB y se carga al principio.
- Números de daño: el `!` va solo en el golpe que mata (como el original); el crítico de Chr sigue amarillo y grande.
- Grito: `C23.mp3` hombre / `C24.mp3` mujer.
- Forma del golpe por familia en `data/critStrike.ts` (`CRIT_SHAPES`): alcance = alcance del arma + N casillas. Hachas y martillos ya tienen la suya aunque estén apagados.
- Con las cartas abiertas el crit no se lanza; las cartas y el Game Over se eligen con Enter / A / clic, **no con Espacio** (`Action.Pick`), para que un Espacio pulsado de más no elija carta.
- El botón táctil (`ui/CritButton.ts`) y la esquina reservada se miden desde `overlayBottom()`: con la barra compacta abajo quedan por encima de las barras.
- La partida simulada lanza un crit en cuanto tiene carga.

## Meteor Strike, hechizo activo del Mago (Fase 19B)
- Números en `data/activeSpells.ts` (lista de hechizos activos: en la Fase 20 serán equipables). Lógica en `systems/ActiveSpellSystem.ts`; el meteorito (`entities/Meteor.ts`, con pool) lo mueve `WeaponSystem`.
- Mismo botón que el Critical Strike: con el Mago, `GameScene.launchCritStrike()` lanza el meteoro. La esfera roja del HUD es la misma (`HudBarState.skillOrb`): con el Mago enseña los segundos que faltan. El propietario quiere un icono propio para el Mago más adelante (`hudIcon` en los datos).
- Recarga: 20 s × (1 − 1% por punto de Mag), mínimo 8 s. Daño × (2 + Power/30), igual que el crit; todos los números salen grandes.
- Dibujo: `crueffect1.spr` (1,25 MB; hoja 0 = meteoro y orbes, 1 = impacto, 2 = explosión, 8 = explosión de suelo). Va en `ON_DEMAND_SPRITES` y se descarga al empezar una partida de Mago; después se vuelve a llamar a `registerEffectAnimations` (ahora salta los efectos cuyo .spr aún no está). Hasta que llega, el botón no hace nada.
- Sin enemigos al alcance (420 px) y sin apuntar a mano, no sale y no gasta la recarga.
- **sp-client se queda corto en el impacto.** El original (`reference/Client.cpp`, efectos 61/62/63/12) dibuja además una estela de humo al caer (crueffect1 hoja 0, frames 20–24, uno cada 25 ms), el fuego del suelo y la explosión **aditivos**, y 5 "Burst" (`effect2.spr` hoja 1, frames 10–15) repartidos. `m_pEffectSpr[n]`: effect.spr = 0–9, effect2.spr = 10–12, crueffect1 = 31–33 (`MakeEffectSpr`, C:4062). La explosión de suelo (hoja 8) es solo de sp-client; la dejamos.

## Vibración del mando y controles cambiables (Fase 19C)
- **Vibración:** `systems/Rumble.ts` usa `gamepad.vibrationActuator.playEffect('dual-rumble', …)` (Gamepad API). Va en Chrome/Edge; Firefox no tiene `vibrationActuator` y Safari depende del mando: entonces no hace nada. Un efecto nuevo **sustituye** al que esté sonando, por eso Rumble salta uno más flojo mientras dura uno más fuerte. Números en `data/feedback.ts` (`GAMEPAD_RUMBLE`). La partida simulada no vibra. El crit y el meteoro vibran al **impactar**: `WeaponSystem.onSkillHit` avisa una vez por lanzamiento (el primer golpe del crit que toca a alguien; el meteoro si cae con algún monstruo en su radio).
- **Controles:** solo el crit/meteoro y el panel de stats se pueden cambiar (decisión del propietario). Lista, teclas de serie, teclas reservadas y nombres en `config/controls.ts`; se guardan dentro de los ajustes (`settings.current.controls`). `InputSystem` los lee en cada `justPressed`, así un cambio vale al momento aunque la partida esté en pausa debajo. `keyboard.addKey(code)` devuelve la tecla ya creada si existe; la tecla elegida se añade también en el constructor para no perder su primera pulsación.
- **Capturar una tecla** (`scenes/ControlsScene.ts`): el `keydown` solo apunta la tecla y se aplica en el `update` siguiente, después de "tragarse" las acciones del menú de ese frame; si no, el Espacio recién elegido volvería a abrir la espera. Una pulsación sintética con keydown+keyup en el mismo instante no da `JustDown` en Phaser (keyup lo borra), por eso Esc/Backspace también se miran en el `keydown`.
- **Probar sin mando:** en `--eval`, `navigator.getGamepads = () => [padFalso]` con un `vibrationActuator.playEffect` que apunte las llamadas.

## Medir crit y meteoro (cierre Fase 19)
La partida simulada no separa el daño por arma. Para saber cuánto aporta el crit o el meteoro se envuelve `g.combat.hitEnemy` desde `--eval` en `pnpm check "play=mage&debug=sim"`: el crit y el meteoro son los únicos golpes con `bigNumbers = true` (7.º argumento), así que basta con sumar la vida quitada (`hp` antes y después) y las muertes de esos golpes frente al resto, por tramos de 5 min con `g.spawner.elapsed`, y esperar a `window.__sim.done`. Contadores de usos: `g.critStrike.launchedCount` y `g.activeSpell.castCount`. Una partida de Guerrero de cada tres suele salir mala (atascado con un jefe): descartarla.


## Ventana Character y Level permanente (Fase 20A)
- **`dialogtext.spr` hoja 0** (23 frames) son ventanas enteras del original: el **frame 0** es "Character Info." (270×376). Recuadros oscuros medidos en la imagen: nombre (14,49) 241×33; Level/EXP/Next EXP/Health/Mana/Stamina en x 176–250, y 104/122/140/170/188/206 (15 de alto); Max.Load y EK.Count en y 237 y 255; stats en cajas de 33×16: Str (51,281), Int (134,281), Vit (218,281), Dex (51,300), Mag (134,300), Chr (218,300). El hueco del equipo (círculos) va de x≈17 a 117. Todo en `config/characterInfo.ts`.
- **`gamedialog86.spr` hoja 3:** frame 4 = panel del reparto de puntos original (226×138, flechas ya dibujadas); **frames 5 y 6 = botoncitos naranjas + y − de 12×12**. En el original solo se pintaban al pasar el ratón; aquí siempre que hay puntos.
- **`dialogtext.spr` hoja 1:** no hay botón grande "Character"; **frame 10 = "Level Set."** (74×20, iluminado 11), el que abría el reparto en el original. Va en Select Character encima de Change Password (tapado del todo: con la sombra al 55% se leían trozos). Ok 0, Cancel 16.
- **Level y Power:** Level permanente (máx. 140) con curva en `data/characterLevel.ts` (una partida entera ≈ 70.000 EXP); toda la XP de la partida pasa al personaje al terminar (`CharacterStore.addExp`); 3 puntos por Level, que se reparten **solo** en la ventana Character (`scenes/CharacterInfoScene.ts`, `config/characterInfo.ts`), abierta con "Level Set." en Select Character o con C. En partida C **pausa** y la ventana solo se mira. El nivel de la partida se llama **Power** en todos los textos. En el 20B se llenarán los huecos Max.Load y el del equipo (círculos) de la ventana.
- **EXP de la partida:** `CharacterStats.runXp` la calcula del Power y la XP actual (no hace falta guardarla aparte). Una partida entera da ~70.000 (Power 27). La simulación no da EXP al personaje.
- **Partida a medias y puntos nuevos:** la partida guarda `permanentStats` (las stats permanentes con que empezó); al continuarla se suma lo repartido entretanto. Las guardadas antes de la 20A cuentan como stats de la clase.
- **Atajos:** `?characters=demo` deja a Gorn con 60.000 EXP (Level 12) y sus puntos; con `?play=warrior` juega Gorn. `?open=charinfo` abre su ventana; `?debug=charexp` multiplica ×50 la EXP al terminar (`--eval="g.endRun(false)"` termina la partida). Situaciones del check: `charinfo`, `charinfogame`, `charexp`.

## Equipo y pantalla Equipment (Fase 20B)
- **Datos:** `data/items.ts` junta armas (`weapons.ts`) y armaduras (`armor.ts`) para la pantalla: huecos, catálogo, requisito (`equip`) e icono (`icon`). `strRequired` / `stat` / `required` / `set` son solo de las cartas (se van en el 20C).
- **Requisitos del original:** en cada línea `Item = …` de `reference/Item*.cfg`, después del nombre: el 15.º valor es el peso (Str = peso/100) y el 18.º el Level mínimo (solo algunos: Giant Sword 100, Wings Helm 100, Horned Helm 120, Battle Hammer 110, Wizard Robe 80). Los 12.º y 13.º son Spr y SFrame del icono. La wiki (`docs/hb-wiki`) da otros Levels (servidor Olympia): no usarlos.
- **Iconos:** `item-pack.spr` (~540 KB, bajo demanda: `item.pack`). Hoja = Spr − 1 del cfg, **salvo cascos (hoja 18, el cfg dice 21) y capa (17, el cfg dice 20)**: el archivo de sp-client tiene menos hojas; mandan los índices de `sp-client/src/constants/Items.ts`. Comprobado a ojo el 19-oct-2026. La ropa tiene otro icono para mujer (`icon.female`).
- **Espadas en la mano:** `msw.spr`, bloque de 56 hojas por espada = (apprValue − 1) × 56 (16.º valor del cfg). Claymore 504; Scimitar y Falchion comparten el 280. Giant Sword va en `msw2.spr` (no cargado).
- **Capa y zapatos:** `mmantle03`/`wmantle03` (la capa normal) y `mshoes`/`wshoes`, bajo demanda.
- **Guardado:** `SavedCharacter.equipment` (versión 4 de `CharacterStore`); `characterStore.equip()` vuelve a comprobar el requisito. `CharacterSprite.wearEquipment()` viste al muñeco en Select Character, Character y Equipment; `GameScene` empieza con el arma y las piezas guardadas.
- **Pantalla:** `scenes/EquipmentScene.ts` + `config/equipment.ts`. Ventana Character original a la izquierda (misma posición que en partida) y panel propio a la derecha: la bolsa original (`gamedialog.spr` hoja 7) no está en `gamedialog86` y pesa 1,9 MB.

## Cartas de Power (Fase 20C)
- Las cartas ya solo son de **stat** o de **pasiva** (`systems/UpgradePool.ts`). Xelima y Merien son pasivas más en `data/passives.ts` (con `stacking`: Xelima suma, Merien encadena `1 − 0,9^n`), así que guardado, métricas (`passive:xelima`) y panel C las cogen solas.
- Xelima entra en `CharacterStats.damageMultiplier` (todo daño: arma, hechizo, crit y meteoro pasan por `CombatSystem`); Merien en `GameScene.reduceByArmor`. El "Damage taken" del panel C ya incluye Merien.
- Iconos: piedras = `item-pack.spr` hoja 5, frames 128 (Xelima, roja) y 129 (Merien, **verde**) (`StoneOfXelima`/`StoneOfMerien` en `reference/Item3.cfg`, Spr 6). `item.pack` se pide al empezar la partida; si aún no ha llegado, la carta enseña el círculo "Pas". Magnet = `custom-assets/image/magnetpng.png` (`UI_IMAGES`, clave `card.magnet`).
- `?debug=stones`: las cartas ofrecen todas las pasivas que no estén al máximo.
- Fuera: `strRequired` / `intRequired` / `stat` / `required` de armas, hechizos y armaduras, `utils/requirements.ts` y `REQ_SCALE`. `runSprites` ya no descarga todas las armas y armaduras de la clase.

## Hechizos equipables del Mago (Fase 20D)
- Huecos `spell1` (automático, círculos 1–5: `AUTO_SPELL_IDS` en `data/spells.ts`) y `spell2` (activo, círculos 6–10: `ACTIVE_SPELLS` en `data/activeSpells.ts`). Son `ItemId` como las armas: `itemInfo`, `catalog`, `canEquip` y `readEquipment` de `data/items.ts` los tratan igual. Nunca se quedan vacíos (`canEmptySlot`): un Mago guardado de antes recibe los de salida al leerse, sin cambiar la versión del guardado.
- Requisito: la **Int** del original (`int` y `circle` en cada hechizo; círculo = id de `Magic.cfg` / 10 + 1). Los de salida (Energy Bolt y Energy Strike) no piden nada (`FREE_SPELLS`). `EquipRequirement.str` pasa a opcional.
- Activos de dos tipos (`kind`): `'meteor'` (Meteor Strike, como en el 19B) y `'barrage'`: `WeaponSystem.castBarrage` lanza `shots` proyectiles del hechizo `shot` de `data/spells.ts` alrededor del punto. El daño es el del proyectil × `damageScale` × el multiplicador de Power (`Projectile.damageScale`, con números grandes por `fromSkill`). Energy Strike y Mass Fire Strike siguen en `SPELLS` solo como proyectil.
- Solo Meteor descarga sprite propio al empezar (`createActiveSpell`); los de ráfaga usan `effect.spr`, ya cargado, y están listos al momento.
- La vibración del activo se llama ahora `activeSpell` en `GAMEPAD_RUMBLE` (antes `meteorStrike`). Se dispara con la primera explosión de la ráfaga que toca un monstruo.
- Partida guardada: `activeSpell` junto a `spell`. Al continuar con un personaje guardado mandan el arma y los hechizos que lleva **ahora** (se pueden cambiar en Equipment con la partida a medias: Select Character continúa la partida al elegirlo). Solo las partidas sin personaje (atajos de prueba) recuperan los suyos.
- Pruebas: `check equipmentmage` (Kaila, ejemplo, Level 25 con Int 86), `check activespell` y el atajo `?spells=fireBall,meteorStrike` (cualquier orden, sin mirar requisitos). Partida simulada con Energy Strike: Power 27 y jefe final muerto a las 13:54, como con Meteor.
- Los hechizos aún no tienen dibujo: la casilla de la pantalla Equipment lleva el nombre (`EQUIPMENT_SPELL_NAME_STYLE`).

## Arreglos del bloque A de bugs (19-oct-2026)
- **`setFrame` y los pivotes:** algunas hojas de interfaz (la de Select Character, por ejemplo) traen pivotes en sus frames. `image.setFrame(n)` por defecto **cambia el tamaño y el origen** al pivote del frame nuevo: el dibujo puede seguir viéndose bien, pero la zona de clic se va lejos. Al iluminar un botón al pasar el ratón, usar `setFrame(n, false, false)`. Era el fallo de "Create New Character" y del resto de botones de esa columna.
- **Fuente `interface2.spr` (hoja 1):** 3 bloques de 95 letras ASCII (32–126); frame = `95 × bloque + código − 32`; cada letra avanza su propio ancho. Bloque 0 = negrita de 13 px (títulos de las cartas), 1 = cursiva de 15 px y 2 = pequeña de 11 px. En `hb/SpriteText.ts`, fuente `'title'`.
- **Tótems:** ahora son la esfera de energía `effect5` hoja 0 (aditiva, a ×1,5), igual para todos. En el minimapa salen todos con el mismo punto amarillo. Ya no se usa `manastone.spr`, que se quitó del manifiesto (190 KB menos al arrancar).
- **Imán:** atrae también lo que tenga `magnetPulls` en `data/pickups.ts` (hoy, la poción).
- **Barras de jefe:** una por jefe vivo, hasta `HUD_BOSS.maxShown` (3), con el final primero (`BossSystem.shownList`).

## Bugs del bloque B (20-oct-2026)
- **Sonido en segundo plano:** con la pestaña oculta el navegador congela el audio y los sonidos pedidos entonces salían de golpe al volver. `AudioSystem` no pide sonidos con la pestaña oculta o el `AudioContext` parado, y al ocultarla corta efectos y bucles (la música no). Para probarlo en el check: sobrescribir `document.visibilityState` y lanzar `visibilitychange`.
- **Defense Shield:** `damageTakenMultiplier: 0` = no se recibe nada (ni el daño mínimo ni la animación de herido); 15 s. **Freeze:** 10 s, en un área de `rangeScreens` × la pantalla (2).
- Para probar golpes al jugador sin depender de la horda: `--eval="g.hurtPlayer(50, true, 'test')"`.

## Estela del tajo del guerrero (M15, 20-oct-2026)
- `entities/Slash.ts` dibuja el arco por **rebanadas** (`SLASH_SLICES`): cada una es un cuadrilátero con su grosor (media luna con `taper`) y su alfa (estela del barrido con `sweepMs` y `trail`). El brillo va en un segundo `Graphics` con `BlendModes.ADD`. Las chispas son líneas en arrays fijos (sin objetos nuevos por golpe).
- **Siempre de arriba abajo:** `show()` empieza por la punta más alta en pantalla (`sin` menor) y, si hace falta, invierte el arco (`arc` negativo). Las chispas esperan a que el barrido llegue a la punta de abajo.
- Estilos en `data/slash.ts` (Classic, Crescent, Sweep, Crescent + sweep, Thin edge + sparks); el elegido es el último (`DEFAULT_SLASH_STYLE`). Los demás se guardan a petición del propietario. Probar: `?slash=N` y tecla **Y** en partida (solo desarrollo; letrero amarillo arriba a la derecha).
- Para ver un instante concreto en el check: `--eval` con `g.scene.pause()`, `g.weapons.slashEffect.show(...)` y `.update(ms)`.


## Monstruos élite (M2)
- Números en `data/elites.ts`; la tirada, en `EnemySystem.spawn` (jefes nunca). `?debug=elites` = todos élite; `pnpm check elites`.
- El brillo rojo es el del Berserk del jugador (copia ADD 0xff4444 al 50 %), pero **horneado** en una copia de la hoja (`hb/glowTexture.ts`, clave `{hoja}~elite`), hecha en la GPU con un `DynamicTexture`. Un sprite ADD encima de cada monstruo rompe el lote de WebGL (cada cambio de modo de mezcla es otra llamada de dibujo) y con cientos de élites bajan los FPS.
- No se puede copiar píxel a píxel como el pelo (`hb/additiveTint.ts`): las hojas de monstruo cierran su `ImageBitmap` al subirse a la GPU ("image source is detached").
- La animación pone el frame de la hoja normal al avanzar; `Enemy.syncGlowTexture` lo cambia por el de la copia en cada update (después de las animaciones, antes de dibujar).

## Pantalla de carga (M8)
- `PreloadScene`: fondo negro, título "Helbreath Survivors" encima de la barra con la letra caligráfica (`SpriteText`, `sprfonts.spr`), barra, "Loading" fijo y el logo del propietario abajo a la derecha con un "latido" (constantes `LOGO_*` arriba del archivo).
- El logo (`custom-assets/image/hb-logo.png`, clave `LOADING_LOGO` del manifest) y la letra del título (`BOOT_SPRITES`, 5 KB) los carga `BootScene`, antes que todo, para que salga desde el primer instante.
- El original del propietario era un JPG con el cuadriculado de "transparente" pintado: se recortó quitando los píxeles grises (poca saturación) y conservando los muy oscuros de la cola (el fondo nunca baja de brillo ~85; la sombra, ~68, se descarta).
- `?loading=hold` / `check loading`: la carga se para a la mitad para poder verla.
- `sp-client/.../loadingbg.spr` no tiene logo: siluetas (casco, hacha, árbol), nubes y fondos de 1920×1080 sin uso en el cliente.

## Equipo sobre el cuerpo en la ventana Character (M17)
- `item-equipm.spr` / `item-equipw.spr` (15 hojas): dibujos grandes y quietos del original (`DrawDialogBox_Character`, `reference/Client.cpp:32648`; sp-client no lo tiene). Hoja 0 cuerpo (frame por piel: **1 clara, 2 morena, 0 oscura**), 9 pelo (frame = peinado, teñido sumando), 10 ropa interior; el resto, por el grupo "Spr" de `Item*.cfg` con `SPR_TO_SHEET` (hombre y mujer reparten distinto: Client.cpp:3559-3611).
- El frame es el "SFrame" del cfg: **los mismos dos números que el icono de item-pack** (icono = Spr − 1, salvo cascos y capa). Escudos: frame = startSheet / 7. Espadas: el frame de su icono.
- Posiciones del original en píxeles de la ventana (su pivote es 0,0); cada frame trae su pivote. Orden: cuerpo, pelo (no con casco), ropa interior, capa, pantalón, camisa/cota, botas, armadura, escudo, arma, casco. Con falda, las botas van antes del pantalón.
- Código: `data/paperDoll.ts` (tabla por sprite del juego, así sale también la ropa de la clase) y `entities/PaperDoll.ts`. Bajo demanda (`item.equip.m/w`, tipo `PaperDoll` = canvas, para el pelo); mientras llega se ve el muñeco animado.
- Probar: `?characters=demo&open=charinfo&gear=plateMail,hornedHelmet,towerShield,cape,claymore` (`?gear=` viste a los dos de ejemplo sin mirar requisitos); `&open=equipment&class=mage` para la mujer.

## Botín en partida (Fase 21A)
- **Datos:** `data/loot.ts` (probabilidades, reparto 50/25/15/10, pesos por hueco, aspecto en el suelo, sonidos). Qué cae: `systems/LootRoller.ts` (escalón = mejor objeto de `catalog()` que las stats **permanentes** y el Level ya dejan poner). En el suelo: `systems/LootSystem.ts` + `entities/LootDrop.ts` (pool). Estado de la partida: `systems/RunLoot.ts` (found, bag, equipped por hueco, pending). Carta: `scenes/LootScene.ts`.
- **En el suelo** se usa `item-ground.spr` con **la misma hoja y frame que el icono de `item-pack`** (como `sp-client/src/game/objects/GroundItem.ts`; los índices de sp-client, también para cascos 18 y capa 17), a escala 1,5 como las pociones. Comprobado el 20-oct-2026: existen todos los de nuestro catálogo, también los de mujer y el Manual 5/92. El propietario quiere **solo** ese estilo en el suelo, nunca el icono del inventario. La carta y la pantalla final sí usan `item-pack`.
- **Hechizos:** no tienen icono; usan el **Manual** del original (`item-pack` 5/92), un libro (`SPELL_ITEM_ICON`).
- **Sonidos:** coger E20, equipar E28 (`sfx.itemEquip`), a la bolsa E29 (`sfx.itemBag`), caer E12.
- **Equipar en partida** no toca el personaje guardado: va a `RunLoot.equipped` y se guarda con la partida. Al continuar se vuelve a poner encima de lo que lleve el personaje. Al terminar (ganar o morir, de momento), `characterStore.takeRunLoot` lo pone en el personaje (lo que llevaba pasa al inventario) y la bolsa va al inventario. Así el 21C solo tiene que no llamarlo al morir sin Zem.
- **Guardado:** personajes versión 5 (`inventory: OwnedItem[]`); partidas con `loot` opcional (sin subir versión). `OwnedItem` es un objeto `{ id }` para que el 21B le añada el atributo sin migrar.
- **Probar:** `?debug=loot` (un objeto a la derecha del jugador cada 6 s), `pnpm check loot` / `lootmage`, y `--eval="g.debugPickUpLoot()"` para cogerlos todos. La carta se contesta con `game.scene.getScene('Loot').sys.settings.data.onEquip()` / `onKeep()`.
- En las capturas `.check` (jpg al 60%) un "+" pequeño parece "-": mirar el texto con `--eval` antes de dar por malo un signo.

## Atributos y varitas (Fase 21B)
- **Datos:** `data/attributes.ts` (Sharp, Poison, Ancient: probabilidad, daño, color, texto, y los números del veneno) y `data/wands.ts` (varitas del original: Level, Mana Save, daño extra de Berserk y Kloness, `rare`).
- **Quién los tiene:** solo el hueco Weapon (`canHaveAttribute` en `data/items.ts`); las varitas nunca Poison. La tirada va en `systems/LootRoller.ts` (`rollAttribute`). Los objetos `rare` (Berserk, Kloness) solo se quedan con `LOOT_RARE_KEEP_CHANCE`; si no, cae el mejor no raro de debajo. Las varitas de la Maga caen con peso 1 (`LOOT_SLOT_WEIGHTS_BY_CLASS`).
- **Daño:** `CharacterStats.attributeBonus` multiplica todo el daño (al Guerrero, sus golpes; a la Maga, sus hechizos). El +40/+20% de Berserk y Kloness va sumado a la ropa en `Equipment.magicDamageBonus`.
- **Veneno (como el de los jugadores del original, `PoisonEffect`, Server.cpp:33105):** `Enemy.poison(nivel)` (no se renueva si ya está envenenado) y `tickPoison()`: cada segundo 1d(nivel) y un 10% de curarse solo (sin duración fija). **Puede matar** (propietario): `CombatSystem.updatePoison()` lo cuenta como muerte (`slay`). Nivel = 40% del golpe que envenenó. Solo golpes físicos con `combat.poisonOnHit`. Números verdes (`DamageNumbers.showPoison`).
  - En el original el veneno de un arma **no hacía nada a los monstruos** (código vacío, "not yet implemented"); a los jugadores nunca los mataba. Solo el hechizo Poison Cloud mataba monstruos.
  - **Nube verde** del original sobre el envenenado (`fx.poison.cloud`: effect9 hoja 15, 21 frames, al 70%; `CheckActiveAura2`, Client.cpp:42148). Un sprite por enemigo del pool, creado la primera vez. Sus pivotes apuntan lejos: offset (115, 149) desde `bodyY`, medido en partida (el original usa sX+115). El original no tiñe de verde el cuerpo.
- **Color del arma por atributo (Server.cpp:48721, Client.cpp:702-710):** el original **tiñe el dibujo** (en la mano, icono, suelo y ventana Character), sumando a cada píxel el color de su tabla de armas menos RGB(100,100,100): Sharp "Heavy-blue" (−58,−47,+11), Poisoning "Green" (−30,0,−30), Ancient "Violet" (+20,0,+20, rosa-lila). El **nombre** en el original era el mismo verde para todos los especiales; aquí cada uno en su color (`ATTRIBUTES[x].color`).
  - `GearLayer.added` / `PaperDollPiece.added` y `hb/additiveTint.ts`: `colouredTexture` (capas que se redibujan) y `setColouredTexture` (imágenes quietas: se cambia a la teñida cuando está lista).
  - Las armas e iconos **no guardan sus píxeles** (las espadas costarían ~16 MB): la hoja que hace falta se vuelve a leer de su `.spr` (caché del navegador), se decodifica y se tiñe; mientras tanto se ve sin teñir un instante.
- **Dibujo de las varitas:** el "Appr" del Item.cfg (Client.cpp:3847): **todas** las Magic Wand y Wizard Staff usan `mstaff2` (34 = BerserkWand, 39 = KlonessWand). `gear.wand.m` pasó de `mstaff1` a `mstaff2` (el de la MS0 del original). Iconos: `item-pack` hoja 16, frames 1 (Magic/Wizard), 4 (Berserk), 5 (Kloness). Ojo: los nombres de sp-client ("Magic Wand 1/2") no coinciden con el original.
- **Guardado:** personajes versión 6: `attributes` = atributo de lo puesto, por hueco (los objetos del inventario lo llevan en `OwnedItem.attribute`). En Equipment, el catálogo sigue libre, pero lo que tiene atributo sale del inventario al ponérselo y vuelve al quitárselo (`characterStore.equip(uid, slot, id, attribute)`). Las filas se estrechan si no caben (`EQUIPMENT_LIST.minRowHeight`).
- **Equipment:** lo que se lleva puesto con atributo sale también en la lista (marcado), aunque ya no esté en el inventario.
- **Varitas:** en el original **no pedían Int ni Mag**, solo Level (y Str 10 por peso, que ignoramos). Item.cfg da Level 30/40/50/90/95/100/120; el propietario prefirió los de la wiki (0/15/35/60/70/120). Berserk Wand no subía el daño por un error (`*(int)1.3` = ×1) y Kloness sumaba según la reputación: usamos +40% y +20% del propietario.
- **Mana Save:** desde la Fase 26A abarata el Spell 2 (`Equipment.manaSave` → `ActiveSpellSystem.manaSave`). Ver "Maná del Spell 2 (Fase 26A)".
- **Probar:** `?attr=sharp|poison|ancient` (el arma de salida y todo el botín, siempre armas, con ese atributo), `pnpm check lootsharp`, `lootancient`, `poison`. `?gear=sharp:longSword` (con `?characters=demo`) mete esa arma en el inventario para verla en Equipment.

## Baúl, "solo lo que tienes" y Zem (Fase 21D)
- **Solo lo que tienes:** `isFreeItem(classId, id)` (`data/items.ts`) = equipo de salida de la clase o hechizo que no está en `MANUAL_SPELL_IDS` (hoy ninguno). Lo libre nunca se acaba ni entra en el inventario; todo lo demás sale del inventario al ponérselo (`characterStore.equip`) y vuelve al quitárselo (`takeOff`). Equipment lista: libres + lo puesto + `characterStore.ownedFor(uid, slot)` (una fila por objeto y atributo), ordenado como `catalog()`. Si no caben, la lista se desplaza (rueda, flechas; ▲/▼).
- **Botín:** `isLootDrop(id)` quita de la tirada el Zem y los hechizos que se saben con la Int. Hoy la Maga solo recibe varitas y armaduras.
- **Al terminar la partida:** `characterStore.finishRun(uid, loot, won)` (antes `takeRunLoot`) devuelve `RunLootResult` (`found`, `lost`, `zemUsed`) para la pantalla final. Muerte sin Zem: no toca el personaje. Con Zem: borra `equipment.zem` y guarda todo. Sin nada encontrado, el Zem no se gasta. Mira el Zem que lleva el personaje **al morir** (como el arma al continuar).
- **Zem:** `data/consumables.ts` (`ZEM_ID = 'zemstone'`, icono item-pack 15/39 = Item3.cfg:31, también en `item-ground`). Hueco `zem` en `EQUIP_SLOT_IDS` y en las dos clases; en Equipment, segunda fila según `SECOND_ROW_SLOTS`. Cae aparte en `LootSystem.onBossKill` (`LOOT_ZEM_BOSS_CHANCE`); `LOOT_SLOT_WEIGHTS.zem = 0`. Encontrado en partida va directo a la bolsa (sin carta, `GameScene.openLoot`). `sources` prepara la tienda de la Fase 24.
- **Baúl:** `data/warehouse.ts` (50), `systems/WarehouseStore.ts` (clave `hb-survivors.warehouse`, versión 1), `scenes/WarehouseScene.ts`. Mover pasa por `characterStore.takeFromInventory` / `addToInventory`. Botón "Warehouse" en la caja vacía de abajo a la izquierda de Select Character (`SLOTS_BUTTONS.warehouse`), tecla O, R1 del mando. Se puede guardar lo que la clase no usa ("Mage only").
- **Guardado:** personajes versión 7 (solo añade el hueco Zem; nada que migrar).
- **Probar:** `pnpm check warehouse`, `equipmentowned`, `deathnozem` / `deathzem` con `--wait=7000 --eval="(g.debugPickUpLoot(), g.debugKeepLoot(), g.endRun(false))"`. Atajos: `?open=warehouse`, `?debug=zem` (todo jefe suelta Zem), `?gear=inv:plateMail` (al inventario sin atributo) y `?gear=zemstone` (con `?characters=demo`). `?characters=demo|reset` también reinicia el baúl (demo: 4 objetos).

## Abaddon's Blood: resurrección permanente (Fase 21E)
- **No es un objeto:** mejora permanente del dispositivo (`systems/UnlockStore.ts`, clave `hb-survivors.unlocks`, versión 1; ids en `UNLOCK_IDS` de `data/abaddon.ts`). La tienda de la Fase 24 llamará a `unlockStore.unlock('abaddon')`. Atajo `?unlocks=abaddon` / `?unlocks=reset`.
- **En partida:** `systems/AbaddonRevive.ts`. `GameScene` le pregunta `tryRevive(player)` cada frame con el jugador muerto, **antes** del Game Over: si está listo espera `reviveDelayMs` en el suelo (sale la animación de muerte) y llama a `Player.revive()` (vida, invulnerable, pose de pie). La onda usa `Enemy.push()` (el empujón del golpe, sin daño; los jefes casi no se mueven por `knockbackTaken`). Partida guardada: `RunSnapshot.abaddonUsed`.
- **Efecto:** "Abaddon Spirit 10" (sp-client `EFFECT_ABADDON_SPIRIT_10`), `yseffect3.spr` hoja 11 (el visor cuenta las hojas desde 0), clave `fx.abaddon.spirit`. El archivo pesa **5,6 MB** (`ON_DEMAND_SPRITES`): `GameScene` lo pide al empezar solo si está desbloqueado; hasta que llega, `fx.resurrection` (`AbaddonRevive.effectLoaded`). Es un espíritu blanco que sube: a petición del propietario va a 5,5 fps y ×2 (`EffectDef.scale`, nuevo, lo aplica `Effect.play`): sus 11 frames duran 2 s.
- **Icono en la barra:** `ui/ReviveIcon.ts` (clásica y compacta, posiciones en `HUD_REVIVE`). Red Ball = item-pack **hoja 5** frame 124 (Spr 6 − 1, como las piedras; con la hoja 6 sale un peto blanco). Si `item.pack` aún no ha llegado, solo el círculo. Mientras está listo, un círculo aditivo naranja detrás late (`HUD_REVIVE.glow`, coseno sobre `scene.time.now`; radio 19 y 3 s por latido, más fino y lento a petición del propietario).
- **Sonidos:** C21 / C22 son la voz de "buena noticia" del original según el sexo (`m_sPlayerType` 1–3 / 4–6 en `reference/Client.cpp`; suena al fabricar con éxito). El efecto Resurrection (case 194) no suena por sí mismo. Aquí: la voz + `sfx.buff`.
- **Probar:** `pnpm check revive --eval="new Promise((r) => { g.hurtPlayer(99999, true, 'test'); setTimeout(() => r({ hp: g.player.hp, dead: g.player.isDead }), 1500); })"`.
- **`pnpm check` en la nube:** `scripts/check.mjs` lanza `channel: 'chrome'`, que no existe en los contenedores de Claude Code web (solo `/opt/pw-browsers/chromium-1194`). Allí se usa una copia temporal con `executablePath` (y se borra después).

## Varios mapas y Select Map (Fase 22A)
- **Datos:** cada mapa en `data/maps.ts` (orden = el de Select Map y el del desbloqueo), su línea de tiempo en `data/waves.ts` → `TIMELINES`. Un mapa sin línea de tiempo tiene que llevar `comingSoon` (si no, `waves.ts` lanza un error al cargar). `size` es el tamaño del `.amd` en casillas: hace falta para recortar la zona de juego del minimapa antes de cargar el mapa.
- **Zonas medidas (20-oct-2026, mejor ventana):** Traveler Zone (`default.amd`, 170×170): 100×100 al 84% en (40,38), 80×80 al 91% en (48,50). Elvine Garden (`elvuni`, 200×200): 150×150 al 86% en (24,26). Aresden Garden (`areuni`): 100×100 al 96%, 150×150 al 83%. Middleland (524×524): 150×150 al 94% en (36,274), 200×200 al 89% en (42,258). Visor de todos los mapas con su minimapa: http://localhost:8090/maps.html (`survivors/maps.html`).
- **Carga:** `PreloadScene` ya no baja ningún mapa. Al pulsar Play (o Continue) pasa por `MapLoadScene`: `.amd`, minimapa y solo los paquetes de casillas que faltan; lo ya cargado no se repite (`hasMap` en `hb/HBMap.ts`, que borra el buffer de la caché al leerlo). Desde el 22B también baja monstruos y efectos (ver "Carga por mapa y tiempos de carga"). Select Map baja las 4 miniaturas (~700 KB) la primera vez que se abre.
- **Desbloqueo:** `systems/MapUnlockStore.ts`, clave `hb-survivors.maps`, mapas **ganados** del dispositivo. Abierto = el primero, o el anterior ganado, o Level del personaje ≥ `recommendedLevel`. La primera vez que carga, si ya había personajes o partidas guardadas, cuenta la Traveler Zone como ganada (y Bleeding Isle si estaba el logro `winBisle`), para no cerrarle Bleeding Isle a quien ya jugaba; se guarda enseguida para no repetir esa cuenta.
- **Dificultad por mapa:** `difficulty.hp` (vida y XP) y `.damage` de los monstruos normales (`Enemy.spawn`); los jefes nunca. Traveler Zone: 0,5 y 0,4.
- **Jefes de Traveler Zone:** `stoneGolemBoss` (mismo sprite que el Stone Golem, otro id para que sea jefe sin tocar al normal) y `dummy` (`dummy.spr`, 40 hojas estándar de 4 frames, 69 KB, sin sonidos en sp-client: usa los del Clay Golem). `fixedDamage: 1` hace que cada golpe valga eso, sin dados ni mapa. Vida medida con la partida simulada (21-oct-2026): con 700/1800 la Maga los mataba en 5 s / 20 s; con 3500/7000 el Guerrero tardaba 1,5 / 2,5 min. Se dejó 2500/5000.
- **Atajos:** `?map=traveler` (también arranca la partida), `?maps=all|reset`, `?open=mapselect`; checks `mapselect`, `mapsall`, `mapsnew`, `traveler`, `travelerboss`. `?play` sin `?map` sigue en Bleeding Isle.

## Carga por mapa y tiempos de carga (Fase 22B)
- **Antes del menú** (`PreloadScene`): solo interfaz, personajes y sonidos. Nunca un sprite de tipo `SpriteType.Monster`, ni `RUN_SPRITES` (efectos de partida y `item.ground`, en `config/assetManifest.ts`), ni los `runSprites` de cada clase (`data/characters.ts`; el Mago: `fx.effect3`, sus explosiones). Ningún menú usa efectos ni objetos del suelo: si alguno los necesita, habría que sacarlos de esas listas.
- **Al elegir mapa** (`MapLoadScene`): mapa, minimapa, casillas, monstruos de la primera oleada de **ese** mapa (`firstWaveEnemies`), `RUN_SPRITES` y los `runSprites` de la clase elegida (`CHOSEN_CHARACTER_KEY`). Luego `assetStreamer.start(scene, map)` pone en cola solo los monstruos de ese mapa; el menú ya no descarga nada. `hurry` añade a la cola un monstruo que no estaba (jefes de atajos de prueba).
- **Fallo que había (22A):** los monstruos que no salen en ninguna oleada (Gargoyle, Tigerworm, Hellclaw…) no eran ni "primera oleada" ni "en cola", y se bajaban antes del menú.
- **Medir:** `pnpm check loadtime | loadtimetraveler | loadtimemage [--mobile]`. `systems/LoadTimer.ts` deja en `window.__loadTimes` el inicio, el fin de las descargas y el fin de la preparación de cada pantalla de carga; el script suma los MB con `performance.getEntriesByType('resource')` (amplía el búfer, que por defecto guarda 250 y en desarrollo el código ya son cientos). Red simulada por CDP: PC 50 Mbps/20 ms; móvil 9 Mbps/60 ms y CPU ×4.
- **Tiempos (21-oct-2026, Guerrero en Bleeding Isle):** antes 29,7 MB en el Preload (7,2 s PC / 34,4 s móvil) + 6,1 MB del mapa (1,6 / 6,8 s). Después 15,7 MB (4,4 / 20,6 s) + 11,7 MB (2,6 / 12,3 s). Traveler Zone: el mapa pesa 16,5 MB (3,6 / 17,1 s; sus casillas son muchas). Lo lento es **descargar**: preparar es ~20% del total.
- **Personajes (cierre del 22B):** antes del menú solo van las piezas de los dos aspectos por defecto (`UPFRONT_LOOK_SPRITES` en `config/assetManifest.ts`: Guerrero hombre y Maga mujer, piel clara, ropa de salida). Todo lo demás de `player.*` y `gear.*` está en `ON_DEMAND_SPRITES` (calculado), también la espada y el escudo del Guerrero (`msw`/`msh`, 2,2 MB; la daga está ahí): en los menús aparece un instante después la primera vez. `MapLoadScene` espera a lo que lleva puesto el personaje (`runSprites` de `LookLoader`), así que en partida no aparece nada tarde. Un `player.`/`gear.` nuevo es bajo demanda sin tocar nada; si debe estar antes del menú, va en `UPFRONT_LOOK_SPRITES`.
- **Tiempos tras el recorte:** Preload 9,5 MB (PC 3,0 s / móvil 13,7 s); el mapa del Guerrero sube 1,4 MB (su espada): Bleeding Isle 13,1 MB (2,8 / 13,7 s). Total hasta jugar en móvil: 41 s al empezar el bloque → 27 s.

## Elvine Garden (Fase 22D)
- **Monstruos** (elegidos por el propietario el 21-oct-2026): Orc, Orc-Mage, Zombie, Scorpion, Giant Frog, Troll, Werewolf, Giant Tree y Cannibal Plant; sin Slime, Ant, Snake, Skeleton ni golems. Jefes: `hellhoundBoss` (min 4), `stalkerBoss` (min 8) y `cyclopsBoss` (final, min 12, con esbirros Troll / Giant Tree / Orc-Mage). Son copias con otro id, como `stoneGolemBoss`: los normales no cambian en Bleeding Isle. Dificultad ×1,3.
- **Giant Tree:** `giantplant.spr` (918 KB), sonidos M120–M123 (el ataque M123 es el mismo archivo que el del Minotaur), sin animación especial. En el `NPC.cfg` de centuu/HelbreathServer no hay "Giant-Tree": su fila es **Giant-Plant** (ATime 700, alcance 2, MinBrvy 100, 8d6, HR 200). El servidor original (`reference/Server.cpp`, `MobGenerator` caso 7) lo saca en areuni/elvuni con Orc, Orc-Mage, Amphis, Troll, Unicorn (raro) y Cannibal Plant.
- **Columnas del NPC.cfg:** el alcance de ataque es la **penúltima** columna (Troll 1, Cannibal-Plant 2, Cyclops 3); `ATime` es la columna tras los tres `1 10 0` (700, 800, 1200).
- **`?debug=finalboss`** salta el tiempo y saca también los minijefes que quedaban por salir (en todos los mapas: Bleeding Isle sale con Ettin y Demon).
- **Probar:** `check elvine`, `check elvineboss`, `check levelpaceelvine`, `check loadtimeelvine`.

## Middleland (Fase 22E)
- **Monstruos del original:** `middleland.txt` de centuu/HelbreathServer (`Files/GameServers/Middleland/MAPDATA/`) solo tiene `spot-mob-generator` (32 zonas fijas, ningún aleatorio): Ogre, Zombie, Scorpion, Snake (Amphis), Skeleton, Orc, Ant, Mountain Giant, Werewolf, Cyclops, Ettin, Stalker (hasta 40), Demon y Gargoyle (1). Troll, Hellhound y Hellclaw **no** salían allí.
- **Elegidos por el propietario (21-oct-2026):** Orc, Zombie, Scorpion, Skeleton, Snake, Werewolf, Troll, Ogre, Cyclops, Stalker y Ettin; jefes Mountain Giant (min 4), Giant Lizard (min 8), Ettin Berserk (min 12) y **Unicorn** (final, min 15, con esbirros Stalker y Werewolf). ×1,6, 15 minutos.
- **Copias con otro id:** `ettinRegular` (el `ettin` es el jefe de Bleeding Isle), `mountainGiantBoss`, `ettinBerserk`. El Ettin Berserk usa `EnemyDef.glows`: el brillo rojo de los élites sin su vida ni su daño extra. Sobre la piel naranja del Ettin se nota poco.
- **Giant Lizard:** `giantlizard.spr`, sonidos M124–M127, sin animación especial. NPC.cfg: ATime 600, alcance 2, 10d10, HR 400. La wiki le da una embestida (no copiada).
- **Unicorn:** `unicorn.spr`, quieto con 4 frames (`animations.idle`), sonidos M63–M66. NPC.cfg: ATime 700, alcance 4, 10d10, HR 500, magia 8. Lanza 5 rayos de Energy Strike (`fx.energyStrike.fly`, nuestros) cada 2,2 s.
- **Carga solo de la zona de juego:** `HBMap.requiredTileIndices(area, margen)` baja el suelo de la zona de juego y los objetos con el mismo margen que dibuja `MapView` (`MAP_OBJECT_MARGIN_TILES`). Middleland (524×524) pasó de 25,0 a 16,4 MB; Elvine 14,0 y Bleeding Isle 13,1 no cambian.
- **Medido (`check levelpacemiddleland`, 21-oct-2026):** Power 31 al final; jefes 35 / 39 / 53 / 87 s; cada golpe de jefe quita un 13–18% de la vida.
- **Probar:** `check middleland`, `check middlelandboss`, `check levelpacemiddleland`, `check loadtimemiddleland`.

## Sombras del jugador y los monstruos (Fase 22G)
- **Como el original** (`sp-client/src/utils/ShadowManager.ts`): una copia negra del fotograma, `alpha 0,5`, girada −45° y aplastada a la mitad, con el pivote en el centro inferior del fotograma. Los números, compartidos, en `config/gameConfig.ts` (`BODY_SHADOW_*`). No cambia con el suelo, el mapa ni la hora.
- **Jugador:** una sola sombra, sacada del **cuerpo desnudo** (capa `human`, `CharacterSprite.bodyFrame()`); ni ropa ni arma, igual que el original. `Player.syncShadow()` copia el fotograma en cada `update`. Se oculta al morir y vuelve al revivir (Abaddon's Blood). No parpadea con la invulnerabilidad: es un sprite aparte, fuera del contenedor del jugador.
- **Monstruos sin sombra en el original** (`MonsterShadow.NoShadow`): Slime, Ant, Snake, Cat, Dire Boar, Scorpion, Tigerworm y **Unicorn** (este estaba mal hasta el 22G). Un monstruo nuevo: mirar su campo `shadow` en `sp-client/src/constants/Monsters.ts`.
- **Óvalo en el suelo** (25-oct-2026): los monstruos con `hasShadow: false` llevan en su lugar un óvalo negro difuminado (`GROUND_SHADOW` en `config/gameConfig.ts`; textura dibujada una vez en `Enemy.ts`). Sin él, serpientes y hormigas no se distinguían del suelo en el móvil. La sombra del original (copia aplastada del sprite) casi no se ve en monstruos tan planos.
- **Rendimiento:** con 293 monstruos, 137–139 FPS antes y después (ordenador y `--mobile`, 21-oct-2026).

## La ciudad (Fase 23A)
- **Mapa:** recorte de `elvfarm.amd` (250×250) en `data/town.ts`, `playArea` (62,161) de 62×52, elegido por el propietario sobre una captura. Empieza en la fila 161: la 160 tiene 4 casillas de campo (x 115–118) que añaden `maptiles2` (2,5 MB). Lo que más pesa de lo nuevo es `tile388-402` (2,3 MB), el suelo del edificio de la derecha (Tom). Sitios (casillas), medidos el 21-oct-2026 sobre los puntos amarillos de la captura del propietario (recorte del minimapa `elvfarm.jpg` a 924 px, desde el píxel 226,588): Howard (79,193), Shop Keeper (90,178), William (95,176), Tom (111,192, a la derecha del yunque de 110,193 y mirando al SO, para que parezca que lo golpea), teleport (96,202), llegada (93,186). Los NPCs, afinados después con flechas del propietario sobre capturas del juego (1 casilla = 40 px en las capturas de `check`, 1000×750; en las del propietario, con zoom del navegador, ~67 px: medir con el tamaño de los personajes).
- **Carga:** `MapLoadScene` con `{ town: true }` (`startTown(scene)`): mapa, minimapa, casillas, `fx.effect11` (portal), `fx.effect2` (polvo) y la ropa del personaje; nada de monstruos ni `RUN_SPRITES`. La música (`music.elvine`) está en `LATER_SOUNDS` (`config/assetManifest.ts`): `PreloadScene` se la salta y la baja la carga de la ciudad. Medido (21-oct-2026): 13,3 MB, 3,0 s en PC y 14,1 s en móvil; más de la mitad (`maptiles1`, árboles, efectos) la usan también los mapas de caza.
- **Select Map encima:** el teleport hace `scene.pause()` de la ciudad y lanza `MapSelect` con `{ fromTown: true }`. "Back" para Select Map y reanuda la ciudad (sin recargar); "Play" para la ciudad y abre `MapLoad`. El teleport se dispara al entrar en su círculo (`PORTAL.enterRadius`) y no vuelve a abrirse hasta salir de él.
- **Minimapa en una escena con cámara que se mueve:** el contenedor del minimapa lleva `setScrollFactor(0, 0, true)` (en el HUD daba igual). En el móvil, el botón "II" (`ui/TouchPauseButton.ts`, compartido con el HUD) y el minimapa debajo (`MINIMAP.topUnderButtons`).
- **Botón "Town" de la pantalla final:** el original no tiene esa palabra (la hoja `ui.buttons` 1 trae Ok, Continue, Restart, Log Out, Change...). Se usa el marco del "Ok", se tapa su palabra con copias de una tira de su madera sin letras (frames propios `0-blank` / `1-blank` añadidos a la textura) y se escribe "Town" encima (`GAME_OVER.townButton`).
- **Ojo:** un `TileSprite` con un frame de un `.spr` da `The image source is detached` (las hojas son `ImageBitmap` ya cerrados): para repetir un trozo, varias `Image` en fila con `setCrop` en la última.
- **Atajos:** `?open=town` (con el primer personaje guardado), `?town=portal` (aparece sobre el teleport; solo la primera vez). Checks `town`, `townportal`, `loadtimetown`.

### NPCs y hablar (Fase 23B)
- **Datos:** `TOWN_NPCS` en `data/town.ts` (nombre, sprite, casilla, dirección, frase y opciones `equipment` / `warehouse` / `achievements` / `soon`). Aspecto (nombre, "Talk", botón táctil) en `config/town.ts`.
- **Sprites:** `howard`, `shopkpr`, `william`, `tom`: 8 hojas (una por dirección) de 8 frames, solo quietos. Registrados como `SpriteType.Monster` (`npc.*`) para que nunca se bajen antes del menú; los baja la carga de la ciudad (`TOWN_SPRITES` en `MapLoadScene`).
- **Sin Cofre:** hubo un cofre en el suelo junto a Howard con las mismas opciones; el propietario lo quitó (21-oct-2026): con hablar con Howard basta.
- **Obstáculo:** `HBMap.blockTile` marca la casilla del NPC como bloqueada. El mapa está en caché, así que queda bloqueada para siempre (solo lo usa la ciudad).
- **Hablar:** el NPC más cercano a menos de `TOWN_TALK.radiusPx` enseña "Talk". E, el botón A del mando, un clic en el NPC o en "Talk", o el botón táctil (`ui/TalkButton.ts`, en `TOUCH_RESERVED_CORNER`, que mientras se ve no abre el stick). La acción `Action.Talk` sustituye a `OpenEquipment` / `OpenWarehouse` (I/O, X/R1), que se quitaron con los botones de Select Character.
- **Panel:** `NpcDialogScene` (un `MenuOverlayScene`). Equipment, Warehouse y Achievements se abren con `returnTo` = la ciudad y el panel se cierra: al salir se vuelve directo a la ciudad. Al reanudarse, la ciudad ignora "Talk" durante `MENU_INPUT_DELAY_MS` (si no, la A que cierra el panel lo volvía a abrir) y, si cambió el equipo, viste otra vez al personaje (`redressIfChanged`, bajando antes lo que falte con `lookLoader`).
- **Atajos:** `?town=<npc>` (howard, shopKeeper, william, tom) aparece debajo de ese NPC; con `&talk` se abre su panel. Checks `townnpc`, `towntalk`.

### Character y Equipment sin ir a Howard (24-oct-2026)
- En la ciudad: I = Equipment, C / Y del mando (`Action.ToggleStats`, la misma de la partida) = ventana Character **para repartir puntos** (como "Level Set."). Las dos ignoran la tecla durante `MENU_INPUT_DELAY_MS` al volver de un panel (`panelReady`), para que la C que cierra la ventana no la abra otra vez.
- La pausa de la ciudad (`PauseSceneData.town`) añade Character y Equipment; con 7 opciones usa el panel grande (`creditsPanelScale`) y `townPauseItemSpacing`. Se abren con `returnTo` = la ciudad y la pausa se cierra (igual que el panel de Howard).
- Aviso "Level Up" (`ui/LevelUpNotice.ts`, `TOWN_LEVEL_UP` en `config/town.ts`): abajo a la derecha si `unspentPoints > 0`; en táctil, encima de la esquina del botón "Talk". Se mira al crear la ciudad y al reanudarse. Un clic o toque abre Character.
- **Trampa:** no animar la escala del contenedor que va en `ScreenLayer.addFixed` (se quedaba a 0,33); el latido va en un contenedor de dentro. Tampoco animar la transparencia de un `SpriteText`: la sombra negra medio transparente lo emborrona.

## Rareza de las cartas (Fase 21½A)
- Números en `data/cardRarity.ts`; sorteo en `systems/UpgradePool.ts` (`buildLevelUpChoices(equipment, chr, { chest, onlyPassives, allEpic })`). Desde la partida se piden siempre con `GameScene.levelUpChoices(fromChest)`, que lee la Chr de la partida y los atajos.
- Cada carta sortea su rareza aparte. **Desde la 28½A** las pasivas y magias suben siempre **1 rango** (`rank` = actual + 1) y la rareza da `value` (×1 / ×1,5 / ×2, `CARD_RARITY.value`): la carta trae el **valor final** (suma de lo que valen sus cartas). `fitRarity` ya no existe.
  - `Equipment.passiveValues` / `magicValues` guardan esa suma; `passiveBonus(id, value)` sale de ella (no del rango). En las magias, `Equipment.magicExtra(id)` = `1 + (value − rank) × MAGIC_EXTRA_PER_POINT` multiplica el daño (dagas, angelito) o el radio del anillo (aura); el resto de cada rango no cambia.
  - Se guarda en `RunSnapshot.passiveValues` / `magicValues` (opcionales: partidas viejas → valor = rango, todo Common), con `Equipment.restoreCards`. Al leer se limita entre el rango y 2× el rango.
  - Los atajos `?debug=aura|daggers|angels` usan `GameScene.debugMagicRank` (cartas Common). F1 enseña el bono real de cada pasiva ("3/5 +70%").
  - Probar: `check epicstones` (Epic de Stone 1/5 con "+0% → +20%").
- Probabilidades desde la 28½A: pesos 86,5 / 12 / 1,5; la Chr multiplica Rare y Epic ×(1 + 0,02 por punto sobre 10), hasta ×3. Son **pesos**, no porcentajes: con Chr 60 la Epic sale ~2,6% (3 de 113,5) y con Chr 110+ ~3,5%.
- El sonido de la Epic (`sfx.cardEpic`, E23, el mismo "chin" que los tótems) suena desde `GameScene.openLevelUp`, con el `AudioSystem`, no desde la escena de cartas.
- Métricas: las Rare y Epic elegidas se cuentan en la misma tabla de cartas como `rarity:rare` y `rarity:epic` (salen en "Most picked cards" sin tocar el servidor).
- Probar: `pnpm check epic` (todas Epic) y `?debug=epic`. Reparto medido con 3.000 cartas (antes de la 28½A): 81/15/4 normal, 0/81/19 en cofres, 71/23/6 con Chr 60.

## Reroll y Skip (Fase 21½B)
- Números y textos en `data/rerollSkip.ts`. Lo comprado (dado y vino, 0–3 cada uno) vive en `UnlockStore` (`count` / `buy`), clave `hb-survivors.unlocks` **versión 2** (añade `counts`; una versión 1 se lee como 0 de cada). La tienda de la Fase 24 solo tiene que llamar a `unlockStore.buy('dice' | 'wine')`.
- En partida, `GameScene.cardActionsLeft` empieza con lo comprado; se guarda en `RunSnapshot.rerollsLeft` / `skipsLeft`. Al continuar se usa lo guardado, sin pasar de lo comprado ahora.
- La escena de cartas recibe `actionsLeft` (el mismo objeto, que lee de nuevo tras cada uso), `onReroll` (devuelve las 3 cartas nuevas) y `onSkip`. `onChoose(undefined)` = sin carta. Los botones solo salen si se ha comprado alguno; con 0 usos se ven apagados.
- Navegación: flecha abajo pasa de las cartas a los botones (`selectedButton >= 0`) y arriba vuelve. En el móvil, con botones, las cartas se encogen a 0,88 (`CARD_SCALE_WITH_ACTIONS`) para que quepan.
- El dado se dibuja con `ui/DiceIcon.ts`, siempre con la cara del 3 (`DICE_FACE`, propietario). El vino es el Wine del original (hoja 5 de item-pack, frame 117).
- Métricas: `action:reroll` y `action:skip` en la misma tabla de cartas (sin tocar el servidor).
- Teclas falsas en `check --eval`: hay que dejar la tecla pulsada ~80 ms antes de soltarla; si no, `justPressed` no la ve.
- Probar: `?unlocks=dice3,wine3&debug=levelup` (`check rerollskip`); `dice2` = 2, `dice` = 1, `?unlocks=reset` = ninguno.

## Evento Champion (Fase 21½C)
- Números en `data/champion.ts`; `GameScene.rollChampions()` sortea los minutos al empezar la partida con los eventos de **su mapa** (`rollChampionMinutes`) y quita los que caen tras su jefe final (en Traveler Zone, el 7; fusión con la Fase 22).
- `SpawnSystem.setChampions / runDueChampion`: sale como un jefe (`findBossPoint`, nunca se pierde) con un monstruo del tramo **siguiente** de las oleadas de su mapa (`pickChampion`), y nunca tras salir el jefe final. No pasa por `BossSystem`, así que no tiene barra grande arriba ni sale en el minimapa como jefe.
- `Enemy.champion`: escala (`sizeFactor`, también su `radius` y `bodyY`), vida, daño, XP, velocidad y empuje; brilla como los élites (nunca es élite a la vez). Su barra la dibuja `Enemy.drawHealthBar` con la altura máxima de los frames vistos (para que no salte con la animación).
- Al morir: `GameScene.dropXp` reparte su XP en 10 gemas en corro; `LootSystem.onChampionKill` tira con `CHAMPION.lootTiers` (solo `next` o `jump`) y 10% de Zem.
- Guardado: `RunSnapshot.champions` (minutos) y `championsOut` (los ya salidos y muertos; uno vivo al guardar vuelve tras la calma de Continue).
- Métricas: en la lista de jefes como "Champion <monstruo>" (aparición y muerte), sin tocar el servidor.
- Probar: `?debug=god,champion` (sale a los 3 s; `check champion --wait=6000`). Sale fuera de la pantalla: para verlo en la captura, `--eval` que lo acerque (`g.champion.x = g.player.x + 90`).

## Oro, botín especial y muerte a medias (Fase 24A)
- **Oro:** `data/gold.ts` (monedas, montones, multiplicador por mapa, `formatGold`) y `systems/GoldStore.ts` (clave `hb-survivors.gold`, de todo el dispositivo; `?gold=N` lo fija). Las monedas son pickups (`coin`, `goldPile` en `data/pickups.ts`, dibujo "Gold" del original, item-ground 5/0) con `dropChance: 0`: las tira `GameScene.onEnemyKilled` / `dropGoldPiles`, no `PickupSystem.onKill`. El oro de la partida (`GameScene.runGold`) va en la partida guardada (`RunSnapshot.gold`) y se suma a `goldStore` en `endRun`, ganes o mueras.
- **Atributos de armadura:** `ItemAttribute` = de arma (`WeaponAttribute`) o de armadura (`ArmorAttribute`), con `kind` en `ATTRIBUTES`. Solo los de arma van delante del nombre (`ownedItemName`) y tiñen el dibujo (`pictureAdd` opcional). `canHaveAttribute` decide dónde puede ir cada uno (MP Recovery solo en la ropa de la Maga). Se aplican en `Equipment.wear(piece, attribute)` → `recompute()` (Defense Ratio y Magic Resistance a los totales, `hpRecovery` multiplica la curación en `applyStats`). Al continuar una partida, una pieza conserva su atributo solo si el personaje la sigue llevando.
- **Todo lo que cae lleva atributo:** `rollAttribute` elige por `weight` entre los que el objeto admite. `?attr=hpRecovery` hace que solo caigan objetos que lo admiten (`check lootarmor`).
- **Muerte:** `characterStore.finishRun` pierde `itemsLostOnDeath(n)` = mitad redondeando arriba, al azar; `RunLootResult.lost` es la lista. La pantalla final atenúa los perdidos comparando id + atributo (tras un Continue, `found` y `bag` son copias distintas del mismo objeto).

## Tienda (Fase 24B)
- **Ventana "Item for Sale" del original:** panel `gamedialog86.spr` **hoja 1, frame 2** (258x339, pergamino con bolitas de plata; el frame 3 es su barra lateral de 23 px, no usada) y letrero `dialogtext.spr` **hoja 0, frame 11** ("Item for Sale", 258x31). En esa hoja 0 están todos los letreros de 258–361 px: 5 = "Item Upgrade" (para el herrero, 24C), 10 = "Repair Item", 21 = "Items In Storage". `gamedialog.spr`, `gamedialog1/2/86` comparten las hojas 0–5 y 7–10 (solo cambia la 6).
- **Panel del herrero:** `gamedialog86.spr` hoja 2, frame 0 (270x381, con un martillo de fondo).
- **Botones de `dialogtext.spr` hoja 1** (74x20, iluminado = frame + 1): Ok 0, No 2, Quest 4, Continue 6, Log Out 8, Level Set. 10, I Agree 12, Disagree 14, Cancel 16, Yes 18, Change 20, Connect 22, Create 24, Clear 26, Reset 28, **Purchase 30**, Accept 32, luego Reject 34, Restart 36, **Sell 38**, Decline 40, **Repair 42**, Party 44, **Upgrade 46** (de los cuatro últimos, comprobar en el visor antes de usarlos).
- **Código:** lista y precios en `data/shop.ts`, medidas en `config/shop.ts` (en píxeles del panel, × `SHOP_PANEL.scale`), ventana `scenes/ShopScene.ts`. Abaddon's Blood y el dado/vino a 3/3 salen "Sold out" en gris claro; el Zem va al inventario del personaje de la ciudad. Atajos: `?open=town&town=shopKeeper&shop&gold=N`, `check shop` / `check shopsold`.
- **Ojo con `setFrame` en los botones de `dialogtext`:** sus frames traen el pivote arriba a la izquierda, y `setFrame(f)` (al iluminar) vuelve a poner el origen en ese pivote aunque antes se hiciera `setOrigin(0.5)`. Para que sigan centrados: `setFrame(f, true, false)`.
- **Ropa de serie en la ciudad:** camisa, pantalón, botas... salen de `appearance` de la clase (`data/characters.ts`), no de objetos equipados. Al volver de Equipment, `TownScene.redressIfChanged` pone primero esa ropa y encima lo equipado (antes vaciaba los huecos y el personaje quedaba en ropa interior).

## Herrero y Stone of Xelima (Fase 24C)
- **Ventana:** `scenes/SmithScene.ts`, medidas en `config/smith.ts`, precios y lista en `data/smith.ts`. Panel `gamedialog86.spr` hoja 2 frame 0 (270x381, martillo de fondo). Letreros de `dialogtext.spr` hoja 0: 11 "Item for Sale" (258 px) y 9 "Exchange Item" (270 px). Hoja 0 completa: 0 Character Info (panel), 1 Skills, 2 Level up Setting, 3 Party Menu, 4 Quest, 5 Item Upgrade, 6 System Menu, 7 Magic List, 8 Tinkering, 9 Exchange Item, 10 Repair Item, 11 Item for Sale, 12 User Agreement, 13 Change Password, 14 Spells, 15–17 Commander/Constructor/Soldier Menu, 18 Cityhall Menu, 19 Guild Menu, 20 Notice, 21 Items In Storage, 22 barra vacía de 361 px.
- **Botones de la hoja 1 comprobados:** Sell 38, Upgrade 46 (iluminado +1), como decía la lista de la Tienda.
- **Colores:** el panel del martillo es gris; el gris claro de "Sold out" de la tienda no se lee encima. Por eso `SMITH_COLORS` (rojo oscuro para lo que no puedes ponerte, gris oscuro para la pestaña apagada).
- **Lista con scroll:** filas fijas (`visibleRows`) que se rellenan según `scroll`; rueda, flechas/mando, ▲/▼ y arrastrar el dedo. Los títulos de sección cuentan como filas.
- **Stone of Xelima como objeto:** en `data/consumables.ts`, sin hueco (`slot` opcional en `ConsumableDef` e `ItemInfo`). Al cogerla va a la bolsa sin carta (`GameScene.openLoot`). Tirada propia en `LootSystem.onKill` (`LOOT_XELIMA_CHANCE`); `?debug=xelima` la sube al 5%. `?gear=inv:xelimaStone` la mete en el inventario aunque no sea de la clase. Mismo dibujo que la carta "Stone of Xelima" (item-pack 5/128), que es otra cosa.
- **Atajos:** `?open=town&town=tom&smith=buy|sell&gold=N`; checks `smith`, `smithsell`, `xelima`. Para probar a mano por `--eval`: `game.scene.getScene('Smith')` y sus métodos `choose(i)`, `act()`, `setTab('sell')`.
- **Panel de hablar:** con 3 opciones + Back no cabía; `NPC_DIALOG_LIST` (config/town.ts) junta un poco las opciones en todos los NPCs.

## Mejorar armas en el herrero (Fase 24D)
- **Dónde vive el "+":** en el objeto (`OwnedItem.upgrade`, 1–3, sin campo = +0) para inventario, baúl y botín; en `SavedCharacter.upgrades[slot]` para lo puesto (como `attributes`). `CHARACTERS_VERSION` 8. Reglas y daño en `data/upgrades.ts`; precios en `data/smith.ts` (`SMITH_UPGRADE_PRICE_FACTORS`, `smithUpgradePrice`, `smithUpgradeGoldSpent`).
- **Comparar objetos:** usa siempre `sameOwnedItem` (id + atributo + "+"); comparar solo id y atributo mezcla una Long Sword +2 con una normal.
- **Equipo de salida mejorado:** `isPlainFreeItem` (CharacterStore): solo la daga o varita **sin** atributo ni "+" desaparece al quitársela; mejorada va al inventario. `equip()` recibe el objeto entero (`OwnedItem`).
- **Daño:** `Equipment.weaponUpgrade` + `weaponDamageBonus` = (1 + atributo) × (1 + 0,1 × "+") − 1, que va a `CharacterStats.attributeBonus` (vale también para los hechizos de la Maga con varita). `itemDamageBonus` / `ownedItemPower` lo muestran en las cartas.
- **Ventana:** tercera pestaña de `SmithScene` (`dialogtext.spr` hoja 0 frame 5 "Item Upgrade"; botón Upgrade = hoja 1 frame 46). La subraya de la pestaña mide lo que su palabra. Sonido `sfx.itemEquip` (E28).
- **Tecla I en la ciudad:** `Action.OpenInventory` abre Equipment con `openOverlay` (la ciudad queda en pausa debajo).
- **Atajos:** `?xelima=N` (cada personaje con N piedras exactas), `?upgrade=N` (partida sin personaje con el arma a +N), `?gear=up2:longSword`, `smith=upgrade`, `?open=town&class=warrior` (la ciudad con el primer Guerrero). Checks `smithupgrade` y `upgradedmg` (`--eval="g.stats.attributeBonus"` → 0.3).


## Revisión de la dificultad: `pnpm balance` (22-oct-2026)
- **Qué mide:** `scripts/balance.mjs` lanza muchas partidas simuladas (`?debug=sim`) a la vez en Chrome sin ventana (4 por defecto, ~20 min la tabla entera) y guarda todo en `.check/<out>.json`. Casos `clase:mapa:Level:+N[:build][:kit]`; lo que vaya tras `@` se añade a la dirección. `scripts/progression.mjs` usa ese JSON para la carrera de un jugador en horas (EXP → Level, oro, mapas abiertos).
- **Vida "de mentira":** el bot sigue invencible, pero `SimRun` lleva una vida propia con la armadura, la curación, las pociones y los 600 ms de invulnerabilidad reales (`tick` / `onHurt` / `onHeal`). Da el minuto de la primera muerte, cuántas veces habría muerto (se "levanta" con la vida llena) y el daño y la vida de cada minuto. Desde entonces los golpes en la simulación también cargan el Critical Strike del Guerrero (antes no: `hurtPlayer` salía antes).
- **Perfil `?level=N`** (`config/simProfile.ts`): partida como un personaje de ese Level, con los puntos repartidos (Guerrero str 2 · vit 1 · dex 1; Maga mag 2 · int 1 · vit 1; o `&build=`) y lo mejor que ya puede ponerse en cada hueco (`&kit=start` = equipo de salida). Manda sobre Gorn y Kaila; el "+" del arma sigue siendo `?upgrade=N`.
- **El bot** corre en círculos y va a por los jefes. Se probó uno que se apartaba de los monstruos y jugaba **peor** (se quedaba atrapado entre grupos): se quitó. Con el Guerrero muere en tiempos parecidos a los jugadores reales; con la Maga, antes. Sirve para comparar casos entre sí.
- **Hallazgos** (informe publicado: https://claude.ai/artifact/Xk8DCaCytHNP1yASM2sFBV): muro hacia el minuto 7–8 de cada mapa (los monstruos nuevos tienen 5–17 veces más vida y el daño del personaje solo crece 2,5–3 veces en la partida, así que se forma una "bola"); jefes muy fáciles; Level y +3 casi no ayudan a aguantar; la Maga muere 2–3 veces antes que el Guerrero; ~550 de oro por hora.
- **Cambios aprobados (B, C, D, E):** `HP_PER_CHARACTER_LEVEL` (data/characterLevel.ts, `CharacterStats.characterLevel`), Maga `hpMultiplier` 1,15 y ropa con menos Mag (data/armor.ts), `BOSS_HP_MULTIPLIER` (data/enemies.ts, en `Enemy.maxHp`), monedas al 4% y mejoras a 0,5× / 1,5× / 3×.
- **G (aplicada):** vida de los monstruos normales comprimida con `MONSTER_HP` / `monsterBaseHp` (data/enemies.ts; los jefes van por ahí también, con `BOSS_HP_MULTIPLIER`) y `DAMAGE_PER_POWER` (+4% de daño de todo tipo por Power, `CharacterStats.damageMultiplier`). Solo la vida apenas cambiaba nada; el daño por Power es lo que deshace la bola. La Maga sigue matando de un golpe la mitad que el Guerrero: le falta daño por golpe contra monstruos pequeños. `node scripts/sim-summary.cjs .check/<archivo>.json` resume un `.check/*.json` (muerte, mueren de un golpe, vivos a la vez).
- **`?bot=stand`** (caso `...@bot=stand`): el bot se queda quieto pegando. Medido el 22-oct-2026 (Guerrero): en Traveler Zone con buen equipo gana igual que corriendo (vida mínima 79–89%); en Bleeding Isle muere el doble de pronto (4:33 frente a 9:13 a Level 20), aunque mata más y la bola es la mitad. Recoge **menos** pociones y casi nada de oro (las monedas solo se cogen al pisarlas).
- **Fallo encontrado con la simulación (arreglado):** `HBAsset.partialAnimation` (ataque en dos trozos del Fire Wyvern) creaba la animación aunque su hoja aún no estuviera lista; salía **vacía** y se quedaba así, y al reproducirla Phaser lanzaba "reading 'frame'" y la partida se congelaba. Solo con carga lenta (4 partidas a la vez; en un móvil, posible). Ahora no se crea hasta que existe la textura, se rehace si quedó vacía y `playDirectional` no reproduce una animación vacía. `balance.mjs` para la partida al primer error de página y guarda la pila.
- **Métricas reales:** la base D1 `helbreath-survivors-metrics` se puede leer con el conector de Cloudflare (solo lectura). A 22-oct-2026 tenía 30 partidas, todas de Bleeding Isle, ninguna ganada.

## Dificultad de Traveler Zone (Fase 28½B, 25-oct-2026)
- **Daño por oleada:** `WaveDef.damage` (data/waves.ts, 1 si falta) multiplica el daño de los monstruos normales que salen en esa oleada (también encerronas y los que llama un jefe), encima de `MAPS_DATA.x.difficulty.damage`. `SpawnSystem.update` llama `EnemySystem.setWaveDamage` y `EnemySystem` rehace `spawnDifficulty` solo al cambiar. Los ya vivos conservan el suyo. Los jefes siguen con sus números (`NO_DIFFICULTY`).
- **Por qué:** la simulación de un personaje nuevo moría en el **minuto 1–2** (el daño recibido era máximo al principio y casi nulo en los minutos 5–7). Ahora Traveler Zone va 0,5 → 0,45 → 0,6 → 0,85 → 1,3 → 2,5 → 3,1 por minuto, con tres encerronas más (hormigas en el 5, serpientes en el 6, conejos en el 6,5). La vida de los monstruos **no** cambia (propietario: "arrasar oleadas"; siguen ~85–93% muertos de un golpe).
- **Jefes:** Stone Golem `maxHp` 3500 y `damageScale` 0,75 (pegaba 7, ahora ~15); Dummy sin `fixedDamage` (pega ~20–25 cada 2,6 s), 6500 de vida, llama a 12 bichos cada 5 s (máx. 60, también serpientes).
- **Medido** (`.check/b28-before2.json` frente a `b28-after.json` + `b28-v7.json`, equipo de salida): primera muerte mediana 1:28–2:48 → **4:15–4:35** (casi siempre con el Golem); gana con Level 1: Guerrero 50% → 33%, Maga 67% → 17%; Level 4–7: 46–54%. Bleeding Isle (Level 10) y Elvine Garden (Level 25) con las magias siguen **sin** ganarse en la simulación: no se tocaron.
- **+20% de vida a todos** (`MONSTER_HP_BONUS` en data/enemies.ts, jefes incluidos, sin tocar la EXP): el propietario ganó Traveler Zone y Bleeding Isle a la primera con el daño nuevo. Medido (`.check/b28-hp120.json`): Level 1 en Traveler Zone gana 1/16; los muertos de un golpe bajan de ~85% a 63% (Guerrero) y 76% (Maga), en Bleeding Isle (Level 10) de 53% a 39%.
- **Ojo al medir:** el bot va **a por** los jefes sin esquivar, así que el Golem es casi cara o cruz para él y el resultado de 12 partidas cambia mucho de una tanda a otra (Guerrero Level 1: 1/12 y 7/12 con casi lo mismo). Usar ≥ 12 repeticiones y juntar tandas. Con `kit=start`: tras 1–2 partidas el jugador tiene 100–300 de oro y cada pieza cuesta ≥ 200 (`SMITH_PRICE.min`), así que el "mejor equipo" por defecto de `balance` exagera la 2.ª y 3.ª partida. Las partidas reales (métricas, hasta 25-oct) ganaban 13 de 14: el humano juega mejor que el bot.

## Nitidez: lienzo a la resolución real (RENDER_SCALE)
- El juego piensa en 800x600, pero el lienzo mide 800x600 × `RENDER_SCALE` (1-3, `config/device.ts`) y `RenderScalePlugin` (`ui/renderScale.ts`) pone cada cámara principal con ese zoom al arrancar la escena (evento READY, antes de `create()`). El texto usa `resolution = RENDER_SCALE`, así se pinta 1:1. Antes el lienzo era 800x600 estirado por el navegador y el texto (a resolución ×3 con `pixelArt`) se encogía sin suavizar: letras rotas y borrosas.
- `pointer.x/y/downY` y `scale.transformX/Y` están en píxeles del lienzo: pasar por `toGame()`. Las coordenadas de mundo (`positionToCamera`, `worldX`) ya están bien.
- Con zoom, Phaser escala lo que tiene `scrollFactor 0` alrededor del centro de la cámara y se descoloca. Lo fijo en pantalla va dentro de una `ScreenLayer` (`addFixed`), que compensa el desplazamiento cada frame. No usar `setScrollFactor(0)` suelto.
- Viewports de cámara en píxeles de juego: `setGameViewport()`. `this.scale.width/height` ya no es 800x600: usar `GAME_WIDTH/HEIGHT`.
- Probar otro factor: `?scale=1|2|3`. El `check --mobile` simula densidad 1 (sale ×1); para ver el zoom en móvil añadir `scale=2` a la situación.

## Maná del Spell 2 (Fase 26A)
- **Dónde vive:** el maná de la partida está en `ActiveSpellSystem` (solo la Maga lo gasta; el Spell 1 es gratis). El máximo sigue en `CharacterStats.maxMana` (2·Mag + 2·Power + Int/2); el relleno por segundo, en `CharacterStats.manaRegenPerSecond` (`MANA_REGEN_BASE` + `MANA_REGEN_PER_MAG`·Mag, `data/stats.ts`) × (1 + `Equipment.mpRecovery`). Si el máximo sube (Power, cartas de Mag), la diferencia se suma al maná actual.
- **Coste:** `originalMana` de cada hechizo en `data/activeSpells.ts` (el de la wiki) × `ACTIVE_SPELL_MANA_SHARE` (0,5) × (1 − Mana Save de la varita): `activeSpellManaCost`. Al portar un hechizo nuevo basta con poner su maná del original.
- **Ritmo:** con Mag 14 sale como con la antigua recarga (Energy Strike cada ~12 s); a Mag 40, ~7 s (antes 8,4). `pnpm balance mage:bisle:10:0 mage:elvineGarden:25:0` dio el mismo Power, jefe final y EXP que antes.
- **HUD:** la barra azul usa `activeSpell.mana`; el Guerrero la tiene siempre llena. El número del botón rojo es el maná que falta (`manaMissing`); el panel de stats enseña el coste.
- **Blue Potion:** `bluePotion` en `data/pickups.ts` (item-ground 5/3), `onlyWithMana`: `PickupSystem` solo la tira si el personaje tiene Spell 2. Rellena `BLUE_POTION_MANA_SHARE` (30%) y cuenta en `potionsDrunk`.
- **Guardado:** `RunSnapshot.mana` (sustituye a `spellCooldownMs`; las partidas viejas empiezan con la barra llena).
- **Probar:** `?debug=nomana` (barra a 0), `check mana` / `nomana`; `?debug=crits` o la tecla H = sin gastar maná; `?play=mage&debug=pickups` deja una Blue Potion.

## Apuntar el Spell 2 en el móvil (Fase 26B)
- Solo la Maga: `GameScene.launchHud` pasa `spellDrag` al HUD y `ui/CritButton.ts` se vuelve un stick. Se lanza **al soltar** (con el Guerrero, al tocar). Si el dedo se mueve menos de `TOUCH_SPELL_DRAG.deadzone` (config/touch.ts), cuenta como toque: apuntado automático.
- El dedo se sigue con los eventos **táctiles del navegador** (`touchmove` / `touchend` en `window`, como `TouchJoystick`): Phaser deja de ver un dedo en cuanto sale del dibujo del juego, y al arrastrar hacia abajo desde la esquina pasa enseguida (primera versión: no giraba hacia abajo). El ratón (`?ui=compact` en PC), con los de Phaser. Si el HUD se pausa a mitad (cartas, pausa), se suelta **sin lanzar**: el "levantar el dedo" podría no llegar nunca.
- El centro **sigue al dedo** más allá de `TOUCH_SPELL_DRAG.followRadius` (como el stick de apuntar): girar solo pide mover el dedo un poco al otro lado. Fuera de la zona muerta una vez, se queda apuntado aunque el dedo vuelva al centro. Mientras se arrastra, `GameScene` enseña la **misma flecha** del apuntado manual (`AimArrow`, con `spellDragAim`).
- Con dirección, `ActiveSpellSystem.cast(level, { x, y, direction })` cae en `aimedPoint` (= `range × stickShare`) haya o no monstruos, por encima del stick de apuntar y del automático. El anillo (`ui/SpellAimMarker.ts`, `SPELL_AIM_MARKER` en data/targeting.ts) mide `activeSpellAreaRadius` y va en el suelo (`DEPTH_GROUND_SHADOWS + 1`).
- Probar: `pnpm check spelldrag --mobile` (dedo de mentira arrastrando a la derecha; `--eval="g.debugReleaseSpellDrag()"` lo suelta y lanza). El check no hace toques de verdad: para eso, Playwright con `hasTouch` y CDP `Input.dispatchTouchEvent` sobre `hud.critButton.container` (posición × ancho del lienzo / 800).

## Hechizos nuevos: Lightning Arrow, Chill Wind y Lightning Bolt (Fase 26C)
- **Escalera de Int:** en el comentario de cabecera de `data/spells.ts` (Spell 1) y `data/activeSpells.ts` (Spell 2). Ya no es la Int del original. No subir nunca un requisito que ya existía: dejaría a jugadores con un hechizo puesto que ya no pueden llevar.
- **Lightning Arrow** no está en `sp-client`; sale de `reference/Client.cpp` (efecto 137): proyectil `effect2.spr` hoja 0 (8 direcciones × 4 frames), chispas `effect2` hoja 1 frames 0–4 (`SpellDef.trail`, las pinta `WeaponSystem`), explota como el Energy Bolt. Desde el 23-oct-2026 (propietario) pega también un poco a los de al lado (área pequeña, 36 px, con menos daño). Si algún hechizo tiene `areaDamage` 0, `CombatSystem.hitArea` no toca a los vecinos (antes les daba un 0).
- **Hechizos que caen del cielo:** `aim: 'sky'` (sin proyectil). `SpellWeapon` llama a `context.skyStrike`; `WeaponSystem.skyStrike` dibuja las explosiones (`SpellBurst.fallPx/fallMs`: el efecto cae mientras se anima, `Effect.play`) y aplica el daño tras `skyImpactMs` (`PendingSkyHit`). Con apuntado manual cae en el cursor o a `stickAreaDistance` del alcance, como Energy Strike.
- **Chill Wind:** `effect4.spr` hoja 1, frames 0–14 a 33 fps, 4 gotas que caen 200 px a los desplazamientos del original. `effect4` (~0,38 MB) solo baja en partidas de Mago (`runSprites`). Sonido E45.
- **Lightning Bolt:** rayo dibujado a mano (`entities/LightningArc.ts`, aspecto en `LIGHTNING_LOOK`), como sp-client: línea blanca de 3 px con dos brillos azules, 600 px hacia arriba, redibujada cada 20 ms durante 120 ms. Sonido E40.
- **Atajo:** `?characters=demo&open=equipment&class=mage&slot=spell1` abre Equipment de Kaila con la lista del Spell 1.
- **Medido (22-oct-2026, horda, Power 1–2, muertes por segundo):** Energy Bolt 0,9 · Lightning Arrow 1,3–1,6 (con su área pequeña) · Lightning Bolt 1,0 (fuerte contra uno, poco alcance) · Fire Strike 1,6 · Chill Wind 1,9 · Triple Energy Bolt 2,3.

## Ice Strike, Mass Ice Strike y ralentizar (Fase 26D)
- **Tipo nuevo de activo `'iceShards'`** (`data/activeSpells.ts`), lo dibuja y golpea `systems/IceShardRain.ts` (con pool), que llama `WeaponSystem.castIceShards`. Como sp-client (`IceStrike.ts`, `MassIceStrike.ts`, `IceStrikeShard.ts`, `CastManager.ts` L609–645): **todos los trozos caen a la vez**, cada uno desde 200–400 px y en 400–600 ms; Ice Strike 15 grandes (uno en el centro) + 6 pequeños, Mass Ice Strike 24 + 8. Al llegar, la rotura y E46 (`sfx.freeze`, el mismo del tótem Freeze; los límites de audio dejan sonar unos pocos).
- **Sprites:** `effect4.spr` hoja 2 (pequeños 0–23, grandes 24–31) y hoja 3 entera (rotura, 15 fps). En el original la animación del trozo dura exactamente su caída: `EffectDef.stretchToFall` hace `sprite.play({ key, duration: fallMs })`. `effect4` ya bajaba en partidas de Maga (Chill Wind).
- **Daño:** golpes de área en momentos fijos (`hitDelaysMs`): Ice Strike 1 × 20 en 80 px, Mass Ice Strike 2 × 18 en 100 px, × el multiplicador de Power. Medido (23-oct-2026, horda, Power 1, bajas por lanzamiento): Energy Strike 6–10 · Ice Strike 8–10 · Mass Fire Strike 10–16 · Mass Ice Strike 8–13 · Meteor 10–13. Maná 29 y 57.
- **Ralentizar:** `Enemy.slow(factor, ms)`, separado del `freeze` del tótem. El monstruo vive "a cámara lenta": `step` pasa `deltaMs × factor` a `chase` (anda, ataca y se aparta más despacio, sin descuadrar golpe y animación) y `anims.timeScale = factor`. Tinte `ICE_SLOW.tint` (0x88aaff) por `applyStatusTint` (prioridad: destello blanco > Freeze > hielo); las élites pierden el brillo rojo mientras dura, para que se vea el azul. Normales ×0,5 durante 3 s; jefes, minijefes y Champions ×0,75 durante 1,5 s (`ICE_SLOW`). Otro golpe renueva el tiempo y se queda el frenazo más fuerte. `CombatSystem.hitArea` acepta ahora `onHit` por cada monstruo tocado.
- **Ojo al medirlo:** a Power 1 el hielo mata a casi todo lo que toca, así que no queda nadie ralentizado. Para verlo: `--eval="(g.activeSpell.def.damage=0.01, g.launchCritStrike())"`.
- **Check:** `icestrike` / `massicestrike` (Maga con horda; `--eval="g.launchCritStrike()"`).

## Hechizos en línea y Libro Azul (Fase 26E)
- **Hechizos en línea** (`kind: 'line'` en `data/activeSpells.ts`, `systems/LineSpell.ts`): Bloody Shock Wave, Earth Shock Wave y Blizzard. Un punto invisible va de los pies de la Maga al sitio elegido; cada `stepEveryMs` dibuja lo suyo (`LINE_SPELL_LOOKS`) y golpea lo que hay en `pathRadius` (cada monstruo, `pathHits` veces como mucho por lanzamiento: `hitCount`). Al llegar, `targetHitDelaysMs` golpes de área en el punto. Earth Shock Wave usa `speed` (1.500 px/s) en vez de `travelMs` y se queda 400 ms en el punto. El golpe del camino del Blizzard espera 300 ms a que caigan los trozos (`pathHitDelayMs`).
- **Gráficos** (sp-client): Blizzard = `effect7.spr` hojas 1–3 (trozos, al azar) y 6 (rotura), sonidos E46/E47; se descarga solo con Blizzard puesto (`activeSpellSprite`, como el Meteor). Earth Shock Wave = `effect11` hojas 2 (chorro) y 3 (polvo), E1. Bloody Shock Wave = `effect4` hoja 0 (anillos rojos), ±30 px de desorden, sale 40 px por encima de los pies, E1. Ninguno tiene brillo aditivo en sp-client.
- **Los trozos del Blizzard** caen con `IceShardRain.dropShard` (con su propia rotura y sonido); el ralentizar es `chillEnemy` (`ICE_SLOW`).
- **Libro Azul:** `item-pack`/`item-ground` hoja 5 **frame 91** es un libro **azul** (`MANUAL_BOOK_ICON`); el 92, "Manual" en sp-client, es **rojo granate** (`SPELL_ITEM_ICON`, el resto de hechizos). Visto en partida el 23-oct-2026.
- **Aprender:** los hechizos de `MANUAL_SPELL_IDS` no salen de la tirada normal (`isLootDrop`); su libro tiene tirada propia (`LOOT_MANUAL_CHANCE`, uno por partida como mucho, `LootOwner.manuals`). Al cogerlo, `GameScene.onLootPickup` lo aprende en el acto (`characterStore.learnSpell`, guardado ya: morir no lo quita) y nunca va a la bolsa. `SavedCharacter.learnedSpells` (versión 10 del guardado); `isFreeItem(classId, id, learned)` lo vuelve libre. La partida simulada (`simBestEquipment`) nunca los elige.
- **Probar:** `check bloodyshock` / `earthshock` / `blizzard` (con `--eval="g.launchCritStrike()"`), `check bluebook` (`--eval="g.debugPickUpLoot()"`), `check equipmentlearned`; `?gear=learn:bloodyShockWave` con `?characters=demo`.
- **Ojo en el check:** `await import('/src/systems/CharacterStore.ts')` desde `--eval` da **otra copia** del módulo (otro `characterStore`, vacío de cambios): leer `localStorage` o la escena (`game.scene.getScene('Equipment').character`).

- **Revisión de la Fase 26 (23-oct-2026):**
  - **Guardados de una versión más nueva** (una copia antigua del juego cacheada en el móvil abre datos de la nueva): `CharacterStore` y `SaveStore` los dejan en **solo lectura** (`readOnly`). Se juega con Gorn y Kaila de Level 1 en memoria, pero nunca se escribe encima ni se borran sus partidas. Probado con un guardado de versión 99. `?characters=` (desarrollo) sí escribe.
  - **El hielo frena solo el paso del monstruo** (`Enemy.chase(..., pace)`): su andar, cargas y tiempos van más lentos, pero el empuje entre monstruos y el retroceso van a velocidad normal, para que no se amontonen.
  - La **Blue Potion** no cuenta como poción (retos "sin pociones" ni métricas).

## Monstruos que se mueven distinto (Fase 27)
- **Forma de moverse por monstruo:** `movement` en `data/enemies.ts` (`'direct'` por defecto, `'flank'`, `'wander'`); los números, en `data/movement.ts` (`FLANK`, `WANDER`). Los jefes (`def.boss`) van siempre directos aunque tengan `movement`. Se lee una vez en el constructor de `Enemy` (`this.movement`).
- **Dónde actúa:** solo en la rama "andar hacia el jugador" de `Enemy.chase`, vía `pickHeading` (deja `headX/headY/headPace`). Atacar, huir (golpear y correr), la estampida y el hielo no cambian.
- **Rodear (`flank`):** al aparecer elige lado (el mismo `sideBias` de rodear paredes) y ángulo 35–60°; el ángulo baja a 0 entre `farPx` y `nearPx`, así siempre acaba llegando. Coste: un `cos`/`sin` por monstruo y frame.
- **Deambular (`wander`):** tramos al azar dentro de ±75° de la dirección al jugador (para que no se pierdan) o parado (15%). Se "fija" (`noticed`) al estar a `sightPx`, al recibir un golpe (`takeDamage`) o en una estampida (`charge`), y ya no vuelve a deambular. Los que se alejan demasiado los recoloca `SpawnSystem` como siempre.
- **Separación:** `ENEMY_SEPARATION_SPACING` (1,25) agranda la distancia mínima entre cuerpos; empuje más fuerte (`PER_PX` 14, `MAX` 120). El radio de búsqueda en la rejilla crece igual.
- **Rendimiento:** 60 FPS en PC y `--mobile` con ~150 monstruos a los 5 min en Traveler Zone (23-oct-2026).
- **Embestir (`charge`, 27B):** Bunny, Ant, Dire Boar y Minotaur (el Giant Lizard no: es jefe). Andan directos y, si están a `CHARGE.minPx`–`maxPx` y su espera (`nextChargeMs`) acabó, se paran `windupMs` (estado Idle) con un "!" y apuntan a **donde estaba el jugador al salir el "!"**. Luego reutilizan `Enemy.charge()` (el de la estampida) con `speedFactor` y recorren esa distancia + `overshootPx`: si te apartas, pasan de largo. Si llegan a tocarte, pegan y siguen corriendo (igual que en la estampida). La primera carga sale a un momento al azar para que un grupo no cargue a la vez. Congelar (tótem) cancela la preparación. Orden en `chase`: atacar > huir > cargar > preparar carga > alcance > andar.
- **El "!":** `systems/ChargeWarnings.ts`, textos con pool (máx. `CHARGE_WARNING.maxShown`), creados desde `EnemySystem.update` cuando `enemy.isWindingUp`; siguen la cabeza con `Enemy.headTopY()` (la misma altura que la barra del Champion) y se sueltan al cargar, morir o congelarse. Se ve aunque el monstruo esté detrás de un árbol. `?debug=charge` / `check charge` (corro de los que ya estén descargados en el mapa; `g.enemies.chargeWarningsShown` cuenta los "!"). 60 FPS en `--mobile` con ~310 monstruos en Traveler Zone embistiendo (23-oct-2026).
- **Guardar distancia (`keepAway`, 27C):** Mage-Orc, Lich y Dark Elf. Andan directos hasta su alcance (la caja de `attackRange` casillas por eje, como siempre). Mientras esperan su siguiente ataque (`cooldownMs`), en `Enemy.keepAwayStep`: si el jugador está a menos de `KEEP_AWAY.tooCloseShare` de su alcance, retroceden a `backPace` (más lentos que el jugador: el Guerrero los alcanza si los persigue); si no, se mueven de lado (`strafePace`) y cambian de lado de vez en cuando (reutiliza `legMs`, que solo usan los que deambulan). Atacar sigue mandando. Prueba: Mage-Orc con el jugador a 50 px → 67/85/95/102 px cada medio segundo.
- **`?debug=movement` / `check movement`:** corro de Slime, Cat, Bunny y Mage-Orc. Pide con `assetStreamer.hurry` los que falten (el Mage-Orc no está descargado al empezar en Traveler Zone) y espera hasta 10 s (`GameScene.spawnMovementRing`).
- **Medidas 27C (23-oct-2026):** `pnpm balance` antes/después (`.check/balance-27c-before.json` / `-after.json`): sin cambio apreciable (dentro del ruido del bot). 60 FPS en `--mobile` con ~260 monstruos a los 5 min; a los 5 min en Traveler Zone, los monstruos a menos de 350 px se reparten en las 8 direcciones (12–19 en cada una).
- **Ojo con `pnpm balance` y el servidor:** si el propietario tiene `pnpm dev` abierto, el script usa ese servidor (puerto 8090), y cualquier cambio guardado en `src/` durante la medición recarga el juego a mitad. Medir sin tocar `src/`. Una copia con `git worktree` en otra carpeta da "A network error occurred" (sin resolver).

## Magias pasivas de la partida (Fase 28)
- **Datos:** `data/passiveMagic.ts` (`MAGICS`: aura, swords, angels; `ready: false` = aún no sale en las cartas; `ranks` con daño base y radio; `MAX_MAGICS_PER_RUN` = 2). Rango guardado en `Equipment.magics` y en la partida (`RunSnapshot.magics`, `SaveStore`). Una carta de magia es `kind: 'magic'` en `UpgradePool` y comparte los `MAX_ITEM_CARDS` huecos con las Stones (`rankedCards`); `?debug=stones` también las ofrece.
- **Daño:** las dagas llaman a `CombatSystem.hitEnemy` con el tipo de la clase (`magicDamageType`: físico en el Guerrero, mágico en la Maga), así que cuentan Str/Mag, Xelima, buffs, Power y crítico. La carta enseña el daño ya multiplicado.
- **Aura = Eye of the Storm (28A, cambiada en la 28B):** **solo frena, sin daño** (propietario, 25-oct-2026: aura de daño y dagas eran el mismo papel). El Protection Ring, effect5 hoja 1 (`fx.aura.ring`), a profundidad `DEPTH_GROUND_SHADOWS + 1` (bajo todos los personajes). A escala 1 mide ~40 px de radio a izquierda y derecha y, por la perspectiva, solo el 55% arriba y abajo (`AURA_RING_RADIUS_PX`, `AURA_RING_Y_SHARE`; medido en captura: las capturas del check a 1000×750 van ×1,25). Frena en elipse por los pies (`EnemySystem.forEachInGroundEllipse`): cada 0,5 s `Enemy.slow(1 − slow, AURA_SLOW_MS, 'wind')`, de −25% a −50%; jefes, mini-jefes y Champions, la mitad (`AURA_BOSS_SLOW_SHARE`). Manda el frenado más fuerte, con su aspecto (hielo azul o viento).
- **Tinte del viento:** un tinte de Phaser solo oscurece, y una copia ADD del propio dibujo no aclara a los monstruos oscuros. Por eso los frenados por el aura se dibujan desde una copia de su hoja con una **silueta blanca rellena** sumada (`ensureGlowTexture(..., fill = true)`, sufijo `~wind`, como el rojo de los élites en `Enemy.syncGlowTexture`) más un tinte gris claro (`AURA_SLOW_LOOK`).
- **Pruebas:** `?debug=aura` (rango 3; repetido, uno más), `check aura` (con la Maga casi no llegan al anillo; mejor `"play=warrior&debug=god,aura,aura,aura,horde"`).
- **Dagas (28B):** dagas, no espadas (propietario). `MagicRank.count` y `turnsPerSecond`; giran en elipse (`DAGGER_ORBIT_Y_SHARE`) levantadas `DAGGER_LIFT_PX` y ordenadas por el punto del suelo bajo cada una (delante del jugador cuando van por debajo). Dibujo: la Dagger del suelo (`item-ground.spr` hoja 0, frame 0; ya se carga en cada partida por las gemas) ×1,8, la punta apunta a −45° en el dibujo. **Brillo** para no confundirlas con la daga equipada: la hoja con su copia teñida de azul (`ensureGlowTexture`) y detrás una mancha de luz ADD alargada que late (`fx.daggerHalo`, canvas hecho una vez). Una copia ADD del propio dibujo como halo casi no se veía: la daga es oscura y ADD sobre oscuro no suma. Daño 9–18 (tras una primera prueba con 6–12). La partida simulada no las mide: la Maga mata de lejos y apenas tocan a nadie (con y sin dagas, ~2.350 bajas, también con `bot=stand`). Golpe con `forEachInRadius` (cuerpo del monstruo) en la punta de cada daga; el mismo monstruo, como mucho una vez cada `hitEveryMs` entre todas (`daggerCooldowns`). Empujan desde el jugador. `?debug=daggers` (rango 3), `check daggers`.
- **Angelitos (28C):** solo el **celeste**, `tutelarangel3.spr` (el del Angelic Pendant de INT; propietario). Colores de los 4: 1 dorado (STR), 2 rojo (DEX), 3 celeste/azulado (INT), 4 verde (MAG). 48 hojas, `hoja = animación + dirección`: quieto 0 (8 frames), vuela 8, **ataque 16 (4 frames, brazo al frente; el que usamos al disparar)**, muere 24, lanza 32 (16), golpe 40. Algunas hojas traen basura de colores fuera de los frames (no se ve). Se carga como `SpriteType.Monster` (`fx.tutelaryAngel`), **bajo demanda** al tener la magia (`ON_DEMAND_SPRITES`, `lookLoader.ensure` desde `PassiveMagicSystem`). **Un solo angelito** (propietario): con el rango dispara más seguido, lo que habrían disparado 2 o 3 (rango 5: cada 250 ms). Flota en `ANGEL_SPOTS` (donde el original: 20 px a la derecha y arriba), sigue al jugador con algo de retraso y se balancean. Disparo: bola de luz que persigue (la textura del halo de las dagas, ADD, celeste), pool `AngelBolt`; golpe con `CombatSystem.hitEnemy`, **pequeña (14 px) y sin chispazo** al dar (propietario: con 28 px y el chispazo del Energy Bolt, a 4 disparos por segundo, era demasiado ruido). Sin sonido (a ese ritmo sería ruido). Icono: Angelic Pendant (INT), hoja 19 frame 12. `?debug=angels` (rango 3), `check angels`. Para ver una carta concreta sin esperar al azar: `--eval` que repite `g.levelUpChoices(false)` hasta que sale, la fija y llama a `g.openLevelUp(false)`.

## Sprites suaves: filtro xBR (Fase 28¾)
- `hb/XbrPipeline.ts`: pipeline WebGL propio (subclase de `SinglePipeline`, una textura por dibujo) con el shader xBR-lv2 de Hyllian (MIT, esquina C). Se registra en `main.ts` con `callbacks.postBoot` (`registerXbrPipeline`); un sprite lo usa con `setPipeline(XBR_PIPELINE)`. Sin WebGL no se registra y `setPipeline` se ignora.
- El shader necesita el tamaño de la textura (WebGL1 no tiene `textureSize`). **Ojo:** Phaser elige la textura en `pushBatch` (lo llaman `setGameObject` y `setTexture2D`; `batchSprite` usa `setGameObject`), así que el uniform `uTextureSize` se pone allí, dibujando antes lo pendiente si cambia la textura. Puesto solo en `setTexture2D`, el uniform se queda a 0 y el sprite sale **invisible**.
- La transparencia cuenta en la comparación de píxeles (transparente = muy distinto de cualquier opaco), así se suaviza también la silueta. Los tintes de Phaser (`setTint`, `setTintFill` del destello, alpha) se aplican después, como en su shader normal: comprobado en la escena de prueba.
- Lee 21 píxeles alrededor de cada uno: puede "ver" 2 píxeles del fotograma vecino en la hoja si están pegados (no se ha notado con el Orc).
- `XBR_EDGE_SCALE` (3) = ancho del borde suave, como `XBR_SCALE` del original.
- Coste medido (28¾A, PC): 30 Orcs, 0,22 → 0,25 ms por imagen; FPS iguales (tope de la pantalla). El modo `--mobile` usa la tarjeta del PC; el propietario lo probó en su móvil (wifi, `http://IP-del-PC:8090`) y va bien.
- **Un único punto (28¾B):** `smoothSprite(obj)` en `hb/XbrPipeline.ts` pone el filtro si `smoothSpritesOn()` (Settings → Smooth Sprites, salvo `?debug=nosmooth`). Lo llevan `HBAsset` (monstruos y NPCs), `CharacterSprite` (todas las capas del personaje, también en menús), `PaperDoll`, sombras, `Effect`, `Projectile`, `Meteor`, `Portal`, `Totem`, proyectiles de monstruos, auras de `BuffSystem`, magias pasivas (anillo, dagas, angelitos), gemas, botín y pickups. **Sin filtro:** mapa, HUD, menús, iconos, textos, chispas de golpe (`HitParticles`) y texturas generadas suaves (brillo de los rayos de los angelitos, halo de las dagas). Un sprite nuevo del mundo: crearlo con `smoothSprite(scene.add.sprite(...))`.
- Coste medido (28¾B, PC, 200 monstruos + dagas + angelitos): 0,58 → 0,74 ms por imagen (medido con `gl.finish` alrededor de `preRender`/`postRender` en `--eval`); FPS iguales (tope).
- **Opción en Settings (28¾C):** `smoothSprites` en `config/settings.ts` (por defecto On en PC y móvil), casilla en la primera pestaña. Se aplica al momento: `smoothSprite` apunta cada objeto en un `Set` (sale al destruirse) y, al cambiar el ajuste, a todos se les pone `setPipeline(XBR_PIPELINE)` o `resetPipeline()`. Por eso **nadie más** debe poner otro pipeline a esos sprites (lo quitaría `resetPipeline`). Probar el cambio en caliente: `check smooth --eval="g.debugSetSmooth(false)"` → 0 sprites con filtro; `true` → todos otra vez. No viaja con el código de traspaso (los ajustes no viajan).
- Comparar: `check smooth` / `check nosmooth` (horda con élites, dagas, angelitos y pickups); `check orcs` / `orcsnosmooth` (30 Orcs); tecla **T** = escena de prueba del Orc (`SpriteTestScene`). Capturas en `.check/sprites-hd/comparativa-28-3-4A.png` y `.check/compare-28-3-4B.jpg`.

## Zoom del mundo en el móvil (25-oct-2026)
- En el móvil (`COMPACT_UI`) la cámara de la partida y de la ciudad acerca un 25 % más: `WORLD_ZOOM` en `config/device.ts` (`PHONE_WORLD_ZOOM`), aplicado con `zoomWorldCamera(camera)` (`ui/renderScale.ts`) en `GameScene` y `TownScene`. Para probar otro valor: `?zoom=1.5` (también en el PC).
- Lo fijo en pantalla (minimapa de la ciudad, joysticks, botones) va en una `ScreenLayer`, que ahora se encoge `RENDER_SCALE / cam.zoom` para quedar al tamaño de siempre. Todo lo nuevo fijo en pantalla dentro de esas escenas debe ir en una `ScreenLayer`.
- La interfaz de la partida (HudScene) es otra escena y no se toca. Los monstruos aparecen según `camera.worldView`, así que se ajusta solo (se ve algo menos de mapa).

## Anuncios en Discord
- `pnpm --dir survivors announce [--dry] ["Phase N"]` publica la entrada de `src/data/releaseNotes.ts` en #announcements mediante un webhook.
- El webhook está en `survivors/.env.local` (ignorado por git). Si se filtra, se borra en Discord (Edit Channel → Integrations → Webhooks), se crea otro y se pega ahí.
- Necesita Node 22.18+ (importa el `.ts` directamente, quitando los tipos).

## Hachas: giro en torbellino (bloque B, 25-oct-2026)
- Cada hacha es un `.spr` propio de 56 hojas (7 estados × 8 direcciones, `startSheet: 0`): Light Axe `waxe3`, Tomahawk `waxe4`, Double Axe `waxe1`, War Axe `waxe2`, Battle Axe `waxe6`. Se usan las `waxe*` también para el hombre (claves `gear.axes.*`, sin pareja `.m`/`.w`); sobre el cuerpo de hombre encajan bien.
- Iconos: `item-pack.spr` hoja 14 (Item.cfg Spr 15), frame = SFrame (Light 2, Tomahawk 3, Double 0, War 1, Battle 6). En la ventana Character, el grupo 15 es la hoja 11 de `item-equip*` (`WEAPON_SPR` en `data/paperDoll.ts`).
- Ataque: `MELEE_FAMILIES[f].attack = 'spin'` → `MeleeWeapon` llama a `context.spinMelee`; `Player.spin` recorre las 8 direcciones con el fotograma `AXE_SPIN.poseFrame` (5 = hacha baja, en pleno barrido; 3 = levantada) fijado en `CharacterSprite.heldFrame`; `Slash.showSpin` dibuja la estela circular (`SPIN_TRAIL` en `data/slash.ts`). El daño cae una vez sobre todo el círculo en `AXE_SPIN.hitMoment`. Quieto todo el giro; un golpe recibido (Hurt) lo corta, como a las espadas.
- El crit de las hachas (2 giros, `data/critStrike.ts`) usa el mismo giro y estela (`WeaponSystem.startStrikeAnimation`).
- La partida simulada (`simBestEquipment`) se queda con las espadas (`SIM_WEAPON_FAMILIES`) para que las medidas sigan comparables; `?weapon=lightAxe` pone otra arma (también `pnpm balance warrior:bisle:10:0@weapon=tomahawk`). `check axe` / `battleaxe` / `levelpaceaxe`.

## Martillos: golpe al suelo y grieta (bloque C, 26-oct-2026)
- Sprites: `mhammer.spr` (Hammer) y `mbhammer.spr` (Battle Hammer), 56 hojas cada uno, `startSheet: 0` (claves `gear.hammers.*`). El original usa el de hombre también para la mujer; solo los lleva Gorn. En IdleCombat se ven bien (no están rotos como `maxe*`). Existen `whammer`, `wbhammer` y los del Barbarian Hammer (`mbabhammer`/`wbabhammer`, Str 200, para los únicos).
- Iconos: `item-pack.spr` hoja 14 (como las hachas), frame 7 (Hammer) y 8 (Battle Hammer); en la ventana Character, grupo 15 (`WEAPON_SPR`).
- Ataque: `attack: 'slam'` → `MeleeWeapon` llama a `context.slamMelee` (tajo normal hacia el objetivo, quieto hasta `HAMMER_SLAM.rootMoment`) y en `HAMMER_SLAM.hitMoment` `WeaponSystem.groundSlam`: daño en todo el círculo de `range`, polvo `fx.earthShock.dust` alrededor, golpe sordo C5 (`sfx.melee.blunt`), temblor suave y la grieta.
- Grieta: reutiliza `systems/LineSpell.ts` con `HAMMER_CRACK` (look `earthShock`, daño físico, números normales). `LinePathDef` (data/activeSpells.ts) es la parte de "camino" de `LineSpellDef`; `pathDamage: 1` y el daño de la grieta del arma va como `power`. Tiene su propio `LineSpell` (`hammerCracks`) para que no vibre el mando como un hechizo activo.
- El martillo ataca también si el monstruo está fuera del círculo pero al alcance de la grieta (`HAMMER_SLAM.triggerShare` × largo).
- Crit: el círculo de `CRIT_SHAPES.hammer` y una grieta `critCrackLength` (×1,6) más larga, con su daño escalado como el del golpe.
- `check hammer` / `battlehammer` / `levelpacehammer`; `?weapon=hammer|battleHammer`. Para ver la grieta de cerca: `"play=warrior&weapon=battleHammer&debug=god,crits,aim&zoom=2&trees=off"` y `--eval="(g.launchCritStrike(), new Promise(r => setTimeout(r, 420)))"`.

## Equilibrio de los martillos (26-oct-2026)
- **Prueba justa:** cada arma en un Level donde el Guerrero ya tiene la Str que pide (Hammer Str 70 ≈ Level 23; Battle Hammer Str 95 ≈ Level 33; Flamberge Str 60). Casos `warrior:elvineGarden:25|35:0@weapon=...` y `warrior:middleland:40:0@weapon=...`, `--repeat=4`. La primera medida (Level 5/10) no valía: la simulación pone el arma sin mirar requisitos.
- **Antes:** el Battle Hammer ganaba 4/4 en Elvine Garden 35 (Flamberge 2/4) y en Middleland 40 moría 3,5 veces (Flamberge 5) con la mitad de bola. El Battle Axe (Str 80) va como la Flamberge o peor.
- **Cambio:** daño de la grieta −30% (Hammer 28→20, Battle Hammer 38→27). **Después:** Middleland 40 Battle Hammer 6 muertes, bola ~70 (más cerca de la Flamberge); Elvine Garden casi igual (allí la partida ya se gana; poco sirve para comparar). El Hammer en Elvine Garden 25 sigue ~2 min por encima de la Flamberge: la ventaja viene sobre todo del golpe en círculo, no de la grieta. Datos: `.check/balance-hammers-fair.json` y `.check/balance-hammers-nerf.json`.
- **Segundo cambio:** golpe del Hammer 46→42. Medido con `--repeat=8` frente a la Flamberge (`.check/balance-hammers-42.json`): Elvine Garden 25, 1ª muerte 9:10 frente a 8:08; Middleland 40, 10:36 frente a 9:44 (4 muertes frente a 5,5); Elvine Garden 35, gana 8/8 frente a 7/8. Queda ~1 min por encima, con menos bola y menos monstruos muertos de un golpe (0,25–0,36 frente a 0,37–0,57): aceptado como ventaja de un arma más pesada.

## Rescates y Guards (Fase 29A, 27-oct-2026; logros y Missions, 29B)
- Datos: `data/rescues.ts` (qué NPC en cada mapa y cuánto se endurece su Guard), Guard en `data/enemies.ts` (`guard`, `skySpell`, `healthBar`), movimiento `guard` en `data/movement.ts` (`GUARD_POST`).
- Partida: `systems/RescueSystem.ts` (descarga el NPC y `guard.spr` si faltan, busca sitio, saca al Guard). El rayo cae con `EnemyProjectileSystem.strikeAt` (marca en el suelo + `LightningArc`; solo daña si sigues dentro, y se puede resistir).
- Guardado: `systems/RescueStore.ts`, clave `hb-survivors.rescues` (en `TRANSFER_KEYS`). Ciudad: `TownScene` solo crea los NPCs con `rescueStore.isInTown`; William ofrece Equipment mientras falta Howard (`EQUIPMENT_STAND_IN`).
- El Guard es inmune a `killAll` (jefe final, tecla K) y a `relocateFarAway`: hay que matarlo a mano. No sale en las partidas simuladas (`?debug=sim`).
- `getMap` guarda el mapa en caché entre partidas: el NPC bloquea su casilla y la libera al irse (`HBMap.unblockTile`, `Npc.destroy`).
- No hay NPC.cfg del Guard en `reference/`; los guardias originales solo pegan de cerca. El Lightning Bolt es idea nuestra (propietario).
- Atajos: `?rescued=all|reset|howard,tom`, `?debug=rescue`; `?town=<npc>` pone a ese NPC aunque no esté rescatado. `check rescue` / `townnobody` / `townall`.
- **Logros y Missions (29B):** meta `{ kind: 'rescue', npc? }` en `data/achievements.ts` (sin `npc` = todos). Se desbloquean en `AchievementTracker.onRescue` (GameScene, cuando `RescueSystem.onEnemyKilled` devuelve true) y además, en silencio, al abrir el juego (`AchievementStore`, `rescueGoalMet`): así cuentan los rescates guardados antes de existir el logro. Ojo: `?achievements=reset` los vuelve a dar si hay rescates guardados; usar también `?rescued=reset`.
- Missions de William: `scenes/MissionsScene.ts` (lee `RESCUES`, estado con `rescueStore` y `mapUnlockStore.isOpen` con el Level del personaje), textos y colores en `MISSIONS_SCREEN` (`config/menus.ts`). Atajos `?open=missions`, `?open=town&town=william&missions`; `check missions` / `missionsone` / `missionsall`.
- Para matar al Guard desde `--eval` (killAll no sirve): `g.enemies.forEachAlive(e => { if (e.isGuard) g.combat.hitEnemy(e, 'physical', 1e9, e.x, e.y, 0); })`.

## Hechizos de impacto con marca en el suelo (27-oct-2026)
- **Regla (propietario):** todo hechizo de jefe o minijefe que cae en un sitio **marca la zona antes** y deja escapar. Solo los proyectiles que se ven volar (flechas, bolas del Orc Mage) van sin marca.
- Datos: `EnemySkySpell` en `data/enemies.ts`: `pattern` (`single` = bajo los pies; `scatter` = uno bajo los pies y el resto repartido alrededor, con huecos; `line` = fila desde el que lanza, pasando por el jugador, que se enciende marca a marca cada `stepMs`), `impact` (`'lightning'` o un efecto de `config/effects.ts`), `markColor`, y `damage` fijo (jefes) o `damageShare` (golpe × parte, Guards).
- Monstruos normales: `EnemyDef.skySpell` (lo lanza `Enemy` como un ataque). Jefes: `BossInfo.skySpell` (lo lanza `BossSystem.updateSpell` con su recarga). `BossInfo.ranged` (proyectiles en abanico) sigue existiendo, pero ya ningún jefe lo usa.
- `EnemyProjectileSystem.strikeAt` coloca las marcas; **cada lanzamiento hace daño una sola vez**, aunque toquen varias marcas (`castsThatHit`). La resistencia mágica puede pararlo ("Resist").
- Ahora: Guard = Lightning Bolt `single` (azul); Fire Wyvern = 5 bolas de fuego `scatter` (naranja); Unicorn = Energy Strike `line` de 9 marcas (violeta).
- Probar: `check finalboss` (Wyvern) / `middlelandboss` (Unicorn) / `rescue` (Guard). Para contar marcas: `--eval="g.enemyShots.strikes.active.length"`.

## Icebound (Fase 30A)
- **Mapa:** `icebound.amd` (300×300, 0,9 MB; minimapa 241 KB). Zona de juego 150×150 en (126,126): 79% libre y 78% en una sola pieza (la mejor conectada; a 200×200 bajaba al 75%). Elegido por el propietario: 150. Después de Middleland, Level 55, ×1,9, 15 minutos, oro ×2,2.
- **Música:** `music.default` (`default.mp3`, el tema general del original). Va en `LATER_SOUNDS`: no se baja antes del menú, la baja `MapLoadScene.sounds()` si es la música del mapa elegido.
- **Monstruos** (NPC.cfg de centuu/HelbreathServer; sp-client `Monsters.ts` no trae animaciones especiales salvo el Beholder, ataque de 12 frames, que es su hoja entera):
  - Rudolph `rudolph` (7d5, ATime 1000, MinBrvy 10, embiste), Ice Golem `icegolem` (8d6, ATime 1200; sonidos del Stone Golem), Beholder `beholder` (8d8, alcance 4, guarda distancia), Claw Turtle `clawturtle` (8d9, ATime 500, alcance 2, flanquea).
  - Minijefes `frostBoss` (min 5) y `nizieBoss` (min 10); jefe final `tigerwormBoss` (min 15), copia del `tigerworm` (que no sale en ningún mapa), con Ice Golems y Claw Turtles de esbirros.
  - El Wyvern de hielo (`wyvern.spr`, 3,6 MB) se quedó fuera (propietario).
- **Hechizos con marca** (`data/enemies.ts`): Frost = Ice Strike en 6 marcas juntas (`fx.iceStrike.impact`, sonido `sfx.freeze`); Nizie = Chill Wind en fila de 9 (`fx.chillWind.drop`); Tigerworm = cadena de 8 Lightning Bolts: `scatter` con `stepMs` (nuevo en el 30A), caen uno tras otro. Ninguno ralentiza.
- **Efectos del Guerrero:** el hielo está en `fx.effect4`, que antes solo bajaba la Maga. `MapDef.runSprites` añade sprites de efectos por mapa (`MapLoadScene.runSprites`).
- **Medido (27-oct-2026):** `levelpaceicebound`: Power 34 al final (Middleland 32); Frost 83 s, Nizie 124 s, Tigerworm 251 s con 26.000 de vida → bajado a 22.000 (Unicorn: 197 s). Golpe más fuerte de jefe: 12–17% de la vida. `loadtimeicebound --mobile`: 18,3 MB / 17,8 s (Middleland 17,0 MB / 16,6 s); la carga inicial no cambia (11,4 MB).
- **Puntitos negros en la nieve (arreglado):** el conversor de `.spr` (`tools/PakToSprConverter/Program.cs:356`) volvió transparente todo píxel del color de la esquina de cada hoja, también en las casillas; en las de nieve (`tile445-461.spr`, solo las usa Icebound) son ~22 agujeros por casilla (445) y 125–160 en 456/460, y se veía el fondo oscuro. `fillGroundHoles` en `hb/mapRenderer.ts` rellena esos píxeles con el vecino sólido al montar el tileset del suelo (los objetos no se tocan: necesitan su transparencia). Arregla de paso los pocos agujeros de los otros mapas.
- **Select Map con más de 4 mapas:** carrusel (`MAP_SELECT.card.visible` = 4); la fila se desliza para que la tarjeta marcada se vea, y `‹ ›` (clicables) avisan de que hay más.
- **Probar:** `check icebound`, `iceboundfrost`, `iceboundnizie`, `iceboundboss`, `levelpaceicebound`, `loadtimeicebound`; `iceboundnosmooth` (sin filtro xBR).


## Arreglos del 27-oct-2026 (sonidos, "!" y Select Map)
- **Sonidos de ataque de los monstruos:** antes se ajustaban a la animación de golpe (8 frames a 17,5 fps ≈ 0,46 s), y como casi todos duran 0,7–1,4 s sonaban a 1,5–2× (el límite `AUDIO.maxRate`); Skeleton y Frost, más lentos y graves. Ahora `Enemy.startAttack` los toca a velocidad normal. El ajuste a la animación sigue para el jugador (golpe, hechizos).
- **"!" de embestida:** apagado con `CHARGE_WARNING.shown` (`data/movement.ts`); el monstruo sigue parándose antes de embestir.
- **Fondo de Select Map:** solo se pintan las primeras `MAP_SELECT_BACKGROUND_ROWS` (452) filas del fondo del título, estiradas a lo alto, para quitar la línea "... PlayHelbreath.com". El menú principal no cambia.

## Objetos únicos (Fase 30B)
- **Dónde:** `data/uniques.ts` (`MAP_UNIQUES`, `UNIQUE_DROP`, `UNIQUE_LEVEL`, `UNIQUE_LOOK`) y `systems/UniqueStore.ts` (fallos por mapa del dispositivo, clave `hb-survivors.uniques`, en `TRANSFER_KEYS`).
- **Tirada:** `GameScene.rollUnique`, al morir el jefe final de un mapa con únicos (antes del portal: la victoria llega al cruzarlo). 2 % + 1 % por fallo; al salir, uno de los del mapa al azar y el contador vuelve a 0. Cae a `LOOT_BOSS_SPREAD` bajo el jefe, con brillo morado (`LootDrop`), el cartel "Unique item!" y el sonido de las cartas Epic.
- **Otra clase:** `onLootPickup` lo mete directo en el baúl (`warehouseStore.add`) con el aviso "X sent to the Warehouse"; si el baúl está lleno, va a la bolsa como cualquier botín.
- **Fuera de todo lo demás:** `isLootDrop` (botín normal), `smithStock` (`isRareItem`), `simBestEquipment`. `isFreeItem`: un hechizo único **no** se sabe con la Int: hay que tenerlo en el inventario, como un arma. Tom los compra al precio tope (1.500).
- **Color:** `ownedItemColor` (dibujo: atributo o `glow` del arma) y `ownedItemNameColor` (nombre: atributo o `UNIQUE_LOOK.color`) en `data/items.ts`; usados en botín, carta, Equipment, baúl y fin de partida. El arma en la mano, con `MeleeWeaponDef.glow` (`equipmentLook`, `Equipment.weaponLayer`).
- **Sword of Ice Elemental** (`data/weapons.ts`): espada larga (eslabón tras la Flamberge en `MELEE_FAMILIES`), daño 68, Str 100 + Level 100; `chills` → `Equipment.chills` → `CombatSystem.chillOnHit` (todo golpe físico que no mata ralentiza con `chillEnemy`, crits incluidos). Dibujo: msw bloque 560 (como la Great Sword) teñido de azul; icono item-pack 0/15.
- **Ice Storm** (`data/activeSpells.ts`, kind `'storm'`; `systems/IceStormField.ts`): 5 s en el punto, cada 0,4 s 7 de daño ×Power y ralentiza; remolinos `fx.iceStorm.whirlwind` (effect3 hoja 0, que ya carga la Maga) y trozos pequeños de Ice Strike. Int 60 + Level 100, 55 de maná. Icono: el libro azul.
- **Probar:** `?unique=iceElementalSword|iceStorm` (el jefe final lo suelta siempre), `?debug=unique` (uno al azar), `?unique=reset`; `check unique` / `uniquewarehouse` / `uniquesword` / `icestorm`. `?weapon=iceElementalSword` y `?spells=iceStorm` saltan los requisitos.
- **Añadir únicos de otro mapa:** el objeto en su archivo (con `equip.level: UNIQUE_LEVEL` o `level` en el hechizo) y su id en `MAP_UNIQUES`.

## Ataques de los monstruos como el original (28-oct-2026)
- **Fuente:** `reference/Server.cpp` (`NpcProcess` ~8970, `NpcBehavior_Attack` ~10580, `NpcBehavior_Flee` ~11310, `iCalculateAttackEffect` ~53930) y `Wmain.cpp` de centuu/HelbreathServer (`_StartTimer(300)`: el servidor mira a los monstruos cada 300 ms; ese archivo no está en el repo).
- **Ritmo:** en cada vistazo el servidor vuelve a tirar la espera (ATime − 0..700, mínimo 600) y ataca si ya pasó más que eso. Por eso los ataques caen en múltiplos de 300 ms: grandes cada 0,6–0,9 s (media ~0,75), Orc ~1 s, Slime ~1,9 s; antes íbamos un 5–25 % más rápido. `originalAttackIntervalMs` en `Enemy.ts`, constantes en `MONSTER_AI`. El ±2 ms de `serverTickJitterMs` es una suposición (temporizador de Windows); sin él, los de ATime ≤ 900 pegarían siempre a 0,9 s. La velocidad al andar (`enemySpeed`) **no** se ha tocado.
- **Golpe decidido al empezar:** el original resuelve el golpe en el mismo instante del ataque; aquí se sigue viendo en el frame 2, pero ya no se comprueba el alcance: apartarse a mitad del tajo no lo esquiva.
- **Huir con poca vida:** con 2 de vida original o menos (como parte de su vida original: `lowHealthHp / def.maxHp`), en cada acción, si 1..bravery ≤ 3; bravery = MinBrvy + 0..2 al aparecer. Huye 10 acciones (2 si es de "pega y huye"). Los grandes (vida alta) casi nunca huyen. Sin la curación al acabar la huida ni el aviso a los compañeros.
- **Por la espalda:** si el monstruo mira hacia donde mira el jugador, la defensa cuenta la mitad (`DODGE.behindDefenseShare`, `defenseAgainst`); también las flechas (dirección de vuelo). Huir de una manada = media defensa.
- **Medidas** (`.check/balance-attacks-before|after|nobehind.json`, 3 partidas por caso, mucho ruido): el Guerrero pasa de sobrevivir 1 de 3 partidas en Traveler/Bleeding/Elvine a 0, con 3–6 muertes por caso en vez de 1; la Maga, parecida (Bleeding Isle peor, Elvine algo mejor). Sin la regla de la espalda sale parecido, así que lo que más pesa parece ser no poder escapar del tajo andando (el bot corre en círculos).
- **Sin hacer (diferencias menores):** +0–299 ms al ATime de cada monstruo al aparecer, empujón con golpes de 40+, veneno y quitar Protect al pegar, "pega y huye" que en el original solo se aparta 1 paso, límites de acierto 15–99 % (nuestros 25–95 %).

