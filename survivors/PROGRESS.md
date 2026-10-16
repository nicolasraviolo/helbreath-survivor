# Progreso

| Fase | Estado | Fecha |
|---|---|---|
| 0 — Reconocimiento | ✅ completada | 2026-10-16 |
| 1 — Esqueleto y primer sprite | ✅ completada | 2026-10-16 |
| 2 — Mapa y jugador | ✅ completada | 2026-10-16 |
| 3 — Enemigos | ✅ completada | 2026-10-16 |
| 4 — Primera arma y combate | ✅ completada | 2026-10-16 |
| 5 — Experiencia y subida de nivel | ✅ completada | 2026-10-16 |
| 6 — Arsenal completo | 🟡 en curso (6A y 6B probados; falta 6C) | |
| 7 — Oleadas, jefes y final | ⬜ pendiente | |
| 8 — Menús y personajes | ⬜ pendiente | |
| 9 — Web, móvil y publicación | ⬜ pendiente | |
| 10 — Pulido (opcional) | ⬜ pendiente | |

## Fase actual
**Fase 6, bloque 6B: arsenal de la Maga** (2026-10-16, rama `fase-6`; probado y aprobado por el propietario). Siguiente: bloque **6C** (poción, imán, cofre con buff aleatorio, Botas y Amuleto imán).
- **Un solo hechizo "en la mano"**, como el arma del Guerrero (`data/spells.ts`, números propios, requisito de Int):
  - **Energy:** Energy Bolt (inicial) → Triple Energy Bolt (Int 20, 3 bolas a 3 enemigos) → Energy Strike (Int 32, 8 descargas alrededor del enemigo).
  - **Fire:** Fire Ball (Int 17) → Fire Strike (Int 24, 4 explosiones seguidas) → Mass Fire Strike (Int 36).
  - **Previstas, sin datos de juego:** Lightning, Ice y Meteor (`PLANNED_SPELL_FAMILIES`).
- **`weapons/SpellWeapon.ts`** sustituye a `EnergyBolt.ts`. Hay dos formas de apuntar:
  - `targets`: un enemigo distinto por proyectil;
  - `scatter`: caen alrededor del enemigo.
  - Las explosiones con retraso las gestiona `WeaponSystem` con un pool. El daño se aplica una sola vez, al impactar.
- **Visuales de sp-client:**
  - la Fire Ball es direccional: `effect.spr` hoja 5, 8 direcciones × 4 frames (`framesPerDirection` en `config/effects.ts`);
  - explosiones de `effect.spr` hoja 3, `effect3` hojas 1, 2 y 5, y `effect11` hoja 8;
  - sonidos E4 (explosión) y C16 (lanzar).
- **Animación de lanzar:**
  - el estado Cast del original (hojas 64 / 8, 16 frames), acortado de 1,5 s a 0,48 s (`CAST_ANIMATION_MS`);
  - la Maga se planta hasta que sale el hechizo (35%, unos 0,17 s) y luego vuelve a correr;
  - la varita se oculta mientras lanza, como en el original.
- **Ropa de la Maga** (`data/armor.ts`, juego `mage`; piden Mag): quita algo de daño y sube el daño mágico.
  - **Túnica:** Robe (Mag 18) → Wizard Robe (Mag 30). Es el mismo sprite teñido "Tan", el color 11 del original.
  - **Gorro:** Wizard Cap (22) → Wizard Hat (34).
  - La Hero Robe queda reservada para otra cosa.
- **La Maga empieza** con corpiño (Bodice), falda (Skirt), botas y varita. **La varita es fija** (solo estética).
- **Cartas:** eslabón de hechizo, cambio de familia de hechizo y ropa de mago. Muestran daño, ritmo, número de proyectiles y área; la ropa también el daño mágico.
- **Tecla de pruebas:** B da +10 de Int y +10 de Mag.
- **Checkpoint 6B, 2026-10-16:** `tsc` y `build` sin errores. En Playwright la Maga lanza y mata, y la consola está limpia (solo el 404 de `favicon.ico`).
- **A vigilar:** el sonido de lanzar C16 en cada hechizo puede cansar; el daño mágico crece mucho con Mag (ya anotado).
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090.
  1. Elige Magician.
  2. Pulsa X para subir de nivel y B varias veces para sumar Int y Mag.
  3. Elige Fire Ball, Triple Energy Bolt, Robe y Wizard Cap.
