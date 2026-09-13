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
    }, 1200);

    btn._resetTimer = resetTimer;

    document.dispatchEvent(new CustomEvent('doomchill:suggest', {
      detail: { atmospheres, genres }
    }));
  });
})();

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
      <div class="result-card__block ${blockClass}" aria-hidden="true"></div>
      <div class="result-card__content">
        <p class="result-card__title" title="${esc(song.title)}">${esc(song.title)}</p>
        <p class="result-card__artist">${esc(song.artist)}</p>
        <div class="result-card__meta">
          <span class="genre-tag">${esc(song.genre)}</span>
          <span class="tier-badge ${tierClass}">${esc(tierLabel)}</span>
        </div>
      </div>`;
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
        <p class="lookup-error__body">Check the spelling or try adding the artist — e.g. <em>"Blinding Lights Weeknd"</em></p>
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
  const wiki = data.wikiSummary ? stripWiki(data.wikiSummary, 240) : '';

  const card = document.createElement('div');
  card.className = 'song-card';
  card.innerHTML = `
    <div class="song-card__art" aria-hidden="true"></div>
    <div class="song-card__info">
      <h2 class="song-card__title">${esc(data.track)}</h2>
      <p class="song-card__artist">${esc(data.artist)}</p>

      <div class="song-card__stats">
        <div class="song-stat">
          <span class="song-stat__label">Listeners</span>
          <span class="song-stat__value">${fmtNum(data.listeners)}</span>
        </div>
        <div class="song-stat">
          <span class="song-stat__label">Plays</span>
          <span class="song-stat__value">${fmtNum(data.playcount)}</span>
        </div>
        ${data.duration ? `<div class="song-stat">
          <span class="song-stat__label">Duration</span>
          <span class="song-stat__value">${fmtMs(data.duration)}</span>
        </div>` : ''}
      </div>

      <hr class="song-card__divider" />

      <div class="song-card__rating">
        <span class="song-card__rating-label">Track</span>
        <span class="tier-badge ${trackTierClass}">${esc(data.trackTier)}</span>
        ${data.album ? `<span class="song-card__rating-label">Album</span>
        <span class="tier-badge ${albumTierClass}">${esc(data.albumTier)}</span>` : ''}
      </div>

      ${wiki ? `<div class="song-card__funfact">
        <p class="song-card__funfact-text">${esc(wiki)}</p>
        <p class="song-card__attribution">via <a href="https://www.last.fm" target="_blank" rel="noopener">Last.fm</a></p>
      </div>` : ''}

      <ul class="song-card__bullets">
        ${data.genre ? `<li class="data-bullet">Genre: ${esc(data.genre)}</li>` : ''}
        ${data.tags?.length ? `<li class="data-bullet">Tags: ${data.tags.slice(0,4).map(esc).join(', ')}</li>` : ''}
        <li class="data-bullet">${fmtNum(data.listeners)} listeners on Last.fm</li>
        <li class="data-bullet">Played ${fmtNum(data.playcount)} times total</li>
        ${data.album ? `<li class="data-bullet">Album: ${esc(data.album)}</li>` : ''}
      </ul>
    </div>`;

  container.appendChild(card);

  if (data.album) {
    container.appendChild(buildArtistSection(data));
  }
};

function buildArtistSection(data) {
  const section = document.createElement('div');
  section.className = 'artist-section';

  const cards = [
    { dir: 'from-left', html: `
      <div class="artist-card__image" aria-hidden="true"></div>
      <div class="artist-card__content">
        <p class="eyebrow">The Artist</p>
        <h3 class="artist-card__name">${esc(data.artist)}</h3>
        <p class="artist-card__bio">${data.wikiSummary ? esc(stripWiki(data.wikiSummary, 180)) : 'Discover more on Last.fm.'}</p>
      </div>` },
    { dir: 'from-right', html: `
      <div class="artist-card__content">
        <p class="eyebrow">The Album</p>
        <h3 class="artist-card__name">${esc(data.album)}</h3>
        <div class="song-card__rating" style="margin-top:8px;">
          <span class="song-card__rating-label">Rating</span>
          <span class="tier-badge ${tierToClass(data.albumTier)}">${esc(data.albumTier)}</span>
        </div>
      </div>
      <div class="artist-card__image" aria-hidden="true"></div>` },
    { dir: 'from-left', html: `
      <div class="artist-card__image" aria-hidden="true"></div>
      <div class="artist-card__content">
        <p class="eyebrow">Tracklist</p>
        <p class="artist-card__name" style="font-size:1.15rem;">${esc(data.album)}</p>
        <ul class="tracklist">
          <li class="tracklist-item">
            <span class="tracklist-item__num">1.</span>
            <span class="tracklist-item__name">${esc(data.track)}</span>
          </li>
        </ul>
      </div>` },
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

function fmtMs(ms) {
  const s = Math.round(Number(ms) / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

function stripWiki(text, max) {
  const clean = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max).replace(/\s\S*$/, '') + '…';
}
