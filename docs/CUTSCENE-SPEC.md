## Technical & Production Guidelines for World 1

# 1. Technical & Delivery Specs

## Target Hardware & Runtime Context

Optimized for target web runtime builds (including low-spec Chromebook environments) and standardized AI generation pipelines.

- **Container & Format:** MP4 container (.mp4)

- **Video Codec:** H.264 (AVC), Main Profile

- **Audio Codec:** AAC-LC, stereo, 44.1kHz

- **Target Resolution:** 720p (1280x720)

- **Frame Rate:** 24 fps or 30 fps consistent export

## Prompting & Visual Formatting Rules

- **Caption Rule (Critical):** Do NOT burn on-screen text, subtitles, or UI captions directly into AI video generation prompts. Text rendered within video generation models causes artifacting and garbled characters. All text content must be delivered via the game engine UI layer. Keep engine UI captions targeting a **3rd to 4th grade reading level**.

- **Prompt Structure Rule:** Focus every video prompt on a single primary camera movement (e.g., *slow tracking forward*, *low-angle tilt*), a specific lighting mood, and one core visual action. Avoid multi-cut or complex narrative scripts inside individual clip prompts.

# 2. Locked Character & Creature Bible

These copy-paste visual anchors ensure continuity across all generated video cutscenes. Include these exact phrasing strings in generation prompts.

## The Rift Warden

- **Visual Anchor:** *A veteran guardian in her 30s with fair skin, vivid red hair pulled back tightly, and a distinctive scar over her left eyebrow. She maintains a broad, serious soldier posture. Wears a long dark-teal fabric coat with worn brown leather straps, light iron shoulder plates, and a dark hood resting down on her shoulders.*

- **Weapon / Prop:** *Carries a tall, gnarled twisted wooden staff. (Consistency Lock Note: Staff is topped with a glowing Cyan crystal core for all World 1 assets).*

- **Persona & Voice:** Plain-spoken, calm under extreme pressure, acts as a tactical mentor. Treats the Runner as a capable recruit rather than a child.

## The Runner (Player Character)

- **Visual Anchor:** *Shown strictly from behind or in deep silhouette. No facial features are ever visible, allowing every student to project themselves onto the character. Wears a dark, weather-worn hooded jacket with the hood pulled up, a durable utility backpack, and a broad glowing rune wristband on one forearm.*

- **Behavior:** *The wristband glows brighter with blue-cyan light when interacting with game runes.*

## Hostile Entities

- **Rift Wisps:** *Small, fast-moving spheres of volatile violet light with jagged trailing energy tails. They swarm in dense packs, moving erratically close to the ground with crackling sound patterns.*

- **Thornbacks:** *Heavy, quad-pedal beasts clad in thick dark-purple crystal plates and sharp dorsal spikes. Slow, deliberate, heavy footsteps that shake the surrounding terrain.*

- **The Thorn King (Boss Teaser / Finale):** *A massive, imposing shadow silhouette towering deep within the forest canopy. Features sprawling antlers crafted from jagged violet crystal thorns and two burning crimson eyes.*

## Key Environmental Anchor

- **Rift Anchor:** *An ancient, carved stone pillar embedded at the camp perimeter, centered around a pulsing blue power core that radiates protective energy. Target of hostile creature pushes.*

# 3. Reusable Prompt Template

Use the standardized structure below for drafting new video generation clips across levels:

\[ART STYLE\]: Dark atmospheric fantasy illustration, semi-realistic painterly 2.5D game cutscene style, twilight lighting, deep teal and violet ambient palette.

\[ENVIRONMENT\]: \[Insert specific setting, e.g., Pine forest path with damp soil and misty air\]

\[CHARACTER ANCHOR\]: \[Insert locked character description\]

\[CAMERA MOVEMENT\]: \[Insert single movement, e.g., Slow low-angle tracking shot moving forward\]

\[CORE VISUAL ACTION\]: \[Insert key single action, e.g., Warden plants her wooden staff firmly into the earth as cyan light pulses outward\]

\[LIGHTING/MOOD\]: Tense, majestic, cinematic fog, volumetric lighting highlights.



