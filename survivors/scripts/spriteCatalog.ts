// Catálogo para el visor de sprites (sprites.html, solo en desarrollo).
//
// Junta en un JSON los nombres que el cliente original da a cada sprite: objetos (con su icono en item-pack.spr y el
// .spr que se ve en la mano o puesto), monstruos, NPCs y efectos. Lee los .ts de sp-client sin copiarlos: los
// transpila a JavaScript con el compilador de TypeScript y los ejecuta con sus imports sustituidos por valores
// de relleno (solo nos interesan las listas de datos, no los sonidos ni las clases que importan).
// Lo usa vite.config.ts, que lo sirve en /sprite-catalog.json.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

export interface CatalogItem {
    name: string;
    type: string;
    /** Icon in item-pack.spr (sheet, frame); male version first, female as fallback. */
    icon?: [number, number];
    /** Equipped sprite files (without .spr). */
    male?: string;
    female?: string;
    /** First sheet of this item inside a shared weapon/shield file (e.g. msw.spr holds many swords). */
    startSheet?: number;
}

export interface CatalogEffect {
    name: string;
    file: string;
    sheet: number;
}

export interface SpriteCatalog {
    /** Every .spr in the sprites folder, without extension. */
    files: string[];
    items: CatalogItem[];
    monsters: Array<{ name: string; file: string }>;
    npcs: Array<{ name: string; file: string }>;
    effects: CatalogEffect[];
}

/** Stand-in for any import: every property is another stand-in whose properties are their own names (Gender.MALE → 'MALE'). */
const importStub: unknown = new Proxy({}, {
    get: () => new Proxy({}, { get: (_inner, innerKey) => String(innerKey) }),
});

function loadConstants(file: string): Record<string, unknown> {
    const source = readFileSync(file, 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const module = { exports: {} as Record<string, unknown> };
    // Code from our own read-only sp-client folder, not from the network.
    new Function('exports', 'require', 'module', outputText)(module.exports, () => importStub, module);
    return module.exports;
}

interface RawItem {
    name: string;
    itemType: string;
    itemSheetIndexMale?: number;
    itemSheetIndexFemale?: number;
    itemSpriteIndexMale?: number;
    itemSpriteIndexFemale?: number;
    equippedSpriteMale?: string;
    equippedSpriteFemale?: string;
    startSpriteSheetIndex?: number;
}

export function buildSpriteCatalog(spClientDir: string): SpriteCatalog {
    const constants = join(spClientDir, 'src/constants');
    const files = readdirSync(join(spClientDir, 'public/assets/sprites'))
        .filter((name) => name.toLowerCase().endsWith('.spr'))
        .map((name) => name.slice(0, -4))
        .sort((a, b) => a.localeCompare(b));

    const rawItems = loadConstants(join(constants, 'Items.ts')).ITEMS as RawItem[];
    const items = rawItems.map((item): CatalogItem => {
        const sheet = item.itemSheetIndexMale ?? item.itemSheetIndexFemale;
        const frame = item.itemSpriteIndexMale ?? item.itemSpriteIndexFemale;
        return {
            name: item.name,
            type: item.itemType,
            icon: sheet !== undefined && frame !== undefined ? [sheet, frame] : undefined,
            male: item.equippedSpriteMale,
            female: item.equippedSpriteFemale,
            startSheet: item.startSpriteSheetIndex,
        };
    });

    const monsters = (loadConstants(join(constants, 'Monsters.ts')).MONSTERS as Array<{ name: string; spriteName: string }>)
        .map((monster) => ({ name: monster.name, file: monster.spriteName }));
    const npcs = (loadConstants(join(constants, 'NPCs.ts')).NPCS as Array<{ name: string; sprite: string }>)
        .map((npc) => ({ name: npc.name, file: npc.sprite }));
    const effects = (loadConstants(join(constants, 'Effects.ts')).EFFECTS as Array<{ name: string; sprite: string; spriteSheetIndex: number }>)
        .map((effect) => ({ name: effect.name, file: effect.sprite, sheet: effect.spriteSheetIndex }));

    return { files, items, monsters, npcs, effects };
}