- **Comprobado con Playwright:**
  - lanza con animación;
  - Fire Strike con varias explosiones;
  - Wizard Robe teñida y Wizard Hat visibles;
  - salen todas las cartas nuevas;
  - el Guerrero sigue igual;
  - consola limpia.

**Bloque 6A: arsenal del Guerrero** (probado y aprobado).
La fase se parte en 3 bloques: **6A** Guerrero · **6B** Mago (hechizos por Int, eslabones de hechizo, animación de lanzar, túnicas) · **6C** pickups y pasivas.
- **Una sola arma en la mano** (decidido por el propietario). Las cartas ofrecen el siguiente eslabón de tu familia o cambiar a la mejor arma de otra familia.
- **Familias activas** (números propios, no los del original; `data/weapons.ts`):
  - **Short Swords:** Dagger (arma inicial) → Short Sword (Str 17) → Falchion (24). Rápidas y de poco alcance.
  - **Long Swords:** Long Sword (20) → Broad Sword (28) → Great Sword (36) → Flamberge (46). Lentas, arco ancho y más empuje.
- **Desactivadas** (solo datos, `enabled: false`): Hammer, Fencing y Axe.
- **Cómo ataca** (`weapons/MeleeWeapon.ts`):
  - tajo en arco hacia el enemigo más cercano;
  - el daño llega al 25% de la animación;
  - estela blanca (`entities/Slash.ts`);
  - sonidos C18 (tajo) y C6 (golpe).
- **Animación de ataque:** el estado Melee del original (hojas 48 / 6, arma índice 4).
- **Sin patinar al golpear** (pedido por el propietario): al empezar el tajo, el personaje se queda quieto hasta justo después del golpe (frames 0–2; `MELEE_ROOT_MOMENT`): Dagger ≈ 0,13 s, Long Sword ≈ 0,21 s. Después, si te mueves, se corta la animación y vuelve a correr. Quieto, el tajo se ve entero.
- **Armaduras** (`data/armor.ts`, `entities/Equipment.ts`): cuerpo, casco y escudo.
  - Cada pieza quita un % del daño recibido, con tope del 60%, y cambia el aspecto.
  - Chain Mail y Plate Mail también cambian las piernas (y Plate Mail las mangas).
- **El Guerrero empieza** con camisa, pantalón, botas y Dagger. Ya no usa el Energy Bolt.
- **Cartas** (`systems/UpgradePool.ts`): stat, eslabón, cambio de familia y armadura.
  - Como mucho 2 cartas de objeto; el resto, de stat.
  - Las cartas de arma muestran daño, ritmo, alcance y anchura (antes → después).
  - Las de armadura muestran el daño recibido.
- **Panel C:** muestra el arma y el "Damage taken".
- **Movimiento en 8 direcciones** (a prueba, pedido por el propietario): el stick y el ratón se ajustan a la dirección más cercana de las 8 del original. Sigue siendo libre en píxeles, no casilla a casilla. Para volver a cualquier ángulo: `MOVE_DIRECTIONS = 0` en `config/gameConfig.ts`.
- **Sonido como en el original** (pedido por el propietario):
  - el tajo C18 suena cuando cae el golpe, comprimido a 640 ms (la duración del ataque del original), y ya no a velocidad normal;
  - pasos C10 en bucle mientras te mueves, dos por ciclo de carrera, con polvo bajo los pies cada 32 px (efecto `effect2` hoja 1).
  - `AudioSystem.play(key, duración)` y `startLoop`/`stopLoop`. Los bucles se paran al pausar o al salir de la escena.
