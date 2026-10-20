# Diseño del juego — Helbreath Survivors (demo)

Partida de 12–15 min. Movimiento libre, armas automáticas, oleadas, gemas de XP, elegir 1 de 3 mejoras al subir de nivel, jefe final. Alcance: 1 mapa, 3 personajes, ~8 armas, ~6 pasivas, ~25 enemigos, 2 minijefes, 1 jefe.

Fuera de alcance **de la demo inicial**: multijugador, cuentas, tienda, inventario estilo Helbreath, NPCs, varios mapas. *Desde el 18-oct-2026 el objetivo a largo plazo sí incluye inventario, tienda, NPCs y varios mapas: ver "Progresión entre partidas". Multijugador y cuentas siguen fuera.*

## Progresión entre partidas (decidido el 18-oct-2026)

> Replanteo del objetivo del juego, acordado con el propietario tras la Fase 18. Fases y bloques en `docs/PLAN-2.md` (Fases 19–25). Donde este apartado choque con los de más abajo (cartas de arma y armadura, eslabones por Str, `REQ_SCALE`), **manda este**.

### Personajes y baúl
- Una partida local por dispositivo, con **hasta 4 personajes** (Fase 17A). En el futuro podrían ser "cuentas".
- Los 4 comparten un **baúl** (stash). Cada personaje tiene su **inventario** con huecos: arma, escudo, casco, armadura, pantalones, botas, capa, **2 hechizos**, anillo, collar, ángel tutelar y **Zem**. *Abaddon's Blood no tiene hueco: es una mejora permanente (ver "En la partida").*

### Level y Power
- **Level** = progreso permanente del personaje. Sale en Select Character. Sube con la **EXP** de las partidas. Máximo **140**. Cada Level da **3 puntos** de stat que reparte el jugador; cada stat empieza en 10 y no pasa de **200**. Los puntos **no se reasignan**.
- **Power** = progreso dentro de la partida (lo que antes era el "nivel" en partida). Empieza en 1 cada partida; al subir salen las cartas.
- Nunca se usa "level" para la partida en los textos del juego.
- **Curva objetivo:** Level 140 en **~60 h**. Primeros Levels muy rápidos (5–8 en la primera partida), ~30 a las 2 h, ~50 a las 6 h, ~80 a las 15–20 h, ~100 a las 30 h. Curva propia (no la tabla del original), pensada en tiempo por Level y ajustada con métricas.
- **Motivación (investigación, 18-oct-2026):** barras de progreso visibles y "te falta X para..." al acabar; primeros niveles rápidos; varias pistas de progreso a la vez (Level lento + botín, logros, récords y mapas rápidos); botín aleatorio honesto (rangos visibles, protección contra la mala suerte, nada de castigar al que no juega a diario).

### Equipo y requisitos
- Lo que se puede equipar se mira con las **stats permanentes**: Str para armas y armaduras (como el original: Str = peso/100), Int para hechizos. Las armas y hechizos altos piden además un **Level mínimo**.
- Se usan los requisitos del original como referencia: Long Sword 14, Claymore 40, Flameberge 60, **Battle Hammer 120**, Giant Sword 130, Barbarian Hammer y The_Devastator 200; Fire Ball 26, Meteor Strike 169, **Blizzard 195**.
- **Escalones de equipo:** básico (tienda) → con atributos (cualquier monstruo) → top clásico (jefes; Battle Hammer hacia las 8–10 h, Blizzard hacia las 15–20 h) → **únicos** (un jefe o mapa concreto, Level ~100+, con protección contra la mala suerte; alargan el juego hasta las ~60 h).
- **Atributos de arma** (de momento solo tres, como el original): **Sharp** +1 al dado de daño; **Ancient** +2 al dado y no se puede mejorar; **Poison** daño de veneno con el tiempo que nunca mata.

