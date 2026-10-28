// Logros (Fase 14B): la lista, en el orden en que salen en la pantalla Achievements.
// Cada uno tiene un id fijo (es lo que se guarda en el navegador: no cambiarlo nunca), nombre y descripción en inglés,
// y su meta. Para añadir uno basta con ponerlo aquí; si su meta es de un tipo nuevo, hay que enseñársela a
// systems/AchievementTracker.ts. Se guardan en systems/AchievementStore.ts.
import type { SoundKey } from '../config/assetManifest';
import type { CharacterId } from './characters';
import type { EnemyId } from './enemies';
import type { MapId } from './maps';
import type { NpcId } from './town';

/** What has to happen, during one run. */
export type AchievementGoal =
    | { kind: 'survive'; minutes: number }
    | { kind: 'level'; level: number }
    /** Monsters killed in one run. */
    | { kind: 'kills'; count: number }
    | { kind: 'killBoss'; enemy: EnemyId }
    /** Escape through the portal; optionally on a map, with a class, or without drinking a potion. */
    | { kind: 'win'; map?: MapId; character?: CharacterId; noPotions?: boolean }
    /** A piece in every armor slot of the class at the same time. */
    | { kind: 'fullArmor' }
    /** Rise again with Abaddon's Blood (Fase 21E). */
    | { kind: 'revive' }
    /** Die (for good), optionally on a map (Fase 22A). */
    | { kind: 'die'; map?: MapId }
    /** Free a captive from its Guard (Fase 29B; data/rescues.ts); without `npc`, every one of them. Unlike the rest,
     *  it is also checked when the game opens, so a rescue saved before this goal existed still counts. */
    | { kind: 'rescue'; npc?: NpcId }
    /** Monsters of one kind killed, adding up every run of every character on this device (Fase 29C). Bosses are other
     *  kinds (stoneGolemBoss…), so they never count; Champions and elites are the same kind, so they do. */
    | { kind: 'killTotal'; enemy: EnemyId; count: number };

export interface AchievementDef {
    name: string;
    description: string;
    goal: AchievementGoal;
}

