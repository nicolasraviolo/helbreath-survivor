// Magias pasivas en la partida (Fase 28, data/passiveMagic.ts). 28A: el Eye of the Storm, un anillo bajo los pies del
// jugador que cada `hitEveryMs` frena a todos los monstruos con los pies dentro de su elipse (Enemy.slow, sin daño;
// tinte blanco grisáceo). 28B: las Spinning Daggers, dagas con
// brillo que giran a la altura del pecho; cada una golpea a los monstruos que toca, y al mismo monstruo no se le vuelve a
// golpear hasta `hitEveryMs` después. Los angelitos (28C), más adelante, aquí también.
import Phaser from 'phaser';
import { DEPTH_GROUND_SHADOWS } from '../config/gameConfig';
import {
    AURA_BOSS_SLOW_SHARE, AURA_RING_ALPHA, AURA_RING_RADIUS_PX, AURA_RING_Y_SHARE, AURA_SLOW_MS, DAGGER_HIT_RADIUS_PX, DAGGER_LIFT_PX, DAGGER_LOOK, DAGGER_ORBIT_Y_SHARE,
    getMagic, magicMaxRank, magicRank,
} from '../data/passiveMagic';
import type { Enemy } from '../entities/Enemy';
import { ensureGlowTexture } from '../hb/glowTexture';
import { getSheetKey } from '../hb/HBSprite';
import type { DamageType } from '../entities/CharacterStats';
import type { Equipment } from '../entities/Equipment';
import type { Player } from '../entities/Player';
import type { CombatSystem } from './CombatSystem';
import type { EnemySystem } from './EnemySystem';

/** Effect key of the aura's ring. */
const AURA_EFFECT = 'fx.aura.ring';

/** The ground items' sheet with the dagger, and its glowing copy (made once, hb/glowTexture.ts). */
const DAGGER_BASE_TEXTURE = getSheetKey('item.ground', DAGGER_LOOK.sheet);
const DAGGER_TEXTURE = `${DAGGER_BASE_TEXTURE}.daggerGlow`;

/** Soft round spot of light (white, fading out), made once on a canvas and stretched along each dagger. */
const HALO_TEXTURE = 'fx.daggerHalo';
const HALO_TEXTURE_SIZE = 64;

/** The cooldown list is cleaned when it grows past this (dead or pooled monsters stay in it otherwise). */
const DAGGER_COOLDOWN_PRUNE_AT = 200;

/** One spinning dagger: its halo behind and the blade. */
interface DaggerSprite {
    halo: Phaser.GameObjects.Image;
    blade: Phaser.GameObjects.Image;
}

