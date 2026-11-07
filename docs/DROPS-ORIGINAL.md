# Drops del Helbreath original

Extraído de `reference/Server.cpp` (servidor original). Los % están calculados exactamente a partir del código, **por cada monstruo muerto**. Los nombres de objeto son los del código (ver `reference/Item*.cfg` para sus stats).

> Uso: al implementar un monstruo, busca su nombre aquí (`grep -n "### Orc" docs/DROPS-ORIGINAL.md`). Son datos de referencia, no de balance: en Survivors los ajustamos en `survivors/src/data/`.

## Cómo funciona en el original (resumen)

Al morir un monstruo (matado por un jugador y no invocado) pasan **dos cosas independientes**:

1. **Drop genérico** (`NpcDeadItemGenerator`, Server.cpp:48238) — igual para todos, depende del "nivel de drop" del monstruo:
   - Primero una tirada contra la *Primary drop rate* (valor del archivo de configuración del servidor, no está en el repo). Si pasa:
   - **60 %: oro**, cantidad entre `GoldDiceMin` y `GoldDiceMax` del monstruo (+ bonus de oro del jugador).
   - **40 %: otra cosa.** Tirada contra la *Secondary drop rate* (mejor reputación del jugador = más fácil):
     - Si pasa → **poción o consumible**: Green 25 %, Red 8 %, Blue 12,5 %, Big Green 12,5 %, Big Red 12,5 %, Big Blue 6 %, raro (Power Green, caramelos) 5 %, muy raro (Super Power Green, Zemstone, piedras Xelima/Merien, tablillas antiguas, bolas) 1,7 %, nada 16,7 % (salvo caramelos en diciembre).
     - Si no → **equipo según nivel**: 60 % arma (de eso, 80 % arma cuerpo a cuerpo y 20 % varita) y 40 % armadura/escudo/casco. El objeto puede salir con un atributo especial (Critical, Poison, Sharp, Agile, Light, Strong, Righteous, Ancient…) de valor 1–13, donde valor 1 sale un 34 % y valor 13 un 0,1 %.
2. **Drop propio del monstruo** (`DeleteNpc`, Server.cpp:27050) — materiales de alquimia (carne, piel, dientes…) y, muy rara vez, objetos raros (anillos, collares, armas únicas). Es lo que se lista abajo por monstruo.

### Niveles de equipo del drop genérico

| Nivel | Monstruos | Armas | Armadura |
|---|---|---|---|
| 1 | Slime, Giant-Ant, Amphis, Rabbit, Cat | Dagger, ShortSword, LightAxe | WoodShield, TargeShield |
| 2 | Skeleton, Orc, Orc-Mage, Scorpion, Zombie | MainGauche, Gradius, SexonAxe, Tomahoc, Sabre, Esterk · varita MagicWand(MS0) | WoodShield, TargeShield |
| 3 | Stone-Golem, Clay-Golem | GreatSword, DoubleAxe, Sabre, Esterk · varita MS0 | LagiShield, Hauberk, ChainHose |
| 4 | Hellhound, Rudolph | Scimitar, Falchion, Esterk, Rapier, WarAxe · varita MS10 | Hauberk, ChainHose, KnightShield |
| 5 | Cyclops, Troll, Beholder, Cannibal-Plant, DireBoar, Claw-Turtle, Giant-Plant, Giant-Crayfish | Esterk, Rapier, WarAxe+1, BlackShadowSword · varita MS10 | LeatherArmor, TowerShield, Hauberk, ChainHose |
| 6 | Ogre, Werewolf, Stalker, Dark-Elf, Ice-Golem, Minotaurus | Claymore+1, GreatSword+1, Flameberge+1, GiantSword, GoldenAxe, HolyBlade, MageSword · varita MS10 | ChainMail, PlateMail, TowerShield, cascos (Horned, Wings, Wizard Cap/Hat), Hauberk, ChainHose |
| 7 | Liche, Frost, Barlog, Centaurus, Nizie | Claymore+1, GreatSword, Flameberge+1, GoldenAxe, KlonessAxe, BMageSword · varita MS20 | ScaleMail, PlateMail, Hauberk, ChainHose, Knight/TowerShield, Helm, Full-Helm |
| 8 | Demon, Unicorn, Hellclaw, Tigerworm, Gargoyle | GreatSword, BattleAxe, GiantSword, Flameberge+2, The_Devastator · varita MS20 | Cape, Boots, ShieldOfFaith, ShieldOfBrave |
| 9 | Mountain-Giant | Flameberge+1, GiantSword, BattleHammer, GiantBattleHammer, I.M.C Manual | Cape, Boots |
| 10 | Ettin, MasterMage-Orc, Giant-Lizard | GreatSword(+1), Flameberge+1/+2, GiantSword, BattleHammer, GiantBattleHammer, BarbarianHammer, E.S.W Manual | ScaleMail, Helm |

