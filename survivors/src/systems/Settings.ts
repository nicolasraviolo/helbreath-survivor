// Ajustes del jugador compartidos por todas las escenas. Al cambiar uno se guarda en el navegador y se avisa
// (evento SETTINGS_CHANGED) para que la música, los efectos y la barra de vida se actualicen al momento.
// Si el navegador no deja guardar (modo privado, almacenamiento bloqueado), funcionan igual durante la sesión.
import Phaser from 'phaser';
import { DEFAULT_SETTINGS, HUD_STYLES, SETTINGS_STORAGE_KEY, TREE_MODES, type GameSettings, type HudStyle, type TreeMode } from '../config/settings';

export const SETTINGS_CHANGED = 'settings-changed';

class SettingsStore extends Phaser.Events.EventEmitter {
    private values: GameSettings = load();

    public get current(): Readonly<GameSettings> {
        return this.values;
    }

    public set<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
        if (this.values[key] === value) return;
        this.values = { ...this.values, [key]: value };
        save(this.values);
        this.emit(SETTINGS_CHANGED, this.values);
    }
}

function load(): GameSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_SETTINGS };
        const stored = parsed as Partial<Record<keyof GameSettings, unknown>>;
        return {
            musicVolume: readVolume(stored.musicVolume, DEFAULT_SETTINGS.musicVolume),
            sfxVolume: readVolume(stored.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
            showPlayerHealthBar: typeof stored.showPlayerHealthBar === 'boolean'
                ? stored.showPlayerHealthBar : DEFAULT_SETTINGS.showPlayerHealthBar,
            hudStyle: HUD_STYLES.find((style: HudStyle) => style === stored.hudStyle) ?? DEFAULT_SETTINGS.hudStyle,
            screenShake: typeof stored.screenShake === 'boolean' ? stored.screenShake : DEFAULT_SETTINGS.screenShake,
            largeTrees: TREE_MODES.find((mode: TreeMode) => mode === stored.largeTrees) ?? DEFAULT_SETTINGS.largeTrees,
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function readVolume(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, 1) : fallback;
}

function save(values: GameSettings): void {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(values));
    } catch {
        // Storage blocked: the settings still work until the page is closed.
    }
}

export const settings = new SettingsStore();
