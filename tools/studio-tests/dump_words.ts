import * as L from '/home/claude/jimmaoscott-lang/rift-runners-studio/src/data/level1';
import * as P from '/home/claude/jimmaoscott-lang/rift-runners-studio/src/data/placement';
import { writeFileSync } from 'fs';
const out: any = { order: L.LEVEL_ORDER, levels: {}, rules: L.PATTERN_RULES, placement: P.PLACEMENT_STAGES };
for (const [id, lv] of Object.entries((L as any).LEVELS as Record<string, any>)) {
  out.levels[id] = { worldId: lv.worldId, num: lv.num, name: lv.name, worldName: lv.worldName, vowels: lv.vowels, comingSoon: lv.comingSoon, isPlacement: lv.isPlacement,
    headline: lv.headline, description: lv.description, wordsSummary: lv.wordsSummary,
    realWords: lv.realWords, runes: lv.runes };
}
writeFileSync('/home/claude/tests/studio_words.json', JSON.stringify(out, null, 1));
console.log(Object.keys(out.levels).map(k => `${k}: ${out.levels[k].realWords.length} real, ${out.levels[k].runes.length} runes, patterns ${out.levels[k].vowels}`).join('\n'));
