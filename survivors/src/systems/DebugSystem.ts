// Panel de depuración (F1 o botón View del mando): FPS, posición, dispositivo de entrada, datos de la escena,
// caja de choque del jugador y casillas no transitables cercanas en rojo.
import Phaser from 'phaser';
import { DEPTH_DEBUG, TILE_SIZE } from '../config/gameConfig';
import type { Player } from '../entities/Player';
import type { HBMap } from '../hb/HBMap';
import { DIRECTION_NAMES } from '../hb/directions';
import type { InputSystem } from './InputSystem';
import { ScreenLayer } from '../ui/renderScale';

const BLOCKED_COLOR = 0xff3030;
const HITBOX_COLOR = 0x30ff60;
const FEET_MARK = 4;

export class DebugSystem {
    private enabled = false;
    private readonly text: Phaser.GameObjects.Text;
    private readonly graphics: Phaser.GameObjects.Graphics;
    private readonly hitbox = new Phaser.Geom.Rectangle();

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly map: HBMap,
        private readonly player: Player,
        private readonly input: InputSystem,
        /** Extra lines provided by the scene (enemy count, health…). */
        private readonly extraLines: () => string[] = () => [],
    ) {
        this.graphics = scene.add.graphics().setDepth(DEPTH_DEBUG);
        this.text = scene.add.text(8, 8, '', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#e0f0a0',
            backgroundColor: '#000000a0',
            padding: { x: 6, y: 4 },
        });
        new ScreenLayer(scene, DEPTH_DEBUG).addFixed(this.text);
        this.setEnabled(false);
    }

    public toggle(): void {
        this.setEnabled(!this.enabled);
    }

    public update(): void {
        if (!this.enabled) {
            return;
        }
        const { player } = this;
        const move = this.input.getMove();
        this.text.setText([
            `FPS: ${this.scene.game.loop.actualFps.toFixed(0)}`,
            `Pos: ${player.x.toFixed(0)}, ${player.y.toFixed(0)}  tile ${Math.floor(player.x / TILE_SIZE)}, ${Math.floor(player.y / TILE_SIZE)}`,
            `Dir: ${DIRECTION_NAMES[player.direction]}  state: ${player.state}`,
            `Mov: ${move.x.toFixed(2)}, ${move.y.toFixed(2)}  (${move.length().toFixed(2)})`,
            `Input: ${this.input.getLastDevice()}`,
            `Gamepad: ${this.input.getGamepadName() ?? 'not detected (press a button)'}`,
            ...this.extraLines(),
        ]);

        const g = this.graphics.clear();
        const view = this.scene.cameras.main.worldView;
        g.fillStyle(BLOCKED_COLOR, 0.3);
        for (let ty = Math.floor(view.top / TILE_SIZE); ty <= Math.floor(view.bottom / TILE_SIZE); ty++) {
            for (let tx = Math.floor(view.left / TILE_SIZE); tx <= Math.floor(view.right / TILE_SIZE); tx++) {
                if (!this.map.isWalkableTile(tx, ty)) {
                    g.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
        g.lineStyle(1, HITBOX_COLOR, 1).strokeRectShape(player.getHitbox(this.hitbox));
        g.lineBetween(player.x - FEET_MARK, player.y, player.x + FEET_MARK, player.y);
        g.lineBetween(player.x, player.y - FEET_MARK, player.x, player.y + FEET_MARK);
    }

    private setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.text.setVisible(enabled);
        this.graphics.setVisible(enabled);
        if (!enabled) this.graphics.clear();
    }
}
