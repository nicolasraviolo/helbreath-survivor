// Helbreath Off (Fase Off-6B): lanzar magias, como el original.
// - 1–8 (`press`): el personaje se para y prepara la magia (animación Cast y el círculo en el suelo); tarda de 2 s a 1 s
//   según la MAG (OFF_CASTING.prepare). Luego queda lista hasta el clic: en un monstruo o en el suelo (`release`). El clic
//   derecho, moverse o morir la cancelan (`cancel`).
// - Antes de preparar se mira lo que el cliente original ya miraba: que sepas la magia, que tengas el maná, las manos
//   vacías (sin arma ni escudo: el servidor solo deja una varita, y Off no tiene) y 1 s desde la anterior.
// - Al soltarla, el servidor decide si sale (OffSpellRules.rollCastWorks). Si falla: se encoge, "Failed!" y no gasta
//   maná. Si sale: gasta el maná, vuela el efecto de Survivors (`look`, data/spells.ts) y al llegar hace el daño: una
//   tirada directa al objetivo y, con área, otra a cada monstruo del área (el del centro también). Cada monstruo puede
//   resistirla. El daño, la quemadura, el hielo y las muertes los pone la batalla (OffSpellHost.spellHit).
// - Off-6C: Heal y escudos te los lanzas a ti (cualquier clic; OffSpellHost.healPlayer / protect), Hold Person y
//   Paralyze paran al monstruo del clic si no la resiste (OffMonster.hold). Cada una con su efecto del original
//   (`castEffect`). Con el mando: pressSpell + la escena suelta la magia sola al objetivo (OffWorldScene).
// - Off-8B: Heal y escudos también van a tu mercenario (`ally` en release): clic sobre él, o con el mando el stick
//   derecho apuntándole (OffWorldScene decide; aquí solo se lanzan).
// - Off-8C: Berserk se lanza como Heal (a ti o a tu mercenario: `enrage`). La maga mercenaria usa otra copia de esta
//   clase con su propio `host` (OffMercenarySpells): sabe sus magias y no lleva arma, así que `knows` y `handsRefusal`
//   los pone el host en vez de mirar tu guardado.
// - Off-9A: lo que se golpea es un OffFoe (un monstruo o un Raider). Un Raider Mago usa otra copia con su host y lanza
//   a una persona (tú o tu mercenario) con `releaseAt`: el mismo preparar, fallar, maná y vuelo, y al llegar la
//   batalla pone el daño (como la magia del Cyclops).
import Phaser from 'phaser';
import { DEPTH_DAMAGE_NUMBERS, DEPTH_EFFECT_OFFSET, TILE_SIZE } from '../../config/gameConfig';
import { EFFECTS, effectAnimationKey, type EffectDef, type EffectKey } from '../../config/effects';
import type { SpellElement } from '../../data/elements';
import { CAST_SOUND, getSpell, type SpellBurst, type SpellDef } from '../../data/spells';
import { Effect } from '../../entities/Effect';
import { LightningArc } from '../../entities/LightningArc';
import { SpriteText } from '../../hb/SpriteText';
import { smoothSprite } from '../../hb/XbrPipeline';
import type { AudioSystem } from '../../systems/AudioSystem';
import { Pool, type Poolable } from '../../utils/Pool';
import { OFF_CAST_TEXT, OFF_CASTING, OFF_SPELLS, offPersonHoldMs, offSpellOnSelf, type OffSpellDef, type OffSpellDice, type OffSpellId } from '../data/offSpells';
import type { OffStats } from '../data/offCharacter';
import type { OffCharacter } from '../entities/OffCharacter';
import { foeBodyY, foeElement, foeMagicResist, type OffFoe } from './OffFoe';
import { OFF_SPELL_NAME_LOOK } from '../config/offSpellLook';
import { offSaveStore } from './OffSaveStore';
import { offElementMatch, offMagicHit, offPrepareMs, rollCastWorks, rollHeal, rollResisted, rollSpellDamage, type OffCaster } from './OffSpellRules';
import { directionTowards, type TileMover } from './TileMover';

/** The casting circle is drawn just under the character (config/effects.ts). */
const CASTING_CIRCLE_DEPTH = EFFECTS['fx.castingCircle'].depthOffset;

