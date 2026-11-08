// Helbreath Off: el cuadro de stats de un objeto (Fase Off-3C, en Equipment; desde la Off-4B también en el inventario).
// - Arma: daño desde / hasta de un golpe normal con tu STR (sin críticos), velocidad propia (Fast / Medium / Slow, sin
//   contar la STR) y la STR con la que llega a su mejor golpe. Armadura: defensa que suma.
// - Comparado con lo que llevas puesto en su hueco: verde si mejora, rojo si empeora.
// - STR necesaria y Level si lo pide (Off-5B; en rojo si no llegas) y atributos (Off-7B: lo que sueltan los monstruos;
//   el nombre de los objetos especiales, en verde como el original, y sus atributos en el color normal).
// - Pociones (Off-4B): qué llenan y cuánto, de menos a más. Slime Jelly: que se vende.
// - Magias (Off-6A, tienda y libro): maná, daño o efecto, elemento e INT que piden.
import Phaser from 'phaser';
import { EQUIPMENT_MET_COLOR, EQUIPMENT_UNMET_COLOR } from '../../config/equipment';
import { OFF_EQUIPMENT_BOX, OFF_EQUIPMENT_BOX_STYLE, OFF_EQUIPMENT_BOX_TITLE_STYLE, OFF_EQUIPMENT_SAME_COLOR } from '../config/offEquipment';
import { offBestSpeedStr, offSpeedLabel } from '../data/offCombat';
import { offGood } from '../data/offGoods';
import {
    diceAverage, isOffGearKey, isOffSpecial, OFF_FISTS, offGearDef, offGearEffects, offGearId, offGearKind, offGearRolls, offItemAbsorb, offNeedsText, offWearCheck,
    type OffBagItemKey, type OffGearKey, type OffItemDef, type OffWeaponItem, type OffWearer,
} from '../data/offItems';
import { OFF_ATTRIBUTES, offRollLines } from '../data/offAttributes';
import { OFF_ELEMENT_NAMES, OFF_SPELLS, offDiceRange, type OffSpellId } from '../data/offSpells';
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
export function offItemBoxLines(id: OffBagItemKey | undefined, worn: OffGearKey | undefined, who: OffWearer): OffBoxLine[] {
    const str = who.str;
    if (id !== undefined && !isOffGearKey(id)) {
        const good = offGood(id);
        const restores = good.restores;
        if (!restores) return [{ label: '', value: 'Only for selling.' }];
        const [count, sides, bonus] = restores.dice;
        return [{ label: 'Restores', value: `${BAR_LABELS[restores.what]} ${count + bonus} – ${count * sides + bonus}` }];
    }
    const item: OffItemDef | undefined = id ? offGearDef(id) : undefined;
    const other: OffItemDef | undefined = worn ? offGearDef(worn) : undefined;
    const comparing = id !== worn;
    const lines: OffBoxLine[] = [];
    const factorOf = (key: OffGearKey | undefined) => 1 + (key ? offGearEffects(key).damage ?? 0 : 0);
    if (item?.kind === 'weapon') {
        // Damage from / to of a normal blow with your STR, crits apart (owner: the dice were hard to read); with Sharp or
        // Ancient, their share on top (Off-7B).
        const range = (w: OffWeaponItem, key: OffGearKey | undefined) => {
            const r = weaponDamageRange(w, str, factorOf(key));
            return `${r.min} – ${r.max}`;
        };
        const damage = range(item, id);
        const speed = offSpeedLabel(item);
        const best = offBestSpeedStr(item);
        if (other?.kind === 'weapon' && comparing) {
            const average = (diceAverage(item.small) + diceAverage(item.large)) * factorOf(id);
            const otherAverage = (diceAverage(other.small) + diceAverage(other.large)) * factorOf(worn);
            const otherSpeed = offSpeedLabel(other);
            lines.push({ label: 'Damage', value: damage, now: { text: `(now ${range(other, worn)})`, better: Math.sign(average - otherAverage) } });
            lines.push({ label: 'Speed', value: speed.label, now: { text: `(now ${otherSpeed.label})`, better: Math.sign(otherSpeed.rank - speed.rank) } });
        } else {
            lines.push({ label: 'Damage', value: damage });
            lines.push({ label: 'Speed', value: speed.label });
        }
        // Range left out: every weapon so far reaches 1 tile (and the mobile box has no room for one more line).
        // Off-7E: two-handed weapons say so on the same line (the box has no room for one more).
        const fastest = best > 0 ? `Fastest with Str ${best}` : 'Fastest with any Str';
        lines.push({ label: '', value: item.twoHanded ? `${fastest} · Two-handed, no shield` : fastest });
    } else if (!item && other?.kind === 'weapon') {
        // An empty hand (Off-6A): bare hands' damage, compared with the weapon held.
        const show = (w: Pick<OffWeaponItem, 'small' | 'large'>, factor = 1) => {
            const r = weaponDamageRange(w, str, factor);
            return `${r.min} – ${r.max}`;
        };
        lines.push({ label: 'Damage', value: show(OFF_FISTS), now: { text: `(now ${show(other, factorOf(worn))})`, better: -1 } });
        lines.push({ label: '', value: 'Bare hands. Spells need an empty hand.' });
    } else {
        const defense = item?.kind === 'armor' ? item.defense : 0;
        const otherDefense = other?.kind === 'armor' ? other.defense : 0;
        const now = comparing ? { text: `(now +${otherDefense})`, better: Math.sign(defense - otherDefense) } : undefined;
        // Off-7D: what it takes away of a blow on its body part (shields: when the shield skill roll works).
        const absorb = item?.kind === 'armor' ? offItemAbsorb(item) : 0;
        lines.push({ label: 'Defense', value: absorb > 0 ? `+${defense} · Absorb ${absorb}%` : `+${defense}`, ...(now ? { now } : {}) });
    }
    if (item && id !== undefined && isOffGearKey(id)) {
        const met = offWearCheck(id, who) === 'ok';
        const have = item.levelToEquip ? `(you have ${str} · ${who.level})` : `(you have ${str})`;
        lines.push({ label: 'Needs', value: offNeedsText(id), valueColor: met ? EQUIPMENT_MET_COLOR : EQUIPMENT_UNMET_COLOR, now: { text: have, better: 0 } });
        // Off-7B: the attributes of what monsters drop (shop items have none).
        const attributes = offRollLines(offGearKind(offGearId(id)), offGearRolls(id));
        // Both on one line: the box has no room for one more.
        lines.push({ label: 'Attributes', value: attributes.length > 0 ? attributes.join(', ') : 'None' });
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
    titleColor?: string,
): Phaser.GameObjects.GameObject[] {
    const b = OFF_EQUIPMENT_BOX;
    const { x, y } = area;
    const objects: Phaser.GameObjects.GameObject[] = [
        scene.add.rectangle(x, y, area.width, area.height, b.background).setOrigin(0).setStrokeStyle(1, b.border),
        scene.add.text(x + b.padding, y + b.padding, title, { ...OFF_EQUIPMENT_BOX_TITLE_STYLE, ...(titleColor ? { color: titleColor } : {}) }),
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

/** Colour of an item's name: green for a special one (with attributes, Off-7B), as the original; undefined = normal. */
export function offItemNameColor(key: OffBagItemKey | undefined): string | undefined {
    return key !== undefined && isOffSpecial(key) ? OFF_ATTRIBUTES.nameColor : undefined;
}

const SHIELD_EFFECT: Partial<Record<OffSpellId, string>> = { defenseShield: 'Defense up', protectionFromMagic: 'Magic resistance up' };

/** What the box says about a spell (Off-6A): mana, what it does, element and the INT it needs (red if short). */
export function offSpellBoxLines(id: OffSpellId, int: number): OffBoxLine[] {
    const spell = OFF_SPELLS[id];
    const lines: OffBoxLine[] = [{ label: 'Mana', value: `${spell.mana}` }];
    if (spell.kind === 'damage' && spell.direct) {
        lines.push({ label: 'Damage', value: offDiceRange(spell.direct) });
        if (spell.area && spell.areaRange) {
            const side = spell.areaRange * 2 + 1;
            lines.push({ label: 'Area', value: `${side} × ${side} tiles, ${offDiceRange(spell.area)} each` });
        }
    } else if (spell.kind === 'heal' && spell.direct) {
        lines.push({ label: 'Heals', value: `${offDiceRange(spell.direct)} health` });
    } else {
        lines.push({ label: 'Effect', value: spell.kind === 'hold' ? "The monster can't move" : SHIELD_EFFECT[id] ?? '' });
        if (spell.durationSec) lines.push({ label: 'Lasts', value: `${spell.durationSec} seconds` });
    }
    if (spell.element) lines.push({ label: 'Element', value: OFF_ELEMENT_NAMES[spell.element] });
    const met = int >= spell.reqInt;
    lines.push({ label: 'Needs', value: `Int ${spell.reqInt}`, valueColor: met ? EQUIPMENT_MET_COLOR : EQUIPMENT_UNMET_COLOR, now: { text: `(you have ${int})`, better: 0 } });
    return lines;
}
