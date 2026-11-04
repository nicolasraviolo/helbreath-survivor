// Números de daño flotantes, reciclados con un pool (regla 5).
// Estilo del vídeo de Capy of Gods (decidido por el propietario el 4-nov-2026): letra pixel art, solo el número
// (sin "-"), borde negro grueso. Al aparecer salen muy grandes y se encogen de golpe ("pop"), suben un poco frenando
// y al final se apagan encogiéndose. Los críticos salen más grandes, sin recuadro (el propietario no lo quiso).
// Colores (propietario, 4-nov-2026): blanco el daño base, el color del elemento en los hechizos y la quemadura
// (fuego rojo; data/elements.ts), naranja los críticos; el veneno sigue verde.
// Se mantiene de antes: el "!" solo va al final del golpe que mata (decidido el 18-oct-2026: "20" si sobrevive,
// "20!" si muere).
import Phaser from 'phaser';
import {
    DAMAGE_NUMBER_BIG_POP_SCALE,
    DAMAGE_NUMBER_END_SCALE,
    DAMAGE_NUMBER_FADE_FROM,
    DAMAGE_NUMBER_FONT_SIZE,
    DAMAGE_NUMBER_LIFE_MS,
    DAMAGE_NUMBER_MAX,
    DAMAGE_NUMBER_POP_MS,
    DAMAGE_NUMBER_POP_SCALE,
    DAMAGE_NUMBER_RISE_PX,
    DAMAGE_NUMBER_SPREAD_PX,
    DEPTH_DAMAGE_NUMBERS,
} from '../config/gameConfig';
import { TEXT_RESOLUTION } from '../config/device';
import { DAMAGE_FONT } from '../config/ui';
import { POISON } from '../data/attributes';
import { ELEMENT_NUMBER_COLOR, type SpellElement } from '../data/elements';
import { Pool, type Poolable } from '../utils/Pool';

const NORMAL_COLOR = '#ffffff';
const CRITICAL_COLOR = '#ff9020';
const CRITICAL_SCALE = 1.4;
const STROKE_COLOR = '#000000';
const STROKE_THICKNESS = 4;
/** Small random up/down offset so numbers on the same enemy don't line up. */
const VERTICAL_SPREAD_PX = 6;
/** Words instead of numbers ("Resist", Fase 18B): light blue, a bit smaller. */
const WORD_COLOR = '#80c8ff';
const WORD_SCALE = 0.85;
/** Words shown at almost the same time (the Wyvern's 3 fireballs) stack upwards instead of overlapping. */
const WORD_STACK_MS = 400;
const WORD_STACK_PX = 14;

/** Fast at first, then slowing down. */
function easeOut(t: number): number {
    return 1 - (1 - t) ** 3;
}

class DamageNumber implements Poolable {
    public poolIndex = -1;
    public ageMs = 0;
    /** Shows a word, not a number. */
    public isWord = false;
    /** Y where it was born (it rises from here). */
    public startY = 0;
    /** Its normal size once the pop is over. */
    public baseScale = 1;
    /** How many times bigger than `baseScale` it is born. */
    public popScale = 1;
    public readonly text: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.text = scene.add.text(0, 0, '', {
            fontFamily: DAMAGE_FONT,
            fontSize: `${DAMAGE_NUMBER_FONT_SIZE}px`,
            color: NORMAL_COLOR,
            stroke: STROKE_COLOR,
            strokeThickness: STROKE_THICKNESS,
            resolution: TEXT_RESOLUTION,
        }).setOrigin(0.5, 1).setDepth(DEPTH_DAMAGE_NUMBERS).setActive(false).setVisible(false);
    }

    /** Starts its life at (x, y): placed, sized and fully visible. */
    public start(x: number, y: number, baseScale: number, popScale: number, isWord: boolean): void {
        this.ageMs = 0;
        this.isWord = isWord;
        this.startY = y;
        this.baseScale = baseScale;
        this.popScale = popScale;
        this.text.setPosition(x, y).setScale(baseScale * popScale).setAlpha(1).setActive(true).setVisible(true);
    }
}

