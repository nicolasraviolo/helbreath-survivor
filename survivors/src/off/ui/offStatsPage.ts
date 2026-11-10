// Helbreath Off, Fase Off-12C: la pestaña Stats de la ventana del personaje (sustituye a la ventana Character de
// Survivors en su modo de Off). Medidas en off/config/offBag.ts (OFF_STATS_PAGE), textos en off/data/offBag.ts.
// - Izquierda: los puntos por repartir y los cinco stats con − / +; debajo, para qué sirve el stat enfocado; abajo,
//   Reset y Confirm. Lo repartido no se gasta hasta Confirm (en verde con ▲); cambiar de pestaña lo conserva y cerrar
//   la ventana lo devuelve, como el original.
// - Derecha: vida, maná y estamina máximos y Hit Ratio con lo repartido ("(now …)" = lo de ahora), y nivel,
//   experiencia, lo que falta para el siguiente y Enemy Kills.
// - Teclado y mando: ↑ ↓ entre stats (desde el primero sube a las pestañas; desde el último baja a los botones),
//   ← → quitan o ponen un punto, A / Enter pone uno. Ratón: − / + en cada fila.
import Phaser from 'phaser';
import { OFF_BAG_WINDOW, OFF_STATS_PAGE } from '../config/offBag';
import { OFF_THEME_INK, OFF_THEME_SIZE, OFF_THEME_TEXT } from '../config/offTheme';
import { OFF_STATS_TEXT } from '../data/offBag';
import { OFF_DEX_HELP, OFF_STAT_HELP, OFF_STAT_IDS, OFF_STAT_MAX, offMaxHp, offMaxMana, offMaxStamina, type OffStatId, type OffStats } from '../data/offCharacter';
import { OFF_LEVEL, offExpForLevel } from '../data/offLevel';
import type { OffBattle } from '../systems/OffBattle';
import { offPlayerHitRatio } from '../systems/OffCombatRules';
import { offSaveStore } from '../systems/OffSaveStore';
import type { InputSystem } from '../../systems/InputSystem';
import {
    offButton, offDivider, offFitText, offFrame, offLabel, offStatRow, offStepperRow, offText,
    type OffButton, type OffStatRow, type OffStepperRow, type OffTrend,
} from './offUi';
import type { OffWindowPage } from './offWindowPage';

const S = OFF_THEME_SIZE;
const INK = OFF_THEME_INK;
const W = OFF_BAG_WINDOW;
const P = OFF_STATS_PAGE;

type Focus = { kind: 'stat'; i: number } | { kind: 'button'; id: 'reset' | 'confirm' };

type DetailId = 'health' | 'mana' | 'stamina' | 'hitRatio';

export class OffStatsPage implements OffWindowPage {
    private readonly rows: OffStepperRow[] = [];
    private readonly details = new Map<DetailId, OffStatRow>();
    private readonly progress: OffStatRow[] = [];
    private readonly pointsText: Phaser.GameObjects.Text;
    private readonly helpText: Phaser.GameObjects.Text;
    private readonly resetButton: OffButton;
    private readonly confirmButton: OffButton;
    private focus: Focus | undefined;
    private shownProgress = '';
    /** The help may not grow over Reset / Confirm. */
    private helpRoom = { width: 0, height: 0 };

