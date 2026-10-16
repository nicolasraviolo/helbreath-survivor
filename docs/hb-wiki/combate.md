# Combate (wiki)

> Copia de referencia de la wiki de Helbreath (servidor Olympia), descargada el 2026-10-16.
> Fuente: <https://www.helbreath.net/wiki/Combat/> · <https://www.helbreath.net/wiki/Hit_probability/>
> Fórmulas de golpe físico y mágico: probabilidad de acertar, absorción, daño, regeneración de vida/maná/stamina.
> Los valores son los de ese servidor y pueden diferir del Helbreath original (`docs/REQUISITOS_HB.md`, sacado de los `.cfg` originales). Úsalos como guía de proporciones, no como verdad absoluta. Índice: `README.md`.

## Combat

Source-bound combat ratio, damage, mitigation and regeneration calculations.

### Explanation

An equipment tooltip's base damage or a character-window ratio is not the complete result of an attack. Modifiers apply in a specific order.

Unless noted, these rules cover normal player attacks, not special weapon activations, secondary talent strikes or event-specific damage. Use effective stats and skill mastery.

Integer division discards fractional parts. Other intermediate results also discard fractions at the specified calculation steps, not only at the end; apply explicitly stated rounding separately. Separately rounded bonuses assume the running total is nonnegative. If a penalty makes it negative, calculate the complete updated total before discarding its fractional part. These examples cover normal, valid character stats and damage—not invalid states or values outside the normal range.

These formulas model the game’s calculations. Exact agreement with the running game has not been verified at every rounding boundary, so hand calculations and spreadsheets may differ.

#### Worked physical hit-ratio example

Displayed and rebirth levels do not enter the current critical hit-ratio bonus.

Consider displayed level 70, rebirth level 10, Dexterity 120, Xelima and Long Sword talents, effective Long Sword mastery 100, a long-sword critical attack with an available critical charge, and no equipment, hero-set, manufacturing or monster-specialty hit bonus.

The skill term is 10+⌊100·90/100⌋=100. The critical adds 130; Dexterity adds ⌊(120−50)·1.2+0.5⌋=84; Xelima adds 15. The Long Sword multiplier applies to that complete sum: trunc((100+130+84+15)·1.05)=345.

### Shared variables

Casting and Magic Hit Ratio use level. Base resources, critical capacity and the current physical critical-damage multiplier use displayed level instead.

L means displayed level; R means rebirth level. Adjusted level is A=min(140,L+R).

### Physical attack

Physical attacks include regular, dash and critical attacks. Criticals spend rechargeable charges. Crushing hits are a separate chance-based damage modifier that can affect any of these attack types.

Dash movement and reach depend on the client action, weapon and target size. For a normal-sized target, the normal client's melee critical targeting limits are:

| Weapon skill | Maximum coordinate distance on each axis |
|---|---|
| Hand Attack | 1 |
| Short Sword | 1 |
| Long Sword | 3 |
| Fencing | 4 |
| Axe | 2 |
| Hammer | 2 |
| Staff | 2 |

These square coordinate bounds require critical mode and enough charges. They are not Manhattan distances or a universal server-enforced range. Bows, large targets and special weapons use separate targeting rules.

A normal melee dash requires a target 2 tiles away in a cardinal or diagonal direction, requested running, positive stamina and at least 100% effective weapon mastery. A selected critical takes priority. The dash is an attack-move action; movement and collision checks can prevent it from covering the full target distance.

#### Physical hit ratio

Weapon mastery, equipment and eligible hero-set bonuses build Physical Hit Ratio. A critical with an available charge also uses the critical coefficient and manufacturing-completion adjustment; a noncritical dash uses the dash bonus instead.

| Skill | Critical coefficient | Dash hit bonus |
|---|---|---|
| Hand Attack | 100 | 20 |
| Short Sword | 120 | 20 |
| Long Sword | 130 | 40 |
| Fencing | 105 | 20 |
| Axe | 120 | 20 |
| Hammer | 135 | 30 |
| Archery | 100 | 0 |
| Staff | 120 | 20 |

Dexterity above 50 contributes a bonus. Monster specialty and talents also affect the result; the final minimum is 10.