/** What the spells need from the battle. */
export interface OffSpellHost {
    readonly dead: boolean;
    /** Whether the caster knows that spell (the player: learnt at the shop). */
    knows(id: OffSpellId): boolean;
    /** Why its hands can't cast (a weapon or a shield held), or undefined. */
    handsRefusal(): string | undefined;
    readonly level: number;
    readonly stats: Readonly<OffStats>;
    /** Mana now; spending it. */
    readonly mana: number;
    spendMana(amount: number): void;
    /** Alive monsters (and, Off-9A, Raiders) within `range` tiles of a tile (a square, as the server's area). */
    monstersAround(tileX: number, tileY: number, range: number): OffFoe[];
    /** A spell's damage lands on a monster or a Raider (number, burn, ice, kill). */
    spellHit(monster: OffFoe, damage: number, element: SpellElement | undefined): void;
    /** The monster resisted the spell. */
    spellResisted(monster: OffFoe): void;
    /** Heal / Great Heal on the player (Off-6C). */
    healPlayer(amount: number): void;
    /** Defense Shield / Protection From Magic on the player; false when one is already on (no effect). */
    protect(spell: OffSpellId): boolean;
    /** Berserk on the caster for that long (Off-8C); false when it is already on (no effect). */
    enrage(durationMs: number): boolean;
    /** Hold Person / Paralyze took hold of a monster. */
    spellHeld(monster: OffFoe): void;
    /** "Failed!" over the player, and its flinch. */
    castFailed(): void;
    /** A line in the bottom-left list. */
    eventLine(line: string): void;
}

/** Someone else a support spell can go to (Off-8B: your mercenary). */
export interface OffSpellAlly {
    readonly x: number;
    readonly y: number;
    /** Heal / Great Heal on it. */
    heal(amount: number): void;
    /** A shield on it; false when it already has one (no effect). */
    protect(spell: OffSpellId): boolean;
    /** Berserk on it (Off-8C); false when it is already on. */
    enrage(durationMs: number): boolean;
}

/** Where the spell is: nothing, being prepared, or ready for the click. */
export type OffCastState = 'idle' | 'preparing' | 'ready';

/** A spell flying to its target (only its look: the damage is resolved once, on the first shot's arrival). */
class OffSpellShot implements Poolable {
    public poolIndex = -1;
    public x = 0;
    public y = 0;
    private vx = 0;
    private vy = 0;
    private leftMs = 0;
    private trailWaitMs = 0;
    private def: SpellDef | undefined;
    private readonly sprite: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene) {
        this.sprite = smoothSprite(scene.add.sprite(0, 0, '__DEFAULT')).setActive(false).setVisible(false);
    }

    /** Flies from (x, y) to (toX, toY) at the spell's speed; returns how long it takes, ms. */
    public launch(def: SpellDef, x: number, y: number, toX: number, toY: number): number {
        this.def = def;
        this.x = x;
        this.y = y;
        const dx = toX - x;
        const dy = toY - y;
        const distance = Math.hypot(dx, dy) || 1;
        this.leftMs = (distance / def.speed) * 1000;
        this.vx = dx / this.leftMs;
        this.vy = dy / this.leftMs;
        this.trailWaitMs = 0;
        const effect: EffectKey = def.flyEffect;
        const look: EffectDef = EFFECTS[effect];
        this.sprite.setBlendMode(look.additive ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
        this.sprite.setActive(true).setVisible(true).play(effectAnimationKey(effect, dx, dy));
        this.sync();
        return this.leftMs;
    }

    /** Moves it; false once it has arrived. `spark` leaves a trail spark (Lightning Arrow). */
    public update(deltaMs: number, spark: (key: EffectKey, x: number, y: number) => void): boolean {
        const step = Math.min(deltaMs, this.leftMs);
        this.x += this.vx * step;
        this.y += this.vy * step;
        this.leftMs -= step;
        const trail = this.def?.trail;
        if (trail) {
            this.trailWaitMs -= deltaMs;
            if (this.trailWaitMs <= 0) {
                this.trailWaitMs = trail.everyMs;
                spark(trail.effect, this.x + Phaser.Math.Between(-trail.spread, trail.spread), this.y + Phaser.Math.Between(-trail.spread, trail.spread));
            }
        }
        this.sync();
        if (this.leftMs > 0) return true;
        this.sprite.stop().setActive(false).setVisible(false);
        return false;
    }

    private sync(): void {
        this.sprite.setPosition(this.x, this.y).setDepth(this.y + DEPTH_EFFECT_OFFSET);
    }
}

