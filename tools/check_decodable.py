"""Decodability checker.

Checks every word in the world content files (game/data/world*.json) against the
patterns taught up to that world, plus that world's heart words. Prints a plain
report and exits with an error if anything fails, so the deploy stops before
bad content goes live.

World 1 rules (short vowels, closed syllables, CVC):
- three letters: consonant, short vowel (a e i o u), consonant
- first letter: b c d f g h j k l m n p r s t v w y z
- last letter: b d f g l m n p s t x z (no r, w or y, which change the vowel;
  no c, h, j, k, q or v, which do not end short words in English)
- no c or g before e or i (those can make the soft sound)
- tap-mode options keep both consonants and change only the vowel
- rune words (nonsense) must not also be real words in the same file

A short list of crude or hurtful words is kept as fingerprints, so the words
themselves are not written in this public repo. No word, option or rune may
match one of them.

Run: python3 tools/check_decodable.py
"""
import glob
import hashlib
import json
import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DATA = os.path.join(ROOT, "game", "data")

VOWELS = set("aeiou")
W1_FIRST = set("bcdfghjklmnprstvwyz")
W1_LAST = set("bdfglmnpstxz")

BLOCKED = {
    "00f4619cda", "037b3e936d", "0dfd8fb5f3", "17d26e5852", "1a2805f9c2", "1dba39a0e5",
    "26fe597d2a", "2728aff2b8", "2871591e64", "2ddee02a79", "2f61cb7837", "332d49172d",
    "3b4185eac1", "485a090f7b", "495eb2dad0", "4fe14b165f", "514b1ffb30", "55391ea016",
    "5b5fb1c9d7", "64dbae655e", "6719c46a0a", "68bb04bd54", "691eba59f4", "69eefb2428",
    "6c117afa42", "6e1d3f4581", "77e5127dab", "7fd55bc0bf", "85ae176393", "937adac2c1",
    "9473d93666", "9ee972c591", "a1bfc156c4", "ab14d94055", "ac04b70e6d", "adccece39a",
    "bfabc6e658", "c3df16be39", "cc934d401b", "d5599ab17a", "dcb19ff840", "e347d21338",
    "ef43e05603", "f0b5bcedce", "f3765df4fd", "f4ce065b1d", "fcff8ed87a",
    # Added Nov 27 (Studio word check, Test 9): a slur in two spellings.
    "5a6b3a57b2", "737de76734",
}


def blocked(word):
    return hashlib.sha1(word.lower().encode("utf-8")).hexdigest()[:10] in BLOCKED


# Spellings that sound the same (or close enough that a teen would hear it) when a
# made-up rune is read aloud. Used to catch runes that sound like a blocked word
# even though they are spelled differently (the Gemini build had to replace "shid").
SAME_SOUND = [
    ("ck", "k"), ("k", "ck"), ("c", "k"), ("k", "c"), ("c", "ck"),
    ("x", "ks"), ("x", "cks"), ("ph", "f"), ("f", "ph"), ("qu", "kw"),
    ("z", "s"), ("s", "z"),
]
# Close sounds a reader might slide into: only one of these per word.
NEAR_SOUND = [("i", "e"), ("e", "i")]
# A final consonant read with or without voice (shid / shit). Counts as the one near sound.
FINAL_SWAPS = {"d": "t", "t": "d", "b": "p", "p": "b", "z": "s", "s": "z", "v": "f", "f": "v"}


def _swaps(w, table):
    out = set()
    for a, b in table:
        i = w.find(a)
        while i != -1:
            out.add(w[:i] + b + w[i + len(a):])
            i = w.find(a, i + 1)
    return out


def sound_variants(word):
    """Spellings that sound the same, plus at most one near sound."""
    w = word.lower()
    near = {w} | _swaps(w, NEAR_SOUND)
    if w and w[-1] in FINAL_SWAPS:
        near.add(w[:-1] + FINAL_SWAPS[w[-1]])
    out = set(near)
    for _ in range(2):
        grown = set()
        for v in out:
            grown |= _swaps(v, SAME_SOUND)
            if v and v[-1] in "bdfgklmnprstz":
                grown.add(v + v[-1])  # a doubled ending sounds the same
        out |= grown
    out.discard(w)
    return out


def sounds_blocked(word):
    return any(blocked(v) for v in sound_variants(word))


def heart_words(world):
    path = os.path.join(DATA, "heart-words.json")
    table = json.load(open(path, encoding="utf-8"))
    allowed = set()
    for w in range(1, world + 1):
        allowed.update(x.lower() for x in table.get(str(w), []))
    return allowed


