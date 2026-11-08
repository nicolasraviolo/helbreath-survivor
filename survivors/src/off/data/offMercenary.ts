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
// Fase Off-8C (propietario, 8-nov-2026): la maga Kaila (la maga de Survivors), también de William. Poca vida, sube INT
// y MAG, no pega: se queda atrás y lanza magias con su maná. Propietario (8-nov-2026, después de verla):
// - Poco maná al principio, recuperado como un jugador del original × 2 (1d MAG cada 10 s en vez de cada 20 s).
// - Sabe las magias de OFF_MERCENARY_SPELLS cuya INT ya tiene (como la tienda): su INT empieza en 21 (Heal y Magic
//   Missile) y sube 1,3 por tu nivel, así que va ganando una de vez en cuando; Berserk (INT 59) llega a tu nivel 30.
// - Orden: curarte, curarse, escudo (Protection From Magic si en el pit hay monstruos que lanzan magia), Berserk,
//   Paralyze al monstruo que atacas si tiene vida para muchos golpes, Hold Person a otro si te atacan varios, daño.
// - Con un monstruo paralizado no lanza magias de daño (la romperían), salvo al que vaya a por ella.
import type { CharacterLook } from '../../data/appearance';
import { FIXED_CHARACTERS } from '../../data/characterSlots';
import type { DyeColorId, WornColors } from '../../data/dyes';
import type { OffEquipment } from './offItems';
import type { OffStats } from './offCharacter';
import { OFF_SPELLS, type OffSpellId } from './offSpells';

export type OffMercenaryId = 'warrior' | 'mage';

export const OFF_MERCENARY_IDS: readonly OffMercenaryId[] = ['warrior', 'mage'];

export function isOffMercenaryId(id: unknown): id is OffMercenaryId {
    return typeof id === 'string' && (OFF_MERCENARY_IDS as readonly string[]).includes(id);
}

export interface OffMercenaryDef {
    /** Its own name (over its head and in the messages)... */
    name: string;
    /** ...and what it is (the Mercenaries window: "Gorn the Warrior"). */
    kind: string;
    /** A tank that hits (the Warrior) or a caster that stays back (the Mage, Off-8C). */
    role: 'tank' | 'caster';
    /** Its body (skin, hair, gender). */
    body: CharacterLook;
    /** Price: this much gold × your level, paid once. */
    pricePerLevel: number;
    /** Its stats at your level: base + perLevel × level (a stat missing here stays at the base; `statStart` changes the base of some). */
    statBase: number;
    statStart?: Readonly<Partial<OffStats>>;
    statPerLevel: Readonly<Partial<OffStats>>;
    /** Its health is the original's formula for its stats, times this (a tank). */
    hpFactor: number;
    /** Its blows' damage, times this ("medium" damage). */
    damageFactor: number;
    /** Extra defence on top of 2 × DEX and its armour. */
    defenseBonus: number;
    /** Its gear by your level (OFF_MERCENARY_GEAR). */
    gear: readonly { fromLevel: number; equipment: Readonly<OffEquipment> }[];
}

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

/** The Mage's gear by your level: robes and hats, no weapon or shield (they stop spells). Cape and boots dyed too. */
export const OFF_MAGE_GEAR: readonly { fromLevel: number; equipment: Readonly<OffEquipment> }[] = [
    { fromLevel: 1, equipment: { boots: 'longBoots', cape: 'cape' } },
    { fromLevel: 20, equipment: { body: 'robe', boots: 'longBoots', cape: 'cape' } },
    { fromLevel: 80, equipment: { body: 'wizardRobe', boots: 'longBoots', cape: 'cape' } },
    { fromLevel: 90, equipment: { body: 'wizardRobe', helm: 'wizardCap', boots: 'longBoots', cape: 'cape' } },
    { fromLevel: 120, equipment: { body: 'wizardRobe', helm: 'wizardHat', boots: 'longBoots', cape: 'cape' } },
];

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
        role: 'tank',
        body: FIXED_CHARACTERS.find((c) => c.name === 'Gorn')?.look ?? { gender: 'male', skin: 2, hairStyle: 2, hairColor: 0, underwear: 5 },
        gear: OFF_MERCENARY_GEAR,
    },
    mage: {
        // Kaila, the Survivors mage (data/characterSlots.ts). Less health than you, no blows: spells only.
        name: 'Kaila',
        kind: 'Mage',
        pricePerLevel: 150,
        statBase: 12,
        // INT 21 at your level 1 (Heal and Magic Missile), 59 at 30 (Berserk). MAG low at first: little mana.
        statStart: { int: 20 },
        statPerLevel: { vit: 0.6, dex: 0.6, int: 1.3, mag: 1.6 },
        hpFactor: 0.9,
        damageFactor: 0.3,
        defenseBonus: 0,
        role: 'caster',
        body: FIXED_CHARACTERS.find((c) => c.name === 'Kaila')?.look ?? { gender: 'female', skin: 1, hairStyle: 4, hairColor: 2, underwear: 3 },
        gear: OFF_MAGE_GEAR,
    },
};

/**
 * The spells the Mage uses; she knows each one once her INT reaches its `reqInt` (as the shop). With her INT that is:
 * Heal and Magic Missile at your level 1, Energy Bolt 4, Defense Shield, Fire Ball and Hold Person 5, Great Heal 7,
 * Protection From Magic 10, Fire Strike 11, Paralyze 13, Lightning 21, Berserk 30.
 */