- **Tecla de pruebas:** V da +10 de Str.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090.
  1. Elige Warrior.
  2. Ataca solo al acercarse los enemigos.
  3. Pulsa X para subir de nivel y V para sumar Str.
  4. Mira cómo cambian el arma en la mano y la armadura.
- **Checkpoint 6A, 2026-10-16:**
  - `tsc` y `build` sin errores.
  - Playwright: consola limpia (solo el 404 de `favicon.ico`) y cartas de armadura y stat en pantalla.
  - Corriendo 4 s entre 50 enemigos, ningún frame de "golpe y movimiento a la vez".
- **Falta de la fase:** 6B (hechizos del Mago por Int, eslabones de hechizo, animación de lanzar, túnicas y gorros) y 6C (poción, imán, cofre con buff aleatorio, Botas y Amuleto imán).
- **Comprobado con Playwright:**
  - golpea a varios enemigos a la vez;
  - salen las cartas de Leather Armor, Long Sword, Targe Shield, Falchion y Scale Mail;
  - el aspecto cambia;
  - la Maga sigue con su Energy Bolt;
  - consola sin errores.

Anterior:
**Pantalla de selección de personaje** (adelantada de la Fase 8, 2026-10-16; probada y aprobada por el propietario). Siguiente: `/fase 6`.
- `scenes/CharacterSelectScene.ts` + `config/characterSelect.ts`: la pantalla original "Create New Character".
  - Fondo: `gamedialog86.spr`, hoja 9, ampliado de 640×480 a 800×600.
  - Botones: `dialogtext.spr`, hoja 1, con el texto ya dibujado y su versión iluminada.
- Solo se elige la clase: **Warrior** o **Magician** (Master no se incluye).
  - El nombre es fijo: "NMs" para el Mago y "NkII" para el Guerrero.
  - Aspecto y stats fijos. Las flechas de aspecto y los +/- se ven apagados.
- **Panel derecho:**
  - el personaje animado y su reflejo girando en el espejo ovalado;
  - Hit Point, Mana Point y Critical, calculados con las reglas reales;
  - una descripción de la clase.
- **Controles:**
  - ←/→ o la cruceta cambian de clase;
  - Enter o A: Create;
  - Esc o Start: Cancel (vuelve al Mago, porque aún no hay menú principal);
  - ratón en los botones.
- La partida usa la clase elegida (`registry` → `CHOSEN_CHARACTER_KEY`). En el Game Over, Esc o Start vuelven a la selección.
- **El Mago es mujer** (pedido por el propietario): `MAGE_FEMALE_LOOK` con `ww`, `whr`, `wpt`, `wrobe1`, `nwhelm3` (Wizard Cap), `wlboots` y `wstaff1`. El aspecto masculino sigue en `MAGE_LOOK` para cuando haya selección de sexo.
- **El Guerrero dispara Energy Bolt de forma provisional** (decidido por el propietario); su arma llega en la Fase 6.
- `entities/CharacterSprite.ts`: el dibujo por capas del personaje, separado de `Player.ts`. Lo usan el jugador y la vista previa.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090. Aparece la pantalla de creación: elige clase y pulsa Create.
- **Checkpoint 2026-10-16:**
  - `tsc` y `build` sin errores.
  - Playwright carga la pantalla de selección con la consola limpia.
  - Comprobado: la partida arranca con la clase elegida y Esc en el Game Over vuelve a la selección.
- **Nota de pruebas:** Playwright pulsa y suelta las teclas en el mismo fotograma y Phaser no lo detecta. Una pulsación real sí funciona.

