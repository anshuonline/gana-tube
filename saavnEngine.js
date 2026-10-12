// ─── JioSaavn Streaming Engine (unofficial) ──────────────────────────────────
// ytmusic-api remains the source for all search/metadata/discovery. This engine
// is ONLY used to resolve a playable stream URL for the currently selected song:
//   1. Search JioSaavn's internal API for the song (title + artist)
//   2. Score candidates (title similarity, artist overlap, duration closeness)
//   3. Decrypt `encrypted_media_url` (DES-ECB, key `38346591`) into a direct
//      aac.saavncdn.com stream URL at the requested bitrate
// The client then plays it via a plain HTML5 <audio> element (real background
// playback + MediaSession lock-screen controls), falling back to the YouTube
// IFrame engine whenever no confident match is found.

const CryptoJS = require('crypto-js');

const SAAVN_API = 'https://www.jiosaavn.com/api.php';
// JioSaavn encrypts media URLs with DES-ECB using this well-known static key.
// Node's OpenSSL 3 blocks native DES, so the pure-JS crypto-js DES is used.
const DES_KEY = CryptoJS.enc.Utf8.parse('38346591');

const SAAVN_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-IN,en;q=0.9'
};

const VALID_BITRATES = new Set([320, 160, 96]);

// ─── Text helpers ────────────────────────────────────────────────────────────

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/"/g, '"')
    .replace(/&/g, '&')
    .replace(/&#039;|'/g, "'")
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

// Normalize for fuzzy comparison: strip "(From ...)" style suffixes, remix/lofi
// qualifiers inside parens, punctuation and extra whitespace.
function normalizeText(str) {
  if (!str) return '';
  return decodeEntities(String(str))
    .toLowerCase()
    .replace(/\((from|feat|ft\.?|with|lyrical|video|audio|official|slowed|reverb|sped|nightcore|lofi|lo-fi|remix)[^)]*\)/g, ' ')
    .replace(/\[(from|feat|ft\.?|lyrical|video|audio|official|slowed|reverb|sped|nightcore|lofi|lo-fi|remix)[^\]]*\]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  return normalizeText(str).split(' ').filter(Boolean);
}

// Dice coefficient over character bigrams — robust for song-title fuzziness
function diceCoefficient(a, b) {
  const s1 = normalizeText(a);
  const s2 = normalizeText(b);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0;

  const bigrams1 = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.slice(i, i + 2);
    bigrams1.set(bg, (bigrams1.get(bg) || 0) + 1);
  }
  let hits = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.slice(i, i + 2);
    const count = bigrams1.get(bg) || 0;
    if (count > 0) {
      bigrams1.set(bg, count - 1);
      hits += 1;
    }
  }
  return (2 * hits) / (s1.length - 1 + s2.length - 1);
}

// Artist overlap: split "Arijit Singh, Pritam" style lists and compare tokens
function artistOverlapScore(targetArtists, candidateArtists) {
  const tTokens = new Set();
  String(targetArtists || '').split(/,|&|\bfeat\.?\b|\bft\.?\b/i).forEach(part => {
    tokenize(part).forEach(tok => tTokens.add(tok));
  });
  const cTokens = new Set();
  String(candidateArtists || '').split(/,|&|\bfeat\.?\b|\bft\.?\b/i).forEach(part => {
    tokenize(part).forEach(tok => cTokens.add(tok));
  });
  if (tTokens.size === 0 || cTokens.size === 0) return 0.5; // unknown — neutral
  let matched = 0;
  cTokens.forEach(tok => { if (tTokens.has(tok)) matched += 1; });
  const denom = Math.min(tTokens.size, cTokens.size, 4);
  return denom > 0 ? Math.min(1, matched / denom) : 0;
}

// Full artist-name match: multiple artists me se EK bhi artist poora match
// ho jaye to confirm — "Arijit Singh, Pritam" vs "Pritam, Badshah" passes,
// "Anuv Jain" vs "Rahul Sharma" fails (wrong recording, YouTube fallback)
function artistNamesMatchAny(targetArtists, candidateArtists) {
  const splitNames = (s) => String(s || '')
    .split(/,|&|\bfeat\.?\b|\bft\.?\b/i)
    .map(part => normalizeText(part))
    .filter(Boolean);
  const tNames = splitNames(targetArtists);
  const cNames = splitNames(candidateArtists);
  for (const t of tNames) {
    for (const c of cNames) {
      if (t === c) return true;
      // "Sanam Puri" vs "Sanam" — chhota naam bade ke andar poora aa jaye
      if (t.length >= 4 && c.length >= 4 && (t.includes(c) || c.includes(t))) return true;
    }
  }
  return false;
}