Sin drop: Guard, Dummy, Crop y monstruos invocados.

### Rarezas y fallos del código original (útiles al decidir)
- Los raros de monstruos normales son **rarísimos** (1 entre cientos de miles o millones): pasan por una tirada 1/45 y luego otra propia del monstruo.
- **Beholder** tiene tabla rara (IceStormManual) pero un bug (`iDice(1,10) == 11`) hace que nunca salga.
- **Centaurus, Nizie, Claw-Turtle, Giant-Crayfish, Giant-Lizard, MasterMage-Orc y Minotaurs** tienen probabilidad rara definida y nunca se usa: `DeleteNpc` no los llama. Solo tienen drop genérico. (Barlog sí se llama.)
- **Wyvern**: se llama con tipo 66 pero su tabla especial está bajo el tipo 69, así que en la práctica solo da el botín "común" de jefe. Abajo salen las dos versiones.
- **Hellclaw y Tigerworm** siempre sueltan un objeto raro de su tabla (son minijefes).
- **Jefes (Wyvern, Fire-Wyvern, Abaddon)** sueltan muchos objetos de golpe (15–20 tiradas) esparcidos alrededor.

## Drops por monstruo

### Slime (tipo 10)
- SlimeJelly — 4.0% · material

### Skeleton (tipo 11)
- SkeletonBones — 2.5% · material
- LuckyGoldRing — 1 en 292.950 · raro
- SapphireRing — 1 en 292.950 · raro
- EmeraldRing — 1 en 4.394.250 · raro
- RubyRing — 1 en 292.950 · raro
- PlatinumRing — 1 en 292.950 · raro
- RingofWizard — 1 en 4.394.250 · raro
- RingofMage — 1 en 7.323.750 · raro

### Stone-Golem (tipo 12)
- StoneGolemPiece — 1.7% · material
- BerserkWand(MS.10) — 1 en 3.060.000 · raro
- MerienPlateMail(M) — 1 en 4.590.000 · raro
- MerienPlateMail(W) — 1 en 4.590.000 · raro
- NecklaceOfAirEle — 1 en 2.295.000 · raro
- NecklaceOfStoneGolem — 1 en 2.295.000 · raro

### Cyclops (tipo 13)
- CyclopsEye — 0.46% (1 en 216) · material
- CyclopsHandEdge — 0.42% (1 en 240) · material
- CyclopsHeart — 0.56% (1 en 180) · material
- CyclopsMeat — 0.76% (1 en 132) · material
- CyclopsLeather — 0.42% (1 en 240) · material
- MagicNecklace(DF+10) — 1 en 160.650 · raro
- MagicNecklace(MS10) — 1 en 2.409.750 · raro
- MagicNecklace(DM+1) — 1 en 803.250 · raro
- MagicNecklace(RM10) — 1 en 160.650 · raro
- RingofOgrepower — 1 en 4.016.250 · raro
- NecklaceOfLightPro — 1 en 4.016.250 · raro
- NecklaceOfFirePro — 1 en 4.016.250 · raro

### Orc / Orc-Mage (tipo 14)
- OrcMeat — 2.3% · material
- OrcLeather — 1.2% · material
- OrcTeeth — 1.2% · material
- LuckyGoldRing — 1 en 749.700 · raro
- SapphireRing — 1 en 749.700 · raro
- EmeraldRing — 1 en 11.245.500 · raro
- RubyRing — 1 en 749.700 · raro
- PlatinumRing — 1 en 749.700 · raro
- RingofWizard — 1 en 11.245.500 · raro
- RingofMage — 1 en 18.742.500 · raro

