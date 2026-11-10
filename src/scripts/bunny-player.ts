// @ts-nocheck -- Osmo code kept as delivered (untyped JS)
import { reducedMotion } from './media';
import type { PageScope } from './page-scope';

/**
 * Osmo "Custom Bunny HLS Player (Basic)", unchanged except: hls.js is loaded from the CDN only on pages
 * with a player, it starts per page view from app.ts (Swup) with a cleanup (observers, hls, playback),
 * with reduced motion it does not autoplay (the play button still works), and only what BunnyPlayer.astro
 * uses is left: always lazy (nothing loads before play or scrolling in), one play/pause control, no size
 * update from the video (data-player-update-size="cover" is CSS only).
 * Chrome/Firefox play the HLS stream through hls.js, Safari natively.
 */
const HLS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.11';
let hlsLoading: Promise<void> | undefined;
// The Advanced player shares data-bunny-player-init (Osmo) but has its own script (bunny-player-advanced.ts)
const BASIC = '[data-bunny-player-init]:not([data-bunny-player-advanced])';

export function loadHls() {
  hlsLoading ??= new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = HLS_SRC;
    script.onload = script.onerror = () => resolve(); // without hls.js the player falls back to a plain src
    document.head.append(script);
  });
  return hlsLoading;
}

export function initBunnyPlayers(scope: PageScope) {
  if (!document.querySelector(BASIC)) return;
  scope.add(() => {
    document.querySelectorAll(BASIC).forEach((player) => {
      try { player.querySelector('video')?.pause(); } catch (_) {}
      if (player._hls) { try { player._hls.destroy(); } catch (_) {} player._hls = null; }
    });
  });
  loadHls().then(() => {
    if (!scope.signal.aborted) initBunnyPlayerBasic(scope);
  });
}

/**
 * Dock: a video someone started themselves (not the muted autoplay loops) keeps playing in a small card
 * bottom-right once its player scrolls out of view, and goes home when the player is back in view.
 * The <video> itself moves (same element, same hls.js stream); a synchronous move does not pause it.
 * shortcut: the dock is per page (Swup cleanup closes it), upgrade if it should survive navigation.
 */
let dockEl = null;
let docked = null; // { player, video, next }

const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="bunny-dock__play"><path d="M6 12V5.01c0-.96 1.04-1.56 1.87-1.08L14 7.43l6.1 3.48c.84.48.84 1.7 0 2.17L14 16.57l-6.13 3.5C7.04 20.55 6 19.95 6 18.99V12Z"/></svg>';
const PAUSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true" class="bunny-dock__pause"><path d="M16 5v14M8 5v14"/></svg>';

function syncDock() {
  if (!docked || !dockEl) return;
  const playing = !docked.video.paused;
  dockEl.toggleAttribute('data-playing', playing);
  dockEl.querySelector('[data-dock="toggle"]').setAttribute('aria-label', playing ? 'Video pauzeren' : 'Video afspelen');
}

function getDock() {
  if (dockEl) return dockEl;
  dockEl = document.createElement('div');
  dockEl.className = 'bunny-dock';
  dockEl.setAttribute('role', 'region');
  dockEl.setAttribute('aria-label', 'Video');
  dockEl.innerHTML =
    '<button type="button" class="bunny-dock__back" data-dock="back" aria-label="Terug naar de video"></button>' +
    '<button type="button" class="bunny-dock__btn bunny-dock__toggle" data-dock="toggle">' + PLAY_SVG + PAUSE_SVG + '</button>' +
    '<button type="button" class="bunny-dock__btn bunny-dock__close" data-dock="close" aria-label="Video stoppen en sluiten">' +
    '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6"/></svg></button>';
  dockEl.addEventListener('click', (e) => {
    const action = e.target.closest('[data-dock]')?.dataset.dock;
    if (!docked || !action) return;
    const { player, video } = docked;
    if (action === 'toggle') video.paused ? video.play().catch(() => {}) : video.pause();
    else if (action === 'close') { video.pause(); undock(); }
    else if (action === 'back') {
      player.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' }); // in view again → it goes home
    }
  });
  document.body.append(dockEl);
  void dockEl.offsetWidth; // first frame hidden, so the first dock transitions in
  return dockEl;
}

