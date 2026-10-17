---
description: Cerrar un bloque de trabajo o una fase: verificar, documentar y guardar en git
---
Haz un checkpoint del trabajo actual:

1. Ejecuta `pnpm exec tsc --noEmit` y `pnpm build` dentro de `survivors/`. Si algo falla, corrígelo antes de seguir. (En la Fase 0 todavía no existe el proyecto: sáltate este paso.)
2. Si tienes Playwright MCP, abre el juego en el servidor de desarrollo, comprueba que no hay errores en consola y haz una captura.
3. Actualiza `survivors/PROGRESS.md`: qué se hizo, qué falta de la fase, problemas conocidos y la fecha.
4. Si has aprendido algo no obvio sobre los assets o el código base, añádelo a `survivors/NOTES.md`.
5. **Actualiza la guía del juego** (`docs/guia/index.html`, la página para enseñar el juego a quien no lo conoce):
   - Refleja lo nuevo de este bloque o fase: secciones, números, estado de las fases, problemas conocidos y mejoras posibles. Cambia la fecha del pie.
   - Si hay **algo visual nuevo** (monstruo, arma, hechizo, objeto, efecto, pantalla, menú…), añade su sprite y/o una captura del juego. Usa los títulos con la fuente dibujada del original cuando el juego muestre ese texto. Cómo sacar las imágenes: `docs/guia/README.md`.
   - Republica con la herramienta Artifact en la misma URL: **https://claude.ai/artifact/Dc93yohDxdW8bymFxW9iQZ**. Antes, léela con `action: "read"`. Publica `docs/guia/index.html` con `url` y pasa en `files` las imágenes nuevas o cambiadas (`img/...` → `docs/guia/img/...`).
   - Dime en una línea qué ha cambiado en la guía.
6. Haz `git add` de los cambios relevantes y un commit con mensaje en inglés tipo `feat(survivors): ...` o `fix(survivors): ...`.
7. Pregúntame si la fase está **terminada**. Solo si digo que sí: márcala como completada en PROGRESS.md, haz commit, fusiona la rama en `master`, crea la etiqueta **anotada** `git tag -a fase-N -m "Fase N"` (`--follow-tags` no sube etiquetas simples) y sube todo con `git push origin master --follow-tags`.
8. Resúmeme en 3–5 líneas qué tengo ahora y qué toca después.

$ARGUMENTS
