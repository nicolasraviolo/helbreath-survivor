// Carrera simulada de un jugador (revisión de la dificultad, 22-oct-2026): partida a partida, desde Level 1, con los
// resultados de `pnpm balance` (survivors/.check/balance.json). En cada partida el jugador va al mapa abierto que más
// EXP por minuto le da (normalmente el más difícil que aguanta), gana la EXP y el oro hasta el minuto en que el bot
// habría muerto (o la partida entera si gana), y abre mapas al ganar el anterior o con su Level (data/maps.ts).
// Los números de Level y mapas se leen de los datos del juego con tsx no hace falta: van copiados aquí y se comprueban
// a mano si cambian (LEVEL_EXP_*, recommendedLevel).
//
// Uso:  node scripts/progression.mjs [--in=balance] [--hours=30]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const data = JSON.parse(readFileSync(join(ROOT, '.check', `${flag('in', 'balance')}.json`), 'utf8'));
const maxHours = Number(flag('hours', '30'));

// data/characterLevel.ts
const LEVEL_EXP_SCALE = 300;
const LEVEL_EXP_POWER = 2.24;
const totalExpForLevel = (level) => Math.round((LEVEL_EXP_SCALE * Math.max(0, level - 1) ** LEVEL_EXP_POWER) / 10) * 10;
const levelFor = (exp) => {
    let level = 1;
    while (level < 140 && totalExpForLevel(level + 1) <= exp) level++;
    return level;
};
// data/maps.ts (order and recommended Level)
const MAPS = [['traveler', 1], ['bisle', 10], ['elvineGarden', 25], ['middleland', 40]];
/** Minutes between runs (menus, town, shop): counted in the hours. */
const BETWEEN_RUNS_MIN = 1;

/** What a run of that class on that map gives at that Level: from the closest simulated Level at or below it. */
function outcome(cls, map, level) {
    const runs = data.results.filter((r) => !r.failed && r.spec.split('@')[0].split(':')[3] === '0');
    const mine = runs.filter((r) => {
        const [c, m] = r.spec.split(':');
        return c === cls && m === map;
    });
    const levels = [...new Set(mine.map((r) => Number(r.spec.split(':')[2])))].sort((a, b) => a - b);
    const at = levels.filter((l) => l <= level).at(-1) ?? levels[0];
    if (at === undefined) return undefined;
    const these = mine.filter((r) => Number(r.spec.split(':')[2]) === at);
    // Each simulated run is one possible result: average them (EXP and gold up to the death, minutes played, won or not).
    let exp = 0;
    let gold = 0;
    let minutes = 0;
    let wins = 0;
    for (const r of these) {
        const won = r.deathAtS === undefined && r.finalBossDeadAtS !== undefined;
        const endS = won ? r.endS : r.deathAtS ?? r.endS;
        const minute = Math.min(Math.floor(endS / 60), r.xpByMinute.length - 1);
        exp += r.xpByMinute[minute] ?? 0;
        gold += r.goldByMinute[Math.min(minute, r.goldByMinute.length - 1)] ?? 0;
        minutes += endS / 60;
        if (won) wins++;
    }
    const n = these.length;
    return { simLevel: at, exp: exp / n, gold: gold / n, minutes: minutes / n, winShare: wins / n };
}

function career(cls) {
    let exp = 0;
    let gold = 0;
    let minutes = 0;
    const won = new Set();
    const events = [];
    const note = (text) => events.push({ hours: minutes / 60, level: levelFor(exp), gold: Math.round(gold), text });
    for (let run = 1; minutes / 60 < maxHours && run < 2000; run++) {
        const level = levelFor(exp);
        const open = MAPS.filter(([id, need], i) => i === 0 || won.has(MAPS[i - 1][0]) || level >= need).map(([id]) => id);
        const options = open.map((map) => ({ map, ...outcome(cls, map, level) })).filter((o) => o.exp !== undefined);
        // A player plays the hardest open map unless another gives clearly more EXP per minute.
        const best = options.reduce((a, b) => (b.exp / b.minutes > (a.exp / a.minutes) * 0.8 ? b : a));
        // Wins are random with the simulated share: a run is won if its share passes a fixed threshold sequence.
        const winThis = best.winShare >= 0.5 || (best.winShare > 0 && run % Math.round(1 / best.winShare) === 0);
        exp += best.exp;
        gold += best.gold;
        minutes += best.minutes + BETWEEN_RUNS_MIN;
        if (winThis && !won.has(best.map)) {
            won.add(best.map);
            note(`first win on ${best.map}`);
        }
        const newLevel = levelFor(exp);
        for (const [id, need] of MAPS) if (level < need && newLevel >= need) note(`Level ${need}: ${id} opens by Level`);
        if (run <= 3 || run % 10 === 0) note(`run ${run} on ${best.map} (as Level ${best.simLevel}): ${Math.round(best.minutes)} min, +${Math.round(best.exp)} EXP, +${Math.round(best.gold)} gold`);
    }
    return events;
}

for (const cls of ['warrior', 'mage']) {
    console.log(`\n== ${cls}`);
    for (const e of career(cls)) console.log(`${e.hours.toFixed(1).padStart(5)} h · Level ${String(e.level).padStart(3)} · gold ${String(e.gold).padStart(6)} · ${e.text}`);
}
