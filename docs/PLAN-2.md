# Plan de desarrollo — Segunda etapa (Fases 11+)

> Borrador del 17-oct-2026, **pendiente de revisión del propietario**. Nada de esto está aprobado todavía.
> Continúa `docs/PLAN.md` (Fases 0–10). La Fase 9 está cerrada y la 10 termina con el bloque 10C (temblor y partículas).
> Lo demás que estaba en la Fase 10 se ha repartido aquí (17-oct-2026); ver "Traído de la Fase 10" en cada fase y la tabla de abajo.
> Mismas reglas que antes: una fase por sesión (`/fase N`), plan corto → OK → código → `/checkpoint`.

Fuentes de la investigación (17-oct-2026):
- código original en `reference/Server.cpp` y `reference/Client.cpp` (citado como S:línea / C:línea);
- `multiplayer/server/Config/GameWorlds.json`, `sp-client/src/constants/*.ts`;
- la wiki de helbreath.net (servidor Olympia, **no** idéntico al original).
- Lo marcado **[de memoria]** no está comprobado en el código.

---

## Resumen: qué pediste y qué propongo

| # | Idea | Propuesta corta | Tamaño | Assets |
|---|---|---|---|---|
| 1 | Crits / gritos | Botón de "golpe crítico" con cargas: 1 carga por cada 10 niveles (+1 de base), se recargan con el tiempo | Pequeño | ✅ Todo existe |
| 2 | Zem | El Zem es una "vida extra": solo llevas uno, al morir revives | Pequeño | ✅ Todo existe |
| 3 | Aresden y Elvine | Eliges bando al empezar; da colores, capa, guardias aliados y define quién te ataca en las Raids | Medio | 🟨 Sin escudos ni logos; hay capas, armaduras Hero y banderas |
| 4 | Más mapas | Cada mapa con sus monstruos, jefe y música; pantalla para elegir mapa | Grande (por partes) | ✅ Mapas y casi todos los monstruos |
| 5 | Raids | "Jugadores" enemigos (guerreros y magos dibujados como el jugador) que aparecen en eventos | Medio-grande | ✅ Todo existe; cuidado con el rendimiento |
| 6 | Minimapa | Mapa pequeño en una esquina con jefes, cofres, pociones y Zem | Pequeño | ✅ Hay miniaturas originales de cada mapa |
| 7 | Leaderboard por mapa | Primero récords locales (en tu navegador); online como opción aparte | Pequeño (local) / Medio (online) | 🟨 No hay arte de "ranking"; se reusan paneles |
| 8 | Inventario | Versión ligera: una bolsa pequeña de consumibles. **No** el inventario completo de Helbreath | Medio | ✅ Bolsa original e iconos |

### Traído de la Fase 10 (17-oct-2026)
Pulido que estaba en la Fase 10 y que el propietario dejó para más adelante. Cada cosa va en la fase donde mejor encaja:

| Qué | Dónde | Por qué ahí |
|---|---|---|
| Mando: vibración al recibir daño, iconos de botones de Xbox en pantalla, reasignar controles | **Fase 11** (Crits) | El crit añade un botón nuevo: es el momento de enseñar qué botón es cada cosa y de poder cambiarlos. |
| Sombras bajo personajes y monstruos | **Fase 14** (sistema de mapas) | Cada mapa tiene otro suelo; se ajustan a la vez y se mide el rendimiento con el mapa nuevo. |
| Más mapas | **Fases 14 y 15** | Ya estaba. |
| Récords locales | **Fase 18** (paso 1) | Ya estaba; puede adelantarse a la 14. |
| Progresión entre partidas (guardada en el navegador) | **Fase 18** | Usa el mismo guardado que los récords. El "baúl" de la Fase 19 y los objetos Hero de la 16 (opción B) se apoyan en ella. |
| Límite de enemigos en el móvil | **Fase 17** (Raids), o antes si el móvil va lento | Las Raids son lo más pesado; ahí se mide. |
| Equilibrio (dificultad, jefes, curva de XP) | **Varias fases** (ver "Cosas que afectan a varias fases") | Cambia con cada fase de combate. |

