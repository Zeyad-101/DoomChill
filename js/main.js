'use strict';

window.DoomChill = window.DoomChill || {};

const MOOD_COLORS = {
  'Dark / Moody':       { c1: '#091813', c2: '#0f271f', c3: '#18382c', dot: '0.08' },
  'Sad / Melancholic':  { c1: '#0d1f26', c2: '#15333d', c3: '#204b59', dot: '0.10' },
  'Angry / Intense':    { c1: '#1b1612', c2: '#2a1f18', c3: '#423123', dot: '0.10' },
  'Focus / Study':      { c1: '#0f2c22', c2: '#174233', c3: '#245a47', dot: '0.12' },
  'Chill / Relaxed':    { c1: '#133829', c2: '#1e4f3f', c3: '#297355', dot: '0.13' },
  'Neutral':            { c1: '#153e2f', c2: '#225d48', c3: '#348363', dot: '0.13' },
  'Romantic':           { c1: '#1a2e28', c2: '#27473e', c3: '#3e6c5c', dot: '0.12' },
  'Happy / Upbeat':     { c1: '#184f33', c2: '#27794e', c3: '#3db074', dot: '0.16' },
  'Energetic / Hype':   { c1: '#1c623d', c2: '#2e9460', c3: '#54d890', dot: '0.19' },
};

const DEFAULT_COLORS = MOOD_COLORS['Chill / Relaxed'];

function applyMoodBackground(moodName) {
  const colors = MOOD_COLORS[moodName] || DEFAULT_COLORS;
  const root = document.documentElement;
  root.style.setProperty('--mood-c1', colors.c1);
  root.style.setProperty('--mood-c2', colors.c2);
  root.style.setProperty('--mood-c3', colors.c3);
  root.style.setProperty('--mood-dot-opacity', colors.dot);
  document.body.style.backgroundColor = colors.c1;
}

(function initTabs() {
  const tabs = document.querySelectorAll('.nav__tab');
  const sections = document.querySelectorAll('.section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      tabs.forEach(t => {
        const isCurrent = t === tab;
        t.classList.toggle('nav__tab--active', isCurrent);
        t.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
      sections.forEach(s => {
        const isTarget = s.id === targetId;
        s.classList.toggle('section--active', isTarget);
        if (isTarget) {
          s.removeAttribute('hidden');
        } else {
          s.setAttribute('hidden', '');
        }
      });
    });
  });
})();

