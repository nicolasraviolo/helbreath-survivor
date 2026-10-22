// Línea de tiempo de la partida (Fase 7, sustituye a data/spawn.ts). Sigue la tabla "Oleadas" de docs/DESIGN.md.
// Desde la Fase 22A hay una por mapa (TIMELINES), cada una con sus oleadas y sus eventos:
// - waves: qué enemigos salen en cada tramo, cada cuánto y cuántos a la vez como máximo.
// - events: momentos concretos (minijefes, jefe final, "te rodean") con su aviso en pantalla.
//   Desde que sale el jefe final (Fase 13) no salen monstruos de las oleadas: solo sus esbirros (BOSS_MINIONS en enemies.ts).
// - PORTAL: al matar al jefe final mueren todos los monstruos y suelta su cofre; al abrirlo se abre un portal y entrar en
//   él (o esperar) gana la partida. Toda la XP del suelo vuela sola hacia el jugador y los niveles que dé suben
//   sin cartas (Fase 13C); la pantalla de victoria dice el nivel alcanzado.
// Todos los números son un borrador: se ajustan jugando.
import { ESSENTIAL_ENEMIES, type EnemyId } from './enemies';
import { MAP_IDS, MAPS_DATA, type MapDef, type MapId } from './maps';

export interface WaveDef {
    /** Minute this wave starts (it lasts until the next one). */
    fromMinute: number;
    enemies: ReadonlyArray<{ enemy: EnemyId; weight: number }>;
    /** Seconds between spawn events at the start of the wave, going down to `endInterval` by its end. */
    startInterval: number;
    endInterval: number;
    /** Enemies created per spawn event. */
    batchSize: number;
    /** No new spawns while this many enemies are alive. */
    maxAlive: number;
}

/** One map's timeline (Fase 22A): its waves and its events, by minute. */
export interface MapTimeline {
    waves: readonly WaveDef[];
    events: readonly WaveEventDef[];
}

export type WaveEventKind = 'boss' | 'finalBoss' | 'surround' | 'stampede';

export interface WaveEventDef {
    atMinute: number;
    kind: WaveEventKind;
    enemy: EnemyId;
    /** Surround: how many enemies form the ring. Stampede: how many charge. */
    count?: number;
    /** Shown in the middle of the screen with the game's sprite font. */
    message: string;
}