**Orden que propongo** (lo decidimos juntos): 11 Crits → 12 Zem → 13 Minimapa → 14 Sistema de mapas + Icebound → 15 Más mapas → 16 Bandos → 17 Raids → 18 Leaderboard → 19 Bolsa.
Motivo: primero lo pequeño y divertido que mejora la partida actual; después el sistema de mapas, que es la base de casi todo lo demás (leaderboard por mapa, minimapa por mapa, raids en la granja...).

---

## 1. Crits ("Gritos") — Fase 11

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
- **Cargas:** máximo = **1 + nivel/10** (nivel 1–9: 1; nivel 10: 2; nivel 20: 3; nivel 30: 4). Con la regla original (nivel/10) no tendrías ninguno hasta el nivel 10, es decir, hasta el minuto 5 aprox.
- **Recarga:** +1 carga cada **15 s** (a ajustar) y también +1 cada **15 golpes recibidos**, como en el original. Esto premia aguantar en medio de la horda.
- **Botón:** **Espacio** (o Alt, como el original), **X** en el mando y un **botón táctil** nuevo en el móvil. Espacio hoy solo sirve para confirmar en menús, así que está libre en partida.
- **Qué hace al pulsarlo (Guerrero):** el siguiente tajo sale **ya**, sin esperar al ritmo del arma:
  - daño × **(2 + nivel/30)** (a ajustar), más el extra de su familia (espada larga +10%, etc.);
  - **alcance mayor** según la familia (espada corta ×1,5, espada larga ×2);
  - empuje fuerte a todos los golpeados;
  - grito C23/C24, destello volando y un pequeño temblor de cámara.
- **¿Y la Maga?** Dos opciones (decides tú):
  - **A) Como el original:** la Maga no tiene crits. Más fiel, pero el botón solo sirve al Guerrero.
  - **B) Adaptación (recomendada para la diversión):** "Critical Cast": el siguiente hechizo sale ya, con el doble de proyectiles o de explosiones. Usa el mismo grito y las mismas cargas.
- **HUD:** contador de cargas junto a la barra de maná, con el icono original (GameDialog 6/3) que brilla cuando hay al menos una carga.
- **Opcional:** carta de nivel nueva "+1 carga máxima" o "recarga un 20% más rápida", y un "CritCandy" (dulce que recarga todas las cargas) como objeto raro del suelo. El CritCandy existía en el original (objeto 970), pero no sé su efecto exacto **[de memoria]**. Hay dulces en `item-ground` 5/131–133.

### Assets
Todo existe: sonidos C23/C24 (y C18 del tajo), `effect.spr` hoja 8, icono GameDialog 6/3, dulces 5/131–133.

### Aceptación
Con el Guerrero, pulsar Espacio/X lanza un tajo crítico con grito y número de daño grande. El contador baja y se recarga solo. Al nivel 10 hay 2 cargas. En el móvil, el botón táctil funciona mientras mueves con el otro dedo.

### Traído de la Fase 10: mando
- **Vibración** al recibir daño (más fuerte con golpes grandes) y al lanzar el crit. Con opción en Settings para quitarla.
- **Iconos de botones de Xbox** en pantalla cuando el último control usado es el mando ("Ⓐ Choose", el botón del crit...). Con teclado se ven las teclas; en el móvil, nada.
- **Reasignar controles** en Settings: teclado y mando, con "Reset to default".

---

## 2. Zem: la resurrección — Fase 12

