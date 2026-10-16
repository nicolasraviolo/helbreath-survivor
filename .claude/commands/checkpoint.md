---
description: Cerrar un bloque de trabajo o una fase: verificar, documentar y guardar en git
---
Haz un checkpoint del trabajo actual:

1. Ejecuta `pnpm exec tsc --noEmit` y `pnpm build` dentro de `survivors/`. Si algo falla, corrígelo antes de seguir. (En la Fase 0 todavía no existe el proyecto: sáltate este paso.)
2. Si tienes Playwright MCP, abre el juego en el servidor de desarrollo, comprueba que no hay errores en consola y haz una captura.
3. Actualiza `survivors/PROGRESS.md`: qué se hizo, qué falta de la fase, problemas conocidos y la fecha.
4. Si has aprendido algo no obvio sobre los assets o el código base, añádelo a `survivors/NOTES.md`.
5. Haz `git add` de los cambios relevantes y un commit con mensaje en inglés tipo `feat(survivors): ...` o `fix(survivors): ...`.
6. Pregúntame si la fase está **terminada**. Solo si digo que sí: márcala como completada en PROGRESS.md, haz commit, fusiona la rama en `master`, crea la etiqueta `fase-N` y sube todo con `git push origin master --follow-tags`.
7. Resúmeme en 3–5 líneas qué tengo ahora y qué toca después.

$ARGUMENTS