// Bleeding Isle (Fase 13B, 18-oct-2026): solo los esenciales (ESSENTIAL_ENEMIES, de más débil a más fuerte) y, desde
// la mitad, los propios del mapa (MAPS_DATA.bisle.localEnemies) con poco peso: salen menos, pero pegan más.
// El resto de monstruos de enemies.ts (Bunny, Troll, Werewolf, Lich, Gargoyle…) queda para otros mapas.
// Al final del archivo se comprueba que cada oleada solo use monstruos permitidos en el mapa.
const BISLE_WAVES: readonly WaveDef[] = [
    // Ajuste del 18-oct-2026 (propietario): un monstruo nuevo cada ~minuto, los débiles siguen saliendo poco para dar
    // variedad, y menos monstruos a la vez (pero con el doble de vida y más daño, enemies.ts). Con un jefe vivo no sale
    // las oleadas van más despacio (SPAWN.duringBoss).
    { fromMinute: 0, enemies: [{ enemy: 'slime', weight: 6 }, { enemy: 'ant', weight: 4 }], startInterval: 1.4, endInterval: 0.9, batchSize: 2, maxAlive: 100 },
    { fromMinute: 1, enemies: [{ enemy: 'slime', weight: 3 }, { enemy: 'ant', weight: 4 }, { enemy: 'snake', weight: 4 }], startInterval: 1.1, endInterval: 0.8, batchSize: 2, maxAlive: 120 },
    { fromMinute: 2, enemies: [{ enemy: 'slime', weight: 1 }, { enemy: 'ant', weight: 2 }, { enemy: 'snake', weight: 3 }, { enemy: 'orc', weight: 5 }], startInterval: 1, endInterval: 0.7, batchSize: 2, maxAlive: 140 },
    { fromMinute: 3, enemies: [{ enemy: 'slime', weight: 1 }, { enemy: 'ant', weight: 1 }, { enemy: 'snake', weight: 2 }, { enemy: 'orc', weight: 4 }, { enemy: 'orcMage', weight: 2 }, { enemy: 'zombie', weight: 4 }], startInterval: 0.9, endInterval: 0.65, batchSize: 2, maxAlive: 160 },
    { fromMinute: 4, enemies: [{ enemy: 'snake', weight: 1 }, { enemy: 'orc', weight: 2 }, { enemy: 'orcMage', weight: 1 }, { enemy: 'zombie', weight: 3 }, { enemy: 'scorpion', weight: 4 }], startInterval: 0.8, endInterval: 0.6, batchSize: 2, maxAlive: 170 },
    { fromMinute: 5, enemies: [{ enemy: 'ant', weight: 1 }, { enemy: 'orc', weight: 1 }, { enemy: 'zombie', weight: 2 }, { enemy: 'scorpion', weight: 3 }, { enemy: 'skeleton', weight: 4 }], startInterval: 0.75, endInterval: 0.55, batchSize: 2, maxAlive: 180 },
    { fromMinute: 6, enemies: [{ enemy: 'slime', weight: 1 }, { enemy: 'orc', weight: 1 }, { enemy: 'scorpion', weight: 2 }, { enemy: 'skeleton', weight: 3 }, { enemy: 'clayGolem', weight: 4 }], startInterval: 0.7, endInterval: 0.5, batchSize: 2, maxAlive: 200 },
    { fromMinute: 7, enemies: [{ enemy: 'snake', weight: 1 }, { enemy: 'zombie', weight: 1 }, { enemy: 'scorpion', weight: 1 }, { enemy: 'skeleton', weight: 2 }, { enemy: 'clayGolem', weight: 3 }, { enemy: 'cyclops', weight: 1 }], startInterval: 0.65, endInterval: 0.5, batchSize: 2, maxAlive: 210 },
    { fromMinute: 8, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'skeleton', weight: 2 }, { enemy: 'clayGolem', weight: 2 }, { enemy: 'stoneGolem', weight: 4 }, { enemy: 'cyclops', weight: 1 }], startInterval: 0.6, endInterval: 0.45, batchSize: 2, maxAlive: 220 },
    { fromMinute: 9, enemies: [{ enemy: 'slime', weight: 1 }, { enemy: 'skeleton', weight: 1 }, { enemy: 'clayGolem', weight: 1 }, { enemy: 'stoneGolem', weight: 3 }, { enemy: 'frog', weight: 3 }, { enemy: 'cyclops', weight: 1 }, { enemy: 'cannibalPlant', weight: 1 }], startInterval: 0.55, endInterval: 0.45, batchSize: 2, maxAlive: 240 },
    { fromMinute: 10, enemies: [{ enemy: 'ant', weight: 1 }, { enemy: 'zombie', weight: 1 }, { enemy: 'stoneGolem', weight: 3 }, { enemy: 'frog', weight: 3 }, { enemy: 'cyclops', weight: 1 }, { enemy: 'cannibalPlant', weight: 1 }, { enemy: 'ogre', weight: 1 }], startInterval: 0.5, endInterval: 0.4, batchSize: 2, maxAlive: 250 },
    { fromMinute: 11, enemies: [{ enemy: 'slime', weight: 1 }, { enemy: 'orc', weight: 1 }, { enemy: 'stoneGolem', weight: 3 }, { enemy: 'frog', weight: 3 }, { enemy: 'cyclops', weight: 1 }, { enemy: 'cannibalPlant', weight: 1 }, { enemy: 'ogre', weight: 1 }, { enemy: 'mountainGiant', weight: 1 }], startInterval: 0.5, endInterval: 0.4, batchSize: 2, maxAlive: 260 },
];

const BISLE_EVENTS: readonly WaveEventDef[] = [
    { atMinute: 3, kind: 'surround', enemy: 'snake', count: 28, message: 'You are surrounded!' },
    { atMinute: 4.5, kind: 'stampede', enemy: 'orc', count: 18, message: 'Orc stampede!' },
    { atMinute: 5, kind: 'boss', enemy: 'ettin', message: 'The Ettin approaches!' },
    { atMinute: 7, kind: 'surround', enemy: 'skeleton', count: 24, message: 'The dead rise around you!' },
    { atMinute: 8, kind: 'boss', enemy: 'demon', message: 'A Demon has risen!' },
    { atMinute: 9.5, kind: 'stampede', enemy: 'frog', count: 18, message: 'The frogs stampede!' },
    { atMinute: 10.5, kind: 'surround', enemy: 'stoneGolem', count: 26, message: 'You are surrounded!' },
    { atMinute: 12, kind: 'finalBoss', enemy: 'fireWyvern', message: 'The Fire Wyvern awakens!' },
];

