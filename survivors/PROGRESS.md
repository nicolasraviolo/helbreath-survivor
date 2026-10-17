# Progreso

| Fase | Estado | Fecha |
|---|---|---|
| 0 — Reconocimiento | ✅ completada | 2026-10-16 |
| 1 — Esqueleto y primer sprite | ✅ completada | 2026-10-16 |
| 2 — Mapa y jugador | ✅ completada | 2026-10-16 |
| 3 — Enemigos | ✅ completada | 2026-10-16 |
| 4 — Primera arma y combate | ✅ completada | 2026-10-16 |
| 5 — Experiencia y subida de nivel | ✅ completada | 2026-10-16 |
| 6 — Arsenal completo | ✅ completada | 2026-10-16 |
| 7 — Oleadas, jefes y final | ✅ completada | 2026-10-17 |
| 8 — Menús y personajes | ✅ completada (solo menús; Arquero aplazado) | 2026-10-17 |
| 9 — Web, móvil y publicación | ✅ completada | 2026-10-17 |
| 10 — Pulido (opcional) | 🟡 bloques 10A, 10B y 10C hechos; falta cerrar la fase | |

## Fase actual
**Para retomar (17-oct-2026): 10C (temblor de cámara, partículas y sonidos de muerte y subida de nivel) está terminado en la rama `fase-10`.** Ya no quedan bloques en la Fase 10.
- **Siguiente paso:** que el propietario lo pruebe y, si da el OK, `/checkpoint fase` para cerrar la Fase 10: fusionar `fase-10` en `master`, poner la etiqueta y publicar. Quizá antes `/revisar`.
- **Pendiente de confirmar a oído:** el sonido de subida de nivel (E21). sp-client no tiene ninguno; si no gusta, se cambia en `config/assetManifest.ts` (`sfx.levelUp`).
- **Ajustes posibles del temblor**, si el propietario los pide (`data/feedback.ts`): acortar la pausa entre explosiones críticas (2,5 s), contar cualquier crítico de la explosión y no solo el golpe principal, o añadir temblor a los críticos cuerpo a cuerpo.
- **Lo demás de la Fase 10 queda para la segunda etapa** (`docs/PLAN-2.md`, tabla "Traído de la Fase 10"):
  - mando (vibración, iconos de Xbox, reasignar controles) → Fase 11;
  - sombras → Fase 14;
  - más mapas → Fases 14–15;
  - récords y progresión entre partidas → Fase 18;
  - límite de enemigos en el móvil → Fase 17, o antes si va lento;
  - equilibrio → al cerrar cada fase de combate.
- **Publicado:** 10A y 10B están en `master` y en el enlace público. 10C todavía no.
- `docs/PLAN-2.md` sigue siendo un borrador: el orden y las decisiones del final están pendientes de revisar con el propietario.

## Cómo probar
- Jugar: `pnpm --dir survivors dev` → http://localhost:8090
- Comprobación automática: `pnpm --dir survivors check [situaciones] [--mobile]` → escenas, FPS, estado de la partida, errores de consola y una captura pequeña en `survivors/.check/`. Situaciones: `menu`, `game`, `levelup`, `boss`, `horde`, `pickups` o atajos a mano (`"play=warrior&debug=str,levels"`). `--eval="g.enemies.alive"` escribe cualquier dato de la partida (g = escena Game); `--wait=5000` la deja correr más. Si la expresión devuelve una promesa, se espera (útil para vigilar unos segundos).
- Atajos en la dirección (solo en desarrollo, `src/config/debugStart.ts`): `?play`, `?play=warrior`, `?debug=boss,god` (acciones: horde, kill, levelup, levels, str, magic, pickups, minute, boss, god), `?ui=compact` (interfaz de móvil).
- Teclas de depuración en partida: F1 panel · G invencible · N enemigos · L niveles · J +1 minuto, entre otras (`systems/InputSystem.ts`).
- Datos de referencia de Helbreath: `docs/hb-wiki/` (índice en `README.md`).

**Historial de bloques y fases terminados:** `survivors/PROGRESS-historial.md` (más reciente arriba). Leer solo si hace falta un detalle concreto; buscar con grep en vez de leerlo entero.

## Problemas conocidos
- Con un solo Energy Bolt, 300 enemigos sobrepasan al jugador. Las cartas de stat ayudan, pero la progresión real llega con las armas de la Fase 6.
- El daño mágico crece rápido (+2 Mag por nivel y +4% por punto). Vigilarlo al equilibrar.
- Las flechas "→" de las cartas usan otra fuente: Comic Neue no tiene ese carácter. No molesta.
- El navegador interno de la app, si el panel está en segundo plano, va a ~1 FPS y parece congelado. Para revisar el juego, usar Playwright o tener el panel visible. A veces también le pasa a Playwright: `requestAnimationFrame` cae a 2 por segundo incluso sin el juego (visto el 16-oct-2026). No es un problema del juego.
- En el navegador interno, `sp-client` muestra errores `Cannot suspend/resume a closed AudioContext`. Son del audio en una pestaña en segundo plano y no afectan.
- Algunos enemigos se quedan esperando en la orilla del río si el jugador está al otro lado. Sin búsqueda de caminos. Se recolocan si quedan lejos.
- El personaje se ve pequeño a 800×600 (tamaño original de Helbreath). Si se quiere, se ajusta el zoom de la cámara más adelante.

## Decisiones tomadas
- 2026-10-16 · Fuente de la interfaz: **Comic Neue**, copia libre (OFL) de Comic Sans MS, la letra de los diálogos del original. Va incluida en el juego (`@fontsource/comic-neue`, `config/ui.ts`) y se espera a que cargue antes de arrancar. Tamaño normal 15; en las cajas de la barra inferior, 12 (confirmado por el propietario). Los números de daño siguen en Georgia, como en sp-client, y los paneles de pruebas en monospace.
- 2026-10-16 · Idioma del juego: **solo inglés** (regla 9 de CLAUDE.md). Documentación y explicaciones siguen en español.
- 2026-10-16 · Las gemas de XP se dibujan por encima de enemigos y objetos, para que nunca queden tapadas.
- 2026-10-17 · Temblor de cámara: suave con cualquier golpe, fuerte con golpes de jefe, y en las explosiones grandes solo con crítico (como mucho una vez cada 2,5 s). Se puede quitar en Settings.
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
