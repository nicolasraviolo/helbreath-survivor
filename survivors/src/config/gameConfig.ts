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