// Traveler Zone (Fase 22A, decidido el 20-oct-2026): mapa de introducción. Muchos monstruos, pero de los más básicos y
// muy flojos (MAPS_DATA.traveler.difficulty), para que sea divertido sin agobiar. Dura unos 8 minutos: el Stone Golem
// en el 4 y el Dummy (jefe final, lento y de 1 de daño, rodeado de bichos) en el 7. Sin estampidas.
const TRAVELER_WAVES: readonly WaveDef[] = [
// 22C (21-oct-2026): el propietario la vio demasiado fácil. Entra el Cat, ~15–20% más bichos a la vez y algo más
// seguidos desde el minuto 3, y una encerrona de gatos en el 3,5. Los jefes no cambian.
    { fromMinute: 0, enemies: [{ enemy: 'slime', weight: 5 }, { enemy: 'bunny', weight: 4 }, { enemy: 'cat', weight: 3 }], startInterval: 0.9, endInterval: 0.6, batchSize: 3, maxAlive: 140 },
    { fromMinute: 1, enemies: [{ enemy: 'slime', weight: 3 }, { enemy: 'bunny', weight: 3 }, { enemy: 'cat', weight: 3 }, { enemy: 'ant', weight: 4 }], startInterval: 0.7, endInterval: 0.5, batchSize: 3, maxAlive: 185 },
    { fromMinute: 2, enemies: [{ enemy: 'slime', weight: 2 }, { enemy: 'bunny', weight: 2 }, { enemy: 'cat', weight: 3 }, { enemy: 'ant', weight: 3 }, { enemy: 'snake', weight: 3 }], startInterval: 0.6, endInterval: 0.45, batchSize: 4, maxAlive: 235 },
    { fromMinute: 3, enemies: [{ enemy: 'slime', weight: 1 }, { enemy: 'bunny', weight: 2 }, { enemy: 'cat', weight: 2 }, { enemy: 'ant', weight: 3 }, { enemy: 'snake', weight: 4 }], startInterval: 0.5, endInterval: 0.36, batchSize: 4, maxAlive: 260 },
    { fromMinute: 4, enemies: [{ enemy: 'slime', weight: 1 }, { enemy: 'bunny', weight: 1 }, { enemy: 'cat', weight: 2 }, { enemy: 'ant', weight: 3 }, { enemy: 'snake', weight: 5 }], startInterval: 0.45, endInterval: 0.35, batchSize: 4, maxAlive: 285 },
    { fromMinute: 5, enemies: [{ enemy: 'slime', weight: 3 }, { enemy: 'bunny', weight: 2 }, { enemy: 'cat', weight: 2 }, { enemy: 'ant', weight: 3 }, { enemy: 'snake', weight: 3 }], startInterval: 0.4, endInterval: 0.3, batchSize: 5, maxAlive: 305 },
    { fromMinute: 6, enemies: [{ enemy: 'slime', weight: 2 }, { enemy: 'bunny', weight: 2 }, { enemy: 'cat', weight: 3 }, { enemy: 'ant', weight: 3 }, { enemy: 'snake', weight: 4 }], startInterval: 0.35, endInterval: 0.3, batchSize: 5, maxAlive: 330 },
];

const TRAVELER_EVENTS: readonly WaveEventDef[] = [
    { atMinute: 2.5, kind: 'surround', enemy: 'bunny', count: 24, message: 'You are surrounded!' },
    { atMinute: 3.5, kind: 'surround', enemy: 'cat', count: 28, message: 'Cats everywhere!' },
    { atMinute: 4, kind: 'boss', enemy: 'stoneGolemBoss', message: 'A Stone Golem blocks the way!' },
    { atMinute: 5.5, kind: 'surround', enemy: 'slime', count: 30, message: 'Slimes everywhere!' },
    { atMinute: 7, kind: 'finalBoss', enemy: 'dummy', message: 'The Training Dummy wakes up!' },
];

