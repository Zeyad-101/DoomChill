/**
 * api/lookup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Vercel Serverless Function — Last.fm proxy
 *
 * Route:  GET /api/lookup?track=<name>&artist=<name>
 *         artist is optional but improves accuracy.
 *
 * ⚠️  WARNING: API key is embedded in this file.
 *     Do NOT push this repo to a public repository.
 *
 * Returns one of:
 *   { track, artist, genre, trackTier, album, albumTier, listeners,
 *     playcount, tags, wikiSummary, duration }
 *   { error: "not_found" }
 *   { error: "api_error" }
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

// ⚠️  API key — keep this repo private.
const LASTFM_API_KEY = 'e68090c84b7747c81aaf9c6f5a7ca99d';

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

// ── Tier logic ────────────────────────────────────────────────────────────────
/**
 * computeTier
 * @param {number} playcount
 * @returns {string}
 */
function computeTier(playcount) {
  if (playcount >= 50_000_000) return 'Global Hit';
  if (playcount >= 5_000_000)  return 'Very Popular';
  if (playcount >= 500_000)    return 'Well-Known';
  if (playcount >= 50_000)     return 'Niche Favorite';
  return 'Deep Cut';
}

// ── Last.fm helpers ───────────────────────────────────────────────────────────
/**
 * lastfmFetch
 * Calls the Last.fm API and returns parsed JSON.
 * Throws on network errors or non-200 HTTP status.
 * @param {URLSearchParams} params
 * @returns {Promise<Object>}
 */
