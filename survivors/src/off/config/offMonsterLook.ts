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
    /** Damage the player takes, over its head. */
    playerDamageColor: '#ff5a4a',
    /** The player's health bar over the head while Off has no HUD (Off-2B adds the HUD). */
    playerBar: { width: 36, height: 4, gapAboveHead: 6, backColor: 0x200808, fillColor: 0x30c040, backAlpha: 0.8 },
} as const;
