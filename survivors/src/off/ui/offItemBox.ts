// Helbreath Off: el cuadro de stats de un objeto (Fase Off-3C, en Equipment; desde la Off-4B también en el inventario).
// - Arma: daño desde / hasta de un golpe normal con tu STR (sin críticos), velocidad propia (Fast / Medium / Slow, sin
//   contar la STR) y la STR con la que llega a su mejor golpe. Armadura: defensa que suma.
// - Comparado con lo que llevas puesto en su hueco: verde si mejora, rojo si empeora.
// - STR necesaria (en rojo si no llegas) y atributos (ninguno de momento).
// - Pociones (Off-4B): qué llenan y cuánto, de menos a más. Slime Jelly: que se vende.
import Phaser from 'phaser';
import { EQUIPMENT_MET_COLOR, EQUIPMENT_UNMET_COLOR } from '../../config/equipment';
import { OFF_EQUIPMENT_BOX, OFF_EQUIPMENT_BOX_STYLE, OFF_EQUIPMENT_BOX_TITLE_STYLE, OFF_EQUIPMENT_SAME_COLOR } from '../config/offEquipment';
import { offBestSpeedStr, offSpeedLabel } from '../data/offCombat';
import { offGood } from '../data/offGoods';
import { diceAverage, isOffItemId, OFF_ITEMS, type OffBagItemId, type OffItemDef, type OffItemId, type OffWeaponItem } from '../data/offItems';
import { weaponDamageRange } from '../systems/OffCombatRules';

/** A line of the stat box: label, value, and how the worn item compares. */
export interface OffBoxLine {
    label: string;
    value: string;
    /** Value colour (requirements: green / red). */
    valueColor?: string;
    /** "(now …)" and whether the marked item is better (1), worse (−1) or the same (0). */
    now?: { text: string; better: number };
}

const BAR_LABELS = { hp: 'Health', mana: 'Mana', stamina: 'Stamina' } as const;

/**
 * What the box says about an item (undefined = an empty slot), compared with `worn` when it is another one (an empty
 * armour slot counts as defence 0). Goods (potions, Slime Jelly) are not compared.
 */
export function offItemBoxLines(id: OffBagItemId | undefined, worn: OffItemId | undefined, str: number): OffBoxLine[] {
    if (id !== undefined && !isOffItemId(id)) {
        const good = offGood(id);
        const restores = good.restores;
        if (!restores) return [{ label: '', value: 'Only for selling.' }];
        const [count, sides, bonus] = restores.dice;
        return [{ label: 'Restores', value: `${BAR_LABELS[restores.what]} ${count + bonus} – ${count * sides + bonus}` }];
    }
    const item: OffItemDef | undefined = id ? OFF_ITEMS[id] : undefined;
    const other: OffItemDef | undefined = worn ? OFF_ITEMS[worn] : undefined;
    const comparing = id !== worn;
    const lines: OffBoxLine[] = [];
    if (item?.kind === 'weapon') {
        // Damage from / to of a normal blow with your STR, crits apart (owner: the dice were hard to read).
        const range = (w: OffWeaponItem) => {
            const r = weaponDamageRange(w, str);
            return `${r.min} – ${r.max}`;
        };
        const damage = range(item);
        const speed = offSpeedLabel(item);
        const best = offBestSpeedStr(item);
        if (other?.kind === 'weapon' && comparing) {
            const average = diceAverage(item.small) + diceAverage(item.large);
            const otherAverage = diceAverage(other.small) + diceAverage(other.large);
            const otherSpeed = offSpeedLabel(other);
            lines.push({ label: 'Damage', value: damage, now: { text: `(now ${range(other)})`, better: Math.sign(average - otherAverage) } });
            lines.push({ label: 'Speed', value: speed.label, now: { text: `(now ${otherSpeed.label})`, better: Math.sign(otherSpeed.rank - speed.rank) } });
        } else {
            lines.push({ label: 'Damage', value: damage });
            lines.push({ label: 'Speed', value: speed.label });
        }
        // Range left out: every weapon so far reaches 1 tile (and the mobile box has no room for one more line).
        lines.push({ label: '', value: best > 0 ? `Fastest with Str ${best}` : 'Fastest with any Str' });
    } else {
        const defense = item?.kind === 'armor' ? item.defense : 0;
        const otherDefense = other?.kind === 'armor' ? other.defense : 0;
        const now = comparing ? { text: `(now +${otherDefense})`, better: Math.sign(defense - otherDefense) } : undefined;
        lines.push({ label: 'Defense', value: `+${defense}`, ...(now ? { now } : {}) });
    }
    if (item) {
        const met = str >= item.strToEquip;
        lines.push({ label: 'Needs', value: `Str ${item.strToEquip}`, valueColor: met ? EQUIPMENT_MET_COLOR : EQUIPMENT_UNMET_COLOR, now: { text: `(you have ${str})`, better: 0 } });
        // Attributes (Sharp, Poison...) are for later: the loot so far has none.
        lines.push({ label: 'Attributes', value: 'None' });
    } else if (other) {
        lines.push({ label: '', value: `Takes off the ${other.name}.` });
    }
    return lines;
}

/** Draws the box (frame, title and lines) and returns its objects, to destroy them when it changes. */
export function drawOffItemBox(
    scene: Phaser.Scene,
    area: { x: number; y: number; width: number; height: number },
    title: string,
    lines: readonly OffBoxLine[],
): Phaser.GameObjects.GameObject[] {
    const b = OFF_EQUIPMENT_BOX;
    const { x, y } = area;
    const objects: Phaser.GameObjects.GameObject[] = [
        scene.add.rectangle(x, y, area.width, area.height, b.background).setOrigin(0).setStrokeStyle(1, b.border),
        scene.add.text(x + b.padding, y + b.padding, title, OFF_EQUIPMENT_BOX_TITLE_STYLE),
    ];
    let lineY = y + b.padding + b.lineHeight + 2;
    for (const line of lines) {
        const label = scene.add.text(x + b.padding, lineY, line.label, { ...OFF_EQUIPMENT_BOX_STYLE, color: OFF_EQUIPMENT_SAME_COLOR });
        const value = scene.add.text(x + b.padding + b.valueX, lineY, line.value, { ...OFF_EQUIPMENT_BOX_STYLE, ...(line.valueColor ? { color: line.valueColor } : {}) });
        objects.push(label, value);
        if (line.now) {
            const color = line.now.better > 0 ? EQUIPMENT_MET_COLOR : line.now.better < 0 ? EQUIPMENT_UNMET_COLOR : OFF_EQUIPMENT_SAME_COLOR;
            objects.push(scene.add.text(value.x + value.width + 8, lineY, line.now.text, { ...OFF_EQUIPMENT_BOX_STYLE, color }));
        }
        lineY += b.lineHeight;
    }
    return objects;
}