function dock(player, video) {
  if (docked?.video === video) return;
  if (docked) { docked.video.pause(); undock(); }
  const dockBox = getDock();
  const r = player.getBoundingClientRect();
  dockBox.style.setProperty('--ar', String(r.width / r.height || 16 / 9)); // the crop the visitor was watching
  docked = { player, video, next: video.nextSibling };
  dockBox.prepend(video);
  player.setAttribute('data-player-docked', '');
  video.addEventListener('play', syncDock);
  video.addEventListener('pause', syncDock);
  syncDock();
  dockBox.setAttribute('data-shown', '');
}

function undock() {
  if (!docked) return;
  const { player, video, next } = docked;
  docked = null;
  video.removeEventListener('play', syncDock);
  video.removeEventListener('pause', syncDock);
  player.insertBefore(video, next);
  player.removeAttribute('data-player-docked');
  dockEl?.removeAttribute('data-shown');
}

function initBunnyPlayerBasic(scope) {
  scope.add(() => { // added after the pause-all cleanup, so it runs first: the video goes home, then pauses
    undock();
    dockEl?.remove();
    dockEl = null;
  });
  document.querySelectorAll(BASIC).forEach(function(player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    // Attribute helpers
    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    // Flags
    var autoplay   = player.getAttribute('data-player-autoplay') === 'true' && !reducedMotion();

    // Used to suppress 'ready' flicker when user just pressed play in lazy modes
    var pendingPlay = false;

    // Autoplay forces muted + loop; IO will drive play/pause
    video.muted = !!autoplay;
    if (autoplay) video.loop = true;

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var canPlayNativeHls = !!video.canPlayType('application/vnd.apple.mpegurl');
    var preferNativeHls = canPlayNativeHls && 'ManagedMediaSource' in window;
    var canUseHlsJs = !!(window.Hls && Hls.isSupported()) && !preferNativeHls;

    // Attach media only once (for actual playback)
    var isAttached = false;
    var lastPauseBy = ''; // 'io' | 'manual' | ''
    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

      if (preferNativeHls) {
        video.preload = 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
        }, { once: true });
      } else if (canUseHlsJs) {
        // hls.js guesses 500 kbps before it has measured anything, so it opened on 360p. Guess 10 Mbps (enough for 1080p)
        // and let it step down on slow connections; never above what the player's size (× pixel ratio) can show.
        var hls = new Hls({ maxBufferLength: 10, abrEwmaDefaultEstimate: 1e7, capLevelToPlayerSize: true });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
        });
        player._hls = hls;
      } else {
        // Fallback if not HLS
        video.src = src;
      }
    }

    // Lazy: nothing loads until play or scrolling in
    video.preload = 'none';

    // Toggle play/pause
    function togglePlay() {
      if (video.paused || video.ended) {
        attachMediaOnce();
        pendingPlay = true;
        lastPauseBy = '';
        setStatus('loading');
        safePlay(video);
      } else {
        lastPauseBy = 'manual';
        video.pause();
      }
    }

    // Controls (delegated)
    player.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
    });

    // Media event wiring
    video.addEventListener('play', function() { setActivated(true); setStatus('playing'); });
    video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
    video.addEventListener('pause', function() { pendingPlay = false; setStatus('paused'); });
    video.addEventListener('waiting', function() { setStatus('loading'); });
    video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended', function() { pendingPlay = false; setStatus('paused'); setActivated(false); if (docked?.video === video) undock(); });

    // Played by hand (with sound): dock it while it plays and the player is (mostly) out of view
    if (!autoplay) {
      var dockIo = new IntersectionObserver(function(entries) {
        var entry = entries[entries.length - 1];
        if (entry.intersectionRatio >= 0.25) { if (docked?.video === video) undock(); }
        else if (!video.paused) dock(player, video);
      }, { threshold: [0, 0.25] }); // 0 too: started while already mostly out of view, it still docks on the way out
      scope.add(() => dockIo.disconnect());
      dockIo.observe(player);
    }

    // Hover (basic: active on enter, idle on leave)
    function setHover(state) {
      if (player.getAttribute('data-player-hover') !== state) {
        player.setAttribute('data-player-hover', state);
      }
    }
    player.addEventListener('pointerenter', function(){ setHover('active'); });
    player.addEventListener('pointerleave', function(){ setHover('idle'); });

    // In-view auto play/pause (only when autoplay is true)
    if (autoplay) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            attachMediaOnce();
            if ((lastPauseBy === 'io') || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      scope.add(() => io.disconnect());
      io.observe(player);
    }
  });

  // Helper: Ready status guard
  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
        player.getAttribute('data-player-activated') !== 'true' &&
        player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  // Helper: safe programmatic play
  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function(){});
  }
}
