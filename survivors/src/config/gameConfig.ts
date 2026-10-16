// Constantes técnicas del juego (no de balance: eso vive en src/data).

/** Logical resolution. Helbreath's native resolution is 800x600. */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/** Frame rate of Helbreath animations with the standard 8 frames per sheet. */
export const DEFAULT_ANIMATION_FRAME_RATE = 10;

export const BACKGROUND_COLOR = '#1a1a1a';

/** Map tiles are 32x32 px. */
export const TILE_SIZE = 32;

/**
 * Pivots of characters and map objects point from their feet / base to the frame corner, and in the
 * original client that anchor is the CENTRE of the tile (ground tiles are drawn from the corner).
 * So entities are drawn at their position as is, and map objects at tile corner + this offset.
 */
export const TILE_ANCHOR_OFFSET = TILE_SIZE / 2;

/** Depths. Characters and objects use their Y in pixels, so these stay far below / above. */
export const DEPTH_GROUND = -100000;
export const DEPTH_GROUND_SHADOWS = -90000;
export const DEPTH_DEBUG = 1000000;
/** Spell effects are drawn this much above their Y depth (sp-client effects use +80). */
export const DEPTH_EFFECT_OFFSET = 80;
/** Spells start this many pixels above the caster's feet (sp-client ENERGY_BOLT_ORIGIN_OFFSET_Y = 50). */
export const ENERGY_BOLT_ORIGIN_OFFSET_Y = 40;
/** Damage numbers float above every character and effect. */
export const DEPTH_DAMAGE_NUMBERS = 500000;

/** Damage numbers: rise and fade the second half of their life (sp-client lives 2 s; shorter here, there are many more hits). */
export const DAMAGE_NUMBER_LIFE_MS = 1000;
export const DAMAGE_NUMBER_RISE_PX_PER_S = 40;
export const DAMAGE_NUMBER_FONT_SIZE = 16;
/** Random sideways offset so numbers on the same enemy don't stack exactly. */
export const DAMAGE_NUMBER_SPREAD_PX = 12;
/** Most numbers on screen at once; more are skipped. */
export const DAMAGE_NUMBER_MAX = 120;

/** Alpha of a map object while it hides the player (sp-client MAP_OBJECT_COLLISION_ALPHA). */
export const MAP_OBJECT_FADE_ALPHA = 0.5;
export const TREE_SHADOW_ALPHA = 0.5;

/** Extra tiles of map objects drawn around the play area, so tall trees just outside still show. */
export const MAP_OBJECT_MARGIN_TILES = 10;

/** Smoothing of the camera follow (1 = rigid). */
export const CAMERA_LERP = 0.15;

/** Gamepad left stick: inputs below this magnitude are ignored (stick drift). */
export const GAMEPAD_DEADZONE = 0.2;

/** Mouse: holding the button runs towards the cursor; closer than this, the player stops. */
export const POINTER_DEADZONE_PX = 8;
/** Mouse: at this distance from the player (or more) it runs at full speed. */
export const POINTER_FULL_SPEED_PX = 64;

/** Enemies: half side of the square used against walls (smaller than the body, so they fit gaps). */
export const ENEMY_WALL_HALF_SIZE = 6;
/** Enemies: how long the corpse stays after the death animation, then how long it takes to fade. */
export const ENEMY_CORPSE_MS = 1500;
export const ENEMY_FADE_MS = 400;
/** Enemies: push-apart speed per pixel of overlap, and its cap (px/s). */
export const ENEMY_SEPARATION_PER_PX = 10;
export const ENEMY_SEPARATION_MAX = 80;
/** Enemies: white flash when hit, in milliseconds. */
export const ENEMY_HIT_FLASH_MS = 90;
/** Enemies: how fast knockback fades (share lost per second, exponential). */
export const ENEMY_KNOCKBACK_DECAY = 12;
/** Grid cell size for neighbour queries. */
export const SPATIAL_CELL_SIZE = 48;

/** Monster BodyShadow from sp-client ShadowManager: black copy, rotated and squashed. */
export const MONSTER_SHADOW_ALPHA = 0.5;
export const MONSTER_SHADOW_ROTATION = -Math.PI / 4;
export const MONSTER_SHADOW_SCALE_Y = 0.5;

/** Player: blink period while invulnerable, and delay before the Game Over screen. */
export const PLAYER_BLINK_MS = 80;
export const GAME_OVER_DELAY_MS = 1200;
