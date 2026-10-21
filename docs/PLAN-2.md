# Plan de desarrollo — Segunda etapa (Fases 11+)

> Borrador del 17-oct-2026, reordenado el mismo día con las ideas nuevas del propietario. **Orden aprobado por el propietario el 17-oct-2026.** **Reordenado el 18-oct-2026:** minimapa y tótems pasan a la Fase 16, se añade la selección de personaje (Fase 17) y crits, Zem y todo lo demás corren (16→18, 17→19, 19→20... 25→26). **Reordenado otra vez el 18-oct-2026:** se añade la esquiva y la resistencia mágica (Fase 18) y crits, Zem y todo lo demás corren una fase (18→19 ... 26→27). **Replanteado el 18-oct-2026 (tras cerrar la Fase 18):** el propietario redefine el objetivo a largo plazo: personaje con **Level** permanente y equipo que se conserva entre partidas, botín en partida, baúl compartido, oro y herrero (ver `DESIGN.md`, "Progresión entre partidas"). Nuevas Fases 20 (Level y equipo), 21 (Botín y baúl) y 24 (Oro, tienda y herrero); el Zem cambia de papel y la resurrección pasa a **Abaddon's Blood**; mapas, ciudad y lo demás corren. Las decisiones de cada fase se preguntan al empezarla.
> Continúa `docs/PLAN.md` (Fases 0–10, todas cerradas).
> Mismas reglas que antes: una fase por sesión (`/fase N`), plan corto → OK → código → `/checkpoint`. Las fases marcadas **mini** caben en una sesión corta.

Fuentes de la investigación (17-oct-2026):
- código original en `reference/Server.cpp` y `reference/Client.cpp` (citado como S:línea / C:línea);
- `multiplayer/server/Config/GameWorlds.json`, `sp-client/src/constants/*.ts`;
- la wiki de helbreath.net (servidor Olympia, **no** idéntico al original).
- Lo marcado **[de memoria]** no está comprobado en el código.

---

## Orden de las fases