    /**
     * `added` = points spread and not confirmed yet; the window keeps the same object between its tabs (and drops it on
     * closing). `say` writes the window's message line.
     */
    constructor(
        scene: Phaser.Scene,
        private readonly battle: OffBattle,
        private readonly added: OffStats,
        private readonly say: (line: string) => void,
    ) {
        const top = W.top;
        const h = W.bottom - top;
        const ax = P.x;
        const aw = P.attributesW;
        offFrame(scene, ax, top, aw, h);
        const inX = ax + S.padding;
        const inW = aw - S.padding * 2;
        offLabel(scene, inX, top + S.padding, OFF_STATS_TEXT.attributesLabel);
        const pointsLabel = offLabel(scene, inX + inW, top + S.padding, OFF_STATS_TEXT.pointsLabel).setOrigin(1, 0);
        this.pointsText = offText(scene, pointsLabel.x - pointsLabel.width - S.rowGap, top + S.padding + pointsLabel.height, '', 'number', {
            color: INK.gold, originX: 1, originY: 1,
        });
        let y = top + S.padding + P.labelGap;
        OFF_STAT_IDS.forEach((id, i) => {
            this.rows.push(offStepperRow(scene, inX, y, inW, OFF_STATS_TEXT.names[id], () => this.change(id, -1, i), () => this.change(id, 1, i), () => this.setFocus({ kind: 'stat', i })));
            y += S.stepperRowHeight + P.rowGap;
        });
        // Buttons at the bottom: Reset on the left, Confirm (gold) on the right.
        const by = top + h - S.padding - S.buttonHeight;
        this.resetButton = offButton(scene, inX, by, OFF_STATS_TEXT.reset, 'normal', () => this.reset());
        this.confirmButton = offButton(scene, inX + inW - S.buttonWidth, by, OFF_STATS_TEXT.confirm, 'main', () => this.confirm());
        // The focused stat's help, between the rows and the buttons.
        this.helpText = offText(scene, inX, y + P.helpGap, '', 'body', { color: INK.dim });
        this.helpText.setWordWrapWidth(inW);
        this.helpRoom = { width: inW, height: by - P.helpGap - this.helpText.y };

        // Details panel.
        const dx = ax + aw + P.gap;
        const dw = W.x + W.w - W.pad - dx;
        offFrame(scene, dx, top, dw, h);
        const dInX = dx + S.padding;
        const dInW = dw - S.padding * 2;
        offLabel(scene, dInX, top + S.padding, OFF_STATS_TEXT.detailsLabel);
        let ry = top + S.padding + P.labelGap;
        const ids: DetailId[] = ['health', 'mana', 'stamina', 'hitRatio'];
        for (const id of ids) {
            this.details.set(id, offStatRow(scene, dInX, ry, dInW, OFF_STATS_TEXT[id], ''));
            ry += S.rowHeight;
        }
        ry += P.dividerGap;
        offDivider(scene, dInX, ry, dInW);
        ry += P.dividerGap;
        for (const label of [OFF_STATS_TEXT.level, OFF_STATS_TEXT.experience, OFF_STATS_TEXT.nextLevel, OFF_STATS_TEXT.enemyKills]) {
            this.progress.push(offStatRow(scene, dInX, ry, dInW, label, ''));
            ry += S.rowHeight;
        }
        this.redraw();
    }

    // ---------------------------------------------------------------- values

    private get points(): number {
        return this.battle.points - this.spent;
    }

    private get spent(): number {
        return OFF_STAT_IDS.reduce((sum, id) => sum + this.added[id], 0);
    }

    private shown(): OffStats {
        const base = this.battle.stats;
        const out = { ...base };
        for (const id of OFF_STAT_IDS) out[id] = base[id] + this.added[id];
        return out;
    }

    /** One point more or less on a stat (− only takes back points not confirmed yet). */
    public change(id: OffStatId, step: 1 | -1, row?: number): void {
        if (row !== undefined) this.setFocus({ kind: 'stat', i: row });
        // Can't go up: say why (the + is off, but A / → still try).
        if (step > 0 && this.shown()[id] >= OFF_STAT_MAX) {
            this.say(OFF_STATS_TEXT.maxed(OFF_STATS_TEXT.names[id], OFF_STAT_MAX));
            return;
        }
        if (step > 0 && this.points <= 0) {
            this.say(OFF_STATS_TEXT.noPointsLeft);
            return;
        }
        if (step < 0 && this.added[id] <= 0) return;
        this.added[id] += step;
        this.say('');
        this.redraw();
    }

    public reset(): void {
        for (const id of OFF_STAT_IDS) this.added[id] = 0;
        this.say('');
        this.redraw();
    }

    public confirm(): void {
        const spent = this.spent;
        if (spent <= 0) return;
        this.battle.assignPoints({ ...this.added });
        for (const id of OFF_STAT_IDS) this.added[id] = 0;
        this.say(OFF_STATS_TEXT.confirmed(spent));
        this.redraw();
    }

    private redraw(): void {
        const stats = this.shown();
        const base = this.battle.stats;
        const points = this.points;
        this.pointsText.setText(String(points));
        offFitText(this.pointsText, 'number', P.attributesW / 3);
        OFF_STAT_IDS.forEach((id, i) => {
            const row = this.rows[i];
            if (!row) return;
            row.setValue(String(stats[id]), this.added[id] > 0);
            row.setMinusEnabled(this.added[id] > 0);
            row.setPlusEnabled(points > 0 && stats[id] < OFF_STAT_MAX);
        });
        const pending = this.spent > 0;
        this.resetButton.setEnabled(pending);
        this.confirmButton.setEnabled(pending);
        // Nothing to Reset or Confirm: the ring does not stay on a dead button.
        if (!pending && this.focus?.kind === 'button') this.setFocus({ kind: 'stat', i: OFF_STAT_IDS.length - 1 });
        const level = this.battle.level;
        const now = { ...base, level };
        const next = { ...stats, level };
        const hitting = this.battle.gearEffects.hitting ?? 0;
        this.setDetail('health', offMaxHp(next), offMaxHp(now));
        this.setDetail('mana', offMaxMana(next), offMaxMana(now));
        this.setDetail('stamina', offMaxStamina(next), offMaxStamina(now));
        this.setDetail('hitRatio', offPlayerHitRatio(next.dex, hitting), offPlayerHitRatio(now.dex, hitting));
        this.drawHelp();
        this.update();
    }

