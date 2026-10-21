---
name: anadir-mapa
description: Añadir un nuevo mapa de caza al juego (con su recorte del .amd, oleadas, eventos, minijefes, jefe final, dificultad y desbloqueo en Select Map), o terminar uno que sale como "Coming soon". Úsala cuando el propietario pida "añade el mapa X", "nuevo mapa", "abre Icebound", "que Y sea jugable" o "cambia los monstruos del mapa Z".
---

# Añadir un mapa de caza

Reglas (Fase 22):
- Cada mapa vive en `survivors/src/data/maps.ts` (**el orden del objeto es el de Select Map y el del desbloqueo**) y su línea de tiempo en `survivors/src/data/waves.ts` → `TIMELINES`.
- Desbloqueo: ganar el mapa anterior **o** llegar a su `recommendedLevel`. No hay que tocar `MapUnlockStore`.
- La dificultad (`difficulty.hp` / `.damage`) solo afecta a los monstruos normales; los jefes llevan su vida propia.
- Música: `MUSIC.normal` en todos (decidido el 20-oct-2026) salvo que el propietario diga otra.
- Textos del juego en inglés (regla 9). Números de diseño solo en `data/` (regla 4).

Antes de empezar: lee `survivors/PROGRESS.md` y `survivors/NOTES.md` → "Varios mapas y Select Map (Fase 22A)", "Carga por mapa y tiempos de carga (Fase 22B)" y el último mapa añadido ("Middleland (Fase 22E)"). Presenta un plan corto con **monstruos, jefes, minutos, dificultad y duración** y espera el OK: el propietario elige monstruos y jefes.

## Investigar primero (subagente, solo el resumen)
- **Monstruos del original en ese mapa:** `<mapa>.txt` de centuu/HelbreathServer (`Files/GameServers/<Mapa>/MAPDATA/`, `spot-mob-generator` y aleatorios) y `reference/Server.cpp` (`MobGenerator`). Propón la lista; el propietario decide.
- **Archivos:** `sp-client/public/assets/maps/<nombre>.amd` (mira su tamaño en casillas y MB) y su minimapa `sp-client/public/assets/images/minimaps/<nombre>.jpg`.
- **Monstruos que aún no existen** en `data/enemies.ts`: añádelos antes con la skill `anadir-enemigo`.

## Pasos, en este orden
1. **Elegir la zona de juego** con el visor http://localhost:8090/maps.html (`survivors/maps.html`): ventana de 100×100 (mapa pequeño) o 150×150 con **≥ 85% libre** y todo conectado. Apunta `x`, `y` y el % en el comentario del mapa.
2. **Assets** en `survivors/src/config/assetManifest.ts`, junto a los otros mapas:
   - `'map.<id>': { file: 'maps/<nombre>.amd' }`
   - `'minimap.<id>': { file: 'images/minimaps/<nombre>.jpg' }` (es también la miniatura de Select Map).
3. **Jefes con otro id** si el monstruo ya existe como normal o como jefe de otro mapa (`hellhoundBoss`, `mountainGiantBoss`, `ettinRegular`): copia la definición en `data/enemies.ts` con otro id para no cambiar el original. Fija su vida aquí.
4. **El mapa** en `data/maps.ts` (`MAPS_DATA`), en su sitio del orden.
5. **Oleadas y eventos** en `data/waves.ts`: `const <ID>_WAVES` y `<ID>_EVENTS`, y la línea en `TIMELINES`. El último evento es `kind: 'finalBoss'`.
6. **Logros** en `data/achievements.ts`: `win<Mapa>` (`goal: { kind: 'win', map: '<id>' }`) y `kill<Jefe>` del jefe final.
7. **Atajos y checks**:
   - Añade el id a la lista del comentario de `?map=` en `src/config/debugStart.ts`.
   - En `scripts/check.mjs`, las situaciones `<mapa>`, `<mapa>boss`, `levelpace<mapa>` y `loadtime<mapa>`, copiando las de Middleland.
8. **What's new**: una línea en `data/releaseNotes.ts` (la añade el `/checkpoint`).
9. **Notas**:
   - `survivors/NOTES.md`: sección "<Mapa> (Fase N)" con monstruos, jefes, zona, MB y lo medido.
   - `survivors/PROGRESS.md`: las situaciones nuevas en "Cómo probar".

