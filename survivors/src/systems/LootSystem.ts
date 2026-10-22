// Botín en el suelo (Fase 21A): decide si cae algo al morir un monstruo o un jefe (data/loot.ts), tira qué objeto es
// (LootRoller), lo recicla con un pool y avisa al juego cuando el jugador lo coge. Qué pasa después (la carta Equip /
// Keep in bag) lo decide GameScene.
import type Phaser from 'phaser';
import { DEBUG_START } from '../config/debugStart';
import { CHAMPION } from '../data/champion';
import { XELIMA_STONE_ID, ZEM_ID } from '../data/consumables';
import type { Gender } from '../data/appearance';
import type { CharacterId } from '../data/characters';
import { LOOT_BOSS_DROPS, LOOT_BOSS_SPREAD, LOOT_DROP_CHANCE, LOOT_GROUND, LOOT_SOUNDS, LOOT_XELIMA_CHANCE, LOOT_ZEM_BOSS_CHANCE, type OwnedItem } from '../data/loot';
import type { Stats } from '../data/stats';
import { LootDrop } from '../entities/LootDrop';
import { Pool } from '../utils/Pool';
import type { AudioSystem } from './AudioSystem';
import { rollLoot } from './LootRoller';

/** Who the loot is rolled for: the class, and the permanent stats and Level it is measured against. */
export interface LootOwner {
    classId: CharacterId;
    gender: Gender;
    stats: Readonly<Stats>;
    level: number;
}

export class LootSystem {
    private readonly drops: Pool<LootDrop>;
    private readonly finished: LootDrop[] = [];
    /** Off in the simulated run (nobody would choose the cards). */
    public enabled = true;

    constructor(
        scene: Phaser.Scene,
        private readonly audio: AudioSystem,
        private readonly owner: LootOwner,
        private readonly onPickup: (item: OwnedItem) => void,
    ) {
        this.drops = new Pool(() => new LootDrop(scene));
    }

    /** Items on the ground (for the minimap). */
    public get active(): readonly LootDrop[] {
        return this.drops.active;
    }

    /** A monster died there: maybe drops an item (more often if it was elite) and, very rarely, a Xelima stone (24C). */
    public onKill(x: number, y: number, elite: boolean): void {
        if (Math.random() < (elite ? LOOT_DROP_CHANCE.elite : LOOT_DROP_CHANCE.normal)) this.dropRolled(x, y);
        const xelima = DEBUG_START.actions.includes('xelima') ? LOOT_XELIMA_CHANCE.debug : LOOT_XELIMA_CHANCE.normal;
        if (this.enabled && Math.random() < xelima) this.drop({ id: XELIMA_STONE_ID }, x, y);
    }

    /** A boss died there: its items (and, sometimes, a Zem: Fase 21D) fall in a small circle. */
    public onBossKill(x: number, y: number, final: boolean): void {
        const drops = final ? LOOT_BOSS_DROPS.finalBoss : LOOT_BOSS_DROPS.miniBoss;
        const count = drops.count + (Math.random() < drops.extraChance ? 1 : 0);
        const zem = this.enabled && (DEBUG_START.actions.includes('zem') || Math.random() < LOOT_ZEM_BOSS_CHANCE);
        const total = count + (zem ? 1 : 0);
        const spread = total > 1 ? LOOT_BOSS_SPREAD : 0;
        const at = (i: number): [number, number] => [x + Math.cos((i / total) * Math.PI * 2) * spread, y + Math.sin((i / total) * Math.PI * 2) * spread];
        for (let i = 0; i < count; i++) this.dropRolled(...at(i));
        if (zem) this.drop({ id: ZEM_ID }, ...at(count));
    }

    /** A champion died there (Fase 21½C): an item of the next step or better, guaranteed, and sometimes a Zem beside it. */
    public onChampionKill(x: number, y: number): void {
        if (!this.enabled) return;
        const zem = DEBUG_START.actions.includes('zem') || Math.random() < CHAMPION.zemChance;
        const spread = zem ? LOOT_BOSS_SPREAD / 2 : 0;
        this.dropRolled(x - spread, y, CHAMPION.lootTiers);
        if (zem) this.drop({ id: ZEM_ID }, x + spread, y);
    }

    /** A rolled item at (x, y); `tierWeights` as in rollLoot. */
    public dropRolled(x: number, y: number, tierWeights?: Parameters<typeof rollLoot>[3]): void {
        if (!this.enabled) return;
        const { classId, stats, level } = this.owner;
        const item = rollLoot(classId, stats, level, tierWeights);
        if (item) this.drop(item, x, y);
    }

    public drop(item: OwnedItem, x: number, y: number): void {
        this.drops.acquire().drop(item, x, y, this.owner.gender);
        this.audio.play(LOOT_SOUNDS.drop);
    }

    /** Development (check loot): picks up every item on the ground at once, wherever the player is. */
    public pickUpAll(): void {
        for (const drop of this.drops.active) {
            this.onPickup(drop.item);
            drop.deactivate();
            this.finished.push(drop);
        }
        for (const drop of this.finished) this.drops.release(drop);
        this.finished.length = 0;
    }

    /** Animates the items and collects the ones the player at (x, y) (feet) touches. */
    public update(deltaMs: number, x: number, y: number, canCollect: boolean): void {
        const reachSq = LOOT_GROUND.pickupRadius * LOOT_GROUND.pickupRadius;
        for (const drop of this.drops.active) {
            drop.update(deltaMs);
            const dx = drop.x - x;
            const dy = drop.y - y;
            if (canCollect && dx * dx + dy * dy <= reachSq) {
                this.audio.play(LOOT_SOUNDS.pickup);
                this.onPickup(drop.item);
                drop.deactivate();
                this.finished.push(drop);
            }
        }
        // Released after the loop: releasing reorders `active` while we iterate it.
        for (const drop of this.finished) this.drops.release(drop);
        this.finished.length = 0;
    }
}
