// Hechizos activos del Mago (Fase 19B): los lanza el jugador con el mismo botón que el Critical Strike del Guerrero
// (Espacio, R2 del mando o el botón táctil). Fase 26A (propietario, 22-oct-2026): ya no tienen recarga; **gastan maná**,
// cada uno el suyo (el del original × ACTIVE_SPELL_MANA_SHARE). El maná se rellena solo con la Mag (data/stats.ts).
// Fase 20D (propietario, 19-oct-2026): se equipan en el segundo hueco de hechizo (data/items.ts). Son los círculos 6–10
// del original; los 1–5 son automáticos (data/spells.ts). Requisito: Int, sin Level. Energy Strike es el de salida y no
// pide nada.
// Fase 26C (propietario, 22-oct-2026): escalera de Int para ir abriendo hechizos poco a poco (los activos piden más):
// Energy Strike (gratis) → Ice Strike 50 → Mass Fire Strike 75 → Mass Ice Strike 100 → Bloody Shock Wave 120 (además
// hay que encontrar su Manual) → Meteor Strike 140 → Earth Shock Wave 165 → Blizzard 190. Los de hielo y tierra y
// Bloody Shock Wave llegan en los bloques 26D y 26E.
// Dos tipos:
// - 'meteor': Meteor Strike. Visual de sp-client/src/game/spells/MeteorStrike*.ts (ver hb/meteorStrike.ts). Daños
//   orientados por la wiki (docs/hb-wiki/hechizos.md, Circle 9: 33 directo + 55 en área), adaptados a un survivors.
// - 'barrage': una ráfaga de proyectiles de un hechizo de data/spells.ts que caen alrededor del punto elegido (Energy
//   Strike, Mass Fire Strike). Su daño es el del proyectil × `damageScale` × el multiplicador de Power.
import type { SoundKey, SpriteKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';
import { SPELLS, type SpellId } from './spells';

export type ActiveSpellId = 'energyStrike' | 'massFireStrike' | 'meteorStrike';

interface ActiveSpellBase {
    name: string;
    /** Circle of the original (6–10) and the permanent Int it needs (its ReqInt). */
    circle: number;
    int: number;
    /** Mana it costs in the original (docs/hb-wiki/hechizos.md); here it costs this × ACTIVE_SPELL_MANA_SHARE. */
    originalMana: number;
    /** Only goes off on enemies closer than this to the player (px); with none, it does not go off. */
    range: number;
    /** With the aim stick or dragging the touch button (Fase 26B), it falls this share of `range` away, that way. */
    stickShare: number;
    /** Length of the player's cast animation (ms). */
    castMs: number;
    /** Played when it is cast. */
    castSound?: SoundKey;
    /**
     * HUD orb of the spell. For now the Warrior's red orb (owner, 18-oct-2026: the Mage will have its own icon later).
     * Kept here so that changing it touches only this file.
     */
    hudIcon: 'crit';
}

export interface MeteorSpellDef extends ActiveSpellBase {
    kind: 'meteor';
    /** Sprite downloaded when a run with this spell starts (not before: it is big). */
    sprite: SpriteKey;
    /** Damage to the enemy it falls on, and to every enemy in the explosion, before the Power multiplier. */
    directDamage: number;
    areaDamage: number;
    /** Explosion radius in pixels; the enemy within `directRadius` of the centre also takes the direct damage. */
    areaRadius: number;
    directRadius: number;
    /** Push given to every enemy hit (px/s). */
    knockback: number;
    /** Camera shake when it lands. */
    shakePx: number;
    shakeMs: number;
    /** Played when it lands. */
    impactSound: SoundKey;
}

export interface BarrageSpellDef extends ActiveSpellBase {
    kind: 'barrage';
    /** Projectile (and explosion) of data/spells.ts it throws. */
    shot: SpellId;
    /** Projectiles thrown, one every `shotIntervalMs`, at random points up to `scatterRadius` px from the chosen one. */
    shots: number;
    shotIntervalMs: number;
    scatterRadius: number;
    /** Share of the projectile's own damage each one does, before the Power multiplier. */
    damageScale: number;
}

export type ActiveSpellDef = MeteorSpellDef | BarrageSpellDef;

/** Meteor Strike: what the falling meteor looks like (crueffect1.spr, as in sp-client). */
export interface MeteorLook {
    /** Effects drawn together while it falls, in this order (the meteor and its three orbs). */
    flight: readonly EffectKey[];
    /** Effects drawn together where it lands. */
    impact: readonly EffectKey[];
    /** Smoke left behind while it falls, one puff every `smokeEveryMs`. */
    smoke: EffectKey;
    smokeEveryMs: number;
    /** Small explosions scattered where it lands, up to `burstSpread` px from the centre (the original: 5, ±5 px). */
    burst: EffectKey;
    burstCount: number;
    burstSpread: number;
    /** It starts this far from where it lands (sp-client: +300 px right, −600 px up). */
    fromDx: number;
    fromDy: number;
    /** Falling speed (px/s): sp-client uses the projectile speed of the cast; this makes the fall last ~0.6 s. */
    speed: number;
}

export const METEOR_LOOK: MeteorLook = {
    flight: ['fx.meteor.fall', 'fx.meteor.blueOrb', 'fx.meteor.whiteOrb', 'fx.meteor.fireOrb'],
    impact: ['fx.meteor.impact', 'fx.meteor.groundExplosion', 'fx.meteor.explosion'],
    smoke: 'fx.meteor.smoke',
    smokeEveryMs: 30,
    burst: 'fx.meteor.burst',
    burstCount: 5,
    // Wider than the original's ±5 px, so they read as separate blasts.
    burstSpread: 24,
    fromDx: 300,
    fromDy: -600,
    speed: 1100,
};

/** Name, circle and requirement of a projectile spell of data/spells.ts, for its active version. */
function fromSpell(id: SpellId): Pick<ActiveSpellBase, 'name' | 'circle' | 'int'> {
    const spell = SPELLS[id];
    return { name: spell.name, circle: spell.circle, int: spell.int };
}

export const ACTIVE_SPELLS: Readonly<Record<ActiveSpellId, ActiveSpellDef>> = {
    // De salida (sin requisito): 12 descargas de Energy Strike alrededor del punto, una cada 70 ms. Más flojo que Meteor
    // en total, pero más barato.
    energyStrike: {
        ...fromSpell('energyStrike'),
        kind: 'barrage',
        shot: 'energyStrike',
        shots: 12,
        shotIntervalMs: 70,
        scatterRadius: 96,
        damageScale: 1,
        originalMana: 65,
        range: 380,
        stickShare: 0.5,
        castMs: 500,
        castSound: 'sfx.energyBolt.cast',
        hudIcon: 'crit',
    },
    // Int 75: 4 explosiones grandes de Mass Fire Strike repartidas por la zona.
    massFireStrike: {
        ...fromSpell('massFireStrike'),
        kind: 'barrage',
        shot: 'massFireStrike',
        shots: 4,
        shotIntervalMs: 120,
        scatterRadius: 72,
        damageScale: 0.45,
        originalMana: 72,
        range: 400,
        stickShare: 0.5,
        castMs: 500,
        hudIcon: 'crit',
    },
    meteorStrike: {
        name: 'Meteor Strike',
        circle: 9,
        // Fase 26C: 169 (el original) → 140, en la escalera de Int.
        int: 140,
        kind: 'meteor',
        sprite: 'fx.crueffect1',
        directDamage: 30,
        // Owner, 19-oct-2026 (closing phase 19): 40 → 20; the meteor did ~50–60% of the Mage's damage from minute 5.
        areaDamage: 20,
        areaRadius: 128,
        directRadius: 24,
        knockback: 320,
        originalMana: 120,
        range: 420,
        stickShare: 0.5,
        castMs: 500,
        shakePx: 8,
        shakeMs: 350,
        castSound: 'sfx.energyBolt.cast',
        impactSound: 'sfx.explosion',
        hudIcon: 'crit',
    },
};

/** Radius of the ground the spell covers (px): the meteor's explosion, or where a barrage scatters its shots. */
export function activeSpellAreaRadius(def: ActiveSpellDef): number {
    return def.kind === 'meteor' ? def.areaRadius : def.scatterRadius;
}

/** In the order of their requirement (the Equipment screen's list). */
export const ACTIVE_SPELL_IDS: readonly ActiveSpellId[] = ['energyStrike', 'massFireStrike', 'meteorStrike'];

export function isActiveSpellId(id: string): id is ActiveSpellId {
    return Object.prototype.hasOwnProperty.call(ACTIVE_SPELLS, id);
}

/** The Mage's active spell when nothing else is equipped (debug runs without a saved character). */
export const DEFAULT_ACTIVE_SPELL: ActiveSpellId = 'energyStrike';

/** Damage multiplier at this Power, the same curve as the Critical Strike (data/critStrike.ts): 2 + Power / 30. */
export const ACTIVE_SPELL_POWER = { base: 2, perLevel: 30 } as const;

export function activeSpellPowerMultiplier(level: number): number {
    return ACTIVE_SPELL_POWER.base + level / ACTIVE_SPELL_POWER.perLevel;
}

/**
 * Share of the original's mana each active spell costs (Fase 26A): our mana bars are much smaller than the original's
 * (a new Mage has ~37), so half: Energy Strike 32, Mass Fire Strike 36, Meteor Strike 60.
 */
export const ACTIVE_SPELL_MANA_SHARE = 0.5;

/** Mana this spell costs with a wand that saves `manaSave` of it (0.1 = 10%), rounded down, never below 1. */
export function activeSpellManaCost(def: ActiveSpellDef, manaSave = 0): number {
    return Math.max(1, Math.floor(def.originalMana * ACTIVE_SPELL_MANA_SHARE * (1 - manaSave)));
}
