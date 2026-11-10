# Plan de Helbreath Off

Variante "offline" de Helbreath dentro del mismo proyecto que Helbreath Survivors. Al arrancar, el jugador elige a qué juego jugar.
La idea es repetir el ciclo del original: cazar en los pits, subir de nivel, repartir puntos, equiparse y comprar magias. Es más simple que el original, pero conserva lo esencial. Se juega con ratón y teclado (como el original) y también con mando.

Plan aprobado en líneas generales el 6-nov-2026 (ver DECISIONES.md).

## Cómo funcionaba el original (resumen de la investigación del 6-nov-2026)

- **`sp-client` solo dibuja y mueve.** Tiene mapas, andar con colisiones, ropa por capas, golpes, efectos de hechizos, inventario y botín en el suelo. **No tiene reglas**: ni experiencia, ni niveles, ni stats, ni precios, ni monstruos que aparezcan solos. Los controles son solo de ratón: clic para andar, clic en un monstruo para atacar, clic derecho para cancelar.
- **Las reglas reales están en `reference/Server.cpp`** y en las tablas `reference/Item*.cfg` y `reference/Magic.cfg`:
  - Experiencia para el nivel L: `exp(L) = exp(L-1) + L × (50 + L × (L/17)²)` (divisiones enteras). Hacen falta 2.700 para el nivel 10, 502.032 para el 60 y **33.396.014 para el 140**.
  - **3 puntos por nivel.** El personaje empieza con 70 puntos repartidos entre los 6 stats.
  - Vida = VIT×3 + Level×2 + STR/2 · Maná = MAG×2 + Level×2 + INT/2 · Estamina = STR×2 + Level×2.
  - Al subir de nivel, la vida, el maná y la estamina se llenan.
  - Cada magia tiene un **INT mínimo y un precio en oro**. Ejemplos: Magic Missile pide INT 18 y cuesta 100; Energy Bolt, INT 24 y 200; Fire Ball, INT 26 y 500.
  - **Pits** (`spot-mob-generator`): cada mapa tiene rectángulos con un tipo de monstruo y un máximo de monstruos vivos. Al morir uno sale otro hasta llegar al máximo. Las coordenadas de cada mapa no están en el repo, así que las colocamos nosotros.
- **Survivors ya tiene piezas reutilizables:** la ciudad con NPCs y diálogos, la tienda (Tom), el herrero, el baúl, la pantalla Equipment, el reparto de puntos (CharacterInfo), el oro, la ropa por capas, el soporte de mando con menús por cruceta y la carga por mapa.

## Cómo lo simplificamos

| Original | Helbreath Off |
|---|---|
| Decenas de mapas | **Traveler Zone** (inicio), **tu ciudad** (recorte pequeño con tiendas) y **su Farm**. Más adelante, una mazmorra para nivel alto |
| 6 stats | **5**: STR, VIT, DEX, INT, MAG (sin CHR) |
| 12 huecos de equipo | **8**: arma, escudo, casco, armadura, pantalones, botas, capa y anillo |
| Unas 80 magias | **Unas 12** en 4 círculos, compradas en la tienda de magia (INT mínimo + oro) |
| Morir te quitaba objetos y experiencia | Vuelves a tu ciudad y pierdes un poco de experiencia (sin bajar de nivel) |
| Nivel máximo 140 | **140**, con un **multiplicador de experiencia** en `data/` para subir más rápido |
| PK, gremios, misiones | Fuera de momento |

## Recorrido del jugador

1. **Crea su personaje** y aparece en **Traveler Zone**, en los pits de monstruos fáciles.
2. Sube un par de niveles allí.
3. En Traveler Zone hay **dos portales: Aresden y Elvine**. Al entrar en uno sale una confirmación: *"Do you want to join Aresden?"* (o Elvine).
4. Si acepta, el personaje **queda unido a esa ciudad para siempre**. Desde entonces su ciudad es esa, al morir vuelve allí y siempre caza en **su Farm** (`arefarm.amd` / `elvfarm.amd`).

## Controles

- **PC, como el original:**
  - Clic para andar y clic en un monstruo para atacar. Shift corre.
  - F1–F8 lanzan las magias: eliges la magia, el personaje la prepara, haces clic en el objetivo, y el clic derecho cancela.
  - Teclas para abrir inventario, personaje y libro de magias.
