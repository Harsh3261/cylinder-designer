/* Engine tests. Expected values are worked independently (hand formulas or a second numerical method),
   or are published table values (ISO 898-1 / ASME B1.1 stress areas). Run: node tests/engine.test.js */
const fs = require("fs"), path = require("path");
eval(fs.readFileSync(path.join(__dirname, "..", "engine.js"), "utf8").replace("var CD =", "global.CD ="));
let n = 0; const fails = [];
const near = (lab, a, e, rel) => { n++; rel = rel || 1e-6; if (!(Math.abs(a - e) <= rel * Math.max(1e-12, Math.abs(e)))) fails.push(lab + ": got " + a + " expected " + e); };
const ok = (lab, c) => { n++; if (!c) fails.push(lab); };
const PI = Math.PI;
/* forces: 100 bore / 56 rod at 160 bar */
const f = CD.forces(0.1, 0.056, 160e5);
near("A1", f.A1, PI * 0.1 * 0.1 / 4); near("push", f.push, 160e5 * PI * 0.01 / 4); near("pull", f.pull, 160e5 * PI * (0.01 - 0.056 * 0.056) / 4);
near("ratio 100/56", f.ratio, 1 / (1 - 0.3136));
near("required bore", CD.requiredBore(f.push, 160e5), 0.1);
near("intensification no load", CD.intensification(160e5, f.A1, f.A2), 160e5 * f.ratio);
/* Euler, steel rod d 50 mm, L 2 m, K 1, E 206 GPa: Pcr = π²EI/L² */
const I = PI * Math.pow(0.05, 4) / 64, b = CD.rodBuckling(0.05, 206e9, 520e6, 2, 1);
near("Euler 50 mm × 2 m", b.Pcr, PI * PI * 206e9 * I / 4); ok("Euler mode", /Euler/.test(b.mode));
/* Johnson short column, d 50, L 0.3 m: slenderness 24 < transition */
const j = CD.rodBuckling(0.05, 206e9, 520e6, 0.3, 1), s = 0.3 / 0.0125;
near("Johnson 50 × 0.3", j.Pcr, PI * 0.05 * 0.05 / 4 * 520e6 * (1 - 520e6 * s * s / (4 * PI * PI * 206e9))); ok("Johnson mode", /Johnson/.test(j.mode));
/* continuity at the transition slenderness */
const sc = Math.sqrt(2 * PI * PI * 206e9 / 520e6), Lt = sc * 0.0125, jt = CD.rodBuckling(0.05, 206e9, 520e6, Lt * 0.999999, 1);
near("Euler = Johnson at transition", jt.johnson, jt.euler, 1e-4);
/* stepped FE: uniform column must reproduce Euler for each end condition */
const EI = 206e9 * I;
[["pin","pin",1],["fixed","free",2],["fixed","pin",0.6992],["fixed","fixed",0.5]].forEach(([a, c, K]) => {
  const P = CD.steppedBuckling([{ L:1, EI }, { L:1, EI }], a, c, 30); near("FE uniform " + a + "-" + c, P, PI * PI * EI / Math.pow(K * 2, 2), 2e-3); });
/* stepped pinned–pinned vs exact characteristic equation tan(k1 a)/k1 = −tan(k2 b)/k2, solved by bisection */
function exactStepped(EI1, a, EI2, bL){
  /* pole-free form: k1·sin(k2 b)·cos(k1 a) + k2·sin(k1 a)·cos(k2 b) = 0; smallest positive root */
  const h = P => { const k1 = Math.sqrt(P / EI1), k2 = Math.sqrt(P / EI2); return k1 * Math.sin(k2 * bL) * Math.cos(k1 * a) + k2 * Math.sin(k1 * a) * Math.cos(k2 * bL); };
  const hi = PI * PI * Math.max(EI1, EI2) / Math.pow(a + bL, 2) * 1.0001, N = 20000; let x0 = hi / N, v0 = h(x0);
  for (let i = 2; i <= N; i++){ const x = hi * i / N, v = h(x); if (v0 * v < 0){ let L = x0, H = x; for (let k = 0; k < 200; k++){ const M = (L + H) / 2; if (h(L) * h(M) <= 0) H = M; else L = M; } return (L + H) / 2; } x0 = x; v0 = v; }
  return NaN; }
