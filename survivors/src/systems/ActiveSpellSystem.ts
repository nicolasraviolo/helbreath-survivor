// Hechizo activo del Mago (Fase 19B): maná y lanzamiento. Lo pide el jugador con el mismo botón que el Critical
// Strike del Guerrero (Espacio, R2 del mando o el botón táctil). Cae donde apunta, o sobre el objetivo automático; sin
// nada a su alcance no sale y no gasta nada.
// Fase 26A (propietario, 22-oct-2026): sin recarga; cada lanzamiento **gasta maná** (el coste de cada hechizo en
// data/activeSpells.ts, menos el Mana Save de la varita). El maná vive aquí porque solo lo usa el Spell 2: se rellena
// solo, de golpe cada 20 s como en el original (CharacterStats.manaRegenPerSecond × MANA_REGEN_INTERVAL_MS, más con la
// ropa de MP Recovery; systems/RegenTicker.ts) y con la Blue Potion.
// Desde el 20D es el que lleve en el hueco Spell 2: Meteor Strike (meteorito), una ráfaga (Energy / Mass Fire Strike)
// una lluvia de hielo (Ice / Mass Ice Strike, Fase 26D) o un hechizo en línea (Blizzard, Earth / Bloody Shock Wave, 26E).
// Fase 30B: Ice Storm, una tormenta de hielo que se queda unos segundos (systems/IceStormField.ts).
// El meteorito y el Blizzard se descargan al empezar la partida (ON_DEMAND_SPRITES): hasta que llegan no se lanzan.
// Fase 26B: en el móvil, arrastrar el botón le da una dirección (`cast(level, direction)`): cae a `stickShare` de su
// alcance hacia allí, haya o no monstruos, por encima del stick de apuntar y del apuntado automático.
// Con `infinite` (truco ?debug=crits o la tecla H) no gasta maná: para probarlo sin esperar.
import {
    ACTIVE_SPELLS,
    activeSpellManaCost,
    activeSpellPowerMultiplier,
    activeSpellSprite,
    type ActiveSpellDef,
    type ActiveSpellId,
} from '../data/activeSpells';
import { MANA_REGEN_INTERVAL_MS } from '../data/stats';
import { RegenTicker } from './RegenTicker';
import type { WeaponSystem } from './WeaponSystem';

export class ActiveSpellSystem {
    public readonly def: ActiveSpellDef;
    /** Mana now; starts full (the first update fills it to the maximum). */
    private manaNow = Number.POSITIVE_INFINITY;
    /** Maximum the last time it was updated: when it grows (a new Power, a Mag card), the gain is added to the mana. */
    private lastMax = 0;
    private castCount = 0;
    /** Debug: casting costs nothing. */
    public infinite = false;
    /** False until its sprite is downloaded (only Meteor Strike and Blizzard have one of their own). */
    public loaded: boolean;
    /** Share of the cost the wand in hand saves (Equipment.manaSave). */
    public manaSave = 0;
    /** Batches of the mana refill, every MANA_REGEN_INTERVAL_MS as in the original. */
    private readonly regenTicker = new RegenTicker(MANA_REGEN_INTERVAL_MS);

    constructor(private readonly weapons: WeaponSystem, public readonly id: ActiveSpellId) {
        this.def = ACTIVE_SPELLS[id];
        this.loaded = activeSpellSprite(this.def) === undefined;
    }

    /** Mana each cast costs now (with the wand's Mana Save). */
    public get cost(): number {
        return activeSpellManaCost(this.def, this.manaSave);
    }

    public get mana(): number {
        return Math.min(this.manaNow, this.lastMax);
    }

    /** Enough mana for one cast (and its sprite downloaded). */
    public get ready(): boolean {
        return this.loaded && (this.infinite || this.mana >= this.cost);
    }

    /** Mana still missing for the next cast (0 = ready), for the HUD orb. */
    public get manaMissing(): number {
        return this.infinite ? 0 : Math.max(0, Math.ceil(this.cost - this.mana));
    }

    /** Casts so far this run: the HUD shows the icon pressed when it changes. */
    public get casts(): number {
        return this.castCount;
    }

    /** Continue (saved run): the mana it had (saves from before Fase 26A have none and start full). */
    public restore(mana: number | undefined): void {
        this.manaNow = mana ?? Number.POSITIVE_INFINITY;
    }

    /** Mana refilled by a potion or a totem, up to the maximum. */
    public addMana(amount: number): void {
        this.manaNow = Math.min(this.lastMax, this.mana + amount);
    }

    /** Debug ?debug=nomana: empty bar, to watch it refill. */
    public empty(): void {
        this.manaNow = 0;
    }

    /**
     * Refills `regenPerSecond` per second up to `maxMana`, in one batch every MANA_REGEN_INTERVAL_MS; a bigger maximum
     * adds its gain to the mana now. Returns the mana the batch gave (0 most frames), for the "MP has been increased" message.
     */
    public update(deltaMs: number, maxMana: number, regenPerSecond: number): number {
        if (maxMana > this.lastMax && this.lastMax > 0 && Number.isFinite(this.manaNow)) this.manaNow += maxMana - this.lastMax;
        this.lastMax = maxMana;
        const before = Math.min(this.manaNow, maxMana);
        const batch = this.regenTicker.update(deltaMs, regenPerSecond, maxMana - before);
        this.manaNow = Math.min(maxMana, this.manaNow + batch);
        return Math.floor(this.manaNow - before);
    }

    /** Where it lands cast from (x, y) towards a unit `direction` (Fase 26B, dragging the touch button). */
    public aimedPoint(x: number, y: number, direction: Readonly<{ x: number; y: number }>): { x: number; y: number } {
        const distance = this.def.range * this.def.stickShare;
        return { x: x + direction.x * distance, y: y + direction.y * distance };
    }

    /**
     * Casts it now if there is mana enough and somewhere to land: towards `direction` (from (x, y)) if given, else where the
     * player aims or the automatic target. Returns true if it went off.
     */
    public cast(level: number, from?: { x: number; y: number; direction: Readonly<{ x: number; y: number }> }): boolean {
        if (!this.ready) return false;
        const target = from
            ? this.aimedPoint(from.x, from.y, from.direction)
            : this.weapons.activeSpellTarget(this.def.range, this.def.stickShare);
        if (!target) return false;
        const power = activeSpellPowerMultiplier(level);
        if (this.def.kind === 'meteor') this.weapons.castMeteor(this.def, power, target.x, target.y);
        else if (this.def.kind === 'iceShards') this.weapons.castIceShards(this.def, power, target.x, target.y);
        else if (this.def.kind === 'line') this.weapons.castLine(this.def, power, target.x, target.y);
        else if (this.def.kind === 'storm') this.weapons.castStorm(this.def, power, target.x, target.y);
        else this.weapons.castBarrage(this.def, power, target.x, target.y);
        if (!this.infinite) this.manaNow = this.mana - this.cost;
        this.castCount++;
        return true;
    }
}
