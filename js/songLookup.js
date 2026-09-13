/**
 * js/songLookup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DoomChill — Song Lookup front-end logic
 *
 * Calls the Vercel serverless proxy (/api/lookup) and passes results to the
 * visuals team's render function.
 *
 * Public API (on window.DoomChill):
 *   lookupSong(track, artist?)  → Promise<void>
 *
 * DOM events dispatched on document:
 *   doomchill:lookup:loading   — fetch started
 *   doomchill:lookup:result    — detail: { data }  (success)
 *   doomchill:lookup:notfound  — detail: { track, artist }
 *   doomchill:lookup:error     — detail: { message }
 *
 * The visuals team should implement:
 *   window.DoomChill.renderLookupResult(data)
 *   where data is the clean proxy JSON, or { error: 'not_found'|'api_error' }
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

(function songLookupModule() {

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  CONFIG — update PROXY_URL before deploying                             ║
  // ╠══════════════════════════════════════════════════════════════════════════╣
  // ║  Local dev  : 'http://localhost:3000/api/lookup'                        ║
  // ║  Production : 'https://<your-vercel-domain>.vercel.app/api/lookup'      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const PROXY_URL = 'http://localhost:3000/api/lookup';

  // ── Request timeout (ms) ──────────────────────────────────────────────────
  const FETCH_TIMEOUT_MS = 10_000;

  // ── DOM event helper ──────────────────────────────────────────────────────
  /**
   * dispatch
   * Fires a custom event on document.
   * @param {string} name
   * @param {Object} [detail]
   */
  function dispatch(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  }

  // ── Fetch with timeout ─────────────────────────────────────────────────────
  /**
   * fetchWithTimeout
   * Wraps fetch() with an AbortController timeout.
   * @param {string}  url
   * @param {number}  timeoutMs
   * @returns {Promise<Response>}
   */
  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timerId    = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timerId);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  /**
   * lookupSong
   * Called by the visuals team when the user submits a search.
   *
   * @param {string}  track  - track name (required)
   * @param {string} [artist] - artist name (optional, improves accuracy)
   * @returns {Promise<void>}
   */
  async function lookupSong(track, artist) {
    if (!track || !track.trim()) {
      console.warn('[DoomChill] lookupSong() called with empty track name.');
      return;
    }

    // Build proxy URL
    const params = new URLSearchParams({ track: track.trim() });
    if (artist && artist.trim()) params.set('artist', artist.trim());
    const url = `${PROXY_URL}?${params.toString()}`;

    // Signal loading state
    dispatch('doomchill:lookup:loading');

    let data;
    try {
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);

      if (!response.ok) {
        // Unexpected HTTP error from the proxy (e.g. 500)
        throw new Error(`Proxy returned HTTP ${response.status}`);
      }

      data = await response.json();

    } catch (fetchErr) {
      // Network failure or timeout
      console.error('[DoomChill] lookupSong fetch failed:', fetchErr.message);
      const errorData = { error: 'api_error' };
      _callRender(errorData);
      dispatch('doomchill:lookup:error', { message: fetchErr.message });
      return;
    }

    // ── Route on proxy response ─────────────────────────────────────────────
    if (data.error === 'not_found') {
      _callRender(data);
      dispatch('doomchill:lookup:notfound', { track: track.trim(), artist: artist?.trim() ?? null });
      return;
    }

    if (data.error) {
      // 'api_error' or any unexpected error token from the proxy
      _callRender(data);
      dispatch('doomchill:lookup:error', { message: data.error });
      return;
    }

    // Success
    _callRender(data);
    dispatch('doomchill:lookup:result', { data });
  }

  /**
   * _callRender
   * Internal helper — calls the visuals team's renderLookupResult() if it
   * has been implemented. Falls back to the no-op stub in main.js.
   * @param {Object} data
   */
  function _callRender(data) {
    if (typeof window.DoomChill?.renderLookupResult === 'function') {
      window.DoomChill.renderLookupResult(data);
    } else {
      // main.js stub will log a console.warn
      console.warn('[DoomChill] renderLookupResult not yet implemented by visuals team. Data:', data);
    }
  }

  // ── Attach to namespace ───────────────────────────────────────────────────
  if (!window.DoomChill) window.DoomChill = {};
  window.DoomChill.lookupSong = lookupSong;

})();