- **Mando:**
  - **Moverse:** stick izquierdo, de forma directa.
  - **Atacar:** A golpea al objetivo marcado; si no hay ninguno, al monstruo más cercano. LB/RB cambian de objetivo.
  - **Magias:** RT + A/B/X/Y lanza 4 magias rápidas sobre el objetivo marcado. Se eligen en el libro de magias.
  - **Menús:** Start abre inventario, personaje y magias, y se recorren con la cruceta, como en Survivors.

## Fases

Cada fase se hace por bloques, uno por sesión, y se espera el OK del propietario antes de pasar a la siguiente. El código va en `survivors/src/off/` y comparte `hb/`, los assets y el sistema de mandos con Survivors. Las partidas se guardan con claves propias (`hb-off.*`), que también hay que añadir a `TRANSFER_KEYS`.

- **Off-0 · Elegir juego:** pantalla al arrancar con "Helbreath Survivors" y "Helbreath Off". Off empieza con una escena vacía. **Oculto** (6-nov-2026): la pantalla de elegir juego solo sale con `?off` en la dirección; sin él, el juego arranca directo en Survivors como hoy, también en la versión publicada. Off se fusiona en `master` escondido, tras comprobar con `tsc` y `pnpm --dir survivors check` que Survivors sigue bien.
- **Off-1 · Andar por el mundo:** Traveler Zone sin oleadas ni tiempo. Se anda con clic y con stick, con colisiones y cámara. ✅ (6-nov-2026: casilla a casilla como el original, novato genérico, R / R3 alternan correr y andar).
- **Off-2 · Pits y combate:** los pits van en `data/` (rectángulo, monstruo y máximo) y se reponen solos. Golpear, monstruos con su IA, experiencia con la curva original × multiplicador, subir de nivel, morir y reaparecer. ✅ (6-nov-2026: Slimes y Rabbits, Dagger fija, experiencia ×2 entera al matar, HUD de Survivors, guardado `hb-off.character`).
- **Off-3 · Personaje:** se **reutiliza** el reparto de puntos de Survivors y la pantalla Equipment. Fórmulas originales de vida, maná y estamina. **Al seleccionar un objeto sale un cuadro con sus stats** (daño o defensa, requisitos y atributos), comparado con el que llevas puesto. ✅ (7-nov-2026: crear personaje, ventana Character, Equipment con cuadro de stats).
- **Off-4 · Objetos:** inventario, botín al suelo y recogerlo, requisito de STR para equipar, oro, tienda y herrero (reutilizados). ✅ (7-nov-2026: botín con las probabilidades del original, recoger al pisar, inventario 10 × 5 que no pausa, máx. 20 pociones, pausa con Esc / Start; **la tienda y el herrero pasan a la Off-5**).
- **Off-5 · Bandos:** los dos portales de Traveler Zone con su confirmación. Se elige el bando una vez y para siempre. Aresden y Elvine con sus tiendas y almacén. **Sin Farm** (7-nov-2026): la 5C carga la ciudad entera con sus 8 pits repartidos en escalera (1 Slime, 2 Giant Ant, 2 Snake, 2 Orc, 1 Giant Scorpion). Bloques: 5A portales y ciudades ✅, 5B tienda, herrero y almacén ✅, 5C la ciudad entera y sus pits ✅. ✅ (7-nov-2026: 8 monstruos por pit, experiencia ×0,025, solo se dibujan los objetos del mapa cerca de la cámara).
- **Off-6 · Magias:** tienda de magia, libro de magias, atajos F1–F8 y RT + botones, maná y tiempo de preparación. Bloques: 6A aprender ✅, 6B lanzar ✅, 6C curar, escudos, paralizar y mando ✅. ✅ (8-nov-2026: 14 magias de Magic.cfg, teclas 1–8 en vez de F1–F8, fallar según MAG y nivel, elementos de Survivors, escudos con aura bajo los pies; Off no irá al móvil).
- **Off-7 · Promiseland y cierre:** (8-nov-2026: Promiseland en vez de la mazmorra `aresdend1` / `elvined1`). Bloques: 7A Promiseland (el teleport de la ciudad deja elegir mapa; Elvine llega arriba, Aresden abajo; 12 pits del original; oro de Nemesis), 7B pociones rápidas (Q / E, cruceta) y botín con atributos como Survivors, 7C acierto (habilidad = DEX × 2) y crítico simple ✅, 7D medir y ajustar experiencia, botín, oro, magias y Promiseland, 7E guardado y pulido. ✅ (8-nov-2026: armadura y pits como el original, experiencia ×0,02 = 3,5 h hasta el 60, el clic busca camino, dos manos sin escudo, vuelves donde lo dejaste).

