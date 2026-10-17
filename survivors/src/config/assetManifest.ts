// Registro único de assets. Toda carga pasa por aquí con claves propias (regla 3 de CLAUDE.md).
// Las rutas son relativas a `assets/` (en dev, Vite sirve sp-client/public).
import { SpriteType } from '../hb/HBSprite';

export interface SpriteAsset {
    file: string;
    type: SpriteType;
}

export const SPRITES = {
    'enemy.orc': { file: 'sprites/orc.spr', type: SpriteType.Monster },
    'enemy.slime': { file: 'sprites/slm.spr', type: SpriteType.Monster },
    'enemy.bunny': { file: 'sprites/bunny.spr', type: SpriteType.Monster },
    'enemy.ant': { file: 'sprites/ant.spr', type: SpriteType.Monster },
    // Fase 7: monstruos de las oleadas y jefes (nombres de archivo de sp-client/src/constants/Monsters.ts;
    // 'gagoyle' lleva la errata del archivo original).
    'enemy.snake': { file: 'sprites/amp.spr', type: SpriteType.Monster },
    'enemy.scorpion': { file: 'sprites/scp.spr', type: SpriteType.Monster },
    'enemy.frog': { file: 'sprites/giantfrog.spr', type: SpriteType.Monster },
    'enemy.skeleton': { file: 'sprites/ske.spr', type: SpriteType.Monster },
    'enemy.zombie': { file: 'sprites/zom.spr', type: SpriteType.Monster },
    'enemy.direBoar': { file: 'sprites/direboar.spr', type: SpriteType.Monster },
    'enemy.troll': { file: 'sprites/troll.spr', type: SpriteType.Monster },
    'enemy.ogre': { file: 'sprites/orge.spr', type: SpriteType.Monster },
    'enemy.stalker': { file: 'sprites/stalker.spr', type: SpriteType.Monster },
    'enemy.werewolf': { file: 'sprites/werewolf.spr', type: SpriteType.Monster },
    'enemy.cyclops': { file: 'sprites/cyc.spr', type: SpriteType.Monster },
    'enemy.lich': { file: 'sprites/liche.spr', type: SpriteType.Monster },
    'enemy.hellhound': { file: 'sprites/helb.spr', type: SpriteType.Monster },
    'enemy.darkElf': { file: 'sprites/darkelf.spr', type: SpriteType.Monster },
    'enemy.gargoyle': { file: 'sprites/gagoyle.spr', type: SpriteType.Monster },
    'enemy.hellclaw': { file: 'sprites/hellclaw.spr', type: SpriteType.Monster },
    'enemy.tigerworm': { file: 'sprites/tigerworm.spr', type: SpriteType.Monster },
    'enemy.minotaur': { file: 'sprites/minotaurs.spr', type: SpriteType.Monster },
    'enemy.ettin': { file: 'sprites/ettin.spr', type: SpriteType.Monster },
    'enemy.demon': { file: 'sprites/demon.spr', type: SpriteType.Monster },
    'enemy.fireWyvern': { file: 'sprites/firewyvern.spr', type: SpriteType.Monster },

    // Capas del jugador (hombre). Ver hb/playerAppearance.ts para cómo se indexan las hojas.
    'player.body.wm': { file: 'sprites/wm.spr', type: SpriteType.Human },
    'player.hair.mhr': { file: 'sprites/mhr.spr', type: SpriteType.HairAndUndies },
    'player.underwear.mpt': { file: 'sprites/mpt.spr', type: SpriteType.HairAndUndies },
    // Ropa básica del Guerrero al empezar (Shirt y Trousers).
    'gear.shirt.m': { file: 'sprites/mshirt.spr', type: SpriteType.EquipmentPack },
    'gear.trousers.m': { file: 'sprites/mtrouser.spr', type: SpriteType.EquipmentPack },
    // Armaduras del Guerrero (ver data/armor.ts).
    'gear.hauberk.m': { file: 'sprites/mhauberk.spr', type: SpriteType.EquipmentPack },
    'gear.armor.leather.m': { file: 'sprites/mlarmor.spr', type: SpriteType.EquipmentPack },
    'gear.armor.scale.m': { file: 'sprites/msmail.spr', type: SpriteType.EquipmentPack },
    'gear.armor.chain.m': { file: 'sprites/mcmail.spr', type: SpriteType.EquipmentPack },
    'gear.leggings.chain.m': { file: 'sprites/mchoses.spr', type: SpriteType.EquipmentPack },
    'gear.helm.basic.m': { file: 'sprites/mhelm4.spr', type: SpriteType.EquipmentPack },
    'gear.helm.winged.m': { file: 'sprites/nmhelm2.spr', type: SpriteType.EquipmentPack },
    'gear.helm.horned.m': { file: 'sprites/nmhelm1.spr', type: SpriteType.EquipmentPack },
    'gear.leggings.plate.m': { file: 'sprites/mleggings.spr', type: SpriteType.EquipmentPack },
    'gear.boots.long.m': { file: 'sprites/mlboots.spr', type: SpriteType.EquipmentPack },
    'gear.helm.full.m': { file: 'sprites/mhelm1.spr', type: SpriteType.EquipmentPack },
    'gear.armor.plate.m': { file: 'sprites/mpmail.spr', type: SpriteType.EquipmentPack },
    'gear.swords.m': { file: 'sprites/msw.spr', type: SpriteType.Weapons },
    'gear.shields.m': { file: 'sprites/msh.spr', type: SpriteType.Shields },
    // Mago: túnica, sombrero de mago (Wizard Hat) y varita (Magic Wand 2).
    'gear.armor.robe.m': { file: 'sprites/mrobe1.spr', type: SpriteType.EquipmentPack },
    'gear.helm.wizard.m': { file: 'sprites/nmhelm4.spr', type: SpriteType.EquipmentPack },
    'gear.wand.m': { file: 'sprites/mstaff1.spr', type: SpriteType.Weapons },

    // Capas de mujer (la Maga): mismas tablas de hojas que las de hombre.
    'player.body.ww': { file: 'sprites/ww.spr', type: SpriteType.Human },
    'player.hair.whr': { file: 'sprites/whr.spr', type: SpriteType.HairAndUndies },
    'player.underwear.wpt': { file: 'sprites/wpt.spr', type: SpriteType.HairAndUndies },
    'gear.boots.long.w': { file: 'sprites/wlboots.spr', type: SpriteType.EquipmentPack },
    'gear.armor.robe.w': { file: 'sprites/wrobe1.spr', type: SpriteType.EquipmentPack },
    'gear.helm.wizardCap.w': { file: 'sprites/nwhelm3.spr', type: SpriteType.EquipmentPack },
    'gear.helm.wizardHat.w': { file: 'sprites/nwhelm4.spr', type: SpriteType.EquipmentPack },
    // Ropa básica de la Maga al empezar (Bodice y Skirt).
    'gear.bodice.w': { file: 'sprites/wbodice1.spr', type: SpriteType.EquipmentPack },
    'gear.skirt.w': { file: 'sprites/wskirt.spr', type: SpriteType.EquipmentPack },
    'gear.wand.w': { file: 'sprites/wstaff1.spr', type: SpriteType.Weapons },

    // Efectos de hechizos (ver config/effects.ts para qué hoja y frames usa cada uno).
    'fx.effect': { file: 'sprites/effect.spr', type: SpriteType.Effect },
    // Hechizos de fuego y Energy Strike (ver config/effects.ts).
    'fx.effect3': { file: 'sprites/effect3.spr', type: SpriteType.Effect },
    'fx.effect11': { file: 'sprites/effect11.spr', type: SpriteType.Effect },
    // Buffs del cofre: Berserk y Defense Shield (ver data/pickups.ts).
    'fx.effect8': { file: 'sprites/effect8.spr', type: SpriteType.Effect },
    'fx.effect9': { file: 'sprites/effect9.spr', type: SpriteType.Effect },
    // Polvo de los pasos al correr (Footsteps dry: hoja 1, frames 28–32).
    'fx.effect2': { file: 'sprites/effect2.spr', type: SpriteType.Effect },

    // Interfaz: barra inferior original 800x600 (hoja 6; ver config/hud.ts para frames y posiciones)
    // y fondo de "Create New Character" 640x480 (hoja 9; ver config/characterSelect.ts).
    'ui.panel': { file: 'sprites/gamedialog86.spr', type: SpriteType.Interface },
    // Fuente dibujada del original (libro de hechizos, nombre del hechizo al lanzarlo): ver hb/SpriteText.ts.
    'ui.font': { file: 'sprites/sprfonts.spr', type: SpriteType.Interface },
    // Botones con el texto ya dibujado (Warrior, Magician, Create, Cancel...), normal + iluminado.
    'ui.buttons': { file: 'sprites/dialogtext.spr', type: SpriteType.Interface },
    // Pantallas de título del original 640x480 (hoja 1 = "Helbreath The Heldenian", la del login; ver config/menus.ts).
    'ui.title': { file: 'sprites/new-dialog.spr', type: SpriteType.Interface },
    // Interfaz "V2" del original (piedra oscura, por piezas): barras y botones de la interfaz compacta del móvil
    // (hoja 0; ver config/hud.ts → HUD_COMPACT).
    'ui.v2': { file: 'sprites/dialogsv2.spr', type: SpriteType.Interface },

    // Objetos en el suelo (gemas de XP: hoja 15, ver data/leveling.ts).
    'item.ground': { file: 'sprites/item-ground.spr', type: SpriteType.ItemGround },
} as const satisfies Record<string, SpriteAsset>;

