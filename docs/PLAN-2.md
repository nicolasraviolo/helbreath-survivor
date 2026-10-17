# Plan de desarrollo — Segunda etapa (Fases 11+)

> Borrador del 17-oct-2026, reordenado el mismo día con las ideas nuevas del propietario. **Orden aprobado por el propietario el 17-oct-2026**; las decisiones de cada fase se preguntan al empezarla.
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
| **16** | Crits ("gritos") | Golpe crítico con cargas · vibración y reasignar controles | Pequeño |
| **17** | Zem | Vida extra: revives una vez | Pequeño |
| **18** | Minimapa y tótems | Minimapa · tótems en el mapa que dan buffs | Pequeño-medio |
| **19** | Sistema de mapas + Icebound | Varios mapas, Select Map, récords locales por mapa, sombras, Icebound | Grande |
| **20** | La ciudad | Mapa pequeño tras elegir personaje: NPCs, cofre y portal a la partida | Grande |
| **21** | Equipo y baúl | Equipar armas, escudos y armaduras · los jefes sueltan equipo · se guarda entre partidas | Grande |
| **22** | Más mapas | Un mapa por bloque | Grande (por partes) |
| **23** | Aresden y Elvine | Elegir bando · objetos Hero con EK | Medio |
| **24** | Raids | "Jugadores" enemigos del otro bando | Medio-grande |
| **25** | Ranking online *(opcional)* | Reutiliza el servidor de la Fase 14 | Pequeño |

**Por qué este orden:**
1. **11–13:** primero lo que arregla molestias que ya existen: visibilidad, controles, partidas perdidas en el móvil, subir de nivel demasiado rápido y un final de partida abrupto.
2. **14:** las métricas, pronto, para que todo lo que venga después se equilibre con datos reales. Los logros van aquí porque cuentan las mismas cosas.
3. **15–18:** mejoras de la partida de hoy, pequeñas y divertidas. El apuntado va antes que los crits porque el crit sale hacia donde apuntas.
4. **19–21:** la gran base: varios mapas, la ciudad como "centro" del juego y el equipo que se guarda (el cofre vive en la ciudad).
5. **22–25:** contenido que se apoya en todo lo anterior.

**Dependencias:** la 21 necesita el guardado (12) y la ciudad (20); la 20 necesita el sistema de mapas (19); la 24 necesita los bandos (23); la 25 necesita el servidor (14). El resto puede moverse si el propietario quiere otra prioridad.

### De dónde viene cada cosa del borrador anterior
| Antes | Ahora |
|---|---|
| 11 Crits | 16. Los iconos del mando en pantalla se cambian por la página How to play (Fase 11) |
| 12 Zem | 17 |
| 13 Minimapa | 18, con los tótems |
| 14 Sistema de mapas + Icebound | 19. La pantalla Select Map se abre desde el portal de la ciudad (Fase 20) |
| 15 Más mapas | 22 |
| 16 Bandos | 23. La opción B (objetos Hero) se apoya en el baúl de la 21 |
| 17 Raids | 24 |
| 18 Leaderboard | Récords locales → 19 · progresión entre partidas → 21 · online → 25 |
| 19 Bolsa ligera | Sustituida por **Equipo y baúl** (21), a petición del propietario |

### Traído de la Fase 10
| Qué | Dónde |
|---|---|
| Vibración del mando, reasignar controles | Fase 16 (Crits) |
| Iconos de botones de Xbox | Fase 11, **solo dentro de How to play** (el propietario quiere la partida sin textos de controles) |
| Sombras bajo personajes y monstruos | Fase 19 |
| Récords locales | Fase 19 |
| Progresión entre partidas | Fase 21 |
| Límite de enemigos en el móvil | Fase 24 (Raids), o antes si el móvil va lento |
| Equilibrio | Fase 13, y repaso al cerrar cada fase de combate |

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
- Esto es la base del guardado de las Fases 14 (logros), 19 (récords) y 21 (baúl).

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
- Se repite un repaso de equilibrio al cerrar las Fases 16, 17, 19 y 24. Desde la Fase 14, con datos reales.

