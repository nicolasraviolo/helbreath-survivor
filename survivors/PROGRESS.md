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
| 14 — Métricas y logros | ✅ completada (14A y 14B) | 2026-10-18 |
| 15 — Apuntado híbrido | ✅ completada (15A, 15B y 15C) | 2026-10-18 |
| 16 — Minimapa y tótems | ✅ completada (16A y 16B) | 2026-10-18 |
| 17 — Selección de personaje | ✅ completada (17A y 17B) | 2026-10-18 |

## Fase actual
**Para retomar (18-oct-2026): Fase 17 completada** (fusionada en `master`, etiqueta `fase-17`). **Siguiente:** `/fase 18` → esquiva y resistencia mágica (nueva; ver `docs/PLAN-2.md`). Los crits van en la Fase 19 (botón táctil en `TOUCH_RESERVED_CORNER`).
- **Aspecto (17B):** en Create Character se eligen sexo (libre en las dos clases), piel, peinado, color de pelo (8) y ropa interior; sale al azar al abrir. Se guarda en `SavedCharacter.look`. Datos en `data/appearance.ts`; la ropa se cambia por la del otro sexo con `gearForGender`; las piezas nuevas se descargan bajo demanda (`systems/LookLoader.ts`); el pelo se tiñe sumando color (`hb/additiveTint.ts`). Detalle en NOTES.md, "Aspecto del personaje (Fase 17B)".
- **Personajes (17A):** Play y Continue abren "Select Character" (`scenes/CharacterSlotsScene.ts`): 4 huecos del original con el personaje caminando, su nombre y su mejor nivel. Un hueco vacío abre Create Character, donde ya se escribe el nombre. Guardado en `systems/CharacterStore.ts`. **Una partida a medias por personaje**: elegirlo la continúa, también desde Play. Detalle en NOTES.md, "Personajes guardados (Fase 17A)".
- **Minimapa y tótems (16):** `ui/Minimap.ts` y `systems/TotemSystem.ts` (números en `data/minimap.ts` y `data/totems.ts`). Los cofres dan una carta gratis. Ver NOTES.md.
- **Ajuste de oleadas (18-oct-2026, antes de la Fase 16):** un monstruo nuevo cada ~minuto (los débiles siguen saliendo poco, por variedad), tope de vivos 100→260, **con un jefe vivo no sale nadie de las oleadas** (`SpawnSystem`), monstruos normales con vida y XP ×2 y daño ×1,4 (jefes igual que antes). Simulación: 900–1.400 muertes por partida (antes 2.400–3.300), ~8% mueren de un golpe (antes 15–21%), nivel 25–26, Ettin ~30–65 s, Wyvern ~2:15–2:55. La partida simulada ahora da también `aliveByMinute` y `oneHitKillShare`.
- **Apuntado:** todo pasa por `systems/Targeting.ts`. Automático (15A): un jefe a menos de 250 px y al alcance va primero, y sus proyectiles atraviesan a los demás. Manual (15B): `InputSystem.getManualAim()` → `WeaponSystem.setManualAim`; números en `data/targeting.ts` (`MANUAL_AIM`). Móvil (15C): con la casilla **Aim Stick** (Settings, activada de serie) la mitad izquierda mueve y la derecha abre un segundo stick naranja que apunta; la esquina de abajo a la derecha queda libre para el botón del crit (Fase 19). Detalle en NOTES.md, "Apuntado automático", "Apuntado manual" y "Stick de apuntar en el móvil". El stick derecho del mando aún no se ha probado con un mando real.
- **Métricas (14A):** servidor `metrics-server/` (Cloudflare Worker + D1). Gráficas en https://helbreath-survivors-metrics.nicolasraviolo.workers.dev, con clave (en `metrics-server/.dev.vars`). Qué se envía: `config/metrics.ts`; lo recoge `systems/RunMetrics.ts`. En `pnpm dev` solo con `?metrics=send`. Detalle y cómo añadir un dato: NOTES.md, "Métricas".
- **Logros (14B):** lista en `data/achievements.ts`, guardados en `systems/AchievementStore.ts` y vigilados por `systems/AchievementTracker.ts`. Para añadir uno basta con la lista (ver NOTES.md, "Logros"). Detalle en el historial.
- **Equilibrio (13C):** curva en `data/leveling.ts` (4 niveles baratos y luego +24% por nivel), XP de monstruo = vida/5, jefes con `damageScale` y sin empuje (`data/enemies.ts`), Vit cura (`HP_REGEN_PER_VIT`, `data/stats.ts`). Medir con la partida simulada y, desde la Fase 14, con las gráficas de métricas.
- **Monstruos por grupos (13B):** esenciales en `ESSENTIAL_ENEMIES` (`data/enemies.ts`), los de cada mapa en `localEnemies` y jefes en `bosses` (`data/maps.ts`). Detalle en el historial.
- **Pendiente (idea del propietario, sin fecha):** monstruos que aparecen al azar como evento especial.
- **Final de partida:** al morir el jefe final, mueren todos, toda la XP vuela sola y los niveles suben sin cartas; cae su cofre y al cogerlo se abre el portal (30 s). Atajos `?debug=finalboss` y `?debug=bosskill`.
- **Partidas guardadas:** `systems/SaveStore.ts` (formato con versión; ver NOTES.md, "Partidas guardadas"). Desde la 17A, una por personaje, en el mismo número de hueco. Logros y personajes van en sus propias claves; récords y baúl (Fases 21 y 23) irán igual.
- **App instalable:** solo en el build (`survivors/pwa/`); en `pnpm dev` no existe. Para probarla en el PC: `pnpm build` y `pnpm preview` → http://localhost:4173.
- **Controles:** todo control nuevo se explica en How to Play (`data/howToPlay.ts`), nunca en pantalla.
- **Settings:** lo que es sí/no va con casilla (`MenuList`, `checked`); volumen y opciones de varios valores, con flechas ◄ ►.
- **Assets propios** (los que no están en sp-client, como las voces de subir de nivel): `survivors/custom-assets/`, con la misma estructura de carpetas.
- **Ajustes posibles del temblor**, si el propietario los pide (`data/feedback.ts`): acortar la pausa entre explosiones críticas (2,5 s), contar cualquier crítico de la explosión, o añadir temblor a los críticos cuerpo a cuerpo.
- **Lo demás de la Fase 10 queda para la segunda etapa** (`docs/PLAN-2.md`, tabla "Traído de la Fase 10"):
  - vibración y reasignar controles → Fase 19;
  - sombras → Fase 21;
  - más mapas → Fases 21 y 24;
  - récords locales → Fase 21; progresión entre partidas → Fase 23;
  - límite de enemigos en el móvil → Fase 26, o antes si va lento;
  - equilibrio → Fase 13 y al cerrar cada fase de combate.

