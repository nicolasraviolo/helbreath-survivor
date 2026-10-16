// Efectos de sonido con límite de simultáneos (data/audio.ts). Si un sonido ya suena demasiadas veces,
// o acaba de empezar, o hay demasiados sonando en total, el nuevo se descarta en silencio.
// Como en el original, un sonido puede ajustar su velocidad para durar lo mismo que una animación,
// y hay sonidos en bucle (los pasos) que suenan mientras dura una acción.
import Phaser from 'phaser';
import type { SoundKey } from '../config/assetManifest';
import { AUDIO } from '../data/audio';

export class AudioSystem {
    /** End time (ms, scene clock) of every sound still playing, per key. */
    private readonly playing = new Map<SoundKey, number[]>();
    private readonly lastStart = new Map<SoundKey, number>();
    private total = 0;
    private skipped = 0;
    private readonly loops = new Map<SoundKey, Phaser.Sound.BaseSound>();

    constructor(private readonly scene: Phaser.Scene) {
        // Sounds belong to the whole game, not to the scene: loops must be stopped by hand when it pauses or ends.
        const stopLoops = () => {
            for (const key of [...this.loops.keys()]) this.stopLoop(key);
        };
        scene.events.on(Phaser.Scenes.Events.PAUSE, stopLoops);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            stopLoops();
            scene.events.off(Phaser.Scenes.Events.PAUSE, stopLoops);
        });
    }

    /** Sounds playing right now (as counted at the last `play`). */
    public get playingCount(): number {
        return this.total;
    }

    /** Sounds skipped by the limits since the scene started. */
    public get skippedCount(): number {
        return this.skipped;
    }

    /** Plays a sound once. With `durationMs`, its speed changes so it lasts that long (like the original). */
    public play(key: SoundKey, durationMs?: number): void {
        const now = this.scene.time.now;
        this.forgetFinished(now);
        const ends = this.playing.get(key) ?? [];
        const last = this.lastStart.get(key) ?? -Infinity;
        if (ends.length >= AUDIO.maxPerSound || now - last < AUDIO.minIntervalMs || this.total >= AUDIO.maxTotal) {
            this.skipped++;
            return;
        }
        const sound = this.scene.sound.add(key, { volume: AUDIO.sfxVolume, rate: this.rateFor(key, durationMs) });
        sound.once('complete', () => sound.destroy());
        if (!sound.play()) {
            sound.destroy();
            return;
        }
        ends.push(now + (sound.duration * 1000) / this.rateFor(key, durationMs));
        this.playing.set(key, ends);
        this.lastStart.set(key, now);
        this.total++;
    }

    /** Keeps a sound looping, each repetition lasting `durationMs`. Calling it again while it plays does nothing. */
    public startLoop(key: SoundKey, durationMs: number): void {
        if (this.loops.has(key)) return;
        const sound = this.scene.sound.add(key, { volume: AUDIO.sfxVolume, loop: true, rate: this.rateFor(key, durationMs) });
        sound.play();
        this.loops.set(key, sound);
    }

    public stopLoop(key: SoundKey): void {
        const sound = this.loops.get(key);
        if (!sound) return;
        sound.stop();
        sound.destroy();
        this.loops.delete(key);
    }

    /** Speed that makes the sound last `durationMs` (sound length / wanted length), within the allowed range. */
    private rateFor(key: SoundKey, durationMs: number | undefined): number {
        const seconds = this.scene.cache.audio.get(key)?.duration;
        if (durationMs === undefined || typeof seconds !== 'number' || durationMs <= 0) return 1;
        return Phaser.Math.Clamp((seconds * 1000) / durationMs, AUDIO.minRate, AUDIO.maxRate);
    }

    private forgetFinished(now: number): void {
        let total = 0;
        for (const ends of this.playing.values()) {
            for (let i = ends.length - 1; i >= 0; i--) {
                if ((ends[i] ?? 0) <= now) ends.splice(i, 1);
            }
            total += ends.length;
        }
        this.total = total;
    }
}