### Aceptación
- Al salir el Wyvern no aparecen monstruos nuevos, solo sus esbirros.
- Al matarlo se abre el portal; entrar en él o esperar 30 s lleva a la pantalla de victoria.
- Una partida completa sube de nivel al ritmo acordado, y el propietario la nota menos agobiante.

---

## Fase 14 — Métricas y logros

### 14A. Métricas
- **Para qué:** entender la dificultad. Si la gente muere muy rápido o no muere nunca, con qué personaje, en qué minuto...
- **Qué se envía al terminar cada partida** (anónimo, sin datos personales): versión del juego, mapa, clase, móvil u ordenador, resultado, minuto de muerte, nivel alcanzado, bajas, qué te mató, armas y cartas elegidas, si se usó Zem o crits, y los FPS medios.
- **Dónde:** un servidor pequeño y gratuito, **Cloudflare Workers + D1**. El mismo servirá para el ranking online (Fase 25).
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
- En la Fase 20, un NPC de la ciudad enseña los logros y, más adelante, misiones.

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
- **En el móvil:** solo automático (no hay segundo stick, y el lado derecho será para el botón del crit).
- **Decisión del propietario:** el clic deja de servir para moverse (el ratón pasa a apuntar), o el clic izquierdo mueve y el derecho apunta.
- Se explica en How to play.

### Aceptación
- Con el mando, el stick derecho dirige los ataques; al soltarlo vuelven a buscar al más cercano.
- Con el ratón, igual. En el móvil, todo sigue como ahora.

---

## Fase 16 — Crits ("Gritos")

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

## Fase 17 — Zem: la resurrección

### Cómo era en el original (comprobado)
- **Zemstone of Sacrifice** (objeto 650). Al morir, en vez de perder objetos al azar, **se perdía el Zem**. Tenía **3 usos** (durabilidad 3) y luego se rompía (S:25270, S:12370).
- Se conseguía como drop de jefes (Abaddon), en drops especiales de monstruos y en la lotería del City Hall. No se podía comprar.
- Aparte existía el hechizo **Resurrection** (revive con la mitad de la vida, una vez cada 5 minutos, S:19964). Era una adición tardía.
- **Dibujo:** `item-ground`/`item-pack` hoja 15, frame 39. El efecto "Resurrection" está en `effect11.spr` hoja 10 (21 frames, aditivo).

### Adaptación propuesta (idea del propietario, casi tal cual)
- **Solo puedes llevar un Zem.** Si coges otro teniendo uno, se convierte en otra cosa (por ejemplo, una poción grande o mucha XP) para que no se desperdicie.
- **Cómo se consigue:**
  - **siempre** en el cofre del segundo minijefe (Demon);
  - con una probabilidad baja en cofres normales;
  - muy raro como drop de cualquier monstruo (~0,05%, a ajustar).
- **Al morir con Zem:**
  1. El juego se para medio segundo.
  2. Sale el efecto Resurrection, se oye el grito de subir de nivel (C21/C22) y el texto "Zemstone of Sacrifice!".
  3. Revives con el **50% de la vida** y **3 s de invulnerabilidad**.
  4. Una onda empuja a los enemigos cercanos, para que no mueras al instante.
  5. El Zem desaparece.
- **HUD:** el icono del Zem en una casilla junto a la barra; gris si no tienes.
- **En el Game Over:** "Revived 1 time" en las estadísticas.
- **Decisión del propietario:** ¿un Zem por partida como máximo, o puedes conseguir otro después de gastarlo? Propongo que sí puedas, porque es raro.

### Assets
Todo existe: icono 15/39, `effect11` hoja 10, sonidos C21/C22, E23. Hay un detalle por comprobar: el código original pide 30 frames del efecto, pero la hoja tiene 21.

### Aceptación
Con un Zem (tecla de pruebas), al morir revives con media vida, efecto y sonido. Sin Zem, Game Over normal. Solo se puede llevar uno.

---

## Fase 18 — Minimapa y tótems

### 18A. Minimapa

