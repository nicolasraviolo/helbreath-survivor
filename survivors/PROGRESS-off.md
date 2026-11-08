# Progreso de Helbreath Off

Léelo solo en sesiones de Helbreath Off (después de `PROGRESS.md`). Plan: `docs/PLAN-OFF.md`. Detalle de cada bloque hecho: `PROGRESS-historial.md` (grep). Atajos y situaciones del `check`: `CHECK.md`, sección "Helbreath Off".

## Estado
- **Ninguna fase en curso.** Off-0 a Off-8 ✅ (etiquetas `fase-Off-0` … `fase-Off-8`), fusionadas en `master` y escondidas tras `?off`.
- **Última: Off-8 Critical Strike y mercenarios** ✅ (8-nov-2026): 8A Critical Strike con cargas (Alt / LT), 8B Gorn el Guerrero (William, junto al teleport), 8C Kaila la Maga y Berserk, 8D frases y golpes por la espalda, 8E vida por tandas, poción propia (30 % → cura el 40 %) y huir (25 %, vuelve al 50 %). La versión final de la 8E, **sin probar por el propietario** (probó la primera). NOTES.md: "Mercenario (Off-8B)" … "Mercenario que aguanta (Off-8E)".
- **Siguiente: Off-9 Raiders** (plan aprobado el 8-nov-2026, `docs/PLAN-OFF.md`): `/fase Off-9`.

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
- Lo demás: NOTES.md, secciones "... (Off-N)" (grep `Off-`).
