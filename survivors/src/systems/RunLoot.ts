// Lo que la partida lleva de botín (Fase 21A): todo lo encontrado (para la pantalla final), la bolsa, lo encontrado que
// se ha equipado (por hueco) y lo cogido cuyo carta aún no se ha elegido. Se guarda con la partida (SaveStore) y, al
// terminar, CharacterStore.finishRun lo pasa al personaje; al morir sin Zem se pierde todo esto (Fase 21D).
import type { EquipSlotId } from '../data/items';
import type { OwnedItem } from '../data/loot';

/** What SaveStore keeps of the run's loot. */
export interface RunLootState {
    found: OwnedItem[];
    bag: OwnedItem[];
    equipped: Partial<Record<EquipSlotId, OwnedItem>>;
    pending: OwnedItem[];
}

export class RunLoot {
    /** Every item picked up this run, in order (end screen). */
    public readonly found: OwnedItem[] = [];
    public readonly bag: OwnedItem[] = [];
    /** Found items put on during the run, by slot (they replace the starting gear when the run ends). */
    public readonly equipped: Partial<Record<EquipSlotId, OwnedItem>> = {};
    /** Picked up, card not chosen yet (it opens as soon as no other card is showing). */
    private readonly pending: OwnedItem[] = [];

    public get hasPending(): boolean {
        return this.pending.length > 0;
    }

    public pickUp(item: OwnedItem): void {
        this.found.push(item);
        this.pending.push(item);
    }

    /** The next item waiting for its card (it stays waiting until resolved). */
    public nextPending(): OwnedItem | undefined {
        return this.pending[0];
    }

    public keep(item: OwnedItem): void {
        this.resolve(item);
        this.bag.push(item);
    }

    /** Puts it on: a found item that was in that slot goes to the bag (the starting gear stays on the character). */
    public equip(item: OwnedItem, slot: EquipSlotId): void {
        this.resolve(item);
        const previous = this.equipped[slot];
        if (previous) this.bag.push(previous);
        this.equipped[slot] = item;
    }

    public snapshot(): RunLootState {
        return { found: [...this.found], bag: [...this.bag], equipped: { ...this.equipped }, pending: [...this.pending] };
    }

    public restore(state: Readonly<RunLootState>): void {
        this.found.push(...state.found);
        this.bag.push(...state.bag);
        Object.assign(this.equipped, state.equipped);
        this.pending.push(...state.pending);
    }

    private resolve(item: OwnedItem): void {
        const index = this.pending.indexOf(item);
        if (index >= 0) this.pending.splice(index, 1);
    }
}
