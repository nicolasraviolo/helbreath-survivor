# Progreso de Survivors

Léelo solo en sesiones de Survivors (después de `PROGRESS.md`). Plan: `docs/PLAN.md` (fases 0–10) y `docs/PLAN-2.md` (11 en adelante). Detalle de cada bloque hecho: `PROGRESS-historial.md` (grep). Situaciones del `check` y atajos: `CHECK.md` (grep).

## Estado
- **Ninguna fase en curso** (en pausa mientras se hace Helbreath Off). Última: Fase 30 ✅ (28-oct-2026, etiqueta `fase-30`).
- **Siguiente:** Fase 31, Aresden y Elvine (`docs/PLAN-2.md`), salvo que el propietario pida otra cosa. Después: 32 Raids, 33 Ranking, **34 Arquero** (diseñado el 4-nov-2026, `docs/DESIGN.md` "Arquero"). El Summoner, aparcado en PLAN-2 "Ideas para después".
- **Hecho fuera de fase** (todo ✅ y en `master`; detalle en el historial): requisitos, hachas y martillos (25–26-oct) · ataques de los monstruos como el original (30-oct) · Barracks, vida y maná por tandas (31-oct) · revisión del original A–D: golpe en abanico, fallar golpes, botín con valores, tintes (31-oct–1-nov) · cartas de poder y magias de los monstruos (1-nov) · elementos y quemadura, números de daño nuevos (4-nov).
- **Probado por el propietario (4-nov-2026):** todo lo anterior salvo los pendientes de abajo, la Fase 25 en Steam Deck / Legion Go, y un mando real.