const EIt = 206e9 * PI * (Math.pow(0.12, 4) - Math.pow(0.1, 4)) / 64;
const Pex = exactStepped(EIt, 1.2, EI, 1.5), Pfe = CD.steppedBuckling([{ L:1.2, EI:EIt }, { L:1.5, EI }], "pin", "pin", 60);
near("FE stepped pin-pin vs exact", Pfe, Pex, 2e-3); ok("stepped stiffer than rod alone", Pfe > PI * PI * EI / Math.pow(2.7, 2));
/* Thread stripping areas — hand calculation, 1/2-13 UNC 2A/2B, Le = 0.5 in (ASME B1.1 limits: Kn max 0.4250, Es min 0.4435,
   Ds min 0.4876, En max 0.4565). As = π·13·0.5·0.425·(1/26 + 0.57735·0.0185) = 0.426491 in²;
   An = π·13·0.5·0.4876·(1/26 + 0.57735·0.0311) = 0.561743 in² (worked by hand, 6 figures). */
{ const I2 = 0.0254 * 0.0254, ts = CD.threadShear(0.0254 / 13, 0.5 * 0.0254, 0.4250 * 0.0254, 0.4435 * 0.0254, 0.4876 * 0.0254, 0.4565 * 0.0254);
  near("thread As 1/2-13", ts.As / I2, PI * 13 * 0.5 * 0.425 * (1 / 26 + 0.57735 * 0.0185), 1e-9);
  near("thread As 1/2-13 hand value", ts.As / I2, 0.426491, 2e-6);
  near("thread An 1/2-13 hand value", ts.An / I2, 0.561743, 2e-6);
  const st = CD.threadStrip(0.0254 / 13, 0.0127, 0.4250 * 0.0254, 0.4435 * 0.0254, 0.4876 * 0.0254, 0.4565 * 0.0254, 600e6, 300e6);
  near("strip load = 0.577·Sy·area (weaker side)", st.F, Math.min(0.577 * 600e6 * st.As, 0.577 * 300e6 * st.An)); ok("strip names weaker side", /internal/.test(st.weak));
  /* retaining ring: Smalley example form, D 2 in, T 0.062, Ss 150 ksi: π·2·0.062·150000 = 58,434 lbf (K = 1); groove d 0.03 in, Sy 45 ksi: 8,482 lbf */
  const rr = CD.retainingRing(2, 0.062, 0.03, 150000, 45000);
  near("ring shear", rr.ringShear, PI * 2 * 0.062 * 150000); near("groove yield", rr.grooveYield, PI * 2 * 0.03 * 45000); ok("groove governs", rr.limit === "groove yield"); }