export type SpriteKey = keyof typeof SPRITES;

/**
 * Sonidos (.mp3 de sp-client/public/assets/sounds). Los de cada monstruo salen de
 * sp-client/src/constants/Monsters.ts (takeDamage / death).
 */
export const SOUNDS = {
    'sfx.energyBolt.cast': { file: 'sounds/E1.mp3' },
    'sfx.energyBolt.impact': { file: 'sounds/E2.mp3' },
    'sfx.slime.hit': { file: 'sounds/M3.mp3' },
    'sfx.slime.death': { file: 'sounds/M4.mp3' },
    'sfx.ant.hit': { file: 'sounds/M31.mp3' },
    'sfx.ant.death': { file: 'sounds/M32.mp3' },
    'sfx.bunny.hit': { file: 'sounds/M79.mp3' },
    'sfx.bunny.death': { file: 'sounds/M83.mp3' },
    'sfx.orc.hit': { file: 'sounds/M11.mp3' },
    'sfx.orc.death': { file: 'sounds/M12.mp3' },
    // Fase 7 (Monsters.ts takeDamage / death). Stalker, Gargoyle, Hellclaw y Tigerworm reutilizan otros, como en sp-client.
    'sfx.snake.hit': { file: 'sounds/M27.mp3' },
    'sfx.snake.death': { file: 'sounds/M28.mp3' },
    'sfx.scorpion.hit': { file: 'sounds/M23.mp3' },
    'sfx.scorpion.death': { file: 'sounds/M24.mp3' },
    'sfx.frog.hit': { file: 'sounds/M81.mp3' },
    'sfx.frog.death': { file: 'sounds/M85.mp3' },
    'sfx.skeleton.hit': { file: 'sounds/M15.mp3' },
    'sfx.skeleton.death': { file: 'sounds/M16.mp3' },
    'sfx.zombie.hit': { file: 'sounds/M19.mp3' },
    'sfx.zombie.death': { file: 'sounds/M20.mp3' },
    'sfx.direBoar.hit': { file: 'sounds/M78.mp3' },
    'sfx.direBoar.death': { file: 'sounds/C7.mp3' },
    'sfx.troll.hit': { file: 'sounds/M48.mp3' },
    'sfx.troll.death': { file: 'sounds/M49.mp3' },
    'sfx.ogre.hit': { file: 'sounds/M53.mp3' },
    'sfx.ogre.death': { file: 'sounds/M54.mp3' },
    'sfx.werewolf.hit': { file: 'sounds/M69.mp3' },
    'sfx.werewolf.death': { file: 'sounds/M70.mp3' },
    'sfx.cyclops.hit': { file: 'sounds/M43.mp3' },
    'sfx.cyclops.death': { file: 'sounds/M44.mp3' },
    'sfx.lich.hit': { file: 'sounds/M57.mp3' },
    'sfx.lich.death': { file: 'sounds/M58.mp3' },
    'sfx.hellhound.hit': { file: 'sounds/M7.mp3' },
    'sfx.hellhound.death': { file: 'sounds/M8.mp3' },
    'sfx.darkElf.hit': { file: 'sounds/C13.mp3' },
    'sfx.darkElf.death': { file: 'sounds/M150.mp3' },
    'sfx.ettin.hit': { file: 'sounds/M93.mp3' },
    'sfx.ettin.death': { file: 'sounds/M94.mp3' },
    'sfx.demon.hit': { file: 'sounds/M60.mp3' },
    'sfx.demon.death': { file: 'sounds/M62.mp3' },
    'sfx.minotaur.hit': { file: 'sounds/M102.mp3' },
    'sfx.minotaur.death': { file: 'sounds/M103.mp3' },
    // Ataques de los monstruos (Monsters.ts → states.attack.sound). Stalker y Hellclaw reutilizan los del Orc y el Cyclops.
    'sfx.slime.attack': { file: 'sounds/M2.mp3' },
    'sfx.bunny.attack': { file: 'sounds/M75.mp3' },
    'sfx.ant.attack': { file: 'sounds/M30.mp3' },
    'sfx.orc.attack': { file: 'sounds/M10.mp3' },
    'sfx.snake.attack': { file: 'sounds/M26.mp3' },
    'sfx.scorpion.attack': { file: 'sounds/M22.mp3' },
    'sfx.frog.attack': { file: 'sounds/M77.mp3' },
    'sfx.skeleton.attack': { file: 'sounds/M14.mp3' },
    'sfx.zombie.attack': { file: 'sounds/M18.mp3' },
    'sfx.direBoar.attack': { file: 'sounds/M78.mp3' },
    'sfx.troll.attack': { file: 'sounds/M47.mp3' },
    'sfx.ogre.attack': { file: 'sounds/M52.mp3' },
    'sfx.werewolf.attack': { file: 'sounds/M68.mp3' },
    'sfx.cyclops.attack': { file: 'sounds/M42.mp3' },
    'sfx.lich.attack': { file: 'sounds/M56.mp3' },
    'sfx.hellhound.attack': { file: 'sounds/M6.mp3' },
    'sfx.darkElf.attack': { file: 'sounds/C3.mp3' },
    'sfx.gargoyle.attack': { file: 'sounds/C2.mp3' },
    'sfx.tigerworm.attack': { file: 'sounds/C1.mp3' },
    'sfx.minotaur.attack': { file: 'sounds/M123.mp3' },
    'sfx.ettin.attack': { file: 'sounds/M92.mp3' },
    'sfx.demon.attack': { file: 'sounds/M61.mp3' },
    'sfx.wyvern.attack': { file: 'sounds/M107.mp3' },
    // El jugador recibe un golpe (PLAYER_TAKE_UNARMED_DAMAGE).
    'sfx.player.hurt': { file: 'sounds/C5.mp3' },
    // Muerte del jugador (MALE_DEATH / FEMALE_DEATH, sp-client Player.ts estado Die).
    'sfx.player.death.m': { file: 'sounds/C14.mp3' },
    'sfx.player.death.w': { file: 'sounds/C15.mp3' },
    // Subir de nivel. sp-client no tiene; E21 es el que (según recordamos) usa el cliente C++ original. Pendiente de confirmar a oído.
    'sfx.levelUp': { file: 'sounds/E21.mp3' },
    // Muerte del Fire Wyvern (no tiene sonido de golpe en sp-client).
    'sfx.wyvern.death': { file: 'sounds/M105.mp3' },
    // Música (sp-client public/assets/music; ver systems/MusicSystem.ts).
    'music.middleland': { file: 'music/middleland.mp3' },
    // Música del menú principal: la pista por defecto de sp-client (la de los mapas sin música propia).
    'music.menu': { file: 'music/default.mp3' },
    'music.dungeon': { file: 'music/dungeon.mp3' },
    'music.abaddon': { file: 'music/abaddon.mp3' },
    // Armas cuerpo a cuerpo: tajo del jugador (PLAYER_MELEE_ATTACK) y golpe con filo en un monstruo (TAKE_DAMAGE_BLADE).
    'sfx.melee.swing': { file: 'sounds/C18.mp3' },
    'sfx.melee.hit': { file: 'sounds/C6.mp3' },
    // Explosión de fuego (EFFECT_EXPLOSION) y lanzar hechizo (PLAYER_CAST).
    'sfx.explosion': { file: 'sounds/E4.mp3' },
    'sfx.cast': { file: 'sounds/C16.mp3' },
    // Beber poción (Red Potion consumptionSound), objeto que cae al suelo (ITEM_DROPPED_SOUND) y buff (EFFECT_CAST).
    'sfx.drink': { file: 'sounds/C19.mp3' },
    'sfx.itemDrop': { file: 'sounds/E12.mp3' },
    'sfx.buff': { file: 'sounds/E5.mp3' },
    // Pasos al correr (PLAYER_RUNNING).
    'sfx.footsteps': { file: 'sounds/C10.mp3' },
    // Recoger una gema: el sonido de "objeto añadido" del original (sp-client SoundFileNames.ts, ITEM_ADDED_SOUND).
    'sfx.pickup': { file: 'sounds/E20.mp3' },
} as const satisfies Record<string, { file: string }>;