#### Qué hay en el original
- El "GuideMap" era un cuadro de **128×128** con una miniatura del mapa (`telescope.spr` hoja 0, un frame por mapa: huntzone2 = 9, icebound = 24, middleland = 4, dglv4 = 14, arefarm = 6, elvfarm = 5, druncncity = 25).
- El punto del jugador era GameDialog hoja 4, frame 37 (6×5 px). Los frames 36–39 son puntos de otros colores y los 40–43, marcadores de 12×12.
- **El original no dibujaba monstruos.** Eso lo añadimos nosotros.
- Alternativa: `sp-client/public/assets/images/minimaps/*.jpg` (1500×1500, uno por mapa), más nítidos para recortar.

#### Propuesta
- Cuadro de ~128×128 arriba a la **izquierda**. Arriba a la derecha está el botón de pausa táctil.
- Muestra **solo la zona de juego** (nuestro recorte de 100×100 casillas), no el mapa entero.
- **Puntos:** jugador (el punto original); **jefes** (marcador grande que parpadea); **cofres** (dorado); **pociones** (rojo); **Zem** (violeta); **tótems** (su propio color, apagado mientras recargan); **portal** del jefe (Fase 13); **jugadores enemigos** cuando lleguen las Raids (rojo grande).
- **Monstruos normales: no.** Con 300 enemigos sería una mancha. Como mucho, opcional en Settings, en forma de puntitos sueltos.
- **Settings:** "Minimap: On/Off" y quizá tamaño grande o pequeño. En el móvil, más pequeño o plegable al tocarlo.
- Fuera de pantalla: una **flecha en el borde** hacia el jefe, el portal o el cofre más cercano. Opcional.
- **Teclas de pruebas:** M y C ya están ocupadas (saltar al jefe, panel de stats). El minimapa no se activa con M.

### 18B. Tótems
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

## Fase 19 — Sistema de mapas + Icebound

### 19A. Sistema de mapas
Hoy todo está pensado para un solo mapa (`huntzone2`). Hay que:
- **`data/maps.ts`** con todo lo de cada mapa: recorte de juego, oleadas propias, minijefes, jefe final, música, miniatura, tótems y monstruos que descargar.
- **`data/waves.ts` por mapa** (una línea de tiempo cada uno).
- **Pantalla "Select Map"** con la miniatura, el nombre, la dificultad y tu récord en ese mapa. En esta fase se abre después de elegir clase; en la Fase 20 se abrirá desde el portal de la ciudad.
- **Desbloqueo:** ganar un mapa abre el siguiente (guardado en el navegador). Una tecla de pruebas los abre todos.
- **Descargas:** `AssetStreamer` baja solo los monstruos y casillas del mapa elegido. Hoy ya lo hace por oleada, así que se adapta. Las casillas del mapa se descargan **al elegirlo**, no antes del menú.

### 19B. Récords locales (antes en la Fase 18)
- Top 10 por **mapa** y **clase**, guardado en el navegador.
- **Orden:** victoria primero; después, menos tiempo para ganar; si no se ganó, más tiempo sobrevivido. Muestra nivel y bajas.
- Pantalla "Records" en el menú principal y tu mejor marca en Select Map. En la pantalla final: "New record!" (sonido E23).
- Tu nombre se escribe una vez. En el móvil y con el mando hace falta un teclado en pantalla, o usar el nombre del personaje ("NkII"/"NMs").
- No hay arte de "ranking" en el original: se reutilizan los paneles de GameDialog (hoja 2, frames 1–2) y la fuente dibujada.

### 19C. Icebound
- **Primer mapa nuevo** (el más pedido y de los que mejor encajan).
- **Monstruos:** Frost ✅, Dire Boar ♻️, Ice Golem ✅, Skeleton ♻️, Stone Golem ✅, Beholder ✅, Rudolph ✅ (reno navideño), Claw Turtle ✅.
- **Minijefes:** Tigerworm ♻️ (en el original tenía un "pit" en Icebound) y Nizie ✅.
- **Jefe final: Wyvern ✅** (`wyvern.spr`, 3,6 MB). Es el "Ice Wyvern" que recuerda el propietario: en el original suelta armas de hielo. El Fire Wyvern ya es el jefe de huntzone2.
- **No existen:** Yeti, Ice Lizard ni dragones de hielo.
- **Extra temático:** que Frost e Ice Golem **ralenticen** al jugador al golpear **[de memoria; hay que comprobarlo en el original]**. Copos de nieve cayendo. Y encaja con activar la familia de hechizos **Ice** de la Maga (está prevista y apagada).
- **Música:** el original no tenía tema propio (sonaba la general). Propongo `default.mp3` o `elvine.mp3`.

