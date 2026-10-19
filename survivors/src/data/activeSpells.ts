// Hechizo activo del Mago (Fase 19B): lo lanza el jugador con el mismo botón que el Critical Strike del Guerrero
// (Espacio, R2 del mando o el botón táctil) y luego tiene que recargarse. Son hechizos grandes, distintos de los
// automáticos de data/spells.ts.
// Decidido con el propietario el 18-oct-2026: de momento uno solo, Meteor Strike; en el futuro serán "equipables"
// (Fase 20, segundo hueco de hechizo) y por eso van en una lista. La recarga baja con la Mag del personaje.
// Visual de sp-client/src/game/spells/MeteorStrike*.ts (ver hb/meteorStrike.ts). Daños orientados por la wiki
// (docs/hb-wiki/hechizos.md, Circle 9: 33 directo + 55 en área), adaptados a un survivors.
import type { SoundKey, SpriteKey } from '../config/assetManifest';
import type { EffectKey } from '../config/effects';

export type ActiveSpellId = 'meteorStrike';

export interface ActiveSpellDef {
    name: string;
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
    /** Recharge at 0 Mag (ms): each point of Mag takes `cooldownCutPerMag` off it, down to `minCooldownMs`. */
    baseCooldownMs: number;
    cooldownCutPerMag: number;
    minCooldownMs: number;
    /** Only falls on enemies closer than this to the player (px); with none, it does not go off. */
    range: number;
    /** With the aim stick (no cursor), it falls this share of `range` away, where the stick points. */
    stickShare: number;
    /** Length of the player's cast animation (ms). */
    castMs: number;
    /** Camera shake when it lands. */
    shakePx: number;
    shakeMs: number;
    /** Played when it is cast, and when it lands. */
    castSound?: SoundKey;
    impactSound: SoundKey;
    /**
     * HUD orb of the spell. For now the Warrior's red orb (owner, 18-oct-2026: the Mage will have its own icon later).
     * Kept here so that changing it touches only this file.
     */
    hudIcon: 'crit';
}

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

export const ACTIVE_SPELLS: Record<ActiveSpellId, ActiveSpellDef> = {
    meteorStrike: {
        name: 'Meteor Strike',
        sprite: 'fx.crueffect1',
        directDamage: 30,
        // Owner, 19-oct-2026 (closing phase 19): 40 → 20; the meteor did ~50–60% of the Mage's damage from minute 5.
        areaDamage: 20,
        areaRadius: 128,
        directRadius: 24,
        knockback: 320,
        // Owner, 18-oct-2026: 20 s, −1% per Mag point, never below 8 s (Mage at Power 1, Mag 14: ~17 s).
        baseCooldownMs: 20_000,
        cooldownCutPerMag: 0.01,
        minCooldownMs: 8_000,
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

/** The Mage's active spell until the Fase 20 lets them choose it. */
export const DEFAULT_ACTIVE_SPELL: ActiveSpellId = 'meteorStrike';

/** Damage multiplier at this Power, the same curve as the Critical Strike (data/critStrike.ts): 2 + Power / 30. */
export const ACTIVE_SPELL_POWER = { base: 2, perLevel: 30 } as const;

export function activeSpellPowerMultiplier(level: number): number {
    return ACTIVE_SPELL_POWER.base + level / ACTIVE_SPELL_POWER.perLevel;
}

/** Recharge time with this much Mag. */
export function activeSpellCooldownMs(def: ActiveSpellDef, mag: number): number {
    return Math.max(def.minCooldownMs, def.baseCooldownMs * (1 - def.cooldownCutPerMag * mag));
}
