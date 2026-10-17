# Helbreath Survivors

Demo web de un juego estilo *Vampire Survivors* usando los assets de Helbreath, construida sobre el fork de `helbreath-base-game` (Phaser 3 + TypeScript).

## Sobre el propietario
No sabe programar. Explica lo que haces en español sencillo, dile siempre **cómo probarlo** (comando exacto, URL, teclas, qué debería ver) y pide su OK antes de pasar a otra fase. Código e identificadores en inglés; explicaciones y comentarios de alto nivel en español. **El juego (todo lo que ve el jugador) está solo en inglés** de momento; ver regla 9.

## Mapa del repo
- `survivors/` → **nuestro juego**. Todo el trabajo nuevo va aquí.
- `sp-client/` → cliente Helbreath original. **Solo lectura**: referencia de código y fuente de assets (`sp-client/public/assets`).
- `sp-client/docs/` y `sp-client/.cursor/rules/` → documentación técnica del formato `.spr`, mapas `.amd`, animaciones, hechizos.
- `multiplayer/`, `tools/`, `reference/` → ignorar salvo que se pida.
- `docs/PLAN.md` → fases del proyecto. `docs/DESIGN.md` → diseño del juego (personajes, armas, enemigos, oleadas).
- `survivors/PROGRESS.md` → estado actual y cómo probar. **Léelo al empezar cada sesión.** El historial de lo ya hecho está en `PROGRESS-historial.md` (no leerlo entero; buscar con grep).

## Reglas
1. No modificar nada fuera de `survivors/`, `docs/` y `.claude/` sin permiso explícito.
2. Para reutilizar código de `sp-client`, **copiarlo** a `survivors/src/hb/` con cabecera: `// Ported from sp-client/<ruta> (MIT, Erko Knoll)`.
3. Todo asset se registra en `survivors/src/config/assetManifest.ts` con claves propias (`enemy.orc`, `fx.fireball`). Nunca rutas sueltas.
4. Balance y contenido viven en `survivors/src/data/*.ts`. La lógica no lleva números mágicos de diseño.
5. Pooling obligatorio para enemigos, proyectiles, gemas de XP y números de daño.
6. TypeScript estricto. Sin `any` salvo justificación en comentario.
7. Sin React en `survivors/`: UI con escenas de Phaser.
8. Assets de Helbreath = propiedad de terceros. Proyecto fan gratuito: nada de anuncios ni pagos.
9. Idioma del juego: **solo inglés** (decidido el 16-oct-2026). Textos en pantalla, nombres de stats, cartas, menús y créditos, en inglés. Más idiomas quizá en el futuro: no montar un sistema de traducciones hasta que se pida.

## Forma de trabajar
- **Un bloque por sesión** (`/fase N`). Antes de programar, presenta un plan corto y espera el OK. Al cerrar el bloque, `/checkpoint` y sesión nueva: las sesiones largas gastan muchísimos tokens.
- Para investigar `sp-client` usa un **subagente** y trae solo un resumen; no vuelques archivos grandes a la conversación.
- Cambios pequeños. Tras cada bloque: `pnpm --dir survivors exec tsc --noEmit` y corregir errores.
- **Comprobar el juego:** `pnpm --dir survivors check <situaciones> [--mobile]` (ver "Cómo probar" en PROGRESS.md). Da escenas, FPS, estado y errores de consola en texto, y guarda capturas pequeñas en `survivors/.check/`. Hazlo tú antes de pedir al propietario que pruebe.
  - Mira capturas solo cuando el cambio sea visual, y pocas: cada imagen se queda en la conversación y se relee en cada respuesta.
  - Para llegar a una situación usa los atajos `?play`, `?debug=...` y `?ui=compact` (`src/config/debugStart.ts`); si falta uno, añádelo ahí en vez de improvisar JavaScript en el navegador.
  - Playwright MCP a mano solo para lo que el script no cubra (interacciones, menús). No uses el navegador interno para el juego: en segundo plano va a ~1 FPS.
- Al cerrar un bloque: `/checkpoint` (ligero). Al cerrar una fase: `/checkpoint fase` (incluye la guía y la publicación).
- Si descubres algo no obvio de los assets o del código base, anótalo en `survivors/NOTES.md`.

## Comandos
- Juego: `cd survivors && pnpm dev` · build: `pnpm build` · tipos: `pnpm exec tsc --noEmit` · comprobar: `pnpm check`
- Base original: `cd sp-client && pnpm dev` → http://localhost:8080
