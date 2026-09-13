/**
 * js/moodSuggester.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DoomChill — Mood Suggester logic
 *
 * Loads data/songs.json once on page load, then scores and returns matching
 * songs when the user submits the mood + genre form.
 *
 * Public API (all on window.DoomChill):
 *   suggestSongs(moods, genres)  → void  (triggers render + event)
 *   getSuggestions(moods, genres) → { songs, relaxed }  (pure, sync after load)
 *
 * DOM events dispatched on document:
 *   doomchill:moodresults   → detail: { songs, relaxed }
 *   doomchill:suggester:loading  (dataset still being fetched)
 *   doomchill:suggester:error    → detail: { message }
 *
 * Expected call from visuals team once the user submits:
 *   window.DoomChill.suggestSongs(['Happy / Upbeat', 'Chill / Relaxed'], ['Pop'])
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

(function moodSuggesterModule() {
  // ── Constants ────────────────────────────────────────────────────────────────
  const DATA_URL      = './data/songs.json';
  const MIN_RESULTS   = 5;
  const MAX_RESULTS   = 8;

  // ── Module state ─────────────────────────────────────────────────────────────
  /** @type {Array<Object>|null} In-memory song pool — null until loaded. */
  let songPool = null;
  let loading  = false;

  // ── Data loading ─────────────────────────────────────────────────────────────
  /**
   * loadSongs
   * Fetches data/songs.json and caches it.
   * Safe to call multiple times — subsequent calls resolve immediately.
   * @returns {Promise<Array<Object>>}
   */
  async function loadSongs() {
    if (songPool !== null) return songPool;
    if (loading) {
      // Another call is already in flight — wait for it
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (songPool !== null) {
            clearInterval(interval);
            resolve(songPool);
          }
        }, 50);
        // Timeout after 15s
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Timed out waiting for songs.json'));
        }, 15_000);
      });
    }

    loading = true;
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`Failed to load songs.json: HTTP ${res.status}`);
      songPool = await res.json();
    } finally {
      loading = false;
    }
    return songPool;
  }

  // ── Scoring ───────────────────────────────────────────────────────────────────
  /**
   * scoreSong
   * @param {Object}   song   - song object from songs.json
   * @param {string[]} moods  - selected atmosphere tags
   * @param {string[]} genres - selected umbrella genres
   * @returns {number} score ≥ 0
   */
  function scoreSong(song, moods, genres) {
    let score = 0;

    // Atmosphere score: one point per matching tag
    if (moods.length > 0 && Array.isArray(song.atmosphere)) {
      for (const mood of moods) {
        if (song.atmosphere.includes(mood)) score += 1;
      }
    }

    // Genre bonus: +1 if any selected genre matches the song's genre
    if (genres.length > 0 && genres.includes(song.genre)) {
      score += 1;
    }

    return score;
  }

  /**
   * runMatching
   * Core matching algorithm.
   * @param {Array<Object>} pool
   * @param {string[]}      moods
   * @param {string[]}      genres
   * @returns {{ songs: Array<Object>, relaxed: boolean }}
   */
  function runMatching(pool, moods, genres) {
    // No filters at all — return a random high-popularity sample
    if (moods.length === 0 && genres.length === 0) {
      const sorted = [...pool].sort((a, b) => b.popularity - a.popularity);
      return { songs: sorted.slice(0, MAX_RESULTS), relaxed: false };
    }

    // Score every song
    const scored = pool.map(song => ({
      song,
      score: scoreSong(song, moods, genres),
    }));

    // Full match: must score > 0 on both atmosphere AND genre (if both filters active)
    const minScoreRequired = (moods.length > 0 && genres.length > 0) ? 2 : 1;

    let candidates = scored
      .filter(s => s.score >= minScoreRequired)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.song.popularity - a.song.popularity; // tie-break by popularity
      })
      .slice(0, MAX_RESULTS)
      .map(s => s.song);

    if (candidates.length >= MIN_RESULTS) {
      return { songs: candidates, relaxed: false };
    }

    // ── Fallback: atmosphere-only ──────────────────────────────────────────────
    // Drop the genre requirement, match on atmosphere tags alone.
    if (moods.length > 0) {
      candidates = scored
        .filter(s => {
          const atmosphereScore = moods.filter(m => s.song.atmosphere?.includes(m)).length;
          return atmosphereScore > 0;
        })
        .sort((a, b) => {
          const aAtm = moods.filter(m => a.song.atmosphere?.includes(m)).length;
          const bAtm = moods.filter(m => b.song.atmosphere?.includes(m)).length;
          if (bAtm !== aAtm) return bAtm - aAtm;
          return b.song.popularity - a.song.popularity;
        })
        .slice(0, MAX_RESULTS)
        .map(s => s.song);

      if (candidates.length > 0) {
        return { songs: candidates, relaxed: true };
      }
    }

    // ── Fallback: genre-only ───────────────────────────────────────────────────
    if (genres.length > 0) {
      candidates = pool
        .filter(s => genres.includes(s.genre))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, MAX_RESULTS);

      if (candidates.length > 0) {
        return { songs: candidates, relaxed: true };
      }
    }

    // Nothing matched at all
    return { songs: [], relaxed: true };
  }

  // ── DOM event helper ──────────────────────────────────────────────────────────
  /**
   * dispatch
   * Fires a custom event on document.
   * @param {string} name
   * @param {Object} detail
   */
  function dispatch(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  /**
   * getSuggestions
   * Pure function — returns matching songs synchronously after the dataset is
   * loaded. Throws if called before loadSongs() completes.
   * Useful for the visuals team to call and handle rendering themselves.
   *
   * @param {string[]} moods   - atmosphere tags, e.g. ['Happy / Upbeat']
   * @param {string[]} genres  - umbrella genres, e.g. ['Pop', 'Rock']
   * @returns {{ songs: Array<Object>, relaxed: boolean }}
   */
  function getSuggestions(moods = [], genres = []) {
    if (songPool === null) {
      throw new Error('[DoomChill] songs.json is not loaded yet. Await suggestSongs() or call after doomchill:ready.');
    }
    return runMatching(songPool, moods, genres);
  }

  /**
   * suggestSongs
   * Main entry point for the visuals team.
   * Loads the dataset (if not already cached), runs matching, then:
   *  1. Calls window.DoomChill.renderMoodResults(songs, { relaxed })
   *  2. Dispatches 'doomchill:moodresults' on document
   *
   * @param {string[]} moods   - e.g. ['Happy / Upbeat', 'Energetic / Hype']
   * @param {string[]} genres  - e.g. ['Pop']
   * @returns {Promise<void>}
   */
  async function suggestSongs(moods = [], genres = []) {
    // Normalise to arrays in case the caller passes a single string
    const moodArr  = [].concat(moods).filter(Boolean);
    const genreArr = [].concat(genres).filter(Boolean);

    try {
      if (songPool === null) {
        dispatch('doomchill:suggester:loading');
      }

      await loadSongs();

      const { songs, relaxed } = runMatching(songPool, moodArr, genreArr);

      // Notify visuals team via the agreed render function
      if (typeof window.DoomChill.renderMoodResults === 'function') {
        window.DoomChill.renderMoodResults(songs, { relaxed });
      }

      // Also dispatch a DOM event as a secondary decoupled signal
      dispatch('doomchill:moodresults', { songs, relaxed });

    } catch (err) {
      console.error('[DoomChill] suggestSongs error:', err);
      dispatch('doomchill:suggester:error', { message: err.message });
    }
  }

  // ── Attach to namespace ──────────────────────────────────────────────────────
  // Guard: main.js may not have run yet — create namespace if absent
  if (!window.DoomChill) window.DoomChill = {};

  window.DoomChill.suggestSongs   = suggestSongs;
  window.DoomChill.getSuggestions = getSuggestions;

  document.addEventListener('doomchill:suggest', (e) => {
    const { atmospheres, genres } = e.detail || {};
    suggestSongs(atmospheres || [], genres || []);
  });

  // ── Eager pre-load ────────────────────────────────────────────────────────────
  // Kick off the fetch immediately so the dataset is warm by the time the user
  // interacts. Errors here are swallowed — suggestSongs() will surface them.
  loadSongs().catch(err => {
    console.warn('[DoomChill] Pre-load of songs.json failed:', err.message);
  });
})();
