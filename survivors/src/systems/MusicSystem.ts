// Música de fondo según el momento de la partida (data/audio.ts → MUSIC). Cambia de pista con un fundido suave.
// Como en sp-client (MusicManager), cada pista suena en bucle. Los sonidos de Phaser son del juego entero, no de la
// escena, así que la música se para a mano al salir de la escena.
import Phaser from 'phaser';
import type { SoundKey } from '../config/assetManifest';
import { MUSIC } from '../data/audio';

export class MusicSystem {
    private current: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | undefined;
    private currentKey: SoundKey | undefined;

    constructor(private readonly scene: Phaser.Scene) {
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopNow());
    }

    /** Switches to a track (fading the old one out and the new one in). Calling it with the same track does nothing. */
    public play(key: SoundKey): void {
        if (key === this.currentKey) return;
        this.fadeOut(this.current);
        this.currentKey = key;
        const sound = this.scene.sound.add(key, { loop: true, volume: 0 });
        if (!(sound instanceof Phaser.Sound.WebAudioSound || sound instanceof Phaser.Sound.HTML5AudioSound)) {
            sound.destroy();
            this.current = undefined;
            return;
        }
        sound.play();
        this.scene.tweens.add({ targets: sound, volume: MUSIC.volume, duration: MUSIC.fadeMs });
        this.current = sound;
    }

    private fadeOut(sound: MusicSystem['current']): void {
        if (!sound) return;
        this.scene.tweens.add({
            targets: sound, volume: 0, duration: MUSIC.fadeMs,
            onComplete: () => {
                sound.stop();
                sound.destroy();
            },
        });
    }

    private stopNow(): void {
        this.current?.stop();
        this.current?.destroy();
        this.current = undefined;
        this.currentKey = undefined;
    }
}
