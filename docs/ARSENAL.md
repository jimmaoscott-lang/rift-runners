# Arsenal and Rift Bestiary (proposal, November 22, 2026)

Status: **approved by Mr. Scott, November 22, 2026** (Gear Up loadout yes; intel audio fades out by world). When approved, this file becomes the source of truth for defenders, creatures and prices, and DESIGN.md sections 6A, 6B and 6C point here.

## Mr. Scott's request (November 22)

- A camo creature around World 1 Level 5 that only one kind of tower can see. One comes alone in wave 1 or 2 as a warning; more come later.
- After the wave where a new creature first shows up, a description pops up: what it is and what beats it. **No narrator**, to make students read it.
- Descriptions start very easy (students read at about a 3rd to 4th grade level) and grow to about a 9th grade level by the end.
- **At least two new creatures and one new defender every level.** Start with what we have and build up to photon cannons (bright flashes, big damage), with flamethrowers, lasers, snipers and bombs along the way. Some creatures resist fire, some resist lasers, and so on.
- **Winning must depend on matching the right defenders to the creatures coming**, not on Archer Towers plus hero powers.
- Prices stay in line with what a student earns by reading (crystals come only from the Forge), maybe a small bonus for winning a level, but never so much that reading is optional.

This replaces item 3 of the November 22 tightening plan ("fewer weapons early"), since one new defender per level does the same job.

---

## 1. The matching system (the core of the change)

Every attack has a **damage type**, and every creature can have **traits**. Most traits make a creature immune or very tough against one or two damage types, so the student has to read what is coming and build the right answer.

### Damage types

| Type | Look | Strong against | Weak against |
|---|---|---|---|
| Pierce (arrows, bolts, bullets) | Fast shots | Fast, fragile creatures, fliers | Armored, Shielded |
| Blast (cannons, bombs, rockets) | Explosions, splash | Groups, Armored, breaks shields | Fliers (most blast cannot aim up) |
| Fire (flames, embers) | Burning ground, cones | Groups, stops Regen | Fireproof |
| Frost (totems, cryo) | Slows, freezes | Fast creatures | Frostproof |
| Shock (lightning, tesla) | Chains between creatures | Swarms, breaks shields | Grounded |
| Acid (sprayers, fog) | Green clouds | Eats armor away, stops Regen | Machines (later worlds) |
| Laser (turrets, prisms) | Steady beams that heat up | Big single targets | Mirror |
| Photon (World 8) | White flash, huge damage | Everything, including Phase | Nothing, but very expensive |

### Traits

| Trait | What it means in play | What beats it |
|---|---|---|
| Armored | Pierce does 25% damage | Blast, Acid, Laser |
| Shielded | Shield blocks 80% until broken | Blast, Shock, Photon break the shield |
| Flying | Trail defenders and most Blast cannot touch it | Archer, Ballista, Flak, Hawks, Rockets |
| **Camo** | Only **detector** defenders can target it. Splash from other defenders still hurts it if it happens to be close. | Sniper Nest (World 1), later Radar Tower and Phase Sniper |
| Fireproof | Fire does nothing | Anything else |
| Frostproof | Cannot be slowed or frozen | Anything else |
| Grounded | Shock does nothing | Anything else |
| Mirror | Lasers do nothing | Anything else |
| Regen | Heals fast unless burning or in acid | Fire, Acid |
| Healer | Heals creatures near it | Kill it first (long range, snipers) |
| Burrow | Travels underground for stretches; only trail traps and Blast hit it there | Mines, Vine Snare, Quake |
| Phase (World 7+) | Only Laser and Photon hurt it | Laser, Photon |

### Rule that keeps it fair

- Every creature has **at least one counter that is already unlocked** when it first shows up.
- From World 1 Level 3 on, every level has at least one creature that the student's cheapest all-round defender cannot handle alone.
- **Balance test (new for `sim_balance.py`):** a typical reader using only Archer Towers and hero powers must lose most runs from Level 3 on. A typical reader who builds the matching defenders must win most runs. If either test fails, the level gets retuned.

---

## 2. New creature introduction (scout, then intel card)

