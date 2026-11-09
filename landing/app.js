/* ============================================================
   SMAILWOLF M3 Pro — Landing page motion engine (vanilla JS)
   Recreations, in spirit, of React Bits effects:
   SplitText, BlurText, ScrollReveal, TiltedCard, Galaxy (CSS),
   plus a scroll-driven hero video and a horizontal skin shelf.
   Perf rules: one rAF loop, transform/opacity only, passive
   listeners, IntersectionObserver, reduced-motion respected.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  function debounce(fn, ms) { var t = 0; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var vh = function () { return window.innerHeight; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- SplitText: chars, staggered rise ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.innerHTML = '';
    var i = 0;
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          var word = document.createElement('span');
          word.className = 'word';
          part.split('').forEach(function (ch) {
            var c = document.createElement('span');
            c.className = 'char';
            c.style.setProperty('--i', i++);
            c.textContent = ch;
            word.appendChild(c);
          });
          el.appendChild(word);
        });
      } else if (node.nodeType === 1 && node.tagName === 'BR') {
        el.appendChild(document.createElement('br'));
      } else if (node.nodeType === 1) {
        // e.g. <span class="accent"> — split its text too
        var cls = node.className;
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          var word = document.createElement('span');
          word.className = 'word ' + cls;
          part.split('').forEach(function (ch) {
            var c = document.createElement('span');
            c.className = 'char';
            c.style.setProperty('--i', i++);
            c.textContent = ch;
            word.appendChild(c);
          });
          el.appendChild(word);
        });
      }
    });
  });

  /* ---------- BlurText: words, blur -> sharp ---------- */
  document.querySelectorAll('[data-blur]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" style="--i:' + i + '">' + w + '</span>';
    }).join(' ');
  });

  /* ---------- ScrollReveal: words, opacity follows scroll ---------- */
  var srItems = [];
  document.querySelectorAll('[data-sr]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) {
      return '<span class="w">' + w + '</span>';
    }).join(' ');
    srItems.push({ el: el, words: Array.prototype.slice.call(el.querySelectorAll('.w')) });
  });

  /* ---------- reveal on enter (SplitText / BlurText / count-up) ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('[data-split], [data-blur], .kicker, .section-head, .chip-copy, .driver-copy, .download-copy').forEach(function (el) { io.observe(el); });
  // clip-path wipe reveal: observe the SECTIONS, never the media themselves.
  // An element hidden by its own clip-path reports intersectionRatio 0, so an
  // IO on the media can never fire (deadlock: hidden -> ratio 0 -> stays hidden).
  // The section is never clipped, so its IO fires and opens the media's clip.
  var clipIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var media = entry.target.querySelector('.chip-media, .driver-shot');
      if (media) media.classList.add('in');
      clipIO.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  [document.querySelector('.chip'), document.querySelector('.driver')].forEach(function (el) { if (el) clipIO.observe(el); });

  /* ---------- count-up numbers ---------- */
  var counted = new WeakSet();
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || counted.has(entry.target)) return;
      counted.add(entry.target);
      var el = entry.target;
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduced) { el.textContent = target.toLocaleString('en-US'); return; }
      var t0 = null;
      var dur = 1300;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var p = clamp((t - t0) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { countIO.observe(el); });

  /* ---------- hero scrub: 121 frames (24fps) drawn on <canvas> ----------
     WHY canvas, not <img src> swaps: swapping src drops the old frame
     instantly and the new one shows only when decoded — on a weak GPU the
     decode lags behind the scroll, so the hero flashes blank every step
     (that is the "chớp nháy"). drawImage() draws from an already-decoded
     Image object synchronously, so there is never a blank frame.
     The video runs REVERSED: p=0 shows the assembled mouse (f121),
     scrolling down explodes it part by part, morph-style, until p=1
     (f001, fully exploded). */
  var FRAMES = 121;
  var frameImgs = [];
  var frameLoaded = 0;
  var hero = document.querySelector('.hero');
  var heroCanvas = document.getElementById('heroCanvas');
  var heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
  var heroCopy = document.querySelector('.hero-copy');
  var heroCta = document.querySelector('.hero-cta');
  var scrollCue = document.querySelector('.scroll-cue');
  // Morph travel: how far the hero title must glide to land exactly on the
  // skins heading's spot (PowerPoint-Morph style). Measured live so it
  // survives fonts, zoom and viewport changes.
  var morphDX = 0, morphDY = 0;
  function measureMorph() {
    if (!heroCopy) return;
    var savedT = heroCopy.style.transform;
    var savedO = heroCopy.style.opacity;
    heroCopy.style.transform = '';
    heroCopy.style.opacity = '';
    var cr = heroCopy.getBoundingClientRect();
    heroCopy.style.transform = savedT;
    heroCopy.style.opacity = savedO;
    var head = document.querySelector('.skins .section-head');
    if (!head) return;
    morphDX = window.innerWidth / 2 - (cr.left + cr.width / 2);
    morphDY = head.offsetTop - cr.top; // head's offsetParent is the pinned sticky
  }
  measureMorph();
  window.addEventListener('resize', debounce(measureMorph, 150), { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureMorph);
  var heroLoading = document.getElementById('heroLoading');
  var heroLoadCount = document.getElementById('heroLoadCount');
  var heroScrubFill = document.getElementById('heroScrubFill');
  var currentFrame = FRAMES - 1; // start assembled
  function pad3(n) { return (n < 10 ? '00' : (n < 100 ? '0' : '')) + n; }
  function sizeCanvas() {
    if (!heroCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.round(heroCanvas.clientWidth * dpr);
    var h = Math.round(heroCanvas.clientHeight * dpr);
    if (heroCanvas.width !== w || heroCanvas.height !== h) {
      heroCanvas.width = w; heroCanvas.height = h;
      drawFrame(currentFrame);
    }
  }
  function drawFrame(idx) {
    if (!heroCtx || !heroCanvas || !frameImgs[idx] || !frameImgs[idx].complete) return;
    var cw = heroCanvas.width, ch = heroCanvas.height;
    if (!cw || !ch) return;
    var s = Math.max(cw / 1280, ch / 720); // cover
    var dw = 1280 * s, dh = 720 * s;
    var dx = (cw - dw) * 0.68; // object-position 68% — mouse sits right, text left
    var dy = (ch - dh) / 2;
    heroCtx.clearRect(0, 0, cw, ch);
    heroCtx.drawImage(frameImgs[idx], dx, dy, dw, dh);
  }
  for (var fi = 0; fi < FRAMES; fi++) {
    var im = new Image();
    im.src = 'assets/explode/f' + pad3(fi + 1) + '.webp';
    im.onload = function () {
      frameLoaded++;
      if (heroLoadCount) heroLoadCount.textContent = frameLoaded + '/' + FRAMES;
      if (frameLoaded >= FRAMES) {
        if (heroLoading) heroLoading.classList.add('done');
        sizeCanvas(); // first paint: assembled mouse
      }
      // `this` is the image that just loaded (the loop `var im` would point
      // at the LAST image for every handler — that bug meant only f121 was
      // ever decode-warmed in v4).
      if (this.decode) this.decode().catch(function () {});
    };
    im.onerror = function () {
      frameLoaded++;
      if (heroLoadCount) heroLoadCount.textContent = frameLoaded + '/' + FRAMES;
      if (frameLoaded >= FRAMES && heroLoading) heroLoading.classList.add('done');
    };
    frameImgs.push(im);
  }
  if (reduced && hero) hero.classList.add('reduced');
  window.addEventListener('resize', debounce(sizeCanvas, 150), { passive: true });

  /* ---------- Skins: all 67, real mouse cutouts (names from driver skins.ts) ---------- */
  var SKINS = [
    { id: 'default', name: 'Default', src: 'assets/mouse-hero.webp', thumb: 'assets/mouse-hero.webp' },
    { id: 'A01', name: 'Topographic', src: 'assets/skins/A01.webp', thumb: 'assets/skins/thumbs/A01.webp' },
    { id: 'A02', name: 'Cyber X', src: 'assets/skins/A02.webp', thumb: 'assets/skins/thumbs/A02.webp' },
    { id: 'A03', name: 'Oni Red', src: 'assets/skins/A03.webp', thumb: 'assets/skins/thumbs/A03.webp' },
    { id: 'A04', name: 'LED Honeycomb', src: 'assets/skins/A04.webp', thumb: 'assets/skins/thumbs/A04.webp' },
    { id: 'A05', name: 'Sakura Anime', src: 'assets/skins/A05.webp', thumb: 'assets/skins/thumbs/A05.webp' },
    { id: 'A06', name: 'Graffiti Purple', src: 'assets/skins/A06.webp', thumb: 'assets/skins/thumbs/A06.webp' },
    { id: 'A07', name: 'Z-Core', src: 'assets/skins/A07.webp', thumb: 'assets/skins/thumbs/A07.webp' },
    { id: 'A08', name: 'RGB Wave', src: 'assets/skins/A08.webp', thumb: 'assets/skins/thumbs/A08.webp' },
    { id: 'A09', name: 'LED Cutout', src: 'assets/skins/A09.webp', thumb: 'assets/skins/thumbs/A09.webp' },
    { id: 'A10', name: 'Galaxy Moon', src: 'assets/skins/A10.webp', thumb: 'assets/skins/thumbs/A10.webp' },
    { id: 'B01', name: 'Topography Flow', src: 'assets/skins/B01.webp', thumb: 'assets/skins/thumbs/B01.webp' },
    { id: 'B02', name: 'Cyber Circuit', src: 'assets/skins/B02.webp', thumb: 'assets/skins/thumbs/B02.webp' },
    { id: 'B03', name: 'Dragon Ink', src: 'assets/skins/B03.webp', thumb: 'assets/skins/thumbs/B03.webp' },
    { id: 'B04', name: 'Sakura Aurora', src: 'assets/skins/B04.webp', thumb: 'assets/skins/thumbs/B04.webp' },
    { id: 'B05', name: 'Anime Cyber', src: 'assets/skins/B05.webp', thumb: 'assets/skins/thumbs/B05.webp' },
    { id: 'B06', name: 'RGB Honeycomb', src: 'assets/skins/B06.webp', thumb: 'assets/skins/thumbs/B06.webp' },
    { id: 'B07', name: 'Void Space', src: 'assets/skins/B07.webp', thumb: 'assets/skins/thumbs/B07.webp' },
    { id: 'B08', name: 'Glitch Pixel', src: 'assets/skins/B08.webp', thumb: 'assets/skins/thumbs/B08.webp' },
    { id: 'B09', name: 'Flame Ice', src: 'assets/skins/B09.webp', thumb: 'assets/skins/thumbs/B09.webp' },
    { id: 'B10', name: 'Neon Wave', src: 'assets/skins/B10.webp', thumb: 'assets/skins/thumbs/B10.webp' },
    { id: 'C01', name: 'Topographic (C01)', src: 'assets/skins/C01.webp', thumb: 'assets/skins/thumbs/C01.webp' },
    { id: 'C02', name: 'Hex LED', src: 'assets/skins/C02.webp', thumb: 'assets/skins/thumbs/C02.webp' },
    { id: 'C03', name: 'Samurai', src: 'assets/skins/C03.webp', thumb: 'assets/skins/thumbs/C03.webp' },
    { id: 'C04', name: 'Cyber Core', src: 'assets/skins/C04.webp', thumb: 'assets/skins/thumbs/C04.webp' },
    { id: 'C05', name: 'Esports', src: 'assets/skins/C05.webp', thumb: 'assets/skins/thumbs/C05.webp' },
    { id: 'C06', name: 'Anime Tokyo', src: 'assets/skins/C06.webp', thumb: 'assets/skins/thumbs/C06.webp' },
    { id: 'C07', name: 'Holographic', src: 'assets/skins/C07.webp', thumb: 'assets/skins/thumbs/C07.webp' },
    { id: 'C08', name: 'Mecha X-01', src: 'assets/skins/C08.webp', thumb: 'assets/skins/thumbs/C08.webp' },
    { id: 'C09', name: 'Koi Wave', src: 'assets/skins/C09.webp', thumb: 'assets/skins/thumbs/C09.webp' },
    { id: 'C10', name: 'Galaxy LED', src: 'assets/skins/C10.webp', thumb: 'assets/skins/thumbs/C10.webp' },
    { id: 'D01', name: 'Topographic (D01)', src: 'assets/skins/D01.webp', thumb: 'assets/skins/thumbs/D01.webp' },
    { id: 'D02', name: 'Cyber Mecha', src: 'assets/skins/D02.webp', thumb: 'assets/skins/thumbs/D02.webp' },
    { id: 'D03', name: 'Dragon Ink (D03)', src: 'assets/skins/D03.webp', thumb: 'assets/skins/thumbs/D03.webp' },
    { id: 'D04', name: 'LED Honeycomb (D04)', src: 'assets/skins/D04.webp', thumb: 'assets/skins/thumbs/D04.webp' },
    { id: 'D05', name: 'Circuit Neon', src: 'assets/skins/D05.webp', thumb: 'assets/skins/thumbs/D05.webp' },
    { id: 'D06', name: 'Anime Eyes', src: 'assets/skins/D06.webp', thumb: 'assets/skins/thumbs/D06.webp' },
    { id: 'D07', name: 'Wave Fuji', src: 'assets/skins/D07.webp', thumb: 'assets/skins/thumbs/D07.webp' },
    { id: 'D08', name: 'Galaxy Orbit', src: 'assets/skins/D08.webp', thumb: 'assets/skins/thumbs/D08.webp' },
    { id: 'D09', name: 'Hex Tech', src: 'assets/skins/D09.webp', thumb: 'assets/skins/thumbs/D09.webp' },
    { id: 'D10', name: 'Flame Aurora', src: 'assets/skins/D10.webp', thumb: 'assets/skins/thumbs/D10.webp' },
    { id: 'E01', name: 'Dragon 01', src: 'assets/skins/E01.webp', thumb: 'assets/skins/thumbs/E01.webp' },
    { id: 'E02', name: 'ZL Wave', src: 'assets/skins/E02.webp', thumb: 'assets/skins/thumbs/E02.webp' },
    { id: 'E03', name: 'Anime Purple', src: 'assets/skins/E03.webp', thumb: 'assets/skins/thumbs/E03.webp' },
    { id: 'E04', name: 'Wave Fuji (E04)', src: 'assets/skins/E04.webp', thumb: 'assets/skins/thumbs/E04.webp' },
    { id: 'E05', name: 'Oni Red (E05)', src: 'assets/skins/E05.webp', thumb: 'assets/skins/thumbs/E05.webp' },
    { id: 'E06', name: 'Honeycomb Pink', src: 'assets/skins/E06.webp', thumb: 'assets/skins/thumbs/E06.webp' },
    { id: 'E07', name: 'ZL Cyan', src: 'assets/skins/E07.webp', thumb: 'assets/skins/thumbs/E07.webp' },
    { id: 'E08', name: 'Sakura Fox', src: 'assets/skins/E08.webp', thumb: 'assets/skins/thumbs/E08.webp' },
    { id: 'E09', name: 'Galaxy Purple', src: 'assets/skins/E09.webp', thumb: 'assets/skins/thumbs/E09.webp' },
    { id: 'E10', name: 'Ember Orange', src: 'assets/skins/E10.webp', thumb: 'assets/skins/thumbs/E10.webp' },
    { id: 'F01', name: 'Topographic Black', src: 'assets/skins/F01.webp', thumb: 'assets/skins/thumbs/F01.webp' },
    { id: 'F02', name: 'Cyber Neon RGB', src: 'assets/skins/F02.webp', thumb: 'assets/skins/thumbs/F02.webp' },
    { id: 'F03', name: 'Sakura Wave', src: 'assets/skins/F03.webp', thumb: 'assets/skins/thumbs/F03.webp' },
    { id: 'F04', name: 'Dragon Ink (F04)', src: 'assets/skins/F04.webp', thumb: 'assets/skins/thumbs/F04.webp' },
    { id: 'F05', name: 'Mecha Armor', src: 'assets/skins/F05.webp', thumb: 'assets/skins/thumbs/F05.webp' },
    { id: 'F06', name: 'Hologram Prism', src: 'assets/skins/F06.webp', thumb: 'assets/skins/thumbs/F06.webp' },
    { id: 'F07', name: 'Carbon Forged', src: 'assets/skins/F07.webp', thumb: 'assets/skins/thumbs/F07.webp' },
    { id: 'F08', name: 'Void Galaxy', src: 'assets/skins/F08.webp', thumb: 'assets/skins/thumbs/F08.webp' },
    { id: 'F09', name: 'Oni Mask', src: 'assets/skins/F09.webp', thumb: 'assets/skins/thumbs/F09.webp' },
    { id: 'F10', name: 'Tech Hex RGB', src: 'assets/skins/F10.webp', thumb: 'assets/skins/thumbs/F10.webp' },
    { id: 's1', name: 'Animatronic Orange', src: 'assets/skins/s1.webp', thumb: 'assets/skins/thumbs/s1.webp' },
    { id: 's2', name: 'Animatronic Blue', src: 'assets/skins/s2.webp', thumb: 'assets/skins/thumbs/s2.webp' },
    { id: 's3', name: 'Animatronic Red', src: 'assets/skins/s3.webp', thumb: 'assets/skins/thumbs/s3.webp' },
    { id: 's4', name: 'Animatronic Mono', src: 'assets/skins/s4.webp', thumb: 'assets/skins/thumbs/s4.webp' },
    { id: 's5', name: 'Galaxy Cat', src: 'assets/skins/s5.webp', thumb: 'assets/skins/thumbs/s5.webp' },
    { id: 's6', name: 'ZNGL Green', src: 'assets/skins/s6.webp', thumb: 'assets/skins/thumbs/s6.webp' },
  ];

  /* ---------- scroll engine: one rAF loop ---------- */
  var skinsSection = document.querySelector('.skins');
  var skinsTrack = document.getElementById('skinsTrack');
  var skinsCounter = document.getElementById('skinsCounter');
  var skinsBarFill = document.getElementById('skinsBarFill');
  var skinsName = document.getElementById('skinsName');
  var progressBar = document.querySelector('.scroll-progress');
  var chipMedia = document.querySelector('.chip-media');
  var driverShot = document.querySelector('.driver-shot');
  var dlMouseImg = document.querySelector('.download-mouse img');
  var dlCard = document.querySelector('.download-card');
  var dlSection = document.querySelector('.download');
  var tiltRect = null; // driver-shot rect, refreshed each scroll frame for the tilt handler
  var auroraIdleT = 0;
  var toTopBtn = document.getElementById('toTop');
  var toTopRing = toTopBtn ? toTopBtn.querySelector('.tt-ring') : null;
  var velTracks = Array.prototype.slice.call(document.querySelectorAll('.velocity-track'));
  var velW = 0, velOff = 0, lastVelY = 0, velSkewT = 0;
  function measureVel() {
    var sp = document.querySelector('.velocity-track span');
    if (sp) velW = sp.offsetWidth;
  }
  function applyVel(skew) {
    if (!velW) return;
    var off = ((velOff % velW) + velW) % velW;
    velTracks.forEach(function (tr) {
      tr.style.transform = 'translate3d(' + (-off).toFixed(1) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
    });
  }
  measureVel();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureVel);
  window.addEventListener('resize', debounce(measureVel, 150), { passive: true });
  if (toTopBtn) toTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
  var ticking = false;

  // magnetic-button + magnet-canvas rect cache. Hoisted to the IIFE top level
  // in v11: onScroll's read phase calls it, so it must NOT live inside the
  // `if (fxFinePointer && !reduced)` block (block-scoped functions are invisible
  // outside their block). magBtns/magRects/magnetRect are hoisted vars.
  function cacheFxRects() {
    if (!magBtns) return; // FX section hasn't run yet (first onScroll frame)
    magRects = magBtns.map(function (btn) {
      var r = btn.getBoundingClientRect();
      return { btn: btn, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
    var mc = document.getElementById('magnetSpecs');
    if (mc) { var mr = mc.getBoundingClientRect(); magnetRect = { left: mr.left, top: mr.top }; }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var H = vh();

      // progress bar
      var max = document.documentElement.scrollHeight - H;
      if (progressBar && max > 0) progressBar.style.transform = 'scaleX(' + (y / max) + ')';
      // back-to-top button + its circular progress ring
      if (toTopBtn) {
        toTopBtn.classList.toggle('show', y > 600);
        if (toTopRing && max > 0) toTopRing.style.strokeDashoffset = (131.95 * (1 - y / max)).toFixed(1);
      }

      // aurora idle pause: freeze the blobs 2s after the last scroll, so the
      // download card's backdrop-filter stops re-blurring every frame while idle.
      if (dlSection) dlSection.classList.remove('aurora-idle');
      clearTimeout(auroraIdleT);
      auroraIdleT = setTimeout(function () { if (dlSection) dlSection.classList.add('aurora-idle'); }, 2000);

      if (reduced) return;

      // READ PHASE (v11 lag fix, skill Priority 3: no layout thrashing):
      // every layout read for this frame happens here, BEFORE any style write,
      // so no read waits on a style recalc caused by an earlier write.
      var heroR = hero ? hero.getBoundingClientRect() : null;
      var skinsR = skinsSection ? skinsSection.getBoundingClientRect() : null;
      var srRects = srItems.map(function (item) { return item.el.getBoundingClientRect(); });
      var chipR = chipMedia ? chipMedia.getBoundingClientRect() : null;
      var driverR = driverShot ? driverShot.getBoundingClientRect() : null;
      var dlCardR = dlCard ? dlCard.getBoundingClientRect() : null;
      var dlMouseR = dlMouseImg ? dlMouseImg.getBoundingClientRect() : null;
      tiltRect = driverR; // the tilt handler reuses this, no layout read per mousemove
      cacheFxRects(); // magnetic-button + magnet-canvas rects (was a 2nd scroll rAF)

      // hero video scrub (REVERSED): p=0 assembled mouse, scrolling down
      // explodes it part by part, morph-style, until p=1 fully exploded.
      if (hero && heroCanvas && heroR) {
        var r = heroR;
        var p = clamp(-r.top / (r.height - H), 0, 1);
        var idx = (FRAMES - 1) - Math.round(p * (FRAMES - 1));
        if (idx !== currentFrame) {
          currentFrame = idx;
          drawFrame(idx);
        }
        if (heroScrubFill) heroScrubFill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
        // Morph (PowerPoint-style): the hero title glides toward the skins
        // heading as you scroll — same font, shrinks and slides to the next
        // heading's spot, then hands over to it as its letters rise.
        if (heroCopy) {
          heroCopy.style.transform = 'translate(' + (morphDX * p).toFixed(1) + 'px, ' + (morphDY * p).toFixed(1) + 'px) scale(' + (1 - p * 0.4).toFixed(3) + ')';
          heroCopy.style.opacity = Math.max(0, 1 - p * 1.1).toFixed(2);
        }
        // the buttons are not part of the next heading — they leave early
        if (heroCta) heroCta.style.opacity = Math.max(0, 1 - p * 2.5).toFixed(2);
        if (scrollCue) scrollCue.style.opacity = p < 0.12 ? '1' : '0';
        if (heroCanvas) heroCanvas.style.transform = 'scale(' + (1 + p * 0.05).toFixed(3) + ')';
      }

      // skins: vertical scroll pulls the shelf horizontally through all 67 mice
      if (skinsSection && skinsTrack && skinsR) {
        var sr2 = skinsR;
        var sp = clamp(-sr2.top / (sr2.height - H), 0, 1);
        var maxX = Math.max(0, skinsTrack.scrollWidth - window.innerWidth);
        var trackX = -sp * maxX;
        skinsTrack.style.transform = 'translate3d(' + trackX.toFixed(1) + 'px, 0, 0)';
        if (skinsBarFill) skinsBarFill.style.transform = 'scaleX(' + sp.toFixed(3) + ')';
        var si = Math.min(SKINS.length - 1, Math.floor(sp * SKINS.length));
        if (skinsCounter) skinsCounter.textContent = String(si + 1).padStart(2, '0') + ' / ' + SKINS.length;
        if (skinsName) skinsName.textContent = SKINS[si].name;
        // depth-of-field blur: bucket per item by distance from viewport centre.
        // Classes change ONLY when an item crosses a threshold, so during
        // continuous scroll the compositor just moves cached layers — the
        // blur itself is never recomputed per frame (that is what lags).
        if (!reduced && skinItems.length) {
          var cx = window.innerWidth / 2;
          var vw = window.innerWidth;
          for (var bi = 0; bi < skinItems.length; bi++) {
            var it = skinItems[bi];
            var midX = trackX + skinOffsets[bi] + skinWidths[bi] / 2;
            var d = Math.abs(midX - cx) / vw;
            var b = d < 0.35 ? 0 : (d < 0.75 ? 1 : 2);
            if (it._blur !== b) {
              it._blur = b;
              it.classList.toggle('blur-1', b === 1);
              it.classList.toggle('blur-2', b === 2);
            }
            var pop = d < 0.35;
            if (it._pop !== pop) {
              it._pop = pop;
              it.classList.toggle('pop', pop);
            }
          }
        }
      }

      // ScrollReveal: word opacity follows scroll
      srItems.forEach(function (item, si) {
        var r = srRects[si];
        if (r.bottom < 0 || r.top > H) return;
        var p = clamp((H * 0.88 - r.top) / (r.height + H * 0.25), 0, 1);
        if (p === item._lastP) return; // unchanged: skip ~120 setProperty writes
        item._lastP = p;
        var n = item.words.length;
        item.words.forEach(function (w, i) {
          w.style.setProperty('--o', clamp((p * (n + 1) - i) / 1.4, 0.14, 1).toFixed(2));
        });
      });

      // scroll parallax + rotation: media drifts against the scroll and
      // straightens as it passes the viewport centre (transform only).
      // driver-shot is a TiltedCard (tilt owns its transform) — it gets the
      // clip reveal only, never a parallax transform.
      (function () {
        function px(el, r, maxY, baseRot, rotRange) {
          if (!el || !r) return;
          if (r.bottom < -100 || r.top > H + 100) return;
          var q = clamp((H - r.top) / (r.height + H), 0, 1);
          el.style.transform = 'translate3d(0,' + ((0.5 - q) * maxY).toFixed(1) + 'px,0) rotate(' + (baseRot + q * rotRange).toFixed(2) + 'deg)';
        }
        px(chipMedia, chipR, 44, -3, 3);
        px(dlMouseImg, dlMouseR, 30, 0, 0);
        // driver-shot is a TiltedCard: its transform belongs to the tilt loop,
        // so its scroll parallax uses the standalone `translate` property.
        if (driverShot && driverR) {
          var dr2 = driverR;
          if (dr2.bottom >= -100 && dr2.top <= H + 100) {
            var dq = clamp((H - dr2.top) / (dr2.height + H), 0, 1);
            driverShot.style.translate = '0 ' + ((0.5 - dq) * -28).toFixed(1) + 'px';
          }
        }
        // download card drifts with scroll; the mouse grows slightly as it passes
        if (dlCard && dlCardR) {
          var dc = dlCardR;
          if (dc.bottom >= -100 && dc.top <= H + 100) {
            var cq = clamp((H - dc.top) / (dc.height + H), 0, 1);
            dlCard.style.transform = 'translate3d(0,' + ((0.5 - cq) * 18).toFixed(1) + 'px,0)';
          }
        }
        if (dlMouseImg && dlMouseR) {
          var dm = dlMouseR;
          if (dm.bottom >= -100 && dm.top <= H + 100) {
            var mq = clamp((H - dm.top) / (dm.height + H), 0, 1);
            dlMouseImg.style.scale = (0.96 + mq * 0.08).toFixed(3);
          }
        }
      })();

      // ScrollVelocity marquee: offset follows scroll velocity, slight skew.
      // No new loop — driven by this same scroll rAF; stops when scrolling stops.
      if (velTracks.length && velW) {
        var vel = y - lastVelY;
        lastVelY = y;
        velOff += vel * 0.5;
        var skew = Math.max(-6, Math.min(6, vel * 0.12));
        applyVel(skew);
        clearTimeout(velSkewT);
        velSkewT = setTimeout(function () { applyVel(0); }, 150);
      } else {
        lastVelY = y;
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- TiltedCard: pointer tilt, lerped ---------- */
  var tilts = [];
  if (finePointer && !reduced) {
    var tiltRunning = false;
    function tiltLoop() {
      tiltRunning = true;
      var any = false;
      tilts.forEach(function (t) {
        t.rx += (t.tx - t.rx) * 0.14;
        t.ry += (t.ty - t.ry) * 0.14;
        if (Math.abs(t.rx) > 0.02 || Math.abs(t.ry) > 0.02 || t.active) {
          any = true;
          t.el.style.transform = 'rotateX(' + t.rx.toFixed(2) + 'deg) rotateY(' + t.ry.toFixed(2) + 'deg)';
        }
      });
      if (any || tilts.some(function (t) { return t.active; })) requestAnimationFrame(tiltLoop);
      else tiltRunning = false; // settled: stop. No 400ms polling timer — a
      // pointermove wakes the loop again (see the handlers below).
    }
    function wakeTilt() {
      if (!tiltRunning) { tiltRunning = true; requestAnimationFrame(tiltLoop); }
    }
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var t = { el: el, rx: 0, ry: 0, tx: 0, ty: 0, active: false };
      el.addEventListener('pointermove', function (e) {
        var r = tiltRect || el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        t.ty = px * 10;
        t.tx = -py * 8;
        t.active = true;
        wakeTilt();
      });
      el.addEventListener('pointerleave', function () { t.tx = 0; t.ty = 0; t.active = false; wakeTilt(); });
      tilts.push(t);
    });
    tiltLoop();
  }

  /* ---------- Skins track: build all 67 cutouts, click to zoom ---------- */
  var track = document.getElementById('skinsTrack');
  var skinItems = [];
  var skinOffsets = [];
  var skinWidths = [];
  function cacheSkinGeometry() {
    skinItems = Array.prototype.slice.call(track.querySelectorAll('.skin-item'));
    skinOffsets = skinItems.map(function (el) { return el.offsetLeft; });
    skinWidths = skinItems.map(function (el) { return el.offsetWidth; });
  }
  // fitSkins: size the mice from LIVE measurements, never from estimates.
  // v3-v5 guessed the head height and got it wrong on Ethan's machine
  // (fonts render taller there) — the mice heads kept getting cut.
  // Every input here is measured off the real layout, so it adapts to any
  // font rendering, zoom level or viewport height.
  function fitSkins() {
    if (!track || !skinsSection) return;
    var sticky = document.querySelector('.skins-sticky');
    var head = document.querySelector('.skins .section-head');
    var prog = document.querySelector('.skins-progress');
    var fig = track.querySelector('figcaption');
    if (!sticky || !head || !prog || !fig) return;
    var cs = function (el, prop) { return parseFloat(window.getComputedStyle(el)[prop]) || 0; };
    var fixed = cs(sticky, 'paddingTop') + cs(sticky, 'paddingBottom')
      + head.offsetHeight + cs(head, 'marginBottom')
      + prog.offsetHeight + cs(prog, 'marginTop') + 8; // 8px safety
    var capH = fig.offsetHeight + cs(fig, 'marginTop');
    // NOTE: measure against the VIEWPORT, not the sticky's own height —
    // the sticky is min-height:100svh so it grows with its content; using
    // its rect height made the math circular (big mice -> tall sticky ->
    // big 'available' -> big mice) and the heads kept getting cut.
    var available = window.innerHeight - fixed;
    var w = Math.floor((available - capH) * 0.566); // mouse aspect 944:1667
    w = Math.max(120, Math.min(260, Math.floor(window.innerWidth * 0.18), w));
    skinsSection.style.setProperty('--skin-w', w + 'px');
    cacheSkinGeometry();
  }
  var detail = document.getElementById('skinDetail');
  var detailImg = document.getElementById('skinDetailImg');
  var detailId = document.getElementById('skinDetailId');
  var detailName = document.getElementById('skinDetailName');
  var closeBtn = document.getElementById('skinClose');
  var lastFocus = null;

  if (track) {
    SKINS.forEach(function (s, i) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'skin-item';
      item.setAttribute('role', 'listitem');
      item.setAttribute('aria-label', 'Skin ' + s.name + ' — click to enlarge');
      item.innerHTML =
        '<img src="' + s.thumb + '" alt="SMAILWOLF M3 Pro mouse with the ' + s.name + '" width="472" height="834" loading="lazy" decoding="async">' +
        '<figcaption><b>' + s.name + '</b><span>' + s.id.toUpperCase() + ' · IN APP</span></figcaption>';
      item.addEventListener('click', function () { openDetail(i); });
      track.appendChild(item);
    });
    cacheSkinGeometry();
    fitSkins();
    window.addEventListener('resize', debounce(function () { cacheSkinGeometry(); fitSkins(); }, 150), { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSkins);

    function openDetail(i) {
      var s = SKINS[i];
      lastFocus = document.activeElement;
      detailImg.src = s.src;
      detailImg.alt = 'The ' + s.name + ' skin for the SMAILWOLF M3 Pro mouse';
      detailId.textContent = s.id === 'default' ? 'DEFAULT' : s.id;
      detailName.textContent = s.name;
      detail.hidden = false;
      void detail.offsetWidth; // reflow so the clip-path transition runs
      detail.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function closeDetail() {
      detail.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { detail.hidden = true; }, 450);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    closeBtn.addEventListener('click', closeDetail);
    detail.addEventListener('click', function (e) { if (e.target === detail) closeDetail(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !detail.hidden) closeDetail(); });
  }
  /* ================= FX PACK v8 — react-bits / threeui / galaxy, vanilla =================
     All rAF work is transform/opacity or canvas, paused offscreen, skipped under
     reduced motion. Nothing here touches the hero video or the morph. */
  var fxFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var galaxies = [];
  var glow = document.getElementById('cursorGlow');
  var glowX = -999, glowY = -999, glowTX = -999, glowTY = -999, glowShown = false;
  var sparksCanvas = document.getElementById('clickSparks');
  var sparksCtx = sparksCanvas ? sparksCanvas.getContext('2d') : null;
  var sparks = [];
  var trail = []; // PixelTrail squares: fading footprints behind the cursor
  var fxRunning = false, fxRaf = 0, fxFrame = 0;
  function fxStart() {
    if (fxRunning || reduced || document.hidden) return;
    fxRunning = true;
    fxRaf = requestAnimationFrame(fxTick);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (fxRunning) cancelAnimationFrame(fxRaf);
      fxRunning = false;
    } else {
      fxStart(); // resumes only if something is actually busy (fxTick self-stops)
    }
  });
  function fxTick(now) {
    var busy = false;
    fxFrame++;
    galaxies.forEach(function (g) {
      if (!g.visible || !g.ctx) return;
      busy = true;
      if (fxFrame % 4 !== 0) return; // twinkle at ~15fps: same look, 1/4 the canvas work
      var ctx = g.ctx;
      ctx.clearRect(0, 0, g.w, g.h);
      g.stars.forEach(function (s) {
        var tw = 0.35 + 0.65 * Math.abs(Math.sin(now / s.period + s.phase));
        ctx.globalAlpha = tw * s.a;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    });
    if (glow && glowShown) {
      glowX += (glowTX - glowX) * 0.14;
      glowY += (glowTY - glowY) * 0.14;
      if (Math.abs(glowTX - glowX) > 0.3 || Math.abs(glowTY - glowY) > 0.3) busy = true;
      glow.style.transform = 'translate3d(' + glowX.toFixed(1) + 'px,' + glowY.toFixed(1) + 'px,0)';
    }
    if (sparksCtx && (sparks.length || trail.length)) {
      busy = true;
      sparksCtx.clearRect(0, 0, sparksCanvas.width, sparksCanvas.height);
      sparks = sparks.filter(function (sp) { return sp.life > 0; });
      trail = trail.filter(function (sq) { return sq.life > 0; });
      trail.forEach(function (sq) {
        sq.life -= 0.045;
        sparksCtx.globalAlpha = Math.max(0, sq.life) * 0.55;
        sparksCtx.fillStyle = sq.color;
        var s = sq.size * (0.5 + sq.life * 0.5);
        sparksCtx.fillRect(sq.x - s / 2, sq.y - s / 2, s, s);
      });
      sparks.forEach(function (sp) {
        sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.12; sp.life -= 0.03;
        sparksCtx.globalAlpha = Math.max(0, sp.life);
        sparksCtx.strokeStyle = sp.color;
        sparksCtx.lineWidth = 2;
        sparksCtx.beginPath();
        sparksCtx.moveTo(sp.x, sp.y);
        sparksCtx.lineTo(sp.x - sp.vx * 3, sp.y - sp.vy * 3);
        sparksCtx.stroke();
      });
      sparksCtx.globalAlpha = 1;
      if (!sparks.length && !trail.length) sparksCtx.clearRect(0, 0, sparksCanvas.width, sparksCanvas.height);
    }
    // MagnetLines: redraw only while the pointer moved or lines are settling
    if (magnet && magnet.visible && magnet.dirty && magnet.ctx) {
      var mctx = magnet.ctx;
      mctx.clearRect(0, 0, magnet.w, magnet.h);
      mctx.strokeStyle = 'rgba(233,231,226,.28)';
      mctx.lineWidth = 1.5;
      mctx.lineCap = 'round';
      var still = false;
      magnet.pts.forEach(function (pt) {
        var dx = magnet.mx - pt.x, dy = magnet.my - pt.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        var target = d < 200 ? Math.atan2(dy, dx) : 0;
        var diff = target - pt.a;
        while (diff > Math.PI / 2) diff -= Math.PI;
        while (diff < -Math.PI / 2) diff += Math.PI;
        if (Math.abs(diff) > 0.02) still = true;
        pt.a += diff * 0.25;
        var len = 8, c = Math.cos(pt.a), si = Math.sin(pt.a);
        mctx.beginPath();
        mctx.moveTo(pt.x - c * len, pt.y - si * len);
        mctx.lineTo(pt.x + c * len, pt.y + si * len);
        mctx.stroke();
      });
      magnet.dirty = still;
      busy = true;
    }
    if (busy) { fxRaf = requestAnimationFrame(fxTick); }
    else { fxRunning = false; }
  }
  function makeGalaxy(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var g = { canvas: canvas, ctx: ctx, stars: [], w: 0, h: 0, visible: false };
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var r = canvas.getBoundingClientRect();
      g.w = r.width; g.h = r.height;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.stars = [];
      var n = Math.max(40, Math.min(70, Math.round((r.width * r.height) / 9000)));
      for (var i = 0; i < n; i++) {
        g.stars.push({ x: Math.random() * r.width, y: Math.random() * r.height, r: 0.5 + Math.random() * 1.3, a: 0.35 + Math.random() * 0.65, period: 900 + Math.random() * 2400, phase: Math.random() * 6.2832 });
      }
      if (reduced) {
        ctx.clearRect(0, 0, g.w, g.h);
        g.stars.forEach(function (s) { ctx.globalAlpha = s.a; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); });
        ctx.globalAlpha = 1;
      }
    }
    size();
    window.addEventListener('resize', debounce(size, 150), { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        g.visible = entries[0].isIntersecting;
        if (g.visible) { size(); fxStart(); }
      }, { threshold: 0 }).observe(canvas);
    } else { g.visible = true; }
    galaxies.push(g);
  }
  makeGalaxy(document.getElementById('galaxyDownload'));
  makeGalaxy(document.getElementById('galaxyFooter'));

  // ---- CircularText (react-bits): badge chars on a ring, radius measured live ----
  var badgeSpan = document.querySelector('.circ-badge span');
  var badgeText = badgeSpan ? badgeSpan.textContent : '';
  function buildBadge() {
    if (!badgeSpan) return;
    var badge = badgeSpan.parentElement;
    var R = badge.offsetWidth / 2;
    badgeSpan.textContent = '';
    for (var i = 0; i < badgeText.length; i++) {
      var ch = document.createElement('i');
      ch.className = 'cb-char';
      ch.textContent = badgeText[i] === ' ' ? '\u00A0' : badgeText[i];
      ch.style.transform = 'rotate(' + (i * (360 / badgeText.length)).toFixed(1) + 'deg) translateY(' + (-R).toFixed(0) + 'px)';
      badgeSpan.appendChild(ch);
    }
  }
  buildBadge();
  window.addEventListener('resize', debounce(buildBadge, 150), { passive: true });

  // ---- DecryptedText (react-bits): the footer line scrambles in, then resolves ----
  (function () {
    var el = document.querySelector('.footer-copy');
    if (!el || reduced) return;
    var finalText = el.textContent;
    var pool = '!<>-_\\/[]{}=+*^?#01';
    // wall-clock reveal (~85 chars/s) on a plain interval: each tick reveals
    // by elapsed real time, so it finishes in ~1.3s whether frames or timers
    // run fast or throttled (headless rAF timestamps freeze; this does not).
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      var t0 = performance.now();
      var iv = setInterval(function () {
        var revealed = Math.floor((performance.now() - t0) / 12);
        var out = '';
        for (var i = 0; i < finalText.length; i++) {
          out += i < revealed ? finalText[i] : pool[(Math.random() * pool.length) | 0];
        }
        el.textContent = out;
        if (revealed >= finalText.length) { clearInterval(iv); el.textContent = finalText; }
      }, 30);
    }, { threshold: 0.4 });
    io.observe(el);
  })();

  // ---- ClickSpark (react-bits): a burst of sparks on every click ----
  if (sparksCanvas && sparksCtx && !reduced) {
    (function sizeSparks() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      sparksCanvas.width = Math.round(window.innerWidth * dpr);
      sparksCanvas.height = Math.round(window.innerHeight * dpr);
      sparksCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    })();
    window.addEventListener('resize', debounce(function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      sparksCanvas.width = Math.round(window.innerWidth * dpr);
      sparksCanvas.height = Math.round(window.innerHeight * dpr);
      sparksCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }, 150), { passive: true });
    document.addEventListener('pointerdown', function (e) {
      for (var i = 0; i < 8; i++) {
        var a = Math.random() * 6.2832, sp = 3 + Math.random() * 5;
        sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1, color: i % 2 ? '#EA580C' : '#ffffff' });
      }
      fxStart();
    });
  }

  // ---- Cursor glow blob + magnetic buttons (fine pointers only) ----
  if (fxFinePointer && !reduced) {
    document.addEventListener('pointermove', function (e) {
      glowTX = e.clientX; glowTY = e.clientY;
      if (!glowShown) {
        glowShown = true; glowX = glowTX; glowY = glowTY;
        if (glow) glow.style.opacity = '1';
      }
      fxStart();
    }, { passive: true });
    // rects cached on scroll/resize — the old code read getBoundingClientRect
    // for 5 buttons on EVERY mousemove (layout thrash on weak machines).
    var magBtns = Array.prototype.slice.call(document.querySelectorAll('.magnetic'));
    var magRects = [];
    var magnetRect = null;
    cacheFxRects();
    window.addEventListener('resize', debounce(cacheFxRects, 150), { passive: true });
    // (the scroll listener that called cacheFxRects was removed in v11 — onScroll
    // now calls it in its read phase, so there is only one scroll rAF.)
    // spotlight: a radial glow follows the cursor inside the hovered spec card
    var specsSec = document.querySelector('.specs');
    if (specsSec) specsSec.addEventListener('pointermove', function (e) {
      var card = e.target.closest ? e.target.closest('.spec-card') : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    document.addEventListener('pointermove', function (e) {
      magRects.forEach(function (m) {
        var dx = e.clientX - m.cx, dy = e.clientY - m.cy;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 90 && d > 0.1) {
          var pull = Math.min(10, d * 0.12);
          m.btn.style.transform = 'translate(' + (dx / d * pull).toFixed(1) + 'px,' + (dy / d * pull).toFixed(1) + 'px)';
        } else if (m.btn.style.transform) {
          m.btn.style.transform = '';
        }
      });
    }, { passive: true });
  }

  // ---- AnimatedList stagger for the driver feature list ----
  (function () {
    var list = document.querySelector('.driver-list');
    if (!list || reduced) return;
    list.classList.add('js-stagger');
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      Array.prototype.forEach.call(list.children, function (li, i) {
        li.style.transitionDelay = (i * 90) + 'ms';
        li.classList.add('in');
      });
    }, { threshold: 0.2 });
    io.observe(list);
  })();


  /* ================= FX PACK v9 — more scroll effects + more elements ================= */
  // ---- RotatingText (react-bits): verified facts rotate under the chip lede ----
  (function () {
    var el = document.getElementById('rotWord');
    if (!el || reduced) return;
    var words = ['DPI 800–12000', 'Polling 125–1000 Hz', 'Battery estimate', 'Key remapping', '67 skins'];
    var i = 0, visible = false;
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(el);
    setInterval(function () {
      if (!visible) return;
      el.classList.add('swap');
      setTimeout(function () {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove('swap');
      }, 300);
    }, 2400);
  })();

  // ---- MagnetLines (react-bits): a grid of lines in the specs section that bend
  // toward the cursor. Redraws ONLY when the pointer moved (dirty flag) and the
  // section is visible — otherwise the canvas sits still and costs nothing.
  var magnet = null;
  (function () {
    var canvas = document.getElementById('magnetSpecs');
    if (!canvas || reduced || !fxFinePointer) return;
    var ctx = canvas.getContext('2d');
    magnet = { canvas: canvas, ctx: ctx, pts: [], w: 0, h: 0, visible: false, dirty: true, mx: -9999, my: -9999 };
    function sizeMagnet() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var r = canvas.getBoundingClientRect();
      magnet.w = r.width; magnet.h = r.height;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      magnet.pts = [];
      var gap = 30;
      for (var y = gap / 2; y < r.height; y += gap) {
        for (var x = gap / 2; x < r.width; x += gap) {
          magnet.pts.push({ x: x, y: y, a: 0 });
        }
      }
      magnet.dirty = true;
      fxStart();
    }
    sizeMagnet();
    window.addEventListener('resize', debounce(sizeMagnet, 150), { passive: true });
    new IntersectionObserver(function (entries) {
      magnet.visible = entries[0].isIntersecting;
      if (magnet.visible) { sizeMagnet(); magnet.dirty = true; fxStart(); }
    }, { threshold: 0 }).observe(canvas);
    document.addEventListener('pointermove', function (e) {
      if (!magnet.visible || !magnetRect) return;
      magnet.mx = e.clientX - magnetRect.left;
      magnet.my = e.clientY - magnetRect.top;
      magnet.dirty = true;
      fxStart();
    }, { passive: true });
  })();

  // ---- ImageTrail (react-bits): skin thumbnails trail the cursor over the shelf ----
  (function () {
    var wrap = document.getElementById('imgTrail');
    if (!wrap || reduced || !fxFinePointer || !SKINS.length) return;
    var pool = [], next = 0, lastSpawn = 0, n = 0;
    for (var i = 0; i < 10; i++) {
      var im = document.createElement('img');
      im.alt = '';
      wrap.appendChild(im);
      pool.push(im);
    }
    document.addEventListener('pointermove', function (e) {
      if (!e.target || !e.target.closest || !e.target.closest('.skins')) return;
      var now = performance.now();
      if (now - lastSpawn < 50) return;
      lastSpawn = now;
      var skin = SKINS[n % SKINS.length];
      n++;
      var el = pool[next % pool.length];
      next++;
      el.src = skin.thumb;
      el.style.left = (e.clientX - 38) + 'px';
      el.style.top = (e.clientY - 67) + 'px';
      el.animate([
        { opacity: 1, transform: 'translate(0,0) rotate(' + ((Math.random() * 24 - 12).toFixed(0)) + 'deg) scale(1)' },
        { opacity: 0, transform: 'translate(0,26px) rotate(' + ((Math.random() * 30 - 15).toFixed(0)) + 'deg) scale(.72)' }
      ], { duration: 650, easing: 'ease-out' });
    }, { passive: true });
  })();

  // ---- PixelTrail pusher: a few fading squares behind the cursor (drawn in fxTick) ----
  if (fxFinePointer && !reduced) {
    (function () {
      var lastX = -9999, lastY = -9999, lastT = 0;
      document.addEventListener('pointermove', function (e) {
        var now = performance.now();
        var d = Math.sqrt((e.clientX - lastX) * (e.clientX - lastX) + (e.clientY - lastY) * (e.clientY - lastY));
        if (d < 18 && now - lastT < 24) return;
        lastX = e.clientX; lastY = e.clientY; lastT = now;
        trail.push({ x: e.clientX, y: e.clientY, life: 1, size: 8 + Math.random() * 10, color: Math.random() < 0.7 ? '#EA580C' : '#ffffff' });
        if (trail.length > 40) trail.splice(0, trail.length - 40);
        fxStart();
      }, { passive: true });
    })();
  }

  // ---- lag fix: pause CSS animations while their section is offscreen ----
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('fx-off', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    ['.hero', '.download', '.ribbon'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) io2.observe(el);
    });
  })();


  /* ================= FX PACK v10 — spec/chip-facts stagger ================= */
  (function () {
    var els = document.querySelectorAll('.spec-card, .chip-facts > div');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('in'); });
      return;
    }
    var stagIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        stagIO.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    // stagger restarts per group (chip-facts first in the document, then specs)
    var ci = 0, si = 0;
    Array.prototype.forEach.call(els, function (el) {
      if (el.parentElement && el.parentElement.classList.contains('chip-facts')) {
        el.style.transitionDelay = (ci * 70) + 'ms';
        ci++;
      } else {
        el.style.transitionDelay = (si * 70) + 'ms';
        si++;
      }
      stagIO.observe(el);
    });
  })();

})();
