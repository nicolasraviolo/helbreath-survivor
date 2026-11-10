// Helbreath Off, Fase Off-12B: la ficha de un objeto en el estilo nuevo (la de la pestaña Bag).
// Sigue el orden y los datos del original (decisión del propietario, 10-nov-2026):
//   nombre (verde si tiene cualquier atributo, también Sharp) → tipo → atributos → daño y velocidad (armas) o
//   Defense Ratio y Physical Absorption (armaduras) → Level → Required Str (con la STR de velocidad máxima).
// Sin Endurance (Off no gasta objetos). La comparación con lo que llevas puesto va al final de la fila, en gris
// "(now …)", con flecha ▲ / ▼ y color (offStatRow); ya cuenta Sharp, Ancient y tu STR.
// El almacén la usa desde la Off-13C y la tienda y el herrero desde la Off-13D.
import { offBestSpeedStr, offSpeedLabel } from '../data/offCombat';
import { offGood } from '../data/offGoods';
import {
    diceAverage, isOffGearKey, isOffSpecial, OFF_FISTS, OFF_WAND, offBagItemName, offGearDef, offGearEffects, offGearId, offGearKind,
    offGearRolls, offItemAbsorb, offStrToEquip, offWearCheck, type OffBagItemKey, type OffGearKey, type OffItemDef, type OffSlotId,
    type OffWandPower, type OffWearer,
} from '../data/offItems';
import { offRollLines } from '../data/offAttributes';
import { OFF_BAG_TEXT } from '../data/offBag';
import { weaponDamageRange } from '../systems/OffCombatRules';
import { OFF_THEME_INK } from '../config/offTheme';
import type { OffTrend } from './offUi';

/** One row of the card: label, value and how it compares with what you wear. */
export interface OffCardRow {
    label: string;
    value: string;
    color?: string;
    /** "now 10": what you wear, without the brackets. */
    note?: string;
    trend?: OffTrend;
}

export interface OffItemCard {
    name: string;
    nameColor?: string;
    /** The kind line under the name (in capitals): "Body armor", "Two-handed weapon · worn". */
    kind: string;
    rows: OffCardRow[];
}

const SLOT_KIND: Record<Exclude<OffSlotId, 'weapon'>, string> = {
    shield: 'Shield', helm: 'Helm', body: 'Body armor', legs: 'Leggings', boots: 'Boots', cape: 'Cape',
};

const BAR_LABELS = { hp: 'Health', mana: 'Mana', stamina: 'Stamina' } as const;

const trendOf = (sign: number): OffTrend => (sign > 0 ? 'better' : sign < 0 ? 'worse' : 'same');

/** "Critical Chance +5%" → label and value; "Poison 6: poisons what you hit" → split at the colon. */
function attributeRow(line: string): OffCardRow {
    const colon = line.indexOf(': ');
    if (colon > 0) return { label: line.slice(0, colon), value: line.slice(colon + 2), color: OFF_THEME_INK.good };
    const match = /^(.*) ([+-]\S+)$/.exec(line);
    // Sharp / Ancient say "Damage +10%": renamed so it doesn't look like the weapon's own Damage row below.
    if (match?.[1] && match[2]) return { label: match[1] === 'Damage' ? 'Damage Bonus' : match[1], value: match[2], color: OFF_THEME_INK.good };
    return { label: line, value: '' };
}

function wandText(wand: OffWandPower): string {
    if (wand.berserk) return `${wand.manaSave}% · +${OFF_WAND.berserkExtraMana} mana`;
    if (wand.kloness) return `${wand.manaSave}% · +${OFF_WAND.klonessMin}–${OFF_WAND.klonessMax} dmg`;
    return `${wand.manaSave}%`;
}

/** The kind line of an item. */
export function offItemKind(id: OffBagItemKey): string {
    if (!isOffGearKey(id)) return offGood(id).restores ? 'Potion' : 'Loot';
    const item = offGearDef(id);
    if (item.kind === 'weapon') return item.wand ? 'Wand' : item.twoHanded ? 'Two-handed weapon' : 'Weapon';
    return SLOT_KIND[item.slot];
}

/** Off-13C: the kind line of a stack of potions or Slime Jelly says how many there are ("Potion · ×7"). */
export function offStackKind(kind: string, count: number): string {
    return count > 1 ? `${kind} · ×${count}` : kind;
}

/**
 * The card of an item from the bag or the one worn. `worn` = what you wear in its slot (compared when it is another
 * item; an empty armour slot counts as 0). `isWorn` = the card is of the item you wear (no comparison).
 */