For effective weapon/hand mastery S, Hs=10+⌊90S/100⌋. Add flat equipment and eligible hero-set bonuses. An eligible critical adds trunc(Ch(100+Hs)/200) plus the manufacturing adjustment; Ch is the listed coefficient. Otherwise apply any listed noncritical dash bonus.

Eligible Dexterity adds ⌊1.2(DEX−50)+0.5⌋. Against monsters, add the appropriate flat specialty bonus and include its percentage in the final multiplier. Add Xelima's flat bonus, then apply the combined applicable Long Sword, Fencing and Archery factor to the complete sum. Truncate and enforce the minimum.

#### Defense ratio

Dexterity and equipment supply Defense Ratio. Defense-shield protection adds before facing/talent penalties except in the alternate arrow branch: the defender uses Archery or an arrow NPC attacks from outside adjacent range.

Matching attacker/defender direction values multiply defense by 0.5 in normal melee or 0.9 in that alternate branch. This is not a geometric rear arc or a universal rule for arrows.

Xelima, Fencing and Short Sword penalties follow. The final minimum is 1.

Base Defense Ratio is 2DEX plus equipment defense. Apply each subsequent talent penalty separately, truncating after each multiplication.

#### Physical chance to hit

Physical Hit Ratio is checked against the target's Defense Ratio. Normal nominal percentage thresholds run from 15 for player attackers or 7 for NPC attackers up to 99; these are not guaranteed outcome rates.

Safe areas, allied-target restrictions, protection, invulnerability and other eligibility checks can prevent an attack independently of the roll. Elemental weapons have additional hit/protection handling.

The threshold is min(99,max(m,trunc(62H/D))), where H is the attacker's effective hit ratio, D the target's effective defense ratio and m the applicable minimum above. Defense is bounded away from zero in the player-defense path.

For integer threshold p, the exact roll probability is (42949672p+1)/4294967296. The integer engine includes both endpoints and uses an inclusive comparison after integer division, so the probability differs slightly from p percent. No integer multiplication wraps for these thresholds.

#### Physical absorption

Normal non-elemental hits on players use the selected armor location's absorption, not the sum of all armor pieces. Armor absorbs first; an eligible successful shield block absorbs from the remainder. Each component caps independently at 80%.

Hammer penetration and endurance-dependent effects alter absorption factors; Tank's facing bonus can alter shield PA. Elemental weapon hits and monster targets use different mitigation rules.

For nonnegative stage input D, armor PA a and shield PA s on an eligible successful block:

Aabsorbed=trunc(Dmin(a/100,0.8)) Sabsorbed=trunc((D−Aabsorbed)min(s/100,0.8)) Dafter=D−Aabsorbed−Sabsorbed

Omit the shield term without a block. These stage formulas exclude Hammer/Tank adjustments.

#### Physical damage

A matching weapon talent multiplies starting damage by 1.15, including a bow's Strength bonus; Hand Attack does not receive it. Charged criticals and noncritical dashes use different modifiers.

| Skill | Critical coefficient | Dash multiplier | Consecutive-hit bonuses after the opening hit |
|---|---|---|---|
| Hand Attack | 1.00 | 1.00 | 1, 2, 4 |
| Short Sword | 1.45 | 1.50 | 3, 5, 7 |
| Long Sword | 1.15 | 1.40 | 3, 6, 10 |
| Fencing | 1.40 | 1.50 | 1, 3, 5 |
| Axe | 1.30 | 1.25 | 1, 3, 5 |
| Hammer | 1.20 | 1.30 | 1, 3, 5 |
| Archery | 1.00 | 1.00 | 1, 2, 3 |
| Staff | 1.20 | 1.00 | 1, 2, 3 |

Minor Berserk/Berserk multiplies base-stage damage only on noncritical attacks, including eligible dashes. Flat equipment damage and the weapon's upgrade level are added afterward; the upgrade is not added again after combo.

The opening hit has no combo bonus; the sequence repeats after the fourth hit and resets on a miss. Short Sword talent can add combo damage. Special items, protections, events and secondary strikes can change final damage.

Let W be scalar base weapon damage, STR effective Strength, S effective weapon mastery and L displayed level.

| Attack source | Starting damage | Strength factor |
|---|---|---|
| Hand Attack | 1+⌊STR/20⌋ | 1 |
| Bow with its matching talent | W+⌊STR/30⌋ | 1 |
| Bow without its matching talent | W | 1 |
| Other weapon | W | 1+0.002STR |

