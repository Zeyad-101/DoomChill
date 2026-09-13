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
  'trip-hop':         'Hip-Hop/Rap',

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
  const valence = row.valence;
  const energy = row.energy;
  const tempo = row.tempo;
  const acousticness = row.acousticness ?? 0;
  const instrumentalness = row.instrumentalness ?? 0;

  // 1. Angry / Intense: High energy + aggressive/negative valence (heavy rock, metal, intense beats)
  if (energy >= 0.70 && valence <= 0.42) {
    tags.push('Angry / Intense');
  }

  // 2. Energetic / Hype: High energy + high tempo + positive/neutral valence (dance, uptempo pop/rock)
  if (energy >= 0.72 && tempo >= 115 && valence >= 0.38) {
    tags.push('Energetic / Hype');
  }

  // 3. Happy / Upbeat: Bright valence + moderate to high energy
  if (valence >= 0.58 && energy >= 0.48) {
    tags.push('Happy / Upbeat');
  }

  // 4. Chill / Relaxed: Low-to-moderate energy, calm tempo, warm valence
  if (energy <= 0.50 && valence >= 0.32 && valence <= 0.75 && tempo <= 130) {
    tags.push('Chill / Relaxed');
  }

  // 5. Sad / Melancholic: Low valence AND low-to-moderate energy (NEVER high-energy aggressive tracks)
  if (valence <= 0.38 && energy <= 0.52) {
    tags.push('Sad / Melancholic');
  }

  // 6. Romantic: Acoustic warmth, slower tempo, warm valence
  if (valence >= 0.40 && valence <= 0.75 && acousticness >= 0.30 && energy <= 0.58 && tempo <= 115) {
    tags.push('Romantic');
  }

  // 7. Focus / Study: Instrumental, calm energy
  if (instrumentalness >= 0.45 && energy <= 0.55) {
    tags.push('Focus / Study');
  }

  // 8. Dark / Moody: Shadowy, mid-energy, low valence (not high-energy angry, not slow melancholic)
  if (valence <= 0.40 && energy > 0.52 && energy < 0.70 && acousticness <= 0.45) {
    tags.push('Dark / Moody');
  }

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

  // 2b. Collect all artists tagged under Indian genres in the CSV
  const knownIndianGenres = new Set(['indian', 'pop-film']);
  const indianArtistsSet = new Set();
  for (const r of rows) {
    if (knownIndianGenres.has(r.track_genre)) {
      r.artists.split(';').forEach(a => {
        const t = a.trim().toLowerCase();
        if (t) indianArtistsSet.add(t);
      });
    }
  }

  // Exact artist names (lowercase) known to be Indian/South Asian
  const INDIAN_EXACT_ARTISTS = new Set([
    'king', 'vilen', 'ritviz', 'shubh', 'the landers', 'the prophec', 'akhil', 'bohemia',
    'imran khan', 'zack knight', 'bilal saeed', 'the local train', 'paradox', 'guri',
    'aleemrk', 'umair', 'dabzee', 'chani nattan', 'inderpal moga', 'tegi pannu', 'manni sandhu',
    'arjun kanungo', 'momina mustehsan', 'stephen zechariah', 'srinisha jayaseelan',
    'neeraj shridhar', 'kavita seth', 'farasat anees', 'slick trick', 'toshi', 'jaura phagwara',
    'jordan sandhu', 'bhalwaan', 'signature by sb', 'jasmin walia', 'dhvani bhanushali',
    'abhijit vaghani', 'ikky', 'shinda kahlon', 'gurinder gill', 'gminxr', 'nucleya',
    'sunny malton', 'the kidd', 'money musik', 'ap dhillon', 'sidhu moose wala', 'karan aujla',
    'maninder buttar', 'jass manak', 'ammy virk', 'parmish verma', 'jassie gill', 'hardy sandhu',
    'harrdy sandhu', 'sharry maan', 'kulwinder billa', 'amrit maan', 'ninja', 'korala maan',
    'tarsem jassar', 'gurnam bhullar', 'khesari lal yadav', 'pawan singh', 'shilpi raj',
    'nora fatehi', 'luka chuppi', 'hariharan', 'anup jalota', 'pankaj udhas', 'bhupinder singh',
    'jagjit singh', 'chitra singh', 'talat aziz', 'ghulam ali', 'mehdi hassan',
    'mc square', 'baba sehgal', 'rita', 'chris g.', 'mc sai', 'sahi siva', 'sultaan',
    'gavy dhaliwal', 'ajey nagar (carryminati)', 'carryminati', 'wily frenzy', 'wazir patar',
    'azaad', 'bobo shashi', 'varinder brar', 'mathan', 'naven', 'lehmber hussainpuri',
    'miss pooja', 'millind gaba', 'satinder sartaaj', 'dr zeus', 'master rakesh', 'shortie',
    'deepti', 'roop bhullar', 'prabh gill', 'arivu', 'brodha v', 'alfaaz', 'young stunners',
    'talha anjum', 'talhah yunus', 'afkap', 'sambata', 'rav aulakh', 'mugen rao',
    'prashan sean', 'deep jandu', 'fazilpuria', 'afsana khan', 'benny dayal', 'akull',
    'amantej hundal', 'amar sandhu', 'nimrat khaira', 'tehjeeb hafi', 'dilpreet dhillon',
    'kaur b', 'manj musik', 'mista baaz', 'preet hundal', 'dj yogii', 'divya khosla kumar',
    'hrjxt'
  ]);

  // Comprehensive regex for Indian keywords, playback singers, and Indic scripts
  const INDIAN_PATTERN = /(\b(arijit|badshah|shreya|ghoshal|t-series|zeemusic|nehakakkar|kakkar|diljit|dosanjh|sidhu|moosewala|honey singh|yo yo|pritam|atif|aslam|rahman|a\.r\. rahman|tamizha|santhosh narayanan|ilaiyaraaja|anirudh|ravichander|armaan malik|amal mallik|jubin nautiyal|darshan raval|guru randhawa|bpraak|b praak|dhillon|jasleen|vishal-shekhar|vishal dadlani|shekhar ravjiani|sunidhi|shaan|udit narayan|alka yagnik|kumar sanu|sonu nigam|kishore kumar|lata mangeshkar|mohammed rafi|mukesh|asha bhosle|jagjit|nusrat|rahat|ali zafar|himesh|mika singh|daler mehndi|sukhwinder|monali thakur|mohit chauhan|amit trivedi|papon|shankar mahadevan|ehsaan|loy|haricharan|sid sriram|raghu dixit|sathyaprakash|vijay prakash|anuradha paudwal|kavita krishnamurthy|sadhana sargam|bappi lahiri|burman|laxmikant|pyarelal|kalyanji|anandji|jatin-lalit|nadeem-shravan|anu malik|salim-sulaiman|sajid-wajid|meet bros|kanika kapoor|divine|emiway|kr\$na|mc stan|seedhe maut|raftaar|ikka|parmish verma|ammy virk|jassie gill|hardy sandhu|harrdy sandhu|karan aujla|sharry maan|gurdas maan|maninder buttar|jass manak|kulwinder billa|amrit maan|ninja|korala maan|tarsem jassar|gurnam bhullar|khesari|pawan singh|shilpi raj|dhanush|yuvan shankar|harris jayaraj|deva|vidyasagar|keeravani|devi sri prasad|thaman|gv prakash|g\.v\. prakash|chithra|balasubrahmanyam|spb|yesudas|sujatha|swarnalatha|shweta mohan|chinmayi|naresh iyer|karthik|vijay yesudas|unni menon|mano|teejay|al rufian|kaushik krish|padmalatha|aaryan shah|bollywood|punjabi|tollywood|kollywood|bhojpuri|desi|bhangra|qawwali|ghazal|bhajan|kirtan|tabla|sitar|dhol|carnatic|hindustani|mangeshkar|speed records|white hill|geet mp3|singh|sharma|verma|patel|reddy|gupta|kumar|joshi|pandey|mishra|yadav|tiwari|dubey|choudhary|bhatt|swamy|pillai|menon|subramaniam|srinivas|hariharan|chatterjee|banerjee|mukherjee|chakraborty|jasraj|subbulakshmi|pandit|kher|kailash|rashid khan|ustad|zakir|hussain|deshpande|abhisheki|raghavan|raghvan|kadkade|sikka|sital-singh|shubh|landers|ritviz|pannu|sandhu|kanungo|zechariah|srinisha|shridhar|kavita seth|farasat|anees|toshi|jaura|phagwara|bilal saeed|bhalwaan|paradox|jasmin walia|guri|vaghani|bhanushali|luka chuppi|prophec|kahlon|gurinder gill|gminxr|chani nattan|inderpal moga|aleemrk|umair|bohemia|dabzee|nucleya|vilen|sunny malton|money musik|ap dhillon|shinda kahlon|imran khan|thallumaala)\b)|[\u0900-\u0D7F]/i;

  // 3. Filter + transform rows
  const required = ['track_name', 'artists', 'album_name', 'track_genre'];

  let skipped = 0;
  const seenSongs = new Set();
  const songsByGenre = {}; // umbrella genre → song[]

  for (const row of rows) {
    if (required.some(col => !row[col] || !row[col].trim())) {
      skipped++;
      continue;
    }

    // Skip Indian genres
    if (row.track_genre === 'indian' || row.track_genre === 'pop-film') {
      skipped++;
      continue;
    }

    // Check individual artists
    const artistList = row.artists.split(';').map(a => a.trim().toLowerCase());
    const isKnownIndianArtist = artistList.some(a => {
      if (indianArtistsSet.has(a) || INDIAN_EXACT_ARTISTS.has(a)) return true;
      for (const exact of INDIAN_EXACT_ARTISTS) {
        if (a.includes(exact)) return true;
      }
      return false;
    });
    if (isKnownIndianArtist) {
      skipped++;
      continue;
    }

    // Check pattern against artists, track_name, album_name
    const fullText = `${row.artists} ${row.track_name} ${row.album_name}`;
    if (INDIAN_PATTERN.test(fullText)) {
      skipped++;
      continue;
    }

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

    const popVal = popularity !== null ? Math.round(popularity) : 0;
    // Keep tracks with decent popularity so we don't have broken/zero-popularity tracks
    if (popVal < 15) {
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

    // Clean up artist name (e.g. "Artist1;Artist2" -> "Artist1, Artist2")
    const cleanArtist = row.artists
      .split(';')
      .map(a => a.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');

    const song = {
      title:      row.track_name.trim(),
      artist:     cleanArtist,
      album:      row.album_name.trim(),
      genre,
      atmosphere,
      popularity: popVal,
    };

    const dedupeKey = `${song.title.toLowerCase()}___${song.artist.toLowerCase()}`;
    if (seenSongs.has(dedupeKey)) {
      skipped++;
      continue;
    }
    seenSongs.add(dedupeKey);

    if (!songsByGenre[genre]) songsByGenre[genre] = [];
    songsByGenre[genre].push(song);
  }

  console.log(`    Skipped (missing/filtered/low-pop): ${skipped.toLocaleString()}`);

  // 3b. Add curated Arabic & Egyptian Arabic songs
  const arabicPath = path.resolve(__dirname, 'arabic-songs.json');
  if (fs.existsSync(arabicPath)) {
    const arabicList = JSON.parse(fs.readFileSync(arabicPath, 'utf8'));
    songsByGenre['Arabic'] = arabicList;
    console.log(`    Loaded ${arabicList.length} curated Egyptian & Arabic tracks.`);
  }

  // 4. Cap per genre — prioritize high popularity songs
  const sampled = [];
  console.log('\n📊  Per-genre counts (before cap → after cap):');

  const genreKeys = Object.keys(songsByGenre).sort();
  for (const genre of genreKeys) {
    const pool = songsByGenre[genre];
    // Sort primarily by popularity descending
    pool.sort((a, b) => b.popularity - a.popularity);
    // Take top CAP_PER_GENRE popular songs
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
