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
| 14 — Métricas y logros | 🔨 14A y 14B hechos; falta cerrar la fase (`/checkpoint fase`) | |

## Fase actual
**Para retomar (18-oct-2026): Fase 14 hecha (14A métricas y 14B logros)** en la rama `fase-14`. **Siguiente:** `/checkpoint fase` para cerrarla (fusionar en `master` y publicar: hasta entonces el juego publicado no envía métricas) y luego `/fase 15` (apuntado híbrido).
- **Métricas (14A):** servidor `metrics-server/` (Cloudflare Worker + D1). Gráficas en https://helbreath-survivors-metrics.nicolasraviolo.workers.dev, con clave (en `metrics-server/.dev.vars`). Qué se envía: `config/metrics.ts`; lo recoge `systems/RunMetrics.ts`. En `pnpm dev` solo con `?metrics=send`. Detalle y cómo añadir un dato: NOTES.md, "Métricas".
- **Logros (14B):** lista en `data/achievements.ts`, guardados en `systems/AchievementStore.ts` y vigilados por `systems/AchievementTracker.ts`. Para añadir uno basta con la lista (ver NOTES.md, "Logros"). Detalle en el historial.
- **Equilibrio (13C):** curva en `data/leveling.ts` (4 niveles baratos y luego +24% por nivel), XP de monstruo = vida/5, jefes con `damageScale` y sin empuje (`data/enemies.ts`), Vit cura (`HP_REGEN_PER_VIT`, `data/stats.ts`). Medir con la partida simulada y, desde la Fase 14, con las gráficas de métricas.
- **Monstruos por grupos (13B):** esenciales en `ESSENTIAL_ENEMIES` (`data/enemies.ts`), los de cada mapa en `localEnemies` y jefes en `bosses` (`data/maps.ts`). Detalle en el historial.
- **Pendiente (idea del propietario, sin fecha):** monstruos que aparecen al azar como evento especial.
- **Final de partida:** al morir el jefe final, mueren todos, toda la XP vuela sola y los niveles suben sin cartas; cae su cofre y al cogerlo se abre el portal (30 s). Atajos `?debug=finalboss` y `?debug=bosskill`.
- **Partidas guardadas:** `systems/SaveStore.ts` (formato con versión; ver NOTES.md, "Partidas guardadas"). Logros ya en su propia clave; récords y baúl (Fases 19 y 21) igual.
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
- Comprobación automática: `pnpm --dir survivors check [situaciones] [--mobile]` → escenas, FPS, estado de la partida, errores de consola y una captura pequeña en `survivors/.check/`. Situaciones: `menu`, `game`, `achievements` (con `--cards`: logros desde cero hasta nivel 21), `achievementlist` (pantalla con todos), `levelup`, `boss`, `finalboss`, `portal`, `stampede`, `horde`, `pickups`, `levelpace` (partida simulada muy deprisa: nivel por minuto, cuánto vive cada jefe y su golpe más fuerte; informe también en `.check/levelpace.json`) o atajos a mano (`"play=warrior&debug=str,levels"`). `--eval="g.enemies.alive"` escribe cualquier dato de la partida (g = escena Game); `--wait=5000` la deja correr más; `--cards` elige sola la primera carta de cada subida de nivel. Si la expresión devuelve una promesa, se espera (útil para vigilar unos segundos).
- Métricas: `?metrics=send` envía la partida al servidor de verdad (en desarrollo, si no, nunca se envía). Página de gráficas: ver "Para retomar".
- Atajos en la dirección (solo en desarrollo, `src/config/debugStart.ts`): `?play`, `?play=warrior`, `?debug=boss,god` (acciones: horde, kill, levelup, levels, str, magic, pickups, minute, boss, finalboss, bosskill, stampede, god, resume = guardar y recargar como con Continue, sim = partida simulada), `?ui=compact` (interfaz de móvil), `?trees=off` (árboles, solo esa partida), `?open=howtoplay` (también settings, credits, achievements, select), `?achievements=reset` (borra los logros; `all` los da todos).
- Teclas de depuración en partida: F1 panel · G invencible · N enemigos · L niveles · J +1 minuto, entre otras (`systems/InputSystem.ts`).
- Datos de referencia de Helbreath: `docs/hb-wiki/` (índice en `README.md`).

**Historial de bloques y fases terminados:** `survivors/PROGRESS-historial.md` (más reciente arriba). Leer solo si hace falta un detalle concreto; buscar con grep en vez de leerlo entero.

## Problemas conocidos
- Con un solo Energy Bolt, 300 enemigos sobrepasan al jugador. Las cartas de stat ayudan, pero la progresión real llega con las armas de la Fase 6.
- Guerrero frente a Mago, igualados en el 13C (18-oct-2026): Str y Mag dan +3% de daño por punto, el Mago gana +1 Int y +1 Mag por nivel, espadas ×1,5 y Energy Strike 8 por descarga (antes 14). Simulación: Wyvern en ~2:50 (Guerrero) y ~2:10 (Mago), nivel 24–27 los dos. La guía (`docs/guia`) aún dice "+2 Mag": se actualiza con `/guia`.
- La red del propietario bloquea a veces las IPs de Cloudflare (LaLiga): la página de métricas puede no abrir y sus partidas no llegar. Probar con datos móviles o más tarde.
- La partida simulada a veces no sirve: el jugador no alcanza a un jefe atascado y este vive hasta el final. Descartar esas partidas al medir. (Que el jefe final no llegara a salir por no encontrar hueco ya está corregido en `SpawnSystem.ts`.)
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
- 2026-10-18 · Métricas (14A): **activadas de serie** con aviso de que solo sirven para la dificultad; gráficas **solo con clave**; Cloudflare pese al bloqueo de LaLiga (si falla, en silencio). Se añadieron nivel por minuto, daño por monstruo, vida más baja, pociones, jefes y abandonos. Las cartas ofrecidas (no solo elegidas) quedan para más adelante.
- 2026-10-18 · Fase 14: **servidor de métricas sí** (Cloudflare, cuenta del propietario). Logros: primera tanda de 14 aprobada; "6 armas" cambiado por "Fully Armored" y "Eternal Field" por Bleeding Isle.
- 2026-10-18 · Partidas guardadas: **hasta 3**; Continue abre la lista; con las 3 llenas, Play pide cuál borrar (con confirmación). El formato lleva versión para poder crecer.
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
- 2026-10-18 · Mapa cambiado a **Bleeding Isle** (`bisle`) para el MVP, por tener menos colisiones: zona de 150×150 desde (66,52), 95% libre (el propietario prefirió 150 a 100 o 200). huntzone2 queda comentado en `data/maps.ts` para la Fase 19 (varios mapas). Las partidas guardadas en huntzone2 continúan en Bleeding Isle.
