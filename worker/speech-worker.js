// Rift Runners speech checker (DESIGN.md section 10, M5b).
// The game sends one short recording of a student reading one word. This Worker adds the Azure key,
// asks Azure Pronunciation Assessment how each sound was said, and sends back only the scores.
// Nothing is stored: no audio, no words, no logs of who spoke.
//
//   GET  /health            -> { ok: true } when the Azure key works
//   POST /check?ref=word     body: 16 kHz mono 16-bit WAV, under 6 seconds
//                            -> { ok, status, heard, word: { accuracy, error, phonemes: [{ p, score, best: [{ p, score }] }] } }
//   POST /passage?ref=text   body: 16 kHz mono 16-bit WAV, under 30 seconds (one sentence read aloud,
//                            World 8 story cards and the Rift Seal, Session 14)
//                            -> { ok, status, heard, words: [{ w, accuracy, error }] } in reading order,
//                               error is None, Mispronunciation or Omission (insertions are left out)

const ALLOWED = [
  /^https:\/\/jimmaoscott-lang\.github\.io$/,
  /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/, // Apps Script version
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, // testing
  /^null$/ // offline all-in-one file opened from the laptop
];
const MAX_BYTES = 200 * 1024; // about 6 seconds of 16 kHz audio
const MAX_PASSAGE_BYTES = 960 * 1024; // about 30 seconds, Azure's limit for this kind of check

function cors(origin) {
  const ok = origin && ALLOWED.some(function (re) { return re.test(origin); });
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://jimmaoscott-lang.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function reply(body, status, origin) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, cors(origin)) });
}

// Azure answers in two shapes (REST and SDK). Read both.
function pa(x) { return (x && x.PronunciationAssessment) || x || {}; }
function trim(az) {
  const out = { ok: true, status: az.RecognitionStatus || 'Unknown', heard: az.DisplayText || '' };
  const best = (az.NBest || [])[0];
  if (!best) return out;
  out.heard = best.Lexical || best.Display || out.heard;
  out.score = { accuracy: pa(best).AccuracyScore, pron: pa(best).PronScore, completeness: pa(best).CompletenessScore };
  const words = (best.Words || []).filter(function (w) { return pa(w).ErrorType !== 'Insertion'; });
  const w = words[0];
  if (w) {
    out.word = {
      w: w.Word,
      accuracy: pa(w).AccuracyScore,
      error: pa(w).ErrorType || 'None',
      phonemes: (w.Phonemes || []).map(function (ph) {
        const p = pa(ph);
        return {
          p: ph.Phoneme,
          score: p.AccuracyScore,
          best: (p.NBestPhonemes || ph.NBestPhonemes || []).slice(0, 3).map(function (n) { return { p: n.Phoneme, score: n.Score }; })
        };
      })
    };
  }
  return out;
}

// Word-by-word result for a sentence read aloud.
function trimPassage(az) {
  const out = { ok: true, status: az.RecognitionStatus || 'Unknown', heard: az.DisplayText || '', words: [] };
  const best = (az.NBest || [])[0];
  if (!best) return out;
  out.heard = best.Lexical || best.Display || out.heard;
  out.score = { accuracy: pa(best).AccuracyScore, fluency: pa(best).FluencyScore, completeness: pa(best).CompletenessScore };
  out.words = (best.Words || []).filter(function (w) { return pa(w).ErrorType !== 'Insertion'; }).map(function (w) {
    return { w: w.Word, accuracy: pa(w).AccuracyScore, error: pa(w).ErrorType || 'None' };
  });
  return out;
}
function azureCall(region, key, settings, audio) {
  return fetch('https://' + region + '.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed', {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Accept': 'application/json',
      'Pronunciation-Assessment': btoa(JSON.stringify(settings))
    },
    body: audio
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    const key = env.AZURE_SPEECH_KEY, region = (env.AZURE_SPEECH_REGION || 'eastus').trim();
    if (!key) return reply({ ok: false, error: 'no-key' }, 503, origin);

    if (url.pathname === '/health') {
      // Checking the key this way is free and uses none of the audio hours.
      const r = await fetch('https://' + region + '.api.cognitive.microsoft.com/sts/v1.0/issueToken', {
        method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Length': '0' }
      });
      return reply({ ok: r.ok, region: region, status: r.status }, r.ok ? 200 : 502, origin);
    }

    if (url.pathname === '/check' && request.method === 'POST') {
      const ref = String(url.searchParams.get('ref') || '').toLowerCase();
      if (!/^[a-z]{1,12}$/.test(ref)) return reply({ ok: false, error: 'bad-word' }, 400, origin);
      const audio = await request.arrayBuffer();
      if (audio.byteLength < 1000 || audio.byteLength > MAX_BYTES) return reply({ ok: false, error: 'bad-audio' }, 400, origin);
      const settings = {
        ReferenceText: ref,
        GradingSystem: 'HundredMark',
        Granularity: 'Phoneme',
        Dimension: 'Comprehensive',
        PhonemeAlphabet: 'IPA',
        NBestPhonemeCount: 3
      };
      const az = await fetch('https://' + region + '.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed', {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Accept': 'application/json',
          'Pronunciation-Assessment': btoa(JSON.stringify(settings))
        },
        body: audio
      });
      // 429 = free hours used up or too many at once. The game falls back to Chrome.
      if (!az.ok) return reply({ ok: false, error: 'azure-' + az.status }, az.status === 429 ? 429 : 502, origin);
      return reply(trim(await az.json()), 200, origin);
    }
    if (url.pathname === '/passage' && request.method === 'POST') {
      const ref = String(url.searchParams.get('ref') || '').replace(/\s+/g, ' ').trim();
      if (!ref || ref.length > 400 || !/^[A-Za-z0-9 '.,!?;:"\-]+$/.test(ref)) return reply({ ok: false, error: 'bad-text' }, 400, origin);
      const audio = await request.arrayBuffer();
      if (audio.byteLength < 1000 || audio.byteLength > MAX_PASSAGE_BYTES) return reply({ ok: false, error: 'bad-audio' }, 400, origin);
      const az = await azureCall(region, key, {
        ReferenceText: ref,
        GradingSystem: 'HundredMark',
        Granularity: 'Word',
        Dimension: 'Comprehensive',
        EnableMiscue: true
      }, audio);
      if (!az.ok) return reply({ ok: false, error: 'azure-' + az.status }, az.status === 429 ? 429 : 502, origin);
      return reply(trimPassage(await az.json()), 200, origin);
    }
    return reply({ ok: false, error: 'not-found' }, 404, origin);
  }
};