- **Off-8 · Critical Strike y mercenarios** (plan del 8-nov-2026, ver DECISIONES.md). Bloques:
  - **8A Critical Strike con cargas ✅** (8-nov-2026; Alt / LT), como Survivors: 1 + nivel/10 cargas, +1 cada 15 s y +1 cada 15 golpes recibidos; daño × (2 + nivel/30), con grito y número grande. Se lanza con Alt o un botón del mando y se ve en la esfera roja del HUD. **El crítico pasivo de la 7C se queda**: son dos cosas distintas.
  - **8B Guerrero mercenario y la Store ✅** (8-nov-2026): un NPC de la ciudad lo contrata con oro. **Un mercenario a la vez.** Hace de tanque, con daño medio y equipo según tu nivel. Te sigue si te alejas y aparece a tu lado si te alejas muchísimo. Si cae, queda **inconsciente 45 s** y se levanta. Puedes curarle y lanzarle tus magias de apoyo.
  - **8C Maga mercenaria y la magia Berserk ✅** (8-nov-2026): Kaila lanza Heal / Great Heal, Defense Shield, PFM, Berserk, Paralyze, Hold Person y magias de daño según su INT; Berserk en la tienda (golpes ×2, 40 s). Además: Paralyze aguanta los golpes como el original y los mercenarios recogen el botín olvidado.
  - **8D Frases y detalles ✅** (8-nov-2026; Gorn pega por detrás solo con Paralyze, que no se rompe al golpear): con poca vida dice frases ("Heal me!", "Zerk me!"...). Contra un monstruo paralizado, el Guerrero le pega por la espalda. El mercenario contratado se guarda.
  - **8E Huir, poción y recuperar vida ✅** (8-nov-2026; ajustado por el propietario tras probarlo): el mercenario recupera vida como un jugador (una tanda cada 15 s, también peleando, número verde). **Poción propia** que se rellena a los 60 s, **sin icono**: bajo el 30 % se la bebe, cura el 40 % de su vida y dice "I drank my potion!". **Sin poción huye** bajo el 25 % ("Heal me!", lejos de los monstruos y hacia ti) y vuelve a pelear al pasar del 50 % o tras 8 s sin que nadie lo persiga. Kaila igual, pero solo huye sin maná para curarse.
- **Off-9 · Raiders** ✅ (plan del 8-nov-2026; cerrada el 10-nov-2026 tras probarla el propietario). Los Raiders usan **el mismo cerebro que los mercenarios**, en el bando contrario. Bloques:
  - **9A Aparecer y atacar ✅** (9-nov-2026; ajustes del propietario: estamina y huida corta, sin avisos, "Enemy Kill!!", Mago que paraliza y lanza de lejos, Guerrero con Critical Strike, golpes que interrumpen magias, sin barra de vida): 1 o 2 personajes de la otra ciudad (Guerrero o Mago, nombre en rojo), de nivel parecido al tuyo; si son dos, cada uno algo más flojo. **Solo en Promiseland**, al azar. Van a por ti y a por tu mercenario. Al morir sueltan **oro** y nada más por ahora.
  - **9B Invisibles y Enemy Kills ✅**: a veces llegan invisibles hasta que atacan. Cada uno que matas da **+1 EK**; se guarda y sale en la casilla "Enemy Kills" de la ventana Character. Más adelante desbloquearán cosas.
  - **9C Medir y ajustar ✅** (9-nov-2026): peleas de prueba `check offduel*` (niveles 10/30/50 × Guerrero, Mago, pareja, invisible). Una tirada cada 12 min; fuerza por nivel (`OFF_RAIDER_POWER`); Mago más alcanzable. Las pociones no se tocan: un Raider solo te mata si te quedas sin pociones o te pilla bajo.

