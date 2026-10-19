// Armas cuerpo a cuerpo del Guerrero. Los hechizos de la Maga están en data/spells.ts.
import type { SoundKey, SpriteKey } from '../config/assetManifest';
import type { EquipRequirement, ItemIcon } from './itemTypes';

// ---------------------------------------------------------------------------------------------------------
// Armas cuerpo a cuerpo del Guerrero (Fase 6, bloque 6A; decidido con el propietario el 16-oct-2026).
// - Solo se lleva UNA arma en la mano. Las cartas ofrecen el siguiente eslabón de la familia o cambiar de familia.
// - Números PROPIOS (no los del original): requisito de Str, daño, ritmo y alcance pensados para que haya que
//   elegir: las cortas hacen más daño por segundo a un enemigo; las largas golpean a más enemigos y empujan más.
// - Fase 13C: daño ×1,5 para igualar al Guerrero con la Maga (simulación `levelpace`).
// - Las familias con `enabled: false` existen solo como datos: no salen en las cartas ni tienen ataque propio aún.
// - Fase 20B: `equip` = requisito ORIGINAL para ponérsela en la pantalla de equipo (Str = peso/100 y Level mínimo de
//   reference/Item*.cfg), con las stats permanentes del personaje. `strRequired` es solo para las cartas (se van en el 20C).
//   `icon` = dibujo del objeto en item-pack.spr (hoja = Spr − 1, frame = SFrame del Item.cfg).

export type MeleeFamilyId = 'shortSword' | 'longSword' | 'hammer' | 'fencing' | 'axe';

export interface MeleeWeaponDef {
    name: string;
    family: MeleeFamilyId;
    /** Str needed for the card to appear (our own number, not scaled by REQ_SCALE). */
    strRequired: number;
    /** Base physical damage to every enemy inside the swing (grows with Str). */
    damage: number;
    /** Time between swings in milliseconds (shortened by Dex). */
    cooldownMs: number;
    /** Length of the attack animation in milliseconds (shortened by Dex like the cooldown). */
    swingMs: number;
    /** How far the blade reaches from the player's feet, in pixels. */
    range: number;
    /** Width of the swing, in degrees, centred on the target. */
    arcDegrees: number;
    /** Push given to hit enemies (px/s). */
    knockback: number;
    /** Weapon layer drawn in the hand (msw.spr: one block of 56 sheets per sword). Undefined = no sprite yet. */
    sprite?: { key: SpriteKey; startSheet: number };
    /** What the Equipment screen asks of the permanent stats (Fase 20B). Undefined = not in the catalog. */
    equip?: EquipRequirement;
    /** Picture in item-pack.spr (Equipment screen). */
    icon?: ItemIcon;
}

export interface MeleeFamilyDef {
    name: string;
    enabled: boolean;
    /** Links from weakest to strongest. */
    links: readonly MeleeWeaponId[];
}

/** Shared by every melee weapon. */
export const MELEE_SWING_SOUND: SoundKey = 'sfx.melee.swing';
export const MELEE_HIT_SOUND: SoundKey = 'sfx.melee.hit';
/** Damage lands at this point of the swing animation (the original hits on frame 2 of 8). */
export const MELEE_HIT_MOMENT = 0.25;
/**
 * The player stands still from the start of the swing until this point (decided by the owner on 16-oct-2026, as in
 * the original, where you can't move while attacking): just past the blow, so frames 0–2 of the swing show
 * (dagger ≈ 0,13 s, long sword ≈ 0,21 s). Then moving cuts the rest of the animation and the run starts again.
 */
export const MELEE_ROOT_MOMENT = 0.375;
/** Swords are drawn from msw.spr in blocks of 56 sheets (7 states × 8 directions); see sp-client Items.ts. */
const SWORD_SPRITE: SpriteKey = 'gear.swords.m';