/* stop tube: 40 in → 0; 40.1 in → 1 in; 50 in → 1 in; 50.1 in → 2 in */
near("stop 40", CD.stopTube(40 * 0.0254) + 1, 1); near("stop 40.1", CD.stopTube(40.1 * 0.0254), 0.0254);
near("stop 50", CD.stopTube(50 * 0.0254), 0.0254); near("stop 50.1", CD.stopTube(50.1 * 0.0254), 2 * 0.0254);
/* tube: Lamé vs Barlow; thin-wall limit; min wall inverse */
const t = CD.tube(250e5, 0.1, 0.12, 206e9, 0.3), ri = 0.05, ro = 0.06;
near("Lamé hoop", t.hoop, 250e5 * (ro * ro + ri * ri) / (ro * ro - ri * ri)); near("Barlow", t.barlow, 250e5 * 0.12 / 0.02);
const thin = CD.tube(1e6, 1, 1.002); near("thin wall Lamé ≈ p·r/t", thin.hoop, 1e6 * 0.5005 / 0.001, 2e-3);
const w = CD.tubeMinWall(250e5, 0.1, t.hoop); near("min wall inverse of Lamé", w, 0.01, 1e-9);
near("bore growth closed ends", t.growth, 250e5 * ri * ((1 - 0.6) * ri * ri + 1.3 * ro * ro) / (206e9 * (ro * ro - ri * ri)));
/* plate: clamped 0.75·p·a²/t²; simple 3(3.3)/8; thickness inverse */
near("plate clamped", CD.plate(25e6, 0.05, 0.03, "fixed").stress, 0.75 * 25e6 * 0.0025 / 0.0009);
near("plate simple", CD.plate(25e6, 0.05, 0.03, "simple").stress, 1.2375 * 25e6 * 0.0025 / 0.0009);
near("plate min t", CD.plateMinT(25e6, 0.05, CD.plate(25e6, 0.05, 0.03, "fixed").stress, "fixed"), 0.03);
/* published tensile stress areas: M20×2.5 = 245 mm² (ISO 898-1 table), M24×3 = 353 mm², 1-8 UNC = 0.606 in², 1/2-13 = 0.1419 in² */
near("As M20x2.5", CD.stressAreaMetric(0.020, 0.0025) * 1e6, 245, 3e-3); near("As M24x3", CD.stressAreaMetric(0.024, 0.003) * 1e6, 353, 3e-3);
near("As 1-8", CD.stressAreaInch(1, 8) / 0.00064516, 0.606, 1e-3); near("As 1/2-13", CD.stressAreaInch(0.5, 13) / 0.00064516, 0.1419, 1e-3);
/* cushion energy: 500 kg at 0.5 m/s, 30 mm, horizontal, no drive */
const c = CD.cushion(500, 0.5, 0.03, 0.005, 0, 0, 0); near("cushion Ek", c.Ek, 62.5); near("cushion p avg", c.pAvg, 62.5 / (0.005 * 0.03));
/* natural frequency: symmetric double-rod, mid stroke = minimum: k = 4βA²/(V0+A·S/2)... check with direct formula */
const nf = CD.natFreq(1.4e9, 0.005, 0.005, 0.4, 0, 0, 1000);
near("natural freq symmetric min at mid", nf.f, Math.sqrt(1.4e9 * 2 * 0.005 * 0.005 / (0.005 * 0.2) / 1000) / (2 * PI), 1e-9); near("min at mid-stroke", nf.x, 0.2);
/* standard series sanity */
ok("bores include 100 & 500", CD.BORES.some(x => x.v === 100) && CD.BORES.some(x => x.v === 500));
ok("no bore 60 (ISO 3320:2013 bore list)", !CD.BORES.some(x => x.v === 60));
ok("rods 4..450", CD.RODS[0].v === 4 && CD.RODS[CD.RODS.length - 1].v === 450);
ok("stroke factors 10 rows", CD.STROKE_FACTORS.length === 10);
const mr = CD.minRod(50e3, 3, 206e9, 520e6, 2, 1); ok("minRod meets SF", mr && mr.Pcr / 50e3 >= 3);
/* Baragetti & Villa 2016 (Math. Probl. Eng., Article 3781397), Table 1 actuator: rod 20 mm (Js 7854 mm⁴), cylinder
   25/30 mm (Jc from the stated diameters = 20,586 mm⁴ — Table 1 prints 16,286, inconsistent with its own diameters),
   a = 1163 mm rod, b = 1276 mm cylinder, E = 206,000 MPa, pinned–pinned. Table 3 limit loads: Timoshenko rigid 3855 N;
   "2 wear rings, rod only" Kf = 8071·10³ N·mm/rad → 3111 N; "4 wear rings" Kf = 29777·10³ N·mm/rad → 3629 N. */
{ const Eb = 206000e6, Js = 7854e-12, Jc = Math.PI * (Math.pow(0.030, 4) - Math.pow(0.025, 4)) / 64, sg = [{ L:1.276, EI:Eb * Jc }, { L:1.163, EI:Eb * Js }];
  near("Baragetti rigid (Timoshenko) 3855 N", CD.steppedBuckling(sg, "pin", "pin", 60), 3855, 1e-3);
  near("Baragetti Kf 8071e3 N·mm/rad → 3111 N", CD.steppedBuckling(sg, "pin", "pin", 60, 8071), 3111, 1e-3);
  near("Baragetti Kf 29777e3 N·mm/rad → 3629 N", CD.steppedBuckling(sg, "pin", "pin", 60, 29777), 3629, 1e-3);
  /* Baragetti Eq. 11 (rigid joint characteristic equation) solved independently by scanning + bisection */
  const a = 1.163, b = 1.276, f = P => { const as = Math.sqrt(P / (Eb * Js)), ac = Math.sqrt(P / (Eb * Jc)); return as * (Math.tan(ac * a) - Math.tan(ac * (a + b))) - ac * Math.tan(as * a) * (1 + Math.tan(ac * a) * Math.tan(ac * (a + b))); };
  let root = NaN, pv = f(100); for (let P = 101; P < 20000; P++){ const v = f(P); if (pv * v < 0 && Math.abs(v) < 50 && Math.abs(pv) < 50){ let L = P - 1, H = P; for (let k = 0; k < 60; k++){ const M = (L + H) / 2; if (f(L) * f(M) <= 0) H = M; else L = M; } root = (L + H) / 2; break; } pv = v; }
  near("FE rigid = Baragetti Eq. 11 root", CD.steppedBuckling(sg, "pin", "pin", 60), root, 1e-3);
  const r0 = CD.steppedBuckling(sg, "pin", "pin", 60), k1 = CD.steppedBuckling(sg, "pin", "pin", 60, 1e3), k2 = CD.steppedBuckling(sg, "pin", "pin", 60, 1e6);
  ok("joint stiffness monotonic and bounded by rigid", k1 < k2 && k2 <= r0 * 1.000001);
}
/* cushion gravity sign: load moving DOWN into the cushion (angle +90) must absorb more energy than horizontal */
{ const down = CD.cushion(500, 0.2, 0.025, 0.004, 0, 90, 0), flat = CD.cushion(500, 0.2, 0.025, 0.004, 0, 0, 0);
  near("cushion: falling load adds m·g·s", down.E - flat.E, 500 * CD.G * 0.025); }
