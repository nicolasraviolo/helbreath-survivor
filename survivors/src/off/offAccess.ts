// Helbreath Off está oculto (decisión del 6-nov-2026): solo se llega a él con `?off` en la dirección, también en la
// versión publicada. Sin `?off`, el juego arranca directo en Survivors como siempre.
//   ?off       → al arrancar sale la pantalla de elegir juego (GameSelectScene)
//   ?off=game  → directo a la escena de Off (para probar)
//   ?off=world → directo a andar por el mundo de Off (Fase Off-1)
//   ?off=create → directo a la pantalla de crear personaje de Off (Fase Off-3A)

/** How the page reaches Helbreath Off: not at all, through the game choice screen, or straight into Off. */
export type OffAccess = 'hidden' | 'select' | 'game' | 'world' | 'create';

function readOffAccess(): OffAccess {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('off')) return 'hidden';
    const value = params.get('off');
    return value === 'game' || value === 'world' || value === 'create' ? value : 'select';
}

export const OFF_ACCESS = readOffAccess();

/** True when this page may show the game choice screen (and the "Change Game" option of Survivors' main menu). */
export function offVisible(): boolean {
    return OFF_ACCESS !== 'hidden';
}
