# Progreso

| Fase | Estado | Fecha |
|---|---|---|
| 0 — Reconocimiento | ✅ completada | 2026-10-16 |
| 1 — Esqueleto y primer sprite | ⬜ pendiente | |
| 2 — Mapa y jugador | ⬜ pendiente | |
| 3 — Enemigos | ⬜ pendiente | |
| 4 — Primera arma y combate | ⬜ pendiente | |
| 5 — Experiencia y subida de nivel | ⬜ pendiente | |
| 6 — Arsenal completo | ⬜ pendiente | |
| 7 — Oleadas, jefes y final | ⬜ pendiente | |
| 8 — Menús y personajes | ⬜ pendiente | |
| 9 — Web, móvil y publicación | ⬜ pendiente | |
| 10 — Pulido (opcional) | ⬜ pendiente | |

## Fase actual
Fase 0 completada (2026-10-16). Siguiente: `/fase 1`.
- Hecho (2026-10-16):
  - `sp-client` arranca en http://localhost:8080.
  - Documentación y código base resumidos en `NOTES.md` (formato `.spr`, frames por dirección, pivotes, capas del jugador, mapas, monstruos, hechizos).
  - Lista de archivos a portar por fase.
  - 17 mapas medidos y elegido huntzone2.
  - Añadido `.claude/launch.json` (servidor `sp-client`) para abrir la base en el navegador interno.
- Siguiente: Fase 1, esqueleto de `survivors/` y Orc animado.

## Problemas conocidos
- En el navegador interno, `sp-client` muestra errores `Cannot suspend/resume a closed AudioContext`. Son del audio en una pestaña en segundo plano y no afectan.
- huntzone2 tiene muros y río dentro de la zona de juego. Hay que vigilar que los enemigos no se atasquen (Fase 3).

## Decisiones tomadas
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
