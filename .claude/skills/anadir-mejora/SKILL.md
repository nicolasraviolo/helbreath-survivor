---
name: anadir-mejora
description: Añadir una mejora nueva a las cartas de subida de nivel (un stat con efecto nuevo, una carta nueva o un tipo de carta nuevo como arma, eslabón, armadura o pasiva). Úsala cuando el propietario pida "añade una mejora", "nueva carta al subir de nivel", "que el stat X haga Y" o al enchufar los tipos de carta de la Fase 6.
---

# Añadir una mejora a las cartas de subida de nivel

Una **mejora** es cada opción que aparece en `LevelUpScene` al subir de nivel (3 cartas, se elige 1).
Hoy solo existe la carta **Stat** ("+3 a un stat"). Los tipos Arma nueva, Mejora de eslabón y Armadura
llegan en la Fase 6 (`docs/DESIGN.md` → "Cartas al subir de nivel").

Antes de empezar: lee `survivors/PROGRESS.md` y presenta al propietario un plan corto. Espera su OK.

## Decide qué caso es
- **A. Un stat hace algo nuevo o distinto** (p. ej. "Dex también da esquiva"): cambia datos y cálculo; la carta sale sola.
- **B. Un tipo de carta nuevo** (arma, eslabón, armadura, pasiva, pickup…): hay que generalizar la elección.

## Archivos, en este orden
1. `survivors/src/data/stats.ts`: números de diseño (`HP_PER_VIT`, `MAGIC_DAMAGE_PER_MAG`…), `STAT_INFO` (texto de la carta) y `STAT_CARD_POINTS` / `LEVEL_UP_CHOICES`. **Ningún número de diseño fuera de `data/`.**
2. `survivors/src/entities/CharacterStats.ts`: los valores derivados (`maxHp`, `maxMana`, `damageMultiplier`, `moveSpeedMultiplier`, `cooldownMultiplier`, `critChance`) y `previewWith()` para el "antes → después".
3. `survivors/src/scenes/GameScene.ts`:
   - `applyStats()` lleva los derivados al jugador y a las armas;
   - `openLevelUp()` arma las 3 opciones y aplica la elegida en `onChoose`.
4. `survivors/src/scenes/LevelUpScene.ts`: `LevelUpChoice`, `createCard()` (cómo se dibuja) y `describeChanges()` (las líneas antes → después).
5. `survivors/src/scenes/HudScene.ts` → `describeDerived()`: filas del panel de stats (tecla C), si el efecto debe verse ahí.
6. Si usa un asset nuevo (icono, sonido): `survivors/src/config/assetManifest.ts` con clave propia (`ui.icon.boots`, `sfx.levelUp`).
7. `survivors/PROGRESS.md` y, si se aprendió algo no obvio, `survivors/NOTES.md`.

## Caso A: efecto nuevo de un stat
1. Número en `data/stats.ts`, con comentario de dónde sale (wiki o decisión del propietario).
2. Getter en `CharacterStats`, usando `STAT_BASELINE` como punto neutro.
3. Aplicarlo en `GameScene.applyStats()` (o donde se consuma, p. ej. `CombatSystem.hitEnemy`).
4. Actualizar `STAT_INFO[stat].effect` (en inglés) y añadir la línea en `describeChanges()` y, si toca, en `describeDerived()`.

Ejemplo real (Mag → daño mágico):
```ts
// data/stats.ts
/** Daño mágico +4% por punto de Mag sobre 10 (en el original, +0,3%). */
export const MAGIC_DAMAGE_PER_MAG = 0.04;
mag: { short: 'Mag', name: 'Magic', effect: 'Magic damage and mana', color: 0x8040c0 },

// entities/CharacterStats.ts
return this.def.magicDamageMultiplier * (1 + MAGIC_DAMAGE_PER_MAG * (this.stats.mag - STAT_BASELINE));

// scenes/LevelUpScene.ts → describeChanges()
case 'mag':
    lines.push(`Magic damage ${bonus(stats.damageMultiplier('magic'))} → ${bonus(after.damageMultiplier('magic'))}`);
    lines.push(`Mana ${stats.maxMana} → ${after.maxMana}`);
    break;
```