| Fase | Nombre | Qué incluye | Tamaño |
|---|---|---|---|
| **11** | Pulido de interfaz *(mini)* | Quitar árboles grandes (opción) · How to play en Options y fuera los textos de controles · selección de personaje en el móvil | Pequeño |
| **12** | Móvil sin pérdidas *(mini)* | Instalar como app · guardar la partida y "Continue" | Medio |
| **13** | Jefe final y equilibrio | El jefe corta las oleadas · portal tras matarlo · curva de XP, oleadas y dificultad | Medio |
| **14** | Métricas y logros | Resumen anónimo de cada partida en un servidor pequeño · primeros logros | Medio |
| **15** | Apuntado híbrido | Automático por defecto; manual con ratón o stick derecho | Medio |
| **16** | Minimapa y tótems | Minimapa · tótems en el mapa que dan buffs | Pequeño-medio |
| **17** | Selección de personaje *(nueva)* | Pantallas de elegir y crear personaje como en el Helbreath original | Pequeño-medio |
| **18** | Esquiva y resistencia mágica *(nueva)* | Probabilidad de que un golpe te acierte según Dex y armadura · resistir hechizos | Medio |
| **19** | Crits y habilidad activa | Guerrero: golpe crítico con cargas · Mago: hechizo activo con recarga · mismo botón · vibración y reasignar controles | Pequeño-medio |
| **20** | Level y equipo *(nueva)* | Level permanente y reparto de puntos · "Power" en la partida · inventario y equipo de salida · hechizos equipables · las cartas dejan de dar armas | Grande |
| **21** | Botín y baúl *(nueva)* | Objetos que caen en partida ("Equip" / "Keep in bag") · Sharp, Ancient y Poison · baúl compartido · Zem y Abaddon's Blood | Grande |
| **21½** | Cartas y sorpresas *(mini, nueva 21-oct-2026)* | Rareza en las cartas de Power · Reroll y Skip · evento "Champion": un monstruo poderoso extra al azar | Pequeño-medio |
| **22** | Sistema de mapas + Icebound | Varios mapas, Select Map, sombras (récords locales aplazados; Icebound a la Fase 25) | Grande |
| **23** | La ciudad | Mapa pequeño tras elegir personaje: NPCs, baúl y portal a la partida | Grande |
| **24** | Oro, tienda y herrero *(nueva)* | Oro en partida · vender · tienda (Zem, pociones, equipo básico, ampliar baúl, **Abaddon's Blood**, **dado y vino**: Reroll y Skip) · mejoras con Xelima y Merien | Medio-grande |
| **25** | Más mapas y objetos únicos | Un mapa por bloque, cada uno con sus únicos | Grande (por partes) |
| **26** | Aresden y Elvine | Elegir bando · objetos Hero con EK | Medio |
| **27** | Raids | "Jugadores" enemigos del otro bando | Medio-grande |
| **28** | Ranking online *(opcional)* | Reutiliza el servidor de la Fase 14 | Pequeño |

**Por qué este orden:**
1. **11–13:** primero lo que arregla molestias que ya existen: visibilidad, controles, partidas perdidas en el móvil, subir de nivel demasiado rápido y un final de partida abrupto.
2. **14:** las métricas, pronto, para que todo lo que venga después se equilibre con datos reales. Los logros van aquí porque cuentan las mismas cosas.
3. **15–20:** mejoras de la partida de hoy, pequeñas y divertidas. El apuntado va antes que los crits porque el crit sale hacia donde apuntas. El 18-oct-2026 el propietario adelantó el minimapa y los tótems (16) y añadió la selección de personaje del original (17). Ese mismo día añadió la esquiva y la resistencia mágica (18), porque el guerrero recibe todos los golpes y le cuesta pasar del Ettin.
4. **19:** el botón activo, antes del equipo, porque el segundo hueco de hechizo del Mago (Fase 20) es justo su habilidad activa.
5. **20–21 (replanteo del 18-oct-2026):** primero la progresión entre partidas, porque cambia qué dan las cartas y cómo se equilibra todo lo que viene después. Mientras no exista la ciudad, el equipo y el baúl se abren desde Select Character.
6. **22–24:** varios mapas (con dificultad según el Level), la ciudad como "centro" del juego y la economía, que necesita sus NPCs (tienda y herrero).
7. **25–28:** contenido que se apoya en todo lo anterior. Los objetos únicos, que alargan el juego más allá de las ~20 h, llegan con los mapas nuevos.

**Dependencias:** la 20 necesita los personajes guardados (17); la 21 necesita la 20; la 23 necesita el sistema de mapas (22); la 24 necesita la ciudad (23) y el botín (21); la 25 necesita la 22 y la 21; la 27 necesita los bandos (26); la 28 necesita el servidor (14). El resto puede moverse si el propietario quiere otra prioridad.

### De dónde viene cada cosa del borrador anterior
| Antes | Ahora |
|---|---|
| 11 Crits | 19. Los iconos del mando en pantalla se cambian por la página How to play (Fase 11) |
| 12 Zem | 20 |
| 13 Minimapa | 16, con los tótems |
| 14 Sistema de mapas + Icebound | 21. La pantalla Select Map se abre desde el portal de la ciudad (Fase 22) |
| 15 Más mapas | 24 |
| 16 Bandos | 25. La opción B (objetos Hero) se apoya en el baúl de la 23 |
| 17 Raids | 26 |
| 18 Leaderboard | Récords locales → 21 · progresión entre partidas → 23 · online → 27 |
| 19 Bolsa ligera | Sustituida por **Equipo y baúl** (23), a petición del propietario |

### Traído de la Fase 10
| Qué | Dónde |
|---|---|
| Vibración del mando, reasignar controles | Fase 19 (Crits) |
| Iconos de botones de Xbox | Fase 11, **solo dentro de How to play** (el propietario quiere la partida sin textos de controles) |
| Sombras bajo personajes y monstruos | Fase 22 |
| Récords locales | Ideas para después (aplazado el 21-oct-2026) |
| Progresión entre partidas | Fases 20 y 21 |
| Límite de enemigos en el móvil | Fase 27 (Raids), o antes si el móvil va lento |
| Equilibrio | Fase 13, y repaso al cerrar cada fase de combate |

### Replanteo del 18-oct-2026 (tras cerrar la Fase 18)
| Antes | Ahora |
|---|---|
| 19 Crits (Maga sin crits o "Critical Cast") | 19 Crits y habilidad activa: la Maga lanza su **hechizo activo** con el mismo botón |
| 20 Zem: la resurrección | Se divide. El **Zem** protege el botín al morir (21C). La **resurrección** pasa a **Abaddon's Blood** (21C) |
| 21 Sistema de mapas + Icebound | 22 |
| 22 La ciudad | 23 (con Howard, tienda y herrero activos) |
| 23 Equipo y baúl | Se amplía en **20 (Level y equipo)** y **21 (Botín y baúl)** |
| — | **24 Oro, tienda y herrero** (nueva) |
| 24 Más mapas | 25, con objetos únicos por mapa |
| 25 Aresden y Elvine · 26 Raids · 27 Ranking | 26 · 27 · 28 |

---

## Fase 11 — Pulido de interfaz *(mini)*

### Árboles grandes
- **Qué pide el propietario:** quitar los árboles grandes desde Options para ver mejor.
- **Situación:** el juego ya distingue qué objetos del mapa son árboles (`isTreeSpriteIndex` en `hb/HBMap.ts`, que usa `hb/mapRenderer.ts` para sus sombras).
- **Propuesta:** opción **"Large trees: On / Transparent / Off"** en Settings. "Transparent" imita al original, que volvía transparentes los árboles cerca del jugador. Al quitarlos se quita también su sombra. Los muros y las casas no cambian.

### How to play y fuera los textos de controles
- **Qué pide:** quitar de la partida y de los menús las referencias a teclas y mandos (por ejemplo, el texto "← → and Enter · D-pad or stick and A · Click" de las cartas de nivel).
- **Propuesta:**
  - quitar esos textos en todas las escenas;
  - página nueva **"How to play"** en Options, con tres apartados cortos: **Keyboard & mouse**, **Gamepad** (con los iconos de Xbox) y **Touch**;
  - un párrafo corto de "cómo se juega": muévete, las armas atacan solas, recoge las gemas, elige cartas, sobrevive y mata al jefe.
- Al añadir controles nuevos (apuntado, crit, tótems...), se añaden **aquí** y no en pantalla.

### Selección de personaje en el móvil
- **Propuesta:** antes de tocar nada, sacar capturas con `pnpm check --mobile` y apuntar qué falla (tamaño, botones que no caben, textos pequeños). Después, adaptarla como se hizo con el resto en la Fase 10A.

### Aceptación
- Con los árboles en Off se ve todo el suelo y no hay huecos raros.
- No queda ningún texto de controles en partida ni en los menús.
- How to play se lee bien en el ordenador y en el móvil.
- La selección de personaje se usa cómodamente en el móvil, en horizontal.

---

## Fase 12 — Móvil sin pérdidas *(mini)*

### Situación
Hoy **no se guarda ninguna partida**; solo las opciones de Settings (`systems/Settings.ts`, en el navegador). Cuando el móvil cierra la pestaña en segundo plano, la partida se pierde. Tampoco se puede instalar el juego como app.

### Instalar como app
- Añadir lo que Chrome pide para ofrecer "Añadir a pantalla de inicio" (un manifiesto con nombre e iconos y un *service worker* sencillo).
- Se abre a pantalla completa, en horizontal y sin la barra del navegador, con el icono del juego.
- Botón **"Install"** en el menú principal, solo cuando el navegador lo permite.
- Ojo con la caché: el juego se publica a menudo y la versión instalada debe actualizarse sola.

### Guardar la partida
- **Pausa automática** en cuanto la pestaña pasa a segundo plano.
- **Guardado** de un resumen de la partida en el navegador, cada pocos segundos y al minimizar: mapa, clase, tiempo, nivel, XP, armas y mejoras elegidas, stats, vida, buffs y bajas.
- Al volver: si la pestaña sigue viva, la partida está en pausa; si el móvil la cerró, el menú muestra **"Continue"** arriba del todo.
- **Límite aceptado:** no se guardan los monstruos uno a uno. Al continuar se genera la oleada del minuto en que estabas, con unos segundos de calma.
- El guardado se borra al terminar la partida (victoria o derrota).
- Esto es la base del guardado de las Fases 14 (logros), 21 (récords) y 23 (baúl).

### Aceptación
- En el móvil: jugar 3 minutos, minimizar, abrir otras apps, volver → la partida sigue o aparece "Continue" con el mismo nivel, armas y minuto.
- Chrome ofrece instalar el juego y se abre a pantalla completa desde el icono.

---

## Fase 13 — Jefe final y equilibrio

### 13A. El jefe final
- **Corta las oleadas:** cuando aparece el jefe final, dejan de salir monstruos nuevos. Quedan los que ya había, el jefe y **sus esbirros** (definidos en sus datos: qué monstruos llama y cada cuánto).
- **Al matarlo no acaba la partida:**
  1. cae su botín (hoy, XP y cofre; con la Fase 21, equipo);
  2. se abre un **portal** en el suelo, cerca de donde murió;
  3. la partida termina al **entrar en el portal** o a los **30 segundos**, lo que pase primero (contador visible);
  4. después, la pantalla final de victoria.
- **Assets:** buscar un efecto de portal o puerta mágica en los `effect*.spr` (con un subagente). Si no hay, un círculo de un hechizo en bucle.
- Mismo comportamiento para el jefe de cada mapa futuro.

### 13B. Equilibrio
- **Problema:** se sube de nivel demasiado rápido y resulta molesto.
- **Situación:** la curva es lineal (`data/leveling.ts`): 10 XP para el nivel 2, 20 para el 3, 30 para el 4...
- **Propuesta:**
  - curva más empinada, por ejemplo con tramos (lenta al principio para dar 3–4 niveles rápidos, y luego cada nivel bastante más caro), o que crezca con el cuadrado del nivel;
  - revisar cuánta XP da cada gema y cada monstruo;
  - objetivo inicial: **25–30 niveles en una partida de 12–15 minutos**, con los primeros niveles rápidos y luego uno cada 30–45 s (a confirmar con el propietario);
  - revisar las oleadas (`data/waves.ts`): cantidad de monstruos por minuto, mezcla de tipos y vida de los jefes;
  - para medirlo, que `pnpm check` diga en qué minuto se llega a cada nivel.
- Se repite un repaso de equilibrio al cerrar las Fases 18, 19, 20, 21 y 26. Desde la Fase 14, con datos reales.

### Aceptación
- Al salir el Wyvern no aparecen monstruos nuevos, solo sus esbirros.
- Al matarlo se abre el portal; entrar en él o esperar 30 s lleva a la pantalla de victoria.
- Una partida completa sube de nivel al ritmo acordado, y el propietario la nota menos agobiante.

---

## Fase 14 — Métricas y logros

### 14A. Métricas
- **Para qué:** entender la dificultad. Si la gente muere muy rápido o no muere nunca, con qué personaje, en qué minuto...
- **Qué se envía al terminar cada partida** (anónimo, sin datos personales): versión del juego, mapa, clase, móvil u ordenador, resultado, minuto de muerte, nivel alcanzado, bajas, qué te mató, armas y cartas elegidas, si se usó Zem o crits, y los FPS medios.
- **Dónde:** un servidor pequeño y gratuito, **Cloudflare Workers + D1**. El mismo servirá para el ranking online (Fase 28).
- **Cómo lo ve el propietario:** una página sencilla con gráficas: duración media, muertes por minuto, % de victorias por clase y cartas más elegidas.
- **Privacidad:** sin cookies ni identificadores personales. Un aviso de una línea en Options, con opción "Send anonymous stats: On/Off".
- **Decisión del propietario:** montar el servidor (requiere crear una cuenta gratuita de Cloudflare; eso lo hace él).

### 14B. Logros
- **Base:** la pantalla Achievements ya existe, pero hoy solo dice "próximamente".
- **Propuesta:**
  - lista de logros en `data/achievements.ts`, guardados en el navegador (con el guardado de la Fase 12);
  - aviso pequeño en partida al conseguir uno ("Achievement unlocked: ..."), con sonido;
  - pantalla Achievements con los conseguidos y los pendientes (en gris, con su descripción);
  - **primera tanda (~10–15):** ganar en Eternal Field, ganar con cada clase, sobrevivir 5 y 10 minutos, llegar al nivel 20, matar 1.000 monstruos en una partida, matar a cada minijefe, llevar 6 armas a la vez, terminar sin beber pociones...
- **Más adelante**, cada fase añade los suyos: "10 Critical Strikes in one run", "Revive with a Zem", "Win Icebound", "Kill 50 raiders"...
- En la Fase 23, un NPC de la ciudad enseña los logros y, más adelante, misiones.

### Aceptación
- Tras una partida aparece una fila nueva en la página de métricas.
- Al llegar al nivel 20 sale el aviso, y el logro aparece conseguido en Achievements después de recargar.

---

## Fase 15 — Apuntado híbrido

### Situación
Hoy todas las armas apuntan solas al enemigo más cercano (`findNearestEnemies` en `systems/WeaponSystem.ts`). Mantener el clic sirve para **moverse**.

### Propuesta
- **Por defecto, automático,** como ahora.
- **Manual en cuanto el jugador lo usa:**
  - **ratón:** mantener el clic o arrastrar apunta hacia el cursor;
  - **mando:** el stick derecho apunta (estilo *twin-stick*).
- **Al soltar,** vuelve al automático en el acto.
- Un solo sitio del código decide "¿hacia dónde apunto?" y todas las armas lo usan: tajos, proyectiles y hechizos. Las armas que caen en zona (alrededor de enemigos) siguen igual o caen hacia donde apuntas.
- Un indicador discreto (flecha o retícula) solo mientras apuntas a mano.
- **En el móvil (15C, decidido el 18-oct-2026):** segundo stick flotante en la mitad derecha de la pantalla para apuntar; la izquierda mueve. Casilla "Aim Stick" en Settings, activada de serie. El botón del crit (Fase 19) irá en la esquina de abajo a la derecha.
- **Decisión del propietario:** el clic deja de servir para moverse (el ratón pasa a apuntar), o el clic izquierdo mueve y el derecho apunta.
- Se explica en How to play.

### Aceptación
- Con el mando, el stick derecho dirige los ataques; al soltarlo vuelven a buscar al más cercano.
- Con el ratón, igual (clic derecho). En el móvil, el stick de la derecha apunta; con la casilla apagada, todo como antes.

---

## Fase 16 — Minimapa y tótems

### 16A. Minimapa

#### Qué hay en el original
- El "GuideMap" era un cuadro de **128×128** con una miniatura del mapa (`telescope.spr` hoja 0, un frame por mapa: huntzone2 = 9, icebound = 24, middleland = 4, dglv4 = 14, arefarm = 6, elvfarm = 5, druncncity = 25).
- El punto del jugador era GameDialog hoja 4, frame 37 (6×5 px). Los frames 36–39 son puntos de otros colores y los 40–43, marcadores de 12×12.
- **El original no dibujaba monstruos.** Eso lo añadimos nosotros.
- Alternativa: `sp-client/public/assets/images/minimaps/*.jpg` (1500×1500, uno por mapa), más nítidos para recortar.

#### Propuesta
- Cuadro de ~128×128 arriba a la **izquierda**. Arriba a la derecha está el botón de pausa táctil.
- Muestra **solo la zona de juego** (nuestro recorte de 150×150 casillas de Bleeding Isle), no el mapa entero.
- **Puntos:** jugador (el punto original); **jefes** (marcador grande que parpadea); **cofres** (dorado); **pociones** (rojo); **Zem** (violeta); **tótems** (su propio color, apagado mientras recargan); **portal** del jefe (Fase 13); **jugadores enemigos** cuando lleguen las Raids (rojo grande).
- **Monstruos normales: no.** Con 300 enemigos sería una mancha. Como mucho, opcional en Settings, en forma de puntitos sueltos.
- **Settings:** "Minimap: On/Off" y quizá tamaño grande o pequeño. En el móvil, más pequeño o plegable al tocarlo.
- Fuera de pantalla: una **flecha en el borde** hacia el jefe, el portal o el cofre más cercano. Opcional.
- **Teclas de pruebas:** M y C ya están ocupadas (saltar al jefe, panel de stats). El minimapa no se activa con M.

### 16B. Tótems
- **Idea del propietario:** en vez de que los buffs salgan al azar, que haya **monumentos o tótems** en el mapa que te den una mejora o un buff al pasar por encima.
- **Situación:** hoy los buffs (Berserk, Defense Shield...) salen de los cofres de los minijefes (`data/pickups.ts`).
- **Propuesta:**
  - 3–5 tótems repartidos por la zona de juego, en sitios fijos de cada mapa (en `data/maps.ts`), o que aparecen cada cierto tiempo;
  - al pasar por encima dan un buff (cada tótem uno distinto, o al azar) y luego **recargan** (por ejemplo, 60 s) o se apagan para siempre;
  - algunos tótems raros podrían dar una **carta de mejora** directamente;
  - el minimapa los marca, y así el jugador decide cuándo ir a por ellos.
- **Dibujo:** objetos de Helbreath que parezcan monumentos: Mana Stone (`manastone`), estatuas o banderas del mapa, con un brillo encima. Buscarlo con un subagente.
- **Choque a decidir:** si los cofres siguen dando buffs o, con la Fase 21, pasan a dar equipo. Propuesta: tótems = buffs y cofres = equipo.

### Aceptación
- El minimapa enseña dónde estás, el cofre que dejó el Ettin, la poción que cayó y los tótems. Se apaga en Settings y no tapa nada en el móvil.
- Pasar por un tótem da su buff, el tótem se apaga y vuelve a encenderse al recargar.

---

## Fase 17 — Selección de personaje al estilo Helbreath

### Idea del propietario (18-oct-2026)
Cambiar la pantalla de elegir personaje por la del Helbreath original. Tenemos los sprites y el código de referencia.

### Cómo era en el original
Visto por encima en `reference/Client.cpp`. Al empezar la fase, mirar el detalle con un subagente.
- **Select Character** (`UpdateScreen_OnSelectCharacter`, C:25688):
  - fondo a pantalla completa: `GameDialog` hoja 8 (`DEF_SPRID_INTERFACE_ND_SELECTCHAR`);
  - **4 huecos en fila**; en cada uno, el personaje **dibujado con su equipo y animado** (`DrawObject_OnMove_ForMenu`), con nombre, nivel y experiencia debajo;
  - opciones: entrar a jugar, New Character, Delete Character y salir.
- **Create New Character** (`UpdateScreen_OnCreateNewCharacter`, C:23601; `_InitOnCreateNewCharacter`, C:14257):
  - fondo: `GameDialog` hoja 9 (`DEF_SPRID_INTERFACE_ND_NEWCHAR`);
  - nombre, sexo, color de piel, peinado, color de pelo y color de la ropa interior;
  - reparto de puntos entre Strength, Vitality, Dexterity, Intelligence, Magic y Charisma, con la vida, el maná y el aguante que salen.
- Los sprites están en `sp-client/public/assets/sprites/gamedialog.spr`. Hay que comprobar que las hojas 8 y 9 son esas pantallas.

### Choques con lo que hay (a decidir al empezar la fase)
- Hoy se elige **clase** (Warrior o Mage) en `CharacterSelectScene`. El original no tenía clases: el tipo de personaje salía del reparto de stats.
- El original guardaba **personajes** (4 huecos, con nivel y experiencia). Nosotros guardamos **hasta 3 partidas** (`SaveSlotsScene`), que no son personajes.

### Opciones
- **A) Solo el aspecto:** la pantalla de elegir clase usa el marco y la disposición del original. Warrior y Mage salen dibujados y animados con su equipo de salida, con sus stats debajo. Pequeño.
- **B) Crear personaje:** además, una pantalla "New Character" como la original para escoger sexo, piel, pelo, ropa interior y nombre. El personaje se ve así en partida. Medio. Hay que comprobar que el cuerpo del jugador admite esas variantes (en sp-client existen).
- **C) Personajes guardados:** los huecos pasan a ser personajes que duran (nombre, aspecto, récord y, más adelante, equipo y baúl), en vez de partidas sueltas. Grande. Encaja mejor con la Fase 23.
- **Propuesta:** A y B ahora. C se decide en la Fase 23.

