# Guía de arranque (para ti, no para Claude)

Este kit convierte tu fork de `helbreath-base-game` en un proyecto preparado para trabajar con Claude Code de forma ordenada y ahorrando tokens.

## Qué contiene el kit
| Archivo | Para qué sirve |
|---|---|
| `CLAUDE.md` | Reglas cortas que Claude lee **siempre** al abrir el proyecto (corto a propósito para gastar pocos tokens) |
| `docs/PLAN.md` | Las 10 fases. Claude lo lee solo cuando empieza una fase |
| `docs/DESIGN.md` | Diseño del juego: personajes, armas, enemigos, oleadas. Puedes editarlo tú |
| `docs/SETUP.md` | Esta guía |
| `.claude/settings.json` | Prohíbe a Claude leer assets binarios, el servidor C# y otros archivos inútiles (ahorro de tokens) |
| `.claude/commands/` | Comandos propios: `/fase N`, `/checkpoint`, `/revisar`, `/nueva-skill` |
| `.mcp.json` | Conecta Claude Code a un navegador (Playwright) para que pruebe el juego él mismo |
| `survivors/PROGRESS.md` | Estado del proyecto, se actualiza en cada checkpoint |
| `survivors/.gitignore` | Evita subir a git dependencias, builds y copias de assets |

> Ojo: `.claude` y `.mcp.json` empiezan por punto, así que en Mac/Linux están ocultos. En Mac: `Cmd+Shift+.` en el Finder para verlos. En Windows: Explorador → Vista → Mostrar → Elementos ocultos.

## 1. Instalar herramientas (una sola vez)
1. Cuenta en https://github.com
2. Git: https://git-scm.com/downloads
3. Node.js LTS: https://nodejs.org
4. pnpm: en una terminal, `corepack enable` (si falla: `npm install -g pnpm`)
5. Claude Code (app de escritorio o terminal)

## 2. Fork y clonado
1. Entra en https://github.com/ErkoKnoll/helbreath-base-game y pulsa **Fork**.
2. En una terminal (ocupa ~600 MB):
   ```bash
   git clone https://github.com/TU_USUARIO/helbreath-base-game.git hb-survivors
   cd hb-survivors
   git remote add upstream https://github.com/ErkoKnoll/helbreath-base-game.git
   ```
   `upstream` sirve para traer en el futuro mejoras del autor original (`git fetch upstream`).
3. Comprueba que la base funciona:
   ```bash
   cd sp-client
   pnpm install
   pnpm dev
   ```
   Abre http://localhost:8080. Si ves Helbreath, perfecto. Ciérralo con `Ctrl+C` y vuelve con `cd ..`.

## 3. Instalar el kit
1. Descomprime el kit y copia **todo su contenido** (incluidos `.claude` y `.mcp.json`) en la carpeta `hb-survivors/`. Si te pregunta por fusionar carpetas, acepta.
2. Añade una línea al `.gitignore` de la raíz para que tus ajustes personales no se suban:
   ```bash
   echo ".claude/settings.local.json" >> .gitignore
   ```
3. Guarda el kit en git:
   ```bash
   git add -A
   git commit -m "chore: add Claude Code project kit"
   git push
   ```

## 4. Primera sesión de Claude Code
1. Abre Claude Code **en la carpeta `hb-survivors/`** (la raíz, no `sp-client`).
2. La primera vez te preguntará si aprobar el servidor MCP de `.mcp.json` (Playwright): acepta. Si más adelante necesita instalar un navegador, deja que lo haga.
3. Recomendado: instala el plugin de TypeScript para que Claude encuentre código sin leer archivos enteros. Primero, en una terminal normal: `npm install -g typescript-language-server typescript`. Luego, dentro de Claude Code:
   ```
   /plugin install typescript-lsp@claude-plugins-official
   ```
   Si dice que no encuentra el marketplace: `/plugin marketplace add anthropics/claude-plugins-official` y repite.
4. Comprueba que todo cargó con `/context` (verás CLAUDE.md en la memoria).
5. Empieza:
   ```
   /fase 0
   ```

## 5. Rutina de trabajo
```
/fase N            → Claude lee el plan, crea la rama y te propone un plan. Tú das el OK.
(trabajáis)        → pruebas en el navegador y describes lo que ves como jugador.
/revisar           → antes de cerrar, revisión de calidad. Eliges qué arreglar.
/checkpoint        → verifica, documenta, commit. Si dices que la fase está terminada, la fusiona y etiqueta.
/clear             → conversación limpia antes de la siguiente fase.
```
Si algo se rompe: *"vuelve al último commit que funcionaba"* o *"vuelve a la etiqueta fase-3"*.

## 6. Cómo gastar menos tokens
- **Una fase por conversación** y `/clear` entre fases. PROGRESS.md mantiene la memoria entre sesiones.
- **Plan antes que código**: `/fase` ya lo hace. También tienes el modo plan (Shift+Tab).
- **Modelo según la tarea** (`/model`): uno ligero (Sonnet) para cosas rutinarias como ajustar números, añadir un enemigo o cambiar textos; el más potente (Opus) para arquitectura, fases 1–3 y bugs difíciles.
- **Mensajes concretos**: "los orcos son demasiado rápidos, bájalos un 30%" es mejor que "algo va raro con los enemigos".
- **No pegues archivos enteros** en el chat; di el nombre y Claude lo abre.
- Si una conversación se alarga mucho: `/compact` o checkpoint + `/clear`.
- `/context` te muestra cuánto contexto llevas gastado.

## 7. Skills: cuándo crearlas
No hacen falta al principio. Cuando una tarea se repite y ya hay ejemplos reales, conviértela en skill con `/nueva-skill`:
- Tras la Fase 5 → `/nueva-skill añadir-mejora`
- Tras la Fase 6 → `/nueva-skill añadir-arma`
- Tras la Fase 7 → `/nueva-skill añadir-enemigo`

Una skill guarda la receta exacta de tu proyecto, y Claude solo la carga cuando la necesita.

## 8. Más adelante (opcional)
- **Despliegue automático** (Fase 9): conectar el repo a Cloudflare Pages para que cada `git push` publique la nueva versión.
- **Hooks**: que Claude compruebe los tipos automáticamente tras cada edición. Pídeselo cuando el proyecto ya exista: *"configura un hook que ejecute tsc tras editar archivos de survivors"*.
- **Comunidad**: el Discord del proyecto base (enlace en su README) es el sitio para dudas sobre los sprites.

## Enlaces
- Repo base: https://github.com/ErkoKnoll/helbreath-base-game · Demo: https://hbexplorer.helbreath.workers.dev/
- Documentación de Claude Code: https://code.claude.com/docs
- Phaser 3: https://docs.phaser.io
- Wiki de Helbreath: https://helbreath.fandom.com/wiki/Helbreath_Wiki
