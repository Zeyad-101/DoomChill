# DoomChill — Project Rules (Always Active)

These rules apply to every AI session in this project, regardless of which model is used.

---

## 🎯 Project Identity

**DoomChill** is a dark-themed, static music discovery web app.
- No frameworks. No build step for the front-end. Vanilla **HTML / CSS / JS only**.
- The only back-end is a single **Vercel serverless function** (`api/lookup.js`) — a Last.fm proxy.
- No React, Vue, Angular, Svelte, jQuery, Bootstrap, or any external CSS/JS library except **Google Fonts**.

---

## 🎨 Design System (NEVER deviate from this)

### Color Tokens — always use CSS custom properties, never raw hex values in components
```
--color-surface-dark:   #1e4d3f   /* Page base / hero background */
--color-primary:        #297355   /* Panels, secondary surfaces */
--color-neutral:        #818ca6   /* Card surfaces, secondary text, borders */
--color-accent:         #dde663   /* CTAs, active states — USE SPARINGLY */
--color-earth:          #7d5439   /* Tags, dividers — very sparingly */
--color-text-primary:   #ffffff
--color-text-on-accent: #1e4d3f   /* Text ON chartreuse buttons */
```

### Typography — Google Fonts only
- **Sora 700** → headlines, song titles
- **Manrope 400/500** → body copy, descriptions
- **JetBrains Mono 500** → eyebrow labels, stat numbers, tier badges, data bullets

### Spacing — 4pt base scale only
`4, 8, 12, 16, 24, 32, 48, 64px` — no arbitrary values.

### Border radius — one value site-wide
`16px` everywhere (result cards, song-info card, search panel, chips). Do not vary per component.

---

## ⚡ Animation Rules (CSS only — no JS animation libraries)

Only animate `transform` and `opacity`. Nothing else.
No bounce/overshoot easing — settle on `ease-out` only.
Respect `prefers-reduced-motion` on all staggered/ambient animations.

**The only 4 motion primitives allowed:**
1. Mood dial drag (real-time arc + color + label update)
2. Staggered card fade + slight upward slide (`~60–80ms` offset per card)
3. Alternating sideways entrance for the 3-card artist/album stack (left→right→left, `~40–60px`)
4. Background gradient drift (slow, ambient, always running)

If an element is not listed in the animation table in `DoomChill-Design-Reference.md`, it does **not** animate.

---

## 🏗 File Ownership (never mix concerns)

| File | Responsibility |
|---|---|
| `index.html` | HTML structure only — no inline styles |
| `css/styles.css` | All styling, tokens, animations |
| `js/main.js` | Tab switching, shared UI init |
| `js/moodSuggester.js` | Matching logic only — no CSS/styling |
| `js/songLookup.js` | API call + pass data to render functions — no CSS/styling |
| `api/lookup.js` | Serverless proxy — no front-end logic |
| `scripts/build-dataset.js` | One-time data pipeline — never shipped to browser |

---

## 🔒 Security Rules (NEVER break these)

- The Last.fm API key lives **only** in Vercel environment variables (`process.env.LASTFM_KEY`).
- **Never** put the API key in any front-end file, comment, or git-tracked file.
- Add `scripts/raw-data/` to `.gitignore` — the Kaggle CSV is too large and not needed in the repo.
- `data/songs.json` **is** committed to the repo — the browser needs it.

---

## 🧩 Interface Contract Between Features

The JS modules communicate only through these agreed-upon interfaces:

```js
// moodSuggester.js → visuals team renders:
window.DoomChill.renderMoodResults(songs, { relaxed: Boolean })
// songs = [{ title, artist, album, genre, atmosphere[], popularity }]

// songLookup.js → visuals team renders:
window.DoomChill.renderLookupResult(data)
// data = { track, artist, genre, trackTier, album, albumTier,
//          listeners, playcount, tags, wikiSummary, duration }
//   OR  = { error: 'not_found' | 'api_error' }
```

---

## ✅ Definition of Done per Phase

- **Phase 1:** `data/songs.json` exists, ~1000+ entries, all have `atmosphere[]` (never empty — fallback is `['Neutral']`)
- **Phase 2:** Mood suggester returns results in < 50ms; empty-result fallback works
- **Phase 3:** Proxy deployed on Vercel, API key never exposed client-side, no-match handled gracefully
- **Phase 4:** All 4 animation primitives implemented; passes `prefers-reduced-motion`; mobile-responsive
- **Phase 5:** End-to-end test passes for both features on the live deployed URL