## Cómo probar
- Jugar: `pnpm --dir survivors dev` → http://localhost:8090
- Comprobación automática: `pnpm --dir survivors check [situaciones] [--mobile]` → escenas, FPS, estado de la partida, errores de consola y una captura pequeña en `survivors/.check/`. Situaciones: `menu`, `game`, `minimap`, `achievements` (con `--cards`: logros desde cero hasta nivel 21), `achievementlist` (pantalla con todos), `levelup`, `boss`, `finalboss`, `portal`, `stampede`, `horde`, `pickups`, `totems`, `slots` (los 4 huecos con dos personajes de ejemplo), `slotsempty`, `levelpace` (partida simulada muy deprisa: nivel por minuto, cuánto vive cada jefe y su golpe más fuerte; informe también en `.check/levelpace.json`) o atajos a mano (`"play=warrior&debug=str,levels"`). `--eval="g.enemies.alive"` escribe cualquier dato de la partida (g = escena Game); `--wait=5000` la deja correr más; `--cards` elige sola la primera carta de cada subida de nivel. Si la expresión devuelve una promesa, se espera (útil para vigilar unos segundos).
- Métricas: `?metrics=send` envía la partida al servidor de verdad (en desarrollo, si no, nunca se envía). Página de gráficas: ver "Para retomar".
- Atajos en la dirección (solo en desarrollo, `src/config/debugStart.ts`): `?play`, `?play=warrior`, `?debug=boss,god` (acciones: horde, kill, levelup, levels, str, magic, pickups, totems, minute, boss, finalboss, bosskill, stampede, god, aim = apuntar a mano a la derecha, aimstick = dedo de mentira en el stick de apuntar (con `--mobile`), resume = guardar y recargar como con Continue, sim = partida simulada), `?ui=compact` (interfaz de móvil), `?trees=off` (árboles, solo esa partida), `?open=howtoplay` (también settings, credits, achievements, select, slots), `?achievements=reset` (borra los logros; `all` los da todos), `?characters=reset` (borra personajes y sus partidas; `demo` deja dos de ejemplo).
- Teclas de depuración en partida: F1 panel · G invencible · N enemigos · L niveles · J +1 minuto, entre otras (`systems/InputSystem.ts`).
- Datos de referencia de Helbreath: `docs/hb-wiki/` (índice en `README.md`).
- **Visor de sprites** (solo en desarrollo): con `pnpm dev`, http://localhost:8090/sprites.html → todos los `.spr` por categorías (armas, armaduras, objetos, hechizos, monstruos, personajes, todos los archivos) con su nombre real. Al pinchar uno se ve animado, con pose, dirección, velocidad, zoom y fondo; las armas y armaduras, encima del cuerpo del personaje. Enlaces directos: `#weapons`, `#item/Long%20Sword`, `#file/orc/4`.

