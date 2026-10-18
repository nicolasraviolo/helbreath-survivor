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
| 10 — Pulido (opcional) | ✅ completada (10A, 10B y 10C) | 2026-10-17 |
| 11 — Pulido de interfaz | ✅ completada | 2026-10-18 |
| 12 — Móvil sin pérdidas | ✅ completada (12A, 12B y 12C) | 2026-10-18 |
| 13 — Jefe final y equilibrio | ✅ completada (13A, 13B y 13C) | 2026-10-18 |

## Fase actual
**Para retomar (18-oct-2026): Fase 13 terminada** (fusionada en `master`, etiqueta `fase-13`). **Siguiente: Fase 14 (métricas y logros)**, ver `docs/PLAN-2.md`. Al empezarla, `/fase 14` cambia la versión del menú (`config/version.ts`) a "Phase 14" y hay que preguntar si se monta el servidor de métricas (cuenta gratuita de Cloudflare).
- **En marcha aparte:** sesión "Equilibrar Guerrero contra Mago". Hoy el Mago mata al Wyvern en ~1:50 y el Guerrero en ~5 min (`pnpm check levelpace` y `"play=warrior&debug=sim"`).
- **Equilibrio (13C):** curva en `data/leveling.ts` (4 niveles baratos y luego +24% por nivel), XP de monstruo = vida/5, jefes con `damageScale` y sin empuje (`data/enemies.ts`), Vit cura (`HP_REGEN_PER_VIT`, `data/stats.ts`). Medir siempre con la partida simulada antes de tocar números.
- **Monstruos por grupos (13B):** esenciales en `ESSENTIAL_ENEMIES` (`data/enemies.ts`), los de cada mapa en `localEnemies` y jefes en `bosses` (`data/maps.ts`). Detalle en el historial.
- **Pendiente (idea del propietario, sin fecha):** monstruos que aparecen al azar como evento especial.
- **Final de partida:** al morir el jefe final, mueren todos, toda la XP vuela sola y los niveles suben sin cartas; cae su cofre y al cogerlo se abre el portal (30 s). Atajos `?debug=finalboss` y `?debug=bosskill`.
- **Partidas guardadas:** `systems/SaveStore.ts` (formato con versión; ver NOTES.md, "Partidas guardadas"). Logros, récords y baúl (Fases 14, 19 y 21) irán en otras claves, reutilizando la idea.
- **App instalable:** solo en el build (`survivors/pwa/`); en `pnpm dev` no existe. Para probarla en el PC: `pnpm build` y `pnpm preview` → http://localhost:4173.
- **Controles:** todo control nuevo se explica en How to Play (`data/howToPlay.ts`), nunca en pantalla.
- **Settings:** lo que es sí/no va con casilla (`MenuList`, `checked`); volumen y opciones de varios valores, con flechas ◄ ►.
- **Assets propios** (los que no están en sp-client, como las voces de subir de nivel): `survivors/custom-assets/`, con la misma estructura de carpetas.
- **Ajustes posibles del temblor**, si el propietario los pide (`data/feedback.ts`): acortar la pausa entre explosiones críticas (2,5 s), contar cualquier crítico de la explosión, o añadir temblor a los críticos cuerpo a cuerpo.
- **Lo demás de la Fase 10 queda para la segunda etapa** (`docs/PLAN-2.md`, tabla "Traído de la Fase 10"):
  - vibración y reasignar controles → Fase 16;
  - sombras → Fase 19;
  - más mapas → Fases 19 y 22;
  - récords locales → Fase 19; progresión entre partidas → Fase 21;
  - límite de enemigos en el móvil → Fase 24, o antes si va lento;
  - equilibrio → Fase 13 y al cerrar cada fase de combate.

## Cómo probar
- Jugar: `pnpm --dir survivors dev` → http://localhost:8090
- Comprobación automática: `pnpm --dir survivors check [situaciones] [--mobile]` → escenas, FPS, estado de la partida, errores de consola y una captura pequeña en `survivors/.check/`. Situaciones: `menu`, `game`, `levelup`, `boss`, `finalboss`, `portal`, `stampede`, `horde`, `pickups`, `levelpace` (partida simulada muy deprisa: nivel por minuto, cuánto vive cada jefe y su golpe más fuerte; informe también en `.check/levelpace.json`) o atajos a mano (`"play=warrior&debug=str,levels"`). `--eval="g.enemies.alive"` escribe cualquier dato de la partida (g = escena Game); `--wait=5000` la deja correr más. Si la expresión devuelve una promesa, se espera (útil para vigilar unos segundos).
- Atajos en la dirección (solo en desarrollo, `src/config/debugStart.ts`): `?play`, `?play=warrior`, `?debug=boss,god` (acciones: horde, kill, levelup, levels, str, magic, pickups, minute, boss, finalboss, bosskill, stampede, god, resume = guardar y recargar como con Continue, sim = partida simulada), `?ui=compact` (interfaz de móvil), `?trees=off` (árboles, solo esa partida), `?open=howtoplay` (también settings, credits, select).
- Teclas de depuración en partida: F1 panel · G invencible · N enemigos · L niveles · J +1 minuto, entre otras (`systems/InputSystem.ts`).
- Datos de referencia de Helbreath: `docs/hb-wiki/` (índice en `README.md`).

