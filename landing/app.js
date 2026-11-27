/* ==========================================================================
   SMAILWOLF M3 PRO — ULTRA-60FPS APPLE WWDC25 + LIQUID-GLASS-JS ENGINE
   1. dashersw/liquid-glass-js Capsule SDF Refraction Map (<feDisplacementMap>)
   2. Draggable 2-Layer Water-Droplet Taskbars + Metaball Coalesce Blur Trail
   3. Icon-Only Top Dock with Jelly Bounce + Delayed Post-Bounce Label Reveal
   4. Video-2 Clear Water-Lens Scroll Slider (#skinsLiquidThumb)
   5. 60 Hz Coalesced Pointer Pipeline (Zero 1,000 Hz Gaming-Mouse Flood!)
   6. scheduler.yield() Sliced 121-Frame Loader + Windowed Coverflow Culling
   ========================================================================== */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let motionPaused = prefersReduced;

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
     0. HARDWARE TIER DETECTION (Auto-scales heavy asset memory on 4-8GB PCs!)
     ------------------------------------------------------------------------ */
  const hwCores = navigator.hardwareConcurrency || 4;
  const hwMem = navigator.deviceMemory || 4;
  const isLowPowerGPU = hwCores <= 4 || hwMem <= 4;

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
     2. 60HZ COALESCED POINTER & ELASTIC SURFACE-TENSION ENGINE
     Eliminates 1,000 Hz gaming-mouse event flooding -> 0ms input latency!
     ------------------------------------------------------------------------ */
  const LIQUID_SELECTOR = [
    '.liquid-taskbar-dock',
    '.brand-pill',
    '.motion-toggle',
    '.header-cta',
    '.eyebrow-pill',
    '.primary-btn',
    '.secondary-btn',
    '.award-badge',
    '.edition-card',
    '.nav-step',
    '.anatomy-dock',
    '.skins-dock',
    '.wafer-layer',
    '.layer-inspector',
    '.fact-pill',
    '.bento-card',
    '.s-metric',
    '.studio-panel-info',
    '.os-card',
    '.os-btn',
    '.pedestal-orb',
    '.to-top'
  ].join(',');

  const liquidStates = new WeakMap();
  const activeLiquidEls = new Set();
  let liquidLoopRunning = false;

  function getLiquidState(el) {
    let st = liquidStates.get(el);
    if (!st) {
      st = {
        el,
        rect: null,
        tx: 0, ty: 0, vx: 0, vy: 0, targetTx: 0, targetTy: 0,
        sx: 1, sy: 1, vsx: 0, vsy: 0, targetSx: 1, targetSy: 1,
        sk: 0, vsk: 0, targetSk: 0,
        hovered: false,
        pressed: false
      };
      liquidStates.set(el, st);
    }
    return st;
  }

  function stepSpring(pos, vel, target, k, damp) {
    const nv = (vel + (target - pos) * k) * damp;
    return [pos + nv, nv];
  }

  function liquidPhysicsTick() {
    if (motionPaused || !activeLiquidEls.size || document.hidden) {
      liquidLoopRunning = false;
      return;
    }
    liquidLoopRunning = true;

    activeLiquidEls.forEach((el) => {
      const st = liquidStates.get(el);
      if (!st) {
        activeLiquidEls.delete(el);
        return;
      }

      const k = st.hovered ? 0.24 : 0.15;
      const damp = st.hovered ? 0.72 : 0.75;

      [st.tx, st.vx] = stepSpring(st.tx, st.vx, st.targetTx, k, damp);
      [st.ty, st.vy] = stepSpring(st.ty, st.vy, st.targetTy, k, damp);
      [st.sx, st.vsx] = stepSpring(st.sx, st.vsx, st.targetSx, k, damp);
      [st.sy, st.vsy] = stepSpring(st.sy, st.vsy, st.targetSy, k, damp);
      [st.sk, st.vsk] = stepSpring(st.sk, st.vsk, st.targetSk, k, damp);

      const settled =
        !st.hovered &&
        Math.abs(st.tx) < 0.08 &&
        Math.abs(st.ty) < 0.08 &&
        Math.abs(st.sx - 1) < 0.0008 &&
        Math.abs(st.sy - 1) < 0.0008 &&
        Math.abs(st.sk) < 0.02 &&
        Math.abs(st.vx) < 0.05 &&
        Math.abs(st.vy) < 0.05;

      if (settled) {
        st.tx = 0; st.ty = 0; st.sx = 1; st.sy = 1; st.sk = 0;
        el.style.translate = '';
        el.style.scale = '';
        el.style.transform = '';
        activeLiquidEls.delete(el);
      } else {
        el.style.translate = `${st.tx.toFixed(2)}px ${st.ty.toFixed(2)}px`;
        el.style.scale = `${st.sx.toFixed(4)} ${st.sy.toFixed(4)}`;
        el.style.transform = st.sk ? `skewX(${st.sk.toFixed(2)}deg)` : '';
      }
    });

    if (activeLiquidEls.size > 0) {
      requestAnimationFrame(liquidPhysicsTick);
    } else {
      liquidLoopRunning = false;
    }
  }

  function wakeLiquidPhysics() {
    if (!liquidLoopRunning && !motionPaused && activeLiquidEls.size > 0) {
      liquidLoopRunning = true;
      requestAnimationFrame(liquidPhysicsTick);
    }
  }

  const mouse = { x: 0, y: 0, px: window.innerWidth / 2, py: window.innerHeight / 2 };
  const currentMouse = { x: 0, y: 0 };
  let heroVisible = true;
  let heroRunning = false;

  const cursorGlint = document.getElementById('liquidCursorGlint');
  let glintVisible = false;

  if (finePointer) {
    let currentHoveredChain = [];
    let rawX = window.innerWidth * 0.5;
    let rawY = window.innerHeight * 0.5;
    let rawTarget = null;
    let ptrFrameScheduled = false;

    function processCoalescedPointer() {
      ptrFrameScheduled = false;
      if (motionPaused) return;

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

      // Move ONE single GPU-composited glint via translate3d -> ZERO card gradient repaints!
      if (cursorGlint) {
        if (matched.length > 0) {
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
          st.rect = null;
          st.targetTx = 0;
          st.targetTy = 0;
          st.targetSx = 1;
          st.targetSy = 1;
          st.targetSk = 0;
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
        }

        const r = st.rect;
        const lx = rawX - r.left;
        const ly = rawY - r.top;

        const nx = clamp((lx / r.width - 0.5) * 2, -1.05, 1.05);
        const ny = clamp((ly / r.height - 0.5) * 2, -1.05, 1.05);

        const diag = Math.sqrt(r.width * r.width + r.height * r.height);
        const isLarge = diag > 480;
        const isTaskbarDock = el.classList && el.classList.contains('liquid-taskbar-dock');

        const pullAmp = isTaskbarDock ? 2.8 : (isLarge ? 5.0 : 8.5);
        const stretchAmp = isTaskbarDock ? 0.008 : (isLarge ? 0.015 : 0.042);
        const skewAmp = isTaskbarDock ? 0 : (isLarge ? 0.45 : 1.35);
        const pressBoost = st.pressed ? 0.032 : 0.008;

        st.targetTx = nx * pullAmp;
        st.targetTy = ny * pullAmp;

        const ax = Math.abs(nx);
        const ay = Math.abs(ny);
        st.targetSx = 1 + ax * stretchAmp - ay * (stretchAmp * 0.3) + pressBoost;
        st.targetSy = 1 + ay * stretchAmp - ax * (stretchAmp * 0.3) + pressBoost;
        st.targetSk = nx * ny * skewAmp;

        activeLiquidEls.add(el);
      }

      if (activeLiquidEls.size > 0) wakeLiquidPhysics();
    }

    document.addEventListener('pointermove', (e) => {
      rawX = e.clientX;
      rawY = e.clientY;
      rawTarget = e.target;
      if (!ptrFrameScheduled && !motionPaused) {
        ptrFrameScheduled = true;
        requestAnimationFrame(processCoalescedPointer);
      }
    }, { passive: true });

    // Tactile Video-2 Touch-Bloom & Lens Inflation on Press!
    document.addEventListener('pointerdown', (e) => {
      if (motionPaused) return;
      const el = e.target && e.target.closest ? e.target.closest(LIQUID_SELECTOR) : null;
      if (el && !el.classList.contains('liquid-taskbar-dock')) {
        const st = getLiquidState(el);
        st.pressed = true;
        st.targetSx = Math.max(st.targetSx, 1.045);
        st.targetSy = Math.max(st.targetSy, 1.045);
        activeLiquidEls.add(el);
        wakeLiquidPhysics();
      }
    }, { passive: true });

    document.addEventListener('pointerup', () => {
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
    }, { passive: true });

    window.addEventListener('scroll', () => {
      for (let i = 0; i < currentHoveredChain.length; i++) {
        const st = liquidStates.get(currentHoveredChain[i]);
        if (st) st.rect = null;
      }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     3. LIGHTWEIGHT WORD-LEVEL SPLIT REVEAL & MOTION PAUSE TOGGLE
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

  const motionToggle = document.getElementById('motionToggle');
  const motionToggleLabel = document.getElementById('motionToggleLabel');
  if (prefersReduced) document.body.classList.add('motion-paused');
  if (motionToggle && motionToggleLabel) {
    if (motionPaused) {
      motionToggleLabel.textContent = 'Play';
      motionToggle.setAttribute('aria-label', 'Play ambient motion');
    }
    motionToggle.addEventListener('click', () => {
      motionPaused = !motionPaused;
      document.body.classList.toggle('motion-paused', motionPaused);
      motionToggleLabel.textContent = motionPaused ? 'Play' : 'Pause';
      motionToggle.setAttribute('aria-label', motionPaused ? 'Play ambient motion' : 'Pause ambient motion');
      if (motionPaused) {
        activeLiquidEls.forEach((el) => {
          el.style.translate = '';
          el.style.scale = '';
          el.style.transform = '';
        });
        activeLiquidEls.clear();
        snapAllLiquidDocks();
      } else {
        wakeHeroLoop();
      }
    });
  }

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
    const rawDt = lastDockTickTime ? (now - lastDockTickTime) / 1000 : 1 / 60;
    lastDockTickTime = now;
    const dt = clamp(rawDt, 0.004, 0.034);
    const h = dt * 0.5;

    activeDocks.forEach((st) => {
      const isDrag = st.dragging;
      const stiffLead = isDrag ? 420 : 200;
      const dampLead = isDrag ? 35 : 24;
      const stiffTrail = isDrag ? 210 : 48;
      const dampTrail = isDrag ? 25 : 9.8;

      const stiffA = st.dir >= 0 ? stiffTrail : stiffLead;
      const dampA = st.dir >= 0 ? dampTrail : dampLead;
      const stiffB = st.dir >= 0 ? stiffLead : stiffTrail;
      const dampB = st.dir >= 0 ? dampLead : dampTrail;

      const targetSwell = isDrag ? 0.18 : 0;

      for (let s = 0; s < 2; s++) {
        const accA = (st.targetA - st.posA) * stiffA - st.velA * dampA;
        st.velA += accA * h;
        st.posA += st.velA * h;

        const accB = (st.targetB - st.posB) * stiffB - st.velB * dampB;
        st.velB += accB * h;
        st.posB += st.velB * h;

        const accSw = (targetSwell - st.swell) * 110 - st.velSwell * 12;
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
        if (opts.bounceIcon !== false) triggerIconBounce(nextTab);
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
        st.velSwell = clamp(st.velSwell + 1.32, -2, 2.3);
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

  function applyThemeAndMouse(ed, finalSrc, finalTag) {
    document.body.setAttribute('data-edition', ed.key);
    document.body.classList.toggle('is-light-tone', ed.isLight);
    if (themeMetaEl) themeMetaEl.setAttribute('content', ed.themeMeta);
    toneLayers.forEach((layer) => layer.classList.toggle('active', layer.dataset.tb === ed.key));

    if (heroMouseImg) {
      heroMouseImg.src = finalSrc;
      heroMouseImg.alt = `SMAILWOLF M3 Pro Wireless Gaming Mouse — ${finalTag}`;
    }
    if (studioMouseImg) studioMouseImg.src = finalSrc;
    if (dlMouseImg) dlMouseImg.src = finalSrc;

    if (heroEditionTag) heroEditionTag.textContent = finalTag;
    if (heroScriptLeft) heroScriptLeft.textContent = ed.scriptLeft;
    if (heroBoldLeft) heroBoldLeft.textContent = ed.boldLeft;
    if (heroScriptRight) heroScriptRight.textContent = ed.scriptRight;
    if (heroBoldRight) heroBoldRight.textContent = ed.boldRight;
  }

  function triggerToneSweepWave(ed) {
    document.body.setAttribute('data-edition', ed.key);
    document.body.classList.toggle('is-light-tone', ed.isLight);
    toneLayers.forEach((layer) => layer.classList.toggle('active', layer.dataset.tb === ed.key));

    if (!toneSweepWave || motionPaused) return;
    toneSweepWave.classList.remove('sweeping');
    requestAnimationFrame(() => toneSweepWave.classList.add('sweeping'));
  }

  function runSpinSwap({ editionKey, customSrc, customName }) {
    const ed = EDITIONS[editionKey] || EDITIONS.pearl;
    const finalSrc = customSrc || ed.src;
    const finalTag = customName ? customName.toUpperCase() : ed.tag;

    triggerToneSweepWave(ed);

    if (window.gsap && !motionPaused) {
      gsap.killTweensOf(spinObj);
      orbState.forEach((o) => gsap.killTweensOf(o.el));
      isSwitching = true;
      spinObj.val = switchSpin % 360;
      wakeHeroLoop();

      gsap.to(spinObj, {
        val: 360,
        duration: 0.4,
        ease: 'power2.in',
        onUpdate: () => {
          switchSpin = spinObj.val;
          wakeHeroLoop();
        },
        onComplete: () => {
          applyThemeAndMouse(ed, finalSrc, finalTag);
          gsap.to(spinObj, {
            val: 720,
            duration: 0.92,
            ease: 'back.out(0.8)',
            onUpdate: () => {
              switchSpin = spinObj.val;
              wakeHeroLoop();
            },
            onComplete: () => {
              switchSpin = 0;
              spinObj.val = 0;
              isSwitching = false;
              wakeHeroLoop();
            }
          });
        }
      });

      if (window.innerWidth > 1040) {
        let imgCounter = 0;
        orbState.forEach((o) => {
          const toCenterX = window.innerWidth / 2 - o.cx;
          const toCenterY = window.innerHeight / 2 - o.cy;
          const nextBaseX = (Math.random() - 0.5) * 90;
          const nextBaseY = (Math.random() - 0.5) * 90;
          const skinCode = o.img ? ed.orbSkins[imgCounter++ % ed.orbSkins.length] : null;

          gsap.timeline()
            .to(o.el, {
              x: toCenterX,
              y: toCenterY,
              scale: 0.18,
              opacity: 0,
              duration: 0.32,
              ease: 'power2.in',
              onComplete: () => {
                if (o.img && skinCode) o.img.src = `assets/skins/thumbs/${skinCode}.webp`;
              }
            })
            .to(o.el, {
              x: nextBaseX,
              y: nextBaseY,
              scale: 1,
              opacity: 1,
              duration: 0.64,
              delay: 0.06,
              ease: 'back.out(1.35)',
              onComplete: () => {
                o.baseX = nextBaseX;
                o.baseY = nextBaseY;
                o.rx = 0;
                o.ry = 0;
              }
            });
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
    runSpinSwap({ editionKey: key });
  }

  editionCards.forEach((card, idx) => {
    card.addEventListener('click', () => selectEditionByIndex(idx));
  });

  const edPrev = document.getElementById('edPrev');
  const edNext = document.getElementById('edNext');
  if (edPrev) edPrev.addEventListener('click', () => selectEditionByIndex(activeEditionIndex - 1));
  if (edNext) edNext.addEventListener('click', () => selectEditionByIndex(activeEditionIndex + 1));

  function heroTick() {
    if (!heroVisible || motionPaused || document.hidden) {
      heroRunning = false;
      return;
    }

    const dxMouse = mouse.x - currentMouse.x;
    const dyMouse = mouse.y - currentMouse.y;
    currentMouse.x += dxMouse * 0.12;
    currentMouse.y += dyMouse * 0.12;

    if (productRig) {
      const rotY = currentMouse.x * 28 + switchSpin;
      const rotX = -currentMouse.y * 15;
      productRig.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(14deg)`;
    }

    let orbsSettling = false;
    if (window.innerWidth > 1040) {
      if (orbsFG) orbsFG.style.transform = `translate3d(${(currentMouse.x * 32).toFixed(1)}px, ${(currentMouse.y * 32).toFixed(1)}px, 0)`;
      if (orbsBG) orbsBG.style.transform = `translate3d(${(currentMouse.x * -16).toFixed(1)}px, ${(currentMouse.y * -16).toFixed(1)}px, 0)`;

      if (!isSwitching) {
        for (let i = 0; i < orbState.length; i++) {
          const o = orbState[i];
          const diffX = mouse.px - (o.cx + o.baseX);
          const diffY = mouse.py - (o.cy + o.baseY);
          const distSq = diffX * diffX + diffY * diffY;

          let targetRx = 0;
          let targetRy = 0;
          if (distSq < 90000) {
            const dist = Math.sqrt(distSq) || 1;
            const force = (300 - dist) / 300;
            targetRx = (diffX / dist) * force * -50;
            targetRy = (diffY / dist) * force * -50;
          }

          const stepX = (targetRx - o.rx) * 0.14;
          const stepY = (targetRy - o.ry) * 0.14;
          if (Math.abs(stepX) > 0.1 || Math.abs(stepY) > 0.1) orbsSettling = true;

          o.rx += stepX;
          o.ry += stepY;
          o.el.style.transform = `translate3d(${(o.rx + o.baseX).toFixed(1)}px, ${(o.ry + o.baseY).toFixed(1)}px, 0)`;
        }
      }
    }

    const stillMoving = Math.abs(dxMouse) > 0.001 || Math.abs(dyMouse) > 0.001 || orbsSettling || isSwitching || switchSpin !== 0;
    if (stillMoving) {
      requestAnimationFrame(heroTick);
    } else {
      heroRunning = false;
    }
  }

  function wakeHeroLoop() {
    if (!heroRunning && heroVisible && !motionPaused && !document.hidden) {
      heroRunning = true;
      requestAnimationFrame(heroTick);
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
  const dissectCtx = dissectCanvas ? dissectCanvas.getContext('2d', { alpha: false }) : null;
  const dissectLoader = document.getElementById('dissectLoader');
  const dissectCount = document.getElementById('dissectCount');
  const anatomyBarFill = document.getElementById('anatomyBarFill');
  const anatomyPct = document.getElementById('anatomyPct');
  const calloutCards = Array.from(document.querySelectorAll('.anatomy-callout'));
  const phaseBtns = Array.from(document.querySelectorAll('.phase-btn'));

  const pad3 = (n) => String(n).padStart(3, '0');

  function drawDissectFrame(idx) {
    if (!dissectCtx || !dissectCanvas) return;
    let img = frameImgs[idx];
    if (!img || !img.complete || !img.naturalWidth) {
      // Check adjacent even frame on stride-2 low-RAM mode before falling back to frame 121
      const adj = idx + 1 < TOTAL_FRAMES && frameImgs[idx + 1] ? frameImgs[idx + 1] : frameImgs[idx - 1];
      img = (adj && adj.complete && adj.naturalWidth) ? adj : frameImgs[TOTAL_FRAMES - 1];
      if (!img || !img.complete || !img.naturalWidth) return;
    }
    const cw = dissectCanvas.width;
    const ch = dissectCanvas.height;
    if (!cw || !ch) return;
    const scale = Math.max(cw / 1280, ch / 720);
    const dw = 1280 * scale;
    const dh = 720 * scale;
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

  function loadSingleFrame(idx) {
    return new Promise((resolve) => {
      if (frameImgs[idx]) {
        resolve();
        return;
      }
      const im = new Image();
      im.decoding = 'async';
      frameImgs[idx] = im;
      const done = () => {
        loadedFrames++;
        if (dissectCount) dissectCount.textContent = `${Math.min(loadedFrames, targetDissectTotal)}/${targetDissectTotal}`;
        if (Math.abs(idx - currentDissectFrame) <= 1) drawDissectFrame(currentDissectFrame);
        if (loadedFrames >= targetDissectTotal && dissectLoader) dissectLoader.classList.add('done');
        resolve();
      };
      im.onload = done;
      im.onerror = done;
      im.src = `assets/explode/f${pad3(idx + 1)}.webp`;
    });
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
  let phaseClickLockUntil = 0;
  let lastAnatomyPhase = 0;

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
      const thumbW = 56;
      const maxLeft = Math.max(0, sliderTrackWidth - thumbW);
      const x = r * maxLeft;
      const sx = sliderScrubbing ? clamp(1.18 + vel * 2.8, 1.18, 1.34) : 1;
      const sy = sliderScrubbing ? 1.22 : 1;
      skinsLiquidThumb.style.transform = `translate3d(${x.toFixed(2)}px, -50%, 0) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    }
  }

  function renderSkinTrack(filterKey) {
    if (!skinsTrack) return;
    visibleSkins = filterKey === 'all' ? SKINS.slice() : SKINS.filter((s) => s.cat === filterKey);
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
      btn.addEventListener('click', () => openSkinModal(skin, idx));
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
    const firstCenter = pedestalCenters[0] || 0;
    const lastCenter = pedestalCenters[pedestalEls.length - 1] || firstCenter;
    const focusX = firstCenter + sp * Math.max(0, lastCenter - firstCenter);
    const tx = window.innerWidth / 2 - focusX;

    if (!prefersReduced) {
      skinsTrack.style.transform = `translate3d(${tx.toFixed(1)}px, 0, 0)`;
    }
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
        if (prefersReduced) {
          cls = diff === 0 ? 'cf-center' : 'cf-right-1';
        } else if (diff === 0) cls = 'cf-center';
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
    }
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
      if (prefersReduced || window.innerWidth <= 1040) {
        updateCoverflowAtProgress(ratio);
      } else {
        const travel = skinsSection.offsetHeight - window.innerHeight;
        window.scrollTo({ top: skinsSection.offsetTop + travel * ratio, behavior: 'auto' });
      }
    });
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

  function openSkinModal(skin, idx) {
    inspectedSkin = skin;
    if (skinModalImg) {
      skinModalImg.src = skin.src;
      skinModalImg.alt = `SMAILWOLF M3 Pro — ${skin.name}`;
    }
    if (skinModalId) skinModalId.textContent = `${skin.id.toUpperCase()} · ${String(idx + 1).padStart(2, '0')}/${visibleSkins.length}`;
    if (skinModalName) skinModalName.textContent = skin.name;
    if (skinModal && typeof skinModal.showModal === 'function') {
      skinModal.showModal();
    }
  }

  if (skinModal) {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      skinModal.addEventListener('click', (event) => {
        if (event.target !== skinModal) return;
        const rect = skinModal.getBoundingClientRect();
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!inside) skinModal.close();
      });
    }
    if (skinModalClose) skinModalClose.addEventListener('click', () => skinModal.close());
    if (modalDownloadLink) modalDownloadLink.addEventListener('click', () => skinModal.close());
    if (equipHeroBtn) {
      equipHeroBtn.addEventListener('click', () => {
        skinModal.close();
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
            special: inspectedSkin.id === 'default' ? 'pearl' : 'hologram',
            topo: 'pearl'
          };
          const edKey = themeMap[inspectedSkin.cat] || 'pearl';
          activeEditionIndex = EDITION_ORDER.indexOf(edKey);
          editionCards.forEach((c) => c.classList.toggle('active', c.dataset.edition === edKey));
          if (edCounter) edCounter.textContent = `0${activeEditionIndex + 1} / 04`;
          runSpinSwap({
            editionKey: edKey,
            customSrc: inspectedSkin.src,
            customName: `${inspectedSkin.name} · ${inspectedSkin.id.toUpperCase()}`
          });
        }, motionPaused ? 0 : 340);
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
  const dpiPills = Array.from(document.querySelectorAll('#bentoDpiPills .sim-pill'));

  dpiPills.forEach((pill) => {
    const applyDpi = () => {
      const dpi = Number(pill.dataset.dpi) || 1600;
      if (bentoDpiNum) bentoDpiNum.textContent = dpi.toLocaleString('en-US');
      if (bentoDpiStageTag) bentoDpiStageTag.textContent = `STAGE ${pill.dataset.stage || '1'} / 6`;
      if (bentoDpiBar) bentoDpiBar.style.transform = `scaleX(${Math.max(0.12, dpi / 12000).toFixed(3)})`;
    };
    pill.addEventListener('click', applyDpi);
    pill.addEventListener('dockselect', applyDpi);
  });

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
    }
  };

  const railTabs = Array.from(document.querySelectorAll('.rail-tab'));
  railTabs.forEach((tab) => {
    const applyRail = () => {
      const info = STUDIO_TABS[tab.dataset.stab] || STUDIO_TABS.dashboard;
      if (spKicker) spKicker.textContent = info.kicker;
      if (spTitle) spTitle.textContent = info.title;
      if (spDesc) spDesc.textContent = info.desc;
      emitStudioHex(info.hex, info.note);
    };
    tab.addEventListener('click', applyRail);
    tab.addEventListener('dockselect', applyRail);
  });

  const connTabs = Array.from(document.querySelectorAll('.conn-tab'));
  connTabs.forEach((btn) => {
    const applyConn = () => {
      const mode = btn.dataset.conn || '2.4GHz';
      if (mode === '2.4GHz') {
        if (stHzVal) stHzVal.textContent = '1,000 Hz';
        emitStudioHex('F0 ED 01 03 E8 00 00 00', '2.4GHZ DONGLE LINK');
      } else if (mode === 'USB-C') {
        if (stHzVal) stHzVal.textContent = '1,000 Hz';
        emitStudioHex('F0 ED 02 03 E8 01 64 00', 'USB-C DIRECT + CHARGE');
      } else {
        if (stHzVal) stHzVal.textContent = '125 Hz';
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

  if (stSyncBtn && stBatVal) {
    stSyncBtn.addEventListener('click', () => {
      stBatVal.textContent = '100.0%';
      stSyncBtn.textContent = 'Synced 400 mAh';
      emitStudioHex('F0 30 00 00 00 00 64 01', 'SYNC 100% FULL');
      setTimeout(() => { stSyncBtn.textContent = 'Sync 100%'; }, 2000);
    });
  }

  /* ------------------------------------------------------------------------
     9. ULTRA-LEAN READ-THEN-WRITE SCROLL ENGINE (ZERO REFLOW, CACHED OFFSETS!)
     ------------------------------------------------------------------------ */
  const scrollProgress = document.getElementById('scrollProgress');
  const toTopBtn = document.getElementById('toTop');
  let scrollTicking = false;
  let anatomyTop = 0;
  let anatomyHeight = 1;
  let skinsTop = 0;
  let skinsHeight = 1;
  let docMaxScroll = 1;

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

  function onScrollFrame() {
    scrollTicking = false;
    const y = window.scrollY || window.pageYOffset;
    const H = window.innerHeight;

    // ZERO getBoundingClientRect() during scroll -> 0ms layout read cost!
    const globalRatio = clamp(y / docMaxScroll, 0, 1);
    if (scrollProgress) scrollProgress.style.transform = `scaleX(${globalRatio.toFixed(4)})`;
    if (siteHeader) siteHeader.classList.toggle('condensed', y > 48);
    if (toTopBtn) toTopBtn.classList.toggle('show', y > 520);

    if (anatomySection && y + H * 1.5 > anatomyTop && y < anatomyTop + anatomyHeight + H * 0.5) {
      const travel = Math.max(1, anatomyHeight - H);
      const p = clamp((y - anatomyTop) / travel, 0, 1);
      const idx = (TOTAL_FRAMES - 1) - Math.round(p * (TOTAL_FRAMES - 1));
      if (idx !== currentDissectFrame) {
        currentDissectFrame = idx;
        drawDissectFrame(idx);
      }
      if (anatomyBarFill) anatomyBarFill.style.transform = `scaleX(${p.toFixed(3)})`;
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

    if (skinsSection && !prefersReduced && y + H * 1.5 > skinsTop && y < skinsTop + skinsHeight + H * 0.5) {
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

  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  sizeDissectCanvas();
  onScrollFrame();
})();
