---
name: anadir-enemigo
description: Añadir un nuevo enemigo, monstruo o jefe al juego (con su sprite, sonidos y comportamiento real del Helbreath original), o meterlo en una oleada o evento. Úsala cuando el propietario pida "añade el monstruo X", "nuevo enemigo", "otro jefe", "que salga X en el minuto Y" o "cambia la oleada".
---

# Añadir un enemigo, un jefe o un cambio de oleada

Reglas del diseño (Fase 7):
- El **comportamiento es el real** del Helbreath original: ritmo, alcance, valentía y dados de daño, sacados del `NPC.cfg`. Ver `docs/hb-wiki/monstruos-comportamiento.md`.
- La **vida y la XP son nuestras**: siguen el orden de los tiers de la wiki (`docs/hb-wiki/monstruos.md`), comprimido para 12 minutos.
- Todo el texto del juego, en inglés (regla 9). Números de diseño solo en `data/` (regla 4).

Antes de empezar: lee `survivors/PROGRESS.md`, presenta un plan corto con los números propuestos y espera el OK.

## Investigar primero (con un subagente, trae solo el resumen)
- **Sprite, sonidos y animaciones especiales:** `sp-client/src/constants/Monsters.ts`.
  - `spriteName`;
  - `temporalCoefficient` y `shadow`;
  - `states.attack/takeDamage/death.sound`;
  - `states.X.animation` (`startSpriteSheet`, `startAnimationFrame`, `animationFrames`): la marca de una animación especial.
  - Comprueba que el `.spr` y los `.mp3` existen en `sp-client/public/assets`.