Apply the matching talent multiplier to the table's starting damage. An eligible critical uses Cd(2.05+L/400)(175+S/4)/200, where Cd is the listed critical coefficient. These divisions are floating-point, including S divided by 4. A noncritical dash uses its listed multiplier instead.

Combine base-stage factors and truncate the integer damage assignment. Add applicable hero-armor damage, apply eligible Minor Berserk/Berserk, then add flat equipment damage including the weapon's upgrade level.

Against a player, apply Vitality's reduction before the hit roll. Conditional weapon/reputation effects also precede the roll. After a hit, add the skill's consecutive-hit bonus and applicable extra consecutive-attack damage.

Next apply the combined map/event and talent damage multiplier. Crush adds its extra fraction to this multiplier; it does not independently multiply every other percentage modifier. Against players, selected-armor upgrade reduction precedes armor/shield absorption. Against monsters, flat specialty damage and its percentage adjustment precede physical absorption.

### Magic attack

Magic attacks can crush. A spell's direct target, area tiles and persistent effects can use different starting damage and hit tests. Casting successfully and hitting a target are separate checks.

For spell-circle calculations, use level A and mage level M=⌊A/10⌋. Circles 1 through 10 have penalty coefficients 5, 5, 8, 8, 10, 14, 28, 32, 36 and 40 respectively.

#### Magic hit ratio

Magic-skill mastery supplies the starting Magic Hit Ratio; Magic above 50 adds a bonus. Your level can also add a bonus or penalty for the spell's circle.

Equipment is added before a minimum of 1 is enforced; hero-set and Xelima additions follow. Applicable talent multipliers act last. High-circle classification controls protection checks, not an extra hit bonus. Monster-specialty modifiers apply later at the target's resistance check.

Start with effective Magic-skill mastery and add ⌊1.15(MAG−50)+0.5⌋ when eligible.

For circle C below M, add 5(M−C). For C above M, set a=A−10M, b=(C−M)PC, and c=10(C−M); subtract b−trunc(ab/c). Truncate the fractional correction rather than rounding to nearest. Equal circle and mage level has no adjustment.

After the equipment, minimum and hero-set/Xelima steps above, apply the combined applicable Fencing and Ice multiplier, then truncate to an integer.

#### Magic resistance

Equipment resistance is adjusted above 260 before skill and Magic bonuses. The boundary can briefly lower it: equipment resistance 260 stays 260, while 261 becomes 259. Xelima's resistance penalty follows those bonuses; the final minimum is 1.

For flat equipment magic resistance B no greater than 260, leave B unchanged. Otherwise replace it by trunc(200+0.7(B−200)+log1.27(B−200)). The logarithm's arguments and result are single precision; the sum is assigned to integer resistance.

Then add Sr+max(0,MAG−50), where Sr is effective Magic Resistance skill. Apply any Xelima penalty and truncate before enforcing the final minimum.

#### Magic chance to hit

Magic Hit Ratio is checked against the target's effective magic resistance. Normal nominal percentage thresholds run from 15 for player attackers or 7 for other attackers up to 99. Limited-hit-ratio spell checks against players instead cap at 75.

Protection from Magic and Anti-Magic Protection can prevent a hit or alter the pre-roll ratio, depending on spell classification and whether the attacker is a player or NPC. Dead or invincible targets resist immediately; the ratio is not a universal spell probability.

The normal resistance-roll threshold is min(99,max(m,trunc(50H/Rm))), with effective magic hit ratio H, effective target magic resistance Rm and the applicable minimum m above. Convert the resulting threshold using the exact integer chance conversion in Physical chance to hit.

#### Magic absorption

Magic absorption includes any qualifying Tank shield/facing bonus before attacker penetration. The normal effective cap is 80. Elemental absorption and absorption rings act in separate stages, not as additions to the combined magic-absorption stat.

Let B be the combined magic-absorption stat. Before attacker penetration and special target exceptions, compute effective MA in single precision:

Q=min(80,100(1−(1−B/400)4)).

Apply attacker-specific penetration next, then round to the nearest integer, with positive halves upward.

#### Magic damage

Magic increases initial spell damage; later modifiers and target defenses change final damage. Crush precedes player defenses: absorption rings, the selected armor upgrade, Vitality and then effective magic absorption. Protection and target-specific effects follow.