## Caso B: tipo de carta nuevo
La primera vez que se haga, hay que generalizar (después solo se añaden casos):
1. En `LevelUpScene.ts`, convertir `LevelUpChoice` en una unión con `kind`:
   ```ts
   export type LevelUpChoice =
       | { kind: 'stat'; stat: StatId; points: number }
       | { kind: 'weapon'; weapon: WeaponId };   // el tipo nuevo
   ```
   y que `createCard()` / `describeChanges()` hagan `switch (choice.kind)` para icono, título, efecto y líneas.
2. Sacar la construcción de opciones de `GameScene.openLevelUp()` a `survivors/src/systems/UpgradePool.ts`
   (función pura: recibe `CharacterStats` + lo que ya tiene el jugador y devuelve `LevelUpChoice[]`).
3. **Disponibilidad:** una carta solo entra si se puede usar. Para requisitos, siempre `meetsRequirement()`
   de `utils/requirements.ts` (Str para armas y armaduras, Int para hechizos y equipo de mago).
4. **Relleno:** si no hay 3 opciones distintas, completar con cartas de stat (siempre disponibles). Sin duplicados.
5. Aplicar la elección en `onChoose` con un `switch (choice.kind)` y llamar a `applyStats()` al final.
6. Datos del tipo nuevo en su archivo de `data/` (`data/weapons.ts`, `data/armor.ts`…), nunca en la escena.

Así se construyen hoy las opciones (punto de partida a generalizar):
```ts
const ids = Phaser.Utils.Array.Shuffle([...STAT_IDS]).slice(0, LEVEL_UP_CHOICES);
choices: ids.map((stat): LevelUpChoice => ({ stat, points: STAT_CARD_POINTS })),
onChoose: (choice) => {
    stats.addStat(choice.stat, choice.points);
    stats.pendingLevelUps--;
    this.applyStats();
    ...
},
```

## Errores típicos
- **Texto en español en pantalla.** El juego es solo en inglés (regla 9 de CLAUDE.md).
- Números de diseño en la escena o en la lógica en lugar de `data/`.
- Olvidar `applyStats()` tras elegir: la carta se aplica pero la vida o la velocidad no cambian hasta el siguiente nivel.
- Olvidar `pendingLevelUps--`: las cartas vuelven a salir sin fin.
- Llamar `data` a un campo de una escena: choca con el `DataManager` de Phaser (usar `params`).
- Texto que no cabe: las cartas miden 230 px de ancho a Comic Neue 15. Probar la línea más larga.
- Poner en las cartas un estilo de fuente propio en lugar de `UI_FONT` / `UI_FONT_SIZE` de `config/ui.ts`.
- Mejoras que crean objetos cada frame (proyectiles, gemas, números): usar pool (regla 5).
- Cartas repetidas entre las 3, o una carta que no se puede usar (requisito no cumplido).

## Cómo verificar
1. `pnpm --dir survivors exec tsc --noEmit` sin errores.
2. `pnpm --dir survivors dev` → http://localhost:8090. Pulsar **X** (sube un nivel) varias veces:
   - la carta nueva aparece cuando debe y no cuando no se cumple su requisito;
   - el "antes → después" de la carta es correcto;
   - tras elegirla, la tecla **C** muestra el cambio y se nota en la partida.
3. Elegir con flechas + Enter, con el ratón y (si hay) con mando.
4. Con Playwright: mantener teclas y clics ~80 ms (`keyboard.down` → espera → `up`); un `press` instantáneo no lo ve Phaser.
5. Dile al propietario cómo probarlo (comando, URL, teclas, qué debería ver) y apúntalo en `PROGRESS.md`.
