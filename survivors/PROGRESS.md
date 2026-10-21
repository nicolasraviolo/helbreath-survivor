# Progreso

**Fases completadas** (✅, bloques entre paréntesis):
- 16-oct-2026: 0 Reconocimiento · 1 Esqueleto y primer sprite · 2 Mapa y jugador · 3 Enemigos · 4 Primera arma y combate · 5 Experiencia y subida de nivel · 6 Arsenal completo.
- 17-oct-2026: 7 Oleadas, jefes y final · 8 Menús y personajes (solo menús; Arquero aplazado) · 9 Web, móvil y publicación · 10 Pulido (10A–10C).
- 18-oct-2026: 11 Pulido de interfaz · 12 Móvil sin pérdidas (12A–12C) · 13 Jefe final y equilibrio (13A–13C) · 14 Métricas y logros (14A–14B) · 15 Apuntado híbrido (15A–15C) · 16 Minimapa y tótems (16A–16B) · 17 Selección de personaje (17A–17B) · 18 Esquiva y resistencia mágica (18A–18B).
- 19-oct-2026: 19 Crits y habilidad activa (19A–19C) · 20 Level y equipo (20A–20D).
- 20-oct-2026: 21 Botín y baúl (21A, 21B, 21D, 21E; el 21C, anillos y collares, aplazado).
- 21-oct-2026: 21½ Cartas y sorpresas (21½A–21½C).

## Fase actual
**Fase 22 (sistema de mapas), en curso** en la rama `fase-22`. Hecho: **22A** (Select Map, desbloqueo y Traveler Zone), **22B** (carga por mapa: inicial 29,7 → 9,5 MB; hasta jugar en móvil 41 → 27 s), **22C** (Cat y Traveler Zone más difícil) y **22D** (Elvine Garden: Giant Tree, jefes Hellhound, Stalker y Cyclops). Incluye ya la **Fase 21½** (rareza, Reroll/Skip y Champion, cerrada en `master` el 21-oct-2026, etiqueta `fase-21½`), fusionada en `fase-22` el 21-oct-2026. Detalle en `PROGRESS-historial.md`.
- **Siguiente:** `/fase 22` → bloque **22E, Middleland** (Troll, Werewolf, Hellhound, Stalker, Hellclaw; `docs/PLAN-2.md`). Luego 22F récords · 22G sombras y skill `anadir-mapa`.
- **Orden de mapas (20-oct-2026):** Traveler Zone → Bleeding Isle → Elvine Garden → Middleland (este, "Coming soon"). Se abren al ganar el anterior o con su Level (1/10/25/40). Icebound, a la Fase 25. Select Map se abrirá desde un portal de la ciudad en la Fase 23.
- **Champion en los mapas (fusión 21½ + 22):** usa las oleadas y eventos de cada mapa y nunca sale después del jefe final del mapa (en Traveler Zone, antes del minuto 7). New Run en "Saved Run" lleva a Select Map; Continue, al mapa de su partida.
- **Engagement:** análisis y plan de partidas de prueba en `docs/ENGAGEMENT.md`; mejoras para más adelante en `docs/PLAN-2.md`, "Mejoras de engagement para más adelante".
- **21C (anillos y collares) aplazado.** Spell 2 gastará **maná** (plan del propietario; ver NOTES.md, "Atributos y varitas").
- **Sesiones en la nube (claude.ai/code):** trabajan en otra copia; el propietario ve los cambios con `git pull` en su rama.
- **Abaddon's Blood (21E, 20-oct-2026):** mejora **permanente** para los 4 personajes, no un objeto; revive una vez por partida. Hasta la tienda (Fase 24) solo con `?unlocks=abaddon`.
- **Pendiente de probar por el propietario:** Elvine Garden (22D); carga más rápida (22B, también en el móvil cuando se publique); Select Map en el móvil; pociones al 0,4%; atajo `onehp` / tecla U; baúl y morir con/sin Zem (21D); botín en partida normal; cambiar de pestaña y volver (B4); mando real.
- **Ideas sin fecha:** jefes más difíciles de esquivar (nota en `data/defense.ts`).

