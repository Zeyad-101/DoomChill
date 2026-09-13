'use strict';

(function() {
  let dataset = null;

  const SAMPLE_SONGS = [
    {
      title: 'Doomsday',
      artist: 'MF DOOM',
      album: 'Operation: Doomsday',
      genre: 'Hip-Hop/Rap',
      atmosphere: ['Chill / Relaxed', 'Dark / Moody'],
      popularity: 76
    },
    {
      title: 'Rhinestone Cowboy',
      artist: 'Madvillain',
      album: 'Madvillainy',
      genre: 'Hip-Hop/Rap',
      atmosphere: ['Chill / Relaxed', 'Focus / Study'],
      popularity: 82
    },
    {
      title: 'Teardrop',
      artist: 'Massive Attack',
      album: 'Mezzanine',
      genre: 'Lo-fi/Ambient',
      atmosphere: ['Chill / Relaxed', 'Romantic'],
      popularity: 88
    },
    {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      genre: 'Pop',
      atmosphere: ['Energetic / Hype', 'Happy / Upbeat'],
      popularity: 96
    },
    {
      title: 'Starboy',
      artist: 'The Weeknd',
      album: 'Starboy',
      genre: 'R&B/Soul',
      atmosphere: ['Energetic / Hype', 'Chill / Relaxed'],
      popularity: 93
    },
    {
      title: 'Karma Police',
      artist: 'Radiohead',
      album: 'OK Computer',
      genre: 'Indie/Alternative',
      atmosphere: ['Sad / Melancholic', 'Dark / Moody'],
      popularity: 84
    },
    {
      title: 'Midnight City',
      artist: 'M83',
      album: 'Hurry Up, We\'re Dreaming',
      genre: 'Electronic/Dance',
      atmosphere: ['Happy / Upbeat', 'Energetic / Hype'],
      popularity: 89
    },
    {
      title: 'Glory Box',
      artist: 'Portishead',
      album: 'Dummy',
      genre: 'Lo-fi/Ambient',
      atmosphere: ['Chill / Relaxed', 'Dark / Moody'],
      popularity: 79
    },
    {
      title: 'Breathe',
      artist: 'Pink Floyd',
      album: 'The Dark Side of the Moon',
      genre: 'Rock',
      atmosphere: ['Chill / Relaxed', 'Focus / Study'],
      popularity: 86
    }
  ];

  fetch('data/songs.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (Array.isArray(data) && data.length) {
        dataset = data;
      }
    })
    .catch(() => {
      dataset = null;
    });

  document.addEventListener('doomchill:suggest', (e) => {
    const { atmospheres, genres } = e.detail || {};
    const pool = dataset || SAMPLE_SONGS;

    const requestedAtmosphere = (atmospheres && atmospheres.length)
      ? atmospheres
      : [window.DoomChill?.getDialMood?.() || 'Chill / Relaxed'];

    const scored = pool.map(song => {
      let score = 0;
      const songAtmos = Array.isArray(song.atmosphere) ? song.atmosphere : [song.atmosphere];

      requestedAtmosphere.forEach(req => {
        if (songAtmos.some(a => a && a.toLowerCase().includes(req.split('/')[0].trim().toLowerCase()))) {
          score += 3;
        }
      });

      if (genres && genres.length) {
        if (genres.some(g => g.toLowerCase() === song.genre.toLowerCase())) {
          score += 2;
        }
      }

      return { song, score };
    });

    let results = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (b.song.popularity || 0) - (a.song.popularity || 0))
      .map(item => item.song);

    let isRelaxed = false;

    if (!results.length) {
      isRelaxed = true;
      results = pool
        .filter(song => {
          const songAtmos = Array.isArray(song.atmosphere) ? song.atmosphere : [song.atmosphere];
          return requestedAtmosphere.some(req =>
            songAtmos.some(a => a && a.toLowerCase().includes(req.split('/')[0].trim().toLowerCase()))
          );
        })
        .slice(0, 6);
    }

    results = results.slice(0, 6);

    if (typeof window.DoomChill?.renderMoodResults === 'function') {
      window.DoomChill.renderMoodResults(results, { relaxed: isRelaxed });
    }
  });
})();