// Elvine Garden (Fase 22D, monstruos y jefes elegidos por el propietario el 21-oct-2026): los del jardín original (Orc,
// Orc-Mage, Troll, Giant Tree, Cannibal Plant) más Zombie, Scorpion, Giant Frog y Werewolf. Sin los esenciales más
// flojos (Slime, Ant, Snake…). Vida y daño ×1,3 (MAPS_DATA.elvineGarden.difficulty). Dura 12 minutos, como Bleeding
// Isle: Hellhound en el 4, Stalker en el 8 y Cyclops (jefe final) en el 12. Encerrona de Orc-Mages.
const ELVINE_WAVES: readonly WaveDef[] = [
    { fromMinute: 0, enemies: [{ enemy: 'orc', weight: 6 }, { enemy: 'zombie', weight: 3 }], startInterval: 1.3, endInterval: 0.9, batchSize: 2, maxAlive: 100 },
    { fromMinute: 1, enemies: [{ enemy: 'orc', weight: 5 }, { enemy: 'zombie', weight: 4 }, { enemy: 'orcMage', weight: 2 }], startInterval: 1.1, endInterval: 0.8, batchSize: 2, maxAlive: 120 },
    { fromMinute: 2, enemies: [{ enemy: 'orc', weight: 4 }, { enemy: 'zombie', weight: 3 }, { enemy: 'orcMage', weight: 3 }, { enemy: 'scorpion', weight: 3 }], startInterval: 1, endInterval: 0.7, batchSize: 2, maxAlive: 140 },
    { fromMinute: 3, enemies: [{ enemy: 'orc', weight: 3 }, { enemy: 'zombie', weight: 2 }, { enemy: 'orcMage', weight: 2 }, { enemy: 'scorpion', weight: 4 }, { enemy: 'frog', weight: 2 }], startInterval: 0.9, endInterval: 0.65, batchSize: 2, maxAlive: 160 },
    { fromMinute: 4, enemies: [{ enemy: 'orc', weight: 2 }, { enemy: 'orcMage', weight: 2 }, { enemy: 'scorpion', weight: 3 }, { enemy: 'frog', weight: 3 }, { enemy: 'troll', weight: 2 }], startInterval: 0.8, endInterval: 0.6, batchSize: 2, maxAlive: 170 },
    { fromMinute: 5, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'orcMage', weight: 2 }, { enemy: 'scorpion', weight: 2 }, { enemy: 'frog', weight: 3 }, { enemy: 'troll', weight: 4 }], startInterval: 0.75, endInterval: 0.55, batchSize: 2, maxAlive: 180 },
    { fromMinute: 6, enemies: [{ enemy: 'orcMage', weight: 2 }, { enemy: 'zombie', weight: 1 }, { enemy: 'frog', weight: 2 }, { enemy: 'troll', weight: 4 }, { enemy: 'werewolf', weight: 3 }], startInterval: 0.7, endInterval: 0.5, batchSize: 2, maxAlive: 200 },
    { fromMinute: 7, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'orcMage', weight: 1 }, { enemy: 'frog', weight: 1 }, { enemy: 'troll', weight: 3 }, { enemy: 'werewolf', weight: 3 }, { enemy: 'giantTree', weight: 2 }], startInterval: 0.65, endInterval: 0.5, batchSize: 2, maxAlive: 210 },
    { fromMinute: 8, enemies: [{ enemy: 'orcMage', weight: 1 }, { enemy: 'scorpion', weight: 1 }, { enemy: 'troll', weight: 2 }, { enemy: 'werewolf', weight: 3 }, { enemy: 'giantTree', weight: 3 }], startInterval: 0.6, endInterval: 0.45, batchSize: 2, maxAlive: 220 },
    { fromMinute: 9, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'troll', weight: 2 }, { enemy: 'werewolf', weight: 2 }, { enemy: 'giantTree', weight: 3 }, { enemy: 'cannibalPlant', weight: 2 }], startInterval: 0.55, endInterval: 0.45, batchSize: 2, maxAlive: 240 },
    { fromMinute: 10, enemies: [{ enemy: 'orcMage', weight: 1 }, { enemy: 'troll', weight: 1 }, { enemy: 'werewolf', weight: 2 }, { enemy: 'giantTree', weight: 3 }, { enemy: 'cannibalPlant', weight: 3 }], startInterval: 0.5, endInterval: 0.4, batchSize: 2, maxAlive: 250 },
    { fromMinute: 11, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'troll', weight: 1 }, { enemy: 'werewolf', weight: 2 }, { enemy: 'giantTree', weight: 3 }, { enemy: 'cannibalPlant', weight: 3 }], startInterval: 0.5, endInterval: 0.4, batchSize: 2, maxAlive: 260 },
];

