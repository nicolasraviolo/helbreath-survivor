---
description: Actualizar y republicar la guía del juego con todo lo hecho desde la última vez (uso: /guia)
---
Actualiza la guía del juego (`docs/guia/index.html`, la página para enseñar el juego a quien no lo conoce). Solo se hace cuando yo lo pido, no en cada checkpoint.

1. **Qué ha cambiado desde la última actualización:** busca el último commit que tocó la guía (`git log -1 --format="%h %ad" --date=short -- docs/guia/index.html`) y saca la lista de cambios desde entonces: `git log --oneline <ese commit>..HEAD -- survivors/` y las entradas correspondientes de arriba de `survivors/PROGRESS-historial.md` (solo esas, no el archivo entero). Si no hay nada nuevo, dímelo y para.
2. **Delega la edición en un subagente con `model: "sonnet"`.** Pásale la lista de cambios y estas instrucciones, y tráete solo su resumen:
   - Refleja lo nuevo: secciones, números, estado de las fases, problemas conocidos y mejoras posibles. Cambia la fecha del pie.
   - Si hay **algo visual nuevo** (monstruo, arma, hechizo, objeto, efecto, pantalla, menú…), añade su sprite y/o una captura del juego. Usa los títulos con la fuente dibujada del original cuando el juego muestre ese texto. Cómo sacar las imágenes: `docs/guia/README.md`. Para capturas de partida: `pnpm --dir survivors check <situación>` (las guarda en `survivors/.check/`).
3. **Republica** con la herramienta Artifact en la misma URL: **https://claude.ai/artifact/Dc93yohDxdW8bymFxW9iQZ**. Antes, léela con `action: "read"`. Publica `docs/guia/index.html` con `url` y pasa en `files` las imágenes nuevas o cambiadas (`img/...` → `docs/guia/img/...`).
4. Haz commit (`docs: update game guide ...`) y dime en 2–3 líneas qué ha cambiado en la guía.

$ARGUMENTS