### Móvil
Tiene que caber en el móvil con los tamaños de la Fase 10A. Los huecos quizá en 2×2.

### Aceptación
- Al pulsar Play sale la pantalla con el marco del original y los personajes animados. Se elige con ratón, teclado, mando y dedo.
- Con la opción B: se crea un personaje cambiando sexo, piel y pelo, y en partida se ve así.

---

## Fase 18 — Esquiva y resistencia mágica

### Idea del propietario (18-oct-2026)
El guerrero tiene que pegarse a los monstruos y **recibe todos los golpes**: le cuesta mucho pasar del Ettin. Y los hechizos (las bolas de fuego del Mage-Orc) **siempre** hacen daño. En el original, Dex y la armadura daban una probabilidad de que el golpe fallara, y la resistencia mágica podía anular un hechizo.

### Cómo era en el original (comprobado en `reference/Server.cpp`)
- **Golpe físico** (`iCalculateAttackEffect`, S:53374): el atacante tiene **Hit Ratio** (puntería) y el defensor **Defense Ratio**.
  - Defense Ratio del jugador = **2·Dex** (S:32386) + el de cada armadura y escudo (S:32798) + collares (S:32665). Ejemplos (`docs/hb-wiki/armaduras.md`): Leather Armor 11, Chain Mail 31, Plate Mail 37, Tower Shield 35, Merien's Shield 50.
  - Probabilidad de acertar = **50·HR / DR**, entre un mínimo y un 99% (S:53939). Atacado por la espalda, tu DR cuenta la mitad (S:53936).
  - Si falla, no hay daño ni animación.
  - Si acierta: Vit resta un poco (S:53962); luego se sortea **dónde** pega (cuerpo 50%, piernas 25%, brazos 15%, cabeza 10%) y solo absorbe **esa pieza** (PA, máximo 80%) (S:54058). El escudo absorbe solo si **bloqueas**, según la habilidad de escudo (S:54113).
- **Hechizos** (`bCheckResistingMagicSuccess`, S:29704): el lanzador tiene **Magic Hit Ratio** y el objetivo **Magic Resistance**.
  - Magic Resistance del jugador = habilidad *Magic Resistance* (sube sola al recibir hechizos) + Mag por encima de 50 + objetos (collares MR+10 / MR+15).
  - Probabilidad de que te afecte = **50·HR / MR**, con los mismos límites (S:29741). Si lo resistes, **no hace nada de daño** (no la mitad).
  - Aparte, la **absorción mágica** (MA) de los objetos reduce el daño del hechizo que sí entra, como máximo un 80% (S:28367).
- **Monstruos:** puntería física y defensa en `docs/hb-wiki/monstruos.md` (Orc 60, Troll 200, Werewolf 300, Ettin 375, Demon 500). La puntería mágica existe en el código (S:16793), pero no hay datos: la pondremos nosotros.

### Por qué no se copia tal cual
Con los números originales, un guerrero con Dex 14 recibe el 99% de los golpes de un Orc: en el original se tardaban meses en esquivar. Igual que con los stats (`REQ_SCALE`), hay que **comprimir**: la puntería de los monstruos va de 30 a 500 y aquí la defensa del jugador no pasará de ~150.

### Propuesta
- **18A. Esquiva física**
  - Defense Ratio = 2·Dex + el DR original de cada pieza (escudos y armaduras pesadas mucho, túnicas casi nada). Va en `data/armor.ts` y `data/stats.ts`.
  - Cada monstruo lleva su `hitRatio` (de la wiki, comprimido) en `data/enemies.ts`.
  - Fórmula del original (50·HR/DR) con límites propios: te aciertan **entre un 25% y un 95%**. Nunca eres intocable.
  - La tirada se hace **por golpe**, cuando el golpe llega (antes de juntar los daños del frame). Si falla: texto **"Miss"** (con el pool de números de daño) y **sin** parpadeo de invulnerabilidad.
  - Las flechas (Dark Elf) son golpes físicos: también se pueden esquivar.
  - Objetivo aproximado: guerrero a mitad de partida (Plate + Tower Shield + casco) → Orc le acierta ~30%, Werewolf ~70%, Ettin ~80%. El mago casi no esquiva.
- **18B. Resistencia mágica**
  - Afecta a los proyectiles mágicos (bola de fuego del Mage-Orc, hechizos de jefes).
  - Magic Resistance = Mag + piezas con MR (escudos y cascos del guerrero, túnicas del mago).
  - Opcional, fiel al original: una resistencia que **sube sola** cada vez que te golpea un hechizo durante la partida.
  - Si lo resistes: texto **"Resist"** y nada de daño.
- **Panel de stats (C) y cartas:** líneas "Dodge chance" y "Magic resist". Las cartas de armadura muestran cuánto suben.
- **Opcional:** "Block" con escudo (absorbe solo al bloquear, como el original). Se decide al empezar.

### Ojo
- Dex ya da velocidad de movimiento y de ataque; si además da esquiva, también ayuda al mago. Por eso la mayor parte de la defensa debe venir de las **armaduras y escudos del guerrero**.
- Medir con `pnpm --dir survivors check` (métricas de daño recibido por monstruo) antes y después, sobre todo contra el Ettin.

### Aceptación
- Con el guerrero bien equipado, parte de los golpes salen como "Miss" y se llega más lejos que antes contra el Ettin.
- Algunas bolas de fuego del Mage-Orc salen como "Resist" y no quitan vida.
- El panel de stats enseña la probabilidad de esquivar y la resistencia mágica.

---

## Fase 19 — Crits ("Gritos") y habilidad activa

> **Decidido el 18-oct-2026:** las dos clases tienen **un ataque automático y una habilidad activa con el mismo botón**. Guerrero: arma (automática) + **Critical Strike** (cargas). Mago: hechizo 1 (automático) + **hechizo activo** con recarga (cooldown). Esto sustituye a las opciones A/B de la Maga de más abajo. Hasta la Fase 20 el hechizo activo es fijo (por ejemplo, el mejor hechizo de área que tenga); desde la 20, es el que lleve en su segundo hueco de hechizo. Donde abajo dice "nivel" (cargas, daño del crit) es el nivel **de la partida**, que en la Fase 20 pasa a llamarse **Power**.

