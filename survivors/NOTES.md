# Notas técnicas

Lo que hemos aprendido de `sp-client` y de los assets. Resumen para no tener que releer el código base.
Rutas de código relativas a `sp-client/src/` salvo que se indique.

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
