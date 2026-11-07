// Helbreath Off (Fase Off-4B): textos del inventario (la ventana Inventory, off/scenes/OffInventoryScene.ts). Lo que
// pasa al usar o tirar algo sale también en la lista de abajo a la izquierda. Medidas de la ventana en
// off/config/offInventory.ts; tamaño de la bolsa y límite de pociones en off/data/offLoot.ts.
import type { OffPotionRestores } from './offGoods';

const BAR_NAMES: Record<OffPotionRestores, string> = { hp: 'Health', mana: 'Mana', stamina: 'Stamina' };

export const OFF_BAG_TEXT = {
    title: 'Inventory',
    equipmentButton: 'Equipment',
    dropButton: 'Drop',
    gold: (amount: number) => `Gold: ${amount.toLocaleString('en-US')}`,
    potions: (count: number, limit: number) => `Potions: ${count} / ${limit}`,
    empty: 'Your bag is empty. Monsters drop gold, potions and gear: walk over them to pick them up.',
    equipped: (name: string) => `You put on the ${name}.`,
    needsStr: (str: number) => `Not enough Str (needs ${str}).`,
    alreadyFull: (what: OffPotionRestores) => `Your ${BAR_NAMES[what]} is already full.`,
    cantUse: (name: string) => `${name} can't be used. Sell it in town.`,
    dropped: (name: string) => `You dropped the ${name}.`,
    /** Help line under the grid, by device. */
    helpMouse: 'Double-click: use or wear · Del: drop · E: Equipment · I: close',
    helpPad: 'A: use or wear · Y: drop · X: close',
} as const;