### Cómo era en el original (comprobado en el código)
- Se guardaban "cargas" de crítico (`m_iSuperAttackLeft`). **Máximo = nivel / 10** (S:4121). Un nivel 180 llevaba 18.
- **Recarga:** +1 carga cada **~13 s** conectado, hasta el máximo (S:4117). También +1 cada ~14 golpes cuerpo a cuerpo **recibidos** (S:54351). No se recargaban al subir de nivel.
- **Cómo se lanzaba:** manteniendo **Alt** y atacando. Hacía falta el 100% de maestría del arma (S:35620).
- **Cada crítico gastaba 1 carga** (S:1169).
- **Daño:** ataque × **(1 + nivel/100)**, más un extra por familia: espada larga +10%, hacha +20%, martillo +20%, bastón +20%, arco +10%. Además +100 de acierto (S:53595).
- **Alcance mayor:** con Alt se podía golpear desde lejos: espada larga 3 casillas, esgrima 4, hacha/martillo/varita 2, daga 1 (C:31507).
- Casi siempre empujaba al enemigo (empuje a partir de 40 de daño, S:54303).
- **Grito:** `C23.mp3` (hombre) / `C24.mp3` (mujer). Efecto: un destello que vuela hacia el objetivo (`effect.spr` hoja 8), el mismo `fx.hit` que ya usamos.
- **HUD:** un número con las cargas. Al mantener Alt se iluminaba un icono (GameDialog hoja 6, frame 3; en `NOTES.md` figura como "icono desconocido": es este).
- **Los magos no tenían crítico de hechizo.** Solo el golpe de bastón cuerpo a cuerpo.

### Ojo: ya tenemos un "crítico"
El stat **Chr** da un crítico al azar (×2, número amarillo con "!"). Para no confundir, propongo:
- el de Chr se queda como está ("Critical hit", al azar);
- el nuevo se llama **"Critical Strike"** en el juego (el nombre que usaban los jugadores era "crit"). Lo lanza el jugador y suena el grito.

### Adaptación propuesta
- **Cargas:** máximo = **1 + nivel/10** (nivel 1–9: 1; nivel 10: 2; nivel 20: 3; nivel 30: 4). Con la regla original (nivel/10) no tendrías ninguno hasta el nivel 10. Revisar con la curva de XP nueva de la Fase 13.
- **Recarga:** +1 carga cada **15 s** (a ajustar) y también +1 cada **15 golpes recibidos**, como en el original. Esto premia aguantar en medio de la horda.
- **Botón:** **Espacio** (o Alt, como el original), **X** en el mando y un **botón táctil** nuevo en el móvil. Espacio hoy solo sirve para confirmar en menús, así que está libre en partida.
- **Qué hace al pulsarlo (Guerrero):** el siguiente tajo sale **ya**, sin esperar al ritmo del arma, **hacia donde apuntas** (Fase 15):
  - daño × **(2 + nivel/30)** (a ajustar), más el extra de su familia (espada larga +10%, etc.);
  - **alcance mayor** según la familia (espada corta ×1,5, espada larga ×2);
  - empuje fuerte a todos los golpeados;
  - grito C23/C24, destello volando y un pequeño temblor de cámara.
- **¿Y la Maga?** Dos opciones (decide el propietario):
  - **A) Como el original:** la Maga no tiene crits. Más fiel, pero el botón solo sirve al Guerrero.
  - **B) Adaptación (recomendada para la diversión):** "Critical Cast": el siguiente hechizo sale ya, con el doble de proyectiles o de explosiones. Usa el mismo grito y las mismas cargas.
- **HUD:** contador de cargas junto a la barra de maná, con el icono original (GameDialog 6/3) que brilla cuando hay al menos una carga. Sin texto de qué botón es (eso va en How to play).
- **Opcional:** carta de nivel nueva "+1 carga máxima" o "recarga un 20% más rápida", y un "CritCandy" (dulce que recarga todas las cargas) como objeto raro del suelo. El CritCandy existía en el original (objeto 970), pero no sé su efecto exacto **[de memoria]**. Hay dulces en `item-ground` 5/131–133.

### Traído de la Fase 10: mando
- **Vibración** al recibir daño (más fuerte con golpes grandes) y al lanzar el crit. Con opción en Settings para quitarla.
- **Reasignar controles** en Settings: teclado y mando, con "Reset to default".

### Assets
Todo existe: sonidos C23/C24 (y C18 del tajo), `effect.spr` hoja 8, icono GameDialog 6/3, dulces 5/131–133.

### Aceptación
Con el Guerrero, pulsar Espacio/X lanza un tajo crítico con grito y número de daño grande. El contador baja y se recarga solo. Al nivel 10 hay 2 cargas. En el móvil, el botón táctil funciona mientras mueves con el otro dedo.

---

## Fase 20 — Level y equipo *(nueva)*

### Idea del propietario (18-oct-2026)
Cada personaje guardado (hasta 4 por dispositivo, Fase 17A) **sube de Level de forma permanente** y lleva un **equipo** que conserva entre partidas. Cada partida empieza en Power 1, pero con ese equipo puesto. Las cartas dejan de dar armas y armaduras. Todo lo decidido está en `DESIGN.md`, "Progresión entre partidas".

### Cómo era en el original (comprobado en `reference/`)
- **+3 puntos de stat por nivel** (S:23943). Cada stat empieza en 10 y no pasa de **200** (S:5424). Al crear el personaje había 10 puntos libres (C:14263).
- Nivel máximo **180** por defecto (S:5454). El propietario recuerda 140 en los primeros años; **usamos 140**.
- Equipar exigía **peso ≤ Str×100** (Str necesaria = peso/100) y, en algunos objetos, un **nivel mínimo** (S:12634-12665). Ejemplos: Long Sword 14, Claymore 40, Flameberge 60, Battle Hammer 120 (nivel 110), Giant Sword 130 (nivel 100), Barbarian Hammer y The_Devastator 200 (`Item*.cfg`).
- Hechizos: **Int mínima** para aprenderlos (S:21764). Blizzard 195, Meteor Strike 169, Earth-Shock-Wave 200 (`Magic.cfg`).
- Tabla de EXP original: `Exp(L) = Exp(L-1) + L·(50 + L·(L/17)²)` (S:23889). **No la usamos:** curva propia pensada en tiempo.

### Propuesta
- **Dos progresiones con nombres distintos:**
  - **Level** (permanente): sale en Select Character. Sube con la **EXP** que se gana en las partidas (una parte de la de la partida, al terminarla). Da **3 puntos por Level** que el jugador reparte; **no se pueden reasignar**.
  - **Power** (la de la partida): lo que hoy es el "nivel" en partida. Barra "Power N"; al llenarla salen las cartas. Se reinicia cada partida.
- **Requisitos:** lo que se puede equipar se mira **solo con las stats permanentes** (Str para armas y armaduras, Int para hechizos). Las armas y hechizos altos piden además un **Level mínimo**. Las stats de las cartas de Power suben daño, vida, velocidad... pero nunca desbloquean equipo.
- **Curva (objetivo, se afina con la simulación y las métricas):**

  | Tiempo jugado | Level aprox. |
  |---|---|
  | 1.ª partida | 5–8 |
  | 2 h | ~30 |
  | 6 h | ~50 |
  | 8–10 h | ~55–60: **Battle Hammer** para un Guerrero de Str |
  | 15–20 h | ~80: **Blizzard** para un Mago de Int |
  | 30 h | ~100: empiezan los objetos únicos (Fase 25) |
  | ~60 h | **140** (máximo) |

  A Level 140 hay ~490 puntos: da para dos stats a 200 y poco más, así que hay que elegir.
- **Inventario del personaje (huecos):** arma, escudo, casco, armadura, pantalones, botas, capa, **2 hechizos** (automático + activo), **anillo, collar, ángel tutelar**, **Zem** y **Abaddon's Blood** (Fase 21). Los sprites de cuerpo, armadura, arma y capa ya los compone `CharacterSprite`; los iconos están en `item-pack`.
- **Hechizos equipables:** el Mago lleva 2. El primero se lanza solo (como hoy); el segundo es su **habilidad activa** con recarga (botón de la Fase 19).
- **Cartas de Power (sustituyen a las de arma y armadura):**
  - stat temporal (+3 a un stat, solo en esta partida);
  - **Xelima** (+% daño del equipo en esta partida) y **Merien** (+% defensa en esta partida), con el dibujo de la piedra y un texto claro ("+10% damage this run");
  - pasivas (botas, imán...), como hoy.
- **Pantalla de equipo:** diseño del inventario original (GameDialog) y el muñeco del personaje. Hasta que exista la ciudad (Fase 23), se abre desde **Select Character**.
- **Guardado:** `SavedCharacter` añade Level, EXP, puntos repartidos y equipo. Formato con versión y migración: los personajes que ya existen empiezan en Level 1 con su equipo básico.

### Choques con lo que hay (a decidir al empezar la fase)
- **Clases:** hoy se elige Warrior o Mage. El original no tenía clases (el tipo salía del reparto). Propuesta: **se quedan** como "estilo" (bonus fijo y equipo inicial), y el reparto de puntos es libre.
- **Nivel en partida:** las cargas del Critical Strike (Fase 19), los logros ("llegar al nivel 20") y las métricas hablan de "nivel": pasan a **Power**.
- **Dificultad:** con equipo permanente, Eternal Field se volverá fácil. Hasta la Fase 22 (varios mapas con dificultad por Level) se acepta; se mide con las métricas.

### Bloques
- **20A:** Level, EXP al terminar la partida, reparto de puntos y nombre "Power" en partida.
- **20B:** datos de objetos (armas y armaduras originales con Str y Level), inventario y pantalla de equipo; equipo de salida en partida.
- **20C:** las cartas de arma y armadura se cambian por las de Power (stat temporal, Xelima y Merien +10% hasta 5 cartas); fuera la carta Boots. Revisar logros ("Fully Armored"), métricas, cofres y partida simulada.
- **20D:** hechizos equipables (2 huecos) para el Mago.
- *(Partido en tres el 19-oct-2026 para que cada bloque quepa en una sesión.)*