**Pistas para trabajar** (detalle en `survivors/NOTES.md`):
- Carga: antes del menú solo lo de los menús; cada mapa baja lo suyo (`MapLoadScene`, `RUN_SPRITES`, `runSprites` de la clase); ropa y armas bajo demanda salvo `UPFRONT_LOOK_SPRITES`; medir con `check loadtime`. Ver NOTES.md, "Carga por mapa y tiempos de carga".
- Mapas: `data/maps.ts` (orden, zona, Level, dificultad), `data/waves.ts` → `TIMELINES`, `systems/MapUnlockStore.ts`, `scenes/MapSelectScene.ts`, `scenes/MapLoadScene.ts`. Visor: http://localhost:8090/maps.html. Ver NOTES.md, "Varios mapas y Select Map (Fase 22A)" y "Elvine Garden (Fase 22D)".
- Champion: `data/champion.ts`, `SpawnSystem.runDueChampion`, `Enemy.champion` / `drawHealthBar`, `LootSystem.onChampionKill`; `?debug=champion`, `check champion`. Ver NOTES.md, "Evento Champion (Fase 21½C)".
- Reroll y Skip: `data/rerollSkip.ts`, `UnlockStore.count/buy`, `GameScene.cardActionsLeft`, botones en `LevelUpScene`; `?unlocks=dice3,wine3`, `check rerollskip`. Ver NOTES.md, "Reroll y Skip (Fase 21½B)".
- Rareza de las cartas: `data/cardRarity.ts`, `systems/UpgradePool.ts`, `GameScene.levelUpChoices`, `LevelUpScene.rarityParts`; `?debug=epic`, `check epic`. Ver NOTES.md, "Rareza de las cartas (Fase 21½A)".
- Botín: `data/loot.ts`, `systems/LootRoller.ts`, `LootSystem`, `RunLoot`, `scenes/LootScene.ts`; inventario en `CharacterStore`. Ver NOTES.md, "Botín en partida (Fase 21A)".
- Baúl, "solo lo que tienes", reglas al morir y Zem: `data/consumables.ts`, `data/warehouse.ts`, `WarehouseStore`, `scenes/WarehouseScene.ts`, `isFreeItem` en `data/items.ts`, `characterStore.finishRun`. Ver NOTES.md, "Baúl, "solo lo que tienes" y Zem (Fase 21D)".
- Abaddon's Blood: `data/abaddon.ts`, `systems/AbaddonRevive.ts`, `systems/UnlockStore.ts`, `ui/ReviveIcon.ts`; `?unlocks=abaddon`, `check revive`. Ver NOTES.md, "Abaddon's Blood: resurrección permanente (Fase 21E)".
- Atributos, veneno y varitas: `data/attributes.ts`, `data/wands.ts`; tinte del arma en `hb/additiveTint.ts`; `?attr=`, `check poison`. Ver NOTES.md, "Atributos y varitas (Fase 21B)".
- Level y Power: `data/characterLevel.ts`, `scenes/CharacterInfoScene.ts`. Ver NOTES.md, "Ventana Character y Level permanente".
- Equipo sobre el cuerpo (ventana Character): `data/paperDoll.ts`, `entities/PaperDoll.ts`, `?gear=`. Ver NOTES.md, "Equipo sobre el cuerpo en la ventana Character (M17)".
- Settings: dos pestañas en `scenes/SettingsScene.ts` (`?open=settings&tab=gameplay`). Ver NOTES.md, "Pestañas de Settings (M13)".
- Pantalla de carga: `scenes/PreloadScene.ts`, `?loading=hold`, `check loading`. Ver NOTES.md, "Pantalla de carga (M8)".
- Élites: `data/elites.ts`, `?debug=elites`, `check elites`. Ver NOTES.md, "Monstruos élite (M2)".
- Estela del tajo: estilos en `data/slash.ts` (`?slash=N`, tecla Y). Ver NOTES.md, "Estela del tajo del guerrero".
- Equipo: `data/items.ts` (huecos, catálogo, requisitos), `scenes/EquipmentScene.ts`. Ver NOTES.md, "Equipo y pantalla Equipment".
- Cartas: stat o pasiva (Xelima, Merien, Magnet) en `systems/UpgradePool.ts` y `data/passives.ts`; `?debug=stones`. Ver NOTES.md, "Cartas de Power (Fase 20C)".
- Hechizos del Mago: automáticos (círculos 1–5) en `data/spells.ts`, activos (6–10, meteorito o ráfaga) en `data/activeSpells.ts`; huecos `spell1`/`spell2` en `data/items.ts`. Usan la esfera del crit hasta tener icono. Ver NOTES.md, "Hechizos equipables del Mago (Fase 20D)" y "Meteor Strike".
- Crit y mando: `systems/CritStrikeSystem.ts`, `systems/Rumble.ts`. Ver NOTES.md, "Critical Strike (Fase 19A)" y "Vibración del mando".
- Apuntado: todo pasa por `systems/Targeting.ts`. Ver NOTES.md, "Apuntado automático", "Apuntado manual" y "Stick de apuntar en el móvil".
- Esquiva y resistencia: `data/defense.ts`. Ver NOTES.md, "Esquiva física" y "Resistencia mágica".
- Guardado: personajes y partidas (una por personaje) en `CharacterStore`/`SaveStore`, cada cosa en su clave; récords y baúl irán igual. Ver NOTES.md, "Personajes guardados" y "Partidas guardadas".
- Equilibrio: `data/leveling.ts`, `data/enemies.ts`, `data/stats.ts`; medir con `check levelpace` y las métricas. Ver NOTES.md, "Partida simulada y equilibrio".
- Oleadas y monstruos por grupos: `data/enemies.ts`, `data/maps.ts`, `SpawnSystem`. Ver NOTES.md, "Monstruos de las oleadas".
- Logros: basta con añadirlo a `data/achievements.ts`. Ver NOTES.md, "Logros".
- Métricas: gráficas en https://helbreath-survivors-metrics.nicolasraviolo.workers.dev (clave en `metrics-server/.dev.vars`). Ver NOTES.md, "Métricas".
- Assets propios (no están en sp-client): `survivors/custom-assets/`, misma estructura. Temblor: `data/feedback.ts`. Ver NOTES.md, "Sensación de impacto".
- What's new: `data/releaseNotes.ts`; cada `/checkpoint` añade lo que nota el jugador.

