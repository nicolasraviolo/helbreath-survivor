// Helbreath Off (Fase Off-5B): la tienda y el herrero de las ciudades. Se abre al pisar su puerta; el mundo sigue
// debajo (en la ciudad no hay monstruos) y el HUD se esconde, como con Equipment.
// - Dos pestañas: **Buy** (lo que vende ese sitio, off/data/offStore.ts) y **Sell** (todo lo de tu bolsa, a mitad de
//   precio; lo que llevas puesto no se vende).
// - Lista a la izquierda (con secciones en el herrero), y a la derecha el cuadro de stats del objeto marcado
//   (off/ui/offItemBox.ts, comparado con lo puesto), tu oro, el resultado de la última compra y los botones.
// - Un clic marca; doble clic, Enter o A compran o venden; el botón Buy / Sell también. Así un clic sin querer no gasta
//   oro. Un precio que no puedes pagar sale en rojo, y lo que aún no puedes ponerte (Str o Level), con el nombre en rojo.
// - Tab o LB / RB cambian de pestaña; Esc, B o el botón Close cierran. La rueda del ratón mueve la lista.
// Fase Off-6A: la tienda tiene una tercera pestaña, **Magic** (la tienda de magia, de momento aquí): las 14 magias por
// círculos (off/data/offSpells.ts). Learn la aprende (INT mínima + oro) y va sola a la primera tecla 1–8 libre. Una
// magia que aún no puedes aprender por INT sale con el nombre en rojo; una que ya sabes, con "Learned" en vez de precio.
import Phaser from 'phaser';
import { itemPackTexture } from '../../config/equipment';
import { GAME_WIDTH } from '../../config/gameConfig';
import { CHARACTER_INFO_INPUT_DELAY_MS } from '../../config/characterInfo';
import { AudioSystem } from '../../systems/AudioSystem';
import { Action, InputSystem } from '../../systems/InputSystem';
import { lookLoader } from '../../systems/LookLoader';
import { playAreaBottom } from '../../ui/hudLayout';
import {
    OFF_STORE_BUTTON_STYLE, OFF_STORE_GOLD_STYLE, OFF_STORE_HEADER_STYLE, OFF_STORE_LIST, OFF_STORE_MESSAGE_STYLE, OFF_STORE_PANEL,
    OFF_STORE_ROW_STYLE, OFF_STORE_SIDE, OFF_STORE_SMALL_STYLE, OFF_STORE_TABS, OFF_STORE_TITLE_STYLE, OFF_STORE_UNMET_COLOR,
} from '../config/offStore';
import { isOffItemId, OFF_ITEMS, offBagItemName, offBagItemPicture, offNeedsText, offWearCheck, type OffBagItemId } from '../data/offItems';
import { OFF_STORE_STOCK, OFF_STORE_TEXT, offPrice, offSellPrice, type OffStoreKind } from '../data/offStore';
import { offSaveStore, type OffTradeResult } from '../systems/OffSaveStore';
import { OFF_SPELL_IDS, OFF_SPELLS, offCircleTitle, type OffLearnResult, type OffSpellId } from '../data/offSpells';
import { drawOffItemBox, offItemBoxLines, offSpellBoxLines } from '../ui/offItemBox';

export const OFF_STORE_SCENE_KEY = 'OffStore';

export interface OffStoreSceneData {
    kind: OffStoreKind;
    /** Something bought or sold: the world dresses the character again if needed. */
    onChange: () => void;
    onClose: () => void;
    /** Tab open at first (Off-6A: 'magic' for the magic shop). */
    tab?: OffStoreTab;
}

export type OffStoreTab = 'buy' | 'sell' | 'magic';

/** A line of the list: a section title, an item (to buy, or the bag cell to sell) or a spell (Off-6A). */
type Row = { kind: 'section'; title: string } | { kind: 'item'; id: OffBagItemId; bagIndex?: number } | { kind: 'spell'; id: OffSpellId };

/** The tabs of each store: only the shop has the magic shop (owner, 7-nov-2026). */
const STORE_TABS: Record<OffStoreKind, readonly OffStoreTab[]> = { shop: ['buy', 'sell', 'magic'], smith: ['buy', 'sell'] };