1. **Scout:** the first time a new creature appears in a level, it comes **alone** in wave 1 or 2, mixed in with creatures the student already knows. One creature getting through costs very little.
2. **Rift Intel card:** at the end of that wave, before the next wave can start, a card pops up: the creature's picture, its name and a short description of what it does and what beats it. **No narrator.** The defender that counters it is named in the text only (no picture of the defender), so reading the card is how you find out.
3. **Audio support fades out as the student goes (Mr. Scott, November 22).** The card is there to get students reading, so the help shrinks world by world:
   - Worlds 1 and 2: a **Read all** button plus tap any word to hear it.
   - Worlds 3 and 4: tap any word to hear it (no Read all).
   - Worlds 5 to 8: no audio on intel cards. The student reads it.
   This is the one planned exception to the "every word can be heard" rule, approved by Mr. Scott.
4. **Teacher setting, off by default: "Read intel cards aloud."** For students whose IEP lists read-aloud (or an EB plan calls for it). When it is on, the card keeps Read all and tap-a-word in every world, so the accommodation is always provided.
5. The card stays until the student presses **Got it**. The battle is between waves, so nothing happens behind it.
6. After that, the full pack comes in later waves of the same level.
7. The world map level card lists the level's new creatures by name (tap to open their intel card again). A **Bestiary** page in the pause menu keeps every intel card the student has unlocked.

### Reading level of the intel cards (Claude's call, recorded here)

Intel cards are **reading for meaning**, separate from the Forge, which stays strictly decodable. They follow a grade-level ramp instead of the decoding sequence, because the point is to understand what to build. Support fades as described above; the teacher read-aloud setting keeps full support for students who need it. A new checker (`tools/check_intel.py`) will measure each card (sentence length, word length, syllables per word, Flesch-Kincaid grade) and flag cards above their world's target.

| World | Target grade | Sentences | Shape |
|---|---|---|---|
| 1 | 2.5 to 3 | 2 or 3, under 8 words each | Mostly one-syllable words. Creature and defender names. |
| 2 | 3 to 4 | 3, under 10 words | A few two-syllable words. |
| 3 | 4 | 3 or 4 | "Because" and "but" sentences. |
| 4 | 5 | 4 | Two traits on one creature. |
| 5 | 6 | 4 or 5 | Cause and effect, some science words (magma, molten). |
| 6 | 7 | 5 | Compare two defenders. |
| 7 | 8 | 5 or 6 | Word parts from World 7 (reflective, unstoppable). |
| 8 | 9 | 6 | Full paragraph, academic words (dimension, conventional). |

Samples:

> **World 1, Shade Stalker:** The Shade Stalker can hide. Most towers can not see it. A Sniper Nest can. Put one by the trail.

> **World 4, Mirror Crab:** The Mirror Crab has a shiny shell. Laser beams bounce right off it, so lasers will not hurt it at all. Crack the shell with blasts or harpoons instead.

> **World 8, Rift Wraith:** Rift Wraiths drift between dimensions, so ordinary arrows, bullets and blasts pass through them harmlessly. Only photon weapons strike across both realms at once. Build Photon Cannons where the trail narrows, because a wraith that reaches the Anchor drains it twice as fast as other creatures.

---

## 3. Prices and crystals

Crystals still come **only from reading** in the Forge (kill income stays off). Prices are set in **words of reading**, so a price means the same effort in every world.

- **Crystals per word grow by world** (bigger crystals in deeper worlds), and prices grow by the same amount. World 1: 10 a word (runes 20, speaking 15). Scale by world: 1.0, 1.2, 1.4, 1.7, 2.0, 2.4, 2.9, 3.5. Creature health grows faster than this, which is what pushes students toward better defenders rather than more of the same.
- **Price bands (in words):**

| Kind | Build | Each upgrade | Specialty |
|---|---|---|---|
| Basic (Archer, Spike, Barricade) | 3 to 6 | 4 to 8 | 12 to 15 |
| Counter (Sniper, Flamethrower, Tesla) | 8 to 12 | 6 to 12 | 15 to 22 |
| Heavy (Ballista, Bomb, Laser, Mortar) | 11 to 15 | 8 to 14 | 20 to 25 |
| Super (Railgun, Plasma, Photon Cannon) | 18 to 25 | 12 to 18 | 30 |

- **A typical level** (about 60 to 90 words) pays for about 4 to 6 defenders plus a few upgrades. Nobody can afford everything, so choosing matters.
- **Win bonus, the Rift Cache:** winning a level adds a small start bonus to the next level: 2 words' worth per star (up to 6 words, 60 crystals in World 1). That is about one cheap defender, never enough to skip reading.
- New defenders are **not** cheaper than old ones. Late defenders cost more and do more.