## Ejemplo mínimo (Middleland, Fase 22E)
```ts
// data/maps.ts
// Bloque 22E (21-oct-2026). Ventana de 150×150 con un 94% libre (el mapa entero es enorme, 524×524).
middleland: {
    name: 'Middleland', asset: 'map.middleland', size: { width: 524, height: 524 }, minimap: 'minimap.middleland', playArea: { x: 36, y: 274, width: 150, height: 150 },
    localEnemies: ['werewolf', 'troll', 'ogre', 'cyclops', 'stalker', 'ettinRegular'],
    bosses: ['mountainGiantBoss', 'giantLizard', 'ettinBerserk', 'unicorn'],
    recommendedLevel: 40, difficulty: { hp: 1.6, damage: 1.6 }, music: MUSIC.normal,
    description: 'The battlefield between the two cities.',
},

// data/waves.ts
const MIDDLELAND_WAVES: readonly WaveDef[] = [
    { fromMinute: 0, enemies: [{ enemy: 'orc', weight: 5 }, { enemy: 'zombie', weight: 4 }, { enemy: 'scorpion', weight: 2 }], startInterval: 1.3, endInterval: 0.9, batchSize: 2, maxAlive: 100 },
    // ... una oleada por minuto, cada vez más rápida y con más vivos (maxAlive 100 → 280) ...
];
const MIDDLELAND_EVENTS: readonly WaveEventDef[] = [
    { atMinute: 2.5, kind: 'stampede', enemy: 'zombie', count: 30, message: 'Horde approaching!' },
    { atMinute: 4, kind: 'boss', enemy: 'mountainGiantBoss', message: 'A Mountain Giant comes down!' },
    { atMinute: 7, kind: 'surround', enemy: 'skeleton', count: 24, message: 'The dead rise around you!' },
    { atMinute: 15, kind: 'finalBoss', enemy: 'unicorn', message: 'The Unicorn charges!' },
];
// en TIMELINES:
    middleland: { waves: MIDDLELAND_WAVES, events: MIDDLELAND_EVENTS },
```
Referencias de duración y dificultad: Traveler Zone 8 min ×0,7/0,6 · Bleeding Isle 12 min ×1 · Elvine Garden 12 min ×1,3 · Middleland 15 min ×1,6.

## Errores típicos
- **Mapa sin línea de tiempo** en `TIMELINES` y sin `comingSoon: true`: `waves.ts` lanza un error al cargar y no arranca nada.
- **Olvidar `size`**: sin el tamaño del `.amd` el minimapa y la miniatura salen mal recortados.
- **Cambiar un monstruo compartido** para hacerlo jefe: cambia también los otros mapas. Usa una copia con otro id.
- **Esbirros del jefe:** van en `BOSS_MINIONS` (`data/enemies.ts`). Así entran en la cola de descargas del mapa con su jefe (`AssetStreamer`). Si un monstruo no sale ni en oleadas, ni en eventos, ni en `BOSS_MINIONS`, no se descarga. Con F1 se ven los pendientes.
- **Zona de juego con agua o islas sueltas**: los enemigos se atascan (no hay búsqueda de caminos). Mejor menos % libre pero todo conectado.
- **Mapas enormes** (Middleland, 524×524): la carga ya baja solo la zona de juego (`HBMap.requiredTileIndices`). Si un mapa pesa más de ~17 MB, mira la zona antes de culpar al código.
- **`?play` sin `?map`** siempre es Bleeding Isle: para probar el mapa nuevo usa `?map=<id>`.

## Verificar
1. `pnpm --dir survivors exec tsc --noEmit`.
2. `pnpm --dir survivors check <mapa> <mapa>boss` (sin errores de consola; el jefe final sale con sus esbirros).
3. `pnpm --dir survivors check levelpace<mapa>`: Power al final y segundos que dura cada jefe (`.check/levelpace.json`). Compáralo con el mapa anterior: debe ser más difícil, no imposible.
4. `pnpm --dir survivors check loadtime<mapa> --mobile`: MB y segundos de la carga del mapa. Apúntalos en NOTES.md.
5. `pnpm --dir survivors check mapsall`: la tarjeta en Select Map con nombre, miniatura y Level (mira la captura).
6. Dile al propietario cómo probarlo: `pnpm --dir survivors dev` → http://localhost:8090/?map=<id>&play=warrior, o el menú con `?maps=all` → Play → Select Map.