### En la partida
- Se empieza en Power 1 **con el equipo puesto**.
- **Las cartas ya no dan armas ni armaduras.** Dan stats temporales (+3, solo esa partida), **Xelima** (+% daño del equipo en esa partida), **Merien** (+% defensa en esa partida) y pasivas.
- **Las dos clases:** un ataque automático y una habilidad activa con el mismo botón. Guerrero: arma + **Critical Strike** (cargas). Mago: hechizo 1 (automático) + hechizo 2 (activo, con recarga).
- **Botín:** caen objetos según tu Str/Int y una tirada: de tu escalón (~50%), del siguiente (~25%, motiva a subir de Level), peor (~15%, para vender) o un salto grande (~10%). Al cogerlo, carta de comparación con **"Equip"** o **"Keep in bag"**; si no cumples el requisito, solo se puede guardar.
- **Al terminar:** si ganas, te quedas con todo. Si mueres **sin Zem**, pierdes los objetos encontrados en esa partida (nunca el equipo con el que saliste). Si mueres **con Zem**, conservas el botín y el Zem se gasta. **El oro se conserva siempre.**
- **Abaddon's Blood** (resurrección, icono del Red Ball; cambiado el 20-oct-2026): **mejora permanente** para los 4 personajes, como el "Revival" de Vampire Survivors. Una vez desbloqueada, al morir revives **una vez por partida** con media vida. Se comprará en la tienda (Fase 24); hasta entonces solo con un atajo de prueba.

### Economía
- **Oro:** monedas de los monstruos, montones de los jefes, vender objetos (los atributos suben el precio) y algunos logros.
- **Herrero:** mejoras permanentes +1, +2... con Xelima (armas) y Merien (armaduras) y oro. Si falla, se pierden la piedra y el oro, **nunca el objeto**.
- **Tienda:** Zem, pociones para empezar la partida, equipo básico sin atributos, **Abaddon's Blood** (mejora permanente). **Almacén:** ampliar el baúl.
- **Sin durabilidad** ni reparaciones. Sin pagos reales (regla 8).

## Personajes
| Personaje | Estilo Helbreath | Arma inicial | Bonus |
|---|---|---|---|
| Guerrero | Fuerza (STR) | Espada (tajo en arco hacia donde mira) | +20% vida, +10% daño físico |
| Mago | Inteligencia/Magia (INT/MAG) | Energy Bolt | +15% daño mágico, −10% cooldowns |
| Arquero | Destreza (DEX) | Arco (flecha al enemigo más cercano) | +10% velocidad, +1 proyectil a nivel 5 |

Apariencia compuesta por capas (cuerpo, pelo, armadura, arma) a partir de `sp-client/src/utils/PlayerAppearanceManager.ts`, con equipo acorde a cada clase.

## Armas (niveles 1–8)

> Nota (16-oct-2026): para el Guerrero ya no hay niveles de arma. Ver la sección **Guerrero** más abajo.

| Arma | Comportamiento | Visual a reutilizar (`sp-client/src/game/`) |
|---|---|---|
| Espada | Tajo en arco | Animación de ataque del jugador |
| Arco | Flecha al más cercano; niveles: +proyectiles, perforación | `effects/ArrowProjectile.ts` |
| Energy Bolt | Proyectil mágico al más cercano | `spells/EnergyBolt.ts` |
| Fire Ball | Proyectil con explosión en área | `spells/FireBall.ts` |
| Lightning Bolt | Rayo en línea que atraviesa | `spells/LightningBolt.ts` |
| Ice Strike | Impacto de hielo en área aleatoria, ralentiza | `spells/IceStrike.ts` |
| Fire Wall / Spike Field | Zona persistente que daña | `spells/FireWall.ts`, `spells/SpikeField.ts` |
| Meteor Strike | Meteoritos en puntos aleatorios en pantalla | `spells/MeteorStrike.ts` |

## Pasivas
Fuerza (+daño físico) · Inteligencia (+daño mágico) · Destreza (+velocidad de ataque) · Vitalidad (+vida máx y regeneración) · Botas (+velocidad) · Amuleto imán (+radio de recogida).

## Evoluciones (arma nivel 8 + pasiva)