# 4. Master 8-Level x 3-Scene Production Matrix

*Note: Matrix tracks 24 core video assets spanning World 1. Levels 1 & 2 are fully specified; Levels 3 through 8 reserve standard sequence slots.*

| File ID     | Level & Setting          | Scene Type       | Target Duration | Visual Beat & Voice Line                                                                                                                                                                                                                                                                                                                                                                                                  | UI Caption (3rd-4th Grade)                                                    | Status                                  |
|-------------|--------------------------|------------------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|-----------------------------------------|
| L01_Opening | L1: Thornwood Edge       | Opening Cutscene | ~12–15s         | Camera glides over dusk pine forest. A purple rift tears open; Wisps and a Thornback emerge. Warden turns from campfire with glowing staff. *Voice: "The rift is open, and the Thornwood is falling. I can't hold this line alone. The runes are the only thing that can power our defenses."* Runner steps up as wristband lights up. *Voice: "Read them, and the towers fight. Ready, Runner? Here they come."*         | "The rift is open.""Read the runes to power our defenses.""Ready, Runner?"    | Reference Image Saved / Video Generated |
| L01_Victory | L1: Thornwood Edge       | Victory Cutscene | ~12s            | Final creature dissolves into bright sparks. The rift snaps shut; crystals crumble; stars peek through canopy. Warden nods approved. *Voice: "You held it. First rift sealed. Not bad for your first fight."* Deep in woods, Thorn King's glowing eyes flash among crystal antlers. *Voice: "But that was the edge of the forest. Something bigger is pushing through from the inside. Rest up. We move at first light."* | "First rift sealed!""Something bigger is deeper in the woods.""Level Clear"   | Video Generated                         |
| L01_Defeat  | L1: Thornwood Edge       | Defeat Cutscene  | ~8s             | Thornback smashes into the Rift Anchor; blue core fades to black. Warden strikes her staff onto the ground, creating a protective shockwave. She pants, looking back steadily. *Voice: "They broke through, but we're not done. Every rune you read made us stronger. Back to the line."*                                                                                                                                 | "They broke through.""Every rune made us stronger.""Try again"                | Video Generated                         |
| L02_Opening | L2: Logging Road & Creek | Opening Cutscene | ~10–12s         | Camera follows an old dirt logging road at dusk. Creek water flashes violet as a second rift opens over a broken wooden footbridge. Wisps spill over water. Warden takes stance at bridge head; Runner's wristband activates. *Voice: "A second tear, and it's on our side of the creek. Stay close to me."* Thornback splashes up the bank. *Voice: "Read the runes fast. Here they come."*                              | "A second rift opened at the creek.""Stay close to me.""Read the runes fast." | Ready to Generate                       |
| L02_Victory | L2: Logging Road & Creek | Victory Cutscene | ~10s            | Last Wisp bursts into soft sparks. Creek settles and the violet tear closes completely. Warden lowers staff, turning to Runner. *Voice: "Good. Two rifts sealed."* She glances up the dark logging road into the deep forest. *Voice: "Those were only scouts. The big ones are still coming."*                                                                                                                           | "Two rifts sealed!""More are coming up the road.""Level Clear"                | Ready to Generate                       |
| L02_Defeat  | L2: Logging Road & Creek | Defeat Cutscene  | ~8s             | Thornback smashes center bridge pillar; wooden planks collapse into rushing creek water. Warden plants staff firmly, sending a cyan light pulse to delay advancing horde. *Voice: "We fall back to camp. We hold the next bridge together."*                                                                                                                                                                              | "The bridge fell.""We hold the next one together.""Try again"                 | Ready to Generate                       |
| L03_Opening | L3: Deep Pine Hollow     | Opening Cutscene | ~10–12s         | Warden & Runner enter mist-covered hollow. Twin rifts open in high canopy branches. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                  | "Rifts are opening in the trees.""Watch above us."                            | Pending Script                          |
| L03_Victory | L3: Deep Pine Hollow     | Victory Cutscene | ~10s            | Canopy clear. Light breaks through thick pine branches. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                              | "The hollow is safe.""Level Clear"                                            | Pending Script                          |
| L03_Defeat  | L3: Deep Pine Hollow     | Defeat Cutscene  | ~8s             | Creatures overwhelm lower ditch; Warden shields Runner with barrier. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                 | "Retreat to high ground.""Try again"                                          | Pending Script                          |
| L04_Opening | L4: Shattered Quarry     | Opening Cutscene | ~10–12s         | Rocky ravine setting. Glowing crystal veins burst from quarry walls. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                 | "The crystals are charging the rift.""Protect the anchor."                    | Pending Script                          |
| L04_Victory | L4: Shattered Quarry     | Victory Cutscene | ~10s            | Quarry crystals shatter; energy absorbs into Runner wristband. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                       | "Quarry cleared!""Level Clear"                                                | Pending Script                          |
| L04_Defeat  | L4: Shattered Quarry     | Defeat Cutscene  | ~8s             | Quarry wall collapses; rift energy pulses outward. Warden holds defense line. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                        | "The quarry wall fell.""Try again"                                            | Pending Script                          |
| L05_Opening | L5: Whispering Ravine    | Opening Cutscene | ~10–12s         | Wind sweeps across narrow rope bridge over deep chasm; rift hangs in mid-air. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                        | "Cross the bridge carefully.""Rift energy is strong."                         | Pending Script                          |
| L05_Victory | L5: Whispering Ravine    | Victory Cutscene | ~10s            | Mid-air rift closes; wind subsides; bridge stabilizes. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                               | "The ravine is quiet.""Level Clear"                                           | Pending Script                          |
| L05_Defeat  | L5: Whispering Ravine    | Defeat Cutscene  | ~8s             | Gust of rift light forces party back onto near side of chasm. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                        | "Pushed back across the chasm.""Try again"                                    | Pending Script                          |
| L06_Opening | L6: Sunken Watchtower    | Opening Cutscene | ~10–12s         | Ancient stone tower flooded with purple rift water. Wisps emerge from archways. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                      | "Ancient magic is active here.""Power up the tower defense."                  | Pending Script                          |
| L06_Victory | L6: Sunken Watchtower    | Victory Cutscene | ~10s            | Tower beacon lights up in cyan; rift water drains. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                                   | "Watchtower restored!""Level Clear"                                           | Pending Script                          |
| L06_Defeat  | L6: Sunken Watchtower    | Defeat Cutscene  | ~8s             | Rift water rises; tower beacon flickers off. Warden pulls Runner upstairs. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                           | "The tower lost power.""Try again"                                            | Pending Script                          |
| L07_Opening | L7: Bramble Heart        | Opening Cutscene | ~10–12s         | Dense wall of crystal thorns blocks path; huge rift pulses behind brambles. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                          | "We are near the heart of the forest.""Break through the brambles."           | Pending Script                          |
| L07_Victory | L7: Bramble Heart        | Victory Cutscene | ~10s            | Crystal thorn wall crumbles, opening path to throne area. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                            | "The path to the throne is open!""Level Clear"                                | Pending Script                          |
| L07_Defeat  | L7: Bramble Heart        | Defeat Cutscene  | ~8s             | Thorns surge forward, forcing quick tactical retreat. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                                                | "The brambles pushed us back.""Try again"                                     | Pending Script                          |
| L08_Opening | L8: Thorn King's Throne  | Opening Cutscene | ~12–15s         | Massively wide cavern/clearing. The Thorn King steps out from deep shadow. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                           | "The Thorn King is here!""Use all your power now!"                            | Pending Script                          |
| L08_Victory | L8: Thorn King's Throne  | Victory Cutscene | ~15s            | Thorn King shatters into harmless crystal dust; main world rift seals completely. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                    | "The Thorn King is defeated!""World 1 Mastered!"                              | Pending Script                          |
| L08_Defeat  | L8: Thorn King's Throne  | Defeat Cutscene  | ~8s             | Thorn King roars, casting shadow over camp; Warden raises maximum shield. *Voice: Placeholder*                                                                                                                                                                                                                                                                                                                            | "The Thorn King is too strong.""Try again"                                    | Pending Script                          |
