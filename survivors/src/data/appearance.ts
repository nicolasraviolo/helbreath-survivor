// Aspecto del personaje (Fase 17B), elegido en "Create New Character": sexo, piel, peinado, color de pelo y ropa
// interior, como en el original (Client.cpp, _InitOnCreateNewCharacter y UpdateScreen_OnCreateNewCharacter).
// - Piel: 3 cuerpos por sexo (wm/ym/bm y ww/yw/bw = claro, moreno y oscuro).
// - Peinado y ropa interior: 8 variantes dentro de mhr/whr y mpt/wpt (12 hojas cada una).
// - Color de pelo: el original suma un color a la capa del pelo (_GetHairColorRGB, 16 colores). El propietario
//   eligió los 8 que más se distinguen (17B, 18-oct-2026).
// - La ropa está dibujada por sexo (msw/wsw, mlarmor/wlarmor...): las tablas de abajo cambian cada pieza por la del
//   otro sexo. Los datos de clases y armaduras (characters.ts, armor.ts) siguen escritos con un solo sexo.
import type { SoundKey, SpriteKey } from '../config/assetManifest';
import type { Appearance } from '../hb/playerAppearance';
import type { CharacterId } from './characters';

export type Gender = 'male' | 'female';
export const GENDERS: readonly Gender[] = ['male', 'female'];

export interface CharacterLook {
    gender: Gender;
    /** 0 = light, 1 = tanned, 2 = dark. */
    skin: number;
    /** 0..7 (2 is bald, as in the original). */
    hairStyle: number;
    /** Index in HAIR_COLORS. */
    hairColor: number;
    /** 0..7. */
    underwear: number;
}

/** Bodies by gender and skin (light, tanned, dark). */
export const BODY_SPRITES: Record<Gender, readonly SpriteKey[]> = {
    male: ['player.body.wm', 'player.body.ym', 'player.body.bm'],
    female: ['player.body.ww', 'player.body.yw', 'player.body.bw'],
};
export const HAIR_SPRITE: Record<Gender, SpriteKey> = { male: 'player.hair.mhr', female: 'player.hair.whr' };
export const UNDERWEAR_SPRITE: Record<Gender, SpriteKey> = { male: 'player.underwear.mpt', female: 'player.underwear.wpt' };

export const HAIR_STYLE_COUNT = 8;
export const UNDERWEAR_COUNT = 8;
/** Hair style 2 is bald: no hair layer (as in sp-client). */
export const BALD_HAIR_STYLE = 2;

/**
 * Hair colours: amounts added to red, green and blue, in the original's 0..31 scale (5-bit colour). Picked from the
 * 16 of _GetHairColorRGB (their index there in the comment): the others look almost the same on the hair (checked
 * on screen; e.g. 15 "blond" comes out olive green and 0 dark red is close to 1 red).
 */
export const HAIR_COLORS: ReadonlyArray<{ name: string; add: readonly [number, number, number] }> = [
    { name: 'Blond', add: [22, 13, -10] }, // 2
    { name: 'Brown', add: [10, 3, -10] }, // 9
    { name: 'Red', add: [20, 0, 0] }, // 1
    { name: 'Green', add: [0, 10, 0] }, // 3
    { name: 'Blue', add: [0, 0, 22] }, // 4
    { name: 'Purple', add: [15, -5, 16] }, // 6
    { name: 'Teal', add: [-10, 3, 10] }, // 10
    { name: 'Black', add: [-6, -6, -6] }, // 7
];
/** 0..31 scale → 0..255. */
export const HAIR_COLOR_SCALE = 255 / 31;

/** Death cry and level-up voice: the original has one of each for men and one for women. */
export const GENDER_SOUNDS: Record<Gender, { death: SoundKey; levelUp: SoundKey }> = {
    male: { death: 'sfx.player.death.m', levelUp: 'sfx.levelUp.m' },
    female: { death: 'sfx.player.death.w', levelUp: 'sfx.levelUp.w' },
};

/**
 * Look of characters saved before Fase 17B and of debug runs (?play): the one each class had until then
 * (Black is the colour closest to the untinted hair of before).
 */
export const DEFAULT_LOOKS: Record<CharacterId, CharacterLook> = {
    mage: { gender: 'female', skin: 0, hairStyle: 0, hairColor: 7, underwear: 0 },
    warrior: { gender: 'male', skin: 0, hairStyle: 0, hairColor: 7, underwear: 0 },
};