### Traído de la Fase 10: sombras
- Sombra bajo personajes y monstruos (el original las dibuja; mirar cómo en `sp-client`). Se ajusta con cada suelo y se mide el rendimiento, sobre todo en el móvil.

### Al terminar
Crear la skill `/nueva-skill anadir-mapa`.

### Aceptación
- Desde el menú se elige Icebound. Salen sus monstruos, minijefes y el Wyvern.
- Al ganarlo queda registrado, y la pantalla Records lo muestra.
- huntzone2 sigue igual que antes. La descarga extra se nota poco.

---

## Fase 20 — La ciudad

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
| **Howard** | `howard` | Warehouse Keeper | Junto al **Cofre**: gestionar el equipo (se activa en la Fase 21) |
| **Shop Keeper** | `shopkpr` | La vendedora | **Tienda** (a futuro); de momento, "Coming soon" |
| **William** | `william` | City Hall | **Logros** (Fase 14) y, más adelante, **misiones** |
| Tom, Gandalf, Kennedy... | `tom`, `gandlf`, `kennedy` | Herrero, magia, gremio | Decoración o usos futuros (mejorar equipo, comprar hechizos...) |

- **Hablar:** acercarse y pulsar una tecla o botón (en el móvil, un botón "Talk" que aparece al estar cerca). Se abre un panel con el diseño de GameDialog.
- **El Cofre:** un objeto en el suelo junto a Howard. En esta fase solo se ve; en la 21 abre el equipo.
- **El Portal:** el mismo efecto que el del jefe (Fase 13). Al entrar se abre Select Map.

### El mapa de la ciudad
Tiene que pesar poco: es lo primero que se carga después del menú. Opciones (medir con un subagente):
- **A) Un recorte pequeño de Aresden o Elvine** (una plaza con el almacén y la tienda). Es lo más reconocible y encaja con los bandos (Fase 23: tu ciudad según tu bando). Hay que medir cuánto pesa un recorte, porque la ciudad entera son 22 MB.
- **B) Un interior** (`cityhall_1`, `wrhus_1`, `gshop_1`...). Muy ligero, pero es una sala cerrada.
- **C) Un recorte de la granja.** Bonito, pero pesa mucho.
- Propuesta: **A** si el recorte pesa menos de ~3 MB; si no, **B**.

### Música
`aresden.mp3` o `elvine.mp3` (cuando lleguen los bandos, la de tu ciudad).

### Aceptación
- Tras elegir personaje apareces en la ciudad y puedes andar (teclado, mando y joystick táctil).
- Hablar con William abre los logros; la vendedora dice "Coming soon".
- Entrar en el portal abre Select Map y empieza la partida. Al terminarla vuelves a la ciudad.
- La ciudad carga rápido también en el móvil.

---

## Fase 21 — Equipo y baúl

### Idea del propietario
Un inventario donde equipar **armas, escudos, armaduras** y otros objetos. Cambia la mecánica de drop: **las armas y armaduras caen de los jefes** y se guardan entre partidas y mapas.

### Choques con lo que hay (a decidir al empezar la fase)
- `DESIGN.md` dejaba el inventario completo fuera del juego, y la Fase 19 anterior proponía solo una bolsa ligera de pociones. **El propietario ha pedido el inventario de equipo**, así que esta fase la sustituye.
- Hoy las armas se consiguen con las **cartas de subir de nivel** (Fase 6). **Decisión clave:** ¿qué pasa con esas cartas?
  - **Propuesta:** lo que equipas en la ciudad es tu **equipo de salida** (empiezas la partida con esa arma y esa armadura, y sus stats). Durante la partida, las cartas siguen dando armas nuevas y mejorándolas. Así se mantiene el ritmo Survivors y el equipo da progresión entre partidas.
  - Alternativa: las armas solo vienen del equipo y las cartas solo dan stats y mejoras. Es un cambio mucho más grande del juego.