export const OFF_MERCENARY_SPELLS: readonly OffSpellId[] = [
    'heal', 'magicMissile', 'energyBolt', 'defenseShield', 'fireBall', 'holdPerson', 'greatHeal',
    'protectionFromMagic', 'fireStrike', 'paralyze', 'lightning', 'berserk',
];

/** Every spell the Mage knows with that INT. */
export function offMercenarySpells(int: number): OffSpellId[] {
    return OFF_MERCENARY_SPELLS.filter((id) => int >= OFF_SPELLS[id].reqInt);
}

/** How the Mage casts (tiles, shares and ms; our numbers). */
export const OFF_MERCENARY_CASTER = {
    /** It casts at monsters from this far (and walks closer when farther)... */
    castTiles: 6,
    /** ...and steps back when a monster going for it is this close. */
    keepAwayTiles: 2,
    /** It heals you (or itself) under this share of health... */
    healBelow: 0.55,
    /** ...and casts on you only within this many tiles. */
    supportTiles: 8,
    /** Mana back: 1d(MAG), as a player's batch (offManaRegen), every `manaRegenMs` (a player's is 20 s: twice as often). */
    manaRegenMs: 10_000,
    /** Damage spells only if this much mana stays for a heal afterwards (× the best heal's cost). */
    healReserve: 1,
    /** A monster that casts (the Cyclops) in the pit of a monster this close to you: Protection From Magic instead of Defense Shield. */
    casterNearTiles: 10,
    /** Paralyze the monster you attack only when its health is at least this many of your normal blows (not a Slime). */
    paralyzeMinBlows: 6,
    /** Hold Person on another monster when at least this many go for you at once. */
    holdWhenAttackers: 2,
    /** ...counting the ones this close to you. */
    attackersTiles: 3,
} as const;

/**
 * Off-8D: what it says over its head (white, as the original's chat), by line. A line missing for one of them is never
 * said by it (Gorn has no mana; Kaila needs no Berserk: she casts it herself).
 */
export type OffMercenaryLineId = 'healMe' | 'zerkMe' | 'noMana' | 'ownerLow' | 'down' | 'up' | 'hired';

export const OFF_MERCENARY_LINES: Readonly<Record<OffMercenaryId, Readonly<Partial<Record<OffMercenaryLineId, string>>>>> = {
    warrior: {
        healMe: 'Heal me!',
        zerkMe: 'Zerk me!',
        ownerLow: 'Drink a potion!',
        down: 'Ugh...',
        up: 'I\'m back!',
        hired: 'At your service!',
    },
    mage: {
        healMe: 'Heal me!',
        noMana: 'I\'m out of mana!',
        ownerLow: 'Hold on!',
        down: 'Ugh...',
        up: 'I\'m back!',
        hired: 'At your service!',
    },
};

/** When it talks (ms and shares; our numbers, the owner's plan of 8-nov-2026). */
export const OFF_MERCENARY_TALK = {
    /** A line stays over its head this long... */
    showMs: 3000,
    /** ...at least this long passes between two lines (falling, standing up and being hired don't wait)... */
    gapMs: 6000,
    /** ...and the same line is not said again for this long. */
    repeatMs: 20_000,
    /** "Heal me!" under this share of its health (Kaila only when she has no mana for a Heal herself). */
    healMeBelow: 0.35,
    /** "Drink a potion!" / "Hold on!" when you are under this share of your health. */
    ownerLowBelow: 0.25,
    /** "Zerk me!" (you know Berserk) on a monster with health for at least this many of your normal blows. */
    zerkMinBlows: 6,
    /** Its text over the name: font as the name's, white with a dark edge. */
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
    gap: 2,
} as const;

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
    /** Off-8D: walking round a paralysed monster to its back, it gives up (and hits from where it is) after this long without getting closer. */
    flankStallMs: 4000,
    /** Pathfinding when following (tiles of search). */
    pathMaxTiles: 60,
    /**
     * Off-8C (the owner: what a supporter does): with nothing to fight, it picks up what has lain on the ground this
     * long, this close to you, for your bag (not what you dropped).
     */
    lootWaitMs: 5000,
    lootTiles: 10,
} as const;

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
    npcLine: 'Need a sword or a spell at your side?\nI have brave fighters for hire.',
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
    /** Off-8C: it picked up loot for you. */
    pickedGold: (name: string, gold: number) => `${name} picked up ${gold} Gold.`,
    pickedItem: (name: string, item: string) => `${name} picked up ${item}.`,
    /** Off-8C: Berserk on it. */
    berserkOn: (name: string) => `${name} is in a berserk rage!`,
} as const;

/** Its stats at your level. */
export function offMercenaryStats(id: OffMercenaryId, level: number): OffStats {
    const def = OFF_MERCENARIES[id];
    const grow = (id: keyof OffStats) => Math.floor((def.statStart?.[id] ?? def.statBase) + (def.statPerLevel[id] ?? 0) * level);
    return { str: grow('str'), vit: grow('vit'), dex: grow('dex'), int: grow('int'), mag: grow('mag') };
}

/** Its gear at your level. */
export function offMercenaryGear(id: OffMercenaryId, level: number): Readonly<OffEquipment> {
    const rows = OFF_MERCENARIES[id].gear;
    let gear = rows[0]?.equipment ?? {};
    for (const row of rows) if (level >= row.fromLevel) gear = row.equipment;
    return gear;
}

/** What hiring it costs at your level. */
export function offMercenaryPrice(id: OffMercenaryId, level: number): number {
    return OFF_MERCENARIES[id].pricePerLevel * Math.max(1, level);
}
