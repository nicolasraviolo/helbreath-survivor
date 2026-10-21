# Engagement: psicología, referencias y plan de pruebas

> Borrador del 21-oct-2026, tras la Fase 21. Nada de esto está programado todavía.
> **Comentado con el propietario el 21-oct-2026:** rareza en cartas, Reroll/Skip y el monstruo poderoso al azar → **Fase 21½** (`docs/PLAN-2.md`). Pasivas con efecto, combinaciones, retos opcionales, logros con premio y NPCs con historia → "Mejoras de engagement para más adelante" en `docs/PLAN-2.md`. El botín de jefes (punto 4) se resuelve en las Fases 24–25; la historia (punto 6), después de la ciudad.

## 1. Qué dice la psicología (lo que aplica a un survivors)

| Principio | Qué significa | Cómo lo usan los buenos |
|---|---|---|
| **Competencia, autonomía, relación** (Self-Determination Theory) | Jugamos más cuando sentimos que mejoramos, que decidimos y que hay algo con lo que conectar | Builds distintas cada partida (autonomía), dominar un jefe (competencia), personajes con historia (Hades) |
| **Flow** | Ni aburrido ni agobiante: la dificultad sube con la habilidad | Oleadas que aprietan justo cuando tu build despega |
| **Fantasía de poder** | Empezar débil y acabar arrasando la pantalla | Vampire Survivors: minuto 1 lento, minuto 20 la pantalla es fuego |
| **Recompensa variable** | Lo que no sabes cuándo llega engancha más que lo fijo | Cofres, rarezas, botín. Clave: **frecuente y pequeña** + **rara y enorme** |
| **Gradiente de meta y "te falta poco"** (Zeigarnik) | Una barra casi llena empuja a "una más" | "1.200 EXP to Level 8" al morir, logros al 80% |
| **Regla pico-final** | Recordamos el mejor momento y el final, no la media | Pantalla final que celebra; jefe final épico |
| **Aversión a la pérdida** | Perder duele el doble de lo que alegra ganar | Hay que dosificarla: arriesga botín, no horas de progreso |
| **Elecciones con sentido** | Una elección obvia o irrelevante no es elección | Hades enseña qué bendición sale tras cada puerta; VS deja descartar cartas |
| **Novedad y descubrimiento** | Desbloquear cosas nuevas renueva el interés | VS tiene cientos de secretos; colección con huecos en gris |
| **"Juice"** | Golpes, sonidos, temblores y números que se sienten | Ya lo tenemos bastante bien (temblor, crits, vibración) |

**Límites éticos (ya decididos):** nada de castigar al que no juega a diario, nada de pagos, botín con probabilidades honestas y protección contra la mala suerte.

## 2. Qué hace cada referencia

- **Vampire Survivors:** el bucle más simple posible. Cada subida de nivel ofrece **armas nuevas** o mejorar las tuyas; arma al máximo + pasiva concreta = **evolución** (el gran "¡wow!" de cada partida). Cofres de jefe con animación de tragaperras (1, 3 o 5 premios). Oro → mejoras permanentes pequeñas. Desbloqueos con condiciones secretas. Reroll, Skip y Banish se ganan fuera de la partida.
- **Halls of Torment:** **objetos de equipo que caen en la partida** (como nuestro botín) y se llevan a casa solo si los sacas; misiones que desbloquean cosas ("mata 500 con fuego"); rasgos con elecciones claras; partidas de 30 min con jefes como hitos.
- **Megabonk:** las cartas tienen **rareza** (común → legendaria) que sube con la stat Suerte; cofres que **cuestan oro** y cada uno más caro (gastar o ahorrar); **santuarios** en el mapa (desafíos opcionales a cambio de premio); muchísimos desbloqueos por misiones dentro de la partida.
- **Hades 1 y 2:** **eliges el premio antes de luchar** (la puerta enseña qué hay detrás); bendiciones de dioses que **combinan** entre sí (dobles); morir no es fracasar: vuelves a casa, hablas con personajes, gastas recursos (Mirror / Arcana); **Heat / Fear**: el jugador sube la dificultad a cambio de premios.

