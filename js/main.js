/**
 * js/main.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DoomChill — Shared initialisation and tab switching
 *
 * Responsibilities:
 *  - Creates and guards the window.DoomChill namespace.
 *  - Installs no-op stubs for renderMoodResults / renderLookupResult so the
 *    logic modules can call them safely before the visuals team wires up the
 *    real implementations.
 *  - Handles tab switching between the Mood Suggester and Song Lookup panels.
 *
 * Expected DOM IDs (visuals team provides the markup):
 *   #tab-mood      — tab button for Mood Suggester
 *   #tab-lookup    — tab button for Song Lookup
 *   #panel-mood    — content panel for Mood Suggester
 *   #panel-lookup  — content panel for Song Lookup
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

(function initDoomChill() {
  // ── Namespace guard ─────────────────────────────────────────────────────────
  // Use an _initialized sentinel rather than checking bare existence.
  // moodSuggester.js and songLookup.js both do `window.DoomChill = window.DoomChill || {}`
  // so window.DoomChill may already exist as a bare object when main.js runs.
  // Checking for _initialized lets us distinguish "set up by main.js" vs "bare stub".
  if (window.DoomChill?._initialized) {
    console.warn('[DoomChill] main.js already initialised — skipping re-init.');
    return;
  }

  // Extend existing namespace (may have been created by another module) or create fresh.
  window.DoomChill = window.DoomChill || {};
  window.DoomChill._initialized = true;

  // ── Render stubs ────────────────────────────────────────────────────────────
  // These are intentional no-ops. The visuals team overrides them in their own
  // script by assigning:
  //   window.DoomChill.renderMoodResults = function(songs, opts) { … }
  //   window.DoomChill.renderLookupResult = function(data) { … }
  //
  // If the overrides aren't in place yet, calling these will log a warning
  // instead of throwing, so neither team blocks the other during development.

  /**
   * renderMoodResults (stub)
   * Called by moodSuggester.js with matching songs.
   * @param {Array<{title,artist,album,genre,atmosphere,popularity}>} songs
   * @param {{ relaxed: boolean }} opts
   *   relaxed = true when results fell back to atmosphere-only matching
   */
  window.DoomChill.renderMoodResults = function stubRenderMoodResults(songs, opts) {
    console.warn(
      '[DoomChill] renderMoodResults() is not yet implemented by the visuals team.\n' +
      'Results received:', JSON.stringify({ count: songs.length, opts })
    );
  };

  /**
   * renderLookupResult (stub)
   * Called by songLookup.js with proxy data.
   * @param {Object} data  Clean proxy response, or { error: 'not_found'|'api_error' }
   */
  window.DoomChill.renderLookupResult = function stubRenderLookupResult(data) {
    console.warn(
      '[DoomChill] renderLookupResult() is not yet implemented by the visuals team.\n' +
      'Data received:', JSON.stringify(data)
    );
  };

  // ── Tab switching ────────────────────────────────────────────────────────────
  /**
   * activateTab
   * Shows the selected panel and hides the other.
   * Adds `data-active="true"` to the active tab and removes it from the other,
   * and sets aria-selected accordingly — the visuals team drives the active
   * appearance purely from that attribute and data attribute.
   *
   * @param {'mood'|'lookup'} tabName
   */
  function activateTab(tabName) {
    const tabs   = { mood: tabEl('mood'),   lookup: tabEl('lookup')   };
    const panels = { mood: panelEl('mood'), lookup: panelEl('lookup') };

    // Bail gracefully if the DOM isn't ready / IDs not present
    if (!tabs.mood || !tabs.lookup || !panels.mood || !panels.lookup) {
      console.warn('[DoomChill] Tab elements not found in DOM — skipping tab switch.');
      return;
    }

    Object.keys(tabs).forEach(name => {
      const isActive = name === tabName;

      // Accessibility attributes
      tabs[name].setAttribute('aria-selected', String(isActive));
      tabs[name].setAttribute('tabindex', isActive ? '0' : '-1');

      // Data attribute — visuals team uses data-active="true" for active styles
      if (isActive) {
        tabs[name].setAttribute('data-active', 'true');
        panels[name].removeAttribute('hidden');
      } else {
        tabs[name].removeAttribute('data-active');
        panels[name].setAttribute('hidden', '');
      }
    });
  }

  /** Shorthand to find a tab element by name. */
  function tabEl(name)   { return document.getElementById(`tab-${name}`);   }
  /** Shorthand to find a panel element by name. */
  function panelEl(name) { return document.getElementById(`panel-${name}`); }

  // ── DOM ready ────────────────────────────────────────────────────────────────
  function onDOMReady() {
    const tabMood   = tabEl('mood');
    const tabLookup = tabEl('lookup');

    if (tabMood) {
      tabMood.addEventListener('click', () => activateTab('mood'));
      tabMood.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateTab('mood');
        }
      });
    }

    if (tabLookup) {
      tabLookup.addEventListener('click', () => activateTab('lookup'));
      tabLookup.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateTab('lookup');
        }
      });
    }

    // Default: mood suggester tab is active on load
    activateTab('mood');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    onDOMReady();
  }

  // Expose activateTab so the visuals team can also drive tab changes
  // programmatically (e.g., a "Try the mood suggester" CTA link).
  window.DoomChill.activateTab = activateTab;
})();