- **Off-10 · Las Farms como centro** (plan del 9-nov-2026, ver DECISIONES.md). La ciudad no se toca. Bloques:
  - **10A Farms con vendedores**: `arefarm.amd` / `elvfarm.amd` enteras, con Shop Keeper, Tom, Howard y William de pie, que abren las ventanas de la tienda, el herrero, el almacén y los mercenarios.
  - **10B Pits de las Farms**: los del original (sin Crop), con un Snake cambiado por Orc en cada Farm.
  - **10C La Farm como casa**: unirse al bando, Play y morir llevan a tu Farm; su teleport ofrece City, Traveler Zone y Promiseland; el de la ciudad añade Farm; las puertas de Promiseland llevan a tu Farm.
  - ✅ (9-nov-2026: 10A–10C; Play sigue volviendo donde lo dejaste, el portal de tu bando en Traveler Zone también lleva a la Farm, y el teleport abre una Select Map como la de Survivors).

- **Off-11 · Varitas y magias de círculos altos** (plan del 9-nov-2026, ver DECISIONES.md). Bloques:
  - **11A Varitas**: las 12 del original (fuera Resurrection y M.Shield); se lanza con varita; ahorran maná; Tom vende 5, las raras caen de los monstruos. ✅ (9-nov-2026).
  - **11B Círculos 6–7** con dibujos de Survivors: Lightning Bolt, Mass Lightning Arrow, Ice Strike, Energy Strike, Mass Chill Wind y Absolute Magic Protection (Kaila la usa en vez de Protection From Magic). Propietario (9-nov-2026): también **Lightning Strike** y **Earth Shock Wave** (en la tienda, 50.000 de oro, INT 190); Kaila aprende Lightning Bolt y Energy Strike. ✅ (9-nov-2026).
  - **11C Círculos 8–10** con dibujos de Survivors: Mass Ice Strike, Meteor Strike, Mass Magic Missile y Blizzard. Propietario (9-nov-2026): Mass Magic Missile estalla con Explosion 3; Kaila aprende las cuatro. ✅ (9-nov-2026).
  - **11D Magias sin dibujo** (copiar de sp-client): Spike Field, Cloud Kill, Mass Poison, Earthworm Strike, Armor Break. **Pendiente:** el propietario cerró la Off-11 sin él (9-nov-2026).
  - Mass Fire Strike, Bloody Shock Wave, Ice Storm y Haste: libros que caen muy poco (Earth Shock Wave pasó a la tienda en la 11B). Fuera: Confusion, Illusion, Cancellation, Inhibition Casting, Scan, Resurrection.

- **Off-12 · Rediseño de ventanas** (plan del 10-nov-2026, ver DECISIONES.md). Un estilo propio, cerca del original pero moderno (maqueta v3: fondo oscuro, bordes de bronce, esquinas doradas, Alegreya), que luego se llevará al resto de ventanas. Inventory, Equipment, Character y el libro de magias se juntan en **una sola ventana**: el personaje con su equipo siempre a la izquierda y pestañas **Bag / Stats / Magic** a la derecha (Magic solo si sabes alguna magia). Bloques:
  - **12A Estilo base ✅** (10-nov-2026): letras, colores y medidas (`off/config/offTheme.ts`), piezas de dibujo (`off/ui/offUi.ts`) y muestrario `?off=uikit` con aviso de textos que no caben.
  - **12B Ventana nueva con la pestaña Bag**: columna del personaje (muñeco, 8 huecos, barras) y bolsa 10 × 5 con filtros y ficha del objeto en el orden del original; sustituye a Inventory y Equipment.
  - **12C Pestañas Stats y Magic**: repartir puntos con + / − y Confirm; magias por círculos y teclas 1–8, donde **1–4 son también RT + A/B/X/Y** (se unen los huecos del mando con las teclas y se adaptan los guardados).
  - **12D Mando, teclado y repaso**: LB / RB cambian de pestaña, I / C / B abren cada una; repaso de alineado con capturas.
  - Después: el mismo estilo en tienda, almacén, mercenarios, crear personaje, etc.

## Pendiente de decidir más adelante

- **Detect Invisibility** (Magic.cfg: círculo 3, 1.200 de oro; quita la invisibilidad alrededor): para ver a los Raiders invisibles de la 9B (propietario, 9-nov-2026: fuera de la 9B).
- Pasar Off a una **app independiente** que se juegue sin conexión (idea del propietario, 7-nov-2026).

- Qué valor tiene el multiplicador de experiencia: se mide en Off-2 y Off-7.
- Si Survivors usará después la Aresden/Elvine que hagamos aquí (Fase 31 de PLAN-2). Survivors queda en pausa mientras se hace Off.