> Nota (16-oct-2026): para el Guerrero las evoluciones pasan a ser eslabones por requisito de stat (Mago por confirmar). Ver la sección **Guerrero** más abajo.

| Arma | + Pasiva | Evolución |
|---|---|---|
| Energy Bolt | Inteligencia | Triple Energy Bolt |
| Fire Ball | Fuerza | Mass Fire Strike |
| Ice Strike | Vitalidad | Blizzard / Mass Blizzard |
| Lightning Bolt | Destreza | Mass Lightning Strike |

## Guerrero (borrador de diseño)

> Acordado con el propietario el 16-oct-2026. Sustituye, para el Guerrero, a los apartados "Armas (niveles 1–8)" y "Evoluciones". Requisitos exactos de objetos y hechizos: `docs/REQUISITOS_HB.md`.

Bonus de personaje (se mantiene): +20% vida, +10% daño físico.

### Stats
Seis stats de Helbreath: Str, Vit, Dex, Int, Mag y Chr. Efectos previstos (a equilibrar):
- **Str:** daño físico y puerta de entrada de armas y armaduras pesadas.
- **Vit:** vida máxima y regeneración.
- **Dex:** velocidad de ataque y de movimiento.
- **Int:** requisito de hechizos y daño mágico (poco útil para el Guerrero).
- **Mag:** maná y resistencia mágica.
- **Chr:** crítico y mejores drops.

Cada nivel da **+1 Str y +1 Vit automáticos**. Además hay cartas de stat: "+3 puntos a un stat a elegir" (son las pasivas Fuerza, Vitalidad, Destreza... de la sección Pasivas). Stats iniciales por definir (supuesto: Str ~12).

### Armas: sin niveles
> Actualizado el 16-oct-2026 (bloque 6A):
> - **El Guerrero lleva una sola arma en la mano.** Las cartas ofrecen el siguiente eslabón de su familia o cambiar de familia (por ejemplo, de Short Sword a Long Sword), mostrando qué se gana y qué se pierde.
> - Familias activas: **Short Swords** (Dagger → Short Sword → Falchion; rápidas y de poco alcance) y **Long Swords** (Long → Broad → Great Sword → Flamberge; lentas, arco ancho y más empuje).
> - Hammer, Fencing y Axe quedan desactivadas.
> - Los requisitos y daños son **números propios**, no los del original.

- Las armas **no tienen nivel**. Mejoran por los stats del personaje y por cambiar de eslabón; al sustituir un arma por otra solo cambia el daño base.
- Cada **familia** es un arma automática con su comportamiento (borrador): Espada (tajo en arco), Esgrima (estocadas rápidas), Hacha (gira alrededor), Martillo (onda de choque en área). El escudo no ataca.
- Cada familia es una cadena de **eslabones reales de Helbreath** (ejemplo Espada: Short Sword → Long Sword → Claymore → Flameberge).
- *(Hasta la Fase 20; después, requisitos con stats permanentes y Level: ver "Progresión entre partidas".)* **Requisito único:** Str de *full swing* original × `REQ_SCALE` (0.4 al inicio, ajustable). Si no se cumple, el eslabón no aparece en las cartas. No hay uso progresivo. Solo cuenta el Str: no importa el nivel del personaje, ni hay nivel de arma (el "nivel mínimo" que piden algunos objetos del original no se usa).
- Las armas a dos manos **no** bloquean el escudo.
- Pendiente: cuántas familias a la vez (propuesta: 4).

### Armadura
Tres huecos: **Cuerpo, Casco y Escudo** (las botas siguen siendo una pasiva). La carta ofrece la mejor pieza que el Str permite; al elegirla se equipa sola y cambia el aspecto.

### Cartas al subir de nivel (3 por subida)
> **Desde la Fase 20** las cartas de arma, eslabón y armadura desaparecen: ver "Progresión entre partidas".

| Carta | Qué ofrece |
|---|---|
| Stat | +3 puntos a un stat a elegir. Siempre disponible, así el reparto nunca se queda vacío |
| Arma nueva | Una familia que aún no tienes, solo si cumples su Str |
| Mejora de eslabón | El arma más fuerte de esa familia que el Str permite (puede saltarse eslabones). Se equipa sola |
| Armadura | La mejor pieza que el Str permite en Cuerpo, Casco o Escudo. Se equipa sola |

