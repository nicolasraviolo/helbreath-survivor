# Guía del juego (`docs/guia/`)

Página para enseñar Helbreath Survivors a quien no lo ha visto nunca. Publicada como artifact privado:
**https://claude.ai/artifact/Dc93yohDxdW8bymFxW9iQZ** (se comparte desde su menú *Share*).

- `index.html`: la página (en español; los nombres del juego, en inglés).
- `img/*.jpg|png`: capturas del juego a 800×600.
- `img/sprites/*.png`: sprites sueltos con fondo transparente (`enemy-*`, `char-*`, `fx-*`, objetos) y textos con la fuente dibujada del original (`txt-*`).

Se actualiza en cada `/checkpoint` (paso 5 de `.claude/commands/checkpoint.md`).

## Republicar
1. Artifact `action: "read"` con la URL de arriba.
2. Artifact publish: `url` = la de arriba, `file_path` = `docs/guia/index.html`, y en `files` cada imagen nueva o cambiada: `{"img/sprites/enemy-x.png": "docs/guia/img/sprites/enemy-x.png"}`. Las que no se pasan se conservan.

## Sacar imágenes del juego (Playwright MCP)
Con el servidor de desarrollo en marcha (`survivors`, puerto 8090). Trampas conocidas:

- **Escalado de Windows (125 %)**: las capturas de Playwright salen ampliadas y recortadas. Pon la ventana a 1000×750 (queda 800×600 por dentro) y **no** uses `screenshot`: saca la imagen con `game.renderer.snapshot`.
- **Playwright va a ~2 FPS** (`requestAnimationFrame` frenado). Avanza el juego a mano con `game.step`:
  ```js
  window.__t = performance.now();
  window.__pump = (ms) => { for (let i = 0; i < Math.ceil(ms / 16.67); i++) { window.__t += 16.67; window.__game.step(window.__t, 16.67); } };
  ```
  Para pulsar una tecla: `keyboard.down` → `__pump(100)` → `keyboard.up` → `__pump(200)`.
- **La página se recarga cuando se escribe un archivo en el repo** (por ejemplo, el JSON que guarda Playwright). Haz toda la sesión de capturas en una sola llamada `browser_run_code_unsafe`, guarda los resultados en `window.__algo` y escríbelos a disco al final.
- **Las texturas ya no están en memoria** (los `ImageBitmap` se cierran tras subirlos a la GPU): `textures.getBase64` falla. Dibuja en un `RenderTexture` **nuevo por imagen** (redimensionarlo no cambia su tamaño real) y llama a `rt.render()` antes de `rt.snapshot`.
- **Fuente dibujada**: `SpriteText` se saca sin importar módulos (importarlo recarga la página): `game.scene.getScene('Hud').announce.constructor`.
- **Personajes**: el contenedor del jugador está dentro de otro; copia sus capas (`player.body.container.list`) a un contenedor nuevo antes de dibujarlo. `body.setPose('idleCombat', 3)` lo pone de frente.
- **Ir a cualquier momento**: `registry.set('chosenCharacter', 'warrior' | 'mage')` y `scene.start('Game')`; `player.godMode = true` (sin el tinte dorado de la tecla G); teclas de prueba `L`, `V`/`B`, `J`, `M`, `P`. Para la victoria: `getScene('Game').endRun(true)`.

Guardar: `browser_evaluate` con `filename: ".playwright-mcp/x.json"` devuelve `{nombre: base64}`; un script de Node lo convierte en archivos (`Buffer.from(b64, 'base64')`).
Hojas útiles: monstruo de frente = `enemy.<id>-3`, frame 0 (Fire Wyvern: `-11`); gemas `item.ground-15` frames 43–45; poción `item.ground-5`/1; cofre `item.ground-5`/120; imán `item.ground-15`/46.