For normal nonnegative spell-damage input D, initial Magic scaling is D←trunc(D+D·0.003MAG+0.5). This is an integer damage assignment.

Applicable hero/weapon effects and reputation damage precede flat magic-damage equipment bonuses. Monster targets then receive the attacker's specialty additions; percentage magic damage and applicable map/event/talent multipliers follow. Integer assignments truncate unless an explicit rounding addition is present.

A crush next rounds D·Cm using an added 0.5, where Cm is the effective magic-crush multiplier. The subsequent player Vitality subtraction is nonlinear.

### Getting hit

Damage can interrupt an active skill and cause a hurt/stun animation. Physical stun depends on the attacking weapon skill, critical status, talents, target and event state; damage does not guarantee it. Stun and crush-stun cancel targeting and any queued spell. A normal hit does not always cancel a queued spell.

#### Physical hit locations and shield wear

The chest is selected most often, followed by legs, hauberk and helmet.

A shield can block only in the eligible physical branch when attacker/defender direction values differ and the target has shield PA. Effective Shield mastery affects the block chance. Tank can add shield PA when facing directly toward the attacker.

A block can reduce armor wear, but shield wear is calculated independently from incoming endurance damage, not from the armor's reduced wear. Hammer adjustments follow those wear calculations; critical attacks then double the resulting endurance damage. Exhausted equipment is released. Neutral-character and invincibility exceptions are excluded here.

The armor-location selector draws uniformly from integers 0 through 10,000, including both endpoints:

| Location | Exact probability |
|---|---|
| Chest | 5000/10001 |
| Legs | 2500/10001 |
| Hauberk | 1500/10001 |
| Helmet | 1001/10001 |

The extra endpoint belongs to the helmet branch.

For effective Shield mastery S, the chance parameter is 0.10+0.009S: 0.10 at mastery 0 and 1.00 at mastery 100.

For floating chance argument q between 0 and 1, the exact probability is (⌊4294967295q⌋+1)/4294967296. This uses the actual calculated floating argument. The comparison is inclusive; callers can suppress a zero-chance draw, as the crush paths do.

From incoming endurance damage E, a successful block changes armor wear to ⌈0.4E⌉; shield wear is ⌈0.8E⌉.

#### Health regeneration

The normal base interval is 15 seconds. Low hunger can extend it; the red slate instead uses half the base interval. Regeneration is skipped while dead, pretending to be a corpse, or at the applicable maximum.

Tank's HP-recovery percentage combines additively with equipment HP recovery, in addition to its effective Vitality increase. Healing is capped at missing HP.

The amount is not uniform between half Vitality and full Vitality. With v=VIT+1 and canonical random sample 0≤U<1, the unmodified amount is ⌊v/2⌋+(v/2)(1−U0.2), with the second division floating-point. U is a finite-precision uniform sample.

Apply red-slate additions, HP-max penalties, stored recovery, combined equipment-and-talent HP recovery, then Xelima, in that order. Discard the fractional part of the final healing amount before capping it.

#### Mana regeneration

The normal base interval is 20 seconds, with low-hunger delay and dead/corpse/full-resource checks. The equipment MP-recovery percentage increases the amount before stored MP recovery is added. Recovery is capped at missing MP.

For effective MAG and canonical sample 0≤U<1, the unmodified amount is MAG/3+(MAG/1.5)(1−U0.35), with floating-point divisions. Discard the fractional part after applying the recovery bonuses, before capping.

#### Stamina regeneration

The normal base interval is 12 seconds, with low-hunger delay and dead/corpse/full-resource checks. After equipment SP recovery, displayed levels through 20 receive a further 10 SP; levels 21 through 40 receive 7; higher levels receive neither addition. Recovery is capped at maximum SP.

The base amount is 13 plus the sum of 3 independent uniform integer rolls from 1 through ⌊VIT/15⌋, inclusive. A faces count of 0 returns 0 instead of rolling an invalid range. Equipment SP recovery adds a truncated percentage of this integer amount.

Thus, with VIT from 10 through 14 and no equipment recovery bonus, the uncapped amounts by displayed level are 23 SP through level 20, 20 SP at levels 21–40, and 13 SP above level 40.

### Monster Defense Ratio

