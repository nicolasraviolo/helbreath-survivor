---
name: anadir-arma
description: Añadir una nueva arma, hechizo o pieza de armadura al juego (un eslabón nuevo en una familia, activar una familia apagada como Hammer, Axe, Fencing, Lightning o Ice, o una armadura/ropa nueva). Úsala cuando el propietario pida "añade un arma", "añade el hechizo X", "activa los martillos", "nueva armadura" o "otra espada".
---

# Añadir un arma, un hechizo o una armadura

Reglas del diseño (Fase 6, `docs/DESIGN.md`):
- Cada clase lleva **una sola cosa en la mano**: el Guerrero, un arma cuerpo a cuerpo; la Maga, un hechizo.
- Las cartas ofrecen el siguiente **eslabón** de tu familia o **cambiar de familia**. La varita de la Maga es solo estética.
- Los números son **propios**, no los del original. Requisito: Str para armas y armaduras, Int para hechizos, Mag para la ropa de mago.

Antes de empezar: lee `survivors/PROGRESS.md`, presenta un plan corto con los números propuestos y espera el OK.

## Decide qué caso es
- **A. Eslabón nuevo en una familia que ya ataca** (otra espada larga, otro hechizo de fuego): solo datos y sprite.
- **B. Activar una familia apagada** (Hammer, Axe, Fencing en `MELEE_FAMILIES`; Lightning, Ice o Meteor en `PLANNED_SPELL_FAMILIES`): datos y una forma de atacar nueva si la familia no encaja con las que hay.
- **C. Armadura o ropa nueva**: solo `data/armor.ts` y el sprite.

## Investigar primero (con un subagente, trae solo el resumen)
- **Sprite y hoja de inicio:** `sp-client/src/constants/Items.ts`, campos `equippedSpriteMale`/`Female` y `startSpriteSheetIndex`.
  - `msw.spr` usa 56 hojas por espada; `msh.spr`, 7 por escudo.
  - Las hachas y los martillos tienen archivo propio (`maxe*`, `mhammer`); ver `survivors/NOTES.md`.
- **Hechizos:** `sp-client/src/game/spells/<Nombre>.ts` y `constants/Effects.ts`. Apunta archivo `.spr`, hoja, frames, fps, desplazamientos, sonidos y retrasos.
- **Números de referencia:** `docs/hb-wiki/armas.md`, `hechizos.md` y `armaduras.md`. Requisitos originales en `docs/REQUISITOS_HB.md`, solo como orientación.

## Archivos, en este orden
1. `survivors/src/config/assetManifest.ts`: el `.spr` (y los `.mp3`) con clave propia (`gear.axes.m`, `fx.effect7`, `sfx.lightning`). **Nunca rutas sueltas.**
2. `survivors/src/config/effects.ts` (solo hechizos): un `EFFECTS` por visual.
   - Proyectil direccional (8 direcciones): `framesPerDirection`.
   - Pivote raro: `offsetX`/`offsetY`.
   - Debajo del personaje: `depthOffset: -1`.
3. Los datos:
   - **Arma:** `survivors/src/data/weapons.ts`, en `MELEE_WEAPONS` (con `sprite`), y su id en `links` de `MELEE_FAMILIES`, ordenados de más débil a más fuerte.
   - **Hechizo:** `survivors/src/data/spells.ts`, en `SPELLS` y en `links` de `SPELL_FAMILIES`.
   - **Armadura:** `survivors/src/data/armor.ts`, en `ARMOR_PIECES` y en `ARMOR_BY_SET[clase][hueco]`, ordenados.
4. Solo en el caso B, si la familia ataca distinto:
   - una clase nueva en `survivors/src/weapons/` (hereda de `Weapon`, como `MeleeWeapon.ts` o `SpellWeapon.ts`);
   - lo que necesite del contexto, en `WeaponContext` (`weapons/Weapon.ts`) y `systems/WeaponSystem.ts`;
   - crear la clase según la familia en `GameScene.applyChoice` (casos `weaponLink`/`weaponSwitch` o `spellLink`/`spellSwitch`).
5. Poner `enabled: true` en la familia. Las cartas salen solas: `systems/UpgradePool.ts` ya mira todas las familias activas.
6. `survivors/PROGRESS.md`, y `survivors/NOTES.md` si se aprendió algo del sprite (índices, pivotes raros).