### Cómo era en el original (comprobado)
- **Zemstone of Sacrifice** (objeto 650). Al morir, en vez de perder objetos al azar, **se perdía el Zem**. Tenía **3 usos** (durabilidad 3) y luego se rompía (S:25270, S:12370).
- Se conseguía como drop de jefes (Abaddon), en drops especiales de monstruos y en la lotería del City Hall. No se podía comprar.
- Aparte existía el hechizo **Resurrection** (revive con la mitad de la vida, una vez cada 5 minutos, S:19964). Era una adición tardía.
- **Dibujo:** `item-ground`/`item-pack` hoja 15, frame 39. El efecto "Resurrection" está en `effect11.spr` hoja 10 (21 frames, aditivo).

### Adaptación propuesta (tu idea, casi tal cual)
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
- **Duda para ti:** ¿un Zem por partida como máximo, o puedes conseguir otro después de gastarlo? Propongo que sí puedas, porque es raro.

### Assets
Todo existe: icono 15/39, `effect11` hoja 10, sonidos C21/C22, E23. Hay un detalle por comprobar: el código original pide 30 frames del efecto, pero la hoja tiene 21.

### Aceptación
Con un Zem (tecla de pruebas), al morir revives con media vida, efecto y sonido. Sin Zem, Game Over normal. Solo se puede llevar uno.

---

## 3. Minimapa — Fase 13

### Qué hay en el original
- El "GuideMap" era un cuadro de **128×128** con una miniatura del mapa (`telescope.spr` hoja 0, un frame por mapa: huntzone2 = 9, icebound = 24, middleland = 4, dglv4 = 14, arefarm = 6, elvfarm = 5, druncncity = 25).
- El punto del jugador era GameDialog hoja 4, frame 37 (6×5 px). Los frames 36–39 son puntos de otros colores y los 40–43, marcadores de 12×12.
- **El original no dibujaba monstruos.** Eso lo añadimos nosotros.
- Alternativa: `sp-client/public/assets/images/minimaps/*.jpg` (1500×1500, uno por mapa), más nítidos para recortar.

### Propuesta
- Cuadro de ~128×128 arriba a la **izquierda**. Arriba a la derecha está el botón de pausa táctil.
- Muestra **solo la zona de juego** (nuestro recorte de 100×100 casillas), no el mapa entero.
- **Puntos:**
  - jugador: el punto original;
  - **jefes:** marcador grande que parpadea;
  - **cofres:** dorado;
  - **pociones:** rojo;
  - **Zem:** violeta;
  - **jugadores enemigos** (cuando lleguen las Raids): rojo grande.
- **Monstruos normales: no.** Con 300 enemigos sería una mancha. Como mucho, opcional en Settings, en forma de puntitos sueltos.
- **Settings:** "Minimap: On/Off" y quizá tamaño grande o pequeño. En el móvil, más pequeño o plegable al tocarlo.
- Fuera de pantalla: una **flecha en el borde** hacia el jefe o el cofre más cercano (como en muchos Survivors). Opcional.

### Assets
Miniaturas `telescope.spr` (o las `.jpg`), puntos y marcadores de GameDialog hoja 4.

### Aceptación
El minimapa enseña dónde estás, el cofre que dejó el Ettin y la poción que cayó. Se apaga en Settings y no tapa nada en el móvil.

---

## 4. Más mapas — Fases 14 y 15

### Lo que hace falta primero (Fase 14: "sistema de mapas")
Hoy todo está pensado para un solo mapa (`huntzone2`). Hay que:
- **`data/maps.ts`** con todo lo de cada mapa: recorte de juego, oleadas propias, minijefes, jefe final, música, miniatura y monstruos que descargar.
- **`data/waves.ts` por mapa** (una línea de tiempo cada uno).
- **Pantalla "Select Map"** después de elegir clase, con la miniatura, el nombre, la dificultad y tu récord en ese mapa.
- **Desbloqueo:** ganar un mapa abre el siguiente (guardado en el navegador). Una tecla de pruebas los abre todos.
- **Descargas:** `AssetStreamer` baja solo los monstruos y casillas del mapa elegido. Hoy ya lo hace por oleada, así que se adapta.
- Que las casillas del mapa se descarguen **al elegirlo**, no antes del menú.
- **Primer mapa nuevo: Icebound** (el más pedido y de los que mejor encajan).