### Aceptación
- Termino una partida, el personaje sube de Level y reparto 3 puntos en Str. Con la Str suficiente, me equipo una Claymore desde Select Character y empiezo la siguiente partida con ella.
- En partida ya no salen cartas de armas ni de armaduras; salen stats temporales, Xelima y Merien.
- El Mago empieza con sus 2 hechizos: uno se lanza solo y el otro con el botón.

---

## Fase 21 — Botín y baúl *(nueva)*

### Idea del propietario (18-oct-2026)
Los objetos que caen en la partida se pueden **equipar al momento** o **guardar en la bolsa** para después. Hay un **baúl compartido** por los 4 personajes del dispositivo (en el futuro, quizá "cuentas"). Las armas traen los **atributos del original**; de momento solo **Sharp, Ancient y Poison**.

### Cómo era en el original (comprobado en `reference/Server.cpp`)
- **Sharp:** +1 al dado de daño (2d8 → 2d9) (S:32567).
- **Ancient:** +2 al dado (S:32572). **No se puede mejorar** con Xelima (S:52378).
- **Poison:** al golpear envenena si el objetivo no lo estaba; quita 1d(veneno) en cada tic y **nunca mata** (deja 1 de vida); se pasa solo (S:54003, S:33106).
- **Zemstone of Sacrifice** (objeto 650): al morir soltabas solo el Zem en vez de tus objetos (S:25276).
- **Red Ball** (objeto 652, `Item3.cfg:33`, icono en `item-pack` hoja 5 (Spr 6), frame 124): lo usamos para **Abaddon's Blood**.

### Propuesta
- **21A. Botín en partida**
  - Caen objetos de monstruos (poco) y de jefes (más y mejores). Un brillo y un sonido los distinguen de las gemas.
  - **Qué cae se calcula con tus stats permanentes** (Str o Int según el objeto) y una tirada (porcentajes de partida, a ajustar):
    - ~50%: de tu escalón actual (igual o algo mejor), para equiparlo ya;
    - ~25%: del **escalón siguiente** (pide más Str/Int o Level), para motivar a subir;
    - ~15%: peor (para vender en la Fase 24);
    - ~10%: un salto grande.
  - Al cogerlo, carta de **comparación** con el objeto que llevas (como las cartas de Power): **"Equip"** o **"Keep in bag"**. Si no cumples el requisito, sale en rojo y solo se puede guardar.
  - Los anillos y collares entran aquí, con efectos sencillos del original (por ejemplo, collar de resistencia mágica).
- **21B. Atributos:** Sharp, Ancient y Poison con su probabilidad (Ancient el más raro). Se ven en el nombre y en la carta. Poison sale como daño verde que no mata.
- **21C. Baúl, muerte, Zem y Abaddon's Blood**
  - **Bolsa:** lo que guardas en la partida. Al terminar, pasa al **baúl compartido** (o se queda en el inventario del personaje).
  - **Al ganar:** te quedas con todo. **Al morir sin Zem:** pierdes los objetos encontrados en esa partida (el equipo con el que saliste no se pierde nunca). **Al morir con Zem:** conservas el botín y el Zem se gasta.
  - **Zem:** hueco propio, se equipa antes de la partida. En esta fase solo cae de jefes; en la Fase 24 también se compra en la tienda.
  - **Abaddon's Blood** (resurrección; **cambiado el 20-oct-2026**, ver 21E): ya no es un objeto que cae y se gasta, sino una **mejora permanente** del dispositivo, como el "Revival" de Vampire Survivors.
  - Zem y Abaddon's Blood funcionan a la vez: si revives, el Zem no se toca.
  - El minimapa marca los objetos del suelo (como hoy las pociones).

### Bloques
- **21A:** botín y carta Equip / Keep in bag.
- **21B:** Sharp, Ancient y Poison, y varitas de la Maga (con su Mana Save guardado para cuando haya maná).
- **21C:** anillos y collares: collares Defense (DF+10…+30) y Magic Resistance (MR+10…+30); anillos de fuerza (Ogre, Demon, Dragon power) y de mago (Wizard, Mage, Grand Mage, Arcmage). Piden Level.
- **21D:** baúl compartido, Equipment "solo lo que tienes", reglas al morir y Zem.
- **21E:** Abaddon's Blood. *(Replanteado el 20-oct-2026 por el propietario:)* mejora **permanente para los 4 personajes** (`UnlockStore`), sin hueco ni objeto. Una vez desbloqueada, revives **una vez en cada partida**: 50% de vida, 3 s invulnerable, onda que aparta a los monstruos, efecto Resurrection (`effect11` hoja 10, el del tótem Full HP) y la voz C21/C22. Icono del Red Ball en la barra de abajo (apagado al usarlo) y logro "Blood of the Demon". Hasta la Fase 24 solo se desbloquea con `?unlocks=abaddon`; **la tienda de la Fase 24 la venderá**.
- *(Partido el 20-oct-2026: las varitas y las joyas no cabían con los atributos en una sesión. El mismo día el propietario dejó el **21C pendiente** para más adelante y el 21D se partió en 21D y 21E.)*

### Aceptación
- Mato al Ettin, cae una espada Sharp: la carta la compara con la mía y la equipo al momento; sigo jugando con ella.
- Guardo otra en la bolsa, gano, y la veo en el baúl desde otro personaje.
- Muero sin Zem: pierdo lo encontrado, pero no el equipo de salida. Con Abaddon's Blood revivo una vez.

---

## Fase 21½ — Cartas y sorpresas *(mini, nueva)*

### Por qué (análisis del 21-oct-2026, `docs/ENGAGEMENT.md`)
Desde la Fase 20 las cartas de Power solo dan +3 a un stat o una piedra (Xelima, Merien, Magnet): cada subida se parece a la anterior y casi nunca hay sorpresa. En Vampire Survivors, Hades o Megabonk la subida de nivel es el corazón de la partida. Esta fase mete tres cosas que se apoyan en lo que ya existe y casi no tocan el resto. El propietario las aprobó como idea el 21-oct-2026; los números se deciden al empezar.

### 21½A. Rareza en las cartas
- Cada carta sale **Common**, **Rare** o **Epic** (propuesta 75 / 20 / 5%), con el borde y el título del color de su rareza (blanco, azul, morado) y un sonido distinto para la Epic.
- **Stat:** +3 / +5 / +8. **Piedras y Magnet:** +1 rango / +1 rango y un poco más de efecto / +2 rangos (sin pasar del máximo).
- Más adelante la **Chr** puede subir la probabilidad de las raras (era la idea original del diseño: "Chr: crítico y mejores drops").
- Dónde: `systems/UpgradePool.ts`, `scenes/LevelUpScene.ts`, números en `data/` (archivo nuevo `cardRarity.ts`).

