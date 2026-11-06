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
- **Off-2 · Pits y combate:** los pits van en `data/` (rectángulo, monstruo y máximo) y se reponen solos. Golpear, monstruos con su IA, experiencia con la curva original × multiplicador, subir de nivel, morir y reaparecer.
- **Off-3 · Personaje:** se **reutiliza** el reparto de puntos de Survivors y la pantalla Equipment. Fórmulas originales de vida, maná y estamina. **Al seleccionar un objeto sale un cuadro con sus stats** (daño o defensa, requisitos y atributos), comparado con el que llevas puesto.
- **Off-4 · Objetos:** inventario, botín al suelo y recogerlo, requisito de STR para equipar, oro, tienda y herrero (reutilizados).
- **Off-5 · Bandos:** los dos portales de Traveler Zone con su confirmación. Se elige el bando una vez y para siempre. Recorte pequeño de Aresden y de Elvine con sus tiendas (la ciudad entera pesa 22 MB), y la Farm de cada bando con sus pits.
- **Off-6 · Magias:** tienda de magia, libro de magias, atajos F1–F8 y RT + botones, maná y tiempo de preparación.
- **Off-7 · Nivel alto y cierre:** mazmorra para nivel alto (`aresdend1` / `elvined1`), equilibrio del multiplicador y del botín, guardado y pulido.

## Pendiente de decidir más adelante

- Qué valor tiene el multiplicador de experiencia: se mide en Off-2 y Off-7.
- Si Survivors usará después la Aresden/Elvine que hagamos aquí (Fase 31 de PLAN-2). Survivors queda en pausa mientras se hace Off.
