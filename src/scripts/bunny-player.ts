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

function initBunnyPlayerBasic(scope) {
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
    video.addEventListener('ended', function() { pendingPlay = false; setStatus('paused'); setActivated(false); });

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