const ELVINE_EVENTS: readonly WaveEventDef[] = [
    { atMinute: 2.5, kind: 'surround', enemy: 'orcMage', count: 18, message: 'The mages surround you!' },
    { atMinute: 3.5, kind: 'stampede', enemy: 'orc', count: 18, message: 'Orc stampede!' },
    { atMinute: 4, kind: 'boss', enemy: 'hellhoundBoss', message: 'A Hellhound is on the hunt!' },
    { atMinute: 6.5, kind: 'surround', enemy: 'troll', count: 20, message: 'Trolls close in!' },
    { atMinute: 8, kind: 'boss', enemy: 'stalkerBoss', message: 'The Stalker is watching you...' },
    { atMinute: 9.5, kind: 'surround', enemy: 'giantTree', count: 22, message: 'The trees are moving!' },
    { atMinute: 12, kind: 'finalBoss', enemy: 'cyclopsBoss', message: 'The Cyclops awakens!' },
];

// Middleland (Fase 22E, monstruos, jefes y eventos de la horda y la manada elegidos por el propietario el 21-oct-2026):
// los del Middleland original (middleland.txt de centuu/HelbreathServer: Orc, Zombie, Scorpion, Skeleton, Snake,
// Werewolf, Ogre, Cyclops, Stalker, Ettin) más Troll. Vida y daño ×1,6 (MAPS_DATA.middleland.difficulty). Dura
// 15 minutos: Mountain Giant en el 4, Giant Lizard en el 8, Ettin Berserk en el 12 y Unicorn (jefe final) en el 15.
const MIDDLELAND_WAVES: readonly WaveDef[] = [
    { fromMinute: 0, enemies: [{ enemy: 'orc', weight: 5 }, { enemy: 'zombie', weight: 4 }, { enemy: 'scorpion', weight: 2 }], startInterval: 1.3, endInterval: 0.9, batchSize: 2, maxAlive: 100 },
    { fromMinute: 1, enemies: [{ enemy: 'orc', weight: 4 }, { enemy: 'zombie', weight: 4 }, { enemy: 'scorpion', weight: 3 }], startInterval: 1.1, endInterval: 0.8, batchSize: 2, maxAlive: 120 },
    { fromMinute: 2, enemies: [{ enemy: 'orc', weight: 3 }, { enemy: 'zombie', weight: 3 }, { enemy: 'scorpion', weight: 4 }, { enemy: 'snake', weight: 2 }], startInterval: 1, endInterval: 0.7, batchSize: 2, maxAlive: 140 },
    { fromMinute: 3, enemies: [{ enemy: 'orc', weight: 2 }, { enemy: 'zombie', weight: 2 }, { enemy: 'scorpion', weight: 3 }, { enemy: 'snake', weight: 2 }, { enemy: 'skeleton', weight: 4 }], startInterval: 0.9, endInterval: 0.65, batchSize: 2, maxAlive: 160 },
    { fromMinute: 4, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'zombie', weight: 2 }, { enemy: 'scorpion', weight: 2 }, { enemy: 'snake', weight: 1 }, { enemy: 'skeleton', weight: 4 }, { enemy: 'werewolf', weight: 1 }], startInterval: 0.8, endInterval: 0.6, batchSize: 2, maxAlive: 170 },
    { fromMinute: 5, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'scorpion', weight: 2 }, { enemy: 'skeleton', weight: 3 }, { enemy: 'werewolf', weight: 3 }, { enemy: 'troll', weight: 2 }], startInterval: 0.75, endInterval: 0.55, batchSize: 2, maxAlive: 180 },
    { fromMinute: 6, enemies: [{ enemy: 'zombie', weight: 1 }, { enemy: 'skeleton', weight: 2 }, { enemy: 'werewolf', weight: 3 }, { enemy: 'troll', weight: 4 }], startInterval: 0.7, endInterval: 0.5, batchSize: 2, maxAlive: 200 },
    { fromMinute: 7, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'skeleton', weight: 1 }, { enemy: 'werewolf', weight: 3 }, { enemy: 'troll', weight: 3 }, { enemy: 'ogre', weight: 2 }], startInterval: 0.65, endInterval: 0.5, batchSize: 2, maxAlive: 210 },
    { fromMinute: 8, enemies: [{ enemy: 'scorpion', weight: 1 }, { enemy: 'werewolf', weight: 2 }, { enemy: 'troll', weight: 3 }, { enemy: 'ogre', weight: 3 }], startInterval: 0.6, endInterval: 0.45, batchSize: 2, maxAlive: 220 },
    { fromMinute: 9, enemies: [{ enemy: 'skeleton', weight: 1 }, { enemy: 'werewolf', weight: 2 }, { enemy: 'troll', weight: 2 }, { enemy: 'ogre', weight: 3 }, { enemy: 'cyclops', weight: 2 }], startInterval: 0.55, endInterval: 0.45, batchSize: 2, maxAlive: 230 },
    { fromMinute: 10, enemies: [{ enemy: 'zombie', weight: 1 }, { enemy: 'werewolf', weight: 2 }, { enemy: 'ogre', weight: 2 }, { enemy: 'cyclops', weight: 3 }, { enemy: 'stalker', weight: 2 }], startInterval: 0.5, endInterval: 0.4, batchSize: 2, maxAlive: 240 },
    { fromMinute: 11, enemies: [{ enemy: 'orc', weight: 1 }, { enemy: 'troll', weight: 1 }, { enemy: 'ogre', weight: 2 }, { enemy: 'cyclops', weight: 3 }, { enemy: 'stalker', weight: 3 }], startInterval: 0.5, endInterval: 0.4, batchSize: 2, maxAlive: 250 },
    { fromMinute: 12, enemies: [{ enemy: 'werewolf', weight: 1 }, { enemy: 'ogre', weight: 1 }, { enemy: 'cyclops', weight: 2 }, { enemy: 'stalker', weight: 3 }, { enemy: 'ettinRegular', weight: 2 }], startInterval: 0.5, endInterval: 0.4, batchSize: 2, maxAlive: 260 },
    { fromMinute: 13, enemies: [{ enemy: 'skeleton', weight: 1 }, { enemy: 'cyclops', weight: 2 }, { enemy: 'stalker', weight: 3 }, { enemy: 'ettinRegular', weight: 3 }], startInterval: 0.45, endInterval: 0.4, batchSize: 2, maxAlive: 270 },
    { fromMinute: 14, enemies: [{ enemy: 'troll', weight: 1 }, { enemy: 'cyclops', weight: 2 }, { enemy: 'stalker', weight: 3 }, { enemy: 'ettinRegular', weight: 3 }], startInterval: 0.45, endInterval: 0.4, batchSize: 2, maxAlive: 280 },
];

