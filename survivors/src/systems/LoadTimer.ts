// Cronómetro de las pantallas de carga (Fase 22B): cuánto tarda cada una en descargar y cuánto en preparar (pasar
// los .spr a texturas). Lo lee `pnpm check loadtime` desde window.__loadTimes; en el juego no se ve.
// Los MB de cada descarga los suma el script con los datos del navegador (performance.getEntriesByType('resource')).

export interface LoadPhase {
    /** 'Preload' (before the menu) or 'MapLoad:<map>'. */
    name: string;
    /** Milliseconds since the page opened (performance.now()). */
    startMs: number;
    /** When the downloads finished. */
    downloadedMs?: number;
    /** When everything was ready. */
    endMs?: number;
}

declare global {
    interface Window {
        __loadTimes?: LoadPhase[];
    }
}

class LoadTimerImpl {
    private readonly phases: LoadPhase[] = [];

    constructor() {
        if (typeof window !== 'undefined') window.__loadTimes = this.phases;
    }

    public start(name: string): void {
        this.phases.push({ name, startMs: performance.now() });
    }

    public downloaded(name: string): void {
        const phase = this.current(name);
        if (phase && phase.downloadedMs === undefined) phase.downloadedMs = performance.now();
    }

    public end(name: string): void {
        const phase = this.current(name);
        if (!phase) return;
        phase.downloadedMs ??= performance.now();
        phase.endMs = performance.now();
    }

    private current(name: string): LoadPhase | undefined {
        return [...this.phases].reverse().find((phase) => phase.name === name && phase.endMs === undefined);
    }
}

export const loadTimer = new LoadTimerImpl();
