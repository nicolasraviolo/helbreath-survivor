// Efectos de sonido con límite de simultáneos (data/audio.ts). Si un sonido ya suena demasiadas veces,
// o acaba de empezar, o hay demasiados sonando en total, el nuevo se descarta en silencio.
import type Phaser from 'phaser';
import type { SoundKey } from '../config/assetManifest';
import { AUDIO } from '../data/audio';

export class AudioSystem {
    /** End time (ms, scene clock) of every sound still playing, per key. */
    private readonly playing = new Map<SoundKey, number[]>();
    private readonly lastStart = new Map<SoundKey, number>();
    private total = 0;
    private skipped = 0;

    constructor(private readonly scene: Phaser.Scene) {}

    /** Sounds playing right now (as counted at the last `play`). */
    public get playingCount(): number {
        return this.total;
    }

    /** Sounds skipped by the limits since the scene started. */
    public get skippedCount(): number {
        return this.skipped;
    }

    public play(key: SoundKey): void {
        const now = this.scene.time.now;
        this.forgetFinished(now);
        const ends = this.playing.get(key) ?? [];
        const last = this.lastStart.get(key) ?? -Infinity;
        if (ends.length >= AUDIO.maxPerSound || now - last < AUDIO.minIntervalMs || this.total >= AUDIO.maxTotal) {
            this.skipped++;
            return;
        }
        const sound = this.scene.sound.add(key, { volume: AUDIO.sfxVolume });
        sound.once('complete', () => sound.destroy());
        if (!sound.play()) {
            sound.destroy();
            return;
        }
        ends.push(now + sound.duration * 1000);
        this.playing.set(key, ends);
        this.lastStart.set(key, now);
        this.total++;
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
