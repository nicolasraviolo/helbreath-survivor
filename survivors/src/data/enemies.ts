// Contenido de enemigos.
// - Comportamiento REAL del original (NPC.cfg, ver docs/hb-wiki/monstruos-comportamiento.md): ritmo de acción,
//   alcance de ataque, valentía y dados de daño. La velocidad sale del ritmo (un paso por acción, enemySpeed).
// - Vida y XP son nuestras: siguen el ORDEN de la tabla por tiers de la wiki (docs/hb-wiki/monstruos.md),
//   comprimido para una partida de 12–15 min. Se ajustarán jugando.
// Sprites y sonidos: sp-client/src/constants/Monsters.ts.
import type { SoundKey, SpriteKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';

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
    /** Non-standard sheets / frames for moving, attacking and dying. */
    animations?: { idle?: EnemyAnimation; move?: EnemyAnimation; attack?: EnemyAnimation; dead?: EnemyAnimation };
    boss?: BossInfo;
}

/**
 * Damage of a monster blow: the original dice rolled, compressed for our health scale (originals go from 1d4 to 20d18):
 * scale × average^exponent × (roll / average). Keeps each monster's randomness and the order between them.
 */
export const MONSTER_DAMAGE = { scale: 1.97, exponent: 0.7 } as const;

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

/** Dark Elf arrows (sp-client ArrowProjectile: effect.spr sheet 7, 2 frames per direction). Damage = its own dice. */
const ARROW: EnemyRangedAttack = {
    flyEffect: 'fx.arrow', cooldownMs: 0, range: 8 * 32, speed: 420, shots: 1, spreadDegrees: 0, radius: 8,
};