- **Comportamiento real:** su fila en el `NPC.cfg`. La tabla de nuestros monstruos está en `docs/hb-wiki/monstruos-comportamiento.md`. Si no está, descárgalo de [centuu/HelbreathServer](https://github.com/centuu/HelbreathServer) (`Files/NPC.cfg`) y saca `ATime`, `AttkRange`, `MinBrvy`, `ADT`/`ADR`.
  - Ojo: en el `.cfg` algunos nombres cambian (Snake = `Amphis`, Ogre = `Orge`, Gargoyle = `Gagoyle`, Hellhound = `Hellbound`).
- **Vida y XP:** su tier en `docs/hb-wiki/monstruos.md`; colócalo entre los nuestros del mismo tier.

## Archivos, en este orden
1. `survivors/src/config/assetManifest.ts`:
   - `'enemy.<id>'` con su `.spr` (`SpriteType.Monster`);
   - `'sfx.<id>.hit'`, `'.death'` y `'.attack'`.
   - Si no tiene algún sonido, reutiliza el de otro, como hace sp-client (Stalker = Orc).
2. `survivors/src/data/enemies.ts` → `ENEMIES`, con los datos reales y los nuestros.
   - **No pongas `speed`:** sale sola de `actionTimeMs` (`enemySpeed`).
   - Si su animación es especial: `animations.{idle|move|attack|dead}` con `sheet`, `firstFrame` y `frameCount`.
   - Si es un arquero: `attackProjectile: ARROW`.
   - Si es un jefe: `scale`, `knockbackTaken` y `boss: { title, dropsChest, final, ranged? }`.
3. `survivors/src/data/waves.ts`:
   - para que salga siempre en un tramo: añádelo a su `WAVES[i].enemies` con un `weight`;
   - para un momento concreto: un `WAVE_EVENTS` (`'boss'`, `'finalBoss'` o `'surround'` + `count`) con su `message` en inglés.
4. `survivors/PROGRESS.md`, y `survivors/NOTES.md` si el sprite tiene algo raro (pivotes, errata en el nombre, sonidos que faltan).

## Ejemplo real: un monstruo normal
```ts
// data/enemies.ts → ENEMIES (NPC.cfg Troll: ATime 700, AttkRange 1, MinBrvy 100, 8d5)
troll: {
    name: 'Troll', sprite: 'enemy.troll', temporalCoefficient: 1, hasShadow: true, maxHp: 230, xp: 20, radius: 16, bodyOffsetY: 34,
    actionTimeMs: 700, attackRange: 1, bravery: 100, damageDice: [8, 5], hitSound: 'sfx.troll.hit', deathSound: 'sfx.troll.death', attackSound: 'sfx.troll.attack',
},
```

## Ejemplo real: animación especial y alcance largo
```ts
// sp-client: la rana anda con los frames 3–7. NPC.cfg: alcance 2 casillas.
frog: {
    name: 'Giant Frog', sprite: 'enemy.frog', temporalCoefficient: 1, hasShadow: true, maxHp: 55, xp: 8, radius: 14, bodyOffsetY: 16,
    actionTimeMs: 900, attackRange: 2, bravery: 4, damageDice: [7, 5], hitSound: 'sfx.frog.hit', deathSound: 'sfx.frog.death', attackSound: 'sfx.frog.attack',
    animations: { move: { sheet: 8, firstFrame: 3, frameCount: 5 } },
},
```

## Ejemplo real: un minijefe y su evento
```ts
// data/enemies.ts
ettin: {
    name: 'Ettin', sprite: 'enemy.ettin', temporalCoefficient: 1, hasShadow: true, maxHp: 2600, xp: 60, radius: 22, bodyOffsetY: 50,
    actionTimeMs: 700, attackRange: 3, bravery: 100, damageDice: [8, 9], hitSound: 'sfx.ettin.hit', deathSound: 'sfx.ettin.death', attackSound: 'sfx.ettin.attack',
    attackSpeed: 0.6, scale: 1.3, knockbackTaken: 0.1,
    boss: { title: 'Ettin', dropsChest: true, final: false },
},
// data/waves.ts → WAVE_EVENTS
{ atMinute: 5, kind: 'boss', enemy: 'ettin', message: 'The Ettin approaches!' },
```
Los jefes, sin hacer nada más:
- salen en la barra grande;
- cambian la música (`dungeon`, o `abaddon` si es el final);
- sueltan el cofre si tienen `dropsChest`;
- dan la victoria si tienen `final`.

## Errores típicos
- **Usar números inventados** en ritmo, alcance o daño. Están en el `NPC.cfg`; si de verdad no aparece, dilo y propón valores parecidos a los de su tier.
- **Poner `speed` a mano.** Se calcula del `actionTimeMs`; para cambiar la velocidad de todos, `MONSTER_MOVE.scale`.
- **Olvidar `temporalCoefficient: 0.5`** cuando sp-client lo trae (Snake, Skeleton, Zombie…): anda y ataca al doble de lento.
- **Animación especial sin `animations`.** Si sp-client trae `startAnimationFrame`, sin ella sale mal o rompe Phaser (los Wyverns solo funcionan desde el frame 3).
- **Sprites pesados.** Los Wyverns pesan 3,6 MB y todo se carga al empezar; avisa si añades varios grandes.
- **Monstruos que no existen o están rotos:** Fire Elemental, Magma Bull y Abaddon (`survivors/NOTES.md`).
- **El nombre del archivo con errata:** Gargoyle es `gagoyle.spr`.

## Cómo verificar
1. `pnpm --dir survivors exec tsc --noEmit` y `pnpm --dir survivors build`.
2. `pnpm --dir survivors dev` → http://localhost:8090.
   - Teclas:
     - **G:** invencible;
     - **J:** +1 minuto, para llegar a su oleada;
     - **M:** siguiente jefe;
     - **L:** +5 niveles;
     - **F1:** muestra la oleada.
3. Con Playwright:
   - **Sacarlo:** `g.enemies.spawn('<id>', g.player.x - 150, g.player.y)`. A la izquierda: al empezar, a la derecha hay río y se queda atascado.
   - **El dibujo:** captura con `g.cameras.main.setZoom(2.5)` para ver que anda, ataca y muere bien en las 8 direcciones y que no "baila".
   - **El ataque:** mide que ataca desde `attackRange` casillas cada ~`actionTimeMs`; registra `e.state` y la distancia a la que pasa a `'attack'`.
   - **La consola:** sin errores; el 404 de `favicon.ico` es normal.
4. Explícale al propietario cómo probarlo: comando, teclas y qué debería ver.