## Reglas vigentes
- Idioma del juego: **solo inglés** (regla 9 de CLAUDE.md).
- Fuente: **Comic Neue** (15; 12 en la barra inferior). Números de daño en Georgia.
- Controles: nunca en pantalla; se explican en **How to Play** (`data/howToPlay.ts`).
- Settings: sí/no con casilla (`MenuList`, `checked`); volumen y opciones de varios valores, con flechas ◄ ►.
- **Level** permanente (máx. 140): recibe **toda** la EXP de la partida, ganes o mueras; si sales, espera guardada con la partida (M4). El nivel de la partida se llama **Power** en todos los textos.
- Puntos: 3 por Level, ninguno al crear; se reparten **solo** en la ventana Character ("Level Set." o C). En partida, C pausa y solo se mira.
- Esquiva y resistencia: siempre **% generales**, nunca contra un monstruo; esquiva sin "Miss", resistencia con "Resist".
- Una partida guardada por personaje (4 huecos). En el menú solo Play: al elegir el personaje se continúa (en el mapa de su partida) o se empieza de nuevo (pasando por Select Map).
- Equipo: **solo lo que tienes** (equipo de salida + inventario; hechizos libres por Int); requisitos del original con stats **permanentes** y Level. Al continuar una partida mandan el arma y los hechizos equipados ahora. Morir sin Zem = se pierde el botín de esa partida.
- El resto de decisiones, con fecha: `docs/DECISIONES.md` (grep por fase o tema).

