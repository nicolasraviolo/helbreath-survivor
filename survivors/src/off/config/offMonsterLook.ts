// Helbreath Off (Fase Off-2): cómo se ve el monstruo marcado (el que tienes bajo el ratón o elegido con el mando):
// su nombre y una barra de vida sobre la cabeza. Los demás no llevan nada, como en el original.
import { px, UI_FONT_SIZE, UI_TEXT } from '../../config/ui';

export const OFF_MONSTER_LOOK = {
    /** Name over the head: red for monsters that attack on sight, white for neutral ones (the Rabbits). */
    nameStyle: { ...UI_TEXT, fontSize: px(UI_FONT_SIZE.small), fontStyle: 'bold', color: '#ff8a7a', stroke: '#000000', strokeThickness: 3 },
    neutralColor: '#ffffff',
    /** Gap between the top of the sprite and the bar, and between the bar and the name (px). */
    nameGap: 2,
    bar: { width: 32, height: 4, gapAboveHead: 4, backColor: 0x200808, fillColor: 0xd83030, backAlpha: 0.8 },
    /** The "+N Exp" of a kill starts this far above the killing blow's number, so they don't overlap (px). */
    expWordRise: 18,
    /** Damage the player takes, over its head. */
    playerDamageColor: '#ff5a4a',
} as const;