### Evoluciones y cofres
- Los eslabones **sustituyen** la evolución "arma nivel 8 + pasiva". El Guerrero evoluciona con Str; el Mago lo hará con Int (por confirmar).
- Los cofres de minijefe dan por ahora **un buff ofensivo o defensivo aleatorio**. Más adelante podrán dar otras cosas.
- Idea futura: algunos hechizos de apoyo (Berserk, Defense Shield, Protection From Arrow/Magic, Absolute Magic Protection...) como pickups temporales del mapa para cualquier clase. Ver `docs/REQUISITOS_HB.md`.

### Ritmo de la partida (estimación)
12–15 min ≈ 25–30 niveles. Con Str inicial ~12, +1 por nivel y 4–5 cartas de Str, el Str final ronda 50–57. Con `REQ_SCALE` 0.4 la Flameberge pide 52; Hammer y Battle Axe (63 y 68) quedan para builds muy de Str.

### Pendiente del Guerrero
- Etapas (Recluta → Leyenda), comprimidas a 25–30 niveles, y si dan bonus fijos.
- Caminos finales (Paladín de Elvine / Berserker de Aresden).
- Habilidad activa (Dash con espacio).
- Fórmula de daño: los datos originales traen dados de daño por arma, a verificar antes de usarlos como daño base.
- Si el Mago también pierde los niveles de hechizo.

## Oleadas (borrador; ajustar jugando)
| Minuto | Enemigos |
|---|---|
| 0–2 | Slime, Bunny, Ant |
| 2–4 | Orc, Snake, Scorpion, Giant Frog |
| 4–6 | Skeleton, Zombie, Dire Boar · **min 5: minijefe Ettin** |
| 6–8 | Troll, Ogre, Stalker, Werewolf |
| 8–10 | Cyclops, Lich, Hellhound, Dark Elf · **min 8: minijefe Demon** |
| 10–12 | Gargoyle, Hellclaw, Tigerworm, Minotaur |
| 12+ | **Jefe final: Fire Wyvern** (o Dragon si funciona bien). Matarlo = victoria |

Los nombres deben coincidir con `sp-client/src/constants/Monsters.ts`. Minijefes: más escala y vida, sueltan cofre. Para inspirar stats: `Monsters.ts` y `multiplayer/server/Config/Monsters.json`; el balance final es nuestro.

## Mapa
Uno tipo arena (decidido en Fase 0). Casillas bloqueadas del `.amd` = colisión del jugador. Enemigos: ignorar colisión o separación simple, según rendimiento.

## Gemas de XP
Usar un sprite de objeto en suelo de `Items.ts` (oro, gemas…). Si no hay uno adecuado, rombo con `Graphics` en 3 colores según valor.

## Audio
Música: `middleland.mp3` (partida), `dungeon.mp3` (minijefes), `abaddon.mp3` o `apocalypse.mp3` (jefe final). SFX de `sounds/` (C* personaje, E* efectos, M* monstruos). Máximo ~4 sonidos iguales a la vez.

## Idioma
El juego está **solo en inglés** (decidido el 16-oct-2026): todo texto en pantalla, nombres de stats y personajes (Mage, Warrior), cartas y menús. Este documento sigue en español. Otros idiomas, quizá más adelante.

## Créditos y aviso legal (mostrar en el juego, en inglés)
"Helbreath © Siementech Co. Ltd. Technical base: helbreath-base-game (MIT) by Erko Knoll. Unofficial fan project, free and non-profit."
- Fuente: Comic Neue (SIL Open Font License), incluida en el juego; se menciona en los créditos.
- Sin anuncios ni pagos. No publicar en tiendas comerciales.
- El código copiado de la base conserva la licencia MIT.
- Todo asset pasa por `assetManifest.ts` para poder sustituirlo por arte propio en el futuro.
