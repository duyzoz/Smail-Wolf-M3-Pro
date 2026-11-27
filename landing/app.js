/* ==========================================================================
   SMAILWOLF M3 PRO — UNLIMITED-FPS LIQUID GLASS + PHYSICAL WATER ENGINE
   1. Smart 3-Tier Graphics Engine (`Low`, `Automatic`, `Ultra` — Unclamped Hz)
   2. Zero-Lag 3D Jelly Water-Droplet Cursor + Rim Suction + Periodic Gravity Drip
   3. Hero Water-Chasing Orbs + Vortex Suck-Inside-Mouse & Elastic Burst Swap
   4. Living Water-Silk Backdrop + Viscous Scroll-Velocity "Whoosh" Physics
   5. Draggable 2-Layer Water-Droplet Taskbars + Windowed 67-Skin Coverflow
   ========================================================================== */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let motionPaused = false; // 100% active by default; disabled ONLY in `Low` mode

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const debounce = (fn, ms) => {
    let t = 0;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  // Main-thread Cooperative Yield (modern-web-guidance `performance` pattern)
  function yieldToMain() {
    if (typeof window.scheduler !== 'undefined' && typeof window.scheduler.yield === 'function') {
      return window.scheduler.yield();
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  /* ------------------------------------------------------------------------
     0. FLAGSHIP ULTRA-BY-DEFAULT ENGINE + 1127 LIQUID GLASS "Mode" DROPDOWN
     - Enters `Ultra` by default on load (100% effects active, uncapped Hz)!
     - NEVER auto-downgrades on tone switch or runtime spikes (100% user-controlled)!
     - Hardware probe sets lowercase `(recommended)` beside matching mode in iPhone font.
     ------------------------------------------------------------------------ */
  const hwCores = navigator.hardwareConcurrency || 4;
  const hwMem = navigator.deviceMemory || 4;
  const isLowPowerGPU = hwCores <= 4 || hwMem <= 4;

  function detectRecommendedMode() {
    if (hwCores <= 2 || hwMem <= 2) return 'low';
    try {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      const gl = c.getContext('webgl', { powerPreference: 'high-performance' }) || c.getContext('experimental-webgl');
      if (!gl) return 'auto';
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : String(gl.getParameter(gl.RENDERER) || '');
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();

      if (/microsoft basic render|gdi generic|llvmpipe|hd graphics (2000|2500|3000)/i.test(renderer)) {
        return 'low';
      }
      if (/nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|arc a[357]|apple m[1-9]/i.test(renderer) &&
          !/intel|uhd|iris|hd graphics|swiftshader/i.test(renderer)) {
        return 'ultra';
      }
      return 'auto';
    } catch (_) {
      return 'auto';
    }
  }

  const recommendedMode = detectRecommendedMode();

  const modeMenuWrap = document.getElementById('modeMenuWrap');
  const modeTrigger = document.getElementById('modeTrigger');
  const modeMenuPanel = document.getElementById('modeMenuPanel');
  const modeOptBtns = Array.from(document.querySelectorAll('[data-mode-select]'));
  const modeRecTags = Array.from(document.querySelectorAll('[data-rec-for]'));
  const glidingFramesStage = document.getElementById('glidingFramesStage');

  // Populate lowercase `(recommended)` tag beside the hardware-matched mode
  modeRecTags.forEach((tagEl) => {
    tagEl.textContent = tagEl.dataset.recFor === recommendedMode ? '(recommended)' : '';
  });

  // Always launch in `Ultra` by default! User chooses manually via `Mode` menu.
  let fpsMode = 'ultra'; // 'ultra' | 'auto' | 'low'
  let fpsLowActive = false;
  let fpsUltraActive = true;
  motionPaused = false;

  let detectedHz = 120;
  let cursorPointerSeen = false;

  const MODE_LABELS = {
    ultra: 'Ultra',
    auto: 'Automatic',
    low: 'Low'
  };

  function syncLiquidCursorClass() {
    const enableCursor = finePointer && cursorPointerSeen && !fpsLowActive && !motionPaused;
    document.documentElement.classList.toggle('has-liquid-cursor', enableCursor);
  }

  function syncFpsBadge() {
    document.body.classList.toggle('fps-low', fpsLowActive);
    document.body.classList.toggle('fps-ultra', fpsUltraActive && !fpsLowActive);
    syncLiquidCursorClass();

    if (modeTrigger) {
      modeTrigger.setAttribute('data-fps-mode', fpsMode);
      modeTrigger.setAttribute('aria-label', `Graphics mode selector — currently ${MODE_LABELS[fpsMode] || 'Ultra'}`);
    }
    modeOptBtns.forEach((btn) => {
      const active = btn.dataset.modeSelect === fpsMode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-checked', String(active));
    });
  }

  function setFpsMode(nextMode) {
    if (!MODE_LABELS[nextMode]) return;
    fpsMode = nextMode;

    if (fpsMode === 'ultra') {
      fpsLowActive = false;
      fpsUltraActive = true;
      motionPaused = false;
    } else if (fpsMode === 'low') {
      fpsLowActive = true;
      fpsUltraActive = false;
      motionPaused = true;
    } else {
      fpsLowActive = false;
      fpsUltraActive = false;
      motionPaused = false;
    }

    syncFpsBadge();

    const modeDockCtrl = typeof dockControllers !== 'undefined' ? dockControllers.get('modeOptionsDock') : null;
    const activeModeBtn = modeOptBtns.find((b) => b.dataset.modeSelect === fpsMode);
    if (modeDockCtrl && activeModeBtn && modeMenuPanel && !modeMenuPanel.hidden) {
      modeDockCtrl.setActive(activeModeBtn, { animate: !fpsLowActive, scrollDock: false, bounceIcon: true });
    }

    if (fpsLowActive) {
      activeLiquidEls.forEach((el) => {
        el.style.translate = '';
        el.style.scale = '';
        el.style.transform = '';
      });
      activeLiquidEls.clear();
      if (glidingFramesStage) glidingFramesStage.style.transform = '';
      resetLiquidCursorVisuals();
      snapAllLiquidDocks();
    } else {
      requestAnimationFrame(() => {
        snapAllLiquidDocks();
        wakeHeroLoop();
        wakeCursorPhysics();
      });
    }
  }

  // Strictly manual mode lock — never auto-downgrade when switching tones or scrolling!
  function recordLoopDelta() {}

  /* ------------------------------------------------------------------------
     WAVE 22: ZERO-ASSET PROCEDURAL WEB AUDIO CRYSTAL WATER ACOUSTICS
     Opt-in via `Water Sound` 1127 switch inside Mode dropdown (0 MP3s, 0 CDN!)
     ------------------------------------------------------------------------ */
  const waterSoundSwitch = document.getElementById('waterSoundSwitch');
  let waterSoundEnabled = false;
  let waterAudioCtx = null;

  try {
    waterSoundEnabled = window.localStorage && localStorage.getItem('m3pro_water_sound') === '1';
  } catch (_) {}
  if (waterSoundSwitch) {
    waterSoundSwitch.checked = waterSoundEnabled;
  }

  function playWaterDrop(kind = 'plop') {
    if (!waterSoundEnabled || fpsLowActive || document.hidden) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!waterAudioCtx) waterAudioCtx = new AC();
      if (waterAudioCtx.state === 'suspended') waterAudioCtx.resume().catch(() => {});

      const t = waterAudioCtx.currentTime;
      const osc = waterAudioCtx.createOscillator();
      const gain = waterAudioCtx.createGain();
      osc.type = 'sine';

      if (kind === 'switch') {
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(1060, t + 0.048);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.045, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.062);
      } else if (kind === 'splash') {
        osc.frequency.setValueAtTime(760, t);
        osc.frequency.exponentialRampToValueAtTime(380, t + 0.025);
        osc.frequency.exponentialRampToValueAtTime(980, t + 0.072);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.032, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
      } else if (kind === 'whoosh') {
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(720, t + 0.085);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.042, t + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      } else {
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(860, t + 0.042);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.036, t + 0.007);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
      }

      osc.connect(gain);
      gain.connect(waterAudioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (_) {}
  }

  // Accessible fallback for `<input type="checkbox" switch>` + 1127.mp4 clear-glass flip flash
  const supportsNativeSwitch = 'switch' in HTMLInputElement.prototype;
  document.querySelectorAll('input[type="checkbox"][switch]').forEach((sw) => {
    if (!supportsNativeSwitch) {
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', String(sw.checked));
    }
    sw.addEventListener('change', () => {
      if (!supportsNativeSwitch) sw.setAttribute('aria-checked', String(sw.checked));
      sw.classList.remove('is-flipping');
      void sw.offsetWidth;
      sw.classList.add('is-flipping');
      setTimeout(() => sw.classList.remove('is-flipping'), 240);
      if (sw === waterSoundSwitch) {
        waterSoundEnabled = sw.checked;
        try {
          if (window.localStorage) localStorage.setItem('m3pro_water_sound', waterSoundEnabled ? '1' : '0');
        } catch (_) {}
        if (waterSoundEnabled) playWaterDrop('switch');
      } else {
        playWaterDrop('switch');
      }
    });
  });

  // Passive refresh-rate estimator for internal physics default `dt`
  function calibrateDisplayHz() {
    if (document.hidden || fpsLowActive) return;
    let prev = 0;
    const samples = [];
    function sample(now) {
      if (prev > 0) {
        const dt = now - prev;
        if (dt > 0.8 && dt < 30) samples.push(dt);
      }
      prev = now;
      if (samples.length < 20) {
        requestAnimationFrame(sample);
      } else {
        samples.sort((a, b) => a - b);
        const medianMs = samples[Math.floor(samples.length * 0.4)] || 8.33;
        detectedHz = clamp(Math.round(1000 / medianMs), 60, 500);
      }
    }
    requestAnimationFrame(sample);
  }

  // 1127(1).mp4 + 1127.mp4 Unfurl & Collapse-Blur `Mode` Dropdown Controller
  let modeMenuOpen = false;
  let modeAnimTimer = 0;
  let modeSelectCloseTimer = 0;

  function openModeMenu(focusFirst = false) {
    if (!modeMenuPanel || !modeTrigger) return;
    clearTimeout(modeAnimTimer);
    clearTimeout(modeSelectCloseTimer);
    modeMenuOpen = true;
    modeMenuPanel.hidden = false;
    modeMenuPanel.classList.remove('is-closing');
    modeTrigger.setAttribute('aria-expanded', 'true');

    const modeDockCtrl = typeof dockControllers !== 'undefined' ? dockControllers.get('modeOptionsDock') : null;
    const activeModeBtn = modeOptBtns.find((b) => b.dataset.modeSelect === fpsMode) || modeOptBtns[0];
    if (modeDockCtrl && activeModeBtn) {
      modeDockCtrl.setActive(activeModeBtn, { animate: false, scrollDock: false, bounceIcon: false });
      modeDockCtrl.measure(true);
    }

    if (!fpsLowActive) {
      modeMenuPanel.classList.remove('is-opening');
      void modeMenuPanel.offsetWidth;
      modeMenuPanel.classList.add('is-opening');
      modeAnimTimer = setTimeout(() => {
        modeMenuPanel.classList.remove('is-opening');
      }, 360);
    }

    if (focusFirst && activeModeBtn) {
      activeModeBtn.focus({ preventScroll: true });
    }
  }

  function closeModeMenu(restoreFocus = false) {
    if (!modeMenuPanel || !modeTrigger || !modeMenuOpen) return;
    clearTimeout(modeAnimTimer);
    clearTimeout(modeSelectCloseTimer);
    modeMenuOpen = false;
    modeTrigger.setAttribute('aria-expanded', 'false');
    modeMenuPanel.classList.remove('is-opening');

    if (restoreFocus) {
      modeTrigger.focus({ preventScroll: true });
    }

    if (fpsLowActive) {
      modeMenuPanel.classList.remove('is-closing');
      modeMenuPanel.hidden = true;
      return;
    }

    modeMenuPanel.classList.add('is-closing');
    modeAnimTimer = setTimeout(() => {
      modeMenuPanel.classList.remove('is-closing');
      if (!modeMenuOpen) modeMenuPanel.hidden = true;
    }, 260);
  }

  syncFpsBadge();

  if (modeTrigger && modeMenuPanel) {
    modeTrigger.addEventListener('click', () => {
      if (modeMenuOpen) closeModeMenu(false);
      else openModeMenu(false);
    });

    modeTrigger.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        openModeMenu(true);
      } else if (ev.key === 'Escape' && modeMenuOpen) {
        ev.preventDefault();
        closeModeMenu(true);
      }
    });

    modeOptBtns.forEach((btn, idx) => {
      const chooseMode = () => {
        const chosen = btn.dataset.modeSelect || 'ultra';
        setFpsMode(chosen);
        clearTimeout(modeSelectCloseTimer);
        modeSelectCloseTimer = setTimeout(() => closeModeMenu(false), fpsLowActive ? 0 : 190);
      };
      btn.addEventListener('click', chooseMode);
      btn.addEventListener('dockselect', chooseMode);

      btn.addEventListener('keydown', (ev) => {
        let nextIdx = -1;
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') nextIdx = (idx + 1) % modeOptBtns.length;
        else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') nextIdx = (idx - 1 + modeOptBtns.length) % modeOptBtns.length;
        else if (ev.key === 'Home') nextIdx = 0;
        else if (ev.key === 'End') nextIdx = modeOptBtns.length - 1;
        else if (ev.key === 'Escape') {
          ev.preventDefault();
          closeModeMenu(true);
          return;
        }
        if (nextIdx >= 0) {
          ev.preventDefault();
          modeOptBtns[nextIdx].focus({ preventScroll: true });
        }
      });
    });

    document.addEventListener('pointerdown', (ev) => {
      if (!modeMenuOpen || !modeMenuWrap) return;
      if (!modeMenuWrap.contains(ev.target)) {
        closeModeMenu(false);
      }
    }, { passive: true });

    document.addEventListener('focusin', (ev) => {
      if (!modeMenuOpen || !modeMenuWrap) return;
      if (!modeMenuWrap.contains(ev.target)) {
        closeModeMenu(false);
      }
    });
  }

  window.addEventListener('load', () => setTimeout(calibrateDisplayHz, 180), { once: true });

  /* ------------------------------------------------------------------------
     1. 4 AUTHENTIC SKIN TONES & ALL 67 REAL MOUSE SKINS
     ------------------------------------------------------------------------ */
  const EDITIONS = {
    pearl: {
      key: 'pearl',
      isLight: true,
      themeMeta: '#F8FAFC',
      tag: 'PURE WHITE',
      src: 'assets/mouse-hero.webp',
      scriptLeft: 'Pure',
      boldLeft: 'Precision',
      scriptRight: 'Driver',
      boldRight: 'Control',
      orbSkins: ['B01', 'C05', 'D01', 's4', 'A01', 'F07']
    },
    crimson: {
      key: 'crimson',
      isLight: false,
      themeMeta: '#2B0610',
      tag: 'ONI CRIMSON · A03',
      src: 'assets/skins/A03.webp',
      scriptLeft: 'Fierce',
      boldLeft: 'Velocity',
      scriptRight: 'Driver',
      boldRight: 'Control',
      orbSkins: ['A03', 'E05', 'F09', 's3', 'C03', 'E10']
    },
    cyber: {
      key: 'cyber',
      isLight: false,
      themeMeta: '#1A073B',
      tag: 'CYBER NEON · F02',
      src: 'assets/skins/F02.webp',
      scriptLeft: 'Neon',
      boldLeft: 'Telemetry',
      scriptRight: 'Driver',
      boldRight: 'Control',
      orbSkins: ['F02', 'A02', 'B02', 'C04', 'D05', 'F10']
    },
    hologram: {
      key: 'hologram',
      isLight: false,
      themeMeta: '#132C57',
      tag: 'HOLOGRAM · C07',
      src: 'assets/skins/C07.webp',
      scriptLeft: 'Zero',
      boldLeft: 'Bloat',
      scriptRight: 'Driver',
      boldRight: 'Control',
      orbSkins: ['C07', 'F06', 'B04', 'E09', 'C10', 'F03']
    }
  };

  const EDITION_ORDER = ['pearl', 'crimson', 'cyber', 'hologram'];
  let activeEditionIndex = 0;

  const SKINS = [
    { id: 'default', name: 'Pure White', cat: 'special', src: 'assets/mouse-hero.webp', thumb: 'assets/skins/thumbs/default.webp' },
    { id: 'A01', name: 'Topographic', cat: 'topo', src: 'assets/skins/A01.webp', thumb: 'assets/skins/thumbs/A01.webp' },
    { id: 'A02', name: 'Cyber X', cat: 'cyber', src: 'assets/skins/A02.webp', thumb: 'assets/skins/thumbs/A02.webp' },
    { id: 'A03', name: 'Oni Red', cat: 'oni', src: 'assets/skins/A03.webp', thumb: 'assets/skins/thumbs/A03.webp' },
    { id: 'A04', name: 'LED Honeycomb', cat: 'cyber', src: 'assets/skins/A04.webp', thumb: 'assets/skins/thumbs/A04.webp' },
    { id: 'A05', name: 'Sakura Anime', cat: 'anime', src: 'assets/skins/A05.webp', thumb: 'assets/skins/thumbs/A05.webp' },
    { id: 'A06', name: 'Graffiti Purple', cat: 'cyber', src: 'assets/skins/A06.webp', thumb: 'assets/skins/thumbs/A06.webp' },
    { id: 'A07', name: 'Z-Core', cat: 'cyber', src: 'assets/skins/A07.webp', thumb: 'assets/skins/thumbs/A07.webp' },
    { id: 'A08', name: 'RGB Wave', cat: 'cyber', src: 'assets/skins/A08.webp', thumb: 'assets/skins/thumbs/A08.webp' },
    { id: 'A09', name: 'LED Cutout', cat: 'cyber', src: 'assets/skins/A09.webp', thumb: 'assets/skins/thumbs/A09.webp' },
    { id: 'A10', name: 'Galaxy Moon', cat: 'special', src: 'assets/skins/A10.webp', thumb: 'assets/skins/thumbs/A10.webp' },
    { id: 'B01', name: 'Topography Flow', cat: 'topo', src: 'assets/skins/B01.webp', thumb: 'assets/skins/thumbs/B01.webp' },
    { id: 'B02', name: 'Cyber Circuit', cat: 'cyber', src: 'assets/skins/B02.webp', thumb: 'assets/skins/thumbs/B02.webp' },
    { id: 'B03', name: 'Dragon Ink', cat: 'oni', src: 'assets/skins/B03.webp', thumb: 'assets/skins/thumbs/B03.webp' },
    { id: 'B04', name: 'Sakura Aurora', cat: 'anime', src: 'assets/skins/B04.webp', thumb: 'assets/skins/thumbs/B04.webp' },
    { id: 'B05', name: 'Anime Cyber', cat: 'anime', src: 'assets/skins/B05.webp', thumb: 'assets/skins/thumbs/B05.webp' },
    { id: 'B06', name: 'RGB Honeycomb', cat: 'cyber', src: 'assets/skins/B06.webp', thumb: 'assets/skins/thumbs/B06.webp' },
    { id: 'B07', name: 'Void Space', cat: 'special', src: 'assets/skins/B07.webp', thumb: 'assets/skins/thumbs/B07.webp' },
    { id: 'B08', name: 'Glitch Pixel', cat: 'cyber', src: 'assets/skins/B08.webp', thumb: 'assets/skins/thumbs/B08.webp' },
    { id: 'B09', name: 'Flame Ice', cat: 'oni', src: 'assets/skins/B09.webp', thumb: 'assets/skins/thumbs/B09.webp' },
    { id: 'B10', name: 'Neon Wave', cat: 'cyber', src: 'assets/skins/B10.webp', thumb: 'assets/skins/thumbs/B10.webp' },
    { id: 'C01', name: 'Topographic C01', cat: 'topo', src: 'assets/skins/C01.webp', thumb: 'assets/skins/thumbs/C01.webp' },
    { id: 'C02', name: 'Hex LED', cat: 'cyber', src: 'assets/skins/C02.webp', thumb: 'assets/skins/thumbs/C02.webp' },
    { id: 'C03', name: 'Samurai', cat: 'oni', src: 'assets/skins/C03.webp', thumb: 'assets/skins/thumbs/C03.webp' },
    { id: 'C04', name: 'Cyber Core', cat: 'cyber', src: 'assets/skins/C04.webp', thumb: 'assets/skins/thumbs/C04.webp' },
    { id: 'C05', name: 'Esports Pro', cat: 'special', src: 'assets/skins/C05.webp', thumb: 'assets/skins/thumbs/C05.webp' },
    { id: 'C06', name: 'Anime Tokyo', cat: 'anime', src: 'assets/skins/C06.webp', thumb: 'assets/skins/thumbs/C06.webp' },
    { id: 'C07', name: 'Pastel Hologram', cat: 'special', src: 'assets/skins/C07.webp', thumb: 'assets/skins/thumbs/C07.webp' },
    { id: 'C08', name: 'Mecha X-01', cat: 'cyber', src: 'assets/skins/C08.webp', thumb: 'assets/skins/thumbs/C08.webp' },
    { id: 'C09', name: 'Koi Wave', cat: 'oni', src: 'assets/skins/C09.webp', thumb: 'assets/skins/thumbs/C09.webp' },
    { id: 'C10', name: 'Galaxy LED', cat: 'special', src: 'assets/skins/C10.webp', thumb: 'assets/skins/thumbs/C10.webp' },
    { id: 'D01', name: 'Topographic D01', cat: 'topo', src: 'assets/skins/D01.webp', thumb: 'assets/skins/thumbs/D01.webp' },
    { id: 'D02', name: 'Cyber Mecha', cat: 'cyber', src: 'assets/skins/D02.webp', thumb: 'assets/skins/thumbs/D02.webp' },
    { id: 'D03', name: 'Dragon Ink D03', cat: 'oni', src: 'assets/skins/D03.webp', thumb: 'assets/skins/thumbs/D03.webp' },
    { id: 'D04', name: 'LED Honeycomb D04', cat: 'cyber', src: 'assets/skins/D04.webp', thumb: 'assets/skins/thumbs/D04.webp' },
    { id: 'D05', name: 'Circuit Neon', cat: 'cyber', src: 'assets/skins/D05.webp', thumb: 'assets/skins/thumbs/D05.webp' },
    { id: 'D06', name: 'Anime Eyes', cat: 'anime', src: 'assets/skins/D06.webp', thumb: 'assets/skins/thumbs/D06.webp' },
    { id: 'D07', name: 'Wave Fuji', cat: 'oni', src: 'assets/skins/D07.webp', thumb: 'assets/skins/thumbs/D07.webp' },
    { id: 'D08', name: 'Galaxy Orbit', cat: 'special', src: 'assets/skins/D08.webp', thumb: 'assets/skins/thumbs/D08.webp' },
    { id: 'D09', name: 'Hex Tech', cat: 'cyber', src: 'assets/skins/D09.webp', thumb: 'assets/skins/thumbs/D09.webp' },
    { id: 'D10', name: 'Flame Aurora', cat: 'oni', src: 'assets/skins/D10.webp', thumb: 'assets/skins/thumbs/D10.webp' },
    { id: 'E01', name: 'Dragon 01', cat: 'oni', src: 'assets/skins/E01.webp', thumb: 'assets/skins/thumbs/E01.webp' },
    { id: 'E02', name: 'ZL Wave', cat: 'topo', src: 'assets/skins/E02.webp', thumb: 'assets/skins/thumbs/E02.webp' },
    { id: 'E03', name: 'Anime Purple', cat: 'anime', src: 'assets/skins/E03.webp', thumb: 'assets/skins/thumbs/E03.webp' },
    { id: 'E04', name: 'Wave Fuji E04', cat: 'oni', src: 'assets/skins/E04.webp', thumb: 'assets/skins/thumbs/E04.webp' },
    { id: 'E05', name: 'Oni Red E05', cat: 'oni', src: 'assets/skins/E05.webp', thumb: 'assets/skins/thumbs/E05.webp' },
    { id: 'E06', name: 'Honeycomb Pink', cat: 'anime', src: 'assets/skins/E06.webp', thumb: 'assets/skins/thumbs/E06.webp' },
    { id: 'E07', name: 'ZL Cyan', cat: 'cyber', src: 'assets/skins/E07.webp', thumb: 'assets/skins/thumbs/E07.webp' },
    { id: 'E08', name: 'Sakura Fox', cat: 'anime', src: 'assets/skins/E08.webp', thumb: 'assets/skins/thumbs/E08.webp' },
    { id: 'E09', name: 'Galaxy Purple', cat: 'special', src: 'assets/skins/E09.webp', thumb: 'assets/skins/thumbs/E09.webp' },
    { id: 'E10', name: 'Ember Orange', cat: 'oni', src: 'assets/skins/E10.webp', thumb: 'assets/skins/thumbs/E10.webp' },
    { id: 'F01', name: 'Topographic Black', cat: 'topo', src: 'assets/skins/F01.webp', thumb: 'assets/skins/thumbs/F01.webp' },
    { id: 'F02', name: 'Cyber Neon RGB', cat: 'cyber', src: 'assets/skins/F02.webp', thumb: 'assets/skins/thumbs/F02.webp' },
    { id: 'F03', name: 'Sakura Wave', cat: 'anime', src: 'assets/skins/F03.webp', thumb: 'assets/skins/thumbs/F03.webp' },
    { id: 'F04', name: 'Dragon Ink F04', cat: 'oni', src: 'assets/skins/F04.webp', thumb: 'assets/skins/thumbs/F04.webp' },
    { id: 'F05', name: 'Mecha Armor', cat: 'cyber', src: 'assets/skins/F05.webp', thumb: 'assets/skins/thumbs/F05.webp' },
    { id: 'F06', name: 'Hologram Prism', cat: 'special', src: 'assets/skins/F06.webp', thumb: 'assets/skins/thumbs/F06.webp' },
    { id: 'F07', name: 'Carbon Forged', cat: 'topo', src: 'assets/skins/F07.webp', thumb: 'assets/skins/thumbs/F07.webp' },
    { id: 'F08', name: 'Void Galaxy', cat: 'special', src: 'assets/skins/F08.webp', thumb: 'assets/skins/thumbs/F08.webp' },
    { id: 'F09', name: 'Oni Mask', cat: 'oni', src: 'assets/skins/F09.webp', thumb: 'assets/skins/thumbs/F09.webp' },
    { id: 'F10', name: 'Tech Hex RGB', cat: 'cyber', src: 'assets/skins/F10.webp', thumb: 'assets/skins/thumbs/F10.webp' },
    { id: 's1', name: 'Animatronic Orange', cat: 'special', src: 'assets/skins/s1.webp', thumb: 'assets/skins/thumbs/s1.webp' },
    { id: 's2', name: 'Animatronic Blue', cat: 'special', src: 'assets/skins/s2.webp', thumb: 'assets/skins/thumbs/s2.webp' },
    { id: 's3', name: 'Animatronic Red', cat: 'special', src: 'assets/skins/s3.webp', thumb: 'assets/skins/thumbs/s3.webp' },
    { id: 's4', name: 'Animatronic Mono', cat: 'special', src: 'assets/skins/s4.webp', thumb: 'assets/skins/thumbs/s4.webp' },
    { id: 's5', name: 'Galaxy Cat', cat: 'anime', src: 'assets/skins/s5.webp', thumb: 'assets/skins/thumbs/s5.webp' },
    { id: 's6', name: 'ZNGL Green', cat: 'special', src: 'assets/skins/s6.webp', thumb: 'assets/skins/thumbs/s6.webp' }
  ];

  /* ------------------------------------------------------------------------
     2. UNLIMITED-HZ POINTER, JELLY WATER CURSOR, RIM SUCTION & GRAVITY DRIP
     0ms outer cursor translation + harmonic water jiggle + wet lower splash!
     ------------------------------------------------------------------------ */
  const LIQUID_SELECTOR = [
    '.liquid-taskbar-dock',
    '.brand-pill',
    '.spotlight-trigger',
    '.mode-trigger',
    '.mode-dropdown-card',
    '.header-cta',
    '.eyebrow-pill',
    '.primary-btn',
    '.secondary-btn',
    '.award-badge',
    '.edition-card',
    '.nav-step',
    '.scroll-pill',
    '.anatomy-dock',
    '.skins-dock',
    '.wafer-layer',
    '.layer-inspector',
    '.fact-pill',
    '.bento-card',
    '.s-metric',
    '.studio-panel-info',
    '.hotspot-pin',
    '.os-card',
    '.os-btn',
    '.pedestal-orb',
    '.to-top'
  ].join(',');

  const liquidStates = new WeakMap();
  const activeLiquidEls = new Set();
  let liquidRafId = 0;

  function getLiquidState(el) {
    let st = liquidStates.get(el);
    if (!st) {
      st = {
        el,
        rect: null,
        tx: 0, ty: 0, vx: 0, vy: 0, targetTx: 0, targetTy: 0,
        sx: 1, sy: 1, vsx: 0, vsy: 0, targetSx: 1, targetSy: 1,
        sk: 0, vsk: 0, targetSk: 0,
        rx: 0, ry: 0, vrx: 0, vry: 0, targetRx: 0, targetRy: 0,
        hovered: false,
        pressed: false
      };
      liquidStates.set(el, st);
    }
    return st;
  }

  // Framerate-Independent Semi-Implicit Euler Spring (Identical feel at 60Hz, 144Hz, 240Hz, 500Hz!)
  function stepSpringDt(pos, vel, target, stiff, damp, h) {
    for (let s = 0; s < 2; s++) {
      const acc = (target - pos) * stiff - vel * damp;
      vel += acc * h;
      pos += vel * h;
    }
    return [pos, vel];
  }

  // Wave 7: Pooled Zero-Allocation WAAPI Hydro-Ripple Spawner (Works on Touch & Mouse!)
  const hydroRipples = Array.from(document.querySelectorAll('#hydroRippleStage .hydro-ripple'));
  let rippleCursor = 0;
  function spawnHydroRipple(x, y) {
    if (motionPaused || fpsLowActive || !hydroRipples.length) return;
    const ring = hydroRipples[rippleCursor % hydroRipples.length];
    rippleCursor++;
    if (typeof ring.animate === 'function') {
      ring.animate(
        [
          { transform: `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0) scale(0.18)`, opacity: 0.85 },
          { transform: `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0) scale(1.75)`, opacity: 0 }
        ],
        { duration: 540, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
      );
    }
  }

  document.addEventListener('pointerdown', (ev) => {
    if (motionPaused || fpsLowActive || ev.button > 0) return;
    const hit = ev.target && ev.target.closest
      ? ev.target.closest('.liquid-glass, .liquid-pill, .liquid-bar, .hotspot-pin, .os-btn')
      : null;
    if (hit) spawnHydroRipple(ev.clientX, ev.clientY);
  }, { passive: true });

  let lastLiquidTick = 0;
  function liquidPhysicsTick(now) {
    liquidRafId = 0;
    if (motionPaused || fpsLowActive || !activeLiquidEls.size || document.hidden) {
      lastLiquidTick = 0;
      return;
    }
    const rawDt = lastLiquidTick && now ? (now - lastLiquidTick) / 1000 : 1 / detectedHz;
    if (lastLiquidTick && now) recordLoopDelta(now - lastLiquidTick);
    lastLiquidTick = now || 0;
    const dt = clamp(rawDt, 0.0004, 0.034);
    const h = dt * 0.5;

    try {
      activeLiquidEls.forEach((el) => {
        const st = liquidStates.get(el);
        if (!st) {
          activeLiquidEls.delete(el);
          return;
        }

        const stiff = st.hovered ? 260 : 165;
        const damp = st.hovered ? 21 : 18.5;

        [st.tx, st.vx] = stepSpringDt(st.tx, st.vx, st.targetTx, stiff, damp, h);
        [st.ty, st.vy] = stepSpringDt(st.ty, st.vy, st.targetTy, stiff, damp, h);
        [st.sx, st.vsx] = stepSpringDt(st.sx, st.vsx, st.targetSx, stiff, damp, h);
        [st.sy, st.vsy] = stepSpringDt(st.sy, st.vsy, st.targetSy, stiff, damp, h);
        [st.sk, st.vsk] = stepSpringDt(st.sk, st.vsk, st.targetSk, stiff, damp, h);
        [st.rx, st.vrx] = stepSpringDt(st.rx, st.vrx, st.targetRx, stiff, damp, h);
        [st.ry, st.vry] = stepSpringDt(st.ry, st.vry, st.targetRy, stiff, damp, h);

        const settled =
          !st.hovered &&
          Math.abs(st.tx) < 0.08 &&
          Math.abs(st.ty) < 0.08 &&
          Math.abs(st.sx - 1) < 0.0008 &&
          Math.abs(st.sy - 1) < 0.0008 &&
          Math.abs(st.sk) < 0.02 &&
          Math.abs(st.rx) < 0.04 &&
          Math.abs(st.ry) < 0.04 &&
          Math.abs(st.vx) < 0.6 &&
          Math.abs(st.vy) < 0.6;

        if (settled) {
          st.tx = 0; st.ty = 0; st.sx = 1; st.sy = 1; st.sk = 0; st.rx = 0; st.ry = 0;
          el.style.translate = '';
          el.style.scale = '';
          el.style.transform = '';
          activeLiquidEls.delete(el);
        } else {
          el.style.translate = `${st.tx.toFixed(2)}px ${st.ty.toFixed(2)}px`;
          el.style.scale = `${st.sx.toFixed(4)} ${st.sy.toFixed(4)}`;
          const hasTilt = Math.abs(st.rx) > 0.03 || Math.abs(st.ry) > 0.03;
          if (hasTilt) {
            el.style.transform = `perspective(1100px) rotateX(${st.rx.toFixed(2)}deg) rotateY(${st.ry.toFixed(2)}deg)${st.sk ? ` skewX(${st.sk.toFixed(2)}deg)` : ''}`;
          } else {
            el.style.transform = st.sk ? `skewX(${st.sk.toFixed(2)}deg)` : '';
          }
        }
      });

      if (activeLiquidEls.size > 0) {
        liquidRafId = requestAnimationFrame(liquidPhysicsTick);
      } else {
        lastLiquidTick = 0;
      }
    } catch (_) {
      lastLiquidTick = 0;
    }
  }

  function wakeLiquidPhysics() {
    if (!liquidRafId && !motionPaused && !fpsLowActive && activeLiquidEls.size > 0) {
      liquidRafId = requestAnimationFrame(liquidPhysicsTick);
    }
  }

  const mouse = { x: 0, y: 0, px: window.innerWidth / 2, py: window.innerHeight / 2 };
  const currentMouse = { x: 0, y: 0 };
  let heroVisible = true;
  let heroRafId = 0;

  const cursorGlint = document.getElementById('liquidCursorGlint');
  const liquidMouseCursor = document.getElementById('liquidMouseCursor');
  const liquidCursorDrop = document.getElementById('liquidCursorDrop');
  const lmcSat1 = liquidMouseCursor ? liquidMouseCursor.querySelector('.lmc-sat.s1') : null;
  const lmcSat2 = liquidMouseCursor ? liquidMouseCursor.querySelector('.lmc-sat.s2') : null;
  const liquidSuctionBridge = document.getElementById('liquidSuctionBridge');
  const liquidRimAura = document.getElementById('liquidRimAura');
  const liquidFallingDrop = document.getElementById('liquidFallingDrop');
  const liquidWetSplash = document.getElementById('liquidWetSplash');

  let glintVisible = false;
  let wakeCursorPhysics = () => {};
  let resetLiquidCursorVisuals = () => {};

  if (finePointer) {
    let currentHoveredChain = [];
    let nearGlassEl = null;
    let lastProbeAt = 0;
    let rawX = window.innerWidth * 0.5;
    let rawY = window.innerHeight * 0.35;
    let prevCursorX = rawX;
    let prevCursorY = rawY;
    let curVx = 0;
    let curVy = 0;
    let prevSpeed = 0;
    let moveAngle = 0;
    let jellyPos = 0;
    let jellyVel = 0;
    let baseSc = 1;
    let velBaseSc = 0;
    let cursorPressed = false;
    let sat1X = rawX, sat1Y = rawY, sat1Vx = 0, sat1Vy = 0;
    let sat2X = rawX, sat2Y = rawY, sat2Vx = 0, sat2Vy = 0;
    let rawTarget = null;
    let ptrFrameScheduled = false;
    let cursorRafId = 0;
    let lastCursorTick = 0;

    // Periodic Gravity Water Drip & Wet Lower-Frame Splash State (0% Idle CPU via Scheduled Wake!)
    let nextDripAt = performance.now() + 2400;
    let idleDripTimer = 0;
    const dripState = { active: false, x: 0, y: 0, vy: 0, targetY: 0, targetEl: null };
    const splashState = { active: false, x: 0, y: 0, age: 0, dur: 1.35 };

    function scheduleNextIdleDrip() {
      clearTimeout(idleDripTimer);
      if (motionPaused || fpsLowActive || !cursorPointerSeen || document.hidden) return;
      const waitMs = Math.max(220, nextDripAt - performance.now() + 20);
      idleDripTimer = setTimeout(() => {
        wakeCursorPhysics();
      }, waitMs);
    }

    resetLiquidCursorVisuals = () => {
      clearTimeout(idleDripTimer);
      dripState.active = false;
      splashState.active = false;
      if (liquidSuctionBridge) liquidSuctionBridge.style.opacity = '0';
      if (liquidRimAura) liquidRimAura.style.opacity = '0';
      if (liquidFallingDrop) liquidFallingDrop.style.opacity = '0';
      if (liquidWetSplash) liquidWetSplash.style.opacity = '0';
      if (cursorGlint) cursorGlint.style.opacity = '0';
      glintVisible = false;
    };

    // Pre-cache drip target candidates once at load (0 querySelectorAll per drip!)
    const dripCandidates = Array.from(
      document.querySelectorAll('.liquid-bar, .liquid-glass, .liquid-pill, .os-btn')
    ).map((el) => ({ el, sec: el.closest('.offscreen-opt') }));

    function spawnGravityWaterDrip(now) {
      if (!liquidFallingDrop || rawY > window.innerHeight - 80 || rawY < 8) return;
      let bestTop = window.innerHeight - 4;
      let bestEl = null;

      for (let i = 0; i < dripCandidates.length; i++) {
        const item = dripCandidates[i];
        if (item.sec && typeof skippedSections !== 'undefined' && skippedSections.has(item.sec)) continue;
        const el = item.el;
        const r = el.getBoundingClientRect();
        if (
          r.width > 28 &&
          r.height > 18 &&
          r.top > rawY + 34 &&
          r.top < bestTop &&
          rawX >= r.left + 6 &&
          rawX <= r.right - 6
        ) {
          bestTop = r.top + 2;
          bestEl = el;
        }
      }

      dripState.active = true;
      dripState.x = rawX;
      dripState.y = rawY + 14;
      dripState.vy = 55;
      dripState.targetY = bestTop;
      dripState.targetEl = bestEl;
      nextDripAt = now + 4200 + Math.random() * 1500;

      // Subtle neck-pinch jiggle on cursor droplet as teardrop detaches!
      jellyVel += 3.4;
      liquidFallingDrop.style.opacity = '0.96';
      liquidFallingDrop.style.transform = `translate3d(${dripState.x.toFixed(1)}px, ${dripState.y.toFixed(1)}px, 0) scale(1.08, 0.88)`;
    }

    function updateRimSuction() {
      if (!liquidSuctionBridge || !liquidRimAura) return 0;
      let el = currentHoveredChain[0] || nearGlassEl;
      if (!el || !el.isConnected || el.hidden || (el.closest && el.closest('[hidden]'))) {
        nearGlassEl = null;
        liquidSuctionBridge.style.opacity = '0';
        liquidRimAura.style.opacity = '0';
        return 0;
      }

      const st = getLiquidState(el);
      if (!st.rect) {
        const rr = el.getBoundingClientRect();
        if (rr.width < 16 || rr.height < 16) {
          nearGlassEl = null;
          liquidSuctionBridge.style.opacity = '0';
          liquidRimAura.style.opacity = '0';
          return 0;
        }
        st.rect = {
          left: rr.left - st.tx,
          top: rr.top - st.ty,
          width: rr.width,
          height: rr.height
        };
      }

      const rw = st.rect.width;
      const rh = st.rect.height;
      const left = st.rect.left + st.tx;
      const top = st.rect.top + st.ty;
      const right = left + rw;
      const bottom = top + rh;
      const inside = rawX >= left && rawX <= right && rawY >= top && rawY <= bottom;

      let edgeX = clamp(rawX, left + 10, right - 10);
      let edgeY = clamp(rawY, top + 8, bottom - 8);
      let edgeAng = 0;

      if (inside) {
        const dL = rawX - left;
        const dR = right - rawX;
        const dT = rawY - top;
        const dB = bottom - rawY;
        const m = Math.min(dL, dR, dT, dB);
        if (m === dT) { edgeX = clamp(rawX, left + 12, right - 12); edgeY = top; edgeAng = 0; }
        else if (m === dB) { edgeX = clamp(rawX, left + 12, right - 12); edgeY = bottom; edgeAng = 0; }
        else if (m === dL) { edgeX = left; edgeY = clamp(rawY, top + 10, bottom - 10); edgeAng = 90; }
        else { edgeX = right; edgeY = clamp(rawY, top + 10, bottom - 10); edgeAng = 90; }
      } else {
        const onLR = rawX < left || rawX > right;
        const onTB = rawY < top || rawY > bottom;
        edgeX = clamp(rawX, left, right);
        edgeY = clamp(rawY, top, bottom);
        edgeAng = (onLR && !onTB) ? 90 : 0;
      }

      const rimDist = Math.hypot(rawX - edgeX, rawY - edgeY);
      const maxReach = inside ? 38 : 42;

      if (rimDist > maxReach) {
        if (!inside) {
          if (nearGlassEl === el && !st.hovered) {
            st.targetTx = 0;
            st.targetTy = 0;
            activeLiquidEls.add(el);
            wakeLiquidPhysics();
          }
          nearGlassEl = null;
        }
        liquidSuctionBridge.style.opacity = '0';
        liquidRimAura.style.opacity = '0';
        return inside ? 0.30 : 0;
      }

      const k = 1 - rimDist / maxReach;
      liquidRimAura.style.opacity = (k * 0.82).toFixed(3);
      liquidRimAura.style.transform = `translate3d(${edgeX.toFixed(1)}px, ${edgeY.toFixed(1)}px, 0) rotate(${edgeAng}deg) scale(${(0.5 + k * 0.65).toFixed(3)}, ${(0.55 + k * 0.55).toFixed(3)})`;

      if (rimDist > 3 && !inside) {
        const bAng = Math.atan2(rawY - edgeY, rawX - edgeX) * (180 / Math.PI);
        const sx = clamp(rimDist / 46, 0.14, 0.95);
        const sy = clamp(0.32 + k * 0.56, 0.32, 0.88);
        liquidSuctionBridge.style.opacity = (k * 0.72).toFixed(3);
        liquidSuctionBridge.style.transform = `translate3d(${edgeX.toFixed(1)}px, ${edgeY.toFixed(1)}px, 0) rotate(${bAng.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      } else {
        liquidSuctionBridge.style.opacity = '0';
      }

      // Outer magnetic water suction: gently pull approached glass rim toward cursor even before entry!
      if (!inside && !st.hovered && !el.classList.contains('liquid-taskbar-dock')) {
        const cx = left + rw * 0.5;
        const cy = top + rh * 0.5;
        const nx = clamp((rawX - cx) / (rw * 0.6), -1, 1);
        const ny = clamp((rawY - cy) / (rh * 0.6), -1, 1);
        st.targetTx = nx * k * 4.5;
        st.targetTy = ny * k * 4.5;
        activeLiquidEls.add(el);
        wakeLiquidPhysics();
      }

      return k;
    }

    function cursorPhysicsTick(now) {
      cursorRafId = 0;
      if (motionPaused || fpsLowActive || !cursorPointerSeen || document.hidden) {
        lastCursorTick = 0;
        return;
      }
      const hadPrevTick = lastCursorTick > 0;
      const rawDt = hadPrevTick && now ? (now - lastCursorTick) / 1000 : 1 / detectedHz;
      if (hadPrevTick && now) recordLoopDelta(now - lastCursorTick);
      lastCursorTick = now || performance.now();
      const dt = clamp(rawDt, 0.0004, 0.034);
      const h = dt * 0.5;

      try {
        const instVx = (rawX - prevCursorX) / dt;
        const instVy = (rawY - prevCursorY) / dt;
        prevCursorX = rawX;
        prevCursorY = rawY;

        const vBlend = 1 - Math.exp(-24 * dt);
        curVx += (instVx - curVx) * vBlend;
        curVy += (instVy - curVy) * vBlend;
        const speed = Math.hypot(curVx, curVy);

        if (speed > 20) {
          moveAngle = Math.atan2(curVy, curVx) * (180 / Math.PI);
        }

        const accelImpulse = clamp((speed - prevSpeed) * 0.0032, -2.2, 2.2);
        prevSpeed = speed;
        jellyVel += accelImpulse;
        [jellyPos, jellyVel] = stepSpringDt(jellyPos, jellyVel, 0, 320, 13.5, h);

        const suctionK = updateRimSuction();
        const targetSc = cursorPressed ? 0.88 : (suctionK > 0.14 || currentHoveredChain.length ? 1.15 : 1.0);
        [baseSc, velBaseSc] = stepSpringDt(baseSc, velBaseSc, targetSc, 280, 18, h);

        const speedStretch = clamp(speed / 2850, 0, 0.22);
        const sx = clamp(baseSc * (1 + speedStretch + jellyPos * 0.18), 0.78, 1.34);
        const sy = clamp(baseSc * (1 - speedStretch * 0.48 - jellyPos * 0.15), 0.76, 1.30);

        if (liquidCursorDrop) {
          liquidCursorDrop.style.transform = `rotate(${moveAngle.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
        }

        // Ultra Mode Trailing Mercury Water Satellites
        if (fpsUltraActive && lmcSat1 && lmcSat2) {
          [sat1X, sat1Vx] = stepSpringDt(sat1X, sat1Vx, rawX, 175, 16, h);
          [sat1Y, sat1Vy] = stepSpringDt(sat1Y, sat1Vy, rawY, 175, 16, h);
          [sat2X, sat2Vx] = stepSpringDt(sat2X, sat2Vx, sat1X, 125, 14, h);
          [sat2Y, sat2Vy] = stepSpringDt(sat2Y, sat2Vy, sat1Y, 125, 14, h);

          const d1 = Math.hypot(sat1X - rawX, sat1Y - rawY);
          const d2 = Math.hypot(sat2X - rawX, sat2Y - rawY);
          lmcSat1.style.opacity = clamp(d1 / 18, 0, 0.92).toFixed(2);
          lmcSat2.style.opacity = clamp((d2 - 4) / 24, 0, 0.82).toFixed(2);
          lmcSat1.style.transform = `translate3d(${(sat1X - rawX).toFixed(1)}px, ${(sat1Y - rawY).toFixed(1)}px, 0)`;
          lmcSat2.style.transform = `translate3d(${(sat2X - rawX).toFixed(1)}px, ${(sat2Y - rawY).toFixed(1)}px, 0)`;
        } else if (lmcSat1 && lmcSat2) {
          sat1X = rawX; sat1Y = rawY; sat1Vx = 0; sat1Vy = 0;
          sat2X = rawX; sat2Y = rawY; sat2Vx = 0; sat2Vy = 0;
          lmcSat1.style.opacity = '0';
          lmcSat2.style.opacity = '0';
        }

        // Periodic Gravity Water Drip + Lower-Frame Wet Splash
        const clockNow = now || performance.now();
        if (!dripState.active && clockNow >= nextDripAt) {
          spawnGravityWaterDrip(clockNow);
        }

        if (dripState.active && liquidFallingDrop) {
          dripState.vy += 1220 * dt;
          dripState.y += dripState.vy * dt;
          const dropSy = clamp(0.86 + dripState.vy / 920, 0.86, 1.48);
          const dropSx = clamp(1.10 - dripState.vy / 2300, 0.74, 1.10);

          if (dripState.y >= dripState.targetY) {
            dripState.active = false;
            liquidFallingDrop.style.opacity = '0';
            splashState.active = true;
            splashState.x = dripState.x;
            splashState.y = dripState.targetY;
            splashState.age = 0;

            spawnHydroRipple(dripState.x, dripState.targetY);
            playWaterDrop('splash');

            if (dripState.targetEl && dripState.targetEl.isConnected) {
              const hitSt = getLiquidState(dripState.targetEl);
              hitSt.vy += 82;
              hitSt.vsy -= 0.28;
              hitSt.vsx += 0.20;
              activeLiquidEls.add(dripState.targetEl);
              wakeLiquidPhysics();
            }
          } else {
            liquidFallingDrop.style.transform = `translate3d(${dripState.x.toFixed(1)}px, ${dripState.y.toFixed(1)}px, 0) scale(${dropSx.toFixed(3)}, ${dropSy.toFixed(3)})`;
          }
        }

        if (splashState.active && liquidWetSplash) {
          splashState.age += dt;
          const p = clamp(splashState.age / splashState.dur, 0, 1);
          if (p >= 1) {
            splashState.active = false;
            liquidWetSplash.style.opacity = '0';
          } else {
            const spreadX = 0.24 + (1 - Math.pow(1 - p, 3)) * 1.78;
            const spreadY = Math.max(0.32, 1.32 - p * 0.95);
            const alpha = (1 - p) * (1 - p) * 0.96;
            liquidWetSplash.style.opacity = alpha.toFixed(3);
            liquidWetSplash.style.transform = `translate3d(${splashState.x.toFixed(1)}px, ${splashState.y.toFixed(1)}px, 0) scale(${spreadX.toFixed(3)}, ${spreadY.toFixed(3)})`;
          }
        }

        const satSettled =
          !fpsUltraActive ||
          (Math.hypot(sat1X - rawX, sat1Y - rawY) < 0.35 && Math.hypot(sat2X - rawX, sat2Y - rawY) < 0.35);

        const cursorSettled =
          speed < 0.8 &&
          Math.abs(jellyPos) < 0.0025 &&
          Math.abs(jellyVel) < 0.04 &&
          Math.abs(baseSc - targetSc) < 0.003 &&
          satSettled &&
          !dripState.active &&
          !splashState.active;

        if (cursorSettled) {
          if (liquidCursorDrop) {
            liquidCursorDrop.style.transform = `rotate(0deg) scale(${targetSc.toFixed(3)}, ${targetSc.toFixed(3)})`;
          }
          if (!currentHoveredChain.length && !nearGlassEl) {
            if (liquidSuctionBridge) liquidSuctionBridge.style.opacity = '0';
            if (liquidRimAura) liquidRimAura.style.opacity = '0';
          }
          lastCursorTick = 0;
          scheduleNextIdleDrip();
        } else {
          cursorRafId = requestAnimationFrame(cursorPhysicsTick);
        }
      } catch (_) {
        lastCursorTick = 0;
      }
    }

    wakeCursorPhysics = () => {
      clearTimeout(idleDripTimer);
      if (!cursorRafId && !motionPaused && !fpsLowActive && cursorPointerSeen && !document.hidden) {
        lastCursorTick = 0;
        cursorRafId = requestAnimationFrame(cursorPhysicsTick);
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        nextDripAt = performance.now() + 2500;
        wakeCursorPhysics();
      }
    });

    function processCoalescedPointer() {
      ptrFrameScheduled = false;
      if (motionPaused || fpsLowActive) return;

      if (heroVisible) {
        mouse.x = rawX / window.innerWidth - 0.5;
        mouse.y = rawY / window.innerHeight - 0.5;
        mouse.px = rawX;
        mouse.py = rawY;
        wakeHeroLoop();
      }

      const matched = [];
      let node = rawTarget;
      while (node && node !== document.body && matched.length < 1) {
        if (node.matches && node.matches(LIQUID_SELECTOR)) {
          matched.push(node);
        }
        node = node.parentElement;
      }

      if (matched.length > 0) {
        nearGlassEl = matched[0];
      }

      // Move ONE single GPU-composited glint via translate3d -> ZERO card gradient repaints!
      if (cursorGlint) {
        if (!fpsLowActive && matched.length > 0) {
          cursorGlint.style.transform = `translate3d(${rawX.toFixed(0)}px, ${rawY.toFixed(0)}px, 0)`;
          if (!glintVisible) {
            glintVisible = true;
            cursorGlint.style.opacity = '1';
          }
        } else if (glintVisible) {
          glintVisible = false;
          cursorGlint.style.opacity = '0';
        }
      }

      for (let i = 0; i < currentHoveredChain.length; i++) {
        const prev = currentHoveredChain[i];
        if (!matched.includes(prev)) {
          const st = getLiquidState(prev);
          st.hovered = false;
          st.pressed = false;
          // Keep cached `st.rect` while cursor pulls away so rim-suction bridge detaches with 0 layout reads!
          st.targetTx = 0;
          st.targetTy = 0;
          st.targetSx = 1;
          st.targetSy = 1;
          st.targetSk = 0;
          st.targetRx = 0;
          st.targetRy = 0;
          activeLiquidEls.add(prev);
        }
      }

      currentHoveredChain = matched;

      for (let i = 0; i < matched.length; i++) {
        const el = matched[i];
        const st = getLiquidState(el);
        if (!st.hovered || !st.rect) {
          const r = el.getBoundingClientRect();
          st.rect = {
            left: r.left - st.tx,
            top: r.top - st.ty,
            width: Math.max(40, r.width),
            height: Math.max(32, r.height)
          };
          st.hovered = true;
          jellyVel += 2.6; // Juicy surface-tension pop when cursor merges onto a glass frame!
        }

        const r = st.rect;
        const lx = rawX - r.left;
        const ly = rawY - r.top;

        const nx = clamp((lx / r.width - 0.5) * 2, -1.05, 1.05);
        const ny = clamp((ly / r.height - 0.5) * 2, -1.05, 1.05);

        const diag = Math.sqrt(r.width * r.width + r.height * r.height);
        const isLarge = diag > 480;
        const isTaskbarDock = el.classList && el.classList.contains('liquid-taskbar-dock');

        const pullAmp = isTaskbarDock ? 3.2 : (isLarge ? 5.6 : 9.8);
        const stretchAmp = isTaskbarDock ? 0.009 : (isLarge ? 0.017 : 0.048);
        const skewAmp = isTaskbarDock ? 0 : (isLarge ? 0.5 : 1.45);
        const pressBoost = st.pressed ? 0.035 : 0.01;

        st.targetTx = nx * pullAmp;
        st.targetTy = ny * pullAmp;

        const ax = Math.abs(nx);
        const ay = Math.abs(ny);
        st.targetSx = 1 + ax * stretchAmp - ay * (stretchAmp * 0.3) + pressBoost;
        st.targetSy = 1 + ay * stretchAmp - ax * (stretchAmp * 0.3) + pressBoost;
        st.targetSk = nx * ny * skewAmp;

        const canTilt = fpsUltraActive && el.hasAttribute && el.hasAttribute('data-tilt3d');
        st.targetRx = canTilt ? -ny * 5.2 : 0;
        st.targetRy = canTilt ? nx * 5.8 : 0;

        activeLiquidEls.add(el);
      }

      if (activeLiquidEls.size > 0) wakeLiquidPhysics();
    }

    document.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      rawX = e.clientX;
      rawY = e.clientY;
      rawTarget = e.target;

      if (!cursorPointerSeen) {
        cursorPointerSeen = true;
        prevCursorX = rawX;
        prevCursorY = rawY;
        sat1X = rawX; sat1Y = rawY;
        sat2X = rawX; sat2Y = rawY;
        syncLiquidCursorClass();
      }

      if (!motionPaused && !fpsLowActive) {
        // 0ms latency direct outer translation -> zero lag, silky hardware pointer speed!
        if (liquidMouseCursor) {
          liquidMouseCursor.style.transform = `translate3d(${rawX.toFixed(1)}px, ${rawY.toFixed(1)}px, 0)`;
        }
        wakeCursorPhysics();
        if (!ptrFrameScheduled) {
          ptrFrameScheduled = true;
          requestAnimationFrame(processCoalescedPointer);
        }
      }
    }, { passive: true });

    // Tactile Video-2 Touch-Bloom & Water Droplet Squish on Press!
    document.addEventListener('pointerdown', (e) => {
      if (motionPaused || fpsLowActive || e.pointerType === 'touch') return;
      cursorPressed = true;
      jellyVel -= 4.2;
      wakeCursorPhysics();
      const el = e.target && e.target.closest ? e.target.closest(LIQUID_SELECTOR) : null;
      if (el && !el.classList.contains('liquid-taskbar-dock')) {
        const st = getLiquidState(el);
        st.pressed = true;
        st.targetSx = Math.max(st.targetSx, 1.05);
        st.targetSy = Math.max(st.targetSy, 1.05);
        activeLiquidEls.add(el);
        wakeLiquidPhysics();
      }
    }, { passive: true });

    const releaseCursorPress = () => {
      if (!cursorPressed && !currentHoveredChain.length) return;
      cursorPressed = false;
      jellyVel += 4.6;
      wakeCursorPhysics();
      currentHoveredChain.forEach((el) => {
        const st = liquidStates.get(el);
        if (st && st.pressed) {
          st.pressed = false;
          st.targetSx = 1.012;
          st.targetSy = 1.012;
          activeLiquidEls.add(el);
          wakeLiquidPhysics();
        }
      });
    };

    document.addEventListener('pointerup', releaseCursorPress, { passive: true });
    document.addEventListener('pointercancel', releaseCursorPress, { passive: true });
    window.addEventListener('blur', releaseCursorPress, { passive: true });
    document.addEventListener('dragstart', (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest('a, img, .liquid-glass, .liquid-pill, .liquid-bar')) {
        ev.preventDefault();
      }
    });

    window.addEventListener('scroll', () => {
      for (let i = 0; i < currentHoveredChain.length; i++) {
        const st = liquidStates.get(currentHoveredChain[i]);
        if (st) st.rect = null;
      }
      if (nearGlassEl) {
        const nst = liquidStates.get(nearGlassEl);
        if (nst) nst.rect = null;
      }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     3. LIGHTWEIGHT WORD-LEVEL SPLIT REVEAL (100% PLAY BY DEFAULT!)
     Word-level (instead of 400+ char spans) -> 6x fewer DOM nodes!
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    let wordIdx = 0;

    const appendWords = (text, tagName, cls) => {
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          el.appendChild(document.createTextNode(' '));
          return;
        }
        const w = document.createElement('span');
        w.className = 'word';
        const inner = document.createElement(tagName || 'span');
        inner.className = cls ? `${cls} char` : 'char';
        inner.style.setProperty('--i', String(wordIdx * 3));
        wordIdx++;
        inner.textContent = part;
        w.appendChild(inner);
        el.appendChild(w);
      });
    };

    nodes.forEach((n) => {
      if (n.nodeType === 3) appendWords(n.textContent, 'span', '');
      else if (n.nodeType === 1 && n.tagName === 'BR') el.appendChild(document.createElement('br'));
      else if (n.nodeType === 1) appendWords(n.textContent, n.tagName.toLowerCase(), n.className);
    });
  });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-split]').forEach((el) => revealIO.observe(el));

  /* ------------------------------------------------------------------------
     4. DRAGGABLE 2-LAYER IOS 26 WATER-DROPLET & COALESCE-BLUR TASKBAR ENGINE
     - Hover: Soft misty orientation ghost (NEVER steals active droplet!)
     - Click: Viscous 2-edge water suction + Video-2 metaball coalesce blur!
     - Drag: Grab & scrub the clear water droplet directly across tabs!
     ------------------------------------------------------------------------ */
  const siteHeader = document.getElementById('siteHeader');
  const dockControllers = new Map();
  const activeDocks = new Set();
  let dockLoopRunning = false;
  let lastDockTickTime = 0;

  const BASE_DROPLET_W = 64;
  const BASE_DROPLET_H = 42;

  function renderDockDropletImmediate(st) {
    const left = Math.min(st.posA, st.posB);
    const span = Math.max(24, Math.abs(st.posB - st.posA));
    if (st.isVertical) {
      const sy = span / BASE_DROPLET_H;
      st.droplet.style.transform = `translate3d(0, ${left.toFixed(2)}px, 0) scale(1, ${sy.toFixed(4)})`;
    } else {
      const sx = span / BASE_DROPLET_W;
      st.droplet.style.transform = `translate3d(${left.toFixed(2)}px, 0, 0) scale(${sx.toFixed(4)}, 1)`;
    }
    st.droplet.style.filter = '';
    if (st.trail) st.trail.style.opacity = '0';
  }

  function dockPhysicsTick(now) {
    if (!activeDocks.size || document.hidden) {
      dockLoopRunning = false;
      lastDockTickTime = 0;
      return;
    }
    if (motionPaused) {
      snapAllLiquidDocks();
      dockLoopRunning = false;
      lastDockTickTime = 0;
      return;
    }

    dockLoopRunning = true;
    if (lastDockTickTime && now) recordLoopDelta(now - lastDockTickTime);
    const rawDt = lastDockTickTime ? (now - lastDockTickTime) / 1000 : 1 / detectedHz;
    lastDockTickTime = now;
    const dt = clamp(rawDt, 0.0004, 0.034);
    const h = dt * 0.5;

    activeDocks.forEach((st) => {
      const isDrag = st.dragging;
      const stiffLead = isDrag ? 440 : 215;
      const dampLead = isDrag ? 35 : 23.5;
      const stiffTrail = isDrag ? 220 : 46;
      const dampTrail = isDrag ? 25 : 9.4;

      const stiffA = st.dir >= 0 ? stiffTrail : stiffLead;
      const dampA = st.dir >= 0 ? dampTrail : dampLead;
      const stiffB = st.dir >= 0 ? stiffLead : stiffTrail;
      const dampB = st.dir >= 0 ? dampLead : dampTrail;

      const targetSwell = isDrag ? 0.20 : 0;

      for (let s = 0; s < 2; s++) {
        const accA = (st.targetA - st.posA) * stiffA - st.velA * dampA;
        st.velA += accA * h;
        st.posA += st.velA * h;

        const accB = (st.targetB - st.posB) * stiffB - st.velB * dampB;
        st.velB += accB * h;
        st.posB += st.velB * h;

        const accSw = (targetSwell - st.swell) * 148 - st.velSwell * 10.2;
        st.velSwell += accSw * h;
        st.swell += st.velSwell * h;
      }

      // 100% Compositor Mist Trail (0 filter:blur() shader, pure transform + opacity!)
      if (st.trailAlpha > 0.01) {
        st.trailAlpha = Math.max(0, st.trailAlpha - dt * 3.8);
        if (st.trail) {
          const shrink = 0.65 + st.trailAlpha * 0.45;
          st.trail.style.opacity = (st.trailAlpha * 0.85).toFixed(3);
          if (st.isVertical) {
            const sy = (st.trailSpan / BASE_DROPLET_H) * shrink;
            st.trail.style.transform = `translate3d(0, ${st.trailPos.toFixed(1)}px, 0) scale(${shrink.toFixed(3)}, ${sy.toFixed(3)})`;
          } else {
            const sx = (st.trailSpan / BASE_DROPLET_W) * shrink;
            st.trail.style.transform = `translate3d(${st.trailPos.toFixed(1)}px, 0, 0) scale(${sx.toFixed(3)}, ${shrink.toFixed(3)})`;
          }
        }
      } else if (st.trail && st.trailAlpha !== 0) {
        st.trailAlpha = 0;
        st.trail.style.opacity = '0';
      }

      const naturalSpan = Math.max(26, st.targetB - st.targetA);
      const left = Math.min(st.posA, st.posB);
      const curSpan = Math.max(24, Math.abs(st.posB - st.posA));
      const stretch = Math.max(0, (curSpan - naturalSpan) / naturalSpan);

      const trailSpeed = Math.abs(st.dir >= 0 ? st.velA : st.velB);
      const nearTarget = Math.abs(st.dir >= 0 ? st.targetA - st.posA : st.targetB - st.posB) < naturalSpan * 0.55;
      const arrivalPlump = (!isDrag && nearTarget) ? Math.min(0.085, (trailSpeed / 920) * 0.09) : 0;
      const neckPinch = isDrag ? 0 : Math.min(0.10, stretch * 0.05);
      const crossScale = clamp(1 + st.swell + arrivalPlump - neckPinch, 0.90, 1.24);

      const settled =
        !isDrag &&
        st.trailAlpha <= 0.01 &&
        Math.abs(st.targetA - st.posA) < 0.15 &&
        Math.abs(st.targetB - st.posB) < 0.15 &&
        Math.abs(st.velA) < 1.3 &&
        Math.abs(st.velB) < 1.3 &&
        Math.abs(st.swell) < 0.002 &&
        Math.abs(st.velSwell) < 0.02;

      if (settled) {
        st.posA = st.targetA;
        st.posB = st.targetB;
        st.velA = 0;
        st.velB = 0;
        st.swell = 0;
        st.velSwell = 0;
        renderDockDropletImmediate(st);
        activeDocks.delete(st);
      } else if (st.isVertical) {
        const sy = curSpan / BASE_DROPLET_H;
        st.droplet.style.transform = `translate3d(0, ${left.toFixed(2)}px, 0) scale(${crossScale.toFixed(4)}, ${sy.toFixed(4)})`;
      } else {
        const sx = curSpan / BASE_DROPLET_W;
        st.droplet.style.transform = `translate3d(${left.toFixed(2)}px, 0, 0) scale(${sx.toFixed(4)}, ${crossScale.toFixed(4)})`;
      }
    });

    if (activeDocks.size > 0) {
      requestAnimationFrame(dockPhysicsTick);
    } else {
      dockLoopRunning = false;
      lastDockTickTime = 0;
    }
  }

  function wakeDockPhysics() {
    if (!dockLoopRunning && !motionPaused && activeDocks.size > 0 && !document.hidden) {
      dockLoopRunning = true;
      lastDockTickTime = 0;
      requestAnimationFrame(dockPhysicsTick);
    }
  }

  function syncTabAccessibility(tabs, activeTab, isTablist) {
    tabs.forEach((t) => {
      const isActive = t === activeTab;
      t.classList.toggle('active', isActive);
      if (isTablist || t.getAttribute('role') === 'tab') {
        t.setAttribute('aria-selected', String(isActive));
        t.toggleAttribute('focusgroupstart', isActive);
      } else if (t.getAttribute('role') === 'radio') {
        t.setAttribute('aria-checked', String(isActive));
      } else if (t.tagName === 'A') {
        if (isActive) t.setAttribute('aria-current', 'true');
        else t.removeAttribute('aria-current');
      } else if (t.tagName === 'BUTTON') {
        t.setAttribute('aria-pressed', String(isActive));
      }
    });
  }

  function triggerIconBounce(tab) {
    if (!tab || motionPaused) return;
    tab.classList.remove('icon-pop');
    requestAnimationFrame(() => tab.classList.add('icon-pop'));
  }

  function createLiquidDock(dockEl) {
    const tabs = Array.from(dockEl.children).filter((c) => c.tagName === 'A' || c.tagName === 'BUTTON');
    if (!tabs.length) return null;

    let ghost = dockEl.querySelector(':scope > .liquid-dock-ghost');
    if (!ghost) {
      ghost = document.createElement('span');
      ghost.className = 'liquid-dock-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      dockEl.prepend(ghost);
    }

    let trail = dockEl.querySelector(':scope > .liquid-dock-trail');
    if (!trail) {
      trail = document.createElement('span');
      trail.className = 'liquid-dock-trail';
      trail.setAttribute('aria-hidden', 'true');
      ghost.after(trail);
    }

    let droplet = dockEl.querySelector(':scope > .liquid-dock-droplet');
    if (!droplet) {
      droplet = document.createElement('span');
      droplet.className = 'liquid-dock-droplet';
      droplet.setAttribute('aria-hidden', 'true');
      trail.after(droplet);
    }

    const isTablist = dockEl.getAttribute('role') === 'tablist';
    const initialActive = tabs.find((t) => t.classList.contains('active')) || tabs[0];
    syncTabAccessibility(tabs, initialActive, isTablist);

    const st = {
      dockEl,
      tabs,
      ghost,
      trail,
      droplet,
      isTablist,
      isVertical: false,
      scrollable: false,
      activeTab: initialActive,
      hoveredTab: null,
      initialized: false,
      dragging: false,
      posA: 0,
      posB: 66,
      velA: 0,
      velB: 0,
      targetA: 0,
      targetB: 66,
      dir: 1,
      swell: 0,
      velSwell: 0,
      trailAlpha: 0,
      trailPos: 0,
      trailSpan: 64
    };

    function getBoundsForTab(tab) {
      if (st.isVertical) {
        return [tab.offsetTop - 2, tab.offsetTop + tab.offsetHeight + 2];
      }
      const bleed = st.scrollable ? 1 : 3;
      return [tab.offsetLeft - bleed, tab.offsetLeft + tab.offsetWidth + bleed];
    }

    function spawnCoalesceTrail(fromTab) {
      if (!fromTab || motionPaused || !trail || !fromTab.offsetWidth) return;
      const [a, b] = getBoundsForTab(fromTab);
      st.trailPos = a;
      st.trailSpan = Math.max(24, b - a);
      st.trailAlpha = 1;
      if (st.isVertical) {
        const sy = st.trailSpan / BASE_DROPLET_H;
        trail.style.transform = `translate3d(0, ${a.toFixed(1)}px, 0) scale(1, ${sy.toFixed(3)})`;
      } else {
        const sx = st.trailSpan / BASE_DROPLET_W;
        trail.style.transform = `translate3d(${a.toFixed(1)}px, 0, 0) scale(${sx.toFixed(3)}, 1)`;
      }
    }

    function updateGhost(tab) {
      st.hoveredTab = tab;
      if (st.dragging || !tab || tab === st.activeTab || !tab.offsetWidth) {
        ghost.style.opacity = '0';
        return;
      }
      if (st.isVertical) {
        const sy = tab.offsetHeight / BASE_DROPLET_H;
        ghost.style.transform = `translate3d(0, ${tab.offsetTop}px, 0) scale(1, ${sy.toFixed(4)})`;
      } else {
        const sx = tab.offsetWidth / BASE_DROPLET_W;
        ghost.style.transform = `translate3d(${tab.offsetLeft}px, 0, 0) scale(${sx.toFixed(4)}, 1)`;
      }
      ghost.style.opacity = '1';
    }

    function measure(snapImmediate) {
      const wasVertical = st.isVertical;
      st.isVertical = getComputedStyle(dockEl).flexDirection === 'column';
      dockEl.classList.toggle('is-vertical', st.isVertical);

      if (!st.isVertical) {
        dockEl.classList.remove('is-scrollable');
        const last = tabs[tabs.length - 1];
        const neededW = last ? last.offsetLeft + last.offsetWidth + 6 : 0;
        st.scrollable = dockEl.clientWidth > 0 && neededW > dockEl.clientWidth + 2;
        dockEl.classList.toggle('is-scrollable', st.scrollable);
        if (st.scrollable && !st.fadeIO && !(window.CSS && CSS.supports('animation-timeline', 'scroll()'))) {
          const firstTab = tabs[0];
          const lastTab = tabs[tabs.length - 1];
          st.fadeIO = new IntersectionObserver((entries) => {
            for (const entry of entries) {
              dockEl.classList.toggle(entry.target === firstTab ? 'more-start' : 'more-end', entry.intersectionRatio < 1);
            }
          }, { root: dockEl, threshold: 1, rootMargin: '1px' });
          st.fadeIO.observe(firstTab);
          st.fadeIO.observe(lastTab);
        } else if (!st.scrollable && st.fadeIO) {
          st.fadeIO.disconnect();
          st.fadeIO = null;
          dockEl.classList.remove('more-start', 'more-end');
        }
      } else {
        st.scrollable = false;
        dockEl.classList.remove('is-scrollable');
      }

      if (!st.activeTab || !st.activeTab.offsetWidth) return;
      const [a, b] = getBoundsForTab(st.activeTab);
      st.targetA = a;
      st.targetB = b;

      if (snapImmediate || !st.initialized || wasVertical !== st.isVertical || motionPaused) {
        st.posA = a;
        st.posB = b;
        st.velA = 0;
        st.velB = 0;
        st.swell = 0;
        st.velSwell = 0;
        st.trailAlpha = 0;
        st.initialized = true;
        renderDockDropletImmediate(st);
      } else {
        activeDocks.add(st);
        wakeDockPhysics();
      }

      if (st.hoveredTab) updateGhost(st.hoveredTab);
    }

    function setActive(nextTab, opts = {}) {
      if (!nextTab || !tabs.includes(nextTab)) return;
      const prevTab = st.activeTab;
      const changed = nextTab !== prevTab;
      st.activeTab = nextTab;
      syncTabAccessibility(tabs, nextTab, isTablist);

      if (st.hoveredTab === nextTab) ghost.style.opacity = '0';

      if (!nextTab.offsetWidth) {
        measure(true);
        return;
      }

      const [nextA, nextB] = getBoundsForTab(nextTab);
      if (changed) {
        st.dir = nextA >= st.posA ? 1 : -1;
        if (!opts.fromDragRelease) spawnCoalesceTrail(prevTab);
        if (opts.bounceIcon !== false) {
          triggerIconBounce(nextTab);
          playWaterDrop('plop');
        }
      }
      st.targetA = nextA;
      st.targetB = nextB;

      if (st.scrollable && opts.scrollDock !== false) {
        const desiredLeft = nextTab.offsetLeft - (dockEl.clientWidth - nextTab.offsetWidth) * 0.5;
        dockEl.scrollTo({
          left: Math.max(0, desiredLeft),
          behavior: motionPaused ? 'auto' : 'smooth'
        });
      }

      if (opts.animate === false || motionPaused || !st.initialized) {
        st.posA = nextA;
        st.posB = nextB;
        st.velA = 0;
        st.velB = 0;
        st.swell = 0;
        st.velSwell = 0;
        st.trailAlpha = 0;
        st.initialized = true;
        activeDocks.delete(st);
        renderDockDropletImmediate(st);
      } else if (changed || Math.abs(nextA - st.posA) > 0.5 || Math.abs(nextB - st.posB) > 0.5) {
        st.velSwell = clamp(st.velSwell + 1.58, -2.4, 2.65);
        activeDocks.add(st);
        wakeDockPhysics();
      }
    }

    // ---- HAND DRAG-TO-SCRUB DROPLET INTERACTION (Video 2 00:21-00:30!) ----
    let dragPtrId = null;
    let downX = 0;
    let downY = 0;
    let dragActive = false;
    let suppressClickUntil = 0;
    let dragHoverTab = null;
    let dragDockRect = null;

    function findClosestTab(localCoord) {
      let best = tabs[0];
      let bestDist = Infinity;
      for (let i = 0; i < tabs.length; i++) {
        const t = tabs[i];
        const center = st.isVertical
          ? t.offsetTop + t.offsetHeight * 0.5
          : t.offsetLeft + t.offsetWidth * 0.5;
        const d = Math.abs(localCoord - center);
        if (d < bestDist) {
          bestDist = d;
          best = t;
        }
      }
      return best;
    }

    dockEl.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 || st.scrollable) return;
      dragPtrId = ev.pointerId;
      downX = ev.clientX;
      downY = ev.clientY;
      dragActive = false;
      dragHoverTab = st.activeTab;
      dragDockRect = dockEl.getBoundingClientRect();
    });

    dockEl.addEventListener('pointermove', (ev) => {
      if (dragPtrId !== ev.pointerId || !dragDockRect) return;
      const dx = ev.clientX - downX;
      const dy = ev.clientY - downY;
      const axisDelta = st.isVertical ? Math.abs(dy) : Math.abs(dx);

      if (!dragActive) {
        if (axisDelta < 5) return;
        dragActive = true;
        st.dragging = true;
        dockEl.classList.add('is-dragging');
        ghost.style.opacity = '0';
        try { dockEl.setPointerCapture(ev.pointerId); } catch (_) {}
      }

      const first = tabs[0];
      const last = tabs[tabs.length - 1];
      const local = st.isVertical
        ? ev.clientY - dragDockRect.top + dockEl.scrollTop
        : ev.clientX - dragDockRect.left + dockEl.scrollLeft;

      const nearest = findClosestTab(local);
      if (nearest !== dragHoverTab) {
        if (dragHoverTab) {
          dragHoverTab.classList.remove('drag-over');
          spawnCoalesceTrail(dragHoverTab);
        }
        dragHoverTab = nearest;
        if (dragHoverTab) dragHoverTab.classList.add('drag-over');
      }

      const span = st.isVertical
        ? (nearest ? nearest.offsetHeight + 4 : 44)
        : (nearest ? nearest.offsetWidth + 6 : 70);
      const minBound = st.isVertical ? first.offsetTop - 2 : first.offsetLeft - 3;
      const maxBound = st.isVertical
        ? last.offsetTop + last.offsetHeight + 2
        : last.offsetLeft + last.offsetWidth + 3;

      const clampedStart = clamp(local - span * 0.5, minBound, Math.max(minBound, maxBound - span));
      st.dir = clampedStart >= st.posA ? 1 : -1;
      st.targetA = clampedStart;
      st.targetB = clampedStart + span;

      activeDocks.add(st);
      wakeDockPhysics();
    });

    function finishDrag(ev) {
      if (dragPtrId !== ev.pointerId) return;
      const wasDragging = dragActive;
      dragPtrId = null;
      dragActive = false;
      dragDockRect = null;
      st.dragging = false;
      dockEl.classList.remove('is-dragging');
      tabs.forEach((t) => t.classList.remove('drag-over'));
      try {
        if (dockEl.hasPointerCapture(ev.pointerId)) dockEl.releasePointerCapture(ev.pointerId);
      } catch (_) {}

      if (wasDragging && dragHoverTab) {
        suppressClickUntil = performance.now() + 260;
        const chosen = dragHoverTab;
        dragHoverTab = null;
        setActive(chosen, { animate: true, scrollDock: true, fromDragRelease: true, bounceIcon: true });

        // Activate underlying section scroll or tab action seamlessly!
        if (chosen.tagName === 'A') {
          const href = chosen.getAttribute('href') || '';
          if (href.startsWith('#')) {
            const sec = document.getElementById(href.slice(1));
            if (sec) {
              markNavClickLock();
              sec.scrollIntoView({ behavior: motionPaused ? 'auto' : 'smooth', block: 'start' });
            }
          }
        } else {
          // Dispatch synthetic activation after suppression window for button docks
          chosen.dispatchEvent(new CustomEvent('dockselect', { bubbles: true }));
        }
      } else {
        dragHoverTab = null;
      }
    }

    dockEl.addEventListener('pointerup', finishDrag);
    dockEl.addEventListener('pointercancel', finishDrag);

    tabs.forEach((tab, idx) => {
      tab.addEventListener('dragstart', (ev) => ev.preventDefault());
      tab.addEventListener('pointerenter', () => updateGhost(tab));
      tab.addEventListener('focus', () => {
        if (tab !== st.activeTab) updateGhost(tab);
      });
      tab.addEventListener('blur', () => {
        if (st.hoveredTab === tab) ghost.style.opacity = '0';
      });

      tab.addEventListener('click', (ev) => {
        if (performance.now() < suppressClickUntil) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          return;
        }
        setActive(tab, { animate: true, scrollDock: true, bounceIcon: true });
      });

      if (isTablist && !('focusGroup' in HTMLElement.prototype)) {
        tab.addEventListener('keydown', (ev) => {
          const nextKeys = st.isVertical ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight', 'ArrowDown'];
          const prevKeys = st.isVertical ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft', 'ArrowUp'];
          let nextIdx = -1;
          if (nextKeys.includes(ev.key)) nextIdx = (idx + 1) % tabs.length;
          else if (prevKeys.includes(ev.key)) nextIdx = (idx - 1 + tabs.length) % tabs.length;
          else if (ev.key === 'Home') nextIdx = 0;
          else if (ev.key === 'End') nextIdx = tabs.length - 1;
          if (nextIdx >= 0) {
            ev.preventDefault();
            tabs[nextIdx].focus();
            tabs[nextIdx].click();
          }
        });
      }
    });

    dockEl.addEventListener('pointerleave', () => updateGhost(null));
    dockEl.classList.add('dock-ready');
    measure(true);

    const api = {
      measure,
      setActive,
      getActive: () => st.activeTab
    };
    dockControllers.set(dockEl.id || dockEl, api);
    return api;
  }

  function snapAllLiquidDocks() {
    dockControllers.forEach((ctrl) => ctrl.measure(true));
  }

  let navClickLockUntil = 0;
  function markNavClickLock() {
    navClickLockUntil = performance.now() + 1150;
  }

  document.querySelectorAll('[data-liquid-dock]').forEach((el) => createLiquidDock(el));

  window.addEventListener('resize', debounce(() => {
    dockControllers.forEach((ctrl) => ctrl.measure(true));
  }, 120), { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      dockControllers.forEach((ctrl) => ctrl.measure(true));
    });
  }

  const navDock = dockControllers.get('navCapsule');
  const navItems = Array.from(document.querySelectorAll('.nav-item'));

  navItems.forEach((item) => {
    item.addEventListener('click', () => markNavClickLock());
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    if (anchor.classList.contains('nav-item')) return;
    anchor.addEventListener('click', () => {
      const secId = (anchor.getAttribute('href') || '').slice(1);
      const match = navItems.find((n) => n.dataset.sec === secId);
      if (match && navDock) {
        markNavClickLock();
        navDock.setActive(match, { animate: true, scrollDock: true, bounceIcon: true });
      }
    });
  });

  const sectionSpy = new IntersectionObserver((entries) => {
    if (performance.now() < navClickLockUntil) return;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const match = navItems.find((n) => n.dataset.sec === entry.target.id);
      if (match && navDock && navDock.getActive() !== match) {
        navDock.setActive(match, { animate: true, scrollDock: true, bounceIcon: false });
      }
    });
  }, { rootMargin: '-36% 0px -52% 0px' });

  ['hero', 'anatomy', 'skins', 'architecture', 'specs', 'driver', 'download'].forEach((id) => {
    const sec = document.getElementById(id);
    if (sec) sectionSpy.observe(sec);
  });

  /* ------------------------------------------------------------------------
     5. INTERRUPTIBLE 3D HERO SPIN-SWAP & SILKY TONE-SWEEP WAVE
     ------------------------------------------------------------------------ */
  const productRig = document.getElementById('productRig');
  const heroMouseImg = document.getElementById('heroMouseImg');
  const studioMouseImg = document.getElementById('studioMouseImg');
  const dlMouseImg = document.getElementById('dlMouseImg');
  const heroEditionTag = document.getElementById('heroEditionTag');
  const heroScriptLeft = document.getElementById('heroScriptLeft');
  const heroBoldLeft = document.getElementById('heroBoldLeft');
  const heroScriptRight = document.getElementById('heroScriptRight');
  const heroBoldRight = document.getElementById('heroBoldRight');
  const orbsFG = document.getElementById('orbsFG');
  const orbsBG = document.getElementById('orbsBG');
  const allOrbs = Array.from(document.querySelectorAll('.floating-orb'));
  const rigHuds = Array.from(document.querySelectorAll('#productRig .rig-hud'));
  const editionCards = Array.from(document.querySelectorAll('.edition-card'));
  const edCounter = document.getElementById('edCounter');
  const toneLayers = Array.from(document.querySelectorAll('.tone-layer'));
  const toneSweepWave = document.getElementById('toneSweepWave');
  const themeMetaEl = document.querySelector('meta[name="theme-color"]');

  const spinObj = { val: 0 };
  let isSwitching = false;
  let switchSpin = 0;

  const orbState = allOrbs.map((el) => ({
    el,
    img: el.querySelector('img'),
    cx: 0,
    cy: 0,
    rx: 0,
    ry: 0,
    baseX: 0,
    baseY: 0
  }));

  function cacheOrbCenters() {
    if (window.innerWidth <= 1040) return;
    orbState.forEach((o) => {
      const r = o.el.getBoundingClientRect();
      o.cx = r.left + r.width / 2 - o.rx - o.baseX;
      o.cy = r.top + r.height / 2 - o.ry - o.baseY;
    });
  }
  cacheOrbCenters();
  window.addEventListener('resize', debounce(cacheOrbCenters, 180), { passive: true });

  function getMidSrc(fullSrc) {
    if (!fullSrc || fullSrc === 'assets/mouse-hero.webp') return 'assets/mouse-hero-480.webp';
    if (
      fullSrc.startsWith('assets/skins/') &&
      !fullSrc.startsWith('assets/skins/mid/') &&
      !fullSrc.startsWith('assets/skins/thumbs/')
    ) {
      return fullSrc.replace('assets/skins/', 'assets/skins/mid/');
    }
    return fullSrc;
  }

  function setResponsiveMouseImg(imgEl, fullSrc, sizesStr) {
    if (!imgEl) return;
    const midSrc = getMidSrc(fullSrc);
    imgEl.srcset = `${midSrc} 480w, ${fullSrc} 944w`;
    if (sizesStr) imgEl.sizes = sizesStr;
    imgEl.src = midSrc;
  }

  let fadeLayerTimer = 0;
  function switchToneLayers(nextKey) {
    clearTimeout(fadeLayerTimer);
    toneLayers.forEach((layer) => {
      const isNext = layer.dataset.tb === nextKey;
      if (layer.classList.contains('active') && !isNext) {
        layer.classList.add('fading');
      }
      layer.classList.toggle('active', isNext);
    });
    fadeLayerTimer = setTimeout(() => {
      toneLayers.forEach((layer) => layer.classList.remove('fading'));
    }, 760);
  }

  // Pre-decode all 4 tone hero cutouts at idle -> 0ms WebP decode hitch during Ultra spin-swap!
  window.addEventListener('load', () => {
    setTimeout(() => {
      ['assets/mouse-hero-480.webp', 'assets/skins/mid/A03.webp', 'assets/skins/mid/F02.webp', 'assets/skins/mid/C07.webp'].forEach((src) => {
        const im = new Image();
        im.decoding = 'async';
        im.src = src;
        if (typeof im.decode === 'function') im.decode().catch(() => {});
      });
    }, 380);
  }, { once: true });

  function applyThemeAndMouse(ed, finalSrc, finalTag) {
    document.body.setAttribute('data-edition', ed.key);
    document.body.classList.toggle('is-light-tone', ed.isLight);
    if (themeMetaEl) themeMetaEl.setAttribute('content', ed.themeMeta);
    switchToneLayers(ed.key);

    if (heroMouseImg) {
      setResponsiveMouseImg(heroMouseImg, finalSrc, '(max-width: 768px) 185px, 280px');
      heroMouseImg.alt = `SMAILWOLF M3 Pro Wireless Gaming Mouse — ${finalTag}`;
    }
    setResponsiveMouseImg(studioMouseImg, finalSrc, '160px');
    setResponsiveMouseImg(dlMouseImg, finalSrc, '165px');

    if (heroEditionTag) heroEditionTag.textContent = finalTag;
    if (heroScriptLeft) heroScriptLeft.textContent = ed.scriptLeft;
    if (heroBoldLeft) heroBoldLeft.textContent = ed.boldLeft;
    if (heroScriptRight) heroScriptRight.textContent = ed.scriptRight;
    if (heroBoldRight) heroBoldRight.textContent = ed.boldRight;
  }

  function triggerToneSweepWave(ed) {
    document.body.setAttribute('data-edition', ed.key);
    document.body.classList.toggle('is-light-tone', ed.isLight);
    switchToneLayers(ed.key);

    if (!toneSweepWave || motionPaused) return;
    toneSweepWave.classList.remove('sweeping');
    requestAnimationFrame(() => toneSweepWave.classList.add('sweeping'));
  }

  // Zero-CDN Native rAF Tween Engine (Replaces 72 KB GSAP with 0 external requests!)
  const easeInQuad = (t) => t * t;
  const makeEaseOutBack = (overshoot) => (t) => {
    const c1 = overshoot;
    const c3 = c1 + 1;
    const u = t - 1;
    return 1 + c3 * u * u * u + c1 * u * u;
  };
  const easeOutBackSpin = makeEaseOutBack(0.8);
  const easeOutBackOrb = makeEaseOutBack(1.35);

  function startTween({ from, to, duration, delay = 0, ease, onUpdate, onComplete }) {
    let cancelled = false;
    let prevNow = 0;
    const startAt = performance.now() + delay;
    function frame(now) {
      if (cancelled) return;
      if (prevNow) recordLoopDelta(now - prevNow);
      prevNow = now;
      if (now < startAt) {
        requestAnimationFrame(frame);
        return;
      }
      const raw = clamp((now - startAt) / duration, 0, 1);
      const k = ease ? ease(raw) : raw;
      onUpdate(from + (to - from) * k, k);
      if (raw < 1) {
        requestAnimationFrame(frame);
      } else if (onComplete) {
        onComplete();
      }
    }
    requestAnimationFrame(frame);
    return () => { cancelled = true; };
  }

  let cancelSpinTween = null;
  let cancelOrbTweens = [];

  function stopSpinTweens() {
    if (cancelSpinTween) {
      cancelSpinTween();
      cancelSpinTween = null;
    }
    while (cancelOrbTweens.length) {
      const fn = cancelOrbTweens.pop();
      if (fn) fn();
    }
  }

  function runSpinSwap({ editionKey, customSrc, customName }) {
    const ed = EDITIONS[editionKey] || EDITIONS.pearl;
    const finalSrc = customSrc || ed.src;
    const finalTag = customName ? customName.toUpperCase() : ed.tag;

    triggerToneSweepWave(ed);
    stopSpinTweens();

    if (!motionPaused) {
      isSwitching = true;
      const startAngle = ((switchSpin % 360) + 360) % 360;
      spinObj.val = startAngle;
      wakeHeroLoop();

      cancelSpinTween = startTween({
        from: startAngle,
        to: 360,
        duration: 380,
        ease: easeInQuad,
        onUpdate: (v) => {
          switchSpin = v;
          wakeHeroLoop();
        },
        onComplete: () => {
          applyThemeAndMouse(ed, finalSrc, finalTag);
          cancelSpinTween = startTween({
            from: 360,
            to: 720,
            duration: 880,
            ease: easeOutBackSpin,
            onUpdate: (v) => {
              switchSpin = v;
              wakeHeroLoop();
            },
            onComplete: () => {
              switchSpin = 0;
              spinObj.val = 0;
              isSwitching = false;
              cancelSpinTween = null;
              wakeHeroLoop();
            }
          });
        }
      });

      // Suck ALL surrounding orbs & telemetry chips directly INSIDE `#productRig` (the 3D mouse body), then burst out!
      const rigRect = productRig ? productRig.getBoundingClientRect() : null;
      const mouseCenterX = rigRect ? rigRect.left + rigRect.width * 0.5 : window.innerWidth * 0.5;
      const mouseCenterY = rigRect ? rigRect.top + rigRect.height * 0.5 : window.innerHeight * 0.5;

      if (!fpsLowActive && rigHuds.length) {
        const hudPullOffsets = [
          { dx: 74, dy: 82 },
          { dx: -82, dy: 8 },
          { dx: 68, dy: -72 }
        ];
        rigHuds.forEach((hud, hi) => {
          const pull = hudPullOffsets[hi % hudPullOffsets.length];
          const hc1 = startTween({
            from: 0,
            to: 1,
            duration: 310,
            ease: easeInQuad,
            onUpdate: (_, k) => {
              const sc = 1 + (0.06 - 1) * k;
              hud.style.opacity = (1 - k).toFixed(3);
              hud.style.translate = `${(pull.dx * k).toFixed(1)}px ${(pull.dy * k).toFixed(1)}px`;
              hud.style.scale = sc.toFixed(3);
            },
            onComplete: () => {
              const hc2 = startTween({
                from: 0,
                to: 1,
                duration: 580,
                delay: 45 + hi * 35,
                ease: easeOutBackOrb,
                onUpdate: (_, k) => {
                  const inv = 1 - k;
                  const sc = 0.06 + (1 - 0.06) * k;
                  hud.style.opacity = clamp(k * 1.25, 0, 1).toFixed(3);
                  hud.style.translate = `${(pull.dx * inv).toFixed(1)}px ${(pull.dy * inv).toFixed(1)}px`;
                  hud.style.scale = sc.toFixed(3);
                },
                onComplete: () => {
                  hud.style.opacity = '';
                  hud.style.translate = '';
                  hud.style.scale = '';
                }
              });
              cancelOrbTweens.push(hc2);
            }
          });
          cancelOrbTweens.push(hc1);
        });
      }

      if (window.innerWidth > 1040 && !fpsLowActive) {
        cacheOrbCenters();
        let imgCounter = 0;
        const fgShiftX = currentMouse.x * 26;
        const fgShiftY = currentMouse.y * 26;
        const bgShiftX = currentMouse.x * -14;
        const bgShiftY = currentMouse.y * -14;

        orbState.forEach((o, oi) => {
          const isBg = orbsBG && orbsBG.contains(o.el);
          const contX = isBg ? bgShiftX : fgShiftX;
          const contY = isBg ? bgShiftY : fgShiftY;
          const fromX = o.rx + o.baseX;
          const fromY = o.ry + o.baseY;
          const toCenterX = mouseCenterX - o.cx - contX;
          const toCenterY = mouseCenterY - o.cy - contY;
          const nextBaseX = (Math.random() - 0.5) * 64;
          const nextBaseY = (Math.random() - 0.5) * 64;
          const skinCode = o.img ? ed.orbSkins[imgCounter++ % ed.orbSkins.length] : null;

          const c1 = startTween({
            from: 0,
            to: 1,
            duration: 320,
            ease: easeInQuad,
            onUpdate: (_, k) => {
              const x = fromX + (toCenterX - fromX) * k;
              const y = fromY + (toCenterY - fromY) * k;
              const sc = 1 + (0.04 - 1) * k;
              o.el.style.opacity = (1 - k).toFixed(3);
              o.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
            },
            onComplete: () => {
              if (o.img && skinCode) o.img.src = `assets/skins/thumbs/${skinCode}.webp`;
              const c2 = startTween({
                from: 0,
                to: 1,
                duration: 640,
                delay: 40 + oi * 32,
                ease: easeOutBackOrb,
                onUpdate: (_, k) => {
                  const x = toCenterX + (nextBaseX - toCenterX) * k;
                  const y = toCenterY + (nextBaseY - toCenterY) * k;
                  const sc = 0.04 + (1 - 0.04) * k;
                  o.el.style.opacity = clamp(k * 1.2, 0, 1).toFixed(3);
                  o.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
                },
                onComplete: () => {
                  o.baseX = nextBaseX;
                  o.baseY = nextBaseY;
                  o.rx = 0;
                  o.ry = 0;
                  o.el.style.opacity = '';
                }
              });
              cancelOrbTweens.push(c2);
            }
          });
          cancelOrbTweens.push(c1);
        });
      } else {
        let imgCounter = 0;
        orbState.forEach((o) => {
          if (o.img) o.img.src = `assets/skins/thumbs/${ed.orbSkins[imgCounter++ % ed.orbSkins.length]}.webp`;
        });
      }
    } else {
      applyThemeAndMouse(ed, finalSrc, finalTag);
      let imgCounter = 0;
      orbState.forEach((o) => {
        if (o.img) o.img.src = `assets/skins/thumbs/${ed.orbSkins[imgCounter++ % ed.orbSkins.length]}.webp`;
      });
      isSwitching = false;
    }
  }

  function selectEditionByIndex(idx) {
    activeEditionIndex = (idx + EDITION_ORDER.length) % EDITION_ORDER.length;
    const key = EDITION_ORDER[activeEditionIndex];
    editionCards.forEach((c) => c.classList.toggle('active', c.dataset.edition === key));
    if (edCounter) edCounter.textContent = `0${activeEditionIndex + 1} / 0${EDITION_ORDER.length}`;
    playWaterDrop('whoosh');
    runSpinSwap({ editionKey: key });
  }

  editionCards.forEach((card, idx) => {
    card.addEventListener('click', () => selectEditionByIndex(idx));
  });

  const edPrev = document.getElementById('edPrev');
  const edNext = document.getElementById('edNext');
  const edShuffle = document.getElementById('edShuffle');
  if (edPrev) edPrev.addEventListener('click', () => selectEditionByIndex(activeEditionIndex - 1));
  if (edNext) edNext.addEventListener('click', () => selectEditionByIndex(activeEditionIndex + 1));

  // Wave 37: Randomize Surprise Skin from All 67 Real Cutouts
  let lastShuffleIdx = -1;
  function shuffleRandomSkin() {
    if (!SKINS.length) return;
    let pickIdx = Math.floor(Math.random() * SKINS.length);
    if (pickIdx === lastShuffleIdx && SKINS.length > 1) pickIdx = (pickIdx + 1) % SKINS.length;
    lastShuffleIdx = pickIdx;
    const skin = SKINS[pickIdx];
    const themeMap = {
      oni: 'crimson',
      cyber: 'cyber',
      anime: 'hologram',
      special: skin.id === 'default' ? 'pearl' : 'hologram',
      topo: 'pearl'
    };
    const edKey = themeMap[skin.cat] || 'pearl';
    activeEditionIndex = EDITION_ORDER.indexOf(edKey);
    editionCards.forEach((c) => c.classList.toggle('active', c.dataset.edition === edKey));
    if (edCounter) edCounter.textContent = `0${activeEditionIndex + 1} / 0${EDITION_ORDER.length}`;
    playWaterDrop('whoosh');
    runSpinSwap({
      editionKey: edKey,
      customSrc: skin.src,
      customName: `${skin.name} · ${skin.id.toUpperCase()}`
    });
    setTimeout(() => { if (typeof syncConfiguredLoadout === 'function') syncConfiguredLoadout(); }, 420);
    showLiquidToast(`Shuffled Skin: ${skin.name} (${skin.id.toUpperCase()})`);
  }

  if (edShuffle) edShuffle.addEventListener('click', shuffleRandomSkin);

  // Wave 24 + 35 + 43: Power-User Keyboard Shortcuts (`1`-`4` Tones, `R` Shuffle, `X` X-Ray, `M` Mode, `?` Actions)
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const tag = ev.target && ev.target.tagName ? ev.target.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (ev.target && ev.target.isContentEditable)) return;
    if ((skinModal && skinModal.open) || (spotlightDialog && spotlightDialog.open)) return;

    const k = ev.key.toLowerCase();
    if (ev.key >= '1' && ev.key <= '4') {
      selectEditionByIndex(Number(ev.key) - 1);
    } else if (k === 'm') {
      ev.preventDefault();
      if (modeMenuOpen) closeModeMenu(true);
      else openModeMenu(true);
    } else if (k === 'r') {
      ev.preventDefault();
      shuffleRandomSkin();
    } else if (k === 'x') {
      const btn = document.getElementById('xrayToggleBtn');
      if (btn) {
        ev.preventDefault();
        btn.click();
      }
    } else if (ev.key === '?') {
      ev.preventDefault();
      spScope = 'actions';
      spScopePills.forEach((p) => {
        const active = p.dataset.spScope === 'actions';
        p.classList.toggle('active', active);
        p.setAttribute('aria-pressed', String(active));
      });
      openSpotlight();
    }
  });

  // Wave 23: Universal 360° Drag-to-Spin + Inertial Momentum on Hero 3D Mouse (Desktop + Touch!)
  let dragSpinY = 0;
  let dragVelY = 0;
  let isHeroDragging = false;
  const mouse3dViewport = document.querySelector('.mouse-3d-viewport');
  if (mouse3dViewport) {
    let heroPtrId = null;
    let heroLastX = 0;
    let heroDownX = 0;
    let heroDownY = 0;

    mouse3dViewport.addEventListener('pointerdown', (ev) => {
      if (motionPaused || ev.button > 0) return;
      heroPtrId = ev.pointerId;
      heroDownX = ev.clientX;
      heroDownY = ev.clientY;
      heroLastX = ev.clientX;
      isHeroDragging = true;
      dragVelY = 0;
      mouse3dViewport.style.cursor = 'grabbing';
      try { mouse3dViewport.setPointerCapture(ev.pointerId); } catch (_) {}
      wakeHeroLoop();
    });

    mouse3dViewport.addEventListener('pointermove', (ev) => {
      if (heroPtrId !== ev.pointerId || motionPaused) return;
      const stepDx = ev.clientX - heroLastX;
      heroLastX = ev.clientX;
      const dx = ev.clientX - heroDownX;
      const dy = ev.clientY - heroDownY;

      if (finePointer || Math.abs(dx) > Math.abs(dy)) {
        dragSpinY += stepDx * 0.72;
        dragVelY = clamp(stepDx * 26, -720, 720);
        if (!finePointer) {
          mouse.x = clamp(dx / 180, -0.85, 0.85);
          mouse.y = clamp(dy / 220, -0.55, 0.55);
        }
        wakeHeroLoop();
      }
    });

    const resetHeroDrag = (ev) => {
      if (heroPtrId !== ev.pointerId) return;
      heroPtrId = null;
      isHeroDragging = false;
      mouse3dViewport.style.cursor = '';
      try {
        if (mouse3dViewport.hasPointerCapture(ev.pointerId)) mouse3dViewport.releasePointerCapture(ev.pointerId);
      } catch (_) {}
      if (!finePointer) {
        mouse.x = 0;
        mouse.y = 0;
      }
      wakeHeroLoop();
    };
    mouse3dViewport.addEventListener('pointerup', resetHeroDrag);
    mouse3dViewport.addEventListener('pointercancel', resetHeroDrag);

    // Wave 33: Double-Click 360° Showcase Spin on Hero Mouse
    mouse3dViewport.addEventListener('dblclick', () => {
      if (motionPaused) return;
      dragVelY = clamp(dragVelY + 680, -900, 900);
      playWaterDrop('whoosh');
      wakeHeroLoop();
    });
  }

  let lastHeroTick = 0;
  function heroTick(now) {
    heroRafId = 0;
    if (!heroVisible || motionPaused || document.hidden) {
      lastHeroTick = 0;
      return;
    }
    const rawDt = lastHeroTick && now ? (now - lastHeroTick) / 1000 : 1 / detectedHz;
    if (lastHeroTick && now) recordLoopDelta(now - lastHeroTick);
    lastHeroTick = now || 0;
    const dt = clamp(rawDt, 0.0004, 0.034);
    const h = dt * 0.5;
    const mouseAlpha = 1 - Math.exp(-9.5 * dt);

    try {
      const dxMouse = mouse.x - currentMouse.x;
      const dyMouse = mouse.y - currentMouse.y;
      currentMouse.x += dxMouse * mouseAlpha;
      currentMouse.y += dyMouse * mouseAlpha;

      // Inertial 360° drag spin glides & springs gently back to home orientation
      if (!isHeroDragging && (Math.abs(dragSpinY) > 0.08 || Math.abs(dragVelY) > 0.8)) {
        // Normalize angle to [-180, 180] so full 360° spins settle along shortest path!
        if (Math.abs(dragVelY) < 40 && Math.abs(dragSpinY) > 180) {
          dragSpinY = ((dragSpinY + 180) % 360 + 360) % 360 - 180;
        }
        [dragSpinY, dragVelY] = stepSpringDt(dragSpinY, dragVelY, 0, 42, 7.2, h);
      } else if (!isHeroDragging) {
        dragSpinY = 0;
        dragVelY = 0;
      }

      if (productRig) {
        const rotY = currentMouse.x * 28 + switchSpin + dragSpinY;
        const rotX = -currentMouse.y * 15;
        productRig.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(14deg)`;
      }

      let orbsSettling = false;
      if (window.innerWidth > 1040 && !fpsLowActive) {
        if (orbsFG) orbsFG.style.transform = `translate3d(${(currentMouse.x * 26).toFixed(1)}px, ${(currentMouse.y * 26).toFixed(1)}px, 0)`;
        if (orbsBG) orbsBG.style.transform = `translate3d(${(currentMouse.x * -14).toFixed(1)}px, ${(currentMouse.y * -14).toFixed(1)}px, 0)`;

        // Surrounding droplets stream & chase after the cursor like fluid water wake!
        if (!isSwitching) {
          const pullGain = fpsUltraActive ? 0.34 : 0.24;
          const maxChase = fpsUltraActive ? 165 : 120;
          for (let i = 0; i < orbState.length; i++) {
            const o = orbState[i];
            const orbAlpha = 1 - Math.exp(-(4.6 + i * 1.35) * dt);
            const diffX = mouse.px - (o.cx + o.baseX);
            const diffY = mouse.py - (o.cy + o.baseY);

            const factor = pullGain + i * 0.035;
            const targetRx = clamp(diffX * factor, -maxChase, maxChase);
            const targetRy = clamp(diffY * factor, -maxChase * 0.82, maxChase * 0.82);

            const stepX = (targetRx - o.rx) * orbAlpha;
            const stepY = (targetRy - o.ry) * orbAlpha;
            if (Math.abs(stepX) > 0.06 || Math.abs(stepY) > 0.06) orbsSettling = true;

            o.rx += stepX;
            o.ry += stepY;

            if (fpsUltraActive) {
              const vMag = Math.hypot(stepX, stepY) / dt;
              const stretch = clamp(vMag / 1600, 0, 0.16);
              o.el.style.transform = `translate3d(${(o.rx + o.baseX).toFixed(1)}px, ${(o.ry + o.baseY).toFixed(1)}px, 0) scale(${(1 + stretch).toFixed(3)}, ${(1 - stretch * 0.55).toFixed(3)})`;
            } else {
              o.el.style.transform = `translate3d(${(o.rx + o.baseX).toFixed(1)}px, ${(o.ry + o.baseY).toFixed(1)}px, 0)`;
            }
          }
        }
      }

      const dragActive = isHeroDragging || Math.abs(dragSpinY) > 0.08 || Math.abs(dragVelY) > 0.8;
      const stillMoving = Math.abs(dxMouse) > 0.001 || Math.abs(dyMouse) > 0.001 || orbsSettling || isSwitching || switchSpin !== 0 || dragActive;
      if (stillMoving) {
        heroRafId = requestAnimationFrame(heroTick);
      } else {
        lastHeroTick = 0;
        if (productRig) productRig.style.willChange = 'auto';
      }
    } catch (_) {
      lastHeroTick = 0;
    }
  }

  function wakeHeroLoop() {
    if (!heroRafId && heroVisible && !motionPaused && !document.hidden) {
      if (productRig) productRig.style.willChange = 'transform';
      heroRafId = requestAnimationFrame(heroTick);
    }
  }

  const heroSection = document.getElementById('hero');
  if (heroSection) {
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) cacheOrbCenters();
    }, { threshold: 0 }).observe(heroSection);
  }

  /* ------------------------------------------------------------------------
     6. NON-BLOCKING SLICED 121-FRAME DISSECTION ENGINE (scheduler.yield!)
     Loads ONLY frame 121 upfront -> 0ms page-load decode lag!
     Streams frames 120..1 in 4-frame idle slices when approaching #anatomy.
     ------------------------------------------------------------------------ */
  const TOTAL_FRAMES = 121;
  const frameImgs = new Array(TOTAL_FRAMES);
  let loadedFrames = 0;
  let dissectStreamStarted = false;
  let currentDissectFrame = TOTAL_FRAMES - 1;

  const anatomySection = document.getElementById('anatomy');
  const dissectCanvas = document.getElementById('dissectCanvas');
  const dissectCtx = dissectCanvas
    ? (dissectCanvas.getContext('2d', { alpha: false, desynchronized: true }) || dissectCanvas.getContext('2d', { alpha: false }))
    : null;
  const dissectLoader = document.getElementById('dissectLoader');
  const dissectCount = document.getElementById('dissectCount');
  const anatomyBarFill = document.getElementById('anatomyBarFill');
  const anatomyPct = document.getElementById('anatomyPct');
  const calloutCards = Array.from(document.querySelectorAll('.anatomy-callout'));
  const phaseBtns = Array.from(document.querySelectorAll('.phase-btn'));

  const pad3 = (n) => String(n).padStart(3, '0');

  function isFrameReady(frame) {
    if (!frame) return false;
    if (typeof HTMLImageElement !== 'undefined' && frame instanceof HTMLImageElement) {
      return frame.complete && frame.naturalWidth > 0;
    }
    return frame.width > 0 && frame.height > 0;
  }

  function drawDissectFrame(idx) {
    if (!dissectCtx || !dissectCanvas) return;
    let img = frameImgs[idx];
    if (!isFrameReady(img)) {
      // Check adjacent even frame on stride-2 low-RAM mode before falling back to frame 121
      const adj = idx + 1 < TOTAL_FRAMES && frameImgs[idx + 1] ? frameImgs[idx + 1] : frameImgs[idx - 1];
      img = isFrameReady(adj) ? adj : frameImgs[TOTAL_FRAMES - 1];
      if (!isFrameReady(img)) return;
    }
    const cw = dissectCanvas.width;
    const ch = dissectCanvas.height;
    if (!cw || !ch) return;
    const srcW = img.naturalWidth || img.width || 1280;
    const srcH = img.naturalHeight || img.height || 720;
    const scale = Math.max(cw / srcW, ch / srcH);
    const dw = srcW * scale;
    const dh = srcH * scale;
    dissectCtx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function sizeDissectCanvas() {
    if (!dissectCanvas) return;
    const maxW = isLowPowerGPU ? 800 : 1024;
    const maxH = isLowPowerGPU ? 450 : 576;
    const w = Math.min(maxW, Math.max(320, Math.round(dissectCanvas.clientWidth)));
    const h = Math.min(maxH, Math.max(180, Math.round(dissectCanvas.clientHeight)));
    if (dissectCanvas.width !== w || dissectCanvas.height !== h) {
      dissectCanvas.width = w;
      dissectCanvas.height = h;
      drawDissectFrame(currentDissectFrame);
    }
  }

  const targetDissectTotal = isLowPowerGPU ? 61 : TOTAL_FRAMES;
  const canBitmapDecode = typeof window.createImageBitmap === 'function' && window.location.protocol !== 'file:';

  function markFrameLoaded(idx) {
    loadedFrames++;
    if (dissectCount) dissectCount.textContent = `${Math.min(loadedFrames, targetDissectTotal)}/${targetDissectTotal}`;
    if (Math.abs(idx - currentDissectFrame) <= 1) drawDissectFrame(currentDissectFrame);
    if (loadedFrames >= targetDissectTotal && dissectLoader) dissectLoader.classList.add('done');
  }

  function loadViaImageElement(idx, url) {
    return new Promise((resolve) => {
      const im = new Image();
      im.decoding = 'async';
      frameImgs[idx] = im;
      const done = () => {
        markFrameLoaded(idx);
        resolve();
      };
      im.onload = done;
      im.onerror = done;
      im.src = url;
    });
  }

  function loadSingleFrame(idx) {
    if (frameImgs[idx]) return Promise.resolve();
    const url = `assets/explode/f${pad3(idx + 1)}.webp`;

    if (canBitmapDecode) {
      frameImgs[idx] = true; // reserve slot while decoding off-main-thread
      const bmpW = (isLowPowerGPU || fpsLowActive || window.innerWidth <= 768) ? 640 : 960;
      const bmpH = (isLowPowerGPU || fpsLowActive || window.innerWidth <= 768) ? 360 : 540;
      return fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.blob();
        })
        .then((blob) => createImageBitmap(blob, { resizeWidth: bmpW, resizeHeight: bmpH, resizeQuality: 'medium' }))
        .then((bmp) => {
          frameImgs[idx] = bmp;
          markFrameLoaded(idx);
        })
        .catch(() => {
          frameImgs[idx] = null;
          return loadViaImageElement(idx, url);
        });
    }

    return loadViaImageElement(idx, url);
  }

  // Load ONLY initial assembled frame #121 at page open (0 background decode storm while on Hero!)
  loadSingleFrame(TOTAL_FRAMES - 1).then(() => {
    sizeDissectCanvas();
    drawDissectFrame(TOTAL_FRAMES - 1);
  });

  async function streamRemainingDissectFrames() {
    if (dissectStreamStarted) return;
    dissectStreamStarted = true;
    const step = isLowPowerGPU ? 2 : 1;
    const BATCH = 3;
    const indices = [];
    for (let i = TOTAL_FRAMES - 1 - step; i >= 0; i -= step) indices.push(i);

    for (let k = 0; k < indices.length; k += BATCH) {
      const batch = [];
      for (let b = 0; b < BATCH && k + b < indices.length; b++) {
        batch.push(loadSingleFrame(indices[k + b]));
      }
      await Promise.all(batch);
      await yieldToMain();
    }
  }

  if (anatomySection) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        streamRemainingDissectFrames();
        obs.disconnect();
      }
    }, { rootMargin: '420px 0px' }).observe(anatomySection);
  }

  // Pause marquee GPU animations whenever offscreen!
  const marqueeEls = Array.from(document.querySelectorAll('.glass-marquee'));
  if (marqueeEls.length) {
    const mqIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        en.target.querySelectorAll('.marquee-track').forEach((tr) => {
          tr.classList.toggle('offscreen-paused', !en.isIntersecting);
        });
      });
    }, { rootMargin: '80px 0px' });
    marqueeEls.forEach((m) => mqIO.observe(m));
  }

  window.addEventListener('resize', debounce(sizeDissectCanvas, 150), { passive: true });

  const anatomyPhaseDock = dockControllers.get('anatomyPhaseDock');
  const anatomySliderWrap = document.getElementById('anatomySliderWrap');
  const anatomyLiquidThumb = document.getElementById('anatomyLiquidThumb');
  const anatomyScrub = document.getElementById('anatomyScrub');
  let anatomyTrackWidth = 260;
  let anatomyScrubbing = false;
  let lastAnatomyRatio = 0;
  let phaseClickLockUntil = 0;
  let lastAnatomyPhase = 0;

  function measureAnatomySlider() {
    if (anatomySliderWrap) anatomyTrackWidth = anatomySliderWrap.clientWidth || 260;
  }
  measureAnatomySlider();
  window.addEventListener('resize', debounce(measureAnatomySlider, 150), { passive: true });

  function syncAnatomySliderVisual(ratio) {
    const r = clamp(ratio, 0, 1);
    const vel = Math.abs(r - lastAnatomyRatio);
    lastAnatomyRatio = r;
    if (anatomyBarFill) anatomyBarFill.style.transform = `scaleX(${r.toFixed(4)})`;
    if (anatomyLiquidThumb) {
      const thumbW = 62;
      const maxLeft = Math.max(0, anatomyTrackWidth - thumbW);
      const x = r * maxLeft;
      const sx = anatomyScrubbing ? clamp(1.20 + vel * 3.0, 1.20, 1.36) : clamp(1 + vel * 1.8, 1, 1.14);
      const sy = anatomyScrubbing ? 1.25 : 1;
      anatomyLiquidThumb.style.transform = `translate3d(${x.toFixed(2)}px, -50%, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    }
    if (anatomyScrub && document.activeElement !== anatomyScrub && !anatomyScrubbing) {
      anatomyScrub.value = String(Math.round(r * 120));
    }
  }

  if (anatomyScrub) {
    const endAnatomyScrub = () => {
      if (!anatomyScrubbing) return;
      anatomyScrubbing = false;
      if (anatomySliderWrap) anatomySliderWrap.classList.remove('is-scrubbing');
      syncAnatomySliderVisual(lastAnatomyRatio);
    };
    anatomyScrub.addEventListener('pointerdown', () => {
      anatomyScrubbing = true;
      measureAnatomySlider();
      streamRemainingDissectFrames();
      if (anatomySliderWrap) anatomySliderWrap.classList.add('is-scrubbing');
      syncAnatomySliderVisual(lastAnatomyRatio);
    });
    window.addEventListener('pointerup', endAnatomyScrub, { passive: true });
    window.addEventListener('pointercancel', endAnatomyScrub, { passive: true });
    anatomyScrub.addEventListener('input', () => {
      if (!anatomySection) return;
      const r = clamp(Number(anatomyScrub.value) / 120, 0, 1);
      syncAnatomySliderVisual(r);
      const travel = Math.max(1, anatomySection.offsetHeight - window.innerHeight);
      window.scrollTo({ top: anatomySection.offsetTop + travel * r, behavior: 'auto' });
    });
  }

  phaseBtns.forEach((btn, idx) => {
    const activatePhase = () => {
      if (!anatomySection) return;
      streamRemainingDissectFrames();
      phaseClickLockUntil = performance.now() + 950;
      lastAnatomyPhase = idx;
      const targetP = parseFloat(btn.dataset.jump) || 0;
      const travel = anatomySection.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: anatomySection.offsetTop + travel * targetP,
        behavior: motionPaused ? 'auto' : 'smooth'
      });
    };
    btn.addEventListener('click', activatePhase);
    btn.addEventListener('dockselect', activatePhase);
  });

  /* ------------------------------------------------------------------------
     7. WINDOWED 67-SKIN COVERFLOW + VIDEO-2 CLEAR LIQUID GLASS SLIDER
     Culls offscreen 60 cards (visibility:hidden) -> 90% less GPU work!
     ------------------------------------------------------------------------ */
  const skinsSection = document.getElementById('skins');
  const coverflowViewport = document.getElementById('coverflowViewport');
  const skinsTrack = document.getElementById('skinsTrack');
  const skinsCounter = document.getElementById('skinsCounter');
  const skinsScrub = document.getElementById('skinsScrub');
  const skinsSliderWrap = document.getElementById('skinsSliderWrap');
  const skinsSliderFill = document.getElementById('skinsSliderFill');
  const skinsLiquidThumb = document.getElementById('skinsLiquidThumb');
  const skinsName = document.getElementById('skinsName');
  const filterChips = Array.from(document.querySelectorAll('.filter-chip'));

  let visibleSkins = SKINS.slice();
  let pedestalEls = [];
  let pedestalCenters = [];
  let inspectedSkin = SKINS[0];
  let lastActiveSkinIdx = -1;
  let sliderTrackWidth = 300;
  let sliderScrubbing = false;
  let lastSliderRatio = 0;
  let currentSkinProgress = 0;
  let suppressSkinClickUntil = 0;

  function measureSkinCardSize() {
    if (!skinsSection) return;
    const minDim = Math.min(window.innerWidth * 0.42, window.innerHeight * 0.22);
    const cardW = clamp(Math.floor(minDim), 132, 198);
    skinsSection.style.setProperty('--skin-card-w', `${cardW}px`);
    pedestalCenters = pedestalEls.map((el) => el.offsetLeft + el.offsetWidth / 2);
    if (skinsSliderWrap) sliderTrackWidth = skinsSliderWrap.clientWidth || 300;
  }

  function syncLiquidSliderVisual(ratio) {
    const r = clamp(ratio, 0, 1);
    const vel = Math.abs(r - lastSliderRatio);
    lastSliderRatio = r;

    if (skinsSliderFill) {
      skinsSliderFill.style.transform = `scaleX(${r.toFixed(4)})`;
    }
    if (skinsLiquidThumb) {
      const thumbW = 62;
      const maxLeft = Math.max(0, sliderTrackWidth - thumbW);
      const x = r * maxLeft;
      const sx = sliderScrubbing ? clamp(1.22 + vel * 3.2, 1.22, 1.38) : clamp(1 + vel * 1.8, 1, 1.15);
      const sy = sliderScrubbing ? 1.26 : 1;
      skinsLiquidThumb.style.transform = `translate3d(${x.toFixed(2)}px, -50%, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    }
  }

  // Wave 40: Persisted Favorite Skin Bookmarks (`localStorage`)
  const favFilterCount = document.getElementById('favFilterCount');
  const skinFavBtn = document.getElementById('skinFavBtn');
  let activeSkinFilter = 'all';
  const favoriteSkinIds = new Set();
  try {
    const savedFavs = JSON.parse(window.localStorage ? window.localStorage.getItem('m3pro_fav_skins') || '[]' : '[]');
    if (Array.isArray(savedFavs)) savedFavs.forEach((id) => favoriteSkinIds.add(String(id)));
  } catch (_) {}

  function syncFavoriteBadge() {
    if (favFilterCount) favFilterCount.textContent = String(favoriteSkinIds.size);
    if (skinFavBtn && inspectedSkin) {
      const isFav = favoriteSkinIds.has(inspectedSkin.id);
      skinFavBtn.setAttribute('aria-pressed', String(isFav));
      skinFavBtn.textContent = isFav ? 'Saved Favorite' : 'Save Favorite';
    }
  }
  syncFavoriteBadge();

  function renderSkinTrack(filterKey) {
    if (!skinsTrack) return;
    activeSkinFilter = filterKey || 'all';
    if (activeSkinFilter === 'favorites') {
      visibleSkins = SKINS.filter((s) => favoriteSkinIds.has(s.id));
      if (!visibleSkins.length) {
        visibleSkins = SKINS.slice(0, 4);
        showLiquidToast('No saved favorites yet — open any skin to Save Favorite!');
      }
    } else {
      visibleSkins = activeSkinFilter === 'all' ? SKINS.slice() : SKINS.filter((s) => s.cat === activeSkinFilter);
    }
    const frag = document.createDocumentFragment();

    visibleSkins.forEach((skin, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-pedestal liquid-glass cf-culled';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', `${skin.name} skin — select to inspect in 3D`);
      btn.innerHTML = `
        <img src="${skin.thumb}" alt="SMAILWOLF M3 Pro ${skin.name}" width="320" height="565" loading="lazy" decoding="async">
        <figcaption>
          <b>${skin.name}</b>
          <span>${skin.id.toUpperCase()} · #${String(idx + 1).padStart(2, '0')}</span>
        </figcaption>
      `;
      btn.addEventListener('click', () => {
        if (performance.now() < suppressSkinClickUntil) return;
        if (idx !== lastActiveSkinIdx && visibleSkins.length > 1 && !motionPaused) {
          const targetSp = idx / (visibleSkins.length - 1);
          glideCoverflowTo(targetSp);
          return;
        }
        openSkinModal(skin, idx);
      });
      frag.appendChild(btn);
    });

    skinsTrack.innerHTML = '';
    skinsTrack.appendChild(frag);
    pedestalEls = Array.from(skinsTrack.querySelectorAll('.skin-pedestal'));

    if (skinsScrub) {
      skinsScrub.max = String(Math.max(0, visibleSkins.length - 1));
      skinsScrub.value = '0';
    }
    lastActiveSkinIdx = -1;
    measureSkinCardSize();
    updateCoverflowAtProgress(0);
  }

  function updateCoverflowAtProgress(sp) {
    if (!skinsTrack || !visibleSkins.length || !pedestalEls.length) return;
    currentSkinProgress = clamp(sp, 0, 1);
    const firstCenter = pedestalCenters[0] || 0;
    const lastCenter = pedestalCenters[pedestalEls.length - 1] || firstCenter;
    const focusX = firstCenter + currentSkinProgress * Math.max(0, lastCenter - firstCenter);
    const tx = window.innerWidth / 2 - focusX;

    skinsTrack.style.transform = `translate3d(${tx.toFixed(1)}px, 0, 0)`;
    syncLiquidSliderVisual(sp);

    const activeIdx = clamp(Math.round(sp * (visibleSkins.length - 1)), 0, visibleSkins.length - 1);
    if (activeIdx !== lastActiveSkinIdx) {
      lastActiveSkinIdx = activeIdx;
      if (skinsCounter) {
        skinsCounter.textContent = `${String(activeIdx + 1).padStart(2, '0')} / ${String(visibleSkins.length).padStart(2, '0')}`;
      }
      if (skinsName) skinsName.textContent = visibleSkins[activeIdx].name;
      if (skinsScrub && document.activeElement !== skinsScrub && !sliderScrubbing) {
        skinsScrub.value = String(activeIdx);
      }

      for (let i = 0; i < pedestalEls.length; i++) {
        const el = pedestalEls[i];
        const diff = i - activeIdx;
        let cls = 'cf-culled';
        if (diff === 0) cls = 'cf-center';
        else if (diff === -1) cls = 'cf-left-1';
        else if (diff === 1) cls = 'cf-right-1';
        else if (diff >= -3 && diff < -1) cls = 'cf-left-2';
        else if (diff <= 3 && diff > 1) cls = 'cf-right-2';

        if (el._cf !== cls) {
          el.classList.remove('cf-center', 'cf-left-1', 'cf-right-1', 'cf-left-2', 'cf-right-2', 'cf-culled');
          el.classList.add(cls);
          el._cf = cls;
        }
      }
      scheduleCoverflowPrewarm(activeIdx);
    }
  }

  // Wave 13: Idle Neighbor Thumbnail Pre-Decoder (Eliminates Coverflow Scroll Decode Hitches!)
  let prewarmTimer = 0;
  function scheduleCoverflowPrewarm(centerIdx) {
    clearTimeout(prewarmTimer);
    prewarmTimer = setTimeout(() => {
      const start = Math.max(0, centerIdx - 5);
      const end = Math.min(pedestalEls.length - 1, centerIdx + 5);
      for (let i = start; i <= end; i++) {
        const img = pedestalEls[i] && pedestalEls[i].querySelector('img');
        if (img && !img._decoded && typeof img.decode === 'function') {
          img._decoded = true;
          img.decode().catch(() => {});
        }
      }
    }, 60);
  }

  filterChips.forEach((chip) => {
    const applyFilter = () => renderSkinTrack(chip.dataset.filter || 'all');
    chip.addEventListener('click', applyFilter);
    chip.addEventListener('dockselect', applyFilter);
  });

  if (skinsScrub) {
    const endScrub = () => {
      if (!sliderScrubbing) return;
      sliderScrubbing = false;
      if (skinsSliderWrap) skinsSliderWrap.classList.remove('is-scrubbing');
      syncLiquidSliderVisual(lastSliderRatio);
    };

    skinsScrub.addEventListener('pointerdown', () => {
      sliderScrubbing = true;
      if (skinsSliderWrap) sliderSliderMeasure();
      if (skinsSliderWrap) skinsSliderWrap.classList.add('is-scrubbing');
      syncLiquidSliderVisual(lastSliderRatio);
    });
    window.addEventListener('pointerup', endScrub, { passive: true });
    window.addEventListener('pointercancel', endScrub, { passive: true });

    skinsScrub.addEventListener('input', () => {
      if (!skinsSection || !visibleSkins.length) return;
      const ratio = visibleSkins.length > 1 ? Number(skinsScrub.value) / (visibleSkins.length - 1) : 0;
      syncLiquidSliderVisual(ratio);
      if (window.innerWidth <= 1040) {
        updateCoverflowAtProgress(ratio);
      } else {
        const travel = skinsSection.offsetHeight - window.innerHeight;
        window.scrollTo({ top: skinsSection.offsetTop + travel * ratio, behavior: 'auto' });
      }
    });
  }

  // Wave 9: Viscous Inertial Momentum Flick + Magnetic Center Snap on Coverflow Stage
  let cancelCfGlide = null;
  function glideCoverflowTo(targetSp, durationMs = 420) {
    if (cancelCfGlide) {
      cancelCfGlide();
      cancelCfGlide = null;
    }
    const clampedTarget = clamp(targetSp, 0, 1);
    const startSp = currentSkinProgress;
    if (Math.abs(clampedTarget - startSp) < 0.0005) {
      updateCoverflowAtProgress(clampedTarget);
      return;
    }
    cancelCfGlide = startTween({
      from: startSp,
      to: clampedTarget,
      duration: durationMs,
      ease: (t) => 1 - Math.pow(1 - t, 3),
      onUpdate: (v) => updateCoverflowAtProgress(v),
      onComplete: () => { cancelCfGlide = null; }
    });
  }

  if (coverflowViewport) {
    let cfPtrId = null;
    let cfStartX = 0;
    let cfStartY = 0;
    let cfStartSp = 0;
    let cfLastX = 0;
    let cfLastT = 0;
    let cfVelPxMs = 0;
    let cfSwiping = false;

    coverflowViewport.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 || visibleSkins.length <= 1) return;
      if (cancelCfGlide) {
        cancelCfGlide();
        cancelCfGlide = null;
      }
      cfPtrId = ev.pointerId;
      cfStartX = ev.clientX;
      cfStartY = ev.clientY;
      cfLastX = ev.clientX;
      cfLastT = performance.now();
      cfVelPxMs = 0;
      cfStartSp = currentSkinProgress;
      cfSwiping = false;
    });

    coverflowViewport.addEventListener('pointermove', (ev) => {
      if (cfPtrId !== ev.pointerId) return;
      const now = performance.now();
      const dx = ev.clientX - cfStartX;
      const dy = ev.clientY - cfStartY;
      const stepDt = Math.max(1, now - cfLastT);
      cfVelPxMs = cfVelPxMs * 0.62 + ((ev.clientX - cfLastX) / stepDt) * 0.38;
      cfLastX = ev.clientX;
      cfLastT = now;

      if (!cfSwiping) {
        if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy) * 1.15) return;
        cfSwiping = true;
        sliderScrubbing = true;
        coverflowViewport.classList.add('is-swiping');
        sliderSliderMeasure();
        try { coverflowViewport.setPointerCapture(ev.pointerId); } catch (_) {}
      }
      const swipeRangePx = Math.max(240, Math.min(window.innerWidth * 2.2, visibleSkins.length * 36));
      const nextSp = clamp(cfStartSp - dx / swipeRangePx, 0, 1);
      updateCoverflowAtProgress(nextSp);
    });

    const endCfSwipe = (ev) => {
      if (cfPtrId !== ev.pointerId) return;
      const wasSwiping = cfSwiping;
      cfPtrId = null;
      cfSwiping = false;
      sliderScrubbing = false;
      coverflowViewport.classList.remove('is-swiping');
      try {
        if (coverflowViewport.hasPointerCapture(ev.pointerId)) {
          coverflowViewport.releasePointerCapture(ev.pointerId);
        }
      } catch (_) {}
      if (wasSwiping) {
        suppressSkinClickUntil = performance.now() + 260;
        const swipeRangePx = Math.max(240, Math.min(window.innerWidth * 2.2, visibleSkins.length * 36));
        const inertiaDelta = !motionPaused ? (-cfVelPxMs * 190) / swipeRangePx : 0;
        const projected = clamp(currentSkinProgress + inertiaDelta, 0, 1);
        const maxIdx = Math.max(1, visibleSkins.length - 1);
        const snappedSp = Math.round(projected * maxIdx) / maxIdx;
        if (!motionPaused) {
          glideCoverflowTo(snappedSp, clamp(280 + Math.abs(cfVelPxMs) * 140, 280, 560));
        } else {
          updateCoverflowAtProgress(snappedSp);
        }
      }
    };

    coverflowViewport.addEventListener('pointerup', endCfSwipe);
    coverflowViewport.addEventListener('pointercancel', endCfSwipe);
  }

  function sliderSliderMeasure() {
    if (skinsSliderWrap) sliderTrackWidth = skinsSliderWrap.clientWidth || 300;
  }

  const skinModal = document.getElementById('skinModal');
  const skinModalImg = document.getElementById('skinModalImg');
  const skinModalId = document.getElementById('skinModalId');
  const skinModalName = document.getElementById('skinModalName');
  const skinModalClose = document.getElementById('skinModalClose');
  const equipHeroBtn = document.getElementById('equipHeroBtn');
  const modalDownloadLink = document.getElementById('modalDownloadLink');
  const modalMouseStage = document.getElementById('modalMouseStage');
  const modalMouseRig = document.getElementById('modalMouseRig');
  const skinCompareToggle = document.getElementById('skinCompareToggle');
  const skinCompareBar = document.getElementById('skinCompareBar');
  const skinCompareSlider = document.getElementById('skinCompareSlider');

  function setSkinCompareMode(enabled) {
    const canCompare = Boolean(enabled && inspectedSkin && inspectedSkin.id !== 'default');
    if (modalMouseRig) {
      modalMouseRig.classList.toggle('is-comparing', canCompare);
      if (canCompare) modalMouseRig.style.setProperty('--cmp-pct', `${skinCompareSlider ? skinCompareSlider.value : 50}%`);
    }
    if (skinCompareBar) skinCompareBar.hidden = !canCompare;
    if (skinCompareToggle) {
      skinCompareToggle.setAttribute('aria-pressed', String(canCompare));
      skinCompareToggle.textContent = canCompare ? 'Hide Compare' : 'Compare vs White';
    }
  }

  if (skinCompareToggle) {
    skinCompareToggle.addEventListener('click', () => {
      const next = skinCompareToggle.getAttribute('aria-pressed') !== 'true';
      setSkinCompareMode(next);
      playWaterDrop('switch');
    });
  }

  if (skinCompareSlider && modalMouseRig) {
    skinCompareSlider.addEventListener('input', () => {
      modalMouseRig.style.setProperty('--cmp-pct', `${clamp(Number(skinCompareSlider.value) || 50, 0, 100)}%`);
    });
  }

  if (skinFavBtn) {
    skinFavBtn.addEventListener('click', () => {
      if (!inspectedSkin) return;
      if (favoriteSkinIds.has(inspectedSkin.id)) favoriteSkinIds.delete(inspectedSkin.id);
      else favoriteSkinIds.add(inspectedSkin.id);
      try {
        if (window.localStorage) window.localStorage.setItem('m3pro_fav_skins', JSON.stringify(Array.from(favoriteSkinIds)));
      } catch (_) {}
      syncFavoriteBadge();
      playWaterDrop('switch');
      if (activeSkinFilter === 'favorites') renderSkinTrack('favorites');
      showLiquidToast(favoriteSkinIds.has(inspectedSkin.id)
        ? `Saved ${inspectedSkin.name} to Favorites`
        : `Removed ${inspectedSkin.name} from Favorites`);
    });
  }

  function openSkinModal(skin, idx) {
    inspectedSkin = skin;
    if (skinModalImg) {
      setResponsiveMouseImg(skinModalImg, skin.src, '(max-width: 640px) 160px, 220px');
      skinModalImg.alt = `SMAILWOLF M3 Pro — ${skin.name}`;
    }
    if (skinModalId) skinModalId.textContent = `${skin.id.toUpperCase()} · ${String(idx + 1).padStart(2, '0')}/${visibleSkins.length}`;
    if (skinModalName) skinModalName.textContent = skin.name;
    if (skinCompareToggle) skinCompareToggle.hidden = skin.id === 'default';
    if (skinCompareSlider) skinCompareSlider.value = '50';
    setSkinCompareMode(false);
    syncFavoriteBadge();
    if (skinModal && typeof skinModal.showModal === 'function') {
      skinModal.showModal();
    }
  }

  // Top-Layer Discrete Exit Helper (modern-web-guidance `animate-to-from-top-layer` pattern)
  let supportsDisplayTransition;
  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!window.CSS || !CSS.supports || !CSS.supports('transition-behavior', 'allow-discrete') || !document.body) {
      supportsDisplayTransition = false;
      return false;
    }
    const probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = 'none';
    supportsDisplayTransition = getComputedStyle(probe).display === 'block';
    probe.remove();
    return supportsDisplayTransition;
  }

  function supportsTopLayerExit() {
    return Boolean(window.CSS && CSS.supports && CSS.supports('overlay', 'auto') && canTransitionDisplay());
  }

  async function closeTopLayer(dialogEl) {
    if (!dialogEl || !dialogEl.open) return;
    if (!supportsTopLayerExit() && !motionPaused) {
      dialogEl.setAttribute('data-closing', '');
      const anims = dialogEl.getAnimations ? dialogEl.getAnimations({ subtree: true }) : [];
      if (anims.length > 0) {
        await Promise.race([
          Promise.allSettled(anims.map((a) => a.finished)),
          new Promise((r) => setTimeout(r, 320))
        ]);
      }
      if (!dialogEl.hasAttribute('data-closing')) return;
      dialogEl.removeAttribute('data-closing');
    }
    dialogEl.close();
  }

  function equipSkinOnHero(skin) {
    if (!skin) return;
    if (navDock && navItems[0]) {
      markNavClickLock();
      navDock.setActive(navItems[0], { animate: true, scrollDock: true, bounceIcon: true });
    }
    window.scrollTo({ top: 0, behavior: motionPaused ? 'auto' : 'smooth' });
    setTimeout(() => {
      const themeMap = {
        oni: 'crimson',
        cyber: 'cyber',
        anime: 'hologram',
        special: skin.id === 'default' ? 'pearl' : 'hologram',
        topo: 'pearl'
      };
      const edKey = themeMap[skin.cat] || 'pearl';
      activeEditionIndex = EDITION_ORDER.indexOf(edKey);
      editionCards.forEach((c) => c.classList.toggle('active', c.dataset.edition === edKey));
      if (edCounter) edCounter.textContent = `0${activeEditionIndex + 1} / 04`;
      runSpinSwap({
        editionKey: edKey,
        customSrc: skin.src,
        customName: `${skin.name} · ${skin.id.toUpperCase()}`
      });
      showLiquidToast(`Equipped ${skin.name} (${skin.id.toUpperCase()}) on 3D Stage`);
    }, motionPaused ? 0 : 320);
  }

  if (skinModal) {
    skinModal.addEventListener('cancel', (ev) => {
      ev.preventDefault();
      closeTopLayer(skinModal);
    });
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      skinModal.addEventListener('click', (event) => {
        if (event.target !== skinModal) return;
        const rect = skinModal.getBoundingClientRect();
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!inside) closeTopLayer(skinModal);
      });
    }
    if (skinModalClose) skinModalClose.addEventListener('click', () => closeTopLayer(skinModal));
    if (modalDownloadLink) modalDownloadLink.addEventListener('click', () => closeTopLayer(skinModal));
    if (equipHeroBtn) {
      equipHeroBtn.addEventListener('click', () => {
        closeTopLayer(skinModal);
        equipSkinOnHero(inspectedSkin);
      });
    }
  }

  if (modalMouseStage && modalMouseRig && finePointer) {
    modalMouseStage.addEventListener('pointermove', (e) => {
      if (motionPaused) return;
      const r = modalMouseStage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      modalMouseRig.style.transform = `rotateX(${(-py * 22).toFixed(1)}deg) rotateY(${(px * 28).toFixed(1)}deg)`;
    }, { passive: true });
    modalMouseStage.addEventListener('pointerleave', () => {
      modalMouseRig.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }

  renderSkinTrack('all');
  window.addEventListener('resize', debounce(() => {
    lastActiveSkinIdx = -1;
    measureSkinCardSize();
    syncLiquidSliderVisual(lastSliderRatio);
  }, 150), { passive: true });

  /* ------------------------------------------------------------------------
     8. CONTENT-VISIBILITY BACKGROUND PAUSING + BENTO & DRIVER STUDIO
     ------------------------------------------------------------------------ */
  const skippedSections = new WeakSet();
  document.querySelectorAll('.offscreen-opt').forEach((sec) => {
    sec.addEventListener('contentvisibilityautostatechange', (ev) => {
      if (ev.skipped) skippedSections.add(sec);
      else skippedSections.delete(sec);
    });
  });

  const LAYER_DATA = [
    {
      badge: 'LAYER 01 · TRANSPORT',
      code: 'usagePage: 0xFF01 · usage: 0x0010',
      title: 'Zero-Kernel Serialized WebHID Pipeline',
      body: 'Commands travel as 64-byte Report ID 240 packets through a strict one-at-a-time queue (500 ms reply window, 3 s send guard) while unsolicited DPI, battery, and wireless status reports route cleanly to live UI listeners.'
    },
    {
      badge: 'LAYER 02 · INTEGRITY',
      code: 'chk = sum(bytes[3..63]) & 0xFF',
      title: 'Mod-256 Checksum & Unsolicited Report Guard',
      body: 'Every config read/write validates byte[2] against the modulo-256 sum of bytes 3..63. Live unsolicited reports (250 DPI push, 237 status, 48 battery) are filtered out of command replies so active writes never desynchronize.'
    },
    {
      badge: 'LAYER 03 · CONTROLLER',
      code: 'FR2012A · 48 MHz · 512 KB Flash',
      title: 'Stock Firmware v2.1.3 Preserved 100%',
      body: 'Writes target documented onboard configuration registers ([240, 15] config, [240, 9] keymap, [240, 13] + [240, 16] macro commit) without ever flashing or risking the factory bootloader.'
    },
    {
      badge: 'LAYER 04 · SENSING & POWER',
      code: 'PAW3311 Optical + 10-Bit ADC Ch.11',
      title: 'True Hardware DPI + Calibrated Battery Engine',
      body: 'Combines hardware-stored PAW3311 DPI steps with our sleep-aware lithium discharge model (3–14 mA active, 0.05 mA sleep, 150 mA USB-C charge, custom cell capacity, and manual 100% full-charge sync).'
    }
  ];

  const waferLayers = Array.from(document.querySelectorAll('.wafer-layer'));
  const insBadge = document.getElementById('insBadge');
  const insCode = document.getElementById('insCode');
  const insTitle = document.getElementById('insTitle');
  const insBody = document.getElementById('insBody');

  waferLayers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.layer) || 0;
      waferLayers.forEach((l) => l.classList.toggle('active', l === btn));
      const d = LAYER_DATA[idx] || LAYER_DATA[0];
      if (insBadge) insBadge.textContent = d.badge;
      if (insCode) insCode.textContent = d.code;
      if (insTitle) insTitle.textContent = d.title;
      if (insBody) insBody.textContent = d.body;
    });
  });

  const bentoDpiNum = document.getElementById('bentoDpiNum');
  const bentoDpiStageTag = document.getElementById('bentoDpiStageTag');
  const bentoDpiBar = document.getElementById('bentoDpiBar');
  const bentoDpiSliderWrap = document.getElementById('bentoDpiSliderWrap');
  const bentoDpiThumb = document.getElementById('bentoDpiThumb');
  const bentoDpiScrub = document.getElementById('bentoDpiScrub');
  const dpiPills = Array.from(document.querySelectorAll('#bentoDpiPills .sim-pill'));
  const bentoDpiDock = dockControllers.get('bentoDpiPills');
  let bentoDpiScrubbing = false;

  function syncBentoDpiSlider(dpi) {
    const ratio = clamp(dpi / 12000, 0.05, 1);
    if (bentoDpiBar) bentoDpiBar.style.transform = `scaleX(${ratio.toFixed(3)})`;
    if (bentoDpiThumb && bentoDpiSliderWrap) {
      const trackW = bentoDpiSliderWrap.clientWidth || 320;
      const maxLeft = Math.max(0, trackW - 62);
      const x = ((dpi - 400) / (12000 - 400)) * maxLeft;
      const sx = bentoDpiScrubbing ? 1.22 : 1;
      const sy = bentoDpiScrubbing ? 1.26 : 1;
      bentoDpiThumb.style.transform = `translate3d(${clamp(x, 0, maxLeft).toFixed(2)}px, -50%, 0) scale(${sx}, ${sy})`;
    }
    if (bentoDpiScrub && document.activeElement !== bentoDpiScrub && !bentoDpiScrubbing) {
      bentoDpiScrub.value = String(dpi);
    }
  }

  window.addEventListener('load', () => syncBentoDpiSlider(12000), { once: true });
  window.addEventListener('resize', debounce(() => {
    const cur = bentoDpiScrub ? Number(bentoDpiScrub.value) || 12000 : 12000;
    syncBentoDpiSlider(cur);
  }, 150), { passive: true });

  dpiPills.forEach((pill) => {
    const applyDpi = () => {
      const dpi = Number(pill.dataset.dpi) || 1600;
      if (bentoDpiNum) bentoDpiNum.textContent = dpi.toLocaleString('en-US');
      if (bentoDpiStageTag) bentoDpiStageTag.textContent = `STAGE ${pill.dataset.stage || '1'} / 6`;
      syncBentoDpiSlider(dpi);
    };
    pill.addEventListener('click', applyDpi);
    pill.addEventListener('dockselect', applyDpi);
  });

  if (bentoDpiScrub) {
    const endBentoScrub = () => {
      if (!bentoDpiScrubbing) return;
      bentoDpiScrubbing = false;
      if (bentoDpiSliderWrap) bentoDpiSliderWrap.classList.remove('is-scrubbing');
      syncBentoDpiSlider(Number(bentoDpiScrub.value) || 12000);
    };
    bentoDpiScrub.addEventListener('pointerdown', () => {
      bentoDpiScrubbing = true;
      if (bentoDpiSliderWrap) bentoDpiSliderWrap.classList.add('is-scrubbing');
      syncBentoDpiSlider(Number(bentoDpiScrub.value) || 12000);
    });
    window.addEventListener('pointerup', endBentoScrub, { passive: true });
    window.addEventListener('pointercancel', endBentoScrub, { passive: true });
    bentoDpiScrub.addEventListener('input', () => {
      const dpi = Number(bentoDpiScrub.value) || 1600;
      if (bentoDpiNum) bentoDpiNum.textContent = dpi.toLocaleString('en-US');
      if (bentoDpiStageTag) bentoDpiStageTag.textContent = 'CUSTOM STEP';
      syncBentoDpiSlider(dpi);
      let nearest = dpiPills[0];
      let bestDiff = Infinity;
      dpiPills.forEach((p) => {
        const d = Math.abs((Number(p.dataset.dpi) || 0) - dpi);
        if (d < bestDiff) { bestDiff = d; nearest = p; }
      });
      if (nearest && bentoDpiDock && bestDiff <= 250) {
        bentoDpiDock.setActive(nearest, { animate: true, scrollDock: false, bounceIcon: false });
      }
    });
  }

  const bentoHzNum = document.getElementById('bentoHzNum');
  const bentoLatencyTag = document.getElementById('bentoLatencyTag');
  const bentoMa = document.getElementById('bentoMa');
  const bentoHrs = document.getElementById('bentoHrs');
  const hzPills = Array.from(document.querySelectorAll('#bentoHzPills .sim-pill'));

  hzPills.forEach((pill) => {
    const applyHz = () => {
      const hz = Number(pill.dataset.hz) || 1000;
      if (bentoHzNum) bentoHzNum.textContent = hz.toLocaleString('en-US');
      if (bentoLatencyTag) bentoLatencyTag.textContent = pill.dataset.ms || '1.0 ms';
      if (bentoMa) bentoMa.textContent = pill.dataset.ma || '14 mA';
      if (bentoHrs) bentoHrs.textContent = pill.dataset.hrs || '28.6 hrs';
    };
    pill.addEventListener('click', applyHz);
    pill.addEventListener('dockselect', applyHz);
  });

  const countSeen = new WeakSet();
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || countSeen.has(entry.target)) return;
      countSeen.add(entry.target);
      const el = entry.target;
      const target = parseInt(el.dataset.count || '0', 10);
      if (motionPaused || !target) {
        el.textContent = target.toLocaleString('en-US');
        return;
      }
      const start = performance.now();
      const dur = 780;
      const step = (now) => {
        const p = clamp((now - start) / dur, 0, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

  const studioHexOut = document.getElementById('studioHexOut');
  const stDpiVal = document.getElementById('stDpiVal');
  const stDpiSub = document.getElementById('stDpiSub');
  const stHzVal = document.getElementById('stHzVal');
  const stBatVal = document.getElementById('stBatVal');
  const stSyncBtn = document.getElementById('stSyncBtn');
  const spKicker = document.getElementById('spKicker');
  const spTitle = document.getElementById('spTitle');
  const spDesc = document.getElementById('spDesc');

  function emitStudioHex(prefixBytes, note) {
    const bytes = prefixBytes.split(' ').map((h) => parseInt(h, 16) || 0);
    const sum = bytes.slice(3).reduce((a, b) => (a + b) & 0xff, 0);
    const chk = sum.toString(16).toUpperCase().padStart(2, '0');
    if (studioHexOut) {
      studioHexOut.textContent = `TX [64B] : ${prefixBytes} 00 00 00 ... · CHK 0x${chk} (${note})`;
    }
  }

  const STUDIO_TABS = {
    dashboard: {
      kicker: 'INTERACTIVE BUTTON MAP',
      title: 'Select Any Pin on the Mouse',
      desc: 'Every button write builds a 64-byte [240, 9, 165, 34, ...] HID report, computes the mod-256 checksum, and verifies persistence with a live read-back.',
      hex: 'F0 0E 00 00 00 00 00 00',
      note: 'READ CONFIG'
    },
    keys: {
      kicker: '6-BUTTON HARDWARE REMAP',
      title: 'Direct Onboard Key Matrix',
      desc: 'Bind Left, Right, Middle, Forward, Back, shortcuts (Ctrl+C / Ctrl+V), media keys, or stored macros straight into non-volatile flash.',
      hex: 'F0 09 A5 22 2C 01 06 00',
      note: 'WRITE KEYS'
    },
    dpi: {
      kicker: 'PAW3311 6-STAGE ENGINE',
      title: 'Smooth-Gliding DPI Presets',
      desc: 'Switch between Office (1,600), Gaming (3,200), or Design (800) presets — written immediately via [240, 15] with little-endian register encoding.',
      hex: 'F0 0F AE 0A 2F 03 80 0C',
      note: 'SET DPI 3200'
    },
    macro: {
      kicker: 'REAL-TIME DELTA RECORDER',
      title: 'performance.now() Precision',
      desc: 'Captures true millisecond intervals (clamped 2 ms–5,000 ms) with input-field isolation so typing macro names never hijacks keystrokes.',
      hex: 'F0 0D 12 04 1E 00 16 00',
      note: 'COMMIT MACRO'
    },
    battery: {
      kicker: 'CALIBRATED DISCHARGE ENGINE',
      title: '100% Full-Charge Sync & Custom mAh',
      desc: 'Calibrate cell capacity (default 500 mAh / 400 mAh usable), auto-detect USB-C charging over 2.4 GHz, and reset to 100.0% in one click.',
      hex: 'F0 30 00 00 00 00 64 00',
      note: 'BATTERY SYNC'
    },
    hztest: {
      kicker: 'LIVE COALESCED POINTER BENCHMARK',
      title: 'Real-Time Polling Rate Arena Below',
      desc: 'Swirl your physical gaming mouse rapidly inside the Liquid Sensor Pad below to benchmark real 125–1,000 Hz report intervals right in the browser.',
      hex: 'F0 ED 01 03 E8 00 00 00',
      note: 'POLLING BENCHMARK'
    }
  };

  const hzArenaCard = document.getElementById('hzArenaCard');
  const railTabs = Array.from(document.querySelectorAll('.rail-tab'));
  railTabs.forEach((tab) => {
    const applyRail = () => {
      const key = tab.dataset.stab || 'dashboard';
      const info = STUDIO_TABS[key] || STUDIO_TABS.dashboard;
      if (spKicker) spKicker.textContent = info.kicker;
      if (spTitle) spTitle.textContent = info.title;
      if (spDesc) spDesc.textContent = info.desc;
      if (hzArenaCard) {
        hzArenaCard.classList.toggle('is-highlighted', key === 'hztest');
        if (key === 'hztest') {
          hzArenaCard.scrollIntoView({ behavior: motionPaused ? 'auto' : 'smooth', block: 'nearest' });
        }
      }
      if (macroDemoStrip) {
        macroDemoStrip.classList.toggle('is-highlighted', key === 'macro');
        if (key === 'macro') runMacroBurstPreview();
      }
      emitStudioHex(info.hex, info.note);
    };
    tab.addEventListener('click', applyRail);
    tab.addEventListener('dockselect', applyRail);
  });

  const studioWaveStrip = document.getElementById('studioWaveStrip');
  const studioWaveMeta = document.getElementById('studioWaveMeta');

  const connTabs = Array.from(document.querySelectorAll('.conn-tab'));
  connTabs.forEach((btn) => {
    const applyConn = () => {
      const mode = btn.dataset.conn || '2.4GHz';
      if (mode === '2.4GHz') {
        if (stHzVal) stHzVal.textContent = '1,000 Hz';
        if (studioWaveStrip) studioWaveStrip.style.setProperty('--wave-dur', '0.74s');
        if (studioWaveMeta) studioWaveMeta.textContent = '1,000 HZ · 1.0 MS 2.4GHZ STREAM';
        emitStudioHex('F0 ED 01 03 E8 00 00 00', '2.4GHZ DONGLE LINK');
      } else if (mode === 'USB-C') {
        if (stHzVal) stHzVal.textContent = '1,000 Hz';
        if (studioWaveStrip) studioWaveStrip.style.setProperty('--wave-dur', '0.62s');
        if (studioWaveMeta) studioWaveMeta.textContent = '1,000 HZ · 1.0 MS USB-C DIRECT';
        emitStudioHex('F0 ED 02 03 E8 01 64 00', 'USB-C DIRECT + CHARGE');
      } else {
        if (stHzVal) stHzVal.textContent = '125 Hz';
        if (studioWaveStrip) studioWaveStrip.style.setProperty('--wave-dur', '1.85s');
        if (studioWaveMeta) studioWaveMeta.textContent = '125 HZ · 8.0 MS BT LOW-POWER';
        emitStudioHex('F0 ED 03 00 7D 00 00 00', 'BLUETOOTH 5.2 LOW-POWER');
      }
    };
    btn.addEventListener('click', applyConn);
    btn.addEventListener('dockselect', applyConn);
  });

  const hotspotPins = Array.from(document.querySelectorAll('.hotspot-pin'));
  hotspotPins.forEach((pin) => {
    pin.addEventListener('click', () => {
      hotspotPins.forEach((p) => p.classList.remove('active'));
      pin.classList.add('active');
      const label = pin.dataset.pin || 'Button';
      const hex = pin.dataset.hex || 'F0 09 A5 22 2C 01 00 00';
      if (spKicker) spKicker.textContent = 'LIVE PIN SELECTED';
      if (spTitle) spTitle.textContent = label;
      emitStudioHex(hex, label.toUpperCase());
    });
  });

  const presetBtns = Array.from(document.querySelectorAll('[data-preset]'));
  presetBtns.forEach((btn) => {
    const applyPreset = () => {
      const p = btn.dataset.preset;
      if (p === 'gaming') {
        if (stDpiVal) stDpiVal.textContent = '3,200 DPI';
        if (stDpiSub) stDpiSub.textContent = 'Stage 4 of 6 · Gaming Preset';
        emitStudioHex('F0 0F AE 0A 2F 03 80 0C', 'GAMING 3200 DPI');
      } else if (p === 'office') {
        if (stDpiVal) stDpiVal.textContent = '1,600 DPI';
        if (stDpiSub) stDpiSub.textContent = 'Stage 2 of 6 · Office Preset';
        emitStudioHex('F0 0F AE 0A 2F 01 40 06', 'OFFICE 1600 DPI');
      } else {
        if (stDpiVal) stDpiVal.textContent = '800 DPI';
        if (stDpiSub) stDpiSub.textContent = 'Stage 1 of 6 · Design Preset';
        emitStudioHex('F0 0F AE 0A 2F 00 20 03', 'DESIGN 800 DPI');
      }
    };
    btn.addEventListener('click', applyPreset);
    btn.addEventListener('dockselect', applyPreset);
  });

  // Wave 22 + 26: Studio 1127 Hardware Switches & Live Millisecond-Delta Macro Burst
  const studioSwitches = Array.from(document.querySelectorAll('#studioSwitchesGrid [data-sw-hex]'));
  studioSwitches.forEach((sw) => {
    sw.addEventListener('change', () => {
      const hex = sw.dataset.swHex || 'F0 0F AE 0A 2F 01 01 00';
      const label = sw.dataset.swLabel || 'REGISTER';
      const stateWord = sw.checked ? 'ON' : 'OFF';
      emitStudioHex(hex, `${label} ${stateWord}`);
      showLiquidToast(`${label}: ${stateWord} (64B HID queued)`);
    });
  });

  const macroDemoStrip = document.getElementById('macroDemoStrip');
  const macroRunBtn = document.getElementById('macroRunBtn');
  const macroSteps = Array.from(document.querySelectorAll('#macroBars .m-step'));
  let macroBurstTimers = [];

  function runMacroBurstPreview() {
    macroBurstTimers.forEach((t) => clearTimeout(t));
    macroBurstTimers = [];
    macroSteps.forEach((s) => s.classList.remove('is-firing'));
    if (macroRunBtn) macroRunBtn.textContent = 'Running...';

    const stepFrames = [
      { hex: 'F0 0D 12 04 0E 00 00 00', note: 'KEY 0x04 DOWN · 14MS' },
      { hex: 'F0 0D 12 84 09 00 00 00', note: 'KEY 0x04 UP · 9MS' },
      { hex: 'F0 0D 12 16 10 00 00 00', note: 'KEY 0x16 DOWN · 16MS' },
      { hex: 'F0 0D 12 96 0B 00 00 00', note: 'KEY 0x16 UP · 11MS' },
      { hex: 'F0 10 00 04 00 00 00 00', note: 'COMMIT MACRO · 512KB FLASH' }
    ];

    macroSteps.forEach((stepEl, i) => {
      const t1 = setTimeout(() => {
        macroSteps.forEach((s) => s.classList.remove('is-firing'));
        stepEl.classList.add('is-firing');
        playWaterDrop(i === macroSteps.length - 1 ? 'switch' : 'plop');
        const info = stepFrames[i % stepFrames.length];
        emitStudioHex(info.hex, info.note);
      }, i * 145);
      macroBurstTimers.push(t1);
    });

    const tEnd = setTimeout(() => {
      macroSteps.forEach((s) => s.classList.remove('is-firing'));
      if (macroRunBtn) macroRunBtn.textContent = 'Test Burst';
    }, macroSteps.length * 145 + 240);
    macroBurstTimers.push(tEnd);
  }

  if (macroRunBtn) {
    macroRunBtn.addEventListener('click', runMacroBurstPreview);
  }

  if (stSyncBtn && stBatVal) {
    stSyncBtn.addEventListener('click', () => {
      stBatVal.textContent = '100.0%';
      stSyncBtn.textContent = 'Synced 400 mAh';
      emitStudioHex('F0 30 00 00 00 00 64 01', 'SYNC 100% FULL');
      setTimeout(() => { stSyncBtn.textContent = 'Sync 100%'; }, 2000);
    });
  }

  /* ------------------------------------------------------------------------
     9. WAVES 14-16: SPOTLIGHT PALETTE, LIVE 1,000HZ ARENA, COPY & WEBHID
     ------------------------------------------------------------------------ */
  const statusToast = document.getElementById('statusToast');
  const toastMsg = document.getElementById('toastMsg');
  const toastDismiss = document.getElementById('toastDismiss');
  const srAnnouncer = document.getElementById('srAnnouncer');
  let toastHideTimer = 0;
  let lastSrText = '';

  function hideLiquidToast() {
    if (!statusToast) return;
    clearTimeout(toastHideTimer);
    if (typeof statusToast.hidePopover === 'function') {
      try { statusToast.hidePopover(); } catch (_) {}
    } else {
      statusToast.classList.remove('is-fallback-open');
    }
  }

  function showLiquidToast(message) {
    if (!statusToast || !toastMsg) return;
    const modalBlocking =
      (skinModal && skinModal.open && !skinModal.hasAttribute('data-closing')) ||
      (spotlightDialog && spotlightDialog.open && !spotlightDialog.hasAttribute('data-closing'));
    if (modalBlocking) return;
    clearTimeout(toastHideTimer);
    toastMsg.textContent = message;
    if (typeof statusToast.showPopover === 'function') {
      try { statusToast.showPopover(); } catch (_) {}
    } else {
      statusToast.classList.add('is-fallback-open');
    }
    let srMsg = message;
    if (srMsg === lastSrText) srMsg += '\u00A0';
    lastSrText = srMsg;
    if (typeof document.ariaNotify === 'function') {
      try { document.ariaNotify(message); } catch (_) {}
    } else if (srAnnouncer) {
      srAnnouncer.textContent = srMsg;
    }
    const scheduleDismiss = () => {
      toastHideTimer = setTimeout(() => {
        if (statusToast.contains(document.activeElement)) {
          scheduleDismiss();
          return;
        }
        hideLiquidToast();
      }, 2800);
    };
    scheduleDismiss();
  }

  if (toastDismiss) {
    toastDismiss.addEventListener('click', hideLiquidToast);
  }

  // Wave 16: Invoker Copy Buttons + Async Clipboard + Legacy Fallback (`copy-button` guide!)
  const copyTimers = new WeakMap();
  let lastCopyBubbleMsg = '';

  function legacyCopy(text) {
    const previousFocus = document.activeElement;
    const field = Object.assign(document.createElement('textarea'), { value: text });
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
    document.body.append(field);
    field.select();
    try {
      return document.execCommand('copy');
    } finally {
      field.remove();
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus({ preventScroll: true });
      }
    }
  }

  function reportCopy(button, ok) {
    if (!button) return;
    const tip = button.nextElementSibling;
    clearTimeout(copyTimers.get(button));
    button.removeAttribute('data-copied');
    button.removeAttribute('data-failed');
    let message = ok ? 'Copied' : 'Copy failed';
    if (message === lastCopyBubbleMsg) message += '\u00A0';
    lastCopyBubbleMsg = message;
    if (tip) tip.textContent = '';
    button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
    if (tip) requestAnimationFrame(() => { tip.textContent = message; });
    copyTimers.set(button, setTimeout(() => {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      if (tip) tip.textContent = '';
    }, 2000));
  }

  async function runCopy(button, target) {
    if (!button || !target) return;
    const text = target.matches('input, textarea') ? target.value : target.innerText.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      reportCopy(button, true);
    } catch (_) {
      if (legacyCopy(text)) reportCopy(button, true);
      else reportCopy(button, false);
    }
  }

  if ('CommandEvent' in window) {
    document.addEventListener('command', (event) => {
      if (event.command && event.command.startsWith('--copy')) {
        runCopy(event.source, event.target);
      }
    }, true);
  } else {
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      const copyBtn = event.target.closest ? event.target.closest('button[command^="--copy"]') : null;
      if (copyBtn) {
        const target = document.getElementById(copyBtn.getAttribute('commandfor'));
        if (target) runCopy(copyBtn, target);
      }
    });
  }

  // SHA-256 OS Command Switcher
  const shaVerifyCmd = document.getElementById('shaVerifyCmd');
  const shaOsBtns = Array.from(document.querySelectorAll('[data-sha-os]'));
  shaOsBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      shaOsBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      if (shaVerifyCmd) {
        shaVerifyCmd.textContent = btn.dataset.shaOs === 'unix'
          ? 'shasum -a 256 SMAILWOLF-M3-Pro-Driver_3.0.13*'
          : 'CertUtil -hashfile SMAILWOLF-M3-Pro-Driver_3.0.13_x64-setup.exe SHA256';
      }
    });
  });

  // Live WebHID Browser Capability Check
  const webhidProbeBtn = document.getElementById('webhidProbeBtn');
  const webhidStatusText = document.getElementById('webhidStatusText');
  if (webhidProbeBtn) {
    const hasHid = typeof navigator !== 'undefined' && 'hid' in navigator;
    if (hasHid && webhidStatusText) {
      webhidStatusText.textContent = 'WEBHID API READY';
    }
    webhidProbeBtn.addEventListener('click', async () => {
      if (!('hid' in navigator)) {
        emitStudioHex('F0 0E 00 00 00 00 00 00', 'USE CHROMIUM OR NATIVE TAURI APP');
        showLiquidToast('WebHID requires Chromium or the native Desktop Installer');
        return;
      }
      try {
        const devices = await navigator.hid.getDevices();
        const m3 = devices.find((d) => d.collections && d.collections.some((c) => c.usagePage === 0xff01));
        if (m3) {
          emitStudioHex('F0 0E 01 00 00 00 64 00', `DETECTED ${m3.productName || 'M3 PRO'}`);
          showLiquidToast(`M3 Pro WebHID interface ready (${m3.productName || '0xFF01'})`);
        } else {
          emitStudioHex('F0 0E 00 01 FF 01 00 10', 'WEBHID ENGINE READY · 0 PAIRED');
          showLiquidToast('Browser WebHID engine verified & ready for M3 Pro (0xFF01)');
        }
      } catch (_) {
        emitStudioHex('F0 0E 00 01 FF 01 00 10', 'WEBHID SUPPORTED (LOCAL DESKTOP)');
        showLiquidToast('WebHID supported — use Desktop App or HTTPS to pair');
      }
    });
  }

  // Wave 15: Live 1,000 Hz Coalesced Pointer Polling Rate & Sensor Benchmark Arena
  const hzTestPad = document.getElementById('hzTestPad');
  const hzArenaCanvas = document.getElementById('hzArenaCanvas');
  const hzCtx = hzArenaCanvas
    ? (hzArenaCanvas.getContext('2d', { desynchronized: true }) || hzArenaCanvas.getContext('2d'))
    : null;
  const hzLiveVal = document.getElementById('hzLiveVal');
  const hzPeakVal = document.getElementById('hzPeakVal');
  const hzJitterVal = document.getElementById('hzJitterVal');
  const hzResetBtn = document.getElementById('hzResetBtn');

  if (hzTestPad && hzArenaCanvas && hzCtx) {
    const RING_LEN = 256;
    const stampRing = new Float64Array(RING_LEN);
    let ringHead = 0;
    let ringCount = 0;
    let peakHz = 0;
    const trailPts = [];
    let padActive = false;
    let padRaf = false;
    let decayTimer = 0;

    function sizeHzCanvas() {
      const w = Math.max(240, Math.round(hzTestPad.clientWidth));
      const h = Math.max(90, Math.round(hzTestPad.clientHeight));
      if (hzArenaCanvas.width !== w || hzArenaCanvas.height !== h) {
        hzArenaCanvas.width = w;
        hzArenaCanvas.height = h;
      }
    }
    sizeHzCanvas();
    window.addEventListener('resize', debounce(sizeHzCanvas, 160), { passive: true });

    function drawHzTrail() {
      padRaf = false;
      const w = hzArenaCanvas.width;
      const h = hzArenaCanvas.height;
      hzCtx.clearRect(0, 0, w, h);
      if (trailPts.length < 2) return;
      hzCtx.lineCap = 'round';
      hzCtx.lineJoin = 'round';
      for (let i = 1; i < trailPts.length; i++) {
        const p0 = trailPts[i - 1];
        const p1 = trailPts[i];
        const alpha = i / trailPts.length;
        hzCtx.beginPath();
        hzCtx.moveTo(p0.x, p0.y);
        hzCtx.lineTo(p1.x, p1.y);
        hzCtx.strokeStyle = `rgba(56, 189, 248, ${(alpha * 0.85).toFixed(2)})`;
        hzCtx.lineWidth = 1.5 + alpha * 3.5;
        hzCtx.stroke();
      }
    }

    hzTestPad.addEventListener('pointermove', (ev) => {
      const rect = hzTestPad.getBoundingClientRect();
      const events = typeof ev.getCoalescedEvents === 'function' ? ev.getCoalescedEvents() : [ev];
      const list = events.length ? events : [ev];

      if (!padActive) {
        padActive = true;
        hzTestPad.classList.add('is-active');
      }

      for (let i = 0; i < list.length; i++) {
        const ce = list[i];
        const t = ce.timeStamp || performance.now();
        stampRing[ringHead] = t;
        ringHead = (ringHead + 1) % RING_LEN;
        if (ringCount < RING_LEN) ringCount++;

        trailPts.push({
          x: ce.clientX - rect.left,
          y: ce.clientY - rect.top
        });
        if (trailPts.length > 36) trailPts.shift();
      }

      if (ringCount >= 4) {
        const newestIdx = (ringHead - 1 + RING_LEN) % RING_LEN;
        const newestT = stampRing[newestIdx];
        let validSamples = 0;
        let oldestInWindow = newestT;
        let deltaSum = 0;
        let prevT = newestT;

        for (let k = 1; k < ringCount; k++) {
          const idx = (newestIdx - k + RING_LEN) % RING_LEN;
          const t = stampRing[idx];
          const age = newestT - t;
          if (age > 350 || age < 0) break;
          const d = prevT - t;
          if (d > 0.15 && d < 60) {
            deltaSum += d;
            validSamples++;
            oldestInWindow = t;
          }
          prevT = t;
        }

        const spanMs = newestT - oldestInWindow;
        if (validSamples >= 3 && spanMs > 24) {
          const liveHz = Math.round((validSamples * 1000) / spanMs);
          const clampedHz = clamp(liveHz, 1, 8000);
          if (clampedHz > peakHz) peakHz = clampedHz;
          const avgDelta = deltaSum / validSamples;
          if (hzLiveVal) hzLiveVal.textContent = `${clampedHz.toLocaleString('en-US')} Hz`;
          if (hzPeakVal) hzPeakVal.textContent = `${peakHz.toLocaleString('en-US')} Hz`;
          if (hzJitterVal) hzJitterVal.textContent = `${avgDelta.toFixed(2)} ms`;
        }
      }

      if (!padRaf && !motionPaused) {
        padRaf = true;
        requestAnimationFrame(drawHzTrail);
      }

      clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        if (hzLiveVal) hzLiveVal.textContent = '0 Hz';
        trailPts.length = 0;
        hzCtx.clearRect(0, 0, hzArenaCanvas.width, hzArenaCanvas.height);
        padActive = false;
        hzTestPad.classList.remove('is-active');
      }, 450);
    }, { passive: true });

    if (hzResetBtn) {
      hzResetBtn.addEventListener('click', () => {
        peakHz = 0;
        ringCount = 0;
        ringHead = 0;
        trailPts.length = 0;
        hzCtx.clearRect(0, 0, hzArenaCanvas.width, hzArenaCanvas.height);
        if (hzLiveVal) hzLiveVal.textContent = '0 Hz';
        if (hzPeakVal) hzPeakVal.textContent = '0 Hz';
        if (hzJitterVal) hzJitterVal.textContent = '-- ms';
      });
    }
  }

  // Wave 14: iOS Spotlight Quick Skin & Command Palette (`Ctrl+K` / `⌘K` + Invoker Fallback)
  const spotlightDialog = document.getElementById('spotlightDialog');
  const spotlightTrigger = document.getElementById('spotlightTrigger');
  const spotlightClose = document.getElementById('spotlightClose');
  const spotlightInput = document.getElementById('spotlightInput');
  const spotlightResults = document.getElementById('spotlightResults');
  const spotlightCount = document.getElementById('spotlightCount');
  const spScopePills = Array.from(document.querySelectorAll('[data-sp-scope]'));

  const QUICK_ACTIONS = [
    { type: 'action', badge: 'GPU', title: 'Switch Graphics to Ultra Mode', sub: 'Unlimited native FPS · Volumetric caustics · Trailing water satellites', run: () => setFpsMode('ultra') },
    { type: 'action', badge: 'GPU', title: 'Switch Graphics to Automatic Mode', sub: 'Smart full-fluid Liquid Glass & water cursor for iGPU / mid-range', run: () => setFpsMode('auto') },
    { type: 'action', badge: 'GPU', title: 'Switch Graphics to Low Mode', sub: 'Cuts all heavy animations & cursor physics for ultra-weak machines', run: () => setFpsMode('low') },
    { type: 'action', badge: 'TONE', title: 'Switch to Pure White Tone', sub: 'Default pristine water-lens edition', run: () => selectEditionByIndex(0) },
    { type: 'action', badge: 'TONE', title: 'Switch to Oni Crimson Tone', sub: 'Skin A03 dark crimson crystal', run: () => selectEditionByIndex(1) },
    { type: 'action', badge: 'TONE', title: 'Switch to Cyber Neon Tone', sub: 'Skin F02 ultraviolet cyan crystal', run: () => selectEditionByIndex(2) },
    { type: 'action', badge: 'TONE', title: 'Switch to Pastel Hologram Tone', sub: 'Skin C07 iridescent prism crystal', run: () => selectEditionByIndex(3) },
    { type: 'action', badge: 'HZ', title: 'Open Live 1,000 Hz Mouse Benchmark', sub: 'Test real physical mouse polling rate', run: () => {
      const sec = document.getElementById('driver');
      if (sec) sec.scrollIntoView({ behavior: motionPaused ? 'auto' : 'smooth' });
      const hzTab = document.querySelector('[data-stab="hztest"]');
      if (hzTab) hzTab.click();
    }},
    { type: 'action', badge: 'OS', title: 'Jump to v3.0.13 Multi-OS Downloads', sub: 'Windows .exe · macOS .dmg · Linux .AppImage', run: () => {
      const sec = document.getElementById('download');
      if (sec) sec.scrollIntoView({ behavior: motionPaused ? 'auto' : 'smooth' });
    }},
    { type: 'action', badge: 'SFX', title: 'Toggle Water Sound Acoustics', sub: 'Procedural Web Audio crystal drop & switch chimes', run: () => {
      const sw = document.getElementById('waterSoundSwitch');
      if (sw) {
        sw.checked = !sw.checked;
        sw.dispatchEvent(new CustomEvent('change'));
      }
    }},
    { type: 'action', badge: 'XRAY', title: 'Toggle PAW3311 X-Ray Blueprint', sub: 'Inspect optical sensor, FR2012A MCU & 500 mAh cell', run: () => {
      const sec = document.getElementById('anatomy');
      if (sec) sec.scrollIntoView({ behavior: motionPaused ? 'auto' : 'smooth' });
      const btn = document.getElementById('xrayToggleBtn');
      if (btn) btn.click();
    }},
    { type: 'action', badge: 'FAQ', title: 'Jump to Engineering & Protocol FAQ', sub: 'Firmware safety, SmartScreen, battery math & multi-OS', run: () => {
      const sec = document.getElementById('faq');
      if (sec) sec.scrollIntoView({ behavior: motionPaused ? 'auto' : 'smooth' });
    }},
    { type: 'action', badge: 'RNG', title: 'Shuffle Random Skin (67 Cutouts)', sub: 'Equip a surprise sculpted M3 Pro skin with 3D vortex burst', run: () => shuffleRandomSkin() },
    { type: 'action', badge: 'CMP', title: 'Jump to Driver Comparison Matrix', sub: 'M3 Pro v3.0.13 Rust vs Stock Vendor Suite vs Generic HID', run: () => {
      const sec = document.getElementById('driverCompare');
      if (sec) sec.scrollIntoView({ behavior: motionPaused ? 'auto' : 'smooth' });
    }},
    { type: 'action', badge: 'SPEC', title: 'Copy Configured M3 Pro Loadout', sub: 'Copy equipped skin, DPI, polling rate & register switches', run: () => {
      const btn = document.getElementById('copyLoadoutBtn');
      const target = document.getElementById('loadoutSpecText');
      if (btn && target) runCopy(btn, target);
      showLiquidToast('Copied your configured M3 Pro loadout!');
    }}
  ];

  let spScope = 'all';
  let spFocusIdx = 0;
  let currentSpItems = [];

  function renderSpotlightList() {
    if (!spotlightResults) return;
    const q = (spotlightInput ? spotlightInput.value : '').trim().toLowerCase();
    const matchedItems = [];

    if (spScope === 'all' || spScope === 'actions') {
      QUICK_ACTIONS.forEach((act) => {
        if (!q || act.title.toLowerCase().includes(q) || act.sub.toLowerCase().includes(q)) {
          matchedItems.push(act);
        }
      });
    }

    if (spScope === 'all' || spScope === 'skins') {
      SKINS.forEach((skin, idx) => {
        if (!q || skin.name.toLowerCase().includes(q) || skin.id.toLowerCase().includes(q) || skin.cat.toLowerCase().includes(q)) {
          matchedItems.push({
            type: 'skin',
            skin,
            idx,
            title: skin.name,
            sub: `${skin.id.toUpperCase()} · ${skin.cat.toUpperCase()} SERIES · #${String(idx + 1).padStart(2, '0')}`
          });
        }
      });
    }

    currentSpItems = matchedItems;
    spFocusIdx = 0;
    if (spotlightCount) spotlightCount.textContent = `${matchedItems.length} matching items`;

    if (!matchedItems.length) {
      spotlightResults.innerHTML = '<p class="sp-empty">No matching skins or commands found.</p>';
      return;
    }

    const frag = document.createDocumentFragment();
    matchedItems.slice(0, 40).forEach((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sp-result-item${i === 0 ? ' is-focused' : ''}`;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(i === 0));
      const mediaHtml = item.type === 'skin'
        ? `<img class="sp-res-thumb" src="${item.skin.thumb}" alt="" width="28" height="44" loading="lazy" decoding="async">`
        : `<span class="sp-res-badge-ic">${item.badge}</span>`;
      btn.innerHTML = `
        <span class="sp-res-left">
          ${mediaHtml}
          <span class="sp-res-text">
            <strong>${item.title}</strong>
            <small>${item.sub}</small>
          </span>
        </span>
        <span class="sp-res-action">${item.type === 'skin' ? 'Equip 3D' : 'Run'}</span>
      `;
      btn.addEventListener('click', () => executeSpotlightItem(item));
      frag.appendChild(btn);
    });
    spotlightResults.innerHTML = '';
    spotlightResults.appendChild(frag);
  }

  function executeSpotlightItem(item) {
    if (!item) return;
    if (spotlightDialog) closeTopLayer(spotlightDialog);
    if (item.type === 'skin') {
      equipSkinOnHero(item.skin);
    } else if (item.run) {
      item.run();
    }
  }

  function openSpotlight() {
    if (!spotlightDialog || spotlightDialog.open) return;
    renderSpotlightList();
    spotlightDialog.showModal();
    if (spotlightInput) {
      spotlightInput.focus();
      spotlightInput.select();
    }
  }

  if (spotlightDialog) {
    spotlightDialog.addEventListener('cancel', (ev) => {
      ev.preventDefault();
      closeTopLayer(spotlightDialog);
    });
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      spotlightDialog.addEventListener('click', (event) => {
        if (event.target !== spotlightDialog) return;
        const rect = spotlightDialog.getBoundingClientRect();
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!inside) closeTopLayer(spotlightDialog);
      });
    }
    if (spotlightTrigger) {
      spotlightTrigger.addEventListener('click', () => {
        renderSpotlightList();
        requestAnimationFrame(() => {
          if (!spotlightDialog.open) openSpotlight();
          else if (spotlightInput) {
            spotlightInput.focus();
            spotlightInput.select();
          }
        });
      });
    }
    if (spotlightClose && !('commandForElement' in HTMLButtonElement.prototype)) {
      spotlightClose.addEventListener('click', () => closeTopLayer(spotlightDialog));
    }

    if (spotlightInput) {
      spotlightInput.addEventListener('input', renderSpotlightList);
      spotlightInput.addEventListener('keydown', (ev) => {
        const renderedBtns = Array.from(spotlightResults.querySelectorAll('.sp-result-item'));
        if (!renderedBtns.length) return;
        if (ev.key === 'ArrowDown') {
          ev.preventDefault();
          spFocusIdx = (spFocusIdx + 1) % renderedBtns.length;
        } else if (ev.key === 'ArrowUp') {
          ev.preventDefault();
          spFocusIdx = (spFocusIdx - 1 + renderedBtns.length) % renderedBtns.length;
        } else if (ev.key === 'Enter') {
          ev.preventDefault();
          const chosen = currentSpItems[spFocusIdx];
          if (chosen) executeSpotlightItem(chosen);
          return;
        } else {
          return;
        }
        renderedBtns.forEach((b, bi) => {
          const foc = bi === spFocusIdx;
          b.classList.toggle('is-focused', foc);
          b.setAttribute('aria-selected', String(foc));
          if (foc) b.scrollIntoView({ block: 'nearest' });
        });
      });
    }

    spScopePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        spScope = pill.dataset.spScope || 'all';
        spScopePills.forEach((p) => {
          const active = p === pill;
          p.classList.toggle('active', active);
          p.setAttribute('aria-pressed', String(active));
        });
        renderSpotlightList();
      });
    });

    document.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        if (spotlightDialog.open) closeTopLayer(spotlightDialog);
        else openSpotlight();
      }
    });
  }

  /* ------------------------------------------------------------------------
     10. ULTRA-LEAN SCROLL ENGINE + VISCOUS BACKGROUND "WHOOSH" FOLLOW
     ------------------------------------------------------------------------ */
  const scrollProgress = document.getElementById('scrollProgress');
  const hasNativeScrollTimeline = Boolean(
    window.CSS &&
    CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')
  );
  const toTopBtn = document.getElementById('toTop');
  let scrollTicking = false;
  let anatomyTop = 0;
  let anatomyHeight = 1;
  let skinsTop = 0;
  let skinsHeight = 1;
  let docMaxScroll = 1;

  // Scroll-Velocity Background Whoosh Physics State (Self-healing `whooshRafId`)
  let lastScrollY = window.scrollY || window.pageYOffset || 0;
  let whooshTarget = 0;
  let whooshY = 0;
  let whooshVel = 0;
  let whooshRafId = 0;
  let lastWhooshTime = 0;

  function whooshTick(now) {
    whooshRafId = 0;
    if (fpsLowActive || motionPaused || document.hidden || !glidingFramesStage) {
      lastWhooshTime = 0;
      if (glidingFramesStage) glidingFramesStage.style.transform = '';
      return;
    }
    const rawDt = lastWhooshTime && now ? (now - lastWhooshTime) / 1000 : 1 / detectedHz;
    lastWhooshTime = now || performance.now();
    const dt = clamp(rawDt, 0.0004, 0.034);
    const h = dt * 0.5;

    whooshTarget *= Math.exp(-8.5 * dt);
    [whooshY, whooshVel] = stepSpringDt(whooshY, whooshVel, whooshTarget, 165, 15.5, h);

    if (Math.abs(whooshY) < 0.15 && Math.abs(whooshVel) < 0.8 && Math.abs(whooshTarget) < 0.15) {
      whooshY = 0;
      whooshVel = 0;
      whooshTarget = 0;
      glidingFramesStage.style.transform = '';
      lastWhooshTime = 0;
      return;
    }

    // Pure `translate3d` whoosh (0 `scaleY/skewY` -> 0 10MB offscreen RenderSurface FBO per scroll frame!)
    glidingFramesStage.style.transform = `translate3d(0, ${whooshY.toFixed(1)}px, 0)`;
    whooshRafId = requestAnimationFrame(whooshTick);
  }

  function cacheScrollMetrics() {
    const H = window.innerHeight;
    docMaxScroll = Math.max(1, document.documentElement.scrollHeight - H);
    if (anatomySection) {
      anatomyTop = anatomySection.offsetTop;
      anatomyHeight = anatomySection.offsetHeight;
    }
    if (skinsSection) {
      skinsTop = skinsSection.offsetTop;
      skinsHeight = skinsSection.offsetHeight;
    }
  }
  cacheScrollMetrics();
  window.addEventListener('resize', debounce(cacheScrollMetrics, 140), { passive: true });
  window.addEventListener('load', cacheScrollMetrics, { once: true });

  if (toTopBtn) {
    toTopBtn.addEventListener('click', () => {
      if (navDock && navItems[0]) {
        markNavClickLock();
        navDock.setActive(navItems[0], { animate: true, scrollDock: true, bounceIcon: true });
      }
      window.scrollTo({ top: 0, behavior: motionPaused ? 'auto' : 'smooth' });
    });
  }

  let headerCondensedState = false;
  let toTopShownState = false;

  function onScrollFrame() {
    scrollTicking = false;
    const y = window.scrollY || window.pageYOffset;
    const H = window.innerHeight;

    const scrollDelta = y - lastScrollY;
    lastScrollY = y;
    if (!fpsLowActive && !motionPaused && Math.abs(scrollDelta) > 0.5 && glidingFramesStage) {
      whooshTarget = clamp(whooshTarget - scrollDelta * 0.45, -72, 72);
      if (!whooshRafId) {
        lastWhooshTime = 0;
        whooshRafId = requestAnimationFrame(whooshTick);
      }
    }

    // ZERO getBoundingClientRect() & ZERO redundant classList touches during scroll!
    if (scrollProgress && (!hasNativeScrollTimeline || fpsLowActive)) {
      const globalRatio = clamp(y / docMaxScroll, 0, 1);
      scrollProgress.style.transform = `scaleX(${globalRatio.toFixed(4)})`;
    }
    const nextCondensed = y > 48;
    if (nextCondensed !== headerCondensedState) {
      headerCondensedState = nextCondensed;
      if (siteHeader) siteHeader.classList.toggle('condensed', nextCondensed);
    }
    const nextToTop = y > 520;
    if (nextToTop !== toTopShownState) {
      toTopShownState = nextToTop;
      if (toTopBtn) toTopBtn.classList.toggle('show', nextToTop);
    }

    if (anatomySection && y + H * 1.5 > anatomyTop && y < anatomyTop + anatomyHeight + H * 0.5) {
      const travel = Math.max(1, anatomyHeight - H);
      const p = clamp((y - anatomyTop) / travel, 0, 1);
      const idx = (TOTAL_FRAMES - 1) - Math.round(p * (TOTAL_FRAMES - 1));
      if (idx !== currentDissectFrame) {
        currentDissectFrame = idx;
        drawDissectFrame(idx);
      }
      syncAnatomySliderVisual(p);
      if (anatomyPct) anatomyPct.textContent = `${Math.round(p * 100)}% EXPLODED`;

      const activePhase = p < 0.25 ? 0 : p < 0.52 ? 1 : p < 0.78 ? 2 : 3;
      if (activePhase !== lastAnatomyPhase) {
        calloutCards.forEach((c, ci) => c.classList.toggle('active', ci === activePhase));
        if (performance.now() > phaseClickLockUntil) {
          lastAnatomyPhase = activePhase;
          if (anatomyPhaseDock && phaseBtns[activePhase]) {
            anatomyPhaseDock.setActive(phaseBtns[activePhase], { animate: true, scrollDock: false, bounceIcon: false });
          } else {
            phaseBtns.forEach((b, bi) => b.classList.toggle('active', bi === activePhase));
          }
        }
      }
    }

    if (skinsSection && y + H * 1.5 > skinsTop && y < skinsTop + skinsHeight + H * 0.5) {
      const skinTravel = Math.max(1, skinsHeight - H);
      const sp = clamp((y - skinsTop) / skinTravel, 0, 1);
      updateCoverflowAtProgress(sp);
    }
  }

  function requestScrollFrame() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }

  /* ------------------------------------------------------------------------
     11. WAVES 29-34: PAW3311 X-RAY LENS, LIVE LOADOUT, FAQ ACCORDION & CAUSTICS
     ------------------------------------------------------------------------ */

  // Wave 29: Interactive Pointer-Lens X-Ray Reveal (`interactive-content-reveal` guide!)
  const anatomyFrame = document.getElementById('anatomyFrame');
  const xrayToggleBtn = document.getElementById('xrayToggleBtn');
  if (anatomyFrame) {
    let xrayRect = null;
    const refreshXrayRect = () => {
      xrayRect = anatomyFrame.getBoundingClientRect();
    };
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(refreshXrayRect).observe(anatomyFrame);
    }
    anatomyFrame.addEventListener('pointerenter', refreshXrayRect, { passive: true });
    anatomyFrame.addEventListener('pointermove', (ev) => {
      if (fpsLowActive || motionPaused) return;
      if (!xrayRect || !xrayRect.width) refreshXrayRect();
      const x = clamp(((ev.clientX - xrayRect.left) / Math.max(1, xrayRect.width)) * 100, 0, 100);
      const y = clamp(((ev.clientY - xrayRect.top) / Math.max(1, xrayRect.height)) * 100, 0, 100);
      anatomyFrame.style.setProperty('--xray-x', `${x.toFixed(1)}%`);
      anatomyFrame.style.setProperty('--xray-y', `${y.toFixed(1)}%`);
    }, { passive: true });

    if (xrayToggleBtn) {
      xrayToggleBtn.addEventListener('click', () => {
        const nextFull = !anatomyFrame.classList.contains('is-xray-full');
        anatomyFrame.classList.toggle('is-xray-full', nextFull);
        xrayToggleBtn.setAttribute('aria-pressed', String(nextFull));
        playWaterDrop('switch');
        showLiquidToast(nextFull ? 'PAW3311 X-Ray Blueprint: FULL LOCK' : 'PAW3311 X-Ray Blueprint: POINTER LENS');
      });
    }
  }

  // Wave 30: Live Configured M3 Pro Loadout Builder Mirror
  const loadoutSpecText = document.getElementById('loadoutSpecText');
  function syncConfiguredLoadout() {
    if (!loadoutSpecText) return;
    const activeEdKey = EDITION_ORDER[activeEditionIndex] || 'pearl';
    const edMeta = EDITIONS[activeEdKey] || EDITIONS.pearl;
    const heroHudSkinEl = document.getElementById('heroEditionTag');
    const skinLabel = (heroHudSkinEl && heroHudSkinEl.textContent) ? heroHudSkinEl.textContent.trim() : edMeta.name;
    const dpiText = bentoDpiNum ? `${bentoDpiNum.textContent.trim()} DPI` : '12,000 DPI';
    const hzText = bentoHzNum ? `${bentoHzNum.textContent.trim()} Hz` : '1,000 Hz';
    const activeSw = studioSwitches
      .filter((sw) => sw.checked)
      .map((sw) => (sw.dataset.swLabel || '').replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase())
      .map((s) => s.replace(/(^|\s)\S/g, (t) => t.toUpperCase()));
    const flags = activeSw.length ? activeSw.join(' + ') : 'Raw Sensor';
    loadoutSpecText.textContent = `SMAILWOLF M3 Pro · ${skinLabel} · ${dpiText} · ${hzText} · ${flags}`;
  }

  syncConfiguredLoadout();
  studioSwitches.forEach((sw) => sw.addEventListener('change', syncConfiguredLoadout));
  dpiPills.forEach((p) => { p.addEventListener('click', syncConfiguredLoadout); p.addEventListener('dockselect', syncConfiguredLoadout); });
  hzPills.forEach((p) => { p.addEventListener('click', syncConfiguredLoadout); p.addEventListener('dockselect', syncConfiguredLoadout); });
  if (bentoDpiScrub) bentoDpiScrub.addEventListener('input', syncConfiguredLoadout);
  editionCards.forEach((c) => c.addEventListener('click', () => setTimeout(syncConfiguredLoadout, 360)));
  if (equipHeroBtn) equipHeroBtn.addEventListener('click', () => setTimeout(syncConfiguredLoadout, 750));

  // Wave 32: Native FAQ Accordion Expand/Collapse All (`accordion` guide — Invoker + Fallback + Capture `toggle`)
  const faqAccordion = document.getElementById('faqAccordion');
  const faqToggleAll = document.getElementById('faqToggleAll');
  function runFaqToggleAll(button, accordionEl) {
    if (!button || !accordionEl) return;
    const expand = button.getAttribute('aria-expanded') !== 'true';
    accordionEl.querySelectorAll('details').forEach((d) => { d.open = expand; });
    button.setAttribute('aria-expanded', String(expand));
    playWaterDrop('switch');
  }

  if (faqAccordion && faqToggleAll) {
    if ('CommandEvent' in window) {
      document.addEventListener('command', (ev) => {
        if (ev.command !== '--toggle-all') return;
        runFaqToggleAll(ev.source, ev.target);
      }, { capture: true });
    } else {
      faqToggleAll.addEventListener('click', () => runFaqToggleAll(faqToggleAll, faqAccordion));
    }
    document.addEventListener('toggle', (ev) => {
      if (!ev.target || !ev.target.matches || !ev.target.matches('#faqAccordion > details')) return;
      const items = faqAccordion.querySelectorAll('details');
      const allOpen = items.length > 0 && Array.prototype.every.call(items, (d) => d.open);
      faqToggleAll.setAttribute('aria-expanded', String(allOpen));
    }, { capture: true });
  }

  // Wave 34: Ultra Card Specular Caustic Tracking (Cached Rect on Enter — Zero Layout Thrash!)
  if (finePointer) {
    const causticCards = document.querySelectorAll('.edition-card, .bento-card, .os-card');
    causticCards.forEach((card) => {
      let cRect = null;
      card.addEventListener('pointerenter', () => {
        if (!fpsUltraActive || motionPaused) return;
        cRect = card.getBoundingClientRect();
      }, { passive: true });
      card.addEventListener('pointermove', (ev) => {
        if (!fpsUltraActive || motionPaused || !cRect || !cRect.width) return;
        const rx = clamp(((ev.clientX - cRect.left) / cRect.width) * 100, 0, 100);
        const ry = clamp(((ev.clientY - cRect.top) / cRect.height) * 100, 0, 100);
        card.style.setProperty('--card-mx', `${rx.toFixed(1)}%`);
        card.style.setProperty('--card-my', `${ry.toFixed(1)}%`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => { cRect = null; }, { passive: true });
    });
  }

  /* ------------------------------------------------------------------------
     12. WAVES 38-42: BATTERY ENDURANCE SIM, DPI LED SYNC, OS DETECT & RIPPLE
     ------------------------------------------------------------------------ */

  // Wave 39: Authentic PAW3311 DPI LED Color-Stage Sync on Hero 3D HUD
  const heroDpiDot = document.getElementById('heroDpiDot');
  const heroDpiNum = document.getElementById('heroDpiNum');
  const heroHzNum = document.getElementById('heroHzNum');
  function syncHeroDpiLed(dpiVal) {
    const d = Number(dpiVal) || 12000;
    const ledColor = d <= 800 ? '#ef4444'
      : d <= 1600 ? '#3b82f6'
      : d <= 2400 ? '#22c55e'
      : d <= 3200 ? '#eab308'
      : d <= 6400 ? '#06b6d4'
      : '#a855f7';
    if (heroDpiDot) heroDpiDot.style.setProperty('--dpi-led-color', ledColor);
    if (heroDpiNum) heroDpiNum.textContent = d.toLocaleString('en-US');
  }
  dpiPills.forEach((p) => {
    const sync = () => syncHeroDpiLed(p.dataset.dpi);
    p.addEventListener('click', sync);
    p.addEventListener('dockselect', sync);
  });
  if (bentoDpiScrub) bentoDpiScrub.addEventListener('input', () => syncHeroDpiLed(bentoDpiScrub.value));
  presetBtns.forEach((b) => {
    const syncP = () => syncHeroDpiLed(b.dataset.preset === 'gaming' ? 3200 : b.dataset.preset === 'office' ? 1600 : 800);
    b.addEventListener('click', syncP);
    b.addEventListener('dockselect', syncP);
  });

  // Wave 38: Live Sleep-Aware Days-Per-Charge Lithium Endurance Calculator
  const batHoursScrub = document.getElementById('batHoursScrub');
  const batSliderWrap = document.getElementById('batSliderWrap');
  const batBarFill = document.getElementById('batBarFill');
  const batLiquidThumb = document.getElementById('batLiquidThumb');
  const batDaysVal = document.getElementById('batDaysVal');
  const batSimTag = document.getElementById('batSimTag');
  const batActiveHrs = document.getElementById('batActiveHrs');
  let activeSimMa = 14;
  let activeSimHz = 1000;
  let batScrubbing = false;

  function updateBatterySimulator() {
    const hrsPerDay = batHoursScrub ? clamp(Number(batHoursScrub.value) || 4, 1, 12) : 4;
    const ratio = (hrsPerDay - 1) / 11;
    const dailyMah = hrsPerDay * activeSimMa + (24 - hrsPerDay) * 0.05;
    const days = clamp(400 / Math.max(0.1, dailyMah), 1, 999);
    const activeHrs = 400 / Math.max(1, activeSimMa);

    if (batDaysVal) batDaysVal.textContent = days >= 100 ? Math.round(days).toString() : days.toFixed(1);
    if (batSimTag) batSimTag.textContent = `${hrsPerDay} ${hrsPerDay === 1 ? 'HR' : 'HRS'} / DAY · ${activeSimHz.toLocaleString('en-US')} HZ`;
    if (batActiveHrs) batActiveHrs.textContent = `${activeHrs.toFixed(1)} hrs`;
    if (batBarFill) batBarFill.style.transform = `scaleX(${clamp(0.06 + ratio * 0.94, 0.06, 1).toFixed(3)})`;
    if (batLiquidThumb && batSliderWrap) {
      const trackW = batSliderWrap.clientWidth || 320;
      const maxLeft = Math.max(0, trackW - 62);
      const sx = batScrubbing ? 1.22 : 1;
      const sy = batScrubbing ? 1.26 : 1;
      batLiquidThumb.style.transform = `translate3d(${(ratio * maxLeft).toFixed(2)}px, -50%, 0) scale(${sx}, ${sy})`;
    }
  }

  hzPills.forEach((pill) => {
    const syncHzSim = () => {
      activeSimHz = Number(pill.dataset.hz) || 1000;
      activeSimMa = parseFloat(pill.dataset.ma) || 14;
      if (heroHzNum) heroHzNum.textContent = `${activeSimHz.toLocaleString('en-US')} Hz`;
      updateBatterySimulator();
    };
    pill.addEventListener('click', syncHzSim);
    pill.addEventListener('dockselect', syncHzSim);
  });

  if (batHoursScrub) {
    const endBatScrub = () => {
      if (!batScrubbing) return;
      batScrubbing = false;
      if (batSliderWrap) batSliderWrap.classList.remove('is-scrubbing');
      updateBatterySimulator();
    };
    batHoursScrub.addEventListener('pointerdown', () => {
      batScrubbing = true;
      if (batSliderWrap) batSliderWrap.classList.add('is-scrubbing');
      updateBatterySimulator();
    });
    window.addEventListener('pointerup', endBatScrub, { passive: true });
    window.addEventListener('pointercancel', endBatScrub, { passive: true });
    batHoursScrub.addEventListener('input', updateBatterySimulator);
  }
  updateBatterySimulator();
  window.addEventListener('resize', debounce(updateBatterySimulator, 150), { passive: true });

  // Wave 41: Auto-Detect Visitor OS -> Highlight Matching Download Card & SHA-256 Tab
  (function detectVisitorOsCard() {
    const rawPlat = String(
      (navigator.userAgentData && navigator.userAgentData.platform) ||
      navigator.platform ||
      navigator.userAgent ||
      ''
    ).toLowerCase();
    const osKey = rawPlat.includes('mac') ? 'mac' : rawPlat.includes('linux') ? 'linux' : 'win';
    const matchCard = document.querySelector(`[data-os-card="${osKey}"]`);
    const matchTag = document.querySelector(`[data-os-tag="${osKey}"]`);
    if (matchCard) matchCard.classList.add('is-your-os');
    if (matchTag) matchTag.textContent = '(your OS)';
    if (osKey !== 'win') {
      const unixBtn = document.querySelector('[data-sha-os="unix"]');
      if (unixBtn) unixBtn.click();
    }
  })();

  // Wave 42: Single Pooled Zero-Allocation Liquid Tap Ripple on Primary Buttons & Cards
  const waterTapPool = document.getElementById('waterTapPool');
  if (waterTapPool) {
    let rippleEndTimer = 0;
    document.addEventListener('pointerdown', (ev) => {
      if (fpsLowActive || motionPaused || ev.button > 0) return;
      const hit = ev.target && ev.target.closest ? ev.target.closest('.primary-btn, .os-btn, .edition-card, .nav-shuffle') : null;
      if (!hit) return;
      clearTimeout(rippleEndTimer);
      waterTapPool.classList.remove('is-pulsing');
      waterTapPool.style.transform = `translate3d(${ev.clientX.toFixed(1)}px, ${ev.clientY.toFixed(1)}px, 0)`;
      void waterTapPool.offsetWidth;
      waterTapPool.classList.add('is-pulsing');
      rippleEndTimer = setTimeout(() => waterTapPool.classList.remove('is-pulsing'), 460);
    }, { passive: true });
  }

  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  sizeDissectCanvas();
  onScrollFrame();
})();
