# Progreso

Índice corto. Al empezar una sesión: lee este archivo y **solo** el del juego en que se trabaja:
- **Survivors** → `PROGRESS-survivors.md`
- **Helbreath Off** (oculto tras `?off`) → `PROGRESS-off.md`

Sin leer enteros (grep): `CHECK.md` (situaciones del check y atajos), `PROGRESS-historial.md` (bloques hechos), `NOTES.md`, `docs/DECISIONES.md`.

## Estado
- **Helbreath Off:** Fase Off-13 ✅ (10-nov-2026, el estilo nuevo en el resto de ventanas), fusionada en `master`. 11-nov-2026: elegir monstruo con el stick derecho (sin probar con mando real). Siguiente: fase nueva por decidir (ver `PROGRESS-off.md`).
- **Survivors:** en pausa. Fase 30 ✅ (28-oct-2026). Siguiente: Fase 31, Aresden y Elvine.

**Fases completadas** (✅):
- Survivors: 0–30 (16 → 28-oct-2026), con 21½, 27½, 28½ y 28¾. Aplazados: 8 Arquero (→ 34), 21C, 22F y dos mapas de la 30.
- Helbreath Off: Off-0 a Off-13 (6 → 10-nov-2026). Aplazado: 11D.

## Reglas comunes
- Idioma del juego: **solo inglés** (regla 9 de CLAUDE.md).
- Fuente: **Comic Neue** (15; 12 en la barra inferior); las ventanas rediseñadas de Off (desde la Off-12), Alegreya y Alegreya Sans. Números de daño en Georgia. Con el propietario: "letra de títulos" = la caligráfica (`SpriteText` `'calligraphy'`), "letra de cartas" = `'title'`, "letra de texto" = Comic Neue.
- Controles: nunca en pantalla; se explican en **How to Play** (`data/howToPlay.ts`).
- Settings: sí/no con casilla (`MenuList`, `checked`); volumen y opciones de varios valores, con flechas ◄ ►.
- Sesiones en la nube (claude.ai/code): trabajan en otra copia; el propietario ve los cambios con `git pull` en su rama.
- El resto de decisiones, con fecha: `docs/DECISIONES.md` (grep por fase o tema).

## Cómo probar
- Jugar: `pnpm --dir survivors dev` → http://localhost:8090 (Off: http://localhost:8090/?off).
- Comprobar: `pnpm --dir survivors check <situaciones> [--mobile]` → escenas, FPS, estado, errores y captura en `survivors/.check/`. Opciones: `--eval="..."` (g = escena Game, o = escena de Off), `--wait=5000`, `--cards`. La lista de situaciones y atajos (`?play`, `?debug=...`, `?off=...`) está en `CHECK.md`: búscala con grep.
- Dificultad (Survivors): `pnpm --dir survivors balance` (~20 min).
- App instalable: solo en el build (`survivors/pwa/`). `pnpm build` y `pnpm preview` → http://localhost:4173.
- Visores (desarrollo): http://localhost:8090/sprites.html (todos los `.spr`; `#weapons`, `#item/Long%20Sword`, `#file/orc/4`) · http://localhost:8090/sounds.html (sonidos; `src/tools/soundViewer.ts`) · http://localhost:8090/maps.html.
- Datos de Helbreath: `docs/hb-wiki/` (índice en `README.md`).

## Problemas conocidos (comunes)
- Navegador interno en segundo plano: ~1 FPS, parece congelado; usar Playwright o el panel visible. A veces a Playwright también le cae `requestAnimationFrame` a 2/s. No es del juego.
- En el navegador interno, `sp-client` da `Cannot suspend/resume a closed AudioContext`. No afecta.
- La red del propietario bloquea a veces las IPs de Cloudflare (LaLiga): métricas sin abrir ni recibir partidas. Probar con datos móviles o más tarde.
