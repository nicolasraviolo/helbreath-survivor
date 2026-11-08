# Progreso de Helbreath Off

Léelo solo en sesiones de Helbreath Off (después de `PROGRESS.md`). Plan: `docs/PLAN-OFF.md`. Detalle de cada bloque hecho: `PROGRESS-historial.md` (grep). Atajos y situaciones del `check`: `CHECK.md`, sección "Helbreath Off".

## Estado
- **Fase en curso: Off-9 Raiders** (rama `fase-Off-9`). 9A ✅ (probada). **9B Invisibles y Enemy Kills ✅** (9-nov-2026, falta que la pruebe el propietario): 1 de cada 3 incursiones llegan invisibles hasta su primer golpe o magia, se oyen sus pasos, y cada Raider que matáis suma 1 en "EK.Count" (ventana Character).
- **Siguiente: 9C Medir y ajustar** la dificultad de los Raiders con `pnpm check` (frecuencia, vida, críticos, parálisis, invisibles, volumen de los pasos).
- Off-0 a Off-8 ✅ (etiquetas `fase-Off-0` … `fase-Off-8`), fusionadas en `master` y escondidas tras `?off`.

## A vigilar
- Sin probar con un **mando real**: lanzar con RT + A/B/X/Y, Critical Strike con LT.
- La duración del nombre (2 s) es de memoria; el Size y el maná de NPC.cfg no están en el repo (Golems, Troll y Cyclops van como grandes; el Cyclops no se queda sin maná).
- La versión del pie sigue en "Phase 30" para que Off no se vea.
- Idea aparcada: Off como app independiente sin conexión.

## Reglas de Off
- **Off no irá al móvil** (propietario, 7-nov-2026): solo PC y mando.
- Código de Off en `src/off/` (escenas, datos y sistemas propios; reutiliza escenas de Survivors como Character y Select Character en modo Off).
- Guardado en claves `hb-off.*`; toda clave nueva va a `TRANSFER_KEYS`.

## Pistas para trabajar
- Select Character de Off: `off/scenes/OffSlotsScene.ts`, `OffDeleteScene.ts`, `off/config/offSlots.ts`, huecos en `OffSaveStore` (`hb-off.character`, `.2`–`.4`, `hb-off.slot`). Cada hueco guarda su propio sitio. NOTES.md, "Select Character en Helbreath Off".
- Mercenarios: `off/data/offMercenary.ts`, `OffMercenaryAI`, `off/systems/OffMercenarySpells.ts`, `OffMercenaryTalk.ts`.
- Raiders: `off/data/offRaiders.ts`, `OffRaiderAI`, `OffBattle.updateRaids`, `OffFoe`; NOTES.md "Raiders (Off-9A)". Los números (frecuencia, vida, críticos, parálisis) se ajustan en la 9C.
- Invisibles y pasos (9B): `OffMercenary.invisible` / `reveal`, `OffBattle.seenRaiderList` y `updateRaiderSteps`, `OFF_RAIDER_STEPS`; NOTES.md "Raiders invisibles y Enemy Kills (Off-9B)".
- Lo demás: NOTES.md, secciones "... (Off-N)" (grep `Off-`).
