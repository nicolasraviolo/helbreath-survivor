// Helbreath Off (Fase Off-8B): el Guerrero mercenario. Decisiones del propietario (8-nov-2026):
// - Lo contrata William, quieto junto al teleport de la ciudad. **Un mercenario a la vez**, con **pago único** de
//   oro según tu nivel: se queda contigo hasta que lo despides o contratas otro.
// - Hace de tanque: mucha vida y defensa, daño medio, y su equipo mejora con tu nivel (OFF_MERCENARY_GEAR).
// - Te sigue si te alejas y aparece a tu lado si te alejas muchísimo (o al cambiar de mapa).
// - Si cae, queda **inconsciente 45 s** y se levanta con media vida.
// - Lo que mata él te da **la mitad de experiencia**; el oro y el botín, enteros.
// - Tus magias de apoyo (Heal, Great Heal, Defense Shield, Protection From Magic) se le pueden lanzar: clic sobre él, o
//   con el mando, el stick derecho apuntándole mientras la magia está lista.
// Sus stats crecen con tu nivel como un Guerrero que lo pone todo en STR, VIT y DEX (los números son nuestros).
import type { CharacterLook } from '../../data/appearance';
import { FIXED_CHARACTERS } from '../../data/characterSlots';
import type { DyeColorId, WornColors } from '../../data/dyes';
import type { OffEquipment } from './offItems';
import type { OffStats } from './offCharacter';

export type OffMercenaryId = 'warrior';

export const OFF_MERCENARY_IDS: readonly OffMercenaryId[] = ['warrior'];

export function isOffMercenaryId(id: unknown): id is OffMercenaryId {
    return typeof id === 'string' && (OFF_MERCENARY_IDS as readonly string[]).includes(id);
}

export interface OffMercenaryDef {
    /** Its own name (over its head and in the messages)... */
    name: string;
    /** ...and what it is (the Mercenaries window: "Gorn the Warrior"). */
    kind: string;
    /** Price: this much gold × your level, paid once. */
    pricePerLevel: number;
    /** Its stats at your level: base + perLevel × level (INT and MAG stay at the base). */
    statBase: number;
    statPerLevel: Readonly<Pick<OffStats, 'str' | 'vit' | 'dex'>>;
    /** Its health is the original's formula for its stats, times this (a tank). */
    hpFactor: number;
    /** Its blows' damage, times this ("medium" damage). */
    damageFactor: number;
    /** Extra defence on top of 2 × DEX and its armour. */
    defenseBonus: number;
}

export const OFF_MERCENARIES: Readonly<Record<OffMercenaryId, OffMercenaryDef>> = {
    warrior: {
        // The owner (8-nov-2026): a name, not just "Warrior". Gorn, the Survivors warrior (data/characterSlots.ts).
        name: 'Gorn',
        kind: 'Warrior',
        pricePerLevel: 100,
        statBase: 12,
        statPerLevel: { str: 1, vit: 1.2, dex: 0.8 },
        hpFactor: 1.5,
        damageFactor: 0.7,
        defenseBonus: 20,
    },
};

/**
 * Its gear by your level: the last row whose `fromLevel` you have reached (one hand and a shield, as a tank). Always a
 * cape and long boots, both in OFF_MERCENARY_DYE (the owner, 8-nov-2026: some personality).
 */
export const OFF_MERCENARY_GEAR: readonly { fromLevel: number; equipment: Readonly<OffEquipment> }[] = [
    { fromLevel: 1, equipment: { weapon: 'shortSword', shield: 'woodShield', body: 'leatherArmor', boots: 'longBoots', cape: 'cape' } },
    { fromLevel: 10, equipment: { weapon: 'longSword', shield: 'leatherShield', body: 'leatherArmor', legs: 'chainHose', boots: 'longBoots', cape: 'cape' } },
    { fromLevel: 20, equipment: { weapon: 'scimitar', shield: 'targeShield', body: 'scaleMail', legs: 'chainHose', boots: 'longBoots', helm: 'helmet', cape: 'cape' } },
    { fromLevel: 35, equipment: { weapon: 'falchion', shield: 'ironShield', body: 'chainMail', legs: 'plateLeggings', boots: 'longBoots', helm: 'helmet', cape: 'cape' } },
    { fromLevel: 50, equipment: { weapon: 'warAxe', shield: 'knightShield', body: 'chainMail', legs: 'plateLeggings', boots: 'longBoots', helm: 'fullHelmet', cape: 'cape' } },
    { fromLevel: 70, equipment: { weapon: 'warAxe', shield: 'towerShield', body: 'plateMail', legs: 'plateLeggings', boots: 'longBoots', helm: 'fullHelmet', cape: 'cape' } },
];

