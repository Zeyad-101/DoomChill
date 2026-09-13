/**
 * build-dataset.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time Node.js script: CSV → data/songs.json
 *
 * Usage:
 *   npm run build-data
 *   # or directly:
 *   node scripts/build-dataset.js
 *
 * Prerequisites:
 *   1. npm install   (installs csv-parse)
 *   2. Place the Kaggle "114000 Spotify Songs" CSV at:
 *      scripts/raw-data/dataset.csv
 *      Download: https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset
 *
 * Output:
 *   data/songs.json  — array of clean song objects
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// ── Paths ────────────────────────────────────────────────────────────────────
const CSV_PATH    = path.resolve(__dirname, 'raw-data', 'dataset.csv');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'data', 'songs.json');

// ── Config ───────────────────────────────────────────────────────────────────
const CAP_PER_GENRE    = 120;   // max songs kept per umbrella genre
const SPOT_CHECK_COUNT = 30;    // random entries printed for sanity-check

// Maps every one of the 114 exact track_genre values in the Kaggle Spotify dataset
// to one of the 12 umbrella genres. Built from the real dataset's genre list —
// not a generic taxonomy — so nothing falls through to 'Other' unnecessarily.
const GENRE_MAP = {
  // Pop
  'pop':              'Pop',
  'k-pop':            'Pop',
  'j-pop':            'Pop',
  'j-idol':           'Pop',
  'cantopop':         'Pop',
  'mandopop':         'Pop',
  'latin':            'Pop',
  'latino':           'Pop',
  'power-pop':        'Pop',
  'indie-pop':        'Pop',
  'pop-film':         'Pop',
  'anime':            'Pop',
  'disney':           'Pop',
  'happy':            'Pop',
  'summer':           'Pop',
  'party':            'Pop',
  'reggaeton':        'Pop',

  // Rock
  'rock':             'Rock',
  'alt-rock':         'Rock',
  'alternative':      'Rock',     // 'alternative' → Rock (was duplicated; Rock wins as primary mapping)
  'hard-rock':        'Rock',     // fixed: was 'hard rock' (space) → never matched
  'punk':             'Rock',
  'punk-rock':        'Rock',
  'emo':              'Rock',
  'grunge':           'Rock',
  'psych-rock':       'Rock',
  'rockabilly':       'Rock',
  'rock-n-roll':      'Rock',
  'singer-songwriter':'Rock',
  'british':          'Rock',
  'j-rock':           'Rock',
  'guitar':           'Rock',
  'ska':              'Rock',

  // Hip-Hop/Rap
  'hip-hop':          'Hip-Hop/Rap',
  'underground':      'Hip-Hop/Rap',

  // Electronic/Dance
  'electronic':       'Electronic/Dance',
  'edm':              'Electronic/Dance',
  'dance':            'Electronic/Dance',
  'house':            'Electronic/Dance',
  'deep-house':       'Electronic/Dance',
  'chicago-house':    'Electronic/Dance',
  'detroit-techno':   'Electronic/Dance',
  'techno':           'Electronic/Dance',
  'trance':           'Electronic/Dance',
  'dubstep':          'Electronic/Dance',
  'drum-and-bass':    'Electronic/Dance',
  'disco':            'Electronic/Dance',
  'funk':             'Electronic/Dance',
  'breakbeat':        'Electronic/Dance',
  'electro':          'Electronic/Dance',
  'minimal-techno':   'Electronic/Dance',
  'club':             'Electronic/Dance',
  'progressive-house':'Electronic/Dance',
  'hardstyle':        'Electronic/Dance',
  'hardcore':         'Electronic/Dance',
  'garage':           'Electronic/Dance',
  'dub':              'Electronic/Dance',
  'idm':              'Electronic/Dance',
  'j-dance':          'Electronic/Dance',
  'trip-hop':         'Electronic/Dance',

  // R&B/Soul
  'r-n-b':            'R&B/Soul',
  'soul':             'R&B/Soul',
  'gospel':           'R&B/Soul',
  'blues':            'R&B/Soul',
  'afrobeat':         'R&B/Soul',
  'groove':           'R&B/Soul',

  // Indie/Alternative
  'indie':            'Indie/Alternative',
  'goth':             'Indie/Alternative',
  'songwriter':       'Indie/Alternative',

  // Metal
  'metal':            'Metal',
  'heavy-metal':      'Metal',
  'death-metal':      'Metal',
  'black-metal':      'Metal',
  'metalcore':        'Metal',
  'grindcore':        'Metal',
  'metal-misc':       'Metal',

  // Jazz
  'jazz':             'Jazz',
  'bossanova':        'Jazz',
  'tango':            'Jazz',

  // Classical
  'classical':        'Classical',
  'opera':            'Classical',
  'piano':            'Classical',

  // Lo-fi/Ambient
  'ambient':          'Lo-fi/Ambient',
  'sleep':            'Lo-fi/Ambient',
  'study':            'Lo-fi/Ambient',
  'chill':            'Lo-fi/Ambient',
  'new-age':          'Lo-fi/Ambient',
  'acoustic':         'Lo-fi/Ambient',
  'rainy-day':        'Lo-fi/Ambient',
  'romance':          'Lo-fi/Ambient',
  'sad':              'Lo-fi/Ambient',

  // Country/Folk
  'country':          'Country/Folk',
  'folk':             'Country/Folk',
  'honky-tonk':       'Country/Folk',
  'sertanejo':        'Country/Folk',

  // Other — cultural/regional/novelty genres with no clean umbrella fit
  'brazil':           'Other',
  'children':         'Other',
  'comedy':           'Other',
  'forro':            'Other',
  'french':           'Other',
  'german':           'Other',
  'indian':           'Other',
  'iranian':          'Other',
  'kids':             'Other',
  'malay':            'Other',
  'movies':           'Other',
  'mpb':              'Other',
  'new-release':      'Other',
  'pagode':           'Other',
  'philippines-opm':  'Other',
  'reggae':           'Other',
  'salsa':            'Other',
  'samba':            'Other',
  'show-tunes':       'Other',
  'soundtracks':      'Other',
  'spanish':          'Other',
  'swedish':          'Other',
  'turkish':          'Other',
  'world-music':      'Other',
};

/**
 * tagAtmosphere
 * Exactly as specified in the brief — no changes.
 * @param {Object} row - parsed CSV row with numeric audio features
 * @returns {string[]} atmosphere tags
 */
