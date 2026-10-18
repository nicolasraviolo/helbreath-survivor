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
- Portal del final (Fase 13)
- Partida simulada y equilibrio (Fase 13C)
- Logros (Fase 14B)
- Métricas (Fase 14A)
- Apuntado automático (Fase 15A)
- Apuntado manual (Fase 15B)
- Stick de apuntar en el móvil (Fase 15C)

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
- **Triple Energy Bolt:** 3 Energy Bolts a la vez. En el original van a casillas desplazadas del objetivo; aquí, a 3 enemigos distintos.
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
- **Crítico del original:** se lanza con Alt; cargas = nivel/10, +1 cada ~13 s (S:4117). Grito `C23` (hombre) / `C24` (mujer). Icono del HUD al mantener Alt: GameDialog hoja 6 frame 3.
- **Zem** (Zemstone of Sacrifice): `item-ground`/`item-pack` hoja 15 frame 39. Efecto Resurrection: `effect11` hoja 10 (21 frames; el código pide 30).
- **Minimapa original:** `telescope.spr` hoja 0, miniaturas de 128×128. Frame por mapa: huntzone2 9, middleland 4, arefarm 6, elvfarm 5, dglv4 14, icebound 24, druncncity 25. Punto del jugador: GameDialog hoja 4 frame 37. También hay `images/minimaps/<mapa>.jpg` (1500×1500).
- **Bolsa original:** GameDialog hoja 7 frame 0 (226×188); objetos dibujados en (32+x, 44+y).
- **Objetos Hero por bando:** Aresden = sufijo 2 en armaduras y `mantle01`/`04` en capas; Elvine = sufijo 1 y `mantle02`/`05`. Banderas en el suelo: 5/56 Aresden, 5/57 Elvine.
- **Monstruos sin usar con sprite:** Frost, Ice Golem, Wyvern (el "de hielo", 3,6 MB), Dragon (`barlog`), Beholder, Stone/Clay Golem, Claw Turtle, Nizie, Tentocle, Giant Crayfish, Giant Lizard, Master Mage Orc, Centaurus, Sorceress, Cat, Rudolph, Mountain Giant, Unicorn, Guard. **No existen:** Yeti, Ice Lizard, otros dragones.
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

## Settings táctil (Fase 12C)
- `MenuList` tiene filas con casilla (`checked`), dibujadas con `Graphics`: el original no tiene sprite de casilla (sp-client la hace en React). Se probó una barra deslizante para el volumen y el propietario prefirió las flechas con el número (18-oct-2026).
- App instalada: `(display-mode: fullscreen)` también se cumple en una pestaña normal puesta a pantalla completa. Por eso `ui/fullscreen.ts` lo lee **una sola vez al arrancar** para saber si se abrió desde el icono (y entonces no ofrece Fullscreen).
- Large Trees solo On/Off: un `'transparent'` guardado (Fase 11) no está en `TREE_MODES` y se carga como el valor por defecto (On), sin migración.
- En Playwright, esperar a que la escena exista (`waitForFunction`) antes de pulsar teclas: con `?open=` la pantalla tarda algo más de 1,5 s.

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

## Logros (Fase 14B)
- Lo que se guarda es el **id** de cada logro (`survive5`, `killWyvern`...), no su nombre: se puede cambiar el nombre o la descripción sin perder nada, pero **nunca el id**.
- Los jefes se reconocen comparando su definición (`ENEMIES[id] === enemy.def`): todos los monstruos de una clase comparten el mismo objeto de `data/enemies.ts`.
- La escena de cartas pausa la partida: el vigilante no corre mientras tanto y el aviso del HUD espera (`scene.isPaused`). Por eso el logro de nivel sale después de elegir la carta.
- En las pruebas automáticas, la partida se queda en las cartas si no se usa `--cards` (el script responde por su cuenta llamando a `onChoose` de LevelUp; los eventos de teclado sintéticos no llegan a Phaser).

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
- **Esquina reservada:** `TOUCH_RESERVED_CORNER` (abajo a la derecha de la zona de juego) no abre ningún stick: ahí irá el botón del crit (Fase 16). El botón de pausa es de la escena del HUD, que va encima y se queda el toque.
- **Dedos:** `TOUCH_POINTERS = 3` (mover + apuntar + botón).
- **Settings en el móvil:** con la fila "Aim Stick" son 11 filas; para que quepan en el marco, `SETTINGS_MENU.itemSpacing` en el móvil bajó a 33. Otra fila más ya no cabe: habría que quitar alguna o hacer dos páginas.
- **How to Play en el móvil:** caben **6 filas** por página; la 7ª pisa el selector "Page". En el 15C se juntaron filas ("C / Esc", "Stats / Pause buttons") y se acortaron textos para que quepan.
- **Probar:** `?debug=aimstick` (con `--mobile`) pone un dedo de mentira empujando a la derecha. Para dedos de verdad en `pnpm check --eval`, crear `Touch` con `clientX/pageX/screenX` (si falta `pageX`, Phaser lo lee como 0) y lanzar `touchstart` en el canvas y `touchmove/touchend` en `window`. Ojo: un `import('/src/...')` desde `--eval` carga **otra copia** del módulo (Vite lo sirve con `?t=...`); para tocar los ajustes de verdad hay que importar la URL exacta de `performance.getEntriesByType('resource')`.