type ButtonId = 'act' | 'close';

interface RowView {
    objects: Phaser.GameObjects.GameObject[];
}

export class OffStoreScene extends Phaser.Scene {
    private params!: OffStoreSceneData;
    private inputSystem!: InputSystem;
    private audio!: AudioSystem;
    private openedAt = 0;
    private tab: OffStoreTab = 'buy';
    private rows: Row[] = [];
    /** Index in `rows` of the marked item (never a section), or -1 with nothing to mark. */
    private marked = -1;
    /** First row shown. */
    private scroll = 0;
    private visibleRows = 0;
    private rowViews: RowView[] = [];
    private listArea = { x: 0, y: 0, width: 0, height: 0 };
    private boxArea = { x: 0, y: 0, width: 0, height: 0 };
    private boxObjects: Phaser.GameObjects.GameObject[] = [];
    private tabViews = new Map<OffStoreTab, Phaser.GameObjects.Rectangle>();
    private buttons = new Map<ButtonId, { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }>();
    private goldText!: Phaser.GameObjects.Text;
    private messageText!: Phaser.GameObjects.Text;
    private helpText!: Phaser.GameObjects.Text;
    private iconsReady = false;
    private lastClick = { row: -1, at: 0 };

    constructor() {
        super(OFF_STORE_SCENE_KEY);
    }

    init(data: OffStoreSceneData): void {
        this.params = data;
        this.tab = 'buy';
        this.rows = [];
        this.marked = -1;
        this.scroll = 0;
        this.rowViews = [];
        this.boxObjects = [];
        this.tabViews = new Map();
        this.buttons = new Map();
        this.lastClick = { row: -1, at: 0 };
        this.iconsReady = lookLoader.isReady(this, 'item.pack');
    }

