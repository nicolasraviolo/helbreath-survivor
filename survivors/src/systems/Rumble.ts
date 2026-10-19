// Vibración del mando (Fase 19C): al recibir daño (más fuerte con golpes de jefe o grandes) y cuando el
// Critical Strike o el Meteor Strike impactan en algún monstruo (una vez por lanzamiento). Números en data/feedback.ts (GAMEPAD_RUMBLE). Se puede quitar en Settings → Controls → Vibration.
// Usa la Gamepad API del navegador ('dual-rumble'): vibra en Chrome y Edge; donde el navegador o el mando no lo
// permiten (Firefox, algunos mandos en Safari), simplemente no hace nada.
import type { RumbleDef } from '../data/feedback';
import { readGamepad } from './InputSystem';
import { settings } from './Settings';

export class Rumble {
    /** Strength (big motor) of the vibration running, and when it ends (performance.now()). */
    private strength = 0;
    private endsAt = 0;

    public play(def: RumbleDef): void {
        if (!settings.current.vibration) return;
        const actuator = readGamepad()?.vibrationActuator;
        if (!actuator || typeof actuator.playEffect !== 'function') return;
        const now = performance.now();
        // A softer one does not cut a stronger one still running.
        if (now < this.endsAt && def.strong < this.strength) return;
        this.strength = def.strong;
        this.endsAt = now + def.durationMs;
        try {
            actuator.playEffect('dual-rumble', {
                startDelay: 0, duration: def.durationMs, strongMagnitude: def.strong, weakMagnitude: def.weak,
            }).catch(() => undefined);
        } catch {
            // Not supported by this pad / browser: nothing to do.
        }
    }
}
