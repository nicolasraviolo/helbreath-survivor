// Tipos comunes de los objetos equipables (Fase 20B), aparte para que armas, armaduras e items.ts los compartan sin
// importarse entre ellos.

/**
 * What the Equipment screen asks of the character's PERMANENT stats and Level (never the run's). Original numbers:
 * Str = weight / 100 and the minimum level of reference/Item*.cfg; Mag only for the robes and wizard hats; Int only for
 * the spells (Magic.cfg's ReqInt, Fase 20D).
 */
export interface EquipRequirement {
    str?: number;
    level?: number;
    mag?: number;
    int?: number;
}

/** Picture of an item in item-pack.spr: sheet = the Item.cfg's Spr − 1, frame = its SFrame. */
export interface ItemIconFrame {
    sheet: number;
    frame: number;
}

/** Most items have one picture; clothes have another one for women. */
export interface ItemIcon extends ItemIconFrame {
    female?: ItemIconFrame;
}
