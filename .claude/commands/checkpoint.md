---
description: Cerrar un bloque (/checkpoint) o una fase entera (/checkpoint fase) - verificar, documentar y guardar en git
---
Haz un checkpoint del trabajo actual. Hay dos niveles:
- **Ligero** (`/checkpoint`, lo normal al cerrar un bloque): pasos 1–4 y 6.
- **Completo** (`/checkpoint fase`, al cerrar una fase): todos los pasos.

La guía del juego **no** se actualiza aquí: tiene su propio comando, `/guia`, que el propietario lanza cuando quiere.

Argumentos: $ARGUMENTS

1. **Verificar:** `pnpm --dir survivors build` (ya incluye `tsc`). Si algo falla, corrígelo antes de seguir.
2. **Comprobar en el navegador:** `pnpm --dir survivors check <situaciones>`, con las situaciones que toque este bloque (p. ej. `menu levelup boss`, y `--mobile` si cambió algo del móvil). Lee solo el resumen de texto. Mira una captura de `survivors/.check/` solo si el cambio es visual y hace falta confirmarlo. Usa Playwright MCP a mano solo si el script no cubre lo que hay que ver.
3. **Documentar:**
   - `survivors/PROGRESS.md`: actualiza la tabla de fases y el "Para retomar". Mueve el resumen del bloque terminado (qué se hizo, cómo probarlo, qué se comprobó) **arriba del todo** de `survivors/PROGRESS-historial.md`, no a PROGRESS.md. Actualiza problemas conocidos y decisiones. PROGRESS.md debe quedarse corto (unas 60 líneas).
   - **Novedades del juego** (`survivors/src/data/releaseNotes.ts`, pantalla "What's new" del menú): si el bloque trae algo que el jugador nota, añádelo como una línea corta **en inglés** y sin jerga técnica a la entrada de la fase actual. Si esa fase aún no tiene entrada, créala **arriba del todo**, con la versión de `config/version.ts` y la fecha de hoy (`Oct 19, 2026`).
   - Si has aprendido algo no obvio sobre los assets o el código base, añádelo a `survivors/NOTES.md` (y su título al índice de arriba).
4. **Commit** de los cambios relevantes, con mensaje en inglés tipo `feat(survivors): ...` o `fix(survivors): ...`.
5. **Solo en el completo:** pregúntame si la fase está **terminada**. Solo si digo que sí: márcala como completada en PROGRESS.md, haz commit, fusiona la rama en `master`, crea la etiqueta **anotada** `git tag -a fase-N -m "Fase N"` (`--follow-tags` no sube etiquetas simples) y sube todo con `git push origin master --follow-tags`.
6. Resúmeme en 3–5 líneas qué tengo ahora y qué toca después, y recuérdame **abrir una sesión nueva** (o `/clear`) para el siguiente bloque: todo lo necesario para retomar ya está en PROGRESS.md.
