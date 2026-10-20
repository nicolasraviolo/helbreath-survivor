// Efectos visuales de hechizos: qué hoja y qué frames de un .spr de efectos usa cada uno.
// Valores de sp-client/src/constants/Effects.ts (Energy Bolt, Fire Ball, Explosion 1–4, Footsteps dry)
// y game/effects/DirectionalProjectile.ts (proyectiles con 8 direcciones × 4 frames).
import type Phaser from 'phaser';
import type { SpriteKey } from './assetManifest';
import { getSheetKey } from '../hb/HBSprite';
import { directionFromVector } from '../hb/directions';

export interface EffectDef {
    sprite: SpriteKey;
    sheet: number;
    /** First and last frame (inclusive). Omitted = the whole sheet. */
    frames?: readonly [number, number];
    frameRate: number;
    loop: boolean;
    /** Frame index from which the effect fades out (sp-client fadeOutStartAnimationIndex). */
    fadeFromFrame?: number;
    /** Drawn additively (light: sparks, glows), like the original PutTransSprite_NoColorKey. */
    additive?: boolean;
    /** Added to the Y depth. Default DEPTH_EFFECT_OFFSET (above characters); negative = under them. */
    depthOffset?: number;
    /**
     * Projectiles drawn differently for each of the 8 directions: frames `dir × n … dir × n + n − 1` of the sheet.
     * One animation per direction is registered, keyed `{effect}.{dir}` (see effectAnimationKey).
     */
    framesPerDirection?: number;
    /** Moves the effect from the point it is drawn at, for sheets whose pivots point elsewhere (sp-client offsetX/Y). */
    offsetX?: number;
    offsetY?: number;
}

export const EFFECTS = {
    'fx.energyBolt.fly': { sprite: 'fx.effect', sheet: 0, frames: [2, 5], frameRate: 20, loop: true },
    'fx.energyBolt.explode': { sprite: 'fx.effect', sheet: 6, frameRate: 50, loop: false, fadeFromFrame: 6 },
    // Energy Strike: bolita fija (sin animación), effect.spr hoja 0 frame 0.
    'fx.energyStrike.fly': { sprite: 'fx.effect', sheet: 0, frames: [0, 0], frameRate: 1, loop: true },
    'fx.fireBall.fly': { sprite: 'fx.effect', sheet: 5, frameRate: 20, loop: true, framesPerDirection: 4 },
    'fx.fireBall.explode': { sprite: 'fx.effect', sheet: 3, frameRate: 20, loop: false },
    'fx.explosion1': { sprite: 'fx.effect3', sheet: 1, frameRate: 20, loop: false },
    'fx.explosion2': { sprite: 'fx.effect3', sheet: 2, frameRate: 20, loop: false },
    'fx.explosion3': { sprite: 'fx.effect3', sheet: 5, frameRate: 20, loop: false },
    'fx.explosion4': { sprite: 'fx.effect11', sheet: 8, frameRate: 15, loop: false },
    // Buffs del cofre (sp-client Berserk / Defense Shield / Defense Shield Buff).
    'fx.berserk.cast': { sprite: 'fx.effect8', sheet: 1, frameRate: 10, loop: false, depthOffset: -1 },
    'fx.defenseShield.cast': { sprite: 'fx.effect8', sheet: 6, frameRate: 10, loop: false, depthOffset: -1 },
    // Its frame pivots point ~95 px left and ~147 px above the anchor (measured in effect9.spr): moved back to the feet.
    'fx.defenseShield.aura': { sprite: 'fx.effect9', sheet: 14, frameRate: 15, loop: true, offsetX: 72, offsetY: 105 },
    // Golpe normal del original (Client.cpp, efecto tipo 1 "coup normal"): effect.spr hoja 8, 3 frames, aditivo,
    // a la altura del cuerpo de quien recibe el golpe. Es el destello de impacto; el original no tiene sangre.
    'fx.hit': { sprite: 'fx.effect', sheet: 8, frameRate: 20, loop: false, additive: true },
    // Flecha del Dark Elf (sp-client ArrowProjectile): effect.spr hoja 7, 2 frames por dirección.
    'fx.arrow': { sprite: 'fx.effect', sheet: 7, frameRate: 10, loop: true, framesPerDirection: 2 },
    // Portal del final (Fase 13): sp-client EFFECT_PORTAL_1, effect11.spr hoja 12 (30 frames), en bucle y bajo el jugador.
    // Sus frames quedan ~97 px a la derecha y ~77 px por debajo del ancla (medido en partida): se devuelve a su sitio.
    'fx.portal': { sprite: 'fx.effect11', sheet: 12, frameRate: 15, loop: true, depthOffset: -1, offsetX: -97, offsetY: -77 },
    // Tótems (Fase 16B, data/totems.ts): brillo a sus pies (sp-client Casting Circle), Full HP (Resurrection)
    // y Freeze (Mass Illusion Movement Base).
    // Tótem (lista de bugs del 19-oct-2026, M12): esfera de energía, effect5 hoja 0, siempre del mismo color.
    'fx.totem.orb': { sprite: 'fx.effect5', sheet: 0, frameRate: 10, loop: true, additive: true },
    'fx.fullHp.cast': { sprite: 'fx.effect11', sheet: 10, frameRate: 15, loop: false },
    // Abaddon's Blood (Fase 21E, data/abaddon.ts): la misma hoja Resurrection, con su propia clave por si se cambia.
    'fx.resurrection': { sprite: 'fx.effect11', sheet: 10, frameRate: 15, loop: false },
    // Abaddon's Blood con el efecto elegido por el propietario (20-oct-2026): "Abaddon Spirit 10", yseffect3 hoja 11.
    // Hasta que se descarga (ON_DEMAND_SPRITES) se usa fx.resurrection.
    'fx.abaddon.spirit': { sprite: 'fx.yseffect3', sheet: 11, frameRate: 10, loop: false },
    'fx.freeze.cast': { sprite: 'fx.effect8', sheet: 5, frameRate: 10, loop: false, depthOffset: -1 },
    // Critical Strike (Fase 19A, elegido por el propietario en el visor de sprites): effect6.spr hoja 1, la espiral del
    // Earthworm Strike (sp-client "Earth Worm Attack Helix"), 13 frames a 20 fps, una vez, alrededor del jugador.
    'fx.crit.strike': { sprite: 'fx.effect6', sheet: 1, frameRate: 20, loop: false, fadeFromFrame: 9 },
    // Meteor Strike, hechizo activo del Mago (Fase 19B): sp-client Meteor Falling y sus tres orbes (crueffect1.spr hoja 0,
    // en bucle mientras cae) y, al caer, Meteor Strike Impact (hoja 1), Meteor Ground Explosion (hoja 8) y Meteor
    // Explosion (hoja 2), todos a la vez. Su .spr se descarga al empezar una partida de Mago (ON_DEMAND_SPRITES).
    'fx.meteor.fall': { sprite: 'fx.crueffect1', sheet: 0, frames: [0, 4], frameRate: 20, loop: true },
    'fx.meteor.blueOrb': { sprite: 'fx.crueffect1', sheet: 0, frames: [5, 9], frameRate: 10, loop: true },
    'fx.meteor.whiteOrb': { sprite: 'fx.crueffect1', sheet: 0, frames: [10, 14], frameRate: 10, loop: true },
    'fx.meteor.fireOrb': { sprite: 'fx.crueffect1', sheet: 0, frames: [15, 19], frameRate: 10, loop: true },
    // El original (reference/Client.cpp, efectos 61 y 63) dibuja el fuego del suelo y la explosión con brillo (aditivos).
    'fx.meteor.impact': { sprite: 'fx.crueffect1', sheet: 1, frameRate: 20, loop: false, additive: true },
    'fx.meteor.groundExplosion': { sprite: 'fx.crueffect1', sheet: 8, frameRate: 30, loop: false, depthOffset: -1 },
    'fx.meteor.explosion': { sprite: 'fx.crueffect1', sheet: 2, frameRate: 20, loop: false, additive: true },
    // También del original y no de sp-client: estela de humo mientras cae (efecto 62, crueffect1 hoja 0 frames 20–24,
    // uno cada 25 ms) y cinco explosiones pequeñas al caer (efecto 12 "Burst", effect2.spr hoja 1 frames 10–15).
    'fx.meteor.smoke': { sprite: 'fx.crueffect1', sheet: 0, frames: [20, 24], frameRate: 10, loop: false, fadeFromFrame: 1 },
    'fx.meteor.burst': { sprite: 'fx.effect2', sheet: 1, frames: [10, 15], frameRate: 20, loop: false },
    // Veneno (Fase 21B): la nube verde que el original dibuja sobre quien está envenenado mientras dura (Client.cpp:42148,
    // CheckActiveAura2; sp-client EFFECT_POISON_DEBUFF): effect9 hoja 15, 21 frames en bucle, al 70%. Sus pivotes,
    // como los del aura de la hoja 14, apuntan lejos del ancla: se devuelve al cuerpo (Enemy.syncPoisonCloud; medido en
    // partida, +115 como el sX+115 del original).
    'fx.poison.cloud': { sprite: 'fx.effect9', sheet: 15, frameRate: 10, loop: true, offsetX: 115, offsetY: 149 },
    'fx.footsteps':{ sprite: 'fx.effect2', sheet: 1, frames: [28, 32], frameRate: 10, loop: false, depthOffset: -1 },
} as const satisfies Record<string, EffectDef>;

