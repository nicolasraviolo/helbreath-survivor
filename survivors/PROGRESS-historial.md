# Historial de progreso

Bloques y fases ya terminados, el más reciente arriba. El estado actual está en `PROGRESS.md`. Al cerrar un bloque, su resumen se mueve aquí, arriba del todo.

**Equilibrio de los martillos (2026-10-26, fuera de fase).**
- **Qué hace:** grieta de los martillos −30% (Hammer 28→20, Battle Hammer 38→27) y golpe del Hammer 46→42. El Hammer queda ~1 min por encima de la Flamberge (Str 60) y el Battle Hammer parecido a ella en Middleland; antes eran la familia más fuerte con diferencia.
- **Cómo se midió:** `pnpm balance` con cada arma en un Level donde el Guerrero ya tiene la Str que pide (Elvine Garden 25/35, Middleland 40; `@weapon=...`; 4–8 repeticiones). Datos en `.check/balance-hammers*.json`; resumen en NOTES.md, "Equilibrio de los martillos".
- **Comprobado:** build; `check hammer battlehammer levelpacehammer` sin errores.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&weapon=hammer (números de daño algo más bajos).

**Martillos con golpe al suelo, bloque C (2026-10-26, fuera de fase).**
- **Qué hace:** la familia Hammer ya está activa: Hammer (Str 70, daño 46, grieta 28 de ~200 px) y Battle Hammer (Str 95, 62, grieta 38 de ~240 px), cada ~1,5 s. El Guerrero da el golpe hacia el monstruo y, al tocar el suelo, daña y empuja todo el círculo (con polvo alrededor) y una grieta de rocas (la del Earth Shock Wave) sale en línea hacia él. Ataca también si el monstruo está fuera del círculo pero la grieta lo alcanza. Crit: círculo 2 casillas más grande con mucho empuje y grieta ×1,6. Golpe sordo C5 y temblor suave. Tom los vende y mejora; icono en Equipment y dibujo en la ventana Character. El anillo claro en el suelo se quitó a petición del propietario.
- **Código:** `data/weapons.ts` (`attack: 'slam'`, `HAMMER_SLAM`, `HAMMER_CRACK`, `crack` en el arma), `MeleeWeapon` + `WeaponContext.slamMelee`, `WeaponSystem.groundSlam` (y crit de martillo), `LineSpell` acepta `LinePathDef` (daño físico, números normales; `data/activeSpells.ts`), `WEAPON_SPR` con hammer 15, sprites `gear.hammers.*` y sonido `sfx.melee.blunt`. `check hammer` / `battlehammer` / `levelpacehammer`. Línea en What's new (Phase 28¾). Nota en NOTES.md, "Martillos: golpe al suelo y grieta".
- **Comprobado:** build; `check hammer battlehammer` en PC y `--mobile`, `smith`, `earthshock` (comparte código con la grieta), `axe`; sin errores (~115–140 FPS). Capturas del martillo en la mano y de la grieta. Ritmo medido después (ver "Equilibrio de los martillos"). Probado por el propietario: OK.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&weapon=hammer&debug=god,horde,crits (Espacio = crit).

**Hachas con giro en torbellino, bloque B (2026-10-25, fuera de fase).**
- **Qué hace:** la familia Axe ya está activa: Light Axe (Str 12, daño 15), Tomahawk (20, 19), Double Axe (33, 24), War Axe (46, 29), Battle Axe (80, 42). Al atacar, el personaje gira por las 8 direcciones con una estela circular y golpea a todo lo que haya dentro del círculo; el crit (Espacio) da dos giros. Tom las vende (con mejoras +1/+2/+3); icono en Equipment/Tom y dibujo grande en la ventana Character. En la mano se usan las `waxe*` también para el hombre.
- **Código:** `data/weapons.ts` (`MELEE_FAMILIES[f].attack`, `AXE_SPIN`, datos de las hachas), `weapons/MeleeWeapon.ts` + `WeaponContext.spinMelee`, `WeaponSystem` (giro y crit de hacha), `Player.spin` + `CharacterSprite.heldFrame`, `Slash.showSpin` (`SPIN_TRAIL` en `data/slash.ts`), `WEAPON_SPR` en `data/paperDoll.ts`, sprites `gear.axes.*` en `assetManifest.ts`. La partida simulada sigue con espadas (`SIM_WEAPON_FAMILIES` en `config/simProfile.ts`). Atajo `?weapon=lightAxe`; `check axe` / `battleaxe` / `levelpaceaxe`. Línea en What's new (Phase 28¾). Nota en NOTES.md, "Hachas: giro en torbellino".
- **Comprobado:** build; `check axe battleaxe` en PC y `--mobile`, `smith`, ventana Character con War Axe, sin errores (~120–135 FPS). Ritmo con `pnpm balance` (3 partidas por caso, Level 1/10/25/40, `.check/balance-axes.json`): parejo con la espada del personaje. Probado por el propietario: OK.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&weapon=lightAxe&debug=god,horde,crits (Espacio = crit de dos giros).

**Requisitos por grupo, bloque A (2026-10-25, fuera de fase).**
- **Qué hace:** cada grupo de equipo y hechizos tiene su propia escalera de requisitos, sin saltos grandes. Armaduras del Guerrero: Helmet 45, Plate Mail 60 (antes 100), Full Helmet 75, Winged 95, Horned 120 (Str; Level igual). Ropa de la Maga (Mag): Robe 30, Wizard Cap 45, Wizard Hat 60, Wizard Robe 75 (+ Level 80). Varitas raras (Level): Kloness 90/100, Berserk 110/120. Hechizos (Int): Mass Ice Strike 88, Bloody Shock Wave 105, Meteor Strike 125, Earth Shock Wave 150, Blizzard 175. Los precios de Tom bajan solos (salen del requisito, `SMITH_PRICE`). El requisito solo se mira al ponerse algo: quien ya lleva la Wizard Robe no la pierde.
- **Código:** solo datos y comentarios en `data/armor.ts`, `data/wands.ts`, `data/activeSpells.ts`. Línea en What's new (Phase 28¾).
- **Comprobado:** build; `check equipmentowned smith equipmentmage` sin errores. Probado por el propietario: OK.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=demo&open=town&town=tom&smith=buy&gold=50000 (Plate Mail pide Str 60).

**Arreglo suelto — zoom del 125 % en el móvil (2026-10-25).**
- **Qué hace:** en el móvil, la partida y la ciudad se ven un 25 % más grandes (se ve algo menos de mapa). La interfaz, el minimapa, los joysticks y los botones quedan igual. En el PC no cambia nada.
- **Código:** `WORLD_ZOOM` / `PHONE_WORLD_ZOOM` en `config/device.ts` (`?zoom=1.5` para probar otro valor), `zoomWorldCamera` en `ui/renderScale.ts` (lo llaman `GameScene` y `TownScene`); `ScreenLayer` se encoge `RENDER_SCALE / zoom` para que lo fijo en pantalla no crezca. Línea en What's new (Phase 28¾). Nota en NOTES.md, "Zoom del mundo en el móvil".
- **Comprobado:** build; `check game horde town townnpc --mobile` y aimstick con horda, sin errores y 116–124 FPS; en PC el zoom sigue igual (`check game town`); capturas de ciudad con y sin zoom.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play&ui=compact (con `&zoom=1` para comparar); ciudad: http://localhost:8090/?characters=demo&open=town&ui=compact.

**Arreglo suelto — óvalo de sombra bajo los monstruos sin sombra (2026-10-25).**
- **Qué hace:** Slime, Ant, Snake, Cat, Dire Boar, Scorpion, Tigerworm y Unicorn (sin sombra en el original) llevan un óvalo negro difuminado bajo los pies, al 50%, para que no se fundan con el suelo en el móvil. Se probó antes la sombra del original (copia aplastada del sprite): en monstruos tan planos casi no se ve.
- **Código:** `GROUND_SHADOW` en `config/gameConfig.ts` (tamaño por radio, `alpha`, anillos del difuminado); `Enemy.groundShadow`, `scaleGroundShadow` (crece con los Champion) y `ensureGroundShadowTexture` en `entities/Enemy.ts`. Línea nueva en What's new (Phase 28¾). Nota en NOTES.md, "Sombras del jugador y los monstruos (Fase 22G)".
- **Comprobado:** build; `check horde traveler --mobile` a 116–123 FPS sin errores; capturas de serpientes y hormigas quietas comparando antes / 75% / 50%.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&map=traveler&ui=compact; sombra suave bajo serpientes, hormigas, slimes y gatos.

**Fase 28¾C — Opción Smooth Sprites en Settings (2026-10-25). Cierra la Fase 28¾.**
- **Qué se hizo:** casilla **Smooth Sprites** en Settings (primera pestaña, bajo Large Trees), ajuste `smoothSprites` en `config/settings.ts` (On por defecto en PC y móvil, decidido). Se aplica al momento, también en partida: `smoothSprite` apunta cada sprite en un `Set` y al cambiar el ajuste les pone o quita el pipeline (`setPipeline` / `resetPipeline`). `?debug=nosmooth` sigue apagándolo. Créditos "Smooth Sprites: xBR-lv2 shader by Hyllian (MIT)", línea en What's new, `g.debugSetSmooth(on)` para el check y nota en NOTES.md.
- **Comprobado:** build; `check settings` (también `--mobile`), `menu smooth nosmooth` sin errores; `check smooth --eval` con 220 sprites: apagar → 0 con filtro, encender → 220. Probado por el propietario: va bien.
- **Probar:** `pnpm --dir survivors dev` → partida → Esc → Settings → quitar/poner Smooth Sprites; F5 y sigue como se dejó.

**Fase 28¾B — Sprites suaves en todo lo que se mueve (2026-10-25).**
- **Qué se hizo:** un único interruptor `smoothSprite()` / `smoothSpritesOn()` en `hb/XbrPipeline.ts` (encendido; `?debug=nosmooth` lo apaga, sustituye a `?debug=smooth`). Lo llevan monstruos y NPCs (`HBAsset`), todas las capas del personaje (`CharacterSprite`, también en la ventana Character y al elegir personaje; `PaperDoll`), sombras, efectos, proyectiles, meteorito, portal, tótems, auras, magias pasivas, gemas, botín y pickups. Sin filtro: mapa, HUD, menús, iconos, textos y chispas. Decisiones del propietario: encendido por defecto en PC y móvil; muñeco de Character también con filtro.
- **Comprobado:** build; `check smooth nosmooth town` (también `--mobile`), `champion poison activespell charinfo slots crit` sin errores y 117–124 FPS; 200 monstruos: 0,58 → 0,74 ms por imagen; comparativa `.check/compare-28-3-4B.jpg`. Probado por el propietario: le gusta.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&debug=horde,daggers,angels (añadir `,nosmooth` para comparar).

**Fase 28¾A — Sprites suaves: prueba técnica del filtro xBR (2026-10-25).**
- **Qué se hizo:** filtro xBR-lv2 de Hyllian (MIT) como pipeline WebGL propio (`hb/XbrPipeline.ts`, registrado al arrancar). Redondea bordes y diagonales a partir de los píxeles originales, con cualquier zoom, sin tocar tamaños ni pivotes; tiene en cuenta la transparencia (suaviza la silueta) y respeta tintes, destello de golpe y alpha. De momento solo en el Orc con `?debug=smooth` (también en la escena de prueba del Orc, tecla T). Atajo `?debug=orcs` (corro de Orcs) y `check orcs` / `check smooth`.
- **Comprobado:** build; `check orcs smooth menu` (también `--mobile`) sin errores y mismos FPS; 30 Orcs: 0,22 → 0,25 ms por imagen en PC; capturas antes/después (`.check/sprites-hd/comparativa-28-3-4A.png`) y de tintes. Probado por el propietario en PC y en su móvil: le gusta y va bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&map=traveler&debug=orcs,smooth (T = Orc quieto; sin `,smooth` para comparar).

