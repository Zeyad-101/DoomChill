---
name: doomchill-frontend
description: >-
  Use this skill when working on the DoomChill project's visual/frontend layer.
  Covers HTML structure, CSS design system implementation, vanilla JS UI components,
  the mood dial, result cards, animations, and responsive layout for the DoomChill music app.
---

# DoomChill Frontend Skill

This skill is the source of truth for building the DoomChill visual layer.
Always read `DoomChill-Design-Reference.md` and `DoomChill-Plan.md` in the project root before starting any component work.

---

## Stack

- **HTML5** — semantic, no inline styles, single `index.html` with two sections toggled via JS
- **CSS3** — `css/styles.css`, custom properties, `@keyframes`, `transform`/`opacity` only
- **Vanilla JS** — `js/main.js` for tab switching; render functions called by logic team

---

## Component Build Order

Build in this order to avoid blocking the logic team:

1. `index.html` skeleton (nav, two sections, font imports)
2. CSS tokens block (all `--color-*` + `--font-*` + spacing vars)
3. Navigation bar
4. Mood Suggester section HTML
5. Mood Dial (SVG + CSS + drag JS)
6. Mood/Genre chips
7. Result cards + stagger animation
8. Song Lookup section HTML
9. Search input + suggestions panel
10. Song info card (two-zone)
11. Artist/Album 3-card stack
12. Background gradient drift
13. Responsive pass (mobile breakpoints)

---

## Mood Dial Implementation Notes

The dial is an SVG `<circle>` with a `stroke-dasharray` arc:
- Full circumference = `2π × r`
- Filled arc = `(selectedValue / maxValue) × circumference`
- Drag angle → mood value mapping using `Math.atan2` on pointer events
- Arc color → interpolate between `--color-neutral` (Chill end) and `--color-accent` (Hype end) using `oklch()` or linear interpolation in JS
- Center label updates via `textContent` — no DOM re-render

---

## Render Functions (your responsibility to implement these)

The logic team calls these. You must implement them in `js/main.js` or a dedicated `js/render.js`:

```js
window.DoomChill = window.DoomChill || {};

// Called by moodSuggester.js
window.DoomChill.renderMoodResults = function(songs, { relaxed }) { ... }

// Called by songLookup.js  
window.DoomChill.renderLookupResult = function(data) { ... }
```

---

## Animation Checklist

- [ ] Background gradient drift — `@keyframes` on `background-position`, always running
- [ ] Dial ring idle pulse — subtle `@keyframes` scale, stops after first drag
- [ ] Result cards stagger — `animation-delay: calc(var(--i) * 70ms)` per card
- [ ] Search suggestions panel — `opacity` + `translateY(−8px)` → `translateY(0)` on open
- [ ] Song info card two-stage — basic info instant, fun-fact block delayed 400ms
- [ ] Artist/album 3-card sideways — `translateX(±50px)` + `opacity`, on `IntersectionObserver`
- [ ] All: `@media (prefers-reduced-motion: reduce)` collapses to instant

---

## Tier Badge Colors

| Tier | Style |
|---|---|
| Global Hit | `background: var(--color-accent); color: var(--color-text-on-accent)` |
| Very Popular | `background: var(--color-primary); color: var(--color-text-primary)` |
| Well-Known | `background: var(--color-neutral); color: var(--color-text-primary)` |
| Niche Favorite | `background: var(--color-earth); color: var(--color-text-primary)` |
| Deep Cut | `border: 1px solid var(--color-neutral); background: transparent` |
