// Helbreath Off (Fase Off-8D): cuándo habla el mercenario (las frases y sus números, en data/offMercenary.ts).
// - "Heal me!" con poca vida (Kaila, solo si no le queda maná para curarse ella).
// - "Zerk me!" (Gorn) peleando contra un monstruo con vida para muchos golpes tuyos, si tú sabes Berserk y él no lo lleva.
// - "I'm out of mana!" (Kaila) sin maná para un Heal, peleando o contigo mal de vida.
// - "Drink a potion!" (Gorn) / "Hold on!" (Kaila) cuando a ti te queda muy poca vida.
// Cada frase espera OFF_MERCENARY_TALK.repeatMs para repetirse, y entre dos frases pasa al menos gapMs (OffMercenary.say).
// Caer, levantarse y que lo contrates hablan sin esperar turno (OffMercenary.fall / standUp, OffBattle.hireMercenary).
import { OFF_MERCENARY_TALK } from '../data/offMercenary';
import { OFF_SPELLS, type OffSpellId } from '../data/offSpells';
import type { OffMercenary } from '../entities/OffMercenary';
import type { OffOwnerNeeds } from './OffMercenaryAI';

/** What it looks at before talking. */
export interface OffMercenaryTalkWorld {
    /** Your health and buffs, or undefined while you are dead. */
    ownerNeeds(): OffOwnerNeeds | undefined;
    /** You have learned that spell. */
    knows(id: OffSpellId): boolean;
}

/** One frame of talk (after its brain, so it knows what it fights). At most one line. */
export function updateMercenaryTalk(merc: OffMercenary, world: OffMercenaryTalkWorld): void {
    if (merc.isDown) return;
    const talk = OFF_MERCENARY_TALK;
    const needs = world.ownerNeeds();
    const healMana = OFF_SPELLS.heal.mana;
    const noMana = merc.isCaster && merc.mana < healMana;
    const fighting = merc.target !== undefined && merc.target.isAlive;
    if (merc.hp / Math.max(1, merc.maxHp) < talk.healMeBelow && (!merc.isCaster || noMana) && merc.say('healMe')) return;
    if (needs && needs.hpShare < talk.ownerLowBelow && merc.say('ownerLow')) return;
    if (noMana && (fighting || (needs !== undefined && needs.hpShare < talk.ownerLowBelow)) && merc.say('noMana')) return;
    const target = merc.target;
    if (!merc.isCaster && fighting && target && !merc.isBerserk && needs && world.knows('berserk')
        && target.hp >= needs.blowDamage * talk.zerkMinBlows) merc.say('zerkMe');
}
