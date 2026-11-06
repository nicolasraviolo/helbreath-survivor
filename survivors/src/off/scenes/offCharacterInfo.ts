// Helbreath Off (Fase Off-3B): lo que la ventana Character de Survivors (scenes/CharacterInfoScene.ts, modo `off`)
// necesita del personaje de Off: nombre, nivel, experiencia, stats, puntos por repartir, vida / maná / estamina
// (lo que tiene y el máximo con los stats que se están repartiendo) y qué hacer al pulsar Ok.
import { START_EQUIPMENT } from '../../data/items';
import type { Stats } from '../../data/stats';
import type { CharacterInfoOff, CharacterInfoSceneData } from '../../scenes/CharacterInfoScene';
import type { MenuOverlayData } from '../../scenes/MenuOverlayScene';
import { OFF_STAT_HELP, OFF_STAT_IDS, OFF_STAT_MAX, offMaxHp, offMaxMana, offMaxStamina, type OffStats } from '../data/offCharacter';
import { OFF_LEVEL, offExpForLevel } from '../data/offLevel';
import { OFF_NOVICE } from '../data/offWorld';
import type { OffBattle } from '../systems/OffBattle';
import { offSaveStore } from '../systems/OffSaveStore';

/** Data to launch 'CharacterInfo' over Off's world (`worldKey`, paused: the window resumes it). */
export function offCharacterInfo(battle: OffBattle, worldKey: string, onClose: () => void): CharacterInfoSceneData & MenuOverlayData {
    const saved = offSaveStore.character;
    const level = battle.level;
    const off: CharacterInfoOff = {
        name: saved.name,
        subtitle: `Level ${level}`,
        def: OFF_NOVICE,
        look: saved.look,
        // Until there is gear (Off-4): the Dagger the novice carries.
        equipment: START_EQUIPMENT.warrior,
        level,
        exp: battle.exp,
        nextExp: level >= OFF_LEVEL.max ? undefined : offExpForLevel(level + 1),
        statIds: OFF_STAT_IDS,
        stats: { ...saved.stats, chr: 0 },
        points: battle.points,
        statMax: OFF_STAT_MAX,
        values: (stats) => {
            const s = { ...offStats(stats), level };
            return {
                health: `${Math.ceil(battle.hp)}/${offMaxHp(s)}`,
                mana: `${Math.ceil(battle.vitals.mana)}/${offMaxMana(s)}`,
                stamina: `${Math.ceil(battle.vitals.stamina)}/${offMaxStamina(s)}`,
            };
        },
        statHelp: OFF_STAT_HELP,
        assign: (added) => battle.assignPoints(offStats(added)),
        onClose,
    };
    return { characterUid: undefined, classId: 'warrior', off, returnTo: worldKey };
}

function offStats(stats: Readonly<Stats>): OffStats {
    return { str: stats.str, vit: stats.vit, dex: stats.dex, int: stats.int, mag: stats.mag };
}
