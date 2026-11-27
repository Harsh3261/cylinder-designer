/* Beam FEA verification. Every expected value is an independent closed form or a published result.
   Run: node tests/fea.test.js */
const fs = require("fs"), path = require("path");
eval(fs.readFileSync(path.join(__dirname, "..", "engine.js"), "utf8").replace("var CD =", "global.CD ="));
let n = 0; const fails = [], rows = [];
const near = (lab, a, e, rel) => { n++; const ok = Math.abs(a - e) <= rel * Math.abs(e); rows.push((ok ? "ok   " : "FAIL ") + lab + ": " + (+a).toPrecision(7) + " vs " + (+e).toPrecision(7)); if (!ok) fails.push(lab); };
const PI = Math.PI, E = 206e9, d = 0.05, I = PI * Math.pow(d, 4) / 64, A = PI * d * d / 4, c = d / 2, EI = E * I, L = 2;
const seg = (Lx, w) => ({ L:Lx, EI, E, A, c, w:w || 0 });
/* 1 cantilever tip load: δ = FL³/3EI, root moment FL */
{ const F = 1000, r = CD.beamFEA({ segs:[seg(L)], endA:"fixed", endB:"free", Fend:F, nPer:20 });
  near("cantilever tip deflection FL³/3EI", r.v[r.ne], F * L ** 3 / (3 * EI), 1e-9); near("cantilever root moment FL", Math.abs(r.M[0]), F * L, 1e-3); }
/* 2 simply supported uniform load: δmid = 5wL⁴/384EI, Mmid = wL²/8 */
{ const w = 500, r = CD.beamFEA({ segs:[seg(L, w)], endA:"pin", endB:"pin", nPer:20 });
  near("SS uniform midspan deflection 5wL⁴/384EI", Math.abs(r.v[10]), 5 * w * L ** 4 / (384 * EI), 1e-9); near("SS uniform max moment wL²/8", Math.abs(r.maxM), w * L * L / 8, 2e-3); }
/* 3 Euler pinned–pinned and fixed–free */
near("Euler pin–pin π²EI/L²", CD.beamFEA({ segs:[seg(L)], endA:"pin", endB:"pin", nPer:20 }).Pcr, PI * PI * EI / (L * L), 1e-5);
near("Euler fixed–free π²EI/4L²", CD.beamFEA({ segs:[seg(L)], endA:"fixed", endB:"free", nPer:20 }).Pcr, PI * PI * EI / (4 * L * L), 1e-5);
/* 4 beam-column (P-delta), pinned, uniform w + axial P (Timoshenko & Gere): u = (L/2)·√(P/EI);
   δmid = 5wL⁴/(384EI) · 12(2 sec u − 2 − u²)/(5u⁴);  Mmid = (wEI/P)(sec u − 1) */
{ const w = 500, Pcr = PI * PI * EI / (L * L), P = 0.6 * Pcr, u = L / 2 * Math.sqrt(P / EI), sec = 1 / Math.cos(u);
  const r = CD.beamFEA({ segs:[seg(L, w)], endA:"pin", endB:"pin", P, nPer:40 });
  near("beam-column midspan deflection (sec formula)", Math.abs(r.v[r.ne / 2]), 5 * w * L ** 4 / (384 * EI) * 12 * (2 * sec - 2 - u * u) / (5 * u ** 4), 1e-4);
  near("beam-column midspan moment (w·EI/P)(sec u − 1)", Math.abs(r.M[r.ne / 2]), w * EI / P * (sec - 1), 2e-3); }
/* 5 stepped column vs exact characteristic equation (pole-free form) */
{ const EIt = E * PI * (0.12 ** 4 - 0.1 ** 4) / 64, a = 1.2, b = 1.5;
  const h = P => { const k1 = Math.sqrt(P / EIt), k2 = Math.sqrt(P / EI); return k1 * Math.sin(k2 * b) * Math.cos(k1 * a) + k2 * Math.sin(k1 * a) * Math.cos(k2 * b); };
  let root = NaN, x0 = 10, v0 = h(x0); for (let i = 1; i <= 20000; i++){ const xx = 10 + i * 50, vv = h(xx); if (v0 * vv < 0){ let lo = x0, hi = xx; for (let k = 0; k < 200; k++){ const mid = (lo + hi) / 2; if (h(lo) * h(mid) <= 0) hi = mid; else lo = mid; } root = (lo + hi) / 2; break; } x0 = xx; v0 = vv; }
  near("stepped column vs exact characteristic equation", CD.beamFEA({ segs:[{ L:a, EI:EIt, E, A, c }, seg(b)], nPer:40 }).Pcr, root, 1e-4); }
/* 6 published: Baragetti & Villa 2016 Table 3 actuator */
{ const Js = 7854e-12, Jc = PI * (0.03 ** 4 - 0.025 ** 4) / 64, sg = [{ L:1.276, EI:206e9 * Jc, E:206e9, A:1, c:0.015 }, { L:1.163, EI:206e9 * Js, E:206e9, A:1, c:0.01 }];
  near("Baragetti rigid 3855 N", CD.beamFEA({ segs:sg, nPer:40 }).Pcr, 3855, 1e-3);
  near("Baragetti Kf 8071e3 N·mm/rad → 3111 N", CD.beamFEA({ segs:sg, nPer:40, Kf:8071 }).Pcr, 3111, 1e-3);
  near("Baragetti Kf 29777e3 N·mm/rad → 3629 N", CD.beamFEA({ segs:sg, nPer:40, Kf:29777 }).Pcr, 3629, 1e-3); }
/* 7 mesh convergence: Pcr error must fall monotonically and be < 1e-5 at the app's default 20/segment */
{ const ex = PI * PI * EI / (L * L); let prevErr = Infinity, mono = true; const tbl = [];
  for (const m of [2, 4, 8, 16, 20, 40]){ const err = Math.abs(CD.beamFEA({ segs:[seg(L)], nPer:m }).Pcr - ex) / ex; tbl.push(m + ":" + err.toExponential(2)); if (err > prevErr * 1.0001) mono = false; prevErr = err; }
  n++; if (!mono) fails.push("convergence not monotonic"); rows.push((mono ? "ok   " : "FAIL ") + "mesh convergence (Euler error by elements) " + tbl.join("  "));
  n++; const e20 = Math.abs(CD.beamFEA({ segs:[seg(L)], nPer:20 }).Pcr - ex) / ex; if (!(e20 < 1e-5)) fails.push("20-element error " + e20); }
/* 8 mesh cap */
{ n++; if (CD.beamFEA({ segs:[seg(L)], nPer:500 }).ne !== 60) fails.push("mesh cap 60 per segment"); }
console.log(rows.join("\n"));
if (fails.length){ console.log("FAIL " + fails.length + "/" + n); process.exit(1); }
console.log("OK " + n + " FEA checks");