function tagAtmosphere(row) {
  const tags = [];
  if (row.valence >= 0.6 && row.energy >= 0.5)                                                tags.push('Happy / Upbeat');
  if (row.energy <= 0.45 && row.valence >= 0.4)                                               tags.push('Chill / Relaxed');
  if (row.valence <= 0.35)                                                                    tags.push('Sad / Melancholic');
  if (row.energy >= 0.75 && row.tempo >= 120)                                                 tags.push('Energetic / Hype');
  if (row.energy >= 0.7 && row.valence <= 0.4)                                               tags.push('Angry / Intense');
  if (row.valence >= 0.45 && row.valence <= 0.75 && row.acousticness >= 0.3 && row.tempo <= 110) tags.push('Romantic');
  if (row.instrumentalness >= 0.5 && row.energy <= 0.55)                                    tags.push('Focus / Study');
  if (row.valence <= 0.4 && row.energy <= 0.6 && row.acousticness <= 0.4)                   tags.push('Dark / Moody');
  if (tags.length === 0) tags.push('Neutral');
  return tags;
}

/**
 * mapUmbrellaGenre
 * Normalises the CSV's fine-grained track_genre to one of the 12 umbrella genres.
 * Falls back to 'Other' for unmapped values.
 * @param {string} rawGenre
 * @returns {string}
 */
function mapUmbrellaGenre(rawGenre) {
  if (!rawGenre) return 'Other';
  const key = rawGenre.trim().toLowerCase();
  return GENRE_MAP[key] || 'Other';
}