export class DamageNumbers {
    private readonly pool: Pool<DamageNumber>;
    private readonly finished: DamageNumber[] = [];

    constructor(scene: Phaser.Scene) {
        this.pool = new Pool(() => new DamageNumber(scene));
    }

    public get active(): number {
        return this.pool.active.length;
    }

    /**
     * Shows the amount at (x, y), with "!" if the blow killed. Skipped when too many are on screen. Critical: big and
     * orange; else a spell shows its element's colour and a weapon hit white.
     */
    public show(x: number, y: number, amount: number, critical = false, lethal = false, element?: SpellElement): void {
        const color = critical ? CRITICAL_COLOR : element ? ELEMENT_NUMBER_COLOR[element] : NORMAL_COLOR;
        this.showColored(x, y, amount, color, critical, lethal);
    }

    /** Poison damage (Fase 21B): green, with "!" if it killed. */
    public showPoison(x: number, y: number, amount: number, lethal = false): void {
        this.showColored(x, y, amount, POISON.numberColor, false, lethal);
    }

    /** The amount in `color` (poison green, burn red…); big as a critical hit if `big`. */
    public showColored(x: number, y: number, amount: number, color: string, big = false, lethal = false): void {
        if (this.pool.active.length >= DAMAGE_NUMBER_MAX) return;
        const number = this.pool.acquire();
        number.text.setText(lethal ? `${amount}!` : `${amount}`).setColor(color);
        const spreadX = (Math.random() - 0.5) * DAMAGE_NUMBER_SPREAD_PX;
        const spreadY = (Math.random() - 0.5) * VERTICAL_SPREAD_PX;
        number.start(x + spreadX, y + spreadY, big ? CRITICAL_SCALE : 1,
            big ? DAMAGE_NUMBER_BIG_POP_SCALE : DAMAGE_NUMBER_POP_SCALE, false);
    }

    /** Shows a word (e.g. "Resist") at (x, y), moving like a number. Skipped when too many are on screen. */
    public showWord(x: number, y: number, word: string): void {
        if (this.pool.active.length >= DAMAGE_NUMBER_MAX) return;
        let recent = 0;
        for (const other of this.pool.active) if (other.isWord && other.ageMs < WORD_STACK_MS) recent++;
        const number = this.pool.acquire();
        number.text.setText(word).setColor(WORD_COLOR);
        number.start(x, y - recent * WORD_STACK_PX, WORD_SCALE, DAMAGE_NUMBER_POP_SCALE, true);
    }

    public update(deltaMs: number): void {
        for (const number of this.pool.active) {
            number.ageMs += deltaMs;
            const text = number.text;
            if (number.ageMs >= DAMAGE_NUMBER_LIFE_MS) {
                text.setActive(false).setVisible(false);
                this.finished.push(number);
                continue;
            }
            const life = number.ageMs / DAMAGE_NUMBER_LIFE_MS;
            text.y = number.startY - DAMAGE_NUMBER_RISE_PX * easeOut(life);
            if (number.ageMs < DAMAGE_NUMBER_POP_MS) {
                // Pop: from very big down to its normal size, fast.
                const pop = easeOut(number.ageMs / DAMAGE_NUMBER_POP_MS);
                text.setScale(number.baseScale * (number.popScale + (1 - number.popScale) * pop));
            } else if (life > DAMAGE_NUMBER_FADE_FROM) {
                // End: fades out while shrinking a little.
                const fade = (life - DAMAGE_NUMBER_FADE_FROM) / (1 - DAMAGE_NUMBER_FADE_FROM);
                text.setScale(number.baseScale * (1 + (DAMAGE_NUMBER_END_SCALE - 1) * fade)).setAlpha(1 - fade);
            } else {
                text.setScale(number.baseScale);
            }
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const number of this.finished) this.pool.release(number);
        this.finished.length = 0;
    }
}
