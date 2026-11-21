"""Voice every menu and story line in game/data/strings.json with Azure AI Speech.

Runs inside the "Build and deploy" GitHub Action. The key and region come from
GitHub Secrets, so they never appear in this public repo.

- English lines use the English narrator voice from game/data/voices.json.
- Spanish lines use the Spanish narrator voice.
- Each file name is a fingerprint of the voice and the exact text, so a line is
  only sent to Azure again when its words or its voice change.
- Writes MP3s to assets/audio/ui/ and a list of them to assets/audio/ui/manifest.json.
- Also voices every battle word, option and rune in game/data/world*.json with the
  reading guide voice (narrator until a guide is picked), plus each Spanish meaning
  with the Spanish narrator. Word files go to assets/audio/words/ with their own
  manifest. Short words are spelled out for Azure as sounds (IPA), so made-up rune
  words and answer options are said exactly the way they are spelled.

If the key is missing, it keeps the current manifest and exits quietly. The game then
uses the Chromebook's built-in voice for any line without a file.
"""
import glob
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from xml.sax.saxutils import escape

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
STRINGS = os.path.join(ROOT, "game", "data", "strings.json")
VOICES = os.path.join(ROOT, "game", "data", "voices.json")
OUT = os.path.join(ROOT, "assets", "audio", "ui")
MANIFEST = os.path.join(OUT, "manifest.json")
WORDS_OUT = os.path.join(ROOT, "assets", "audio", "words")
WORDS_MANIFEST = os.path.join(WORDS_OUT, "manifest.json")
DATA = os.path.join(ROOT, "game", "data")

# Letter to sound for World 1 words (consonant, short vowel, consonant).
IPA = {
    "a": "æ", "e": "ɛ", "i": "ɪ", "o": "ɑ", "u": "ʌ",
    "b": "b", "c": "k", "d": "d", "f": "f", "g": "ɡ", "h": "h", "j": "dʒ", "k": "k",
    "l": "l", "m": "m", "n": "n", "p": "p", "r": "ɹ", "s": "s", "t": "t", "v": "v",
    "w": "w", "x": "ks", "y": "j", "z": "z",
}


def cvc_ipa(word):
    if len(word) == 3 and word[1] in "aeiou" and all(ch in IPA for ch in word):
        return "".join(IPA[ch] for ch in word)
    return None
LOCALES = {"en": "en-US", "es": "es-MX"}

KEY = os.environ.get("AZURE_SPEECH_KEY", "").strip()
REGION = os.environ.get("AZURE_SPEECH_REGION", "").strip()


def fingerprint(voice, text):
    return hashlib.sha1((voice + "|" + text).encode("utf-8")).hexdigest()[:12]


def synthesize(voice, locale, text, ipa=None, rate="-5%"):
    body = escape(text)
    if ipa:
        body = f'<phoneme alphabet="ipa" ph="{ipa}">{escape(text)}</phoneme>'
    ssml = (f'<speak version="1.0" xml:lang="{locale}" xmlns="http://www.w3.org/2001/10/synthesis">'
            f'<voice name="{voice}"><prosody rate="{rate}">{body}</prosody></voice></speak>')
    req = urllib.request.Request(
        f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml.encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "rift-runners-voice-lines",
        },
    )
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except urllib.error.HTTPError as err:
            if err.code == 429:
                time.sleep(5 * (attempt + 1))  # free tier rate limit: wait and retry
                continue
            print(f"Azure error {err.code} for: {text[:40]}")
            if ipa:
                print("  Retrying without sound spelling.")
                return synthesize(voice, locale, text, None, rate)
            return None
        except urllib.error.URLError as err:
            print(f"Network error: {err}")
            time.sleep(3)
    return None


def main():
    if not KEY or not REGION:
        print("Azure key or region not set. Skipping voice lines.")
        return 0
    strings = json.load(open(STRINGS, encoding="utf-8"))
    voices = json.load(open(VOICES, encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    made = 0
    for lang, locale in LOCALES.items():
        voice = (voices.get("narrator") or {}).get(lang)
        if not voice:
            print(f"No narrator voice set for {lang}. Skipping.")
            continue
        os.makedirs(os.path.join(OUT, lang), exist_ok=True)
        manifest[lang] = {}
        for line_id, text in strings.get(lang, {}).items():
            if not isinstance(text, str) or not text.strip():
                continue
            name = f"{lang}/{fingerprint(voice, text)}.mp3"
            path = os.path.join(OUT, name)
            if not os.path.exists(path):
                audio = synthesize(voice, locale, text)
                time.sleep(0.4)
                if audio is None:
                    continue
                with open(path, "wb") as f:
                    f.write(audio)
                made += 1
            manifest[lang][line_id] = name
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    print(f"Voiced {made} new lines. Manifest has {sum(len(v) for v in manifest.values())} lines.")
    voice_words(voices)
    return 0


def voice_words(voices):
    """Voice battle words (English) and their Spanish meanings."""
    guide = (voices.get("readingGuide") or {}).get("en") or (voices.get("narrator") or {}).get("en")
    es_voice = (voices.get("narrator") or {}).get("es")
    english, spanish = set(), set()
    for path in sorted(glob.glob(os.path.join(DATA, "world*.json"))):
        data = json.load(open(path, encoding="utf-8"))
        for group in ("words", "runes"):
            for item in data.get(group, []):
                english.add(item["w"])
                english.update(item.get("options", []))
                if item.get("es"):
                    spanish.add(item["es"])
    manifest = {"en": {}, "es": {}}
    made = 0
    jobs = [("en", "en-US", guide, sorted(english)), ("es", "es-MX", es_voice, sorted(spanish))]
    for lang, locale, voice, items in jobs:
        if not voice:
            continue
        os.makedirs(os.path.join(WORDS_OUT, lang), exist_ok=True)
        for text in items:
            ipa = cvc_ipa(text) if lang == "en" else None
            key = voice + ("|ipa:" + ipa if ipa else "")
            name = f"{lang}/{fingerprint(key, text)}.mp3"
            path = os.path.join(WORDS_OUT, name)
            if not os.path.exists(path):
                audio = synthesize(voice, locale, text, ipa, "-10%" if lang == "en" else "-5%")
                time.sleep(0.4)
                if audio is None:
                    continue
                with open(path, "wb") as f:
                    f.write(audio)
                made += 1
            manifest[lang][text] = name
    with open(WORDS_MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    print(f"Voiced {made} new word files. Word manifest has {sum(len(v) for v in manifest.values())} entries.")


if __name__ == "__main__":
    sys.exit(main())
