# Progreso

**Fases completadas** (✅, bloques entre paréntesis):
- 16-oct-2026: 0 Reconocimiento · 1 Esqueleto y primer sprite · 2 Mapa y jugador · 3 Enemigos · 4 Primera arma y combate · 5 Experiencia y subida de nivel · 6 Arsenal completo.
- 17-oct-2026: 7 Oleadas, jefes y final · 8 Menús y personajes (solo menús; Arquero aplazado) · 9 Web, móvil y publicación · 10 Pulido (10A–10C).
- 18-oct-2026: 11 Pulido de interfaz · 12 Móvil sin pérdidas (12A–12C) · 13 Jefe final y equilibrio (13A–13C) · 14 Métricas y logros (14A–14B) · 15 Apuntado híbrido (15A–15C) · 16 Minimapa y tótems (16A–16B) · 17 Selección de personaje (17A–17B) · 18 Esquiva y resistencia mágica (18A–18B).
- 19-oct-2026: 19 Crits y habilidad activa (19A–19C) · 20 Level y equipo (20A–20D).

## Fase actual
**Fase 20 completada** y fusionada en `master` (etiqueta `fase-20`). Antes de la Fase 21, **ronda de bugs** del propietario: lista en `docs/BUGS.md` (marcar `[x]` al arreglar).
- **Bloque A (arreglos rápidos): hecho** (19-oct-2026). **Bloque B (combate): hecho** (20-oct-2026). **Bloque C: hecho** (20-oct-2026): M15, M2, M8, M17 y M13 (Settings en dos pestañas). Ronda de bugs terminada salvo los puntos para fases futuras.
- **Siguiente:** `/fase 21` → botín y baúl (`docs/PLAN-2.md`).
- **Pendiente de probar por el propietario:** cambiar de pestaña en partida y volver, sin sonidos trabados (B4; simulado en el check, no probado de verdad).
- **Pendiente:** que el propietario pruebe con su mando real la vibración y el stick derecho (apuntar).
- **Ideas sin fecha:** monstruos al azar como evento especial; jefes más difíciles de esquivar (mínimo de acierto propio, nota en `data/defense.ts`).

**Pistas para trabajar** (detalle en `survivors/NOTES.md`):
- Level y Power: `data/characterLevel.ts`, `scenes/CharacterInfoScene.ts`. Ver NOTES.md, "Ventana Character y Level permanente".
- Equipo sobre el cuerpo (ventana Character): `data/paperDoll.ts`, `entities/PaperDoll.ts`, `?gear=`. Ver NOTES.md, "Equipo sobre el cuerpo en la ventana Character (M17)".
- Settings: dos pestañas en `scenes/SettingsScene.ts` (`?open=settings&tab=gameplay`). Ver NOTES.md, "Pestañas de Settings (M13)".
- Pantalla de carga: `scenes/PreloadScene.ts`, `?loading=hold`, `check loading`. Ver NOTES.md, "Pantalla de carga (M8)".
- Élites: `data/elites.ts`, `?debug=elites`, `check elites`. Ver NOTES.md, "Monstruos élite (M2)".
- Estela del tajo: estilos en `data/slash.ts` (`?slash=N`, tecla Y). Ver NOTES.md, "Estela del tajo del guerrero".
- Equipo: `data/items.ts` (huecos, catálogo, requisitos), `scenes/EquipmentScene.ts`. Ver NOTES.md, "Equipo y pantalla Equipment".
- Cartas: stat o pasiva (Xelima, Merien, Magnet) en `systems/UpgradePool.ts` y `data/passives.ts`; `?debug=stones`. Ver NOTES.md, "Cartas de Power (Fase 20C)".
- Hechizos del Mago: automáticos (círculos 1–5) en `data/spells.ts`, activos (6–10, meteorito o ráfaga) en `data/activeSpells.ts`; huecos `spell1`/`spell2` en `data/items.ts`. Usan la esfera del crit hasta tener icono. Ver NOTES.md, "Hechizos equipables del Mago (Fase 20D)" y "Meteor Strike".
- Crit y mando: `systems/CritStrikeSystem.ts`, `systems/Rumble.ts`. Ver NOTES.md, "Critical Strike (Fase 19A)" y "Vibración del mando".
- Apuntado: todo pasa por `systems/Targeting.ts`. Ver NOTES.md, "Apuntado automático", "Apuntado manual" y "Stick de apuntar en el móvil".
- Esquiva y resistencia: `data/defense.ts`. Ver NOTES.md, "Esquiva física" y "Resistencia mágica".
- Guardado: personajes y partidas (una por personaje) en `CharacterStore`/`SaveStore`, cada cosa en su clave; récords y baúl irán igual. Ver NOTES.md, "Personajes guardados" y "Partidas guardadas".
- Equilibrio: `data/leveling.ts`, `data/enemies.ts`, `data/stats.ts`; medir con `check levelpace` y las métricas. Ver NOTES.md, "Partida simulada y equilibrio".
- Oleadas y monstruos por grupos: `data/enemies.ts`, `data/maps.ts`, `SpawnSystem`. Ver NOTES.md, "Monstruos de las oleadas".
- Logros: basta con añadirlo a `data/achievements.ts`. Ver NOTES.md, "Logros".
- Métricas: gráficas en https://helbreath-survivors-metrics.nicolasraviolo.workers.dev (clave en `metrics-server/.dev.vars`). Ver NOTES.md, "Métricas".
- Assets propios (no están en sp-client): `survivors/custom-assets/`, misma estructura. Temblor: `data/feedback.ts`. Ver NOTES.md, "Sensación de impacto".
- What's new: `data/releaseNotes.ts`; cada `/checkpoint` añade lo que nota el jugador.

