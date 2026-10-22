// Mejoras del herrero (Fase 24D; decidido por el propietario el 22-oct-2026, docs/DECISIONES.md, "Fase 24"):
// - Armas y varitas suben a +1, +2 y +3. Cada "+" da un 10% más de daño (para la Maga, a sus hechizos), que se
//   multiplica con el del atributo: Sharp (+10%) y +3 (+30%) → ×1,1 × 1,3 = +43%.
// - Siempre sale bien. Cuesta oro (precios en data/smith.ts) y 1 Stone of Xelima por cada "+".
// - El "+" va con el objeto: puesto, en el inventario o en el baúl. Un arma de salida (la daga, la varita MS0) mejorada
//   pasa a ser un objeto de verdad: al quitársela vuelve al inventario en vez de desaparecer.
// - Ancient también se puede mejorar (propietario, 22-oct-2026).
import type { OwnedItem } from './loot';
import { isWandId } from './wands';
import { MELEE_WEAPONS } from './weapons';

/** The highest "+" an item can reach. */
export const UPGRADE_MAX = 3;

/** Extra damage of each "+" (0.1 = +10%). */
export const UPGRADE_DAMAGE_PER_LEVEL = 0.1;

/** Stones of Xelima each "+" costs. */
export const UPGRADE_STONES_PER_LEVEL = 1;

/** Only weapons and wands are upgraded (armor would take the Stone of Merien: not in this phase). */
export function canUpgrade(id: string): boolean {
    return Object.prototype.hasOwnProperty.call(MELEE_WEAPONS, id) || isWandId(id);
}

/** The "+" of an item (0 without one). */
export function upgradeOf(item: Readonly<OwnedItem> | undefined): number {
    return item?.upgrade ?? 0;
}

/** Extra damage of that many "+" (0.3 at +3). */
export function upgradeDamageBonus(upgrade: number): number {
    return upgrade * UPGRADE_DAMAGE_PER_LEVEL;
}

/** A "+" read back from storage, if that item can have it (undefined for 0 or anything wrong). */
export function readUpgrade(id: string, value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isInteger(value) || !canUpgrade(id)) return undefined;
    return value >= 1 && value <= UPGRADE_MAX ? value : undefined;
}

/** " +2" after a name, nothing at +0. */
export function upgradeSuffix(upgrade: number): string {
    return upgrade > 0 ? ` +${upgrade}` : '';
}

/** "+2: +20% damage" (the help lines of Equipment, the warehouse and the blacksmith). */
export function upgradeDescription(upgrade: number): string {
    return `+${upgrade}: +${Math.round(upgradeDamageBonus(upgrade) * 100)}% damage`;
}
