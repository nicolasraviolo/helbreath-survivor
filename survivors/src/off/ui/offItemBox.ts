// Helbreath Off: lo que queda del cuadro de stats viejo (Fase Off-3C). Desde la Off-13D la tienda usa la ficha nueva
// (off/ui/offItemCard.ts) y el cuadro dibujado se quitó; aquí siguen las líneas de una magia (maná, daño o efecto,
// elemento e INT que pide, para la tienda y la pestaña Magic) y el color del nombre de los objetos especiales.
import { EQUIPMENT_MET_COLOR, EQUIPMENT_UNMET_COLOR } from '../../config/equipment';
import { isOffSpecial, offManaCost, type OffBagItemKey, type OffEquipment } from '../data/offItems';
import { OFF_ATTRIBUTES } from '../data/offAttributes';
import { OFF_ELEMENT_NAMES, OFF_SPELL_LINE, OFF_SPELLS, offDiceBounds, offDiceRange, type OffSpellId } from '../data/offSpells';

/** A line of the stat box: label, value, and how the worn item compares. */
export interface OffBoxLine {
    label: string;
    value: string;
    /** Value colour (requirements: green / red). */
    valueColor?: string;
    /** Off-12C: a requirement line, met or not (the new card colours it from this). */
    met?: boolean;
    /** "(now …)" and whether the marked item is better (1), worse (−1) or the same (0). */
    now?: { text: string; better: number };
}

/** Colour of an item's name: green for a special one (with attributes, Off-7B), as the original; undefined = normal. */
export function offItemNameColor(key: OffBagItemKey | undefined): string | undefined {
    return key !== undefined && isOffSpecial(key) ? OFF_ATTRIBUTES.nameColor : undefined;
}

/** What a shield (Off-6C) or Berserk (Off-8C) does, in the box. */
const SHIELD_EFFECT: Partial<Record<OffSpellId, string>> = { defenseShield: 'Defense up', protectionFromMagic: 'Magic resistance up', absoluteMagicProtection: 'Immune to monster spells', berserk: 'Double damage with blows' };

/** A spell's lines; with `equipment`, the mana it costs with the wand held (Off-11A). */
export function offSpellBoxLines(id: OffSpellId, int: number, equipment?: Readonly<OffEquipment>): OffBoxLine[] {
    const spell = OFF_SPELLS[id];
    const cost = equipment ? offManaCost(spell.mana, equipment) : spell.mana;
    const lines: OffBoxLine[] = [cost === spell.mana
        ? { label: 'Mana', value: `${spell.mana}` }
        : { label: 'Mana', value: `${cost}`, now: { text: `(${spell.mana} without the wand)`, better: Math.sign(spell.mana - cost) } }];
    if (spell.kind === 'damage' && spell.shape === 'wave' && spell.direct && spell.area) {
        // Off-11B, Earth Shock Wave: both rolls on everyone along the line.
        const [lowA, highA] = offDiceBounds(spell.area);
        const [lowD, highD] = offDiceBounds(spell.direct);
        lines.push({ label: 'Line', value: `${OFF_SPELL_LINE.lastStep} tiles, ${lowA + lowD} – ${highA + highD} each` });
    } else if (spell.kind === 'damage' && (spell.direct || spell.area)) {
        if (spell.direct) lines.push({ label: 'Damage', value: offDiceRange(spell.direct) });
        if (spell.area && spell.shape === 'bolt') lines.push({ label: 'Line', value: `${offDiceRange(spell.area)} on the way` });
        if (spell.area && spell.areaRange) {
            const side = spell.areaRange * 2 + 1;
            lines.push({ label: 'Area', value: `${side} × ${side} tiles, ${offDiceRange(spell.area)} each` });
        }
        if (spell.freezeSec) lines.push({ label: 'Freezes', value: `${spell.freezeSec} seconds` });
    } else if (spell.kind === 'heal' && spell.direct) {
        lines.push({ label: 'Heals', value: `${offDiceRange(spell.direct)} health` });
    } else {
        lines.push({ label: 'Effect', value: spell.kind === 'hold' ? "The monster can't move" : SHIELD_EFFECT[id] ?? '' });
        if (spell.durationSec) lines.push({ label: 'Lasts', value: `${spell.durationSec} seconds` });
    }
    if (spell.element) lines.push({ label: 'Element', value: OFF_ELEMENT_NAMES[spell.element] });
    const met = int >= spell.reqInt;
    lines.push({ label: 'Needs', value: `Int ${spell.reqInt}`, met, valueColor: met ? EQUIPMENT_MET_COLOR : EQUIPMENT_UNMET_COLOR, now: { text: `(you have ${int})`, better: 0 } });
    return lines;
}