export const ACHIEVEMENTS = {
    survive5: { name: 'Survivor', description: 'Survive 5 minutes.', goal: { kind: 'survive', minutes: 5 } },
    survive10: { name: 'Veteran', description: 'Survive 10 minutes.', goal: { kind: 'survive', minutes: 10 } },
    level20: { name: 'Rising Star', description: 'Reach Power 20 in a run.', goal: { kind: 'level', level: 20 } },
    level30: { name: 'Legend', description: 'Reach Power 30 in a run.', goal: { kind: 'level', level: 30 } },
    kills1000: { name: 'Slayer', description: 'Kill 1,000 monsters in one run.', goal: { kind: 'kills', count: 1000 } },
    kills3000: { name: 'Massacre', description: 'Kill 3,000 monsters in one run.', goal: { kind: 'kills', count: 3000 } },
    killEttin: { name: 'Ettin Slayer', description: 'Kill the Ettin.', goal: { kind: 'killBoss', enemy: 'ettin' } },
    killDemon: { name: 'Demon Hunter', description: 'Kill the Demon.', goal: { kind: 'killBoss', enemy: 'demon' } },
    killWyvern: { name: 'Dragon Slayer', description: 'Kill the Fire Wyvern.', goal: { kind: 'killBoss', enemy: 'fireWyvern' } },
    // Fase 22A (propietario, 20-oct-2026): ganar el mapa de introducción, y morir en él al menos una vez.
    winTraveler: { name: 'First Steps', description: 'Escape the Traveler Zone through the portal.', goal: { kind: 'win', map: 'traveler' } },
    noob: { name: 'n0000b', description: 'Die in the Traveler Zone.', goal: { kind: 'die', map: 'traveler' } },
    winBisle: { name: 'Island Conqueror', description: 'Escape Bleeding Isle through the portal.', goal: { kind: 'win', map: 'bisle' } },
    // Fase 22D.
    winElvine: { name: 'Garden Keeper', description: 'Escape Elvine Garden through the portal.', goal: { kind: 'win', map: 'elvineGarden' } },
    // Fase 22E.
    winMiddleland: { name: 'Warlord of Middleland', description: 'Escape Middleland through the portal.', goal: { kind: 'win', map: 'middleland' } },
    killUnicorn: { name: 'Unicorn Hunter', description: 'Kill the Unicorn.', goal: { kind: 'killBoss', enemy: 'unicorn' } },
    // Fase 30A.
    winIcebound: { name: 'Heart of Ice', description: 'Escape Icebound through the portal.', goal: { kind: 'win', map: 'icebound' } },
    killTigerworm: { name: 'Worm Breaker', description: 'Kill the Tigerworm.', goal: { kind: 'killBoss', enemy: 'tigerwormBoss' } },
    winWarrior: { name: 'Path of the Blade', description: 'Win a run as the Warrior.', goal: { kind: 'win', character: 'warrior' } },
    winMage: { name: 'Path of Magic', description: 'Win a run as the Mage.', goal: { kind: 'win', character: 'mage' } },
    noPotions: { name: 'Iron Will', description: 'Win a run without drinking a potion.', goal: { kind: 'win', noPotions: true } },
    fullArmor: { name: 'Fully Armored', description: 'Wear a piece in every armor slot.', goal: { kind: 'fullArmor' } },
    revive: { name: 'Blood of the Demon', description: "Revive with Abaddon's Blood.", goal: { kind: 'revive' } },
    // Fase 29B (propietario, 27-oct-2026): uno por rescate, más uno por rescatarlos a todos. Sin recompensa.
    rescueHoward: { name: 'Keeper of Keys', description: 'Rescue Howard in the Traveler Zone.', goal: { kind: 'rescue', npc: 'howard' } },
    rescueTom: { name: "Smith's Debt", description: 'Rescue Tom on Bleeding Isle.', goal: { kind: 'rescue', npc: 'tom' } },
    rescueShopKeeper: { name: 'Back in Business', description: 'Rescue the Shop Keeper in Elvine Garden.', goal: { kind: 'rescue', npc: 'shopKeeper' } },
    rescueAll: { name: 'Hero of the Town', description: 'Rescue everyone held captive.', goal: { kind: 'rescue' } },
    // Fase 29C (propietario, 27-oct-2026): uno por monstruo típico de cada mapa, sumando todas las partidas. Cifras
    // pensadas para unas 8–10 partidas del mapa donde más sale cada uno (Cyclops, ~4 de Middleland). Sin recompensa.
    killSlimes: { name: 'Slime Squasher', description: 'Kill 3,000 Slimes.', goal: { kind: 'killTotal', enemy: 'slime', count: 3000 } },
    killSnakes: { name: 'Snake Charmer', description: 'Kill 5,000 Snakes.', goal: { kind: 'killTotal', enemy: 'snake', count: 5000 } },
    killOrcs: { name: 'Orc Bane', description: 'Kill 2,000 Orcs.', goal: { kind: 'killTotal', enemy: 'orc', count: 2000 } },
    killSkeletons: { name: 'Bone Breaker', description: 'Kill 2,000 Skeletons.', goal: { kind: 'killTotal', enemy: 'skeleton', count: 2000 } },
    killTrolls: { name: 'Troll Hunter', description: 'Kill 2,000 Trolls.', goal: { kind: 'killTotal', enemy: 'troll', count: 2000 } },
    killWerewolves: { name: 'Silver Fang', description: 'Kill 2,000 Werewolves.', goal: { kind: 'killTotal', enemy: 'werewolf', count: 2000 } },
    killGiantTrees: { name: 'Lumberjack', description: 'Kill 2,000 Giant Trees.', goal: { kind: 'killTotal', enemy: 'giantTree', count: 2000 } },
    killCyclops: { name: 'One-Eyed No More', description: 'Kill 1,000 Cyclops.', goal: { kind: 'killTotal', enemy: 'cyclops', count: 1000 } },
} as const satisfies Record<string, AchievementDef>;

export type AchievementId = keyof typeof ACHIEVEMENTS;

export const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS) as AchievementId[];

export function getAchievement(id: AchievementId): AchievementDef {
    return ACHIEVEMENTS[id];
}

/** Event of GameScene that the HUD listens to, to show the "Achievement unlocked" notice (with the achievement's name). */
export const ACHIEVEMENT_EVENT = 'achievement';

/** Played when one is unlocked: the original's spell-cast chime (the same as a chest buff). */
export const ACHIEVEMENT_SOUND: SoundKey = 'sfx.buff';

/** How often the run is checked for the goals that grow (time, level, kills, armor). The kill counters of the
 *  'killTotal' goals are saved at the same pace, not at every kill. */
export const ACHIEVEMENT_CHECK_EVERY_MS = 500;