---

## 4. Schedule: one new defender and two new creatures every level

52 levels: Worlds 1, 2, 3, 5, 6 and 8 have 5 levels plus a boss; Worlds 4 and 7 have 7 plus a boss. Level 1 of World 1 starts with two defenders, so the full arsenal is 53.

Defenders the student already has are **moved later** so each level brings exactly one. That also fixes "too many weapons too early" from the playtest. Stone Golem, Frost Totem, Vine Snare, Healing Shrine and Barricade keep their code and models; they just unlock later.

### World 1: Escape the Thornwood (built world, gets reworked first)

| Level | New defender | New creatures (trait) | Counter |
|---|---|---|---|
| 1 Thornwood Edge | Archer Tower, Spike Pit | Rift Wisp (fast), Thornback (tough) | Archer for wisps, Spike Pit for thornbacks |
| 2 Bramble Crossing | Ember Cannon (Blast, Fire) | Bramble Swarm (swarm), **Bark Beetle** (Armored) | Cannon splash for swarms, cannon blasts crack beetles |
| 3 The Hollow Trail | Lightning Spire (Shock) | Shield Brute (Shielded), **Moss Mender** (Healer) | Spire breaks shields; chains reach the mender |
| 4 Wisp Hollow | Ballista (Pierce, heavy) | Rift Bat (Flying), **Iron Boar** (Armored, fast) | Archer and Ballista for bats; Ballista bolts for boars |
| 5 Old Watch Ruins | **Sniper Nest** (Pierce, **detects Camo**) | Splitter (splits), **Shade Stalker** (**Camo**) | Sniper Nest is the only defender that can target Shade Stalkers |
| Boss: The Thorn King | Frost Totem (Frost) | The Thorn King, **Dart Runner** (very fast) | Frost slows runners and the king |

