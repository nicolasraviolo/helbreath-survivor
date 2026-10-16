# Progreso

| Fase | Estado | Fecha |
|---|---|---|
| 0 — Reconocimiento | ✅ completada | 2026-10-16 |
| 1 — Esqueleto y primer sprite | ✅ completada | 2026-10-16 |
| 2 — Mapa y jugador | ✅ completada | 2026-10-16 |
| 3 — Enemigos | 🟨 en pruebas | 2026-10-16 |
| 4 — Primera arma y combate | ⬜ pendiente | |
| 5 — Experiencia y subida de nivel | ⬜ pendiente | |
| 6 — Arsenal completo | ⬜ pendiente | |
| 7 — Oleadas, jefes y final | ⬜ pendiente | |
| 8 — Menús y personajes | ⬜ pendiente | |
| 9 — Web, móvil y publicación | ⬜ pendiente | |
| 10 — Pulido (opcional) | ⬜ pendiente | |

## Fase actual
Fase 3 programada y probada por el propietario (2026-10-16), en la rama `fase-3`. Pendiente: confirmar el cierre de la fase.
- Tras la prueba del propietario (2026-10-16): la G (invencible) no daba señales fuera del panel F1. Ahora el Guerrero se tiñe de dorado y aparece «INVENCIBLE (G)» arriba a la derecha.
- Hecho:
  - `Pool.ts` y `SpatialGrid.ts` genéricos. `collision.ts` compartido entre jugador y enemigos.
  - `Enemy.ts`: persigue, se orienta en 8 direcciones, lleva sombra como en el original, se desliza junto a los muros y tiene animación de muerte, cadáver y desvanecido.
  - `EnemySystem`: un pool por tipo, separación entre enemigos y contacto con el jugador.
  - `SpawnSystem`: aparición en un anillo fuera de la pantalla, cada vez más rápida (`data/spawn.ts`), y recolocación de los enemigos que quedan lejos.
  - Enemigos en `data/enemies.ts`: Slime, Bunny, Ant y Orc.
  - Jugador: 120 de vida, invulnerabilidad con parpadeo tras un golpe, barra de vida y animación de muerte. Game Over provisional con tiempo sobrevivido; Enter, A o clic reintentan.
  - Depuración: el panel F1 muestra enemigos, vida, tiempo y ritmo de aparición. Solo en desarrollo: N = 100 enemigos, K = matar los visibles, G = invencible (Guerrero dorado y aviso "INVENCIBLE (G)" arriba a la derecha).
  - Comprobado:
    - `tsc` y `build` sin errores;
    - 312 enemigos a ~138 FPS, con 0,14 ms de lógica;
    - K mata y los cadáveres vuelven al pool;
    - morir, Game Over y reintentar funcionan.
- Cómo probar: `pnpm --dir survivors dev` → http://localhost:8090 · F1 · G · N ×3 · K · dejarse matar → Enter/A/clic.
- Checkpoint 2026-10-16: `tsc` y `build` sin errores; Playwright carga el juego sin errores (solo falta `favicon.ico`).
- Siguiente: `/fase 4`, primera arma y combate.

## Problemas conocidos
- En el navegador interno, `sp-client` muestra errores `Cannot suspend/resume a closed AudioContext`. Son del audio en una pestaña en segundo plano y no afectan.
- `pnpm build` genera `dist/` sin assets (se resuelve en la Fase 9).
- Algunos enemigos se quedan esperando en la orilla del río si el jugador está al otro lado. Sin búsqueda de caminos. Se recolocan si quedan lejos.
- Falta `favicon.ico` (404 en consola, inofensivo; se añadirá en la Fase 9).
- El personaje se ve pequeño a 800×600 (tamaño original de Helbreath). Si se quiere, se ajusta el zoom de la cámara más adelante.

## Decisiones tomadas
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