export type SoundKey = keyof typeof SOUNDS;

export const MAPS = {
    'map.huntzone2': { file: 'maps/huntzone2.amd' },
} as const satisfies Record<string, { file: string }>;

export type MapKey = keyof typeof MAPS;

/**
 * Paquetes de casillas de mapa (sp-client/src/constants/Assets.ts). Cada hoja del paquete es la
 * textura `map-tile-{start + hoja}`. Solo se cargan los que use el mapa (ver hb/mapAssets.ts).
 */
export const TILE_PACKS = [
    { key: 'tiles.maptiles1', file: 'sprites/maptiles1.spr', start: 0 },
    { key: 'tiles.structures1', file: 'sprites/structures1.spr', start: 50 },
    { key: 'tiles.sinside1', file: 'sprites/sinside1.spr', start: 70 },
    { key: 'tiles.trees1', file: 'sprites/trees1.spr', start: 100 },
    { key: 'tiles.treeshadows', file: 'sprites/treeshadows.spr', start: 150 },
    { key: 'tiles.objects1', file: 'sprites/objects1.spr', start: 200 },
    { key: 'tiles.objects2', file: 'sprites/objects2.spr', start: 211 },
    { key: 'tiles.objects3', file: 'sprites/objects3.spr', start: 216 },
    { key: 'tiles.objects4', file: 'sprites/objects4.spr', start: 220 },
    { key: 'tiles.tile223-225', file: 'sprites/tile223-225.spr', start: 223 },
    { key: 'tiles.tile226-229', file: 'sprites/tile226-229.spr', start: 226 },
    { key: 'tiles.objects5', file: 'sprites/objects5.spr', start: 230 },
    { key: 'tiles.objects6', file: 'sprites/objects6.spr', start: 238 },
    { key: 'tiles.objects7', file: 'sprites/objects7.spr', start: 242 },
    { key: 'tiles.maptiles2', file: 'sprites/maptiles2.spr', start: 300 },
    { key: 'tiles.maptiles4', file: 'sprites/maptiles4.spr', start: 320 },
    { key: 'tiles.maptiles5', file: 'sprites/maptiles5.spr', start: 330 },
    { key: 'tiles.maptiles6', file: 'sprites/maptiles6.spr', start: 349 },
    { key: 'tiles.maptiles353-361', file: 'sprites/maptiles353-361.spr', start: 353 },
    { key: 'tiles.tile363-366', file: 'sprites/tile363-366.spr', start: 363 },
    { key: 'tiles.tile367-367', file: 'sprites/tile367-367.spr', start: 367 },
    { key: 'tiles.tile370-381', file: 'sprites/tile370-381.spr', start: 370 },
    { key: 'tiles.tile382-387', file: 'sprites/tile382-387.spr', start: 382 },
    { key: 'tiles.tile388-402', file: 'sprites/tile388-402.spr', start: 388 },
    { key: 'tiles.tile403-405', file: 'sprites/tile403-405.spr', start: 403 },
    { key: 'tiles.tile406-421', file: 'sprites/tile406-421.spr', start: 406 },
    { key: 'tiles.tile422-429', file: 'sprites/tile422-429.spr', start: 422 },
    { key: 'tiles.tile430-443', file: 'sprites/tile430-443.spr', start: 430 },
    { key: 'tiles.tile444-444', file: 'sprites/tile444-444.spr', start: 444 },
    { key: 'tiles.tile445-461', file: 'sprites/tile445-461.spr', start: 445 },
    { key: 'tiles.tile462-473', file: 'sprites/tile462-473.spr', start: 462 },
    { key: 'tiles.tile474-478', file: 'sprites/tile474-478.spr', start: 474 },
    { key: 'tiles.tile479-488', file: 'sprites/tile479-488.spr', start: 479 },
    { key: 'tiles.tile489-522', file: 'sprites/tile489-522.spr', start: 489 },
    { key: 'tiles.tile523-530', file: 'sprites/tile523-530.spr', start: 523 },
    { key: 'tiles.tile531-540', file: 'sprites/tile531-540.spr', start: 531 },
    { key: 'tiles.tile541-545', file: 'sprites/tile541-545.spr', start: 541 },
] as const satisfies ReadonlyArray<{ key: string; file: string; start: number }>;

export type TilePack = (typeof TILE_PACKS)[number];

export const ASSET_BASE_PATH = 'assets/';

/** Only downloaded on phones (config/device.ts): the PC never shows them. */
export const PHONE_ONLY_SPRITES: ReadonlySet<SpriteKey> = new Set<SpriteKey>(['ui.v2']);