### Giant-Ant (tipo 16)
- AntLeg — 3.7% · material
- AntFeeler — 3.3% · material

### Scorpion (tipo 17)
- ScorpionPincers — 0.40% (1 en 250) · material
- ScorpionMeat — 1.0% · material
- ScorpionSting — 0.40% (1 en 250) · material
- ScorpionSkin — 0.50% (1 en 200) · material
- LuckyGoldRing — 1 en 803.250 · raro
- SapphireRing — 1 en 803.250 · raro
- EmeraldRing — 1 en 12.048.750 · raro
- RubyRing — 1 en 803.250 · raro
- PlatinumRing — 1 en 803.250 · raro
- RingofWizard — 1 en 12.048.750 · raro
- RingofMage — 1 en 20.081.250 · raro

### Zombie (tipo 18)
- SwordofMedusa — 1 en 8.424.000 · raro
- NecklaceOfPoisonPro — 1 en 1.944.000 · raro
- NecklaceOfMedusa — 1 en 3.888.000 · raro
- NecklaceOfSufferent — 1 en 3.240.000 · raro

### Amphis (tipo 22)
- SnakeMeat — 1.3% · material
- SnakeSkin — 1.2% · material
- SnakeTeeth — 1.2% · material
- SnakeTongue — 1.2% · material
- SwordofMedusa — 1 en 29.835.000 · raro
- NecklaceOfPoisonPro — 1 en 6.885.000 · raro
- NecklaceOfMedusa — 1 en 13.770.000 · raro
- NecklaceOfSufferent — 1 en 11.475.000 · raro

### Clay-Golem (tipo 23)
- LumpofClay — 1.7% · material
- BerserkWand(MS.10) — 1 en 2.448.000 · raro
- MerienPlateMail(M) — 1 en 3.672.000 · raro
- MerienPlateMail(W) — 1 en 3.672.000 · raro
- NecklaceOfStoneGolem — 1 en 1.836.000 · raro

### Hellhound (tipo 27)
- HellhoundHeart — 0.36% (1 en 280) · material
- HellhoundLeather — 0.38% (1 en 266) · material
- HellhoundTail — 0.38% (1 en 266) · material
- HellhoundTeeth — 0.40% (1 en 252) · material
- HellhoundClaw — 0.40% (1 en 252) · material
- HellhoundTongue — 0.29% (1 en 350) · material
- MagicNecklace(DF+10) — 1 en 187.425 · raro
- MagicNecklace(MS10) — 1 en 2.811.375 · raro
- MagicNecklace(DM+1) — 1 en 937.125 · raro
- MagicNecklace(RM10) — 1 en 187.425 · raro
- RingofOgrepower — 1 en 4.685.625 · raro
- NecklaceOfLightPro — 1 en 4.685.625 · raro
- NecklaceOfFirePro — 1 en 4.685.625 · raro

### Troll (tipo 28)
- TrollHeart — 0.57% (1 en 175) · material
- TrollMeat — 0.87% (1 en 115) · material
- TrollLeather — 0.80% (1 en 125) · material
- TrollClaw — 0.74% (1 en 135) · material
- LuckyGoldRing — 1 en 133.875 · raro
- SapphireRing — 1 en 133.875 · raro
- EmeraldRing — 1 en 2.008.125 · raro
- RubyRing — 1 en 133.875 · raro
- PlatinumRing — 1 en 133.875 · raro
- RingofWizard — 1 en 2.008.125 · raro
- RingofMage — 1 en 3.346.875 · raro

### Ogre (tipo 29)
- OgreHair — 0.71% (1 en 140) · material
- OgreHeart — 0.65% (1 en 154) · material
- OgreMeat — 0.57% (1 en 175) · material
- OgreLeather — 0.57% (1 en 175) · material
- OgreTeeth — 0.51% (1 en 196) · material
- OgreClaw — 0.51% (1 en 196) · material
- MagicNecklace(DF+10) — 1 en 275.625 · raro
- MagicNecklace(MS10) — 1 en 4.134.375 · raro
- MagicNecklace(DM+1) — 1 en 1.378.125 · raro
- MagicNecklace(RM10) — 1 en 275.625 · raro
- RingofOgrepower — 1 en 6.890.625 · raro
- NecklaceOfLightPro — 1 en 6.890.625 · raro
- NecklaceOfFirePro — 1 en 6.890.625 · raro

