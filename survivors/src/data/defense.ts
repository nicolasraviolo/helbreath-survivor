// Esquiva física (Fase 18A). Como en el original (reference/Server.cpp, iCalculateAttackEffect):
// - el monstruo tiene puntería (Hit Ratio, el de docs/hb-wiki/monstruos.md, en data/enemies.ts);
// - el jugador tiene defensa (Defense Ratio) = 2·Dex + la de cada pieza de armadura y escudo (data/armor.ts);
// - probabilidad de que el golpe acierte = 50·puntería / defensa (en %), con un mínimo y un máximo.
// Comprimido: la puntería original va de 30 a 1.300 y aquí la defensa no pasa de ~150, así que se usa
// hitScale × puntería^hitExponent (como MONSTER_DAMAGE con los dados). Objetivo: guerrero con Plate Mail,
// Tower Shield y casco → el Orc le acierta ~30%, el Werewolf ~70% y el Ettin ~80%. La Maga casi no esquiva.
// Las flechas también se esquivan; los hechizos no: para ellos está la resistencia mágica.
//
// Resistencia mágica (Fase 18B). Como en el original (bCheckResistingMagicSuccess):
// - el hechizo lleva puntería mágica (magicHitRatio, número nuestro: la wiki no lo da) en data/enemies.ts;
// - el jugador tiene resistencia mágica = Mag + la de su ropa y escudo (data/armor.ts). Fija: no sube sola;
// - probabilidad de que el hechizo entre = 50·puntería mágica / resistencia (en %), con los mismos límites.
//   Si no entra, no hace nada de daño (ni la mitad) y sale "Resist".
// Objetivo: a la Maga a media partida (Mag ~40 + Wizard Robe y Wizard Hat) le entran ~1/3 de las bolas del Mage-Orc;
// al guerrero bien equipado, ~3/4.
//
// Panel de stats y cartas: un % GENERAL (decisión del propietario: no hablar de un monstruo concreto), calculado
// contra un monstruo y un hechizo "típicos" (referenceHitRatio).

/** What the player has against monster attacks (blows and arrows, and spells). */
export interface PlayerDefense {
    defenseRatio: number;
    magicResistance: number;
}

export const DODGE = {
    /** Defense ratio per point of Dex (original: 2). */
    dexFactor: 2,
    /** A monster's hit ratio, compressed: hitScale × original^hitExponent. */
    hitScale: 8.3,
    hitExponent: 0.53,
    /** Original formula: hit % = hitPercentPerRatio × hit ratio / defense ratio. */
    hitPercentPerRatio: 50,
    /** A blow always has at least this chance to land, and never more than the maximum: nobody is untouchable. */
    minHitChance: 0.25,
    maxHitChance: 0.95,
    /** Original hit ratio of a "typical" monster, for the general dodge % of the stats panel and cards (Troll/Hellhound ~200, Orc 60). */
    referenceHitRatio: 150,
} as const;

/** Shown over the player when a spell is resisted. */
export const RESIST_TEXT = 'Resist';

export const MAGIC_RESIST = {
    /** Original formula: spell hit % = hitPercentPerRatio × magic hit ratio / magic resistance. */
    hitPercentPerRatio: 50,
    /** A spell always has at least this chance to land, and never more than the maximum. */
    minHitChance: 0.25,
    maxHitChance: 0.95,
    /** Magic hit ratio of a "typical" spell (the Mage-Orc's fireball), for the general resist % of the panel and cards. */
    referenceHitRatio: 45,
} as const;

/** The player's defense ratio: Dex plus the armor worn. */
export function playerDefenseRatio(dex: number, armorDefenseRatio: number): number {
    return DODGE.dexFactor * dex + armorDefenseRatio;
}

/** Chance (0..1) that a blow of a monster with this original hit ratio lands on a player with this defense ratio. */
export function hitChance(hitRatio: number, defenseRatio: number): number {
    if (defenseRatio <= 0) return DODGE.maxHitChance;
    const compressed = DODGE.hitScale * hitRatio ** DODGE.hitExponent;
    const chance = (DODGE.hitPercentPerRatio * compressed) / defenseRatio / 100;
    return Math.min(DODGE.maxHitChance, Math.max(DODGE.minHitChance, chance));
}

/** General chance (0..1) of dodging a blow, against a typical monster (stats panel and armor cards). */
export function dodgeChance(defenseRatio: number): number {
    return 1 - hitChance(DODGE.referenceHitRatio, defenseRatio);
}

/** The player's magic resistance: Magic plus the armor worn. */
export function playerMagicResistance(mag: number, armorMagicResistance: number): number {
    return mag + armorMagicResistance;
}

/** Chance (0..1) that a spell with this magic hit ratio affects a player with this magic resistance. */
export function spellHitChance(magicHitRatio: number, magicResistance: number): number {
    if (magicResistance <= 0) return MAGIC_RESIST.maxHitChance;
    const chance = (MAGIC_RESIST.hitPercentPerRatio * magicHitRatio) / magicResistance / 100;
    return Math.min(MAGIC_RESIST.maxHitChance, Math.max(MAGIC_RESIST.minHitChance, chance));
}

/** General chance (0..1) of resisting a spell, against a typical one (stats panel and armor cards). */
export function resistChance(magicResistance: number): number {
    return 1 - spellHitChance(MAGIC_RESIST.referenceHitRatio, magicResistance);
}
