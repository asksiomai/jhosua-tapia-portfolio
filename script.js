(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- moving starfield (drifts, twinkles, parallax on scroll + mouse, shooting stars) ---------- */
  var canvas = document.getElementById("stars");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var W, H, stars = [], shoot = null, nextShoot = 2500, mx = 0, my = 0, tx = 0, ty = 0;
    var size = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round((W * H) / 9000);
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.35,
          z: Math.random() * 0.9 + 0.16, t: Math.random() * 6.28, s: Math.random() * 0.04 + 0.012,
          hue: Math.random() < 0.2 ? "200,180,255" : (Math.random() < 0.15 ? "255,190,225" : "255,255,255") });
      }
    };
    var last = 0;
    var frame = function (now) {
      var dt = Math.min((now - last) || 16, 50); last = now;
      ctx.clearRect(0, 0, W, H);
      tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
      var sy = window.scrollY || 0;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!reduce) { s.x += 0.018 * s.z * dt; s.y += 0.006 * s.z * dt; s.t += s.s; }
        if (s.x > W + 5) s.x = -5;
        if (s.y > H + 5) s.y = -5;
        var x = s.x + tx * s.z * 28;
        var y = (((s.y - sy * 0.22 * s.z + ty * s.z * 28) % H) + H) % H;
        ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(s.t));
        ctx.fillStyle = "rgb(" + s.hue + ")";
        ctx.beginPath(); ctx.arc(x, y, s.r * (0.6 + s.z * 0.6), 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) {
        nextShoot -= dt;
        if (nextShoot <= 0 && !shoot) {
          shoot = { x: Math.random() * W * 0.8 + W * 0.2, y: Math.random() * H * 0.35, l: 0 };
          nextShoot = 4200 + Math.random() * 5000;
        }
        if (shoot) {
          shoot.x -= 1.1 * dt; shoot.y += 0.55 * dt; shoot.l += dt;
          var g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x + 130, shoot.y - 65);
          g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x + 130, shoot.y - 65); ctx.stroke();
          if (shoot.l > 1100 || shoot.x < -150 || shoot.y > H + 80) shoot = null;
        }
        window.requestAnimationFrame(frame);
      }
    };
    size();
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX / W - 0.5; my = e.clientY / H - 0.5;
    });
    window.requestAnimationFrame(frame);
    if (reduce) { window.addEventListener("scroll", function () { frame(last + 16); }); }
  }

  /* ---------- scroll progress bar ---------- */
  var bar = document.getElementById("progress");
  var onScroll = function () {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (h > 0 ? window.scrollY / h : 0) + ")";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveal + count-up ---------- */
  var countUp = function (el) {
    var to = +el.getAttribute("data-count"), t0 = performance.now(), d = 1400;
    (function step(t) {
      var p = Math.min((t - t0) / d, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) window.requestAnimationFrame(step);
    })(t0);
  };
  var show = function (el) {
    var delay = parseFloat(el.getAttribute("data-delay") || "0");
    el.style.setProperty("--d", delay + "s");
    el.classList.add("in");
    setTimeout(function () { el.classList.add("done"); el.style.removeProperty("--d"); }, 900 + delay * 1000);
    var c = el.querySelectorAll("[data-count]");
    for (var i = 0; i < c.length; i++) {
      if (reduce) c[i].textContent = c[i].getAttribute("data-count"); else countUp(c[i]);
    }
  };
  var items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(show);
  }

  /* ---------- border glow: tells the CSS how close the cursor is to a card edge, and from which angle ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".border-glow-card").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), cx = r.width / 2, cy = r.height / 2;
        var dx = e.clientX - r.left - cx, dy = e.clientY - r.top - cy;
        var prox = Math.min(Math.max(Math.abs(dx) / cx, Math.abs(dy) / cy), 1) * 100;
        var ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        if (ang < 0) ang += 360;
        el.style.setProperty("--edge-proximity", prox.toFixed(2));
        el.style.setProperty("--cursor-angle", ang.toFixed(2) + "deg");
      });
    });
  }

  /* ---------- welcome screen (shown once per session, skippable) ---------- */
  var welcome = document.getElementById("welcome-screen");
  if (welcome) {
    var seen = false;
    try { seen = sessionStorage.getItem("welcomeSeen") === "1"; } catch (e) {}
    var dismiss = function () {
      if (welcome.classList.contains("fade-out")) return;
      welcome.classList.add("fade-out");
      document.body.classList.remove("welcome-active");
      try { sessionStorage.setItem("welcomeSeen", "1"); } catch (e) {}
    };
    if (seen || reduce) {
      welcome.classList.add("fade-out");
    } else {
      document.body.classList.add("welcome-active");
      setTimeout(dismiss, 2500);
      welcome.addEventListener("click", dismiss);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" || e.key === "Enter") dismiss();
      });
    }
  }
})();