## Cómo probar
- Jugar: `pnpm --dir survivors dev` → http://localhost:8090
- Comprobar: `pnpm --dir survivors check [situaciones] [--mobile]` → escenas, FPS, estado, errores y captura en `survivors/.check/`. Situaciones: `menu`, `loading` (pantalla de carga parada a la mitad), `news` (What's new), `settings`, `controls`, `game`, `minimap`, `achievements` (con `--cards`: desde cero hasta nivel 21), `achievementlist`, `levelup`, `epic` (tres cartas Epic), `rerollskip` (cartas con 3 Reroll y 3 Skip), `champion` (un Champion a los 3 s; `--wait=6000`), `boss`, `finalboss`, `portal`, `stampede`, `horde`, `elites` (todos los monstruos élite), `pickups`, `totems`, `slots` (dos personajes de ejemplo), `slotsempty`, `runchoice` (ventana Continue / New Run), `crit` (Guerrero con horda y crits infinitos; `--eval="g.launchCritStrike()"`), `charinfo` / `charinfogame` (ventana Character en menú / en partida), `equipment` (pantalla Equipment de Gorn), `equipmentmage` (la de Kaila, Int 86), `equipmentowned` (Gorn con objetos en el inventario), `warehouse` (baúl), `deathnozem` / `deathzem` (`--wait=7000 --eval="(g.debugPickUpLoot(), g.debugKeepLoot(), g.endRun(false))"`), `revive` (Abaddon's Blood desbloqueado con horda; ver NOTES.md para morir), `activespell` (Maga con horda y activo sin recarga; `--eval="g.launchCritStrike()"`), `charexp` (fin con EXP ×50: `--eval="g.endRun(false)"`), `loot` / `lootmage` (cae botín cada 6 s; `--eval="g.debugPickUpLoot()"` lo coge), `lootsharp` / `lootancient` (botín siempre arma con ese atributo), `poison` (Gorn con arma Poison en una horda), `mapselect` / `mapsall` / `mapsnew` (Select Map: ejemplo, todo abierto, dispositivo nuevo), `traveler` / `travelerboss` (Traveler Zone; el Dummy), `elvine` / `elvineboss` / `levelpaceelvine` / `loadtimeelvine` (Elvine Garden; el Cyclops), `loadtime` / `loadtimetraveler` / `loadtimemage` (tiempos y MB de cada carga con red simulada; `--mobile` = 4G y CPU ×4; informe en `.check/`), `levelpace` (partida simulada rápida: nivel por minuto, vida de cada jefe y su golpe más fuerte; informe en `.check/levelpace.json`) o atajos a mano (`"play=warrior&debug=str,levels"`).
- Opciones del check: `--eval="g.enemies.alive"` escribe cualquier dato (g = escena Game; si es una promesa, se espera); `--wait=5000` deja correr más; `--cards` elige la primera carta en cada subida.
- Atajos en la dirección (solo desarrollo, `src/config/debugStart.ts`):
  - `?play`, `?play=warrior`, `?ui=compact` (interfaz de móvil), `?trees=off`, `?metrics=send` (envía la partida de verdad).
  - `?debug=boss,god`; acciones: horde, kill, levelup, levels, str, magic, pickups, totems, minute, boss, finalboss, bosskill, stampede, onehp (1 de vida, para probar morir), god, crits (infinitos, tecla H; también el activo del Mago sin recarga), stones (cartas de Xelima, Merien y Magnet), epic (todas las cartas Epic), dodge (mejor armadura de la clase), stats (panel abierto), aim (apuntar a la derecha), aimstick (dedo falso en el stick, con `--mobile`), resume (guardar y recargar como Continue), sim (partida simulada), charexp (EXP ×50), elites (todos élite), champion (un Champion a los 3 s), loot (botín junto al jugador cada 6 s), zem (los jefes sueltan Zem).
  - `?map=traveler|elvineGarden` (partida en ese mapa; sin él, Bleeding Isle) · `?maps=all|reset` (todos abiertos / olvidar victorias) · `?open=mapselect`.
  - `?loading=hold`: la pantalla de carga se para a la mitad.
  - `?gear=plateMail,helmet,...`: con `?characters=demo`, los de ejemplo llevan esos objetos sin mirar requisitos; `sharp:longSword` lo mete en su inventario con ese atributo, `inv:plateMail` sin atributo, `zemstone` les pone un Zem. `?characters=` también reinicia el baúl.
  - `?attr=sharp|poison|ancient`: el arma de salida y todo el botín (siempre armas) con ese atributo.
  - `?slash=N`: estilo de la estela del tajo (0–4, `data/slash.ts`); tecla Y para el siguiente.
  - `?open=howtoplay` (también settings, controls, credits, achievements, select, slots, charinfo, equipment, warehouse, releasenotes); `?open=equipment&class=mage` abre la de la Maga.
  - `?spells=fireBall,meteorStrike`: hechizos del Mago en esa partida, sin requisitos.
  - `?unlocks=abaddon|reset` (Abaddon's Blood desbloqueado o no, Fase 21E); `?unlocks=dice3,wine2` (dados y vinos comprados, 0–3, Fase 21½B); `?achievements=reset|all`; `?characters=reset|demo` (demo: dos de ejemplo, Gorn con 60.000 EXP y Kaila Level 25 con Int 86; con `?play=warrior` juega Gorn).
- Teclas en partida: F1 panel · G invencible · N enemigos · L niveles · J +1 minuto · U quedarse con 1 de vida, entre otras (`systems/InputSystem.ts`).
- App instalable: solo en el build (`survivors/pwa/`). `pnpm build` y `pnpm preview` → http://localhost:4173.
- Visor de sprites (desarrollo): http://localhost:8090/sprites.html → todos los `.spr` por categorías, animados, con armas y armaduras sobre el cuerpo. Enlaces: `#weapons`, `#item/Long%20Sword`, `#file/orc/4`.
- Datos de Helbreath: `docs/hb-wiki/` (índice en `README.md`). Historial de bloques: `survivors/PROGRESS-historial.md` (grep, no leer entero).

## Problemas conocidos
- Una vez (19-oct-2026), al **continuar** una partida, no salió ningún jefe (sin barra) y solo algunos monstruos; en otra partida, bien. No se reprodujo en local. Sospecha: descarga de sprites atascada (red con Cloudflare o caché). Si se repite: F1 → monstruos pendientes de descarga (`AssetStreamer`).
- La red del propietario bloquea a veces las IPs de Cloudflare (LaLiga): métricas sin abrir ni recibir partidas. Probar con datos móviles o más tarde.
- La partida simulada a veces falla: el jugador no alcanza a un jefe atascado y este vive hasta el final; descartarlas. Con el guerrero sale muy irregular (nivel 10–27 con el mismo código, 18-oct-2026), peor cuanto más deprisa (×400–500): repetir y usar la mediana.
- Las flechas "→" de las cartas salen en otra fuente (Comic Neue no la tiene). No molesta.
- Navegador interno en segundo plano: ~1 FPS, parece congelado; usar Playwright o el panel visible. A veces a Playwright también le cae `requestAnimationFrame` a 2/s (16-oct-2026). No es del juego.
- En el navegador interno, `sp-client` da `Cannot suspend/resume a closed AudioContext` (audio en pestaña de fondo). No afecta.
- Enemigos atascados tras un obstáculo si el jugador está al otro lado (sin búsqueda de caminos; en Bleeding Isle pasa poco). Se recolocan si quedan lejos.
- A 800×600 el personaje se ve pequeño (tamaño original). Se puede ajustar el zoom de la cámara más adelante.
