# Historial de progreso

Bloques y fases ya terminados, el más reciente arriba. El estado actual está en `PROGRESS.md`. Al cerrar un bloque, su resumen se mueve aquí, arriba del todo.

**Fase 18, bloque 18A: esquiva física (2026-10-18).**
- **Qué hace:** cada golpe de monstruo y cada flecha del Dark Elf tira su **puntería** contra la **defensa** del jugador (2·Dex + la defensa original de cada pieza de armadura y escudo). Si falla, no pasa nada: ni daño, ni parpadeo, ni animación. **Sin texto "Miss"** ni línea en How to Play (decisión del propietario). Una flecha esquivada sigue volando de largo. Las bolas de fuego (magia) no se esquivan: van en el 18B.
- **Números:** fórmula del original (50·puntería/defensa) con la puntería comprimida (8,3 × original^0,53) y límites 25%–95%. Con el mejor equipo, el guerrero tiene 125 de defensa (Orc acierta 29%, Werewolf 68%, Ettin 77%); la Maga, 44.
- **Interfaz:** línea **"Dodge"** en el panel de stats (C), contra un Orc y un Ettin. Las cartas de armadura muestran "Dodge (Orc) x% → y%". El texto de Dex dice ahora "Movement and attack speed, dodge".
- **Código:** `data/defense.ts` (nuevo), `hitRatio` en `data/enemies.ts`, `defenseRatio` en `data/armor.ts`, `Equipment.defenseRatio`, `Enemy.strike`, `EnemyProjectileSystem` (`physical`, `dodged`), `EnemyWorld.defenseRatio/onBlow`. La partida simulada cuenta los golpes (`blows`) y `pnpm check levelpace` los escribe. Detalle en NOTES.md, "Esquiva física (Fase 18A)".
- **Atajos nuevos:** `?debug=dodge` (la mejor armadura de la clase; sin logros esa partida) y `?debug=stats` (panel de stats abierto).
- **Comprobado:** build; `check menu game levelup boss` y `play=warrior&debug=dodge,stats` (también `--mobile`) sin errores; el panel cabe en PC y móvil. Partida simulada: el guerrero esquiva ~24% del daño y la Maga ~5%; los niveles no cambian (la simulación es invencible).
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&debug=dodge,stats

**Fase 17, bloque 17B: aspecto del personaje (2026-10-18).**
- **Qué hace:** en Create Character funcionan las flechas del original de Gender, Skin Color, Hair Style, Hair Color y Underwear Color (zonas de toque más anchas en el móvil). El aspecto sale al azar al abrir, como en el original. Teclado y mando: ↑/↓ eligen fila (la elegida, en rojo; la última es la clase) y ←/→ la cambian. El personaje se ve igual en Select Character y en partida.
- **Contenido:** sexo libre en las dos clases; 3 pieles (cuerpos `wm/ym/bm` y `ww/yw/bw`), 8 peinados (el 2 es calvo), 8 colores de pelo y 8 de ropa interior. Toda la ropa y las armas del Guerrero tienen versión de mujer; el Mago hombre lleva túnica, gorros y varita de hombre, y empieza con Shirt y Trousers. Con casco no se ve el pelo. Voz al subir de nivel y grito al morir, por sexo.
- **Código:** `data/appearance.ts`, `systems/LookLoader.ts` (~6,5 MB de piezas nuevas en `ON_DEMAND_SPRITES`, fuera de la carga inicial), `hb/additiveTint.ts`, `CharacterSprite` (recibe el aspecto y cambia cada pieza con `gearForGender`), `CharacterStore` versión 2 (`look`; los de la versión 1 reciben `DEFAULT_LOOKS`), `HairAndUndies` cargado como canvas. `CharacterDef` ya no lleva sonidos. Dos filas nuevas en How to Play, página Characters.
- **Comprobado:** build; `check menu slots open=select game open=howtoplay` y `slots open=select game --mobile` sin errores. Con Playwright: flechas con ratón y teclado, Guerrera piel oscura con Plate Mail, Horned Helmet y Tower Shield en versión de mujer (pelo oculto con casco), los 8 colores de pelo en hombre y mujer y la página de ayuda en el móvil.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?open=select; ejemplos en http://localhost:8090/?characters=demo&open=slots.

**Fase 17, bloque 17A: "Select Character" y personajes guardados (2026-10-18).**
- **Qué hace:** Play y Continue abren la pantalla **"Character List"** del original: 4 huecos con el fondo, los marcos y los botones originales (`gamedialog86` hoja 8, `dialogtext` 51–62). En cada hueco, el personaje camina en el sitio y gira como en el original, con su nombre y su **mejor nivel**. Un clic marca el hueco y el segundo juega. Un hueco vacío abre Create Character, donde el nombre ya se escribe: hasta 10 letras o números; en el móvil sale el teclado al tocar la caja. Botones: Start, Create New Character, Delete Character (se pulsa dos veces) y Log Out (vuelve al menú); Change Password sale apagado. Teclado: flechas, Enter, Supr y Esc. Mando: cruceta, A y B.
- **Partidas:** **una a medias por personaje**. Continue solo deja elegir personajes con partida (los demás, apagados). Elegir un personaje con partida la continúa, también desde Play. Borrar un personaje borra su partida. Las partidas antiguas (o de `?play`) se convierten al arrancar en un personaje con el nombre de su clase. La pantalla de "qué partida borrar" (`SaveSlotsScene`) se eliminó.
- **Código:** `scenes/CharacterSlotsScene.ts`, `config/characterSlots.ts`, `systems/CharacterStore.ts` (clave `hb-survivors.characters`, con versión), `data/characterSlots.ts`, `ui/TextInput.ts` (`<input>` invisible), `InputSystem.setKeyboardEnabled`, `PlayerState.Walk`, `RunSnapshot.characterUid`. Página nueva **Characters** en How to Play. Detalle en NOTES.md, "Personajes guardados (Fase 17A)".
- **Atajos nuevos:** `?open=slots`, `?characters=reset|demo` y situaciones `pnpm check slots` y `slotsempty`.
- **Comprobado:** build; `check menu game slots slotsempty open=select debug=resume` y `slots --mobile` sin errores (los 4 huecos caben en fila en el móvil). Prueba completa con Playwright: crear, jugar, guardar el mejor nivel, Continue, reanudar en el mismo nivel, borrar con confirmación y convertir una partida antigua en personaje. **Probado y aprobado por el propietario.**
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090 → Play.

**Fase 16, bloque 16B: tótems y cofres con carta (2026-10-18).**
- **Qué hace:** cada ~75 s (el primero al minuto) aparece una **Mana Stone** en un sitio libre al azar, a 320–900 px del jugador, con el "chin" de fabricar del original (E23). Hay como mucho 2 a la vez. Si nadie la coge en 60 s, parpadea y desaparece. Lleva a los pies un círculo mágico (Casting Circle) del color de su efecto, y el minimapa la marca con ese color. Se recoge pisando **cualquier casilla que tape el dibujo** (2×4 o 3×4; como mínimo 2×2, pedido por el propietario). Efectos: **Berserk** y **Defense Shield** (los buffs de antes), **Full HP** (cura entera, efecto Resurrection) y **Freeze** (los monstruos que se ven, jefes incluidos, quietos y azules 5 s: no andan, no atacan, no disparan ni llaman esbirros). Al cogerlo, su nombre sube sobre el jugador.
- **Cofres:** ya no dan buff; dan una **carta gratis** con el título "Treasure!" (sin subir de nivel). El del jefe final también, y sigue abriendo el portal. Las cartas de cofre pendientes se guardan en la partida (`chestCards`).
- **Código:** `data/totems.ts` (todos los números), `entities/Totem.ts`, `systems/TotemSystem.ts`, `Enemy.freeze()`, `BuffSystem.announce()`. Línea nueva en How to Play (Basics). Detalle en NOTES.md, "Tótems (Fase 16B)".
- **Atajo nuevo:** `?debug=totems` (los 4 en fila debajo del jugador) y situación `pnpm check totems`.
- **Descarga inicial:** +0,9 MB (`effect5.spr` y `manastone.spr`).
- **Comprobado:** Freeze congela los 95 monstruos de la pantalla y se pasa a los 5 s; Full HP cura del todo; el cofre abre "Treasure!" sin cambiar de nivel; partida simulada completa (nivel 26, jefe final muerto a las 14:06); móvil; build y `check menu totems pickups minimap` sin errores. **Probado y aprobado por el propietario.**
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play&debug=totems (y `?play&debug=pickups` para el cofre).

