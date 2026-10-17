// Ajustes (Fase 8): volumen de música y de efectos, y la barra de vida sobre el personaje.
// Se abre desde el menú principal o desde la pausa. Cada cambio se aplica y se guarda al momento.
// Fase 11: árboles grandes (On / Transparent / Off).
// Fase 10: solo en el móvil, el estilo de la interfaz de la partida (HUD: Classic / Compact); en todos, el temblor de cámara.
import { COMPACT_UI } from '../config/device';
import { HUD_STYLE_NAMES, TREE_MODES, TREE_MODE_NAMES, VOLUME_STEP } from '../config/settings';
import { settings } from '../systems/Settings';
import { MenuOverlayScene } from './MenuOverlayScene';

export class SettingsScene extends MenuOverlayScene {
    protected readonly title = 'Settings';

    constructor() {
        super('Settings');
    }

    protected build(): void {
        const volume = (key: 'musicVolume' | 'sfxVolume') => ({
            value: () => `${Math.round(settings.current[key] * 100)}%`,
            onLeft: () => settings.set(key, stepVolume(settings.current[key], -1)),
            onRight: () => settings.set(key, stepVolume(settings.current[key], 1)),
        });
        const toggleBar = () => settings.set('showPlayerHealthBar', !settings.current.showPlayerHealthBar);
        const toggleShake = () => settings.set('screenShake', !settings.current.screenShake);
        const toggleHud = () => settings.set('hudStyle', settings.current.hudStyle === 'classic' ? 'compact' : 'classic');
        const stepTrees = (direction: number) => {
            const index = TREE_MODES.indexOf(settings.current.largeTrees);
            settings.set('largeTrees', TREE_MODES[(index + direction + TREE_MODES.length) % TREE_MODES.length]);
        };
        const hudRow = COMPACT_UI
            ? [{ label: 'HUD', value: () => HUD_STYLE_NAMES[settings.current.hudStyle], onLeft: toggleHud, onRight: toggleHud }]
            : [];
        this.addList([
            { label: 'Music', ...volume('musicVolume') },
            { label: 'Sound', ...volume('sfxVolume') },
            {
                label: 'Health Bar on Character',
                value: () => (settings.current.showPlayerHealthBar ? 'On' : 'Off'),
                onLeft: toggleBar,
                onRight: toggleBar,
            },
            {
                label: 'Screen Shake',
                value: () => (settings.current.screenShake ? 'On' : 'Off'),
                onLeft: toggleShake,
                onRight: toggleShake,
            },
            {
                label: 'Large Trees',
                value: () => TREE_MODE_NAMES[settings.current.largeTrees],
                onLeft: () => stepTrees(-1),
                onRight: () => stepTrees(1),
            },
            ...hudRow,
            { label: 'Back', onConfirm: () => this.close() },
        ]);
    }
}

/** One step up or down, kept within 0..1 and rounded so 0.1 steps don't drift (0.30000000000000004). */
function stepVolume(current: number, direction: number): number {
    const next = Math.round((current + direction * VOLUME_STEP) * 100) / 100;
    return Math.min(1, Math.max(0, next));
}