- Los **cofres de los minijefes** dan hoy buffs. Propuesta: pasan a dar **equipo** (y los buffs quedan para los tótems de la Fase 18).

### Propuesta
- **Equipo:** arma, escudo, casco, armadura, pantalones, botas, capa y quizá anillo o collar. Los sprites existen: el `CharacterSprite` ya compone cuerpo, armadura, arma y capa, y hay iconos en `item-pack`.
- **Pantalla de equipo** con el diseño original del inventario (GameDialog) y el muñeco del personaje, al hablar con Howard o abrir el Cofre en la ciudad.
- **Baúl (stash):** todo lo que consigues se guarda en el navegador (con el guardado de la Fase 12). Sirve para cualquier mapa.
- **Drops:** el jefe final suelta 1–2 piezas al morir (junto al portal de la Fase 13); los minijefes, a veces. Rareza (común, rara, épica) con color en el nombre.
- **En partida:** el equipo conseguido se ve como "botín" y se guarda al terminar, ganes o pierdas (o solo si ganas: decisión del propietario).
- **Pociones:** se quedan como ahora (se usan al cogerlas). La "bolsa ligera" del borrador anterior queda como idea para después.
- **Bandos (Fase 23, opción B):** los objetos Hero desbloqueados con EK aparecen aquí.
- **Tienda (a futuro):** la Shop Keeper de la ciudad podría vender equipo por oro.

### Bloques
- **21A:** datos del equipo, baúl guardado y pantalla de equipo en la ciudad.
- **21B:** drops de jefes y minijefes, equipo de salida en partida.
- **21C** (si hace falta): rarezas, comparar piezas, vender o romper lo que sobra.

### Aceptación
- Mato al Wyvern, cae una espada; vuelvo a la ciudad, la equipo en el Cofre y empiezo la siguiente partida con ella.
- Sigue en el baúl después de cerrar el navegador.

---

## Fase 22 — Más mapas

### Mapas candidatos (medidos con el código del juego)
Columnas:
- **Zona libre:** % del mejor cuadrado de 100×100 casillas sin muros ni agua.
- **Descarga:** lo que bajaría el mapa entero.
- **Extra:** lo que se baja de más respecto a lo que ya carga huntzone2.

| Mapa | Zona libre | Descarga | Extra | Valoración |
|---|---|---|---|---|
| **Icebound** | 91% (94% en 80×80) | 9,2 MB | ~3,9 MB | ⭐ Excelente: campo nevado abierto. En el original nieva en este mapa (Fase 19) |
| **Dungeon L4** (`dglv4`) | 99% solo en 60×60; 63% en 100×100 | 4,9 MB | ~0,9 MB | ⭐ Bueno como **arena más pequeña** (una sala de 60×60). Muy barato. Pasillos alrededor |
| **Druncian City** | 86% | 8,5 MB | ~7,5 MB | Bueno: plazas abiertas. Tiene la hoja de casillas más pesada del juego (5 MB) |
| **Middleland** | 99% | 14,9 MB | menos si se recorta | Muy abierto, pero el propietario lo descartó por monótono. Se podría usar otra zona |
| **Farm** (`arefarm`/`elvfarm`) | 93–95% | **16,2 MB** | alto | Abierto y bonito, pero es el que más pesa |
| Aresden / Elvine (ciudades) | 92–96% | 22,2 MB | muy alto | Los más pesados. Ver La ciudad (Fase 20) y Bandos |
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
- **Jefe:** aquí el jefe natural **es una Raid** (jugadores del otro bando atacando la granja). Ver Fase 24.
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
**22A, 22B...:** un mapa por bloque, con `/anadir-mapa` y `/anadir-enemigo` para cada monstruo.

---

## Fase 23 — Aresden y Elvine

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
  - Cambia el **color de la capa** y del nombre, la música del menú (`aresden.mp3` / `elvine.mp3`) y **la ciudad** de la Fase 20 (si se usó un recorte de ciudad).
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

## Fase 24 — Raids: "jugadores" enemigos

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