### 21½B. Reroll y Skip
- Dos botones bajo las cartas: **Reroll** (saca 3 cartas nuevas) y **Skip** (no coge ninguna).
- **Decidido el 21-oct-2026 (propietario), como Vampire Survivors y Halls of Torment:** no vienen gratis. Son **mejoras permanentes que se compran** con monedas, para los 4 personajes (`UnlockStore`, como Abaddon's Blood):
  - **Dado** → +1 **Reroll** por partida; **Vino** → +1 **Skip** por partida.
  - Cada uno se compra **hasta 3 veces** (máximo 3 Reroll y 3 Skip en cada partida).
  - Los venderá en la ciudad **el mismo vendedor que el Zem** (Fase 24).
- **En este bloque:** botones y contadores, que solo se ven si tienes alguno. Se empieza con **0**; hasta la tienda, solo con un atajo de prueba (`?unlocks=dice3,wine3` o parecido), igual que Abaddon's Blood.
- Contador a la vista en cada botón. Táctil, ratón y mando (otra fila en la navegación de las cartas). Se explica en How to Play.
- Lo usado se guarda con la partida (Continue).
- **Preguntar al empezar:** si Skip da algo a cambio (en Vampire Survivors, un poco de XP) y qué dibujos del original usar para el dado y el vino.

### 21½C. Evento "Champion"
- Una o dos veces por partida, en un minuto **al azar** (entre los minijefes y el jefe final, sin coincidir con ellos), aparece un **monstruo poderoso de más**: un monstruo de la oleada actual o del siguiente tramo, más grande, con mucha vida, aura de élite y barra de vida arriba.
- Aviso en pantalla ("A champion rises!") y sonido. Si lo matas: **objeto garantizado** del escalón siguiente o mejor, y algo de XP extra.
- Reutiliza los élites (`data/elites.ts`), los eventos de oleada (`data/waves.ts`, tipo nuevo `champion`) y la barra de jefe. Ya estaba anotado como idea ("monstruos al azar como evento especial").
- Atajo de prueba `?debug=champion` y situación `pnpm check champion`.

### Aceptación
- En una partida normal salen cartas Rare y alguna Epic, y se distinguen de un vistazo.
- Reroll y Skip funcionan con teclado, ratón, mando y táctil, y el contador baja.
- El Champion aparece en un minuto distinto cada partida, se ve claramente y suelta su objeto.
- Las métricas apuntan las rarezas elegidas, los Reroll/Skip usados y si se mató al Champion.

---

## Fase 22 — Sistema de mapas

### Replanteo del 20-oct-2026 (al empezar la fase)
- **Mapas, en este orden:** Traveler Zone (`default`, introducción) → Bleeding Isle → Elvine Garden (`elvuni`) → Middleland. **Icebound pasa a la Fase 25.**
- **Bloques:** 22A sistema de mapas + Select Map + Traveler Zone ✅ · 22B carga por mapa ✅ · 22C Traveler Zone completa (Cat, repaso tras jugarla) ✅ · 22D Elvine Garden ✅ · 22E Middleland ✅ (21-oct-2026; monstruos y jefes cambiados por el propietario, ver `docs/DECISIONES.md`) · ~~22F récords locales~~ (aplazado) · 22G sombras y skill `anadir-mapa` ✅ (21-oct-2026). **Fase cerrada el 21-oct-2026.**
- Desbloqueo: ganar el anterior **o** llegar al Level recomendado. Música de Bleeding Isle en todos.

### 22A. Sistema de mapas ✅ (21-oct-2026)
Hoy todo está pensado para un solo mapa (`huntzone2`). Hay que:
- **`data/maps.ts`** con todo lo de cada mapa: recorte de juego, oleadas propias, minijefes, jefe final, música, miniatura, tótems y monstruos que descargar.
- **`data/waves.ts` por mapa** (una línea de tiempo cada uno).
- **Pantalla "Select Map"** con la miniatura, el nombre, la dificultad (tu récord en ese mapa, cuando se hagan los récords locales). En esta fase se abre después de elegir clase; en la Fase 23 se abrirá desde el portal de la ciudad.
- **Desbloqueo:** ganar un mapa abre el siguiente (guardado en el navegador). Una tecla de pruebas los abre todos.
- **Descargas:** ver "Carga por mapa" abajo.

### Carga por mapa *(idea del propietario, 18-oct-2026)* ✅ (bloque 22B, 21-oct-2026)
Hoy la primera carga ronda unos **25 MB** de golpe (medido el 18-oct-2026; con un solo mapa no hacía falta más). Ya se hace: monstruos por oleada en segundo plano (`AssetStreamer`, Fase 9), ropa y armas del personaje bajo demanda (`ON_DEMAND_SPRITES`) y solo las casillas que usa el mapa. Con varios mapas, la carga se parte en dos:
- **Carga inicial (antes del menú):** solo lo común: interfaz, sonidos, fuentes, jugador base. Nada de mapas ni monstruos.
- **Carga del mapa (al elegirlo en Select Map, con su propia pantalla de carga):** el `.amd`, sus casillas, su minimapa, su música y los monstruos de su primera oleada. El resto de sus monstruos sigue en segundo plano con `AssetStreamer`, en el orden de **sus** oleadas.
- **Efectos de hechizos y armas según el personaje:** hoy se cargan todos al principio aunque juegues de Guerrero (`fx.effect11` pesa 2,4 MB). Cargarlos al elegir personaje, como ya se hace con la ropa.
- **Caché entre mapas:** lo ya descargado no se vuelve a bajar; si la memoria del móvil sufre, liberar los monstruos y casillas del mapa anterior al cambiar.
- **Medir antes y después:** cronometrar por separado la descarga y la preparación ("Preparing…", la conversión de `.spr` a texturas), en ordenador y móvil. Si lo lento es preparar, la solución es otra (preparar en segundo plano o por partes).
- En la Fase 23 la ciudad usa la misma idea: su propia carga (NPCs y su mapa), sin bajar los mapas de caza.

### 22F. Récords locales: aplazado (21-oct-2026)
El propietario lo deja para más adelante: está en "Ideas para después (sin fase todavía)", con todo el detalle.

### Icebound *(movido a la Fase 25 el 20-oct-2026)*
- **Primer mapa nuevo** (el más pedido y de los que mejor encajan).
- **Monstruos:** Frost ✅, Dire Boar ♻️, Ice Golem ✅, Skeleton ♻️, Stone Golem ✅, Beholder ✅, Rudolph ✅ (reno navideño), Claw Turtle ✅.
- **Minijefes:** Tigerworm ♻️ (en el original tenía un "pit" en Icebound) y Nizie ✅.
- **Jefe final: Wyvern ✅** (`wyvern.spr`, 3,6 MB). Es el "Ice Wyvern" que recuerda el propietario: en el original suelta armas de hielo. El Fire Wyvern ya es el jefe de huntzone2.
- **No existen:** Yeti, Ice Lizard ni dragones de hielo.
- **Extra temático:** que Frost e Ice Golem **ralenticen** al jugador al golpear **[de memoria; hay que comprobarlo en el original]**. Copos de nieve cayendo. Y encaja con activar la familia de hechizos **Ice** de la Maga (está prevista y apagada).
- **Música:** el original no tenía tema propio (sonaba la general). Propongo `default.mp3` o `elvine.mp3`.

### Traído de la Fase 10: sombras ✅ (bloque 22G, 21-oct-2026)
- Sombra bajo personajes y monstruos (el original las dibuja; mirar cómo en `sp-client`). Se ajusta con cada suelo y se mide el rendimiento, sobre todo en el móvil.

### Al terminar
Crear la skill `/nueva-skill anadir-mapa`. ✅ (22G)

### Aceptación
- Desde el menú se elige Icebound. Salen sus monstruos, minijefes y el Wyvern.
- Al ganarlo queda registrado.
- huntzone2 sigue igual que antes. La descarga extra se nota poco.
- La carga inicial no baja ningún mapa ni monstruo; cada mapa carga lo suyo al elegirlo. Tiempos medidos antes y después.

---

## Fase 23 — La ciudad

### Idea del propietario
Después de crear el personaje, se va a una pequeña **ciudad** donde se puede andar libremente y hablar con NPCs. Desde un **portal** se empieza "la partida de verdad", eligiendo el mapa.

### Recorrido nuevo
Menú principal → selección de personaje → **ciudad** → portal → Select Map → partida → pantalla final → **vuelta a la ciudad**.
- "Continue" (Fase 12) sigue llevando directo a la partida guardada.
- En la ciudad no hay monstruos, ni XP, ni armas activas.

### NPCs (los sprites existen en `sp-client`)
Los nombres salen de `sp-client/src/constants/NPCs.ts`; los papeles, del original **[de memoria; comprobar con un subagente]**:

| NPC | Sprite | Papel en el original | Papel en el juego |
|---|---|---|---|
| **Howard** | `howard` | Warehouse Keeper | Junto al **Cofre**: equipo y baúl compartido (pantallas de las Fases 20–21, que hasta ahora se abrían desde Select Character); en la Fase 24, ampliar el baúl |
| **Shop Keeper** | `shopkpr` | La vendedora | **Tienda** (Fase 24); de momento, "Coming soon" |
| **William** | `william` | City Hall | **Logros** (Fase 14) y, más adelante, **misiones** |
| **Tom** | `tom` | Herrero | **Herrero** (Fase 24); de momento, "Coming soon" |
| Gandalf, Kennedy... | `gandlf`, `kennedy` | Magia, gremio | Decoración o usos futuros (comprar hechizos...) |

- **Hablar:** acercarse y pulsar una tecla o botón (en el móvil, un botón "Talk" que aparece al estar cerca). Se abre un panel con el diseño de GameDialog.
- **El Cofre:** un objeto en el suelo junto a Howard. Abre el equipo y el baúl.
- **El Portal:** el mismo efecto que el del jefe (Fase 13). Al entrar se abre Select Map.

### El mapa de la ciudad
Tiene que pesar poco: es lo primero que se carga después del menú. Opciones (medir con un subagente):
- **A) Un recorte pequeño de Aresden o Elvine** (una plaza con el almacén y la tienda). Es lo más reconocible y encaja con los bandos (Fase 26: tu ciudad según tu bando). Hay que medir cuánto pesa un recorte, porque la ciudad entera son 22 MB.
- **B) Un interior** (`cityhall_1`, `wrhus_1`, `gshop_1`...). Muy ligero, pero es una sala cerrada.
- **C) Un recorte de la granja.** Bonito, pero pesa mucho.
- Propuesta: **A** si el recorte pesa menos de ~3 MB; si no, **B**.

### Música
`aresden.mp3` o `elvine.mp3` (cuando lleguen los bandos, la de tu ciudad).

### Aceptación
- Tras elegir personaje apareces en la ciudad y puedes andar (teclado, mando y joystick táctil).
- Hablar con William abre los logros; el Cofre abre el equipo y el baúl; la vendedora y el herrero dicen "Coming soon".
- Entrar en el portal abre Select Map y empieza la partida. Al terminarla vuelves a la ciudad.
- La ciudad carga rápido también en el móvil.

---

## Fase 24 — Oro, tienda y herrero *(nueva)*

### Idea del propietario (18-oct-2026)
Usar el **oro** para mejorar las armas en el herrero, comprar Zem y otras cosas. Decidido: el oro **se conserva siempre** (también al morir sin Zem); una mejora fallida **no destruye** el objeto; **sin durabilidad** ni reparaciones; **no** se pueden reasignar los puntos de stat.

### Cómo era en el original (comprobado en `reference/Server.cpp`)
- El oro caía de los monstruos: el 60% de los drops principales, con una cantidad entre un mínimo y un máximo por monstruo (S:48262).
- Se gastaba en tiendas (S:13467) y reparaciones. Al vender, los atributos subían el precio (S:31123).
- **Xelima** mejoraba armas (+1 de daño por nivel, hasta +7) y **Merien** escudos y armaduras (hasta +10). Probabilidad de éxito 30, 25, 20, 15, 10, 10, 8, 8, 5, 3% según el nivel; Merien, el doble. Al fallar se perdía la piedra y, desde +1, también el objeto (S:52385-52595).

### Propuesta
- **De dónde sale:** monedas que sueltan los monstruos (más raras que las gemas, con imán), un montón al matar a un jefe, **vender** objetos (los atributos suben el precio) y algunos **logros**. Los mapas difíciles dan más.
- **En qué se gasta (NPCs de la ciudad):**
  - **Herrero:** mejoras **permanentes** (+1, +2...) con **Xelima** (armas) y **Merien** (armaduras) + oro. El precio sube con cada +. Si falla, se pierden la piedra y el oro, **nunca el objeto**. Ancient no se puede mejorar. Las piedras se compran o caen (poco) de los jefes.
  - **Tienda (Shop Keeper):** **Zem**, pociones para empezar la partida, equipo básico sin atributos (lo bueno siempre sale del botín). También las mejoras permanentes: **Abaddon's Blood**, **dado** (+1 Reroll por partida) y **vino** (+1 Skip por partida), estos dos hasta 3 veces cada uno (decidido el 21-oct-2026; programados en la Fase 21½B).
  - **Howard (almacén):** **ampliar el baúl** con más huecos.
- **Equilibrio:** un Zem ≈ el oro de 1–2 partidas; las mejoras altas, decenas de partidas. Precios que suben con el escalón del objeto, para que el oro no sobre a Level alto. Se mide con las métricas (añadir oro ganado y gastado).
- **HUD:** oro de la partida junto al contador de bajas; total en la pantalla final y en la ciudad.

