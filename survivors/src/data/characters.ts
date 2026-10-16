// Personajes jugables. Por ahora solo el Guerrero; Mago y Arquero llegan en la Fase 8 (docs/DESIGN.md).
import type { Appearance } from '../hb/playerAppearance';

export interface CharacterDef {
    name: string;
    /** Movement speed in pixels per second. */
    speed: number;
    /** Half the side of the square used for wall collision, centred on the feet. */
    hitboxHalfSize: number;
    /** Animation speed (frames per second; every animation has 8 frames). */
    idleFrameRate: number;
    runFrameRate: number;
    /** Death animation speed (frames per second; 8 frames, played once). */
    dieFrameRate: number;
    maxHp: number;
    /** Time without taking damage after a hit, in milliseconds. */
    invulnerabilityMs: number;
    appearance: Appearance;
}

export const CHARACTERS = {
    warrior: {
        name: 'Guerrero',
        speed: 150,
        hitboxHalfSize: 8,
        idleFrameRate: 8,
        runFrameRate: 14,
        dieFrameRate: 10,
        // Base 100 + 20% del Guerrero (docs/DESIGN.md).
        maxHp: 120,
        invulnerabilityMs: 600,
        // Cota de malla + armadura de placas, perneras, botas altas, casco completo,
        // espada larga y escudo de caballero (índices de sp-client/src/constants/Items.ts).
        appearance: {
            human: { sprite: 'player.body.wm' },
            hair: { sprite: 'player.hair.mhr', variant: 0 },
            underwear: { sprite: 'player.underwear.mpt', variant: 0 },
            hauberk: { sprite: 'gear.hauberk.m' },
            leggings: { sprite: 'gear.leggings.plate.m' },
            boots: { sprite: 'gear.boots.long.m' },
            helm: { sprite: 'gear.helm.full.m' },
            armor: { sprite: 'gear.armor.plate.m' },
            weapon: { sprite: 'gear.swords.m', startSheet: 112 },
            shield: { sprite: 'gear.shields.m', startSheet: 49 },
        },
    },
} as const satisfies Record<string, CharacterDef>;

export type CharacterId = keyof typeof CHARACTERS;

export const DEFAULT_CHARACTER: CharacterId = 'warrior';