## Pendiente y aplazado
- Mapas aplazados de la 30: Dungeon L4 (Level 70; sala de 60×60, jefe Dragon, minijefe Demon) y Druncian City (Level 85), cada uno con sus únicos en `MAP_UNIQUES` (PLAN-2, "Fase 30"); Farm, para las Raids.
- Aplazados: 21C (anillos y collares); récords locales (22F, "Ideas para después").
- Ideas de la 24: ampliar el baúl en Howard y logros que den oro. Sin fecha: jefes más difíciles de esquivar (nota en `data/defense.ts`). Aparcada: fuego, veneno y sangrado con efectos distintos (DECISIONES.md, 4-nov-2026).
- Menores de la revisión de la 26: objetos nuevos al arrastrar el botón de la Maga y en cada lanzamiento; código muerto (`IceShardRain.chill`, comentario viejo en `RunSnapshot`, `case 'spelldrag'` vacío).
- Equilibrio de los hechizos de 26E (a criterio de Claude): revisar con métricas o `pnpm balance` si la Maga de Int alta va corta o sobrada. La Maga sigue por detrás del Guerrero (revisión de dificultad del 22-oct: https://claude.ai/artifact/Xk8DCaCytHNP1yASM2sFBV).
- A vigilar: demasiadas marcas de hechizo en Middleland con tantos Cyclops. Magias de monstruo dudosas sin hacer: Mage-Orc, Beholder, Rudolph, Ice Golem. Fencing sigue apagada.

## Reglas de Survivors
- **Level** permanente (máx. 140): recibe **toda** la EXP de la partida, ganes o mueras; si sales, espera guardada con la partida (M4). El nivel de la partida se llama **Power** en todos los textos.
- Puntos: 3 por Level, ninguno al crear; se reparten **solo** en la ventana Character ("Level Set." o C). En partida, C pausa y solo se mira.
- Esquiva y resistencia: siempre **% generales**, nunca contra un monstruo; esquiva sin "Miss", resistencia con "Resist".
- Personajes **fijos**: Gorn y Kaila en todas las cuentas; huecos 3 y 4 bloqueados para el futuro. Una partida guardada por personaje. En el menú solo Play: al elegir el personaje se continúa (en el mapa de su partida) o se empieza de nuevo (pasando por Select Map). New Run en "Saved Run" lleva a la ciudad.
- Equipo: **solo lo que tienes** (equipo de salida + inventario; hechizos libres por Int); requisitos del original con stats **permanentes** y Level. Al continuar una partida mandan el arma y los hechizos equipados ahora. Morir sin Zem = se pierde la mitad del botín de esa partida (redondeando en contra); con Zem, nada (24A). El oro nunca se pierde. Las armas y armaduras normales no caen: se compran a Tom.
- Mapas: Traveler Zone → Bleeding Isle → Elvine Garden → Middleland → Icebound; se abren al ganar el anterior o con su Level (1/10/25/40/…). Champion: usa las oleadas de cada mapa y nunca sale después del jefe final (en Traveler Zone, antes del minuto 7).
- Abaddon's Blood: mejora **permanente** para los personajes, no un objeto; revive una vez por partida.
- Clave de guardado nueva → **añadirla a `TRANSFER_KEYS`** (`config/transfer.ts`) y **volver a publicar el servidor** (`pnpm --dir survivors exec wrangler deploy --config metrics-server/wrangler.toml`): el publicado rechaza las claves que no conoce.

## Pistas para trabajar
Cada línea: dónde está el código y la sección de `NOTES.md` (grep por el título).
- Carga: antes del menú solo lo de los menús; cada mapa baja lo suyo (`MapLoadScene`, `RUN_SPRITES`, `runSprites`); ropa y armas bajo demanda salvo `UPFRONT_LOOK_SPRITES`; medir con `check loadtime`. "Carga por mapa y tiempos de carga".
- Pantalla completa y modo móvil (25): `ui/fullscreen.ts` (`?app=1`), `config/device.ts` (`any-pointer: fine` = modo PC). "Pantalla completa y consolas (Fase 25)".
- Ciudad y NPCs: `data/town.ts`, `scenes/TownScene.ts`, `NpcDialogScene`, `entities/Npc.ts`, `MapLoadScene` con `{ town: true }`. "La ciudad (Fase 23A)", "NPCs y hablar (Fase 23B)".
- Mapas: `data/maps.ts`, `data/waves.ts` → `TIMELINES`, `systems/MapUnlockStore.ts`, `MapSelectScene`, `MapLoadScene`; visor http://localhost:8090/maps.html. Mapa nuevo: skill `anadir-mapa`. Icebound y `fillGroundHoles` (`hb/mapRenderer.ts`): "Icebound (Fase 30A)".
- Sombras: `BODY_SHADOW_*`, `Player.syncShadow`, óvalo `GROUND_SHADOW` si `hasShadow: false`. "Sombras del jugador y los monstruos (Fase 22G)".
- Únicos: `data/uniques.ts` (`MAP_UNIQUES`), `systems/UniqueStore.ts`, `GameScene.rollUnique`, `systems/IceStormField.ts`. "Objetos únicos (Fase 30B)".
- Rescates y Guards: `data/rescues.ts`, `systems/RescueSystem.ts`, `RescueStore`. "Rescates y Guards". Missions: `scenes/MissionsScene.ts`.
- Logros: añadir a `data/achievements.ts` (metas `killTotal`, `rescue`); `AchievementTracker`, `AchievementStore`. "Logros".
- Champion: `data/champion.ts`, `SpawnSystem.runDueChampion`. "Evento Champion (Fase 21½C)".
- Cartas: `systems/UpgradePool.ts`, `data/passives.ts`, `LevelUpScene`; rareza en `data/cardRarity.ts`; Reroll y Skip en `data/rerollSkip.ts`. "Cartas de poder en vez de Blessings", "Rareza de las cartas (Fase 21½A)", "Reroll y Skip (Fase 21½B)".
- Magias pasivas (aura, dagas, angelitos): `data/passiveMagic.ts`, `systems/PassiveMagicSystem.ts`. "Magias pasivas de la partida (Fase 28)".
- Hechizos del Mago: automáticos en `data/spells.ts` (`SpellWeapon`), activos en `data/activeSpells.ts` (`ActiveSpellSystem`), libro en `MANUAL_SPELL_IDS`. "Hechizos equipables del Mago (Fase 20D)", "Meteor Strike".
- Elementos y quemadura: `data/elements.ts` (`BURN`). Números de daño: ver historial (4-nov-2026).
- Monstruos: ataques del original en `MONSTER_AI` (`data/enemies.ts`), `originalAttackIntervalMs`; movimiento en `data/movement.ts`, `Enemy.pickHeading`, `systems/ChargeWarnings.ts`; oleadas en `SpawnSystem`; élites en `data/elites.ts`; sus magias: "Magias de los monstruos del original".
- Golpes y armas: "Golpe normal igual para todas las armas", "Fallar golpes y vida que crece con los minutos" (`data/accuracy.ts`), "Hachas: giro en torbellino", "Martillos: golpe al suelo y grieta". Estela del tajo: `data/slash.ts`.
- Crit y mando: `systems/CritStrikeSystem.ts`, `systems/Rumble.ts`. Apuntado: `systems/Targeting.ts`. Esquiva y resistencia: `data/defense.ts`.
- Botín y atributos: `data/loot.ts`, `systems/LootRoller.ts`, `LootSystem`, `data/attributes.ts`, `data/wands.ts`. "Botín en partida (Fase 21A)", "Botín con valores y segundo atributo", "Atributos y varitas (Fase 21B)".
- Oro, tienda, herrero, mejoras y tintes: `data/gold.ts`, `data/shop.ts`, `data/smith.ts`, `data/upgrades.ts`, `data/dyes.ts` y sus escenas. "Tienda (Fase 24B)", "Mejorar armas en el herrero (Fase 24D)", "Tintes de la ropa".
- Baúl, Zem y "solo lo que tienes": `data/consumables.ts`, `data/warehouse.ts`, `WarehouseStore`, `isFreeItem`. "Baúl, "solo lo que tienes" y Zem (Fase 21D)". Abaddon's Blood: `data/abaddon.ts`, `systems/AbaddonRevive.ts`.
- Personaje: Level en `data/characterLevel.ts`, `CharacterInfoScene`; equipo en `data/items.ts`, `EquipmentScene`; sobre el cuerpo en `data/paperDoll.ts`. Guardado: `CharacterStore` / `SaveStore`. Transfer Save: `config/transfer.ts`, `systems/TransferClient.ts`.
- Barracks: `data/training.ts`, `systems/TrainingGround.ts`, `ui/TrainingPanel.ts`. Vida y maná por tandas: `systems/RegenTicker.ts`, `HUD_EVENT_LIST`. "Regeneración por tandas".
- Sprites suaves: `hb/XbrPipeline.ts` (`smoothSprite`). Settings: `scenes/SettingsScene.ts`. Pantalla de carga: `PreloadScene`.
- Equilibrio: `data/leveling.ts`, `data/enemies.ts`, `data/stats.ts`, `WaveDef.damage`, `MONSTER_HP_BONUS`; medir con `check levelpace` y `pnpm balance` (bot irregular: repetir). "Partida simulada y equilibrio", "Revisión de la dificultad". Engagement: `docs/ENGAGEMENT.md`.
- Métricas: https://helbreath-survivors-metrics.nicolasraviolo.workers.dev (clave en `metrics-server/.dev.vars`). "Métricas".
- Assets propios: `survivors/custom-assets/`. Temblor: `data/feedback.ts`. What's new: `data/releaseNotes.ts`.

## Problemas conocidos de Survivors
- Una vez (19-oct-2026), al **continuar** una partida, no salió ningún jefe y solo algunos monstruos; no se reprodujo. Sospecha: descarga de sprites atascada. Si se repite: F1 → monstruos pendientes de descarga (`AssetStreamer`).
- La partida simulada a veces falla (jefe atascado que vive hasta el final; descartarlas). Con el guerrero sale muy irregular: repetir y usar la mediana.
- Enemigos atascados tras un obstáculo si el jugador está al otro lado (sin búsqueda de caminos). Se recolocan si quedan lejos.
- Las flechas "→" de las cartas salen en otra fuente. A 800×600 el personaje se ve pequeño. No molestan.