(function initDial() {
  const dial = document.getElementById('mood-dial');
  const arc = document.getElementById('dial-arc');
  const moodLabel = document.getElementById('dial-mood-label');
  const hintEl = document.getElementById('dial-hint');
  if (!dial || !arc || !moodLabel) return;

  const ARC_LEN = 453.8;

  const MOODS = [
    { label: 'Dark / Moody',       ratio: 0.00, chip: 'Dark / Moody'      },
    { label: 'Sad / Melancholic',  ratio: 0.12, chip: 'Sad / Melancholic' },
    { label: 'Angry / Intense',    ratio: 0.24, chip: 'Angry / Intense'   },
    { label: 'Focus / Study',      ratio: 0.36, chip: 'Focus / Study'     },
    { label: 'Chill / Relaxed',    ratio: 0.48, chip: 'Chill / Relaxed'   },
    { label: 'Neutral',            ratio: 0.60, chip: 'Neutral'           },
    { label: 'Romantic',           ratio: 0.72, chip: 'Romantic'          },
    { label: 'Happy / Upbeat',     ratio: 0.85, chip: 'Happy / Upbeat'    },
    { label: 'Energetic / Hype',   ratio: 1.00, chip: 'Energetic / Hype'  },
  ];

  const ARC_COLORS = [
    { ratio: 0.00, color: [65,  105, 90]  },
    { ratio: 0.12, color: [75,  115, 130] },
    { ratio: 0.24, color: [145, 95,  65]  },
    { ratio: 0.36, color: [65,  145, 115] },
    { ratio: 0.48, color: [75,  185, 135] },
    { ratio: 0.60, color: [160, 195, 100] },
    { ratio: 0.72, color: [195, 185, 110] },
    { ratio: 0.85, color: [221, 230, 99]  },
    { ratio: 1.00, color: [84,  242, 160] },
  ];

  function lerpColor(ratio) {
    let lo = ARC_COLORS[0], hi = ARC_COLORS[ARC_COLORS.length - 1];
    for (let i = 0; i < ARC_COLORS.length - 1; i++) {
      if (ratio >= ARC_COLORS[i].ratio && ratio <= ARC_COLORS[i + 1].ratio) {
        lo = ARC_COLORS[i]; hi = ARC_COLORS[i + 1]; break;
      }
    }
    const t = lo.ratio === hi.ratio ? 0 : (ratio - lo.ratio) / (hi.ratio - lo.ratio);
    const r = Math.round(lo.color[0] + (hi.color[0] - lo.color[0]) * t);
    const g = Math.round(lo.color[1] + (hi.color[1] - lo.color[1]) * t);
    const b = Math.round(lo.color[2] + (hi.color[2] - lo.color[2]) * t);
    return `rgb(${r},${g},${b})`;
  }

  function ratioToMoodObj(ratio) {
    let best = MOODS[0], minDist = Infinity;
    MOODS.forEach(m => {
      const d = Math.abs(m.ratio - ratio);
      if (d < minDist) { minDist = d; best = m; }
    });
    return best;
  }

  let currentRatio = 0.48;
  let isDragging = false;
  let hintGone = false;

  function update(ratio, syncChips = true) {
    currentRatio = Math.max(0, Math.min(1, ratio));
    arc.style.strokeDashoffset = ARC_LEN - (currentRatio * ARC_LEN);
    arc.style.stroke = lerpColor(currentRatio);

    const moodObj = ratioToMoodObj(currentRatio);
    moodLabel.textContent = moodObj.label;
    dial.setAttribute('aria-valuenow', Math.round(currentRatio * 100));

    applyMoodBackground(moodObj.label);
    window.DoomChill.currentMood = moodObj.label;

    if (syncChips && window.DoomChill.syncChipFromDial) {
      window.DoomChill.syncChipFromDial(moodObj.chip);
    }
  }

  function hideHint() {
    if (hintGone) return;
    hintGone = true;
    if (hintEl) hintEl.classList.add('dial__hint--gone');
    dial.classList.remove('dial--idle');
  }

  function ptrAngleToRatio(clientX, clientY) {
    const rect = dial.getBoundingClientRect();
    const mx = rect.left + rect.width / 2;
    const my = rect.top + rect.height / 2;
    const deg = Math.atan2(clientY - my, clientX - mx) * (180 / Math.PI);
    const norm = (deg + 360) % 360;
    const delta = (norm - 145 + 360) % 360;
    if (delta <= 250) return delta / 250;
    return delta <= 305 ? 1 : 0;
  }

  dial.addEventListener('pointerdown', e => {
    isDragging = true;
    dial.setPointerCapture(e.pointerId);
    hideHint();
    update(ptrAngleToRatio(e.clientX, e.clientY), true);
    e.preventDefault();
  });

  dial.addEventListener('pointermove', e => {
    if (!isDragging) return;
    update(ptrAngleToRatio(e.clientX, e.clientY), true);
  });

  dial.addEventListener('pointerup', () => { isDragging = false; });
  dial.addEventListener('pointercancel', () => { isDragging = false; });

  dial.addEventListener('keydown', e => {
    const step = 0.05;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      hideHint(); update(currentRatio + step, true); e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      hideHint(); update(currentRatio - step, true); e.preventDefault();
    } else if (e.key === 'Home') {
      hideHint(); update(0, true); e.preventDefault();
    } else if (e.key === 'End') {
      hideHint(); update(1, true); e.preventDefault();
    }
  });

  window.DoomChill.animateDialTo = function(targetRatio) {
    hideHint();
    const start = currentRatio;
    const diff = targetRatio - start;
    const duration = 280;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      update(start + diff * ease, false);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  update(0.48, false);

  window.DoomChill.getDialMood = () => ratioToMoodObj(currentRatio).label;
  window.DoomChill.getDialRatio = () => currentRatio;
})();

(function initChips() {
  const atmoGroup = document.getElementById('atmosphere-chips');
  const genreGroup = document.getElementById('genre-chips');

  const MOOD_TO_RATIO = {
    'Dark / Moody':      0.00,
    'Sad / Melancholic': 0.12,
    'Angry / Intense':   0.24,
    'Focus / Study':     0.36,
    'Chill / Relaxed':   0.48,
    'Neutral':           0.60,
    'Romantic':          0.72,
    'Happy / Upbeat':    0.85,
    'Energetic / Hype':  1.00,
  };

  function setupGroup(groupEl, isAtmosphere = false) {
    if (!groupEl) return;
    const chips = groupEl.querySelectorAll('.chip');
    const MAX = 2;

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const isActive = chip.classList.contains('chip--active');
        if (isActive) {
          chip.classList.remove('chip--active');
          chip.setAttribute('aria-pressed', 'false');
        } else {
          if (groupEl.querySelectorAll('.chip--active').length >= MAX) return;
          chip.classList.add('chip--active');
          chip.setAttribute('aria-pressed', 'true');

          if (isAtmosphere && window.DoomChill.animateDialTo) {
            const val = chip.dataset.value;
            if (val && MOOD_TO_RATIO[val] !== undefined) {
              window.DoomChill.animateDialTo(MOOD_TO_RATIO[val]);
            }
          }
        }

        const count = groupEl.querySelectorAll('.chip--active').length;
        chips.forEach(c => {
          if (!c.classList.contains('chip--active')) {
            c.disabled = count >= MAX;
          }
        });
      });
    });
  }

  setupGroup(atmoGroup, true);
  setupGroup(genreGroup, false);

  window.DoomChill.syncChipFromDial = function(moodName) {
    if (!atmoGroup) return;
    const activeChips = atmoGroup.querySelectorAll('.chip--active');
    if (activeChips.length <= 1) {
      atmoGroup.querySelectorAll('.chip').forEach(c => {
        const isMatch = c.dataset.value === moodName;
        c.classList.toggle('chip--active', isMatch);
        c.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
        c.disabled = false;
      });
    }
  };
})();

