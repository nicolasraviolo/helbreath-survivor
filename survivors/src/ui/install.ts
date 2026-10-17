// Opción "Install" del menú principal (Fase 12): instala el juego como app (icono en el móvil, pantalla completa).
// Chrome avisa con el evento "beforeinstallprompt" cuando se puede instalar; lo guardamos y la opción solo aparece
// entonces. No sale si ya está instalado, si se abrió desde el icono o en navegadores que no lo permiten (iPhone).
// También registra el service worker (pwa/sw.js), que solo existe en el build publicado.
import Phaser from 'phaser';
import type { MenuItem } from './MenuList';

/** Chrome's install event (not in the TypeScript DOM types yet). */
interface InstallPromptEvent extends Event {
    prompt(): Promise<void>;
}

/** Emitted on `installEvents` when the Install option appears or disappears. */
export const INSTALL_CHANGED = 'install-changed';
export const installEvents = new Phaser.Events.EventEmitter();

let pending: InstallPromptEvent | undefined;

function setPending(event: InstallPromptEvent | undefined): void {
    pending = event;
    installEvents.emit(INSTALL_CHANGED);
}

/** Call once at start-up, before the menus exist (the event can come very early). */
export function initInstall(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
        // Without this Chrome may show its own banner; we offer the menu option instead.
        event.preventDefault();
        setPending(event as InstallPromptEvent);
    });
    window.addEventListener('appinstalled', () => setPending(undefined));
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    }
}

/** Menu option that installs the game, or nothing if the browser can't right now. */
export function installItem(): MenuItem[] {
    if (!pending) return [];
    return [{ label: 'Install', onConfirm: () => void install() }];
}

async function install(): Promise<void> {
    const event = pending;
    if (!event) return;
    // Chrome lets each event be used only once: the option goes away, and comes back if Chrome sends a new one.
    setPending(undefined);
    await event.prompt().catch(() => undefined);
}
