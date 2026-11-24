/* BEGIN ENGINE — Cylinder Designer calculation engine. Pure functions, SI units throughout:
   N, m, Pa, m/s, kg, J, m³/s. Every formula is cited at its function; MUSE-NOTE.md lists the sources. */
var CD = (function(){
  "use strict";
  var PI = Math.PI, G = 9.80665;
  function area(d){ return PI * d * d / 4; }

  /* ---- Standard series (two sources each — see MUSE-NOTE) ----
     ISO 3320:2013 Table 2 bores (mm); values in () are non-preferred. Source pair: ISO 3320:2013 preview text +
     ISO 3320:1987 / IS 8208 (identical series). AL 60 withheld: DIN ISO 3320:2013 says it was deleted, the ISO 2013
     preview text lists it — conflict, named gap. */
  var BORES = [8,10,12,16,20,25,32,40,50,63,80,[90],100,[110],125,[140],160,[180],200,[220],250,[280],320,[360],400,[450],500];
  /* ISO 3320:2013 Table 3 rods (mm): ISO 3320:1987 Table 2 + the 2013 changes stated by DIN ISO 3320:2013
     ((30), (60), 400, 450 added). */
  var RODS = [4,5,6,8,10,12,14,16,18,20,22,25,28,[30],32,36,40,45,50,56,[60],63,70,80,90,100,110,125,140,160,180,200,220,250,280,320,360,400,450];
  /* ISO 4393:2015 Table 1 strokes (mm); extension by rounded R10 (ISO 497) — Atos KTC catalogue lists the same
     series extended to 1250. */
  var STROKES = [5,10,25,50,80,100,125,160,200,250,320,400,500,630,800,1000,1250];
  /* NFPA inch series (inches). Bores 1.50–8.00: Parker Series H (HY08-AC1314), Bosch Rexroth NFPA (RA 17038),
     Hydraulic Cylinders Inc. NFPA catalogue — all three agree. Rods 0.625–2.000: same three; 2.50–4.00: Parker Series H +
     an independent NFPA size listing. Withheld (one source only): bore 7.00, rods 4.50–5.50, bores above 8.00 (GAPS.md). */
  var NFPA_BORES = [1.5,2,2.5,3.25,4,5,6,8];
  var NFPA_RODS = [0.625,1,1.375,1.75,2,2.5,3,3.5,4];
  function flat(list){ return list.map(function(v){ return Array.isArray(v) ? { v:v[0], np:true } : { v:v, np:false }; }); }

  /* ---- Stroke factors (catalogue piston-rod selection method). Basic length = (net stroke + extra rod
     extension) × stroke factor. Identical tables: Parker 2H (HY07-1110), Parker 0106, Norgren NFPA, Atos KTC. */
  var STROKE_FACTORS = [
    { id:"fx-fg", group:"Fixed mount — head / cap flange, tie rods, side lugs (TB, TD, J, JB, JJ, C, F, G)", rod:"Fixed and rigidly guided", f:0.5 },
    { id:"fx-pg", group:"Fixed mount — head / cap flange, tie rods, side lugs (TB, TD, J, JB, JJ, C, F, G)", rod:"Pivoted and rigidly guided", f:0.7 },
    { id:"fx-sn", group:"Fixed mount — head / cap flange, tie rods, side lugs (TB, TD, J, JB, JJ, C, F, G)", rod:"Supported but not rigidly guided", f:2.0 },
    { id:"cf-fg", group:"Cap-end fixed mount (TC, H, HB, HH)", rod:"Fixed and rigidly guided", f:1.0 },
    { id:"cf-pg", group:"Cap-end fixed mount (TC, H, HB, HH)", rod:"Pivoted and rigidly guided", f:1.5 },
    { id:"cf-sn", group:"Cap-end fixed mount (TC, H, HB, HH)", rod:"Supported but not rigidly guided", f:4.0 },
    { id:"ht-pg", group:"Head trunnion (D)", rod:"Pivoted and rigidly guided", f:1.0 },
    { id:"it-pg", group:"Intermediate trunnion (DD)", rod:"Pivoted and rigidly guided", f:1.5 },
    { id:"cp-pg", group:"Cap trunnion or cap clevis (DB, BB, SB)", rod:"Pivoted and rigidly guided", f:2.0 },
    { id:"cp-sn", group:"Cap trunnion or cap clevis (DB, BB, SB)", rod:"Supported but not rigidly guided", f:4.0 }
  ];
  /* Stop tube: 1 in for each 10 in, or fraction, by which the basic length exceeds 40 in.
     Peninsular Cylinder, Milwaukee Cylinder, Advance Automation, ARO catalogues agree. */
  function stopTube(basicLength_m){
    var L = basicLength_m / 0.0254; if (!(L > 40)) return 0;
    return Math.ceil((L - 40) / 10 - 1e-9) * 0.0254;
  }

  /* ---- Forces, speeds, flows (fluid-power basics) ---- */
  function forces(D, d, p, eff){
    eff = eff == null ? 1 : eff;
    var A1 = area(D), A2 = A1 - area(d);
    return { A1:A1, A2:A2, Ar:area(d), ratio:A1 / A2, push:p * A1 * eff, pull:p * A2 * eff };
  }
  function requiredBore(F, p, eff){ return Math.sqrt(4 * F / (PI * p * (eff || 1))); }
  function speeds(Q, A1, A2){ return { ext:Q / A1, ret:Q / A2 }; }
  /* Rod-end pressure with meter-out (no external load, worst case): p2 = p1·A1/A2 (Parker 0900 engineering data). */
  function intensification(p1, A1, A2, F){ return (p1 * A1 - (F || 0)) / A2; }
  /* Regenerative extend: effective area = rod area. */
  function regen(Q, p, d){ var a = area(d); return { speed:Q / a, force:p * a }; }
  function hydPower(p, Q, eta){ return p * Q / (eta || 1); }

  /* ---- Column buckling ----
     Euler: Pcr = π²EI/(KL)²; Johnson (short columns): Pcr = A·Sy·[1 − Sy·(KL/r)²/(4π²E)] for KL/r < √(2π²E/Sy).
     (Shigley; Machinery's Handbook.) Solid round rod: I = πd⁴/64, r = d/4. */
  function rodBuckling(d, E, Sy, L, K){
    var A = area(d), I = PI * Math.pow(d, 4) / 64, r = d / 4, Le = K * L, s = Le / r;
    var sc = Math.sqrt(2 * PI * PI * E / Sy), euler = PI * PI * E * I / (Le * Le);
    var johnson = A * Sy * (1 - Sy * s * s / (4 * PI * PI * E));
    var useJ = s < sc;
    return { Pcr:useJ ? johnson : euler, mode:useJ ? "Johnson (short column — yield governs)" : "Euler (slender column)",
      slenderness:s, transition:sc, euler:euler, johnson:johnson, I:I, A:A };
  }
  /* Smallest standard rod (ISO 3320) that gives the required buckling safety factor. */
  function minRod(F, SF, E, Sy, L, K, minD){
    var list = RODS.map(function(v){ return Array.isArray(v) ? v[0] : v; }).sort(function(a,b){ return a - b; });
    for (var i = 0; i < list.length; i++){ var d = list[i] / 1000; if (minD && d < minD) continue;
      var b = rodBuckling(d, E, Sy, L, K); if (b.Pcr / F >= SF) return { d:d, Pcr:b.Pcr, b:b }; }
    return null;
  }

  /* Stepped column (tube + rod) — finite elements, Euler–Bernoulli beam with geometric stiffness; smallest
     eigenvalue of K·φ = λ·Kg·φ by inverse iteration. Segments listed from end A (mount) to end B (rod end).
     Rigid joint at the gland: real cylinders have bearing clearance, so this is UNCONSERVATIVE vs NFPA T3.6.37
     (informative only; the rod-only check governs). End conditions: "pin", "fixed", "free". */
  function steppedBuckling(segs, endA, endB, nPer){
    nPer = nPer || 40; var nodes = [0], EI = [];
    segs.forEach(function(s){ var h = s.L / nPer; for (var i = 0; i < nPer; i++){ nodes.push(nodes[nodes.length - 1] + h); EI.push(s.EI); } });
    var ne = EI.length, n = 2 * (ne + 1);
    var K = zeros(n), Kg = zeros(n);
    for (var e = 0; e < ne; e++){
      var L = nodes[e + 1] - nodes[e], k = EI[e] / (L * L * L), g = 1 / (30 * L), L2 = L * L;
      var ke = [[12,6*L,-12,6*L],[6*L,4*L2,-6*L,2*L2],[-12,-6*L,12,-6*L],[6*L,2*L2,-6*L,4*L2]];
      var kg = [[36,3*L,-36,3*L],[3*L,4*L2,-3*L,-L2],[-36,-3*L,36,-3*L],[3*L,-L2,-3*L,4*L2]];
      for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++){ K[2*e+a][2*e+b] += k * ke[a][b]; Kg[2*e+a][2*e+b] += g * kg[a][b]; }
    }
    var fixedDof = [];
    function bc(t, node){ if (t === "pin" || t === "fixed") fixedDof.push(2 * node); if (t === "fixed") fixedDof.push(2 * node + 1); }
    bc(endA, 0); bc(endB, ne);
    var free = []; for (var i = 0; i < n; i++) if (fixedDof.indexOf(i) < 0) free.push(i);
    var Kr = free.map(function(i){ return free.map(function(j){ return K[i][j]; }); });
    var Gr = free.map(function(i){ return free.map(function(j){ return Kg[i][j]; }); });
    var LU = lu(Kr), m = free.length, x = [], lam = 0, prev = 0;
    for (i = 0; i < m; i++) x.push(Math.sin((i + 1) * 1.37) + 1);
    for (var it = 0; it < 500; it++){
      var y = luSolve(LU, mv(Gr, x)), nr = Math.sqrt(dot(y, y)); for (i = 0; i < m; i++) y[i] /= nr; x = y;
      lam = dot(x, mv(Kr, x)) / dot(x, mv(Gr, x));
      if (it > 5 && Math.abs(lam - prev) <= 1e-10 * Math.abs(lam)) break; prev = lam;
    }
    return lam;
  }
  function zeros(n){ var a = []; for (var i = 0; i < n; i++){ a.push(new Array(n).fill(0)); } return a; }
  function mv(A, x){ return A.map(function(r){ var s = 0; for (var j = 0; j < r.length; j++) s += r[j] * x[j]; return s; }); }
  function dot(a, b){ var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function lu(A){ var n = A.length, M = A.map(function(r){ return r.slice(); }), P = []; for (var i = 0; i < n; i++) P.push(i);
    for (var k = 0; k < n; k++){ var p = k, mx = Math.abs(M[k][k]); for (i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > mx){ mx = Math.abs(M[i][k]); p = i; }
      if (p !== k){ var t = M[k]; M[k] = M[p]; M[p] = t; t = P[k]; P[k] = P[p]; P[p] = t; }
      for (i = k + 1; i < n; i++){ var f = M[i][k] / M[k][k]; M[i][k] = f; for (var j = k + 1; j < n; j++) M[i][j] -= f * M[k][j]; } }
    return { M:M, P:P }; }
  function luSolve(F, b){ var n = b.length, M = F.M, y = [], x = new Array(n), i, j;
    for (i = 0; i < n; i++){ var s = b[F.P[i]]; for (j = 0; j < i; j++) s -= M[i][j] * y[j]; y.push(s); }
    for (i = n - 1; i >= 0; i--){ s = y[i]; for (j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; } return x; }

  /* ---- Tube (barrel) under internal pressure ----
     Barlow (thin wall, OD basis): σ = p·Do/(2t). Lamé thick wall at the bore: σθ = p(ro²+ri²)/(ro²−ri²), σr = −p,
     closed ends σz = p·ri²/(ro²−ri²); von Mises from the three. Radial growth of the bore (closed ends):
     u = p·ri·[(1−2ν)ri² + (1+ν)ro²] / [E(ro²−ri²)]. (Shigley; Roark.) */
  function tube(p, Di, Do, E, nu){
    var ri = Di / 2, ro = Do / 2, t = ro - ri, q = ro * ro - ri * ri;
    var st = p * (ro * ro + ri * ri) / q, sr = -p, sz = p * ri * ri / q;
    var vm = Math.sqrt(0.5 * ((st - sr) * (st - sr) + (sr - sz) * (sr - sz) + (sz - st) * (sz - st)));
    var u = E ? p * ri * ((1 - 2 * nu) * ri * ri + (1 + nu) * ro * ro) / (E * q) : null;
    return { t:t, barlow:p * Do / (2 * t), hoop:st, radial:sr, axial:sz, vonMises:vm, growth:u };
  }
  /* Minimum wall for an allowable stress S (Lamé hoop at the bore): ro = ri·√((S+p)/(S−p)). */
  function tubeMinWall(p, Di, S){ if (S <= p) return Infinity; return Di / 2 * (Math.sqrt((S + p) / (S - p)) - 1); }

  /* ---- Flat circular end (cap / bottom) under uniform pressure, radius a ----
     Clamped edge: σmax = 3·p·a²/(4t²) at the edge. Simply supported: σmax = 3(3+ν)·p·a²/(8t²) at the centre.
     (Roark Table 11.2; RoyMech and Engineers Edge give the same.) */
  function plate(p, a, t, edge, nu){ nu = nu == null ? 0.3 : nu;
    var c = edge === "simple" ? 3 * (3 + nu) / 8 : 0.75; return { stress:c * p * a * a / (t * t), c:c }; }
  function plateMinT(p, a, S, edge, nu){ nu = nu == null ? 0.3 : nu; var c = edge === "simple" ? 3 * (3 + nu) / 8 : 0.75; return a * Math.sqrt(c * p / S); }
  /* Circumferential weld carrying the end load p·A1: shear on the throat, τ = F/(π·Dw·a). */
  function weld(p, Di, Dw, throat){ var F = p * area(Di); return { F:F, shear:F / (PI * Dw * throat) }; }

  /* ---- Threads, pins, tie rods ----
     Tensile stress area: metric As = π/4·(d − 0.9382P)² (ISO 898-1); inch As = 0.7854·(D − 0.9743/n)² in²
     (ASME B1.1 / FED-STD-H28). */
  function stressAreaMetric(d, P){ var x = d - 0.9382 * P; return PI / 4 * x * x; }
  function stressAreaInch(D_in, tpi){ var x = D_in - 0.9743 / tpi; return 0.7854 * x * x * 0.0254 * 0.0254; }
  function pin(F, d, Lb, shearPlanes){ shearPlanes = shearPlanes || 2;
    return { shear:F / (shearPlanes * area(d)), bearing:Lb ? F / (d * Lb) : null }; }
  /* Tie rods: the cap carries p·A1 (bore area); shared by n rods. */
  function tieRods(p, D, n, As){ var F = p * area(D); return { total:F, perRod:F / n, stress:F / n / As }; }

  /* ---- Cushioning (work–energy) ----
     Energy to absorb over the cushion length s: E = ½·m·v² + (F_drive + m·g·sinθ − F_friction)·s.
     Average cushion pressure on the cushioned annulus Ac: p̄ = E/(Ac·s). The pressure on the driving side adds to
     the load (Hydraulics & Pneumatics, "Avoiding problems with hydraulic cylinders"; Parker 0900 method).
     Peak pressure depends on the cushion profile and is higher than the average. */
  function cushion(m, v, s, Ac, Fdrive, angleDeg, Ffric){
    var Fg = m * G * Math.sin((angleDeg || 0) * PI / 180), Ek = 0.5 * m * v * v;
    var E = Ek + ((Fdrive || 0) + Fg - (Ffric || 0)) * s;
    return { Ek:Ek, E:E, pAvg:E / (Ac * s), decel:v * v / (2 * s), time:2 * s / v };
  }

  /* ---- Ports and lines ----  v = Q / (π d²/4). */
  function velocity(Q, d){ return Q / area(d); }
  /* Guidance bands (m/s) — two independent publications, shown side by side, not merged:
     STLE "Cardinal sins of hydraulic system design": inlet 2–4 ft/s, return 10–15 ft/s, pressure 15–20 ft/s
     (500–2000 psi), 25 ft/s (> 3000 psi). HydraulicSupermarket: suction 0.6–1.2, return 1.5–4, pressure 2–5.5 m/s. */
  var VEL_GUIDE = {
    pressure:[{ src:"STLE", lo:15 * 0.3048, hi:20 * 0.3048, note:"500–2000 psi; 25 ft/s above 3000 psi" }, { src:"HydraulicSupermarket", lo:2, hi:5.5 }],
    ret:[{ src:"STLE", lo:10 * 0.3048, hi:15 * 0.3048 }, { src:"HydraulicSupermarket", lo:1.5, hi:4 }]
  };

  /* ---- Dynamics: hydraulic natural frequency ----
     Oil spring k(x) = β·(A1²/V1(x) + A2²/V2(x)), V1 = V1dead + A1·x, V2 = V2dead + A2·(S − x); ωn = √(k/m)
     (H. J. Ulrich 1971; HAWE fluid lexicon). Minimum over the stroke is reported. Rule of thumb (Delta Motion):
     natural frequency ≥ 4 × the frequency of acceleration. */
  function natFreq(beta, A1, A2, S, V1d, V2d, m){
    var best = null;
    for (var i = 0; i <= 200; i++){ var x = S * i / 200, V1 = V1d + A1 * x, V2 = V2d + A2 * (S - x);
      if (V1 <= 0 || V2 <= 0) continue; var k = beta * (A1 * A1 / V1 + A2 * A2 / V2), f = Math.sqrt(k / m) / (2 * PI);
      if (!best || f < best.f) best = { f:f, x:x, k:k }; }
    return best;
  }
  /* Oil compression on the cap side at pressure p: ΔV = V·p/β (bulk modulus). */
  function compression(V, p, beta){ return V * p / beta; }

  return { G:G, area:area, BORES:flat(BORES), RODS:flat(RODS), NFPA_BORES:NFPA_BORES, NFPA_RODS:NFPA_RODS, STROKES:STROKES, STROKE_FACTORS:STROKE_FACTORS, stopTube:stopTube,
    forces:forces, requiredBore:requiredBore, speeds:speeds, intensification:intensification, regen:regen, hydPower:hydPower,
    rodBuckling:rodBuckling, minRod:minRod, steppedBuckling:steppedBuckling, tube:tube, tubeMinWall:tubeMinWall,
    plate:plate, plateMinT:plateMinT, weld:weld, stressAreaMetric:stressAreaMetric, stressAreaInch:stressAreaInch,
    pin:pin, tieRods:tieRods, cushion:cushion, velocity:velocity, VEL_GUIDE:VEL_GUIDE, natFreq:natFreq, compression:compression };
})();
/* END ENGINE */