function durationClosenessScore(targetDuration, candidateDuration) {
  const t = parseInt(targetDuration, 10) || 0;
  const c = parseInt(candidateDuration, 10) || 0;
  if (t <= 0 || c <= 0) return 0.5; // unknown — neutral
  const diff = Math.abs(t - c);
  if (diff <= 3) return 1;
  if (diff >= 15) return 0;
  return 1 - (diff - 3) / 12;
}

// ─── Stream URL decryption ───────────────────────────────────────────────────

function decryptMediaUrl(encrypted) {
  if (!encrypted) return null;
  const input = String(encrypted);
  if (!input) return null;

  const attempts = [
    { padding: CryptoJS.pad.NoPadding },   // manual PKCS5 strip below
    { padding: CryptoJS.pad.Pkcs7 }        // library-managed padding
  ];

  for (const { padding } of attempts) {
    try {
      const decrypted = CryptoJS.DES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(input) },
        DES_KEY,
        { mode: CryptoJS.mode.ECB, padding }
      );
      let url = decrypted.toString(CryptoJS.enc.Utf8);
      if (padding === CryptoJS.pad.NoPadding) {
        url = url.replace(/[\x01-\x08\x00]+$/g, '');
      }
      url = url.trim();
      if (/^https?:\/\//i.test(url)) return url;
    } catch (e) {
      // try next padding strategy
    }
  }
  return null;
}

// Upgrade decrypted _96.mp4 (or legacy mp3) URL to the requested bitrate
function bitrateUrl(url, bitrate) {
  if (!url) return null;
  if (/_\d+\.mp4$/i.test(url)) {
    return url.replace(/_\d+\.mp4$/i, `_${bitrate}.mp4`);
  }
  return url; // legacy direct mp3 — no bitrate suffix
}

