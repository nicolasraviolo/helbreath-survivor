// Helbreath Off (Fase Off-4A): los objetos y el oro tirados por el suelo del mundo.
// - Al morir un monstruo, lo que suelta (OffLootRoller) queda en su casilla, con el sonido de soltar objetos.
// - Se recoge al pisar la casilla (decisión del propietario, 7-nov-2026: sin agacharse como el original). Se intenta
//   una vez al llegar a cada casilla: lo que no cabe (bolsa llena) se queda en el suelo hasta que vuelvas a pisarla.
// - Caduca a los 3 minutos (OFF_LOOT.groundLifeMs).
// Quien lo usa (OffBattle) decide qué pasa al recoger: `take` dice si ha cabido y, si no, por qué (bolsa llena o
// límite de pociones, Off-4B); se avisa una sola vez por casilla (`onLeft`).
// Off-4B: lo que tiras desde el inventario cae en tu casilla; como ya estás en ella, no se recoge hasta que vuelvas.
import type Phaser from 'phaser';
import { Pool } from '../../utils/Pool';
import { OffGroundItem, type OffGroundContent } from '../entities/OffGroundItem';
import { OFF_GOLD_PICTURE } from '../data/offGoods';
import { offBagItemPicture } from '../data/offItems';
import { offSaveStore, type OffEquipResult } from './OffSaveStore';
import type { OffKillLoot } from './OffLootRoller';
import type { TilePoint } from './TileMover';

export class OffGroundItems {
    private readonly pool: Pool<OffGroundItem>;
    /** Tile the player stood on last frame (NaN = none): picking up happens on arriving at a new one. */
    private readonly lastTile: TilePoint = { x: Number.NaN, y: Number.NaN };

    constructor(
        scene: Phaser.Scene,
        private readonly take: (content: OffGroundContent) => OffEquipResult,
        private readonly onLeft: (reason: OffEquipResult) => void,
    ) {
        this.pool = new Pool(() => new OffGroundItem(scene));
    }

    /** Everything on the ground now. */
    public get items(): readonly OffGroundItem[] {
        return this.pool.active;
    }

    /** A monster's loot on its tile. True if anything was dropped. */
    public dropLoot(loot: OffKillLoot, tileX: number, tileY: number): boolean {
        let dropped = false;
        if (loot.gold > 0) {
            this.drop({ gold: loot.gold }, tileX, tileY);
            dropped = true;
        }
        for (const item of loot.items) {
            this.drop({ item }, tileX, tileY);
            dropped = true;
        }
        return dropped;
    }

    public drop(content: OffGroundContent, tileX: number, tileY: number): void {
        const picture = 'gold' in content ? OFF_GOLD_PICTURE : offBagItemPicture(content.item, offSaveStore.character.look.gender);
        if (!picture) return;
        const sharing = this.pool.active.filter((g) => g.tileX === tileX && g.tileY === tileY).length;
        this.pool.acquire().drop(content, tileX, tileY, picture, sharing);
    }

    /** Ages the items; on arriving at a new tile (`player`, undefined while dead), picks up what lies there. */
    public update(deltaMs: number, player: TilePoint | undefined): void {
        for (const item of [...this.pool.active]) {
            if (!item.update(deltaMs)) this.remove(item);
        }
        if (!player) {
            this.lastTile.x = Number.NaN;
            return;
        }
        if (player.x === this.lastTile.x && player.y === this.lastTile.y) return;
        this.lastTile.x = player.x;
        this.lastTile.y = player.y;
        this.pickUpAt(player.x, player.y);
    }

    /** Takes what lies on that tile: gold first, then the items in the order they fell. */
    public pickUpAt(x: number, y: number): void {
        const here = this.pool.active.filter((g) => g.tileX === x && g.tileY === y)
            .sort((a, b) => Number('gold' in b.content) - Number('gold' in a.content));
        let left: OffEquipResult | undefined;
        for (const item of here) {
            const result = this.take(item.content);
            if (result === 'ok') this.remove(item);
            // A full bag says more than the potion limit: it is the one reported.
            else if (left !== 'bagFull') left = result;
        }
        if (left) this.onLeft(left);
    }

    private remove(item: OffGroundItem): void {
        item.deactivate();
        this.pool.release(item);
    }
}