### Mapas candidatos (medidos con el código del juego)
Columnas:
- **Zona libre:** % del mejor cuadrado de 100×100 casillas sin muros ni agua.
- **Descarga:** lo que bajaría el mapa entero.
- **Extra:** lo que se baja de más respecto a lo que ya carga huntzone2.

| Mapa | Zona libre | Descarga | Extra | Valoración |
|---|---|---|---|---|
| **Icebound** | 91% (94% en 80×80) | 9,2 MB | ~3,9 MB | ⭐ Excelente: campo nevado abierto. En el original nieva en este mapa |
| **Dungeon L4** (`dglv4`) | 99% solo en 60×60; 63% en 100×100 | 4,9 MB | ~0,9 MB | ⭐ Bueno como **arena más pequeña** (una sala de 60×60). Muy barato. Pasillos alrededor |
| **Druncian City** | 86% | 8,5 MB | ~7,5 MB | Bueno: plazas abiertas. Tiene la hoja de casillas más pesada del juego (5 MB) |
| **Middleland** | 99% | 14,9 MB | menos si se recorta | Muy abierto, pero ya lo descartaste por monótono. Se podría usar otra zona |
| **Farm** (`arefarm`/`elvfarm`) | 93–95% | **16,2 MB** | alto | Abierto y bonito, pero es el que más pesa |
| Aresden / Elvine (ciudades) | 92–96% | 22,2 MB | muy alto | Los más pesados. Para más adelante (ver Bandos) |
| Otros que encajan: Promiseland (`2ndmiddle`, 6,5 MB), Bisle (islas, 5,4 MB), Procella (10,6 MB), Abaddon (3,1 MB, aspecto infernal) | | | | |
| No encajan: dglv2, dglv3, Tower of Hell, Maze, fightzones (todo pasillos o muy pequeños) | | | | |

### Monstruos por mapa (propuesta)
Los rosters salen del original (wiki de helbreath.net y `GameWorlds.json`), adaptados a lo que tenemos dibujado.
- ✅ = el sprite existe y no lo usamos aún
- ♻️ = ya lo usamos

**🧊 Icebound** ("Ice Map")
- **Monstruos:** Frost ✅, Dire Boar ♻️, Ice Golem ✅, Skeleton ♻️, Stone Golem ✅, Beholder ✅, Rudolph ✅ (reno navideño), Claw Turtle ✅.
- **Minijefes:** Tigerworm ♻️ (en el original tenía un "pit" en Icebound) y Nizie ✅.
- **Jefe final: Wyvern ✅** (`wyvern.spr`, 3,6 MB). Es el "Ice Wyvern" que recuerdas: en el original suelta armas de hielo. El Fire Wyvern ya es el jefe de huntzone2.
- **No existen:** Yeti, Ice Lizard ni dragones de hielo.
- **Extra temático:** que Frost e Ice Golem **ralenticen** al jugador al golpear **[de memoria; hay que comprobarlo en el original]**. Copos de nieve cayendo. Y encaja con activar la familia de hechizos **Ice** de la Maga (está prevista y apagada).
- **Música:** el original no tenía tema propio (sonaba la general). Propongo `default.mp3` o `elvine.mp3`.

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
- **Jefe:** aquí el jefe natural **es una Raid** (jugadores del otro bando atacando la granja). Ver punto 5.
- **Música:** `aresden.mp3` o `elvine.mp3`, según la granja.