/* DNV-GL CG-0194 (Jul 2017) §4.2 — transcription by Satureday, checked three ways:
   (1) the printed mm/kN form [F_E = E·π²/(1000·L·Z)] computed here by hand equals the engine's SI form;
   (2) I1 = I2 reduces to Euler;  (3) DNV ≥ exact rigid-joint load (assumed-mode upper estimate), within 20 %. */
{ const Emm = 206000, I1 = Math.PI * (Math.pow(30, 4) - Math.pow(25, 4)) / 64, I2 = Math.PI * Math.pow(20, 4) / 64, L1 = 1276, L2 = 1163, L = L1 + L2;
  const Zmm = L1 / I1 + L2 / I2 + (1 / I2 - 1 / I1) * L / (2 * Math.PI) * Math.sin(2 * Math.PI * L1 / L), FEkN = Emm * Math.PI * Math.PI / (1000 * L * Zmm);
  const si = CD.dnvBuckling(206e9, I1 * 1e-12, I2 * 1e-12, L1 / 1000, L2 / 1000);
  near("DNV printed kN form = engine SI form", si.FE / 1000, FEkN, 1e-9);
  near("DNV Baragetti actuator 4.054 kN", si.FE / 1000, 4.054, 1e-3);
  near("DNV with I1 = I2 equals Euler", CD.dnvBuckling(206e9, 1e-6, 1e-6, 1, 1).FE, Math.PI * Math.PI * 206e9 * 1e-6 / 4, 1e-12);
  const ex = CD.steppedBuckling([{ L:L1 / 1000, EI:206e9 * I1 * 1e-12 }, { L:L2 / 1000, EI:206e9 * I2 * 1e-12 }], "pin", "pin", 60);
  [1, 0.7, 0.5, 2].forEach(K => near("DNV §4.4 effective lengths, I1 = I2, K = " + K + " → Euler π²EI/(K·L)²", CD.dnvBuckling(206e9, 1e-6, 1e-6, 1, 1, K).FE, Math.PI * Math.PI * 206e9 * 1e-6 / Math.pow(2 * K, 2), 1e-12));
  ok("DNV ≥ exact rigid-joint load and within 20 %", si.FE >= ex * 0.999 && si.FE <= ex * 1.2); }
ok("NFPA bores 1.5–14", CD.NFPA_BORES.join() === "1.5,2,2.5,3.25,4,5,6,7,8,10,12,14");
ok("NFPA rods 0.625–5.5", CD.NFPA_RODS.join() === "0.625,1,1.375,1.75,2,2.5,3,3.5,4,4.5,5,5.5");
if (fails.length){ console.log("FAIL " + fails.length + "/" + n + "\n" + fails.join("\n")); process.exit(1); }
console.log("OK " + n + " engine checks");