/** Something to do a little later (an explosion's delay, the damage when the spell arrives). */
interface OffSpellTimer {
    leftMs: number;
    run: () => void;
}

export class OffSpells {
    public state: OffCastState = 'idle';
    /** The spell being prepared or ready. */
    public spell: OffSpellId | undefined;
    /** Spells cast and failed (development: `check`). */
    public casts = 0;
    public fails = 0;
    /** Off-9A: spells dropped by a hit (checks). */
    public interrupts = 0;
    private prepareLeftMs = 0;
    /** Time left before another spell may start (server: 1 s between spells). */
    private cooldownMs = 0;
    private readonly circle: Phaser.GameObjects.Sprite;
    /** The spell's name rising over the head (one at a time, as the original), and how long it has shown. */
    private readonly nameText: SpriteText;
    private nameShownMs = 0;
    private readonly shots: Pool<OffSpellShot>;
    private readonly effects: Pool<Effect>;
    private readonly lightnings: Pool<LightningArc>;
    private readonly timers: OffSpellTimer[] = [];

    constructor(
        scene: Phaser.Scene,
        private readonly host: OffSpellHost,
        private mover: TileMover,
        private character: OffCharacter,
        private readonly audio: AudioSystem,
    ) {
        this.circle = smoothSprite(scene.add.sprite(0, 0, '__DEFAULT')).setActive(false).setVisible(false);
        this.nameText = new SpriteText(scene, 0, 0, '', OFF_SPELL_NAME_LOOK.color, 'center', 'title');
        this.nameText.container.setDepth(DEPTH_DAMAGE_NUMBERS).setVisible(false);
        this.shots = new Pool(() => new OffSpellShot(scene));
        this.effects = new Pool(() => new Effect(scene));
        this.lightnings = new Pool(() => new LightningArc(scene));
    }

    /** Off-8C: casts from another body from now on (the Mage's spells move to the next Mage hired; pools are kept). */
    public attach(mover: TileMover, character: OffCharacter): void {
        this.cancel();
        this.nameText.container.setVisible(false);
        this.mover = mover;
        this.character = character;
    }

    /** True while a spell is being prepared or waits for its click. */
    public get busy(): boolean {
        return this.state !== 'idle';
    }

    /** Time to prepare a spell with this MAG. */
    public get prepareMs(): number {
        return offPrepareMs(this.host.stats.mag);
    }

    /** 1–8: starts preparing the spell on that key (or says why not). */
    public press(keyIndex: number): void {
        const id = offSaveStore.character.spellKeys[keyIndex];
        if (id !== undefined) this.pressSpell(id);
    }

    /** Starts preparing a spell (a key 1–8, or RT + a gamepad button), or says why not. True when it started. */
    public pressSpell(id: OffSpellId): boolean {
        if (this.host.dead) return false;
        const def = OFF_SPELLS[id];
        const refusal = this.refusal(id, def);
        if (refusal) {
            this.host.eventLine(refusal);
            return false;
        }
        this.spell = id;
        this.state = 'preparing';
        this.prepareLeftMs = this.prepareMs;
        this.mover.cancel();
        this.character.cast(this.mover.facing, this.prepareLeftMs);
        this.audio.play(CAST_SOUND);
        this.showName(def.name);
        if (this.circle.scene.anims.exists('fx.castingCircle')) {
            this.circle.setActive(true).setVisible(true).play('fx.castingCircle');
        }
        this.syncCircle();
        return true;
    }

    /** The spell being prepared or ready is cast on yourself (Heal, shields). */
    public get onSelf(): boolean {
        return this.spell !== undefined && offSpellOnSelf(OFF_SPELLS[this.spell]);
    }

