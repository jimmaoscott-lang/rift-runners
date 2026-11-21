"""Make voice samples with Azure AI Speech so Mr. Scott can pick the game's voices.

Runs inside a GitHub Action. Reads the key and region from environment
variables (stored as GitHub Secrets). Writes MP3 files to assets/audio/samples/.
"""
import json
import time
import os
import sys
import urllib.request
import urllib.error
from xml.sax.saxutils import escape

KEY = os.environ.get("AZURE_SPEECH_KEY", "").strip()
REGION = os.environ.get("AZURE_SPEECH_REGION", "").strip()
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "audio", "samples")

ENGLISH_VOICES = [
    "en-US-AndrewNeural", "en-US-BrianNeural", "en-US-GuyNeural", "en-US-DavisNeural",
    "en-US-AvaNeural", "en-US-EmmaNeural", "en-US-JennyNeural", "en-US-AriaNeural",
]
SPANISH_VOICES = ["es-MX-DaliaNeural", "es-MX-JorgeNeural", "es-US-AlonsoNeural", "es-US-PalomaNeural"]

# Each sample: (file label, SSML body inside the <voice> tag)
ENGLISH_SAMPLES = [
    ("game-line", escape("Nice. Twelve words in a row. That gate won't stand a chance.")),
    ("words", '<break time="300ms"/>'.join(escape(w) for w in
        ["cat", "ship", "stone", "float", "storm", "candle", "construction"])),
    ("passage", escape("The storm hit the coast at dusk. Jake grabbed his pack and ran "
                       "for the cliffs. He had one shot to make it up before the tide came in.")),
    ("sounds", '<break time="400ms"/>'.join([
        '<phoneme alphabet="ipa" ph="ɪ">i</phoneme>',
        '<phoneme alphabet="ipa" ph="ɛ">e</phoneme>',
        '<phoneme alphabet="ipa" ph="æ">a</phoneme>',
        '<phoneme alphabet="ipa" ph="ʃ">sh</phoneme>',
        '<phoneme alphabet="ipa" ph="tʃ">ch</phoneme>',
    ])),
]
SPANISH_SAMPLES = [
    ("game-line", escape("¡Bien hecho! Toca cualquier palabra para escucharla.")),
    ("glossary", escape("Construcción. Construction. Ya conoces esta palabra.")),
]


def request(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def main():
    if not KEY or not REGION:
        print("Azure key or region not set yet. Add the GitHub Secrets, then run again.")
        return 0
    os.makedirs(OUT, exist_ok=True)
    base = f"https://{REGION}.tts.speech.microsoft.com/cognitiveservices"
    auth = {"Ocp-Apim-Subscription-Key": KEY}

    available = {v["ShortName"] for v in json.loads(request(f"{base}/voices/list", headers=auth))}
    made, skipped = [], []
    jobs = [(v, "en-US", s) for v in ENGLISH_VOICES for s in ENGLISH_SAMPLES]
    jobs += [(v, v[:5], s) for v in SPANISH_VOICES for s in SPANISH_SAMPLES]

    for voice, lang, (label, body) in jobs:
        if voice not in available:
            skipped.append(voice)
            continue
        ssml = (f'<speak version="1.0" xml:lang="{lang}" xmlns="http://www.w3.org/2001/10/synthesis">'
                f'<voice name="{voice}"><prosody rate="-5%">{body}</prosody></voice></speak>')
        headers = dict(auth)
        headers.update({
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "reading-fluency-voice-samples",
        })
        audio = None
        for attempt in range(4):
            try:
                audio = request(f"{base}/v1", data=ssml.encode("utf-8"), headers=headers)
                break
            except urllib.error.HTTPError as err:
                if err.code == 429:
                    time.sleep(5 * (attempt + 1))  # free tier rate limit: wait and retry
                    continue
                print(f"Failed: {voice} {label}: {err.code}")
                break
        time.sleep(0.5)
        if audio is None:
            print(f"Gave up: {voice} {label}")
            continue
        name = f"{voice.replace('Neural', '')}_{label}.mp3"
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(audio)
        made.append(name)

    print(f"Made {len(made)} files.")
    if skipped:
        print("Voices not available in this region:", ", ".join(sorted(set(skipped))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
