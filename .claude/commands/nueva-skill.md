---
description: Convertir una tarea repetida en una skill del proyecto (uso: /nueva-skill añadir-arma)
---
Quiero convertir la tarea **"$ARGUMENTS"** en una skill reutilizable para este proyecto.

1. Revisa cómo se ha hecho esta tarea hasta ahora en `survivors/` (mira 2–3 ejemplos reales, con un subagente si hace falta).
2. Escribe `.claude/skills/<nombre-en-kebab-case>/SKILL.md` con frontmatter `name` y `description`. La descripción debe empezar por las palabras que yo usaría al pedirlo (p. ej. "Añadir una nueva arma al juego...").
3. Contenido: pasos exactos, archivos a tocar en orden, un ejemplo mínimo copiado del código real, errores típicos a evitar y cómo verificar. Máximo ~150 líneas.
4. Enséñamelo antes de guardarlo y haz commit cuando lo apruebe.