## Fase 25 — Ranking online *(opcional)*

- Reutiliza el servidor de las métricas (Fase 14, Cloudflare Workers + D1). El juego envía la marca al terminar.
- Top por mapa y clase, visible en la pantalla Records junto a los récords locales.
- **Problemas:**
  - **trampas:** cualquiera puede enviar marcas falsas, y en un juego web no se pueden evitar del todo; solo dificultar (comprobar que la partida tiene sentido);
  - **nombres ofensivos:** filtro básico;
  - **privacidad:** solo nombre y marca, sin datos personales.
- Cumple la regla 8 (nada de pagos ni anuncios).

---

## Ideas para después (sin fase todavía)
- **El Arquero** (aplazado desde la Fase 8). Encaja con las Raids (Raider Archer) y con los crits a distancia del original.
- **Tienda:** la Shop Keeper vende equipo o consumibles por oro ganado en las partidas.
- **Misiones:** William da encargos ("mata 500 orcos en la granja") con recompensa.
- **Bolsa ligera de consumibles:** 3–4 casillas de pociones y pergaminos con tecla propia (era la Fase 19 del borrador anterior).
- **Bandos, opción C — "Defend your city" / Crusade:** proteger la Mana Stone de tu ciudad con torres y guardias aliados (sprites `guard`, `gt-arrow`, `gt-cannon`, `manastone`). Muy grande, y los mapas de ciudad pesan 22 MB.
- **Volver a probar Middleland** con otra zona del mapa.
- **Más logros** en cada fase nueva.

## Cosas que afectan a varias fases
- **Móvil:** cada botón nuevo (crit, hablar en la ciudad, minimapa) necesita versión táctil y debe verse bien con lo hecho en la Fase 10A (todo más grande en el móvil).
- **Controles:** todo control nuevo se explica en **How to play** (Fase 11), no en pantalla.
- **Guardado:** la Fase 12 crea el guardado en el navegador; logros (14), récords (19) y baúl (21) lo reutilizan. Cambiar su formato exige versión y migración, para no borrar el progreso de nadie.
- **Descarga:**
  - cada mapa añade 1–8 MB y cada monstruo grande 0,5–3,6 MB (el Wyvern pesa 3,6 MB);
  - se descargan **solo al elegir el mapa**, con `AssetStreamer`;
  - la descarga inicial no debe crecer. La ciudad (Fase 20) debe ser ligera.
- **Equilibrio:** primera pasada en la Fase 13 (objetivo inicial: 25–30 niveles en 12–15 minutos, a confirmar). Repasarlo al cerrar las Fases 16, 17, 19 y 24, con los datos de las métricas (Fase 14).
- **Logros:** cada fase añade los suyos ("Win Icebound", "Kill 50 raiders", "Revive with a Zem", "10 Critical Strikes in one run").

## Decisiones pendientes del propietario
Se preguntan al empezar cada fase (`/fase N`):
1. **Orden general** de las fases (propuesta arriba).
2. **Fase 13:** ritmo de subida de nivel deseado (¿cuántos niveles en una partida completa?).
3. **Fase 14:** ¿montamos el servidor de métricas (cuenta gratuita de Cloudflare)?
4. **Fase 15:** ¿el clic deja de mover al personaje, o clic izquierdo mueve y derecho apunta?
5. **Fase 16:** ¿la Maga sin crits (como el original) o con "Critical Cast"? ¿Espacio o Alt en el teclado?
6. **Fase 17:** ¿se puede conseguir otro Zem después de gastarlo?
7. **Fase 18:** ¿los cofres siguen dando buffs o pasan a dar equipo (con la Fase 21)?
8. **Fase 19:** ¿qué mapa primero (propuesta: Icebound)?
9. **Fase 20:** ¿la ciudad es un recorte de Aresden/Elvine o un interior pequeño?
10. **Fase 21:** ¿las armas siguen saliendo en las cartas de nivel (propuesta: sí, el equipo es el de salida)? ¿El botín se guarda siempre o solo al ganar?
11. **Fase 23:** ¿solo la opción A, o también la B (EK y objetos Hero)? ¿Bonus distinto por bando o solo estético?