### Bloques
- **24A:** oro en partida y vender.
- **24B:** tienda (Zem, pociones, equipo básico, Abaddon's Blood, dado y vino) y ampliar el baúl.
- **24C:** herrero.

### Aceptación
- Termino una partida con 300 de oro (aunque muera), vendo una espada que no uso y compro un Zem.
- El herrero mejora mi espada a +1; si falla pierdo la piedra y el oro, pero no la espada.

---

## Fase 25 — Más mapas y objetos únicos

### Objetos únicos (decidido el 18-oct-2026)
- Las armas y hechizos "top" clásicos (Battle Hammer, Blizzard...) se consiguen hacia las 8–20 h (Fase 20). Lo que alarga el juego hasta las ~60 h son los **objetos únicos**: armas, hechizos, anillos, collares y **ángeles tutelares** que caen poco y **solo de un jefe o mapa concreto**, y piden Level alto (~100+). Aquí entran las armas de 200 de Str (Barbarian Hammer, The_Devastator).
- **Protección contra la mala suerte:** cada intento fallido sube un poco la probabilidad del siguiente.
- Cada bloque de mapa añade sus únicos. Más adelante se pueden añadir más sin tocar la curva de Level.
- Los mapas piden un **Level recomendado** y dan más EXP, oro y mejor botín cuanto más difíciles.

### Mapas candidatos (medidos con el código del juego)
Columnas:
- **Zona libre:** % del mejor cuadrado de 100×100 casillas sin muros ni agua.
- **Descarga:** lo que bajaría el mapa entero.
- **Extra:** lo que se baja de más respecto a lo que ya carga huntzone2.

| Mapa | Zona libre | Descarga | Extra | Valoración |
|---|---|---|---|---|
| **Icebound** | 91% (94% en 80×80) | 9,2 MB | ~3,9 MB | ⭐ Excelente: campo nevado abierto. En el original nieva en este mapa (Fase 22) |
| **Dungeon L4** (`dglv4`) | 99% solo en 60×60; 63% en 100×100 | 4,9 MB | ~0,9 MB | ⭐ Bueno como **arena más pequeña** (una sala de 60×60). Muy barato. Pasillos alrededor |
| **Druncian City** | 86% | 8,5 MB | ~7,5 MB | Bueno: plazas abiertas. Tiene la hoja de casillas más pesada del juego (5 MB) |
| **Middleland** | 99% | 14,9 MB | menos si se recorta | Muy abierto, pero el propietario lo descartó por monótono. Se podría usar otra zona |
| **Farm** (`arefarm`/`elvfarm`) | 93–95% | **16,2 MB** | alto | Abierto y bonito, pero es el que más pesa |
| Aresden / Elvine (ciudades) | 92–96% | 22,2 MB | muy alto | Los más pesados. Ver La ciudad (Fase 23) y Bandos |
| Otros que encajan: Promiseland (`2ndmiddle`, 6,5 MB), Bisle (islas, 5,4 MB), Procella (10,6 MB), Abaddon (3,1 MB, aspecto infernal) | | | | |
| No encajan: dglv2, dglv3, Tower of Hell, Maze, fightzones (todo pasillos o muy pequeños) | | | | |

### Monstruos por mapa (propuesta)
Los rosters salen del original (wiki de helbreath.net y `GameWorlds.json`), adaptados a lo que tenemos dibujado.
- ✅ = el sprite existe y no lo usamos aún
- ♻️ = ya lo usamos

**🕳️ Dungeon Level 4**
- **Monstruos:** Lich ♻️, Ogre ♻️, Hellhound ♻️, Zombie ♻️, Skeleton ♻️, Gargoyle ♻️, Dark Elf ♻️, Beholder ✅.
- **Minijefe:** Demon ♻️ (en el original tenía su "pit" aquí).
- **Jefe final: Dragon ✅** (`barlog.spr`, el único dragón; en el original salía del cofre dorado de este mapa).
- **Música:** `dungeon.mp3`.
- Como la sala es pequeña, se juega distinto: más agobio y menos espacio para correr.

**🌾 Farm** (granja de Aresden o de Elvine)
- **Monstruos:** Slime ♻️, Giant Ant ♻️, Orc ♻️, Snake ♻️, Scorpion ♻️, Bunny ♻️, Cat ✅.
- **Decoración:** Scarecrow ✅ y cultivos (`crop.spr`) como decoración o "enemigos" que se rompen.
- **Mapa fácil o de principiantes**, ideal como **primer mapa** del juego. Pesa mucho (16 MB): se puede recortar.
- **Jefe:** aquí el jefe natural **es una Raid** (jugadores del otro bando atacando la granja). Ver Fase 27.
- **Música:** `aresden.mp3` o `elvine.mp3`, según la granja.

**🏙️ Druncian City** (primer mapa del Apocalypse; en el original se entraba por un portal en Icebound)
- **Monstruos:** Claw Turtle ✅, Giant Crayfish ✅, Nizie ✅, Stalker ♻️, Giant Frog ♻️, Tentocle ✅, Giant Lizard ✅, Master Mage Orc ✅ (mago orco).
- **Minijefe:** Hellclaw ♻️ (en el original tenía un "pit" aquí). **Jefe final:** Minotaur ♻️, o Centaurus ✅ y Sorceress ✅ juntas.
- **Música:** el tema original se perdió. `apocalypse.mp3` es muy corto para repetir en bucle: usar `abaddon.mp3` o `dungeon.mp3`.

**🌍 Middleland** (si se quiere volver a probar con otra zona)
- **Monstruos:** Ogre, Troll, Werewolf, Cyclops, Ettin, Zombie, Skeleton, Scorpion, Hellhound ♻️, más Mountain Giant ✅, Stone/Clay Golem ✅, Unicorn ✅ y Stalker ♻️.
- **Minijefe:** Hellclaw ♻️. **Jefe:** en el original era el Elementalist, pero está roto (Fire Elemental). Propongo **Dragon** o una **Raid grande**.
- **Música:** `middleland.mp3`. Es el mapa de guerra entre ciudades, así que pega con las Raids.

**🌲 Eternal Field** (`huntzone2`, el actual): se queda como está, con su línea de tiempo y el Fire Wyvern.

**No usar:** Abaddon, Fire Elemental y Magma Bull (incompletos). También están libres, para futuros mapas o jefes: Ugly Wyvern, Dark Knight, Temple Knight, Battle Golem, Barbarian, Giant Plant, Unicorn, Elf Master (con arco).

### Orden de mapas propuesto (dificultad creciente)
Farm → Eternal Field (actual) → Dungeon L4 → Icebound → Druncian City (→ Middleland).

### Bloques
**24A, 24B...:** un mapa por bloque, con `/anadir-mapa` y `/anadir-enemigo` para cada monstruo.

---

## Fase 26 — Aresden y Elvine

### Cómo era en el original
- Empezabas como **Traveller** (neutral, sin perder objetos al morir) y luego elegías ciudad.
- Cada ciudad tenía su granja, su dungeon, su jardín, sus cuarteles y su cárcel.
- **Middleland** era la zona de guerra. La **Crusade** era una guerra de ciudades con torres, Mana Stones, Energy Shield, Grand Magic Generator (lanza meteoritos) y detectores.
- Los **guardias** atacaban a los enemigos del bando contrario y a los PK (S:10468).
- Con **EK** (muertes de enemigos) y **contribución** se compraban los objetos **Hero** en el City Hall. Por ejemplo, la Hero Cape costaba 300 EK y la Hero Armor 300 EK + 30 de contribución (C:33627).
- **Colores:** en el original, el nombre del enemigo sale en **rojo**, el neutral en azul y el aliado en verde. El "Aresden rojo / Elvine azul" es una convención de la comunidad (banderas, capas) **[de memoria]**.

### Opciones para meterlo (se pueden combinar)
- **A) Elegir bando al empezar** (recomendada, base de todo lo demás):
  - En la selección de personaje, un botón **Aresden / Elvine**.
  - Cambia el **color de la capa** y del nombre, la música del menú (`aresden.mp3` / `elvine.mp3`) y **la ciudad** de la Fase 23 (si se usó un recorte de ciudad).
  - Da un **bonus pequeño** distinto a cada bando, por ejemplo: Aresden +5% de daño físico, Elvine +5% de daño mágico. Esto es invención nuestra.
  - **Decide quién te ataca en las Raids** (el otro bando).
- **B) Objetos Hero con EK** (meta-progresión, se apoya en el baúl de la Fase 21):
  - Cada jugador enemigo que matas en una Raid da **EK**, que se guarda entre partidas.
  - Con EK se **desbloquean los objetos Hero de tu bando**: capa, casco, armadura... Los sprites existen todos, en versión Aresden y Elvine, hombre y mujer. Se "compran" a William en la ciudad, como en el City Hall del original.
- **C) Mapas de ciudad / Crusade:** ver "Ideas para después".

### Assets
- **Existen:**
  - armaduras, cascos, capas y túnicas Hero de los dos bandos (por ejemplo, Hero Cape de Aresden `mmantle01`, de Elvine `mmantle02`);
  - banderas en el suelo (`item-ground` 5/56 Aresden, 5/57 Elvine);
  - aura del set Hero (`effect10` hojas 0/1);
  - guardia (`guard.spr`, un solo dibujo para los dos bandos), torres y estructuras de Crusade;
  - música de las dos ciudades.
- **No existen:** escudos de armas ni logos de ciudad. La elección de ciudad del original era solo texto. Haría falta usar las banderas o dibujar un emblema sencillo.

### Aceptación (opción A)
- Elijo Elvine en la selección y mi capa, el color de mi nombre, la música y la ciudad lo reflejan.
- El bando se guarda para la próxima partida.

---

## Fase 27 — Raids: "jugadores" enemigos

### Qué era una raid
Un grupo de jugadores del bando enemigo entrando en tu ciudad, granja o dungeon para matar ciudadanos. El original lo limitaba con un "raid time": unos días a la semana se permitía estar más tiempo en la zona enemiga. También había grupos de PK en Middleland.

**Tipos de jugador [de memoria + `Magic.cfg`]:**
- **Guerreros:** con Giant Sword, Flamberge, hachas o martillos. Corrían detrás de ti y lanzaban crits desde 2–4 casillas, a menudo con Berserk.
- **Magos:** con Paralyze, Ice Strike o Mass Chill Wind (para frenarte), seguidos de Mass Fire Strike, Lightning o Meteor. Invisibilidad para emboscar.
- **Arqueros:** menos comunes.

