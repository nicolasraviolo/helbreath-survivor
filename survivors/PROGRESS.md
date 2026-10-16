# Progreso

| Fase | Estado | Fecha |
|---|---|---|
| 0 — Reconocimiento | ✅ completada | 2026-10-16 |
| 1 — Esqueleto y primer sprite | ✅ completada | 2026-10-16 |
| 2 — Mapa y jugador | ✅ completada | 2026-10-16 |
| 3 — Enemigos | ⬜ pendiente | |
| 4 — Primera arma y combate | ⬜ pendiente | |
| 5 — Experiencia y subida de nivel | ⬜ pendiente | |
| 6 — Arsenal completo | ⬜ pendiente | |
| 7 — Oleadas, jefes y final | ⬜ pendiente | |
| 8 — Menús y personajes | ⬜ pendiente | |
| 9 — Web, móvil y publicación | ⬜ pendiente | |
| 10 — Pulido (opcional) | ⬜ pendiente | |

## Fase actual
Fase 2 completada (2026-10-16), probada por el propietario con teclado, mando Xbox real y ratón. Siguiente: `/fase 3`.
- Hecho:
  - `HBMap.ts` lee el `.amd`. `mapAssets.ts` carga solo los paquetes de casillas que usa el mapa.
  - `mapRenderer.ts` pinta el suelo en una capa y los árboles con sombra, ordenados por Y. Los árboles se vuelven transparentes si tapan al jugador.
  - El Guerrero se dibuja por capas (`playerAppearance.ts`, `data/characters.ts`): quieto en guardia o corriendo, en 8 direcciones.
  - `InputSystem`: WASD/flechas, stick izquierdo con zona muerta, cruceta y ratón (mantener clic).
  - `Player`: choque con muros y agua, deslizándose en diagonal.
  - La cámara sigue al jugador, limitada a la zona de 100×100 casillas.
  - `DebugSystem`: F1 o botón View.
  - `GameScene` es la escena inicial; T abre la prueba del Orc y Esc vuelve.
  - Comprobado: `tsc` y `pnpm build` sin errores; consola limpia; ~140 FPS; choque con río y troncos; límites de la zona; mando simulado con inclinación parcial (velocidad 0,56, dirección SW).
- 2026-10-16, tras la primera prueba del propietario: el mando no respondía. Ahora se lee directamente de la Gamepad API, sin el plugin de Phaser. Además se añade el movimiento con ratón (mantener clic).
- Cómo probar: `pnpm --dir survivors dev` → http://localhost:8090 · WASD/flechas, mando (pulsa un botón primero) o mantener clic · F1/View depuración · T Orc / Esc volver.
- Checkpoint 2026-10-16: `tsc` y `build` sin errores; Playwright carga el juego sin errores (solo falta `favicon.ico`).
- Siguiente: `/fase 3`, enemigos.

## Problemas conocidos
- En el navegador interno, `sp-client` muestra errores `Cannot suspend/resume a closed AudioContext`. Son del audio en una pestaña en segundo plano y no afectan.
- `pnpm build` genera `dist/` sin assets (se resuelve en la Fase 9).
- huntzone2 tiene muros y río dentro de la zona de juego. Hay que vigilar que los enemigos no se atasquen (Fase 3).
- Falta `favicon.ico` (404 en consola, inofensivo; se añadirá en la Fase 9).
- El personaje se ve pequeño a 800×600 (tamaño original de Helbreath). Si se quiere, se ajusta el zoom de la cámara más adelante.
- `.playwright-mcp/` (capturas de Playwright) aparece sin seguimiento en la raíz. Hay que añadirlo al `.gitignore` raíz con permiso del propietario.

## Decisiones tomadas
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