async function isReachable(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, headers: SAAVN_HEADERS });
    clearTimeout(timer);
    if (res.ok) return true;
    // Some CDNs reject HEAD — retry with a ranged GET
    if (res.status === 405) {
      const res2 = await fetch(url, { headers: { ...SAAVN_HEADERS, Range: 'bytes=0-1' } });
      try { res2.body?.cancel(); } catch (e) {}
      return res2.ok;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Resolve the best playable URL at the requested bitrate (falls back gracefully)
async function resolveStreamUrl(encryptedUrl, requestedBitrate) {
  const base = decryptMediaUrl(encryptedUrl);
  if (!base) return null;
  const bitrate = VALID_BITRATES.has(requestedBitrate) ? requestedBitrate : 320;

  if (/_\d+\.mp4$/i.test(base)) {
    const order = bitrate === 320 ? [320, 160, 96] : bitrate === 160 ? [160, 320, 96] : [96, 160, 320];
    // Sab bitrate probes PARALLEL — sequential me 3 x 4s timeout worst case
    // ~12s lagta tha; ab max ~4s, typical ~300ms. Preference order me
    // pehla reachable chunta hai.
    const probes = await Promise.all(
      order.map(async (b) => ({ b, ok: await isReachable(bitrateUrl(base, b)) }))
    );
    for (const { b, ok } of probes) {
      if (ok) return bitrateUrl(base, b);
    }
    return base; // last resort: original decrypted URL
  }
  return base;
}

// ─── JioSaavn internal API access ────────────────────────────────────────────

async function saavnApiJson(params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([k]) => k !== '__call')
  ).toString();
  const url = `${SAAVN_API}?__call=${encodeURIComponent(params.__call)}&${qs}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { headers: SAAVN_HEADERS, signal: controller.signal });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return json;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Normalize either the legacy (more_info.primary_artists string) or v4
// (subtitle HTML / artistMap) response shapes into one song object
function normalizeSaavnSong(raw) {
  if (!raw) return null;
  const info = raw.more_info || raw;
  const title = decodeEntities(
    (raw.title || info.title || '').replace(/\s*\(from[^)]*\)/gi, '').trim()
  ) || 'Unknown Title';

  let artists = '';
  const map = info.artistMap;
  if (map?.primary_artists?.length) {
    artists = map.primary_artists.map(a => a?.name).filter(Boolean).join(', ');
  } else if (info.primary_artists) {
    artists = decodeEntities(String(info.primary_artists));
  } else if (raw.subtitle) {
    artists = decodeEntities(String(raw.subtitle).replace(/<[^>]*>/g, '')).trim();
  } else if (info.singers) {
    artists = decodeEntities(String(info.singers));
  }

  const image = String(info.image || raw.image || '')
    .replace('150x150', '500x500')
    .replace('50x50', '500x500');

  return {
    id: info.id || raw.id || '',
    title,
    artist: artists || 'Unknown Artist',
    album: decodeEntities(info.album || raw.album || info.album_name || '') || '',
    duration: parseInt(info.duration, 10) || 0,
    image,
    language: info.language || raw.language || '',
    encryptedUrl: info.encrypted_media_url || info.encryptedUrl || null,
    permaUrl: info.perma_url || raw.url || ''
  };
}

async function searchSaavnSongs(query, limit = 20) {
  const q = String(query || '').trim().slice(0, 120);
  if (!q) return [];

  const json = await saavnApiJson({
    __call: 'search.getResults',
    q,
    p: '1',
    n: String(Math.min(Math.max(parseInt(limit, 10) || 20, 1), 30))
  });
  if (!json) return [];

  const results = json?.data?.results || json?.results || [];
  if (!Array.isArray(results)) return [];

  return results.map(normalizeSaavnSong).filter(s => s && s.title && s.encryptedUrl);
}

// Find the best JioSaavn counterpart for a YouTube Music song
async function matchSaavnSong({ title, artist, album, duration, bitrate }) {
  const cleanTitle = String(title || '').trim().slice(0, 120);
  if (!cleanTitle) return null;

  const artistStr = String(artist || '').trim().slice(0, 120);
  const albumStr = String(album || '').trim().slice(0, 120);

  // Search variants: normalised title (strips "(From ...)", "(Lyrical)",
  // "(Official Video)" etc. — JioSaavn's search chokes on raw YouTube
  // suffixes) + artist / album, then the bare title for broad coverage.
  const baseQuery = normalizeText(cleanTitle) || cleanTitle.toLowerCase();
  const queries = [];
  if (artistStr) queries.push(`${baseQuery} ${artistStr.split(',')[0].trim()}`);
  if (albumStr && albumStr.toLowerCase() !== 'single') queries.push(`${baseQuery} ${albumStr}`);
  queries.push(baseQuery);

  // Fire all query variants in parallel — Saavn must answer fast enough to
  // win the client's resolution race so the background-playable Saavn
  // stream is preferred over the YouTube IFrame engine.
  const seenIds = new Set();
  const candidates = [];
  const foundLists = await Promise.all(
    queries.map(q => searchSaavnSongs(q, 20).catch(() => []))
  );
  for (const found of foundLists) {
    for (const song of found) {
      if (song.id && !seenIds.has(song.id)) {
        seenIds.add(song.id);
        candidates.push(song);
      }
    }
  }
  if (candidates.length === 0) return null;

  let best = null;
  let bestScore = 0;
  const artistRequested = artistStr.length > 0;
  for (const cand of candidates) {
    // Anti-spam: reject jukeboxes/non-stop mixes and tiny snippets — a
    // matching title on a 15-minute mix is still the wrong recording
    if (cand.duration > 720 || (cand.duration > 0 && cand.duration < 45)) continue;
    const titleScore = diceCoefficient(cleanTitle, cand.title);
    const artistScore = artistOverlapScore(artistStr, cand.artist);
    const durScore = durationClosenessScore(duration, cand.duration);
    const score = titleScore * 0.55 + artistScore * 0.25 + durScore * 0.20;

    // Artist verification: gana + artist dono match hone chahiye. Multiple
    // artists me se EK bhi poora artist match => confirmed; koi nahi =>
    // reject (wrong recording — client exact YouTube videoId play karega).
    // Title+duration alone is NOT enough — same-title songs by other artists
    // with near-identical durations exist (Atif Aslam vs Bengali same-name).
    const candArtist = String(cand.artist || '').trim();
    const candArtistKnown = candArtist.length > 0 && candArtist.toLowerCase() !== 'unknown artist';
    const artistConfirmed = !artistRequested || !candArtistKnown ||
      artistNamesMatchAny(artistStr, cand.artist) || artistScore >= 0.5;

    // Confidence gates: title must always be close; duration seals the deal
    const durKnown = (parseInt(duration, 10) || 0) > 0 && cand.duration > 0;
    const passes =
      (titleScore >= 0.92 && artistConfirmed && score >= 0.6) ||
      (titleScore >= 0.6 && durKnown && durScore >= 0.75 && score >= 0.68 && artistConfirmed) ||
      (titleScore >= 0.6 && !durKnown && artistScore >= 0.6 && score >= 0.65);

    if (passes && score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  if (!best) return null;

  const streamUrl = await resolveStreamUrl(best.encryptedUrl, bitrate);
  if (!streamUrl) return null;

  return {
    id: best.id,
    title: best.title,
    artist: best.artist,
    album: best.album,
    duration: best.duration,
    image: best.image,
    streamUrl,
    matchedScore: Math.round(bestScore * 100) / 100
  };
}

module.exports = { searchSaavnSongs, matchSaavnSong };