    /**
     * Off-9A (the owner, 8-nov-2026): a blow or a spell that hurts the caster while it prepares the spell or holds it
     * ready drops it (no mana spent). True when there was one to drop.
     */
    public interrupt(): boolean {
        if (this.state === 'idle') return false;
        this.cancel();
        this.cooldownMs = OFF_CASTING.betweenCastsMs;
        this.interrupts++;
        return true;
    }

    /** Right click, moving or dying: the spell is dropped (no mana spent). */
    public cancel(): void {
        if (this.state === 'idle') return;
        this.state = 'idle';
        this.spell = undefined;
        this.circle.stop().setActive(false).setVisible(false);
        this.character.stopCasting();
    }

    /**
     * The click with a spell ready: at the monster (when the click was on one) or at the ground at (px, py). Returns
     * true when the click was taken by the spell (also while still preparing: the click does nothing else then).
     */
    public release(px: number, py: number, monster: OffFoe | undefined, ally?: OffSpellAlly): boolean {
        if (this.state === 'preparing') return true;
        if (this.state !== 'ready' || this.spell === undefined) return false;
        const id = this.spell;
        const def = OFF_SPELLS[id];
        this.cancel();
        // Mana or hands may have changed while it was ready (a potion, the Equipment screen).
        const refusal = this.refusal(id, def, true);
        if (refusal) {
            this.host.eventLine(refusal);
            return true;
        }
        if (offSpellOnSelf(def)) return this.castOnSelf(id, def, ally);
        const tileX = monster ? monster.mover.tileX : Math.floor(px / TILE_SIZE);
        const tileY = monster ? monster.mover.tileY : Math.floor(py / TILE_SIZE);
        const direction = directionTowards(this.mover.tileX, this.mover.tileY, tileX, tileY);
        if (direction !== undefined) this.mover.face(direction);
        this.cooldownMs = OFF_CASTING.betweenCastsMs;
        const caster = this.caster();
        if (!rollCastWorks(def.circle, caster)) {
            this.fails++;
            this.host.castFailed();
            this.host.eventLine(OFF_CAST_TEXT.failed);
            return true;
        }
        this.casts++;
        this.host.spendMana(def.mana);
        const hit = offMagicHit(def.circle, caster);
        if (def.kind === 'hold') {
            this.castHold(def, hit, monster);
            return true;
        }
        const toX = monster ? monster.x : px;
        const toY = monster ? foeBodyY(monster) : py;
        const arriveMs = this.showSpell(def, toX, toY);
        this.later(arriveMs, () => this.resolve(def, hit, monster, tileX, tileY));
        return true;
    }

    /**
     * Off-9A, a Raider Mage: the spell ready goes at a person's body at (toX, toY). The same checks, failing and mana as
     * `release`; on arrival `onArrive` gets the spell and its hit (the battle rolls the damage there). Self spells go
     * through `release` as always. False when nothing was cast (not ready, refused, failed).
     */
    public releaseAt(toX: number, toY: number, onArrive: (def: OffSpellDef, hit: number) => void): boolean {
        if (this.state !== 'ready' || this.spell === undefined) return false;
        const id = this.spell;
        const def = OFF_SPELLS[id];
        this.cancel();
        if (this.refusal(id, def, true)) return false;
        const direction = directionTowards(this.mover.tileX, this.mover.tileY, Math.floor(toX / TILE_SIZE), Math.floor(toY / TILE_SIZE));
        if (direction !== undefined) this.mover.face(direction);
        this.cooldownMs = OFF_CASTING.betweenCastsMs;
        const caster = this.caster();
        if (!rollCastWorks(def.circle, caster)) {
            this.fails++;
            this.host.castFailed();
            return false;
        }
        this.casts++;
        this.host.spendMana(def.mana);
        const hit = offMagicHit(def.circle, caster);
        if (def.kind === 'hold') {
            if (def.castEffect) this.effects.acquire().play(def.castEffect, toX, toY);
            onArrive(def, hit);
            return true;
        }
        this.later(this.showSpell(def, toX, toY), () => onArrive(def, hit));
        return true;
    }

