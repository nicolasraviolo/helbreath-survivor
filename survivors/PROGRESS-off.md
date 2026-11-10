# Progreso de Helbreath Off

Léelo solo en sesiones de Helbreath Off (después de `PROGRESS.md`). Plan: `docs/PLAN-OFF.md`. Detalle de cada bloque hecho: `PROGRESS-historial.md` (grep). Atajos y situaciones del `check`: `CHECK.md`, sección "Helbreath Off".

## Estado
- **Fase en curso: Off-12 · Rediseño de ventanas** (rama `fase-Off-12`). **12A estilo base ✅**, **12B pestaña Bag ✅** y **12C pestañas Stats y Magic ✅** y **12D mando y repaso ✅** (10-nov-2026): una sola ventana del personaje (I / X Bag, C / Y Stats, B Magic), RT + A/B/X/Y = teclas 1–4, LB / RB cambian de pestaña. 12D pendiente de probar con mando real.
- **Siguiente:** cerrar la fase Off-12 (`/checkpoint fase`) o seguir con el mismo estilo en tienda, almacén, mercenarios y crear personaje. Ver `docs/PLAN-OFF.md`.
- **UI:** todo cambio de interfaz pasa por el agente `revisor-ui` (critica el boceto antes de programar y revisa después).
- Off-0 a Off-11 ✅ (6 → 10-nov-2026), fusionadas en `master` y escondidas tras `?off`. Pendientes sin fase: 11D (magias sin dibujo) y Detect Invisibility.

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
- Ventanas nuevas (Off-12): estilo en `off/config/offTheme.ts`, piezas en `off/ui/offUi.ts`, muestrario `?off=uikit`. Todo texto con `maxWidth`; exponer `offLayoutIssues` en `debugState` y comprobar con captura. Maquetas aprobadas descritas en DECISIONES.md (10-nov-2026). NOTES.md "Estilo nuevo de ventanas (Off-12A)".
- Select Character de Off: `off/scenes/OffSlotsScene.ts`, `OffDeleteScene.ts`, `off/config/offSlots.ts`, huecos en `OffSaveStore` (`hb-off.character`, `.2`–`.4`, `hb-off.slot`). Cada hueco guarda su propio sitio. NOTES.md, "Select Character en Helbreath Off".
- Mercenarios: `off/data/offMercenary.ts`, `OffMercenaryAI`, `off/systems/OffMercenarySpells.ts`, `OffMercenaryTalk.ts`.
- Raiders: `off/data/offRaiders.ts`, `OffRaiderAI`, `OffBattle.updateRaids`, `OffFoe`; NOTES.md "Raiders (Off-9A)". Números ajustados en la 9C.
- Medir Raiders (9C): `check offduel<10|30|50><w|m|p|i>` (`src/off/dev/offDuel.ts`, `?offfast=N`); no más de dos a la vez. NOTES.md "Medir los Raiders (Off-9C)".
- Invisibles y pasos (9B): `OffMercenary.invisible` / `reveal`, `OffBattle.seenRaiderList` y `updateRaiderSteps`, `OFF_RAIDER_STEPS`; NOTES.md "Raiders invisibles y Enemy Kills (Off-9B)".
- Lo demás: NOTES.md, secciones "... (Off-N)" (grep `Off-`).