(function initSuggestBtn() {
  const btn = document.getElementById('suggest-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    const originalText = btn.textContent;
    btn.textContent = 'Finding tracks…';

    const atmospheres = [...document.querySelectorAll('#atmosphere-chips .chip--active')].map(c => c.dataset.value);
    const genres = [...document.querySelectorAll('#genre-chips .chip--active')].map(c => c.dataset.value);

    if (!atmospheres.length && window.DoomChill.getDialMood) {
      atmospheres.push(window.DoomChill.getDialMood());
    }

    const resetTimer = setTimeout(() => {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = originalText;
    }, 1500);

    btn._resetTimer = resetTimer;

    if (typeof window.DoomChill.suggestSongs === 'function') {
      window.DoomChill.suggestSongs(atmospheres, genres);
    } else {
      document.dispatchEvent(new CustomEvent('doomchill:suggest', {
        detail: { atmospheres, genres }
      }));
    }
  });
})();

(function initSearch() {
  const input = document.getElementById('lookup-input');
  const btn = document.getElementById('lookup-btn');
  const panel = document.getElementById('search-suggestions');

  function triggerSearch() {
    const raw = (input?.value || '').trim();
    if (!raw) return;
    if (panel) panel.setAttribute('hidden', '');

    let track = raw;
    let artist = '';
    if (raw.includes(' - ')) {
      const parts = raw.split(' - ');
      track = parts[0].trim();
      artist = parts.slice(1).join(' - ').trim();
    } else if (raw.includes('-')) {
      const parts = raw.split('-');
      track = parts[0].trim();
      artist = parts.slice(1).join('-').trim();
    } else if (/\sby\s/i.test(raw)) {
      const parts = raw.split(/\sby\s/i);
      track = parts[0].trim();
      artist = parts.slice(1).join(' by ').trim();
    }

    if (typeof window.DoomChill.lookupSong === 'function') {
      window.DoomChill.lookupSong(track, artist);
    }
  }

  if (btn) btn.addEventListener('click', triggerSearch);
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') triggerSearch();
      if (e.key === 'Escape' && panel) panel.setAttribute('hidden', '');
    });

    input.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      if (!q || !panel) {
        if (panel) panel.setAttribute('hidden', '');
        return;
      }

      const catalog = window.DoomChill.demoCatalog || [];
      const demoMatches = catalog.filter(item =>
        item.query.includes(q) ||
        item.data.track.toLowerCase().includes(q) ||
        item.data.artist.toLowerCase().includes(q)
      );

      const pool = (typeof window.DoomChill.getSongPool === 'function' && window.DoomChill.getSongPool()) || [];
      const poolMatches = [];
      const seen = new Set(demoMatches.map(m => `${m.data.artist} - ${m.data.track}`.toLowerCase()));

      for (const s of pool) {
        if (poolMatches.length + demoMatches.length >= 8) break;
        const key = `${s.artist} - ${s.title}`.toLowerCase();
        if (seen.has(key)) continue;
        if (s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)) {
          seen.add(key);
          poolMatches.push({
            data: { track: s.title, artist: s.artist, album: s.album, genre: s.genre }
          });
        }
      }

      const allMatches = [...demoMatches, ...poolMatches];

      if (!allMatches.length) {
        panel.innerHTML = `<div class="suggestion-item" style="cursor:default; opacity:0.8;"><span class="suggestion-item__title">Press Enter to look up "${esc(e.target.value)}"</span></div>`;
        panel.removeAttribute('hidden');
        return;
      }

      panel.innerHTML = allMatches.map(m => `
        <div class="suggestion-item" data-query="${esc(`${m.data.artist} - ${m.data.track}`)}">
          <span class="suggestion-item__title">${esc(m.data.track)}</span>
          <span class="suggestion-item__artist">${esc(m.data.artist)}</span>
        </div>
      `).join('');

      panel.querySelectorAll('.suggestion-item[data-query]').forEach(item => {
        item.addEventListener('click', () => {
          input.value = item.dataset.query;
          panel.setAttribute('hidden', '');
          triggerSearch();
        });
      });

      panel.removeAttribute('hidden');
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.search-wrapper') && panel) {
        panel.setAttribute('hidden', '');
      }
    });
  }
})();

const ARTWORK_CACHE = new Map();