    private setDetail(id: DetailId, value: number, now: number): void {
        const trend: OffTrend = value > now ? 'better' : 'same';
        this.details.get(id)?.setValue(String(value), undefined, value !== now ? OFF_STATS_TEXT.now(now) : undefined, trend);
    }

    private drawHelp(): void {
        const f = this.focus;
        const id = f?.kind === 'stat' ? OFF_STAT_IDS[f.i] : undefined;
        const lines: string[] = [];
        if (this.spent > 0) lines.push(OFF_STATS_TEXT.pending);
        else if (this.points <= 0) lines.push(OFF_STATS_TEXT.noPoints(OFF_LEVEL.pointsPerLevel));
        if (id) lines.push(id === 'dex' ? OFF_DEX_HELP(offPlayerHitRatio(this.shown().dex, this.battle.gearEffects.hitting ?? 0)) : OFF_STAT_HELP[id]);
        this.helpText.setText(lines.join('\n'));
        // Shrinks if it would reach the buttons (reported by offLayoutIssues if it still can't).
        offFitText(this.helpText, 'body', this.helpRoom.width);
        let size = OFF_THEME_TEXT.body.size;
        while (this.helpText.height > this.helpRoom.height && size > OFF_THEME_TEXT.body.minSize) {
            size -= 1;
            this.helpText.setFontSize(size);
        }
    }

    /** Level, experience and kills: they can change while the window is open (the world goes on). */
    public update(): void {
        const saved = offSaveStore.character;
        const level = this.battle.level;
        const nextExp = level >= OFF_LEVEL.max ? undefined : offExpForLevel(level + 1);
        const values = [
            String(level),
            saved.exp.toLocaleString('en-US'),
            nextExp === undefined ? OFF_STATS_TEXT.maxLevel : nextExp.toLocaleString('en-US'),
            saved.enemyKills.toLocaleString('en-US'),
        ];
        const key = values.join('|');
        if (key === this.shownProgress) return;
        this.shownProgress = key;
        values.forEach((v, i) => this.progress[i]?.setValue(v));
    }

    // ---------------------------------------------------------------- focus

    private control(focus: Focus | undefined): { setFocused(f: boolean): void; press(): void } | undefined {
        if (!focus) return undefined;
        if (focus.kind === 'stat') return this.rows[focus.i];
        return focus.id === 'reset' ? this.resetButton : this.confirmButton;
    }

    private setFocus(focus: Focus | undefined): void {
        this.control(this.focus)?.setFocused(false);
        this.focus = focus;
        this.control(focus)?.setFocused(true);
        this.drawHelp();
    }

    public focusFirst(): void {
        this.setFocus({ kind: 'stat', i: 0 });
    }

    public blur(): void {
        this.setFocus(undefined);
    }

    public move(dx: number, dy: number): boolean {
        const f = this.focus;
        if (!f) {
            this.focusFirst();
            return true;
        }
        const last = OFF_STAT_IDS.length - 1;
        if (f.kind === 'stat') {
            const id = OFF_STAT_IDS[f.i];
            if (dx !== 0 && id) this.change(id, dx > 0 ? 1 : -1);
            else if (dy < 0 && f.i === 0) return false;
            else if (dy > 0 && f.i === last) {
                if (this.spent > 0) this.setFocus({ kind: 'button', id: 'confirm' });
            }
            else if (dy !== 0) this.setFocus({ kind: 'stat', i: f.i + dy });
            return true;
        }
        if (dx > 0 && f.id === 'reset') this.setFocus({ kind: 'button', id: 'confirm' });
        else if (dx < 0 && f.id === 'confirm') this.setFocus({ kind: 'button', id: 'reset' });
        else if (dy < 0) this.setFocus({ kind: 'stat', i: last });
        return true;
    }

    public pressFocused(): void {
        const f = this.focus;
        if (f?.kind === 'stat') {
            const id = OFF_STAT_IDS[f.i];
            if (id) this.change(id, 1);
        } else this.control(f)?.press();
    }

    public handleInput(_input: InputSystem): boolean {
        return false;
    }

    public focusName(): string {
        const f = this.focus;
        if (!f) return '';
        return f.kind === 'stat' ? `stat ${OFF_STAT_IDS[f.i] ?? ''}` : `button ${f.id}`;
    }

    public debugState(): Record<string, unknown> {
        const stats = this.shown();
        return {
            points: this.points,
            stats: OFF_STAT_IDS.map((id) => `${id} ${stats[id]}${this.added[id] > 0 ? ` (+${this.added[id]})` : ''}`).join(' · '),
            saved: { ...offSaveStore.character.stats, points: offSaveStore.character.points },
            help: this.helpText.text,
        };
    }
}
