// Genera los iconos PNG de la app instalable (pwa/icon-192.png y pwa/icon-512.png) a partir de pwa/icon.svg,
// dibujándolo con Chrome. Solo hace falta volver a ejecutarlo si cambia el icono:  node scripts/make-icons.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const PWA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'pwa');
const SIZES = [192, 512];

const svg = readFileSync(join(PWA_DIR, 'icon.svg'), 'utf8');
const browser = await chromium.launch({ channel: 'chrome' });
try {
    for (const size of SIZES) {
        const page = await browser.newPage({ viewport: { width: size, height: size } });
        await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
        await page.screenshot({ path: join(PWA_DIR, `icon-${size}.png`) });
        await page.close();
        console.log(`pwa/icon-${size}.png`);
    }
} finally {
    await browser.close();
}