export function offItemCard(id: OffBagItemKey, worn: OffGearKey | undefined, who: OffWearer, isWorn = false): OffItemCard {
    const name = offBagItemName(id);
    const nameColor = isOffSpecial(id) ? OFF_THEME_INK.good : undefined;
    const kind = offItemKind(id) + (isWorn ? ` · ${OFF_BAG_TEXT.worn}` : '');
    if (!isOffGearKey(id)) {
        const restores = offGood(id).restores;
        if (!restores) return { name, kind, rows: [{ label: 'Use', value: 'Only for selling' }] };
        const [count, sides, bonus] = restores.dice;
        return { name, kind, rows: [{ label: `Restores ${BAR_LABELS[restores.what]}`, value: `${count + bonus} – ${count * sides + bonus}` }] };
    }
    const item: OffItemDef = offGearDef(id);
    const other: OffItemDef | undefined = worn && worn !== id && !isWorn ? offGearDef(worn) : undefined;
    const comparing = !isWorn && worn !== id;
    const rows: OffCardRow[] = offRollLines(offGearKind(offGearId(id)), offGearRolls(id)).map(attributeRow);
    const factorOf = (key: OffGearKey | undefined) => 1 + (key ? offGearEffects(key).damage ?? 0 : 0);
    if (item.kind === 'weapon') {
        const r = weaponDamageRange(item, who.str, factorOf(id));
        const speed = offSpeedLabel(item);
        if (other?.kind === 'weapon') {
            const o = weaponDamageRange(other, who.str, factorOf(worn));
            const average = (diceAverage(item.small) + diceAverage(item.large)) * factorOf(id);
            const otherAverage = (diceAverage(other.small) + diceAverage(other.large)) * factorOf(worn);
            const otherSpeed = offSpeedLabel(other);
            rows.push({ label: 'Damage', value: `${r.min} – ${r.max}`, note: `now ${o.min} – ${o.max}`, trend: trendOf(average - otherAverage) });
            rows.push({ label: 'Speed', value: speed.label, note: `now ${otherSpeed.label}`, trend: trendOf(otherSpeed.rank - speed.rank) });
        } else if (comparing && !worn) {
            const fists = weaponDamageRange(OFF_FISTS, who.str, 1);
            rows.push({ label: 'Damage', value: `${r.min} – ${r.max}`, note: `now ${fists.min} – ${fists.max}`, trend: 'better' });
            rows.push({ label: 'Speed', value: speed.label });
        } else {
            rows.push({ label: 'Damage', value: `${r.min} – ${r.max}` });
            rows.push({ label: 'Speed', value: speed.label });
        }
        if (item.wand) rows.push({ label: 'Mana Save', value: wandText(item.wand) });
    } else {
        const absorb = offItemAbsorb(item);
        const otherDefense = other?.kind === 'armor' ? other.defense : 0;
        const otherAbsorb = other?.kind === 'armor' ? offItemAbsorb(other) : 0;
        const compare = comparing;
        rows.push({
            label: 'Defense Ratio', value: `+${item.defense}`,
            ...(compare ? { note: `now +${otherDefense}`, trend: trendOf(item.defense - otherDefense) } : {}),
        });
        if (absorb > 0 || (compare && otherAbsorb > 0)) {
            rows.push({
                label: 'Physical Absorption', value: `${absorb}%`,
                ...(compare ? { note: `now ${otherAbsorb}%`, trend: trendOf(absorb - otherAbsorb) } : {}),
            });
        }
    }
    if (item.levelToEquip) {
        const met = who.level >= item.levelToEquip;
        rows.push({ label: 'Level', value: met ? `${item.levelToEquip}` : `${item.levelToEquip} (you are ${who.level})`, color: met ? undefined : OFF_THEME_INK.bad });
    }
    const req = offStrToEquip(id);
    const strMet = offWearCheck(id, who) !== 'str';
    const best = item.kind === 'weapon' ? offBestSpeedStr(item) : 0;
    rows.push({
        label: 'Required Str',
        value: strMet ? `${req}` : `${req} (you have ${who.str})`,
        color: strMet ? undefined : OFF_THEME_INK.bad,
        ...(strMet && best > req ? { note: `full speed ${best}` } : {}),
    });
    return { name, ...(nameColor ? { nameColor } : {}), kind, rows };
}

/** The card of an empty slot: bare hands for the weapon, a hint for the rest. */
export function offEmptySlotCard(slot: OffSlotId, slotName: string, who: OffWearer): OffItemCard {
    if (slot === 'weapon') {
        const fists = weaponDamageRange(OFF_FISTS, who.str, 1);
        return {
            name: 'Bare hands', kind: slotName,
            rows: [{ label: 'Damage', value: `${fists.min} – ${fists.max}` }, { label: OFF_BAG_TEXT.bareHands, value: '' }],
        };
    }
    return { name: OFF_BAG_TEXT.emptySlot, kind: slotName, rows: [{ label: OFF_BAG_TEXT.emptySlotHint, value: '' }] };
}
