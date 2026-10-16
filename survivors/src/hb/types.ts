// Ported from sp-client/src/Types.ts (MIT, Erko Knoll)

/** Pivot of one frame: offset from the entity position to the frame's top-left corner. */
export type PivotFrame = { pivotX: number; pivotY: number; width: number; height: number };

/** Pivot data for all sprite sheets in a sprite file. */
export type PivotData = {
    spriteSheetPivots: PivotFrame[][];
};
