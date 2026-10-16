---
description: Revisión de calidad del código de survivors antes de cerrar una fase
---
Revisa el código de `survivors/` que ha cambiado en esta rama respecto a `master` (`git diff master...HEAD --stat` y luego los archivos relevantes). Usa un subagente si el diff es grande.

Dame una lista corta de hallazgos (máx. 10), ordenada por importancia:
- Rendimiento: objetos creados/destruidos en `update()`, falta de pooling, búsquedas O(n²) evitables, listeners sin limpiar.
- Reglas de CLAUDE.md: números de balance fuera de `src/data/`, rutas de assets fuera de `assetManifest.ts`, uso de `any`, código portado sin cabecera.
- Bugs probables: estado que no se reinicia al empezar otra partida, pausa/reanudar, escenas que no se destruyen.
- Código muerto o duplicado.

No cambies nada todavía: explícame cada punto en una línea sencilla y pregúntame cuáles arreglar.