## Reglas vigentes
- Idioma del juego: **solo inglés** (regla 9 de CLAUDE.md).
- Fuente: **Comic Neue** (15; 12 en la barra inferior). Números de daño en Georgia.
- Controles: nunca en pantalla; se explican en **How to Play** (`data/howToPlay.ts`).
- Settings: sí/no con casilla (`MenuList`, `checked`); volumen y opciones de varios valores, con flechas ◄ ►.
- **Level** permanente (máx. 140): recibe **toda** la EXP de la partida, ganes o mueras; si sales, espera guardada con la partida (M4). El nivel de la partida se llama **Power** en todos los textos.
- Puntos: 3 por Level, ninguno al crear; se reparten **solo** en la ventana Character ("Level Set." o C). En partida, C pausa y solo se mira.
- Esquiva y resistencia: siempre **% generales**, nunca contra un monstruo; esquiva sin "Miss", resistencia con "Resist".
- Una partida guardada por personaje (4 huecos).
- Equipo: catálogo libre hasta la Fase 21; requisitos del original con stats **permanentes** y Level (hechizos: solo Int). Al continuar una partida mandan el arma y los hechizos equipados ahora.
- El resto de decisiones, con fecha: `docs/DECISIONES.md` (grep por fase o tema).

## Cómo probar
- Jugar: `pnpm --dir survivors dev` → http://localhost:8090
- Comprobar: `pnpm --dir survivors check [situaciones] [--mobile]` → escenas, FPS, estado, errores y captura en `survivors/.check/`. Situaciones: `menu`, `loading` (pantalla de carga parada a la mitad), `news` (What's new), `settings`, `controls`, `game`, `minimap`, `achievements` (con `--cards`: desde cero hasta nivel 21), `achievementlist`, `levelup`, `boss`, `finalboss`, `portal`, `stampede`, `horde`, `elites` (todos los monstruos élite), `pickups`, `totems`, `slots` (dos personajes de ejemplo), `slotsempty`, `crit` (Guerrero con horda y crits infinitos; `--eval="g.launchCritStrike()"`), `charinfo` / `charinfogame` (ventana Character en menú / en partida), `equipment` (pantalla Equipment de Gorn), `equipmentmage` (la de Kaila, Int 86), `activespell` (Maga con horda y activo sin recarga; `--eval="g.launchCritStrike()"`), `charexp` (fin con EXP ×50: `--eval="g.endRun(false)"`), `levelpace` (partida simulada rápida: nivel por minuto, vida de cada jefe y su golpe más fuerte; informe en `.check/levelpace.json`) o atajos a mano (`"play=warrior&debug=str,levels"`).
- Opciones del check: `--eval="g.enemies.alive"` escribe cualquier dato (g = escena Game; si es una promesa, se espera); `--wait=5000` deja correr más; `--cards` elige la primera carta en cada subida.
- Atajos en la dirección (solo desarrollo, `src/config/debugStart.ts`):
  - `?play`, `?play=warrior`, `?ui=compact` (interfaz de móvil), `?trees=off`, `?metrics=send` (envía la partida de verdad).
  - `?debug=boss,god`; acciones: horde, kill, levelup, levels, str, magic, pickups, totems, minute, boss, finalboss, bosskill, stampede, god, crits (infinitos, tecla H; también el activo del Mago sin recarga), stones (cartas de Xelima, Merien y Magnet), dodge (mejor armadura de la clase), stats (panel abierto), aim (apuntar a la derecha), aimstick (dedo falso en el stick, con `--mobile`), resume (guardar y recargar como Continue), sim (partida simulada), charexp (EXP ×50), elites (todos élite).
  - `?loading=hold`: la pantalla de carga se para a la mitad.
  - `?gear=plateMail,helmet,...`: con `?characters=demo`, los de ejemplo llevan esos objetos sin mirar requisitos.
  - `?slash=N`: estilo de la estela del tajo (0–4, `data/slash.ts`); tecla Y para el siguiente.
  - `?open=howtoplay` (también settings, controls, credits, achievements, select, slots, charinfo, equipment, releasenotes); `?open=equipment&class=mage` abre la de la Maga.
  - `?spells=fireBall,meteorStrike`: hechizos del Mago en esa partida, sin requisitos.
  - `?achievements=reset|all`; `?characters=reset|demo` (demo: dos de ejemplo, Gorn con 60.000 EXP y Kaila Level 25 con Int 86; con `?play=warrior` juega Gorn).
- Teclas en partida: F1 panel · G invencible · N enemigos · L niveles · J +1 minuto, entre otras (`systems/InputSystem.ts`).
- App instalable: solo en el build (`survivors/pwa/`). `pnpm build` y `pnpm preview` → http://localhost:4173.
- Visor de sprites (desarrollo): http://localhost:8090/sprites.html → todos los `.spr` por categorías, animados, con armas y armaduras sobre el cuerpo. Enlaces: `#weapons`, `#item/Long%20Sword`, `#file/orc/4`.
- Datos de Helbreath: `docs/hb-wiki/` (índice en `README.md`). Historial de bloques: `survivors/PROGRESS-historial.md` (grep, no leer entero).

## Problemas conocidos
- Una vez (19-oct-2026), al **continuar** una partida, no salió ningún jefe (sin barra) y solo algunos monstruos; en otra partida, bien. No se reprodujo en local. Sospecha: descarga de sprites atascada (red con Cloudflare o caché). Si se repite: F1 → monstruos pendientes de descarga (`AssetStreamer`).
- La red del propietario bloquea a veces las IPs de Cloudflare (LaLiga): métricas sin abrir ni recibir partidas. Probar con datos móviles o más tarde.
- La partida simulada a veces falla: el jugador no alcanza a un jefe atascado y este vive hasta el final; descartarlas. Con el guerrero sale muy irregular (nivel 10–27 con el mismo código, 18-oct-2026), peor cuanto más deprisa (×400–500): repetir y usar la mediana.
- Las flechas "→" de las cartas salen en otra fuente (Comic Neue no la tiene). No molesta.
- How to Play, página Basics: la última línea (16B) pisa el selector "Page". Pendiente (acortar o juntar líneas).
- Navegador interno en segundo plano: ~1 FPS, parece congelado; usar Playwright o el panel visible. A veces a Playwright también le cae `requestAnimationFrame` a 2/s (16-oct-2026). No es del juego.
- En el navegador interno, `sp-client` da `Cannot suspend/resume a closed AudioContext` (audio en pestaña de fondo). No afecta.
- Enemigos atascados tras un obstáculo si el jugador está al otro lado (sin búsqueda de caminos; en Bleeding Isle pasa poco). Se recolocan si quedan lejos.
- A 800×600 el personaje se ve pequeño (tamaño original). Se puede ajustar el zoom de la cámara más adelante.