export class PassiveMagicSystem {
    private readonly auraRing: Phaser.GameObjects.Sprite;
    private auraPlaying = false;
    /** Time until the aura's next hit. */
    private auraWaitMs = 0;
    /** As many as the top rank has; the ones the rank doesn't use are hidden. */
    private readonly daggers: DaggerSprite[] = [];
    /** Angle of the first dagger (radians); the others are spread evenly after it. */
    private daggerAngle = 0;
    /** Time since the run started (ms), for the halo's breathing and the cooldowns. */
    private clockMs = 0;
    /** When each monster can be hit by the daggers again. */
    private readonly daggerCooldowns = new Map<Enemy, number>();

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly player: Player,
        private readonly equipment: Equipment,
        private readonly combat: CombatSystem,
        private readonly enemies: EnemySystem,
        private readonly damageType: DamageType,
    ) {
        // Over the ground and its shadows, under every character: the monsters walk over it.
        this.auraRing = scene.add.sprite(0, 0, '__DEFAULT').setVisible(false).setAlpha(AURA_RING_ALPHA).setDepth(DEPTH_GROUND_SHADOWS + 1);
        // Pooled: made once (at most the top rank's count) and only shown or hidden.
        const top = magicRank('daggers', magicMaxRank('daggers'));
        for (let i = 0; i < (top?.count ?? 0); i++) {
            const halo = scene.add.image(0, 0, ensureHaloTexture(scene)).setVisible(false).setBlendMode(Phaser.BlendModes.ADD).setTint(DAGGER_LOOK.haloColor);
            const blade = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
            this.daggers.push({ halo, blade });
        }
    }

    public update(deltaMs: number): void {
        this.clockMs += deltaMs;
        this.updateAura(deltaMs);
        this.updateDaggers(deltaMs);
    }

    private updateAura(deltaMs: number): void {
        const rank = magicRank('aura', this.equipment.magics.aura);
        const on = rank !== undefined && !this.player.isDead;
        if (!on) {
            if (this.auraPlaying) this.auraRing.setVisible(false).stop();
            this.auraPlaying = false;
            return;
        }
        if (!this.auraPlaying) {
            this.auraRing.setVisible(true).play(AURA_EFFECT);
            this.auraPlaying = true;
        }
        const { x, y } = this.player;
        this.auraRing.setPosition(x, y).setScale(rank.radiusPx / AURA_RING_RADIUS_PX);
        this.auraWaitMs -= deltaMs;
        if (this.auraWaitMs > 0) return;
        const magic = getMagic('aura');
        // After a long frame it slows once, not several times in a row.
        this.auraWaitMs = Math.max(0, this.auraWaitMs) + magic.hitEveryMs;
        const slow = rank.slow ?? 0;
        // The monsters whose feet are on the ring's ellipse.
        this.enemies.forEachInGroundEllipse(x, y, rank.radiusPx, AURA_RING_Y_SHARE, (enemy) => {
            const share = enemy.def.boss || enemy.champion ? slow * AURA_BOSS_SLOW_SHARE : slow;
            enemy.slow(1 - share, AURA_SLOW_MS, 'wind');
        });
    }

    private updateDaggers(deltaMs: number): void {
        const rank = magicRank('daggers', this.equipment.magics.daggers);
        const count = this.player.isDead || !rank ? 0 : (rank.count ?? 0);
        // The ground items' sheet is loaded with the run (the XP gems use it); without it, nothing to draw yet.
        const ready = count > 0 && ensureGlowTexture(this.scene, DAGGER_BASE_TEXTURE, DAGGER_TEXTURE, DAGGER_LOOK.bladeGlowColor, DAGGER_LOOK.bladeGlowAlpha);
        if (!ready || !rank) {
            for (const dagger of this.daggers) {
                dagger.halo.setVisible(false);
                dagger.blade.setVisible(false);
            }
            return;
        }
        this.daggerAngle = (this.daggerAngle + (deltaMs / 1000) * (rank.turnsPerSecond ?? 0) * Math.PI * 2) % (Math.PI * 2);
        const magic = getMagic('daggers');
        // Breathing halo: from min to max and back once every haloPulseMs.
        const breath = (1 - Math.cos((this.clockMs / DAGGER_LOOK.haloPulseMs) * Math.PI * 2)) / 2;
        const haloAlpha = DAGGER_LOOK.haloAlpha.min + (DAGGER_LOOK.haloAlpha.max - DAGGER_LOOK.haloAlpha.min) * breath;
        const tipRad = Phaser.Math.DegToRad(DAGGER_LOOK.tipAngleDeg);
        this.daggers.forEach((dagger, i) => {
            if (i >= count) {
                dagger.halo.setVisible(false);
                dagger.blade.setVisible(false);
                return;
            }
            const angle = this.daggerAngle + (i / count) * Math.PI * 2;
            const dx = Math.cos(angle) * rank.radiusPx;
            const dy = Math.sin(angle) * rank.radiusPx * DAGGER_ORBIT_Y_SHARE;
            // On the ground under the dagger: sorted with the characters by it (in front of the player when lower).
            const groundY = this.player.y + dy;
            const x = this.player.x + dx;
            const y = groundY - DAGGER_LIFT_PX;
            // The tip points away from the player, along the circle as seen on screen.
            const rotation = Math.atan2(dy, dx) - tipRad;
            if (!dagger.blade.visible) {
                dagger.blade.setTexture(DAGGER_TEXTURE, DAGGER_LOOK.frame).setOrigin(0.5).setScale(DAGGER_LOOK.scale).setVisible(true);
                dagger.halo.setScale(DAGGER_LOOK.haloLengthPx / HALO_TEXTURE_SIZE, DAGGER_LOOK.haloWidthPx / HALO_TEXTURE_SIZE).setVisible(true);
            }
            dagger.blade.setPosition(x, y).setRotation(rotation).setDepth(groundY);
            // The spot lies along the blade: along the circle's outward direction.
            dagger.halo.setPosition(x, y).setRotation(rotation + tipRad).setDepth(groundY).setAlpha(haloAlpha);
            this.enemies.forEachInRadius(x, y, DAGGER_HIT_RADIUS_PX, (enemy) => {
                const next = this.daggerCooldowns.get(enemy);
                if (next !== undefined && next > this.clockMs) return;
                this.daggerCooldowns.set(enemy, this.clockMs + magic.hitEveryMs);
                // Pushed away from the player, not from the dagger.
                this.combat.hitEnemy(enemy, this.damageType, rank.damage, this.player.x, this.player.y, magic.knockback);
            });
        });
        if (this.daggerCooldowns.size > DAGGER_COOLDOWN_PRUNE_AT) {
            for (const [enemy, next] of this.daggerCooldowns) {
                if (next <= this.clockMs) this.daggerCooldowns.delete(enemy);
            }
        }
    }
}

/** Makes (once) the halo's spot of light and returns its key. */
function ensureHaloTexture(scene: Phaser.Scene): string {
    if (scene.textures.exists(HALO_TEXTURE)) return HALO_TEXTURE;
    const canvas = scene.textures.createCanvas(HALO_TEXTURE, HALO_TEXTURE_SIZE, HALO_TEXTURE_SIZE);
    if (!canvas) return '__DEFAULT';
    const half = HALO_TEXTURE_SIZE / 2;
    const gradient = canvas.context.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    canvas.context.fillStyle = gradient;
    canvas.context.fillRect(0, 0, HALO_TEXTURE_SIZE, HALO_TEXTURE_SIZE);
    canvas.refresh();
    return HALO_TEXTURE;
}