const MIDDLELAND_EVENTS: readonly WaveEventDef[] = [
    { atMinute: 2.5, kind: 'stampede', enemy: 'zombie', count: 30, message: 'Horde approaching!' },
    { atMinute: 4, kind: 'boss', enemy: 'mountainGiantBoss', message: 'A Mountain Giant comes down!' },
    { atMinute: 5.5, kind: 'stampede', enemy: 'orc', count: 18, message: 'Orc stampede!' },
    { atMinute: 7, kind: 'surround', enemy: 'skeleton', count: 24, message: 'The dead rise around you!' },
    { atMinute: 8, kind: 'boss', enemy: 'giantLizard', message: 'A Giant Lizard crawls out!' },
    { atMinute: 9.5, kind: 'surround', enemy: 'werewolf', count: 20, message: 'The wolves howl at the moon!' },
    { atMinute: 10.5, kind: 'stampede', enemy: 'troll', count: 18, message: 'Troll stampede!' },
    { atMinute: 12, kind: 'boss', enemy: 'ettinBerserk', message: 'The Ettin goes berserk!' },
    { atMinute: 13.5, kind: 'surround', enemy: 'stalker', count: 26, message: 'The Stalkers hunt in packs!' },
    { atMinute: 15, kind: 'finalBoss', enemy: 'unicorn', message: 'The Unicorn charges!' },
];