**Historial de bloques y fases terminados:** `survivors/PROGRESS-historial.md` (más reciente arriba). Leer solo si hace falta un detalle concreto; buscar con grep en vez de leerlo entero.

## Problemas conocidos
- Con un solo Energy Bolt, 300 enemigos sobrepasan al jugador. Las cartas de stat ayudan, pero la progresión real llega con las armas de la Fase 6.
- Guerrero frente a Mago, igualados en el 13C (18-oct-2026): Str y Mag dan +3% de daño por punto, el Mago gana +1 Int y +1 Mag por nivel, espadas ×1,5 y Energy Strike 8 por descarga (antes 14). Simulación: Wyvern en ~2:50 (Guerrero) y ~2:10 (Mago), nivel 24–27 los dos. La guía (`docs/guia`) aún dice "+2 Mag": se actualiza con `/guia`.
- La red del propietario bloquea a veces las IPs de Cloudflare (LaLiga): la página de métricas puede no abrir y sus partidas no llegar. Probar con datos móviles o más tarde.
- La partida simulada a veces no sirve: el jugador no alcanza a un jefe atascado y este vive hasta el final. Descartar esas partidas al medir. (Que el jefe final no llegara a salir por no encontrar hueco ya está corregido en `SpawnSystem.ts`.)
- Las flechas "→" de las cartas usan otra fuente: Comic Neue no tiene ese carácter. No molesta.
- How to Play, página Basics: la última línea (añadida en la 16B) pisa el selector "Page". Pendiente de arreglar (acortar textos o juntar líneas).
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
- 2026-10-18 · Fase 15: clic **izquierdo mueve y derecho apunta**; solo los **jefes** roban el objetivo automático, a **~250 px**; el apuntado manual manda siempre. Los proyectiles dirigidos a un jefe atraviesan a los demás monstruos (añadido en el 15A al ver que, si no, no le llegaba el daño).
- 2026-10-18 · Oleadas: menos monstruos y más duros, como el original; tipos nuevos repartidos (~1 por minuto) sin quitar los débiles; **mientras hay un jefe vivo no salen monstruos de las oleadas** (los eventos sí).
- 2026-10-18 · Fase 15C: el móvil también tendrá apuntado manual con un **segundo stick en la mitad derecha** de la pantalla, con casilla en Settings **activada de serie** (cambia lo de "móvil solo automático" del plan).
- 2026-10-18 · Fase 16: minimapa **arriba a la derecha**, solo jugador, jefes y tótems (NPCs en otros mapas). Tótems que **aparecen cada cierto tiempo** con sonido; efectos Berserk, Defense Shield, Full HP y Freeze (5 s). **Tótems = buffs, cofres = carta de mejora** (equipo en la Fase 23). Tótems: uno cada ~75 s, máx. 2, duran 60 s; se cogen pisando cualquier casilla que tape su dibujo (mín. 2×2).
- 2026-10-18 · Partidas guardadas: hasta 3, con Continue abriendo la lista (Fase 12). **Cambiado en la 17A:** una partida por personaje; Continue abre los 4 huecos (solo se eligen los que tienen partida) y elegir un personaje con partida la continúa, también desde Play. La pantalla de "qué partida borrar" desapareció.
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
- 2026-10-18 · Mapa cambiado a **Bleeding Isle** (`bisle`) para el MVP, por tener menos colisiones: zona de 150×150 desde (66,52), 95% libre (el propietario prefirió 150 a 100 o 200). huntzone2 queda comentado en `data/maps.ts` para la Fase 21 (varios mapas). Las partidas guardadas en huntzone2 continúan en Bleeding Isle.
- 2026-10-18 · Fase 17: Play lleva a los **4 huecos del original** (Select Character); hueco vacío → Create Character; se elige **clase** (no reparto de puntos). Debajo de cada personaje, su **mejor nivel**. Sexo y aspecto, en el 17B. Las partidas antiguas sin personaje se convierten en un personaje con el nombre de su clase.
- 2026-10-18 · Fase 17B: **sexo libre** en las dos clases (el Mago hombre empieza con camisa y pantalón), aspecto **al azar** al abrir Create Character y **8 colores de pelo** de los 16 del original (rubio, castaño, rojo, verde, azul, morado, verde azulado y negro; dos cambiados al verlos en pantalla). Con casco no se ve el pelo, como en el original. Personajes anteriores: su aspecto de antes, con pelo negro.
- 2026-10-18 · Nueva **Fase 18: esquiva y resistencia mágica** (el guerrero recibe todos los golpes y no pasa del Ettin; los hechizos siempre dañan). Crits, Zem y el resto corren una fase (18→19 ... 26→27). Detalle en `docs/PLAN-2.md`.
