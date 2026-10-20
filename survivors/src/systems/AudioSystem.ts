// Efectos de sonido con límite de simultáneos (data/audio.ts). Si un sonido ya suena demasiadas veces,
// o acaba de empezar, o hay demasiados sonando en total, el nuevo se descarta en silencio.
// Como en el original, un sonido puede ajustar su velocidad para durar lo mismo que una animación,
// y hay sonidos en bucle (los pasos) que suenan mientras dura una acción.
// Pestaña en segundo plano (lista de bugs del 19-oct-2026, B4): el navegador congela el audio, y los sonidos pedidos
// entonces salían todos juntos (o uno se quedaba "trabado") al volver. Ahora no se piden sonidos con la pestaña oculta
// ni con el audio parado, y al ocultarla se cortan los efectos que sonaban (la música es aparte, MusicSystem).
import Phaser from 'phaser';
import type { SoundKey } from '../config/assetManifest';
import { AUDIO } from '../data/audio';
import { settings, SETTINGS_CHANGED } from './Settings';

export class AudioSystem {
    /** End time (ms, scene clock) of every sound still playing, per key. */
    private readonly playing = new Map<SoundKey, number[]>();
    private readonly lastStart = new Map<SoundKey, number>();
    private total = 0;
    private skipped = 0;
    private readonly loops = new Map<SoundKey, Phaser.Sound.BaseSound>();
    /** One-shot sounds still playing (cut when the tab is hidden). */
    private readonly oneShots = new Set<Phaser.Sound.BaseSound>();

    constructor(private readonly scene: Phaser.Scene) {
        // Sounds belong to the whole game, not to the scene: loops must be stopped by hand when it pauses or ends.
        const stopLoops = () => {
            for (const key of [...this.loops.keys()]) this.stopLoop(key);
        };
        const onSettings = () => {
            for (const loop of this.loops.values()) {
                if (loop instanceof Phaser.Sound.WebAudioSound || loop instanceof Phaser.Sound.HTML5AudioSound) loop.setVolume(sfxVolume());
            }
        };
        const onVisibility = () => {
            if (document.visibilityState !== 'hidden') return;
            stopLoops();
            this.stopOneShots();
        };
        scene.events.on(Phaser.Scenes.Events.PAUSE, stopLoops);
        settings.on(SETTINGS_CHANGED, onSettings);
        document.addEventListener('visibilitychange', onVisibility);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            stopLoops();
            this.stopOneShots();
            scene.events.off(Phaser.Scenes.Events.PAUSE, stopLoops);
            settings.off(SETTINGS_CHANGED, onSettings);
            document.removeEventListener('visibilitychange', onVisibility);
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
        if (!this.canPlay()) return;
        const now = this.scene.time.now;
        this.forgetFinished(now);
        const ends = this.playing.get(key) ?? [];
        const last = this.lastStart.get(key) ?? -Infinity;
        if (ends.length >= AUDIO.maxPerSound || now - last < AUDIO.minIntervalMs || this.total >= AUDIO.maxTotal) {
            this.skipped++;
            return;
        }
        const sound = this.scene.sound.add(key, { volume: sfxVolume(), rate: this.rateFor(key, durationMs) });
        sound.once('complete', () => {
            this.oneShots.delete(sound);
            sound.destroy();
        });
        if (!sound.play()) {
            sound.destroy();
            return;
        }
        this.oneShots.add(sound);
        ends.push(now + (sound.duration * 1000) / this.rateFor(key, durationMs));
        this.playing.set(key, ends);
        this.lastStart.set(key, now);
        this.total++;
    }

    /** Keeps a sound looping, each repetition lasting `durationMs`. Calling it again while it plays does nothing. */
    public startLoop(key: SoundKey, durationMs: number): void {
        if (this.loops.has(key) || !this.canPlay()) return;
        const sound = this.scene.sound.add(key, { volume: sfxVolume(), loop: true, rate: this.rateFor(key, durationMs) });
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

    /** False with the tab hidden or the browser's audio stopped: the sound would wait and play late. */
    private canPlay(): boolean {
        if (document.visibilityState === 'hidden') return false;
        const manager = this.scene.sound;
        return !(manager instanceof Phaser.Sound.WebAudioSoundManager) || manager.context.state === 'running';
    }

    private stopOneShots(): void {
        for (const sound of this.oneShots) {
            sound.stop();
            sound.destroy();
        }
        this.oneShots.clear();
        this.playing.clear();
        this.total = 0;
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

/** Effect volume from data/audio.ts times the player's sound setting. */
function sfxVolume(): number {
    return AUDIO.sfxVolume * settings.current.sfxVolume;
}
