# Progreso

| Fase | Estado | Fecha |
|---|---|---|
| 0 — Reconocimiento | ✅ completada | 2026-10-16 |
| 1 — Esqueleto y primer sprite | 🟡 en curso | 2026-10-16 |
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
Fase 1 (rama `fase-1`), pendiente de que el propietario la pruebe.
- Hecho (2026-10-16):
  - Proyecto `survivors/` (Vite 6 + TS estricto + Phaser 3.90, sin React), en el puerto 8090.
  - Assets servidos desde `sp-client/public`.
  - Portado `HBSprite.ts`, con pivotes nativos de Phaser.
  - `HBAsset` reproduce animación + dirección.
  - `assetManifest.ts` (`enemy.orc`), `data/enemies.ts`, escenas Boot → Preload (barra de carga) → SpriteTest.
  - Comprobado: `tsc` y `pnpm build` sin errores; consola limpia; Orc correcto en 8 direcciones y 5 animaciones (idle, move, attack, takeDamage, dead).
- Cómo probar: `pnpm --dir survivors dev` → http://localhost:8090 · ← → girar · ↑ ↓ animación · Espacio pausa.
- Siguiente: Fase 2, mapa huntzone2 + jugador + mando.

## Problemas conocidos
- En el navegador interno, `sp-client` muestra errores `Cannot suspend/resume a closed AudioContext`. Son del audio en una pestaña en segundo plano y no afectan.
- `pnpm build` genera `dist/` sin assets (se resuelve en la Fase 9).
- huntzone2 tiene muros y río dentro de la zona de juego. Hay que vigilar que los enemigos no se atasquen (Fase 3).

## Decisiones tomadas
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