Uses the monster's own Defense Ratio. Matching attacker and defender facing directions halve it, rounded down, with a minimum of 1.

Hit probability

### Monster absorption

Monster absorption uses different calculations from player armor, shields and magical absorption. The listed percentages are base values; use the current absorption for the relevant monster form when calculating a combat stage.

Hammer talent reduces physical absorption relatively, not by subtracting percentage points. Its additional health-dependent reduction requires both the talent and a Hammer weapon. The reduction is recalculated for each hit, so healing changes later hits rather than repairing permanent stat damage. Fire talent reduces monster magical absorption for all spell elements.

The calculations below describe normal non-elemental physical hits and normal spell absorption, not final HP loss. Elemental weapons and special damage paths differ. Other damage modifiers and later HP processing still matter.

D is the integer damage entering the absorption stage. Let ap and am be the monster's current physical and magical absorption fractions, using percentages divided by 100. The equations summarize staged game arithmetic; rounding near boundaries can differ from hand calculations.

For a normal non-elemental physical hit with positive physical absorption:

DPA=max(1,trunc(D[1−apF])).

| Attacker | F |
|---|---|
| No Hammer talent | 1 |
| Hammer talent, another weapon skill | 0.92 |
| Hammer talent and Hammer weapon skill | 0.92(0.25+0.75h) |

h is current HP divided by normal maximum HP, measured before the hit. This explanation covers the normal, non-overhealed range 0<h≤1. A Hammer weapon without the talent gets neither reduction. Truncate the remaining damage, not the absorbed amount; the minimum of 1 applies within this physical absorption step.

For normal spell absorption, apply Fire penetration before converting absorption to an integer percentage:

Q=trunc(100[amG]),G={0.85player attacker with Fire talent1otherwise.

Then truncate the remaining damage:

DMA=trunc(D−(Q/100)D).

These are separate conversions of absorption and remaining damage. This spell step has no local damage minimum. Neither calculation uses the player absorption cap of 80% or the player magical-absorption curve.

For a normal Beholder with 30% physical absorption, 45% magical absorption and 400 maximum HP, hold the absorption-stage input at 101 damage:

| Stage and conditions | Stage output |
|---|---|
| Physical, no Hammer talent | 70 |
| Physical, Hammer talent and Hammer weapon, 200 HP remaining | 83 |
| Spell, no Fire talent | 55 |
| Spell, Fire talent / Effective absorption truncates to 38% | 62 |

These examples compare a fixed stage input, not otherwise identical whole attacks with different talents. Later processing can change the damage actually lost.

## Hit probability

Physical and magic hit ratios, chance limits and worked examples.

### Hit probability

A monster's Physical Hit Ratio and Magic Hit Ratio describe its attacks. Its Defense Ratio and Magic Resistance describe its defenses. These are ratios, not hit percentages. Calculations use effective values after applicable adjustments, which may differ from the listed base values.

For eligible normal rolls, the minimum chance is approximately 15% for a player attacker or 7% for a monster attacker. The normal cap is approximately 99%; limited magic checks against players instead cap at approximately 75%. The minimum depends on the attacker, not the target.

Protections, eligibility, special weapons and spell components can change or bypass these rolls. Passing a resistance check is not the same as successfully casting a spell or dealing damage. See Combat for the surrounding conditions.

The nominal percentage thresholds are:

| Roll | Threshold |
|---|---|
| Physical | min(99,max(m,trunc(62H/D))) |
| Magic | min(99,max(m,trunc(50H/Rm))) |

H is the attacker's effective hit ratio; D is the target's effective Defense Ratio; Rm is its effective Magic Resistance. The minimum m is 15 for player attackers and 7 for monster attackers. Truncation discards the fractional part before the bounds apply. Game rounding can affect results near a boundary; these are approximate chances, not exact probability calculators.

These hypothetical examples use effective ratios for eligible normal attacks:

| Attack | Effective ratios | Calculation | Approximate chance |
|---|---|---|---|
| Player attacks a monster physically | H=150, D=160 | 62·150/160=58.125 / Truncate to 58. | 58% |
| Player casts a spell at a monster | H=75, Rm=100 | 50·75/100=37.5 / Truncate to 37. | 37% |
| Monster attacks a player physically | H=40, D=640 | 62·40/640=3.875 / Truncate to 3, then apply the minimum | 7% |
