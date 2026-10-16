// Requisitos de objetos y hechizos: una sola función compara los stats con lo que pide cada cosa.
// Los valores son los originales de docs/REQUISITOS_HB.md; aquí se escalan con REQ_SCALE (data/stats.ts).
// Str para armas y armaduras; Int para hechizos y equipo de mago. Se usará en la Fase 6.
import { REQ_SCALE, type StatId, type Stats } from '../data/stats';

export interface Requirement {
    stat: StatId;
    /** Value in the original game, before REQ_SCALE. */
    original: number;
}

/** Value the player needs in this survivors (rounded up). */
export function requiredValue(requirement: Requirement): number {
    return Math.ceil(requirement.original * REQ_SCALE);
}

export function meetsRequirement(stats: Readonly<Stats>, requirement: Requirement | undefined): boolean {
    return requirement === undefined || stats[requirement.stat] >= requiredValue(requirement);
}