    public update(deltaMs: number): void {
        this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
        if (this.state !== 'idle' && this.host.dead) this.cancel();
        if (this.state === 'preparing') {
            this.prepareLeftMs -= deltaMs;
            if (this.prepareLeftMs <= 0) this.state = 'ready';
        }
        if (this.circle.visible) this.syncCircle();
        if (this.nameText.container.visible) this.updateName(deltaMs);
        for (let i = this.timers.length - 1; i >= 0; i--) {
            const timer = this.timers[i];
            if (!timer) continue;
            timer.leftMs -= deltaMs;
            if (timer.leftMs <= 0) {
                this.timers.splice(i, 1);
                timer.run();
            }
        }
        const spark = (key: EffectKey, x: number, y: number) => this.effects.acquire().play(key, x, y);
        for (const shot of [...this.shots.active]) {
            if (!shot.update(deltaMs, spark)) this.shots.release(shot);
        }
        for (const effect of [...this.effects.active]) {
            if (!effect.update(deltaMs)) this.effects.release(effect);
        }
        for (const lightning of [...this.lightnings.active]) {
            if (!lightning.update(deltaMs)) this.lightnings.release(lightning);
        }
    }

    // ---- Helpers ----

    /** Why that spell can't start now, or undefined. `releasing`: the cooldown was already checked. */
    private refusal(id: OffSpellId, def: OffSpellDef, releasing = false): string | undefined {
        if (!this.host.knows(id)) return OFF_CAST_TEXT.unknown(def.name);
        const hands = this.host.handsRefusal();
        if (hands) return hands;
        if (this.host.mana < def.mana) return OFF_CAST_TEXT.noMana;
        if (!releasing && this.cooldownMs > 0) return OFF_CAST_TEXT.tooSoon;
        return undefined;
    }

    /** Heal, a shield or Berserk, on yourself or on `ally` (Off-8B). */
    private castOnSelf(id: OffSpellId, def: OffSpellDef, ally: OffSpellAlly | undefined): boolean {
        this.cooldownMs = OFF_CASTING.betweenCastsMs;
        if (!rollCastWorks(def.circle, this.caster())) {
            this.fails++;
            this.host.castFailed();
            this.host.eventLine(OFF_CAST_TEXT.failed);
            return true;
        }
        this.casts++;
        this.host.spendMana(def.mana);
        if (ally) {
            const direction = directionTowards(this.mover.tileX, this.mover.tileY, Math.floor(ally.x / TILE_SIZE), Math.floor(ally.y / TILE_SIZE));
            if (direction !== undefined) this.mover.face(direction);
        }
        const at = ally ?? this.character;
        if (def.castEffect) this.effects.acquire().play(def.castEffect, at.x, at.y);
        if (def.kind === 'heal' && def.direct) {
            if (ally) ally.heal(rollHeal(def.direct));
            else this.host.healPlayer(rollHeal(def.direct));
        } else if (def.kind === 'shield' && !(ally ? ally.protect(id) : this.host.protect(id))) {
            this.host.eventLine(OFF_CAST_TEXT.noEffect);
        } else if (def.kind === 'berserk') {
            const ms = (def.durationSec ?? 0) * 1000;
            if (!(ally ? ally.enrage(ms) : this.host.enrage(ms))) this.host.eventLine(OFF_CAST_TEXT.noEffect);
        }
        return true;
    }

    /** Hold Person / Paralyze on the clicked monster: it may resist; a held one, or the ground, has no effect. */
    private castHold(def: OffSpellDef, hit: number, monster: OffFoe | undefined): void {
        if (!monster?.isAlive) {
            this.host.eventLine(OFF_CAST_TEXT.noEffect);
            return;
        }
        if (def.castEffect) this.effects.acquire().play(def.castEffect, monster.x, monster.y);
        if (rollResisted(hit, foeMagicResist(monster))) {
            this.host.spellResisted(monster);
            return;
        }
        // Off-9A: on a Raider (a person) it lasts much less (OFF_HOLD.personMs).
        const ms = monster.kind === 'person' ? offPersonHoldMs(def.power ?? 0) : (def.durationSec ?? 0) * 1000;
        if (monster.hold(ms, def.power ?? 0)) this.host.spellHeld(monster);
        else this.host.eventLine(OFF_CAST_TEXT.noEffect);
    }

    private caster(): OffCaster {
        const stats = this.host.stats;
        return { level: this.host.level, int: stats.int, mag: stats.mag };
    }