export const MELEE_WEAPONS = {
    // Short Swords: rápidas, poco alcance, poco requisito.
    dagger: {
        name: 'Dagger', family: 'shortSword', strRequired: 0, damage: 9, cooldownMs: 450, swingMs: 350,
        range: 50, arcDegrees: 90, knockback: 60, sprite: { key: SWORD_SPRITE, startSheet: 0 },
        equip: { str: 2 }, icon: { sheet: 0, frame: 0 },
    },
    shortSword: {
        name: 'Short Sword', family: 'shortSword', strRequired: 17, damage: 13, cooldownMs: 450, swingMs: 350,
        range: 55, arcDegrees: 90, knockback: 70, sprite: { key: SWORD_SPRITE, startSheet: 56 },
        equip: { str: 8 }, icon: { sheet: 0, frame: 1 },
    },
    falchion: {
        name: 'Falchion', family: 'shortSword', strRequired: 24, damage: 19, cooldownMs: 500, swingMs: 380,
        range: 60, arcDegrees: 100, knockback: 80, sprite: { key: SWORD_SPRITE, startSheet: 280 },
        equip: { str: 22 }, icon: { sheet: 0, frame: 5 },
    },
    // Long Swords: lentas, arco amplio, empujan más.
    longSword: {
        name: 'Long Sword', family: 'longSword', strRequired: 20, damage: 21, cooldownMs: 1000, swingMs: 560,
        range: 80, arcDegrees: 150, knockback: 150, sprite: { key: SWORD_SPRITE, startSheet: 112 },
        equip: { str: 14 }, icon: { sheet: 0, frame: 2 },
    },
    // Fase 20B: Scimitar y Claymore, entre las que ya había (mismo dibujo en la mano que el original: bloques 6 y 10 de msw.spr).
    scimitar: {
        name: 'Scimitar', family: 'longSword', strRequired: 24, damage: 25, cooldownMs: 1000, swingMs: 560,
        range: 82, arcDegrees: 150, knockback: 155, sprite: { key: SWORD_SPRITE, startSheet: 280 },
        equip: { str: 18 }, icon: { sheet: 0, frame: 4 },
    },
    broadSword: {
        name: 'Broad Sword', family: 'longSword', strRequired: 28, damage: 30, cooldownMs: 1000, swingMs: 560,
        range: 85, arcDegrees: 150, knockback: 165, sprite: { key: SWORD_SPRITE, startSheet: 392 },
        equip: { str: 28 }, icon: { sheet: 0, frame: 7 },
    },
    claymore: {
        name: 'Claymore', family: 'longSword', strRequired: 32, damage: 35, cooldownMs: 1050, swingMs: 580,
        range: 90, arcDegrees: 155, knockback: 170, sprite: { key: SWORD_SPRITE, startSheet: 504 },
        equip: { str: 40 }, icon: { sheet: 0, frame: 9 },
    },
    greatSword: {
        name: 'Great Sword', family: 'longSword', strRequired: 36, damage: 40, cooldownMs: 1100, swingMs: 600,
        range: 95, arcDegrees: 160, knockback: 180, sprite: { key: SWORD_SPRITE, startSheet: 560 },
        equip: { str: 52 }, icon: { sheet: 0, frame: 10 },
    },
    flamberge: {
        name: 'Flamberge', family: 'longSword', strRequired: 46, damage: 54, cooldownMs: 1100, swingMs: 600,
        range: 100, arcDegrees: 170, knockback: 200, sprite: { key: SWORD_SPRITE, startSheet: 616 },
        equip: { str: 60 }, icon: { sheet: 0, frame: 11 },
    },
    // Desactivadas (solo datos, sin ataque propio ni sprite cargado todavía). Números provisionales.
    hammer: { name: 'Hammer', family: 'hammer', strRequired: 42, damage: 40, cooldownMs: 1600, swingMs: 700, range: 90, arcDegrees: 360, knockback: 260 },
    battleHammer: { name: 'Battle Hammer', family: 'hammer', strRequired: 55, damage: 55, cooldownMs: 1700, swingMs: 700, range: 100, arcDegrees: 360, knockback: 280 },
    rapier: { name: 'Rapier', family: 'fencing', strRequired: 16, damage: 10, cooldownMs: 400, swingMs: 320, range: 90, arcDegrees: 25, knockback: 40 },
    lightAxe: { name: 'Light Axe', family: 'axe', strRequired: 16, damage: 12, cooldownMs: 800, swingMs: 500, range: 70, arcDegrees: 360, knockback: 100 },
    tomahawk: { name: 'Tomahawk', family: 'axe', strRequired: 21, damage: 15, cooldownMs: 800, swingMs: 500, range: 72, arcDegrees: 360, knockback: 110 },
    doubleAxe: { name: 'Double Axe', family: 'axe', strRequired: 26, damage: 19, cooldownMs: 850, swingMs: 520, range: 75, arcDegrees: 360, knockback: 120 },
    warAxe: { name: 'War Axe', family: 'axe', strRequired: 42, damage: 26, cooldownMs: 900, swingMs: 550, range: 80, arcDegrees: 360, knockback: 140 },
    battleAxe: { name: 'Battle Axe', family: 'axe', strRequired: 68, damage: 38, cooldownMs: 1000, swingMs: 600, range: 85, arcDegrees: 360, knockback: 160 },
} as const satisfies Record<string, MeleeWeaponDef>;

export type MeleeWeaponId = keyof typeof MELEE_WEAPONS;

export const MELEE_FAMILIES = {
    shortSword: { name: 'Short Swords', enabled: true, links: ['dagger', 'shortSword', 'falchion'] },
    longSword: { name: 'Long Swords', enabled: true, links: ['longSword', 'scimitar', 'broadSword', 'claymore', 'greatSword', 'flamberge'] },
    hammer: { name: 'Hammers', enabled: false, links: ['hammer', 'battleHammer'] },
    fencing: { name: 'Fencing', enabled: false, links: ['rapier'] },
    axe: { name: 'Axes', enabled: false, links: ['lightAxe', 'tomahawk', 'doubleAxe', 'warAxe', 'battleAxe'] },
} as const satisfies Record<MeleeFamilyId, MeleeFamilyDef>;

export function getMeleeWeapon(id: MeleeWeaponId): MeleeWeaponDef {
    return MELEE_WEAPONS[id];
}
