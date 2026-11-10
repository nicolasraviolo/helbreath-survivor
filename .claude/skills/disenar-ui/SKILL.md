---
name: disenar-ui
description: Diseñar, crear o arreglar interfaz del juego (ventanas, menús, HUD, inventario, tienda, equipo, tooltips, cartas, barras, botones táctiles) en Survivors o en Helbreath Off. Traduce las reglas generales de game-ui-design a nuestro juego (800×600, móvil en horizontal al 65 %, Phaser sin HTML, estilo de Off). Úsala cuando el propietario pida "haz la ventana X", "rediseña el inventario", "el texto no cabe", "en el móvil se ve mal", "mejora el HUD", "añade un tooltip" o cualquier cambio visual de UI.
---

# Diseñar UI del juego

Esta skill **adapta** `.claude/skills/game-ui-design/` (skill externa, Apache-2.0, no se edita) a nuestro proyecto.
- Al crear, consulta allí `references/patterns.md`; para explicar un riesgo, `references/sharp_edges.md`; para revisar, `references/validations.md`. Lee solo la sección que necesites (grep por `## `).
- **Si algo de allí choca con esta página o con `CLAUDE.md`, mandan estas.** No corrijas al propietario con reglas genéricas: tradúcelas primero con la tabla de abajo.

Antes de programar: lee `survivors/PROGRESS.md` y el PROGRESS del juego en que se trabaja. Presenta un **boceto corto** (qué hay, dónde, en qué orden se navega con teclado/mando) y espera el OK.

## 1. Qué ignorar de game-ui-design
- "HUD y menús en DOM/HTML": **no**. Aquí toda la UI va en escenas de Phaser (regla 7).
- Ejemplos de Unity, Godot y CSS (`CanvasScaler`, `Control`, `font-size:`): solo la idea, no el código.
- Márgenes de tele (overscan 5–10 %): no aplican; el juego se ve con franjas negras. Basta el margen de la tabla.
- Traducciones y textos localizados: el juego es **solo inglés** y no se monta sistema de idiomas (regla 9).
- Ajustes de accesibilidad nuevos (tamaño de letra, modo daltónico, quitar animaciones): proponerlos al propietario, no añadirlos por tu cuenta.

## 2. Traducción a nuestros píxeles
El juego se piensa en **800×600** (`config/gameConfig.ts`) y Phaser lo encaja (`Scale.FIT`). Para pasar una regla en píxeles reales a píxeles de juego, se divide entre la escala del peor caso:
- **PC:** portátil pequeño, 1366×768 → el juego se ve ×1,28. Dividir entre **1,28**.
- **Móvil en horizontal:** 844×390 (el `--mobile` del check) → ×0,65; iPhone SE 667×375 → ×0,62. Dividir entre **0,62**.

| Regla general | PC (píxeles de juego) | Móvil compacto (píxeles de juego) |
|---|---|---|
| Texto secundario ≥ 14 px reales | ≥ 11 | ≥ 18 |
| Texto normal 16–18 px reales | ≥ 13 (`UI_FONT_SIZE.normal` = 15) | ≥ 20 (`UI_FONT_SIZE.normal` en móvil) |
| Dato importante (vida, precio, daño) ≥ 24 px reales | ≥ 18 | ≥ 26 |
| Etiquetas en MAYÚSCULAS con espaciado | ≥ 10 se acepta (las mayúsculas se leen más grandes) | ≥ 16 |
| Zona de toque 44 pt (Apple) / 48 dp (Google) | — | ≥ **72×72** (mínimo 64) |
| Separación entre zonas de toque ≥ 8 | — | ≥ 12 |
| Margen al borde de la pantalla | ≥ 8 | ≥ 16 (muesca y dedos) |
| Contraste texto/fondo 4,5:1 (WCAG) | igual | igual |

- Las medidas que cambian en el móvil se escriben con `byDevice(pc, movil)` en `config/*.ts` o `data/*.ts`, nunca sueltas en la escena (regla 4).
- Si la imagen no puede crecer (arte original de tamaño fijo), agranda la **zona de toque** (`setInteractive(new Phaser.Geom.Rectangle(...), Phaser.Geom.Rectangle.Contains)`), no la imagen.
- **Helbreath Off no tiene móvil** (solo PC y mando): ahí no hace falta la columna de móvil, pero sí navegación completa con mando.

## 3. Reglas técnicas de nuestro proyecto
- **Nunca** uses `window.innerWidth`, `scale.width` ni píxeles CSS para colocar UI: todo en 800×600.
- **Nitidez** (`ui/renderScale.ts`, NOTES.md "Nitidez"): todo `Text` parte de `UI_TEXT` (Survivors) o de `offText` (Off), que llevan `resolution`. Un `add.text` sin ella sale borroso.
- Lo fijo en pantalla sobre una cámara con zoom de mundo va en una `ScreenLayer` (`addFixed`). `pointer.x` viene en píxeles del lienzo: pásalo con `toGame()`.
- **Off (Off-12):** colores, letras y medidas solo de `off/config/offTheme.ts` (`OFF_THEME_COLOR`, `OFF_THEME_INK`, `OFF_THEME_TEXT`, `OFF_THEME_SIZE`) y piezas de `off/ui/offUi.ts` (`offFrame`, `offButton`, `offTab`, `offCell`, `offStatRow`, `offBar`, `offPadBadge`, `offFitText`). Si falta una pieza, añádela a `offUi.ts` y al muestrario `?off=uikit` (`OffUiKitScene`). `offLayoutIssues(scene)` lista los textos que no cupieron.
- **Survivors:** reutiliza `ui/MenuList.ts`, `ui/statText.ts`, `ui/ThinGauge.ts` y `config/ui.ts`. La zona libre del HUD sale de `ui/hudLayout.ts` (`playAreaBottom`, `overlayBottom`). No tapes la pausa, el botón de pantalla completa ni los sticks (NOTES.md "Pantalla completa y consolas").
- Fuente dibujada de menús (`SpriteText`): sin "&".
- Una ventana encima de otra va en su propia escena, pausa la de debajo y le devuelve el foco al cerrar. Teclado, punteros, temporizadores y tweens se limpian en `SHUTDOWN`.

## 4. Patrones RPG que usamos
- **Comparar equipo:** valor nuevo y entre paréntesis el actual (`(now 12)`); verde = mejor, rojo = peor, siempre los mismos (`OFF_THEME_INK.good` / `bad`). Además del color, una flecha o signo (+/−) para daltónicos.
- **Requisito no cumplido:** celda en estado `unmet` y el requisito en rojo; nunca solo atenuado.
- **Esquiva y resistencias:** un % general, **nunca** contra un monstruo concreto (memoria del propietario).
- **Texto sobre el mapa** (daño, nombres, avisos): con contorno o sombra para leerse sobre cualquier suelo.
- **Peor caso:** prueba con el nombre más largo de `data/`, 9.999.999 de oro y el nivel máximo.

## 5. Antes de entregar
1. `pnpm --dir survivors exec tsc --noEmit`.
2. `pnpm --dir survivors check <situación>` en PC y, si es Survivors, también `--mobile`. Si la pantalla no tiene situación ni atajo `?open=`, añádelo (`config/debugStart.ts`, `scripts/check.mjs`, `CHECK.md`).
3. Mira **una** captura por tamaño: ventana centrada, márgenes iguales a cada lado, nada cortado, texto legible, selección visible.
4. En ventanas nuevas o rediseños grandes, lanza el agente **`revisor-ui`** y corrige lo que encuentre.
5. Da al propietario la URL exacta (`http://localhost:8090/?...`), qué teclas o botones probar y qué debería ver.
