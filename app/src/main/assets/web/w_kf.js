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