Shade Stalker plan (Mr. Scott's camo idea): one Shade Stalker scouts in wave 2 of Level 5, the intel card follows, then waves 4 and up bring two to four at a time. The Sniper Nest is a tall hidden blind with a crossbow scope: long reach, slow, single target, the only World 1 defender that sees camo. Its specialties: **Hawkeye Nest** (reveals camo creatures in its ring so every defender can hit them) or **Marksman Nest** (big damage, slower).

### World 2: Dunes of the Dead Sun

| Level | New defender | New creatures | Counter |
|---|---|---|---|
| 1 | Stone Golem (blocker) | Sand Raider (fast, packs), Dust Devil (Flying, Fireproof) | Golem holds raiders; Archers and Ballista for devils |
| 2 | **Bomb Tower** (Blast, big splash, slow) | Dune Crawler (Armored, big), Scarab Swarm (swarm) | Bombs for both |
| 3 | Vine Snare (roots) | Sand Burrower (Burrow), Mummy (Regen) | Snare grabs burrowers when they surface; fire stops Regen |
| 4 | **Flamethrower** (Fire cone, short reach) | **Scorch Scorpion** (Fireproof, Armored), Bone Walker (Regen, swarms) | Flamethrower for walkers; scorpions need Bombs or Ballista |
| 5 | Healing Shrine | Siege Beetle (attacks defenders), Sun Wraith (Camo, Flying) | Shrine repairs; Sniper Nest for wraiths |
| Boss: The Dead Sun Pharaoh | **Hawk Nest** (hunts fliers anywhere) | The Pharaoh (summons mummies), Vulture Flock (Flying swarm) | Hawks for vultures |

### World 3: Frostfang Pass

| Level | New defender | New creatures | Counter |
|---|---|---|---|
| 1 | Barricade | Snow Hare pack (very fast), Ice Golem (Frostproof, tough) | Barricades and golems hold hares; Bombs for golems |
| 2 | **Acid Sprayer** (Acid) | Frost Troll (Regen), Glacier Shell (Armored, Frostproof) | Acid stops Regen and strips armor |
| 3 | **Rift Mine** (one-time trail blast) | Burrow Mole (Burrow), Ice Wisp (Camo, fast) | Mines for moles; Sniper Nest for wisps |
| 4 | **Tesla Coil** (Shock ring) | Yeti Pack (swarm of big ones), Stone Ram (Grounded) | Tesla for yetis; rams need Blast or Pierce |
| 5 | **Flak Gun** (anti-air only) | Storm Hawk (Flying, fast), Ice Gargoyle (Flying, Armored) | Flak shreds fliers, Acid for gargoyle armor |
| Boss: The Frostfang Wyrm | **Frost Cannon** (Frost blast, freezes) | The Wyrm (Flying boss), Frost Witch (gives shields) | Spires break the witch's shields |

### World 4: The Drowned Coast (7 levels plus boss)

| Level | New defender | New creatures | Counter |
|---|---|---|---|
| 1 | **Harpoon Gun** (Pierce, pulls fliers down) | Reef Crab (Armored), Gull Swarm (Flying swarm) | Bombs for crabs; harpoons and flak for gulls |
| 2 | **Laser Turret** (beam that heats up on one target) | **Mirror Crab** (Mirror), Deep Lurker (huge health) | Laser melts lurkers; Mirror Crabs need Blast |
| 3 | **Mortar** (long-range Blast, cannot hit close) | Siren (Camo, slows defenders), Tide Runner (fast) | Sniper for sirens; Frost for runners |
| 4 | **Poison Fog** (Acid cloud) | Barnacle Brute (Regen, Armored), Jelly Drifter (Flying, Grounded) | Fog for brutes; Pierce for jellies |
| 5 | **Gatling Turret** (very fast Pierce) | Coral Hulk (Armored, slow), Eel Strike (very fast) | Gatling for eels; Laser or Mortar for hulks |
| 6 | **Net Launcher** (grounds fliers so trail defenders hit them) | Kraken Arm (huge, Shielded), Ghost Sailor (Pierce does nothing) | Nets plus trail traps; fire and laser for ghosts |
| 7 | **Radar Tower** (every defender in its ring sees Camo) | Fog Lurker (Camo packs), Shell Turtle (Armored, Shielded) | Radar for packs; Bombs for turtles |
| Boss: The Leviathan | **Railgun** (huge Pierce through a whole line) | The Leviathan, Pirate Wraith (Camo, Flying) | Railgun down the long trail |

### World 5: Ashfall

| Level | New defender | New creatures | Counter |
|---|---|---|---|
| 1 | **Cryo Cannon** (heavy Frost) | Magma Slug (Fireproof, Regen), Ash Imp (Flying, Fireproof) | Cryo for slugs; Pierce for imps |
| 2 | **Rocket Launcher** (homing Blast, hits fliers) | Lava Drake (Flying, Armored), Cinder Swarm (swarm, Fireproof) | Rockets for drakes; Tesla for cinders |
| 3 | **Prism Tower** (laser that splits into 3 beams) | Obsidian Knight (Pierce does nothing), Smoke Phantom (Camo) | Prism for knights; Radar or Sniper for phantoms |
| 4 | **Shock Trap** (trail stun) | Rock Charger (fast, Armored), Ember Hound pack | Shock Trap stops chargers |
| 5 | **EMP Tower** (strips machine shields, stuns machines) | Forge Bot (machine, Shielded), Clockwork Spider (splits into spiders) | EMP for bots; splash for spiders |
| Boss: The Ashfall Titan | **Plasma Cannon** (Fire and Blast, huge) | The Titan, Fire Elemental (Fireproof, Frost does double) | Cryo for elementals |

### World 6: Skyport Zero

| Level | New defender | New creatures | Counter |
|---|---|---|---|
| 1 | **Drone Bay** (drones chase creatures anywhere) | Sky Glider (Flying), Hover Bot (machine) | Drones and EMP |
| 2 | **Sonic Cannon** (pushes creatures back) | Jet Trooper (Flying, fast), Riot Mech (Armored, Shielded) | Sonic for mechs at the front |
| 3 | **Gravity Well** (pulls fliers to the ground, slows) | Cloud Ray (Flying, Camo), Storm Mech (Grounded) | Radar plus Gravity Well |
| 4 | **Missile Silo** (slow strike anywhere on the map) | Airship (huge flier that drops troopers), Gun Drone (shoots defenders) | Missiles for airships |
| 5 | **Shield Generator** (gives defenders shields) | Laser Wasp swarm (Mirror), Blink Runner (jumps ahead) | Shields protect from wasps; Frost for runners |
| Boss: The Skyport Overlord | **Orbital Laser** (beam from the sky, slow charge) | The Overlord, Escort Gunship | Orbital Laser on the boss |

### World 7: The Sunken Vault (7 levels plus boss)

| Level | New defender | New creatures | Counter |
|---|---|---|---|
| 1 | **Chrono Tower** (slows time in its ring) | Vault Guardian (Pierce does nothing), Tomb Swarm | Chrono for swarms, Laser for guardians |
| 2 | **Arc Lance** (long Shock beam) | Rune Golem (shield that regrows), Glyph Wisp (Camo) | Arc Lance keeps the shield down |
| 3 | **Nanite Hive** (Acid swarm that eats armor over time) | Gilded Beetle (very Armored), Crystal Spider (Mirror) | Nanites for beetles |
| 4 | **Ion Beam** (Laser, ignores shields) | Sand Wraith (Phase), Shadow Twin (Camo, splits) | Ion Beam for wraiths |
| 5 | **Quake Engine** (hits Burrow and everything on the ground) | Deep Digger (Burrow, Armored), Bone Colossus (huge) | Quake for diggers |
| 6 | **Void Turret** (damage based on the creature's health, for bosses) | Time Warden (cannot be slowed), Rift Priest (Healer, gives shields) | Snipe the priest first |
| 7 | **Phase Sniper** (detects Camo, hits Phase) | Vault Drake (Flying, Phase), Echo (copies the last creature killed) | Phase Sniper |
| Boss: The Vault Keeper | **Sun Lance** (first light weapon, a small photon beam) | The Vault Keeper, Keeper's Sentinel | Sun Lance |

### World 8: The Rift Core (photon weapons)

| Level | New defender | New creatures | Counter |
|---|---|---|---|
| 1 | **Photon Cannon** (bright flash, huge blast, slow) | Rift Wraith (Phase), Void Hulk (huge, Armored) | Photon Cannon |
| 2 | **Photon Spire** (photon chain between creatures) | Null Swarm (Shock does nothing), Mirror Knight (Mirror, Shielded) | Photon Spire |
| 3 | **Starfall Array** (rains photon bolts on a wide area) | Rift Hydra (splits into three), Shade Lord (Camo, Shielded) | Starfall plus Radar |
| 4 | **Nova Bomb** (charges, then wipes an area) | Rift Leech (weakens nearby defenders), Prism Drake (Flying, Mirror) | Nova for leech packs |
| 5 | **Rift Breaker** (photon beam that cuts a straight line) | Star Eater (eats shots, huge), Entropy Mites (fast swarm, Phase) | Rift Breaker down the line |
| Boss: The Heart of the Rift | **Photon Fortress** (the final defender, slow charge, screen-wide flash) | The Heart of the Rift, Rift Champions | Everything the student has learned |

---

## 5. Build bar with 50 defenders: a "Gear Up" loadout

By World 3 the student owns more defenders than fit on the build bar. Proposal: before each level a **Gear Up** screen shows the level's briefing (the new creatures' intel cards) and the student picks **8 defenders** to bring. Reading the briefing is how you pick well. The level's new defender is always included. A **Recommended** button fills the 8 for students who need it (counted in the teacher report). Worlds 1 and 2 skip Gear Up because everything fits.

## 6. Build order (each step ends playable)

1. **Damage types and traits engine:** add types to every defender and traits to every creature in `units.json`; Armored, Fireproof, Frostproof, Grounded, Mirror and Regen work in battle. Sonnet builds, Opus checks.
2. **Camo, Sniper Nest and Shade Stalker,** plus the Level 5 scout wave. Sonnet builds the defender and creature on the existing pattern; Opus designs the look of camo (a shimmer you can just make out).
3. **Rift Intel card:** scout wave, card after the wave, no narrator, tap any word, teacher read-aloud setting, Bestiary in the pause menu, `check_intel.py`. Opus writes World 1 card text; Haiku enters it and the Spanish lines.
4. **World 1 schedule:** one defender per level, Bark Beetle, Moss Mender, Iron Boar, Dart Runner; Rift Cache win bonus; World 1 rebalance with the new sim test (Archer-only must lose). Opus tunes; Mr. Scott playtests.
5. Later worlds bring their defenders and creatures as each world is built. Gear Up comes with World 3.

Steps 1 to 4 are about four sessions.

## Decisions (November 22)

1. Gear Up loadout, pick 8 before each level from World 3 on: **yes**.
2. Intel card audio: Read all and tap-a-word in Worlds 1 and 2, tap-a-word only in Worlds 3 and 4, none from World 5 on. Teacher read-aloud setting keeps full support for accommodations.
3. Next build: step 1, the damage types and traits engine (Claude's call, since the roster needs it before anything else).
