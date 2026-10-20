// Abaddon's Blood en la partida (Fase 21E; números en data/abaddon.ts). Si está desbloqueado (UnlockStore) y aún no
// se ha usado en esta partida, al morir el personaje queda un momento en el suelo y se levanta: media vida, unos
// segundos invulnerable, el efecto Resurrection, su voz (C21/C22), una onda roja que aparta a los monstruos sin
// hacerles daño y el letrero "Abaddon's Blood!". Se guarda en la partida si ya se usó (Continue no da otro).
// La onda y el letrero son un solo objeto cada uno, creados una vez y reutilizados.
import Phaser from 'phaser';
import { DEPTH_DAMAGE_NUMBERS, PLAYER_BODY_OFFSET_Y } from '../config/gameConfig';
import { UI_FONT_SIZE, UI_TEXT, px } from '../config/ui';
import type { EffectKey } from '../config/effects';
import { ABADDON } from '../data/abaddon';
import { GENDER_SOUNDS } from '../data/appearance';
import type { Player } from '../entities/Player';
import type { AudioSystem } from './AudioSystem';
import type { EnemySystem } from './EnemySystem';
import { unlockStore } from './UnlockStore';

/** What the bottom bar shows: ready, used in this run, or nothing (not unlocked). */
export type ReviveHudState = 'ready' | 'used' | undefined;

export class AbaddonRevive {
    private readonly unlocked = unlockStore.has('abaddon');
    private used = false;
    private readonly wave: Phaser.GameObjects.Arc;
    private readonly banner: Phaser.GameObjects.Text;
    private waveMs = -1;
    private bannerMs = -1;

    constructor(
        scene: Phaser.Scene,
        private readonly audio: AudioSystem,
        private readonly enemies: EnemySystem,
        private readonly spawnEffect: (key: EffectKey, x: number, y: number) => void,
    ) {
        this.wave = scene.add.circle(0, 0, 1).setStrokeStyle(ABADDON.waveWidth, ABADDON.waveColor, 1).setDepth(DEPTH_DAMAGE_NUMBERS).setVisible(false);
        this.wave.isFilled = false;
        this.banner = scene.add.text(0, 0, ABADDON.banner, {
            ...UI_TEXT, fontSize: px(UI_FONT_SIZE.large), color: ABADDON.bannerColor, stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(DEPTH_DAMAGE_NUMBERS).setVisible(false);
    }

    /** Whether dying now would bring the character back. */
    public get ready(): boolean {
        return this.unlocked && !this.used;
    }

    /** Used in this run (saved with it). */
    public get spent(): boolean {
        return this.used;
    }

    public get hudState(): ReviveHudState {
        if (!this.unlocked) return undefined;
        return this.used ? 'used' : 'ready';
    }

    /** Continue: it was already used in this run. */
    public restore(used: boolean): void {
        this.used = used;
    }

    /**
     * Called every frame while the character lies dead. Gets it up once it has been on the ground for a moment;
     * returns true if it did (or will), false if the run should end.
     */
    public tryRevive(player: Player): boolean {
        if (!this.ready) return false;
        if (player.deadForMs < ABADDON.reviveDelayMs) return true;
        this.used = true;
        player.revive(player.maxHp * ABADDON.reviveHpShare, ABADDON.invulnerableMs);
        this.spawnEffect(ABADDON.effect, player.x, player.y);
        this.audio.play(GENDER_SOUNDS[player.look.gender].revive);
        this.audio.play(ABADDON.sound);
        this.enemies.forEachInRadius(player.x, player.y, ABADDON.waveRadius, (enemy) => enemy.push(player.x, player.y, ABADDON.wavePush));
        const bodyY = player.y - PLAYER_BODY_OFFSET_Y;
        this.wave.setPosition(player.x, bodyY).setVisible(true);
        this.waveMs = 0;
        this.banner.setPosition(player.x, bodyY - PLAYER_BODY_OFFSET_Y * 2).setAlpha(1).setVisible(true);
        this.bannerMs = 0;
        return true;
    }

    /** Grows the ring and lifts the banner while they show. */
    public update(deltaMs: number): void {
        if (this.waveMs >= 0) {
            this.waveMs += deltaMs;
            const t = Math.min(1, this.waveMs / ABADDON.waveMs);
            this.wave.setRadius(ABADDON.waveRadius * Phaser.Math.Easing.Cubic.Out(t)).setAlpha(1 - t);
            if (t >= 1) {
                this.wave.setVisible(false);
                this.waveMs = -1;
            }
        }
        if (this.bannerMs >= 0) {
            const step = (ABADDON.bannerRiseY * deltaMs) / ABADDON.bannerMs;
            this.bannerMs += deltaMs;
            const t = Math.min(1, this.bannerMs / ABADDON.bannerMs);
            this.banner.setY(this.banner.y - step).setAlpha(t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4);
            if (t >= 1) {
                this.banner.setVisible(false);
                this.bannerMs = -1;
            }
        }
    }
}