function generateVinylCoverSvg(title, artist, genre = 'DoomChill') {
  const safeTitle = (title || 'Track').replace(/[<>&'"]/g, '');
  const safeArtist = (artist || 'Artist').replace(/[<>&'"]/g, '');
  const safeGenre = (genre || 'Music').toUpperCase().replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e4d3f" />
        <stop offset="50%" stop-color="#133829" />
        <stop offset="100%" stop-color="#091813" />
      </linearGradient>
      <radialGradient id="grooves" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#297355" stop-opacity="0.3" />
        <stop offset="60%" stop-color="#0f271f" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#07120e" />
      </radialGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#dde663" />
        <stop offset="100%" stop-color="#b8c238" />
      </linearGradient>
    </defs>
    <rect width="300" height="300" fill="url(#bg)" rx="16" />
    <circle cx="150" cy="150" r="124" fill="url(#grooves)" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
    <circle cx="150" cy="150" r="108" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />
    <circle cx="150" cy="150" r="92"  fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5" />
    <circle cx="150" cy="150" r="76"  fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
    <circle cx="150" cy="150" r="54"  fill="url(#gold)" />
    <!-- Doom mask center emblem -->
    <path d="M142,136 L158,136 L154,152 L150,158 L146,152 Z" fill="#1e4d3f" />
    <circle cx="146" cy="144" r="2.5" fill="#dde663" />
    <circle cx="154" cy="144" r="2.5" fill="#dde663" />
    <path d="M140,140 L135,148 L142,154 L145,150 Z" fill="#1e4d3f" opacity="0.9" />
    <path d="M160,140 L165,148 L158,154 L155,150 Z" fill="#1e4d3f" opacity="0.9" />
    <circle cx="150" cy="150" r="6" fill="#091813" />
    <!-- Genre pill -->
    <rect x="20" y="22" width="68" height="20" rx="10" fill="rgba(221,230,99,0.18)" stroke="rgba(221,230,99,0.35)" stroke-width="1" />
    <text x="54" y="36" font-family="'JetBrains Mono',monospace" font-size="9" font-weight="700" fill="#dde663" text-anchor="middle" letter-spacing="1">${safeGenre.slice(0, 10)}</text>
    <!-- Title and Artist overlay -->
    <text x="150" y="252" font-family="'Sora',sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">${safeTitle.length > 24 ? safeTitle.slice(0, 22) + '…' : safeTitle}</text>
    <text x="150" y="272" font-family="'Manrope',sans-serif" font-size="11" font-weight="500" fill="rgba(255,255,255,0.7)" text-anchor="middle">${safeArtist.length > 28 ? safeArtist.slice(0, 26) + '…' : safeArtist}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

async function fetchArtwork(title, artist, genre = '') {
  const cleanTitle = (title || '').trim();
  const cleanArtist = (artist || '').trim();
  const cacheKey = `${cleanArtist} - ${cleanTitle}`.toLowerCase();
  if (ARTWORK_CACHE.has(cacheKey)) return ARTWORK_CACHE.get(cacheKey);

  try {
    // 1. Search with artist + title
    const term = encodeURIComponent(`${cleanArtist ? cleanArtist + ' ' : ''}${cleanTitle}`);
    let res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.resultCount > 0 && data.results[0].artworkUrl100) {
        const artUrl = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
        ARTWORK_CACHE.set(cacheKey, artUrl);
        return artUrl;
      }
    }

    // 2. Search with artist + title (Egypt storefront fallback)
    res = await fetch(`https://itunes.apple.com/search?term=${term}&country=EG&entity=song&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.resultCount > 0 && data.results[0].artworkUrl100) {
        const artUrl = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
        ARTWORK_CACHE.set(cacheKey, artUrl);
        return artUrl;
      }
    }

    // 3. Search with title only
    const termTitle = encodeURIComponent(cleanTitle);
    res = await fetch(`https://itunes.apple.com/search?term=${termTitle}&country=EG&entity=song&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.resultCount > 0 && data.results[0].artworkUrl100) {
        const artUrl = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
        ARTWORK_CACHE.set(cacheKey, artUrl);
        return artUrl;
      }
    }
  } catch (err) {
    // Network fallback
  }

  // 3. Fallback to stylized high-resolution branded SVG vinyl cover
  const fallbackSvg = generateVinylCoverSvg(cleanTitle, cleanArtist, genre);
  ARTWORK_CACHE.set(cacheKey, fallbackSvg);
  return fallbackSvg;
}

window.DoomChill.renderMoodResults = function(songs, opts = {}) {
  const container = document.getElementById('mood-results');
  const btn = document.getElementById('suggest-btn');

  if (btn) {
    clearTimeout(btn._resetTimer);
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.textContent = 'Suggest me a song';
  }

  if (!container) return;
  container.innerHTML = '';

  if (!songs || !songs.length) {
    container.innerHTML = `
      <div class="results-empty">
        <div class="results-empty__icon" style="font-size:2rem; margin-bottom:8px;">🎧</div>
        <p style="font-family: var(--font-headline); font-size:1.15rem; color:#ffffff; margin-bottom:6px;">No exact match yet</p>
        <p style="font-size:0.9rem; color:rgba(255,255,255,0.6); max-width:440px; margin:0 auto; line-height:1.6;">
          Try adjusting the dial or deselecting a genre filter to widen the selection.
        </p>
      </div>`;
    return;
  }

  if (opts.relaxed) {
    const notice = document.createElement('p');
    notice.className = 'results-notice';
    notice.textContent = 'No exact match — showing closest atmosphere picks instead.';
    container.appendChild(notice);
  }

  songs.forEach((song, i) => {
    const card = document.createElement('article');
    card.className = 'result-card';
    card.style.setProperty('--i', i);
    card.setAttribute('aria-label', `${song.title} by ${song.artist}`);

    const blockClass = atmosphereClass(song.atmosphere);
    const tierClass = popToTierClass(song.popularity);
    const tierLabel = popToTierLabel(song.popularity);

    card.innerHTML = `
      <div class="result-card__block ${blockClass}" aria-hidden="true">
        <img class="result-card__img" alt="" loading="lazy" />
      </div>
      <div class="result-card__content">
        <p class="result-card__title" title="${esc(song.title)}">${esc(song.title)}</p>
        <p class="result-card__artist">${esc(song.artist)}</p>
        <p class="result-card__album" title="${esc(song.album)}"><span class="album-icon" aria-hidden="true">💽</span> ${esc(song.album)}</p>
        <div class="result-card__footer">
          <div class="result-card__meta">
            <span class="genre-tag">${esc(song.genre)}</span>
            <span class="tier-badge ${tierClass}">${esc(tierLabel)}</span>
          </div>
          <button class="result-card__know-more-btn" type="button" aria-label="Know more about ${esc(song.title)} by ${esc(song.artist)}">
            Know more <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>`;

    // Asynchronously enrich card with real album cover artwork
    const imgEl = card.querySelector('.result-card__img');
    fetchArtwork(song.title, song.artist, song.genre).then(artUrl => {
      if (artUrl && imgEl) {
        imgEl.src = artUrl;
        imgEl.classList.add('is-loaded');
      }
    });

    // Interaction handler: Click "Know more" button (or card)
    function goToLookup(e) {
      if (e) e.stopPropagation();

      // 1. Switch to song lookup tab
      const lookupTab = document.querySelector('.nav__tab[data-tab="song-lookup"]');
      if (lookupTab) lookupTab.click();

      // 2. Set search input
      const input = document.getElementById('lookup-input');
      if (input) input.value = `${song.artist} - ${song.title}`;

      // 3. Trigger lookup
      if (typeof window.DoomChill.lookupSong === 'function') {
        window.DoomChill.lookupSong(song.title, song.artist);
      }

      // 4. Smooth scroll to lookup result
      const lookupResult = document.getElementById('lookup-result');
      if (lookupResult) {
        setTimeout(() => {
          lookupResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    }

    const knowMoreBtn = card.querySelector('.result-card__know-more-btn');
    if (knowMoreBtn) knowMoreBtn.addEventListener('click', goToLookup);
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.result-card__know-more-btn')) {
        goToLookup(e);
      }
    });

    container.appendChild(card);
  });

  if (window.innerWidth < 768) {
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

window.DoomChill.renderLookupResult = function(data) {
  const container = document.getElementById('lookup-result');
  if (!container) return;
  container.innerHTML = '';

  if (data.error === 'not_found') {
    container.innerHTML = `
      <div class="lookup-error">
        <div class="lookup-error__icon">🔍</div>
        <p class="lookup-error__title">Couldn't find that one</p>
        <p class="lookup-error__body">Check the spelling or try searching by title or artist — e.g. <em>"Blinding Lights"</em> or <em>"MF DOOM"</em></p>
      </div>`;
    return;
  }

  if (data.error === 'api_error') {
    container.innerHTML = `
      <div class="lookup-error">
        <div class="lookup-error__icon">⚡</div>
        <p class="lookup-error__title">Something went wrong</p>
        <p class="lookup-error__body">Couldn't reach Last.fm right now — try again in a moment.</p>
      </div>`;
    return;
  }

  const trackTierClass = tierToClass(data.trackTier);
  const albumTierClass = tierToClass(data.albumTier);

  // Extract primary fact
  const primaryFact = data.funFacts && data.funFacts.length > 0
    ? data.funFacts[0]
    : (data.wikiSummary ? stripWiki(data.wikiSummary, 220) : `A signature standout in ${data.artist}'s catalog.`);

  // Compute gauge values
  const stats = data.stats || {};
  const popPct = stats.popularityPct || Math.min(99, Math.max(30, Math.round((Math.log10(Math.max(data.playcount || 1, 10)) / 7.8) * 100)));
  const listPct = stats.listenersPct || Math.min(98, Math.max(25, Math.round((Math.log10(Math.max(data.listeners || 1, 10)) / 6.8) * 100)));
  const playPct = stats.playcountPct || Math.min(98, Math.max(35, Math.round(data.listeners ? Math.min(95, (data.playcount / data.listeners) * 5) : 60)));

  const card = document.createElement('div');
  card.className = 'song-card';
  card.innerHTML = `
    <div class="song-card__art" aria-hidden="true">
      ${data.image ? `<img src="${esc(data.image)}" alt="${esc(data.track)}" loading="lazy" />` : ''}
    </div>
    <div class="song-card__info">
      <div class="song-card__header">
        <div class="song-card__title-group">
          <h2 class="song-card__title">${esc(data.track)}</h2>
          <p class="song-card__artist">${esc(data.artist)}</p>
        </div>
        <a class="song-card__know-more-link" href="https://www.last.fm/music/${encodeURIComponent(data.artist)}/_/${encodeURIComponent(data.track)}" target="_blank" rel="noopener" aria-label="Know more about ${esc(data.track)} on Last.fm">
          know more <span aria-hidden="true">&gt;</span>
        </a>
      </div>

      <p class="song-card__meta-line">
        Released: ${esc(data.releaseYear || 'Recent')} • Album: ${esc(data.album || 'Single / LP')} • Duration: ${esc(data.duration || '3:30')}
      </p>

      <div class="song-card__player-bar">
        <button class="audio-preview-btn ${data.audioPreview ? '' : 'audio-preview-btn--disabled'}" type="button" aria-label="${data.audioPreview ? 'Play 30-second preview' : 'No preview available'}" ${data.audioPreview ? '' : 'disabled'}>
          <span class="preview-btn-icon" aria-hidden="true">▶</span>
          <span class="preview-btn-label">${data.audioPreview ? 'Play 30s Preview' : 'No Preview Available'}</span>
          <div class="soundwave-bars" aria-hidden="true">
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
          </div>
        </button>
        <div class="song-card__stream-links">
          ${data.itunesUrl ? `<a class="stream-badge stream-badge--apple" href="${esc(data.itunesUrl)}" target="_blank" rel="noopener">Apple Music <span aria-hidden="true">↗</span></a>` : ''}
          <a class="stream-badge stream-badge--lastfm" href="https://www.last.fm/music/${encodeURIComponent(data.artist)}/_/${encodeURIComponent(data.track)}" target="_blank" rel="noopener">Last.fm <span aria-hidden="true">↗</span></a>
        </div>
      </div>

      <div class="song-card__gauges">
        <div class="stat-gauge">
          <div class="stat-gauge__meta">
            <span class="stat-gauge__label">Popularity Score</span>
            <span class="stat-gauge__val">${popPct}%</span>
          </div>
          <div class="stat-gauge__track">
            <div class="stat-gauge__fill" style="width: ${popPct}%;"></div>
          </div>
        </div>

        <div class="stat-gauge">
          <div class="stat-gauge__meta">
            <span class="stat-gauge__label">Listener Reach</span>
            <span class="stat-gauge__val">${fmtNum(data.listeners)} listeners (${listPct}%)</span>
          </div>
          <div class="stat-gauge__track">
            <div class="stat-gauge__fill" style="width: ${listPct}%;"></div>
          </div>
        </div>

        <div class="stat-gauge">
          <div class="stat-gauge__meta">
            <span class="stat-gauge__label">Play Frequency</span>
            <span class="stat-gauge__val">${fmtNum(data.playcount)} scrobbles (${playPct}%)</span>
          </div>
          <div class="stat-gauge__track">
            <div class="stat-gauge__fill" style="width: ${playPct}%;"></div>
          </div>
        </div>
      </div>

      <hr class="song-card__divider" />

      <div class="song-card__rating-row">
        <span class="song-card__rating-label">Overall rating :</span>
        <span class="tier-badge ${trackTierClass}">${esc(data.trackTier)}</span>
        ${data.album ? `<span class="song-card__rating-label" style="margin-left:var(--sp-4);">Album rating :</span><span class="tier-badge ${albumTierClass}">${esc(data.albumTier)}</span>` : ''}
      </div>

      <div class="song-card__funfact-block">
        <span class="song-card__funfact-label">fun fact :</span>
        <p class="song-card__funfact-text">${esc(primaryFact)}</p>
      </div>

      <div class="song-card__tags-row">
        <span class="genre-tag">${esc(data.genre || 'Music')}</span>
        ${(data.tags || []).slice(0, 4).map(t => `<span class="tag-chip">#${esc(t)}</span>`).join('')}
      </div>
    </div>`;

  if (!data.image) {
    const artContainer = card.querySelector('.song-card__art');
    fetchArtwork(data.track, data.artist, data.genre).then(url => {
      if (url && artContainer && !artContainer.querySelector('img')) {
        artContainer.innerHTML = `<img src="${esc(url)}" alt="${esc(data.track)}" loading="lazy" />`;
      }
    });
  }

  // Audio Preview Player Controller
  const previewBtn = card.querySelector('.audio-preview-btn');
  if (previewBtn && data.audioPreview) {
    previewBtn.addEventListener('click', () => {
      const isPlaying = previewBtn.classList.contains('is-playing');
      const discs = document.querySelectorAll('.vinyl-disc');
      const icon = previewBtn.querySelector('.preview-btn-icon');
      const lbl = previewBtn.querySelector('.preview-btn-label');

      if (isPlaying) {
        if (window._doomchillAudio) {
          window._doomchillAudio.pause();
          window._doomchillAudio = null;
        }
        previewBtn.classList.remove('is-playing');
        if (icon) icon.textContent = '▶';
        if (lbl) lbl.textContent = 'Play 30s Preview';
        discs.forEach(d => d.classList.remove('is-spinning'));
      } else {
        if (window._doomchillAudio) {
          window._doomchillAudio.pause();
        }
        document.querySelectorAll('.audio-preview-btn.is-playing').forEach(b => {
          b.classList.remove('is-playing');
          const bi = b.querySelector('.preview-btn-icon');
          const bl = b.querySelector('.preview-btn-label');
          if (bi) bi.textContent = '▶';
          if (bl) bl.textContent = 'Play 30s Preview';
        });

        const audio = new Audio(data.audioPreview);
        window._doomchillAudio = audio;
        previewBtn.classList.add('is-playing');
        if (icon) icon.textContent = '❚❚';
        if (lbl) lbl.textContent = 'Playing (30s)...';
        discs.forEach(d => d.classList.add('is-spinning'));

        audio.onended = () => {
          previewBtn.classList.remove('is-playing');
          if (icon) icon.textContent = '▶';
          if (lbl) lbl.textContent = 'Play 30s Preview';
          discs.forEach(d => d.classList.remove('is-spinning'));
          window._doomchillAudio = null;
        };

        audio.onerror = () => {
          previewBtn.classList.remove('is-playing');
          if (icon) icon.textContent = '▶';
          if (lbl) lbl.textContent = 'Play 30s Preview';
          discs.forEach(d => d.classList.remove('is-spinning'));
          window._doomchillAudio = null;
        };

        audio.play().catch(err => {
          console.warn('Audio play failed:', err);
          previewBtn.classList.remove('is-playing');
          if (icon) icon.textContent = '▶';
          if (lbl) lbl.textContent = 'Play 30s Preview';
          discs.forEach(d => d.classList.remove('is-spinning'));
        });
      }
    });
  }

  container.appendChild(card);
  container.appendChild(buildArtistSection(data));
};

function buildArtistSection(data) {
  const section = document.createElement('div');
  section.className = 'artist-section';

  const defaultImgHtml = data.image
    ? `<img src="${esc(data.image)}" alt="${esc(data.album || data.artist)}" loading="lazy" />`
    : '';

  const artistImgHtml = data.artistPhoto
    ? `<img class="artist-card__portrait" src="${esc(data.artistPhoto)}" alt="${esc(data.artist)}" loading="lazy" />`
    : defaultImgHtml;

  const facts = data.funFacts && data.funFacts.length >= 3
    ? data.funFacts
    : [
        `Streaming Impact: Over ${fmtNum(data.playcount)} global scrobbles and ${fmtNum(data.listeners)} listeners, achieving ${data.trackTier} on Last.fm.`,
        `Production & Sound: Built around signature ${data.genre || 'melodic'} arrangements with evocative instrumentation.`,
        data.wikiSummary ? stripWiki(data.wikiSummary, 180) : `Cultural Legacy: A revered release in ${data.artist}'s catalog.`
      ];

  const tracklist = data.tracklist && data.tracklist.length > 0
    ? data.tracklist.slice(0, 5)
    : [data.track];

  const cards = [
    // Card 1: The Artist Himself (Real Portrait Photo)
    {
      dir: 'from-left',
      html: `
        <div class="artist-card__visual artist-card__visual--portrait" aria-hidden="true">${artistImgHtml}</div>
        <div class="artist-card__content">
          <p class="eyebrow">The Artist Himself</p>
          <h3 class="artist-card__name">${esc(data.artist)}</h3>
          <p class="artist-card__bio">${data.artistBio ? esc(stripWiki(data.artistBio, 220)) : (data.wikiSummary ? esc(stripWiki(data.wikiSummary, 220)) : 'Discover more artist details on Last.fm.')}</p>
          <div class="artist-card__stat-pill">
            <span class="pill-dot"></span> ${fmtNum(data.artistListeners || data.listeners)} Last.fm listeners
          </div>
        </div>`
    },
    // Card 2: Fun facts about the song or the album
    {
      dir: 'from-right',
      html: `
        <div class="artist-card__content">
          <p class="eyebrow">Fun Facts About The Song Or Album</p>
          <ol class="trivia-list">
            <li class="trivia-item">
              <span class="trivia-item__num">1.</span>
              <div class="trivia-item__text">
                <span class="trivia-item__bold">Impact:</span> ${esc(facts[0])}
              </div>
            </li>
            <li class="trivia-item">
              <span class="trivia-item__num">2.</span>
              <div class="trivia-item__text">
                <span class="trivia-item__bold">Production:</span> ${esc(facts[1])}
              </div>
            </li>
            <li class="trivia-item">
              <span class="trivia-item__num">3.</span>
              <div class="trivia-item__text">
                <span class="trivia-item__bold">Legacy:</span> ${esc(facts[2])}
              </div>
            </li>
          </ol>
        </div>
        <div class="artist-card__visual artist-card__visual--accent" aria-hidden="true">${defaultImgHtml}</div>`
    },
    // Card 3: Album / Hits tracklist with Vinyl Record Graphic!
    {
      dir: 'from-left',
      html: `
        <div class="vinyl-sleeve-container" aria-hidden="true">
          <div class="vinyl-sleeve">${defaultImgHtml}</div>
          <div class="vinyl-disc">
            <div class="vinyl-groove vinyl-groove--1"></div>
            <div class="vinyl-groove vinyl-groove--2"></div>
            <div class="vinyl-label">
              <span class="vinyl-label__title">${esc(data.album || data.track)}</span>
              <span class="vinyl-hole"></span>
            </div>
          </div>
        </div>
        <div class="artist-card__content">
          <p class="eyebrow">Album / Hits Tracklist</p>
          <h3 class="artist-card__name" style="font-size:1.35rem; margin-bottom:var(--sp-3);">${esc(data.album || `${data.artist} Hits`)}</h3>
          <ul class="tracklist">
            ${tracklist.map((t, idx) => `
              <li class="tracklist-item ${t.toLowerCase() === data.track.toLowerCase() ? 'tracklist-item--active' : ''}">
                <span class="tracklist-item__num">${idx + 1}.</span>
                <span class="tracklist-item__name">${esc(t)}</span>
                ${t.toLowerCase() === data.track.toLowerCase() ? '<span class="now-playing-dot" title="Current track"></span>' : ''}
              </li>
            `).join('')}
          </ul>
        </div>`
    }
  ];

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  cards.forEach(({ dir, html }) => {
    const el = document.createElement('div');
    el.className = `artist-card artist-card--${dir}`;
    el.innerHTML = html;
    section.appendChild(el);
    io.observe(el);
  });

  // Asynchronous background photo fallback for Card 1 if artist photo missing
  if (!data.artistPhoto) {
    const isAr = /[\u0600-\u06FF]/.test(data.artist);
    const domains = isAr ? ['ar', 'en'] : ['en', 'ar'];
    for (const d of domains) {
      fetch(`https://${d}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.artist)}`)
        .then(r => r.json())
        .then(w => {
          const photo = w.thumbnail?.source || w.originalimage?.source;
          if (photo) {
            const v = section.querySelector('.artist-card:first-child .artist-card__visual');
            if (v && !v.querySelector('.artist-card__portrait')) {
              v.innerHTML = `<img class="artist-card__portrait" src="${esc(photo)}" alt="${esc(data.artist)}" loading="lazy" />`;
            }
          }
        })
        .catch(() => {});
    }
  }

  // Artwork fallback for sleeves and visuals
  if (!data.image) {
    fetchArtwork(data.album || data.track, data.artist, data.genre).then(url => {
      if (url) {
        section.querySelectorAll('.artist-card__visual:not(.artist-card__visual--portrait), .vinyl-sleeve').forEach(box => {
          if (!box.querySelector('img')) {
            box.innerHTML = `<img src="${esc(url)}" alt="${esc(data.album || data.artist)}" loading="lazy" />`;
          }
        });
      }
    });
  }

  return section;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function atmosphereClass(atm) {
  const tag = Array.isArray(atm) ? atm[0] : atm;
  const map = {
    'Happy / Upbeat':    'mood-happy',
    'Chill / Relaxed':   'mood-chill',
    'Sad / Melancholic': 'mood-sad',
    'Energetic / Hype':  'mood-energetic',
    'Angry / Intense':   'mood-angry',
    'Romantic':          'mood-romantic',
    'Focus / Study':     'mood-focus',
    'Dark / Moody':      'mood-dark',
  };
  return map[tag] || 'mood-neutral';
}

function popToTierLabel(p) {
  const n = Number(p) || 0;
  if (n >= 90) return 'Global Hit';
  if (n >= 70) return 'Very Popular';
  if (n >= 40) return 'Well-Known';
  if (n >= 15) return 'Niche Favorite';
  return 'Deep Cut';
}

function popToTierClass(p) { return tierToClass(popToTierLabel(p)); }

function tierToClass(label) {
  const map = {
    'Global Hit':     'tier-badge--global-hit',
    'Very Popular':   'tier-badge--very-popular',
    'Well-Known':     'tier-badge--well-known',
    'Niche Favorite': 'tier-badge--niche-favorite',
    'Deep Cut':       'tier-badge--deep-cut',
  };
  return map[label] || 'tier-badge--deep-cut';
}

function fmtNum(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000)     return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
}

function stripWiki(text, max) {
  const clean = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max).replace(/\s\S*$/, '') + '…';
}
