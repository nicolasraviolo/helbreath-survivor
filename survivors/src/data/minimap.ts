// Minimapa (Fase 16A; plan aprobado por el propietario el 18-oct-2026).
// Cuadro arriba a la derecha con la zona de juego en pequeño. Solo enseña al jugador, los jefes, (16B) los tótems y
// (21A) los objetos de botín del suelo: ni monstruos normales, ni pociones, ni cofres. En la ciudad (Fase 23B), los NPCs
// y el teleport.
// Se apaga en Settings → Minimap. Lo dibuja ui/Minimap.ts.
import { byDevice } from '../config/device';

export const MINIMAP = {
    /** Side of the square, in screen pixels. */
    size: byDevice(128, 104),
    /** Gap to the right and top edges of the screen. */
    margin: 10,
    /** Top when the round pause button (and the stats button) sit in the top right corner: just under them. */
    topUnderButtons: 72,
    /** Map picture: a bit see-through, so it does not hide what walks behind it. */
    alpha: 0.85,
    borderColor: 0xc8a85a,
    borderWidth: 2,
    backColor: 0x000000,
} as const;

/** One kind of dot: radius in screen pixels, fill and a dark outline so it shows on any ground. */
export interface MinimapDotStyle {
    radius: number;
    color: number;
    outline: number;
    /** Blinks (on / off) every this many ms. 0 = always shown. */
    blinkMs: number;
}

export const MINIMAP_DOTS = {
    player: { radius: 3, color: 0xffffff, outline: 0x000000, blinkMs: 0 },
    // Del mismo tamaño que el jugador (lista de bugs del 19-oct-2026, M11).
    boss: { radius: 3, color: 0xff3020, outline: 0x000000, blinkMs: 400 },
    // Tótems (Fase 16B): todos amarillos, sin revelar qué dan (M10).
    totem: { radius: 3, color: 0xffd800, outline: 0x000000, blinkMs: 0 },
    // Botín en el suelo (Fase 21A): más pequeño, blanco azulado y parpadeando despacio, para no confundirlo con los tótems.
    loot: { radius: 2, color: 0x9ff0ff, outline: 0x000000, blinkMs: 600 },
    // Ciudad (Fase 23B): NPCs en azul claro, como su nombre; el teleport en violeta, como su efecto.
    npc: { radius: 3, color: 0xa8e0ff, outline: 0x000000, blinkMs: 0 },
    portal: { radius: 4, color: 0xc070ff, outline: 0x000000, blinkMs: 0 },
} as const satisfies Record<string, MinimapDotStyle>;