### Liche (tipo 30)
- CancelManual — 1 en 405.000 · raro
- IceStormManual — 1 en 27.000 · raro
- E.S.W Manual — 1 en 405.000 · raro
- NecklaceOfIceEle — 1 en 810.000 · raro
- NecklaceOfLiche — 1 en 405.000 · raro
- RingOfArcmage — 1 en 540.000 · raro

### Demon (tipo 31)
- DemonHeart — 0.05% (1 en 2.000) · material
- DemonMeat — 0.02% (1 en 5.000) · material
- DemonLeather — 0.10% (1 en 1.000) · material
- DemonEye — 0.07% (1 en 1.500) · material
- BloodyShockW.Manual — 1 en 1.080.000 · raro
- BloodAxe — 1 en 216.000 · raro
- BloodSword — 1 en 1.080.000 · raro
- BloodRapier — 1 en 216.000 · raro
- MassFireStrikeManual — 1 en 1.080.000 · raro
- RingofDemonpower — 1 en 3.240.000 · raro
- NecklaceOfEfreet — 1 en 2.160.000 · raro
- DemonSlayer — 1 en 3.240.000 · raro

### Unicorn (tipo 32)
- UnicornHeart — 1 en 15.000 · material
- UnicornHorn — 0.04% (1 en 2.500) · material
- UnicornMeat — 0.20% (1 en 500) · material
- UnicornLeather — 0.10% (1 en 1.000) · material
- MerienShield — 1 en 4.590.000 · raro
- MerienPlateMail(M) — 1 en 4.590.000 · raro
- MerienPlateMail(W) — 1 en 4.590.000 · raro
- NecklaceOfAirEle — 1 en 2.295.000 · raro

### Werewolf (tipo 33)
- WerewolfTail — 0.42% (1 en 240) · material
- WerewolfHeart — 0.45% (1 en 224) · material
- WerewolfMeat — 0.50% (1 en 200) · material
- WerewolfLeather — 0.36% (1 en 280) · material
- WerewolfTeeth — 0.45% (1 en 224) · material
- WerewolfClaw — 0.45% (1 en 224) · material
- WerewolfNail — 0.33% (1 en 304) · material
- CancelManual — 1 en 7.344.000 · raro
- I.M.C Manual — 1 en 7.344.000 · raro
- E.S.W Manual — 1 en 7.344.000 · raro
- MerienShield — 1 en 367.200 · raro

### Stalker (tipo 48)
- CancelManual — 1 en 288.000 · raro
- I.M.C Manual — 1 en 288.000 · raro
- E.S.W Manual — 1 en 288.000 · raro
- MerienShield — 1 en 14.400 · raro

### Gargoyle (tipo 52)
- BloodyShockW.Manual — 1 en 631.125 · raro
- XelimaBlade — 1 en 1.893.375 · raro
- XelimaAxe — 1 en 1.893.375 · raro
- XelimaRapier — 1 en 1.893.375 · raro
- MassFireStrikeManual — 1 en 631.125 · raro
- RingofDemonpower — 1 en 1.893.375 · raro
- NecklaceOfEfreet — 1 en 1.262.250 · raro
- RingoftheXelima — 1 en 3.786.750 · raro
- RingoftheAbaddon — 1 en 5.049.000 · raro
- RingOfDragonpower — 1 en 2.524.500 · raro
- Excalibur — 1 en 3.786.750 · raro

### Beholder (tipo 53)
- Nada propio (solo el drop genérico).
- (Tiene tabla rara con IceStormManual, pero un bug del original hace que nunca salga.)

### Dark-Elf (tipo 54)
- DarkElfBow — 1 en 720.000 · raro
- DrowBoots — 1 en 540.000 · raro
- DrowChain(M) — 1 en 540.000 · raro
- DrowChain(W) — 1 en 540.000 · raro