## 3. Qué tenemos y cómo encaja

### Lo que ya funciona bien
- **Level permanente + reparto de puntos:** es la "pista lenta" que piden todas las referencias, con curva rápida al principio. ✔
- **Botín con requisitos, atributos y "Equip / Keep in bag":** muy de Halls of Torment, y encaja con el alma de Helbreath. ✔
- **Zem y morir sin Zem:** aversión a la pérdida controlada (pierdes lo de esa partida, nunca lo de antes). ✔ (pero ver abajo)
- **Pantalla final con barra hacia el siguiente Level:** "te falta poco". ✔
- **Juice:** crits, temblor, vibración, estelas, números. ✔
- **Élites, tótems, evento de rodeo y estampida:** rompen la monotonía. ✔
- **Logros (16) y métricas reales.** ✔

### Lo que se puede mejorar (de más a menos importante)

1. **Las cartas de Power son lo más flojo del juego.** Desde la Fase 20 solo ofrecen +3 a un stat o 3 pasivas (Xelima, Merien, Magnet). En VS, Hades y Megabonk **la subida de nivel es el corazón del juego**: ahí nace la build. Ahora mismo cada partida se parece a la anterior y no hay "momento evolución".
   - Ideas: cartas de **rareza** (común / rara / épica, como Megabonk; la Chr podría subir la suerte, como en el diseño original); **pasivas con efecto** y no solo números (rebote, explosión al matar, robo de vida, más alcance del tajo, una bola de fuego extra cada 5 s...); **combinaciones** al tener dos concretas (como las evoluciones de VS o los dobles de Hades); **Reroll / Skip** limitados.
2. **El botín: mucha "basura" hasta la tienda.** En una partida entera caen unos 15 objetos (≈9 de monstruos, 1–2 de élites, ~5 de jefes) y la mitad son "de tu escalón" (no mejoran nada). Hasta que exista el oro (Fase 24) no sirven para nada. Además el Zem solo cae el 10% de las veces: casi siempre que mueres lo pierdes todo, y eso puede frustrar más que motivar.
   - Ideas: que "de tu escalón" pueda ser **mejor que lo tuyo** (atributo o un +1), adelantar el **vender por oro** aunque sea simple, mostrar la **rareza con color** en el suelo (gris / azul / dorado) para que cada brillo dé emoción, y que al morir sin Zem **se salve 1 objeto** (el mejor) o el Zem caiga más.
3. **No hay "elegir el premio" ni riesgo opcional.** Todo llega igual. Hades y Megabonk dejan decidir: un tótem-desafío ("aguanta 30 s rodeado → objeto garantizado"), un cofre que cuesta vida u oro, o Heat al elegir mapa (Fase 22).
4. **Momentos "wow" pocos y previsibles.** Cofre de jefe = una carta normal. Ideas: cofre con animación y 1/3/5 premios; botín del jefe final siempre del escalón siguiente o mejor.
5. **Desbloqueos y colección.** Logros sí, pero no desbloquean nada. Ideas: logros que dan premio (oro, un hueco de baúl, un reroll permanente); "bestiario" o colección de objetos con huecos en gris (empuja a buscar).
6. **Relación / historia.** Hades engancha también por los personajes. La ciudad (Fase 23) con NPCs que comentan tu última muerte o tu récord sería barato y muy efectivo.

### Encaje con el plan actual
- Fase 22 (mapas, récords locales) y 24 (oro, tienda, herrero) cubren parte de 2, 3 y 5.
- **Hueco:** ninguna fase toca las cartas de Power (punto 1). Propuesta: una **fase nueva "Cartas con chicha"** antes o justo después de la 22.

## 4. Progresión, experiencia y botín: números de hoy

