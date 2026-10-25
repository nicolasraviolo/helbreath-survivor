// Magias pasivas en la partida (Fase 28, data/passiveMagic.ts). 28A: el Damage Aura, un anillo bajo los pies del
// jugador que cada `hitEveryMs` golpea a todos los monstruos con los pies dentro de su elipse (con CombatSystem: cuentan los
// multiplicadores de daño de la clase, el crítico, los números y las muertes). Las espadas (28B) y los angelitos (28C),
// más adelante, aquí también.
import type Phaser from 'phaser';
import { DEPTH_GROUND_SHADOWS } from '../config/gameConfig';
import { AURA_RING_ALPHA, AURA_RING_RADIUS_PX, AURA_RING_Y_SHARE, getMagic, magicRank } from '../data/passiveMagic';
import type { DamageType } from '../entities/CharacterStats';
import type { Equipment } from '../entities/Equipment';
import type { Player } from '../entities/Player';
import type { CombatSystem } from './CombatSystem';
import type { EnemySystem } from './EnemySystem';

/** Effect key of the aura's ring. */
const AURA_EFFECT = 'fx.aura.ring';

export class PassiveMagicSystem {
    private readonly auraRing: Phaser.GameObjects.Sprite;
    private auraPlaying = false;
    /** Time until the aura's next hit. */
    private auraWaitMs = 0;

    constructor(
        scene: Phaser.Scene,
        private readonly player: Player,
        private readonly equipment: Equipment,
        private readonly combat: CombatSystem,
        private readonly enemies: EnemySystem,
        private readonly damageType: DamageType,
    ) {
        // Over the ground and its shadows, under every character: the monsters walk over it.
        this.auraRing = scene.add.sprite(0, 0, '__DEFAULT').setVisible(false).setAlpha(AURA_RING_ALPHA).setDepth(DEPTH_GROUND_SHADOWS + 1);
    }

    public update(deltaMs: number): void {
        this.updateAura(deltaMs);
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
        // After a long frame it hits once, not several times in a row.
        this.auraWaitMs = Math.max(0, this.auraWaitMs) + magic.hitEveryMs;
        // The monsters whose feet are on the ring's ellipse.
        this.enemies.forEachInGroundEllipse(x, y, rank.radiusPx, AURA_RING_Y_SHARE, (enemy) => {
            this.combat.hitEnemy(enemy, this.damageType, rank.damage, x, y, magic.knockback);
        });
    }
}
