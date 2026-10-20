# Bugs y mejoras pendientes

Lista del propietario del 19-oct-2026, antes de la Fase 21. Marcar `[x]` al arreglar.
Número original entre paréntesis: **B** = bug, **M** = mejora.

## Para fases futuras
- [ ] (B2) **Fase 23 (ciudad):** en la ciudad, "Level Up" abajo a la izquierda (como en el original) que abre la ventana del personaje para repartir puntos.
- [ ] (M9) **Fase 23:** quitar la opción "Equipment" del menú; se abrirá desde el Inventario.
- [ ] (M3) **Fase 22:** sombras de personajes y monstruos (sin ellas algunos no se distinguen del suelo).

## Bloque A: arreglos rápidos
- [x] (B1) Quitar el "+30" junto al nivel.
- [x] (B3) El icono del crit no está centrado con su caja: está desplazado a la derecha.
- [x] (B5) What's new: textos demasiado largos, se salen de la caja. Frases cortas y de alto nivel ("Mage damage rebalanced", "Inventory is now available", "Several bugs fixed").
- [x] (M5) El imán (cristal imán) también recoge las pociones de vida.
- [x] (M6) ~~Sprite de la poción → "Red Potion"~~: descartado por el propietario (ya era la Red Potion del original).
- [x] (M7) Select Character: "Create new character" hace lo mismo que pulsar un hueco vacío. Hay otros botones que aún no funcionan. (Era un fallo de todos los botones de esa columna tras pasar el ratón; "Change Password" sigue tapado a propósito.)
- [x] (M10) Minimapa: todos los tótems con un mismo punto amarillo; no revelar el buff hasta tocarlo.
- [x] (M11) Minimapa: el punto rojo del jefe, del mismo tamaño que el del jugador.
- [x] (M12) El tótem pasa a ser una esfera de energía (`effect5.spr`, hoja 0 de 7), siempre del mismo color.
- [x] (M16) Cartas de Power: las de stats se llaman "Blessing of Str" (etc.); mostrar el nivel "1/5"; título con la fuente/gráficos de `interface2` hoja 1.
- [x] (M1) Si hay 2 jefes en pantalla, mostrar las dos barras con sus nombres. (Hasta 3 barras: pueden coincidir 3 jefes.)

## Bloque B: combate
- [x] (B6) Al salir un jefe dejan de aparecer monstruos hasta que muere. Solo debe pasar con el jefe final; con los mini jefes, reducir la aparición pero sin pararla.
- [x] (B4) Al volver a una partida que estaba en segundo plano suena algún sonido "trabado"; a veces se juntan varios.
- [x] (M18) El Defense Shield del tótem bloquea todo el daño (físico y mágico) mientras dura. Dura 15 s (propietario, 20-oct-2026).
- [x] (M19) El Freeze del tótem dura 10 s y llega más lejos, no solo a los monstruos en pantalla.
- [x] (M14) Hechizos de varias bolas (Triple Energy Ball, Mass Fire Strike): una al objetivo y las demás alrededor de él; no buscan objetivos distintos. Decidido (20-oct-2026): como el original, en una zona pequeña. Mass Fire Strike ya era así.

## Bloque C: cosas nuevas (una sesión cada una)
- [x] (M15) El arco del golpe del guerrero es tosco: proponer varias opciones más bonitas y el propietario elige. Elegido "Thin edge + sparks", de arriba abajo; los demás guardados en `data/slash.ts`.
- [x] (M2) Monstruos élite al azar con más daño (probabilidad muy baja o baja según lo duro que sea el monstruo o lo fácil que vaya la partida). Otro color o un aura sutil. Hecho: "Berserk" con el mismo brillo rojo que el buff del jugador (`data/elites.ts`).
- [ ] (M8) Pantallas de carga: fondo negro, solo la barra y "Loading"; logo de HB pequeño abajo a la derecha que gira o aparece y desaparece.
- [ ] (M17) Ventana del personaje: dibujar el equipo sobre el cuerpo con los gráficos `item-equipm`/`item-equipw`, como en el original.
- [ ] (M13) Menús de opciones distintos para móvil y para web (mejor experiencia en cada uno).

## Dudas abiertas
- (M4) La EXP del Level se suma solo al morir, ganar o hacer "quit" (aún no existe); si el jugador sale o pausa, no la recibe. Así funciona hoy. **Duda:** ¿es la descripción de cómo debe ser o hay que cambiarlo?
