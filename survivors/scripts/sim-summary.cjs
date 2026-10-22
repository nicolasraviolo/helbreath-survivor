// Resumen rápido: muerte, muertes, mueren de un golpe y vivos a la vez (min 5/8/11), por caso.
const d = require(require('path').resolve(process.argv[2]));
const mm = (s) => (s === undefined ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
for (const s of d.summaries) {
    const rs = d.results.filter((r) => r.spec === s.spec && !r.failed);
    const avg = (f) => Math.round(rs.reduce((a, r) => a + (f(r) ?? 0), 0) / rs.length);
    console.log(s.spec.padEnd(26), 'death', mm(s.deathS).padEnd(6), 'won', `${s.survived}/${s.runs}`, 'deaths', String(s.deaths).padEnd(5),
        'oneHit', (rs.reduce((a, r) => a + r.oneHitKillShare, 0) / rs.length).toFixed(2), 'alive', [5, 8, 11].map((m) => avg((r) => r.aliveByMinute[m])).join('/'),
        'Power', s.endLevel, 'boss', mm(s.finalBossS));
}