**Fase 16, bloque 16A: minimapa (2026-10-18).**
- **Qué hace:** cuadro arriba a la **derecha** (128 px; en el móvil 104 px y bajo el botón de pausa) con la zona de juego de Bleeding Isle en pequeño. Marca **solo** al jugador (punto blanco) y a los **jefes** (rojo, parpadea). Nada de monstruos normales, pociones ni cofres (decisión del propietario); los tótems se añaden en el 16B y los NPCs en mapas que los tengan (Fase 21). Casilla **Minimap** en Settings (activada de serie).
- **Código:** `ui/Minimap.ts` (lo crea `HudScene`), números en `data/minimap.ts`, imagen `minimap.bisle` en `assetManifest.ts` (`MINIMAPS`, `images/minimaps/bisle.jpg` de sp-client) y `minimap` en cada mapa de `data/maps.ts`. `BossSystem.tracked` da los jefes. Detalle en NOTES.md, "Minimapa (Fase 16A)".
- **Settings:** con la fila nueva no cabía "Back"; filas algo más juntas (`SETTINGS_MENU`: espaciado 34/30, primera fila más arriba).
- **Probar:** `pnpm --dir survivors check minimap [--mobile]` (o http://localhost:8090/?debug=god,boss). Comprobado en PC y móvil sin errores; build OK. Probado y aprobado por el propietario.

**Fase 15: revisión de código (`/revisar`, 2026-10-18).** 7 hallazgos pequeños. Arreglados: el atajo `?debug=aim` ya no se queda puesto al volver a jugar, comentario fuera de sitio en `GameScene`, y la división de pantalla del stick pasó a `TOUCH_AIM_ZONE_START` (`config/touch.ts`). Dejados a propósito (casi imposibles o solo de forma): un proyectil podría seguir a un jefe "de recambio" del mismo tipo que salga en el mismo frame; el stick de apuntar podría reutilizar una dirección vieja durante un frame; el `as EnemyDef` de `findNearestBoss`; `tools/spriteViewer.ts` largo (solo desarrollo).

**Fase 15, bloque 15C: stick de apuntar en el móvil (2026-10-18).**
- **Qué hace:** con la casilla **Aim Stick** (Settings, solo en pantallas táctiles, activada de serie), un dedo en la **mitad izquierda** mueve y otro en la **mitad derecha** abre un segundo stick **naranja** que apunta, como el stick derecho del mando (sale la misma flecha). Si el dedo vuelve al centro sin levantarse, se queda la última dirección; al soltarlo vuelve el automático. Con la casilla apagada, tocar en cualquier sitio mueve, como antes.
- **Esquina reservada:** abajo a la derecha (130×130 px, `TOUCH_RESERVED_CORNER`) no abre ningún stick: ahí irá el botón del crit (Fase 16). Ahora se siguen 3 dedos a la vez (`TOUCH_POINTERS`).
- **Código:** `ui/TouchJoystick.ts` sirve para los dos sticks (estilo y zona por parámetro); estilos en `config/touch.ts`; `InputSystem.setTouchAimStick`; los crea `GameScene`. Detalle en NOTES.md, "Stick de apuntar en el móvil".
- **Pantallas:** Settings en el móvil con filas algo más juntas para que quepa la nueva (`SETTINGS_MENU.itemSpacing` 33). How to Play: página Touch reescrita (mitad izquierda / derecha, casilla apagada) y línea de Basics que nombra la mitad derecha; en el móvil caben 6 filas por página, así que se juntaron filas en Touch y en Keyboard (esta ya se salía desde el 15B).
- **Atajo nuevo:** `?debug=aimstick` (con `--mobile`): dedo de mentira empujando el stick de apuntar a la derecha.
- **Comprobado:** dedos simulados con eventos táctiles reales (izquierdo mueve hacia arriba mientras el derecho apunta a la izquierda; al soltar el derecho vuelve el automático; la esquina no abre nada; con la casilla apagada, la derecha mueve); capturas de Settings, How to Play y la partida; build y `check menu game levelup` y `game --mobile` sin errores. **El propietario lo probó en su móvil y le parece bien.**
- **Cómo probar:** `pnpm --dir survivors dev` y abrir la dirección en el móvil (o Chrome en modo móvil): pulgar izquierdo mueve, pulgar derecho apunta; apagar "Aim Stick" en Settings para volver a lo de antes.

**Fase 15, bloque 15B: apuntado manual (2026-10-18).**
- **Qué hace:** mantener el **clic derecho** apunta todos los ataques hacia el cursor; el **stick derecho** del mando, hacia donde se empuja. Manda sobre el automático y sobre los jefes. Al soltar vuelve el automático en el acto. Solo atacan si hay algún enemigo al alcance (no hay tajos al aire). Triple Energy Bolt sale en abanico; Energy Strike cae en el cursor (como mucho a su alcance) o, con el stick, al 60% de su alcance en esa dirección. Flecha pequeña junto a los pies mientras se apunta (`ui/AimArrow.ts`).
- **Ratón:** ahora **solo el clic izquierdo** mueve y confirma (antes cualquier botón movía). Sin menú del navegador al hacer clic derecho (`disableContextMenu` en `main.ts`).
- **How to Play:** línea nueva en Basics y filas "Hold right click" (teclado) y stick derecho con icono "R" (mando).
- **Números:** `MANUAL_AIM` en `data/targeting.ts` (zona muerta del stick, abanico, flecha). Detalle técnico en NOTES.md, "Apuntado manual".
- **Atajo nuevo:** `?debug=aim` apunta a la derecha todo el rato (sin ratón).
- **Comprobado:** clic derecho real con Playwright (apunta al cursor, el personaje no se mueve, sin menú del navegador, al soltar vuelve el automático); con `?debug=aim` y jefe en pantalla, Guerrero y Maga atacan siempre a la derecha; en móvil no se activa; build y `check menu levelup boss` y `game --mobile` sin errores. **El stick derecho no se ha probado con un mando de verdad.**
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play, mantener el clic derecho en distintos sitios; con `?play&debug=boss,god`, apuntar lejos del jefe.

**Herramienta: visor de sprites (2026-10-18, fuera de las fases).**
- **Qué es:** página solo de desarrollo, http://localhost:8090/sprites.html con `pnpm dev`, para elegir diseños. Muestra todos los `.spr` de sp-client por categorías (armas y escudos, armaduras, otros objetos, hechizos y efectos, monstruos, personajes y NPCs, todos los archivos), con nombres sacados de los datos del cliente original. Al abrir uno se anima, con pose, dirección, hombre o mujer, velocidad, zoom y fondo; armas, escudos y armaduras se ven sobre el cuerpo.
- **Archivos:** `sprites.html`, `src/tools/spriteViewer.ts`, `scripts/spriteCatalog.ts` (catálogo servido por un plugin de `vite.config.ts` solo con `pnpm dev`). `readSprFile` sacado de `src/hb/HBSprite.ts` para leer `.spr` sin Phaser.
- **Privado:** no entra en el build ni en la web publicada (comprobado en `dist/`).
- **Comprobado:** build sin errores; `check menu game` sin errores; en el navegador, todas las categorías dibujan, y la Long Sword, una armadura, el Orc y un hechizo se animan sin errores de consola.

**Fase 15, bloque 15A: prioridad de jefes en el apuntado automático (2026-10-18).**
- **Qué hace:** todas las armas preguntan a `systems/Targeting.ts` a quién atacar. Si hay un jefe (Ettin, Demon, Wyvern) a menos de 250 px (`data/targeting.ts`) y al alcance del arma, va a por él; si no, al más cercano, como antes. Espadas: solo si el jefe está a su alcance (el tajo sigue dando a todo el arco). Triple Energy Bolt: 1 disparo al jefe (`AUTO_AIM.bossShots`) y los demás a los más cercanos. Energy Strike: cae alrededor del jefe.
- **Añadido sobre el plan:** los proyectiles lanzados a un jefe atraviesan a los demás monstruos y solo chocan con él (`Projectile.target`). Sin esto, los pequeños se comían los disparos.
- **Comprobado:** Maga a nivel 1 junto al Ettin, 20 s: de 67 a 396 de daño. Partida simulada, cuánto vive cada jefe (Ettin/Demon/Wyvern), Guerrero 28 s/49 s/1:50 → 31 s/51 s/2:02 y Maga 42 s/41 s/3:33 → 43 s/75 s/1:36. No dice mucho: el jugador simulado huye del jefe. Niveles por partida sin cambio (26–27). Build y `check menu boss finalboss` sin errores.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=mage&debug=god,boss, quieto: al acercarse el Ettin, los rayos atraviesan a los pequeños y su barra baja sin parar; al alejarte vuelven a los cercanos. Con `?play=warrior&debug=god,boss`, la espada solo va a por él cuando está pegado.

**Fase 14 completada (2026-10-18)**: bloques 14A (métricas) y 14B (logros). Fusionada en `master`, etiqueta `fase-14` y publicada en https://nicolasraviolo.github.io/helbreath-survivor/. Base de datos de métricas vaciada de pruebas al publicar. Siguiente: `/fase 15`.

**Fase 14, bloque 14A: métricas anónimas (2026-10-18, el propietario lo probó y funciona). Cierra la Fase 14.**
- **Servidor** `metrics-server/`: Cloudflare Worker + base de datos D1 en la cuenta del propietario, https://helbreath-survivors-metrics.nicolasraviolo.workers.dev. `POST /run` guarda una partida (solo desde github.io o localhost, máx. 8 KB, cada campo comprobado, sin IP). La raíz es la página de gráficas, con clave (secreto `DASHBOARD_KEY`; copia local en `metrics-server/.dev.vars`, fuera de git).
- **Qué se envía** (`config/metrics.ts`, recogido por `systems/RunMetrics.ts`): versión, mapa, clase, móvil u ordenador, resultado (win, death, quit), duración, nivel, bajas, qué te mató, equipo final, cartas elegidas, nivel al final de cada minuto, daño recibido por monstruo, vida más baja, pociones, jefes (llegada, muerte, golpe más fuerte), FPS medios y del 10% más lento. Zem y crits van a 0 hasta las Fases 16 y 17.
- **Cuándo:** al ganar, morir o "Quit to menu". Nunca en la partida simulada; en `pnpm dev` solo con `?metrics=send`. Lo recogido viaja en la partida guardada, así Continue no lo pierde.
- **Settings:** casilla "Anonymous Stats" (activada de serie) y debajo "Only used to tune the difficulty. Nothing personal, nothing else." Filas de Settings un poco más juntas para que quepa.
- **Gráficas:** totales (victorias, abandonos, pociones, vida más baja media), victorias por clase, muertes por minuto, quién mata y quién hace más daño, cartas más elegidas, vida más baja, FPS por dispositivo, nivel medio por minuto y clase, tabla de jefes y las últimas 50 partidas. Filtro por versión.
- **Comandos:** `pnpm metrics:types` (tipos del Worker, tras clonar), `pnpm metrics:check`, `pnpm metrics:deploy`. Para ver la página en local con datos de mentira: `metrics-local` en `.claude/launch.json` (puerto 8787, clave `localtest`).
- **Comprobado:** `build` sin errores; `check menu game open=settings` (PC y móvil) sin errores; partidas reales con `?metrics=send` (muerte por Ettin, abandono) llegan a la base de datos con todos los datos; Continue conserva lo recogido; la página rechaza la clave mala y dibuja todo. Pruebas borradas de la base de datos.

**Fase 14, bloque 14B: logros (2026-10-18, el propietario lo probó y le gusta).**
- **14 logros** (`data/achievements.ts`): Survivor/Veteran (5 y 10 min), Rising Star/Legend (nivel 20 y 30), Slayer/Massacre (1.000 y 3.000 bajas), Ettin Slayer, Demon Hunter, Dragon Slayer, Island Conqueror (ganar en Bleeding Isle), Path of the Blade/Path of Magic (ganar con cada clase), Iron Will (ganar sin pociones), Fully Armored (todas las piezas de armadura de la clase).
- **Guardado:** `systems/AchievementStore.ts`, clave `hb-survivors.achievements` con versión; se guarda el id y la fecha. Las pociones bebidas van en la partida guardada (`potionsDrunk`).
- **En partida:** `systems/AchievementTracker.ts` mira tiempo, nivel, bajas y armadura cada 0,5 s; jefes y victoria los avisa GameScene. Apagado en la partida simulada. Al morir el Wyvern mueren todos, y un Ettin o Demon vivos también cuentan.
- **Aviso:** abajo a la izquierda del HUD, "Achievement unlocked!" + nombre, con sonido (`sfx.buff`); si salen varios, uno detrás de otro, y espera mientras la partida está en pausa (cartas). En la pantalla de victoria/derrota, línea "Achievements: ..." con los de esa partida.
- **Pantalla Achievements:** "N / 14 unlocked", dos columnas, conseguidos primero en dorado y pendientes en gris; páginas con ◄ ► (2 en PC, 3 en móvil).
- **Pruebas:** `?achievements=reset|all`, `?open=achievements`, situaciones `achievements` (con `--cards`, opción nueva del script que elige cartas sola) y `achievementlist`. Comprobado: aviso al nivel 21, victoria con 8 logros, pantalla en PC y móvil, pociones tras Continue, build sin errores.

: equilibrio y versión en el menú (2026-10-18, el propietario lo probó y le gusta). Cierra la Fase 13.**
- **Versión en el pie del menú principal:** "Phase 13" (`config/version.ts`). `/fase N` la cambia al empezar cada fase.
- **Partida simulada** (`?debug=sim`, `systems/SimRun.ts`; `pnpm check levelpace`): invencible, corre en círculos, va a por los jefes (y se rinde si se atasca), cartas al azar, ~100× más rápido. Informe: nivel y XP por minuto, cuánto vive cada jefe, su golpe más fuerte frente a la vida del jugador, arma y stats finales.
- **Curva de XP:** antes una recta (se llegaba al nivel 100). Ahora 15/30/50/80 para los 4 primeros niveles y desde el 5, 150 × 1,24 por nivel. **XP de monstruo = vida/5** (más diferencia entre débiles y fuertes); jefes 250/500/1200. **Gema nueva:** diamante desde 60 XP (zafiro desde 5, rubí desde 15).
- **Final sin cartas:** al morir el Wyvern toda la XP vuela sola y los niveles suben sin cartas (con su sonido); la victoria ya decía el nivel.
- **Vit cura poco a poco:** 0,02 de vida por segundo por punto de Vit (`HP_REGEN_PER_VIT`); la carta de Vit lo dice.
- **Jefes:** sin empuje (`knockbackTaken: 0`), golpes más suaves (`damageScale`: Ettin 0,7, Demon 0,75, Wyvern 0,35; bolas de fuego 9) y menos vida (Ettin 1.600, Demon 4.000, Wyvern 10.000), pedido del propietario: retador pero sin matar en 1–2 golpes.
- **Resultado medido:** Mago nivel 27, jefes en 30 s–1:50, golpe máximo ~27–32% de su vida; Guerrero nivel 24–26, Wyvern en ~5 min, golpes ~10–16%.
- **Comprobado:** `build` sin errores; `check menu game levelup finalboss portal levelpace` y `menu --mobile` sin errores; tras `bosskill` no salen cartas; la Vit cura (prueba con `--eval`).
- **Cómo probarlo:** `pnpm --dir survivors dev` → http://localhost:8090 (pie del menú) y una partida normal; http://localhost:8090/?debug=bosskill para el final.

**Fase 13, bloque 13B: monstruos por mapa (2026-10-18, el propietario lo probó y le gusta).**
- **Tres grupos:** esenciales comunes a todos los mapas (`ESSENTIAL_ENEMIES` en `data/enemies.ts`, de más débil a más fuerte: Slime, Ant, Snake, Orc, Mage-Orc, Zombie, Scorpion, Skeleton, Clay Golem, Stone Golem, Giant Frog), los propios de cada mapa (`localEnemies` en `data/maps.ts`; Bleeding Isle: Cyclops, Mountain Giant, Ogre, Cannibal Plant) y sus jefes (`bosses`: Ettin, Demon, Fire Wyvern). `data/waves.ts` comprueba al cargar que las oleadas solo usen esos; los demás monstruos (Bunny, Troll, Werewolf, Lich, Gargoyle…) quedan en `enemies.ts` para otros mapas y ya no se descargan.
- **5 monstruos nuevos** con su comportamiento del NPC.cfg: Mage-Orc (sprite y sonidos del Orc; bolas de fuego lentas, alcance 5), Clay Golem, Stone Golem, Mountain Giant y Cannibal Plant. Vida y XP de los esenciales reordenadas según el orden del propietario (XP provisional hasta el 13C).
- **Oleadas nuevas** de Bleeding Isle (6 tramos, cortes en 1,5 / 3,5 / 5,5 / 7,5 / 9,5 min): esenciales por orden de poder y, desde el 5:30, los del mapa con poco peso. Rodeos con serpientes, esqueletos ("The dead rise around you!") y Stone Golems. Esbirros del Wyvern: Stone Golems y ranas.
- **Estampida** (evento `stampede`, idea de la guía de hordas): un bloque de 3 filas sale de un lado, alineado con el jugador, y cruza la pantalla en línea recta 3,5× más rápido (`SPAWN.stampede`, `Enemy.charge`). Si choca con el jugador, le pega; después persigue normal. Orcos en el 4:30 ("Orc stampede!") y ranas en el 9:30.
- **Atajo nuevo:** `?debug=stampede` (espera a que el monstruo esté descargado) y `pnpm check stampede`.
- **Comprobado:** `build` sin errores; `check game boss finalboss stampede` sin errores; con `--eval`, los 5 nuevos andan, atacan y el Mage-Orc dispara; captura ampliada: se dibujan bien.
- **Cómo probarlo:** `pnpm --dir survivors dev` → http://localhost:8090/?play (a mitad de partida, golems y Mage-Orcs; tecla J = +1 minuto) o http://localhost:8090/?debug=god,stampede.

**Fase 13, bloque 13A: jefe final y portal (2026-10-18, el propietario lo probó y va bien).**
- **El jefe final corta las oleadas** (`SpawnSystem.wavesOver`): desde que sale el Fire Wyvern no salen monstruos de las oleadas. Se quitó la oleada de goteo del minuto 12.
- **Esbirros** (`BOSS_MINIONS` en `data/enemies.ts`, `BossSystem`): el Wyvern llama 6 monstruos cada 8 s en un anillo a su alrededor (máximo 24 vivos): Hellhounds y esqueletos.
- **Dark Elf desactivado** (pedido del propietario: sus flechas eran molestas y desequilibradas). En el minuto 8 y como esbirros salen esqueletos. Sus datos siguen en `enemies.ts`.
- **Al morir el jefe final:** mueren todos los monstruos (cuentan como bajas y sueltan su XP, que **no** vuela sola) y cae un **cofre grande** (`finalChest`) con el aviso "Open the chest to leave!".
- **Al coger el cofre:** da un buff y, 1 s después, se abre el **portal** (`entities/Portal.ts`, efecto `fx.portal` = Portal 1 de sp-client) a 90 px a un lado. Arriba sale "Enter the portal: 30". Entrar en él o esperar 30 s → **Victory!** La XP que quede en el suelo se pierde (decisión del propietario).
- **Guardado:** `finalBossDead` y `portalMsLeft` en la partida guardada. Al continuar, el cofre (o el portal con su tiempo) aparece junto al jugador, sin monstruos.
- **Arreglo:** la tecla K (matar los visibles) ahora cuenta como golpe real; antes el jefe final no soltaba nada.
- **Atajos nuevos:** `?debug=finalboss` (salta al jefe final) y `?debug=bosskill` (lo mata en cuanto sale); situaciones `pnpm check finalboss` y `pnpm check portal`. Números en `data/waves.ts` (`PORTAL`).
- **Comprobado:** `build` sin errores; `check menu game finalboss portal` sin errores (también `portal --mobile`); con `--eval`: solo esbirros con el Wyvern vivo, cofre → portal a 90 px, Victory al entrar y al acabar el tiempo, Continue antes y después de abrir el cofre.
- **Cómo probarlo:** `pnpm --dir survivors dev` → http://localhost:8090/?debug=god,finalboss (pelea) o http://localhost:8090/?debug=god,bosskill (final directo: buscar el cofre, cogerlo y entrar en el portal).

**Cambio de mapa a Bleeding Isle (2026-10-18, entre las Fases 12 y 13; el propietario lo probó y le gusta).**
- **Motivo:** huntzone2 tenía muchas colisiones (río, ruinas, acantilados). Se adelanta solo el cambio de mapa; la Fase 19 (varios mapas, Select Map) sigue pendiente.
- **Bleeding Isle** (`bisle.amd`, registrado como `map.bisle`): zona de juego **150×150 casillas desde (66,52), 95% libre**, todo conectado. Se midieron 100 (99%), 150 (95%) y 200 (81%, entra la costa); el propietario eligió 150.
- `data/maps.ts`: `DEFAULT_MAP = 'bisle'`; huntzone2 queda comentado. Las partidas guardadas en huntzone2 continúan en Bleeding Isle (SaveStore usa `DEFAULT_MAP` si el mapa ya no existe; no se guarda la posición).
- Las fightzones (arenas) se descartaron: 6% libre o pasillos estrechos (NOTES.md).
- **Comprobado:** `build` sin errores; `check menu game debug=resume` en PC y horda + jefe en móvil, sin errores (~124 FPS).
- **Cómo probarlo:** `pnpm --dir survivors dev` → http://localhost:8090/?play

**Fase 12 completada (2026-10-18)**: fusionada en `master`, etiqueta `fase-12`. Siguiente: Fase 13 (Jefe final y equilibrio).

**Fase 12, bloque 12C: Settings táctil (2026-10-18, el propietario lo probó y le gusta).**
- **Settings más grande** (el panel de Credits) y filas más juntas (`SETTINGS_MENU` en `config/menus.ts`): todo cabe dentro del marco, también en el móvil con HUD y Fullscreen (antes HUD y Back se salían y "Compact" pisaba las flechas).
- **Casillas** para Health Bar on Character, Screen Shake y Fullscreen (`MenuList`, propiedad `checked`; dibujadas con `Graphics`, el original no tiene sprite de casilla). Un toque en la fila la cambia; con teclado/mando, Enter o ←/→.
- **Volumen:** se probó una barra deslizante; el propietario prefirió **las flechas con el número**, como antes.
- **Large Trees: solo On / Off.** On = el árbol se vuelve transparente al pasar por detrás (como siempre). Se quitó el modo Transparent; un valor guardado así se carga como On.
- **Fullscreen:** casilla en Settings, opción en la Pausa (se queda) y **icono pequeño arriba a la derecha** del menú principal (sale de la lista). En la app instalada no aparece en ningún sitio (`ui/fullscreen.ts`). How to Play actualizado.
- **Comprobado:** `build` sin errores; `check menu game open=settings` en PC y móvil sin errores; en Playwright: clic en casilla, teclado (↑/↓, Enter, ←/→) e icono de pantalla completa (entra y sale).
- **Cómo probarlo:** `pnpm --dir survivors dev` → http://localhost:8090/?open=settings (en el móvil, `&ui=compact`).

**Fase 12, bloque 12B: guardar la partida, pausa automática y Continue (2026-10-18).**
- **Hasta 3 partidas guardadas** en el navegador (`systems/SaveStore.ts`, números en `data/saves.ts`). Guardan nombres (clase, mapa, arma, hechizo, armadura, pasivas, buffs, jefes vivos), stats, nivel, XP, cartas pendientes, vida, bajas y minuto. Llevan número de versión y `migrate()` para cambiar el formato sin borrar nada (decisión del propietario: debe poder crecer con más armas, niveles e inventario).
- **Cuándo se guarda:** cada 5 s de juego, al elegir carta, al pasar la pestaña a segundo plano (`visibilitychange` / `pagehide`) y al salir al menú. **Se borra** al ganar o morir.
- **Pausa automática** (`HudScene`) al pasar la pestaña a segundo plano: al volver, el menú de pausa está abierto.
- **Continue** arriba del todo del menú principal si hay alguna partida: abre `SaveSlotsScene` con la lista ("Warrior   Lv 14   8:32"). **Play con las 3 ranuras llenas** pide elegir cuál borrar y confirmar ("Yes, delete it" / "No").
- **Al continuar:** el reloj sigue en ese minuto, los eventos ya pasados no se repiten, 5 s sin monstruos y después vuelven los jefes que estaban vivos (con su aviso). No se guardan monstruos, gemas ni objetos del suelo (límite aceptado).
- **Atajo nuevo:** `?debug=...,resume` guarda y recarga la partida como con Continue.
- **Comprobado:** `build` sin errores; ida y vuelta con `resume` (nivel, stats, vida, arma, armadura, pasivas, buff con su tiempo, Ettin vuelve tras la calma); en Playwright: Continue en el menú, lista, elegir con teclado carga la partida, pausa y guardado al ocultar la pestaña, Play con 3 ranuras → confirmar → borra y abre la selección; al terminar la partida la ranura se libera; `check menu game levelup boss` y `menu game --mobile` sin errores.
- **Cómo probarlo:** `pnpm --dir survivors dev` → http://localhost:8090, jugar un poco, cerrar la pestaña y volver a abrirla → **Continue**. Cambiar de pestaña y volver → el juego está en pausa.

**Fase 12, bloque 12A: instalar como app (2026-10-18).**
- **Manifiesto, service worker e iconos** en `survivors/pwa/` (solo en el build, vía el plugin `installableApp` de `vite.config.ts`). Pantalla completa, horizontal, fondo negro, icono con la "H" dorada (`scripts/make-icons.mjs` lo dibuja desde `pwa/icon.svg`).
- **Actualización sola:** el service worker pide siempre la página a internet primero; el código lleva hash en el nombre. Sin conexión solo queda la última página guardada (el juego no funciona offline).
- **Opción "Install"** al final del menú principal (`ui/install.ts`), solo cuando Chrome lo ofrece (`beforeinstallprompt`); desaparece al usarla o al instalar. El menú se rehace si el aviso llega con él abierto (`MenuList.destroy()`), y con 7 opciones las filas se juntan para caber en el marco.
- **Comprobado:** `build` sin errores; `check menu` en PC y móvil sin errores; con `vite preview` + Chrome, `Page.getInstallabilityErrors` = sin errores y el manifiesto sin errores; captura del menú con Install revisada.
- **Cómo probarlo:** solo en la web publicada (https) o en `pnpm --dir survivors build` + `pnpm --dir survivors preview` → http://localhost:4173 en el PC. En el móvil con Chrome: sale "Install" en el menú (o ⋮ → "Añadir a pantalla de inicio"); abrir desde el icono → pantalla completa y en horizontal.

**Fase 11 completada (2026-10-18)**: fusionada en `master`, etiqueta `fase-11`. Siguiente: Fase 12 (Móvil sin pérdidas).

**Fase 11: pulido de interfaz (2026-10-18, el propietario la probó y le gusta).**
- **Settings → Large Trees: On / Transparent / Off** (`config/settings.ts`, `hb/mapRenderer.ts` → `MapView.setTreeMode`). On = como antes (el árbol que tapa al jugador ya se volvía medio transparente, como en el original). Transparent = todos los árboles grandes a alfa 0,35 (`TREE_TRANSPARENT_ALPHA` en `config/gameConfig.ts`). Off = sin árboles ni sombras. Muros y casas no cambian. Se aplica al momento, también desde la pausa.
- **Fuera los textos de controles** de las cartas de nivel, el menú principal y el fin de partida.
- **How to Play** (`scenes/HowToPlayScene.ts`, textos en `data/howToPlay.ts`), en el menú principal y en la pausa: páginas Basics, Keyboard, Gamepad (iconos de Xbox dibujados con código) y Touch, que se cambian con ◄ ►. Todo control nuevo se explica aquí. La letra de los menús no tiene "&": nombres de página solo con letras. `MenuList` admite `valueBoxWidth` para valores largos.
- **Menú principal:** filas más juntas (32 / 37 px) para que quepan 6 opciones en el panel.
- **Selección de personaje en el móvil:** zonas de toque de 60 px de alto en los botones (`SELECT_BUTTON_HIT_PAD`) y textos de 17–18 px. Es la imagen original de 640×480: los textos no pueden crecer más sin rehacer la pantalla.
- **Atajos nuevos** (`config/debugStart.ts`): `?trees=off|transparent|on` (solo esa partida, sin guardar) y `?open=howtoplay|settings|credits|select`. `pnpm check` espera a la pantalla abierta.
- **Comprobado:** `build` sin errores; `check menu levelup trees=off open=howtoplay` en PC y `open=select levelup --mobile`, sin errores de consola. Capturas revisadas de árboles, How to Play (todas las páginas), menú y selección en móvil.
- **Cómo probarlo:** `pnpm --dir survivors dev` → http://localhost:8090/?open=howtoplay, http://localhost:8090/?trees=off o Esc → Settings → Large Trees.

**Fase 10 completada (2026-10-17)**: bloques 10A (todo más grande en el móvil), 10B (HUD elegible) y 10C (temblor, partículas y sonidos). Fusionada en `master`, etiqueta `fase-10` y publicada en https://nicolasraviolo.github.io/helbreath-survivor/. Siguiente: la segunda etapa (`docs/PLAN-2.md`).

**Fase 10, bloque 10C: sensación de impacto (2026-10-17, el propietario probó el temblor y pidió ajustarlo).**
- **Temblor de cámara** (`systems/ScreenShake.ts`, números en `data/feedback.ts`). Reglas decididas por el propietario:
  - cualquier golpe o flecha: temblor suave (2 px);
  - golpe o bola de fuego de un jefe: más fuerte (6 px);
  - explosiones grandes de tus hechizos (Fire Ball, Fire Strike, Mass Fire Strike y Energy Strike, campo `impactShakePx`): solo si el golpe principal es crítico, y como mucho una vez cada 2,5 s.
  - Con la primera versión (todas las explosiones cercanas) el temblor era constante y molesto.
- **Settings → Screen Shake: On / Off**, en PC y móvil. Se guarda en el navegador y viene encendido.
- **Partículas** (`systems/HitParticles.ts`): chispas que saltan del monstruo al golpearlo, en dirección contraria al golpe. Al morir, una nube de polvo a sus pies y unas chispas. Las texturas se dibujan en el código (el original no tiene nada parecido). Phaser recicla las partículas; máximo 220 vivas por tipo en PC y 90 en el móvil.
- **Destello original (`fx.hit`) también con los hechizos**, sobre el monstruo alcanzado (antes solo con los tajos).
- **Sonidos nuevos (pedidos por el propietario):** muerte del jugador (C14 Guerrero, C15 Maga, como en el original) y subida de nivel, al abrir las cartas. sp-client no lo trae: son las voces originales (hombre y mujer) que aportó el propietario.
- **Assets propios:** carpeta `survivors/custom-assets/` (misma estructura que los assets de sp-client). En desarrollo la sirve un plugin de `vite.config.ts` y en el build la copia `sync-assets`. Se añadió `@types/node` para tipar `vite.config.ts`.
- **`pnpm check --eval`** ahora espera si la expresión devuelve una promesa, así se puede vigilar la partida unos segundos.
- **Comprobado:** `build` sin errores; `check menu levelup horde boss` en PC y `horde --mobile`, a ~116 FPS y sin errores de consola. Partículas vistas (hasta 43 a la vez). Temblor medido: 2 px con golpe normal y 6 px con golpe de jefe; la pausa de 2,5 s entre explosiones funciona; los sonidos de muerte y de subida de nivel suenan.
- **Cómo probarlo:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&debug=horde. Deberías ver chispas al golpear y polvo al matar, y la pantalla debería temblar un poco al recibir golpes. Con `?debug=boss` el temblor del jefe es más fuerte. Settings → Screen Shake → Off lo quita.

**Fase 10, bloque 10B: interfaz de partida elegible en el móvil (2026-10-17, probado por el propietario en su móvil: OK).**
- **Nueva opción en Settings → HUD: Classic / Compact.** Solo sale en el móvil; en el PC siempre está la barra clásica y la opción no aparece. Se guarda para la próxima vez.
- **Compact (la que sale por defecto en el móvil):** no hay barra abajo y se ve más mapa.
  - Arriba a la izquierda: barras de vida, maná y experiencia con piezas de la interfaz "V2" del original (`dialogsv2.spr`), y debajo nivel, tiempo y bajas.
  - Arriba a la derecha: botón de stats (casco) junto al de pausa.
  - La barra del jefe se coloca entre los dos. Los buffs siguen abajo a la derecha, más pegados al borde.
- **Ajuste del 17-oct (pedido del propietario):** las barras compactas pasan a estar **abajo, en fila** (vida, maná y experiencia una al lado de otra), con un 25 % de transparencia. Nivel, tiempo y bajas, justo encima. Buffs, panel de stats y el texto "Tap a card" se colocan por encima de la fila. Si se quiere volver a ponerlas arriba a la izquierda, basta con cambiar `HUD_COMPACT_LAYOUT` en `config/hud.ts`.
- **Classic:** la barra de abajo del bloque 10A.
- **Cambiar en plena partida:** desde la pausa (Pause → Settings → HUD). Al volver al juego, la barra y la zona de juego ya han cambiado.
- **Código:** `ui/ClassicHud.ts` y `ui/CompactHud.ts`. La elección vive en `ui/hudLayout.ts` y las medidas en `config/hud.ts` (`HUD_COMPACT`). `dialogsv2.spr` (2,3 MB) solo se descarga en el móvil.
- **Comprobado** con Chrome sin ventana simulando un móvil (844×390, táctil): partida, stats, jefe, buffs, cartas, ajustes y cambio de barra en plena partida. En PC, igual que antes. Sin errores en la consola; `tsc` y `build` sin errores.
- **Cómo probarlo:** en el móvil, abre `http://192.168.1.42:8090` y empieza una partida, que sale con la barra compacta. Pulsa II → Settings → HUD → Classic → Back → Resume: debería verse la barra de abajo.

**Fase 10, bloque 10A: que todo se lea bien en el móvil (2026-10-17, probado por el propietario en su móvil: OK).**
- **Modo móvil** (`src/config/device.ts`): se activa solo en pantallas táctiles pequeñas (lado corto ≤ 600 px). En el PC no cambia nada.
  - Para verlo en el PC: añade `?ui=compact` a la dirección. Para ver la versión de PC en el móvil: `?ui=normal`.
- **Letras:** un 30–35 % más grandes en el móvil (`UI_FONT_SIZE` en `config/ui.ts`). En todos los dispositivos se dibujan a la resolución real de la pantalla, así que se ven más nítidas.
- **Menús:** opciones más grandes y con más sitio para el dedo. El panel de pausa y ajustes es más ancho. Bajo el menú pone "Tap an option" en lugar de las teclas.
- **Barra inferior:** un 25 % más grande en el móvil (cabe porque el dibujo original tiene madera vacía en los lados). Los botones siguen funcionando al tocarlos.
- **Cartas de subida de nivel:** más anchas y con texto más grande. Abajo pone "Tap a card".
- **Game Over** ("Tap a button"), panel de stats, avisos de jefe y mejoras activas: también más grandes.
- **Selección de personaje:** solo un poco más grande, porque las cajas del dibujo original son pequeñas.
- **Comprobado** en el navegador integrado simulando un móvil (menú, ajustes, créditos, pausa, partida, stats, cartas, Game Over) y en PC (igual que antes). Consola limpia; `tsc` y `build` sin errores.
- **Cómo probarlo:** con el ordenador encendido, abre en el móvil `http://192.168.1.42:8090`, con la misma wifi y el móvil en horizontal.

**Fase 9 completada (2026-10-17)**: el juego está publicado y el propietario lo ha probado en PC y móvil. Siguiente: `/fase 10` (pulido, opcional), empezando por agrandar letras y menús en el móvil.
- **Enlace principal:** https://nicolasraviolo.github.io/helbreath-survivor/ (GitHub Pages).
- **Se actualiza solo** al subir a `master` (`.github/workflows/pages.yml`).
- **Cloudflare Pages: despublicado** el 17-oct-2026 por decisión del propietario, para mantener el proyecto discreto (*low profile*). La guía sigue en `docs/PUBLICAR.md` por si se quiere volver a usar.
- **Checkpoint 2026-10-17:** `tsc` y `build` sin errores. En el juego publicado, ningún archivo da error y la consola está limpia.

**Fase 9, bloque 9B: descarga y publicación (2026-10-17).**
- **Publicado en Cloudflare Pages:** https://helbreath-survivor.pages.dev. El despliegue sale bien, pero la red del propietario (wifi y datos móviles) bloquea esas IPs de Cloudflare, seguramente por LaLiga. Comprobado: con otra IP de Cloudflare el juego responde bien.
- **Copia en GitHub Pages** (`.github/workflows/pages.yml`, creada con permiso del propietario): https://nicolasraviolo.github.io/helbreath-survivor/. Probada en local desde una subcarpeta (`survivors-preview-subpath`, puerto 8092).
- El propietario activó Pages en GitHub y probó el enlace en PC y móvil: funciona.
- **`scripts/sync-assets.mjs`:** copia a `survivors/public/assets` solo los archivos de `assetManifest.ts` (185 archivos, 87,6 MB con todas las casillas). Si falta alguno, falla.
  - `pnpm build` lo ejecuta solo. En el build, Vite usa `public/` y lo mete en `dist/`; en desarrollo sigue sirviendo `sp-client/public`.
- **Monstruos por oleada** (`systems/AssetStreamer.ts`):
  - antes del menú solo se cargan los de la primera oleada (Slime, Bunny, Ant);
  - el resto se descarga uno a uno en segundo plano desde el menú principal, en el orden en que aparecen;
  - un monstruo que no está listo no sale, y un evento (jefe, "te rodean") espera a su monstruo y le hace pasar delante en la cola.
  - **Descarga antes del menú: de 50 a 35 MB.** El resto (15 MB) tardó unos 4 s en el PC.
  - Comprobado saltando al minuto 12 nada más empezar: los eventos esperan al Wyvern y salen en orden.
- **La tecla T** (prueba de sprites) solo abre la escena cuando el Orc ya está cargado.
- **Icono de la pestaña:** una "H" dorada dibujada dentro de `index.html`. Ya no hay 404 de `favicon.ico`.
- `package.json` fija `pnpm@12.14.0` (lo necesita Cloudflare).
- **Comprobado con `pnpm build` + `pnpm preview`** (`survivors-preview` en `.claude/launch.json`, puerto 8091): el juego publicado carga, ningún archivo da error y la consola está limpia.
- **Para bajar más la descarga** (opcional): cargar más tarde también armas y armaduras del jugador (10,5 MB) y efectos (5 MB).

**Fase 9, bloque 9A: jugar en el móvil (2026-10-17, probado por el propietario en su móvil).**
- **Joystick táctil flotante** (`ui/TouchJoystick.ts`, `config/touch.ts`):
  - aparece donde pones el dedo en la zona de juego y desaparece al soltarlo;
  - si el dedo se aleja mucho, la base lo sigue;
  - fuerza de 0 a 1, como el stick del mando;
  - `InputSystem.setTouchJoystick` lo usa para moverse.
  - **También funciona en las franjas negras de los lados** (pedido por el propietario tras probarlo en su móvil). Allí no se puede dibujar, así que la base se ve pegada al borde del juego.
  - Solo en pantallas táctiles.
- **Botón de pausa táctil** (círculo "II" arriba a la derecha, en `HudScene`). Funciona con otro dedo mientras mueves: el juego sigue 2 dedos a la vez (`TOUCH_POINTERS`).
- **Móvil en vertical:** aviso "Rotate your device to play" (HTML/CSS en `index.html`) y la partida se pausa sola.
- **Opción Fullscreen** en el menú principal y en la pausa (`ui/fullscreen.ts`). En Android también deja el móvil fijo en horizontal. En iPhone no sale, porque Safari no lo permite.
- `index.html`: el navegador no hace zoom ni desplaza la página al arrastrar el dedo. El juego está en inglés (`lang="en"`).
- **Servidor accesible desde el móvil** en la misma wifi (`host: true` en `vite.config.ts`).
- **Comprobado** en el navegador integrado, simulando un móvil:
  - en vertical sale el aviso;
  - en horizontal, el joystick mueve al jugador, tocando dentro del juego y también en la franja negra;
  - el botón de pausa funciona con un segundo dedo;
  - Resume se pulsa tocando;
  - girar a vertical pausa la partida;
  - en PC no se ve nada táctil;
  - consola limpia y `tsc` sin errores.
- **Sin hacer todavía:** bajar el límite de enemigos en el móvil. Primero hay que ver cómo va en tu móvil.
- **Cómo probar:**
  1. `pnpm --dir survivors dev`.
  2. En el móvil, con la misma wifi, abre **http://192.168.1.42:8090**.
  3. Pon el móvil en horizontal.
  4. Prueba Fullscreen, mueve con el dedo, pausa con el botón "II" y gira el móvil.

**Fase 8 completada (2026-10-17)**: menús, probada por el propietario. El Arquero queda para el futuro (decidido por el propietario). Siguiente: `/fase 9` (web, móvil y publicación).
- **Checkpoint 2026-10-17:** `tsc` y `build` sin errores; consola limpia en el navegador integrado (Playwright estaba ocupado por otra sesión).
- **Pendiente para el futuro:** el Arquero (tercer personaje, con arcos `mbo`/`wbo`), los logros de verdad y elegir sexo, piel y pelo en la selección de personaje.
- **Menú principal** (`scenes/MainMenuScene.ts`, `config/menus.ts`): es lo primero que sale tras cargar.
  - Fondo: la pantalla de título original (`new-dialog.spr` hoja 1).
  - Un panel del original tapa sus botones dibujados. Una franja negra abajo tapa la línea "PlayHelbreath.com" y lleva nuestro pie.
  - Opciones: **Play**, **Achievements**, **Settings** y **Credits**, con la fuente dibujada del original.
  - Música: `default.mp3`.
- **Base común** (`scenes/MenuOverlayScene.ts`, `ui/MenuList.ts`): para las pantallas que se abren encima.
  - Oscurece lo de debajo y pone el panel `gamedialog86` hoja 3, frame 3, con el título.
  - Controles: ↑/↓ o cruceta/stick para moverse, ←/→ para cambiar un valor, Enter/A para elegir, Esc/B para volver. Con el ratón: pasar por encima y clic.
- **Settings** (`scenes/SettingsScene.ts`, `config/settings.ts`, `systems/Settings.ts`):
  - volumen de música y de efectos, de 10 en 10 %;
  - **Health Bar on Character**, On/Off (renombrada tras la prueba del propietario).
  - Los valores se cambian con los botones ◄ ► del original (`gamedialog86` hoja 1, frame 7; el ► es el mismo, volteado). El clic funciona justo sobre cada flecha: antes la zona era media fila y había que hacer clic muy lejos (corregido tras la prueba del propietario).
  - Se aplican al momento, también con la partida en pausa, y se guardan en el navegador (`localStorage`).
- **Credits**: el aviso legal de DESIGN.md (`data/credits.ts`).
- **Achievements**: solo "Coming soon!" de momento (pedido por el propietario para el futuro).
- **Pausa de verdad** (`scenes/PauseScene.ts`), que sustituye a la provisional de la barra.
  - Se abre con Esc, Start o el disquete. **Se abre sola si se desconecta el mando** en plena partida.
  - Opciones: Resume, Settings y Quit to menu.
- **Conexiones:**
  - Cancel o Esc/B en la selección de personaje vuelven al menú.
  - En el Game Over hay un tercer botón original, **Log Out**, que lleva al menú.
- **Entrada:** acciones nuevas `Back` (Esc, Retroceso, B), `MenuUp` y `MenuDown` (también con el stick).
  - Un botón que sigue pulsado al cambiar de pantalla, o al volver de una pausa, ya no cuenta como pulsación nueva.
- **Comprobado** con el navegador integrado (Playwright estaba ocupado por otra sesión):
  - menú → Settings (los cambios se guardan) → Credits → Achievements;
  - Play → Create → partida → pausa → Settings desde la pausa (la barra de vida se oculta y se muestra al momento) → Resume;
  - pausa por mando desconectado → Quit to menu;
  - Game Over → Log Out;
  - consola sin errores; `tsc` y `build` sin errores.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090.

**Fase 7 completada (2026-10-17)**: oleadas, jefes y final, probada por el propietario. Skill `/anadir-enemigo` creada (2026-10-17). Siguiente: `/fase 8` (menús y personajes).
- **Checkpoint 2026-10-17:** `tsc` y `build` sin errores; Playwright: consola limpia (solo el 404 de `favicon.ico`).
- **21 monstruos nuevos** (`data/enemies.ts`, sprites y sonidos de `sp-client` Monsters.ts).
  - Vida, daño y XP siguen el orden de los tiers de la wiki, comprimido para 12 minutos.
  - Animaciones especiales: Frog (andar = frames 3–7) y Fire Wyvern (morir = hojas 16+, opacidad).
  - `HBAsset.playDirectional` admite usar solo parte de los frames de una hoja.
  - Tigerworm y Wyvern no tienen sonido de golpe en el original: usan el de la Liche.
- **Línea de tiempo** (`data/waves.ts`, sustituye a `data/spawn.ts`). Seis tramos de 2 minutos, como en DESIGN.md; cada uno con sus enemigos, su ritmo y su máximo de vivos.
  - **Eventos:**
    - min 3: te rodean serpientes;
    - min 5: **Ettin**;
    - min 7: te rodean hombres lobo;
    - min 8: **Demon**;
    - min 10,5: te rodean hellhounds;
    - min 12: **Fire Wyvern**.
  - Desde el minuto 12 solo hay un goteo de enemigos.
- **Jefes** (`systems/BossSystem.ts`): más grandes, mucha vida y casi sin retroceso. Barra grande arriba con su nombre (fuente del original).
  - Los minijefes **sueltan el cofre**; ya no hay cofre cada 150 bajas.
  - El **Fire Wyvern lanza 3 bolas de fuego** en abanico cada 2,6 s (`systems/EnemyProjectileSystem.ts`, con pool; las quitan la armadura y el Defense Shield).
  - Matarlo = **victoria**, a los 2 s, cuando acaba su animación de muerte.
- **Avisos** grandes en el centro con la fuente del original ("The Ettin approaches!", "You are surrounded!").
- **Música** (`systems/MusicSystem.ts`): middleland normal, dungeon con minijefe y abaddon con el jefe final, con fundido de 1,5 s. Se para al salir de la escena.
- **`GameOverScene`** (victoria y derrota): muestra clase, nivel, tiempo, bajas, arma o hechizo y armadura. Botones originales **Restart** (otra partida) y **Change** (elegir clase), con teclado, mando o ratón. Sustituye al Game Over provisional.
- **Teclas de pruebas:** J salta 1 minuto; M salta al siguiente jefe; **L da 5 niveles** (5 cartas). El panel F1 muestra la oleada.
- **Comportamiento REAL de los monstruos** (17-oct-2026, investigación en `docs/hb-wiki/monstruos-comportamiento.md`, con el `NPC.cfg` y el código del servidor original sacados de GitHub):
  - **Ataque con animación y sonido.** El golpe cae en el frame 2 y solo hace daño si el jugador sigue a su alcance.
  - **Ritmo real** (ATime): cada ataque espera su tiempo de acción menos 0–700 ms al azar, nunca menos de 0,6 s. Mientras espera, se queda quieto mirando al jugador.
    - Ettin 0,7 s; Slime 2,1 s; Minotaur 0,5 s.
    - El Ettin tiene además la animación un 40% más lenta (pedido por el propietario), así que ataca cada ~0,77 s.
  - **Alcance real** (AttkRange, en casillas):
    - pegan desde lejos el Ettin, el Ogre y el Cyclops (3), el Stalker y el Demon (4), el Lich, la Gargoyle y el Hellclaw (5), el Tigerworm (6) y el Wyvern (7);
    - el **Dark Elf dispara flechas** desde 8 (`fx.arrow`, `effect.spr` hoja 7).
  - **Pega y huye** (estrategias del servidor, sorteadas al aparecer): 10% pega 1 vez y huye 2 acciones; 10% pega 2 veces y huye; 80% ataca sin parar.
  - **Huida por valentía:** con ≤7% de vida huye 10 acciones si una tirada 1..valentía sale ≤8. Los pequeños huyen casi siempre; los grandes, casi nunca.
  - **Daño con los dados reales** (por ejemplo, Ettin 8d9), comprimidos a nuestra escala (`MONSTER_DAMAGE`).
  - **Velocidad real** (corregida tras la prueba del propietario: iban demasiado rápido). En el original, al perseguir dan un paso por acción y en ese modo la acción dura ATime − 0..700 ms, nunca menos de 600 ms.
    - Todos los grandes caminan igual (1 casilla cada ~0,6 s); los pequeños, más lentos.
    - Escalado como el jugador (el original corría 178 px/s y el nuestro 150) **y ×1,5** (elegido por el propietario, para que lleguen antes): grandes 67 px/s, Snake 60, Orc 46, Slime 23. El jugador sigue siendo unas 2 veces más rápido.
    - Un solo número (`MONSTER_MOVE.scale` en `data/enemies.ts`) los acelera o frena a todos.
  - **Aparecen justo fuera del borde de la pantalla** (a 72 px del rectángulo visible), no en un círculo por fuera de las esquinas. Con las velocidades reales tardaban 30 s en llegar y parecía que el Guerrero no atacaba.
  - Comprobado con Playwright: el Ettin pega desde 96 px cada 0,77 s; el Dark Elf dispara desde ~7 casillas; un orco "pega y huye" ataca, huye 2,4 s y vuelve; un Slime con poca vida huye.
- **Golpes al jugador:**
  - destello de impacto del original (`fx.hit`: `effect.spr` hoja 8, aditivo);
  - quejido C5;
  - animación TakeDamage (hojas 80 / 10, 4 frames, 267 ms), con 100 ms de aturdimiento.
  - Las espadas también hacen saltar ese destello en cada monstruo golpeado.
  - **El original no tiene sangre roja**: comprobado en `reference/Client.cpp` (efecto "coup normal") y en sp-client.
- **Comprobado con Playwright:**
  - todos los monstruos se dibujan;
  - en el minuto 5 aparecen el aviso, la barra y la música dungeon;
  - al morir, el Ettin suelta el cofre y vuelve la música normal;
  - el Wyvern lanza sus bolas, suena abaddon y al matarlo sale la victoria;
  - Restart y la derrota funcionan;
  - **144 FPS con 371 monstruos** de la última oleada;
  - consola limpia.
- **Falta afinar jugando:**
  - la dificultad de cada tramo;
  - la vida de los jefes;
  - la curva de XP (objetivo: unos 25–30 niveles en 12–15 min).
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090. Juega una partida entera, o usa J y M para saltar a los jefes.

**Fase 6 completada (2026-10-16).**
Probada por el propietario, en 3 bloques (6A Guerrero, 6B Maga, 6C objetos, buffs y pasivas).
- Skill `/anadir-arma` creada (2026-10-17). Siguiente: `/fase 7` (oleadas, jefes y final).
- **Checkpoint 2026-10-16:** `tsc` y `build` sin errores; Playwright: el cofre da su buff y la consola está limpia (solo el 404 de `favicon.ico`).

**Bloque 6C: objetos en el suelo, buffs y pasivas** (probado y aprobado).
- **Objetos** (`data/pickups.ts`, `entities/Pickup.ts` con pool, `systems/PickupSystem.ts`):
  - **Red Potion** (item-ground 5/1): cura el 30% de la vida y suena C19. Cae con un 1,5% de probabilidad.
  - **Imán**, dibujado con el Crystal (15/46) porque no hay sprite de imán: atrae todas las gemas del mapa. Cae con un 0,5%.
  - **Cofre**, dibujado con la Gold Pocket (5/120): aparece cada 150 bajas (los minijefes llegan en la Fase 7) y suena E12 al caer.
  - Poción e imán desaparecen a los 60 s, parpadeando antes. **Los cofres no desaparecen** (pedido por el propietario).
- **Buffs del cofre** (`systems/BuffSystem.ts`): uno ofensivo o uno defensivo al azar, 20 s. **Se combinan** (pedido por el propietario): puedes tener los dos a la vez, cada uno con su contador. Coger uno que ya tienes renueva su tiempo.
  - **Berserk:** +40% de daño. Círculo mágico al activarse (`effect8` hoja 1) y brillo rojo aditivo sobre el personaje, como en el original (`CharacterSprite.setGlow`).
  - **Defense Shield:** −40% de daño recibido. `effect8` hoja 6 al activarse y aura `effect9` hoja 14 mientras dura. El aura venía desplazada de fábrica; ahora está centrada a los pies (corregido tras la prueba del propietario).
  - Al coger un buff, su nombre ("Berserk!", "Defense Shield!") sube sobre el jugador y se desvanece en 2 s, como al lanzar un hechizo en el original.
  - **Abajo a la derecha**, encima de la barra, una línea por buff activo con su nombre y los segundos que le quedan (pedido por el propietario).
  - Los dos textos usan la **fuente dibujada del original** (`sprfonts.spr`, la del libro de hechizos) con `hb/SpriteText.ts`: tabla de anchos y sombra negra copiadas de `reference/Client.cpp`. Colores: Berserk rojo, Defense Shield azul.
- **Pasivas** (`data/passives.ts`), una carta nueva para las dos clases. Tienen 5 rangos:
  - **Boots:** +8% de velocidad por rango.
  - **Magnet Amulet:** +30% de radio del imán de gemas por rango.
  - Cuentan dentro de las 2 cartas de objeto. El panel C muestra su rango.
- **Tecla de pruebas:** P suelta una poción, un imán y un cofre junto al jugador. Pueden caer en el agua: es solo para pruebas.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090. Pulsa P y recoge los objetos; pulsa X para que salgan las cartas de Boots y Magnet Amulet.
- **Comprobado con Playwright:**
  - la poción cura un 30%;
  - el imán atrae las gemas;
  - el cofre da Berserk o Defense Shield con sus efectos y el contador;
  - salen las cartas de pasivas;
  - consola limpia.
- **A vigilar:** con 2 pasivas siempre disponibles, las cartas de arma y armadura salen algo menos. Ajustable con `MAX_ITEM_CARDS`.

**Bloque 6B: arsenal de la Maga** (probado y aprobado).
- **Un solo hechizo "en la mano"**, como el arma del Guerrero (`data/spells.ts`, números propios, requisito de Int):
  - **Energy:** Energy Bolt (inicial) → Triple Energy Bolt (Int 20, 3 bolas a 3 enemigos) → Energy Strike (Int 32, 8 descargas alrededor del enemigo).
  - **Fire:** Fire Ball (Int 17) → Fire Strike (Int 24, 4 explosiones seguidas) → Mass Fire Strike (Int 36).
  - **Previstas, sin datos de juego:** Lightning, Ice y Meteor (`PLANNED_SPELL_FAMILIES`).
- **`weapons/SpellWeapon.ts`** sustituye a `EnergyBolt.ts`. Hay dos formas de apuntar:
  - `targets`: un enemigo distinto por proyectil;
  - `scatter`: caen alrededor del enemigo.
  - Las explosiones con retraso las gestiona `WeaponSystem` con un pool. El daño se aplica una sola vez, al impactar.
- **Visuales de sp-client:**
  - la Fire Ball es direccional: `effect.spr` hoja 5, 8 direcciones × 4 frames (`framesPerDirection` en `config/effects.ts`);
  - explosiones de `effect.spr` hoja 3, `effect3` hojas 1, 2 y 5, y `effect11` hoja 8;
  - sonidos E4 (explosión) y C16 (lanzar).
- **Animación de lanzar:**
  - el estado Cast del original (hojas 64 / 8, 16 frames), acortado de 1,5 s a 0,48 s (`CAST_ANIMATION_MS`);
  - la Maga se planta hasta que sale el hechizo (35%, unos 0,17 s) y luego vuelve a correr;
  - la varita se oculta mientras lanza, como en el original.
- **Ropa de la Maga** (`data/armor.ts`, juego `mage`; piden Mag): quita algo de daño y sube el daño mágico.
  - **Túnica:** Robe (Mag 18) → Wizard Robe (Mag 30). Es el mismo sprite teñido "Tan", el color 11 del original.
  - **Gorro:** Wizard Cap (22) → Wizard Hat (34).
  - La Hero Robe queda reservada para otra cosa.
- **La Maga empieza** con corpiño (Bodice), falda (Skirt), botas y varita. **La varita es fija** (solo estética).
- **Cartas:** eslabón de hechizo, cambio de familia de hechizo y ropa de mago. Muestran daño, ritmo, número de proyectiles y área; la ropa también el daño mágico.
- **Tecla de pruebas:** B da +10 de Int y +10 de Mag.
- **Checkpoint 6B, 2026-10-16:** `tsc` y `build` sin errores. En Playwright la Maga lanza y mata, y la consola está limpia (solo el 404 de `favicon.ico`).
- **A vigilar:** el sonido de lanzar C16 en cada hechizo puede cansar; el daño mágico crece mucho con Mag (ya anotado).
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090.
  1. Elige Magician.
  2. Pulsa X para subir de nivel y B varias veces para sumar Int y Mag.
  3. Elige Fire Ball, Triple Energy Bolt, Robe y Wizard Cap.
- **Comprobado con Playwright:**
  - lanza con animación;
  - Fire Strike con varias explosiones;
  - Wizard Robe teñida y Wizard Hat visibles;
  - salen todas las cartas nuevas;
  - el Guerrero sigue igual;
  - consola limpia.

**Bloque 6A: arsenal del Guerrero** (probado y aprobado).
La fase se parte en 3 bloques: **6A** Guerrero · **6B** Mago (hechizos por Int, eslabones de hechizo, animación de lanzar, túnicas) · **6C** pickups y pasivas.
- **Una sola arma en la mano** (decidido por el propietario). Las cartas ofrecen el siguiente eslabón de tu familia o cambiar a la mejor arma de otra familia.
- **Familias activas** (números propios, no los del original; `data/weapons.ts`):
  - **Short Swords:** Dagger (arma inicial) → Short Sword (Str 17) → Falchion (24). Rápidas y de poco alcance.
  - **Long Swords:** Long Sword (20) → Broad Sword (28) → Great Sword (36) → Flamberge (46). Lentas, arco ancho y más empuje.
- **Desactivadas** (solo datos, `enabled: false`): Hammer, Fencing y Axe.
- **Cómo ataca** (`weapons/MeleeWeapon.ts`):
  - tajo en arco hacia el enemigo más cercano;
  - el daño llega al 25% de la animación;
  - estela blanca (`entities/Slash.ts`);
  - sonidos C18 (tajo) y C6 (golpe).
- **Animación de ataque:** el estado Melee del original (hojas 48 / 6, arma índice 4).
- **Sin patinar al golpear** (pedido por el propietario): al empezar el tajo, el personaje se queda quieto hasta justo después del golpe (frames 0–2; `MELEE_ROOT_MOMENT`): Dagger ≈ 0,13 s, Long Sword ≈ 0,21 s. Después, si te mueves, se corta la animación y vuelve a correr. Quieto, el tajo se ve entero.
- **Armaduras** (`data/armor.ts`, `entities/Equipment.ts`): cuerpo, casco y escudo.
  - Cada pieza quita un % del daño recibido, con tope del 60%, y cambia el aspecto.
  - Chain Mail y Plate Mail también cambian las piernas (y Plate Mail las mangas).
- **El Guerrero empieza** con camisa, pantalón, botas y Dagger. Ya no usa el Energy Bolt.
- **Cartas** (`systems/UpgradePool.ts`): stat, eslabón, cambio de familia y armadura.
  - Como mucho 2 cartas de objeto; el resto, de stat.
  - Las cartas de arma muestran daño, ritmo, alcance y anchura (antes → después).
  - Las de armadura muestran el daño recibido.
- **Panel C:** muestra el arma y el "Damage taken".
- **Movimiento en 8 direcciones** (a prueba, pedido por el propietario): el stick y el ratón se ajustan a la dirección más cercana de las 8 del original. Sigue siendo libre en píxeles, no casilla a casilla. Para volver a cualquier ángulo: `MOVE_DIRECTIONS = 0` en `config/gameConfig.ts`.
- **Sonido como en el original** (pedido por el propietario):
  - el tajo C18 suena cuando cae el golpe, comprimido a 640 ms (la duración del ataque del original), y ya no a velocidad normal;
  - pasos C10 en bucle mientras te mueves, dos por ciclo de carrera, con polvo bajo los pies cada 32 px (efecto `effect2` hoja 1).
  - `AudioSystem.play(key, duración)` y `startLoop`/`stopLoop`. Los bucles se paran al pausar o al salir de la escena.
- **Tecla de pruebas:** V da +10 de Str.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090.
  1. Elige Warrior.
  2. Ataca solo al acercarse los enemigos.
  3. Pulsa X para subir de nivel y V para sumar Str.
  4. Mira cómo cambian el arma en la mano y la armadura.
- **Checkpoint 6A, 2026-10-16:**
  - `tsc` y `build` sin errores.
  - Playwright: consola limpia (solo el 404 de `favicon.ico`) y cartas de armadura y stat en pantalla.
  - Corriendo 4 s entre 50 enemigos, ningún frame de "golpe y movimiento a la vez".
- **Falta de la fase:** 6B (hechizos del Mago por Int, eslabones de hechizo, animación de lanzar, túnicas y gorros) y 6C (poción, imán, cofre con buff aleatorio, Botas y Amuleto imán).
- **Comprobado con Playwright:**
  - golpea a varios enemigos a la vez;
  - salen las cartas de Leather Armor, Long Sword, Targe Shield, Falchion y Scale Mail;
  - el aspecto cambia;
  - la Maga sigue con su Energy Bolt;
  - consola sin errores.

Anterior:
**Pantalla de selección de personaje** (adelantada de la Fase 8, 2026-10-16; probada y aprobada por el propietario). Siguiente: `/fase 6`.
- `scenes/CharacterSelectScene.ts` + `config/characterSelect.ts`: la pantalla original "Create New Character".
  - Fondo: `gamedialog86.spr`, hoja 9, ampliado de 640×480 a 800×600.
  - Botones: `dialogtext.spr`, hoja 1, con el texto ya dibujado y su versión iluminada.
- Solo se elige la clase: **Warrior** o **Magician** (Master no se incluye).
  - El nombre es fijo: "NMs" para el Mago y "NkII" para el Guerrero.
  - Aspecto y stats fijos. Las flechas de aspecto y los +/- se ven apagados.
- **Panel derecho:**
  - el personaje animado y su reflejo girando en el espejo ovalado;
  - Hit Point, Mana Point y Critical, calculados con las reglas reales;
  - una descripción de la clase.
- **Controles:**
  - ←/→ o la cruceta cambian de clase;
  - Enter o A: Create;
  - Esc o Start: Cancel (vuelve al Mago, porque aún no hay menú principal);
  - ratón en los botones.
- La partida usa la clase elegida (`registry` → `CHOSEN_CHARACTER_KEY`). En el Game Over, Esc o Start vuelven a la selección.
- **El Mago es mujer** (pedido por el propietario): `MAGE_FEMALE_LOOK` con `ww`, `whr`, `wpt`, `wrobe1`, `nwhelm3` (Wizard Cap), `wlboots` y `wstaff1`. El aspecto masculino sigue en `MAGE_LOOK` para cuando haya selección de sexo.
- **El Guerrero dispara Energy Bolt de forma provisional** (decidido por el propietario); su arma llega en la Fase 6.
- `entities/CharacterSprite.ts`: el dibujo por capas del personaje, separado de `Player.ts`. Lo usan el jugador y la vista previa.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090. Aparece la pantalla de creación: elige clase y pulsa Create.
- **Checkpoint 2026-10-16:**
  - `tsc` y `build` sin errores.
  - Playwright carga la pantalla de selección con la consola limpia.
  - Comprobado: la partida arranca con la clase elegida y Esc en el Game Over vuelve a la selección.
- **Nota de pruebas:** Playwright pulsa y suelta las teclas en el mismo fotograma y Phaser no lo detecta. Una pulsación real sí funciona.

Anterior:
Fase 5 completada (2026-10-16), probada por el propietario. Siguiente: `/nueva-skill añadir-mejora` y después `/fase 6`.
- **Stats** (`data/stats.ts`, `entities/CharacterStats.ts`):
  - Str: daño físico y requisito de armas/armaduras.
  - Vit: vida.
  - Dex: velocidad de movimiento y de ataque.
  - Int: requisito de hechizos y de equipo de mago; un poco de maná.
  - Mag: daño mágico y maná.
  - Chr: crítico (daño doble, número amarillo con "!").
- **Personajes:** (antes de la pantalla de selección) se jugaba con el **Mago** (Str 12, Vit 10, Dex 10, Int 14, Mag 14, Chr 10; +1 Int +2 Mag por nivel, decidido por el propietario; se ajustará si es demasiado). El Guerrero (Str 14, Vit 12, Dex 14, Int 10, Mag 10, Chr 10; +1 Str +1 Vit por nivel) queda listo para la Fase 8.
- **Requisitos:** `utils/requirements.ts` (`meetsRequirement`, `REQ_SCALE` 0.4). Aún no se usa; es para la Fase 6.
- **Gemas de XP** (`entities/XpGem.ts`, `systems/XpSystem.ts`):
  - esmeralda, zafiro y rubí de `item-ground.spr`;
  - imán y sonido E20;
  - pool, máximo 400 (después se suman a una existente).
- **Curva:** 10 + 10·(nivel−1) (`data/leveling.ts`). Prueba: nivel 9 a los 2 min. El ajuste fino va con las oleadas (Fase 7).
- **`LevelUpScene`:** 3 cartas "+3 a un stat" con antes → después. Se elige con teclado, mando o ratón. Un clic mantenido desde antes de abrirse no elige carta.
- **Barra:**
  - XP;
  - maná real (no se gasta todavía);
  - "Lv N  time  kills";
  - panel de stats con el casco, C o Y del mando.
- **Tecla de pruebas:** X sube un nivel.
- **Interfaz:** todo el texto en inglés, con Comic Neue (ver Decisiones).
- **Falta de la fase:** crear la skill `/nueva-skill añadir-mejora` (indicado en `docs/PLAN.md`), tras cerrar la fase.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090. Recoger gemas, elegir cartas (flechas/cruceta + Enter/A, o clic), C para ver los stats, X para subir de nivel.
- **Checkpoint 2026-10-16:** `tsc` y `build` sin errores. Playwright carga el juego; en consola, solo el 404 de `favicon.ico` y avisos de audio del navegador (sin interacción no deja sonar).

Antes de la Fase 5:
Barra inferior (HUD) al estilo del original, 2026-10-16.
- `scenes/HudScene.ts` + `config/hud.ts`:
  - vida real con número;
  - maná llena con "— / —" (el Guerrero aún no usa maná);
  - XP vacía hasta la Fase 5;
  - tiempo y bajas.
- Los 6 botones se iluminan al pasar el ratón. El del disquete, Esc o Start del mando abren una pausa provisional (el menú real llega en la Fase 8).
- La cámara solo dibuja por encima de la barra. Los clics sobre la barra no mueven al jugador.
- Cómo probar: `pnpm --dir survivors dev` → http://localhost:8090.
- **Aspecto provisional de mago** (solo estética, pedido por el propietario): túnica `mrobe1`, sombrero `nmhelm4`, botas altas y varita `mstaff1`. Es `MAGE_LOOK` en `data/characters.ts`; el aspecto de Guerrero sigue en `WARRIOR_LOOK`. Las estadísticas siguen siendo las del Guerrero.
- La barra de vida sobre la cabeza se queda; en el futuro será opcional desde el menú de ajustes (Fase 8).
- La animación de lanzar hechizo queda para la Fase 6 (anotada en `docs/PLAN.md`).

Fase 4 completada (2026-10-16), probada por el propietario. Siguiente: `/fase 5`.
- Más adelante el propietario quiere ajustar algunos detalles visuales; todavía no los ha concretado.
- Hecho:
  - **Energy Bolt** (`weapons/EnergyBolt.ts`, datos en `data/weapons.ts`): dispara solo al enemigo más cercano a menos de 320 px, cada 1,1 s. Daño según la wiki: 10 directo + 7 en un área de 3×3 casillas, así que el enemigo alcanzado recibe 17.
  - `Weapon.ts` base, `WeaponSystem` (proyectiles y explosiones con pool), `Projectile.ts` y `Effect.ts`. Los efectos usan `effect.spr`: hoja 0, frames 2–5 en vuelo; hoja 6 para la explosión (`config/effects.ts`).
  - `CombatSystem`: daño, destello blanco, retroceso que se frena rápido y contador de muertes.
  - `DamageNumbers`: "-N" rojo con borde negro, sube y se desvanece (pool, máximo 120 en pantalla).
  - `AudioSystem`: lanzamiento E1, impacto E2, golpe y muerte de cada monstruo. Como máximo 3 copias del mismo sonido, separadas al menos 70 ms, y 14 sonidos en total (`data/audio.ts`).
  - Panel F1: muertes, proyectiles, números en pantalla y sonidos (sonando y descartados).
  - Comprobado:
    - `tsc` y `build` sin errores;
    - en Playwright, 324 enemigos a 144 FPS, matando y con sonido limitado;
    - consola sin errores (salvo `favicon.ico`).
- Cómo probar: `pnpm --dir survivors dev` → http://localhost:8090. No hace falta pulsar nada para atacar. F1 · G · N ×3 para ver muchos enemigos.
- Checkpoint 2026-10-16: `tsc` y `build` sin errores; Playwright carga el juego sin errores (solo falta `favicon.ico`).
- Datos de referencia de Helbreath: `docs/hb-wiki/` (índice en `README.md`).