**🏙️ Druncian City** (primer mapa del Apocalypse; en el original se entraba por un portal en Icebound)
- **Monstruos:** Claw Turtle ✅, Giant Crayfish ✅, Nizie ✅, Stalker ♻️, Giant Frog ♻️, Tentocle ✅, Giant Lizard ✅, Master Mage Orc ✅ (mago orco).
- **Minijefe:** Hellclaw ♻️ (en el original tenía un "pit" aquí). **Jefe final:** Minotaur ♻️, o Centaurus ✅ y Sorceress ✅ juntas.
- **Música:** el tema original se perdió. `apocalypse.mp3` es muy corto para repetir en bucle: usar `abaddon.mp3` o `dungeon.mp3`.

**🌍 Middleland** (si lo quieres volver a probar con otra zona)
- **Monstruos:** Ogre, Troll, Werewolf, Cyclops, Ettin, Zombie, Skeleton, Scorpion, Hellhound ♻️, más Mountain Giant ✅, Stone/Clay Golem ✅, Unicorn ✅ y Stalker ♻️.
- **Minijefe:** Hellclaw ♻️. **Jefe:** en el original era el Elementalist, pero está roto (Fire Elemental). Propongo **Dragon** o una **Raid grande**.
- **Música:** `middleland.mp3`. Es el mapa de guerra entre ciudades, así que pega con las Raids.

**🌲 Eternal Field** (`huntzone2`, el actual): se queda como está, con su línea de tiempo y el Fire Wyvern.

**No usar:** Abaddon, Fire Elemental y Magma Bull (incompletos). También están libres, para futuros mapas o jefes: Ugly Wyvern, Dark Knight, Temple Knight, Battle Golem, Barbarian, Giant Plant, Unicorn, Elf Master (con arco).

### Orden de mapas propuesto (dificultad creciente)
Farm → Eternal Field (actual) → Dungeon L4 → Icebound → Druncian City (→ Middleland).

### Bloques
- **14A:** sistema de mapas + pantalla Select Map + récord por mapa.
- **14B:** Icebound completo.
- **15A, 15B...:** un mapa por bloque, con `/anadir-enemigo` para cada monstruo.
- Al terminar la 14 convendría una skill nueva: `/nueva-skill anadir-mapa`.

### Aceptación (14)
- Desde el menú se elige Icebound.
- Salen sus monstruos, minijefes y el Wyvern.
- Al ganarlo queda registrado.
- huntzone2 sigue igual que antes.
- La descarga extra se nota poco.

### Traído de la Fase 10: sombras
- Sombra bajo personajes y monstruos (el original las dibuja; mirar cómo en `sp-client`). Se ajusta con cada suelo y se mide el rendimiento, sobre todo en el móvil.

---

## 5. Aresden y Elvine — Fase 16

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
  - Cambia el **color de la capa** y del nombre, y la música del menú (`aresden.mp3` / `elvine.mp3`).
  - Da un **bonus pequeño** distinto a cada bando, por ejemplo: Aresden +5% de daño físico, Elvine +5% de daño mágico. Esto es invención nuestra.
  - **Decide quién te ataca en las Raids** (el otro bando).
- **B) Progresión entre partidas con EK** (meta-progresión):
  - Cada jugador enemigo que matas en una Raid da **EK**, que se guarda entre partidas.
  - Con EK se **desbloquean los objetos Hero de tu bando**: capa, casco, armadura... Los sprites existen todos, en versión Aresden y Elvine, hombre y mujer.
  - Se pueden dar como pieza inicial o como carta especial. Le da sentido a jugar muchas partidas.
- **C) Mapas de ciudad / Crusade** (más adelante, muy grande):
  - Un modo **"defend your city"**: en tu ciudad, proteger la Mana Stone mientras llegan oleadas del bando contrario. Te ayudan torres de flechas y guardias aliados (sprites `guard`, `gt-arrow`, `gt-cannon`, `manastone`).
  - Problema: los mapas de ciudad pesan 22 MB cada uno.

