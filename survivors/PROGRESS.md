# Progreso

| Fase | Estado | Fecha |
|---|---|---|
| 0 — Reconocimiento | ✅ completada | 2026-10-16 |
| 1 — Esqueleto y primer sprite | ✅ completada | 2026-10-16 |
| 2 — Mapa y jugador | ✅ completada | 2026-10-16 |
| 3 — Enemigos | ✅ completada | 2026-10-16 |
| 4 — Primera arma y combate | ✅ completada | 2026-10-16 |
| 5 — Experiencia y subida de nivel | ✅ completada | 2026-10-16 |
| 6 — Arsenal completo | ✅ completada | 2026-10-16 |
| 7 — Oleadas, jefes y final | ✅ completada | 2026-10-17 |
| 8 — Menús y personajes | ✅ completada (solo menús; Arquero aplazado) | 2026-10-17 |
| 9 — Web, móvil y publicación | ✅ completada | 2026-10-17 |
| 10 — Pulido (opcional) | 🟡 en curso (10A y 10B: móvil) | |

## Fase actual
**Fase 10, bloque 10B: interfaz de partida elegible en el móvil (2026-10-17, falta que lo pruebe el propietario).**
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

**Fase 10, bloque 10A: que todo se lea bien en el móvil (2026-10-17, falta que lo pruebe el propietario).**
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

## Problemas conocidos
- En el móvil todo se ve muy pequeño (letras, menús, cartas). Anotado para la Fase 10.
- Con un solo Energy Bolt, 300 enemigos sobrepasan al jugador. Las cartas de stat ayudan, pero la progresión real llega con las armas de la Fase 6.
- El daño mágico crece rápido (+2 Mag por nivel y +4% por punto). Vigilarlo al equilibrar.
- Las flechas "→" de las cartas usan otra fuente: Comic Neue no tiene ese carácter. No molesta.
- El navegador interno de la app, si el panel está en segundo plano, va a ~1 FPS y parece congelado. Para revisar el juego, usar Playwright o tener el panel visible. A veces también le pasa a Playwright: `requestAnimationFrame` cae a 2 por segundo incluso sin el juego (visto el 16-oct-2026). No es un problema del juego.
- En el navegador interno, `sp-client` muestra errores `Cannot suspend/resume a closed AudioContext`. Son del audio en una pestaña en segundo plano y no afectan.
- Algunos enemigos se quedan esperando en la orilla del río si el jugador está al otro lado. Sin búsqueda de caminos. Se recolocan si quedan lejos.
- El personaje se ve pequeño a 800×600 (tamaño original de Helbreath). Si se quiere, se ajusta el zoom de la cámara más adelante.

## Decisiones tomadas
- 2026-10-16 · Fuente de la interfaz: **Comic Neue**, copia libre (OFL) de Comic Sans MS, la letra de los diálogos del original. Va incluida en el juego (`@fontsource/comic-neue`, `config/ui.ts`) y se espera a que cargue antes de arrancar. Tamaño normal 15; en las cajas de la barra inferior, 12 (confirmado por el propietario). Los números de daño siguen en Georgia, como en sp-client, y los paneles de pruebas en monospace.
- 2026-10-16 · Idioma del juego: **solo inglés** (regla 9 de CLAUDE.md). Documentación y explicaciones siguen en español.
- 2026-10-16 · Las gemas de XP se dibujan por encima de enemigos y objetos, para que nunca queden tapadas.
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
