// Baúl compartido (Fase 21D; propietario, 20-oct-2026): lo comparten los 4 personajes del dispositivo. Se abre desde
// Select Character (botón "Warehouse") y mueve objetos entre el inventario del personaje marcado y el baúl.
// En la Fase 24 se podrá ampliar. Hasta que exista la ciudad (Fase 23) no hay NPC: Howard llegará con ella.
import type { OwnedItem } from './loot';

/** Items it holds (owner, 20-oct-2026: 50). */
export const WAREHOUSE_CAPACITY = 50;

/** ?characters=demo: what the examples find in the warehouse (development only). */
export const WAREHOUSE_DEMO_ITEMS: readonly OwnedItem[] = [
    { id: 'longSword', attribute: 'sharp' },
    { id: 'plateMail' },
    { id: 'magicWandMS10' },
    { id: 'zemstone' },
];