export const ENEMIES = {
    // Minutos 0–2 (tier 1)
    slime: {
        name: 'Slime', sprite: 'enemy.slime', temporalCoefficient: 1, hasShadow: false, maxHp: 10, xp: 2, radius: 10, bodyOffsetY: 10,
        actionTimeMs: 2100, attackRange: 1, bravery: 1, damageDice: [1, 4], hitSound: 'sfx.slime.hit', deathSound: 'sfx.slime.death', attackSound: 'sfx.slime.attack',
    },
    bunny: {
        name: 'Bunny', sprite: 'enemy.bunny', temporalCoefficient: 1, hasShadow: true, maxHp: 8, xp: 1, radius: 8, bodyOffsetY: 10,
        actionTimeMs: 1500, attackRange: 1, bravery: 2, damageDice: [1, 5], hitSound: 'sfx.bunny.hit', deathSound: 'sfx.bunny.death', attackSound: 'sfx.bunny.attack',
    },
    ant: {
        name: 'Ant', sprite: 'enemy.ant', temporalCoefficient: 1, hasShadow: false, maxHp: 12, xp: 3, radius: 10, bodyOffsetY: 12,
        actionTimeMs: 1200, attackRange: 1, bravery: 2, damageDice: [2, 3], hitSound: 'sfx.ant.hit', deathSound: 'sfx.ant.death', attackSound: 'sfx.ant.attack',
    },
    // Minutos 2–4 (tiers 1–4)
    orc: {
        name: 'Orc', sprite: 'enemy.orc', temporalCoefficient: 1, hasShadow: true, maxHp: 30, xp: 5, radius: 12, bodyOffsetY: 28,
        actionTimeMs: 1200, attackRange: 1, bravery: 2, damageDice: [3, 3], hitSound: 'sfx.orc.hit', deathSound: 'sfx.orc.death', attackSound: 'sfx.orc.attack',
    },
    snake: {
        name: 'Snake', sprite: 'enemy.snake', temporalCoefficient: 0.5, hasShadow: false, maxHp: 20, xp: 4, radius: 9, bodyOffsetY: 8,
        actionTimeMs: 1000, attackRange: 1, bravery: 1, damageDice: [2, 4], hitSound: 'sfx.snake.hit', deathSound: 'sfx.snake.death', attackSound: 'sfx.snake.attack',
    },
    scorpion: {
        name: 'Scorpion', sprite: 'enemy.scorpion', temporalCoefficient: 0.5, hasShadow: false, maxHp: 40, xp: 6, radius: 12, bodyOffsetY: 12,
        actionTimeMs: 1200, attackRange: 1, bravery: 3, damageDice: [5, 3], hitSound: 'sfx.scorpion.hit', deathSound: 'sfx.scorpion.death', attackSound: 'sfx.scorpion.attack',
    },
    frog: {
        // sp-client: la animación de andar son los frames 3–7 de la hoja.
        name: 'Giant Frog', sprite: 'enemy.frog', temporalCoefficient: 1, hasShadow: true, maxHp: 55, xp: 8, radius: 14, bodyOffsetY: 16,
        actionTimeMs: 900, attackRange: 2, bravery: 4, damageDice: [7, 5], hitSound: 'sfx.frog.hit', deathSound: 'sfx.frog.death', attackSound: 'sfx.frog.attack',
        animations: { move: { sheet: 8, firstFrame: 3, frameCount: 5 } },
    },
    // Minutos 4–6 (tiers 2–6)
    skeleton: {
        name: 'Skeleton', sprite: 'enemy.skeleton', temporalCoefficient: 0.5, hasShadow: true, maxHp: 70, xp: 9, radius: 11, bodyOffsetY: 30,
        actionTimeMs: 800, attackRange: 2, bravery: 100, damageDice: [5, 4], hitSound: 'sfx.skeleton.hit', deathSound: 'sfx.skeleton.death', attackSound: 'sfx.skeleton.attack',
    },
    zombie: {
        name: 'Zombie', sprite: 'enemy.zombie', temporalCoefficient: 0.5, hasShadow: true, maxHp: 95, xp: 10, radius: 11, bodyOffsetY: 30,
        actionTimeMs: 1500, attackRange: 1, bravery: 100, damageDice: [4, 4], hitSound: 'sfx.zombie.hit', deathSound: 'sfx.zombie.death', attackSound: 'sfx.zombie.attack',
    },
    direBoar: {
        name: 'Dire Boar', sprite: 'enemy.direBoar', temporalCoefficient: 1, hasShadow: false, maxHp: 140, xp: 14, radius: 16, bodyOffsetY: 18,
        actionTimeMs: 800, attackRange: 1, bravery: 100, damageDice: [8, 8], hitSound: 'sfx.direBoar.hit', deathSound: 'sfx.direBoar.death', attackSound: 'sfx.direBoar.attack',
    },
    // Minutos 6–8 (tiers 5–7)
    troll: {
        name: 'Troll', sprite: 'enemy.troll', temporalCoefficient: 1, hasShadow: true, maxHp: 230, xp: 20, radius: 16, bodyOffsetY: 34,
        actionTimeMs: 700, attackRange: 1, bravery: 100, damageDice: [8, 5], hitSound: 'sfx.troll.hit', deathSound: 'sfx.troll.death', attackSound: 'sfx.troll.attack',
    },
    ogre: {
        name: 'Ogre', sprite: 'enemy.ogre', temporalCoefficient: 1, hasShadow: true, maxHp: 320, xp: 26, radius: 18, bodyOffsetY: 40,
        actionTimeMs: 700, attackRange: 3, bravery: 100, damageDice: [8, 7], hitSound: 'sfx.ogre.hit', deathSound: 'sfx.ogre.death', attackSound: 'sfx.ogre.attack',
    },
    stalker: {
        name: 'Stalker', sprite: 'enemy.stalker', temporalCoefficient: 1, hasShadow: true, maxHp: 210, xp: 22, radius: 13, bodyOffsetY: 32,
        actionTimeMs: 600, attackRange: 4, bravery: 100, damageDice: [8, 9], hitSound: 'sfx.orc.hit', deathSound: 'sfx.orc.death', attackSound: 'sfx.orc.attack',
    },
    werewolf: {
        name: 'Werewolf', sprite: 'enemy.werewolf', temporalCoefficient: 1, hasShadow: true, maxHp: 270, xp: 26, radius: 14, bodyOffsetY: 32,
        actionTimeMs: 700, attackRange: 1, bravery: 100, damageDice: [8, 8], hitSound: 'sfx.werewolf.hit', deathSound: 'sfx.werewolf.death', attackSound: 'sfx.werewolf.attack',
    },
    // Minutos 8–10 (tiers 4–7)
    cyclops: {
        name: 'Cyclops', sprite: 'enemy.cyclops', temporalCoefficient: 0.5, hasShadow: true, maxHp: 400, xp: 34, radius: 18, bodyOffsetY: 44,
        actionTimeMs: 1200, attackRange: 3, bravery: 805, damageDice: [8, 6], hitSound: 'sfx.cyclops.hit', deathSound: 'sfx.cyclops.death', attackSound: 'sfx.cyclops.attack',
    },
    lich: {
        name: 'Lich', sprite: 'enemy.lich', temporalCoefficient: 1, hasShadow: true, maxHp: 340, xp: 32, radius: 14, bodyOffsetY: 36,
        actionTimeMs: 700, attackRange: 5, bravery: 100, damageDice: [8, 6], hitSound: 'sfx.lich.hit', deathSound: 'sfx.lich.death', attackSound: 'sfx.lich.attack',
    },
    hellhound: {
        name: 'Hellhound', sprite: 'enemy.hellhound', temporalCoefficient: 0.5, hasShadow: true, maxHp: 270, xp: 28, radius: 13, bodyOffsetY: 18,
        actionTimeMs: 900, attackRange: 1, bravery: 4, damageDice: [7, 5], hitSound: 'sfx.hellhound.hit', deathSound: 'sfx.hellhound.death', attackSound: 'sfx.hellhound.attack',
    },
    // Desactivado (Fase 13): no sale en ninguna oleada ni como esbirro. Se deja para volver a usarlo más adelante.
    darkElf: {
        // Dispara flechas (NPC.cfg: alcance 8; servidor: "Dark Elf: 활 공격", ataque de arco).
        name: 'Dark Elf', sprite: 'enemy.darkElf', temporalCoefficient: 1, hasShadow: true, maxHp: 320, xp: 30, radius: 11, bodyOffsetY: 32,
        actionTimeMs: 700, attackRange: 8, bravery: 100, damageDice: [8, 4], attackProjectile: ARROW,
        hitSound: 'sfx.darkElf.hit', deathSound: 'sfx.darkElf.death', attackSound: 'sfx.darkElf.attack',
    },
    // Minutos 10–12 (tiers 8–10)
    gargoyle: {
        name: 'Gargoyle', sprite: 'enemy.gargoyle', temporalCoefficient: 1, hasShadow: true, maxHp: 560, xp: 45, radius: 18, bodyOffsetY: 44,
        actionTimeMs: 700, attackRange: 5, bravery: 100, damageDice: [13, 10], hitSound: 'sfx.cyclops.hit', deathSound: 'sfx.direBoar.death', attackSound: 'sfx.gargoyle.attack',
    },
    hellclaw: {
        name: 'Hellclaw', sprite: 'enemy.hellclaw', temporalCoefficient: 1, hasShadow: true, maxHp: 650, xp: 50, radius: 20, bodyOffsetY: 44,
        actionTimeMs: 600, attackRange: 5, bravery: 100, damageDice: [15, 14], hitSound: 'sfx.cyclops.hit', deathSound: 'sfx.cyclops.death', attackSound: 'sfx.cyclops.attack',
    },
    tigerworm: {
        name: 'Tigerworm', sprite: 'enemy.tigerworm', temporalCoefficient: 1, hasShadow: false, maxHp: 760, xp: 55, radius: 20, bodyOffsetY: 30,
        actionTimeMs: 600, attackRange: 6, bravery: 100, damageDice: [18, 17], hitSound: 'sfx.lich.hit', deathSound: 'sfx.lich.death', attackSound: 'sfx.tigerworm.attack',
    },
    minotaur: {
        name: 'Minotaur', sprite: 'enemy.minotaur', temporalCoefficient: 1, hasShadow: true, maxHp: 700, xp: 55, radius: 18, bodyOffsetY: 44,
        actionTimeMs: 500, attackRange: 2, bravery: 100, damageDice: [13, 11], hitSound: 'sfx.minotaur.hit', deathSound: 'sfx.minotaur.death', attackSound: 'sfx.minotaur.attack',
    },
    // Jefes
    ettin: {
        name: 'Ettin', sprite: 'enemy.ettin', temporalCoefficient: 1, hasShadow: true, maxHp: 2600, xp: 60, radius: 22, bodyOffsetY: 50,
        actionTimeMs: 700, attackRange: 3, bravery: 100, damageDice: [8, 9], hitSound: 'sfx.ettin.hit', deathSound: 'sfx.ettin.death', attackSound: 'sfx.ettin.attack',
        // Animación de ataque un 40% más lenta (pedido por el propietario el 17-oct-2026).
        attackSpeed: 0.6, scale: 1.3, knockbackTaken: 0.1,
        boss: { title: 'Ettin', dropsChest: true, final: false },
    },
    demon: {
        name: 'Demon', sprite: 'enemy.demon', temporalCoefficient: 1, hasShadow: true, maxHp: 6500, xp: 120, radius: 24, bodyOffsetY: 56,
        actionTimeMs: 700, attackRange: 4, bravery: 100, damageDice: [10, 10], hitSound: 'sfx.demon.hit', deathSound: 'sfx.demon.death', attackSound: 'sfx.demon.attack',
        scale: 1.3, knockbackTaken: 0.1,
        boss: { title: 'Demon', dropsChest: true, final: false },
    },
    fireWyvern: {
        // sp-client: andar = hojas 8+ estándar; ataque = hoja 0 desde el frame 3, 4 frames (otros valores rompen Phaser);
        // morir = hojas 16+ (no 32); opacidad 0,7. No tiene sonido de golpe: usamos el de la Liche.
        // NPC.cfg: se usa la fila del Wyvern (la del Fire-Wyvern viene desalineada). Además lanza bolas de fuego (nuestras).
        name: 'Fire Wyvern', sprite: 'enemy.fireWyvern', temporalCoefficient: 1, hasShadow: true, maxHp: 32000, xp: 500, radius: 30, bodyOffsetY: 70,
        actionTimeMs: 600, attackRange: 7, bravery: 100, damageDice: [20, 18], hitSound: 'sfx.lich.hit', deathSound: 'sfx.wyvern.death', attackSound: 'sfx.wyvern.attack',
        scale: 1.15, alpha: 0.85, knockbackTaken: 0,
        animations: { idle: { sheet: 0, firstFrame: 0, frameCount: 4 }, attack: { sheet: 0, firstFrame: 3, frameCount: 4 }, dead: { sheet: 16 } },
        boss: {
            title: 'Fire Wyvern', dropsChest: true, final: true,
            ranged: {
                flyEffect: 'fx.fireBall.fly', explodeEffect: 'fx.fireBall.explode', sound: 'sfx.explosion',
                damage: 22, cooldownMs: 2600, range: 520, speed: 230, shots: 3, spreadDegrees: 30, radius: 12,
            },
        },
    },
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;

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
    fireWyvern: { enemies: ['hellhound', 'skeleton'], everyMs: 8000, count: 6, maxAlive: 24, radius: 110 },
};