Anterior:
Fase 5 completada (2026-10-16), probada por el propietario. Siguiente: `/nueva-skill añadir-mejora` y después `/fase 6`.
- **Stats** (`data/stats.ts`, `entities/CharacterStats.ts`):
  - Str: daño físico y requisito de armas/armaduras.
  - Vit: vida.
  - Dex: velocidad de movimiento y de ataque.
  - Int: requisito de hechizos y de equipo de mago; un poco de maná.
  - Mag: daño mágico y maná.
  - Chr: crítico (daño doble, número amarillo con "!").
- **Personajes:** (antes de la pantalla de selección) se jugaba con el **Mago** (Str 12, Vit 10, Dex 10, Int 14, Mag 14, Chr 10; +1 Int +2 Mag por nivel, decidido por el propietario; se ajustará si es demasiado). El Guerrero (Str 14, Vit 12, Dex 14, Int 10, Mag 10, Chr 10; +1 Str +1 Vit por nivel) queda listo para la Fase 8.
- **Requisitos:** `utils/requirements.ts` (`meetsRequirement`, `REQ_SCALE` 0.4). Aún no se usa; es para la Fase 6.
- **Gemas de XP** (`entities/XpGem.ts`, `systems/XpSystem.ts`):
  - esmeralda, zafiro y rubí de `item-ground.spr`;
  - imán y sonido E20;
  - pool, máximo 400 (después se suman a una existente).
- **Curva:** 10 + 10·(nivel−1) (`data/leveling.ts`). Prueba: nivel 9 a los 2 min. El ajuste fino va con las oleadas (Fase 7).
- **`LevelUpScene`:** 3 cartas "+3 a un stat" con antes → después. Se elige con teclado, mando o ratón. Un clic mantenido desde antes de abrirse no elige carta.
- **Barra:**
  - XP;
  - maná real (no se gasta todavía);
  - "Lv N  time  kills";
  - panel de stats con el casco, C o Y del mando.
- **Tecla de pruebas:** X sube un nivel.
- **Interfaz:** todo el texto en inglés, con Comic Neue (ver Decisiones).
- **Falta de la fase:** crear la skill `/nueva-skill añadir-mejora` (indicado en `docs/PLAN.md`), tras cerrar la fase.
- **Cómo probar:** `pnpm --dir survivors dev` → http://localhost:8090. Recoger gemas, elegir cartas (flechas/cruceta + Enter/A, o clic), C para ver los stats, X para subir de nivel.
- **Checkpoint 2026-10-16:** `tsc` y `build` sin errores. Playwright carga el juego; en consola, solo el 404 de `favicon.ico` y avisos de audio del navegador (sin interacción no deja sonar).

Antes de la Fase 5:
Barra inferior (HUD) al estilo del original, 2026-10-16.
- `scenes/HudScene.ts` + `config/hud.ts`:
  - vida real con número;
  - maná llena con "— / —" (el Guerrero aún no usa maná);
  - XP vacía hasta la Fase 5;
  - tiempo y bajas.
- Los 6 botones se iluminan al pasar el ratón. El del disquete, Esc o Start del mando abren una pausa provisional (el menú real llega en la Fase 8).
- La cámara solo dibuja por encima de la barra. Los clics sobre la barra no mueven al jugador.
- Cómo probar: `pnpm --dir survivors dev` → http://localhost:8090.
- **Aspecto provisional de mago** (solo estética, pedido por el propietario): túnica `mrobe1`, sombrero `nmhelm4`, botas altas y varita `mstaff1`. Es `MAGE_LOOK` en `data/characters.ts`; el aspecto de Guerrero sigue en `WARRIOR_LOOK`. Las estadísticas siguen siendo las del Guerrero.
- La barra de vida sobre la cabeza se queda; en el futuro será opcional desde el menú de ajustes (Fase 8).
- La animación de lanzar hechizo queda para la Fase 6 (anotada en `docs/PLAN.md`).

