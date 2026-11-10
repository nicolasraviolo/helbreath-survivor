# Progreso de Helbreath Off

Léelo solo en sesiones de Helbreath Off (después de `PROGRESS.md`). Plan: `docs/PLAN-OFF.md`. Detalle de cada bloque hecho: `PROGRESS-historial.md` (grep). Atajos y situaciones del `check`: `CHECK.md`, sección "Helbreath Off".

## Estado
- **Ninguna fase en curso.** Off-0 a Off-11 ✅ (6 → 10-nov-2026; etiquetas `fase-Off-0` … `fase-Off-11`), fusionadas en `master` y escondidas tras `?off`. La última en cerrarse fue la **Off-9 Raiders** (10-nov-2026, probada por el propietario), después de la Off-10 (las Farms como casa) y la Off-11 (varitas y magias de los círculos 6–10).
- **Siguiente (a elegir):** **11D** magias sin dibujo (Spike Field, Cloud Kill, Mass Poison, Earthworm Strike, Armor Break), **Detect Invisibility** para ver a los Raiders invisibles, o volver a Survivors (Fase 31). Ver `docs/PLAN-OFF.md`.

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
- Select Character de Off: `off/scenes/OffSlotsScene.ts`, `OffDeleteScene.ts`, `off/config/offSlots.ts`, huecos en `OffSaveStore` (`hb-off.character`, `.2`–`.4`, `hb-off.slot`). Cada hueco guarda su propio sitio. NOTES.md, "Select Character en Helbreath Off".
- Mercenarios: `off/data/offMercenary.ts`, `OffMercenaryAI`, `off/systems/OffMercenarySpells.ts`, `OffMercenaryTalk.ts`.
- Raiders: `off/data/offRaiders.ts`, `OffRaiderAI`, `OffBattle.updateRaids`, `OffFoe`; NOTES.md "Raiders (Off-9A)". Números ajustados en la 9C.
- Medir Raiders (9C): `check offduel<10|30|50><w|m|p|i>` (`src/off/dev/offDuel.ts`, `?offfast=N`); no más de dos a la vez. NOTES.md "Medir los Raiders (Off-9C)".
- Invisibles y pasos (9B): `OffMercenary.invisible` / `reveal`, `OffBattle.seenRaiderList` y `updateRaiderSteps`, `OFF_RAIDER_STEPS`; NOTES.md "Raiders invisibles y Enemy Kills (Off-9B)".
- Lo demás: NOTES.md, secciones "... (Off-N)" (grep `Off-`).