def check_w1_word(word):
    """Return a list of problems for one World 1 word (empty list = OK)."""
    problems = []
    if not re.fullmatch(r"[a-z]{3}", word):
        return ["must be 3 lowercase letters"]
    c1, v, c2 = word
    if c1 not in W1_FIRST:
        problems.append(f"'{c1}' cannot start a World 1 word")
    if v not in VOWELS:
        problems.append("middle letter must be a short vowel")
    if c2 not in W1_LAST:
        problems.append(f"'{c2}' cannot end a World 1 word")
    if c1 in "cg" and v in "ei":
        problems.append(f"'{c1}' before '{v}' can make the soft sound")
    return problems


def check_w8_word(word):
    """World 8 uses every pattern from Worlds 1 to 7, so any plain English word fits.
    The story text itself is checked by hand (DESIGN.md 7, final level preview)."""
    if not re.fullmatch(r"[a-z]+('[a-z]+)?", word.lower()):
        return ["must be letters only"]
    return []


CHECKERS = {1: check_w1_word, 8: check_w8_word}


def check_file(path):
    errors = []
    data = json.load(open(path, encoding="utf-8"))
    world = int(data.get("world", 0))
    check = CHECKERS.get(world)
    name = os.path.basename(path)
    if not check:
        return [f"{name}: no rules written yet for world {world}"], 0
    hearts = heart_words(world)
    real = {item["w"] for item in data.get("words", [])}
    count = 0

    def word_ok(word, where, sound_check=False):
        nonlocal count
        count += 1
        if blocked(word):
            errors.append(f"{name}: '{word}' ({where}) is on the blocked list. Pick another word.")
            return
        if sound_check and sounds_blocked(word):
            errors.append(f"{name}: '{word}' ({where}) sounds like a word on the blocked list when read aloud. Pick another word.")
            return
        if word.lower() in hearts:
            return
        for p in check(word):
            errors.append(f"{name}: '{word}' ({where}): {p}")

    for group in ("words", "runes"):
        seen = set()
        for item in data.get(group, []):
            w = item["w"]
            if w in seen:
                errors.append(f"{name}: '{w}' is listed twice in {group}")
            seen.add(w)
            # Real words were picked on purpose; made-up runes also get the sound-alike check.
            word_ok(w, group, sound_check=(group == "runes"))
            if group == "runes" and w in real:
                errors.append(f"{name}: rune '{w}' is also a real word in this file")
            opts = item.get("options", [])
            if len(opts) != 2 or len(set(opts)) != 2:
                errors.append(f"{name}: '{w}' needs exactly 2 different options")
            for o in opts:
                word_ok(o, f"option for {w}", sound_check=(o not in real))
                if o == w:
                    errors.append(f"{name}: '{w}' lists itself as an option")
                elif world == 1 and len(o) == 3 and (o[0] != w[0] or o[2] != w[2]):
                    errors.append(f"{name}: option '{o}' for '{w}' must change only the vowel")
                elif world == 1 and len(o) == 3 and {o[1], w[1]} == {"i", "e"} and w[2] in "mn":
                    errors.append(f"{name}: option '{o}' for '{w}': short i and short e sound alike before m or n (pin/pen). Pick another vowel.")
    # Sound rule card key words: a closed syllable with that vowel (ax, it, jet, ox, up).
    for v, info in ((data.get("rules") or {}).get("vowels") or {}).items():
        k = info.get("word", "")
        count += 1
        if blocked(k):
            errors.append(f"{name}: rule key word '{k}' is on the blocked list.")
        elif not re.fullmatch(r"[a-z]?" + v + r"[a-z]", k) or (len(k) == 3 and check(k)):
            errors.append(f"{name}: rule key word '{k}' for '{v}' must be a closed syllable with short {v}")
    # Story cards and the Rift Seal (World 8): every word of every line we show.
    lines = []
    for card in data.get("cards", []):
        lines += [(card["text"], card["id"]), (card["q"], card["id"] + " question")]
        lines += [(c, card["id"] + " answer") for c in card["choices"]]
    seal = data.get("seal")
    if seal:
        lines.append((seal["text"], "seal"))
        for q in seal.get("questions", []):
            lines += [(q["q"], "seal question")] + [(c, "seal answer") for c in q["choices"]]
    for text, where in lines:
        for raw in text.split():
            w = re.sub(r"^[^A-Za-z']+|[^A-Za-z']+$", "", raw)
            if w:
                word_ok(w, where)
    return errors, count


def main():
    files = sorted(glob.glob(os.path.join(DATA, "world*.json")))
    total = 0
    all_errors = []
    for f in files:
        errs, n = check_file(f)
        total += n
        all_errors.extend(errs)
    if all_errors:
        print("Decodability check FAILED:")
        for e in all_errors:
            print("  - " + e)
        return 1
    print(f"Decodability check passed: {total} words in {len(files)} file(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