/* ---------- glow cursor (vanilla port of the GlowCursor settings) ---------- */
(function () {
  var canvas = document.querySelector(".glow-cursor__canvas");
  if (!canvas) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.style.display = "none"; return;
  }
  var o = { color: [208, 88, 232], second: [61, 0, 242], length: 12, width: 6, follow: 0.5, intensity: 2.7,
            spread: 0.5, brightness: 1.25, pulse: 4, noise: 0.035, idle: 200, fade: 2500 };
  var ctx = canvas.getContext("2d"), W = 0, H = 0, tx = 0, ty = 0, x = 0, y = 0, trail = [], lastMove = 0, raf = 0, seen = false;
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")"; }
  function resize() {
    var d = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * d; canvas.height = H * d;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function draw(now) {
    var idle = now - lastMove, a = idle < o.idle ? 1 : 1 - (idle - o.idle) / o.fade;
    ctx.clearRect(0, 0, W, H);
    if (a <= 0) { raf = 0; return; }
    x += (tx - x) * o.follow; y += (ty - y) * o.follow;
    trail.unshift({ x: x, y: y });
    if (trail.length > o.length) trail.pop();
    var pulse = 1 + 0.12 * Math.sin(now / 1000 * o.pulse * 2), n = o.noise * 40;
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = ctx.lineJoin = "round";
    if (trail.length > 1) {
      var h0 = trail[0], t0 = trail[trail.length - 1], g = ctx.createLinearGradient(h0.x, h0.y, t0.x, t0.y);
      g.addColorStop(0, rgba(o.color, 0.95 * a)); g.addColorStop(1, rgba(o.second, 0));
      ctx.strokeStyle = g;
      [[o.width * 3, 0.25], [o.width, 1]].forEach(function (p) {
        ctx.lineWidth = p[0]; ctx.globalAlpha = p[1]; ctx.beginPath(); ctx.moveTo(h0.x, h0.y);
        for (var i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x + (Math.random() - 0.5) * n, trail[i].y + (Math.random() - 0.5) * n);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    var r = 170 * o.spread * pulse * 1.6, k = a * Math.min(1, o.intensity * o.brightness / 4);
    var gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(255,255,255," + (0.7 * k).toFixed(3) + ")");
    gr.addColorStop(0.2, rgba(o.color, 0.6 * k));
    gr.addColorStop(0.6, rgba(o.second, 0.28 * k));
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    raf = requestAnimationFrame(draw);
  }
  window.addEventListener("pointermove", function (e) {
    tx = e.clientX; ty = e.clientY; lastMove = performance.now();
    if (!seen) { x = tx; y = ty; seen = true; }
    if (!raf) raf = requestAnimationFrame(draw);
  });
  window.addEventListener("resize", resize);
  resize();
})();

/* ---------- draggable ID card on a lanyard (springs back on release) ---------- */
(function () {
  var card = document.getElementById("idCard");
  if (!card) return;
  var stage = card.parentNode, paths = stage.querySelectorAll(".id-lanyard path");
  var x = 0, y = 0, r = 0, vx = 0, vy = 0, drag = null, lx = 0, raf = 0;
  function set(k, v) { card.style.setProperty(k, v); }
  function lace() {
    var s = stage.getBoundingClientRect(), c = card.getBoundingClientRect();
    var ex = c.left + c.width / 2 - s.left, ey = c.top - s.top + 12, w = s.width / 2;
    [-1, 1].forEach(function (d, i) {
      var ax = w + d * 42;
      var p = "M" + ax + " -30 Q " + (ax + (ex - ax) * 0.5 + x * 0.35) + " " + ey * 0.55 + " " + (ex + d * 6) + " " + ey;
      paths[i].setAttribute("d", p); paths[i + 2].setAttribute("d", p);
    });
  }
  function apply() { set("--x", x + "px"); set("--y", y + "px"); set("--r", r + "deg"); lace(); }
  function spring() {
    vx -= x * 0.09; vy -= y * 0.09; vx *= 0.86; vy *= 0.86; x += vx; y += vy;
    r = Math.max(-14, Math.min(14, vx * 0.7));
    if (Math.abs(x) + Math.abs(y) + Math.abs(vx) + Math.abs(vy) < 0.3) {
      x = y = r = vx = vy = 0; apply(); card.classList.remove("springing"); raf = 0; return;
    }
    apply(); raf = requestAnimationFrame(spring);
  }
  function release() { card.classList.add("springing"); if (!raf) raf = requestAnimationFrame(spring); }
  card.addEventListener("pointerdown", function (e) {
    cancelAnimationFrame(raf); raf = 0; vx = vy = 0;
    drag = { sx: e.clientX - x, sy: e.clientY - y }; lx = e.clientX;
    card.setPointerCapture(e.pointerId); card.classList.add("dragging", "springing");
  });
  card.addEventListener("pointermove", function (e) {
    var b = card.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    set("--mx", px * 100 + "%"); set("--my", py * 100 + "%");
    if (!drag) { set("--ry", (px - 0.5) * 14 + "deg"); set("--rx", (0.5 - py) * 14 + "deg"); return; }
    x = e.clientX - drag.sx; y = e.clientY - drag.sy;
    vx = (e.clientX - lx) * 0.6; lx = e.clientX;
    r = Math.max(-16, Math.min(16, vx * 1.6)); apply();
  });
  function end() { if (!drag) return; drag = null; card.classList.remove("dragging"); release(); }
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
  card.addEventListener("pointerleave", function () { set("--rx", "0deg"); set("--ry", "0deg"); });
  card.addEventListener("keydown", function (e) {
    var m = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }[e.key];
    if (m) { e.preventDefault(); x += m[0]; y += m[1]; apply(); release(); }
  });
  window.addEventListener("resize", lace);
  var t0 = performance.now();
  (function tick(t) { lace(); if (t - t0 < 1500) requestAnimationFrame(tick); })(t0);
})();

/* ---------- nav highlight, back-to-top, contact form ---------- */
(function () {
  var links = document.querySelectorAll(".nav-links a"), toTop = document.getElementById("toTop");
  var ids = ["about", "skills", "projects", "contact"];
  function onScroll() {
    var cur = ids[0];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = id;
    });
    links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + cur); });
    if (toTop) toTop.classList.toggle("show", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var form = document.getElementById("contactForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = form.elements.name.value.trim(), m = form.elements.message.value.trim();
    window.location.href = "mailto:Jhosuatapiaaaaa@gmail.com?subject=" + encodeURIComponent("Portfolio message from " + n) +
      "&body=" + encodeURIComponent(m + "\n\n- " + n);
  });
})();