    /** The spell arrives: direct roll on the target, then a roll on every monster of the area (the target too). */
    private resolve(def: OffSpellDef, hit: number, target: OffFoe | undefined, tileX: number, tileY: number): void {
        const centreX = target?.isAlive ? target.mover.tileX : tileX;
        const centreY = target?.isAlive ? target.mover.tileY : tileY;
        if (def.direct && target?.isAlive) this.strike(def, def.direct, hit, target);
        if (def.area && def.areaRange !== undefined) {
            for (const monster of this.host.monstersAround(centreX, centreY, def.areaRange)) this.strike(def, def.area, hit, monster);
        }
    }

    private strike(def: OffSpellDef, dice: OffSpellDice, hit: number, monster: OffFoe): void {
        if (!monster.isAlive) return;
        if (rollResisted(hit, foeMagicResist(monster))) {
            this.host.spellResisted(monster);
            return;
        }
        const damage = rollSpellDamage(dice, this.host.stats.mag, offElementMatch(def, foeElement(monster)));
        this.host.spellHit(monster, damage, def.element);
    }

    /**
     * A monster's spell (Off-7A, the Cyclops): drawn from its body to (toX, toY), and `onArrive` when it gets there.
     * `fromY` is its feet, like the character's.
     */
    public monsterCast(def: OffSpellDef, fromX: number, fromY: number, toX: number, toY: number, onArrive: () => void): void {
        this.later(this.showSpell(def, toX, toY, { x: fromX, y: fromY }), onArrive);
    }

    /** Draws the spell flying (or falling from the sky) to (toX, toY) from the character (or `from`); returns when it arrives, ms. */
    private showSpell(def: OffSpellDef, toX: number, toY: number, from?: { x: number; y: number }): number {
        const look = def.look ? getSpell(def.look) : undefined;
        if (!look) return 0;
        if (look.castSound) this.audio.play(look.castSound);
        if (look.aim === 'sky') {
            if (look.skyLightning) this.lightnings.acquire().strike(toX, toY);
            this.bursts(look.bursts, toX, toY);
            return look.skyImpactMs ?? 0;
        }
        const fromX = from?.x ?? this.character.x;
        const fromY = (from?.y ?? this.character.y) - look.originOffsetY;
        const offsets = look.aim === 'pattern' && look.pattern ? look.pattern : [[0, 0] as const];
        let arriveMs = 0;
        offsets.forEach(([dx, dy], index) => {
            const x = toX + dx;
            const y = toY + dy;
            const flyMs = this.shots.acquire().launch(look, fromX, fromY, x, y);
            if (index === 0) arriveMs = flyMs;
            this.later(flyMs, () => this.bursts(look.bursts, x, y));
        });
        return arriveMs;
    }

    private bursts(bursts: readonly SpellBurst[], x: number, y: number): void {
        for (const burst of bursts) {
            const play = () => {
                this.effects.acquire().play(burst.effect, x + burst.dx, y + burst.dy, burst.fallPx, burst.fallMs);
                if (burst.sound) this.audio.play(burst.sound);
            };
            if (burst.delayMs > 0) this.later(burst.delayMs, play);
            else play();
        }
    }

    /** "Name!" appears over the head and rises a little, as the original. */
    private showName(name: string): void {
        this.nameShownMs = 0;
        this.nameText.setText(`${name}${OFF_SPELL_NAME_LOOK.suffix}`);
        this.nameText.container.setVisible(true);
        this.updateName(0);
    }

    private updateName(deltaMs: number): void {
        const look = OFF_SPELL_NAME_LOOK;
        this.nameShownMs += deltaMs;
        if (this.nameShownMs >= look.durationMs) {
            this.nameText.container.setVisible(false);
            return;
        }
        const rise = Math.min(look.maxRisePx, Math.floor(this.nameShownMs / look.msPerRisePx));
        this.nameText.container.setPosition(Math.round(this.character.x), Math.round(this.character.y - look.startAboveFeetPx - rise));
    }

    private later(ms: number, run: () => void): void {
        if (ms <= 0) run();
        else this.timers.push({ leftMs: ms, run });
    }

    private syncCircle(): void {
        this.circle.setPosition(this.character.x, this.character.y).setDepth(this.character.y + CASTING_CIRCLE_DEPTH);
    }
}
