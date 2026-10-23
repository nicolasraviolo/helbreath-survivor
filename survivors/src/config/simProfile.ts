// Perfil de personaje para las partidas de prueba (revisión de la dificultad, 22-oct-2026; solo en desarrollo).
// ?level=25 juega como un personaje de ese Level: sus puntos repartidos según un reparto típico de la clase (o el de
// ?build=str:2,vit:1,dex:1, en partes) y, con ?kit=best (por defecto), lo mejor que Tom le vende y que ya puede ponerse
// en cada hueco; con ?kit=start, el equipo de salida. El "+" del arma sigue siendo ?upgrade=N.
import type { CharacterId } from '../data/characters';
import { CHARACTERS } from '../data/characters';
import { STAT_POINT_CAP, STAT_POINTS_PER_LEVEL } from '../data/characterLevel';
import { canEquip, catalog, EQUIP_SLOT_IDS, isSpellItemId, MANUAL_SPELL_IDS, START_EQUIPMENT, type SavedEquipment } from '../data/items';
import { STAT_IDS, type Stats } from '../data/stats';
import { getWand, isWandId } from '../data/wands';

export type SimKit = 'best' | 'start';

/** How a typical player of each class spends the Level points (parts: str 2, vit 1, dex 1 = half to Str). */
export const SIM_DEFAULT_BUILDS: Readonly<Record<CharacterId, Partial<Stats>>> = {
    warrior: { str: 2, vit: 1, dex: 1 },
    mage: { mag: 2, int: 1, vit: 1 },
};

export interface SimProfile {
    level: number;
    stats: Stats;
    equipment: SavedEquipment;
    /** One line for the report: "Level 25 · str 50, vit 30... · Claymore, Iron Shield...". */
    label: string;
}

/** The class's start stats plus the Level points shared out by `build` (whole points; the rest go in order). */
export function simStats(classId: CharacterId, level: number, build: Partial<Stats>): Stats {
    const stats: Stats = { ...CHARACTERS[classId].startStats };
    const points = STAT_POINTS_PER_LEVEL * Math.max(0, level - 1);
    const parts = STAT_IDS.map((id) => build[id] ?? 0);
    const total = parts.reduce((a, b) => a + b, 0);
    if (total <= 0) return stats;
    let given = 0;
    STAT_IDS.forEach((id, i) => {
        const share = Math.floor((points * (parts[i] ?? 0)) / total);
        const add = Math.min(share, STAT_POINT_CAP - stats[id]);
        stats[id] += add;
        given += add;
    });
    // Leftover points (rounding or caps), one by one to the stats of the build, in order.
    for (let left = points - given, i = 0; left > 0 && i < 1000; i++) {
        const id = STAT_IDS[i % STAT_IDS.length];
        if (id === undefined || (build[id] ?? 0) <= 0 || stats[id] >= STAT_POINT_CAP) continue;
        stats[id]++;
        left--;
    }
    return stats;
}

/**
 * In each slot, the hardest item to wear that it can already wear (never the rare wands, which only drop, nor the
 * Manual spells, which need their book: Fase 26E).
 */
export function simBestEquipment(classId: CharacterId, stats: Readonly<Stats>, level: number): SavedEquipment {
    const equipment: SavedEquipment = { ...START_EQUIPMENT[classId] };
    for (const slot of EQUIP_SLOT_IDS) {
        if (slot === 'zem') continue;
        const wearable = catalog(classId, slot).filter((id) => canEquip(id, stats, level) && !(isWandId(id) && getWand(id).rare === true)
            && !(isSpellItemId(id) && MANUAL_SPELL_IDS.has(id)));
        const best = wearable.at(-1);
        if (best !== undefined) equipment[slot] = best;
    }
    return equipment;
}

export function simProfile(classId: CharacterId, level: number, build: Partial<Stats> | undefined, kit: SimKit): SimProfile {
    const stats = simStats(classId, level, build ?? SIM_DEFAULT_BUILDS[classId]);
    const equipment = kit === 'best' ? simBestEquipment(classId, stats, level) : { ...START_EQUIPMENT[classId] };
    const statText = STAT_IDS.map((id) => `${id} ${stats[id]}`).join(', ');
    return { level, stats, equipment, label: `Level ${level} · ${statText} · ${Object.values(equipment).join(', ')}` };
}