export type EffectKey = keyof typeof EFFECTS;

const DIRECTION_COUNT = 8;

/** Animation to play for an effect; directional ones need the flight vector (dx, dy). */
export function effectAnimationKey(key: EffectKey, dx = 0, dy = 0): string {
    const def: EffectDef = EFFECTS[key];
    if (!def.framesPerDirection) return key;
    // sp-client falls back to East for a zero vector.
    return `${key}.${directionFromVector(dx, dy) ?? 2}`;
}

/**
 * Creates the Phaser animations of every effect (one per direction for directional ones) whose sprite is loaded.
 * Call once the sprites are loaded, and again after downloading one later (ON_DEMAND_SPRITES): the rest are skipped.
 */
export function registerEffectAnimations(anims: Phaser.Animations.AnimationManager, textures: Phaser.Textures.TextureManager): void {
    for (const [key, def] of Object.entries(EFFECTS) as [EffectKey, EffectDef][]) {
        const textureKey = getSheetKey(def.sprite, def.sheet);
        if (!textures.exists(textureKey)) continue;
        const create = (animKey: string, first: number, last: number) => {
            if (anims.exists(animKey)) return;
            const frames: Phaser.Types.Animations.AnimationFrame[] = [];
            for (let i = first; i <= last; i++) frames.push({ key: textureKey, frame: String(i) });
            anims.create({ key: animKey, frames, frameRate: def.frameRate, repeat: def.loop ? -1 : 0 });
        };
        const perDirection = def.framesPerDirection;
        if (perDirection) {
            for (let dir = 0; dir < DIRECTION_COUNT; dir++) create(`${key}.${dir}`, dir * perDirection, dir * perDirection + perDirection - 1);
            continue;
        }
        const frameCount = textures.get(textureKey).frameTotal - 1; // frameTotal includes __BASE
        const [first, last] = def.frames ?? [0, frameCount - 1];
        create(key, first, last);
    }
}
