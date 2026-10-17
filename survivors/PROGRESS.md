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
| 10 — Pulido (opcional) | 🟡 en curso: 10A y 10B hechos y publicados; falta 10C | |

## Fase actual
**Para retomar (17-oct-2026): `/fase 10`, bloque 10C — sensación de impacto.** Es lo último de la Fase 10; al terminarlo, se cierra la fase.
- **Qué entra en 10C** (decidido por el propietario): **temblor de cámara** al recibir daño y con golpes muy fuertes, y **partículas de golpe** al impactar y al morir los monstruos. Detalle en `docs/PLAN.md` → Fase 10.
- **Lo demás de la Fase 10 queda para la segunda etapa** (`docs/PLAN-2.md`, tabla "Traído de la Fase 10"):
  - mando (vibración, iconos de Xbox, reasignar controles) → Fase 11;
  - sombras → Fase 14;
  - más mapas → Fases 14–15;
  - récords y progresión entre partidas → Fase 18;
  - límite de enemigos en el móvil → Fase 17 (o antes si va lento);
  - equilibrio → al cerrar cada fase de combate.
- **Publicado:** 10A y 10B están en `master` y en el enlace público (fusionados el 17-oct-2026, sin etiqueta: la fase sigue abierta). La rama `fase-10` sigue para 10C.
- `docs/PLAN-2.md` sigue siendo un borrador: el orden y las decisiones del final están pendientes de revisar con el propietario.

## Cómo probar
- Jugar: `pnpm --dir survivors dev` → http://localhost:8090
- Comprobación automática: `pnpm --dir survivors check [situaciones] [--mobile]` → escenas, FPS, estado de la partida, errores de consola y una captura pequeña en `survivors/.check/`. Situaciones: `menu`, `game`, `levelup`, `boss`, `horde`, `pickups` o atajos a mano (`"play=warrior&debug=str,levels"`). `--eval="g.enemies.alive"` escribe cualquier dato de la partida (g = escena Game); `--wait=5000` la deja correr más.
- Atajos en la dirección (solo en desarrollo, `src/config/debugStart.ts`): `?play`, `?play=warrior`, `?debug=boss,god` (acciones: horde, kill, levelup, levels, str, magic, pickups, minute, boss, god), `?ui=compact` (interfaz de móvil).
- Teclas de depuración en partida: F1 panel · G invencible · N enemigos · L niveles · J +1 minuto, entre otras (`systems/InputSystem.ts`).
- Datos de referencia de Helbreath: `docs/hb-wiki/` (índice en `README.md`).

**Historial de bloques y fases terminados:** `survivors/PROGRESS-historial.md` (más reciente arriba). Leer solo si hace falta un detalle concreto; buscar con grep en vez de leerlo entero.

## Problemas conocidos
- En el móvil todo se ve muy pequeño (letras, menús, cartas). Anotado para la Fase 10.
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
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
