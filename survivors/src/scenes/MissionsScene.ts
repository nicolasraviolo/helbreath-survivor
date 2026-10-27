// Missions de William (Fase 29B, decidida por el propietario el 27-oct-2026): la lista de rescates de data/rescues.ts,
// cuántos llevas y, por cada uno, el mapa, "Rescue Howard" y su estado: hecho (dorado), pendiente (gris) o, si ese mapa
// aún está cerrado para este personaje, "???" y "Locked". Al añadir un rescate en data/rescues.ts sale aquí solo.
// Con 3 misiones cabe todo; si un día son muchas, hará falta pasar páginas como en AchievementsScene.
import { MENU_OVERLAY, MENU_TEXT_STYLE, MISSIONS_SCREEN } from '../config/menus';
import { UI_FONT_SIZE, UI_TEXT, px } from '../config/ui';
import { MAPS_DATA, type MapId } from '../data/maps';
import { RESCUES, type RescueDef } from '../data/rescues';
import { TOWN_NPCS } from '../data/town';
import { characterStore } from '../systems/CharacterStore';
import { mapUnlockStore } from '../systems/MapUnlockStore';
import { rescueStore } from '../systems/RescueStore';
import { MenuOverlayScene, type MenuOverlayData } from './MenuOverlayScene';

export const MISSIONS_SCENE_KEY = 'Missions';

export interface MissionsSceneData extends MenuOverlayData {
    /** The character walking the town: a map closed to it shows its mission as "???". None = Level 1. */
    characterUid: string | undefined;
}

type MissionState = 'done' | 'pending' | 'locked';

export class MissionsScene extends MenuOverlayScene {
    protected readonly title = 'Missions';
    protected override readonly panelScale = MENU_OVERLAY.creditsPanelScale;
    private characterLevel = 1;

    constructor() {
        super(MISSIONS_SCENE_KEY);
    }

    override init(data: MissionsSceneData): void {
        super.init(data);
        this.characterLevel = characterStore.byUid(data.characterUid)?.level ?? 1;
    }

    protected build(): void {
        const screen = MISSIONS_SCREEN;
        const missions = (Object.entries(RESCUES) as [MapId, RescueDef][]).map(([map, rescue]) => ({ map, rescue, state: this.stateOf(map, rescue) }));
        const done = missions.filter((mission) => mission.state === 'done').length;
        this.add.text(MENU_OVERLAY.panelX, this.contentTop - MENU_OVERLAY.itemSpacing / 2, screen.count(done, missions.length), {
            ...MENU_TEXT_STYLE, color: screen.countColor,
        }).setOrigin(0.5, 0);
        const top = this.contentTop - MENU_OVERLAY.itemSpacing / 2 + screen.countGap;
        missions.forEach((mission, i) => this.addRow(mission.map, mission.rescue, mission.state, top + i * screen.rowHeight));
        this.addList([{ label: 'Back', onConfirm: () => this.close() }], this.panelBottom - this.contentTop - MENU_OVERLAY.itemSpacing);
    }

    private stateOf(map: MapId, rescue: RescueDef): MissionState {
        if (rescueStore.isInTown(rescue.npc)) return 'done';
        return mapUnlockStore.isOpen(map, this.characterLevel) ? 'pending' : 'locked';
    }

    /** The map (small) over the task on the left; the state on the right, level with the task. */
    private addRow(map: MapId, rescue: RescueDef, state: MissionState, y: number): void {
        const screen = MISSIONS_SCREEN;
        const left = MENU_OVERLAY.panelX - screen.rowWidth / 2;
        const right = MENU_OVERLAY.panelX + screen.rowWidth / 2;
        const base = { ...UI_TEXT, stroke: '#000000', strokeThickness: 3 };
        const color = state === 'done' ? screen.doneColor : state === 'pending' ? screen.pendingColor : screen.lockedColor;
        const mapName = this.add.text(left, y, MAPS_DATA[map].name, {
            ...base, fontSize: px(UI_FONT_SIZE.small), color: state === 'locked' ? screen.lockedColor : screen.mapColor,
        });
        const taskY = y + mapName.height;
        const task = state === 'locked' ? screen.hiddenTask : screen.task(TOWN_NPCS[rescue.npc].name);
        this.add.text(left, taskY, task, {
            ...base, fontSize: px(UI_FONT_SIZE.normal), fontStyle: 'bold', color: state === 'done' ? screen.doneColor : state === 'pending' ? screen.taskColor : screen.lockedColor,
        });
        const label = state === 'done' ? screen.done : state === 'pending' ? screen.pending : screen.locked;
        this.add.text(right, taskY, label, { ...base, fontSize: px(UI_FONT_SIZE.normal), color }).setOrigin(1, 0);
    }
}
