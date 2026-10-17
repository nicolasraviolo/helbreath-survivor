---
description: Cerrar un bloque (/checkpoint) o una fase entera (/checkpoint fase) - verificar, documentar y guardar en git
---
Haz un checkpoint del trabajo actual. Hay dos niveles:
- **Ligero** (`/checkpoint`, lo normal al cerrar un bloque): pasos 1–4 y 7.
- **Completo** (`/checkpoint fase`, al cerrar una fase, o si el propietario pide actualizar la guía): todos los pasos.

Argumentos: $ARGUMENTS

1. **Verificar:** `pnpm --dir survivors build` (ya incluye `tsc`). Si algo falla, corrígelo antes de seguir.
2. **Comprobar en el navegador:** `pnpm --dir survivors check <situaciones>`, con las situaciones que toque este bloque (p. ej. `menu levelup boss`, y `--mobile` si cambió algo del móvil). Lee solo el resumen de texto. Mira una captura de `survivors/.check/` solo si el cambio es visual y hace falta confirmarlo. Usa Playwright MCP a mano solo si el script no cubre lo que hay que ver.
3. **Documentar:**
   - `survivors/PROGRESS.md`: actualiza la tabla de fases y el "Para retomar". Mueve el resumen del bloque terminado (qué se hizo, cómo probarlo, qué se comprobó) **arriba del todo** de `survivors/PROGRESS-historial.md`, no a PROGRESS.md. Actualiza problemas conocidos y decisiones. PROGRESS.md debe quedarse corto (unas 60 líneas).
   - Si has aprendido algo no obvio sobre los assets o el código base, añádelo a `survivors/NOTES.md` (y su título al índice de arriba).
4. **Commit** de los cambios relevantes, con mensaje en inglés tipo `feat(survivors): ...` o `fix(survivors): ...`.
5. **Solo en el completo: actualiza la guía del juego** (`docs/guia/index.html`, la página para enseñar el juego a quien no lo conoce). Hazlo con un **subagente con `model: "sonnet"`**: pásale la lista de cambios de la fase y las instrucciones de este paso, y tráete solo su resumen.
   - Refleja lo nuevo de la fase: secciones, números, estado de las fases, problemas conocidos y mejoras posibles. Cambia la fecha del pie.
   - Si hay **algo visual nuevo** (monstruo, arma, hechizo, objeto, efecto, pantalla, menú…), añade su sprite y/o una captura del juego. Usa los títulos con la fuente dibujada del original cuando el juego muestre ese texto. Cómo sacar las imágenes: `docs/guia/README.md`. Para capturas de partida sirve `pnpm --dir survivors check`.
   - Republica con la herramienta Artifact en la misma URL: **https://claude.ai/artifact/Dc93yohDxdW8bymFxW9iQZ**. Antes, léela con `action: "read"`. Publica `docs/guia/index.html` con `url` y pasa en `files` las imágenes nuevas o cambiadas (`img/...` → `docs/guia/img/...`).
   - Dime en una línea qué ha cambiado en la guía, y haz commit.
6. **Solo en el completo:** pregúntame si la fase está **terminada**. Solo si digo que sí: márcala como completada en PROGRESS.md, haz commit, fusiona la rama en `master`, crea la etiqueta **anotada** `git tag -a fase-N -m "Fase N"` (`--follow-tags` no sube etiquetas simples) y sube todo con `git push origin master --follow-tags`.
7. Resúmeme en 3–5 líneas qué tengo ahora y qué toca después, y recuérdame **abrir una sesión nueva** (o `/clear`) para el siguiente bloque: todo lo necesario para retomar ya está en PROGRESS.md.