| Qué | Valor | Comentario |
|---|---|---|
| Power en partida | 4 primeros niveles en ~1 min, luego +24% de XP por nivel | Objetivo 25–30 en 12–15 min. Medido en simulación (jugador invencible) |
| Level permanente | EXP total = 300 · (Level−1)^2,24 | 1.ª partida → Level 4–7; ~30 a las 2 h; 140 a las ~60 h. **Sin medir con partidas reales** |
| Botín de monstruos | 0,3% normal, 4% élite | ≈ 9 + 1–2 por partida entera |
| Botín de jefes | Minijefes 1 (+30% otro), final 2 | ≈ 5 |
| Reparto | 50 / 25 / 15 / 10 (igual, siguiente, peor, salto) | La mitad, sin uso hasta la tienda |
| Zem | 10% por jefe | ~25% de tener uno si llegas al final |
| Pociones | 0,4% | ~12 por partida de 3.000 bajas. Pendiente de probar |

**Preguntas que deben responder las pruebas:**
- ¿Cada cuántos segundos recibe el jugador "algo" (nivel, cofre, botín, logro, tótem)? Referencia: nunca más de ~45 s sin nada.
- ¿Hay tramos muertos (minutos sin novedad) o de agobio (muertes en bloque en un minuto)?
- ¿En qué minuto muere un jugador normal en su 1.ª, 5.ª y 10.ª partida? ¿Sube con el Level?
- ¿Cuántos objetos **útiles** (mejores que lo puesto) caen por partida? ¿Cuántas partidas hasta cambiar de arma?
- ¿Llega el Level al ritmo de la curva objetivo?

## 5. Plan de partidas de prueba

### A. Partidas simuladas (las hago yo, sin el propietario)
1. **Simulación "mortal":** hoy la simulada es invencible. Añadir un modo en que el jugador puede morir y se mueve con una lógica sencilla (huir del grupo más denso, ir a por gemas y pociones). Da el minuto de muerte.
2. **Tandas de 10 partidas por clase**, con Level 1, 10, 25 y 50 (stats y equipo de ejemplo). Informe por partida: Power por minuto, minuto de muerte, bajas, objetos caídos por tipo (igual / siguiente / peor / salto, y cuántos eran **mejores** que lo equipado), Zem, pociones, EXP ganada.
3. **Cadencia de premios:** apuntar cada premio con su segundo y sacar el hueco más largo sin nada.
4. **Simulación de 50 partidas seguidas** (en un script aparte, sin navegador, con los números de los puntos anteriores): Level tras la partida 1, 5, 10, 25 y 50, y cuándo cae el primer objeto del escalón siguiente. Se compara con la curva objetivo.
5. Resultado: un informe corto en `survivors/.check/` y un resumen en una tabla.

### B. Datos reales
6. Leer las partidas ya enviadas a la página de métricas: minuto de muerte, Power alcanzado, cartas elegidas, por clase.

### C. Partidas del propietario (5 partidas, ~1 h en total)
7. Personaje nuevo, sin atajos. Tras cada partida, rellenar una ficha de 1 minuto:
   - del 1 al 5: ¿aburrido o agobiado en el minuto 0–3, 3–6, 6–9, 9+?
   - ¿hubo algún momento "¡toma!"? ¿cuál?
   - ¿cuándo pensaste en dejarlo?
   - ¿te apetecía otra partida al acabar? ¿por qué?
   - botín: ¿te emocionó alguno? ¿entendiste si era mejor?
8. Si es posible, **1–2 amigos** que no lo conozcan (la primera impresión solo se vive una vez).

### D. Conclusiones
9. Juntar A, B y C en una tabla "qué falla → qué proponemos", priorizado, y decidir con el propietario si se crea la fase "Cartas con chicha" y qué cambia en las Fases 22 y 24.

**Orden propuesto:** A1 → A2–A3 → B (en paralelo) → A4 → C (cuando el propietario pueda) → D. A1–A4 caben en un bloque; C y D en otro.