/** Every playable map's timeline. A map without one is "Coming soon" (MapDef.comingSoon). */
export const TIMELINES: Partial<Record<MapId, MapTimeline>> = {
    traveler: { waves: TRAVELER_WAVES, events: TRAVELER_EVENTS },
    bisle: { waves: BISLE_WAVES, events: BISLE_EVENTS },
    elvineGarden: { waves: ELVINE_WAVES, events: ELVINE_EVENTS },
    middleland: { waves: MIDDLELAND_WAVES, events: MIDDLELAND_EVENTS },
};

export function getTimeline(map: MapId): MapTimeline {
    const timeline = TIMELINES[map];
    if (!timeline) throw new Error(`data/waves.ts: ${map} has no timeline`);
    return timeline;
}

/** Minute the final boss appears on that map (Select Map shows it as the run's length). */
export function finalBossMinute(map: MapId): number | undefined {
    return TIMELINES[map]?.events.find((event) => event.kind === 'finalBoss')?.atMinute;
}

/** Shared spawning rules. */
export const SPAWN = {
    /**
     * Distance beyond the visible screen edge where enemies appear, in pixels: close, because monsters walk slowly
     * (real speeds), but enough that tall ones (feet at the bottom edge) don't pop in.
     */
    offscreenMargin: 72,
    /** Ring of a "surround" event: this many pixels from the player (just inside the screen edge). */
    surroundRadius: 230,
    /** Enemies farther than this × half the screen diagonal are moved back to the spawn ring… */
    relocateDistanceFactor: 1.8,
    /** …checked this often (ms). Keeps enemies stuck behind the river in play. Bosses are never moved. */
    relocateEveryMs: 1000,
    /**
     * Stampede: a block of `rows` lines of monsters, `spacing` px apart, appears off one side of the screen, in line
     * with the player, and runs straight across at `speedFactor` × its speed. It is narrower than the screen: step
     * aside or cut through it. When it has crossed, the monsters chase as usual.
     */
    stampede: { rows: 3, spacing: 40, speedFactor: 3.5 },
    /**
     * While a mini boss is alive the waves go on, but calmer (bug list 19-oct-2026, B6): the time between spawns is
     * multiplied by `intervalFactor` and the wave's `maxAlive` by `maxAliveFactor`. The final boss stops them instead.
     */
    duringBoss: { intervalFactor: 2, maxAliveFactor: 0.5 },
} as const;

/** End of the run (Fase 13): what happens once the final boss is dead. */
export const PORTAL = {
    /** The portal opens this long after the player picks up the final boss's chest (ms). */
    openDelayMs: 1000,
    /** The run is won when the player steps in, or when this time runs out (ms). */
    durationMs: 30000,
    /** The player is "in" when their feet are this close to the centre of the portal (px). */
    enterRadius: 26,
    /** It opens this far to one side of the chest (px): the player is standing there, and must walk in on purpose. */
    besideChestX: 90,
    /** Continue after the final boss: its chest (or the portal, if it was open) appears this far to the right of the player (px). */
    resumeOffsetX: 120,
    /** Shown when the final boss dies, and when the portal opens. */
    bossDeadMessage: 'Open the chest to leave!',
    message: 'A portal has opened!',
} as const;

// Comprobación al cargar: las oleadas de cada mapa solo usan esenciales y monstruos del mapa, y los eventos de jefe,
// sus jefes; y cada mapa jugable tiene línea de tiempo con jefe final.
for (const id of MAP_IDS) {
    const map: MapDef = MAPS_DATA[id];
    const timeline = TIMELINES[id];
    if (!timeline) {
        if (!map.comingSoon) throw new Error(`data/waves.ts: ${map.name} has no timeline (or mark it comingSoon)`);
        continue;
    }
    const allowed = new Set<EnemyId>([...ESSENTIAL_ENEMIES, ...map.localEnemies]);
    for (const wave of timeline.waves) {
        for (const { enemy } of wave.enemies) {
            if (!allowed.has(enemy)) throw new Error(`data/waves.ts: ${enemy} is not an essential or ${map.name} monster`);
        }
    }
    for (const event of timeline.events) {
        const ok = event.kind === 'boss' || event.kind === 'finalBoss' ? map.bosses.includes(event.enemy) : allowed.has(event.enemy);
        if (!ok) throw new Error(`data/waves.ts: event ${event.message} uses ${event.enemy}, not a ${map.name} monster`);
    }
    if (finalBossMinute(id) === undefined) throw new Error(`data/waves.ts: ${map.name} has no final boss`);
}
