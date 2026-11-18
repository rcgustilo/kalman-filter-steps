/* Kalman Filter Steps — interactive widgets: payoff matrices, charts, simulators.
   Charts are plain SVG so the app works offline with no libraries. */
var W = (function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  // ---------- small helpers ----------
  function h(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function s(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function fmt(x, d) {
    if (!isFinite(x)) return "–";
    d = d == null ? 2 : d;
    var r = Number(x.toFixed(d));
    return String(r);
  }
  function frac(x) {
    // show simple fractions where exact
    for (var den = 1; den <= 12; den++) {
      var num = Math.round(x * den);
      if (Math.abs(num / den - x) < 1e-9) return den === 1 ? String(num) : num + "/" + den;
    }
    return fmt(x, 3);
  }
  function slider(label, min, max, step, val, onInput, unit) {
    var wrap = h("label", { class: "sl" });
    var top = h("div", { class: "sl-top" });
    var name = h("span", null, label);
    var out = h("b", null, fmt(val, 2) + (unit || ""));
    top.appendChild(name); top.appendChild(out);
    var inp = h("input", { type: "range", min: min, max: max, step: step, value: val });
    inp.addEventListener("input", function () {
      out.textContent = fmt(+inp.value, 2) + (unit || "");
      onInput(+inp.value);
    });
    wrap.appendChild(top); wrap.appendChild(inp);
    wrap.set = function (v) { inp.value = v; out.textContent = fmt(v, 2) + (unit || ""); };
    return wrap;
  }
  function numInput(val, onChange) {
    var i = h("input", { type: "number", step: "any", value: val, class: "num", inputmode: "decimal" });
    i.addEventListener("input", function () { var v = parseFloat(i.value); if (isFinite(v)) onChange(v); });
    return i;
  }
  var PAL = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)"];

  // ---------- line chart ----------
  function niceTicks(min, max, n) {
    var span = max - min || 1, step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var t = [], v = Math.ceil(min / step) * step;
    for (; v <= max + step * 1e-6; v += step) t.push(Number(v.toFixed(10)));
    return t;
  }
  /* opts: {xMin,xMax,yMin,yMax,xLabel,yLabel,series:[{name,color,pts,dash,width}],
            dots:[{x,y,color,label}], vlines:[{x,label,color}], hlines:[{y,label,color}], area:{pts,color}} */
  function lineChart(opts) {
    var Wd = 360, Ht = 230, L = 44, Rm = 12, T = 12, B = 40;
    var svg = s("svg", { viewBox: "0 0 " + Wd + " " + Ht, class: "chart", role: "img" });
    var x0 = opts.xMin, x1 = opts.xMax, y0 = opts.yMin, y1 = opts.yMax;
    if (y0 === undefined || y1 === undefined) {
      var ys = [];
      opts.series.forEach(function (se) { se.pts.forEach(function (p) { if (isFinite(p[1])) ys.push(p[1]); }); });
      (opts.dots || []).forEach(function (d) { ys.push(d.y); });
      y0 = y0 !== undefined ? y0 : Math.min.apply(null, ys);
      y1 = y1 !== undefined ? y1 : Math.max.apply(null, ys);
      var pad = (y1 - y0) * 0.08 || 1; if (opts.yMin === undefined) y0 -= pad; if (opts.yMax === undefined) y1 += pad;
    }
    function X(x) { return L + (x - x0) / (x1 - x0) * (Wd - L - Rm); }
    function Y(y) { return T + (1 - (y - y0) / (y1 - y0)) * (Ht - T - B); }
    var g = s("g", {});
    niceTicks(y0, y1, 5).forEach(function (t) {
      g.appendChild(s("line", { x1: L, x2: Wd - Rm, y1: Y(t), y2: Y(t), class: "grid" }));
      g.appendChild(s("text", { x: L - 5, y: Y(t) + 3, class: "tick", "text-anchor": "end" }, fmt(t, 2)));
    });
    (opts.xTicks || niceTicks(x0, x1, 6)).forEach(function (t) {
      g.appendChild(s("line", { x1: X(t), x2: X(t), y1: T, y2: Ht - B, class: "grid" }));
      g.appendChild(s("text", { x: X(t), y: Ht - B + 13, class: "tick", "text-anchor": "middle" }, opts.xFmt ? opts.xFmt(t) : fmt(t, 2)));
    });
    g.appendChild(s("line", { x1: L, x2: Wd - Rm, y1: Ht - B, y2: Ht - B, class: "axis" }));
    g.appendChild(s("line", { x1: L, x2: L, y1: T, y2: Ht - B, class: "axis" }));
    if (opts.xLabel) g.appendChild(s("text", { x: (L + Wd - Rm) / 2, y: Ht - 6, class: "alabel", "text-anchor": "middle" }, opts.xLabel));
    if (opts.yLabel) g.appendChild(s("text", { x: 11, y: (T + Ht - B) / 2, class: "alabel", "text-anchor": "middle", transform: "rotate(-90 11 " + ((T + Ht - B) / 2) + ")" }, opts.yLabel));
    svg.appendChild(g);
    var clipId = "c" + Math.random().toString(36).slice(2);
    var defs = s("defs", {}); var cp = s("clipPath", { id: clipId });
    cp.appendChild(s("rect", { x: L, y: T, width: Wd - L - Rm, height: Ht - T - B })); defs.appendChild(cp); svg.appendChild(defs);
    var plot = s("g", { "clip-path": "url(#" + clipId + ")" });
    if (opts.area) {
      var d = opts.area.pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join("");
      d += "L" + X(opts.area.pts[opts.area.pts.length - 1][0]) + "," + Y(y0) + "L" + X(opts.area.pts[0][0]) + "," + Y(y0) + "Z";
      plot.appendChild(s("path", { d: d, fill: opts.area.color, opacity: 0.15 }));
    }
    (opts.vlines || []).forEach(function (v) {
      plot.appendChild(s("line", { x1: X(v.x), x2: X(v.x), y1: T, y2: Ht - B, stroke: v.color || "var(--muted)", "stroke-dasharray": "4 3", "stroke-width": 1.5 }));
    });
    (opts.hlines || []).forEach(function (v) {
      plot.appendChild(s("line", { x1: L, x2: Wd - Rm, y1: Y(v.y), y2: Y(v.y), stroke: v.color || "var(--muted)", "stroke-dasharray": "4 3", "stroke-width": 1.5 }));
    });
    opts.series.forEach(function (se, i) {
      var d = "", pen = false;
      se.pts.forEach(function (p) {
        if (!isFinite(p[1])) { pen = false; return; }
        d += (pen ? "L" : "M") + X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); pen = true;
      });
      plot.appendChild(s("path", { d: d, fill: "none", stroke: se.color || PAL[i], "stroke-width": se.width || 2.5, "stroke-dasharray": se.dash || "", "stroke-linejoin": "round" }));
    });
    (opts.dots || []).forEach(function (dt) {
      plot.appendChild(s("circle", { cx: X(dt.x), cy: Y(dt.y), r: 5, fill: dt.color || "var(--accent)", stroke: "var(--card)", "stroke-width": 2 }));
    });
    svg.appendChild(plot);
    (opts.vlines || []).forEach(function (v) { if (v.label) svg.appendChild(s("text", { x: X(v.x) + 4, y: T + 11, class: "vlabel" }, v.label)); });
    (opts.dots || []).forEach(function (dt) { if (dt.label) svg.appendChild(s("text", { x: X(dt.x) + 8, y: Y(dt.y) - 7, class: "vlabel" }, dt.label)); });
    var wrap = h("div", { class: "chartwrap" });
    wrap.appendChild(svg);
    var named = opts.series.filter(function (se) { return se.name; });
    if (named.length) {
      var lg = h("div", { class: "legend" });
      named.forEach(function (se) {
        var i = opts.series.indexOf(se);
        lg.appendChild(h("span", null, '<i style="background:' + (se.color || PAL[i]) + '"></i>' + se.name));
      });
      wrap.appendChild(lg);
    }
    return wrap;
  }

  // ---------- bar chart ----------
  /* opts: {cats:[], series:[{name,color,values}], yLabel, yMax, horizontal, fmt} */
  function barChart(opts) {
    var n = opts.cats.length, m = opts.series.length;
    var Wd = 360, Ht = opts.height || 230, L = 44, Rm = 10, T = 14, B = 46;
    var svg = s("svg", { viewBox: "0 0 " + Wd + " " + Ht, class: "chart" });
    var all = []; opts.series.forEach(function (se) { all = all.concat(se.values); });
    var y0 = Math.min(0, Math.min.apply(null, all)), y1 = opts.yMax || Math.max.apply(null, all) * 1.12 || 1;
    function Y(y) { return T + (1 - (y - y0) / (y1 - y0)) * (Ht - T - B); }
    niceTicks(y0, y1, 5).forEach(function (t) {
      svg.appendChild(s("line", { x1: L, x2: Wd - Rm, y1: Y(t), y2: Y(t), class: "grid" }));
      svg.appendChild(s("text", { x: L - 5, y: Y(t) + 3, class: "tick", "text-anchor": "end" }, fmt(t, 2)));
    });
    svg.appendChild(s("line", { x1: L, x2: Wd - Rm, y1: Y(0), y2: Y(0), class: "axis" }));
    var gw = (Wd - L - Rm) / n, bw = Math.min(34, gw * 0.8 / m);
    opts.cats.forEach(function (c, i) {
      var gx = L + gw * i + (gw - bw * m) / 2;
      opts.series.forEach(function (se, j) {
        var v = se.values[i], yy = Y(Math.max(v, 0)), hh = Math.abs(Y(v) - Y(0));
        svg.appendChild(s("rect", { x: gx + j * bw, y: yy, width: bw - 2, height: Math.max(hh, 0.5), rx: 3, fill: se.color || PAL[j] }));
        if (opts.labels !== false) svg.appendChild(s("text", { x: gx + j * bw + (bw - 2) / 2, y: (v >= 0 ? yy - 3 : yy + hh + 10), class: "blabel", "text-anchor": "middle" }, opts.fmt ? opts.fmt(v) : fmt(v, 1)));
      });
      var lines = String(c).split("\n");
      lines.forEach(function (ln, k) {
        svg.appendChild(s("text", { x: L + gw * i + gw / 2, y: Ht - B + 14 + k * 12, class: "tick", "text-anchor": "middle" }, ln));
      });
    });
    if (opts.yLabel) svg.appendChild(s("text", { x: 11, y: (T + Ht - B) / 2, class: "alabel", "text-anchor": "middle", transform: "rotate(-90 11 " + ((T + Ht - B) / 2) + ")" }, opts.yLabel));
    var wrap = h("div", { class: "chartwrap" });
    wrap.appendChild(svg);
    if (m > 1 || opts.legend) {
      var lg = h("div", { class: "legend" });
      opts.series.forEach(function (se, j) { lg.appendChild(h("span", null, '<i style="background:' + (se.color || PAL[j]) + '"></i>' + se.name)); });
      wrap.appendChild(lg);
    }
    return wrap;
  }

  // ================= shared canvas / ODE helpers =================
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888"; }
  function logistic(r, x) { return r * x * (1 - x); }

  /* Canvas plot with axes. Returns {wrap, ctx, X, Y, clear} */
  function canvasPlot(o) {
    var Wd = o.w || 360, Ht = o.h || 260, L = o.noAxes ? 0 : 40, B = o.noAxes ? 0 : 34, T = o.noAxes ? 0 : 8, Rm = o.noAxes ? 0 : 8;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var cv = h("canvas", { class: "cv" });
    cv.width = Wd * dpr; cv.height = Ht * dpr;
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    var x0 = o.xMin, x1 = o.xMax, y0 = o.yMin, y1 = o.yMax;
    function X(x) { return L + (x - x0) / (x1 - x0) * (Wd - L - Rm); }
    function Y(y) { return T + (1 - (y - y0) / (y1 - y0)) * (Ht - T - B); }
    function clear() {
      ctx.clearRect(0, 0, Wd, Ht);
      if (o.noAxes) return;
      ctx.strokeStyle = css("--line"); ctx.fillStyle = css("--muted"); ctx.lineWidth = 1; ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "right";
      niceTicks(y0, y1, 5).forEach(function (t) { ctx.beginPath(); ctx.moveTo(L, Y(t)); ctx.lineTo(Wd - Rm, Y(t)); ctx.stroke(); ctx.fillText(fmt(t, 3), L - 4, Y(t) + 3); });
      ctx.textAlign = "center";
      niceTicks(x0, x1, 6).forEach(function (t) { ctx.beginPath(); ctx.moveTo(X(t), T); ctx.lineTo(X(t), Ht - B); ctx.stroke(); ctx.fillText(fmt(t, 3), X(t), Ht - B + 12); });
      ctx.font = "11px system-ui, sans-serif";
      if (o.xLabel) ctx.fillText(o.xLabel, (L + Wd) / 2, Ht - 4);
      if (o.yLabel) { ctx.save(); ctx.translate(10, (T + Ht - B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.yLabel, 0, 0); ctx.restore(); }
    }
    clear();
    var wrap = h("div", { class: "chartwrap" }); wrap.appendChild(cv);
    return { wrap: wrap, ctx: ctx, X: X, Y: Y, clear: clear, canvas: cv, W: Wd, H: Ht, L: L, T: T, B: B, Rm: Rm };
  }

  function rk4(f, s, dt) {
    var n = s.length, k1 = f(s), a = new Array(n), i;
    for (i = 0; i < n; i++) a[i] = s[i] + dt / 2 * k1[i];
    var k2 = f(a); for (i = 0; i < n; i++) a[i] = s[i] + dt / 2 * k2[i];
    var k3 = f(a); for (i = 0; i < n; i++) a[i] = s[i] + dt * k3[i];
    var k4 = f(a), out = new Array(n);
    for (i = 0; i < n; i++) out[i] = s[i] + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  }


  // complex numbers for frequency response
  function C(re, im) { return { re: re, im: im || 0 }; }
  function cadd(a, b) { return C(a.re + b.re, a.im + b.im); }
  function csub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function cmul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function cdiv(a, b) { var d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); }
  function cabs(a) { return Math.hypot(a.re, a.im); }
  function carg(a) { return Math.atan2(a.im, a.re); }
  function poly(coefs, s) { var r = C(0, 0); coefs.forEach(function (c) { r = cadd(cmul(r, s), C(c, 0)); }); return r; }
  function logspace(a, b, n) { var o = []; for (var i = 0; i < n; i++) o.push(Math.pow(10, a + (b - a) * i / (n - 1))); return o; }
  function pow10fmt(t) { var k = Math.round(t); if (Math.abs(t - k) > 1e-9) return ""; return k === 0 ? "1" : k === 1 ? "10" : "10^" + k; }
  function randn() { var u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  // ================= Kalman Filter widgets =================
  function logSlider(label, lo, hi, val, onInput) {
    var wrap = slider(label, Math.log10(lo), Math.log10(hi), 0.01, Math.log10(val), function (v) { out(); onInput(Math.pow(10, v)); });
    var b = wrap.querySelector("b"), inp = wrap.querySelector("input");
    function out() { var v = Math.pow(10, +inp.value); b.textContent = v < 0.01 ? v.toExponential(1) : fmt(v, 3); }
    out();
    return wrap;
  }
  function seeded(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(rand) { var u = 0, v = 0; while (u === 0) u = rand(); v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // ---------- fusing two Gaussians ----------
  function fuse(el) {
    var m1 = 10, s1 = 2, m2 = 12, s2 = 1;
    var box = h("div"), info = h("div", { class: "winfo" });
    var a = slider("Estimate 1 mean μ₁", 0, 20, 0.1, m1, function (v) { m1 = v; draw(); });
    var b = slider("Estimate 1 std σ₁", 0.3, 5, 0.1, s1, function (v) { s1 = v; draw(); });
    var c = slider("Estimate 2 mean μ₂", 0, 20, 0.1, m2, function (v) { m2 = v; draw(); });
    var d = slider("Estimate 2 std σ₂", 0.3, 5, 0.1, s2, function (v) { s2 = v; draw(); });
    el.appendChild(box); el.appendChild(a); el.appendChild(b); el.appendChild(c); el.appendChild(d); el.appendChild(info);
    function pdf(x, m, s) { return Math.exp(-(x - m) * (x - m) / (2 * s * s)) / Math.sqrt(2 * Math.PI * s * s); }
    function draw() {
      var v1 = s1 * s1, v2 = s2 * s2, v = v1 * v2 / (v1 + v2), m = (v2 * m1 + v1 * m2) / (v1 + v2), K = v1 / (v1 + v2);
      var p1 = [], p2 = [], pf = [];
      for (var i = 0; i <= 200; i++) { var x = -2 + 24 * i / 200; p1.push([x, pdf(x, m1, s1)]); p2.push([x, pdf(x, m2, s2)]); pf.push([x, pdf(x, m, Math.sqrt(v))]); }
      box.innerHTML = "";
      box.appendChild(lineChart({ xMin: -2, xMax: 22, yMin: 0, xLabel: "Value", yLabel: "Probability density", series: [{ name: "Estimate 1 (prediction)", pts: p1, color: "var(--c1)" }, { name: "Estimate 2 (measurement)", pts: p2, color: "var(--c2)" }, { name: "Fused", pts: pf, color: "var(--c3)", width: 3.5 }] }));
      info.innerHTML = "Fused mean <b>" + fmt(m, 3) + "</b>, std <b>" + fmt(Math.sqrt(v), 3) + "</b> (smaller than both " + fmt(s1, 2) + " and " + fmt(s2, 2) + "). Gain K = σ₁²/(σ₁²+σ₂²) = <b>" + fmt(K, 3) + "</b>: the result moves " + fmt(K * 100, 0) + "% of the way from estimate 1 to estimate 2.";
    }
    draw();
  }

  // ---------- scalar Kalman filter ----------
  function kf1d(el, o) {
    var Q = 0.01, Rf = 1, seed = 7, step = !!o.step;
    var b1 = h("div"), b2 = h("div"), info = h("div", { class: "winfo" });
    var sq = logSlider("Filter process noise Q", 0.0001, 10, Q, function (v) { Q = v; draw(); });
    var sr = logSlider("Filter measurement noise R", 0.01, 100, Rf, function (v) { Rf = v; draw(); });
    var bs = h("button", { class: "btn small ghost" }, step ? "Remove sudden step" : "Add a sudden step at k = 100");
    bs.onclick = function () { step = !step; bs.textContent = step ? "Remove sudden step" : "Add a sudden step at k = 100"; draw(); };
    var bn = h("button", { class: "btn small" }, "New random data"); bn.onclick = function () { seed++; draw(); };
    el.appendChild(b1); el.appendChild(b2); el.appendChild(sq); el.appendChild(sr); el.appendChild(bs); el.appendChild(bn); el.appendChild(info);
    function draw() {
      var rand = seeded(seed), N = 200, x = 20, xs = [], zs = [];
      for (var k = 0; k < N; k++) { x += 0.05 * gauss(rand); if (step && k === 100) x += 5; xs.push(x); zs.push(x + 1.0 * gauss(rand)); }
      var xh = zs[0], P = 1, est = [], hi = [], lo = [], inside = 0, nis = 0, se = 0, sz = 0, Ks = [];
      for (k = 0; k < N; k++) {
        var Pm = P + Q, S = Pm + Rf, K = Pm / S, nu = zs[k] - xh;
        nis += nu * nu / S;
        xh = xh + K * nu; P = (1 - K) * Pm;
        est.push([k, xh]); hi.push([k, xh + 2 * Math.sqrt(P)]); lo.push([k, xh - 2 * Math.sqrt(P)]); Ks.push([k, K]);
        if (Math.abs(xs[k] - xh) <= 2 * Math.sqrt(P)) inside++;
        se += (xs[k] - xh) * (xs[k] - xh); sz += (xs[k] - zs[k]) * (xs[k] - zs[k]);
      }
      b1.innerHTML = ""; b2.innerHTML = "";
      b1.appendChild(lineChart({ xMin: 0, xMax: N - 1, xLabel: "Time step k", yLabel: "Value",
        series: [{ name: "Measurements", pts: zs.map(function (z, k) { return [k, z]; }), color: "var(--line)", width: 1 }, { name: "True value", pts: xs.map(function (v, k) { return [k, v]; }), color: "var(--c1)", width: 2 }, { name: "Kalman estimate", pts: est, color: "var(--c2)", width: 2.2 }, { name: "±2σ band", pts: hi, color: "var(--c2)", width: 1, dash: "3 3" }, { pts: lo, color: "var(--c2)", width: 1, dash: "3 3" }] }));
      b2.appendChild(lineChart({ xMin: 0, xMax: N - 1, yMin: 0, yMax: 1, xLabel: "Time step k", yLabel: "Gain K", series: [{ name: "Kalman gain K_k (settles to a constant)", pts: Ks, color: "var(--c4)" }] }));
      var anis = nis / N;
      info.innerHTML = "RMS error: measurements <b>" + fmt(Math.sqrt(sz / N), 3) + "</b>, Kalman estimate <b>" + fmt(Math.sqrt(se / N), 3) + "</b>. Truth inside ±2σ band: " + fmt(inside / N * 100, 0) + "% (ideal ≈ 95%). Average NIS = <b>" + fmt(anis, 2) + "</b> (ideal ≈ 1" +
        (anis > 2 ? ", <span class='bad'>overconfident</span>" : anis < 0.5 ? ", <span class='bad'>too pessimistic</span>" : ", <span class='good'>consistent</span>") + "). True values: Q = 0.0025, R = 1.";
    }
    draw();
  }

  // ---------- 2D constant-velocity tracking ----------
  function track(el) {
    var q = 0.05, sig = 6, seed = 3;
    var box = h("div"), info = h("div", { class: "winfo" });
    var sq = logSlider("Process noise q (manoeuvre allowance)", 0.001, 10, q, function (v) { q = v; draw(); });
    var ss = slider("Measurement noise σ (m)", 1, 20, 0.5, sig, function (v) { sig = v; draw(); });
    var bn = h("button", { class: "btn small" }, "New random data"); bn.onclick = function () { seed++; draw(); };
    el.appendChild(box); el.appendChild(sq); el.appendChild(ss); el.appendChild(bn); el.appendChild(info);
    function draw() {
      var rand = seeded(seed), N = 160, T = 1, tru = [], meas = [];
      for (var k = 0; k < N; k++) { tru.push([70 * Math.sin(0.03 * k), 45 * Math.sin(0.06 * k)]); }
      tru.forEach(function (p) { meas.push([p[0] + sig * gauss(rand), p[1] + sig * gauss(rand)]); });
      var Q = [[q * T * T * T / 3, q * T * T / 2], [q * T * T / 2, q * T]], Rv = sig * sig;
      var est = [], ex = 0, em = 0;
      var axes = [0, 1].map(function (ax) {
        var x = [meas[0][ax], 0], P = [[Rv, 0], [0, 100]], out = [];
        for (var k = 0; k < N; k++) {
          if (k > 0) {
            x = [x[0] + T * x[1], x[1]];
            var p00 = P[0][0] + 2 * T * P[0][1] + T * T * P[1][1] + Q[0][0], p01 = P[0][1] + T * P[1][1] + Q[0][1], p11 = P[1][1] + Q[1][1];
            P = [[p00, p01], [p01, p11]];
            var S = P[0][0] + Rv, K0 = P[0][0] / S, K1 = P[0][1] / S, nu = meas[k][ax] - x[0];
            x = [x[0] + K0 * nu, x[1] + K1 * nu];
            P = [[(1 - K0) * P[0][0], (1 - K0) * P[0][1]], [P[0][1] - K1 * P[0][0], P[1][1] - K1 * P[0][1]]];
          }
          out.push(x[0]);
        }
        return out;
      });
      for (k = 0; k < N; k++) {
        est.push([axes[0][k], axes[1][k]]);
        ex += Math.pow(est[k][0] - tru[k][0], 2) + Math.pow(est[k][1] - tru[k][1], 2);
        em += Math.pow(meas[k][0] - tru[k][0], 2) + Math.pow(meas[k][1] - tru[k][1], 2);
      }
      var pl = canvasPlot({ xMin: -95, xMax: 95, yMin: -70, yMax: 70, xLabel: "x (m)", yLabel: "y (m)", h: 280 });
      var ctx = pl.ctx;
      ctx.fillStyle = css("--muted"); ctx.globalAlpha = 0.55;
      meas.forEach(function (p) { ctx.beginPath(); ctx.arc(pl.X(p[0]), pl.Y(p[1]), 1.8, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      [[tru, "--c1", 2], [est, "--c2", 2.2]].forEach(function (q) {
        ctx.strokeStyle = css(q[1]); ctx.lineWidth = q[2]; ctx.beginPath();
        q[0].forEach(function (p, i) { if (i) ctx.lineTo(pl.X(p[0]), pl.Y(p[1])); else ctx.moveTo(pl.X(p[0]), pl.Y(p[1])); });
        ctx.stroke();
      });
      box.innerHTML = ""; box.appendChild(pl.wrap);
      box.appendChild(h("div", { class: "legend" }, '<span><i style="background:var(--muted)"></i>Measurements</span><span><i style="background:var(--c1)"></i>True path</span><span><i style="background:var(--c2)"></i>Kalman estimate</span>'));
      info.innerHTML = "RMS position error: raw measurements <b>" + fmt(Math.sqrt(em / N), 2) + " m</b>, Kalman estimate <b>" + fmt(Math.sqrt(ex / N), 2) + " m</b> (" + fmt((1 - Math.sqrt(ex / em)) * 100, 0) + "% better).";
    }
    draw();
  }

  // ---------- particle filter: robot in a circular corridor ----------
  function pf(el) {
    var L = 100, doors = [12, 27, 58, 80], Np = 600, rand = Math.random;
    var robot, parts, wts, step, lastZ;
    var box = h("div"), info = h("div", { class: "winfo" }), row = h("div", { class: "wrow" });
    var bm = h("button", { class: "btn small" }, "Move 4 m & sense ▶"), br = h("button", { class: "btn small ghost" }, "Reset");
    bm.onclick = function () { move(); draw(); }; br.onclick = function () { reset(); draw(); };
    row.appendChild(bm); row.appendChild(br);
    el.appendChild(box); el.appendChild(row); el.appendChild(info);
    function nearDoor(x) { return doors.some(function (d) { var dd = Math.abs(((x - d) % L + L) % L); return Math.min(dd, L - dd) < 2.5; }); }
    function reset() { robot = 35 + Math.random() * 30; parts = []; wts = []; for (var i = 0; i < Np; i++) { parts.push(Math.random() * L); wts.push(1 / Np); } step = 0; lastZ = null; }
    function sense() {
      var z = nearDoor(robot) ? (rand() < 0.85) : (rand() < 0.1); lastZ = z;
      var s = 0;
      for (var i = 0; i < Np; i++) { var d = nearDoor(parts[i]); var lik = z ? (d ? 0.85 : 0.1) : (d ? 0.15 : 0.9); wts[i] *= lik; s += wts[i]; }
      for (i = 0; i < Np; i++) wts[i] /= s;
      var neff = 1 / wts.reduce(function (a, w) { return a + w * w; }, 0);
      if (neff < Np / 2) resample();
      return neff;
    }
    function resample() {
      var np = [], c = wts[0], i = 0, u0 = rand() / Np;
      for (var m = 0; m < Np; m++) { var u = u0 + m / Np; while (u > c && i < Np - 1) { i++; c += wts[i]; } np.push(parts[i]); }
      parts = np; wts = parts.map(function () { return 1 / Np; });
    }
    var neff = Np;
    function move() {
      robot = (robot + 4 + 0.3 * gauss(rand) + L) % L;
      for (var i = 0; i < Np; i++) parts[i] = (parts[i] + 4 + 0.8 * gauss(rand) + L) % L;
      step++;
      neff = sense();
    }
    function draw() {
      var bins = new Array(50).fill(0);
      parts.forEach(function (p, i) { bins[Math.floor(p / 2) % 50] += wts[i]; });
      var pl = canvasPlot({ xMin: 0, xMax: L, yMin: 0, yMax: 1, xLabel: "Position along corridor (m)", h: 230 });
      var ctx = pl.ctx, mx = Math.max.apply(null, bins) || 1;
      ctx.fillStyle = css("--chip");
      doors.forEach(function (d) { ctx.fillRect(pl.X(d - 2.5), pl.Y(1), pl.X(d + 2.5) - pl.X(d - 2.5), pl.Y(0) - pl.Y(1)); });
      ctx.fillStyle = css("--c4");
      bins.forEach(function (b, i) { var hgt = 0.85 * b / mx; ctx.fillRect(pl.X(i * 2) + 0.5, pl.Y(hgt), pl.X(2) - pl.X(0) - 1, pl.Y(0) - pl.Y(hgt)); });
      ctx.fillStyle = css("--c2"); ctx.beginPath(); ctx.moveTo(pl.X(robot), pl.Y(0.97)); ctx.lineTo(pl.X(robot) - 6, pl.Y(0.88)); ctx.lineTo(pl.X(robot) + 6, pl.Y(0.88)); ctx.fill();
      ctx.font = "11px system-ui"; ctx.fillStyle = css("--muted");
      doors.forEach(function (d) { ctx.fillText("door", pl.X(d) - 11, pl.Y(0.93)); });
      box.innerHTML = ""; box.appendChild(pl.wrap);
      box.appendChild(h("div", { class: "legend" }, '<span><i style="background:var(--c2)"></i>True robot ▲</span><span><i style="background:var(--c4)"></i>Particle belief</span><span><i style="background:var(--chip)"></i>Doors (map)</span>'));
      // estimate = densest bin
      var best = bins.indexOf(Math.max.apply(null, bins)) * 2 + 1;
      var err = Math.min(Math.abs(best - robot), L - Math.abs(best - robot));
      info.innerHTML = step === 0 ? "The robot knows the map but not where it is: particles are spread uniformly. Press <b>Move &amp; sense</b>." :
        "Step " + step + ": sensor says <b>" + (lastZ ? "door" : "wall") + "</b>. Most likely position " + fmt(best, 0) + " m (true " + fmt(robot, 1) + " m, error " + fmt(err, 1) + " m). Effective sample size ≈ " + fmt(neff, 0) + " of " + Np + (err < 4 ? " · <span class='good'>localized ✓</span>" : "") + ".";
    }
    reset(); draw();
  }

  // ---------- complementary filter ----------
  function comp(el) {
    var alpha = 0.98, bias = 0.5, seed = 11;
    var box = h("div"), info = h("div", { class: "winfo" });
    var sa = slider("Blend α (weight on gyro path)", 0.8, 0.999, 0.001, alpha, function (v) { alpha = v; draw(); });
    var sb = slider("Gyro bias (°/s)", 0, 3, 0.1, bias, function (v) { bias = v; draw(); });
    el.appendChild(box); el.appendChild(sa); el.appendChild(sb); el.appendChild(info);
    function draw() {
      var rand = seeded(seed), dt = 0.01, T = 30, n = T / dt, th = 0, gyroAng = 0, est = 0, pts = { t: [], g: [], a: [], c: [] }, eg = 0, ea = 0, ec = 0;
      for (var k = 0; k <= n; k++) {
        var t = k * dt;
        var truth = 30 * Math.sin(0.5 * t) + 15 * Math.sin(1.7 * t);
        var rate = 15 * Math.cos(0.5 * t) + 25.5 * Math.cos(1.7 * t);
        var gyro = rate + bias + 1.0 * gauss(rand);
        var acc = truth + 6 * gauss(rand);
        if (k === 0) { gyroAng = truth; est = acc; }
        else { gyroAng += gyro * dt; est = alpha * (est + gyro * dt) + (1 - alpha) * acc; }
        eg += Math.pow(gyroAng - truth, 2); ea += Math.pow(acc - truth, 2); ec += Math.pow(est - truth, 2);
        if (k % 5 === 0) { pts.t.push([t, truth]); pts.g.push([t, gyroAng]); pts.a.push([t, acc]); pts.c.push([t, est]); }
      }
      box.innerHTML = "";
      box.appendChild(lineChart({ xMin: 0, xMax: T, xLabel: "Time (s)", yLabel: "Tilt angle (°)",
        series: [{ name: "Accelerometer only", pts: pts.a, color: "var(--line)", width: 1 }, { name: "Gyro integrated only", pts: pts.g, color: "var(--c6)", width: 1.5, dash: "5 3" }, { name: "True angle", pts: pts.t, color: "var(--c1)", width: 2 }, { name: "Complementary filter", pts: pts.c, color: "var(--c3)", width: 2.2 }] }));
      var tau = alpha * dt / (1 - alpha);
      info.innerHTML = "RMS error: gyro only <b>" + fmt(Math.sqrt(eg / n), 2) + "°</b> (drift), accelerometer only <b>" + fmt(Math.sqrt(ea / n), 2) + "°</b> (noise), complementary <b>" + fmt(Math.sqrt(ec / n), 2) + "°</b>. Time constant τ = αΔt/(1−α) = " + fmt(tau, 3) + " s.";
    }
    draw();
  }

  var REG = { fuse: fuse, kf1d: kf1d, track: track, pf: pf, comp: comp };

  return {
    mount: function (name, el, opts) {
      if (!REG[name]) return;
      try { REG[name](el, opts || {}); } catch (e) { el.innerHTML = "<p class='bad'>This interactive part could not load: " + e.message + "</p>"; }
    },
    lineChart: lineChart, barChart: barChart, h: h, fmt: fmt
  };
})();