### Assets
- **Existen:**
  - armaduras, cascos, capas y túnicas Hero de los dos bandos (por ejemplo, Hero Cape de Aresden `mmantle01`, de Elvine `mmantle02`);
  - banderas en el suelo (`item-ground` 5/56 Aresden, 5/57 Elvine);
  - aura del set Hero (`effect10` hojas 0/1);
  - guardia (`guard.spr`, un solo dibujo para los dos bandos), torres y estructuras de Crusade;
  - música de las dos ciudades.
- **No existen:** escudos de armas ni logos de ciudad. La elección de ciudad del original era solo texto. Haría falta usar las banderas o dibujar un emblema sencillo.

### Aceptación (opción A)
- Elijo Elvine en la selección y mi capa, el color de mi nombre y la música lo reflejan.
- El bando se guarda para la próxima partida.

---

## 6. Raids: "jugadores" enemigos — Fase 17

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
- **Recompensa:** matar a un raider da mucha XP, **EK** (si se hace la opción B de Bandos), probabilidad de Zem y de cofre.
- **Ellos usan buffs** (Berserk = brillo rojo, como el tuyo) para que se note que son "jugadores".
- **Rendimiento:** cada raider son ~8–12 dibujos (como el jugador) en vez de 1. **Máximo 6 a la vez**. Con `pooling`, como todo lo demás.
- **Sonidos:** los del jugador (golpe C18, quejido C12/C13, grito C23/C24, hechizos E*).

### Aceptación
- En el minuto 6 de Eternal Field aparece un grupo de 3 jugadores de Elvine (si eres de Aresden). El guerrero te persigue y grita al lanzar su crit; el mago te frena con hielo.
- Al matarlos sueltan buena recompensa.
- Se mantienen 60 FPS con 300 monstruos + 6 raiders.

---

## 7. Leaderboard por mapa — Fase 18

### Propuesta en dos pasos
- **Paso 1 — Récords locales** (pequeño; puede ir antes, incluso dentro de la Fase 14):
  - Top 10 por **mapa** y **clase**, guardado en tu navegador.
  - **Orden:** victoria primero; después, menos tiempo para ganar; si no se ganó, más tiempo sobrevivido. Muestra nivel y bajas.
  - Pantalla "Records" en el menú principal y tu mejor marca en Select Map. En el Game Over: "New record!".
  - Tu nombre se escribe una vez. En el móvil y con el mando hace falta un teclado en pantalla, o usar el nombre del personaje ("NkII"/"NMs").
- **Paso 2 — Online, opcional** (medio, y requiere tu decisión):
  - Necesita un pequeño servidor. Lo más sencillo, gratis y en el mismo sitio que la web: **Cloudflare Workers + D1** (una base de datos pequeña). El juego enviaría la marca al terminar.
  - **Problemas:**
    - **trampas:** cualquiera puede enviar marcas falsas, y en un juego web no se pueden evitar del todo; solo dificultar (comprobar que la partida tiene sentido);
    - **nombres ofensivos:** filtro básico;
    - **privacidad:** solo nombre y marca, sin datos personales.
  - Cumple la regla 8 (nada de pagos ni anuncios).

### Assets
No hay arte de "ranking" en el original. Se reutilizan los paneles de GameDialog (hoja 2, frames 1–2, el de la lista de bajas de monstruos) y la fuente dibujada. Sonido E23 para "New record!".

### Aceptación (paso 1)
Tras dos partidas en Icebound, la pantalla Records muestra ambas ordenadas, y la mejor sale en Select Map.

### Traído de la Fase 10: progresión entre partidas
- Guardar en el navegador cosas que se mantienen de una partida a otra (mismo guardado que los récords): por ejemplo, oro o puntos al terminar y mejoras pequeñas permanentes para elegir en el menú.
- Se diseña aquí. El "baúl" de la Fase 19 y los objetos Hero de la Fase 16 (opción B) se apoyan en esto.

---

## 8. Inventario — Fase 19 (opcional)

