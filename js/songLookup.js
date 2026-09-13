'use strict';

(function() {
  const PROXY_URL = '/api/lookup';

  const lookupBtn = document.getElementById('lookup-btn');
  const lookupInput = document.getElementById('lookup-input');
  const suggestionsPanel = document.getElementById('search-suggestions');

  const DEMO_CATALOG = [
    {
      query: 'blinding lights',
      data: {
        track: 'Blinding Lights',
        artist: 'The Weeknd',
        genre: 'Synthpop / R&B',
        trackTier: 'Global Hit',
        album: 'After Hours',
        albumTier: 'Global Hit',
        listeners: 4320000,
        playcount: 48900000,
        duration: 200040,
        tags: ['synthpop', '80s', 'electronic', 'pop'],
        wikiSummary: 'Blinding Lights is an iconic synthwave track recorded by Canadian singer the Weeknd for his fourth studio album After Hours. Released as the second single, it broke historical records on the Billboard Hot 100.'
      }
    },
    {
      query: 'doomsday',
      data: {
        track: 'Doomsday',
        artist: 'MF DOOM',
        genre: 'Hip-Hop / Underground',
        trackTier: 'Well-Known',
        album: 'Operation: Doomsday',
        albumTier: 'Niche Favorite',
        listeners: 1250000,
        playcount: 9800000,
        duration: 298000,
        tags: ['hip hop', 'underground hip hop', 'mf doom'],
        wikiSummary: 'Doomsday is the lead track from MF DOOM\'s seminal 1999 debut solo album Operation: Doomsday, recorded in the wake of KMD\'s dissolution. It features a Sade sample and legendary flow.'
      }
    },
    {
      query: 'starboy',
      data: {
        track: 'Starboy',
        artist: 'The Weeknd ft. Daft Punk',
        genre: 'R&B / Electronic',
        trackTier: 'Global Hit',
        album: 'Starboy',
        albumTier: 'Global Hit',
        listeners: 3900000,
        playcount: 38000000,
        duration: 230450,
        tags: ['rnb', 'pop', 'electronic'],
        wikiSummary: 'Starboy is a song recorded by the Weeknd for his third studio album of the same name. Featuring French electronic duo Daft Punk, it topped charts internationally.'
      }
    },
    {
      query: 'teardrop',
      data: {
        track: 'Teardrop',
        artist: 'Massive Attack',
        genre: 'Trip-Hop / Ambient',
        trackTier: 'Very Popular',
        album: 'Mezzanine',
        albumTier: 'Very Popular',
        listeners: 2100000,
        playcount: 17400000,
        duration: 330000,
        tags: ['trip hop', 'downtempo', 'ambient'],
        wikiSummary: 'Teardrop is a song by English trip-hop group Massive Attack, featuring vocals by Elizabeth Fraser of the Cocteau Twins. Released as the second single from Mezzanine, it remains a landmark downtempo classic.'
      }
    }
  ];

  function showSuggestions(filterText) {
    if (!suggestionsPanel) return;
    const clean = (filterText || '').trim().toLowerCase();

    if (!clean) {
      suggestionsPanel.setAttribute('hidden', '');
      return;
    }

    const matches = DEMO_CATALOG.filter(c =>
      c.query.includes(clean) ||
      c.data.track.toLowerCase().includes(clean) ||
      c.data.artist.toLowerCase().includes(clean)
    );

    if (!matches.length) {
      suggestionsPanel.innerHTML = `
        <div class="suggestion-item" style="cursor:default; opacity:0.8;">
          <span class="suggestion-item__title">Press Enter to search "${esc(filterText)}"</span>
        </div>`;
      suggestionsPanel.removeAttribute('hidden');
      return;
    }

    suggestionsPanel.innerHTML = matches.map(m => `
      <div class="suggestion-item" data-query="${esc(m.data.track)}">
        <span class="suggestion-item__title">${esc(m.data.track)}</span>
        <span class="suggestion-item__artist">${esc(m.data.artist)}</span>
      </div>
    `).join('');

    suggestionsPanel.querySelectorAll('.suggestion-item[data-query]').forEach(item => {
      item.addEventListener('click', () => {
        if (lookupInput) lookupInput.value = item.dataset.query;
        suggestionsPanel.setAttribute('hidden', '');
        doLookup();
      });
    });

    suggestionsPanel.removeAttribute('hidden');
  }

  function doLookup() {
    const query = lookupInput?.value?.trim();
    if (!query) return;

    if (suggestionsPanel) suggestionsPanel.setAttribute('hidden', '');

    const [track, ...rest] = query.split('-');
    const artist = rest.join('-').trim();

    fetch(`${PROXY_URL}?track=${encodeURIComponent(track.trim())}&artist=${encodeURIComponent(artist)}`)
      .then(r => {
        if (!r.ok) throw new Error('API unavailable');
        return r.json();
      })
      .then(data => {
        if (typeof window.DoomChill?.renderLookupResult === 'function') {
          window.DoomChill.renderLookupResult(data);
        }
      })
      .catch(() => {
        const lower = query.toLowerCase();
        const found = DEMO_CATALOG.find(c =>
          lower.includes(c.query) ||
          c.data.track.toLowerCase().includes(lower) ||
          c.data.artist.toLowerCase().includes(lower)
        );

        if (found) {
          window.DoomChill?.renderLookupResult?.(found.data);
        } else {
          window.DoomChill?.renderLookupResult?.({ error: 'not_found' });
        }
      });
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  if (lookupBtn) lookupBtn.addEventListener('click', doLookup);
  if (lookupInput) {
    lookupInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLookup();
      if (e.key === 'Escape' && suggestionsPanel) {
        suggestionsPanel.setAttribute('hidden', '');
      }
    });

    lookupInput.addEventListener('input', e => {
      showSuggestions(e.target.value);
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.search-wrapper') && suggestionsPanel) {
        suggestionsPanel.setAttribute('hidden', '');
      }
    });
  }
})();