**Fase 28½B — Nivelar la dificultad (2026-10-25). Cierra la Fase 28½.**
- **Qué se hizo:** Traveler Zone iba al revés (lo más peligroso era el minuto 1–2 y del 5 al 8 casi no hacía daño). Nuevo `WaveDef.damage` (daño de los monstruos de cada oleada, encima del del mapa): en Traveler Zone 0,5 → 0,45 → 0,6 → 0,85 → 1,3 → 2,5 → 3,1 por minuto; tres encerronas nuevas (hormigas 5, serpientes 6, conejos 6,5). Stone Golem: 3500 de vida y `damageScale` 0,75 (pegaba 7, ahora ~15). Dummy: daño real (`damageDice` [7,4] × 1,3, cada 2,6 s), 6500 de vida, llama a 12 bichos cada 5 s. Tras probarlo el propietario (ganó Traveler Zone y Bleeding Isle a la primera): **+20% de vida a todos los monstruos y jefes** (`MONSTER_HP_BONUS`, sin cambiar su EXP). Otros mapas, solo medidos (no se ganan con el bot): sin cambios.
- **Comprobado:** build; `check traveler travelerboss` sin errores; `pnpm balance` antes/después (informe: https://claude.ai/artifact/KLRBkGD5pmhKAcU9aatyMc): primera muerte de 1:28–2:48 a ~4:30, gana con Level 1 del 50–67% al 17–33%; con +20% de vida, 1/16 y 63–76% de muertos de un golpe. Detalle en NOTES.md, "Dificultad de Traveler Zone (Fase 28½B)". Probado por el propietario: le gusta.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=reset → Play → Gorn → Traveler Zone.

**Fase 28½A — Cartas: la rareza ya no adelanta rangos (2026-10-25).**
- **Qué se hizo:** las cartas de Stone, Magnet y magias suben siempre **1 rango** (5 cartas como mucho); la rareza decide cuánto vale: Common ×1, Rare ×1,5, Epic ×2 (5 Xelima Epic = +100%, 5 normales = +50%). En las magias, cada carta Rare/Epic da +5%/+10% de daño (dagas, angelito) o de anillo (aura; el frenado no cambia). Epic más rara: pesos 86,5 / 12 / 1,5; la Chr sube Rare y Epic +2% por punto sobre 10, hasta ×3. La Charisma dice "Critical hits and better cards". La carta enseña el valor real ("Damage +0% → +20%") y F1 el bono de cada pasiva ("3/5 +70%"). Se guarda lo que vale cada carta (`passiveValues`/`magicValues`); partidas viejas = todo Common. `check epicstones`. What's new.
- **Comprobado:** build; `check epicstones levelup epic rerollskip aura daggers angels` sin errores; captura de las cartas Epic (Merien 1/5 "−0% → −19%", aura radio 68); 5 Xelima Epic = +100% y sigue igual tras guardar y continuar.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&debug=epic,stones,levelup

**Fase 28C — Magias pasivas: Tutelary Angels (2026-10-25). Cierra la Fase 28.**
- **Qué se hizo:** **un solo angelito**, el celeste (`tutelarangel3.spr`, el del Angelic Pendant de INT; elegido por el propietario), flota junto al hombro, sigue al jugador con algo de retraso y dispara una bolita de luz celeste que persigue al monstruo más cercano dentro de su alcance (260–340 px), con la animación de ataque. Daño de la clase (Str/Mag, Xelima, crítico, Power), 10–19. Con el rango dispara más seguido (0,9 → 4 por segundo: lo que habrían hecho 2 o 3 angelitos; el propietario prefirió uno solo). Bolita pequeña (14 px) y sin chispazo al dar (pedido: era demasiado ruido). Sprite bajo demanda (`fx.tutelaryAngel`, solo al tener la magia). Carta con "Damage" y "Shots/s". `?debug=angels`, `check angels`. What's new.
- **Comprobado:** build; `check menu levelup aura daggers angels` sin errores; capturas: angelito, bolitas en vuelo, carta con el icono del pendiente; rango 3 = 6 disparos en 3 s y rango 5 = 12; guardar y continuar conserva el rango; con la Maga también. Daño a criterio de Claude, sin medir con partidas simuladas.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=mage&debug=god,angels,angels,angels,horde

**Fase 28B — Magias pasivas: dagas que giran y el aura pasa a frenar (2026-10-25).**
- **Qué se hizo:** **Spinning Daggers** (dagas, no espadas; pedido del propietario): de 2 a 5 dagas (la Dagger del suelo) que giran a la altura del pecho, con la hoja azulada y un halo de luz que late para no confundirlas con la daga equipada; golpean con el daño de la clase y empujan; al mismo monstruo, como mucho cada 0,4 s. El aura de daño hacía el mismo papel, así que pasa a **Eye of the Storm** ("Howling winds slow the monsters around you"): **solo frena**, sin daño (−25% a −50%; los jefes, la mitad), los frenados se ven blanco grisáceo (silueta blanca sumada, como el rojo de los élites) y el anillo crece hasta el doble (62 → 208 px). Carta con "Damage/Daggers" o "Slow/Radius". `?debug=daggers`, `check daggers`.
- **Comprobado:** build; `check menu news game levelup aura daggers elites icestrike` sin errores; capturas: dagas con brillo y punta hacia fuera, monstruos blanquecinos y frenados dentro del anillo, carta. La partida simulada no mide las dagas (la Maga mata de lejos: ~2.350 bajas con y sin ellas, también quieta). Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&debug=god,aura,daggers,horde

**Fase 28A — Magias pasivas: el aura (2026-10-25).**
- **Qué se hizo:** carta nueva de **magia** (`kind: 'magic'`, comparte los huecos especiales con las Stones; como mucho 2 magias por partida). **Damage Aura**: anillo bajo los pies (Protection Ring) que cada 0,5 s golpea a los monstruos que lo pisan, con el daño de la clase (Str/Mag, Xelima, crítico); 5 rangos (más daño y radio); se guarda con Continue y se pierde al terminar. Fila en la ventana C, métricas, `?debug=aura`, `check aura`. Espadas y angelitos preparados en `data/passiveMagic.ts` pero apagados (`ready: false`). What's new de la Fase 28. Ver NOTES.md, "Magias pasivas de la partida (Fase 28)".
- **Comprobado:** build; `check aura menu game levelup epic charinfogame` sin errores; los monstruos del anillo pierden vida; guardar y continuar con rango 4 sigue en 4; partida simulada de la Maga con el aura al máximo: +20% de bajas, sin desequilibrio. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&debug=aura,horde, o una partida normal cogiendo la carta Damage Aura.

**Fase 27½B — Código de traspaso: juego (2026-10-25).**
- **Qué se hizo:** Settings → Gameplay → **Transfer Save** (solo abriendo Settings desde el menú principal): **Get Code** sube la partida y enseña el código en grande con **Copy**; **Enter Code** tiene una casilla HTML encima del lienzo (teclado del móvil y pegar; admite minúsculas, espacios y guion), aviso con No / Replace, baja la partida, guarda la vieja en `hb-survivors.transfer-backup`, escribe las claves y recarga la página sin parámetros de depuración. Errores claros sin tocar nada (sin red, código no encontrado, servidor ocupado). Con muchas opciones, las pestañas de Settings juntan las filas (`SETTINGS_MENU.denseItemSpacing`). Código en `systems/TransferClient.ts` y `scenes/TransferScene.ts`; atajo `?open=transfer`, situaciones `check transfer` y `settingsgameplay`. What's new de la Fase 27½. Ver NOTES.md, "Código de traspaso (Fase 27½)".
- **Comprobado:** build; `check menu settings settingsgameplay transfer game` (PC y `--mobile`) sin errores; prueba con dos navegadores de Playwright y el servidor real: todo igual en el segundo, Copy, WASD en la casilla, aviso de código mal escrito, segundo canje "not found" sin tocar nada, sin red "Can't reach the server". Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090 → Settings → Gameplay → Transfer Save, en dos navegadores.

**Fase 27½A — Código de traspaso: servidor (2026-10-25).**
- **Qué se hizo:** en el Worker de las métricas, `POST /transfer` (guarda la partida y da un código de 6 letras sin O/0/I/1/L) y `POST /transfer/claim` (devuelve la partida y borra el código: un solo uso; caduca a las 24 h). Tabla `transfers` en D1. Reglas compartidas con el juego en `src/config/transfer.ts`; viajan todas las claves de guardado menos los ajustes. Fase nueva en PLAN-2 y decisión en DECISIONES. Ver NOTES.md, "Código de traspaso (Fase 27½)".
- **Comprobado:** `metrics:check`, build, `check menu`; en local: crear, canjear (en minúsculas), segundo canje 404, inventado 404, caducado 404, 300 KB 413, clave de ajustes 400, otra web 403, UTF-8 intacto. Publicado por el propietario y probado en el servidor real: crear 200, canjear 200, otra vez 404, otra web 403, página de métricas 200.
- **Probar:** aún nada en el juego (llega en 27½B).

**Extra — Level Up y Equipment en la ciudad (2026-10-24).**
- **Qué se hizo:** en la ciudad, aviso **"Level Up"** abajo a la derecha con la letra de títulos mientras haya puntos sin repartir (un clic o toque abre la ventana Character para repartirlos; en táctil va encima del botón "Talk"). **C / Y del mando** abre Character; **I** sigue abriendo Equipment. La pausa de la ciudad añade **Character** y **Equipment** (panel grande para que quepan 7 opciones). Howard no cambia. How to Play y What's new actualizados. Nombres de las letras (títulos, cartas, texto) en NOTES.md. Ver NOTES.md, "Character y Equipment sin ir a Howard".
- **Comprobado:** build; `check town` (PC y `--mobile`, aviso y pausa), pausa → Character → ciudad → Equipment, `check menu` y la pausa en partida sin errores. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=demo&open=town

**Fase 27C — Guardar distancia y medidas (2026-10-23).**
- **Qué se hizo:** forma de moverse **guardar distancia** (`'keepAway'`, números en `KEEP_AWAY` de `data/movement.ts`, lógica en `Enemy.keepAwayStep`) para Mage-Orc, Lich y Dark Elf. Mientras esperan su siguiente ataque, si te acercas a menos del 60% de su alcance retroceden (más despacio que el jugador); si no, se mueven de lado y cambian de lado de vez en cuando. Atajo `?debug=movement` / `check movement`: corro con Slime, Cat, Bunny y Mage-Orc (descarga antes los que falten). What's new con una línea. Ver NOTES.md, "Monstruos que se mueven distinto (Fase 27)".
- **Comprobado:** build; `pnpm balance` antes/después sin cambio apreciable (`.check/balance-27c-before.json` / `-after.json`); Mage-Orc con el jugador a 50 px se aleja a ~100 px en 2 s; 60 FPS en `--mobile` con ~260 monstruos; a los 5 min en Traveler Zone los monstruos cercanos llegan por las 8 direcciones; `check menu news movement charge traveler` sin errores. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?map=traveler&debug=god,movement

**Fase 27B — Embestir (2026-10-23).**
- **Qué se hizo:** forma de moverse **embestir** (`'charge'`, números en `CHARGE` de `data/movement.ts`) para Bunny, Ant, Dire Boar y Minotaur (el Giant Lizard no: es jefe). A 70–220 px se paran 0,6 s con un **"!" amarillo** encima, apuntan a donde estaba el jugador y cargan en línea recta a 2,2× su velocidad, 110 px más allá (si te apartas, pasan de largo y vuelven); otra carga cada 3–4,5 s. Reutiliza `Enemy.charge()` de la estampida. Los "!" con pool en `systems/ChargeWarnings.ts`. Atajo `?debug=charge` y `check charge`. What's new con una línea. Ver NOTES.md, "Monstruos que se mueven distinto (Fase 27)".
- **Comprobado:** build; `check charge` (hasta 5 "!" a la vez, captura con los avisos), `game`, `horde --mobile`, Traveler Zone con ~310 monstruos embistiendo en `--mobile`, `menu` y `stampede`: sin errores a 60 FPS. **Pendiente de probar por el propietario.**
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?map=traveler&debug=god,charge

**Fase 27A — Rodear, deambular y separarse (2026-10-23).**
- **Qué se hizo:** cada monstruo tiene una forma de moverse (`movement` en `data/enemies.ts`, números en `data/movement.ts`): **rodear** (Cat, Snake, Orc, Werewolf, Hellhound, Stalker: llegan en curva por un lado y van rectos al acercarse) y **deambular** (Slime, Zombie, Clay y Stone Golem: tramos al azar hacia el jugador hasta verlo a 260 px o recibir un golpe). El resto, directo; los jefes, siempre directos. **Separación** más fuerte y con un pequeño hueco entre cuerpos (`ENEMY_SEPARATION_SPACING`). What's new de la Fase 27 creado. Ver NOTES.md, "Monstruos que se mueven distinto (Fase 27)".
- **Decisiones del propietario:** embestir avisará con "!" (27B); se acepta algo más de dificultad; los jefes no cambian (23-oct-2026).
- **Comprobado:** build; `check menu horde stampede traveler` y Traveler Zone a los 5 min (PC y `--mobile`, con horda) sin errores a 60 FPS; captura con monstruos llegando repartidos. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → `?play&map=traveler`, J cinco veces.

**Fase 26 — Revisión de código (2026-10-23).**
- **Qué se hizo:** `/revisar` de toda la rama (8 hallazgos; el propietario eligió arreglar del 1 al 5): (1) un guardado de personajes o partidas de una **versión más nueva** ya no se pisa desde una copia antigua del juego (`readOnly` en `CharacterStore` y `SaveStore`); (2) la **Blue Potion** no cuenta como poción para los retos ni las métricas; (3) el **hielo frena solo el paso** del monstruo, no el empuje entre ellos ni el retroceso (`Enemy.chase(..., pace)`); (4) cabeceras "Ported from sp-client" en `LightningArc`, `IceShardRain` y `LineSpell`; (5) el retraso del golpe del Blizzard pasa a `data/activeSpells.ts` (`pathHitDelayMs`). Quedan sin hacer (menores): objetos nuevos al arrastrar el botón de la Maga y en cada lanzamiento, y algo de código muerto (`IceShardRain.chill`, comentario viejo en `RunSnapshot`, `case 'spelldrag'` vacío).
- **Comprobado:** build; guardado falso de versión 99 intacto tras escribir; monstruo ralentizado a la mitad de paso (11 frente a 23 px/s); check de los hechizos sin errores.

**Fase 26E — Hechizos en línea y Libro Azul (2026-10-23).**
- **Qué se hizo:** tres hechizos nuevos en el Spell 2 de la Maga que avanzan **en línea** de sus pies al punto apuntado (tipo `'line'`, `systems/LineSpell.ts`, con pool): **Bloody Shock Wave** (Int 120 + Libro Azul, 52 de maná; cadena de anillos rojos, `effect4` hoja 0), **Earth Shock Wave** (Int 165, 95 de maná; ola de roca y polvo, `effect11` hojas 2–3, dos golpes) y **Blizzard** (Int 190, 97 de maná; lluvia de hielo cada vez más ancha, `effect7`, ralentiza; se descarga solo con Blizzard puesto). **Libro Azul** (`item-pack` 5/91; el "Manual" 5/92 es rojo): cae muy raro de cualquier monstruo (`LOOT_MANUAL_CHANCE`, ~1 de cada 15 partidas de la Maga, también sin Int 120) y al cogerlo se **aprende para siempre** (`SavedCharacter.learnedSpells`, guardado versión 10; no va a la bolsa ni se pierde). La partida simulada no elige hechizos de libro. Atajos `?debug=bluebook` y `?gear=learn:bloodyShockWave`; situaciones `check bloodyshock` / `earthshock` / `blizzard` / `bluebook` / `equipmentlearned`. Ver NOTES.md, "Hechizos en línea y Libro Azul (Fase 26E)".
- **Decisiones del propietario:** el libro cae muy raro de cualquier monstruo, se aprende para siempre y cae sin la Int; daño y maná a criterio de Claude (23-oct-2026).
- **Comprobado:** build; `check bloodyshock earthshock blizzard bluebook equipmentlearned icestrike activespell lootmage` sin errores a 60 FPS; capturas de los tres hechizos a mitad de camino y del libro en el suelo; aprender guardado en `localStorage`; Bloody Shock Wave solo en Equipment una vez aprendido. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → `?play=mage&spells=blizzard&debug=crits,horde` (Espacio; o `earthShockWave`, `bloodyShockWave`); `?play=mage&characters=demo&debug=bluebook`.

**Fase 26D — Ice Strike, Mass Ice Strike y ralentizar (2026-10-23).**
- **Qué se hizo:** dos hechizos nuevos en el Spell 2 de la Maga: **Ice Strike** (Int 50, 29 de maná) y **Mass Ice Strike** (Int 100, 57 de maná). Lluvia de trozos de hielo que caen a la vez del cielo, como en el original (21 y 32 trozos, `effect4` hojas 2 y 3, sonido E46); uno y dos golpes de área. Tipo de activo nuevo `'iceShards'` (`systems/IceShardRain.ts`, con pool). Los monstruos tocados quedan **ralentizados** (`Enemy.slow`): a cámara lenta y teñidos de azul claro; normales a la mitad 3 s, jefes, minijefes y Champions −25% 1,5 s (`ICE_SLOW`). Situaciones `check icestrike` / `massicestrike`. Ver NOTES.md, "Ice Strike, Mass Ice Strike y ralentizar (Fase 26D)".
- **Decisiones del propietario:** plan y números de ralentizar aprobados tal cual (23-oct-2026).
- **Comprobado:** build; `check menu icestrike massicestrike equipmentmage activespell totems` sin errores a 60 FPS; ralentizar medido (dura ~3 s y se quita); bajas por lanzamiento frente a los otros activos; capturas de la caída y de la lista de Equipment. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → `?play=mage&spells=massIceStrike&debug=horde,crits` (Espacio); `iceStrike` para el pequeño; `?characters=demo&open=equipment&class=mage&slot=spell2`.

**Fase 26C — Hechizos automáticos nuevos y escalera de Int (2026-10-23).**
- **Qué se hizo:** tres hechizos nuevos en el Spell 1 de la Maga: **Lightning Arrow** (rayo, Int 30: flecha rápida con chispas, de largo alcance; pega fuerte al objetivo y un poco a los de al lado), **Chill Wind** (hielo, Int 40: 4 gotas de hielo caen del cielo y dañan una zona; no ralentiza) y **Lightning Bolt** (rayo, Int 55: un rayo cae del cielo; mucho daño y poco alcance). Tipo de hechizo nuevo "cae del cielo" (`aim: 'sky'`), rayo dibujado a mano (`entities/LightningArc.ts`) y estela de chispas. Requisitos de Int en **escalera** (Mass Fire Strike 85 → 75, Meteor Strike 169 → 140; ninguno sube). Atajo `&slot=spell1` para abrir Equipment en un hueco. Ver NOTES.md, "Hechizos nuevos: Lightning Arrow, Chill Wind y Lightning Bolt (Fase 26C)".
- **Decisiones del propietario:** lista de hechizos de la Fase 26 y su reparto en 26C/26D/26E, escalera de Int y área pequeña de Lightning Arrow (en `docs/DECISIONES.md`).
- **Comprobado:** build; `check menu equipmentmage mana game` y cada hechizo con horda sin errores a 60 FPS; animaciones cargadas solo en partidas de Mago; muertes por segundo medidas frente a los hechizos de antes. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → `?play=mage&spells=lightningArrow&debug=horde,god` (o `chillWind`, `lightningBolt`); `?characters=demo&open=equipment&class=mage&slot=spell1`.

**Fase 26B — Apuntar el Spell 2 en el móvil (2026-10-22).**
- **Qué se hizo:** con la Maga, el botón rojo del móvil es un stick: mantener, arrastrar y soltar lanza el Spell 2 en esa dirección, a media distancia de su alcance (`stickShare`), haya o no monstruos. Mientras se arrastra salen la flecha del apuntado manual a los pies y un anillo en el suelo donde caerá (más apagado sin maná). Tocar sin arrastrar apunta solo. El centro sigue al dedo y el dedo se lee de los eventos del navegador. Primera versión: no giraba hacia abajo junto al borde; arreglado tras probarlo el propietario. How to Play y What's new al día. Ver NOTES.md, "Apuntar el Spell 2 en el móvil (Fase 26B)".
- **Decisiones del propietario:** en PC nada cambia (clic derecho / stick derecho o automático); en el móvil siempre a media distancia; el botón del Guerrero igual.
- **Comprobado:** build; `check spelldrag mana game --mobile`, `activespell` y How to Play sin errores; arrastres táctiles simulados (Playwright + CDP): hacia abajo hasta el borde, girar tras subir, soltar lanza y tocar apunta solo. Probado por el propietario en el móvil: bien.
- **Probar:** `pnpm --dir survivors dev` → en el móvil `http://<IP>:8090/?play=mage`; en PC, `?play=mage&debug=spelldrag&ui=compact` (dedo de mentira).

**Fase 26A — Maná del Spell 2 (2026-10-22).**
- **Qué se hizo:** el Spell 2 de la Maga ya no tiene recarga: **gasta maná**, cada hechizo el suyo (la mitad del original: Energy Strike 32, Mass Fire Strike 36, Meteor Strike 60). El maná se rellena solo con la Mag (Mag 14 → 2,7/s), más un 30% con la ropa MP Recovery; el Mana Save de las varitas abarata el hechizo (fuera los "(soon)"). **Blue Potion** nueva (solo con la Maga, 0,4%, +30% del maná). El botón rojo, apagado, enseña el maná que falta; el panel de stats, el coste. El maná se guarda al continuar. How to Play al día. Ver NOTES.md, "Maná del Spell 2 (Fase 26A)".
- **Decisiones del propietario:** recuperar solo con Mag; Blue Potion nueva; coste distinto por hechizo; el Spell 1 sigue gratis.
- **Comprobado:** build; `check menu mana nomana activespell lootmage` y `nomana --mobile` sin errores; gastar, rellenar, Blue Potion y Continue medidos con `--eval`; `pnpm balance` de la Maga en Bleeding Isle y Elvine Garden igual que antes del bloque. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → `?play=mage&debug=horde` (Espacio), `?play=mage&debug=nomana`, `?play=mage&debug=pickups`.

**Fase 25 — Arreglos rápidos (2026-10-22, un bloque).**
- **Qué se hizo:** (1) la app instalada se reconoce por `?app=1` y no por `display-mode: fullscreen`, así Chrome a pantalla completa (F11, Steam) ya no esconde el botón; (2) botón redondo de pantalla completa en pantallas táctiles, en la partida y en la ciudad, junto a la pausa (barra del jefe más estrecha en el móvil); (3) con touchpad o ratón (Steam Deck, Legion Go) no se entra en modo móvil; (4) la pantalla final ya no muestra arma ni armadura, y lo demás queda centrado; (5) en el móvil, panel a la derecha de la ventana Character con el stat elegido y − / + grandes. Ver NOTES.md, "Pantalla completa y consolas (Fase 25)".
- **Comprobado:** build y `check` de menú, charinfo, partida, jefe y ciudad (PC y móvil) sin errores; pantalla final con `charexp`. Probado por el propietario: bien. Falta una consola real (tras publicar).
- **Probar:** `pnpm --dir survivors dev` → `?characters=demo&open=charinfo&ui=compact` (stats), `?play&debug=onehp` (pantalla final), Chrome con F11 en http://localhost:8090 (botón en el menú).

**Texto nítido (fuera de fase, 2026-10-22).**
- **Problema:** el texto se veía borroso y con letras rotas en PC y móvil. El lienzo medía 800×600 y el navegador lo estiraba; además el texto se preparaba a ×3 y se encogía sin suavizar (`pixelArt`).
- **Qué se hizo:** el lienzo mide 800×600 × `RENDER_SCALE` (1–3 según la densidad de la pantalla; `?scale=N` para probar) y `RenderScalePlugin` pone cada cámara con ese zoom; el texto se prepara a la misma escala (1:1). Lo fijo en pantalla (minimapa, sticks, botones táctiles, textos de depuración) va en `ScreenLayer`; los toques pasan por `toGame()`; viewport de la partida con `setGameViewport()`. Código en `ui/renderScale.ts`; ver NOTES.md, "Nitidez".
- **Comprobado:** build; `check` de menú, personajes, partida, ciudad, ajustes, cartas, equipo, baúl, herrero, tienda, mapas y horda a ×3 sin errores a 60 FPS; en móvil a ×2, joystick bajo el dedo y botón de pausa funcionando. Probado por el propietario en iPhone: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=demo&open=slots (comparar con `&scale=1`).

**Revisión de la dificultad (fuera de fase, 2026-10-22).**
- **Qué se hizo:** herramienta de simulación (`pnpm balance`: partidas simuladas en paralelo con vida "de mentira", perfil `?level=N` con puntos y mejor equipo, `?bot=stand`, carrera en horas con `scripts/progression.mjs`) e informe con 330 partidas simuladas y las 30 reales de las métricas (https://claude.ai/artifact/Xk8DCaCytHNP1yASM2sFBV). Hallazgos: muro hacia el minuto 7–8 de cada mapa por la "bola" de monstruos, jefes muy fáciles, Level y +3 casi no ayudaban a aguantar, la Maga moría 2–3 veces antes, ~550 de oro por hora.
- **Cambios (aprobados por el propietario):** B +2 de vida por Level del personaje; C Maga vida ×1,15 y Robe/Wizard Robe Mag 35, Wizard Cap 50, Wizard Hat 70; D jefes ×2 de vida; E monedas al 4% y mejoras a 0,5×/1,5×/3×; G vida de los monstruos normales comprimida (`MONSTER_HP`, Ogre 1.040 → ~510) y +4% de daño por Power (`DAMAGE_PER_POWER`). A (bajar el golpe de los monstruos) rechazada; F pendiente de que el propietario pruebe. What's new: página "Balance update".
- **Fallo arreglado:** el Fire Wyvern podía congelar la partida con carga lenta (animación vacía en `HBAsset.partialAnimation`).
- **Resultado simulado:** jefes 19–92 s (antes 11–61); la bola a la mitad; el Guerrero mata de un golpe al 76–93% y muere la mitad de veces; la Maga al 35–43% (antes 12–19%). El bot aún no gana Bleeding Isle. Quedarse quieto (`?bot=stand`) es seguro en Traveler Zone con equipo, pero en Bleeding Isle muere el doble de pronto.
- **Comprobado:** build; `check game boss news charinfo equipmentmage smithupgrade` y Middleland con la Maga sin errores; 12 partidas seguidas sin el cuelgue.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090; Maga nueva en Traveler Zone: `?play=mage&map=traveler`. Tabla: `pnpm --dir survivors balance` (~20 min).

**Personajes fijos (fuera de fase, 2026-10-22).**
- **Qué hace:** cada cuenta trae ya **Gorn** (Guerrero, hueco 1) y **Kaila** (Maga, hueco 2), con nombre y aspecto fijos. Los huecos 3 y 4 salen **"Locked"** con una silueta oscura y quieta; al elegirlos, "Locked. New characters will be unlocked in the future." Los botones Create New Character y Delete Character salen apagados; la pantalla Create Character ya no existe. Los personajes guardados antes **se borran** con sus partidas (todos empiezan de cero); baúl, oro y desbloqueos de la tienda se conservan. What's new al día.
- **Decisiones del propietario:** nombres Gorn y Kaila; empezar de cero; huecos bloqueados con "Locked" y una silueta que no se distingue.
- **Código:** `FIXED_CHARACTERS` e `isLockedSlot` (`data/characterSlots.ts`); `SLOTS_LOCKED` (`config/characterSlots.ts`); `CharacterStore.fillFixedCharacters`, `CHARACTERS_VERSION` 9 (lo anterior se tira), fuera `create`/`delete`/`firstFree`; `?play` juega con el personaje fijo de la clase; borrados `CharacterSelectScene` y `ui/TextInput.ts` (y el atajo `?open=select`). Ver NOTES.md, "Personajes guardados (Fase 17A)".
- **Comprobado:** build; `check menu slots slotsempty game town mapsnew` sin errores (~60 FPS); captura de `slotsempty` con Gorn, Kaila y dos siluetas. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090 → Play.

**Fase 24, bloque 24D: mejorar armas en el herrero (2026-10-22).**
- **Qué hace:** Tom tiene una tercera pestaña, **Upgrade** (letrero original "Item Upgrade" y botón Upgrade). Lista el arma o varita puesta ("Equipped") y las del inventario, con el oro del siguiente "+" o "Max". Cada "+" cuesta oro y **1 Stone of Xelima del inventario**, pide pulsar Upgrade dos veces y **siempre sale bien**. Cada "+" da **+10% de daño** (para la Maga, a sus hechizos), multiplicado con el atributo. El "+" se ve en el nombre ("Long Sword +2") en Equipment, baúl, venta y botín, y se guarda puesto, en el inventario y en el baúl. Vender un arma mejorada paga también ¼ del oro de las mejoras. La daga y la varita MS0 de salida, mejoradas, pasan a ser un objeto de verdad (al quitárselas van al inventario). **Tecla I en la ciudad** abre Equipment (petición del propietario). How to Play y What's new al día.
- **Decisiones del propietario:** +10% por cada +, siempre sale bien, 1 piedra por cada + (22-oct); plan aprobado tal cual: también varitas, equipo de salida y Ancient; tecla I.
- **Decidido por mí (ajustable):** oro de cada + = 1× / 2,5× / 6× el precio del arma en Tom (Long Sword 750 → 750 / 1.900 / 4.500); venta + ¼ del oro de mejoras; confirmar con dos pulsaciones; sonido E28.
- **Código:** `data/upgrades.ts` (nuevo); `OwnedItem.upgrade` y `sameOwnedItem` (`data/loot.ts`); `SavedCharacter.upgrades`, `CHARACTERS_VERSION` 8, `equip(uid, slot, item)`, `upgrade()`, `isPlainFreeItem` (`CharacterStore`); `Equipment.weaponUpgrade` / `weaponDamageBonus`; precios en `data/smith.ts`; pestaña en `SmithScene`; `Action.OpenInventory` (I) y `TownScene.openInventory`; atajos `?xelima=N`, `?upgrade=N`, `?gear=up2:id`, `smith=upgrade`, `?open=town&class=warrior`; checks `smithupgrade`, `upgradedmg`. Ver NOTES.md, "Mejorar armas en el herrero (Fase 24D)".
- **Comprobado:** build; `check smithupgrade upgradedmg smith smithsell game` y `--mobile` sin errores (~60 FPS); por `--eval`: daga +1 por 300 y una piedra, Long Sword +2 → +3 por 4.500, a +3 "Max" sin cobrar, venta de la +3 a 1.980; daga +3 en partida = +30% de daño; la tecla I abre Equipment con la ciudad en pausa. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=demo&class=warrior&open=town&town=tom&smith=upgrade&gold=20000&xelima=5&gear=up2:longSword,sharp:longSword → elegir, Upgrade dos veces. En la ciudad, I abre Equipment.

**Fase 24, bloque 24C: herrero (comprar y vender) y Stone of Xelima (2026-10-22).**
- **Qué hace:** Tom tiene **Buy**, **Sell** y **Upgrade** ("Coming soon" hasta el 24D). Ventana con el panel del martillo del original y los letreros "Item for Sale" (Buy) y "Exchange Item" (Sell), pestañas Buy/Sell, lista por huecos que se desplaza (rueda, flechas, mando, ▲/▼, dedo). Buy: todas las armas (o varitas) y armaduras básicas de la clase; lo que aún no puede ponerse, en rojo con "Needs ..." y sin comprar; va al inventario. Sell: el inventario del personaje de la ciudad, agrupado ("×2"), a ¼ del precio (más con atributo); pide pulsar Sell dos veces. **Stone of Xelima**: cae muy rara de cualquier monstruo, va a la bolsa sin carta, cuenta como botín (se puede perder al morir sin Zem), se guarda en inventario/baúl y Tom la compra a 250. How to Play (Town y Warehouse) y What's new al día.
- **Decisiones del propietario:** 24C partido en 24C (comprar/vender) y 24D (mejorar); mejora +10% por cada +, siempre sale bien, 1 Stone of Xelima por cada +; la piedra cae de cualquier monstruo, muy rara, desde ya; vender solo el inventario; se ve todo pero solo se compra lo que se puede llevar.
- **Decidido por mí (ajustable):** piedra 0,05%; precio 200 + 40×Str + 20×Mag/Int + 40×Level (redondeo a 50, máx. 6.000); venta ¼, atributo ×1,5 (Ancient ×3); Tom no vende equipo de salida ni varitas raras ni compra el Zem; la frase de Tom; opciones del panel de NPC un poco más juntas para que quepan 3 + Back.
- **Código:** `data/smith.ts`, `config/smith.ts`, `scenes/SmithScene.ts` (nuevos); `xelimaStone` en `data/consumables.ts` (`slot` opcional en `ConsumableDef` e `ItemInfo`); `LOOT_XELIMA_CHANCE` y `LootSystem.onKill`; acciones `smithBuy`/`smithSell` en `data/town.ts` y `NpcDialogScene`; `NPC_DIALOG_LIST` en `config/town.ts`; Warehouse con "Blacksmith" para objetos sin hueco; `?town=tom&smith=buy|sell`, `?debug=xelima`; checks `smith`, `smithsell`, `xelima`. Ver NOTES.md, "Herrero y Stone of Xelima (Fase 24C)".
- **Comprobado:** build; `check smith smithsell` (también `--mobile`), `shop towntalk loot equipmentowned`, baúl con piedra y How to Play sin errores (~120 FPS); por `--eval`: comprar MS10 5.000 → 4.200 y al inventario, MS20 bloqueada sin cobrar ("You can't use it yet."), vender pide confirmar y paga 200; con `?debug=xelima` caen 8 piedras y van a la bolsa. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?open=town&characters=demo&gold=50000 → Tom, E, Buy / Sell. Piedra: `?play=warrior&characters=demo&debug=xelima`.

**Fase 24, bloque 24B: la tienda (2026-10-22).**
- **Qué hace:** la Shop Keeper ya no dice "Coming soon": su opción **Shop** abre la ventana **"Item for Sale"** del original (pergamino con bolitas de plata, letrero, columnas ITEM / PRICE y secciones Stones, Blessings y Power Cards), con la **miniatura** de cada cosa (Zem, Red Ball, vino; el dado, dibujado). Vende **Zemstone of Sacrifice** (al inventario del personaje de la ciudad, sin límite), **Abaddon's Blood** (una vez) y **dado / vino** (hasta 3, cada uno más caro; "Dice (1/3)"). Lo agotado sale **"Sold out"** en gris claro con la miniatura apagada; un precio que no puedes pagar, en rojo, y Purchase apagado. Elegir una fila muestra qué hace; compra el botón **Purchase** (Enter dos veces con teclado/mando). Esc o Cancel cierran.
- **Decisiones del propietario:** el aspecto de la ventana (su captura del original), miniaturas y "Sold out" más claro. Precios los previstos en DECISIONES: Zem 1.500, Abaddon's Blood 10.000, dado y vino 2.000 / 4.000 / 8.000.
- **Decidido por mí (ajustable):** secciones y su orden, la frase de la Shop Keeper, comprar con un paso (elegir + Purchase) para no gastar oro sin querer.
- **Arreglado tras probar el propietario:** los botones salían corridos (`setFrame` devuelve el origen al pivote del frame; ahora `setFrame(f, true, false)`), y al volver de Equipment en la ciudad el personaje perdía su ropa de serie (`TownScene.redressIfChanged` ahora pone la de `appearance` y encima lo equipado).
- **Código:** `data/shop.ts`, `config/shop.ts`, `scenes/ShopScene.ts` (nuevos); acción `shop` en `data/town.ts` y `NpcDialogScene`; `sources: ['bossDrop', 'shop']` del Zem; atajo `?town=shopKeeper&shop` (`DEBUG_START.townShop`); `check shop` / `check shopsold`. Ver NOTES.md, "Tienda (Fase 24B)".
- **Comprobado:** build; `check shop shopsold town` y `shop shopsold --mobile` sin errores (~120 FPS); por `--eval`: con 50.000 de oro, Abaddon + 3 dados + Zem dejan 24.500, el cuarto dado no se cobra, el Zem llega al inventario; con 2.000, "Not enough gold." sin cobrar; poner y quitar el Zem deja la ropa de serie.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?open=town&gold=50000 → Shop Keeper, E, Shop; comprar Abaddon's Blood (sale "Sold out") y 3 dados. Atajo directo: `?open=town&town=shopKeeper&shop&gold=50000`.

**Fase 24, bloque 24A: oro, botín especial y muerte a medias (2026-10-21/22).**
- **Qué hace:** los monstruos sueltan a veces **monedas** (dibujo "Gold" del original; los élite más, el imán las atrae) y los minijefes, el Champion y el jefe final, **montones** alrededor. El oro de la partida sale en la barra de abajo ("12 gold") y en la pantalla final ("+250 gold (1,250)"); se suma al oro del dispositivo (los 4 personajes) **ganes o mueras**. **Solo cae botín especial:** armas siempre con Sharp/Poison/Ancient (pesos 10/5/1) y armaduras con un atributo de nombre original: **HP Recovery** +30% de curación, **Defense Ratio** +10 (esquiva), **Magic Resistance** +8, **MP Recovery** +30% (solo ropa de la Maga, "(soon)"). Botín rebajado a ~3–4 piezas por partida ganada. **Al morir sin Zem se pierde la mitad** del botín de la partida redondeando en contra (3 → 2), al azar; la pantalla final los atenúa y dice "Lost 2 of 3 items". Con Zem no se pierde nada. How to Play al día.
- **Decisiones del propietario:** Fase 24 replanteada (básicos al herrero, drops solo especiales, tienda con Zem/Abaddon/dados/vinos, mejoras +1..+3 de armas siempre con éxito, precios "challenging", oro de monedas + jefes + vender, muerte a medias, Zem salva todo, nombres originales en las armaduras). Todo en `docs/DECISIONES.md`.
- **Decidido por mí (ajustable con métricas):** monedas 2% (élite 25%) de 2 de oro, montones de 10 (minijefe 3, Champion 2, final 6), mapas ×0,7/×1/×1,4/×1,8 → ~250 por partida de Bleeding Isle; botín: normal 0,02%, élite 1%, minijefe 40%, final 1, Champion 1; valores fijos de los atributos de armadura; oro compartido por el dispositivo. Precios previstos para 24B/24C en DECISIONES.
- **Código:** `data/gold.ts`, `systems/GoldStore.ts` (nuevos); pickups `coin` / `goldPile`; `GameScene.runGold`, `dropGoldPiles`, `RunSnapshot.gold`; `WeaponAttribute` / `ArmorAttribute` y `kind` en `data/attributes.ts`; `canHaveAttribute`, `ownedItemName` en `data/items.ts`; `rollAttribute` por pesos en `LootRoller`; `Equipment.wear(piece, attribute)` y `hpRecovery`; `finishRun` con `itemsLostOnDeath` y `RunLootResult.lost` (lista); `?gold=N`; checks `gold`, `lootarmor`. Nota en NOTES.md, "Oro, botín especial y muerte a medias (Fase 24A)".
- **Comprobado:** build; `check menu game gold deathnozem deathzem lootarmor --mobile` y `lootmage loot equipmentowned warehouse` sin errores (~123 FPS); por `--eval`: moneda + montón = 12 de oro; sin Zem 3 encontrados → 2 perdidos; con Zem 0 perdidos y Zem gastado; armaduras con atributo suben esquiva (18 → 28), resistencia (+8) y curación (×1,3). Pendiente de probar por el propietario.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&characters=demo&debug=loot → monedas y botín con atributo; U y morir → pantalla final; con `&gear=zemstone`, nada perdido.

**Fase 23, bloque 23B: NPCs y hablar (2026-10-21).**
- **Qué hace:** en la ciudad hay NPCs quietos con su animación, sombra y nombre (azul claro): Howard junto a la casa oscura, Shop Keeper y William junto a la casa-tienda, Tom junto al edificio de la derecha. No se les atraviesa. Al acercarse sale "Talk"; se habla con **E**, botón **A** del mando, un clic en el NPC o el botón táctil "Talk" (abajo a la derecha, solo cerca). Panel con el diseño de GameDialog, su frase y opciones: William → Achievements y Missions ("Coming soon"); Howard → Equipment y Warehouse (al salir se vuelve a la ciudad y el personaje se viste con lo nuevo); Shop Keeper y Tom → "Coming soon". Fuera los botones Equipment y Warehouse de Select Character y sus teclas I/O (X/R1). Minimapa con NPCs (azul claro) y teleport (violeta). How to Play: página "Town" y Equipment / Warehouse al día.
- **Sitios:** los puntos amarillos de la captura del propietario, afinados luego con sus flechas sobre capturas del juego (Tom junto al yunque, como golpeándolo). Hubo un Cofre en el suelo junto a Howard; el propietario lo quitó: con Howard basta.
- **Decidido por mí (ajustable):** las frases de los NPCs; las direcciones en que miran; distancia para hablar 56 px.
- **Código:** `TOWN_NPCS`, `TOWN_TALK`, `isNpcId` en `data/town.ts`; `config/town.ts` (aspecto); `entities/Npc.ts`; `scenes/NpcDialogScene.ts`; `ui/TalkButton.ts`; sprites `npc.*` en `config/assetManifest.ts` (tipo Monster) y en `TOWN_SPRITES` de `MapLoadScene`; `HBMap.blockTile`; `Action.Talk` en `InputSystem` (sustituye a `OpenEquipment` / `OpenWarehouse`); `Minimap` con `npcs` y `portals`; `?town=<npc>` y `&talk` (`townSpot`, `townTalk` en `debugStart.ts`); checks `townnpc`, `towntalk`. Nota en NOTES.md, "NPCs y hablar (Fase 23B)".
- **Comprobado:** build; `check townnpc towntalk town townportal` y `townnpc towntalk slots --mobile` sin errores (~123 FPS); por `--eval`: E abre el panel, "Coming soon", Achievements → cerrar → ciudad, E otra vez, Howard → Equipment → cerrar → ciudad, vestir de nuevo al volver. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090 → Play → personaje → ir a William y pulsar E. Atajo: `?open=town&town=william&talk` (o howard, shopKeeper, tom).

**Fase 23, bloque 23A: la ciudad y el recorrido (2026-10-21).**
- **Qué hace:** tras elegir personaje (o "New Run") se aparece en la **ciudad**: un recorte de la granja de Elvine elegido por el propietario sobre una captura, con música `elvine.mp3`, minimapa y sin monstruos, XP, armas ni barra de vida. Se anda con teclado, mando o joystick. Pisar el **teleport** (césped de abajo) abre Select Map por encima de la ciudad; "Back" vuelve al momento sin recargar y "Play" entra en el mapa. El botón del medio de la pantalla final es ahora **"Town"** (marco del "Ok" del original con la palabra encima) y vuelve a la ciudad. "Continue" sigue yendo directo a la partida. Esc / Start (y el botón "II" en el móvil) abre la pausa.
- **Decisiones del propietario:** granja de Elvine (no Aresden ni interior), su trozo exacto y los sitios de NPCs y teleport; música de Elvine; fuera Equipment y Warehouse de la selección de personaje (se hace en el 23B, con el Cofre, para no dejar sin acceso); pantalla final Restart / Town / Log out; volver de Select Map sin recargar la ciudad.
- **Código:** `data/town.ts`, `scenes/TownScene.ts`, `ui/TouchPauseButton.ts` (compartido con el HUD); `MapLoadScene` con `{ town: true }` y `startTown()`; `LATER_SOUNDS` en `config/assetManifest.ts` (la música no va antes del menú); `MapSelectScene` con `fromTown`; `GAME_OVER.townButton` en `config/hud.ts`; `Player.setHealthBarVisible`; minimapa con `setScrollFactor(0)`; `?open=town`, `?town=portal`; checks `town`, `townportal`, `loadtimetown`. Nota en NOTES.md, "La ciudad (Fase 23A)".
- **Comprobado:** build; `check menu town townportal game mapselect runchoice slots` y `town --mobile` sin errores (~120 FPS); por `--eval`: Back reanuda la ciudad sin cargar otra vez, Play → partida → morir → Town → ciudad en el centro, New Run → ciudad, andar con la flecha, pausa en el móvil. Carga de la ciudad: 13,3 MB, 3,0 s en PC y 14,1 s en móvil. Probado por el propietario: bien.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090 → Play → personaje → granja; andar al teleport; Back; entrar en un mapa, U para morir, Town. Atajo: `?characters=demo&open=town`.

**Fase 22, bloque 22G: sombras y skill `anadir-mapa` (2026-10-21). Cierra la Fase 22.**
- **Qué hace:** el jugador tiene sombra, como en el original: una sola, sacada del cuerpo desnudo (sin ropa ni arma), negra al 50%, girada −45° y aplastada, fotograma a fotograma. Desaparece al morir y vuelve al revivir con Abaddon's Blood. El Unicorn ya no tiene sombra (en el original no la tiene); el resto de monstruos coincidía.
- **Código:** `BODY_SHADOW_*` en `config/gameConfig.ts` (antes `MONSTER_SHADOW_*`, ahora compartidos); `CharacterSprite.bodyFrame()`; `Player.syncShadow()`; `hasShadow: false` del Unicorn en `data/enemies.ts`. Skill nueva `.claude/skills/anadir-mapa/SKILL.md`. Nota en NOTES.md, "Sombras del jugador y los monstruos (Fase 22G)".
- **Comprobado:** build; `check horde` y `horde --mobile` a 137–139 FPS con 293 monstruos, igual que antes; sombra visible a los pies (captura con zoom); muerte y resurrección por `--eval`; `check menu middlelandboss traveler` sin errores.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior; sombra oscura inclinada a los pies; U y dejarse matar → desaparece.

**Fase 22, bloque 22E: Middleland (2026-10-21).**
- **Qué hace:** Middleland ya se puede jugar (antes "Coming soon"). Se abre al ganar Elvine Garden o con Level 40. 15 minutos, monstruos normales con vida y daño ×1,6. Monstruos: Orc, Zombie, Scorpion, Skeleton, Snake, Werewolf, Troll, Ogre, Cyclops, Stalker y Ettin. Jefes: **Mountain Giant** (min 4), **Giant Lizard** (min 8, nuevo), **Ettin Berserk** (min 12, rojo como los élites) y **Unicorn** (jefe final, min 15, nuevo: lanza 5 rayos de Energy Strike y llama a Stalkers y Werewolf). Eventos: horda de Zombies "Horde approaching!" (2:30), estampida de orcos (5:30), esqueletos (7:00), Werewolf (9:30), estampida de Trolls (10:30) y manada de Stalkers (13:30). Logros nuevos "Warlord of Middleland" (ganar el mapa) y "Unicorn Hunter".
- **Carga:** cada mapa baja solo las casillas de su zona de juego (más el margen que se dibuja). Middleland 25,0 → 16,4 MB; los demás igual.
- **Decisiones del propietario:** lista de monstruos y jefes (tras ver la del Middleland original, que no tenía Troll, Hellhound ni Hellclaw), horda de Zombies y manada de Stalkers, ×1,6, 15 minutos, empezar con Orc / Zombie / Scorpion.
- **Decidido por mí (ajustable):** el resto de eventos; vida de los jefes (3500 / 7000 / 11000 / 20000) y `damageScale`; los rayos del Unicorn; esbirros; los dos logros.
- **Código:** `enemy.giantLizard`, `enemy.unicorn` y sus `sfx` en `config/assetManifest.ts`; `ettinRegular`, `mountainGiantBoss`, `giantLizard`, `ettinBerserk`, `unicorn`, `EnemyDef.glows` y esbirros en `data/enemies.ts`; `Enemy.syncGlowTexture`; `MIDDLELAND_WAVES`/`EVENTS` en `data/waves.ts`; `middleland` en `data/maps.ts`; `HBMap.requiredTileIndices(area, margen)` y `MapLoadScene`; logros; situaciones `check middleland`, `middlelandboss`, `levelpacemiddleland`, `loadtimemiddleland`.
- **Comprobado:** build; `check middleland middlelandboss mapsall traveler elvine finalboss` sin errores; capturas de Unicorn, Giant Lizard y Ettin Berserk; esquina de la zona de juego sin casillas perdidas. Partida simulada: Power 31 al final; jefes 35 / 39 / 53 / 87 s; cada golpe de jefe quita un 13–18%.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?maps=all → Play → personaje → Select Map → Middleland. J adelanta un minuto; `?play=warrior&map=middleland&debug=god,finalboss` va al Unicorn.

**Fase 22, bloque 22D: Elvine Garden (2026-10-21).**
- **Qué hace:** Elvine Garden ya se puede jugar (antes "Coming soon"). Se abre al ganar Bleeding Isle o con Level 25. 12 minutos, monstruos normales con vida y daño ×1,3. Monstruos: Orc, Orc-Mage, Zombie, Scorpion, Giant Frog, Troll, Werewolf, Cannibal Plant y el nuevo **Giant Tree** (`giantplant.spr`, 918 KB). Jefes: **Hellhound** (min 4), **Stalker** (min 8) y **Cyclops** (jefe final, min 12, con esbirros Troll, Giant Tree y Orc-Mage), versiones de jefe aparte (en Bleeding Isle no cambian). Eventos: encerrona de Orc-Mages (2:30), estampida de orcos (3:30), encerrona de Trolls (6:30) y de árboles (9:30). Logro nuevo "Garden Keeper" (ganar el mapa).
- **Decisiones del propietario:** Giant Tree como monstruo nuevo (Unicorn y Amphis no); Hellhound y Stalker de minijefes (no salen como normales); Cyclops jefe final; añadir Scorpion, Zombie y Giant Frog; encerrona de Orc-Mages; ×1,3 y 12 minutos.
- **Decidido por mí (ajustable):** vida de los jefes (2600 / 5500 / 12000) y su `damageScale` (1,1 / 0,9 / 1,2); números del Giant Tree (NPC.cfg "Giant-Plant": ATime 700, alcance 2, 8d6, HR 200; vida 760 y XP 152, nuestros); pesos de las oleadas; las otras encerronas; logro "Garden Keeper".
- **Código:** `enemy.giantTree` y `sfx.giantTree.*` (M120/M121/M123) en `config/assetManifest.ts`; `giantTree`, `hellhoundBoss`, `stalkerBoss`, `cyclopsBoss` y esbirros en `data/enemies.ts`; `ELVINE_WAVES`/`ELVINE_EVENTS` en `data/waves.ts`; `elvineGarden` en `data/maps.ts`; `winElvine` en `data/achievements.ts`; situaciones `check elvine`, `elvineboss`, `levelpaceelvine`, `loadtimeelvine`.
- **Comprobado:** build; `check elvine elvineboss mapsall` sin errores; capturas del Giant Tree con zoom y del Cyclops. Partida simulada: Guerrero y Maga Power ~30 al final; Hellhound ~26 s, Stalker ~25–33 s, Cyclops ~50–80 s (Bleeding Isle: 21 / 25 / 61 s); cada golpe de jefe quita un 15–17% de la vida. Carga del mapa: 14,0 MB (PC 3,0 s; móvil 14,5 s).
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?maps=all → Play → personaje → Select Map → Elvine Garden. J adelanta un minuto; `?map=elvineGarden&debug=god,finalboss` va al Cyclops.

**Fase 22, bloque 22C: Traveler Zone completa (2026-10-21).**
- **Qué hace:** nuevo monstruo **Cat** (`cat.spr`, 184 KB, solo en Traveler Zone): sale desde el minuto 0 en todas las oleadas, entre los bichos que rodean al Dummy y en una encerrona nueva en el 3:30 ("Cats everywhere!", 28 gatos). Traveler Zone más difícil: bichos normales con vida ×0,7 y daño ×0,6 (antes ×0,5 / ×0,4), ~15–20% más a la vez y algo más seguidos desde el minuto 3. Los jefes no cambian.
- **Decisiones del propietario:** Traveler Zone demasiado fácil; jefes bien así; Cat como bicho normal y también en una encerrona.
- **Decidido por mí (ajustable):** números del Cat (NPC.cfg: ATime 1500, alcance 1, valentía 3, 2d4, HR 45; vida 20 y XP 4, nuestros); multiplicadores 0,7 / 0,6; pesos y `maxAlive` de las oleadas.
- **Código:** `enemy.cat` y `sfx.cat.*` (M80/M84/M76) en `config/assetManifest.ts`; `cat` en `data/enemies.ts` (y en los bichos del Dummy); `TRAVELER_WAVES`/`TRAVELER_EVENTS` en `data/waves.ts`; `localEnemies` y `difficulty` de Traveler en `data/maps.ts`.
- **Comprobado:** build; `check traveler travelerboss game` y `traveler --mobile` sin errores; captura con zoom de gatos andando. Partida simulada en Traveler: Guerrero Power 16 (igual; más daño recibido), Maga Power 19 (antes 17); Stone Golem y Dummy duran parecido. El propietario lo probó y le parece bien.
- **Probar:** `pnpm --dir survivors dev` → Play → personaje → Select Map → Traveler Zone; J adelanta un minuto (encerrona de gatos en el 3:30).

**Fase 22, bloque 22B: carga por mapa (2026-10-21).**
- **Qué hace:** antes del menú solo se baja lo de los menús (interfaz, personajes, sonidos). Al elegir mapa, su pantalla de carga baja el mapa, los monstruos de **su** primera oleada, los efectos de partida y los objetos del suelo; los efectos del Mago solo si juegas de Mago. El resto de monstruos, en segundo plano y solo los de ese mapa. Arreglado: se bajaban antes del menú monstruos que no salen en ningún mapa (Gargoyle, Tigerworm, Hellclaw…).
- **Tiempos (Guerrero en Bleeding Isle, red simulada):** carga inicial 29,7 → 15,7 MB (y 9,5 MB tras el recorte de abajo); PC 7,2 → 4,4 s; móvil 34,4 → 20,6 s. Carga del mapa 6,1 → 11,7 MB (PC 1,6 → 2,6 s; móvil 6,8 → 12,3 s). Hasta la partida, en móvil: 41 → 33 s. Lo lento es descargar, no preparar (~20%).
- **Decidido por mí (ajustable):** perfiles de red de la medición; no liberar memoria al cambiar de mapa (no hizo falta); el menú ya no descarga monstruos de antemano.
- **Código:** `systems/LoadTimer.ts` (nuevo), `RUN_SPRITES` en `config/assetManifest.ts`, `runSprites` en `data/characters.ts`, `scenes/MapLoadScene.ts`, `scenes/PreloadScene.ts`, `systems/AssetStreamer.ts` (`start(scene, map)`, `firstWaveEnemies`; fuera `prioritize`, `UPFRONT_ENEMIES`, `STREAMED_SPRITES`); situaciones `check loadtime`, `loadtimetraveler`, `loadtimemage`.
- **Comprobado:** build; `check menu loading mapselect slots equipment warehouse game traveler travelerboss pickups totems portal crit activespell loot poison elites stampede boss debug=resume` y `game traveler --mobile` sin errores; por dentro: portal, golpe y gemas listos; el Guerrero no baja `effect3`, la Maga sí; Select Map → carga → partida, con 17 monstruos listos a los 4 s.
- **Después, con OK del propietario (recorte del equipo):** la armadura, cascos, espada y escudo del Guerrero, la ropa del Mago hombre y la túnica y gorros de la Maga ya no van antes del menú: solo la ropa de salida de los dos aspectos por defecto. La carga del mapa espera a lo que lleva puesto el personaje. Carga inicial **15,7 → 9,5 MB** (móvil 20,6 → 13,7 s); hasta jugar en móvil, 41 s al empezar el bloque → **27 s**. Comprobado: `check slots charinfo equipment equipmentmage equipmentowned warehouse mapselect open=select loot crit charinfogame debug=resume` y Gorn con Plate Mail, sin errores; captura de Select Character con Gorn y su arma.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090: la barra del principio va más rápida; al elegir mapa sale "Loading map" algo más larga la primera vez y casi nada la segunda.

**Fase 22, bloque 22A: sistema de mapas, Select Map y Traveler Zone (2026-10-21).**
- **Qué hace:** pantalla **Select Map** tras elegir o crear personaje (Continue va directo al mapa de su partida). Cuatro mapas en orden: **Traveler Zone → Bleeding Isle → Elvine Garden → Middleland** (los dos últimos "Coming soon"). Un mapa se abre al **ganar el anterior o al llegar a su Recommended Level** (1/10/25/40); victorias por dispositivo. Quien ya jugaba conserva Bleeding Isle. Cada mapa se carga al elegirlo (`MapLoadScene`); la carga inicial ya no baja mapas. Pantalla final: "New map: …".
- **Traveler Zone** (mapa de introducción, `default.amd`): unos 8 min; Slime, Bunny, Ant y Snake con vida ×0,5 y daño ×0,4; dos encerronas suaves; **Stone Golem** gigante (minuto 4) y **Dummy** de jefe final (minuto 7): lento, siempre 1 de daño, rodeado de bichos. Logros **First Steps** (ganarla) y **n0000b** (morir en ella).
- **Decisiones del propietario:** orden de mapas; Traveler Zone corta, muchos bichos débiles, jefes Stone Golem y Dummy; Dummy lento y de 1 de daño; acceso por victoria o Level; música de Bleeding Isle en todos; en la Fase 23 Select Map se abrirá desde un portal de la ciudad; logro n0000b. Icebound pasa a la Fase 25.
- **Decidido por mí (ajustable):** Levels 1/10/25/40; dificultad de Traveler (`data/maps.ts`); vida de los jefes 2.500 / 5.000 (medido con la partida simulada); nombre "First Steps"; zonas de juego de los 4 mapas.
- **Código:** `data/maps.ts` (MapDef ampliado), `data/waves.ts` (`TIMELINES` por mapa), `systems/MapUnlockStore.ts`, `scenes/MapSelectScene.ts`, `config/mapSelect.ts`, `scenes/MapLoadScene.ts`, `ui/LoadingScreen.ts` (sacado de PreloadScene); `stoneGolemBoss`, `dummy`, `fixedDamage`; dificultad en `Enemy.spawn`; `assetStreamer.prioritize`; logro `die`. Visor de mapas `survivors/maps.html`.
- **Comprobado:** build; `check menu mapselect mapsall mapsnew traveler travelerboss game boss finalboss portal` (Select Map también `--mobile`) sin errores; recorrido Select Map → Play → MapLoad → Game; ganar abre Bleeding Isle y da First Steps; morir da n0000b; partidas simuladas en Traveler (Maga Power 17, Guerrero Power 16).
- **Probar:** `pnpm --dir survivors dev` → Play → personaje → Select Map → Traveler Zone. Atajos: `?maps=all|reset`, `?map=traveler`, `?open=mapselect`.
**Revisión tras la Fase 21½ (2026-10-21).**
- **Rendimiento:** `check game horde elites stampede champion boss finalboss totems` en PC y `horde elites finalboss crit` + Maga con horda en `--mobile`: siempre 60 FPS (hasta ~300 enemigos), sin errores. `check levelpace` (partida simulada hasta el jefe final) sin errores.
- **Pantallas:** las 19 de menú y cartas, en PC y móvil, encajan. En el móvil en horizontal el juego (4:3) deja franjas negras a los lados: es por diseño (`Scale.FIT`).
- **Arreglado:** How to Play pisaba el selector "Page" en las tres páginas (7 líneas, solo cabían 6). Ahora el texto empieza más cerca del título (`HOW_TO_PLAY.contentOffsetY`) y las líneas van más juntas (27 PC / 28 móvil); frase de las Mana Stones acortada.
- **Probar:** `?open=howtoplay` y `?open=howtoplay&ui=compact`, pasando las páginas.

**Fase 21½ cerrada (2026-10-21).** Bloques 21½A (rareza), 21½B (Reroll y Skip) y 21½C (Champion). Comprobado al cerrar: build y `check menu levelup boss champion rerollskip epic` sin errores. Fusionada en `master` con la etiqueta `fase-21½`.

**Fase 21½, bloque 21½C: evento Champion (2026-10-21).**
- **Qué hace:** una vez por partida seguro y, con un 35%, dos veces, en un minuto al azar entre el 2 y el 11 (a medio minuto o más de los otros eventos), sale un **Champion**: un monstruo del tramo siguiente de la oleada, 50% más grande, con el brillo rojo de los élites, ×20 de vida, ×2 de daño, algo más lento y casi sin retroceso. Aviso "A Champion X rises!" y su rugido. **Barra de vida sobre la cabeza**, como la del jugador (sin barra grande arriba). Al morir: objeto garantizado del escalón siguiente o un salto (70/30), XP ×10 en 10 gemas en corro y 10% de Zem. Los minutos se guardan con la partida; uno vivo al guardar vuelve tras la calma de Continue. Métricas: en la lista de jefes como "Champion X". How to Play: una línea nueva (las dos primeras se juntaron para que quepa).
- **Decisiones del propietario:** uno y a veces dos; fuerza media; monstruo del tramo siguiente; premio objeto mejor + XP + 10% Zem; barra sobre la cabeza y sin la grande de arriba.
- **Decidido por mí (ajustable en `data/champion.ts`):** 35% del segundo, separación de 0,5 min con los eventos y 2 min entre Champions, velocidad 0,85, empuje 0,3, reparto 70/30 del objeto, medidas de la barra, el rugido del propio monstruo como sonido.
- **Código:** `data/champion.ts`; `Enemy.champion` (tamaño, `radius`, `drawHealthBar`); `EnemySystem.spawnChampion`; `SpawnSystem.setChampions/runDueChampion/pickChampion`; `LootSystem.onChampionKill` y `rollLoot(..., tierWeights)`; `GameScene.onChampion/dropXp`; `RunSnapshot.champions/championsOut`. Atajo `?debug=champion`; situación `check champion`.
- **Comprobado:** build; `check champion` y el resto sin errores; barra que baja al recibir daño; al matarlo, 10 gemas y un objeto; guardado (vivo → `championsOut` 0, muerto → 1); minutos distintos en cada partida. Probado y aprobado por el propietario.
- **Probar:** `pnpm --dir survivors dev` → `?play=warrior&debug=god,champion` · `?play` (partida normal).

**Fase 21½, bloque 21½B: Reroll y Skip (2026-10-21).**
- **Qué hace:** bajo las cartas de Power (y las de los cofres), botones **Reroll** (dado: 3 cartas nuevas, con su rareza otra vez) y **Skip** (vino: ninguna carta y cura el 20% de la vida), con su contador ("Reroll ×2"). Solo salen si se ha comprado alguno; gastados, se ven apagados. Ratón, dedo, teclado y mando (flecha/cruceta abajo para bajar a los botones, arriba para volver). Lo gastado se guarda con la partida. Métricas `action:reroll` / `action:skip`. How to Play: página nueva "Cards".
- **Decisiones del propietario:** son mejoras **permanentes** que se compran (dado = +1 Reroll, vino = +1 Skip por partida, hasta 3 de cada, al vendedor del Zem en la Fase 24); Skip **cura un poco**; el dado se dibuja con código y siempre muestra el **3** (tres puntos en diagonal); el vino es el Wine del original.
- **Decidido por mí (ajustable en `data/rerollSkip.ts`):** 20% de cura, sonidos (`sfx.pickup` al Reroll, `sfx.drink` al Skip), colores de los botones, cartas al 0,88 en el móvil cuando hay botones.
- **Código:** `data/rerollSkip.ts`, `ui/DiceIcon.ts`; `UnlockStore` versión 2 (`count`/`buy`); `GameScene.cardActionsLeft` y `spendCardAction`; `RunSnapshot.rerollsLeft/skipsLeft`; `LevelUpScene` (fila de botones); `RunMetrics.onCardAction`. Atajo `?unlocks=dice3,wine3`; situación `check rerollskip`.
- **Comprobado:** build; `check rerollskip levelup epic menu` y `rerollskip --mobile` sin errores; Reroll cambia las cartas y baja a ×2; Skip cura 40 → 60 y cierra; teclado (abajo, derecha, izquierda, Enter, arriba); la partida guardada lleva lo que queda; sin compras no hay botones y con solo dados solo sale Reroll. Probado y aprobado por el propietario.
- **Probar:** `pnpm --dir survivors dev` → `?play&unlocks=dice3,wine3&debug=levelup` · `?play&unlocks=reset&debug=levelup` (sin botones).

**Fase 21½, bloque 21½A: rareza de las cartas (2026-10-21).**
- **Qué hace:** cada carta de Power sale **Common, Rare o Epic**. Stat +3 / +5 / +8 (la carta lo dice: "Chr 10 → 18 (+8)"); piedras y Magnet +1 / +2 / +3 rangos, sin pasar de 5 (si no caben, la carta baja de rareza). Rare: marco interior azul y cinta "Rare"; Epic: marco morado, cinta "Epic", brillo que late y el "chin" E23 al aparecer. Las cartas de los cofres nunca salen Common. La Chr de la partida sube Rare y Epic (+1% por punto sobre 10, hasta el doble). Métricas: `rarity:rare` / `rarity:epic` en la tabla de cartas.
- **Decisiones del propietario:** 80 / 16 / 4; stat +3/+5/+8 y piedras +1/+2/+3; cofres Rare o mejor; la Chr sube las raras. Nueva mini Fase 21½ antes de la 22 (análisis `docs/ENGAGEMENT.md`).
- **Decidido por mí (ajustable en `data/cardRarity.ts`):** fórmula de la Chr, colores, sonido E23 (el de los tótems), cinta sobre el borde de la carta.
- **Código:** `data/cardRarity.ts`, `buildLevelUpChoices(equipment, chr, options)` en `systems/UpgradePool.ts`, `GameScene.levelUpChoices`, `LevelUpScene.rarityParts`, `sfx.cardEpic`; fuera `STAT_CARD_POINTS`. Atajo `?debug=epic`; situación `check epic`.
- **Comprobado:** build; `check menu epic levelup` y `epic levelup --mobile` sin errores; 3.000 cartas: 81/15/4 normal, 0/81/19 en cofres, 71/23/6 con Chr 60; partida simulada entera (Power 28, jefe final muerto). Probado y aprobado por el propietario.
- **Probar:** `pnpm --dir survivors dev` → `?play&debug=epic,levelup` (tres Epic) · `?play` (partida normal) · `?play&debug=god,boss` (cofre del minijefe).

**Entre fases: Continue / New Run al elegir personaje (2026-10-21).**
- **Qué hace:** el menú principal ya no tiene Continue, solo Play. En Select Character, un personaje con partida guardada abre la ventana "Saved Run" (nombre, Power y tiempo) con Continue, New Run y Back. New Run avisa de que se pierde la partida (su EXP y su botín) con No / Yes ("No" marcado primero); Yes la borra y empieza otra en el único mapa. Esc/B: del aviso a las opciones, y de ahí a Select Character. Sin partida guardada, se juega directo.
- **Decisiones del propietario:** solo Play en el menú; la pregunta va al elegir personaje; con Select Map (Fase 22), New Run pasará por ahí.
- **Decidido por mí:** "No" primero en el aviso; título "Saved Run"; los personajes ya no se ven apagados (desaparece el modo Continue de `CharacterSlotsScene`).
- **Código:** `scenes/RunChoiceScene.ts` (con `startCharacterRun`), `RUN_CHOICE` en `config/menus.ts`, `CharacterSlotsScene.enter`, `MainMenuScene.buildList`. Atajo `?open=runchoice`; situación `check runchoice`.
- **Comprobado:** build; `check menu slots runchoice` (y `runchoice --mobile`) sin errores; recorrido completo con Playwright: guardar partida de Gorn → Continue la sigue (6 s → 12 s); New Run → No y Back no borran; Yes la borra y empieza desde 0. Probado y aprobado por el propietario.

**Fase 21 cerrada (2026-10-20).** Bloques 21A, 21B, 21D y 21E; el 21C (anillos y collares) queda aplazado. Comprobado al cerrar: build y `check menu game revive loot warehouse equipment` sin errores. Fusionada en `master` con la etiqueta `fase-21`.

**Fase 21, bloque 21E: Abaddon's Blood (2026-10-20).**
- **Qué hace:** mejora **permanente** de todo el dispositivo (vale para los 4 personajes). Si está desbloqueada, al morir el personaje queda un momento en el suelo y se levanta: 50% de vida, 3 s invulnerable (parpadea), efecto Resurrection, su voz (C21 hombre / C22 mujer), un aro rojo que aparta a los monstruos sin hacerles daño y el letrero "Abaddon's Blood!". Una vez por partida: la segunda muerte es Game Over. El Red Ball sale a la izquierda de las barras (en el móvil, junto a la primera barra): dorado si queda, oscuro si ya se usó; oculto si no está desbloqueado. Continue recuerda si ya se usó. Logro "Blood of the Demon". El Zem no cambia.
- **Decisiones del propietario:** ya no es un objeto que cae y se equipa: se **compra** fuera de la partida, como el "Revival" de Vampire Survivors (tienda en la Fase 24); se programa ya, desbloqueable solo con atajo; vale para los 4 personajes; diseño aprobado en capturas (icono, aro, letrero, mismo efecto que el tótem Full HP).
- **Decidido por mí (ajustable en `data/abaddon.ts`):** 0,8 s en el suelo antes de levantarse, radio y fuerza de la onda, nombre del logro, `sfx.buff` junto a la voz.
- **Código:** `data/abaddon.ts`, `systems/UnlockStore.ts`, `systems/AbaddonRevive.ts`, `ui/ReviveIcon.ts`; `Player.revive`, `Enemy.push`; `RunSnapshot.abaddonUsed`; `HudBarState.revive`, `HUD_REVIVE`; `fx.resurrection`, `sfx.revive.m/w`; logro `revive`; fuera el hueco apagado de `SECOND_ROW_SLOTS`. Atajo `?unlocks=abaddon|reset`; situación `check revive`.
- **Comprobado:** build; `check revive` (PC y `--mobile`): muere, revive con 65/130, icono "used", logro; segunda muerte → GameOver; con `?unlocks=reset` → GameOver a la primera; la partida guardada lleva `abaddonUsed`. Sin errores de consola. Capturas de PC y móvil.
- **Después, a petición del propietario:** efecto al revivir "Abaddon Spirit 10" (`yseffect3` hoja 11, 5,6 MB, solo se descarga si está desbloqueado; ×2 y 2 s), atajo `?debug=onehp` / tecla U (1 de vida) y la bola de la barra late con brillo de fuego mientras está lista.
- **Después, a petición del propietario:** pociones al **0,4%** por monstruo (antes 1,5%), porque rodeado te curabas solo y no se podía morir (`data/pickups.ts`). Pendiente: mirar el equilibrio con la partida simulada y las métricas.
- **Probar:** `pnpm --dir survivors dev` → `?play=warrior&unlocks=abaddon`, pulsar N y dejarse matar (sin G). Sin el `&unlocks=abaddon` (o con `?unlocks=reset`) se muere a la primera.

**Fase 21, bloque 21D: baúl, "solo lo que tienes", reglas al morir y Zem (2026-10-20).**
- **Qué hace:** Equipment enseña **solo lo que tienes** (equipo de salida, lo puesto y el inventario con "×N"; los hechizos, libres por Int); ponerse algo lo saca del inventario y lo quitado vuelve. La lista se desplaza si no cabe. **Baúl compartido** (Warehouse, 50 huecos) desde Select Character (botón en la caja de abajo a la izquierda, tecla O, R1): inventario del personaje a la izquierda, baúl a la derecha, un clic mueve uno; avisa "Mage only"/"Warrior only". **Reglas al morir:** ganar = todo; morir sin Zem = se pierde lo encontrado (pantalla final en rojo "Lost: N items", miniaturas apagadas); morir con Zem = se conserva y el Zem se gasta ("Your Zem saved N items"). **Zem** (Zemstone of Sacrifice, icono original) con hueco propio; cae del 10% de los jefes; encontrado en partida va a la bolsa. Ya no caen hechizos (todos se saben con la Int). How to Play: página "Warehouse".
- **Decisiones del propietario:** 21C (anillos y collares) pendiente; 21D partido en 21D y **21E (Abaddon's Blood)**; baúl de 50; Zem 10% por jefe y también comprable en la Fase 24; hechizos actuales solo con Int, los futuros (Blizzard...) con Manual + Int.
- **Decidido por mí (ajustable):** el Zem solo se gasta si había botín; un Zem encontrado va a la bolsa sin carta; botón y teclas del baúl; los objetos sin uso para tu clase se pueden guardar igual.
- **Código:** `data/consumables.ts`, `data/warehouse.ts`, `systems/WarehouseStore.ts`, `scenes/WarehouseScene.ts`, `config/warehouse.ts`; en `data/items.ts`: hueco `zem`, `SECOND_ROW_SLOTS`, `isFreeItem`, `isLootDrop`, `MANUAL_SPELL_IDS`; `CharacterStore` versión 7 (`equip` desde el inventario, `ownedFor`, `finishRun` en lugar de `takeRunLoot`, `takeFromInventory`/`addToInventory`); `LOOT_ZEM_BOSS_CHANCE`. Atajos `?open=warehouse`, `?debug=zem`, `?gear=inv:id` / `zemstone`; situaciones `check warehouse`, `equipmentowned`, `deathnozem`, `deathzem`; `g.debugKeepLoot()`.
- **Comprobado:** build; `check slots warehouse equipmentowned equipment equipmentmage loot lootmage game charinfo menu` sin errores, `warehouse` y `equipmentowned` también `--mobile`; listas de Equipment por hueco y poner/quitar (Plate Mail rechazado por Str); muerte sin Zem (perdido) y con Zem (salvado, Zem gastado); jefe con `?debug=zem` suelta Zems con dibujo de suelo (item-ground 15/39); mover objetos ida y vuelta en el baúl; capturas del baúl, Equipment, pantalla final y How to Play.
- **Probar:** `pnpm --dir survivors dev` → `?characters=demo&open=slots` (botón Warehouse) · `?play=warrior&characters=demo&debug=loot` (morir sin Zem) · `?play=warrior&characters=demo&debug=loot&gear=zemstone` (con Zem) · `&debug=zem` (los jefes sueltan Zem).

**Fase 21, bloque 21B: atributos y varitas (2026-10-20).**
- **Qué hace:** las armas que caen pueden ser **Sharp** (10%, +10% daño), **Poison** (5%) o **Ancient** (1%, +20% daño). El nombre lleva el atributo delante y en su color, la carta añade una línea, y el **dibujo del arma se tiñe** como en el original (en la mano, icono, suelo, ventana Character): Sharp azul oscuro, Poison verde, Ancient rosa-lila. **Poison** como el de los jugadores del original pero **puede matar**: 1d(nivel) por segundo, 10% de curarse en cada tic, números verdes y la **nube verde** del original encima. La **Maga** tiene varitas en el hueco Weapon (9 del original, Level de la wiki, sin Int): solo ahorran maná (guardado, "(soon)" en gris) salvo **Berserk +40%** y **Kloness +20%**, que caen muy poco. Sharp/Ancient en la varita suben sus hechizos; nunca Poison. Equipment lista las armas con atributo del inventario (y la puesta, marcada); ponérsela la saca del inventario.
- **Decisiones del propietario:** atributos solo en armas (varitas incluidas, sin Poison); +10% / +20%; Xelima también sube Ancient; Mana Save guardado para cuando la Spell 2 gaste maná; Berserk +40%, Kloness +20%, muy raras; Ancient rosa (es el "Violet" del original); Poison que mata, como el de jugadores; varitas con Level de la wiki y sin Int/Mag. Fase partida: **21C** anillos y collares (4 familias), **21D** baúl, muerte, Zem y Abaddon's Blood.
- **Decidido por mí (ajustable):** nivel del veneno = 40% del golpe, tic de 1 s (`POISON` en `data/attributes.ts`); varitas con peso 1 en el botín y raras al 10% (`data/loot.ts`); colores de los nombres.
- **Código:** `data/attributes.ts`, `data/wands.ts`; `OwnedItem.attribute`, `rollAttribute`; personajes versión 6 (`attributes` de lo puesto, `equip(..., attribute)`, `ownedWithAttribute`); `CharacterStats.attributeBonus`; `Enemy.poison/tickPoison` + `CombatSystem.updatePoison` + `fx.poison.cloud`; `GearLayer.added` y `hb/additiveTint.ts` (`colouredTexture`, `setColouredTexture`: la hoja se vuelve a leer del `.spr` para no guardar ~16 MB de píxeles). Atajos `?attr=sharp|poison|ancient`, `?gear=sharp:longSword`; situaciones `check lootsharp`, `lootancient`, `poison`.
- **Comprobado:** build; `check game loot lootsharp lootancient lootmage poison equipment equipmentmage charinfo slots activespell` sin errores; carta de varita en móvil (peor caso); 100.000 tiradas (10,1 / 4,9 / 1,0%); recorrido coger → Equip → fin de partida → personaje con atributo e inventario; Equipment poner/quitar con atributo; veneno que mata (cuenta muerte, nube fuera); capturas de cartas, Equipment (Gorn y Kaila) y nube centrada.
- **Probar:** `pnpm --dir survivors dev` → `?play=warrior&debug=horde&attr=poison` · `?characters=demo&open=equipment&gear=sharp:longSword,poison:longSword,ancient:longSword` · `?play=mage&characters=demo&debug=god,loot&attr=ancient`.

**Fase 21, bloque 21A: botín en partida (2026-10-20).**
- **Qué hace:** los monstruos sueltan objetos de equipo (0,3%; élite 4%) y los jefes siempre (Ettin/Demon 1, a veces 2; jefe final 2). En el suelo se ven con su dibujo de `item-ground` y un brillo dorado; en el minimapa, punto azul claro. Al pisarlo, la partida se pausa y sale la carta "Loot!": lo equipado frente a lo encontrado (requisitos, "Damage 17 → 22" en verde/rojo) con **Equip** o **Keep in bag** (si no se cumple el requisito, solo guardar). Equip lo pone al momento (arma, armadura o hechizo). Bolsa y equipado se guardan con la partida (Continue). Al terminar (ganar o morir, de momento), lo equipado queda puesto en el personaje y lo anterior y la bolsa van a su **inventario**. Pantalla final con fila "Loot" y miniaturas. Equipment marca "×N" lo que hay en el inventario. How to Play: página "Loot".
- **Decisiones del propietario:** reparto 50/25/15/10 (escalón propio / siguiente / peor / salto); atributos Sharp 10%, Poison 5%, Ancient 1% (para el 21B); la bolsa va al **inventario del personaje**; Equipment pasará a "solo lo que tienes" (se cierra en el 21C); miniaturas en la pantalla final; en el suelo **solo** dibujos de `item-ground`, nunca el icono del inventario.
- **Decidido por mí (ajustable en `data/loot.ts`):** probabilidades de caída, pesos por hueco (arma y hechizos ×2–3), hechizos con el dibujo del "Manual" (5/92) hasta tener icono. Anillos y collares pasan al 21B.
- **Código:** `data/loot.ts`, `systems/LootRoller.ts`, `systems/LootSystem.ts` + `entities/LootDrop.ts` (pool), `systems/RunLoot.ts`, `scenes/LootScene.ts`; `describeItem`/`itemPower`/`itemPicture` en `data/items.ts`; personajes versión 5 (`inventory`, `takeRunLoot`, `ownedCount`); `RunSnapshot.loot`; sonidos E28/E29. Atajo `?debug=loot`, situaciones `check loot` / `lootmage`, `g.debugPickUpLoot()`.
- **Comprobado:** build; `check menu loot lootmage equipment portal` y `loot --mobile` sin errores; recorrido completo (coger, Equip / Keep, Continue con todo igual, fin de partida → equipo e inventario de Gorn); los 33 objetos tienen dibujo en `item-ground`; capturas de carta (PC y móvil), suelo, pantalla final y How to Play.
- **Probar:** `pnpm --dir survivors dev` → `?play=warrior&characters=demo&debug=god,loot` · `?play=mage&characters=demo&debug=god,loot`.

**Ronda de bugs, bloque C, M13: Settings en dos pestañas (2026-10-20).**
- **Qué hace:** Settings va en dos pestañas en móvil y ordenador: "Audio & Display" (Music, Sound, Fullscreen, Large Trees, HUD en el móvil) y "Gameplay" (Minimap, Health Bar, Screen Shake, Aim Stick en táctil, Controls en el ordenador, Anonymous Stats). Filas más separadas (44 / 48 px). Se cambia tocando la pestaña, con sus ◄ ► o, con teclado/mando, en la primera fila. Recuerda la última pestaña.
- **Decisiones del propietario:** pestañas (no scroll ni quitar opciones) y también en la web.
- **Código:** `SettingsScene` (barra de pestañas, `pendingTab`), `SETTINGS_MENU` en `config/menus.ts`, `MenuList` con filas `keyboardOnly` y `selectedIndex`. Atajo `?tab=gameplay`.
- **Comprobado:** build; `check settings menu` (también `--mobile`) sin errores; cambio de pestaña por clic y por la fila de teclado, sin zonas de clic sobrantes; capturas de las dos pestañas.
- **Probar:** `pnpm --dir survivors dev` → `?open=settings` · `?open=settings&tab=gameplay&ui=compact`.

**Ronda de bugs, bloque C, M17: equipo sobre el cuerpo en la ventana Character (2026-10-20).**
- **Qué hace:** las ventanas Character y Equipment dibujan al personaje como el original: cuerpo grande y quieto (`item-equipm/w.spr`) con pelo (teñido, oculto con casco), ropa interior, ropa de la clase y todo el equipo en sus posiciones originales. Select Character sigue con el muñeco animado.
- **Código:** `data/paperDoll.ts` (grupo y frame de `Item*.cfg`, hojas, posiciones y orden de `DrawDialogBox_Character`), `entities/PaperDoll.ts` (mientras se descargan los dibujos, ~250–290 KB, se ve el muñeco animado). Tipo de sprite `PaperDoll` (canvas, para teñir el pelo). Atajo nuevo `?gear=ids` para vestir a los de ejemplo sin requisitos.
- **Comprobado:** build; `check charinfo equipment equipmentmage charinfogame slots` sin errores a 60 FPS; capturas de Gorn (ropa de salida y armadura completa) y Kaila (vestido, Wizard Robe y gorro, Plate Mail).
- **Probar:** `pnpm --dir survivors dev` → `?characters=demo&open=charinfo&gear=plateMail,hornedHelmet,towerShield,cape,claymore` · `?characters=demo&open=equipment&class=mage`.

**Ronda de bugs, bloque C, M8: pantalla de carga (2026-10-20).**
- **Qué hace:** fondo negro; "Helbreath Survivors" en dorado con la letra caligráfica del libro de hechizos encima de la barra; debajo, "Loading" fijo (sin los mensajes técnicos); abajo a la derecha, el logo del propietario (112 px) con un latido lento.
- **Decisiones del propietario:** su logo (no el "HS" de la app), latido en vez de giro, doble de tamaño; el icono "HS" encima de la barra se probó y se cambió por el título en letra caligráfica.
- **Código:** `PreloadScene` (constantes `LOGO_*` y `TITLE_*`); `BootScene` carga antes el logo (`LOADING_LOGO`) y la letra (`BOOT_SPRITES`, `sprfonts.spr`, 5 KB). Logo recortado del JPG del propietario a `custom-assets/image/hb-logo.png`. Atajo `?loading=hold` y situación `check loading` (la carga se para a la mitad).
- **Comprobado:** build; `check loading` (también `--mobile`) y `check menu` sin errores; capturas revisadas.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?loading=hold.

**Ronda de bugs, bloque C, M2: monstruos élite (2026-10-20).**
- **Qué hace:** cualquier monstruo que no sea jefe puede salir élite ("Berserk"): mismo brillo rojo que el buff Berserk del jugador, pega ×1,5 (también flechas y bolas de fuego), vida ×2, EXP ×3. Probabilidad de 1/50 (vida ≤ 20) a 1/200 (vida ≥ 1000), en escala logarítmica; ×2 con la vida del jugador > 75 %, ninguno con < 35 %. Congelado se ve azul, sin el rojo.
- **Decisiones del propietario:** el brillo es el mismo efecto que el Berserk del jugador.
- **Código:** `data/elites.ts` (números y `eliteChance`); tirada en `EnemySystem.spawn` (vida del jugador vía `setPlayerHealthShare`); `Enemy.elite`, `maxHp`, `xp` y `syncGlowTexture`; copia roja de la hoja hecha en la GPU (`hb/glowTexture.ts`, `DynamicTexture`). La primera versión (un sprite ADD encima de cada élite) hundía los FPS con muchos: rompe el lote de WebGL. `?debug=elites`, situación `check elites`.
- **Comprobado:** build; `check elites game` a 60 FPS sin errores; 300 monstruos élite → 7–9 llamadas de dibujo por frame, igual que sin élites; píxeles de la copia: rojo ×1,5, verde/azul ×1,13 (la cuenta del overlay del original); Orc élite con 120 de vida.
- **Probar:** `pnpm --dir survivors dev` → `?play=warrior&debug=god,elites,horde` (todos rojos) · `?play` (alguno suelto).

**Ronda de bugs, bloque C, M15: estela del tajo del guerrero (2026-10-20).**
- **Qué hace:** 5 estilos de estela en `data/slash.ts`; el propietario eligió **Thin edge + sparks** (filo fino que baja de arriba abajo en 0,08 s, con chispas en la punta de abajo). Los otros se guardan.
- **Código:** `entities/Slash.ts` por rebanadas con grosor y alfa propios, brillo aditivo y chispas en arrays fijos; `show()` invierte el arco para empezar siempre por la punta de arriba. Constantes `SLASH_*` salen de `gameConfig.ts`. Desarrollo: `?slash=N`, tecla Y (`Action.DebugSlashStyle`) y letrero en `GameScene`.
- **Comprobado:** build; `check` con horda y crit (giro completo) a 60 FPS, también `--mobile`, sin errores; capturas congeladas de cada estilo y del barrido hacia la izquierda.
- **Probar:** `pnpm --dir survivors dev` → `?play=warrior&debug=god,horde` (Y cambia de estilo con `&slash=0`).

**Ronda de bugs, bloque B: combate (2026-10-20).**
- **Qué hace:** con un mini jefe vivo las oleadas siguen a medio ritmo y medio tope (solo el jefe final las para); sin sonidos pedidos con la pestaña oculta y efectos cortados al ocultarla (B4); Defense Shield bloquea todo el daño 15 s; Freeze 10 s en un área del doble de la pantalla; Triple Energy Bolt cae en zona pequeña (objetivo + 2 diagonales a 32 px), como el original.
- **Decisiones del propietario:** M14 como el original (zona pequeña); escudo de 15 s.
- **Código:** `SPAWN.duringBoss` (`data/waves.ts`) en `SpawnSystem.update`; `AudioSystem.canPlay`/`stopOneShots` y `visibilitychange`; `damageTakenMultiplier: 0` → `reduceByArmor` devuelve 0; `TotemEffect.freeze.rangeScreens`; `aim: 'pattern'` + `pattern` en `data/spells.ts` y `SpellWeapon.patternShots` (también con apuntado manual).
- **Comprobado:** build; `check menu news game boss totems` sin errores; con jefe vivo 53 monstruos; golpe de 50 con escudo → 130/130, sin escudo → 80; Freeze: 100 monstruos fuera de pantalla congelados, quietos a los 8 s y libres a los 11 s; disparos del Triple en (x,y), (x−32,y−32), (x+32,y+32); pestaña oculta simulada → no entra ningún sonido nuevo.
- **Probar:** `pnpm --dir survivors dev` → `?play&debug=boss` · `?play&debug=totems,horde` · `?play=mage&spells=tripleEnergyBolt&debug=horde` · cambiar de pestaña y volver.

**Ronda de bugs, bloque A: arreglos rápidos (2026-10-19).**
- **Qué hace:** fuera el "+N" de puntos junto al nivel en Select Character; icono del crit centrado en su caja (2 px a la izquierda); What's new con frases cortas (y `/checkpoint` lo pide así); el imán atrae también las pociones; "Create New Character" (y los demás botones de esa columna) funcionan aunque antes se pase el ratón por encima; tótems = esfera de energía (`effect5` hoja 0, ×1,5) igual para todos; minimapa con todos los tótems en amarillo y el punto del jefe del tamaño del jugador; cartas con título en la fuente del original (`interface2` hoja 1), "Blessing of Str" en las de stats y "1/5" en las pasivas; una barra con nombre por cada jefe vivo (hasta 3, el final primero).
- **Decisiones del propietario:** lista completa y agrupada en `docs/BUGS.md`; la poción (M6) se descarta, ya era la Red Potion del original.
- **Código:** `setFrame(n, false, false)` en los botones de `CharacterSlotsScene`; `SpriteText` con fuentes `'calligraphy'` y `'title'` (`ui.font2`); `PickupDef.magnetPulls`, `Pickup.flyTowards`, `PickupSystem.attract`; `TOTEM_LOOK` y `fx.totem.orb` (fuera `manastone.spr` y `fx.totem.glow`); `HudState.bosses` y `BossSystem.shownList`, `HUD_BOSS.maxShown`/`rowGap`; `check.mjs` lista todos los jefes.
- **Comprobado:** build; `check menu news slots game levelup totems crit charinfo equipment` y `game slots --mobile` sin errores; con Playwright, "Create New Character" tras pasar el ratón abre Create Character; 2 pociones lejanas + imán → recogidas; 3 jefes → 3 barras. Probado por el propietario.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=demo&open=slots · `?debug=god,totems` · `?play=warrior&debug=stones,levelup` · `?debug=god,boss,finalboss`.

**Fase 20, bloque 20D: hechizos equipables del Mago (2026-10-19).**
- **Qué hace:** el Mago lleva **2 hechizos** que elige en Equipment (segunda fila, casillas "Spell 1" y "Spell 2" con el nombre dentro, porque aún no hay dibujo). Spell 1 se lanza solo: Energy Bolt (libre), Fire Ball (Int 26), Fire Strike (34), Triple Energy Bolt (45). Spell 2 es el activo del botón (Espacio / R2 / botón táctil): **Energy Strike** (libre, ráfaga de 12 descargas, 14 s), **Mass Fire Strike** (Int 85, 4 explosiones grandes, 18 s) y Meteor Strike (Int 169). Requisito en verde/rojo como el resto del equipo. Los Magos ya creados reciben Energy Bolt + Energy Strike. Al continuar una partida mandan el arma y los hechizos equipados **ahora** (antes volvían los de la partida guardada: lo vio el propietario al probar). How to Play dice "active spell (Spell 2)".
- **Decisiones del propietario:** círculos 1–5 automáticos y 6–10 activos (Energy Strike y Mass Fire Strike pasan a activos); solo Int del original, sin Level; Magic Missile no existe en sp-client → Energy Bolt de salida; Energy Strike como activo de salida.
- **Código:** `circle`/`int` en `data/spells.ts` (`AUTO_SPELL_IDS`); `data/activeSpells.ts` con dos tipos (`meteor`, `barrage`); `WeaponSystem.castBarrage` y `Projectile.damageScale`/`fromSkill`; huecos `spell1`/`spell2` en `data/items.ts` (`FREE_SPELLS`, `EquipRequirement.str` opcional); `RunSnapshot.activeSpell`; vibración `activeSpell` (antes `meteorStrike`).
- **Trucos:** `?spells=fireBall,meteorStrike`, `?open=equipment&class=mage`; situaciones `equipmentmage` y `activespell`. Kaila (demo) es Level 25 con Int 86.
- **Comprobado:** build; `check menu game news equipment equipmentmage activespell crit charinfo` sin errores; los 3 activos se lanzan y matan; Continue respeta el equipo actual; partida simulada del Mago con Energy Strike: Power 27, jefe final a 13:54 (igual que con Meteor). Probado por el propietario.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=demo → Kaila → Equipment → Spell 1 / Spell 2 → partida y Espacio.

**Fase 20, bloque 20C: cartas de Power (2026-10-19).**
- **Qué hace:** las cartas ya no dan armas, hechizos ni armaduras (el Mago juega con su hechizo fijo hasta el 20D). Salen stats (+3, solo esa partida), **Stone of Xelima** (+10% de todo el daño por carta: arma, hechizo, crit y meteoro) y **Stone of Merien** (−10% de daño recibido por carta, encadenado, 5 ≈ −41%), hasta 5 cada una, y Magnet Amulet. Fuera la carta Boots. Las piedras llevan su icono original (item-pack hoja 5, frames 128 roja y 129 verde) y el imán el PNG del propietario (`custom-assets/image/magnetpng.png`, a tamaño de las piedras, `size: 0.62`). Panel C: filas de Xelima/Merien y "Damage taken" con Merien.
- **Decisiones del propietario:** Merien = −10% daño recibido (sirve también al Mago); cartas de hechizo fuera ya; cartas de stat sin tocar (cambiará su lógica más adelante); "Fully Armored" se mantiene (cuenta el equipo puesto).
- **Código:** Xelima y Merien son pasivas en `data/passives.ts` (`stacking`, `sign`, `icon`); `UpgradePool` solo stat/pasiva; `CharacterStats.xelimaBonus`; `GameScene.reduceByArmor`; `UI_IMAGES` en el manifest; `LevelUpScene.picture()`. Quitados `strRequired`/`intRequired`/`stat`/`required`, `utils/requirements.ts` y `REQ_SCALE`; `runSprites` ya no descarga todas las armas y armaduras.
- **Trucos:** `?debug=stones` (las cartas ofrecen las pasivas que no estén al máximo).
- **Comprobado:** build; `check menu levelup`, stones con Guerrero y Mago, `achievements --cards`, `charinfogame` sin errores; 3 Xelima → daño ×1,3, 5 Merien → golpe de 100 en 59; `levelpace` (Mago) Power 28 en 13:21, jefes ~13% de vida por golpe. Probado por el propietario (tamaño del imán).
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&debug=stones,levelup

**Fase 20, bloque 20B: objetos, guardado del equipo y pantalla Equipment (2026-10-19).**
- **Qué hace:** cada personaje guarda su **equipo** (arma, escudo, casco, armadura, pantalones, botas y capa) y empieza cada partida con él puesto (daño, defensa y aspecto). Pantalla **Equipment** desde Select Character (botón "Equipment" junto a "Level Set.", tecla I o X del mando): a la izquierda la ventana Character original con el muñeco vestido y las stats permanentes; a la derecha los 7 huecos (y apagados los que llegarán: 2 hechizos, anillo, collar, ángel, Zem, Abaddon's Blood) y la lista del hueco elegido con los iconos originales y el requisito en verde/rojo. Ponerse algo se guarda al momento; sin el requisito no deja (y lo dice). Los muñecos de Select Character y Character también salen vestidos. Página "Equipment" en How to Play.
- **Decisiones del propietario:** catálogo libre hasta la Fase 21; requisitos del original (Str = peso/100, Level y Mag de `reference/Item*.cfg`); Xelima/Merien +10% hasta 5 cartas y fuera la carta Boots (en el 20C); la fase se parte en 20B, 20C (cartas) y 20D (hechizos del Mago). Equipo de salida: Guerrero daga, Mago nada (varita fija hasta el 20D).
- **Contenido nuevo:** Scimitar y Claymore; Wood Shield, Chain Hose, Plate Leggings, Shoes, Long Boots y Cape. Chain Mail y Plate Mail ya no traen pantalones (van en su hueco). Las cartas antiguas siguen hasta el 20C.
- **Código:** `data/items.ts` (huecos, catálogo, requisitos, iconos, `readEquipment`), `data/itemTypes.ts`, `equip`/`icon` en `weapons.ts` y `armor.ts`; `CharacterStore` versión 4 (`equipment`, `equip()`); `CharacterSprite.wearEquipment()`; `scenes/EquipmentScene.ts` + `config/equipment.ts`; `Action.OpenEquipment`; sprites `item.pack`, `gear.shoes.*`, `gear.cape.*` bajo demanda.
- **Trucos:** `?open=equipment` (con `?characters=demo` abre la de Gorn); situación `pnpm check equipment`.
- **Comprobado:** build; `check equipment` (también `--mobile`), `slots`, `game`, `levelup`, `charinfo`, Mago demo, Continue y `debug=dodge` sin errores; recorrido completo: Claymore rechazada con Str 14, 26 puntos a Str en Level Set., Claymore + Chain Hose + Cape + Shoes + Targe guardados y la partida de Gorn empieza con todo (defensa 14%). Probado por el propietario.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=demo → Play → Gorn → Level Set. (Str) → Equipment.

**Fase 20, bloque 20A: Level permanente, reparto de puntos y Power (2026-10-19).**
- **Qué hace:** cada personaje tiene **Level** permanente (máx. 140) y EXP. Al terminar una partida (ganando o muriendo) **toda** su XP pasa al personaje; la pantalla final enseña "+N EXP · Level N", una barra y "Level up! +3 points" o lo que falta. Cada Level da **3 puntos** que se reparten en la **ventana Character original** (`dialogtext.spr` hoja 0), abierta con **"Level Set."** en Select Character (donde estaba Change Password) o con C: + junto a cada stat, el número en rojo hasta confirmar, − para deshacer, **Ok** los fija para siempre, Cancel/Esc no gasta nada. La partida empieza con las stats permanentes. En partida, **C pausa** y abre la misma ventana (solo mirar) con un panel de detalles al lado (sustituye al panel de stats de antes). El nivel de la partida se llama **Power** (barra, cartas "Power N!", logros, How to Play).
- **Decisiones del propietario:** las clases se quedan como estilo; toda la EXP pasa, ganes o mueras; sin puntos libres al crear; los puntos **solo** se reparten en la ventana Character (no en la pantalla final); + y − de `gamedialog` hoja 3 (frames 5 y 6); C pausa. Tras verlo: ventana ×1,45 y el − y el + juntos en el borde derecho de cada recuadro (antes salían pequeños y desalineados).
- **Curva:** `data/characterLevel.ts`, EXP total = 300·(Level−1)^2,24. Una partida entera da ~70.000 EXP (Power 27): Level ~4–6 si mueres en la 1.ª, ~31 a las 2 h, ~50 a las 6 h, ~80 a las 17 h, ~100 a las 30 h, 140 a las ~60 h. Se ajustará con métricas.
- **Código:** `CharacterStore` versión 3 (`level`, `exp`, `unspentPoints`, `statPoints`, `bestLevel` → `bestPower`; `addExp`, `assignPoints`, `permanentStats`); `CharacterStats(def, startStats)` y `runXp`; la partida guardada lleva `permanentStats` (lo repartido mientras espera se suma al continuar); `scenes/CharacterInfoScene.ts` + `config/characterInfo.ts`; `Action.Decrease` (− o X del mando); Settings → Controls dice "Character" en vez de "Stats"; página "Level" en How to Play.
- **Trucos:** `?open=charinfo`, `?debug=charexp` (EXP ×50 al terminar), `?characters=demo` + `?play=warrior` juega Gorn (60.000 EXP). Situaciones `charinfo`, `charinfogame`, `charexp` (terminar con `--eval="g.endRun(false)"`).
- **Comprobado:** build; `check menu game levelup slots charinfo charinfogame controls` sin errores, `charinfo`/`charinfogame` también `--mobile`; Ok guarda los puntos (versión 3, Str +3) y Select Character se redibuja; fin de partida con charexp sube Level; Continue con stats permanentes; partida simulada sin cambios (Mago, Power 27, jefe final a 13:24).
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?characters=demo&open=charinfo (o Play → Gorn → Level Set.). Partida: http://localhost:8090/?play=warrior&characters=demo&debug=charexp y pulsar C.

**Fase 19, cierre: equilibrio crit/meteoro (2026-10-19).**
- **Medido** (partida simulada, 3 por clase): el meteoro hacía 45–59% del daño del Mago y 59–70% de sus muertes desde el minuto 5 (1.700–1.950 muertes por partida, jefe final a ~13–14 min); el crit, 3–23% del daño del Guerrero (550–710 muertes; el jefe final solo murió en una de tres).
- **Cambiado (decisión del propietario):** `areaDamage` del meteoro 40 → 20 (`data/activeSpells.ts`) y `CRIT_STRIKE.rechargeMs` 20 → 15 s (`data/critStrike.ts`; How to Play dice "+1 each 15 s").
- **Después** (2 por clase, una del Guerrero descartada por quedarse atascado con el Ettin): meteoro 36–48% del daño y 44–49% de las muertes; Mago mata al jefe final a 13:24–13:27; Guerrero a 13:39, con el crit en 20–25% del daño.

**Fase 19, bloque 19C: vibración del mando y controles cambiables (2026-10-19).**
- **Qué hace:** el mando vibra al recibir un golpe (suave y corto), más fuerte y largo con un golpe de jefe o uno que quita ≥15% de la vida, y cuando el Critical Strike o el Meteor Strike **impactan** en algún monstruo (no al lanzarlos; una sola vez por lanzamiento aunque golpee a muchos; si no toca a nadie, no vibra; corregido a petición del propietario). Una vibración floja no corta una fuerte. Settings tiene una fila nueva **Controls** que abre una pantalla con: Crit Key, Crit Button, Stats Key, Stats Button (Enter/A/clic → "..." → pulsar la tecla o botón nuevo; Esc/B cancelan; si choca con la otra acción, se intercambian), la casilla **Vibration** (activada de serie) y **Reset to default**.
- **Decisiones del propietario:** solo se cambian el crit/meteoro y el panel de stats (moverse, Enter, Esc, Backspace, A, B, Start y la cruceta quedan fijos para no quedarse atrapado); vibración solo en el mando (no el teléfono); How to Play enseña las teclas de serie con una línea "Settings, Controls" en las páginas Keyboard y Gamepad. La casilla Vibration acabó dentro de Controls porque en Settings no cabía. En la interfaz de móvil no sale la fila Controls (panel lleno, sin teclado).
- **Código:** `systems/Rumble.ts`, aviso `WeaponSystem.onSkillHit` (primer golpe del crit que toca a alguien, o meteoro que cae con monstruos en su radio), `GAMEPAD_RUMBLE` en `data/feedback.ts`, `config/controls.ts` (teclas de serie, reservadas, nombres, intercambio), `scenes/ControlsScene.ts`, `vibration` y `controls` en los ajustes, `InputSystem` lee los controles en cada pulsación (`keysFor`/`buttonsFor`, `justPressedButton`, `readGamepad` exportado), `noArrows` en `MenuList`, `CONTROLS_MENU` y Settings un poco más junto en el PC (31 px).
- **Truco:** `?open=controls`; situaciones `pnpm check controls` y `settings`.
- **Comprobado:** build; `check menu game crit settings controls`, `settings --mobile` y How to Play sin errores; cambiar el crit a Q funciona en partida (Espacio deja de lanzarlo); intercambio Q↔C; Enter rechazada; Esc cancela; Reset vuelve a Space/R2/C/Y. Vibración con un mando simulado: crit (3 lanzados contra la horda → 2 vibraciones, el tercero no tocó a nadie), meteoro (al caer, 0,6 s después de lanzarlo), golpe normal, golpe de jefe y golpe grande dan su efecto, y un golpe flojo durante uno fuerte no lo corta. **Sin probar con un mando real.**
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090 → Settings → Controls. Con el mando (Chrome o Edge): http://localhost:8090/?play=warrior&debug=crits,horde y dejarse golpear / pulsar R2.

**Fase 19, extra: pantalla "What's new" (2026-10-19).**
- **Qué hace:** link amarillo subrayado "What's new" al final del pie del menú principal; abre un panel (tamaño Credits) con las novedades de cada fase, de la más nueva a la más vieja, con páginas ◄ ► si no caben.
- **Código:** `scenes/ReleaseNotesScene.ts`, textos en `data/releaseNotes.ts` (inglés, para el jugador), números en `RELEASE_NOTES_SCREEN` y `MAIN_MENU_NEWS_LINK` (`config/menus.ts`). `/checkpoint` añade ahí lo que nota el jugador de cada bloque.
- **Truco:** `?open=releasenotes`; situación `pnpm check news`.
- **Comprobado:** build; `check menu news` sin errores y captura del panel (6 páginas).
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090 y pinchar "What's new" abajo.

**Fase 19, bloque 19B: Meteor Strike, hechizo activo del Mago (2026-10-18).**
- **Qué hace:** con el **mismo botón** que el crit del Guerrero (Espacio, X del mando, botón táctil), el Mago lanza **Meteor Strike**: un meteorito cae en diagonal donde apuntas (cursor, hasta 420 px; con el stick, a media distancia) o sobre el objetivo automático (un jefe cercano primero). Al caer: fuego y explosión brillantes, 5 explosiones pequeñas, estela de humo, temblor fuerte y daño en área (radio 128 px) con números grandes. Sin nada al alcance no sale y no gasta la recarga.
- **Números (propietario):** recarga **20 s × (1 − 1% por punto de Mag)**, mínimo 8 s (Mag inicial 14 → 17,2 s). Daño 30 directo + 40 en área × (2 + Power/30), y luego el multiplicador de magia. A Power 1 hace ~105 por monstruo: mata todo lo de los primeros minutos. El equilibrio con los crits queda para después (decisión del propietario).
- **Interfaz:** la misma esfera roja (el Mago tendrá su propio icono más adelante: `hudIcon` en los datos) enseña los **segundos que faltan**; sin número cuando está lista. En el panel C, "Meteor Strike 17.2 s" (y el Guerrero "Critical Strikes N max"). How to Play, página Crit, reescrita (7 filas como mucho: con 8 pisa el selector).
- **Futuro:** los poderes serán **equipables y cambiables** (Fase 20); por eso `data/activeSpells.ts` es una lista.
- **Código:** `data/activeSpells.ts`, `systems/ActiveSpellSystem.ts`, `entities/Meteor.ts` (con pool), `WeaponSystem.castMeteor/activeSpellTarget/landMeteor`, `HudBarState.skillOrb` (antes `critCharges`), `bigNumbers` en `AreaHit`, `spellCooldownMs` en el guardado (las partidas antiguas empiezan con el hechizo listo). `crueffect1.spr` (1,25 MB) se descarga **solo en partidas de Mago** (`ON_DEMAND_SPRITES`); `registerEffectAnimations` salta efectos sin .spr y se vuelve a llamar al llegar. La partida simulada lo lanza en cuanto está listo.
- **Truco:** `?debug=crits` / tecla **H** también quitan la recarga. Situación nueva `pnpm check meteor` (lanzar con `--eval="g.launchCritStrike()"`).
- **Comprobado:** build; `check menu game meteor crit` y `meteor --mobile` sin errores; un meteoro mata 12–21 monstruos de la horda; el botón táctil lo lanza; la recarga se guarda; el crit del Guerrero sigue igual; capturas del impacto y de How to Play.
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=mage&debug=crits,horde,god y pulsar Espacio.

**Fase 19, bloque 19A: Critical Strike del Guerrero (2026-10-18).**
- **Qué hace:** con **Espacio**, **X** del mando o el **botón táctil** (abajo a la derecha), el Guerrero gasta una carga y da al momento un golpe de área hacia donde apunta (manual, el enemigo más cercano o hacia donde mira). Forma según el arma (decisión del propietario): espada corta, barrido 1 casilla más allá del golpe normal; espada larga, 3 casillas; hachas, dos giros completos; martillos, círculo de 2 casillas con mucho empuje (estos dos, preparados aunque estén apagados). Sale la espiral de `effect6.spr` hoja 1 alrededor del personaje, el grito C23 (hombre) o C24 (mujer), números grandes y un temblor suave.
- **Cargas:** máximo 1 + nivel/10; +1 cada **20 s** y +1 cada 15 golpes recibidos. Daño = daño del arma × (2 + nivel/30) × extra de familia (larga +10%, hacha y martillo +20%). Se guardan con la partida (`critCharges`; las partidas antiguas empiezan con todas).
- **Interfaz:** esfera **roja** del original (`gamedialog86` hoja 6, frame 5) con el número de cargas, que pasa un momento a la **violeta** (frame 3) al lanzar. En el PC, en el hueco cuadrado de la barra; en el móvil y con `?ui=compact`, ese icono grande **es el botón**, encima de las barras. Atenuado sin cargas; el Mago no tiene nada (llega en el 19B). Página nueva "Crit" en How to Play (con icono X del mando).
- **También cambiado:** el `!` de los números de daño sale **solo en el golpe que mata** ("-20" / "-20!"), como en el original; el crítico de Chr sigue amarillo y grande. Las cartas y el Game Over se eligen con Enter / A / clic, **no con Espacio** (`Action.Pick`).
- **Código:** `data/critStrike.ts`, `systems/CritStrikeSystem.ts`, `WeaponSystem.criticalStrike`, `ui/CritButton.ts`, `CritIconState` en `ui/hudLayout.ts`, `HUD_CRIT` y `HUD_CRIT_BUTTON` en `config/hud.ts`, `fx.crit.strike` y `fx.effect6` (+0,48 MB de carga inicial). La partida simulada lanza un crit en cuanto tiene carga.
- **Truco:** `?debug=crits` o tecla **H** en partida → crits infinitos. Situación nueva `pnpm check crit` (con `--eval="g.launchCritStrike()"` para lanzarlo).
- **Comprobado:** build; `check menu game levelup crit` y `crit --mobile` sin errores; 5 crits seguidos golpean (2–10 enemigos cada uno); el toque en el botón gasta la carga; capturas del efecto y del icono en PC y móvil; Mago sin botón; la partida simulada termina sin errores (el equilibrio se repasa al cerrar la fase).
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=warrior&debug=crits y pulsar Espacio (móvil: añadir `&ui=compact`).

**Fase 18 completada (2026-10-18)**: bloques 18A (esquiva física) y 18B (resistencia mágica). Revisión final: totales de armadura guardados en `Equipment` (no se recalculan cada frame), un solo objeto de defensa por frame, "Resist" apilados sin taparse y el % general de resistencia leído de la bola del Mage-Orc. Idea apuntada para el futuro: jefes más difíciles de esquivar. Fusionada en `master`, etiqueta `fase-18`. Siguiente: `/fase 19`.

**Fase 18, bloque 18B: resistencia mágica (2026-10-18).**
- **Qué hace:** cada hechizo de monstruo (bola de fuego del Mage-Orc y las tres del Fire Wyvern) tira su **puntería mágica** contra la **resistencia mágica** del jugador (Mag + la de su ropa y escudo). Si la resiste, la bola explota igual pero **no hace daño** y sale un **"Resist"** azul claro sobre el personaje (decisión del propietario: aquí sí texto, a diferencia del "Miss"). La resistencia es fija: no sube sola.
- **Números:** fórmula del original (50·puntería mágica/resistencia), límites 25%–95%. Puntería mágica (nuestra, la wiki no la da): Mage-Orc 45, Fire Wyvern 80. Resistencia de piezas (nuestra): Robe 8, Wizard Robe 15, Wizard Cap 5, Wizard Hat 10, Knight Shield 6, Tower Shield 12, Winged Helmet 4, Horned Helmet 8. Con el mejor equipo: Maga 39 a nivel 1 (42% general), guerrero 30 (25%).
- **Interfaz:** el panel de stats (C) enseña valores **generales** (petición del propietario: no hablar de un monstruo concreto): "Dodge x%" (contra una puntería típica de 150) y "Magic resist x%" (contra un hechizo típico, el del Mage-Orc). Las cartas de armadura: "Dodge a% → b%" y "Magic resist a% → b%". El texto de Mag dice "Magic damage and mana, magic resist".
- **Código:** `data/defense.ts` (`MAGIC_RESIST`, `spellHitChance`, `resistChance`, `dodgeChance` general, `PlayerDefense`, `RESIST_TEXT`), `magicHitRatio` en `EnemyRangedAttack`, `magicResistance` en `data/armor.ts` y `Equipment`, `EnemyProjectileSystem` (tirada y aviso `onResist`), `DamageNumbers.showWord`. `?debug=dodge` también da la mejor resistencia.
- **Comprobado:** build; `check menu levelup` y `play=mage|warrior&debug=dodge,stats` sin errores; panel visto en captura; 10 bolas de prueba contra la Maga → varios "Resist". Partida simulada: la Maga resiste ~26% de las bolas del Mage-Orc y ~14% de los golpes y bolas del Wyvern; el guerrero ~6% (en la simulación lleva menos escudo). Niveles sin cambios (26–27).
- **Probar:** `pnpm --dir survivors dev` → http://localhost:8090/?play=mage&debug=dodge,stats y acercarse a los Mage-Orc (salen hacia el minuto 2–4; tecla J adelanta un minuto).

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
