# Datos de Helbreath (wiki) — índice

Copia de referencia de la wiki de Helbreath (<https://www.helbreath.net/wiki/>, servidor **Olympia**), descargada el 2026-10-16. Sirve de **guía base** para dar daños, vidas, requisitos y proporciones al survivors.

## Cómo usarla sin cargar el contexto
- **No leer todo.** Mirar esta tabla, abrir solo el archivo que toque y, dentro, solo la sección (`## …`) necesaria. Buscar con Grep por nombre (`Energy Bolt`, `Claymore`, `Orc`) antes de abrir un archivo entero.
- Los números de la wiki van a `survivors/src/data/*.ts` **adaptados** a un survivors (más rápido, más enemigos). Al pasar un número, comentar de dónde sale (p. ej. `// wiki: Energy Bolt 10 directo + 7 área`).
- **Prioridad si hay contradicción:** `docs/DESIGN.md` (decisiones del propietario) → `docs/REQUISITOS_HB.md` (`.cfg` originales del servidor) → esta wiki (servidor Olympia, con cambios propios; por ejemplo, la Flamberge base pide 122 de Str full-speed aquí y 130 en el original).
- Si falta algo, se descarga la página concreta de la wiki y se añade aquí como archivo nuevo, apuntándolo en esta tabla.

## Archivos

| Archivo | Qué contiene | Secciones |
|---|---|---|
| [hechizos.md](hechizos.md) | Hechizos por círculo: Int, maná, elemento, efecto/daño, área. Elementos y debilidades. Quemadura, veneno, congelación. | Spell casting · Notes about spell effects (Effects over time, Summon) · Elements · Circle 1–10 · Holy duration |
| [armas.md](armas.md) | Armas por familia: daño base, Str full-speed, Str por peso, índice de velocidad → duración del ataque. | Attributes · Speed · Short Swords · Long Swords · Fencing · Axes · Hammers · Bows · Wands · Weapon damage |
| [armaduras.md](armaduras.md) | Escudos, armaduras, cascos, piernas, botas, capas: defensa y absorción (PA). Collares y anillos. | Armor Attributes · Shields · Body Armors · Headgear · Leg Armor · Footwear · Capes · Reading equipment stats · Necklaces & Rings |
| [combate.md](combate.md) | Fórmulas: acierto físico y mágico, absorción, daño, regeneración de vida/maná/stamina. | Physical attack · Magic attack · Getting hit · Monster Defense Ratio · Monster absorption · Hit probability |
| [personaje.md](personaje.md) | XP por nivel y qué hace cada stat (Str, Vit, Dex, Int, Mag, Luck). | Leveling · Character stats · (Rebirth, Tutelary angels: ignorar) |
| [monstruos.md](monstruos.md) | Una fila por monstruo (50): vida, elemento, XP, ratios, absorción, resistencias, aggro, valentía, habilidades. **No incluye el daño de ataque.** | Tabla por tier · Monster Bravery · Monster experience |
| [monstruos-comportamiento.md](monstruos-comportamiento.md) | Comportamiento real sacado del `NPC.cfg` y del código del servidor: ritmo de ataque (ATime), alcance (AttkRange), valentía, daño en dados y estrategias "pega y se aleja". | Columnas · Estrategias de ataque · Tabla de nuestros monstruos |

## Qué leer en cada fase

| Fase | Leer |
|---|---|
| 4 — Primera arma y combate | `hechizos.md` → fila Energy Bolt (Circle 2). Opcional: `combate.md` → Magic attack (idea de daño directo + área). |
| 5 — XP y nivel | `personaje.md` → Leveling (forma de la curva) y Character stats (qué da cada stat). `monstruos.md` → columna Base XP (proporción entre enemigos). |
| 6 — Arsenal completo | `armas.md` → la familia del arma que se añade. `armaduras.md` → la pieza. `hechizos.md` → el círculo del hechizo. Requisitos: primero `docs/REQUISITOS_HB.md`. |
| 7 — Oleadas y jefes | `monstruos.md` → tabla por tier (vida y orden de dificultad) y habilidades. `monstruos-comportamiento.md` → ritmo, alcance y estrategias de ataque. |
| Balance en general | `combate.md` solo si hace falta una fórmula concreta; en un survivors se simplifican. |

## Aviso
Contenido de la wiki de Helbreath, guardado solo como referencia interna de diseño para este proyecto fan gratuito. No copiar sus textos dentro del juego.
