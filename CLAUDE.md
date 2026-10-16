# Helbreath Survivors

Demo web de un juego estilo *Vampire Survivors* usando los assets de Helbreath, construida sobre el fork de `helbreath-base-game` (Phaser 3 + TypeScript).

## Sobre el propietario
No sabe programar. Explica lo que haces en español sencillo, dile siempre **cómo probarlo** (comando exacto, URL, teclas, qué debería ver) y pide su OK antes de pasar a otra fase. Código e identificadores en inglés; explicaciones y comentarios de alto nivel en español.

## Mapa del repo
- `survivors/` → **nuestro juego**. Todo el trabajo nuevo va aquí.
- `sp-client/` → cliente Helbreath original. **Solo lectura**: referencia de código y fuente de assets (`sp-client/public/assets`).
- `sp-client/docs/` y `sp-client/.cursor/rules/` → documentación técnica del formato `.spr`, mapas `.amd`, animaciones, hechizos.
- `multiplayer/`, `tools/`, `reference/` → ignorar salvo que se pida.
- `docs/PLAN.md` → fases del proyecto. `docs/DESIGN.md` → diseño del juego (personajes, armas, enemigos, oleadas).
- `survivors/PROGRESS.md` → estado actual. **Léelo al empezar cada sesión.**

## Reglas
1. No modificar nada fuera de `survivors/`, `docs/` y `.claude/` sin permiso explícito.
2. Para reutilizar código de `sp-client`, **copiarlo** a `survivors/src/hb/` con cabecera: `// Ported from sp-client/<ruta> (MIT, Erko Knoll)`.
3. Todo asset se registra en `survivors/src/config/assetManifest.ts` con claves propias (`enemy.orc`, `fx.fireball`). Nunca rutas sueltas.
4. Balance y contenido viven en `survivors/src/data/*.ts`. La lógica no lleva números mágicos de diseño.
5. Pooling obligatorio para enemigos, proyectiles, gemas de XP y números de daño.
6. TypeScript estricto. Sin `any` salvo justificación en comentario.
7. Sin React en `survivors/`: UI con escenas de Phaser.
8. Assets de Helbreath = propiedad de terceros. Proyecto fan gratuito: nada de anuncios ni pagos.

## Forma de trabajar
- Una fase por sesión (`/fase N`). Antes de programar, presenta un plan corto y espera el OK.
- Para investigar `sp-client` usa un **subagente** y trae solo un resumen; no vuelques archivos grandes a la conversación.
- Cambios pequeños. Tras cada bloque: `pnpm --dir survivors exec tsc --noEmit` y corregir errores.
- Si hay MCP de Playwright disponible, abre el juego, revisa la consola y haz capturas tú mismo antes de pedir al propietario que pruebe.
- Al cerrar una fase: `/checkpoint`.
- Si descubres algo no obvio de los assets o del código base, anótalo en `survivors/NOTES.md`.

## Comandos
- Juego: `cd survivors && pnpm dev` · build: `pnpm build` · tipos: `pnpm exec tsc --noEmit`
- Base original: `cd sp-client && pnpm dev` → http://localhost:8080
