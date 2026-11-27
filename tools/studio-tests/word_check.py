"""Studio word list check (decodability + classroom-safe words).

Reads the word data dumped from the Studio build (see dump_words.ts in this folder)
and checks every level against the skill sequence the Studio build uses:

  World 1: single consonants and short vowels (CVC), vowels added level by level
  World 2: sh, ch, th, wh, ck, then the blends bl, cl, fr, gr, sp, st, nd, mp
  World 3: silent e (a_e, i_e so far)

What it checks:
  - Target words (shown on screen) use only patterns taught by that level, plus heart words
  - Tiles spell the word, and the target tile holds the level pattern
  - Choices (played as sounds in tap mode) are not on the blocked list and do not
    sound like a blocked word; no choice sounds the same as the word
  - No short i / short e choice pair before m or n (pin/pen merger, common on the Gulf Coast)
  - Runes are not real words used elsewhere in the game
  - Placement probe words exist in their source level

Run:
  node_modules/.bin/tsx <this folder>/dump_words.ts   (from the Studio folder; writes /home/claude/tests/studio_words.json)
  python3 tools/studio-tests/word_check.py /home/claude/tests/studio_words.json
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
from check_decodable import blocked, sounds_blocked  # noqa: E402

VOWELS = "aeiou"
FIRST = set("bcdfghjklmnprstvwyz")
LAST = set("bdfglmnpstxz")
DIGRAPHS = ["sh", "ch", "th", "wh"]
START_BLENDS = ["bl", "cl", "fr", "gr", "sp", "st"]
END_CLUSTERS = {"ck": "ck", "sh": "sh", "ch": "ch", "th": "th", "nd": "nd", "mp": "mp", "st": "st"}
NOT_TAUGHT_END = {"ll": "floss ll", "ss": "floss ss", "ff": "floss ff", "nk": "nk", "ng": "ng", "tch": "tch"}
# Real words picked on purpose. The sound-alike rule (one near sound or a voiced
# final consonant) flags them, but heard aloud they are ordinary words.
REAL_OK = {"fad", "jab", "mix"}
HEART = {"a", "i", "the", "to", "of", "is", "was", "you", "said", "they", "were", "his", "has", "as"}

# Known homophones and near-homophones among short words (spelling pairs that sound the same).
SAME_SOUND_PAIRS = [{"sun", "son"}, {"ton", "tun"}, {"won", "wun"}, {"cot", "caught"}, {"which", "witch"},
                    {"whim", "wim"}, {"whip", "wip"}, {"when", "wen"}, {"wham", "wam"}, {"whiz", "wiz"}]


def onset_need(on):
    """Patterns needed for a start cluster, or a problem string."""
    if on == "":
        return set(), None
    if len(on) == 1:
        return set(), None if on in FIRST else f"'{on}' start not taught"
    if on in DIGRAPHS:
        return {on}, None
    if on in START_BLENDS:
        return {on}, None
    return set(), f"start '{on}' not taught"


def coda_need(co):
    if co == "":
        return set(), "open syllable (no end consonant) not taught"
    if len(co) == 1:
        return set(), None if co in LAST else f"'{co}' end not taught in World 1 rules"
    if co in END_CLUSTERS:
        return {END_CLUSTERS[co]}, None
    for k, label in NOT_TAUGHT_END.items():
        if co.endswith(k):
            return set(), f"{label} ending not taught"
    if len(co) == 2 and co[0] in "nm" and co[1] in "dp":
        return {co}, None
    return set(), f"end '{co}' not taught"


def analyze(word):
    """Return (patterns needed, problems)."""
    w = word.lower()
    if w in HEART:
        return set(), []
    m = re.fullmatch(r"([b-df-hj-np-tv-z]*)([aeiou])([b-df-hj-np-tv-z])e", w)
    if m and m.group(3) not in "rwy":
        on, v, c = m.groups()
        need, p = onset_need(on)
        probs = [p] if p else []
        need = set(need) | {f"{v}_e"}
        if on and on[-1] in "cg" and v in "ei":
            probs.append(f"'{on[-1]}' before '{v}' can make the soft sound")
        return need, probs
    m = re.fullmatch(r"([b-df-hj-np-tv-z]*)([aeiou])([b-df-hj-np-tv-z]*)", w)
    if not m:
        return set(), ["not a one-syllable short or silent e word"]
    on, v, co = m.groups()
    need = {v}
    probs = []
    n1, p1 = onset_need(on)
    n2, p2 = coda_need(co)
    need |= n1 | n2
    probs += [p for p in (p1, p2) if p]
    if on and on[-1] in "cg" and v in "ei" and w not in {"get", "gift"}:
        probs.append(f"'{on[-1]}' before '{v}' can make the soft sound")
    if co and co[0] in "rwy":
        probs.append("r, w or y after the vowel changes the vowel")
    return need, probs


def sound_key(w):
    """Rough sound spelling: ck=k, c=k, wh=w, x=ks."""
    s = w.lower().replace("ck", "k").replace("wh", "w").replace("x", "ks")
    s = re.sub(r"c(?=[aou]|$|[^eih])", "k", s)
    return s


def same_sound(a, b):
    if {a, b} in SAME_SOUND_PAIRS:
        return True
    return sound_key(a) == sound_key(b) and a != b


def pin_pen(a, b):
    """True if a and b differ only by short i vs short e before m or n."""
    if len(a) != len(b):
        return False
    diff = [i for i in range(len(a)) if a[i] != b[i]]
    if len(diff) != 1:
        return False
    i = diff[0]
    return {a[i], b[i]} == {"i", "e"} and i + 1 < len(a) and a[i + 1] in "mn"


def main(path):
    d = json.load(open(path, encoding="utf-8"))
    order = [x for x in d["order"] if x in d["levels"]]
    taught = set()
    all_real = {}
    for lid in order:
        for e in d["levels"][lid]["realWords"]:
            all_real.setdefault(e["w"], lid)
    problems = []

    def add(lid, word, msg, kind):
        problems.append((lid, word, kind, msg))

    for lid in order:
        lv = d["levels"][lid]
        taught |= set(lv["vowels"])
        for group in ("realWords", "runes"):
            seen = set()
            for e in lv[group]:
                w = e["w"]
                if w in seen:
                    add(lid, w, "listed twice", "data")
                seen.add(w)
                if blocked(w) or (group == "runes" and sounds_blocked(w)):
                    add(lid, w, "on or sounds like the blocked list", "SAFE")
                need, probs = analyze(w)
                for p in probs:
                    add(lid, w, p, "decode")
                missing = need - taught
                if missing:
                    add(lid, w, "uses " + ", ".join(sorted(missing)) + " before it is taught", "decode")
                pat = e.get("pattern")
                if pat and pat not in lv["vowels"]:
                    add(lid, w, f"pattern '{pat}' is not one of this level's patterns", "data")
                tiles = e.get("tiles")
                if tiles:
                    if "".join(tiles) != w:
                        add(lid, w, "tiles do not spell the word", "data")
                    ti = e.get("targetTileIdx")
                    if pat and ti is not None and ti < len(tiles):
                        t = tiles[ti]
                        ok = t == pat or (pat.endswith("_e") and t == pat[0])
                        if not ok:
                            add(lid, w, f"target tile '{t}' is not the pattern '{pat}'", "data")
                if group == "runes" and w in all_real:
                    add(lid, w, f"rune is a real word in {all_real[w]}", "decode")
                opts = e.get("options", [])
                if len(opts) != 2 or len(set(opts)) != 2 or w in opts:
                    add(lid, w, "needs 2 different choices that are not the word", "data")
                for o in opts:
                    if blocked(o) or (o not in REAL_OK and sounds_blocked(o)):
                        add(lid, w, f"choice '{o}' is on or sounds like the blocked list", "SAFE")
                    if same_sound(w, o):
                        add(lid, w, f"choice '{o}' sounds the same as the word", "choice")
                    if pin_pen(w, o):
                        add(lid, w, f"choice '{o}': short i and short e sound alike before m or n (pin/pen)", "choice")
                for a in e.get("sayAlso", []) or []:
                    if blocked(a):
                        add(lid, w, f"sayAlso '{a}' is on the blocked list", "SAFE")
    for k, r in (d.get("rules") or {}).items():
        word = r.get("word", "")
        if blocked(word):
            add("rules", word, "rule key word is on the blocked list", "SAFE")
    for st in d.get("placement", []):
        src = d["levels"].get(st["sourceLevelId"])
        if not src:
            add("placement", st["id"], "source level missing", "data")
            continue
        have = {e["w"] for e in src["realWords"] + src["runes"]}
        for w in st["probeWords"]:
            if w not in have:
                add("placement", w, f"probe word not in {st['sourceLevelId']}", "data")

    total = sum(len(d["levels"][l]["realWords"]) + len(d["levels"][l]["runes"]) for l in order)
    print(f"Checked {total} words in {len(order)} levels.")
    for lid, w, kind, msg in problems:
        print(f"  [{kind}] {lid} '{w}': {msg}")
    print(f"{len(problems)} flags.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "/home/claude/tests/studio_words.json"))