/**
 * parseNumeric
 * Parses a field to float, returns null if invalid.
 * @param {string} val
 * @returns {number|null}
 */
function parseNumeric(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/**
 * shuffleArray
 * Fisher-Yates in-place shuffle.
 * @param {any[]} arr
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  // 1. Validate CSV path
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌  CSV not found at: ${CSV_PATH}`);
    console.error('    Download the dataset from:');
    console.error('    https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset');
    console.error('    Then place it at: scripts/raw-data/dataset.csv\n');
    process.exit(1);
  }

  console.log(`\n📂  Reading CSV from: ${CSV_PATH}`);
  const raw = fs.readFileSync(CSV_PATH, 'utf8');

  // 2. Parse CSV
  console.log('⚙️   Parsing CSV...');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`    Total rows in CSV: ${rows.length.toLocaleString()}`);

  // 3. Filter + transform rows
  const required = ['track_name', 'artists', 'album_name', 'track_genre'];

  let skipped = 0;
  const songsByGenre = {}; // umbrella genre → song[]

  for (const row of rows) {
    // Skip if any required text field is blank
    if (required.some(col => !row[col] || !row[col].trim())) {
      skipped++;
      continue;
    }

    // Parse audio features — skip rows where critical features are missing
    const valence          = parseNumeric(row.valence);
    const energy           = parseNumeric(row.energy);
    const tempo            = parseNumeric(row.tempo);
    const acousticness     = parseNumeric(row.acousticness);
    const instrumentalness = parseNumeric(row.instrumentalness);
    const popularity       = parseNumeric(row.popularity);

    if (valence === null || energy === null || tempo === null) {
      skipped++;
      continue;
    }

    const numericRow = {
      valence,
      energy,
      tempo,
      acousticness:     acousticness     ?? 0,
      instrumentalness: instrumentalness ?? 0,
    };

    const atmosphere = tagAtmosphere(numericRow);
    const genre      = mapUmbrellaGenre(row.track_genre);

    const song = {
      title:      row.track_name.trim(),
      artist:     row.artists.trim(),
      album:      row.album_name.trim(),
      genre,
      atmosphere,
      popularity: popularity !== null ? Math.round(popularity) : 0,
    };

    if (!songsByGenre[genre]) songsByGenre[genre] = [];
    songsByGenre[genre].push(song);
  }

  console.log(`    Skipped (missing required fields): ${skipped.toLocaleString()}`);

  // 4. Cap per genre
  const sampled = [];
  console.log('\n📊  Per-genre counts (before cap → after cap):');

  const genreKeys = Object.keys(songsByGenre).sort();
  for (const genre of genreKeys) {
    const pool = songsByGenre[genre];
    shuffleArray(pool);
    const capped = pool.slice(0, CAP_PER_GENRE);
    sampled.push(...capped);
    console.log(`    ${genre.padEnd(25)} ${String(pool.length).padStart(6)} → ${capped.length}`);
  }

  // 5. Final shuffle
  shuffleArray(sampled);

  console.log(`\n✅  Final dataset: ${sampled.length} songs across ${genreKeys.length} genres`);

  // 6. Write output
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sampled, null, 2), 'utf8');
  console.log(`💾  Written to: ${OUTPUT_PATH}`);

  // 7. Spot-check: print SPOT_CHECK_COUNT random entries
  console.log(`\n🔍  Spot-check — ${SPOT_CHECK_COUNT} random entries:\n`);
  const checkPool = [...sampled];
  shuffleArray(checkPool);
  const sample = checkPool.slice(0, SPOT_CHECK_COUNT);

  sample.forEach((s, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}. "${s.title}" — ${s.artist}\n` +
      `      Genre: ${s.genre} | Pop: ${s.popularity} | Atmosphere: [${s.atmosphere.join(', ')}]\n`
    );
  });

  console.log('🎵  Build complete.\n');
}

main();
