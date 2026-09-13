'use strict';

(function songLookupModule() {
  const PROXY_URL = (typeof window !== 'undefined' && window.location.protocol.startsWith('http'))
    ? '/api/lookup'
    : 'http://localhost:3000/api/lookup';

  const FETCH_TIMEOUT_MS = 10_000;

  const DEMO_CATALOG = [
    {
      query: 'tamally maak',
      data: {
        track: "Tamally Ma'ak",
        artist: 'Amr Diab',
        genre: 'Arabic Pop',
        trackTier: 'Global Hit',
        album: "Tamally Ma'ak",
        albumTier: 'Global Hit',
        listeners: 1850000,
        playcount: 24500000,
        releaseYear: '2000',
        duration: '4:30',
        tags: ['arabic', 'egyptian', 'romantic', 'classic'],
        stats: { popularityPct: 95, listenersPct: 92, playcountPct: 86 },
        funFacts: [
          'Streaming Impact: The ultimate timeless Arabic anthem with tens of millions of streams across the globe.',
          'Sonic Identity: Featuring the legendary flamenco-inspired Spanish guitar intro played by Farouk Mohamed Hassan.',
          'Cultural Legacy: Covered in over a dozen international languages including French, Spanish, Hindi, and Greek.'
        ],
        tracklist: ["Tamally Ma'ak", 'Sennin', 'Baatref', 'Alby Ekhtarak', 'Keda Einy Einak'],
        artistBio: 'Amr Diab (El Hadaba) is an Egyptian singer, composer, and actor. He is the best-selling Middle Eastern artist of all time and a pioneer of Mediterranean music.',
        artistListeners: 2800000,
        wikiSummary: 'Tamally Maak is an iconic Arabic romantic song by Egyptian legend Amr Diab from his 2000 album of the same name. It is recognized as one of the most famous Arabic pop songs of all time.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a4/09/a4/a409a47d-cbf3-dc42-2638-3482a0b3cb17/00724352771851.rgb.jpg/600x600bb.jpg'
      }
    },
    {
      query: 'el bakht',
      data: {
        track: 'El Bakht',
        artist: 'Wegz',
        genre: 'Egyptian Trap',
        trackTier: 'Global Hit',
        album: 'El Bakht',
        albumTier: 'Global Hit',
        listeners: 1420000,
        playcount: 32000000,
        releaseYear: '2022',
        duration: '3:25',
        tags: ['trap', 'egyptian', 'rap', 'indie'],
        stats: { popularityPct: 96, listenersPct: 91, playcountPct: 94 },
        funFacts: [
          'Streaming Impact: Shattered all Middle Eastern Spotify and YouTube records in 2022, holding #1 for months.',
          'Sonic Identity: A sentimental blend of intimate acoustic nylon-string guitar and deep 808 trap percussion with vulnerable vocals.',
          'Cultural Legacy: Cemented Wegz as the defining voice of Egypt\'s new generation, ushering Arabic trap into global culture.'
        ],
        tracklist: ['El Bakht', 'Dorak Gai', 'Keifiy Keda', 'Bazat', 'Asyad El Soot'],
        artistBio: 'Wegz (Ahmed Ali) is an Egyptian rapper, singer, and songwriter from El Wardian, Alexandria. He is the leading pioneer of the contemporary Egyptian trap and hip-hop wave.',
        artistListeners: 2100000,
        wikiSummary: 'El Bakht is a record-breaking emotional trap ballad by Egyptian artist Wegz released in 2022, celebrated across the Arab world for its candid vulnerability and fusion of hip-hop and acoustic melody.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/be/8b/6e/be8b6ea4-fa30-9b4e-2895-78e72767098e/196626673752.jpg/600x600bb.jpg'
      }
    },
    {
      query: 'blinding lights',
      data: {
        track: 'Blinding Lights',
        artist: 'The Weeknd',
        genre: 'Synthwave',
        trackTier: 'Global Hit',
        album: 'After Hours',
        albumTier: 'Global Hit',
        listeners: 2430829,
        playcount: 39488122,
        releaseYear: '2019',
        duration: '3:20',
        tags: ['synthwave', 'synthpop', 'pop', '2019'],
        stats: { popularityPct: 97, listenersPct: 94, playcountPct: 88 },
        funFacts: [
          'Streaming Impact: Over 39.4M global scrobbles and 2.4M listeners, ranked Global Hit on Last.fm.',
          'Sonic Identity: Driven by pulsing 1980s analog synthesizers and a relentless 171 BPM electro-pop rhythm.',
          'Cultural Legacy: Broke the all-time Billboard record with 90 weeks on the Hot 100, named the #1 song of all time by Billboard.'
        ],
        tracklist: ['Alone Again', 'Too Late', 'Hardest to Love', 'Scared to Live', 'Snowchild'],
        artistBio: 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer-songwriter known for his sonic versatility and dark lyrical themes.',
        artistListeners: 5515000,
        wikiSummary: 'Blinding Lights is a synth-pop and synthwave anthem recorded by Canadian singer the Weeknd for his fourth studio album After Hours. It spent a record-shattering 90 weeks on the Billboard Hot 100.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg'
      }
    },
    {
      query: 'doomsday',
      data: {
        track: 'Doomsday',
        artist: 'MF DOOM',
        genre: 'Hip-Hop',
        trackTier: 'Well-Known',
        album: 'Operation: Doomsday',
        albumTier: 'Niche Favorite',
        listeners: 1250000,
        playcount: 9800000,
        releaseYear: '1999',
        duration: '4:58',
        tags: ['hip hop', 'underground hip hop', 'mf doom'],
        stats: { popularityPct: 88, listenersPct: 82, playcountPct: 76 },
        funFacts: [
          'Streaming Impact: Acclaimed underground classic with nearly 10M scrobbles across hip-hop purists worldwide.',
          'Sonic Identity: Built on an iconic flipped sample of Sade\'s "Kiss of Love" combined with intricate internal rhyme schemes.',
          'Cultural Legacy: Introduced the metal-masked supervillain persona that redefined independent hip-hop forever.'
        ],
        tracklist: ['The Time We Faced Doom (Skit)', 'Doomsday', 'Rhymes Like Dimes', 'The Finest', 'Back In The Days (Skit)'],
        artistBio: 'Daniel Dumile, best known by his stage name MF DOOM, was an enigmatic British-American rapper and producer celebrated for his intricate wordplay and signature comic-book mask.',
        artistListeners: 2400000,
        wikiSummary: 'Doomsday is the lead track from MF DOOM\'s seminal 1999 debut solo album Operation: Doomsday, recorded in the wake of KMD\'s dissolution. It features a timeless Sade sample and iconic lyricism.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/39/99/25/399925ca-1b3d-d4b8-8a77-b9946edb5d20/36768.jpg/600x600bb.jpg'
      }
    },
    {
      query: 'starboy',
      data: {
        track: 'Starboy',
        artist: 'The Weeknd ft. Daft Punk',
        genre: 'R&B',
        trackTier: 'Global Hit',
        album: 'Starboy',
        albumTier: 'Global Hit',
        listeners: 3900000,
        playcount: 38000000,
        releaseYear: '2016',
        duration: '3:50',
        tags: ['rnb', 'pop', 'electronic'],
        stats: { popularityPct: 96, listenersPct: 95, playcountPct: 85 },
        funFacts: [
          'Streaming Impact: Debuted straight to number one in dozens of countries with over 38M scrobbles.',
          'Sonic Identity: Co-produced by legendary French electronic duo Daft Punk with their trademark robotic vocoders.',
          'Cultural Legacy: Marked a decisive sonic and visual reinvention, transitioning from nocturnal gloom to gleaming stadium electro-pop.'
        ],
        tracklist: ['Starboy', 'Party Monster', 'False Alarm', 'Reminder', 'Rockin’'],
        artistBio: 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer-songwriter and record producer.',
        artistListeners: 5515000,
        wikiSummary: 'Starboy is a song by the Weeknd featuring French electronic duo Daft Punk. Released as the title track of his third studio album, it topped the Billboard Hot 100.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg'
      }
    },
    {
      query: 'teardrop',
      data: {
        track: 'Teardrop',
        artist: 'Massive Attack',
        genre: 'Trip-Hop',
        trackTier: 'Very Popular',
        album: 'Mezzanine',
        albumTier: 'Very Popular',
        listeners: 2100000,
        playcount: 17400000,
        releaseYear: '1998',
        duration: '5:30',
        tags: ['trip hop', 'downtempo', 'ambient'],
        stats: { popularityPct: 91, listenersPct: 90, playcountPct: 79 },
        funFacts: [
          'Streaming Impact: The gold standard of trip-hop with over 17M plays and sustained critical reverence.',
          'Sonic Identity: Features the ethereal, haunting vocals of Elizabeth Fraser over a subtle harpsichord and heartbeat bass drum.',
          'Cultural Legacy: Universally recognized as the opening theme for the hit television series House M.D.'
        ],
        tracklist: ['Angel', 'Risingson', 'Teardrop', 'Inertia Creeps', 'Exchange'],
        artistBio: 'Massive Attack are an English electronic music group formed in 1988 in Bristol, pioneers of the trip-hop genre.',
        artistListeners: 3200000,
        wikiSummary: 'Teardrop is an atmospheric song by English trip-hop group Massive Attack, featuring vocals by Elizabeth Fraser of Cocteau Twins. Released as the second single from Mezzanine.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/0a/98/55/0a98555b-8d9d-3b46-660a-b91261557d17/00724384559953.rgb.jpg/600x600bb.jpg'
      }
    },
    {
      query: 'cairokee',
      data: {
        track: 'Basrah w Atooh',
        artist: 'Cairokee',
        genre: 'Egyptian Rock',
        trackTier: 'Global Hit',
        album: 'Roma',
        albumTier: 'Global Hit',
        listeners: 980000,
        playcount: 18500000,
        releaseYear: '2022',
        duration: '3:57',
        tags: ['rock', 'egyptian', 'indie', 'alternative'],
        stats: { popularityPct: 94, listenersPct: 88, playcountPct: 89 },
        funFacts: [
          'Streaming Impact: The flagship single from the chart-topping album Roma with over 18 million plays.',
          'Sonic Identity: An evocative blend of Amir Eid\'s raw emotive vocals, soaring electric guitars, and cinematic synth textures.',
          'Cultural Legacy: Cairokee cemented their position as the undisputed kings of modern Egyptian alternative rock.'
        ],
        tracklist: ['Basrah w Atooh', 'Roma', 'James Dean', 'Costarika', 'Ya Abyad Ya Eswed'],
        artistBio: 'Cairokee is an Egyptian rock band formed in 2003, widely celebrated for their socially conscious lyrics and boundary-pushing Arabic rock sound.',
        artistListeners: 1500000,
        wikiSummary: 'Basrah w Atooh is a hit alternative rock ballad by Egyptian band Cairokee from their 2022 studio album Roma.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b8/ec/a9/b8eca9ad-5c62-43bb-a320-eb416ad8c49e/196925574547.jpg/600x600bb.jpg'
      }
    },
    {
      query: 'fady shewaya',
      data: {
        track: 'Fady Shewaya',
        artist: 'Hamza Namira',
        genre: 'Arabic Folk',
        trackTier: 'Global Hit',
        album: 'Mawlood Sanat 80',
        albumTier: 'Global Hit',
        listeners: 1100000,
        playcount: 22000000,
        releaseYear: '2020',
        duration: '3:50',
        tags: ['folk', 'egyptian', 'acoustic', 'ballad'],
        stats: { popularityPct: 95, listenersPct: 90, playcountPct: 92 },
        funFacts: [
          'Streaming Impact: A viral phenomenon across the Arab world with over 150 million YouTube views and 22M+ audio streams.',
          'Sonic Identity: Warm acoustic nylon guitar, reflective accordion chords, and nostalgic lyrics touching upon loneliness and friendship.',
          'Cultural Legacy: Reconnected millions with the warm, storytelling tradition of classic Egyptian acoustic ballads.'
        ],
        tracklist: ['Fady Shewaya', 'Mawlood Sanat 80', 'Est3yzo', 'Dari Ya Alby', 'Reyah El Hayah'],
        artistBio: 'Hamza Namira is an Egyptian singer-songwriter and multi-instrumentalist acclaimed for blending traditional Arab folk with modern pop arrangements.',
        artistListeners: 1800000,
        wikiSummary: 'Fady Shewaya is a massive hit song by Egyptian artist Hamza Namira from his acclaimed 2020 album Mawlood Sanat 80.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/80/e7/81/80e781ea-725a-fc8a-2c63-4217157bc2b9/195919782522.jpg/600x600bb.jpg'
      }
    },
    {
      query: 'kifak inta',
      data: {
        track: 'Kifak Inta',
        artist: 'Fairuz',
        genre: 'Arabic Classic',
        trackTier: 'Global Hit',
        album: 'Kifak Inta',
        albumTier: 'Global Hit',
        listeners: 1450000,
        playcount: 28000000,
        releaseYear: '1991',
        duration: '3:45',
        tags: ['classic', 'lebanese', 'tarab', 'nostalgia'],
        stats: { popularityPct: 96, listenersPct: 93, playcountPct: 91 },
        funFacts: [
          'Streaming Impact: One of the most cherished and recognizable Arabic melodies ever recorded.',
          'Sonic Identity: Written and composed by Ziad Rahbani, seamlessly fusing classic jazz harmonies with Fairuz\'s ethereal vocals.',
          'Cultural Legacy: A cross-generational masterpiece that redefined the modern Arab chanson.'
        ],
        tracklist: ['Kifak Inta', 'Le Beirut', 'Habaitak Bel Saif', 'Nassam Alayna El Hawa', 'Saalouni El Nas'],
        artistBio: 'Fairuz is a Lebanese musical icon and one of the most celebrated and influential singers in the history of the Arab world.',
        artistListeners: 2200000,
        wikiSummary: 'Kifak Inta is a timeless masterpiece composed by Ziad Rahbani and sung by the legendary Fairuz, released in 1991.',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/10/8d/e7/108de755-9ba4-6047-b847-5d2ee7674149/190295822363.jpg/600x600bb.jpg'
      }
    }
  ];

  function dispatch(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  }

  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timerId    = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timerId);
    }
  }

  async function clientSideDirectLookup(track, artist) {
    const cleanTrack = (track || '').trim();
    const cleanArtist = (artist || '').trim();

    try {
      let itData = null;

      // 1. Try combined query on global store
      const termCombined = encodeURIComponent(`${cleanArtist ? cleanArtist + ' ' : ''}${cleanTrack}`);
      let itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${termCombined}&entity=song&limit=5`, 4000).catch(() => null);
      if (itunesRes && itunesRes.ok) {
        const json = await itunesRes.json().catch(() => null);
        if (json?.results?.length > 0) itData = json;
      }

      // 2. Try Egypt storefront for Arabic artists
      if (!itData) {
        itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${termCombined}&country=EG&entity=song&limit=5`, 4000).catch(() => null);
        if (itunesRes && itunesRes.ok) {
          const json = await itunesRes.json().catch(() => null);
          if (json?.results?.length > 0) itData = json;
        }
      }

      // 3. Try track title alone
      if (!itData) {
        const trackTerm = encodeURIComponent(cleanTrack);
        itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${trackTerm}&entity=song&limit=5`, 4000).catch(() => null);
        if (itunesRes && itunesRes.ok) {
          const json = await itunesRes.json().catch(() => null);
          if (json?.results?.length > 0) itData = json;
        }
      }

      // 4. Try inverted order (in case user searched track as artist)
      if (!itData && cleanArtist) {
        const termInverted = encodeURIComponent(`${cleanTrack} ${cleanArtist}`);
        itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${termInverted}&entity=song&limit=5`, 4000).catch(() => null);
        if (itunesRes && itunesRes.ok) {
          const json = await itunesRes.json().catch(() => null);
          if (json?.results?.length > 0) itData = json;
        }
      }

      if (itData && itData.results && itData.results.length > 0) {
        const item = itData.results[0];
        const artistName = item.artistName;
        const trackName = item.trackName;
        const albumName = item.collectionName || trackName;
        const image = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null;
        const audioPreview = item.previewUrl || null;
        const itunesUrl = item.trackViewUrl || null;
        const releaseYear = item.releaseDate ? item.releaseDate.slice(0, 4) : 'Recent';
        const durationMs = item.trackTimeMillis || 210000;
        const duration = `${Math.floor(durationMs / 60000)}:${String(Math.floor((durationMs % 60000) / 1000)).padStart(2, '0')}`;
        const genre = item.primaryGenreName || 'Music';

        // Query Wikipedia in parallel for artist photo & bio
        let artistPhoto = null;
        let artistBio = null;
        try {
          const isArabic = /[\u0600-\u06FF]/.test(artistName);
          const wikiDomains = isArabic ? ['ar', 'en'] : ['en', 'ar'];
          for (const d of wikiDomains) {
            const wRes = await fetchWithTimeout(`https://${d}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistName)}`, 3500).catch(() => null);
            if (wRes && wRes.ok) {
              const wData = await wRes.json();
              if (wData.thumbnail?.source || wData.originalimage?.source) {
                artistPhoto = wData.thumbnail?.source || wData.originalimage?.source;
              }
              if (wData.extract) {
                artistBio = wData.extract.replace(/<[^>]+>/g, '').trim();
              }
              if (artistPhoto) break;
            }
          }
        } catch (wErr) {
          // Non-fatal
        }

        // Check if track exists in loaded local songs data for tags/atmosphere
        const pool = (typeof window.DoomChill?.getSongPool === 'function' && window.DoomChill.getSongPool()) || [];
        const localMatch = pool.find(s =>
          s.title.toLowerCase() === trackName.toLowerCase() ||
          cleanTrack.toLowerCase().includes(s.title.toLowerCase())
        );

        const playcount = localMatch ? Math.max(500000, localMatch.popularity * 350000) : 18500000;
        const listeners = localMatch ? Math.max(80000, localMatch.popularity * 35000) : 1900000;
        const tags = localMatch?.atmosphere || [genre.toLowerCase(), 'favorites', 'discovery'];

          // Compute tier
          let trackTier = 'Well-Known';
          if (playcount >= 50000000) trackTier = 'Global Hit';
          else if (playcount >= 5000000) trackTier = 'Very Popular';
          else if (playcount >= 500000) trackTier = 'Well-Known';
          else if (playcount >= 50000) trackTier = 'Niche Favorite';
          else trackTier = 'Deep Cut';

          const popularityPct = Math.max(25, Math.min(99, Math.round((Math.log10(Math.max(playcount, 10)) / 7.8) * 100)));
          const listenersPct = Math.max(20, Math.min(98, Math.round((Math.log10(Math.max(listeners, 10)) / 6.8) * 100)));
          const playcountPct = Math.max(30, Math.min(98, Math.round(listeners > 0 ? Math.min(96, (playcount / listeners) * 5.2) : 70)));

          const tracklist = itData.results.slice(0, 5).map(r => r.trackName).filter(Boolean);
          if (!tracklist.includes(trackName)) tracklist.unshift(trackName);

          const funFacts = [
            `Streaming Impact: Reached millions of listeners worldwide, holding ${trackTier} prominence in ${genre}.`,
            `Sonic Identity: Produced with signature ${genre} instrumentation, crisp mixing, and evocative vocal dynamics.`,
            artistBio
              ? (artistBio.length > 210 ? artistBio.slice(0, 205) + '…' : artistBio)
              : `Cultural Legacy: A standout highlight in ${artistName}'s discography from album '${albumName}'.`
          ];

          return {
            track: trackName,
            artist: artistName,
            genre,
            trackTier,
            album: albumName,
            albumTier: trackTier,
            listeners,
            playcount,
            releaseYear,
            duration,
            image,
            artistPhoto,
            audioPreview,
            itunesUrl,
            artistBio,
            artistListeners: listeners * 2,
            stats: { popularityPct, listenersPct, playcountPct },
            funFacts,
            tracklist: tracklist.slice(0, 5),
            tags,
            wikiSummary: funFacts[0] + ' ' + funFacts[1]
        }
      }
    } catch (directErr) {
      console.warn('[songLookup] Direct iTunes lookup failed:', directErr);
    }

    return null;
  }

  async function lookupSong(track, artist) {
    if (!track || !track.trim()) return;

    dispatch('doomchill:lookup:loading');

    const cleanTrack = track.trim();
    const cleanArtist = (artist || '').trim();
    const params = new URLSearchParams({ track: cleanTrack });
    if (cleanArtist) params.set('artist', cleanArtist);

    let data = null;

    // TIER 1: Same-origin /api/lookup (e.g. Vercel deployment or node server on same port)
    try {
      const res = await fetchWithTimeout(`/api/lookup?${params.toString()}`, 5000);
      if (res.ok) {
        const json = await res.json();
        if (json && !json.error) data = json;
      }
    } catch (e) {
      // Proceed to Tier 2
    }

    // TIER 2: Local dev server at http://localhost:3000/api/lookup (e.g. when run from Live Server on port 5500)
    if (!data) {
      try {
        const res = await fetchWithTimeout(`http://localhost:3000/api/lookup?${params.toString()}`, 5000);
        if (res.ok) {
          const json = await res.json();
          if (json && !json.error) data = json;
        }
      } catch (e) {
        // Proceed to Tier 3
      }
    }

    // TIER 3: Client-side Direct Multi-Source Lookup (iTunes API + Wikipedia REST API)
    if (!data) {
      data = await clientSideDirectLookup(cleanTrack, cleanArtist);
    }

    // TIER 4: Full Local 11,316 Songs Dataset Fallback
    if (!data) {
      const pool = (typeof window.DoomChill?.getSongPool === 'function' && window.DoomChill.getSongPool()) || [];
      const tLower = cleanTrack.toLowerCase();
      const aLower = cleanArtist.toLowerCase();

      const match = pool.find(s => {
        const titleMatch = s.title.toLowerCase() === tLower ||
          tLower.includes(s.title.toLowerCase()) ||
          s.title.toLowerCase().includes(tLower);

        if (aLower) {
          return titleMatch && (
            s.artist.toLowerCase().includes(aLower) ||
            aLower.includes(s.artist.toLowerCase())
          );
        }
        return titleMatch;
      });

      if (match) {
        const popPct = match.popularity;
        const trackTier = popPct >= 90 ? 'Global Hit' : (popPct >= 70 ? 'Very Popular' : (popPct >= 40 ? 'Well-Known' : 'Niche Favorite'));
        const listPct = Math.min(98, Math.max(25, Math.round(popPct * 0.95)));
        const playPct = Math.min(99, Math.max(30, Math.round(popPct * 1.02)));
        const listeners = Math.round(popPct * 35000 + 100000);
        const playcount = Math.round(listeners * 4.5);

        data = {
          track: match.title,
          artist: match.artist,
          genre: match.genre,
          trackTier,
          album: match.album,
          albumTier: trackTier,
          listeners,
          playcount,
          releaseYear: 'Recent',
          duration: '3:30',
          image: null,
          artistPhoto: null,
          audioPreview: null,
          itunesUrl: null,
          artistBio: `${match.artist} is an iconic standout artist in ${match.genre}.`,
          artistListeners: listeners * 2,
          stats: { popularityPct: popPct, listenersPct: listPct, playcountPct: playPct },
          funFacts: [
            `Streaming Impact: Highly recognized in ${match.genre}, earning ${trackTier} prominence.`,
            `Sonic Identity: Atmospherically tagged as ${match.atmosphere.join(', ')}.`,
            `Cultural Legacy: A signature standout from the album '${match.album}'.`
          ],
          tracklist: [match.title],
          tags: [match.genre.toLowerCase(), ...(match.atmosphere || [])],
          wikiSummary: `A signature standout in ${match.artist}'s catalog from the album ${match.album}.`
        };
      }
    }

    // TIER 5: Local Demo Catalog Fallback
    if (!data) {
      const q = cleanTrack.toLowerCase();
      const demo = DEMO_CATALOG.find(c =>
        q.includes(c.query) ||
        c.data.track.toLowerCase().includes(q) ||
        (cleanArtist && c.data.artist.toLowerCase().includes(cleanArtist.toLowerCase()))
      );
      if (demo) data = demo.data;
    }

    if (data) {
      _callRender(data);
      dispatch('doomchill:lookup:result', { data });
    } else {
      const notFoundData = { error: 'not_found' };
      _callRender(notFoundData);
      dispatch('doomchill:lookup:notfound', { track: cleanTrack, artist: cleanArtist });
    }
  }

  function _callRender(data) {
    if (typeof window.DoomChill?.renderLookupResult === 'function') {
      window.DoomChill.renderLookupResult(data);
    }
  }

  if (!window.DoomChill) window.DoomChill = {};
  window.DoomChill.lookupSong = lookupSong;
  window.DoomChill.demoCatalog = DEMO_CATALOG;
})();