/**
 * Men's piece → women's piece. Only pieces that exist for both; anything not listed is worn as it is.
 * The Mage's starting Bodice and Skirt have no men's version: a man wears Shirt and Trousers (see TO_MALE).
 */
const TO_FEMALE: Partial<Record<SpriteKey, SpriteKey>> = {
    'gear.shirt.m': 'gear.shirt.w',
    'gear.trousers.m': 'gear.trousers.w',
    'gear.hauberk.m': 'gear.hauberk.w',
    'gear.armor.leather.m': 'gear.armor.leather.w',
    'gear.armor.scale.m': 'gear.armor.scale.w',
    'gear.armor.chain.m': 'gear.armor.chain.w',
    'gear.armor.plate.m': 'gear.armor.plate.w',
    'gear.leggings.chain.m': 'gear.leggings.chain.w',
    'gear.leggings.plate.m': 'gear.leggings.plate.w',
    'gear.boots.long.m': 'gear.boots.long.w',
    'gear.helm.basic.m': 'gear.helm.basic.w',
    'gear.helm.full.m': 'gear.helm.full.w',
    'gear.helm.winged.m': 'gear.helm.winged.w',
    'gear.helm.horned.m': 'gear.helm.horned.w',
    'gear.swords.m': 'gear.swords.w',
    'gear.shields.m': 'gear.shields.w',
    'gear.armor.robe.m': 'gear.armor.robe.w',
    'gear.helm.wizardCap.m': 'gear.helm.wizardCap.w',
    'gear.helm.wizard.m': 'gear.helm.wizardHat.w',
    'gear.wand.m': 'gear.wand.w',
    'gear.shoes.m': 'gear.shoes.w',
    'gear.cape.m': 'gear.cape.w',
};
const TO_MALE: Partial<Record<SpriteKey, SpriteKey>> = {
    ...Object.fromEntries(Object.entries(TO_FEMALE).map(([male, female]) => [female, male])),
    'gear.bodice.w': 'gear.shirt.m',
    'gear.skirt.w': 'gear.trousers.m',
};

/** The same piece drawn for that gender (bodies, hair and underwear are chosen by the look, not here). */
export function gearForGender(sprite: SpriteKey, gender: Gender): SpriteKey {
    return (gender === 'female' ? TO_FEMALE[sprite] : TO_MALE[sprite]) ?? sprite;
}

/** A random look, as the original does every time Create New Character opens. */
export function randomLook(): CharacterLook {
    const pick = (count: number) => Math.floor(Math.random() * count);
    return {
        gender: GENDERS[pick(GENDERS.length)] ?? 'male',
        skin: pick(BODY_SPRITES.male.length),
        hairStyle: pick(HAIR_STYLE_COUNT),
        hairColor: pick(HAIR_COLORS.length),
        underwear: pick(UNDERWEAR_COUNT),
    };
}

/** Body, hair and underwear layers of a look (no hair layer when bald). */
export function lookLayers(look: CharacterLook): Appearance {
    const bodies = BODY_SPRITES[look.gender];
    const layers: Appearance = {
        human: { sprite: bodies[look.skin] ?? bodies[0] ?? 'player.body.wm' },
        underwear: { sprite: UNDERWEAR_SPRITE[look.gender], variant: look.underwear },
    };
    if (look.hairStyle !== BALD_HAIR_STYLE) {
        layers.hair = { sprite: HAIR_SPRITE[look.gender], variant: look.hairStyle, hairColor: look.hairColor };
    }
    return layers;
}

/** How many choices each part of the look has. */
export const LOOK_OPTION_COUNTS: Record<keyof CharacterLook, number> = {
    gender: GENDERS.length,
    skin: BODY_SPRITES.male.length,
    hairStyle: HAIR_STYLE_COUNT,
    hairColor: HAIR_COLORS.length,
    underwear: UNDERWEAR_COUNT,
};

/** The look with one part moved to the next (step 1) or previous (-1) choice, wrapping around as in the original. */
export function stepLook(look: CharacterLook, key: keyof CharacterLook, step: number): CharacterLook {
    const count = LOOK_OPTION_COUNTS[key];
    const wrap = (index: number) => (((index + step) % count) + count) % count;
    if (key === 'gender') return { ...look, gender: GENDERS[wrap(GENDERS.indexOf(look.gender))] ?? look.gender };
    return { ...look, [key]: wrap(look[key]) };
}