async function lastfmFetch(params) {
  params.set('api_key', LASTFM_API_KEY);
  params.set('format', 'json');

  const url = `${LASTFM_BASE}?${params.toString()}`;
  const res  = await fetch(url);

  if (!res.ok) {
    const err = new Error(`Last.fm HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * safeInt
 * Coerces a value to an integer; returns 0 on failure.
 * @param {any} val
 * @returns {number}
 */
function safeInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * stripHtml
 * Removes HTML tags from Last.fm wiki text.
 * Does NOT decode entities — call decodeHtmlEntities() after.
 * @param {string} str
 * @returns {string}
 */
function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')  // remove HTML tags
    .replace(/\s{2,}/g, ' ')   // collapse whitespace
    .trim();
}

/**
 * decodeHtmlEntities
 * Decodes common HTML entities that Last.fm includes in wiki text.
 * @param {string} str
 * @returns {string}
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/**
 * getTrackInfo
 * Calls track.getInfo on Last.fm.
 * @param {string} track
 * @param {string} [artist]
 * @returns {Promise<Object>} raw Last.fm response
 */
async function getTrackInfo(track, artist) {
  const params = new URLSearchParams({ method: 'track.getInfo', track });
  if (artist) params.set('artist', artist);
  return lastfmFetch(params);
}

/**
 * getAlbumInfo
 * Calls album.getInfo on Last.fm.
 * @param {string} album
 * @param {string} artist
 * @returns {Promise<Object>} raw Last.fm response
 */
async function getAlbumInfo(album, artist) {
  const params = new URLSearchParams({ method: 'album.getInfo', album, artist });
  return lastfmFetch(params);
}

// ── Response builder ──────────────────────────────────────────────────────────
/**
 * buildResult
 * Merges track + optional album data into a clean flat response object.
 * @param {Object} trackData   - Last.fm track object
 * @param {Object|null} albumData - Last.fm album object (may be null)
 * @returns {Object}
 */
function buildResult(trackData, albumData) {
  const playcount  = safeInt(trackData.playcount);
  const listeners  = safeInt(trackData.listeners);
  const trackTier  = computeTier(playcount);

  // Tags ─────────────────────────────────────────────────────────────────────
  // BUG FIX: Last.fm returns toptags.tag as a plain OBJECT (not array) when
  // there is exactly 1 tag — e.g. { name: "rock", url: "..." }.
  // Calling .map() on a plain object throws TypeError and crashes the function.
  // Fix: always normalise to an array first.
  const rawTagValue = trackData.toptags?.tag ?? [];
  const rawTags = Array.isArray(rawTagValue) ? rawTagValue : [rawTagValue];
  const tags = rawTags
    .map(t => (typeof t === 'object' && t !== null ? t.name : t))
    .filter(Boolean)
    .slice(0, 5);

  // Duration ─────────────────────────────────────────────────────────────────
  // Last.fm returns duration in milliseconds as a string (e.g. "214160").
  const durationMs = safeInt(trackData.duration);
  const duration   = durationMs > 0
    ? `${Math.floor(durationMs / 60000)}:${String(Math.floor((durationMs % 60000) / 1000)).padStart(2, '0')}`
    : null;

  // Wiki summary ──────────────────────────────────────────────────────────────
  // BUG FIX: Last.fm wiki.summary ends with an HTML anchor:
  //   "... <a href="https://www.last.fm/...">Read more on Last.fm</a>."
  // After stripHtml() this becomes plain text "... Read more on Last.fm ."
  // Strip it so the visuals team gets clean prose.
  //
  // BUG FIX 2: Last.fm encodes HTML entities (&amp; &quot; &#39; etc.) in wiki
  // text. Decode them so the visuals team gets readable text.
  const rawWiki = trackData.wiki?.summary ?? trackData.wiki?.content ?? '';
  const wikiSummary = decodeHtmlEntities(
    stripHtml(rawWiki)
      .replace(/\s*Read more on Last\.fm\s*\.?\s*$/i, '')
      .trim()
  );

  // Genre ─────────────────────────────────────────────────────────────────────
  // Last.fm has no single "genre" field — use first tag that isn't a generic
  // social/mood label as a genre proxy.
  const SOCIAL_TAGS = new Set([
    'seen live', 'favorites', 'love', 'awesome', 'chill', 'beautiful',
    'favourite', 'good', 'great', 'amazing', 'best', 'all time favorites',
  ]);
  const genre = tags.find(t => !SOCIAL_TAGS.has(t.toLowerCase())) ?? tags[0] ?? null;

  const result = {
    track:       trackData.name,
    artist:      (typeof trackData.artist === 'object' ? trackData.artist?.name : trackData.artist) ?? null,
    genre,
    trackTier,
    album:        null,
    albumTier:    null,
    listeners,
    playcount,
    tags,
    wikiSummary:  wikiSummary || null,
    duration,
  };

  // Merge album data if present
  if (albumData) {
    const albumPlaycount = safeInt(albumData.playcount);
    result.album     = albumData.name ?? null;
    result.albumTier = computeTier(albumPlaycount);
  }

  return result;
}

// ── Handler ───────────────────────────────────────────────────────────────────
/**
 * handler
 * Vercel serverless function entry point.
 * @param {import('@vercel/node').VercelRequest}  req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = async function handler(req, res) {
  // CORS — allow any origin so local dev works without a proxy configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Pre-flight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only GET allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }


  // Parse query params
  const { track, artist } = req.query;

  if (!track || !track.trim()) {
    return res.status(400).json({ error: 'missing_track_param' });
  }

  try {
    // ── Step 1: Track info ───────────────────────────────────────────────────
    const trackResponse = await getTrackInfo(track.trim(), artist?.trim());

    // Last.fm signals "not found" with error code 6.
    // The JSON response returns it as a number (6), but guard against "6" string too.
    if (trackResponse.error === 6 || trackResponse.error === '6') {
      return res.status(200).json({ error: 'not_found' });
    }

    if (!trackResponse.track) {
      return res.status(200).json({ error: 'not_found' });
    }

    const trackData = trackResponse.track;

    // ── Step 2: Album info (if track belongs to an album) ───────────────────
    let albumData = null;
    const albumTitle  = trackData.album?.title;
    const albumArtist = typeof trackData.artist === 'object'
      ? trackData.artist.name
      : trackData.artist;

    if (albumTitle && albumArtist) {
      try {
        const albumResponse = await getAlbumInfo(albumTitle, albumArtist);
        // albumResponse.error == null means no error field present (success path).
        // Using == null (not ===) catches both null and undefined.
        if (albumResponse.error == null && albumResponse.album) {
          albumData = albumResponse.album;
        }
      } catch (albumErr) {
        // Album fetch failure is non-fatal — log and continue
        console.warn('[lookup] Album fetch failed:', albumErr.message);
      }
    }

    // ── Step 3: Build and return clean result ────────────────────────────────
    const result = buildResult(trackData, albumData);
    return res.status(200).json(result);

  } catch (err) {
    console.error('[lookup] Unexpected error:', err.message);
    return res.status(200).json({ error: 'api_error' });
  }
};