## Ejemplo real: un eslabón de espada larga (caso A)
```ts
// data/weapons.ts → MELEE_WEAPONS
broadSword: {
    name: 'Broad Sword', family: 'longSword', strRequired: 28, damage: 20, cooldownMs: 1000, swingMs: 560,
    range: 85, arcDegrees: 150, knockback: 165, sprite: { key: SWORD_SPRITE, startSheet: 392 },
},
// data/weapons.ts → MELEE_FAMILIES
longSword: { name: 'Long Swords', enabled: true, links: ['longSword', 'broadSword', 'greatSword', 'flamberge'] },
```

## Ejemplo real: un hechizo con explosiones en cadena
```ts
// data/spells.ts → SPELLS
fireStrike: {
    name: 'Fire Strike', family: 'fire', intRequired: 24,
    directDamage: 8, areaDamage: 20, areaRadius: 80, cooldownMs: 1600,
    range: 320, maxDistance: 480, speed: 380, projectileRadius: 10, knockback: 220,
    shots: 1, shotIntervalMs: 0, aim: 'targets',
    flyEffect: 'fx.fireBall.fly', bursts: FIRE_STRIKE_BURSTS, originOffsetY: FIRE_ORIGIN_Y,
},
```
- `aim: 'targets'`: un proyectil por enemigo distinto (Triple Energy Bolt, `shots: 3`).
- `aim: 'scatter'` + `scatterRadius` + `shotIntervalMs`: lluvia alrededor del enemigo (Energy Strike).
- `bursts`: explosiones con `dx`, `dy` y `delayMs`. El daño se aplica **una vez**, al impactar.

## Ejemplo real: ropa de mago teñida
```ts
// data/armor.ts → ARMOR_PIECES (mismo sprite que la Robe, con el color del objeto original)
wizardRobe: {
    name: 'Wizard Robe', slot: 'body', set: 'mage', stat: 'mag', required: 30, defense: 0.07, magicDamageBonus: 0.14,
    look: { armor: { sprite: 'gear.armor.robe.w', tint: WIZARD_ROBE_TINT } },
},
```

## Errores típicos
- **Desordenar los `links`.** La carta ofrece el *último* eslabón permitido. Si el orden no va de débil a fuerte, se salta o retrocede.
- **Dos eslabones con el mismo requisito.** Solo saldrá el más fuerte (pasa con Long Sword y Broad Sword en el original). Úsalo a propósito o cambia el número.
- **Sprite de mujer en la Maga.** La Maga es mujer (`MAGE_FEMALE_LOOK`): para ella van los `w*.spr`.
- **Hojas de inicio mal puestas.** Si el arma sale "bailando" o vacía en una dirección, el `startSheet` está mal. Compruébalo en Items.ts.
- **Pivotes que lo dibujan lejos.** Algunos efectos traen pivotes que los dibujan lejos (el aura del Defense Shield, ~95 px a la izquierda y 147 por encima). Corrígelo con `offsetX`/`offsetY` y una captura ampliada con un punto en los pies.
- **Números sueltos en la lógica.** Todo número de diseño va en `data/` (regla 4).
- **Proyectiles o explosiones sin pool.** Usa siempre `WeaponSystem` (`launchProjectile`, `bursts`), que ya tiene pool (regla 5).
- **Textos en español en el juego.** Nombres y cartas, en inglés (regla 9).

## Cómo verificar
1. `pnpm --dir survivors exec tsc --noEmit` y `pnpm --dir survivors build`.
2. `pnpm --dir survivors dev` → http://localhost:8090. Elige la clase.
3. Teclas de pruebas:
   - **V:** +10 Str (Guerrero);
   - **B:** +10 Int y Mag (Maga);
   - **X:** sube un nivel; repítela hasta ver la carta.
4. Con Playwright:
   - **Las cartas:** importa `/src/systems/UpgradePool.ts` y llama a `buildLevelUpChoices(g.stats, g.equipment)` varias veces para ver que la carta aparece.
   - **El ataque:** aplícalo con `g.applyChoice({ kind: 'weaponSwitch', weapon: 'id', from: '...' })` o `'spellSwitch'`, haz `g.spawner.spawnMany(40)` y comprueba que sube `g.combat.kills`.
   - **El sprite:** captura con `g.cameras.main.setZoom(3)` para ver el arma en la mano, el efecto y que no "baila".
   - **La consola:** sin errores; el 404 de `favicon.ico` es normal.
5. Explícale al propietario cómo probarlo: comando, teclas y qué debería ver.