Fase 4 completada (2026-10-16), probada por el propietario. Siguiente: `/fase 5`.
- Más adelante el propietario quiere ajustar algunos detalles visuales; todavía no los ha concretado.
- Hecho:
  - **Energy Bolt** (`weapons/EnergyBolt.ts`, datos en `data/weapons.ts`): dispara solo al enemigo más cercano a menos de 320 px, cada 1,1 s. Daño según la wiki: 10 directo + 7 en un área de 3×3 casillas, así que el enemigo alcanzado recibe 17.
  - `Weapon.ts` base, `WeaponSystem` (proyectiles y explosiones con pool), `Projectile.ts` y `Effect.ts`. Los efectos usan `effect.spr`: hoja 0, frames 2–5 en vuelo; hoja 6 para la explosión (`config/effects.ts`).
  - `CombatSystem`: daño, destello blanco, retroceso que se frena rápido y contador de muertes.
  - `DamageNumbers`: "-N" rojo con borde negro, sube y se desvanece (pool, máximo 120 en pantalla).
  - `AudioSystem`: lanzamiento E1, impacto E2, golpe y muerte de cada monstruo. Como máximo 3 copias del mismo sonido, separadas al menos 70 ms, y 14 sonidos en total (`data/audio.ts`).
  - Panel F1: muertes, proyectiles, números en pantalla y sonidos (sonando y descartados).
  - Comprobado:
    - `tsc` y `build` sin errores;
    - en Playwright, 324 enemigos a 144 FPS, matando y con sonido limitado;
    - consola sin errores (salvo `favicon.ico`).
- Cómo probar: `pnpm --dir survivors dev` → http://localhost:8090. No hace falta pulsar nada para atacar. F1 · G · N ×3 para ver muchos enemigos.
- Checkpoint 2026-10-16: `tsc` y `build` sin errores; Playwright carga el juego sin errores (solo falta `favicon.ico`).
- Datos de referencia de Helbreath: `docs/hb-wiki/` (índice en `README.md`).

## Problemas conocidos
- Con un solo Energy Bolt, 300 enemigos sobrepasan al jugador. Las cartas de stat ayudan, pero la progresión real llega con las armas de la Fase 6.
- El daño mágico crece rápido (+2 Mag por nivel y +4% por punto). Vigilarlo al equilibrar.
- Las flechas "→" de las cartas usan otra fuente: Comic Neue no tiene ese carácter. No molesta.
- El navegador interno de la app, si el panel está en segundo plano, va a ~1 FPS y parece congelado. Para revisar el juego, usar Playwright o tener el panel visible.
- En el navegador interno, `sp-client` muestra errores `Cannot suspend/resume a closed AudioContext`. Son del audio en una pestaña en segundo plano y no afectan.
- `pnpm build` genera `dist/` sin assets (se resuelve en la Fase 9).
- Algunos enemigos se quedan esperando en la orilla del río si el jugador está al otro lado. Sin búsqueda de caminos. Se recolocan si quedan lejos.
- Falta `favicon.ico` (404 en consola, inofensivo; se añadirá en la Fase 9).
- El personaje se ve pequeño a 800×600 (tamaño original de Helbreath). Si se quiere, se ajusta el zoom de la cámara más adelante.

## Decisiones tomadas
- 2026-10-16 · Fuente de la interfaz: **Comic Neue**, copia libre (OFL) de Comic Sans MS, la letra de los diálogos del original. Va incluida en el juego (`@fontsource/comic-neue`, `config/ui.ts`) y se espera a que cargue antes de arrancar. Tamaño normal 15; en las cajas de la barra inferior, 12 (confirmado por el propietario). Los números de daño siguen en Georgia, como en sp-client, y los paneles de pruebas en monospace.
- 2026-10-16 · Idioma del juego: **solo inglés** (regla 9 de CLAUDE.md). Documentación y explicaciones siguen en español.
- 2026-10-16 · Las gemas de XP se dibujan por encima de enemigos y objetos, para que nunca queden tapadas.
- 2026-10-16 · Mapa: **huntzone2** (elegido por el propietario frente a middleland). Zona de juego ~100×100 casillas desde (72,70). Riesgos y detalles en `NOTES.md`.
