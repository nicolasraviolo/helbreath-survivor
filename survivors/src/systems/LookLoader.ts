// Descarga bajo demanda de las piezas de personaje que no se cargan al empezar (Fase 17B, ON_DEMAND_SPRITES):
// pieles morena y oscura y la ropa del otro sexo. CharacterSprite pide lo que dibuja y, mientras no llega, esa capa
// no se ve. Al empezar una partida se pide lo que lleva puesto (desde la Fase 20C las cartas ya no cambian el equipo).
// Es único para todo el juego: lo ya descargado sirve para todas las escenas.
import type Phaser from 'phaser';
import { ON_DEMAND_SPRITES, type SpriteKey } from '../config/assetManifest';
import { BODY_SPRITES, gearForGender, HAIR_SPRITE, UNDERWEAR_SPRITE, type CharacterLook } from '../data/appearance';
import type { CharacterDef } from '../data/characters';
import { equipmentLook, type SavedEquipment } from '../data/items';
import { getSheetKey } from '../hb/HBSprite';
import { loadSprite } from './AssetStreamer';

class LookLoaderImpl {
    private readonly inFlight = new Map<SpriteKey, Promise<void>>();

    /** True when the sprite's textures exist (always true for sprites loaded upfront). */
    public isReady(scene: Phaser.Scene, key: SpriteKey): boolean {
        return scene.sys.game.textures.exists(getSheetKey(key, 0));
    }

    /** Downloads the missing ones; resolves when all are ready (a failed one is logged and skipped). */
    public async ensure(scene: Phaser.Scene, keys: Iterable<SpriteKey>): Promise<void> {
        const pending: Array<Promise<void>> = [];
        for (const key of new Set(keys)) {
            if (!ON_DEMAND_SPRITES.has(key) || this.isReady(scene, key)) continue;
            let promise = this.inFlight.get(key);
            if (!promise) {
                promise = loadSprite(scene, key)
                    .catch((error: unknown) => console.warn(`LookLoader: could not load ${key}`, error))
                    .finally(() => this.inFlight.delete(key));
                this.inFlight.set(key, promise);
            }
            pending.push(promise);
        }
        await Promise.all(pending);
    }
}

/** Every sprite a character of that class and look wears (starting look and equipment). */
export function runSprites(def: CharacterDef, look: CharacterLook, equipment: Readonly<SavedEquipment> = {}): SpriteKey[] {
    const gear: SpriteKey[] = Object.values(def.appearance).map((layer) => layer.sprite);
    for (const [, layer] of equipmentLook(equipment)) gear.push(layer.sprite);
    return [
        BODY_SPRITES[look.gender][look.skin] ?? BODY_SPRITES[look.gender][0] ?? 'player.body.wm',
        HAIR_SPRITE[look.gender],
        UNDERWEAR_SPRITE[look.gender],
        ...gear.map((sprite) => gearForGender(sprite, look.gender)),
    ];
}

export const lookLoader = new LookLoaderImpl();
