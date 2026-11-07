// Helbreath Off (Fase Off-2): los pits. Al entrar se llenan; cuando un monstruo muere y su cuerpo desaparece deja
// hueco, y cada cierto tiempo hay 1 posibilidad de 3 de que salga otro (servidor MobGenerator). Los monstruos van en
// pools, uno por tipo (regla 5).
import Phaser from 'phaser';
import type { TileRect } from '../../data/maps';
import { MONSTER_AI } from '../../data/enemies';
import { Pool } from '../../utils/Pool';
import { OFF_COMBAT } from '../data/offCombat';
import { OFF_MONSTERS, rollMonsterHp, type OffMonsterId } from '../data/offMonsters';
import { OFF_PIT_RESPAWN, type OffPitDef } from '../data/offPits';
import { OffMonster } from '../entities/OffMonster';
import { rollDice } from './OffCombatRules';
import type { TilePoint } from './TileMover';

/** Tries to find a free tile in a pit before giving up until the next check. */
const SPAWN_TRIES = 20;

export class OffPits {
    /** Monsters on the map, alive or dead (bodies still showing). */
    public readonly monsters: OffMonster[] = [];
    private readonly pools = new Map<OffMonsterId, Pool<OffMonster>>();
    private checkLeftMs: number = OFF_PIT_RESPAWN.checkMs;

    constructor(scene: Phaser.Scene, private readonly pits: readonly OffPitDef[], private readonly isFree: (x: number, y: number) => boolean) {
        for (const id of Object.keys(OFF_MONSTERS) as OffMonsterId[]) {
            this.pools.set(id, new Pool(() => new OffMonster(scene, id, OFF_MONSTERS[id], isFree)));
        }
    }

    /** Every pit full, as when the map opens. */
    public fillAll(): void {
        this.pits.forEach((pit, index) => {
            for (let i = this.aliveIn(index); i < pit.max; i++) this.spawnIn(index);
        });
    }

    /** Zone where a pit's monsters wander: the pit and a margin round it. */
    public wanderArea(pit: number): TileRect {
        const area = this.pits[pit]?.area ?? { x: 0, y: 0, width: 1, height: 1 };
        const margin = OFF_PIT_RESPAWN.wanderMargin;
        return { x: area.x - margin, y: area.y - margin, width: area.width + margin * 2, height: area.height + margin * 2 };
    }

    /** Clears away the bodies that have faded, and refills the pits now and then. */
    public update(deltaMs: number): void {
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const monster = this.monsters[i];
            if (monster && monster.isGone) {
                this.monsters.splice(i, 1);
                this.pools.get(monster.id)?.release(monster);
            }
        }
        this.checkLeftMs -= deltaMs;
        if (this.checkLeftMs > 0) return;
        this.checkLeftMs = OFF_PIT_RESPAWN.checkMs;
        this.pits.forEach((pit, index) => {
            if (this.aliveIn(index) + this.deadIn(index) < pit.max && Math.random() < OFF_PIT_RESPAWN.chance) this.spawnIn(index);
        });
    }

    /** A new monster on a free tile of the pit, with its rolls (server, at spawn). */
    private spawnIn(pit: number): OffMonster | undefined {
        const def = this.pits[pit];
        if (!def) return undefined;
        const tile = this.freeTileIn(def.area);
        if (!tile) return undefined;
        const monsterDef = OFF_MONSTERS[def.monster];
        const pool = this.pools.get(def.monster);
        if (!pool) return undefined;
        const monster = pool.acquire();
        const hp = rollMonsterHp(monsterDef.hitDice, rollDice);
        const [expMin, expMax] = monsterDef.exp;
        const exp = expMin + rollDice(1, expMax - expMin);
        const actionTimeMs = monsterDef.base.actionTimeMs + Phaser.Math.Between(0, OFF_COMBAT.actionTimeJitterMs);
        const bravery = monsterDef.base.bravery + Phaser.Math.Between(0, MONSTER_AI.braveryExtra - 1);
        monster.spawn(pit, tile, hp, exp, actionTimeMs, bravery);
        this.monsters.push(monster);
        return monster;
    }

    private freeTileIn(area: TileRect): TilePoint | undefined {
        for (let i = 0; i < SPAWN_TRIES; i++) {
            const x = Phaser.Math.Between(area.x, area.x + area.width - 1);
            const y = Phaser.Math.Between(area.y, area.y + area.height - 1);
            if (this.isFree(x, y)) return { x, y };
        }
        return undefined;
    }

    private aliveIn(pit: number): number {
        return this.monsters.filter((m) => m.pit === pit && m.isAlive).length;
    }

    /** Bodies still lying there count until they fade (server: the slot frees at DeleteNpc). */
    private deadIn(pit: number): number {
        return this.monsters.filter((m) => m.pit === pit && !m.isAlive).length;
    }
}
