/* ==========================================================================
   SMAILWOLF M3 PRO — 60FPS PURE LIQUID GLASS & ELASTIC WATER-PULL ENGINE
   1. Elastic Surface-Tension Liquid Pull & Stretch Physics on ALL Glass
      Frames, Buttons & Taskbar (Damped Spring, 0ms Reflow, Self-Sleeping!)
   2. Interruptible 720° Spin-Swap + Silky Diagonal Tone-Sweep Wave
   3. Contrast-Proof Dynamic Island Taskbar Glider
   4. 121-Frame 3D Hardware Dissection & 67-Skin 3D Coverflow Vault
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
     2. IOS 26 ELASTIC SURFACE-TENSION LIQUID PULL & STRETCH ENGINE (60 FPS!)
     Every Liquid Glass frame, pill, button & taskbar magnetically pulls toward
     the cursor and stretches like real surface-tension liquid water, then
     oscillates back smoothly via a Hooke's Law damped spring on exit!
     Runs ONLY on the 1-2 elements currently touched/settling -> 0% idle CPU!
     ------------------------------------------------------------------------ */
  const LIQUID_SELECTOR = [
    '.liquid-taskbar-dock',
    '.brand-pill',
    '.nav-capsule',
    '.motion-toggle',
    '.header-cta',
    '.eyebrow-pill',
    '.primary-btn',
    '.secondary-btn',
    '.award-badge',
    '.edition-card',
    '.nav-step',
    '.anatomy-dock',
    '.skin-filters',
    '.skins-dock',
    '.wafer-layer',
    '.layer-inspector',
    '.fact-pill',
    '.honest-note',
    '.bento-card',
    '.s-metric',
    '.studio-panel-info',
    '.download-shell',
    '.os-card',
    '.os-btn',
    '.pedestal-orb',
    '.footer-grid',
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
        hovered: false
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

      const k = st.hovered ? 0.22 : 0.14;
      const damp = st.hovered ? 0.72 : 0.76;

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
        // Use individual `translate` & `scale` properties + subtle skew so layout never shifts!
        el.style.translate = `${st.tx.toFixed(2)}px ${st.ty.toFixed(2)}px`;
        el.style.scale = `${st.sx.toFixed(4)} ${st.sy.toFixed(4)}`;
        el.style.transform = `skewX(${st.sk.toFixed(2)}deg)`;
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

  if (finePointer) {
    let currentHoveredChain = [];

    document.addEventListener('pointermove', (e) => {
      if (motionPaused) return;

      // Collect up to 2 nested Liquid Glass frames under cursor (e.g. button + parent card)
      const matched = [];
      let node = e.target;
      while (node && node !== document.body && matched.length < 2) {
        if (node.matches && node.matches(LIQUID_SELECTOR)) {
          matched.push(node);
        }
        node = node.parentElement;
      }

      // Release elements no longer under the pointer
      for (let i = 0; i < currentHoveredChain.length; i++) {
        const prev = currentHoveredChain[i];
        if (!matched.includes(prev)) {
          const st = getLiquidState(prev);
          st.hovered = false;
          st.rect = null;
          st.targetTx = 0;
          st.targetTy = 0;
          st.targetSx = 1;
          st.targetSy = 1;
          st.targetSk = 0;
          prev.style.setProperty('--l-alpha', '0');
          activeLiquidEls.add(prev);
        }
      }

      currentHoveredChain = matched;

      // Update liquid attraction & constant-volume water stretch for hovered frame(s)
      for (let i = 0; i < matched.length; i++) {
        const el = matched[i];
        const st = getLiquidState(el);
        if (!st.hovered || !st.rect) {
          // Measure un-transformed bounding rect once on entry
          const r = el.getBoundingClientRect();
          st.rect = {
            left: r.left - st.tx,
            top: r.top - st.ty,
            width: Math.max(40, r.width),
            height: Math.max(32, r.height)
          };
          st.hovered = true;
          el.style.setProperty('--l-alpha', '1');
        }

        const r = st.rect;
        const lx = e.clientX - r.left;
        const ly = e.clientY - r.top;
        el.style.setProperty('--lx', `${lx.toFixed(0)}px`);
        el.style.setProperty('--ly', `${ly.toFixed(0)}px`);

        const nx = clamp((lx / r.width - 0.5) * 2, -1.15, 1.15);
        const ny = clamp((ly / r.height - 0.5) * 2, -1.15, 1.15);

        // Adaptive liquid elasticity: pills/buttons stretch dramatically like droplets;
        // large panels pull & stretch subtly so edges stay crisp inside the viewport!
        const diag = Math.sqrt(r.width * r.width + r.height * r.height);
        const isLarge = diag > 540;
        const isTaskbarDock = el.classList && el.classList.contains('liquid-taskbar-dock');
        const isParentWithHoveredChild = i === 1;

        const pullAmp = isTaskbarDock ? 3.8 : (isParentWithHoveredChild ? 4.5 : (isLarge ? 7.5 : 11.5));
        const stretchAmp = isTaskbarDock ? 0.013 : (isParentWithHoveredChild ? 0.014 : (isLarge ? 0.022 : 0.056));
        const skewAmp = isTaskbarDock ? 0.38 : (isParentWithHoveredChild ? 0.5 : (isLarge ? 0.85 : 2.1));

        st.targetTx = nx * pullAmp;
        st.targetTy = ny * pullAmp;

        // Constant-volume fluid stretch: elongates along cursor axis while gently compressing cross-axis
        const ax = Math.abs(nx);
        const ay = Math.abs(ny);
        st.targetSx = 1 + ax * stretchAmp - ay * (stretchAmp * 0.32) + 0.012;
        st.targetSy = 1 + ay * stretchAmp - ax * (stretchAmp * 0.32) + 0.012;
        st.targetSk = nx * ny * skewAmp;

        activeLiquidEls.add(el);
      }

      if (activeLiquidEls.size > 0) wakeLiquidPhysics();
    }, { passive: true });

    window.addEventListener('scroll', () => {
      // Invalidate cached hover rects on scroll so next pointermove refreshes smoothly
      currentHoveredChain.forEach((el) => {
        const st = liquidStates.get(el);
        if (st) st.rect = null;
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     3. SPLIT-TEXT REVEAL & MOTION PAUSE TOGGLE (WCAG 2.2.2)
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    let charIdx = 0;

    const appendWords = (text) => {
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          el.appendChild(document.createTextNode(' '));
          return;
        }
        const w = document.createElement('span');
        w.className = 'word';
        for (const ch of part) {
          const c = document.createElement('span');
          c.className = 'char';
          c.style.setProperty('--i', String(charIdx++));
          c.textContent = ch;
          w.appendChild(c);
        }
        el.appendChild(w);
      });
    };

    nodes.forEach((n) => {
      if (n.nodeType === 3) appendWords(n.textContent);
      else if (n.nodeType === 1 && n.tagName === 'BR') el.appendChild(document.createElement('br'));
      else if (n.nodeType === 1) {
        const em = document.createElement(n.tagName.toLowerCase());
        em.className = n.className;
        for (const ch of n.textContent) {
          if (ch === ' ') {
            em.appendChild(document.createTextNode(' '));
            continue;
          }
          const c = document.createElement('span');
          c.className = 'char';
          c.style.setProperty('--i', String(charIdx++));
          c.textContent = ch;
          em.appendChild(c);
        }
        const wrap = document.createElement('span');
        wrap.className = 'word';
        wrap.appendChild(em);
        el.appendChild(wrap);
      }
    });
  });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
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
     4. UNIVERSAL 2-LAYER IOS 26 VISCOUS WATER-DROPLET TASKBAR ENGINE
     - Frame 1 (.liquid-taskbar-dock): Crystal Water-Glass Dock Channel
     - Hover Preview (.liquid-dock-ghost): Soft misty guide on non-active tabs
       (NEVER steals or moves the active droplet before clicking!)
     - Frame 2 (.liquid-dock-droplet): Convex Water-Lens Capsule protruding
       outside Frame 1 that sucks & stretches like viscous liquid water on click!
     ------------------------------------------------------------------------ */
  const siteHeader = document.getElementById('siteHeader');
  const dockControllers = new Map();
  const activeDocks = new Set();
  let dockLoopRunning = false;
  let lastDockTickTime = 0;

  function renderDockDropletImmediate(st) {
    const left = Math.min(st.posA, st.posB);
    const span = Math.max(24, Math.abs(st.posB - st.posA));
    if (st.isVertical) {
      st.droplet.style.width = '';
      st.droplet.style.height = `${span.toFixed(2)}px`;
      st.droplet.style.transform = `translate3d(0, ${left.toFixed(2)}px, 0) scaleX(1)`;
    } else {
      st.droplet.style.height = '';
      st.droplet.style.width = `${span.toFixed(2)}px`;
      st.droplet.style.transform = `translate3d(${left.toFixed(2)}px, 0, 0) scaleY(1)`;
    }
    st.droplet.style.setProperty('--flow-shift', '0%');
    st.droplet.style.setProperty('--flow-energy', '0');
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
      // Leading edge reaches out immediately with capillary suction;
      // trailing edge stretches into a glossy water bridge & coalesces smoothly (~0.82s)!
      const stiffLead = 188;
      const dampLead = 23.2;
      const stiffTrail = 43.5;
      const dampTrail = 9.4;

      const stiffA = st.dir >= 0 ? stiffTrail : stiffLead;
      const dampA = st.dir >= 0 ? dampTrail : dampLead;
      const stiffB = st.dir >= 0 ? stiffLead : stiffTrail;
      const dampB = st.dir >= 0 ? dampLead : dampTrail;

      for (let s = 0; s < 2; s++) {
        const accA = (st.targetA - st.posA) * stiffA - st.velA * dampA;
        st.velA += accA * h;
        st.posA += st.velA * h;

        const accB = (st.targetB - st.posB) * stiffB - st.velB * dampB;
        st.velB += accB * h;
        st.posB += st.velB * h;

        const accSw = (0 - st.swell) * 96 - st.velSwell * 10.6;
        st.velSwell += accSw * h;
        st.swell += st.velSwell * h;
      }

      const naturalSpan = Math.max(26, st.targetB - st.targetA);
      const left = Math.min(st.posA, st.posB);
      const curSpan = Math.max(24, Math.abs(st.posB - st.posA));
      const stretch = Math.max(0, (curSpan - naturalSpan) / naturalSpan);

      // Coalesce plump: as trailing edge rushes in & bridge contracts, water bulges proud!
      const trailSpeed = Math.abs(st.dir >= 0 ? st.velA : st.velB);
      const nearTarget = Math.abs((st.dir >= 0 ? st.targetA - st.posA : st.targetB - st.posB)) < naturalSpan * 0.55;
      const arrivalPlump = nearTarget ? Math.min(0.085, (trailSpeed / 950) * 0.09) : 0;
      const neckPinch = Math.min(0.11, stretch * 0.055);
      const crossScale = clamp(1 + st.swell + arrivalPlump - neckPinch, 0.89, 1.18);

      const avgVel = (st.velA + st.velB) * 0.5;
      const flowShift = clamp(avgVel * 0.042, -34, 34);
      const flowEnergy = clamp(Math.abs(avgVel) / 260 + stretch * 0.6 + Math.abs(st.swell) * 2.4, 0, 1);

      const settled =
        Math.abs(st.targetA - st.posA) < 0.14 &&
        Math.abs(st.targetB - st.posB) < 0.14 &&
        Math.abs(st.velA) < 1.2 &&
        Math.abs(st.velB) < 1.2 &&
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
      } else {
        if (st.isVertical) {
          st.droplet.style.width = '';
          st.droplet.style.height = `${curSpan.toFixed(2)}px`;
          st.droplet.style.transform = `translate3d(0, ${left.toFixed(2)}px, 0) scaleX(${crossScale.toFixed(4)})`;
        } else {
          st.droplet.style.height = '';
          st.droplet.style.width = `${curSpan.toFixed(2)}px`;
          st.droplet.style.transform = `translate3d(${left.toFixed(2)}px, 0, 0) scaleY(${crossScale.toFixed(4)})`;
        }
        st.droplet.style.setProperty('--flow-shift', `${flowShift.toFixed(1)}%`);
        st.droplet.style.setProperty('--flow-energy', flowEnergy.toFixed(3));
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

    let droplet = dockEl.querySelector(':scope > .liquid-dock-droplet');
    if (!droplet) {
      droplet = document.createElement('span');
      droplet.className = 'liquid-dock-droplet';
      droplet.setAttribute('aria-hidden', 'true');
      ghost.after(droplet);
    }

    const isTablist = dockEl.getAttribute('role') === 'tablist';
    const initialActive = tabs.find((t) => t.classList.contains('active')) || tabs[0];
    syncTabAccessibility(tabs, initialActive, isTablist);

    const st = {
      dockEl,
      tabs,
      ghost,
      droplet,
      isTablist,
      isVertical: false,
      scrollable: false,
      activeTab: initialActive,
      hoveredTab: null,
      initialized: false,
      posA: 0,
      posB: 72,
      velA: 0,
      velB: 0,
      targetA: 0,
      targetB: 72,
      dir: 1,
      swell: 0,
      velSwell: 0
    };

    function getBoundsForTab(tab) {
      if (st.isVertical) {
        return [tab.offsetTop - 2, tab.offsetTop + tab.offsetHeight + 2];
      }
      const bleed = st.scrollable ? 1 : 3;
      return [tab.offsetLeft - bleed, tab.offsetLeft + tab.offsetWidth + bleed];
    }

    function updateGhost(tab) {
      st.hoveredTab = tab;
      if (!tab || tab === st.activeTab || !tab.offsetWidth) {
        ghost.style.opacity = '0';
        return;
      }
      if (st.isVertical) {
        ghost.style.width = '';
        ghost.style.height = `${tab.offsetHeight}px`;
        ghost.style.transform = `translate3d(0, ${tab.offsetTop}px, 0)`;
      } else {
        ghost.style.height = '';
        ghost.style.width = `${tab.offsetWidth}px`;
        ghost.style.transform = `translate3d(${tab.offsetLeft}px, 0, 0)`;
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
      const changed = nextTab !== st.activeTab;
      st.activeTab = nextTab;
      syncTabAccessibility(tabs, nextTab, isTablist);

      // Hide hover preview once that tab becomes the active droplet target
      if (st.hoveredTab === nextTab) ghost.style.opacity = '0';

      if (!nextTab.offsetWidth) {
        measure(true);
        return;
      }

      const [nextA, nextB] = getBoundsForTab(nextTab);
      if (changed) {
        st.dir = nextA >= st.posA ? 1 : -1;
      }
      st.targetA = nextA;
      st.targetB = nextB;

      // Scroll only the horizontal dock scroller (NEVER hijack page scroll!)
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
        st.initialized = true;
        activeDocks.delete(st);
        renderDockDropletImmediate(st);
      } else if (changed || Math.abs(nextA - st.posA) > 0.5 || Math.abs(nextB - st.posB) > 0.5) {
        // Inject surface-tension plump impulse so the water droplet lifts & sucks smoothly!
        st.velSwell = clamp(st.velSwell + 1.28, -2, 2.2);
        activeDocks.add(st);
        wakeDockPhysics();
      }
    }

    tabs.forEach((tab, idx) => {
      tab.addEventListener('pointerenter', () => updateGhost(tab));
      tab.addEventListener('focus', () => {
        if (tab !== st.activeTab) updateGhost(tab);
      });
      tab.addEventListener('blur', () => {
        if (st.hoveredTab === tab) ghost.style.opacity = '0';
      });
      tab.addEventListener('click', () => {
        setActive(tab, { animate: true, scrollDock: true });
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
  let navClickLockUntil = 0;

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      // Lock scroll spy during smooth scroll so droplet sucks directly to clicked tab!
      navClickLockUntil = performance.now() + 1150;
    });
  });

  // Also sync top taskbar cleanly when in-page CTA / footer section anchors are clicked
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    if (anchor.classList.contains('nav-item')) return;
    anchor.addEventListener('click', () => {
      const secId = (anchor.getAttribute('href') || '').slice(1);
      const match = navItems.find((n) => n.dataset.sec === secId);
      if (match && navDock) {
        navClickLockUntil = performance.now() + 1150;
        navDock.setActive(match, { animate: true, scrollDock: true });
      }
    });
  });

  const sectionSpy = new IntersectionObserver((entries) => {
    if (performance.now() < navClickLockUntil) return;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const match = navItems.find((n) => n.dataset.sec === entry.target.id);
      if (match && navDock && navDock.getActive() !== match) {
        navDock.setActive(match, { animate: true, scrollDock: true });
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
  let heroVisible = true;
  let heroRunning = false;

  const mouse = { x: 0, y: 0, px: window.innerWidth / 2, py: window.innerHeight / 2 };
  const currentMouse = { x: 0, y: 0 };

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
    if (productRig) productRig.style.setProperty('--mouse-mask', `url("${finalSrc}")`);

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
    void toneSweepWave.offsetWidth;
    toneSweepWave.classList.add('sweeping');
  }

  // Interruptible Spin-Swap (Rapid clicks immediately cancel prior tween cleanly!)
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
        duration: 0.42,
        ease: 'power2.in',
        onUpdate: () => {
          switchSpin = spinObj.val;
          wakeHeroLoop();
        },
        onComplete: () => {
          applyThemeAndMouse(ed, finalSrc, finalTag);
          gsap.to(spinObj, {
            val: 720,
            duration: 0.98,
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
            duration: 0.34,
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
            duration: 0.68,
            delay: 0.08,
            ease: 'back.out(1.35)',
            onComplete: () => {
              o.baseX = nextBaseX;
              o.baseY = nextBaseY;
              o.rx = 0;
              o.ry = 0;
            }
          });
      });
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
    currentMouse.x += dxMouse * 0.1;
    currentMouse.y += dyMouse * 0.1;

    if (productRig) {
      const rotY = currentMouse.x * 30 + switchSpin;
      const rotX = -currentMouse.y * 16;
      productRig.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(14deg)`;
    }

    if (orbsFG) orbsFG.style.transform = `translate3d(${(currentMouse.x * 36).toFixed(1)}px, ${(currentMouse.y * 36).toFixed(1)}px, 0)`;
    if (orbsBG) orbsBG.style.transform = `translate3d(${(currentMouse.x * -18).toFixed(1)}px, ${(currentMouse.y * -18).toFixed(1)}px, 0)`;

    let orbsSettling = false;
    if (!isSwitching) {
      for (let i = 0; i < orbState.length; i++) {
        const o = orbState[i];
        const diffX = mouse.px - (o.cx + o.baseX);
        const diffY = mouse.py - (o.cy + o.baseY);
        const distSq = diffX * diffX + diffY * diffY;

        let targetRx = 0;
        let targetRy = 0;
        if (distSq < 102400) { // 320px radius
          const dist = Math.sqrt(distSq) || 1;
          const force = (320 - dist) / 320;
          targetRx = (diffX / dist) * force * -56;
          targetRy = (diffY / dist) * force * -56;
        }

        const stepX = (targetRx - o.rx) * 0.12;
        const stepY = (targetRy - o.ry) * 0.12;
        if (Math.abs(stepX) > 0.08 || Math.abs(stepY) > 0.08) orbsSettling = true;

        o.rx += stepX;
        o.ry += stepY;
        o.el.style.transform = `translate3d(${(o.rx + o.baseX).toFixed(1)}px, ${(o.ry + o.baseY).toFixed(1)}px, 0)`;
      }
    }

    const stillMoving = Math.abs(dxMouse) > 0.0008 || Math.abs(dyMouse) > 0.0008 || orbsSettling || isSwitching || switchSpin !== 0;
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

  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      if (!heroVisible || motionPaused) return;
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      mouse.px = e.clientX;
      mouse.py = e.clientY;
      wakeHeroLoop();
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     6. 121-FRAME 3D HARDWARE DISSECTION ENGINE (<canvas>)
     ------------------------------------------------------------------------ */
  const TOTAL_FRAMES = 121;
  const frameImgs = [];
  let loadedFrames = 0;
  let currentDissectFrame = TOTAL_FRAMES - 1;

  const anatomySection = document.getElementById('anatomy');
  const anatomyFrame = document.getElementById('anatomyFrame');
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
    const img = frameImgs[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
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
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const w = Math.min(1280, Math.max(320, Math.round(dissectCanvas.clientWidth * dpr)));
    const h = Math.min(720, Math.max(180, Math.round(dissectCanvas.clientHeight * dpr)));
    if (dissectCanvas.width !== w || dissectCanvas.height !== h) {
      dissectCanvas.width = w;
      dissectCanvas.height = h;
      drawDissectFrame(currentDissectFrame);
    }
  }

  for (let i = 0; i < TOTAL_FRAMES; i++) frameImgs.push(new Image());

  (function loadDissectFrames() {
    const order = [TOTAL_FRAMES - 1];
    for (let i = TOTAL_FRAMES - 2; i >= 0; i--) order.push(i);
    order.forEach((idx) => {
      const im = frameImgs[idx];
      im.onload = () => {
        loadedFrames++;
        if (dissectCount) dissectCount.textContent = `${loadedFrames}/${TOTAL_FRAMES}`;
        if (idx === TOTAL_FRAMES - 1) {
          sizeDissectCanvas();
          drawDissectFrame(TOTAL_FRAMES - 1);
        }
        if (loadedFrames >= TOTAL_FRAMES && dissectLoader) {
          dissectLoader.classList.add('done');
          drawDissectFrame(currentDissectFrame);
        }
      };
      im.onerror = () => {
        loadedFrames++;
        if (loadedFrames >= TOTAL_FRAMES && dissectLoader) dissectLoader.classList.add('done');
      };
      im.src = `assets/explode/f${pad3(idx + 1)}.webp`;
    });
  })();

  window.addEventListener('resize', debounce(sizeDissectCanvas, 150), { passive: true });

  const anatomyPhaseDock = dockControllers.get('anatomyPhaseDock');
  let phaseClickLockUntil = 0;
  let lastAnatomyPhase = 0;

  phaseBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      if (!anatomySection) return;
      phaseClickLockUntil = performance.now() + 950;
      lastAnatomyPhase = idx;
      const targetP = parseFloat(btn.dataset.jump) || 0;
      const travel = anatomySection.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: anatomySection.offsetTop + travel * targetP,
        behavior: motionPaused ? 'auto' : 'smooth'
      });
    });
  });

  /* ------------------------------------------------------------------------
     7. 60FPS 3D CYLINDRICAL COVERFLOW SKIN VAULT + ACCESSIBLE <dialog>
     ------------------------------------------------------------------------ */
  const skinsSection = document.getElementById('skins');
  const skinsTrack = document.getElementById('skinsTrack');
  const skinsCounter = document.getElementById('skinsCounter');
  const skinsScrub = document.getElementById('skinsScrub');
  const skinsName = document.getElementById('skinsName');
  const filterChips = Array.from(document.querySelectorAll('.filter-chip'));

  let visibleSkins = SKINS.slice();
  let pedestalEls = [];
  let pedestalCenters = [];
  let inspectedSkin = SKINS[0];
  let lastActiveSkinIdx = -1;

  function measureSkinCardSize() {
    if (!skinsSection) return;
    const minDim = Math.min(window.innerWidth * 0.42, window.innerHeight * 0.22);
    const cardW = clamp(Math.floor(minDim), 132, 198);
    skinsSection.style.setProperty('--skin-card-w', `${cardW}px`);
    pedestalCenters = pedestalEls.map((el) => el.offsetLeft + el.offsetWidth / 2);
  }

  function renderSkinTrack(filterKey) {
    if (!skinsTrack) return;
    visibleSkins = filterKey === 'all' ? SKINS.slice() : SKINS.filter((s) => s.cat === filterKey);
    const frag = document.createDocumentFragment();

    visibleSkins.forEach((skin, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-pedestal liquid-glass';
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

    const activeIdx = clamp(Math.round(sp * (visibleSkins.length - 1)), 0, visibleSkins.length - 1);
    if (activeIdx !== lastActiveSkinIdx) {
      lastActiveSkinIdx = activeIdx;
      if (skinsCounter) {
        skinsCounter.textContent = `${String(activeIdx + 1).padStart(2, '0')} / ${String(visibleSkins.length).padStart(2, '0')}`;
      }
      if (skinsName) skinsName.textContent = visibleSkins[activeIdx].name;
      if (skinsScrub && document.activeElement !== skinsScrub) {
        skinsScrub.value = String(activeIdx);
      }

      for (let i = 0; i < pedestalEls.length; i++) {
        const el = pedestalEls[i];
        const diff = i - activeIdx;
        let cls = 'cf-right-2';
        if (diff === 0) cls = 'cf-center';
        else if (diff === -1) cls = 'cf-left-1';
        else if (diff === 1) cls = 'cf-right-1';
        else if (diff < -1) cls = 'cf-left-2';

        if (el._cf !== cls) {
          el.classList.remove('cf-center', 'cf-left-1', 'cf-right-1', 'cf-left-2', 'cf-right-2');
          el.classList.add(cls);
          el._cf = cls;
        }
      }
    }
  }

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderSkinTrack(chip.dataset.filter || 'all');
    });
  });

  if (skinsScrub) {
    skinsScrub.addEventListener('input', () => {
      if (!skinsSection || !visibleSkins.length) return;
      const ratio = visibleSkins.length > 1 ? Number(skinsScrub.value) / (visibleSkins.length - 1) : 0;
      if (prefersReduced || window.innerWidth <= 1040) {
        updateCoverflowAtProgress(ratio);
      } else {
        const travel = skinsSection.offsetHeight - window.innerHeight;
        window.scrollTo({ top: skinsSection.offsetTop + travel * ratio, behavior: 'auto' });
      }
    });
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
    });
    modalMouseStage.addEventListener('pointerleave', () => {
      modalMouseRig.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }

  renderSkinTrack('all');
  window.addEventListener('resize', debounce(() => {
    lastActiveSkinIdx = -1;
    measureSkinCardSize();
  }, 150), { passive: true });

  /* ------------------------------------------------------------------------
     8. INTERACTIVE WAFER STACK, BENTO CALCULATORS & LIVE DRIVER STUDIO
     ------------------------------------------------------------------------ */
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
    pill.addEventListener('click', () => {
      dpiPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const dpi = Number(pill.dataset.dpi) || 1600;
      if (bentoDpiNum) bentoDpiNum.textContent = dpi.toLocaleString('en-US');
      if (bentoDpiStageTag) bentoDpiStageTag.textContent = `STAGE ${pill.dataset.stage || '1'} / 6`;
      if (bentoDpiBar) bentoDpiBar.style.transform = `scaleX(${Math.max(0.12, dpi / 12000).toFixed(3)})`;
    });
  });

  const bentoHzNum = document.getElementById('bentoHzNum');
  const bentoLatencyTag = document.getElementById('bentoLatencyTag');
  const bentoMa = document.getElementById('bentoMa');
  const bentoHrs = document.getElementById('bentoHrs');
  const hzPills = Array.from(document.querySelectorAll('#bentoHzPills .sim-pill'));

  hzPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      hzPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const hz = Number(pill.dataset.hz) || 1000;
      if (bentoHzNum) bentoHzNum.textContent = hz.toLocaleString('en-US');
      if (bentoLatencyTag) bentoLatencyTag.textContent = pill.dataset.ms || '1.0 ms';
      if (bentoMa) bentoMa.textContent = pill.dataset.ma || '14 mA';
      if (bentoHrs) bentoHrs.textContent = pill.dataset.hrs || '28.6 hrs';
    });
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
      const dur = 900;
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
    tab.addEventListener('click', () => {
      const info = STUDIO_TABS[tab.dataset.stab] || STUDIO_TABS.dashboard;
      if (spKicker) spKicker.textContent = info.kicker;
      if (spTitle) spTitle.textContent = info.title;
      if (spDesc) spDesc.textContent = info.desc;
      emitStudioHex(info.hex, info.note);
    });
  });

  const connTabs = Array.from(document.querySelectorAll('.conn-tab'));
  connTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
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
    });
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
    btn.addEventListener('click', () => {
      presetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
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
    });
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
     9. UNIFIED READ-THEN-WRITE SCROLL ENGINE (SINGLE PASSIVE rAF)
     ------------------------------------------------------------------------ */
  const scrollProgress = document.getElementById('scrollProgress');
  const toTopBtn = document.getElementById('toTop');
  const studioWindow = document.getElementById('studioWindow');
  const marqueeTracks = Array.from(document.querySelectorAll('.marquee-track'));

  let marqueeSpanW = 0;
  let marqueeOffset = 0;
  let lastScrollY = window.scrollY || 0;
  let scrollTicking = false;

  function measureMarquee() {
    const firstSpan = document.querySelector('.marquee-track span');
    if (firstSpan) marqueeSpanW = firstSpan.offsetWidth;
  }
  measureMarquee();
  window.addEventListener('resize', debounce(measureMarquee, 150), { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureMarquee);

  if (toTopBtn) {
    toTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: motionPaused ? 'auto' : 'smooth' });
    });
  }

  function onScrollFrame() {
    scrollTicking = false;
    const y = window.scrollY || window.pageYOffset;
    const H = window.innerHeight;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - H);

    // ---- PHASE 1: BATCHED GEOMETRY READS ----
    const anatomyRect = anatomySection ? anatomySection.getBoundingClientRect() : null;
    const skinsRect = skinsSection ? skinsSection.getBoundingClientRect() : null;
    const studioRect = studioWindow ? studioWindow.getBoundingClientRect() : null;

    // ---- PHASE 2: COMPOSITOR-ONLY WRITES ----
    const globalRatio = clamp(y / maxScroll, 0, 1);
    if (scrollProgress) scrollProgress.style.transform = `scaleX(${globalRatio.toFixed(4)})`;
    if (siteHeader) siteHeader.classList.toggle('condensed', y > 48);
    if (toTopBtn) toTopBtn.classList.toggle('show', y > 520);

    if (anatomySection && anatomyRect && anatomyRect.bottom > -H && anatomyRect.top < H * 2) {
      const travel = Math.max(1, anatomyRect.height - H);
      const p = clamp(-anatomyRect.top / travel, 0, 1);
      const idx = (TOTAL_FRAMES - 1) - Math.round(p * (TOTAL_FRAMES - 1));
      if (idx !== currentDissectFrame) {
        currentDissectFrame = idx;
        drawDissectFrame(idx);
      }
      if (anatomyBarFill) anatomyBarFill.style.transform = `scaleX(${p.toFixed(3)})`;
      if (anatomyPct) anatomyPct.textContent = `${Math.round(p * 100)}% EXPLODED`;

      const activePhase = p < 0.25 ? 0 : p < 0.52 ? 1 : p < 0.78 ? 2 : 3;
      calloutCards.forEach((c, ci) => c.classList.toggle('active', ci === activePhase));
      if (activePhase !== lastAnatomyPhase && performance.now() > phaseClickLockUntil) {
        lastAnatomyPhase = activePhase;
        if (anatomyPhaseDock && phaseBtns[activePhase]) {
          anatomyPhaseDock.setActive(phaseBtns[activePhase], { animate: true, scrollDock: false });
        } else {
          phaseBtns.forEach((b, bi) => b.classList.toggle('active', bi === activePhase));
        }
      }

      if (anatomyFrame && !motionPaused) {
        const entryTilt = clamp(1 - (-anatomyRect.top + H * 0.6) / (H * 0.6), 0, 1);
        anatomyFrame.style.transform = `rotateX(${(entryTilt * 8).toFixed(2)}deg) scale(${(1 - entryTilt * 0.035).toFixed(3)})`;
      }
    }

    if (skinsSection && skinsRect && !prefersReduced && skinsRect.bottom > -H && skinsRect.top < H * 2) {
      const skinTravel = Math.max(1, skinsRect.height - H);
      const sp = clamp(-skinsRect.top / skinTravel, 0, 1);
      updateCoverflowAtProgress(sp);
    }

    if (studioWindow && studioRect && !motionPaused && studioRect.bottom > -80 && studioRect.top < H + 80) {
      const approach = clamp((studioRect.top - H * 0.15) / (H * 0.75), 0, 1);
      studioWindow.style.transform = `rotateX(${(approach * 10).toFixed(2)}deg) scale(${(1 - approach * 0.035).toFixed(3)})`;
    }

    if (!motionPaused && marqueeSpanW > 0) {
      const vel = Math.abs(y - lastScrollY);
      marqueeOffset += 0.55 + vel * 0.3;
      const off = ((marqueeOffset % marqueeSpanW) + marqueeSpanW) % marqueeSpanW;
      marqueeTracks.forEach((tr) => {
        const x = tr.classList.contains('reverse') ? -marqueeSpanW + off : -off;
        tr.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      });
    }
    lastScrollY = y;
  }

  function requestScrollFrame() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  window.addEventListener('resize', requestScrollFrame, { passive: true });
  sizeDissectCanvas();
  onScrollFrame();
})();
