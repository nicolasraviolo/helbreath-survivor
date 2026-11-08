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
   - El resumen del bloque terminado (qué se hizo, cómo probarlo, qué se comprobó) va **arriba del todo** de `survivors/PROGRESS-historial.md`, nunca a los PROGRESS.
   - Archivo del juego (`survivors/PROGRESS-survivors.md` o `survivors/PROGRESS-off.md`): actualiza "Estado" (qué se hizo en 1–2 líneas y qué toca después), pendientes, pistas y problemas conocidos de ese juego. Lo terminado y ya probado sale de ahí: queda en el historial.
   - `survivors/PROGRESS.md` (índice común): solo la línea de "Estado" de ese juego y, si cambian, las reglas o problemas comunes.
   - Situaciones nuevas del `check` y atajos nuevos de la dirección: en `survivors/CHECK.md`, en la sección de su juego.
   - **Tamaños máximos:** `PROGRESS.md` ~5 KB; cada archivo de juego ~12 KB. Mídelo con `wc -c survivors/PROGRESS*.md`; si se pasa, mueve lo terminado al historial y condensa las pistas (una línea: código + sección de NOTES.md).
   - **Novedades del juego** (`survivors/src/data/releaseNotes.ts`, pantalla "What's new" del menú): si el bloque trae algo que el jugador nota, añádelo como una línea corta **en inglés**, de alto nivel, sin números ni detalles (ej. "Mage damage rebalanced", "Inventory is now available", "Several bugs fixed"; máx. ~5 líneas por fase, junta las parecidas) a la entrada de la fase actual. Si esa fase aún no tiene entrada, créala **arriba del todo**, con la versión de `config/version.ts` y la fecha de hoy (`Oct 19, 2026`).
   - Si has aprendido algo no obvio sobre los assets o el código base, añádelo a `survivors/NOTES.md` (y su título al índice de arriba).
4. **Commit** de los cambios relevantes, con mensaje en inglés tipo `feat(survivors): ...` o `fix(survivors): ...`.
5. **Solo en el completo:** pregúntame si la fase está **terminada**. Solo si digo que sí: márcala como completada en PROGRESS.md y en el archivo de su juego, haz commit, fusiona la rama en `master`, crea la etiqueta **anotada** `git tag -a fase-N -m "Fase N"` (`fase-Off-N` para Off) (`--follow-tags` no sube etiquetas simples) y sube todo con `git push origin master --follow-tags`. Después, **anuncio en Discord**: enséñame el mensaje con `pnpm --dir survivors announce --dry` y, si te doy el OK, publícalo con `pnpm --dir survivors announce` (sale de la entrada de la fase en `releaseNotes.ts`; el webhook está en `survivors/.env.local`, que no va a git).
6. Resúmeme en 3–5 líneas qué tengo ahora y qué toca después, y recuérdame **abrir una sesión nueva** (o `/clear`) para el siguiente bloque: todo lo necesario para retomar ya está en PROGRESS.md y el archivo de su juego.