**Historial de bloques y fases terminados:** `survivors/PROGRESS-historial.md` (más reciente arriba). Leer solo si hace falta un detalle concreto; buscar con grep en vez de leerlo entero.

## Problemas conocidos
- Con un solo Energy Bolt, 300 enemigos sobrepasan al jugador. Las cartas de stat ayudan, pero la progresión real llega con las armas de la Fase 6.
- El daño mágico crece rápido (+2 Mag por nivel y +4% por punto): el Mago es bastante más fuerte que el Guerrero contra los jefes. En revisión en otra sesión.
- Las flechas "→" de las cartas usan otra fuente: Comic Neue no tiene ese carácter. No molesta.
- El navegador interno de la app, si el panel está en segundo plano, va a ~1 FPS y parece congelado. Para revisar el juego, usar Playwright o tener el panel visible. A veces también le pasa a Playwright: `requestAnimationFrame` cae a 2 por segundo incluso sin el juego (visto el 16-oct-2026). No es un problema del juego.
- En el navegador interno, `sp-client` muestra errores `Cannot suspend/resume a closed AudioContext`. Son del audio en una pestaña en segundo plano y no afectan.
- Algunos enemigos se quedan atascados tras un obstáculo si el jugador está al otro lado (con Bleeding Isle pasa mucho menos). Sin búsqueda de caminos. Se recolocan si quedan lejos.
- El personaje se ve pequeño a 800×600 (tamaño original de Helbreath). Si se quiere, se ajusta el zoom de la cámara más adelante.

## Decisiones tomadas
- 2026-10-16 · Fuente de la interfaz: **Comic Neue**, copia libre (OFL) de Comic Sans MS, la letra de los diálogos del original. Va incluida en el juego (`@fontsource/comic-neue`, `config/ui.ts`) y se espera a que cargue antes de arrancar. Tamaño normal 15; en las cajas de la barra inferior, 12 (confirmado por el propietario). Los números de daño siguen en Georgia, como en sp-client, y los paneles de pruebas en monospace.
- 2026-10-16 · Idioma del juego: **solo inglés** (regla 9 de CLAUDE.md). Documentación y explicaciones siguen en español.
- 2026-10-16 · Las gemas de XP se dibujan por encima de enemigos y objetos, para que nunca queden tapadas.
- 2026-10-17 · Temblor de cámara: suave con cualquier golpe, fuerte con golpes de jefe, y en las explosiones grandes solo con crítico (como mucho una vez cada 2,5 s). Se puede quitar en Settings.
- 2026-10-18 · Ningún texto de controles en partida ni en menús: se explican en **How to Play**. Árboles grandes: On por defecto (desde la 12C, solo On/Off).
- 2026-10-18 · Settings: casillas para sí/no; volumen con flechas y número (se probaron barras y no gustaron). Large Trees solo On/Off. Fullscreen: icono arriba a la derecha del menú principal, casilla en Settings y opción en la Pausa.
- 2026-10-18 · Fase 13: el jefe final corta las oleadas y llama esbirros; al matarlo **mueren todos los monstruos**, el portal se abre **al coger su cofre** y la XP que quede en el suelo se pierde. **Dark Elf desactivado** (esqueletos en su lugar). Objetivo de equilibrio: 25–30 niveles por partida.
- 2026-10-18 · Monstruos por mapa: **esenciales** comunes a todos (Slime, Giant Ant, Snake, Orc, Mage-Orc, Zombie, Giant Scorpion, Skeleton, Clay Golem, Stone Golem, Giant Frog, de más débil a más fuerte), **propios del mapa** (más fuertes y menos; Bleeding Isle: Cyclops, Mountain Giant, Ogre, Cannibal Plant) y **jefes** (Ettin, Demon, Wyvern). Al morir el Wyvern, en el 13C: XP del suelo recogida sola y niveles sin cartas.
- 2026-10-18 · Equilibrio (13C): unos **24–27 niveles** por partida; ningún jefe mata en 1–2 golpes (como mucho ~30% de la vida del Mago); jefes sin empuje; al morir el Wyvern, XP sola y niveles sin cartas. Versión del juego en el pie del menú: de momento "Phase N".
- 2026-10-18 · Partidas guardadas: **hasta 3**; Continue abre la lista; con las 3 llenas, Play pide cuál borrar (con confirmación). El formato lleva versión para poder crecer.
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
- 2026-10-18 · Mapa cambiado a **Bleeding Isle** (`bisle`) para el MVP, por tener menos colisiones: zona de 150×150 desde (66,52), 95% libre (el propietario prefirió 150 a 100 o 200). huntzone2 queda comentado en `data/maps.ts` para la Fase 19 (varios mapas). Las partidas guardadas en huntzone2 continúan en Bleeding Isle.
