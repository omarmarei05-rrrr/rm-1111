(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const C = window.CONTENT;
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduce = mqReduce.matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const body = document.body;

  /* =========================================================
     Night sky (canvas): twinkling stars + rare shooting stars
     ========================================================= */
  const Sky = (() => {
    const c = $("#sky"), g = c.getContext("2d");
    let w = 0, h = 0, dpr = 1, raf = 0, running = false, shoot = null, nextShoot = 0;
    const PALETTE = ["255,246,226", "255,246,226", "255,246,226", "246,220,170", "235,167,176"];
    let stars = [];

    function build() {
      const n = Math.min(300, Math.max(110, Math.round((w * h) / 3000)));
      stars = Array.from({ length: n }, () => ({
        x: Math.random(), y: Math.random() * 1.4,
        r: Math.random() < 0.9 ? rand(0.3, 1.1) : rand(1.2, 2),
        tw: rand(0, Math.PI * 2), sp: rand(0.4, 1.8),
        depth: rand(0.15, 1), col: PALETTE[(Math.random() * PALETTE.length) | 0]
      }));
    }
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = innerWidth; h = innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!stars.length) build();
      if (!running) draw(performance.now());
    }
    function draw(t) {
      g.clearRect(0, 0, w, h);
      const sc = window.scrollY || 0, H = h * 1.4;
      for (const s of stars) {
        let y = (s.y * h - sc * 0.05 * s.depth) % H; if (y < 0) y += H;
        if (y > h + 4) continue;
        const x = s.x * w;
        const a = reduce ? 0.75 : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.sp + s.tw));
        g.fillStyle = `rgba(${s.col},${a.toFixed(3)})`;
        if (s.r < 1.1) { g.fillRect(x, y, s.r * 1.3, s.r * 1.3); }
        else {
          g.beginPath(); g.arc(x, y, s.r, 0, 6.283); g.fill();
          g.fillStyle = `rgba(${s.col},${(a * 0.07).toFixed(3)})`;
          g.beginPath(); g.arc(x, y, s.r * 2.6, 0, 6.283); g.fill();
        }
      }
      if (reduce) return;
      if (!shoot && t > nextShoot) {
        shoot = { x: rand(w * 0.1, w * 0.9), y: rand(0, h * 0.35), a: rand(0.35, 0.7) * (Math.random() < 0.5 ? 1 : -1) + Math.PI / 2 * 0, t0: t, dur: rand(700, 1100), len: rand(90, 170), dir: Math.random() < 0.5 ? 1 : -1 };
        nextShoot = t + rand(6000, 13000);
      }
      if (shoot) {
        const k = (t - shoot.t0) / shoot.dur;
        if (k >= 1) shoot = null;
        else {
          const dist = k * Math.min(w, 700) * 0.9;
          const ang = 0.5 * shoot.dir;
          const hx = shoot.x + Math.cos(ang) * dist * shoot.dir, hy = shoot.y + Math.abs(Math.sin(ang)) * dist + dist * 0.25;
          const tx = hx - Math.cos(ang) * shoot.len * shoot.dir, ty = hy - (Math.abs(Math.sin(ang)) + 0.25) * shoot.len;
          const alpha = Math.sin(k * Math.PI);
          const grad = g.createLinearGradient(hx, hy, tx, ty);
          grad.addColorStop(0, `rgba(255,240,210,${alpha})`); grad.addColorStop(1, "rgba(255,240,210,0)");
          g.strokeStyle = grad; g.lineWidth = 1.4; g.lineCap = "round";
          g.beginPath(); g.moveTo(hx, hy); g.lineTo(tx, ty); g.stroke();
        }
      }
    }
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    function start() { if (running || reduce) { draw(performance.now()); return; } running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    addEventListener("resize", resize, { passive: true });
    addEventListener("scroll", () => { if (!running) draw(performance.now()); }, { passive: true });
    resize();
    return { start, stop, resize };
  })();

  /* =========================================================
     FX canvas: sparkles, hearts, lanterns, the wish star
     ========================================================= */
  const FX = (() => {
    const c = $("#fx"), g = c.getContext("2d");
    let w = 0, h = 0, raf = 0, last = 0, running = false;
    const parts = [];
    let spawner = null;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = innerWidth; h = innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener("resize", resize, { passive: true });
    resize();

    function heart(x, y, s) {
      g.beginPath();
      g.moveTo(x, y + s * 0.3);
      g.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
      g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.78, x, y + s);
      g.bezierCurveTo(x, y + s * 0.78, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
      g.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
      g.fill();
    }

    function step(t) {
      const dt = Math.min(50, t - (last || t)); last = t;
      g.clearRect(0, 0, w, h);
      if (spawner) spawner(dt);
      g.globalCompositeOperation = "lighter";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        const k = p.age / p.life;
        if (k >= 1) { parts.splice(i, 1); continue; }
        if (p.type === "spark") {
          p.vy += 0.00035 * dt * p.grav; p.vx *= 0.985; p.vy *= 0.985;
          p.x += p.vx * dt; p.y += p.vy * dt;
          const a = (1 - k) * (k < 0.1 ? k * 10 : 1);
          g.fillStyle = `rgba(${p.col},${a})`;
          g.beginPath(); g.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, 6.283); g.fill();
          g.fillStyle = `rgba(${p.col},${a * 0.15})`;
          g.beginPath(); g.arc(p.x, p.y, p.r * 3.5, 0, 6.283); g.fill();
        } else if (p.type === "heart") {
          p.vy -= 0.00012 * dt; p.vx *= 0.99;
          p.x += p.vx * dt; p.y += p.vy * dt;
          const a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
          g.globalCompositeOperation = "source-over";
          g.fillStyle = `rgba(${p.col},${a * 0.95})`;
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot + Math.sin(p.age * 0.004) * 0.2);
          heart(0, -p.s / 2, p.s * (0.6 + 0.4 * Math.min(1, k * 4)));
          g.restore();
          g.globalCompositeOperation = "lighter";
        } else if (p.type === "lantern") {
          p.y += p.vy * dt;
          const sway = Math.sin(p.age * p.swS + p.ph) * p.swA;
          const x = p.x + sway;
          const fade = Math.min(1, p.age / 1500) * Math.min(1, (p.life - p.age) / 2500);
          const fl = 0.85 + 0.15 * Math.sin(p.age * 0.012 + p.ph);
          const s = p.s;
          const glow = g.createRadialGradient(x, p.y, 0, x, p.y, s * 3.2);
          glow.addColorStop(0, `rgba(255,190,110,${0.35 * fade * fl})`);
          glow.addColorStop(1, "rgba(255,150,80,0)");
          g.fillStyle = glow; g.beginPath(); g.arc(x, p.y, s * 3.2, 0, 6.283); g.fill();
          g.globalCompositeOperation = "source-over";
          const body = g.createLinearGradient(x, p.y - s, x, p.y + s);
          body.addColorStop(0, `rgba(255,214,150,${0.95 * fade})`);
          body.addColorStop(0.65, `rgba(250,160,90,${0.95 * fade})`);
          body.addColorStop(1, `rgba(210,100,70,${0.95 * fade})`);
          g.fillStyle = body;
          g.beginPath();
          g.moveTo(x - s * 0.55, p.y - s * 0.75);
          g.quadraticCurveTo(x, p.y - s * 1.05, x + s * 0.55, p.y - s * 0.75);
          g.lineTo(x + s * 0.45, p.y + s * 0.8);
          g.quadraticCurveTo(x, p.y + s * 0.95, x - s * 0.45, p.y + s * 0.8);
          g.closePath(); g.fill();
          g.fillStyle = `rgba(255,248,220,${0.9 * fade * fl})`;
          g.beginPath(); g.ellipse(x, p.y + s * 0.62, s * 0.16, s * 0.1, 0, 0, 6.283); g.fill();
          g.globalCompositeOperation = "lighter";
        } else if (p.type === "comet") {
          const e = 1 - Math.pow(1 - k, 2);
          const hx = p.x0 + (p.x1 - p.x0) * e, hy = p.y0 + (p.y1 - p.y0) * e;
          const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
          const len = 220 * Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5 + 0.2);
          const tx = hx - Math.cos(ang) * len, ty = hy - Math.sin(ang) * len;
          const a = k > 0.85 ? (1 - k) / 0.15 : 1;
          const gr = g.createLinearGradient(hx, hy, tx, ty);
          gr.addColorStop(0, `rgba(255,244,220,${a})`); gr.addColorStop(0.3, `rgba(246,200,140,${a * 0.5})`); gr.addColorStop(1, "rgba(235,167,176,0)");
          g.strokeStyle = gr; g.lineWidth = 3; g.lineCap = "round";
          g.beginPath(); g.moveTo(hx, hy); g.lineTo(tx, ty); g.stroke();
          const hg = g.createRadialGradient(hx, hy, 0, hx, hy, 16);
          hg.addColorStop(0, `rgba(255,250,235,${a})`); hg.addColorStop(1, "rgba(255,220,160,0)");
          g.fillStyle = hg; g.beginPath(); g.arc(hx, hy, 16, 0, 6.283); g.fill();
          if (Math.random() < 0.7) add({ type: "spark", x: hx, y: hy, vx: rand(-0.03, 0.03), vy: rand(0, 0.06), r: rand(0.8, 1.8), life: rand(500, 1000), col: "255,226,170", grav: 0.4 });
        }
      }
      g.globalCompositeOperation = "source-over";
      if (parts.length || spawner) raf = requestAnimationFrame(step);
      else { running = false; last = 0; g.clearRect(0, 0, w, h); }
    }
    function add(p) { p.age = 0; parts.push(p); if (!running) { running = true; last = 0; raf = requestAnimationFrame(step); } }

    function sparkles(x, y, n = 40, spread = 0.35) {
      if (reduce) n = Math.min(n, 10);
      const cols = ["255,230,180", "246,220,170", "255,246,226", "235,167,176"];
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(0.04, spread);
        add({ type: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.05, r: rand(0.8, 2.2), life: rand(700, 1500), col: cols[i % cols.length], grav: 1 });
      }
    }
    function hearts(x, y, n = 9) {
      if (reduce) n = 3;
      const cols = ["235,167,176", "246,220,170", "200,107,128", "255,214,200"];
      for (let i = 0; i < n; i++) {
        const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
        const sp = rand(0.08, 0.26);
        add({ type: "heart", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: rand(10, 20), rot: rand(-0.4, 0.4), life: rand(1000, 1700), col: cols[i % cols.length] });
      }
    }
    function comet(x0, y0, x1, y1, dur = 1500) { add({ type: "comet", x0, y0, x1, y1, life: dur }); }
    function lanterns(seconds = 10) {
      let elapsed = 0, acc = 0;
      const rate = reduce ? 1400 : 360;
      const launch = () => add({
        type: "lantern", x: rand(w * 0.06, w * 0.94), y: h + 30,
        vy: -rand(0.035, 0.07), s: rand(9, 17) * (w < 500 ? 0.9 : 1.15),
        swA: rand(6, 16), swS: rand(0.0008, 0.0016), ph: rand(0, 6), life: rand(14000, 20000)
      });
      for (let i = 0; i < 4; i++) launch();
      spawner = (dt) => {
        elapsed += dt; acc += dt;
        if (acc > rate) { acc = 0; launch(); }
        if (elapsed > seconds * 1000) spawner = null;
      };
      if (!running) { running = true; last = 0; raf = requestAnimationFrame(step); }
    }
    function pause() { cancelAnimationFrame(raf); running = false; }
    function resume() { if (!running && (parts.length || spawner)) { running = true; last = 0; raf = requestAnimationFrame(step); } }
    function clear() { parts.length = 0; spawner = null; }
    return { sparkles, hearts, comet, lanterns, pause, resume, clear };
  })();

  /* =========================================================
     Music: Web Audio gain for smooth fades (works on iOS)
     ========================================================= */
  const Music = (() => {
    const el = $("#song"), player = $("#player"), btn = $("#muteBtn");
    const TARGET = 0.6;
    let ctx = null, gain = null, set = false, wanted = false, muted = false, pauseT = 0, fadeRaf = 0, compactT = 0;
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    function setup() {
      if (set) return; set = true;
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
      const AC = window.AudioContext || window.webkitAudioContext;
      // On older iOS, Web Audio respects the silent switch, so fall back to plain <audio> there.
      if (AC && (!isIOS || navigator.audioSession)) {
        try {
          ctx = new AC();
          const src = ctx.createMediaElementSource(el);
          gain = ctx.createGain(); gain.gain.value = 0;
          src.connect(gain); gain.connect(ctx.destination);
        } catch (e) { ctx = null; gain = null; }
      }
    }
    function fadeTo(v, dur) {
      if (gain) {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(v, t + dur);
      } else {
        cancelAnimationFrame(fadeRaf);
        const from = el.volume, t0 = performance.now();
        const tick = (now) => {
          const k = Math.min(1, (now - t0) / (dur * 1000));
          try { el.volume = from + (v - from) * k; } catch (e) {}
          if (k < 1) fadeRaf = requestAnimationFrame(tick);
        };
        fadeRaf = requestAnimationFrame(tick);
      }
    }
    function ui(playing) {
      player.classList.toggle("playing", playing);
      player.classList.toggle("muted", muted);
      btn.setAttribute("aria-pressed", String(muted));
      btn.setAttribute("aria-label", muted ? "Play music" : "Mute music");
    }
    function play(fade = 2.6) {
      setup();
      clearTimeout(pauseT);
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      if (!gain) { try { el.volume = el.paused ? 0 : el.volume; } catch (e) {} }
      const p = el.play();
      const ok = () => { fadeTo(TARGET, fade); ui(true); };
      if (p && p.then) p.then(ok).catch(() => ui(false)); else ok();
    }
    function pause(fade = 0.45) {
      fadeTo(0, fade);
      clearTimeout(pauseT);
      pauseT = setTimeout(() => el.pause(), fade * 1000 + 60);
      ui(false);
    }
    function showLabel(ms = 2600) {
      player.classList.remove("compact");
      clearTimeout(compactT);
      compactT = setTimeout(() => player.classList.add("compact"), ms);
    }
    btn.addEventListener("click", () => {
      muted = !muted;
      if (muted) pause(); else { wanted = true; play(1.2); }
      showLabel();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimeout(pauseT);
        if (gain) gain.gain.value = 0;
        el.pause();
        if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
        Sky.stop(); FX.pause();
      } else {
        if (wanted && !muted) play(1.6);
        Sky.start(); FX.resume();
      }
    });
    return {
      start() { wanted = true; player.hidden = false; play(2.8); showLabel(6500); },
      restart() { try { el.currentTime = 0; } catch (e) {} if (wanted && !muted) play(2); },
      preload() { el.preload = "auto"; try { el.load(); } catch (e) {} }
    };
  })();

  /* =========================================================
     0 · Lock
     ========================================================= */
  const lock = $("#lock"), gate = $("#gate"), form = $("#lockForm"), input = $("#lockInput"), hint = $("#lockHint");
  let tries = 0;

  function isMeetDate(raw) {
    let s = String(raw).toLowerCase().trim()
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
    if (!s) return false;
    const words = s.match(/[a-zء-ي]+/g) || [];
    const nums = (s.match(/\d+/g) || []).map(Number);
    const isFeb = (w) => /^feb/.test(w) || w === "فبراير" || w === "فبراىر" || w === "شباط";
    const otherMonth = words.some((w) => /^(jan|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(w) || ["يناير", "مارس", "ابريل", "أبريل", "مايو", "يونيو", "يوليو", "اغسطس", "أغسطس", "سبتمبر", "اكتوبر", "أكتوبر", "نوفمبر", "ديسمبر"].includes(w));
    if (otherMonth) return false;
    const yearOk = (n) => n === 2025 || n === 25;
    if (words.some(isFeb)) {
      if (!nums.includes(15)) return false;
      const rest = nums.slice(); rest.splice(rest.indexOf(15), 1);
      return rest.length <= 1 && rest.every(yearOk);
    }
    if (nums.length === 1) {
      return ["1502", "150225", "15022025", "0215", "021525", "02152025", "20250215"].includes(s.match(/\d+/)[0]);
    }
    if (nums.length === 3 && nums[0] === 2025) return nums[1] === 2 && nums[2] === 15;
    if (nums.length < 2 || nums.length > 3) return false;
    const [a, b, c] = nums;
    return ((a === 15 && b === 2) || (a === 2 && b === 15)) && (c === undefined || yearOk(c));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (isMeetDate(input.value)) return unlock();
    tries++;
    hint.textContent = tries >= 3 ? "the day right after Valentine's 🙂" : "think February, Ramosa 🙂";
    hint.classList.remove("show"); void hint.offsetWidth; hint.classList.add("show");
    form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
    if (navigator.vibrate) { try { navigator.vibrate(60); } catch (err) {} }
  });

  function unlock() {
    form.classList.add("ok");
    input.blur();
    hint.textContent = "there you are 🤍";
    hint.classList.add("show");
    const r = input.getBoundingClientRect();
    FX.sparkles(r.left + r.width / 2, r.top + r.height / 2, 70, 0.42);
    Music.preload();
    setTimeout(() => lock.classList.add("leaving"), 650);
    setTimeout(() => {
      lock.hidden = true;
      body.classList.remove("is-locked");
      body.classList.add("is-gated");
      gate.hidden = false;
      $("#gateBtn").focus({ preventScroll: true });
    }, 1700);
  }

  /* =========================================================
     1 · Gate
     ========================================================= */
  $("#gateBtn").addEventListener("click", (e) => {
    Music.start();
    const r = e.currentTarget.getBoundingClientRect();
    FX.sparkles(r.left + r.width / 2, r.top + r.height / 2, 60, 0.38);
    FX.hearts(r.left + r.width / 2, r.top + r.height / 2, 8);
    gate.classList.add("leaving");
    window.scrollTo(0, 0);
    setTimeout(() => {
      body.classList.remove("is-gated");
      body.classList.add("is-open");
      $("#site").setAttribute("aria-hidden", "false");
      startCounter();
      observeReveals();
    }, 500);
    setTimeout(() => { gate.hidden = true; }, 1500);
  }, { once: true });

  /* =========================================================
     Scroll reveals
     ========================================================= */
  let revealIO = null;
  function observeReveals() {
    if (!revealIO) {
      revealIO = new IntersectionObserver((entries) => {
        for (const en of entries) if (en.isIntersecting) { en.target.classList.add("in"); revealIO.unobserve(en.target); }
      }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    }
    $$(".reveal:not(.in), .mem:not(.in)").forEach((el) => revealIO.observe(el));
  }

  /* =========================================================
     2 · Counter (odometer digits)
     ========================================================= */
  const start = new Date(C.meetDate[0], C.meetDate[1], C.meetDate[2], 0, 0, 0);
  const units = Object.fromEntries($$(".digits").map((d) => [d.dataset.unit, d]));
  function setDigits(el, str) {
    while (el.children.length < str.length) {
      const dg = document.createElement("span"); dg.className = "dg";
      const col = document.createElement("span"); col.className = "dg-col";
      col.innerHTML = "<b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b>";
      dg.appendChild(col); el.prepend(dg);
    }
    while (el.children.length > str.length) el.firstChild.remove();
    Array.from(el.children).forEach((dg, i) => { dg.firstChild.style.transform = `translateY(${-Number(str[i])}em)`; });
  }
  function tick() {
    let diff = Math.max(0, Date.now() - start.getTime());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const hh = Math.floor(diff / 36e5); diff -= hh * 36e5;
    const mm = Math.floor(diff / 6e4); diff -= mm * 6e4;
    const ss = Math.floor(diff / 1e3);
    setDigits(units.d, String(d));
    setDigits(units.h, String(hh).padStart(2, "0"));
    setDigits(units.m, String(mm).padStart(2, "0"));
    setDigits(units.s, String(ss).padStart(2, "0"));
    $("#counter").setAttribute("aria-label", `${d} days, ${hh} hours, ${mm} minutes and ${ss} seconds`);
  }
  let counterOn = false;
  function startCounter() {
    if (counterOn) return; counterOn = true;
    tick();
    setTimeout(function loop() { tick(); setTimeout(loop, 1000 - (Date.now() % 1000) + 5); }, 1000 - (Date.now() % 1000) + 5);
  }

  /* =========================================================
     3 · Timeline + parallax + lightbox
     ========================================================= */
  const TILTS = [-2.6, 2.2, -1.6, 3, -3.2, 1.6, -2, 2.8];
  const tl = $("#timeline");
  const pic = (src, alt, eager) =>
    `<picture><source srcset="assets/photos/${src}.webp" type="image/webp"><img src="assets/photos/${src}.jpg" alt="${alt}" ${eager ? "" : 'loading="lazy"'} decoding="async"></picture>`;

  C.photos.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "mem";
    li.style.setProperty("--tilt", TILTS[i % TILTS.length] + "deg");
    const no = String(i + 1).padStart(2, "0");
    li.innerHTML =
      `<button class="polaroid" type="button" data-i="${i}" aria-label="Open memory ${no}">` +
        `<span class="tape" aria-hidden="true"></span>` +
        `<span class="ph">${pic(p.src, `Reem and Omar, memory ${no}`)}</span>` +
        `<span class="pol-no" aria-hidden="true">no. ${no}</span>` +
      `</button>` +
      `<p class="mem-cap">${p.cap}</p>`;
    tl.appendChild(li);
  });

  // Soft parallax on visible photos only
  const visiblePh = new Set();
  const phIO = new IntersectionObserver((entries) => {
    for (const en of entries) en.isIntersecting ? visiblePh.add(en.target) : visiblePh.delete(en.target);
  }, { rootMargin: "10% 0px" });
  $$(".ph").forEach((el) => phIO.observe(el));
  let parRaf = 0;
  function parallax() {
    parRaf = 0;
    if (reduce) return;
    const vh = innerHeight;
    visiblePh.forEach((ph) => {
      const r = ph.getBoundingClientRect();
      const k = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      ph.firstElementChild.lastElementChild.style.transform = `translate3d(0, ${(k * -6).toFixed(2)}%, 0)`;
    });
  }
  addEventListener("scroll", () => { if (!parRaf) parRaf = requestAnimationFrame(parallax); }, { passive: true });

  // Lightbox
  const lb = $("#lightbox"), track = $("#lbTrack"), lbCap = $("#lbCap"), lbCount = $("#lbCount");
  let lbIndex = 0, lbBuilt = false, lastFocus = null;
  function buildLb() {
    if (lbBuilt) return; lbBuilt = true;
    track.innerHTML = C.photos.map((p, i) => `<div class="lb-slide">${pic(p.src, `Memory ${i + 1}`, false)}</div>`).join("");
  }
  function lbGo(i, animate = true) {
    lbIndex = Math.max(0, Math.min(C.photos.length - 1, i));
    track.classList.toggle("anim", animate);
    track.style.transform = `translate3d(${-lbIndex * 100}%,0,0)`;
    lbCap.textContent = C.photos[lbIndex].cap;
    lbCount.textContent = `${lbIndex + 1} / ${C.photos.length}`;
    // warm up neighbours
    $$(".lb-slide img", track).forEach((img, j) => { if (Math.abs(j - lbIndex) <= 1) img.loading = "eager"; });
  }
  function openLb(i) {
    buildLb(); lastFocus = document.activeElement;
    lb.hidden = false; document.documentElement.classList.add("lb-open");
    lbGo(i, false);
    requestAnimationFrame(() => lb.classList.add("show"));
    $("#lbClose").focus({ preventScroll: true });
  }
  function closeLb() {
    lb.classList.remove("show");
    document.documentElement.classList.remove("lb-open");
    setTimeout(() => { lb.hidden = true; }, 380);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  tl.addEventListener("click", (e) => { const b = e.target.closest(".polaroid"); if (b) openLb(+b.dataset.i); });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", () => lbGo(lbIndex - 1));
  $("#lbNext").addEventListener("click", () => lbGo(lbIndex + 1));
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowRight") lbGo(lbIndex + 1);
    else if (e.key === "ArrowLeft") lbGo(lbIndex - 1);
  });
  (() => {
    let x0 = 0, y0 = 0, dx = 0, dy = 0, t0 = 0, down = false, axis = "";
    lb.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".lb-btn")) return;
      down = true; axis = ""; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; t0 = performance.now();
      track.classList.remove("anim");
    });
    lb.addEventListener("pointermove", (e) => {
      if (!down) return;
      dx = e.clientX - x0; dy = e.clientY - y0;
      if (!axis && Math.hypot(dx, dy) > 8) axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis === "x") {
        const edge = (lbIndex === 0 && dx > 0) || (lbIndex === C.photos.length - 1 && dx < 0) ? 0.35 : 1;
        track.style.transform = `translate3d(calc(${-lbIndex * 100}% + ${dx * edge}px),0,0)`;
      } else if (axis === "y" && dy > 0) {
        track.style.transform = `translate3d(${-lbIndex * 100}%, ${dy * 0.6}px, 0)`;
        lb.style.opacity = String(Math.max(0.35, 1 - dy / 500));
      }
    });
    const end = () => {
      if (!down) return; down = false;
      const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      lb.style.opacity = "";
      if (axis === "x" && (Math.abs(dx) > innerWidth * 0.18 || v > 0.5)) lbGo(lbIndex + (dx < 0 ? 1 : -1));
      else if (axis === "y" && dy > 110) { lbGo(lbIndex); closeLb(); }
      else lbGo(lbIndex);
    };
    lb.addEventListener("pointerup", end);
    lb.addEventListener("pointercancel", end);
  })();

  /* =========================================================
     4 · Reasons deck
     ========================================================= */
  const deck = $("#deck"), deckCount = $("#deckCount"), deckBar = $("#deckBar"), deckAgain = $("#deckAgain");
  const N = C.reasons.length;
  let cur = 0, busy = false;
  const cards = C.reasons.map((r, i) => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `<span class="no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>` +
      (r.ar ? `<p class="ar" lang="ar" dir="rtl">${r.t}</p>` : `<p>${r.t}</p>`) +
      `<span class="heart" aria-hidden="true">♥</span>`;
    return el;
  });
  const last = document.createElement("div");
  last.className = "card done";
  last.innerHTML = `<span class="no" aria-hidden="true">∞</span><p>…and a million more that I'll keep telling you, every single day.</p><span class="heart" aria-hidden="true">♥</span>`;
  cards.push(last);
  cards.slice().reverse().forEach((c) => deck.appendChild(c));

  function layout() {
    cards.forEach((c, i) => {
      if (i < cur) return;
      const pos = i - cur;
      c.dataset.pos = pos <= 2 ? String(pos) : "hide";
      c.setAttribute("aria-hidden", pos === 0 ? "false" : "true");
    });
    const shown = Math.min(cur + 1, N);
    deckCount.textContent = `${shown} / ${N}`;
    deckBar.style.width = `${(shown / N) * 100}%`;
    deckAgain.hidden = cur < N;
    deck.setAttribute("aria-label", cur < N ? `Reason ${shown} of ${N}. Tap for the next one.` : "That was all twelve.");
  }
  function next(dir, x, y) {
    if (busy) return;
    const r = deck.getBoundingClientRect();
    FX.hearts(x ?? r.left + r.width / 2, y ?? r.top + r.height * 0.45, 9);
    if (cur >= N) return;
    busy = true;
    const c = cards[cur];
    c.style.transform = "";
    c.classList.remove("dragging");
    c.classList.add(dir < 0 ? "fly-l" : "fly-r");
    cur++;
    layout();
    setTimeout(() => { busy = false; }, 380);
  }
  function resetDeck() {
    cur = 0;
    cards.forEach((c) => { c.classList.remove("fly-l", "fly-r", "dragging"); c.style.transform = ""; });
    layout();
  }
  layout();
  deckAgain.addEventListener("click", resetDeck);
  deck.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(1); } });
  (() => {
    let x0 = 0, y0 = 0, dx = 0, down = false, moved = false, axis = "";
    deck.addEventListener("pointerdown", (e) => { down = true; moved = false; axis = ""; x0 = e.clientX; y0 = e.clientY; dx = 0; });
    deck.addEventListener("pointermove", (e) => {
      if (!down || cur >= N) return;
      dx = e.clientX - x0; const dy = e.clientY - y0;
      if (!axis && Math.hypot(dx, dy) > 8) { axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"; if (axis === "x") deck.setPointerCapture?.(e.pointerId); }
      if (axis !== "x") return;
      moved = true;
      const c = cards[cur];
      c.classList.add("dragging");
      c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    });
    const end = (e) => {
      if (!down) return; down = false;
      const c = cards[cur];
      if (moved && axis === "x") {
        if (Math.abs(dx) > 70) next(dx < 0 ? -1 : 1, e.clientX, e.clientY);
        else if (c) { c.classList.remove("dragging"); c.style.transform = ""; }
      } else if (axis !== "y" && e.type === "pointerup") {
        next(Math.random() < 0.5 ? -1 : 1, e.clientX, e.clientY);
      }
    };
    deck.addEventListener("pointerup", end);
    deck.addEventListener("pointercancel", end);
  })();

  /* =========================================================
     5 · Wish
     ========================================================= */
  const star = $("#wishStar"), ring = $(".wish-ring circle"), wishMsg = $("#wishMsg"), wishHint = $("#wishHint");
  let wished = false, holdRaf = 0, holdT0 = 0;
  const HOLD = 900, RING = 340;
  function makeWish() {
    if (wished) return; wished = true;
    cancelAnimationFrame(holdRaf);
    ring.style.strokeDashoffset = "0";
    star.classList.remove("holding"); star.classList.add("made");
    star.setAttribute("aria-label", "Wish made");
    wishHint.style.opacity = "0";
    const r = star.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    FX.sparkles(cx, cy, 80, 0.45);
    if (!reduce) {
      const W = innerWidth, H = innerHeight;
      FX.comet(-60, Math.max(20, cy - H * 0.45), W + 80, Math.min(H - 20, cy + H * 0.12), 1700);
    }
    setTimeout(() => wishMsg.classList.add("show"), reduce ? 100 : 1100);
  }
  function holdLoop(t) {
    const k = Math.min(1, (t - holdT0) / HOLD);
    ring.style.strokeDashoffset = String(RING * (1 - k));
    if (k >= 1) makeWish(); else holdRaf = requestAnimationFrame(holdLoop);
  }
  star.addEventListener("pointerdown", (e) => {
    if (wished) return;
    e.preventDefault();
    star.classList.add("holding");
    holdT0 = performance.now(); holdRaf = requestAnimationFrame(holdLoop);
  });
  const release = () => { if (!wished && holdT0) makeWish(); holdT0 = 0; };
  star.addEventListener("pointerup", release);
  star.addEventListener("pointerleave", () => { if (!wished && holdT0) { cancelAnimationFrame(holdRaf); holdT0 = 0; star.classList.remove("holding"); ring.style.strokeDashoffset = String(RING); } });
  star.addEventListener("click", () => makeWish()); // keyboard / fallback
  star.addEventListener("contextmenu", (e) => e.preventDefault());
  function resetWish() {
    wished = false; holdT0 = 0;
    star.classList.remove("made", "holding");
    star.setAttribute("aria-label", "Hold the star to make a wish");
    ring.style.strokeDashoffset = String(RING);
    wishHint.style.opacity = "";
    wishMsg.classList.remove("show");
  }

  /* =========================================================
     6 · Letter (types itself, layout stays stable)
     ========================================================= */
  const paper = $("#paper"), letterBody = $("#letterBody"), sign = $("#letterSign"), skip = $("#letterSkip");
  let paras = [], typing = false, typed = false, typeT = 0, pi = 0, ci = 0;
  const caret = document.createElement("span"); caret.className = "caret";
  function buildLetter() {
    letterBody.innerHTML = "";
    paras = C.letter.map((txt) => {
      const p = document.createElement("p");
      const a = document.createElement("span"), b = document.createElement("span");
      b.style.color = "transparent"; b.setAttribute("aria-hidden", "true");
      b.textContent = txt; p.append(a, b); letterBody.appendChild(p);
      return { txt, a, b };
    });
    pi = 0; ci = 0; typed = false; typing = false;
    sign.classList.remove("show"); skip.classList.remove("gone");
  }
  function typeStep() {
    const P = paras[pi];
    if (!P) return finishLetter();
    ci++;
    P.a.textContent = P.txt.slice(0, ci);
    P.b.textContent = P.txt.slice(ci);
    P.a.after(caret);
    let d = 17 + Math.random() * 18;
    const ch = P.txt[ci - 1];
    if (ch === "." || ch === ":" ) d += 320; else if (ch === ",") d += 150;
    if (ci >= P.txt.length) { pi++; ci = 0; d += 520; }
    typeT = setTimeout(typeStep, d);
  }
  function startLetter() {
    if (typing || typed) return;
    typing = true;
    if (reduce) return finishLetter();
    typeT = setTimeout(typeStep, 600);
  }
  function finishLetter() {
    clearTimeout(typeT);
    paras.forEach((P) => { P.a.textContent = P.txt; P.b.textContent = ""; });
    caret.remove();
    if (typed) return;
    typed = true; typing = false;
    skip.classList.add("gone");
    setTimeout(() => {
      sign.classList.add("show");
      FX.lanterns(11);
    }, 500);
  }
  buildLetter();
  paper.addEventListener("click", () => { if (typing && !typed) finishLetter(); });
  new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting && body.classList.contains("is-open")) startLetter(); });
  }, { threshold: 0.3 }).observe(paper);
  // Fallback trigger in case the observer is late (older browsers, quick scrolls)
  addEventListener("scroll", () => {
    if (typing || typed || !body.classList.contains("is-open")) return;
    const r = paper.getBoundingClientRect();
    if (r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.3) startLetter();
  }, { passive: true });

  /* =========================================================
     7 · Replay
     ========================================================= */
  $("#replay").addEventListener("click", () => {
    FX.clear();
    resetDeck(); resetWish(); buildLetter();
    $$(".mem").forEach((m) => m.classList.remove("in"));
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    Music.restart();
    setTimeout(observeReveals, 900);
  });

  mqReduce.addEventListener?.("change", (e) => { reduce = e.matches; if (reduce) Sky.stop(); else Sky.start(); });
  Sky.start();
})();