    create(): void {
        this.openedAt = this.time.now;
        this.audio = new AudioSystem(this);
        const p = OFF_STORE_PANEL;
        const l = OFF_STORE_LIST;
        const side = OFF_STORE_SIDE;
        const x = Math.round((GAME_WIDTH - p.width) / 2);
        const y = p.top;
        const height = playAreaBottom() - p.bottomGap - y;
        this.add.rectangle(x, y, p.width, height, p.background, p.alpha).setOrigin(0).setStrokeStyle(2, p.border).setInteractive();
        this.add.text(x + p.width / 2, y + p.padding, OFF_STORE_TEXT.title[this.params.kind], OFF_STORE_TITLE_STYLE).setOrigin(0.5, 0);

        // Tabs, then the list under them.
        const left = x + p.padding;
        const tabsY = y + p.titleHeight + p.padding;
        STORE_TABS[this.params.kind].forEach((tab, i) => this.createTab(tab, left + i * (OFF_STORE_TABS.width + OFF_STORE_TABS.gap), tabsY));
        const headerY = tabsY + OFF_STORE_TABS.height + 6;
        this.add.text(left + l.iconSize + 12, headerY, OFF_STORE_TEXT.itemHeader, OFF_STORE_HEADER_STYLE);
        this.add.text(left + l.width - 8, headerY, OFF_STORE_TEXT.priceHeader, OFF_STORE_HEADER_STYLE).setOrigin(1, 0);
        const listY = headerY + l.headerHeight;
        const listHeight = y + height - p.padding - listY;
        this.visibleRows = Math.max(1, Math.floor(listHeight / l.rowHeight));
        this.listArea = { x: left, y: listY, width: l.width, height: this.visibleRows * l.rowHeight };
        this.add.rectangle(left, listY, l.width, this.listArea.height, l.background).setOrigin(0).setStrokeStyle(1, l.border);

        // Right-hand column.
        const sideX = left + l.width + p.columnGap;
        const sideWidth = x + p.width - p.padding - sideX;
        this.boxArea = { x: sideX, y: tabsY, width: sideWidth, height: side.boxHeight };
        const goldY = tabsY + side.boxHeight + side.gap;
        this.goldText = this.add.text(sideX, goldY, '', OFF_STORE_GOLD_STYLE);
        const messageY = goldY + side.goldHeight + side.gap;
        this.messageText = this.add.text(sideX, messageY, '', { ...OFF_STORE_MESSAGE_STYLE, wordWrap: { width: sideWidth } });
        const buttonsY = messageY + side.messageHeight + side.gap;
        const buttonWidth = (sideWidth - side.gap) / 2;
        this.createButton('act', sideX, buttonsY, buttonWidth);
        this.createButton('close', sideX + buttonWidth + side.gap, buttonsY, buttonWidth);
        this.helpText = this.add.text(sideX, buttonsY + side.buttonHeight + side.gap, '', { ...OFF_STORE_SMALL_STYLE, wordWrap: { width: sideWidth } });

        this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
            this.scrollBy(Math.sign(dy) * l.wheelRows);
        });
        this.inputSystem = new InputSystem(this);
        this.inputSystem.setPointerMaxY(-1);
        this.inputSystem.setStickMenus(true);
        this.showTab(this.params.tab !== undefined && STORE_TABS[this.params.kind].includes(this.params.tab) ? this.params.tab : 'buy');
        if (!this.iconsReady) {
            void lookLoader.ensure(this, ['item.pack']).then(() => {
                if (!this.sys.isActive()) return;
                this.iconsReady = true;
                this.drawList();
            });
        }
    }

    override update(): void {
        const input = this.inputSystem;
        input.update();
        const help = input.getLastDevice() === 'gamepad' ? OFF_STORE_TEXT.storeHelpPad : OFF_STORE_TEXT.storeHelpMouse;
        if (this.helpText.text !== help) this.helpText.setText(help);
        if (!this.ready()) return;
        if (input.justPressed(Action.Back) || input.justPressed(Action.Pause)) {
            this.close();
            return;
        }
        const tabStep = input.justPressed(Action.OffPrevTarget) ? -1 : input.justPressed(Action.OffSwitchTab) || input.justPressed(Action.OffNextTarget) ? 1 : 0;
        if (tabStep !== 0) {
            const tabs = STORE_TABS[this.params.kind];
            this.showTab(tabs[(tabs.indexOf(this.tab) + tabStep + tabs.length) % tabs.length] ?? 'buy');
            return;
        }
        if (input.justPressed(Action.MenuUp)) this.moveMark(-1);
        if (input.justPressed(Action.MenuDown)) this.moveMark(1);
        if (input.justPressed(Action.Pick)) this.act();
    }

    // ---- Building ----

    private createTab(tab: OffStoreTab, x: number, y: number): void {
        const t = OFF_STORE_TABS;
        const box = this.add.rectangle(x, y, t.width, t.height, t.background).setOrigin(0).setStrokeStyle(1, t.border);
        this.add.text(x + t.width / 2, y + t.height / 2, OFF_STORE_TEXT.tabs[tab], OFF_STORE_BUTTON_STYLE).setOrigin(0.5);
        box.setInteractive({ useHandCursor: true });
        box.on(Phaser.Input.Events.POINTER_UP, () => {
            if (this.ready()) this.showTab(tab);
        });
        this.tabViews.set(tab, box);
    }

    private createButton(id: ButtonId, x: number, y: number, width: number): void {
        const s = OFF_STORE_SIDE;
        const box = this.add.rectangle(x, y, width, s.buttonHeight, s.buttonBackground).setOrigin(0).setStrokeStyle(1, s.buttonBorder);
        const label = this.add.text(x + width / 2, y + s.buttonHeight / 2, id === 'close' ? OFF_STORE_TEXT.closeButton : '', OFF_STORE_BUTTON_STYLE).setOrigin(0.5);
        box.setInteractive({ useHandCursor: true });
        box.on(Phaser.Input.Events.POINTER_UP, () => {
            if (!this.ready()) return;
            if (id === 'close') this.close();
            else this.act();
        });
        this.buttons.set(id, { box, label });
    }

    /** The rows of a tab: what the place sells, or what the bag holds. */
    private rowsFor(tab: OffStoreTab): Row[] {
        if (tab === 'magic') {
            const rows: Row[] = [];
            let circle = 0;
            for (const id of OFF_SPELL_IDS) {
                if (OFF_SPELLS[id].circle !== circle) {
                    circle = OFF_SPELLS[id].circle;
                    rows.push({ kind: 'section', title: offCircleTitle(circle) });
                }
                rows.push({ kind: 'spell', id });
            }
            return rows;
        }
        if (tab === 'sell') return offSaveStore.character.bag.map((id, bagIndex) => ({ kind: 'item', id, bagIndex }));
        const rows: Row[] = [];
        const sections = OFF_STORE_STOCK[this.params.kind];
        for (const section of sections) {
            if (sections.length > 1) rows.push({ kind: 'section', title: section.title });
            for (const id of section.items) rows.push({ kind: 'item', id });
        }
        return rows;
    }

    public showTab(tab: OffStoreTab): void {
        this.tab = tab;
        this.rows = this.rowsFor(tab);
        this.scroll = 0;
        this.marked = this.rows.findIndex((r) => r.kind !== 'section');
        this.messageText.setText(tab === 'sell' && this.marked < 0 ? OFF_STORE_TEXT.nothingToSell : '');
        const t = OFF_STORE_TABS;
        this.tabViews.forEach((box, id) => box.setFillStyle(id === tab ? t.activeBackground : t.background));
        this.buttons.get('act')?.label.setText(OFF_STORE_TEXT.actButton[tab]);
        this.redraw();
    }

    // ---- Drawing ----

    private redraw(): void {
        this.keepMarkVisible();
        this.drawList();
        this.drawSide();
    }

    private drawList(): void {
        this.rowViews.forEach((v) => v.objects.forEach((o) => o.destroy()));
        this.rowViews = [];
        const l = OFF_STORE_LIST;
        const a = this.listArea;
        const gold = offSaveStore.character.gold;
        const who = { str: offSaveStore.character.stats.str, level: offSaveStore.level };
        const end = Math.min(this.rows.length, this.scroll + this.visibleRows);
        for (let index = this.scroll; index < end; index++) {
            const row = this.rows[index];
            if (!row) continue;
            const top = a.y + (index - this.scroll) * l.rowHeight;
            const middle = top + l.rowHeight / 2;
            if (row.kind === 'section') {
                this.rowViews.push({ objects: [this.add.text(a.x + a.width / 2, middle, row.title, { ...OFF_STORE_HEADER_STYLE, color: l.sectionColor }).setOrigin(0.5)] });
                continue;
            }
            const objects: Phaser.GameObjects.GameObject[] = [];
            const background = this.add.rectangle(a.x + 1, top + 1, a.width - 2, l.rowHeight - 2, l.focusFill, index === this.marked ? 1 : 0).setOrigin(0);
            background.setInteractive({ useHandCursor: true });
            background.on(Phaser.Input.Events.POINTER_UP, () => this.clickRow(index));
            objects.push(background);
            if (row.kind === 'spell') {
                this.drawSpellRow(row.id, objects, middle);
                this.rowViews.push({ objects });
                continue;
            }
            const frame = this.iconsReady ? offBagItemPicture(row.id, offSaveStore.character.look.gender) : undefined;
            if (frame) {
                const icon = this.add.image(a.x + 6 + l.iconSize / 2, middle, itemPackTexture(frame.sheet), frame.frame);
                icon.setScale(Math.min(1, l.iconSize / Math.max(icon.frame.width, icon.frame.height)));
                objects.push(icon);
            }
            const wearable = !isOffItemId(row.id) || offWearCheck(row.id, who) === 'ok';
            objects.push(this.add.text(a.x + l.iconSize + 12, middle, offBagItemName(row.id), {
                ...OFF_STORE_ROW_STYLE, ...(wearable ? {} : { color: OFF_STORE_UNMET_COLOR }),
            }).setOrigin(0, 0.5));
            const price = this.tab === 'buy' ? offPrice(row.id) : offSellPrice(row.id);
            const priceText = this.add.text(a.x + a.width - 8, middle, price.toLocaleString('en-US'), {
                ...OFF_STORE_ROW_STYLE, ...(this.tab === 'buy' && price > gold ? { color: OFF_STORE_UNMET_COLOR } : {}),
            }).setOrigin(1, 0.5);
            objects.push(priceText);
            if (isOffItemId(row.id) && this.tab === 'buy') {
                objects.push(this.add.text(priceText.x - priceText.width - 14, middle, offNeedsText(row.id), {
                    ...OFF_STORE_SMALL_STYLE, ...(wearable ? {} : { color: OFF_STORE_UNMET_COLOR }),
                }).setOrigin(1, 0.5));
            }
            this.rowViews.push({ objects });
        }
    }

    /** A spell row (Off-6A): name (red if the INT is short), "Int N", and price or "Learned". */
    private drawSpellRow(id: OffSpellId, objects: Phaser.GameObjects.GameObject[], middle: number): void {
        const a = this.listArea;
        const spell = OFF_SPELLS[id];
        const character = offSaveStore.character;
        const intMet = character.stats.int >= spell.reqInt;
        const known = offSaveStore.knowsSpell(id);
        const red = { color: OFF_STORE_UNMET_COLOR };
        objects.push(this.add.text(a.x + 12, middle, spell.name, { ...OFF_STORE_ROW_STYLE, ...(intMet || known ? {} : red) }).setOrigin(0, 0.5));
        const priceText = this.add.text(a.x + a.width - 8, middle, known ? OFF_STORE_TEXT.learned : spell.price.toLocaleString('en-US'), {
            ...(known ? OFF_STORE_SMALL_STYLE : OFF_STORE_ROW_STYLE), ...(!known && spell.price > character.gold ? red : {}),
        }).setOrigin(1, 0.5);
        objects.push(priceText);
        if (!known) {
            objects.push(this.add.text(priceText.x - priceText.width - 14, middle, `Int ${spell.reqInt}`, {
                ...OFF_STORE_SMALL_STYLE, ...(intMet ? {} : red),
            }).setOrigin(1, 0.5));
        }
    }

    private drawSide(): void {
        this.boxObjects.forEach((o) => o.destroy());
        this.boxObjects = [];
        const id = this.markedId;
        const row = this.rows[this.marked];
        const spellId = row?.kind === 'spell' ? row.id : undefined;
        this.goldText.setText(OFF_STORE_TEXT.gold(offSaveStore.character.gold));
        const act = this.buttons.get('act');
        const alpha = id === undefined && (spellId === undefined || offSaveStore.knowsSpell(spellId)) ? OFF_STORE_SIDE.disabledAlpha : 1;
        act?.box.setAlpha(alpha);
        act?.label.setAlpha(alpha);
        if (spellId !== undefined) {
            this.boxObjects = drawOffItemBox(this, this.boxArea, OFF_SPELLS[spellId].name, offSpellBoxLines(spellId, offSaveStore.character.stats.int));
            return;
        }
        if (id === undefined) return;
        const worn = isOffItemId(id) ? offSaveStore.character.equipment[OFF_ITEMS[id].slot] : undefined;
        const lines = offItemBoxLines(id, worn === id ? undefined : worn, { str: offSaveStore.character.stats.str, level: offSaveStore.level });
        this.boxObjects = drawOffItemBox(this, this.boxArea, offBagItemName(id), lines);
    }

    private get markedId(): OffBagItemId | undefined {
        const row = this.rows[this.marked];
        return row?.kind === 'item' ? row.id : undefined;
    }

    // ---- Moving ----

    private clickRow(index: number): void {
        if (!this.ready()) return;
        const now = this.time.now;
        const twice = this.lastClick.row === index && now - this.lastClick.at <= OFF_STORE_LIST.doubleClickMs;
        this.lastClick = twice ? { row: -1, at: 0 } : { row: index, at: now };
        this.mark(index);
        if (twice) this.act();
    }

    /** Development and clicks: marks that row (sections are skipped). */
    public mark(index: number): void {
        const kind = this.rows[index]?.kind;
        if (kind === undefined || kind === 'section') return;
        this.marked = index;
        this.redraw();
    }

    /** Up / down to the next item row, past the sections. */
    private moveMark(step: number): void {
        let index = this.marked;
        do index += step;
        while (index >= 0 && index < this.rows.length && this.rows[index]?.kind === 'section');
        if (index >= 0 && index < this.rows.length) this.mark(index);
        else this.scrollBy(step);
    }

    private scrollBy(rows: number): void {
        const max = Math.max(0, this.rows.length - this.visibleRows);
        const next = Phaser.Math.Clamp(this.scroll + rows, 0, max);
        if (next === this.scroll) return;
        this.scroll = next;
        this.drawList();
    }

    /** The marked row in sight (its section title too, when it is the first of a section). */
    private keepMarkVisible(): void {
        if (this.marked < 0) return;
        const first = this.rows[this.marked - 1]?.kind === 'section' ? this.marked - 1 : this.marked;
        if (first < this.scroll) this.scroll = first;
        else if (this.marked >= this.scroll + this.visibleRows) this.scroll = this.marked - this.visibleRows + 1;
    }

    // ---- Buying and selling ----

    /** Buys or sells the marked item, or learns the marked spell (button, double click, Enter, A). */
    public act(): void {
        const row = this.rows[this.marked];
        if (row?.kind === 'spell') {
            this.learn(row.id);
            return;
        }
        if (row?.kind !== 'item') return;
        if (this.tab === 'buy') this.buy(row.id);
        else if (row.bagIndex !== undefined) this.sell(row.bagIndex);
    }

    private buy(id: OffBagItemId): void {
        const result = offSaveStore.buy(id);
        const name = offBagItemName(id);
        this.messageText.setText(result === 'ok' ? OFF_STORE_TEXT.bought(name, offPrice(id)) : this.failure(result));
        if (result === 'ok') {
            this.audio.play('sfx.pickup');
            this.params.onChange();
        }
        this.redraw();
    }

    private sell(bagIndex: number): void {
        const id = offSaveStore.character.bag[bagIndex];
        const gold = offSaveStore.sell(bagIndex);
        if (id === undefined || gold === undefined) return;
        this.audio.play('sfx.pickup');
        this.params.onChange();
        const marked = this.marked;
        this.rows = this.rowsFor('sell');
        this.marked = Math.min(marked, this.rows.length - 1);
        this.messageText.setText(OFF_STORE_TEXT.sold(offBagItemName(id), gold));
        this.redraw();
    }

    private learn(id: OffSpellId): void {
        const result: OffLearnResult = offSaveStore.learnSpell(id);
        const spell = OFF_SPELLS[id];
        this.messageText.setText(result === 'ok' ? OFF_STORE_TEXT.learnt(spell.name, spell.price) : OFF_STORE_TEXT.cantLearn[result]);
        if (result === 'ok') this.audio.play('sfx.pickup');
        this.redraw();
    }

    private failure(result: OffTradeResult): string {
        if (result === 'gold') return OFF_STORE_TEXT.noGold;
        if (result === 'bagFull') return OFF_STORE_TEXT.bagFull;
        if (result === 'potionLimit') return OFF_STORE_TEXT.potionLimit;
        return '';
    }

    /** Development: what the window shows. */
    public debugState(): { tab: OffStoreTab; rows: string[]; marked: string | undefined; gold: string; message: string; box: string[] } {
        const box = this.boxObjects.filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text).map((t) => t.text);
        const rows = this.rows.map((r) => (r.kind === 'section' ? `[${r.title}]` : r.kind === 'spell' && offSaveStore.knowsSpell(r.id) ? `${r.id} (learned)` : r.id));
        const row = this.rows[this.marked];
        return { tab: this.tab, rows, marked: row?.kind === 'section' ? undefined : row?.id, gold: this.goldText.text, message: this.messageText.text, box };
    }

    public close(): void {
        this.scene.stop();
        this.params.onClose();
    }

    private ready(): boolean {
        return this.time.now - this.openedAt >= CHARACTER_INFO_INPUT_DELAY_MS;
    }
}
