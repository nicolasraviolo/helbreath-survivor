// Contenido de enemigos.
// - Comportamiento REAL del original (NPC.cfg, ver docs/hb-wiki/monstruos-comportamiento.md): ritmo de acción,
//   alcance de ataque, valentía y dados de daño. La velocidad sale del ritmo (un paso por acción, enemySpeed).
// - Vida y XP son nuestras: siguen el ORDEN de la tabla por tiers de la wiki (docs/hb-wiki/monstruos.md),
//   comprimido para una partida de 12–15 min. Se ajustarán jugando.
// - XP (Fase 13C): una quinta parte de la vida (mínimo 1), para que matar a un monstruo fuerte valga lo que cuesta.
//   Los jefes, a mano: Ettin 250, Demon 500, Wyvern 1200.
// - Jefes (Fase 13C): vida para unos 2–3 minutos de pelea, ningún golpe los mueve y pegan más suave que sus dados
//   (damageScale), para que ninguno mate en 1–2 golpes. Medido con `pnpm check levelpace`.
// - Ajuste del 18-oct-2026 (menos monstruos, más duros, como el original): vida y XP de los normales ×2 y daño ×1,4
//   (MONSTER_DAMAGE.scale); el damageScale de los jefes se bajó lo mismo, así que los jefes pegan igual que antes.
// Sprites y sonidos: sp-client/src/constants/Monsters.ts.
import type { SoundKey, SpriteKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';
import type { MovementStyle } from './movement';

/** A state whose sheets or frames differ from the standard layout (sp-client Monsters.ts → states.X.animation). */
export interface EnemyAnimation {
    /** First sheet; the sheet for a direction is `sheet + direction`. */
    sheet: number;
    /** Only part of the sheet's frames: from `firstFrame`, `frameCount` of them. */
    firstFrame?: number;
    frameCount?: number;
}

/** Projectiles thrown at the player (boss fireballs, Dark Elf arrows). */
export interface EnemyRangedAttack {
    /** Flight effect and, optionally, the explosion when it lands (config/effects.ts). */
    flyEffect: EffectKey;
    explodeEffect?: EffectKey;
    /** Played when it lands. */
    sound?: SoundKey;
    /** Damage; undefined = the thrower's own damage dice (Dark Elf arrows). */
    damage?: number;
    cooldownMs: number;
    /** Only throws when the player is closer than this (px). */
    range: number;
    speed: number;
    /** Projectiles per throw, spread over `spreadDegrees`. */
    shots: number;
    spreadDegrees: number;
    /** Projectile radius for hitting the player (px). */
    radius: number;
    /** A physical shot (arrows): the player can dodge it like a blow. Spells (fireballs) cannot be dodged. */
    physical?: boolean;
    /**
     * Spells only: magic hit ratio against the player's magic resistance (data/defense.ts); our own number, the wiki
     * has none. Undefined = it always lands.
     */
    magicHitRatio?: number;
}

export interface BossInfo {
    /** Name shown on the big health bar and the warning. */
    title: string;
    /** Drops a chest when it dies. */
    dropsChest: boolean;
    /** Killing it wins the game. */
    final: boolean;
    /** Extra attack of its own, besides its normal blows (the Fire Wyvern's fireballs). */
    ranged?: EnemyRangedAttack;
}

export interface EnemyDef {
    name: string;
    sprite: SpriteKey;
    /** Animation speed multiplier (1 = 10 fps for an 8-frame sheet). */
    temporalCoefficient: number;
    /** sp-client MonsterShadow.BodyShadow: draws a squashed black copy of the sprite. */
    hasShadow: boolean;
    maxHp: number;
    /**
     * Original NPC.cfg ATime: time between two actions (a step or an attack). It sets the attack rhythm and the
     * walking speed (enemySpeed): each action waits ATime minus a random 0–700 ms, never under 600 ms (server NpcProcess).
     */
    actionTimeMs: number;
    /** Original NPC.cfg AttkRange, in tiles: 1 = melee; more = it hits from that far (the Dark Elf shoots arrows). */
    attackRange: number;
    /** Original NPC.cfg MinBrvy: at ≤7% health it flees if a roll 1..bravery is ≤ 8 (docs/hb-wiki/monstruos.md). */
    bravery: number;
    /** Original NPC.cfg damage dice (ADT d ADR), compressed for our health scale with MONSTER_DAMAGE. */
    damageDice: readonly [number, number];
    /**
     * Share of that blow that lands (default 1). Bosses hit softer than their dice (Fase 13C): no boss may kill in
     * 1–2 blows; a Mage of the level you usually have when it appears should take about 5.
     */
    damageScale?: number;
    /** Every blow does exactly this much, whatever the dice and the map (the Dummy's 1, Fase 22A). */
    fixedDamage?: number;
    /**
     * Original physical hit ratio (docs/hb-wiki/monstruos.md, without the dash attack): the higher, the more often its
     * blows land despite the player's defense (data/defense.ts). Hellhound is not in the wiki: about a Troll's.
     */
    hitRatio: number;
    /** How it walks towards the player (data/movement.ts, Fase 27); default 'direct'. Bosses always go direct. */
    movement?: MovementStyle;
    /** Fires this projectile instead of hitting directly (Dark Elf arrows). */
    attackProjectile?: EnemyRangedAttack;
    /** XP of the gem dropped on death. */
    xp: number;
    /** Body radius in pixels, for contact with the player and separation between enemies. */
    radius: number;
    /** Height above the feet where projectiles aim and hit, in pixels. */
    bodyOffsetY: number;
    /** Sounds from sp-client/src/constants/Monsters.ts (takeDamage / death / attack). */
    hitSound: SoundKey;
    deathSound: SoundKey;
    /** Played when it starts an attack, squeezed to the attack animation. */
    attackSound: SoundKey;
    /** Speed of its attack animation (1 = MONSTER_ATTACK.frameRate, the sp-client default; 0.6 = 40% slower). */
    attackSpeed?: number;
    /** Drawn bigger (bosses). */
    scale?: number;
    /** Sprite opacity (the original draws the Wyverns at 0.7). */
    alpha?: number;
    /** Share of the weapons' knockback it takes (bosses barely move). Default 1. */
    knockbackTaken?: number;
    /** Always glows red like an elite, without an elite's extra health or damage (the Berserk Ettin, Fase 22E). */
    glows?: boolean;
    /** Non-standard sheets / frames for moving, attacking and dying. */
    animations?: { idle?: EnemyAnimation; move?: EnemyAnimation; attack?: EnemyAnimation; dead?: EnemyAnimation };
    boss?: BossInfo;
}

/**
 * Damage of a monster blow: the original dice rolled, compressed for our health scale (originals go from 1d4 to 20d18):
 * scale × average^exponent × (roll / average). Keeps each monster's randomness and the order between them.
 */
export const MONSTER_DAMAGE = { scale: 2.76, exponent: 0.7 } as const;

/**
 * Health of every mini-boss and final boss × this, on top of its maxHp (revisión de la dificultad, D, propietario
 * 22-oct-2026): morían en 11–27 s (minijefes) y 30–60 s (jefes finales) y eran lo más fácil de cada mapa. Su golpe no cambia.
 */
export const BOSS_HP_MULTIPLIER = 2;

/**
 * Health of the normal monsters, compressed (revisión de la dificultad, G, propietario 22-oct-2026): la vida del Orc
 * (60) al Ogre (1.040) crecía ×17 y el daño del personaje solo ×2,5–3 en una partida, así que desde el minuto 7 los
 * monstruos se acumulaban en una "bola". Vida = reference × (maxHp / reference)^exponent: el Orc se queda en 60, los
 * flojos casi igual y los grandes bajan (Ogre 1.040 → ~510). Su XP no cambia. Los jefes no entran (BOSS_HP_MULTIPLIER).
 */
export const MONSTER_HP = { reference: 60, exponent: 0.75 } as const;

/** Full health of a monster before the map, elite and champion multipliers. */
export function monsterBaseHp(def: EnemyDef): number {
    if (def.boss) return def.maxHp * BOSS_HP_MULTIPLIER;
    return MONSTER_HP.reference * (def.maxHp / MONSTER_HP.reference) ** MONSTER_HP.exponent;
}

/**
 * Monster AI rules of the original server (docs/hb-wiki/monstruos-comportamiento.md):
 * - attack interval = actionTimeMs minus one of `attackTimeCuts` at random, never under `minAttackIntervalMs`;
 * - attack strategy rolled on spawn with a 1..10 die: 2 = hit once and flee, 3 = hit twice and flee, else keep attacking;
 *   fleeing lasts `fleeActions` actions (actionTimeMs each), then it comes back;
 * - at ≤ `lowHealthShare` of its health, it flees for `lowHealthFleeActions` actions if a roll 1..bravery ≤ `braveryRoll`.
 */
export const MONSTER_AI = {
    attackTimeCuts: [0, 100, 200, 300, 400, 600, 700],
    minAttackIntervalMs: 600,
    strategyDie: 10,
    hitAndRunRoll: 2,
    twoHitsAndRunRoll: 3,
    fleeActions: 2,
    lowHealthShare: 0.07,
    braveryRoll: 8,
    lowHealthFleeActions: 10,
} as const;

/**
 * Walking speed (chasing the player), from the original server: one tile per action, and while attacking the action
 * time is ATime minus a random 0–700 ms (on average the mean of `attackTimeCuts`), never under 600 ms. So every big
 * monster walks about a tile per 0.6 s, small ones slower (Slime a tile per ~1.8 s).
 * Scaled like our player: the original one ran a tile in 0.18 s (sp-client, 178 px/s), ours goes 150 px/s, so
 * `scale` = 150 / 178. Raise `scale` to make every monster faster at once.
 * Also 1.5× faster than the real ones (chosen by the owner on 17-oct-2026), so they reach the player sooner in a
 * survivors; proportions between monsters stay the original ones and the player is still about twice as fast.
 */
export const MONSTER_MOVE = { tilePx: 32, scale: (150 / 178) * 1.5 } as const;

export function enemySpeed(def: EnemyDef): number {
    const cuts = MONSTER_AI.attackTimeCuts;
    const averageCut = cuts.reduce((sum: number, cut: number) => sum + cut, 0) / cuts.length;
    const stepMs = Math.max(MONSTER_AI.minAttackIntervalMs, def.actionTimeMs - averageCut);
    return ((MONSTER_MOVE.tilePx * 1000) / stepMs) * MONSTER_MOVE.scale;
}

/** Mage-Orc fireballs: the Wyvern's look, one at a time, slow enough to dodge. Damage = its own dice. */
const ORC_FIREBALL: EnemyRangedAttack = {
    flyEffect: 'fx.fireBall.fly', explodeEffect: 'fx.fireBall.explode', sound: 'sfx.explosion', magicHitRatio: 45,
    cooldownMs: 0, range: 5 * 32, speed: 200, shots: 1, spreadDegrees: 0, radius: 10,
};

/** Dark Elf arrows (sp-client ArrowProjectile: effect.spr sheet 7, 2 frames per direction). Damage = its own dice. */
const ARROW: EnemyRangedAttack = {
    flyEffect: 'fx.arrow', physical: true, cooldownMs: 0, range: 8 * 32, speed: 420, shots: 1, spreadDegrees: 0, radius: 8,
};

export const ENEMIES = {
    // Minutos 0–2 (tier 1)
    slime: {
        movement: 'wander', name: 'Slime', sprite: 'enemy.slime', temporalCoefficient: 1, hasShadow: false, maxHp: 20, xp: 4, radius: 10, bodyOffsetY: 10,
        actionTimeMs: 2100, attackRange: 1, bravery: 1, damageDice: [1, 4], hitRatio: 30, hitSound: 'sfx.slime.hit', deathSound: 'sfx.slime.death', attackSound: 'sfx.slime.attack',
    },
    bunny: {
        name: 'Bunny', sprite: 'enemy.bunny', temporalCoefficient: 1, hasShadow: true, maxHp: 16, xp: 4, radius: 8, bodyOffsetY: 10,
        actionTimeMs: 1500, attackRange: 1, bravery: 2, damageDice: [1, 5], hitRatio: 35, hitSound: 'sfx.bunny.hit', deathSound: 'sfx.bunny.death', attackSound: 'sfx.bunny.attack',
    },
    // Fase 22C, solo en Traveler Zone. NPC.cfg Cat: ATime 1500, AttkRange 1, MinBrvy 3, 2d4, HR 45 (tier 1, algo más
    // duro que el Bunny).
    cat: {
        movement: 'flank', name: 'Cat', sprite: 'enemy.cat', temporalCoefficient: 1, hasShadow: false, maxHp: 20, xp: 4, radius: 9, bodyOffsetY: 10,
        actionTimeMs: 1500, attackRange: 1, bravery: 3, damageDice: [2, 4], hitRatio: 45, hitSound: 'sfx.cat.hit', deathSound: 'sfx.cat.death', attackSound: 'sfx.cat.attack',
    },
    ant: {
        name: 'Ant', sprite: 'enemy.ant', temporalCoefficient: 1, hasShadow: false, maxHp: 28, xp: 6, radius: 10, bodyOffsetY: 12,
        actionTimeMs: 1200, attackRange: 1, bravery: 2, damageDice: [2, 3], hitRatio: 40, hitSound: 'sfx.ant.hit', deathSound: 'sfx.ant.death', attackSound: 'sfx.ant.attack',
    },
    // Minutos 2–4 (tiers 1–4)
    orc: {
        movement: 'flank', name: 'Orc', sprite: 'enemy.orc', temporalCoefficient: 1, hasShadow: true, maxHp: 60, xp: 12, radius: 12, bodyOffsetY: 28,
        actionTimeMs: 1200, attackRange: 1, bravery: 2, damageDice: [3, 3], hitRatio: 60, hitSound: 'sfx.orc.hit', deathSound: 'sfx.orc.death', attackSound: 'sfx.orc.attack',
    },
    orcMage: {
        // "Orc (spellcaster)" de la wiki: mismo sprite y sonidos que el Orc, pero lanza bolas de fuego (su hechizo
        // Fire-Ball, magia 3). NPC.cfg Orc-Mage: ATime 1500, MinBrvy 3, 4d3; su AttkRange es 1 (el hechizo va aparte):
        // usamos 5 casillas para que lance desde lejos. Bola lenta para poder esquivarla.
        name: 'Mage-Orc', sprite: 'enemy.orc', temporalCoefficient: 1, hasShadow: true, maxHp: 80, xp: 16, radius: 12, bodyOffsetY: 28,
        actionTimeMs: 1500, attackRange: 5, bravery: 3, damageDice: [4, 3], hitRatio: 100, hitSound: 'sfx.orc.hit', deathSound: 'sfx.orc.death', attackSound: 'sfx.orc.attack',
        attackProjectile: ORC_FIREBALL,
    },
    snake: {
        movement: 'flank', name: 'Snake', sprite: 'enemy.snake', temporalCoefficient: 0.5, hasShadow: false, maxHp: 40, xp: 8, radius: 9, bodyOffsetY: 8,
        actionTimeMs: 1000, attackRange: 1, bravery: 1, damageDice: [2, 4], hitRatio: 50, hitSound: 'sfx.snake.hit', deathSound: 'sfx.snake.death', attackSound: 'sfx.snake.attack',
    },
    scorpion: {
        name: 'Scorpion', sprite: 'enemy.scorpion', temporalCoefficient: 0.5, hasShadow: false, maxHp: 150, xp: 30, radius: 12, bodyOffsetY: 12,
        actionTimeMs: 1200, attackRange: 1, bravery: 3, damageDice: [5, 3], hitRatio: 70, hitSound: 'sfx.scorpion.hit', deathSound: 'sfx.scorpion.death', attackSound: 'sfx.scorpion.attack',
    },
    frog: {
        // sp-client: la animación de andar son los frames 3–7 de la hoja.
        name: 'Giant Frog', sprite: 'enemy.frog', temporalCoefficient: 1, hasShadow: true, maxHp: 360, xp: 72, radius: 14, bodyOffsetY: 16,
        actionTimeMs: 900, attackRange: 2, bravery: 4, damageDice: [7, 5], hitRatio: 145, hitSound: 'sfx.frog.hit', deathSound: 'sfx.frog.death', attackSound: 'sfx.frog.attack',
        animations: { move: { sheet: 8, firstFrame: 3, frameCount: 5 } },
    },
    // Minutos 4–6 (tiers 2–6)
    skeleton: {
        name: 'Skeleton', sprite: 'enemy.skeleton', temporalCoefficient: 0.5, hasShadow: true, maxHp: 180, xp: 36, radius: 11, bodyOffsetY: 30,
        actionTimeMs: 800, attackRange: 2, bravery: 100, damageDice: [5, 4], hitRatio: 90, hitSound: 'sfx.skeleton.hit', deathSound: 'sfx.skeleton.death', attackSound: 'sfx.skeleton.attack',
    },
    zombie: {
        movement: 'wander', name: 'Zombie', sprite: 'enemy.zombie', temporalCoefficient: 0.5, hasShadow: true, maxHp: 120, xp: 24, radius: 11, bodyOffsetY: 30,
        actionTimeMs: 1500, attackRange: 1, bravery: 100, damageDice: [4, 4], hitRatio: 85, hitSound: 'sfx.zombie.hit', deathSound: 'sfx.zombie.death', attackSound: 'sfx.zombie.attack',
    },
    // Golems (tier 3). NPC.cfg Clay-Golem y Stone-Golem: ATime 1200, alcance 1, MinBrvy 100, 7d4. sp-client: 0,5.
    clayGolem: {
        movement: 'wander', name: 'Clay Golem', sprite: 'enemy.clayGolem', temporalCoefficient: 0.5, hasShadow: true, maxHp: 240, xp: 48, radius: 15, bodyOffsetY: 34,
        actionTimeMs: 1200, attackRange: 1, bravery: 100, damageDice: [7, 4], hitRatio: 135, hitSound: 'sfx.clayGolem.hit', deathSound: 'sfx.clayGolem.death', attackSound: 'sfx.clayGolem.attack',
    },
    stoneGolem: {
        movement: 'wander', name: 'Stone Golem', sprite: 'enemy.stoneGolem', temporalCoefficient: 0.5, hasShadow: true, maxHp: 300, xp: 60, radius: 15, bodyOffsetY: 34,
        actionTimeMs: 1200, attackRange: 1, bravery: 100, damageDice: [7, 4], hitRatio: 135, hitSound: 'sfx.stoneGolem.hit', deathSound: 'sfx.stoneGolem.death', attackSound: 'sfx.stoneGolem.attack',
    },
    direBoar: {
        name: 'Dire Boar', sprite: 'enemy.direBoar', temporalCoefficient: 1, hasShadow: false, maxHp: 280, xp: 56, radius: 16, bodyOffsetY: 18,
        actionTimeMs: 800, attackRange: 1, bravery: 100, damageDice: [8, 8], hitRatio: 230, hitSound: 'sfx.direBoar.hit', deathSound: 'sfx.direBoar.death', attackSound: 'sfx.direBoar.attack',
    },
    // Minutos 6–8 (tiers 5–7)
    troll: {
        name: 'Troll', sprite: 'enemy.troll', temporalCoefficient: 1, hasShadow: true, maxHp: 460, xp: 92, radius: 16, bodyOffsetY: 34,
        actionTimeMs: 700, attackRange: 1, bravery: 100, damageDice: [8, 5], hitRatio: 200, hitSound: 'sfx.troll.hit', deathSound: 'sfx.troll.death', attackSound: 'sfx.troll.attack',
    },
    ogre: {
        name: 'Ogre', sprite: 'enemy.ogre', temporalCoefficient: 1, hasShadow: true, maxHp: 1040, xp: 208, radius: 18, bodyOffsetY: 40,
        actionTimeMs: 700, attackRange: 3, bravery: 100, damageDice: [8, 7], hitRatio: 230, hitSound: 'sfx.ogre.hit', deathSound: 'sfx.ogre.death', attackSound: 'sfx.ogre.attack',
    },
    stalker: {
        movement: 'flank', name: 'Stalker', sprite: 'enemy.stalker', temporalCoefficient: 1, hasShadow: true, maxHp: 420, xp: 84, radius: 13, bodyOffsetY: 32,
        actionTimeMs: 600, attackRange: 4, bravery: 100, damageDice: [8, 9], hitRatio: 300, hitSound: 'sfx.orc.hit', deathSound: 'sfx.orc.death', attackSound: 'sfx.orc.attack',
    },
    werewolf: {
        movement: 'flank', name: 'Werewolf', sprite: 'enemy.werewolf', temporalCoefficient: 1, hasShadow: true, maxHp: 540, xp: 108, radius: 14, bodyOffsetY: 32,
        actionTimeMs: 700, attackRange: 1, bravery: 100, damageDice: [8, 8], hitRatio: 300, hitSound: 'sfx.werewolf.hit', deathSound: 'sfx.werewolf.death', attackSound: 'sfx.werewolf.attack',
    },
    // Minutos 8–10 (tiers 4–7)
    cyclops: {
        name: 'Cyclops', sprite: 'enemy.cyclops', temporalCoefficient: 0.5, hasShadow: true, maxHp: 800, xp: 160, radius: 18, bodyOffsetY: 44,
        actionTimeMs: 1200, attackRange: 3, bravery: 805, damageDice: [8, 6], hitRatio: 180, hitSound: 'sfx.cyclops.hit', deathSound: 'sfx.cyclops.death', attackSound: 'sfx.cyclops.attack',
    },
    // Propios de Bleeding Isle (tiers 5–7). NPC.cfg Cannibal-Plant: ATime 800, alcance 2, 8d8.
    // NPC.cfg Mountain-Giant: ATime 700, alcance 2, 8d7.
    cannibalPlant: {
        name: 'Cannibal Plant', sprite: 'enemy.cannibalPlant', temporalCoefficient: 1, hasShadow: true, maxHp: 900, xp: 180, radius: 16, bodyOffsetY: 36,
        actionTimeMs: 800, attackRange: 2, bravery: 100, damageDice: [8, 8], hitRatio: 230, hitSound: 'sfx.cannibalPlant.hit', deathSound: 'sfx.cannibalPlant.death', attackSound: 'sfx.cannibalPlant.attack',
    },
    // Elvine Garden (Fase 22D). sp-client: Giant Tree = giantplant.spr, sonidos M120–M123, sin animación especial.
    // NPC.cfg (centuu/HelbreathServer) lo llama Giant-Plant: ATime 700, alcance 2, MinBrvy 100, 8d6, HR 200. Tier 6.
    giantTree: {
        name: 'Giant Tree', sprite: 'enemy.giantTree', temporalCoefficient: 1, hasShadow: true, maxHp: 760, xp: 152, radius: 16, bodyOffsetY: 40,
        actionTimeMs: 700, attackRange: 2, bravery: 100, damageDice: [8, 6], hitRatio: 200, hitSound: 'sfx.giantTree.hit', deathSound: 'sfx.giantTree.death', attackSound: 'sfx.giantTree.attack',
    },
    mountainGiant: {
        name: 'Mountain Giant', sprite: 'enemy.mountainGiant', temporalCoefficient: 1, hasShadow: true, maxHp: 1300, xp: 260, radius: 20, bodyOffsetY: 50,
        actionTimeMs: 700, attackRange: 2, bravery: 100, damageDice: [8, 7], hitRatio: 230, hitSound: 'sfx.mountainGiant.hit', deathSound: 'sfx.mountainGiant.death', attackSound: 'sfx.mountainGiant.attack',
    },
    lich: {
        name: 'Lich', sprite: 'enemy.lich', temporalCoefficient: 1, hasShadow: true, maxHp: 680, xp: 136, radius: 14, bodyOffsetY: 36,
        actionTimeMs: 700, attackRange: 5, bravery: 100, damageDice: [8, 6], hitRatio: 230, hitSound: 'sfx.lich.hit', deathSound: 'sfx.lich.death', attackSound: 'sfx.lich.attack',
    },
    hellhound: {
        movement: 'flank', name: 'Hellhound', sprite: 'enemy.hellhound', temporalCoefficient: 0.5, hasShadow: true, maxHp: 540, xp: 108, radius: 13, bodyOffsetY: 18,
        actionTimeMs: 900, attackRange: 1, bravery: 4, damageDice: [7, 5], hitRatio: 200, hitSound: 'sfx.hellhound.hit', deathSound: 'sfx.hellhound.death', attackSound: 'sfx.hellhound.attack',
    },
    // Desactivado (Fase 13): no sale en ninguna oleada ni como esbirro. Se deja para volver a usarlo más adelante.
    darkElf: {
        // Dispara flechas (NPC.cfg: alcance 8; servidor: "Dark Elf: 활 공격", ataque de arco).
        name: 'Dark Elf', sprite: 'enemy.darkElf', temporalCoefficient: 1, hasShadow: true, maxHp: 640, xp: 128, radius: 11, bodyOffsetY: 32,
        actionTimeMs: 700, attackRange: 8, bravery: 100, damageDice: [8, 4], hitRatio: 450, attackProjectile: ARROW,
        hitSound: 'sfx.darkElf.hit', deathSound: 'sfx.darkElf.death', attackSound: 'sfx.darkElf.attack',
    },
    // Minutos 10–12 (tiers 8–10)
    gargoyle: {
        name: 'Gargoyle', sprite: 'enemy.gargoyle', temporalCoefficient: 1, hasShadow: true, maxHp: 1120, xp: 224, radius: 18, bodyOffsetY: 44,
        actionTimeMs: 700, attackRange: 5, bravery: 100, damageDice: [13, 10], hitRatio: 500, hitSound: 'sfx.cyclops.hit', deathSound: 'sfx.direBoar.death', attackSound: 'sfx.gargoyle.attack',
    },
    hellclaw: {
        name: 'Hellclaw', sprite: 'enemy.hellclaw', temporalCoefficient: 1, hasShadow: true, maxHp: 1300, xp: 260, radius: 20, bodyOffsetY: 44,
        actionTimeMs: 600, attackRange: 5, bravery: 100, damageDice: [15, 14], hitRatio: 1000, hitSound: 'sfx.cyclops.hit', deathSound: 'sfx.cyclops.death', attackSound: 'sfx.cyclops.attack',
    },
    tigerworm: {
        name: 'Tigerworm', sprite: 'enemy.tigerworm', temporalCoefficient: 1, hasShadow: false, maxHp: 1520, xp: 304, radius: 20, bodyOffsetY: 30,
        actionTimeMs: 600, attackRange: 6, bravery: 100, damageDice: [18, 17], hitRatio: 1200, hitSound: 'sfx.lich.hit', deathSound: 'sfx.lich.death', attackSound: 'sfx.tigerworm.attack',
    },
    minotaur: {
        name: 'Minotaur', sprite: 'enemy.minotaur', temporalCoefficient: 1, hasShadow: true, maxHp: 1400, xp: 280, radius: 18, bodyOffsetY: 44,
        actionTimeMs: 500, attackRange: 2, bravery: 100, damageDice: [13, 11], hitRatio: 500, hitSound: 'sfx.minotaur.hit', deathSound: 'sfx.minotaur.death', attackSound: 'sfx.minotaur.attack',
    },
    // Jefes
    ettin: {
        name: 'Ettin', sprite: 'enemy.ettin', temporalCoefficient: 1, hasShadow: true, maxHp: 1600, xp: 250, radius: 22, bodyOffsetY: 50,
        actionTimeMs: 700, attackRange: 3, bravery: 100, damageDice: [8, 9], hitRatio: 375, hitSound: 'sfx.ettin.hit', deathSound: 'sfx.ettin.death', attackSound: 'sfx.ettin.attack',
        // Animación de ataque un 40% más lenta (pedido por el propietario el 17-oct-2026).
        attackSpeed: 0.6, scale: 1.3, knockbackTaken: 0, damageScale: 0.5,
        boss: { title: 'Ettin', dropsChest: true, final: false },
    },
    demon: {
        name: 'Demon', sprite: 'enemy.demon', temporalCoefficient: 1, hasShadow: true, maxHp: 4000, xp: 500, radius: 24, bodyOffsetY: 56,
        actionTimeMs: 700, attackRange: 4, bravery: 100, damageDice: [10, 10], hitRatio: 500, hitSound: 'sfx.demon.hit', deathSound: 'sfx.demon.death', attackSound: 'sfx.demon.attack',
        scale: 1.3, knockbackTaken: 0, damageScale: 0.54,
        boss: { title: 'Demon', dropsChest: true, final: false },
    },
    // Jefes de Traveler Zone (Fase 22A, mapa de introducción). El Stone Golem jefe es el de siempre, más grande y con más
    // vida; pega flojo para ser el primer jefe que ve un jugador nuevo.
    stoneGolemBoss: {
        name: 'Stone Golem', sprite: 'enemy.stoneGolem', temporalCoefficient: 0.5, hasShadow: true, maxHp: 2500, xp: 120, radius: 20, bodyOffsetY: 44,
        actionTimeMs: 1200, attackRange: 1, bravery: 100, damageDice: [7, 4], hitRatio: 135, hitSound: 'sfx.stoneGolem.hit', deathSound: 'sfx.stoneGolem.death', attackSound: 'sfx.stoneGolem.attack',
        scale: 1.4, knockbackTaken: 0, damageScale: 0.35,
        boss: { title: 'Stone Golem', dropsChest: true, final: false },
    },
    // Muñeco de prácticas del original (dummy.spr, 40 hojas estándar de 4 frames; 200.000 de vida y no ataca). Aquí
    // (propietario, 20-oct-2026) es el jefe final de Traveler Zone: anda muy despacio y pega, pero siempre 1 de daño.
    // Sin sonidos propios en sp-client: los del Clay Golem. ATime nuestro (2600 ms ≈ más lento que un Slime).
    dummy: {
        name: 'Dummy', sprite: 'enemy.dummy', temporalCoefficient: 0.5, hasShadow: true, maxHp: 5000, xp: 600, radius: 16, bodyOffsetY: 40,
        actionTimeMs: 2600, attackRange: 1, bravery: 100, damageDice: [1, 1], hitRatio: 100, hitSound: 'sfx.clayGolem.hit', deathSound: 'sfx.clayGolem.death', attackSound: 'sfx.clayGolem.attack',
        scale: 1.6, knockbackTaken: 0, fixedDamage: 1,
        boss: { title: 'Dummy', dropsChest: true, final: true },
    },
    // Jefes de Elvine Garden (Fase 22D, decididos por el propietario el 21-oct-2026): Hellhound y Stalker de minijefes y
    // Cyclops de jefe final. Mismo sprite y comportamiento que el normal (que no sale en este mapa), más grandes y con
    // vida de jefe. Medido con `check levelpaceelvine` (21-oct-2026): mueren en ~30 s / ~30 s / ~75 s (Bleeding Isle:
    // 21 / 25 / 61 s). damageScale subido para que cada golpe quite un 13–17% de la vida (con 0,5–0,6 era un 5–8%).
    hellhoundBoss: {
        name: 'Hellhound', sprite: 'enemy.hellhound', temporalCoefficient: 0.5, hasShadow: true, maxHp: 2600, xp: 300, radius: 18, bodyOffsetY: 26,
        actionTimeMs: 900, attackRange: 1, bravery: 100, damageDice: [7, 5], hitRatio: 200, hitSound: 'sfx.hellhound.hit', deathSound: 'sfx.hellhound.death', attackSound: 'sfx.hellhound.attack',
        scale: 1.5, knockbackTaken: 0, damageScale: 1.1,
        boss: { title: 'Hellhound', dropsChest: true, final: false },
    },
    stalkerBoss: {
        name: 'Stalker', sprite: 'enemy.stalker', temporalCoefficient: 1, hasShadow: true, maxHp: 5500, xp: 600, radius: 18, bodyOffsetY: 44,
        actionTimeMs: 600, attackRange: 4, bravery: 100, damageDice: [8, 9], hitRatio: 300, hitSound: 'sfx.orc.hit', deathSound: 'sfx.orc.death', attackSound: 'sfx.orc.attack',
        scale: 1.4, knockbackTaken: 0, damageScale: 0.9,
        boss: { title: 'Stalker', dropsChest: true, final: false },
    },
    cyclopsBoss: {
        name: 'Cyclops', sprite: 'enemy.cyclops', temporalCoefficient: 0.5, hasShadow: true, maxHp: 12000, xp: 1400, radius: 28, bodyOffsetY: 70,
        actionTimeMs: 1200, attackRange: 3, bravery: 100, damageDice: [8, 6], hitRatio: 180, hitSound: 'sfx.cyclops.hit', deathSound: 'sfx.cyclops.death', attackSound: 'sfx.cyclops.attack',
        scale: 1.6, knockbackTaken: 0, damageScale: 1.2,
        boss: { title: 'Cyclops', dropsChest: true, final: true },
    },
    // Middleland (Fase 22E, monstruos y jefes elegidos por el propietario el 21-oct-2026). El Ettin normal es otro id
    // porque `ettin` es el jefe de Bleeding Isle. NPC.cfg Ettin: ATime 700, alcance 3, 8d9, HR 350. Tier 8.
    ettinRegular: {
        name: 'Ettin', sprite: 'enemy.ettin', temporalCoefficient: 1, hasShadow: true, maxHp: 1600, xp: 320, radius: 20, bodyOffsetY: 46,
        actionTimeMs: 700, attackRange: 3, bravery: 100, damageDice: [8, 9], hitRatio: 350, hitSound: 'sfx.ettin.hit', deathSound: 'sfx.ettin.death', attackSound: 'sfx.ettin.attack',
        attackSpeed: 0.6,
    },
    // Jefes de Middleland: Mountain Giant (min 4), Giant Lizard (min 8), Ettin Berserk (min 12) y Unicorn (final, min 15).
    // NPC.cfg Mountain-Giant: ATime 700, alcance 2, 8d7, HR 230.
    mountainGiantBoss: {
        name: 'Mountain Giant', sprite: 'enemy.mountainGiant', temporalCoefficient: 1, hasShadow: true, maxHp: 3500, xp: 400, radius: 24, bodyOffsetY: 66,
        actionTimeMs: 700, attackRange: 2, bravery: 100, damageDice: [8, 7], hitRatio: 230, hitSound: 'sfx.mountainGiant.hit', deathSound: 'sfx.mountainGiant.death', attackSound: 'sfx.mountainGiant.attack',
        scale: 1.4, knockbackTaken: 0, damageScale: 1,
        boss: { title: 'Mountain Giant', dropsChest: true, final: false },
    },
    // sp-client: giantlizard.spr, sonidos M124–M127, sin animación especial. NPC.cfg Giant-Lizard: ATime 600, alcance 2,
    // 10d10, HR 400 (la wiki le da además una embestida, que aquí no se copia).
    giantLizard: {
        name: 'Giant Lizard', sprite: 'enemy.giantLizard', temporalCoefficient: 1, hasShadow: true, maxHp: 7000, xp: 800, radius: 24, bodyOffsetY: 40,
        actionTimeMs: 600, attackRange: 2, bravery: 100, damageDice: [10, 10], hitRatio: 400, hitSound: 'sfx.giantLizard.hit', deathSound: 'sfx.giantLizard.death', attackSound: 'sfx.giantLizard.attack',
        scale: 1.4, knockbackTaken: 0, damageScale: 0.6,
        boss: { title: 'Giant Lizard', dropsChest: true, final: false },
    },
    // El Ettin de siempre en "Berserk": rojo como los élites, ataca a ritmo normal (el de Bleeding Isle va un 40% más
    // lento) y pega más.
    ettinBerserk: {
        name: 'Berserk Ettin', sprite: 'enemy.ettin', temporalCoefficient: 1, hasShadow: true, maxHp: 11000, xp: 1200, radius: 24, bodyOffsetY: 56,
        actionTimeMs: 700, attackRange: 3, bravery: 100, damageDice: [8, 9], hitRatio: 350, hitSound: 'sfx.ettin.hit', deathSound: 'sfx.ettin.death', attackSound: 'sfx.ettin.attack',
        scale: 1.5, knockbackTaken: 0, damageScale: 0.9, glows: true,
        boss: { title: 'Berserk Ettin', dropsChest: true, final: false },
    },
    // sp-client: unicorn.spr, quieto con 4 frames por hoja; sonidos M63–M66. NPC.cfg Unicorn: ATime 700, alcance 4,
    // 10d10, HR 500, magia nivel 8 (la wiki: Energy Strike y parálisis). Aquí lanza rayos de Energy Strike (nuestros).
    unicorn: {
        name: 'Unicorn', sprite: 'enemy.unicorn', temporalCoefficient: 1, hasShadow: false, maxHp: 20000, xp: 2000, radius: 26, bodyOffsetY: 56,
        actionTimeMs: 700, attackRange: 4, bravery: 100, damageDice: [10, 10], hitRatio: 500, hitSound: 'sfx.unicorn.hit', deathSound: 'sfx.unicorn.death', attackSound: 'sfx.unicorn.attack',
        scale: 1.6, knockbackTaken: 0, damageScale: 0.5,
        animations: { idle: { sheet: 0, firstFrame: 0, frameCount: 4 } },
        boss: {
            title: 'Unicorn', dropsChest: true, final: true,
            ranged: {
                flyEffect: 'fx.energyStrike.fly', explodeEffect: 'fx.energyBolt.explode', sound: 'sfx.energyBolt.impact',
                magicHitRatio: 85, damage: 10, cooldownMs: 2200, range: 520, speed: 260, shots: 5, spreadDegrees: 50, radius: 10,
            },
        },
    },
    fireWyvern: {
        // sp-client: andar = hojas 8+ estándar; ataque = hoja 0 desde el frame 3, 4 frames (otros valores rompen Phaser);
        // morir = hojas 16+ (no 32); opacidad 0,7. No tiene sonido de golpe: usamos el de la Liche.
        // NPC.cfg: se usa la fila del Wyvern (la del Fire-Wyvern viene desalineada). Además lanza bolas de fuego (nuestras).
        name: 'Fire Wyvern', sprite: 'enemy.fireWyvern', temporalCoefficient: 1, hasShadow: true, maxHp: 10000, xp: 1200, radius: 30, bodyOffsetY: 70,
        actionTimeMs: 600, attackRange: 7, bravery: 100, damageDice: [20, 18], hitRatio: 1300, hitSound: 'sfx.lich.hit', deathSound: 'sfx.wyvern.death', attackSound: 'sfx.wyvern.attack',
        scale: 1.15, alpha: 0.85, knockbackTaken: 0, damageScale: 0.25,
        animations: { idle: { sheet: 0, firstFrame: 0, frameCount: 4 }, attack: { sheet: 0, firstFrame: 3, frameCount: 4 }, dead: { sheet: 16 } },
        boss: {
            title: 'Fire Wyvern', dropsChest: true, final: true,
            ranged: {
                flyEffect: 'fx.fireBall.fly', explodeEffect: 'fx.fireBall.explode', sound: 'sfx.explosion',
                magicHitRatio: 80, damage: 9, cooldownMs: 2600, range: 520, speed: 230, shots: 3, spreadDegrees: 30, radius: 12,
            },
        },
    },
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;

/**
 * Monsters common to every map, weakest first (chosen by the owner on 18-oct-2026). Each map adds its own, stronger
 * and fewer (data/maps.ts → localEnemies), and its bosses. The rest of ENEMIES stays here for future maps.
 */
export const ESSENTIAL_ENEMIES: readonly EnemyId[] = [
    'slime', 'ant', 'snake', 'orc', 'orcMage', 'zombie', 'scorpion', 'skeleton', 'clayGolem', 'stoneGolem', 'frog',
];

export function getEnemy(id: EnemyId): EnemyDef {
    return ENEMIES[id];
}

/** Monsters a boss calls to its side while it lives (they appear in a ring around it). */
export interface BossMinions {
    /** One of these, at random (only those already downloaded), for each place of the ring. */
    enemies: readonly EnemyId[];
    /** Time between two calls (ms); the first one comes this long after the boss appears. */
    everyMs: number;
    /** Monsters per call. */
    count: number;
    /** No call while this many of its monsters are still alive. */
    maxAlive: number;
    /** Distance of the ring from the boss (px). */
    radius: number;
}

// Fase 13: el jefe final corta las oleadas; solo quedan él y sus esbirros (los del último tramo antes de él).
export const BOSS_MINIONS: Partial<Record<EnemyId, BossMinions>> = {
    fireWyvern: { enemies: ['stoneGolem', 'frog'], everyMs: 8000, count: 6, maxAlive: 24, radius: 110 },
    // Traveler Zone: el Dummy no se queda solo; lo rodean bichos flojos mientras le pegas.
    dummy: { enemies: ['slime', 'bunny', 'cat', 'ant'], everyMs: 6000, count: 8, maxAlive: 40, radius: 110 },
    // Elvine Garden: el Cyclops llama a los más duros del jardín.
    cyclopsBoss: { enemies: ['troll', 'giantTree', 'orcMage'], everyMs: 8000, count: 6, maxAlive: 24, radius: 120 },
    // Middleland: el Unicorn llama a Stalkers y Werewolf.
    unicorn: { enemies: ['stalker', 'werewolf'], everyMs: 8000, count: 6, maxAlive: 24, radius: 130 },
};