/** How it behaves (tiles, ms and shares). */
export const OFF_MERCENARY = {
    /** Farther than this from you (tiles) and with nothing to fight, it walks back to you. */
    followTiles: 4,
    /** It stops this close to you when following. */
    followStopTiles: 2,
    /** It runs (instead of walking) while farther than this from you. */
    runTiles: 5,
    /** Farther than this from you, it appears at your side at once. */
    teleportTiles: 22,
    /** It looks for monsters this close to itself... */
    guardTiles: 6,
    /** ...and never chases one farther than this from you. */
    leashTiles: 10,
    /** Down for this long, then it stands up with this share of its health. */
    downMs: 45_000,
    standUpHpShare: 0.5,
    /** Out of a fight, it gets back this share of its health every `regenMs`. */
    regenShare: 0.03,
    regenMs: 3000,
    /** Its blow on a monster that was going for you makes the monster go for it instead, this often (it tanks). */
    tauntChance: 0.5,
    /** Share of a kill's experience you get when it lands the killing blow. */
    killExpShare: 0.5,
    /** Gamepad: the right stick picks it for a support spell when it is within this angle (degrees, each side)... */
    aimDegrees: 35,
    /** ...and this close (tiles). */
    aimRangeTiles: 10,
    /**
     * Following you or chasing a monster without getting a tile closer for this long, it gives up (the owner, 8-nov-2026:
     * it circled round you when you stood still; a monster it can't reach is left alone for `ignoreMs`).
     */
    stallMs: 2500,
    ignoreMs: 6000,
    /** Pathfinding when following (tiles of search). */
    pathMaxTiles: 60,
} as const;

/** Its body: Gorn's from Survivors (darker skin, other hair than the novice), so it isn't taken for you. */
export const OFF_MERCENARY_BODY: CharacterLook = FIXED_CHARACTERS.find((c) => c.name === 'Gorn')?.look ?? { gender: 'male', skin: 2, hairStyle: 2, hairColor: 0, underwear: 5 };

/** Colour of its cape and boots (a dye number, data/dyes.ts: 4 = Crimson). */
export const OFF_MERCENARY_DYE: DyeColorId = 4;
export const OFF_MERCENARY_COLORS: Readonly<WornColors> = { cape: OFF_MERCENARY_DYE, boots: OFF_MERCENARY_DYE };

/** How it looks over its head (name, health bar, ring when a support spell aims at it). */
export const OFF_MERCENARY_LOOK = {
    /** Name colour: friendly blue (monsters' are red). */
    nameColor: '#9fd4ff',
    bar: { width: 32, height: 4, gapAboveHead: 4, backColor: 0x081420, fillColor: 0x3fb04a, backAlpha: 0.8 },
    /** Height of the drawn body above the feet, for the name and bar (px). */
    headHeight: 78,
    nameGap: 2,
    /** "Down 45" while unconscious. */
    downColor: '#ffd166',
    /** The ring at its feet when a support spell will go to it. */
    ring: { radiusX: 18, radiusY: 9, color: 0x7fe0ff, lineWidth: 2, alpha: 0.9 },
    /** Damage it takes (orange, so it isn't confused with yours). */
    damageColor: '#ffa640',
} as const;

/** What the Mercenaries window and the world say. */
export const OFF_MERCENARY_TEXT = {
    npcName: 'William',
    npcLine: 'Need a sword at your side?\nI have brave men for hire.',
    title: 'Mercenaries',
    offer: (name: string, kind: string, level: number, price: number) => `${name} the ${kind} · Level ${level} · ${price} gold`,
    yourGold: (gold: number) => `You have ${gold} gold.`,
    hire: (name: string, price: number) => `Hire ${name} (${price} gold)`,
    hireShort: 'Not enough gold',
    dismiss: (name: string) => `Dismiss ${name}`,
    close: 'Close',
    hired: (name: string) => `${name} is now at your side.`,
    dismissed: (name: string) => `${name} has left you.`,
    noGold: 'You don\'t have enough gold.',
    down: (name: string) => `${name} is unconscious!`,
    up: (name: string) => `${name} stands up again.`,
    downLabel: (seconds: number) => `Down ${seconds}`,
    shieldOn: (spell: string, name: string) => `${spell} is on ${name}.`,
} as const;

/** Its stats at your level. */
export function offMercenaryStats(id: OffMercenaryId, level: number): OffStats {
    const def = OFF_MERCENARIES[id];
    const grow = (perLevel: number) => Math.floor(def.statBase + perLevel * level);
    return { str: grow(def.statPerLevel.str), vit: grow(def.statPerLevel.vit), dex: grow(def.statPerLevel.dex), int: def.statBase, mag: def.statBase };
}

/** Its gear at your level. */
export function offMercenaryGear(level: number): Readonly<OffEquipment> {
    let gear = OFF_MERCENARY_GEAR[0]?.equipment ?? {};
    for (const row of OFF_MERCENARY_GEAR) if (level >= row.fromLevel) gear = row.equipment;
    return gear;
}

/** What hiring it costs at your level. */
export function offMercenaryPrice(id: OffMercenaryId, level: number): number {
    return OFF_MERCENARIES[id].pricePerLevel * Math.max(1, level);
}