### Por qué no el inventario completo de Helbreath
En un Survivors la partida no se para (salvo al subir de nivel). Gestionar una mochila llena de objetos rompe el ritmo, y `DESIGN.md` lo dejó fuera del alcance. Además, la versión de sp-client está hecha en React, y nuestra regla 7 lo impide: habría que rehacer la interfaz. La lógica (`InventoryManager.ts`, `Items.ts`) sí se podría portar.

### Propuesta: "bolsa ligera"
- **3–4 casillas de consumibles** visibles en la barra inferior (como un cinturón), cada una con su tecla (1–4), su botón del mando (cruceta) y su botón táctil.
- **Qué se guarda:** pociones rojas (vida) y azules (maná, cuando la Maga gaste maná), pergaminos de buff (Berserk, Defense Shield para cuando quieras, en vez de al momento), CritCandy y el **Zem**, que ocupa su casilla fija.
  - Las pociones en el original: roja 5/1, grande 5/2, azul 5/3–4, verde 5/5–6.
- **Al pasar por encima** de una poción, va a la bolsa si hay sitio. Si está llena, se usa en el momento, como hoy.
- **Una pantalla de "Bag"** en la pausa, con el dibujo original de la bolsa (GameDialog hoja 7, frame 0) y los iconos de `item-pack`: para ver qué llevas, sin más gestión.
- **Más adelante:** un "baúl" entre partidas (*stash*) con los objetos Hero desbloqueados, para elegir equipo inicial. Encaja con los Bandos (opción B).

### Aceptación
Recojo 2 pociones, las guardo y me curo con la tecla 1 cuando quiero. El Zem se ve en su casilla.

---

## Cosas que afectan a varias fases
- **Móvil:** cada botón nuevo (crit, bolsa, minimapa) necesita versión táctil y debe verse bien con la Fase 10 (todo más grande en el móvil). Conviene hacer la Fase 10 **antes** o junto a la 11.
- **Teclas de pruebas:** M y C ya están ocupadas (saltar al jefe, panel de stats). El minimapa no se activa con M.
- **Descarga:**
  - cada mapa añade 1–8 MB y cada monstruo grande 0,5–3,6 MB (el Wyvern pesa 3,6 MB);
  - se descargan **solo al elegir el mapa**, con `AssetStreamer`;
  - la descarga inicial no debe crecer.
- **Equilibrio** (traído de la Fase 10): dificultad de cada tramo, vida de los jefes y curva de XP (objetivo: 25–30 niveles en 12–15 minutos). Repasarlo al cerrar cada fase que cambie el combate (11, 12, 14 y 17), jugando partidas completas.
- **Límite de enemigos en el móvil** (traído de la Fase 10): de momento no hace falta (el propietario no nota tirones). Se mide en la Fase 17, o antes si va lento.
- **Logros (Achievements, pendientes):** casi todo esto da logros naturales: "Win Icebound", "Kill 50 raiders", "Revive with a Zem", "10 Critical Strikes in one run".
- **El Arquero (aplazado):** encajaría muy bien con las Raids (Raider Archer) y con los crits a distancia del original.

## Decisiones que necesito de ti
1. **Orden de prioridad** de las 8 ideas (mi propuesta está arriba).
2. **Crits:** ¿la Maga sin crits (como el original) o con "Critical Cast"? ¿Espacio o Alt en el teclado?
3. **Zem:** ¿se puede conseguir otro después de gastarlo?
4. **Mapas:** ¿qué mapa primero tras el sistema de mapas (propongo Icebound)? ¿Middleland otra vez, con otra zona?
5. **Bandos:** ¿solo la opción A, o también la B (EK y objetos Hero entre partidas)? ¿Bonus distinto por bando o solo estético?
6. **Leaderboard:** ¿solo local, o quieres también el online (con sus problemas de trampas)?
7. **Inventario:** ¿te vale la "bolsa ligera" o tenías en mente algo más completo?
