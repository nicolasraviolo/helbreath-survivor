# Progreso

**Fases completadas** (✅, bloques entre paréntesis):
- 16-oct-2026: 0 Reconocimiento · 1 Esqueleto y primer sprite · 2 Mapa y jugador · 3 Enemigos · 4 Primera arma y combate · 5 Experiencia y subida de nivel · 6 Arsenal completo.
- 17-oct-2026: 7 Oleadas, jefes y final · 8 Menús y personajes (solo menús; Arquero aplazado) · 9 Web, móvil y publicación · 10 Pulido (10A–10C).
- 18-oct-2026: 11 Pulido de interfaz · 12 Móvil sin pérdidas (12A–12C) · 13 Jefe final y equilibrio (13A–13C) · 14 Métricas y logros (14A–14B) · 15 Apuntado híbrido (15A–15C) · 16 Minimapa y tótems (16A–16B) · 17 Selección de personaje (17A–17B) · 18 Esquiva y resistencia mágica (18A–18B).
- 19-oct-2026: 19 Crits y habilidad activa (19A–19C).
- 🔄 **20 — Level y equipo:** en curso (20A y 20B hechos, 19-oct-2026).

## Fase actual
**Fase 20, bloques 20A y 20B hechos** en la rama `fase-20` (sin fusionar). **Siguiente:** `/fase 20` → **20C**: cartas de Power (stat temporal, Xelima y Merien +10% hasta 5 cartas), fuera las cartas de arma, armadura y Boots, y revisar logros ("Fully Armored"), métricas, cofres y partida simulada (`docs/PLAN-2.md`). Después **20D** (2 hechizos equipables del Mago).
- **Pendiente:** que el propietario pruebe con su mando real la vibración y el stick derecho (apuntar).
- **Ideas sin fecha:** monstruos al azar como evento especial; jefes más difíciles de esquivar (mínimo de acierto propio, nota en `data/defense.ts`).

**Pistas para trabajar** (detalle en `survivors/NOTES.md`):
- Level y Power: `data/characterLevel.ts`, `scenes/CharacterInfoScene.ts`. Ver NOTES.md, "Ventana Character y Level permanente".
- Equipo: `data/items.ts` (huecos, catálogo, requisitos), `scenes/EquipmentScene.ts`; en las cartas aún mandan `strRequired`/`required` (se van en el 20C). Ver NOTES.md, "Equipo y pantalla Equipment".
- Hechizos activos: `data/activeSpells.ts` (en el 20C, equipables); Meteor usa la esfera del crit hasta tener icono. Ver NOTES.md, "Meteor Strike".
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
- **Level** permanente (máx. 140): recibe **toda** la EXP de la partida, ganes o mueras. El nivel de la partida se llama **Power** en todos los textos.
- Puntos: 3 por Level, ninguno al crear; se reparten **solo** en la ventana Character ("Level Set." o C). En partida, C pausa y solo se mira.
- Esquiva y resistencia: siempre **% generales**, nunca contra un monstruo; esquiva sin "Miss", resistencia con "Resist".
- Una partida guardada por personaje (4 huecos).
- Equipo: catálogo libre hasta la Fase 21; requisitos del original con stats **permanentes** y Level.
- El resto de decisiones, con fecha: `docs/DECISIONES.md` (grep por fase o tema).

## Cómo probar
- Jugar: `pnpm --dir survivors dev` → http://localhost:8090
- Comprobar: `pnpm --dir survivors check [situaciones] [--mobile]` → escenas, FPS, estado, errores y captura en `survivors/.check/`. Situaciones: `menu`, `news` (What's new), `settings`, `controls`, `game`, `minimap`, `achievements` (con `--cards`: desde cero hasta nivel 21), `achievementlist`, `levelup`, `boss`, `finalboss`, `portal`, `stampede`, `horde`, `pickups`, `totems`, `slots` (dos personajes de ejemplo), `slotsempty`, `crit` (Guerrero con horda y crits infinitos; `--eval="g.launchCritStrike()"`), `charinfo` / `charinfogame` (ventana Character en menú / en partida), `equipment` (pantalla Equipment de Gorn), `charexp` (fin con EXP ×50: `--eval="g.endRun(false)"`), `levelpace` (partida simulada rápida: nivel por minuto, vida de cada jefe y su golpe más fuerte; informe en `.check/levelpace.json`) o atajos a mano (`"play=warrior&debug=str,levels"`).
- Opciones del check: `--eval="g.enemies.alive"` escribe cualquier dato (g = escena Game; si es una promesa, se espera); `--wait=5000` deja correr más; `--cards` elige la primera carta en cada subida.
- Atajos en la dirección (solo desarrollo, `src/config/debugStart.ts`):
  - `?play`, `?play=warrior`, `?ui=compact` (interfaz de móvil), `?trees=off`, `?metrics=send` (envía la partida de verdad).
  - `?debug=boss,god`; acciones: horde, kill, levelup, levels, str, magic, pickups, totems, minute, boss, finalboss, bosskill, stampede, god, crits (infinitos, tecla H), dodge (mejor armadura de la clase), stats (panel abierto), aim (apuntar a la derecha), aimstick (dedo falso en el stick, con `--mobile`), resume (guardar y recargar como Continue), sim (partida simulada), charexp (EXP ×50).
  - `?open=howtoplay` (también settings, controls, credits, achievements, select, slots, charinfo, equipment, releasenotes).
  - `?achievements=reset|all`; `?characters=reset|demo` (demo: dos de ejemplo, Gorn con 60.000 EXP; con `?play=warrior` juega Gorn).
- Teclas en partida: F1 panel · G invencible · N enemigos · L niveles · J +1 minuto, entre otras (`systems/InputSystem.ts`).
- App instalable: solo en el build (`survivors/pwa/`). `pnpm build` y `pnpm preview` → http://localhost:4173.
- Visor de sprites (desarrollo): http://localhost:8090/sprites.html → todos los `.spr` por categorías, animados, con armas y armaduras sobre el cuerpo. Enlaces: `#weapons`, `#item/Long%20Sword`, `#file/orc/4`.
- Datos de Helbreath: `docs/hb-wiki/` (índice en `README.md`). Historial de bloques: `survivors/PROGRESS-historial.md` (grep, no leer entero).

## Problemas conocidos
- La red del propietario bloquea a veces las IPs de Cloudflare (LaLiga): métricas sin abrir ni recibir partidas. Probar con datos móviles o más tarde.
- La partida simulada a veces falla: el jugador no alcanza a un jefe atascado y este vive hasta el final; descartarlas. Con el guerrero sale muy irregular (nivel 10–27 con el mismo código, 18-oct-2026), peor cuanto más deprisa (×400–500): repetir y usar la mediana.
- Las flechas "→" de las cartas salen en otra fuente (Comic Neue no la tiene). No molesta.
- How to Play, página Basics: la última línea (16B) pisa el selector "Page". Pendiente (acortar o juntar líneas).
- Navegador interno en segundo plano: ~1 FPS, parece congelado; usar Playwright o el panel visible. A veces a Playwright también le cae `requestAnimationFrame` a 2/s (16-oct-2026). No es del juego.
- En el navegador interno, `sp-client` da `Cannot suspend/resume a closed AudioContext` (audio en pestaña de fondo). No afecta.
- Enemigos atascados tras un obstáculo si el jugador está al otro lado (sin búsqueda de caminos; en Bleeding Isle pasa poco). Se recolocan si quedan lejos.
- A 800×600 el personaje se ve pequeño (tamaño original). Se puede ajustar el zoom de la cámara más adelante.
