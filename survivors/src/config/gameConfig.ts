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
/** XP gems: drawn above characters, effects and map objects so they are never hidden by enemy bodies (below damage numbers). */
export const DEPTH_GEMS = 400000;
export const DEPTH_DEBUG = 1000000;
/** Spell effects are drawn this much above their Y depth (sp-client effects use +80). */
export const DEPTH_EFFECT_OFFSET = 80;
/** Melee swings are measured from this many pixels above the feet (the chest), like enemy bodies. */
export const MELEE_ORIGIN_OFFSET_Y = 24;
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

/**
 * Movement directions: 8 = only the 8 directions of the original (stick and mouse snap to the nearest one),
 * 0 = free movement at any angle. 8 chosen by the owner on 16-oct-2026 to try it; still free in pixels, not tile by tile.
 */
export const MOVE_DIRECTIONS: number = 8;

/** Gamepad left stick: inputs below this magnitude are ignored (stick drift). */
export const GAMEPAD_DEADZONE = 0.2;

/** Mouse: holding the button runs towards the cursor; closer than this, the player stops. */
export const POINTER_DEADZONE_PX = 8;
/** Mouse: at this distance from the player (or more) it runs at full speed. */
export const POINTER_FULL_SPEED_PX = 64;

/**
 * Monster attacks (sp-client Monster.ts): the attack animation plays at 17.5 fps for 8 frames (default attack speed 50,
 * scaled by frame count and temporalCoefficient) and the blow lands on frame 2. It hits if the player is still within
 * reach then. `reach` = pixels beyond touching (bodies' radii) at which a monster starts its attack.
 */
export const MONSTER_ATTACK = { frameRate: 17.5, hitFrame: 2, reach: 10 } as const;

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
/** Player's body for enemy projectiles: centre this many pixels above the feet, and its radius. */
export const PLAYER_BODY_OFFSET_Y = 30;
export const PLAYER_BODY_RADIUS = 12;
/**
 * Player hit (sp-client Player): TakeDamage animation of 4 frames in (4/15) s ≈ 267 ms, and a short stun of 100 ms
 * (PLAYER_STUNLOCK_DURATION_MS) before moving again cuts it.
 */
export const PLAYER_HURT_MS = 267;
export const PLAYER_HURT_STUN_MS = 100;
export const GAME_OVER_DELAY_MS = 1200;

/** Level-up cards: ignore input for a moment so a key or click held during play doesn't pick a card by accident. */
export const LEVEL_UP_INPUT_DELAY_MS = 350;