### Propuesta
- **Un tipo de enemigo nuevo, `RaiderEnemy`**: se dibuja con el mismo `CharacterSprite` del jugador. Ya sabe componer cuerpo, pelo, armadura, arma y capa, de hombre y de mujer.
  - Lleva **la capa y la armadura Hero del bando contrario** y un **nombre** inventado encima, en rojo ("xXKillerXx", "NkPower"... una lista en `data/`).
- **Arquetipos** (en `data/raiders.ts`):
  - **Raider Warrior:** corre más que un monstruo (casi como tú). Persigue, de vez en cuando **grita y lanza un crit** desde 2–3 casillas (con aviso previo de 0,5 s para poder esquivar). Espada grande o hacha.
  - **Raider Mage:** se mantiene a distancia. Lanza Energy Bolt o Fire Ball y, a veces, **Ice Strike o Paralyze**, que te **frenan 1 s** (con aviso). Huye si te acercas.
  - **Raider Archer** (opcional, si se hace el Arquero): dispara flechas.
- **Cuándo aparecen:**
  - como **evento de la línea de tiempo** (`waves.ts`): "Elvine raiders have entered the map!", un grupo de 2–5;
  - también **al azar** en algunos mapas: una probabilidad por minuto a partir del minuto 4, por ejemplo.
  - En la **Farm**, la raid es el jefe final: un grupo grande con un "líder" con más vida.
- **Recompensa:** matar a un raider da mucha XP, **EK** (si se hace la opción B de Bandos), probabilidad de Zem, de cofre y de **equipo** (Fase 21).
- **Ellos usan buffs** (Berserk = brillo rojo, como el tuyo) para que se note que son "jugadores".
- **Rendimiento:** cada raider son ~8–12 dibujos (como el jugador) en vez de 1. **Máximo 6 a la vez**. Con `pooling`, como todo lo demás. Aquí se mide el **límite de enemigos en el móvil** (traído de la Fase 10).
- **Sonidos:** los del jugador (golpe C18, quejido C12/C13, grito C23/C24, hechizos E*).

### Aceptación
- En el minuto 6 de Eternal Field aparece un grupo de 3 jugadores de Elvine (si eres de Aresden). El guerrero te persigue y grita al lanzar su crit; el mago te frena con hielo.
- Al matarlos sueltan buena recompensa.
- Se mantienen 60 FPS con 300 monstruos + 6 raiders.

---

## Fase 28 — Ranking online *(opcional)*

- Reutiliza el servidor de las métricas (Fase 14, Cloudflare Workers + D1). El juego envía la marca al terminar.
- Top por mapa y clase, visible en la pantalla Records junto a los récords locales.
- **Problemas:**
  - **trampas:** cualquiera puede enviar marcas falsas, y en un juego web no se pueden evitar del todo; solo dificultar (comprobar que la partida tiene sentido);
  - **nombres ofensivos:** filtro básico;
  - **privacidad:** solo nombre y marca, sin datos personales.
- Cumple la regla 8 (nada de pagos ni anuncios).

---

## Mejoras de engagement para más adelante (21-oct-2026)
Del análisis `docs/ENGAGEMENT.md`, comentado con el propietario el 21-oct-2026. Lo que cabe ya está en la Fase 21½.
- **Pasivas con efecto** (le gusta al propietario): cartas que cambian cómo juegas, no solo números. Ejemplos: **aura de daño en zona** alrededor del jugador, rebote del proyectil, explosión al matar, robo de vida, tajo más ancho, una bola de fuego extra cada pocos segundos. Necesita efectos visuales y equilibrio propio: **fase propia** (propuesta: justo después de la 22, con mapas más duros donde lucirse).
- **Combinaciones:** dos pasivas concretas al máximo desbloquean una carta especial (como las evoluciones de Vampire Survivors o los dobles de Hades). Va con las pasivas con efecto.
- **Botín de jefes y premios grandes:** cofre con animación y 1/3/5 premios, botín del jefe final siempre del escalón siguiente o mejor. Se resuelve en las **Fases 24 y 25** (oro, tienda, únicos).
- **Retos opcionales con premio:** tótem-desafío ("aguanta 30 s rodeado → objeto seguro") o dificultad elegible al escoger mapa (como el Heat de Hades). Encaja en la **Fase 22** o la 25.
- **Historia y personajes:** NPCs de la ciudad que comentan tu última muerte, tu récord o tu mejor objeto. **Después de la ciudad (Fase 23).**
- **Logros con premio y colección:** que algunos logros den oro, un hueco de baúl o Reroll extra (Fase 24); una colección de objetos con huecos en gris.
- **Botín con más emoción:** color de rareza en el suelo (gris / azul / dorado) y que "de tu escalón" pueda salir con atributo o +1. Revisar con las partidas de prueba (`docs/ENGAGEMENT.md`, apartado 5).

## Ideas para después (sin fase todavía)
- **Récords locales** (era el bloque 22F; aplazado por el propietario el 21-oct-2026):
  - Top 10 por **mapa** y **clase**, guardado en el navegador.
  - **Orden:** victoria primero; después, menos tiempo para ganar; si no se ganó, más tiempo sobrevivido. Muestra nivel y bajas.
  - Pantalla "Records" en el menú principal y tu mejor marca en Select Map. En la pantalla final: "New record!" (sonido E23).
  - Tu nombre se escribe una vez. En el móvil y con el mando hace falta un teclado en pantalla, o usar el nombre del personaje ("NkII"/"NMs").
  - No hay arte de "ranking" en el original: se reutilizan los paneles de GameDialog (hoja 2, frames 1–2) y la fuente dibujada.
- **El Arquero** (aplazado desde la Fase 8). Encaja con las Raids (Raider Archer) y con los crits a distancia del original.
- **Misiones:** William da encargos ("mata 500 orcos en la granja") con recompensa.
- **Bolsa ligera de consumibles:** 3–4 casillas de pociones y pergaminos con tecla propia (era la Fase 19 del borrador anterior).
- **Bandos, opción C — "Defend your city" / Crusade:** proteger la Mana Stone de tu ciudad con torres y guardias aliados (sprites `guard`, `gt-arrow`, `gt-cannon`, `manastone`). Muy grande, y los mapas de ciudad pesan 22 MB.
- **Volver a probar Middleland** con otra zona del mapa.
- **Más logros** en cada fase nueva.

## Cosas que afectan a varias fases
- **Móvil:** cada botón nuevo (crit o hechizo activo, hablar en la ciudad, carta Equip / Keep in bag, pantalla de equipo) necesita versión táctil y debe verse bien con lo hecho en la Fase 10A (todo más grande en el móvil).
- **Controles:** todo control nuevo se explica en **How to play** (Fase 11), no en pantalla.
- **Guardado:** la Fase 12 crea el guardado en el navegador; logros (14), personajes (17), Level y equipo (20), baúl (21), récords (22) y oro (24) lo reutilizan. Cambiar su formato exige versión y migración, para no borrar el progreso de nadie.
- **Descarga:**
  - cada mapa añade 1–8 MB y cada monstruo grande 0,5–3,6 MB (el Wyvern pesa 3,6 MB);
  - se descargan **solo al elegir el mapa**, con `AssetStreamer`;
  - la descarga inicial no debe crecer. La ciudad (Fase 23) debe ser ligera.
- **Equilibrio:** primera pasada en la Fase 13 (25–30 niveles de partida, hoy Power, en 12–15 minutos). Repasarlo al cerrar las Fases 19, 20, 21, 22, 24 y 27, con los datos de las métricas (Fase 14). Desde la Fase 20 hay dos curvas: Power (la partida) y Level (~60 h hasta el 140).
- **Nombres:** **Level** es siempre el permanente del personaje; en partida se habla de **Power**. No usar "level" para la partida en textos del juego.
- **Logros:** cada fase añade los suyos ("Win Icebound", "Kill 50 raiders", "Revive with Abaddon's Blood", "10 Critical Strikes in one run", "Reach Level 50").

## Decisiones pendientes del propietario
Las de las Fases 11–18 ya se tomaron (ver `survivors/PROGRESS.md` y el historial). Quedan, para preguntar al empezar cada fase (`/fase N`):
1. **Fase 19:** ¿Espacio o Alt en el teclado? ¿Qué hechizo activo lleva el Mago hasta la Fase 20?
2. **Fase 20:** ¿se mantienen las clases Warrior/Mage como "estilo" (propuesta: sí)? ¿Cuánta EXP de la partida pasa al personaje? ¿Puntos libres al crear el personaje (como los 10 del original)?
3. **Fase 21:** porcentajes del botín y de los atributos. ¿Lo guardado en la bolsa va al baúl o al inventario del personaje al terminar?
4. ~~**Fase 22:**~~ decidido el 20-oct-2026 (ver `docs/DECISIONES.md`).
5. **Fase 23:** ¿la ciudad es un recorte de Aresden/Elvine o un interior pequeño?
6. **Fase 24:** precios, y si las piedras Xelima/Merien se compran o solo caen.
7. **Fase 26:** ¿solo la opción A, o también la B (EK y objetos Hero)? ¿Bonus distinto por bando o solo estético?

### Ya decidido el 18-oct-2026 (replanteo)
- Dos progresiones: **Level** (permanente, máximo 140, ~60 h, 3 puntos por Level, stats hasta 200) y **Power** (la partida).
- Las armas y armaduras **dejan de salir en las cartas**; las cartas dan stats temporales, Xelima (daño) y Merien (defensa) para esa partida.
- Requisitos con stats permanentes; las armas y hechizos altos piden también Level.
- Botín según tu Str/Int con una tirada (de tu escalón, del siguiente, peor o un salto grande).
- Baúl compartido por los 4 personajes del dispositivo.
- Al morir sin Zem se pierde el botín de esa partida; **el oro se conserva siempre**.
- Herrero: una mejora fallida **no destruye** el objeto. **Sin durabilidad.** **No** se reasignan los puntos.
- Resurrección = **Abaddon's Blood** (icono del Red Ball), una por partida. *(20-oct-2026: mejora permanente que se compra, no cae de jefes; ver 21E.)*
- Mago con 2 hechizos (automático + activo); Guerrero con arma + Critical Strike; mismo botón.
