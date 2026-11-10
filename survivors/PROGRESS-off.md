# Progreso de Helbreath Off

Léelo solo en sesiones de Helbreath Off (después de `PROGRESS.md`). Plan: `docs/PLAN-OFF.md`. Detalle de cada bloque hecho: `PROGRESS-historial.md` (grep). Atajos y situaciones del `check`: `CHECK.md`, sección "Helbreath Off".

## Estado
- **Off-13 · El estilo nuevo en el resto de ventanas** (plan en `docs/PLAN-OFF.md`, rama `fase-Off-13`). **13A–13E ✅** (10-nov-2026): preguntas, pausa con Controls, William, Select Map, almacén con montones, tienda y herrero, e **inicio y Select Character** (tarjetas oscuras, botones con mando, pistas con cruceta).
- **Siguiente: 13F** Create New Character (caja de nombre con foco, valores escritos, filas ‹ ›, Create como botón; decidir: nombre con mando). Con ella se cierra la Off-13.
- **UI:** todo cambio de interfaz pasa por el agente `revisor-ui` (critica el boceto antes de programar y revisa después). La revisión de todas las ventanas viejas (10-nov-2026) está resumida por bloque en PLAN-OFF.md; cada fallo se arregla al rehacer su pantalla.
- Off-0 a Off-12 ✅ (6 → 10-nov-2026), fusionadas en `master` y escondidas tras `?off`. Pendientes sin fase: 11D (magias sin dibujo) y Detect Invisibility. 12D y 13A–13E sin probar con mando real. Con 0 de oro, el "0" de Alegreya (cifras antiguas) se ve pequeño en las ventanas nuevas.

## A vigilar
- Lanzar con RT + botones ya probado con mando real (9-nov-2026); Critical Strike con LT, sin probar.
- La duración del nombre (2 s) es de memoria; el Size y el maná de NPC.cfg no están en el repo (Golems, Troll y Cyclops van como grandes; el Cyclops no se queda sin maná).
- La versión del pie sigue en "Phase 30" para que Off no se vea.
- Idea aparcada: Off como app independiente sin conexión.

## Reglas de Off
- **Off no irá al móvil** (propietario, 7-nov-2026): solo PC y mando.
- Código de Off en `src/off/` (escenas, datos y sistemas propios; reutiliza escenas de Survivors como Character y Select Character en modo Off).
- Guardado en claves `hb-off.*`; toda clave nueva va a `TRANSFER_KEYS` y hay que **volver a publicar el servidor** (`pnpm --dir survivors exec wrangler deploy --config metrics-server/wrangler.toml`).

## Pistas para trabajar
- Ventana del personaje (Off-12B/C): `off/scenes/OffBagScene.ts` (cabecera, columna del personaje, Bag; cambiar de pestaña = `scene.restart`), Stats `off/ui/offStatsPage.ts`, Magic `off/ui/offMagicPage.ts`, medidas `off/config/offBag.ts`, ficha `off/ui/offItemCard.ts`. NOTES.md "Ventana del personaje con la bolsa (Off-12B)" y "Pestañas Stats y Magic (Off-12C)".
- Tienda y herrero (Off-13D): `off/scenes/OffStoreScene.ts`, medidas `off/config/offStore.ts`, armas por tipo en `WEAPON_FAMILY` (`off/data/offStore.ts`: un arma nueva va ahí). NOTES.md "Tienda y herrero (Off-13D)".
- Almacén y montones (Off-13C): `off/scenes/OffWarehouseScene.ts`, medidas `off/config/offWarehouse.ts`, rejilla `off/ui/offItemGrid.ts`, montones `offStacks` (`off/data/offItems.ts`); el espacio se cuenta por celdas (`offStackFits`, nunca `slice`). NOTES.md "Almacén y objetos apilados (Off-13C)".
- Pausa, Controls, William y Select Map (Off-13B): `off/scenes/OffPauseScene.ts`, `OffControlsScene.ts` (filas en `off/data/offControls.ts`, a mano), `OffMercenaryScene.ts`, `OffMapSelectScene.ts`; medidas en `off/config/offPause.ts`, `offMercenaryWindow.ts`, `offMapSelect.ts`. NOTES.md "Pausa, William y Select Map (Off-13B)".
- Pregunta (Off-13A): `off/scenes/OffDialogScene.ts` (una para todas: título, pregunta, aviso, botones, `focus`, `cancel`), medidas `off/config/offDialog.ts`, foco con `offFocusGroup`. Retardo de entrada con `game.loop.time`, no `this.time.now`. NOTES.md "Ventana de pregunta (Off-13A)".
- Ventanas nuevas (Off-12): estilo en `off/config/offTheme.ts`, piezas en `off/ui/offUi.ts`, muestrario `?off=uikit`. Todo texto con `maxWidth`; exponer `offLayoutIssues` en `debugState` y comprobar con captura. Maquetas aprobadas descritas en DECISIONES.md (10-nov-2026). NOTES.md "Estilo nuevo de ventanas (Off-12A)".
- Inicio y Select Character (Off-13E): `off/scenes/OffHomeScene.ts`, `OffSlotsScene.ts`, medidas y textos en `off/config/offHome.ts` y `offSlots.ts`, tarjeta `offSlotCard`; NOTES.md "Inicio y Select Character (Off-13E)". Huecos en `OffSaveStore` (`hb-off.character`, `.2`–`.4`, `hb-off.slot`). Cada hueco guarda su propio sitio. NOTES.md, "Select Character en Helbreath Off".
- Mercenarios: `off/data/offMercenary.ts`, `OffMercenaryAI`, `off/systems/OffMercenarySpells.ts`, `OffMercenaryTalk.ts`.
- Raiders: `off/data/offRaiders.ts`, `OffRaiderAI`, `OffBattle.updateRaids`, `OffFoe`; NOTES.md "Raiders (Off-9A)". Números ajustados en la 9C.
- Medir Raiders (9C): `check offduel<10|30|50><w|m|p|i>` (`src/off/dev/offDuel.ts`, `?offfast=N`); no más de dos a la vez. NOTES.md "Medir los Raiders (Off-9C)".
- Invisibles y pasos (9B): `OffMercenary.invisible` / `reveal`, `OffBattle.seenRaiderList` y `updateRaiderSteps`, `OFF_RAIDER_STEPS`; NOTES.md "Raiders invisibles y Enemy Kills (Off-9B)".
- Lo demás: NOTES.md, secciones "... (Off-N)" (grep `Off-`).