### Giant-Frog (tipo 57)
- LuckyGoldRing — 1 en 126.000 · raro
- SapphireRing — 1 en 126.000 · raro
- EmeraldRing — 1 en 1.890.000 · raro
- RubyRing — 1 en 126.000 · raro
- PlatinumRing — 1 en 126.000 · raro
- RingofWizard — 1 en 1.890.000 · raro
- RingofMage — 1 en 3.150.000 · raro

### Ettin (tipo 59)
- RingOfDragonpower — 1 en 324.000 · raro
- E.S.W Manual — 1 en 162.000 · raro
- BloodyShockW.Manual — 1 en 113.400 · raro

### Frost (tipo 63)
- IceAxe — 1 en 810.000 · raro
- IceHammer — 1 en 810.000 · raro
- BerserkWand(MS.20) — 1 en 1.215.000 · raro

### Barlog (tipo 70)
- BloodyShockW.Manual — 1 en 114.750 · raro
- MassFireStrikeManual — 1 en 114.750 · raro
- BerserkWand(MS.20) — 1 en 688.500 · raro

## Minijefes

### Hellclaw (tipo 49) — siempre suelta 1 objeto raro al morir
- MagicNecklace(MS10) — 25.0%
- MagicWand(M.Shield) — 25.0%
- RubyRing — 15.0%
- EmeraldRing — 10.0%
- MagicNecklace(RM10) — 12.5%
- MagicNecklace(DF+10) — 6.2%
- MagicNecklace(DM+1) — 1.2%
- RingofWizard — 3.5%
- RingofMage — 0.72% (1 en 139)
- SwordofIceElemental — 0.39% (1 en 256)
- NecklaceOfSufferent — 0.19% (1 en 513)
- NecklaceOfLightPro — 0.10% (1 en 1.000)
- MerienShield — 0.05% (1 en 2.000)
- NecklaceOfAirEle — 0.03% (1 en 4.000)
- NecklaceOfIceEle — 0.01% (1 en 6.667)
- RingofGrandMage — 1 en 20.000

### Tigerworm (tipo 50) — siempre suelta 1 objeto raro al morir (≈0,1% de las veces no suelta nada por un fallo de rangos)
- DF+10 or DM+1 necklace (50/50) — 50.0%
- SwordofIceElemental — 25.0%
- Flameberge+3(LLF) — 12.5%
- RingofDemonpower — 6.2%
- BloodRapier — 3.1%
- BloodSword — 1.6%
- BloodAxe — 0.77% (1 en 130)
- DragonWand(MS40) — 0.38% (1 en 263)
- NecklaceOfIceEle — 0.19% (1 en 526)
- XelimaRapier — 0.09% (1 en 1.111)
- XelimaBlade — 0.05% (1 en 2.000)
- XelimaAxe — 0.02% (1 en 5.000)
- RingoftheAbaddon — 0.01% (1 en 10.000)

## Jefes (botín múltiple)

Cada jefe hace varias tiradas: primero busca un objeto **top**, si no un objeto **medio**, si no uno **común** (bolsas de oro, piedras, anillos/collares mágicos). Las cifras son la media de cuántos de cada objeto caen por muerte.

### Fire-Wyvern
Tira 15 veces; las primeras 6 siempre dan algo (si no sale objeto, oro). Media de objetos por muerte:
- Gold (10d15000) — 3.00
- ZemstoneOfSacrifice — 0.65
- Flameberge+3(LLF) — 0.49
- StoneOfMerien — 0.49
- EmeraldRing — 0.49
- StoneOfXelima — 0.32
- MagicWand(M.Shield) — 0.32
- BagOfGold-medium — 0.16
- BagOfGold-large — 0.16
- BagOfGold-largest — 0.16
- MagicNecklace(RM10) — 0.16
- MagicNecklace(DF+10) — 0.16
- MagicNecklace(DM+1) — 0.16
- MagicNecklace(MS10) — 0.16
- NecklaceOfFirePro — 1 de cada 2.308 muertes
- RingofWizard — 1 de cada 2.308 muertes
- BloodSword — 1 de cada 2.308 muertes
- BloodAxe — 1 de cada 2.308 muertes
- BloodRapier — 1 de cada 2.308 muertes
- RingOfArcmage — 1 de cada 3.692 muertes
- NecklaceOfEfreet — 1 de cada 4.616 muertes
- RingofGrandMage — 1 de cada 4.616 muertes
- RingoftheXelima — 1 de cada 21.538 muertes
- BerserkWand(MS.20) — 1 de cada 21.538 muertes
- RingOfDragonpower — 1 de cada 21.538 muertes
- Excalibur — 1 de cada 21.538 muertes
- BloodyShockW.Manual — 1 de cada 21.538 muertes
- MassFireStrikeManual — 1 de cada 21.538 muertes
- NecklaceOfXelima — 1 de cada 35.897 muertes

