// Publica las novedades de una fase en el canal #announcements de Discord.
// Lee el texto de src/data/releaseNotes.ts (lo mismo que la pantalla "What's new")
// y el webhook secreto de survivors/.env.local (no se sube a git).
//
// Uso (desde la raíz del repo):
//   pnpm --dir survivors announce              → publica la fase más reciente
//   pnpm --dir survivors announce --dry        → solo enseña el mensaje, no publica
//   pnpm --dir survivors announce "Phase 28"   → publica una fase concreta

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GAME_URL = 'https://nicolasraviolo.github.io/helbreath-survivor/';
const EMBED_COLOR = 0xc9a227; // dorado

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const wanted = args.find((a) => !a.startsWith('--'));

// Node 22.18+ entiende TypeScript simple (quita los tipos al importar).
const { RELEASE_NOTES } = await import(pathToFileURL(join(ROOT, 'src/data/releaseNotes.ts')).href);
const note = wanted ? RELEASE_NOTES.find((n) => n.version === wanted) : RELEASE_NOTES[0];
if (!note) {
    console.error(`No release note for "${wanted}". Available: ${RELEASE_NOTES.map((n) => n.version).join(', ')}`);
    process.exit(1);
}

const payload = {
    username: 'Helbreath Survivors',
    embeds: [
        {
            title: `${note.version} is out!`,
            url: GAME_URL,
            color: EMBED_COLOR,
            description: `${note.changes.map((c) => `• ${c}`).join('\n')}\n\n▶️ **[Play now](${GAME_URL})**`,
            footer: { text: note.date },
        },
    ],
    allowed_mentions: { parse: [] },
};

if (dry) {
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
}

function readWebhook() {
    const file = join(ROOT, '.env.local');
    if (!existsSync(file)) return undefined;
    const line = readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith('DISCORD_WEBHOOK_URL='));
    return line?.slice('DISCORD_WEBHOOK_URL='.length).trim();
}

const webhook = process.env.DISCORD_WEBHOOK_URL ?? readWebhook();
if (!webhook) {
    console.error('Missing DISCORD_WEBHOOK_URL in survivors/.env.local');
    process.exit(1);
}

const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
});
if (!res.ok) {
    console.error(`Discord answered ${res.status}: ${await res.text()}`);
    process.exit(1);
}
console.log(`Posted "${note.version}" to Discord.`);
