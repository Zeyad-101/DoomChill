/**
 * api/lookup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Vercel Serverless Function — Last.fm proxy
 *
 * Route:  GET /api/lookup?track=<name>&artist=<name>
 *         artist is optional. Handles reversed inputs and single queries.
 *
 * Returns one of:
 *   {
 *     track, artist, genre, trackTier, album, albumTier, listeners,
 *     playcount, tags, wikiSummary, duration, releaseYear, image,
 *     artistBio, artistListeners, stats, funFacts, tracklist
 *   }
 *   { error: "not_found" }
 *   { error: "api_error" }
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const LASTFM_API_KEY = process.env.LASTFM_KEY || process.env.LASTFM_API_KEY || '';
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

// ── Local Catalog Cross-Reference ─────────────────────────────────────────────
let LOCAL_SONGS = [];
try {
  const fs = require('fs');
  const path = require('path');
  const songsPath = path.join(__dirname, '..', 'data', 'songs.json');
  if (fs.existsSync(songsPath)) {
    LOCAL_SONGS = JSON.parse(fs.readFileSync(songsPath, 'utf8'));
  }
} catch (e) {}

function findLocalSong(track, artist) {
  if (!LOCAL_SONGS.length || !track) return null;
  const norm = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const tNorm = norm(track);
  const aNorm = norm(artist);
  const hasArabic = /[\u0600-\u06FF]/.test(artist || '');

  return LOCAL_SONGS.find(s => {
    const sTitleNorm = norm(s.title);
    const sArtistNorm = norm(s.artist);
    const titleMatch = sTitleNorm === tNorm || sTitleNorm.includes(tNorm) || tNorm.includes(sTitleNorm);
    if (!aNorm || hasArabic) return titleMatch;
    const artistMatch = sArtistNorm === aNorm || sArtistNorm.includes(aNorm) || aNorm.includes(sArtistNorm);
    return titleMatch && artistMatch;
  }) || null;
}

// ── Realistic Multi-Factor Tier Logic ─────────────────────────────────────────
function computeTier(playcount, localPopularity = 0, artistListeners = 0) {
  if (localPopularity >= 88 || playcount >= 10_000_000) return 'Global Hit';
  if (localPopularity >= 70 || playcount >= 1_500_000 || artistListeners >= 2_000_000) return 'Very Popular';
  if (localPopularity >= 45 || playcount >= 150_000 || artistListeners >= 400_000) return 'Well-Known';
  if (localPopularity >= 20 || playcount >= 20_000) return 'Niche Favorite';
  return 'Deep Cut';
}

function safeInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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

async function lastfmFetch(params) {
  if (!LASTFM_API_KEY) {
    const err = new Error('LASTFM_KEY is not configured');
    err.status = 500;
    throw err;
  }
  params.set('api_key', LASTFM_API_KEY);
  params.set('format', 'json');

  const url = `${LASTFM_BASE}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`Last.fm HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ── iTunes Search API ─────────────────────────────────────────────────────────
async function fetchItunesMetadata(track, artist) {
  try {
    const term = encodeURIComponent(`${artist || ''} ${track || ''}`.trim());
    let res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
    let data = res.ok ? await res.json() : null;

    // Fallback 1: Try with country=EG (Egypt storefront)
    if (!data || !data.results || data.results.length === 0) {
      res = await fetch(`https://itunes.apple.com/search?term=${term}&country=EG&entity=song&limit=1`);
      if (res.ok) data = await res.json();
    }

    // Fallback 2: Try title only with country=EG
    if (!data || !data.results || data.results.length === 0) {
      const termTitle = encodeURIComponent((track || '').trim());
      res = await fetch(`https://itunes.apple.com/search?term=${termTitle}&country=EG&entity=song&limit=1`);
      if (res.ok) data = await res.json();
    }

    if (data && data.results && data.results.length > 0) {
      const item = data.results[0];
      const art = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null;
      const year = item.releaseDate ? item.releaseDate.slice(0, 4) : null;
      return {
        image: art,
        releaseYear: year,
        audioPreview: item.previewUrl || null,
        itunesUrl: item.trackViewUrl || null,
        durationMs: item.trackTimeMillis || 0,
        collectionName: item.collectionName || null,
        primaryGenre: item.primaryGenreName || null,
        artistName: item.artistName || null,
        trackName: item.trackName || null
      };
    }
  } catch (err) {
    // Non-fatal
  }
  return { image: null, releaseYear: null, audioPreview: null, itunesUrl: null, durationMs: 0 };
}

// ── Wikipedia Artist Portrait & Bio ───────────────────────────────────────────
async function fetchWikipediaArtist(artist, fallbackQuery) {
  const rawNames = [artist, fallbackQuery].filter(Boolean);
  const names = [];
  for (const n of rawNames) {
    if (!names.includes(n)) names.push(n);
    const var1 = n.replace(/Hussein/gi, 'Hussain');
    if (!names.includes(var1)) names.push(var1);
    const var2 = n.replace(/Hussain/gi, 'Hussein');
    if (!names.includes(var2)) names.push(var2);
    const var3 = n.replace(/Fairouz/gi, 'Fairuz');
    if (!names.includes(var3)) names.push(var3);
    const var4 = n.replace(/Fairuz/gi, 'Fairouz');
    if (!names.includes(var4)) names.push(var4);
    const var5 = n.replace(/Mohamed/gi, 'Mohammed');
    if (!names.includes(var5)) names.push(var5);
  }
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const isArabic = /[\u0600-\u06FF]/.test(trimmed);
    const domains = isArabic ? ['ar', 'en'] : ['en', 'ar'];
    for (const d of domains) {
      try {
        const res = await fetch(`https://${d}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          const photo = data.thumbnail?.source || data.originalimage?.source || null;
          if (photo || data.extract) {
            return {
              artistPhoto: photo,
              artistDescription: data.description || null,
              artistExtract: data.extract ? decodeHtmlEntities(stripHtml(data.extract)) : null
            };
          }
        }
      } catch (err) {
        // Non-fatal
      }
    }
  }
  return { artistPhoto: null, artistDescription: null, artistExtract: null };
}

// ── Smart Track Resolution ───────────────────────────────────────────────────
async function resolveTrackData(trackQuery, artistQuery) {
  const tq = (trackQuery || '').trim();
  const aq = (artistQuery || '').trim();

  // 1. If both are passed, check both orientations (track, artist) and (artist, track)
  if (tq && aq) {
    const p1 = new URLSearchParams({ method: 'track.getInfo', track: tq, artist: aq, autocorrect: '1' });
    const p2 = new URLSearchParams({ method: 'track.getInfo', track: aq, artist: tq, autocorrect: '1' });

    const [res1, res2] = await Promise.all([
      lastfmFetch(p1).catch(() => null),
      lastfmFetch(p2).catch(() => null),
    ]);

    const track1 = res1 && !res1.error && res1.track ? res1.track : null;
    const track2 = res2 && !res2.error && res2.track ? res2.track : null;

    if (track1 && track2) {
      const count1 = safeInt(track1.playcount);
      const count2 = safeInt(track2.playcount);
      return count1 >= count2 ? track1 : track2;
    }
    if (track1) return track1;
    if (track2) return track2;
  }

  // 2. If single param or direct queries failed, search via track.search
  const combined = [tq, aq].filter(Boolean).join(' ').trim();
  if (combined) {
    const searchParams = new URLSearchParams({
      method: 'track.search',
      track: combined,
      limit: '5',
    });

    try {
      const searchRes = await lastfmFetch(searchParams);
      const matches = searchRes.results?.trackmatches?.track;
      if (Array.isArray(matches) && matches.length > 0) {
        const top = matches[0];
        if (top && top.name && top.artist) {
          const infoParams = new URLSearchParams({
            method: 'track.getInfo',
            track: top.name,
            artist: top.artist,
            autocorrect: '1',
          });
          const infoRes = await lastfmFetch(infoParams).catch(() => null);
          if (infoRes && !infoRes.error && infoRes.track) {
            return infoRes.track;
          }
        }
      }
    } catch (searchErr) {
      console.warn('[lookup] track.search failed:', searchErr.message);
    }
  }

  return null;
}

function fmtNum(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
}

// ── In-Memory IP Rate Limiter (Ponytail minimal implementation) ─────────────
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40; // max requests per minute per IP
const ipRequests = global.__DOOMCHILL_RATE_LIMIT = global.__DOOMCHILL_RATE_LIMIT || new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.startTime > RATE_LIMIT_WINDOW_MS) ipRequests.delete(ip);
  }
}, 5 * 60 * 1000).unref();

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  // Rate Limiting by IP
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
  const now = Date.now();
  const clientData = ipRequests.get(clientIp);
  if (!clientData || now - clientData.startTime > RATE_LIMIT_WINDOW_MS) {
    ipRequests.set(clientIp, { startTime: now, count: 1 });
  } else {
    clientData.count++;
    if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Please wait a moment.' });
    }
  }

  const { track, artist } = req.query || {};
  const cleanTrack = String(track || '').trim().slice(0, 200);
  const cleanArtist = String(artist || '').trim().slice(0, 200);

  if (!cleanTrack) {
    return res.status(400).json({ error: 'missing_track_param' });
  }

  try {
    const trackData = await resolveTrackData(cleanTrack, cleanArtist);
    if (!trackData) {
      return res.status(200).json({ error: 'not_found' });
    }

    const trackName = trackData.name;
    const artistName = (typeof trackData.artist === 'object' ? trackData.artist?.name : trackData.artist) || '';
    const albumTitle = trackData.album?.title || null;

    const playcount = safeInt(trackData.playcount);
    const listeners = safeInt(trackData.listeners);

    // Tags
    const rawTagValue = trackData.toptags?.tag ?? [];
    const rawTags = Array.isArray(rawTagValue) ? rawTagValue : [rawTagValue];
    const tags = rawTags
      .map(t => (typeof t === 'object' && t !== null ? t.name : t))
      .filter(Boolean)
      .slice(0, 5);

    const SOCIAL_TAGS = new Set([
      'seen live', 'favorites', 'love', 'awesome', 'chill', 'beautiful',
      'favourite', 'good', 'great', 'amazing', 'best', 'all time favorites',
    ]);
    const genre = tags.find(t => !SOCIAL_TAGS.has(t.toLowerCase())) || tags[0] || 'Music';

    // Duration
    const durationMs = safeInt(trackData.duration);
    const duration = durationMs > 0
      ? `${Math.floor(durationMs / 60000)}:${String(Math.floor((durationMs % 60000) / 1000)).padStart(2, '0')}`
      : '3:30';

    // Wiki summary
    const rawWiki = trackData.wiki?.summary || trackData.wiki?.content || '';
    let wikiSummary = decodeHtmlEntities(
      stripHtml(rawWiki)
        .replace(/\s*Read more on Last\.fm\s*\.?\s*$/i, '')
        .trim()
    );

    // Parallel fetch: Album info, Artist info, Top tracks, iTunes metadata, Wikipedia artist info
    const extraFetches = [
      albumTitle
        ? lastfmFetch(new URLSearchParams({ method: 'album.getInfo', album: albumTitle, artist: artistName, autocorrect: '1' })).catch(() => null)
        : Promise.resolve(null),
      artistName
        ? lastfmFetch(new URLSearchParams({ method: 'artist.getInfo', artist: artistName, autocorrect: '1' })).catch(() => null)
        : Promise.resolve(null),
      artistName
        ? lastfmFetch(new URLSearchParams({ method: 'artist.getTopTracks', artist: artistName, limit: '5', autocorrect: '1' })).catch(() => null)
        : Promise.resolve(null),
      fetchItunesMetadata(trackName, artistName),
      fetchWikipediaArtist(artistName, artist),
    ];

    const [albumRes, artistRes, topTracksRes, itunesData, wikiData] = await Promise.all(extraFetches);

    let albumTier = null;
    let albumName = albumTitle;
    let tracklist = [];
    let releaseYear = itunesData ? itunesData.releaseYear : null;

    if (albumRes && !albumRes.error && albumRes.album) {
      const alb = albumRes.album;
      albumName = alb.name || albumName;
      albumTier = computeTier(safeInt(alb.playcount));
      if (alb.tracks && alb.tracks.track) {
        const rawList = Array.isArray(alb.tracks.track) ? alb.tracks.track : [alb.tracks.track];
        tracklist = rawList.slice(0, 5).map(t => t.name).filter(Boolean);
      }
      if (!releaseYear && alb.wiki?.published) {
        const yearMatch = alb.wiki.published.match(/\b(19\d\d|20\d\d)\b/);
        if (yearMatch) releaseYear = yearMatch[1];
      }
    }

    // Fallback tracklist from artist's top tracks
    if (tracklist.length === 0 && topTracksRes && topTracksRes.toptracks?.track) {
      const rawList = Array.isArray(topTracksRes.toptracks.track) ? topTracksRes.toptracks.track : [topTracksRes.toptracks.track];
      tracklist = rawList.slice(0, 5).map(t => t.name).filter(Boolean);
    }
    if (tracklist.length === 0) {
      tracklist = [trackName];
    }

    // Artist info & bio
    let artistBio = wikiData?.artistExtract || null;
    let artistListeners = 0;
    if (artistRes && !artistRes.error && artistRes.artist) {
      const art = artistRes.artist;
      artistListeners = safeInt(art.stats?.listeners);
      if (!artistBio && art.bio?.summary) {
        artistBio = decodeHtmlEntities(
          stripHtml(art.bio.summary)
            .replace(/\s*Read more on Last\.fm\s*\.?\s*$/i, '')
            .trim()
        );
      }
    }
    if (!artistBio && wikiData?.artistDescription) {
      artistBio = `${artistName} is an acclaimed ${wikiData.artistDescription}.`;
    }

    // Cross-reference with local dataset for tier & metrics accuracy
    const localMatch = findLocalSong(trackName, artistName) || findLocalSong(cleanTrack, cleanArtist);
    const localPop = localMatch ? localMatch.popularity : 0;
    const trackTier = computeTier(playcount, localPop, artistListeners);

    // Cover image: iTunes high-res or Last.fm
    let image = itunesData ? itunesData.image : null;
    if (!image) {
      const albumImages = albumRes?.album?.image || trackData.album?.image;
      if (Array.isArray(albumImages) && albumImages.length > 0) {
        const pref = albumImages.find(img => img.size === 'extralarge') ||
                     albumImages.find(img => img.size === 'large') ||
                     albumImages[albumImages.length - 1];
        if (pref && pref['#text'] && pref['#text'].startsWith('http')) {
          image = pref['#text'];
        }
      }
    }

    // Artist portrait photograph
    const artistPhoto = wikiData?.artistPhoto || null;

    // Audio preview
    const audioPreview = itunesData?.audioPreview || null;
    const itunesUrl = itunesData?.itunesUrl || null;

    if (!releaseYear) releaseYear = 'Recent';
    if (!albumName && itunesData?.collectionName) albumName = itunesData.collectionName;

    // 3 Stat Gauges (Percentage values 0 - 100)
    const basePopPct = localPop > 0 ? localPop : Math.round((Math.log10(Math.max(playcount, 10)) / 7.2) * 100);
    const popularityPct = Math.max(25, Math.min(99, basePopPct));
    const listenersPct = Math.max(20, Math.min(98, Math.round((Math.log10(Math.max(listeners, 10)) / 6.8) * 100)));
    const playcountPct = Math.max(25, Math.min(99, Math.round(
      listeners > 0 ? Math.min(98, Math.max(30, (playcount / listeners) * 5.2)) : 65
    )));

    // Rich structured fun facts
    const funFacts = [
      `Streaming Impact: Amassed over ${fmtNum(playcount)} global scrobbles and ${fmtNum(listeners)} listeners, achieving ${trackTier} status on Last.fm.`,
      `Sonic Identity: Anchored in ${genre} with signature ${tags.slice(0, 3).join(', ') || 'melodic'} elements and a refined atmosphere.`,
      wikiSummary
        ? wikiSummary.slice(0, 220) + (wikiSummary.length > 220 ? '…' : '')
        : (artistBio
            ? artistBio.slice(0, 220) + (artistBio.length > 220 ? '…' : '')
            : `Cultural Legacy: A standout production in ${artistName}'s discography${albumName ? ` as part of '${albumName}'` : ''}.`),
    ];

    if (!wikiSummary) {
      wikiSummary = funFacts[0] + ' ' + funFacts[1];
    }

    const result = {
      track: trackName,
      artist: artistName,
      genre,
      trackTier,
      album: albumName,
      albumTier: albumTier || trackTier,
      listeners,
      playcount,
      releaseYear,
      duration,
      image,
      artistPhoto,
      audioPreview,
      itunesUrl,
      artistBio,
      artistListeners,
      stats: {
        popularityPct,
        listenersPct,
        playcountPct,
      },
      funFacts,
      tracklist,
      tags,
      wikiSummary,
    };

    return res.status(200).json(result);

  } catch (err) {
    console.error('[lookup] Unexpected error:', err.message);
    return res.status(200).json({ error: 'api_error' });
  }
};
