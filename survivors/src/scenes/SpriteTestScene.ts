import Phaser from 'phaser';
import { BACKGROUND_COLOR, DEFAULT_ANIMATION_FRAME_RATE, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import { DEBUG_START } from '../config/debugStart';
import { HBAsset } from '../hb/HBAsset';
import { XBR_PIPELINE } from '../hb/XbrPipeline';
import { getSheetKey } from '../hb/HBSprite';
import { DIRECTION_COUNT, DIRECTION_NAMES, Direction } from '../hb/directions';
import {
    MONSTER_LOOPING_STATES,
    MONSTER_SHEET_BASE,
    MonsterState,
    monsterFrameRate,
} from '../hb/monsterSheets';

const STATES = Object.values(MonsterState);
const MAIN_SCALE = 2;
const RING_RADIUS = 210;
const MARKER_SIZE = 6;

/**
 * Escena de prueba de la Fase 1: un Orc grande controlable en el centro y
 * un anillo de 8 Orcs, cada uno mirando hacia fuera en su dirección.
 * ← → giran · ↑ ↓ cambian de animación · Espacio pausa · Esc vuelve a la partida.
 */
export class SpriteTestScene extends Phaser.Scene {
    private readonly enemy: EnemyDef = ENEMIES.orc;
    private main!: HBAsset;
    private ring: HBAsset[] = [];
    private direction: Direction = Direction.South;
    private stateIndex = 0;
    private info!: Phaser.GameObjects.Text;

    constructor() {
        super('SpriteTest');
    }

    create(): void {
        this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        for (let d = 0; d < DIRECTION_COUNT; d++) {
            const angle = (d * Math.PI) / 4; // clockwise from North
            const x = cx + Math.sin(angle) * RING_RADIUS;
            const y = cy - Math.cos(angle) * RING_RADIUS;
            this.addFootMarker(x, y);
            this.ring.push(this.add.existing(new HBAsset(this, x, y, this.enemy.sprite)));
            this.add.text(x, y + 14, DIRECTION_NAMES[d as Direction], { fontSize: '12px', color: '#888' }).setOrigin(0.5, 0);
        }

        this.addFootMarker(cx, cy);
        this.main = this.add.existing(new HBAsset(this, cx, cy, this.enemy.sprite)).setScale(MAIN_SCALE);
        // Fase 28¾A: with ?debug=smooth, every Orc here wears the xBR filter (to compare with and without).
        if (DEBUG_START.actions.includes('smooth')) [this.main, ...this.ring].forEach((orc) => orc.setPipeline(XBR_PIPELINE));

        this.info = this.add.text(12, 10, '', { fontFamily: 'monospace', fontSize: '14px', color: '#e0d090' });
        this.add.text(12, GAME_HEIGHT - 26, '← → turn   ↑ ↓ animation   Space pause   Esc back', {
            fontFamily: 'monospace', fontSize: '13px', color: '#aaa',
        });

        const keys = this.input.keyboard;
        if (keys) {
            keys.on('keydown-LEFT', () => this.turn(-1));
            keys.on('keydown-RIGHT', () => this.turn(1));
            keys.on('keydown-UP', () => this.changeState(-1));
            keys.on('keydown-DOWN', () => this.changeState(1));
            keys.on('keydown-SPACE', () => this.togglePause());
            keys.on('keydown-ESC', () => this.scene.start('Game'));
        }

        this.playAll(true);
    }

    override update(): void {
        const state = STATES[this.stateIndex];
        const frame = this.main.anims.currentFrame;
        const total = this.main.anims.currentAnim?.frames.length ?? 0;
        this.info.setText([
            `${this.enemy.name}`,
            `Direction: ${DIRECTION_NAMES[this.direction]} (${this.direction})`,
            `Animation: ${state}  sheet ${MONSTER_SHEET_BASE[state] + this.direction}`,
            `Frame: ${frame ? frame.index : '-'}/${total}${this.main.anims.isPaused ? '  [paused]' : ''}`,
        ]);
    }

    private turn(step: number): void {
        this.direction = ((this.direction + step + DIRECTION_COUNT) % DIRECTION_COUNT) as Direction;
        this.playMain(false);
    }

    private changeState(step: number): void {
        this.stateIndex = (this.stateIndex + step + STATES.length) % STATES.length;
        this.playAll(true);
    }

    private togglePause(): void {
        for (const asset of [this.main, ...this.ring]) {
            if (asset.anims.isPaused) asset.anims.resume();
            else asset.anims.pause();
        }
    }

    /** Restarts the ring and the main Orc; `restart` false keeps the main Orc's frame (direction change). */
    private playAll(restart: boolean): void {
        this.ring.forEach((asset, d) => this.playOn(asset, d as Direction, true));
        this.playMain(restart);
    }

    private playMain(restart: boolean): void {
        this.playOn(this.main, this.direction, restart);
    }

    private playOn(asset: HBAsset, direction: Direction, restart: boolean): void {
        const state = STATES[this.stateIndex];
        const baseSheet = MONSTER_SHEET_BASE[state];
        if (restart) asset.anims.stop();
        asset.playDirectional({
            baseSheet,
            direction,
            frameRate: this.frameRateFor(baseSheet + direction),
            loop: MONSTER_LOOPING_STATES.has(state),
        });
    }

    private frameRateFor(sheet: number): number {
        return monsterFrameRate(this.anims, getSheetKey(this.enemy.sprite, sheet), DEFAULT_ANIMATION_FRAME_RATE, this.enemy.temporalCoefficient);
    }

    /** Small cross at the logical position (the feet) to check pivots visually. */
    private addFootMarker(x: number, y: number): void {
        this.add.line(0, 0, x - MARKER_SIZE, y, x + MARKER_SIZE, y, 0x44aa44).setOrigin(0);
        this.add.line(0, 0, x, y - MARKER_SIZE, x, y + MARKER_SIZE, 0x44aa44).setOrigin(0);
    }
}
