---
description: Empezar o continuar una fase del plan (uso: /fase 3)
---
Vamos a trabajar en la **Fase $ARGUMENTS**.

1. Lee `survivors/PROGRESS.md` y la sección de la Fase $ARGUMENTS: en `docs/PLAN.md` para las Fases 0–10 y en `docs/PLAN-2.md` de la 11 en adelante (en ese caso, mira también sus apartados "Cosas que afectan a varias fases" y "Decisiones que necesito de ti", y pregúntame las decisiones pendientes de esa fase antes del plan). Lee `docs/DESIGN.md` solo si la fase toca contenido de juego. Si la fase necesita números de Helbreath (daños, vidas, requisitos), mira la tabla "Qué leer en cada fase" de `docs/hb-wiki/README.md` y lee solo las secciones que indique.
2. Si la fase anterior no está marcada como completada, avísame y para.
3. Comprueba con `git status` que no hay cambios sin guardar. Si los hay, pregúntame qué hacer.
4. Crea la rama `fase-$ARGUMENTS` (o cámbiate a ella si ya existe). Si es una fase nueva, cambia `GAME_VERSION` en `survivors/src/config/version.ts` a `Phase N` (se ve en el pie del menú principal).
5. Si necesitas investigar código de `sp-client`, usa un subagente (`Explore`, o `model: "sonnet"` si es búsqueda mecánica) y tráeme solo el resumen. No leas `PROGRESS-historial.md` ni `NOTES.md` enteros: busca con grep la sección que necesites.
6. Preséntame un **plan corto** (máx. 10 puntos, en español sencillo) con los archivos que vas a crear o tocar y cómo lo probaré. **Espera mi OK antes de escribir código.**
   - El plan va **escrito en el mensaje, entero**, siempre: también después de las preguntas de decisiones pendientes (en cuanto respondo, el siguiente mensaje es el plan). Nunca lo des por presentado solo con el resumen de la caja de "siguiente paso" ni con la lista de tareas: el resumen no sirve para leerlo.
   - Incluye las decisiones que tomé en las preguntas, para que se vea cómo encajan en el plan.
7. Trabaja **un bloque por sesión**: al terminarlo, `/checkpoint` y que yo abra una sesión nueva para el siguiente.
