// Buffs temporales del cofre (Berserk y Defense Shield). Se combinan: se pueden tener los dos a la vez, cada uno con
// su temporizador. Coger otra vez uno que ya está activo renueva su tiempo (decidido por el propietario el 16-oct-2026).
// Visuales del original: el efecto de lanzarlo a los pies, el aura que sigue al jugador (Defense Shield) y el brillo
// rojo aditivo sobre el personaje (Berserk). Al cogerlo, su nombre sube sobre el jugador ("Berserk!"), como al lanzar
// un hechizo en el original, con la fuente dibujada del juego.
import Phaser from 'phaser';
import { EFFECTS, type EffectDef } from '../config/effects';
import { DEPTH_DAMAGE_NUMBERS, DEPTH_EFFECT_OFFSET } from '../config/gameConfig';
import { BUFF_CAST_SOUND, BUFF_NAME_FLOAT, BUFF_OVERLAY_ALPHA, BUFFS, getBuff, type BuffDef, type BuffId } from '../data/pickups';
import { SpriteText } from '../hb/SpriteText';
import type { Player } from '../entities/Player';
import type { AudioSystem } from './AudioSystem';

const BUFF_IDS = Object.keys(BUFFS) as BuffId[];

/** A buff that is on, for the HUD. */
export interface ActiveBuff {
    def: BuffDef;
    secondsLeft: number;
}

export class BuffSystem {
    /** Time left of each active buff. */
    private readonly left = new Map<BuffId, number>();
    /** One looping aura sprite per buff that has one, reused every time that buff starts. */
    private readonly auras = new Map<BuffId, Phaser.GameObjects.Sprite>();
    private readonly listed: ActiveBuff[] = [];
    /** The rising "Name!" of each buff, reused every time it starts, and how long it has been showing. */
    private readonly names = new Map<BuffId, { text: SpriteText; ageMs: number }>();

    constructor(
        scene: Phaser.Scene,
        private readonly player: Player,
        private readonly audio: AudioSystem,
        /** Plays a one-shot effect at a point (shared effect pool). */
        private readonly spawnEffect: (key: BuffDef['castEffect'], x: number, y: number) => void,
    ) {
        for (const id of BUFF_IDS) {
            const def = getBuff(id);
            if (def.auraEffect) this.auras.set(id, scene.add.sprite(0, 0, '__DEFAULT').setVisible(false));
            const text = new SpriteText(scene, 0, 0, `${def.name}!`, def.color, 'center');
            text.container.setDepth(DEPTH_DAMAGE_NUMBERS).setVisible(false);
            this.names.set(id, { text, ageMs: BUFF_NAME_FLOAT.lifeMs });
        }
    }

    /** Active buffs with their seconds left (the array is reused: read it right away). */
    public get active(): readonly ActiveBuff[] {
        this.listed.length = 0;
        for (const [id, ms] of this.left) this.listed.push({ def: getBuff(id), secondsLeft: Math.ceil(ms / 1000) });
        return this.listed;
    }

    /** Product of the damage bonuses of every active buff. */
    public get damageMultiplier(): number {
        let multiplier = 1;
        for (const id of this.left.keys()) multiplier *= getBuff(id).damageMultiplier;
        return multiplier;
    }

    public get damageTakenMultiplier(): number {
        let multiplier = 1;
        for (const id of this.left.keys()) multiplier *= getBuff(id).damageTakenMultiplier;
        return multiplier;
    }

    /** Chest: an offensive or a defensive buff, chosen at random. */
    public startRandom(): void {
        const kind = Math.random() < 0.5 ? 'offense' : 'defense';
        const id = Phaser.Utils.Array.GetRandom(BUFF_IDS.filter((buff) => getBuff(buff).kind === kind));
        if (id) this.start(id);
    }

    /** Turns a buff on, or renews its time if it was already on. */
    public start(id: BuffId): void {
        const def: BuffDef = getBuff(id);
        const wasOn = this.left.has(id);
        this.left.set(id, def.durationMs);
        this.spawnEffect(def.castEffect, this.player.x, this.player.y);
        this.audio.play(BUFF_CAST_SOUND);
        const name = this.names.get(id);
        if (name) {
            name.ageMs = 0;
            name.text.container.setVisible(true).setAlpha(1);
        }
        if (wasOn) return;
        if (def.auraEffect) this.auras.get(id)?.setVisible(true).play(def.auraEffect);
        this.refreshGlow();
    }

    public update(deltaMs: number): void {
        this.updateNames(deltaMs);
        for (const [id, ms] of this.left) {
            const remaining = ms - deltaMs;
            if (remaining <= 0 || this.player.isDead) this.stop(id);
            else this.left.set(id, remaining);
        }
        for (const [id, aura] of this.auras) {
            const auraKey = getBuff(id).auraEffect;
            if (!aura.visible || !auraKey) continue;
            const def: EffectDef = EFFECTS[auraKey];
            aura.setPosition(this.player.x + (def.offsetX ?? 0), this.player.y + (def.offsetY ?? 0)).setDepth(this.player.y + DEPTH_EFFECT_OFFSET);
        }
    }

    /** The names rise from over the player's head and fade out during their last second. */
    private updateNames(deltaMs: number): void {
        const { offsetY, risePxPerSec, lifeMs, fadeMs } = BUFF_NAME_FLOAT;
        for (const name of this.names.values()) {
            if (name.ageMs >= lifeMs) continue;
            name.ageMs += deltaMs;
            const container = name.text.container;
            if (name.ageMs >= lifeMs) {
                container.setVisible(false);
                continue;
            }
            const rise = (name.ageMs / 1000) * risePxPerSec;
            container.setPosition(this.player.x, this.player.y + offsetY - rise);
            container.setAlpha(Math.min(1, (lifeMs - name.ageMs) / fadeMs));
        }
    }

    private stop(id: BuffId): void {
        this.left.delete(id);
        this.auras.get(id)?.stop().setVisible(false);
        this.refreshGlow();
    }

    /** The glow of the first active buff that has one (only Berserk today). */
    private refreshGlow(): void {
        for (const id of this.left.keys()) {
            const tint = getBuff(id).overlayTint;
            if (tint !== undefined) {
                this.player.setGlow(tint, BUFF_OVERLAY_ALPHA);
                return;
            }
        }
        this.player.setGlow(undefined);
    }
}