### Abaddon
Tira 20 veces; las primeras 13 siempre dan algo (si no sale objeto, oro). Media de objetos por muerte:
- Gold (10d15000) — 6.14
- ZemstoneOfSacrifice — 1.20
- StoneOfMerien — 0.85
- EmeraldRing — 0.85
- Flameberge+3(LLF) — 0.85
- MagicWand(M.Shield) — 0.63
- StoneOfXelima — 0.57
- BagOfGold-medium — 0.28
- BagOfGold-large — 0.28
- BagOfGold-largest — 0.28
- MagicNecklace(RM10) — 0.28
- MagicNecklace(DF+10) — 0.28
- MagicNecklace(DM+1) — 0.28
- MagicNecklace(MS10) — 0.28
- BloodSword — 0.06
- BloodAxe — 0.06
- BloodRapier — 0.06
- XelimaAxe — 0.06
- XelimaBlade — 0.06
- XelimaRapier — 0.06
- NecklaceOfEfreet — 0.06
- NecklaceOfFirePro — 0.06
- BloodyShockW.Manual — 0.06
- MassFireStrikeManual — 0.06
- DragonStaff(MS.40) — 0.06
- Excalibur — 1 de cada 333 muertes
- NecklaceOfStoneGolem — 1 de cada 333 muertes
- NecklaceOfXelima — 1 de cada 333 muertes
- MerienHat — 1 de cada 333 muertes
- RingoftheAbaddon — 1 de cada 333 muertes
- MerienHelm — 1 de cada 333 muertes

### Wyvern (tabla 69)
Tira 15 veces; las primeras 6 siempre dan algo (si no sale objeto, oro). Media de objetos por muerte:
- Gold (10d15000) — 3.00
- ZemstoneOfSacrifice — 0.65
- StoneOfMerien — 0.49
- EmeraldRing — 0.49
- Flameberge+3(LLF) — 0.49
- StoneOfXelima — 0.32
- MagicWand(M.Shield) — 0.32
- BagOfGold-medium — 0.16
- BagOfGold-large — 0.16
- BagOfGold-largest — 0.16
- MagicNecklace(RM10) — 0.16
- MagicNecklace(DF+10) — 0.16
- MagicNecklace(DM+1) — 0.16
- MagicNecklace(MS10) — 0.16
- NecklaceOfIcePro — 1 de cada 1.538 muertes
- IceHammer — 1 de cada 1.538 muertes
- BerserkWand(MS.20) — 1 de cada 1.538 muertes
- IceAxe — 1 de cada 3.077 muertes
- RingOfArcmage — 1 de cada 4.615 muertes
- NecklaceOfIceEle — 1 de cada 6.154 muertes
- SwordofIceElemental — 1 de cada 12.308 muertes
- IceStormManual — 1 de cada 18.462 muertes
- RingofGrandMage — 1 de cada 20.513 muertes
- RingofWizard — 1 de cada 24.615 muertes

### Wyvern (tal como se llama: tipo 66, sin tabla propia)
Tira 15 veces; las primeras 6 siempre dan algo (si no sale objeto, oro). Media de objetos por muerte:
- Gold (10d15000) — 3.00
- ZemstoneOfSacrifice — 0.65
- StoneOfMerien — 0.49
- EmeraldRing — 0.49
- Flameberge+3(LLF) — 0.49
- StoneOfXelima — 0.33
- MagicWand(M.Shield) — 0.33
- BagOfGold-medium — 0.16
- BagOfGold-large — 0.16
- BagOfGold-largest — 0.16
- MagicNecklace(RM10) — 0.16
- MagicNecklace(DF+10) — 0.16
- MagicNecklace(DM+1) — 0.16
- MagicNecklace(MS10) — 0.16

