"""Voice every menu and story line in game/data/strings.json with Azure AI Speech.

Runs inside the "Build and deploy" GitHub Action. The key and region come from
GitHub Secrets, so they never appear in this public repo.

- English lines use the English narrator voice from game/data/voices.json.
- Spanish lines use the Spanish narrator voice.
- Each file name is a fingerprint of the voice and the exact text, so a line is
  only sent to Azure again when its words or its voice change.
- Writes MP3s to assets/audio/ui/ and a list of them to assets/audio/ui/manifest.json.

If the key is missing, it keeps the current manifest and exits quietly. The game then
uses the Chromebook's built-in voice for any line without a file.
"""
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
LOCALES = {"en": "en-US", "es": "es-MX"}

KEY = os.environ.get("AZURE_SPEECH_KEY", "").strip()
REGION = os.environ.get("AZURE_SPEECH_REGION", "").strip()


def fingerprint(voice, text):
    return hashlib.sha1((voice + "|" + text).encode("utf-8")).hexdigest()[:12]


def synthesize(voice, locale, text):
    ssml = (f'<speak version="1.0" xml:lang="{locale}" xmlns="http://www.w3.org/2001/10/synthesis">'
            f'<voice name="{voice}"><prosody rate="-5%">{escape(text)}</prosody></voice></speak>')
    req = urllib.request.Request(
        f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml.encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "reading-fluency-voice-lines",
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
    return 0


if __name__ == "__main__":
    sys.exit(main())
