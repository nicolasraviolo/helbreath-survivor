---
description: Empezar o continuar una fase del plan (uso: /fase 3)
---
Vamos a trabajar en la **Fase $ARGUMENTS**.

1. Lee `survivors/PROGRESS.md` y la sección de la Fase $ARGUMENTS en `docs/PLAN.md`. Lee `docs/DESIGN.md` solo si la fase toca contenido de juego. Si la fase necesita números de Helbreath (daños, vidas, requisitos), mira la tabla "Qué leer en cada fase" de `docs/hb-wiki/README.md` y lee solo las secciones que indique.
2. Si la fase anterior no está marcada como completada, avísame y para.
3. Comprueba con `git status` que no hay cambios sin guardar. Si los hay, pregúntame qué hacer.
4. Crea la rama `fase-$ARGUMENTS` (o cámbiate a ella si ya existe).
5. Si necesitas investigar código de `sp-client`, usa un subagente (`Explore`, o `model: "sonnet"` si es búsqueda mecánica) y tráeme solo el resumen. No leas `PROGRESS-historial.md` ni `NOTES.md` enteros: busca con grep la sección que necesites.
6. Preséntame un **plan corto** (máx. 10 puntos, en español sencillo) con los archivos que vas a crear o tocar y cómo lo probaré. **Espera mi OK antes de escribir código.**
7. Trabaja **un bloque por sesión**: al terminarlo, `/checkpoint` y que yo abra una sesión nueva para el siguiente.
