// Temblor de cámara (Fase 10, bloque 10C), como el del original (sp-client CameraManager.setCameraShake).
// Decidido por el propietario: suave al recibir daño, más fuerte si pega un jefe, y las explosiones grandes de tus hechizos
// solo con golpe crítico (y no seguidas). Un temblor más flojo no corta uno más fuerte que siga en marcha.
// Se puede quitar en Settings → Screen Shake.
import Phaser from 'phaser';
import { SCREEN_SHAKE } from '../data/feedback';
import { settings } from './Settings';

export class ScreenShake {
    /** Strength (pixels) of the last shake started. */
    private strengthPx = 0;
    /** Time until a critical explosion can shake again. */
    private explosionWaitMs = 0;

    constructor(private readonly camera: Phaser.Cameras.Scene2D.Camera) {}

    /** Shakes the camera up to `px` pixels each way for `durationMs`. */
    public shake(px: number, durationMs: number): void {
        if (!settings.current.screenShake || px < SCREEN_SHAKE.minPx) return;
        const effect = this.camera.shakeEffect;
        const remaining = effect.isRunning ? this.strengthPx * (1 - effect.progress) : 0;
        if (px <= remaining) return;
        this.strengthPx = px;
        // Phaser measures the shake as a share of the view size.
        this.camera.shake(durationMs, new Phaser.Math.Vector2(px / this.camera.width, px / this.camera.height), true);
    }

    public update(deltaMs: number): void {
        this.explosionWaitMs = Math.max(0, this.explosionWaitMs - deltaMs);
    }

    /** The player was hit: soft, stronger if a boss did it. */
    public hurt(byBoss: boolean): void {
        if (byBoss) this.shake(SCREEN_SHAKE.bossHitPx, SCREEN_SHAKE.bossHitMs);
        else this.shake(SCREEN_SHAKE.hurtPx, SCREEN_SHAKE.hurtMs);
    }

    /** A big explosion of one of the player's spells was a critical hit. */
    public criticalExplosion(px: number): void {
        if (this.explosionWaitMs > 0) return;
        this.explosionWaitMs = SCREEN_SHAKE.explosionCooldownMs;
        this.shake(px, SCREEN_SHAKE.explosionMs);
    }
}
