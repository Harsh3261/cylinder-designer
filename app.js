/* Cylinder Designer — UI. State is kept in SI units; the unit toggle only changes what is shown. */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]; }); };

  /* ---------- units ---------- */
  var U = {
    len:{ m:[0.001,"mm",1], i:[0.0254,"in",3] }, force:{ m:[1000,"kN",2], i:[4.4482216,"lbf",0] },
    press:{ m:[1e5,"bar",1], i:[6894.757,"psi",0] }, stress:{ m:[1e6,"MPa",0], i:[6.894757e6,"ksi",1] },
    mod:{ m:[1e9,"GPa",0], i:[6.894757e9,"Msi",1] }, flow:{ m:[1/60000,"L/min",1], i:[6.30902e-5,"gpm",2] },
    speed:{ m:[0.001,"mm/s",0], i:[0.0254,"in/s",2] }, mass:{ m:[1,"kg",0], i:[0.45359237,"lb",0] },
    energy:{ m:[1,"J",0], i:[1.3558179,"ft·lbf",0] }, vol:{ m:[0.001,"L",2], i:[0.003785412,"gal",3] },
    power:{ m:[1000,"kW",2], i:[745.69987,"hp",2] }, area:{ m:[1e-4,"cm²",2], i:[6.4516e-4,"in²",3] },
    vel:{ m:[1,"m/s",2], i:[0.3048,"ft/s",1] }, accel:{ m:[1,"m/s²",2], i:[0.3048,"ft/s²",1] },
    time:{ m:[1,"s",2], i:[1,"s",2] }, freq:{ m:[1,"Hz",1], i:[1,"Hz",1] }, deg:{ m:[1,"°",0], i:[1,"°",0] },
    ratio:{ m:[1,"",3], i:[1,"",3] }, rstiff:{ m:[1,"N·m/rad",0], i:[0.112984829,"lbf·in/rad",0] }, um:{ m:[1e-6,"µm",1], i:[2.54e-5,"thou",2] }, n:{ m:[1,"",0], i:[1,"",0] }
  };
  var sys = "m";
  function uf(q){ return U[q][sys]; }
  function fmt(v, q, dp){ if (v == null || !isFinite(v)) return "—"; var u = uf(q), x = v / u[0], d = dp == null ? u[2] : dp;
    if (Math.abs(x) >= 1e5) d = 0; return x.toLocaleString("en-US", { minimumFractionDigits:d, maximumFractionDigits:d }) + (u[1] ? " " + u[1] : ""); }
  function num(v, dp){ return isFinite(v) ? v.toLocaleString("en-US", { maximumFractionDigits:dp == null ? 2 : dp }) : "—"; }

  /* ---------- inputs (SI defaults = the worked example) ---------- */
  var F = [
    /* 1 application */
    ["Fpush","force","Force needed to push (extend)",80e3,"External load the rod must push, without the weight of the load — weight is added from the direction below."],
    ["Fpull","force","Force needed to pull (retract)",30e3,""],
    ["mass","mass","Moving mass (load + rod + piston)",500,"Used for acceleration, cushioning and natural frequency."],
    ["dir","sel","Extend direction",["horizontal","Horizontal"],[["horizontal","Horizontal"],["up","Vertical — extends upward (lifts the load)"],["down","Vertical — extends downward"]]],
    ["stroke","len","Stroke",0.8,"ISO 4393 preferred strokes are offered in the list."],
    ["vExt","speed","Extend speed wanted",0.1,""],
    ["vRet","speed","Retract speed wanted",0.15,""],
    ["p","press","Working pressure",160e5,"Pressure available at the cylinder when it does the work."],
    ["pmax","press","Maximum pressure (relief setting)",200e5,"The highest pressure the cylinder can ever see — all strength checks use this."],
    ["eff","ratio","Mechanical efficiency",1,"1.00 = theoretical. Enter less than 1 to allow for seal friction."],
    ["meterOut","sel","Can the rod side be metered out or blocked?",["yes"],[["yes","Yes / not sure — check intensification (worst case)"],["no","No — rod side always free to tank"]]],
    /* 2 bore & rod */
    ["D","len","Bore",0.1,""], ["d","len","Rod diameter",0.07,""],
    /* 3 flow */
    ["Q","flow","Pump flow available (optional)",null,"Leave blank to size the pump from the speeds."],
    ["etaP","ratio","Pump overall efficiency",0.85,"For input-power estimate only."],
    /* 4 buckling */
    ["mount","sel","Mounting and rod-end connection",["cp-pg"],null],
    ["ext","len","Extra rod extension beyond standard",0,"Added to the stroke for the basic length."],
    ["Lc","len","Pin-to-pin length, retracted",1.1,"Mount centre to rod-end centre with the rod fully in."],
    ["K","sel","End fixity for the column check",["1"],[["1","Pinned – pinned (K = 1.0)"],["0.7","Fixed – pinned (K = 0.7)"],["0.5","Fixed – fixed (K = 0.5)"],["2","Fixed – free (K = 2.0)"]]],
    ["Erod","mod","Rod elastic modulus",206e9,"Steel is roughly 200–210 GPa."],
    ["Syrod","stress","Rod minimum yield strength",520e6,"Example value — enter your rod grade's minimum yield (Materials Atlas)."],
    ["SFb","ratio","Required buckling safety factor",3,"Set to your company or customer requirement."],
    ["stick","len","Rod stick-out when retracted (for the tube + rod model)",0.06,"Gland face to rod-end centre, rod fully in."],
    ["Kf","rstiff","Gland joint rotational stiffness (optional)",null,"Wear rings and clearance make the rod–tube joint flexible. Baragetti & Villa (2016) report about 8,000–30,000 N·m/rad for a 20 mm rod; leave blank if unknown."],
    /* 5 tube */
    ["Do","len","Tube outside diameter",0.133,""],
    ["Sytube","stress","Tube minimum yield strength",355e6,"Example value — enter your tube grade's minimum yield."],
    ["Etube","mod","Tube elastic modulus",206e9,""],
    ["nu","ratio","Poisson's ratio",0.3,""],
    ["SFt","ratio","Required safety factor on yield (tube, ends, welds)",2,"Set to your requirement."],
    ["ptest","press","Test / proof pressure (optional)",null,"If your spec calls for a proof test, the tube is also checked at that pressure."],
    /* 6 ends */
    ["tcap","len","Cap (bottom) thickness",0.03,"Solid flat end closing the bore."],
    ["edge","sel","Cap edge condition",["fixed"],[["fixed","Clamped / welded all round (fixed edge)"],["simple","Simply supported (free to rotate)"]]],
    ["Sycap","stress","Cap minimum yield strength",355e6,"Example value."],
    ["weldA","len","Cap weld throat (0 = no weld)",0.008,"Circumferential weld joining cap and tube."],
    ["weldS","stress","Allowable weld shear stress",120e6,"Example value — use your welding procedure's allowable."],
    /* 7 rod end */
    ["thrSys","sel","Thread system (rod end and tie rods)",["metric"],[["metric","Metric (d × pitch)"],["inch","Inch (D – TPI)"]]],
    ["thrD","len","Thread major diameter",0.042,""],
    ["thrP","len","Thread pitch (metric)",0.002,""],
    ["thrTPI","n","Threads per inch (inch)",12,""],
    ["pinD","len","Rod-end pin diameter",0.04,""],
    ["pinL","len","Pin bearing length (in the rod eye)",0.04,""],
    ["pinPlanes","sel","Pin shear planes",["2"],[["2","Double shear (clevis)"],["1","Single shear"]]],
    ["Sypin","stress","Pin minimum yield strength",640e6,"Example value."],
    ["neck","len","Rod neck diameter at the rod-end thread relief (optional)",null,"Smallest diameter of the undercut behind the thread. Blank = no undercut."],
    ["pistD","len","Piston-end thread major diameter (rod into piston / nut)",0.036,"Thread holding the piston on the rod."],
    ["pistP","len","Piston-end thread pitch (metric)",0.002,""],
    ["pistTPI","n","Piston-end threads per inch (inch)",12,""],
    /* 8 tie rods */
    ["constr","sel","Construction",["welded"],[["welded","Welded (cap welded to tube)"],["tierod","Tie-rod"],["mill","Mill type / bolted flanges"]]],
    ["nTie","n","Number of tie rods / bolts",4,""],
    ["tieD","len","Tie-rod thread major diameter",0.016,""],
    ["tieP","len","Tie-rod thread pitch (metric)",0.002,""],
    ["tieTPI","n","Tie-rod threads per inch (inch)",18,""],
    ["Sytie","stress","Tie-rod minimum yield strength",640e6,"Example value."],
    /* 9 cushions */
    ["cushCap","len","Cap-end cushion length (0 = none)",0.025,""],
    ["spear","len","Cap cushion spear diameter",0.04,"The spear enters the cap; the trapped annulus around it builds the cushion pressure."],
    ["cushRod","len","Rod-end cushion length (0 = none)",0.025,""],
    ["collar","len","Rod cushion collar diameter",0.072,"Must be larger than the rod. A big collar leaves a small trapped annulus and a high cushion pressure."],
    ["pcush","press","Allowable cushion-chamber pressure",null,"The pressure your tube, cap/head and seals are rated for in the cushion chamber. Cushion pressure is always above the drive pressure × (driven area ÷ cushion area)."],
    /* 10 ports */
    ["portCap","len","Cap port passage diameter",0.02,"Smallest bore in the port path (drilling, fitting)."],
    ["portRod","len","Rod port passage diameter",0.02,""],
    /* 11 dynamics */
    ["beta","mod","Effective bulk modulus of the oil",1.4e9,"Mineral oil is typically 1.4–1.7 GPa; entrained air and hoses lower it."],
    ["V1d","vol","Dead volume, cap side (lines + port)",0.0005,""],
    ["V2d","vol","Dead volume, rod side (lines + port)",0.0005,""],
    ["fAcc","freq","Frequency of acceleration wanted (optional)",null,"Natural frequency should be at least 4× this (Delta Motion rule of thumb)."],
    /* 12 head and piston retention (thread stripping: Machinery's Handbook / FED-STD-H28; rings: Smalley / Rotor Clip).
       Limit dimensions come from your thread tables or gauge sheet (SPC Tools has ISO 965 / ASME B1.1 limits). */
    ["pjLe","len","Piston thread engagement length (optional)",null,"Length of full thread engaged between the rod and the piston or nut. Blank = skip the stripping check."],
    ["pjKn","len","Piston / nut internal thread — minor diameter, max (Kn max)",null,"From the thread class limits (ISO 965 D1 max / ASME B1.1 internal minor max)."],
    ["pjEs","len","Rod external thread — pitch diameter, min (Es min)",null,"ISO 965 d2 min / ASME B1.1 external pitch min."],
    ["pjDs","len","Rod external thread — major diameter, min (Ds min)",null,"ISO 965 d min / ASME B1.1 external major min."],
    ["pjEn","len","Piston / nut internal thread — pitch diameter, max (En max)",null,"ISO 965 D2 max / ASME B1.1 internal pitch max."],
    ["Synut","stress","Piston / nut minimum yield strength",null,"Enter your piston or nut grade."],
    ["headType","sel","How the head (gland) is held in the tube",["threaded"],[["threaded","Threaded — gland screws into the tube"],["ring","Retaining ring — flat or spiral ring in a groove"],["bolted","Bolted / tie-rod head — see step 8"]]],
    ["hdP","len","Head thread pitch (metric)",null,""],
    ["hdTPI","n","Head threads per inch (inch)",null,""],
    ["hdLe","len","Head thread engagement length",null,"Full thread engaged between gland and tube."],
    ["hdKn","len","Tube internal thread — minor diameter, max (Kn max)",null,""],
    ["hdEs","len","Gland external thread — pitch diameter, min (Es min)",null,""],
    ["hdDs","len","Gland external thread — major diameter, min (Ds min)",null,""],
    ["hdEn","len","Tube internal thread — pitch diameter, max (En max)",null,""],
    ["Sygland","stress","Gland minimum yield strength",null,"The tube side uses the tube yield from step 5."],
    ["wrD","len","Bore diameter at the ring groove",null,"Housing (tube) diameter where the ring sits."],
    ["wrT","len","Ring thickness",null,""],
    ["wrG","len","Groove depth",null,""],
    ["wrSs","stress","Ring material shear strength",null,"From the ring maker's data. The groove side uses the tube yield from step 5."],
    /* FEA tab — everything else comes from the Design inputs */
    ["feaLoad","sel","Axial load on the rod",["stall"],[["stall","Stall push at relief (worst case)"],["work","Push at working pressure"],["none","None (bending only)"]]],
    ["feaSide","force","Side load at the rod end (optional)",0,"A sideways force at the rod eye — misalignment, a guided load pushing back."],
    ["feaWt","sel","Self-weight",["auto"],[["auto","Automatic — on when the cylinder is horizontal"],["on","On"],["off","Off"]]],
    ["rhoS","mass","Steel density (per m³)",7850,"kg per cubic metre."],
    ["rhoO","mass","Oil density (per m³)",870,"kg per cubic metre; the bore is taken as full of oil."],
    ["feaN","n","Elements per segment",20,"More elements = finer result; capped at 60 so phones stay quick."]
  ];
  var FD = {}; F.forEach(function(f){ var sel = f[1] === "sel" && Array.isArray(f[4]); FD[f[0]] = { k:f[0], q:f[1], label:f[2], def:f[3], hint:sel ? (f[5] || "") : f[4], opts:sel ? f[4] : f[5] }; });
  FD.mount.opts = CD.STROKE_FACTORS.map(function(s){ return [s.id, s.group + " · rod: " + s.rod + " · factor " + s.f.toFixed(1)]; });
  var S = {};
  function defaults(){ F.forEach(function(f){ var d = FD[f[0]]; S[d.k] = d.q === "sel" ? d.def[0] : d.def; }); }
  /* Inch worked example (NFPA sizes) — loaded by "Load the example" when inch units are on. */
  var IN = 0.0254, PSI = 6894.757, LBF = 4.4482216;
  var EX_INCH = { Fpush:18000 * LBF, Fpull:6500 * LBF, mass:1100 * 0.45359237, stroke:24 * IN, vExt:4 * IN, vRet:6 * IN, p:2300 * PSI, pmax:2900 * PSI,
    D:4 * IN, d:2.5 * IN, Lc:36 * IN, stick:2.5 * IN, ext:0, Do:5.25 * IN, tcap:1.25 * IN, weldA:0.3125 * IN, thrSys:"inch", thrD:1.875 * IN, thrTPI:12,
    pinD:1.75 * IN, pinL:1.75 * IN, pistD:1.5 * IN, pistTPI:12, tieD:0.625 * IN, tieTPI:18, cushCap:1 * IN, spear:1.5 * IN, cushRod:1 * IN, collar:2.625 * IN,
    portCap:0.75 * IN, portRod:0.75 * IN, V1d:30 * 1.6387e-5, V2d:30 * 1.6387e-5 };
  function loadExample(){ defaults(); if (sys === "i") for (var k in EX_INCH) S[k] = EX_INCH[k]; }
  defaults();
  try { var saved = JSON.parse(localStorage.getItem("cyl.design") || "null"); if (saved) for (var k in saved) if (k in FD) S[k] = saved[k];
    sys = localStorage.getItem("cyl.units") === "i" ? "i" : "m"; } catch(e){}
  function save(){ try { localStorage.setItem("cyl.design", JSON.stringify(S)); localStorage.setItem("cyl.units", sys); } catch(e){} }

  /* ---------- compute ---------- */
  function calc(){
    var R = {}, g = CD.G, D = S.D, d = S.d;
    R.ok = D > 0 && d > 0 && d < D;
    if (!R.ok) return R;
    var W = S.mass * g;
    R.gPush = S.dir === "up" ? W : S.dir === "down" ? -W : 0; R.gPull = S.dir === "down" ? W : S.dir === "up" ? -W : 0;
    R.needPush = Math.max(0, S.Fpush + R.gPush); R.needPull = Math.max(0, S.Fpull + R.gPull);
    R.f = CD.forces(D, d, S.p, S.eff); R.fmax = CD.forces(D, d, S.pmax, 1);
    R.reqBore = CD.requiredBore(R.needPush || 1e-9, S.p, S.eff);
    R.reqBorePull = R.needPull > 0 ? Math.sqrt(4 * R.needPull / (Math.PI * S.p * S.eff) + d * d) : 0;
    var need = Math.max(R.reqBore, R.reqBorePull);
    R.isoBore = CD.BORES.filter(function(b){ return b.v / 1000 >= need - 1e-9; })[0] || null;
    /* flows */
    R.qExt = R.f.A1 * S.vExt; R.qRet = R.f.A2 * S.vRet; R.qNeed = Math.max(R.qExt, R.qRet);
    R.Q = S.Q > 0 ? S.Q : R.qNeed; R.sp = CD.speeds(R.Q, R.f.A1, R.f.A2);
    R.tExt = S.stroke / R.sp.ext; R.tRet = S.stroke / R.sp.ret;
    R.qOutExt = R.sp.ext * R.f.A2; R.qOutRet = R.sp.ret * R.f.A1;
    R.vol1 = R.f.A1 * S.stroke; R.vol2 = R.f.A2 * S.stroke;
    R.powerHyd = CD.hydPower(S.p, R.Q, 1); R.powerIn = CD.hydPower(S.p, R.Q, S.etaP);
    R.regen = CD.regen(R.Q, S.p, d);
    R.pInt = CD.intensification(S.pmax, R.f.A1, R.f.A2, 0);
    /* buckling */
    R.Lext = S.Lc + S.stroke;
    var sf = CD.STROKE_FACTORS.filter(function(x){ return x.id === S.mount; })[0] || CD.STROKE_FACTORS[0];
    R.sfac = sf; R.basic = (S.stroke + S.ext) * sf.f; R.stopTube = CD.stopTube(R.basic);
    R.Fbuck = R.fmax.push; R.K = +S.K;
    R.buck = CD.rodBuckling(d, S.Erod, S.Syrod, R.Lext, R.K); R.SFbuck = R.buck.Pcr / R.Fbuck;
    R.minRod = CD.minRod(R.Fbuck, S.SFb, S.Erod, S.Syrod, R.Lext, R.K);
    var bc = { "1":["pin","pin"], "0.7":["fixed","pin"], "0.5":["fixed","fixed"], "2":["fixed","free"] }[S.K] || ["pin","pin"];
    if (S.Do > D && S.Lc > S.stick){
      var Lt = S.Lc - S.stick, Lr = S.stick + S.stroke, EIt = S.Etube * Math.PI * (Math.pow(S.Do, 4) - Math.pow(D, 4)) / 64, EIr = S.Erod * R.buck.I;
      try { R.stepped = CD.steppedBuckling([{ L:Lt, EI:EIt }, { L:Lr, EI:EIr }], bc[0], bc[1], 30); } catch(e){ R.stepped = null; }
      R.dnv = CD.dnvBuckling(1, S.Etube * Math.PI * (Math.pow(S.Do, 4) - Math.pow(D, 4)) / 64, EIr, Lt, Lr, +S.K); /* E folded into I: pass EI with E=1; §4.4 effective lengths K·L1, K·L2 */
      if (S.Kf > 0){ try { R.steppedK = CD.steppedBuckling([{ L:Lt, EI:EIt }, { L:Lr, EI:EIr }], bc[0], bc[1], 30, S.Kf); } catch(e){ R.steppedK = null; } }
    }
    /* cushions first: their chamber pressures feed the tube check. Gravity: the cap cushion stops the RETRACT stroke
       (load moving down when the cylinder extends upward → gravity adds); the rod cushion stops the EXTEND stroke. */
    var pc = S.pcush > 0 ? S.pcush : null, gCap = S.dir === "up" ? 90 : S.dir === "down" ? -90 : 0, gRod = -gCap;
    R.pcAllow = pc;
    if (S.cushCap > 0 && S.spear < D){ var Ac1 = R.f.A1 - CD.area(S.spear);
      R.cCap = CD.cushion(S.mass, R.sp.ret, S.cushCap, Ac1, S.pmax * R.f.A2, gCap, 0); }
    if (S.cushRod > 0 && S.collar > d && S.collar < D){ var Ac2 = R.f.A1 - CD.area(S.collar);
      R.cRod = CD.cushion(S.mass, R.sp.ext, S.cushRod, Ac2, S.pmax * R.f.A1, gRod, 0); }
    /* highest pressure any chamber of the tube can see */
    R.pCh = [{ p:S.pmax, why:"relief setting" }];
    if (S.meterOut !== "no") R.pCh.push({ p:R.pInt, why:"rod side, meter-out intensification" });
    if (R.cCap) R.pCh.push({ p:R.cCap.pAvg, why:"cap cushion (average)" });
    if (R.cRod) R.pCh.push({ p:R.cRod.pAvg, why:"rod cushion (average)" });
    R.pChMax = R.pCh.reduce(function(a, b){ return b.p > a.p ? b : a; });
    /* tube */
    if (S.Do > D){
      R.tube = CD.tube(S.pmax, D, S.Do, S.Etube, S.nu); R.SFtube = S.Sytube / R.tube.vonMises;
      R.tubeCh = CD.tube(R.pChMax.p, D, S.Do, S.Etube, S.nu); R.SFtubeCh = S.Sytube / R.tubeCh.vonMises;
      R.minWall = CD.tubeMinWall(R.pChMax.p, D, S.Sytube / S.SFt);
      if (S.ptest > 0){ R.tubeTest = CD.tube(S.ptest, D, S.Do, S.Etube, S.nu); R.SFtest = S.Sytube / R.tubeTest.vonMises; }
    }
    /* ends */
    R.cap = CD.plate(S.pmax, D / 2, S.tcap, S.edge, S.nu); R.SFcap = S.Sycap / R.cap.stress;
    R.capMinT = CD.plateMinT(S.pmax, D / 2, S.Sycap / S.SFt, S.edge, S.nu);
    if (S.constr === "welded" && S.weldA > 0){ R.weld = CD.weld(S.pmax, D, S.Do > D ? S.Do : D, S.weldA); R.SFweld = S.weldS / R.weld.shear; }
    /* rod end */
    R.As = S.thrSys === "inch" ? CD.stressAreaInch(S.thrD / 0.0254, S.thrTPI) : CD.stressAreaMetric(S.thrD, S.thrP);
    R.Fpullmax = R.fmax.pull; R.thrStress = R.Fpullmax / R.As; R.SFthr = S.Syrod / R.thrStress;
    R.thrPush = R.fmax.push / R.As; R.SFthrPush = S.Syrod / R.thrPush;
    R.rodStress = R.fmax.push / R.f.Ar;
    /* RETRACTION = tension: rod body, rod neck at the thread relief, piston-end thread (rod side at relief, cap to tank:
       the piston nut / thread carries p·A2). */
    R.rodTens = R.fmax.pull / R.f.Ar;
    if (S.neck > 0 && S.neck < d) R.neckStress = R.fmax.pull / CD.area(S.neck);
    R.AsP = S.pistD > 0 ? (S.thrSys === "inch" ? CD.stressAreaInch(S.pistD / 0.0254, S.pistTPI) : CD.stressAreaMetric(S.pistD, S.pistP)) : null;
    if (R.AsP) { R.FpistThr = S.pmax * R.f.A2; R.pistStress = R.FpistThr / R.AsP; }
    /* retention (step 12): piston joint carries p·A2 on retraction at relief; the gland carries the highest rod-side
       pressure (relief, or meter-out intensification) × A2. */
    var inchT = S.thrSys === "inch", pitP = inchT ? (S.pistTPI > 0 ? 0.0254 / S.pistTPI : null) : S.pistP;
    R.Fpj = S.pmax * R.f.A2;
    if (S.pjLe > 0 && S.pjKn > 0 && S.pjEs > 0 && S.pjDs > 0 && S.pjEn > 0 && S.Synut > 0 && pitP > 0)
      R.pj = CD.threadStrip(pitP, S.pjLe, S.pjKn, S.pjEs, S.pjDs, S.pjEn, S.Syrod, S.Synut);
    R.pRodMax = S.meterOut !== "no" ? Math.max(S.pmax, R.pInt) : S.pmax; R.Fgl = R.pRodMax * R.f.A2;
    var pitH = inchT ? (S.hdTPI > 0 ? 0.0254 / S.hdTPI : null) : S.hdP;
    if (S.headType === "threaded" && S.hdLe > 0 && S.hdKn > 0 && S.hdEs > 0 && S.hdDs > 0 && S.hdEn > 0 && S.Sygland > 0 && S.Sytube > 0 && pitH > 0)
      R.hd = CD.threadStrip(pitH, S.hdLe, S.hdKn, S.hdEs, S.hdDs, S.hdEn, S.Sygland, S.Sytube);
    if (S.headType === "ring" && S.wrD > 0 && S.wrT > 0 && S.wrG > 0 && S.wrSs > 0 && S.Sytube > 0) R.wr = CD.retainingRing(S.wrD, S.wrT, S.wrG, S.wrSs, S.Sytube);
    var Fpin = Math.max(R.fmax.push, R.fmax.pull);
    R.pin = CD.pin(Fpin, S.pinD, S.pinL, +S.pinPlanes); R.Fpin = Fpin;
    R.SFpin = 0.577 * S.Sypin / R.pin.shear; /* shear yield ≈ 0.577·Sy (von Mises) */
    /* tie rods */
    if (S.constr !== "welded"){ var Ast = S.thrSys === "inch" ? CD.stressAreaInch(S.tieD / 0.0254, S.tieTPI) : CD.stressAreaMetric(S.tieD, S.tieP); R.tie = CD.tieRods(S.pmax, D, S.nTie, Ast); R.SFtie = S.Sytie / R.tie.stress; R.tieAs = Ast; }
    /* ports: cap port carries A1·v in both directions — on retract it carries the larger, regenerated-out flow */
    R.qPortCap = R.f.A1 * Math.max(R.sp.ext, R.sp.ret); R.qPortRod = R.f.A2 * Math.max(R.sp.ext, R.sp.ret);
    R.vCap = CD.velocity(R.qPortCap, S.portCap); R.vRod = CD.velocity(R.qPortRod, S.portRod);
    /* dynamics */
    R.nf = CD.natFreq(S.beta, R.f.A1, R.f.A2, S.stroke, S.V1d, S.V2d, Math.max(S.mass, 1e-6));
    R.dV = CD.compression(S.V1d + R.vol1, S.pmax, S.beta);
    /* FEA (tab) — geometry straight from the Design inputs */
    if (S.Do > D && S.Lc > S.stick){
      var g = CD.G, Lt2 = S.Lc - S.stick, Lr2 = S.stick + S.stroke, Itb = Math.PI * (Math.pow(S.Do, 4) - Math.pow(D, 4)) / 64, Ird = Math.PI * Math.pow(d, 4) / 64;
      var wOn = S.feaWt === "on" || (S.feaWt === "auto" && S.dir === "horizontal");
      var wT = wOn ? (Math.PI / 4 * (S.Do * S.Do - D * D) * S.rhoS + Math.PI / 4 * D * D * S.rhoO) * g : 0, wR = wOn ? Math.PI / 4 * d * d * S.rhoS * g : 0;
      var Pax = S.feaLoad === "stall" ? R.fmax.push : S.feaLoad === "work" ? R.f.push : 0;
      var bcs = { "1":["pin","pin"], "0.7":["fixed","pin"], "0.5":["fixed","fixed"], "2":["fixed","free"] }[S.K] || ["pin","pin"];
      var mk = function(nP){ return CD.beamFEA({ segs:[{ L:Lt2, EI:S.Etube * Itb, E:S.Etube, A:1e9, c:S.Do / 2, w:wT }, { L:Lr2, EI:S.Erod * Ird, E:S.Erod, A:CD.area(d), c:d / 2, w:wR }],
        endA:bcs[0], endB:bcs[1], Kf:S.Kf > 0 ? S.Kf : 0, P:Pax, Fend:S.feaSide || 0, nPer:nP }); };
      R.fea = mk(Math.round(S.feaN) || 20); R.feaP = Pax; R.feaLt = Lt2; R.feaW = [wT, wR];
      R.feaConv = [5, 10, 20, 40, 60].map(function(nP){ var r = mk(nP); return { n:nP, Pcr:r.Pcr, v:r.maxV, M:r.maxM }; });
    }
    R.accExt = S.vExt > 0 && S.cushRod > 0 ? S.vExt * S.vExt / (2 * S.cushRod) : null;
    return R;
  }

  /* ---------- checks ---------- */
  function checks(R){
    var C = [];
    function add(step, label, status, detail){ C.push({ step:step, label:label, status:status, detail:detail }); }
    var sfS = function(v, req){ return !isFinite(v) ? "na" : v >= req ? "pass" : v >= req * 0.85 ? "warn" : "fail"; };
    /* Input sanity: a unit slip (e.g. 30000 typed into an Msi field) otherwise gives confident nonsense. Ranges are
       deliberately wide — they only catch values no structural metal can have; they are not material data. */
    [["Erod","Rod elastic modulus",4],["Etube","Tube elastic modulus",5]].forEach(function(e){ var v = S[e[0]];
      if (v != null && (v < 40e9 || v > 450e9)) add(e[2], e[1] + " looks wrong", "fail", fmt(v,"mod") + " is outside any structural metal (about " + fmt(40e9,"mod") + " – " + fmt(450e9,"mod") + "). Check the unit — every result using it is unreliable."); });
    [["Syrod","Rod yield strength",4],["Sytube","Tube yield strength",5],["Sycap","Cap yield strength",6],["Sypin","Pin yield strength",7],["Sytie","Tie-rod yield strength",8],["Synut","Piston / nut yield strength",12],["Sygland","Gland yield strength",12],["wrSs","Ring shear strength",12]].forEach(function(e){ var v = S[e[0]];
      if (v != null && (v < 50e6 || v > 2500e6)) add(e[2], e[1] + " looks wrong", "fail", fmt(v,"stress") + " is outside the range of structural metals (about " + fmt(50e6,"stress") + " – " + fmt(2500e6,"stress") + "). Check the unit."); });
    add(2, "Extension (push) force at working pressure", R.f.push >= R.needPush ? "pass" : "fail", fmt(R.f.push,"force") + " available vs " + fmt(R.needPush,"force") + " needed · stall at relief " + fmt(R.fmax.push,"force"));
    add(2, "Retraction (pull) force at working pressure", R.f.pull >= R.needPull ? "pass" : "fail", fmt(R.f.pull,"force") + " available vs " + fmt(R.needPull,"force") + " needed · stall at relief " + fmt(R.fmax.pull,"force"));
    if (S.Q > 0) add(3, "Pump flow meets both speeds", S.Q >= R.qNeed * 0.999 ? "pass" : "warn", fmt(S.Q,"flow") + " available vs " + fmt(R.qNeed,"flow") + " needed");
    if (S.meterOut !== "no") add(3, "Rod-side pressure when metering out (no load)", R.pInt <= S.pmax ? "pass" : "warn", fmt(R.pInt,"press") + " = relief × φ — " + (R.pInt > S.pmax ? "above the relief setting: rod seals, head retention, rod-side port and tube are checked at it" : "within the maximum"));
    add(4, "Rod buckling at maximum pressure", sfS(R.SFbuck, S.SFb), "safety factor " + num(R.SFbuck) + " (required " + num(S.SFb) + "), " + R.buck.mode.split(" (")[0]);
    if (R.dnv) add(4, "Whole-cylinder buckling per DNV-GL CG-0194 (F_E / stall ≥ 4)", R.dnv.FE / R.Fbuck >= 4 ? "pass" : "warn", "F_E " + fmt(R.dnv.FE,"force") + (S.K !== "1" ? " (§4.4 effective lengths, K = " + S.K + ")" : "") + ", factor " + num(R.dnv.FE / R.Fbuck) + " (DNV requires ≥ 4; reads up to ~18 % above the exact elastic load)");
    add(4, "Stop tube", R.stopTube > 0 ? "warn" : "pass", R.stopTube > 0 ? "recommended: " + fmt(R.stopTube,"len") + " (basic length " + fmt(R.basic,"len") + ")" : "not needed (basic length " + fmt(R.basic,"len") + ")");
    if (R.tube) add(5, "Tube at the highest chamber pressure (von Mises, Lamé)", sfS(R.SFtubeCh, S.SFt), "safety factor " + num(R.SFtubeCh) + " at " + fmt(R.pChMax.p,"press") + " (" + R.pChMax.why + "); at relief " + num(R.SFtube));
    else add(5, "Tube", "fail", "tube outside diameter must be larger than the bore");
    if (R.tubeTest) add(5, "Tube at test pressure", R.SFtest >= 1 ? "pass" : "fail", "safety factor on yield " + num(R.SFtest));
    add(6, "Cap (flat end) bending", sfS(R.SFcap, S.SFt), "safety factor " + num(R.SFcap) + "; minimum thickness " + fmt(R.capMinT,"len"));
    if (R.weld) add(6, "Cap weld shear", sfS(R.SFweld, 1), "safety factor on allowable " + num(R.SFweld));
    add(7, "Rod-end thread (pull at maximum pressure)", sfS(R.SFthr, S.SFt), "safety factor " + num(R.SFthr) + " on rod yield");
    add(7, "Rod-end thread if push goes through the thread", sfS(R.SFthrPush, S.SFt), "safety factor " + num(R.SFthrPush) + " — passes if a shoulder carries the push");
    add(7, "Rod body in compression (extension stall)", sfS(S.Syrod / R.rodStress, S.SFt), fmt(R.rodStress,"stress") + " (safety factor " + num(S.Syrod / R.rodStress) + ")");
    add(7, "Rod body in tension (retraction stall)", sfS(S.Syrod / R.rodTens, S.SFt), fmt(R.rodTens,"stress") + " (safety factor " + num(S.Syrod / R.rodTens) + ")");
    if (R.neckStress) add(7, "Rod neck at the thread relief (retraction stall)", sfS(S.Syrod / R.neckStress, S.SFt), fmt(R.neckStress,"stress") + " (safety factor " + num(S.Syrod / R.neckStress) + ")");
    if (R.AsP) add(7, "Piston-to-rod thread (rod side at relief, cap to tank)", sfS(S.Syrod / R.pistStress, S.SFt), fmt(R.pistStress,"stress") + " on the stress area (safety factor " + num(S.Syrod / R.pistStress) + ")");
    add(7, "Rod-end pin shear", sfS(R.SFpin, S.SFt), "safety factor " + num(R.SFpin) + " on shear yield");
    if (R.tie) add(8, "Tie rods / bolts", sfS(R.SFtie, S.SFt), "safety factor " + num(R.SFtie) + " at maximum pressure, before preload");
    var cst = function(c){ return R.pcAllow ? (c.pAvg <= R.pcAllow ? "pass" : "fail") : "warn"; };
    var cdet = function(c){ return fmt(c.pAvg,"press") + (R.pcAllow ? " vs " + fmt(R.pcAllow,"press") + " allowed" : " — enter the allowable cushion-chamber pressure to judge it"); };
    if (R.cCap) add(9, "Cap-end cushion pressure (average)", cst(R.cCap), cdet(R.cCap));
    if (R.cRod) add(9, "Rod-end cushion pressure (average)", cst(R.cRod), cdet(R.cRod));
    var maxV = Math.max(S.vExt, S.vRet);
    if (!(S.cushCap > 0) && !(S.cushRod > 0) && maxV > 0.1) add(9, "Cushions", "warn", "speeds above 100 mm/s usually need cushions (Parker guidance) — none set");
    var vband = function(v){ var hi = Math.min.apply(null, CD.VEL_GUIDE.pressure.map(function(b){ return b.hi; })), top = Math.max.apply(null, CD.VEL_GUIDE.pressure.map(function(b){ return b.hi; }));
      return v <= hi ? "pass" : v <= top ? "warn" : "fail"; };
    add(10, "Cap port velocity", vband(R.vCap), fmt(R.vCap,"vel") + " at " + fmt(R.qPortCap,"flow"));
    add(10, "Rod port velocity", vband(R.vRod), fmt(R.vRod,"vel") + " at " + fmt(R.qPortRod,"flow"));
    if (S.fAcc > 0 && R.nf) add(11, "Natural frequency ≥ 4 × acceleration frequency", R.nf.f >= 4 * S.fAcc ? "pass" : "warn", num(R.nf.f,1) + " Hz vs " + num(4 * S.fAcc,1) + " Hz");
    if (R.pj) add(12, "Piston / nut thread stripping (retraction at relief)", sfS(R.pj.F / R.Fpj, S.SFt), "strips at " + fmt(R.pj.F,"force") + " (" + R.pj.weak + ") vs " + fmt(R.Fpj,"force") + " — safety factor " + num(R.pj.F / R.Fpj));
    else if (S.pjLe > 0) add(12, "Piston / nut thread stripping", "na", "enter all four limit diameters and the piston / nut yield");
    if (R.hd) add(12, "Threaded head (gland) stripping", sfS(R.hd.F / R.Fgl, S.SFt), "strips at " + fmt(R.hd.F,"force") + " (" + R.hd.weak + ") vs " + fmt(R.Fgl,"force") + " — safety factor " + num(R.hd.F / R.Fgl));
    if (R.wr) add(12, "Head retaining ring (" + R.wr.limit + " governs)", sfS(R.wr.F / R.Fgl, S.SFt), "limit " + fmt(R.wr.F,"force") + " vs " + fmt(R.Fgl,"force") + " — safety factor " + num(R.wr.F / R.Fgl));
    return C;
  }

  /* ---------- rendering ---------- */
  function field(k, extra){
    var f = FD[k], id = "in-" + k;
    if (f.q === "sel"){
      return '<label class="fld"><span>' + esc(f.label) + '</span><select id="' + id + '" data-k="' + k + '">' +
        f.opts.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(S[k]) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") +
        "</select>" + (f.hint ? '<small>' + esc(f.hint) + "</small>" : "") + "</label>";
    }
    var u = uf(f.q), v = S[k] == null ? "" : +(S[k] / u[0]).toFixed(6);
    return '<label class="fld"><span>' + esc(f.label) + '</span><span class="iu"><input id="' + id + '" data-k="' + k + '" type="number" inputmode="decimal" step="any" value="' + v + '"' + (f.def == null ? ' placeholder="optional"' : "") + '>' +
      (u[1] ? '<em>' + u[1] + "</em>" : "") + "</span>" + (extra || "") + (f.hint ? '<small>' + esc(f.hint) + "</small>" : "") + "</label>";
  }
  function isoPick(kind){
    if (kind === "stroke") return '<select class="iso" data-iso="stroke" data-mm="1" aria-label="Pick a standard stroke"><option value="">ISO 4393 strokes…</option>' +
      CD.STROKES.map(function(v){ return '<option value="' + v + '">' + v + " mm" + (sys === "i" ? " (" + (v / 25.4).toFixed(2) + " in)" : "") + "</option>"; }).join("") + "</select>";
    var iso = (kind === "D" ? CD.BORES : CD.RODS).map(function(b){ return '<option value="' + (b.v / 1000) + '">' + b.v + " mm" + (b.np ? " — non-preferred" : "") + "</option>"; }).join("");
    var nf = (kind === "D" ? CD.NFPA_BORES : CD.NFPA_RODS).map(function(v){ return '<option value="' + (v * 0.0254) + '">' + v.toFixed(3).replace(/0$/, "") + " in</option>"; }).join("");
    var g1 = '<optgroup label="ISO 3320 (metric)">' + iso + "</optgroup>", g2 = '<optgroup label="NFPA (inch)">' + nf + "</optgroup>";
    return '<select class="iso" data-iso="' + kind + '" aria-label="Pick a standard size"><option value="">Standard sizes…</option>' + (sys === "i" ? g2 + g1 : g1 + g2) + "</select>";
  }
  function row(label, val, cls){ return '<div class="r' + (cls ? " " + cls : "") + '"><span>' + label + "</span><b>" + val + "</b></div>"; }
  function chip(st){ return '<i class="chip ' + st + '">' + { pass:"OK", warn:"Check", fail:"Fails", na:"—" }[st] + "</i>"; }

  var STEPS = [
    { n:1, t:"Application", sub:"What the cylinder must do", f:["Fpush","Fpull","mass","dir","stroke","vExt","vRet","p","pmax","eff","meterOut"],
      out:function(R){ return row("Push needed incl. weight", fmt(R.needPush,"force")) + row("Pull needed incl. weight", fmt(R.needPull,"force")); } },
    { n:2, t:"Bore and rod", sub:"Size the piston from force ÷ pressure", f:["D","d"],
      out:function(R){ return row("Smallest bore for the forces", fmt(R.reqBore > R.reqBorePull ? R.reqBore : R.reqBorePull,"len")) +
        row("Smallest ISO 3320 bore that works", R.isoBore ? R.isoBore.v + " mm" : "above 500 mm") +
        row("Cap-side area A1", fmt(R.f.A1,"area")) + row("Rod-side area A2", fmt(R.f.A2,"area")) + row("Area ratio φ = A1/A2", num(R.f.ratio,3)) +
        '<h4>Forces both ways</h4><table class="ft"><tr><th></th><th>Extension (push)</th><th>Retraction (pull)</th></tr>' +
        "<tr><td>Needed (incl. weight)</td><td>" + fmt(R.needPush,"force") + "</td><td>" + fmt(R.needPull,"force") + "</td></tr>" +
        "<tr><td>At working pressure</td><td>" + fmt(R.f.push,"force") + "</td><td>" + fmt(R.f.pull,"force") + "</td></tr>" +
        "<tr><td>At relief — stall, used for strength</td><td><b>" + fmt(R.fmax.push,"force") + "</b></td><td><b>" + fmt(R.fmax.pull,"force") + "</b></td></tr>" +
        "<tr><td>Loads the rod in</td><td>compression + buckling</td><td>tension (body, neck, threads)</td></tr></table>"; } },
    { n:3, t:"Speed, flow and power", sub:"Flow = area × speed", f:["Q","etaP"],
      out:function(R){ return row("Flow for the extend speed", fmt(R.qExt,"flow")) + row("Flow for the retract speed", fmt(R.qRet,"flow")) +
        row("Pump flow to size for", fmt(R.qNeed,"flow"), "hl") + row("Extend speed at " + fmt(R.Q,"flow"), fmt(R.sp.ext,"speed")) + row("Retract speed", fmt(R.sp.ret,"speed")) +
        row("Extend time / retract time", num(R.tExt) + " s / " + num(R.tRet) + " s") +
        row("Flow out of the rod side while extending", fmt(R.qOutExt,"flow")) + row("Flow out of the cap side while retracting", fmt(R.qOutRet,"flow"), "hl") +
        row("Oil per stroke, cap / rod side", fmt(R.vol1,"vol") + " / " + fmt(R.vol2,"vol")) +
        row("Hydraulic power at working pressure", fmt(R.powerHyd,"power")) + row("Pump input power (÷ efficiency)", fmt(R.powerIn,"power")) +
        row("Regenerative extend: speed / force", fmt(R.regen.speed,"speed") + " / " + fmt(R.regen.force,"force")) +
        row("Rod-side pressure, meter-out, no load (p·A1/A2)", fmt(R.pInt,"press"), R.pInt > S.pmax ? "bad" : ""); } },
    { n:4, t:"Rod buckling", sub:"Extension loads: the rod is a column", f:["mount","ext","Lc","K","Erod","Syrod","SFb","stick","Kf"],
      out:function(R){ var b = R.buck; return row("Pin-to-pin length, extended", fmt(R.Lext,"len")) + row("Force checked (stall at maximum pressure)", fmt(R.Fbuck,"force")) +
        row("Slenderness KL/r (transition " + num(b.transition,0) + ")", num(b.slenderness,0)) + row("Method", b.mode) +
        row("Critical load", fmt(b.Pcr,"force")) + row("Safety factor", num(R.SFbuck), R.SFbuck < S.SFb ? "bad" : "good") +
        row("Smallest ISO rod for the required factor", R.minRod ? (R.minRod.d * 1000) + " mm" : "none up to 450 mm") +
        '<h4>Catalogue method (stroke factor)</h4>' + row("Stroke factor", R.sfac.f.toFixed(1)) + row("Basic length = (stroke + extension) × factor", fmt(R.basic,"len")) +
        row("Stop tube", R.stopTube > 0 ? fmt(R.stopTube,"len") : "not needed", R.stopTube > 0 ? "hl" : "") +
        (R.stepped ? '<h4>Tube + rod as one column (informative)</h4>' +
          row("Rigid gland joint — upper bound (Timoshenko–Gere)", fmt(R.stepped,"force") + " · factor " + num(R.stepped / R.Fbuck)) +
          (R.dnv ? row("DNV-GL CG-0194 (Jul 2017) whole-cylinder load F_E" + (S.K !== "1" ? " — §4.4 effective lengths, K = " + S.K : ""), fmt(R.dnv.FE,"force") + " · factor " + num(R.dnv.FE / R.Fbuck) + " (DNV needs ≥ 4)", R.dnv.FE / R.Fbuck < 4 ? "bad" : "good") : "") +
          (R.steppedK ? row("With gland joint stiffness Kf (Baragetti & Villa 2016)", fmt(R.steppedK,"force") + " · factor " + num(R.steppedK / R.Fbuck), R.steppedK / R.Fbuck < S.SFb ? "bad" : "good") : "") +
          '<p class="note">Finite-element two-segment column, verified against Baragetti &amp; Villa 2016 (rigid 3,855 N; Kf models 3,111 N and 3,629 N reproduced). A rigid joint overstates strength; real wear rings and clearance make it flexible — enter Kf to include that. The rod-only check above stays the governing, conservative check. DNV-GL CG-0194 (July 2017 edition, §4.2) is shown with its own acceptance, F_E / actual maximum load ≥ 4; for mountings other than pinned–pinned it uses Euler effective lengths K·L1 and K·L2, as its §4.4 directs. Its sine-mode formula reads up to about 18 % above the exact elastic load, which the factor of 4 covers. DNV §4.5.2 accepts a factor down to 2.7 only for a more accurate method approved by the Society (e.g. one including bearing-rotation moments) — the Kf result here is more detailed but is not Society-approved, so judge it against your own required factor. ISO/TS 13725 is a different, maximum-allowable-load method and is not implemented.</p>' : ""); } },
    { n:5, t:"Tube (barrel)", sub:"Wall thickness against bursting", f:["Do","Sytube","Etube","nu","SFt","ptest"],
      out:function(R){ if (!R.tube) return '<p class="bad">The tube outside diameter must be larger than the bore.</p>';
        var t = R.tube; return row("Wall thickness", fmt(t.t,"len")) + row("Hoop stress, Barlow (thin wall)", fmt(t.barlow,"stress")) + row("Hoop stress at the bore, Lamé", fmt(t.hoop,"stress")) +
        row("Axial stress (closed ends)", fmt(t.axial,"stress")) + row("von Mises at the bore, at relief", fmt(t.vonMises,"stress")) + row("Safety factor on yield, at relief", num(R.SFtube), R.SFtube < S.SFt ? "bad" : "good") +
        '<h4>Highest pressure any chamber can see</h4>' + R.pCh.map(function(c){ return row(c.why, fmt(c.p,"press"), c === R.pChMax ? "hl" : ""); }).join("") +
        row("von Mises at " + fmt(R.pChMax.p,"press"), fmt(R.tubeCh.vonMises,"stress")) + row("Safety factor at the highest pressure", num(R.SFtubeCh), R.SFtubeCh < S.SFt ? "bad" : "good") +
        row("Minimum wall for the required factor", fmt(R.minWall,"len")) + row("Bore growth under maximum pressure (on diameter)", fmt(2 * t.growth,"um")) +
        (R.tubeTest ? row("von Mises at test pressure", fmt(R.tubeTest.vonMises,"stress")) + row("Safety factor at test pressure", num(R.SFtest), R.SFtest < 1 ? "bad" : "") : "") +
        '<p class="note">Bore growth widens the extrusion gap at the piston seal — check it against the seal maker\'s gap limit at your pressure.</p>'; } },
    { n:6, t:"Cap and welds", sub:"Flat end plate and its weld", f:["tcap","edge","Sycap","weldA","weldS"],
      out:function(R){ return row("Bending stress in the cap", fmt(R.cap.stress,"stress")) + row("Safety factor on yield", num(R.SFcap), R.SFcap < S.SFt ? "bad" : "good") +
        row("Minimum cap thickness for the required factor", fmt(R.capMinT,"len")) +
        (R.weld ? row("End load on the weld (p × A1)", fmt(R.weld.F,"force")) + row("Weld throat shear", fmt(R.weld.shear,"stress")) + row("Factor on allowable", num(R.SFweld), R.SFweld < 1 ? "bad" : "good") : "") +
        '<p class="note">The head (gland end) is retained by threads, a wire ring, bolts or tie rods; each needs its own check against the same end load p × A1. Not covered here (named gap).</p>'; } },
    { n:7, t:"Rod, threads and pin", sub:"Compression on extension, tension on retraction", f:["thrSys","thrD","thrP","thrTPI","neck","pistD","pistP","pistTPI","pinD","pinL","pinPlanes","Sypin"],
      out:function(R){ return row("Thread tensile stress area", fmt(R.As,"area")) + row("Pull at maximum pressure", fmt(R.Fpullmax,"force")) +
        row("Thread stress on pull", fmt(R.thrStress,"stress")) + row("Safety factor (rod yield)", num(R.SFthr), R.SFthr < S.SFt ? "bad" : "good") +
        row("Rod body, compression at stall push", fmt(R.rodStress,"stress")) + row("Rod body, tension at stall pull", fmt(R.rodTens,"stress")) +
        (R.neckStress ? row("Rod neck at the thread relief, stall pull", fmt(R.neckStress,"stress"), S.Syrod / R.neckStress < S.SFt ? "bad" : "good") : "") +
        (R.AsP ? row("Piston thread load (relief on rod side × A2)", fmt(R.FpistThr,"force")) + row("Piston thread stress", fmt(R.pistStress,"stress"), S.Syrod / R.pistStress < S.SFt ? "bad" : "good") : "") +
        row("Pin load (larger of push / pull)", fmt(R.Fpin,"force")) + row("Pin shear stress", fmt(R.pin.shear,"stress")) + row("Pin bearing pressure", fmt(R.pin.bearing,"stress")) +
        row("Pin safety factor (shear yield ≈ 0.577 Sy)", num(R.SFpin), R.SFpin < S.SFt ? "bad" : "good") +
        '<p class="note">Thread stress uses the tensile stress area (ISO 898-1 / ASME B1.1). Thread stripping and the rod eye section are separate checks.</p>'; } },
    { n:8, t:"Tie rods / bolts", sub:"For tie-rod and bolted construction", f:["constr","nTie","tieD","tieP","Sytie"],
      out:function(R){ if (!R.tie) return '<p class="note">Welded construction selected — the cap weld (step 6) carries the end load.</p>';
        return row("End load on the cap (p × A1)", fmt(R.tie.total,"force")) + row("Load per rod", fmt(R.tie.perRod,"force")) + row("Stress area per rod", fmt(R.tieAs,"area")) +
        row("Stress per rod (external load only)", fmt(R.tie.stress,"stress")) + row("Safety factor", num(R.SFtie), R.SFtie < S.SFt ? "bad" : "good") +
        '<p class="note">Tie rods must be preloaded above the separating load so the joints never open; preload stress adds to this. Set the preload from your torque procedure.</p>'; } },
    { n:9, t:"Cushioning", sub:"Stopping the load at the end of stroke", f:["cushCap","spear","cushRod","collar","pcush"],
      out:function(R){ var h = "";
        function blk(name, c, v){ return '<h4>' + name + "</h4>" + row("Speed entering the cushion", fmt(v,"speed")) + row("Kinetic energy", fmt(c.Ek,"energy")) + row("Total energy to absorb (incl. drive force)", fmt(c.E,"energy")) +
          row("Average cushion pressure", fmt(c.pAvg,"press"), R.pcAllow ? (c.pAvg > R.pcAllow ? "bad" : "good") : "hl") + row("Average deceleration", fmt(c.decel,"accel")) + row("Cushion time (approx.)", num(c.time,3) + " s"); }
        if (R.cCap) h += blk("Cap end (end of retract)", R.cCap, R.sp.ret); if (R.cRod) h += blk("Rod end (end of extend)", R.cRod, R.sp.ext);
        return (h || '<p class="note">No cushion set.</p>') + '<p class="note">The drive pressure keeps pushing while the cushion brakes, so it is added to the kinetic energy. Peak pressure depends on the cushion profile and is higher than the average.</p>'; } },
    { n:10, t:"Ports and lines", sub:"Oil velocity through the ports", f:["portCap","portRod"],
      out:function(R){ var g = CD.VEL_GUIDE;
        return row("Cap port flow (largest, during retract or extend)", fmt(R.qPortCap,"flow")) + row("Cap port velocity", fmt(R.vCap,"vel")) +
        row("Rod port flow", fmt(R.qPortRod,"flow")) + row("Rod port velocity", fmt(R.vRod,"vel")) +
        '<h4>Published guidance for pressure lines</h4>' + g.pressure.map(function(b){ return row(b.src, fmt(b.lo,"vel") + " – " + fmt(b.hi,"vel") + (b.note ? " (" + b.note + ")" : "")); }).join("") +
        '<h4>Return lines</h4>' + g.ret.map(function(b){ return row(b.src, fmt(b.lo,"vel") + " – " + fmt(b.hi,"vel")); }).join("") +
        '<p class="note">The cap port of a single-rod cylinder carries the most flow on the retract stroke (φ × pump flow). Size it for that.</p>'; } },
    { n:11, t:"Dynamics", sub:"Oil spring and natural frequency", f:["beta","V1d","V2d","fAcc"],
      out:function(R){ return row("Lowest natural frequency over the stroke", R.nf ? num(R.nf.f,1) + " Hz at " + fmt(R.nf.x,"len") + " extended" : "—") +
        row("Oil spring stiffness there", R.nf ? num(R.nf.k / 1e6,1) + " N/µm" : "—") +
        row("Oil compression at maximum pressure (cap side full)", fmt(R.dV,"vol")) +
        '<p class="note">Low natural frequency means bounce and slow, jerky positioning. Short hoses, rigid tube and fewer dead volumes raise it.</p>'; } },
    { n:12, t:"Head and piston retention", sub:"Gland and piston-to-rod joint against stripping", f:["pjLe","pjKn","pjEs","pjDs","pjEn","Synut","headType","hdP","hdTPI","hdLe","hdKn","hdEs","hdDs","hdEn","Sygland","wrD","wrT","wrG","wrSs"],
      out:function(R){ var h = row("Gland load (rod-side " + fmt(R.pRodMax,"press") + " × A2)", fmt(R.Fgl,"force")) + row("Piston joint load (relief × A2)", fmt(R.Fpj,"force"));
        h += "<h4>Piston to rod</h4>" + (R.pj ? row("Shear area, rod thread (As)", fmt(R.pj.As,"area")) + row("Shear area, piston / nut thread (An)", fmt(R.pj.An,"area")) +
          row("Stripping load (" + R.pj.weak + " first)", fmt(R.pj.F,"force"), "hl") + row("Safety factor", num(R.pj.F / R.Fpj), R.pj.F / R.Fpj < S.SFt ? "bad" : "good") : '<p class="note">Enter engagement length, the four limit diameters and the piston / nut yield to run it.</p>');
        h += "<h4>Head (gland)</h4>";
        if (S.headType === "bolted") h += '<p class="note">Bolted head: check the bolts in step 8 (set construction to mill type / bolted).</p>';
        else if (R.hd) h += row("Shear area, gland thread (As)", fmt(R.hd.As,"area")) + row("Shear area, tube thread (An)", fmt(R.hd.An,"area")) + row("Stripping load (" + R.hd.weak + " first)", fmt(R.hd.F,"force"), "hl") + row("Safety factor", num(R.hd.F / R.Fgl), R.hd.F / R.Fgl < S.SFt ? "bad" : "good");
        else if (R.wr) h += row("Ring shear limit", fmt(R.wr.ringShear,"force")) + row("Groove first-yield limit", fmt(R.wr.grooveYield,"force")) + row("Governs", R.wr.limit, "hl") + row("Safety factor", num(R.wr.F / R.Fgl), R.wr.F / R.Fgl < S.SFt ? "bad" : "good");
        else h += '<p class="note">Enter the head details to run it.</p>';
        return h + '<p class="note">Stripping uses the geometric minimum shear areas of Machinery\'s Handbook (31st ed., Formulas 5–6) = FED-STD-H28/2B, with shear yield 0.577·Sy; real effective areas are somewhat smaller, so keep a margin. Rings use the Smalley ring-shear and groove-yield formulas (Rotor Clip\'s groove correction factor not applied). Round-wire rings are not covered.</p>'; } }
  ];

  function renderSteps(){
    $("steps").innerHTML = STEPS.map(function(s){
      var fg = window.FIGS && FIGS[s.n];
      return '<section class="step' + (OPEN[s.n] ? "" : " shut") + '" id="step' + s.n + '"><header role="button" tabindex="0" aria-expanded="' + (OPEN[s.n] ? "true" : "false") + '" data-step="' + s.n + '"><span class="sn">' + s.n + '</span><div><h2>' + esc(s.t) + '</h2><p>' + esc(s.sub) + '</p><p class="key" id="key' + s.n + '"></p></div><span class="sst" id="sst' + s.n + '"></span><span class="tw" aria-hidden="true"></span></header>' +
        '<div class="body">' + (fg ? '<figure class="pic">' + fg.svg + '<figcaption>' + esc(fg.cap) + '</figcaption></figure>' : "") + '<div class="grid"><div class="ins">' + s.f.map(function(k){
          return field(k, k === "D" ? isoPick("D") : k === "d" ? isoPick("d") : k === "stroke" ? isoPick("stroke") : ""); }).join("") + '</div><div class="outs" id="out' + s.n + '"></div></div></div></section>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#steps .step>header"), function(h){
      var go = function(){ setOpen(+h.getAttribute("data-step"), !OPEN[+h.getAttribute("data-step")]); };
      h.onclick = function(e){ if (e.target.closest("select,input,a")) return; go(); };
      h.onkeydown = function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); go(); } }; });
    $("toc").innerHTML = STEPS.map(function(s){ return '<a href="#step' + s.n + '"><span>' + s.n + "</span>" + esc(s.t) + '<i id="toc' + s.n + '"></i></a>'; }).join("") + '<a href="#report"><span>✓</span>Report</a>';
    var fi = $("fea-ins"); if (fi) fi.innerHTML = ["feaLoad","feaSide","feaWt","rhoS","rhoO","feaN"].map(function(k){ return field(k); }).join("");
    visibility();
  }
  /* Steps fold so the page is not one long wall of inputs: step 1 starts open; tapping a header or a
     contents link opens it. A folded step still shows its status chip and its headline result. */
  var OPEN = { 1:true };
  function setOpen(n, on){ OPEN[n] = on; var el = $("step" + n); if (!el) return; el.classList.toggle("shut", !on);
    el.querySelector("header").setAttribute("aria-expanded", on ? "true" : "false"); }
  function setAll(on){ STEPS.forEach(function(s){ setOpen(s.n, on); }); }
  function visibility(){
    var inch = S.thrSys === "inch";
    toggle("thrP", !inch); toggle("thrTPI", inch); toggle("pistP", !inch); toggle("pistTPI", inch);
    var ht = S.headType; ["hdLe","hdKn","hdEs","hdDs","hdEn","Sygland"].forEach(function(k){ toggle(k, ht === "threaded"); });
    toggle("hdP", ht === "threaded" && !inch); toggle("hdTPI", ht === "threaded" && inch); ["wrD","wrT","wrG","wrSs"].forEach(function(k){ toggle(k, ht === "ring"); });
    var tie = S.constr !== "welded"; ["nTie","tieD","tieP","tieTPI","Sytie"].forEach(function(k){ toggle(k, tie); }); if (tie){ toggle("tieP", !inch); toggle("tieTPI", inch); } toggle("weldA", !tie); toggle("weldS", !tie);
  }
  function toggle(k, on){ var el = $("in-" + k); if (el) el.closest(".fld").style.display = on ? "" : "none"; }

  function update(){
    var R = calc();
    if (!R.ok){ STEPS.forEach(function(s){ $("out" + s.n).innerHTML = '<p class="bad">Enter a bore larger than the rod.</p>'; }); $("report").innerHTML = ""; drawCyl(); return; }
    STEPS.forEach(function(s){ var h = s.out(R); $("out" + s.n).innerHTML = h;
      var KEY = { 4:/^Safety factor$/, 5:/^Safety factor on yield, at relief$/ }, re = /<div class="r[^"]*"><span>(.*?)<\/span><b>(.*?)<\/b>/g, m, first = null;
      while ((m = re.exec(h))){ if (!first) first = m; if (KEY[s.n] && KEY[s.n].test(m[1])){ first = m; break; } } m = first; $("key" + s.n).innerHTML = m ? m[1] + ": <b>" + m[2] + "</b>" : ""; });
    var C = checks(R), worst = {}; C.forEach(function(c){ var w = worst[c.step]; var rank = { fail:3, warn:2, pass:1, na:0 }; if (!w || rank[c.status] > rank[w]) worst[c.step] = c.status; });
    STEPS.forEach(function(s){ var st = worst[s.n]; $("sst" + s.n).innerHTML = st ? chip(st) : ""; $("toc" + s.n).className = st || ""; });
    var cnt = { pass:0, warn:0, fail:0 }; C.forEach(function(c){ if (c.status in cnt) cnt[c.status]++; });
    $("status").innerHTML = '<b class="pass">' + cnt.pass + ' OK</b><b class="warn">' + cnt.warn + ' to check</b><b class="fail">' + cnt.fail + " failing</b>";
    $("report").innerHTML = '<header><span class="sn">✓</span><div><h2>Design report</h2><p>Every check in one place — print or save as PDF</p></div></header>' +
      '<table class="rep"><thead><tr><th>Step</th><th>Check</th><th>Result</th><th>Detail</th></tr></thead><tbody>' +
      C.map(function(c){ return "<tr><td>" + c.step + "</td><td>" + esc(c.label) + "</td><td>" + chip(c.status) + "</td><td>" + esc(c.detail) + "</td></tr>"; }).join("") + "</tbody></table>" +
      '<h4>Design summary</h4><div class="sum">' + row("Bore × rod × stroke", fmt(S.D,"len") + " × " + fmt(S.d,"len") + " × " + fmt(S.stroke,"len")) +
      row("Working / maximum pressure", fmt(S.p,"press") + " / " + fmt(S.pmax,"press")) + row("Tube OD × wall", fmt(S.Do,"len") + " × " + (R.tube ? fmt(R.tube.t,"len") : "—")) +
      row("Mounting", R.sfac.group + " · " + R.sfac.rod) + row("Pump flow", fmt(R.Q,"flow")) + "</div>" +
      '<p class="note">Reference calculations only. Verify against your cylinder standard (ISO 6020 / 6022 / NFPA), the seal and material suppliers\' data and the customer specification. Material strengths shown are inputs, not data.</p>' +
      '<div class="actions"><button type="button" id="btnPrint">Print / save PDF</button></div>';
    $("btnPrint").onclick = function(){ window.print(); };
    drawCyl(R); renderFEA(R);
  }

  /* ---------- FEA tab ---------- */
  function mfmt(m){ return sys === "i" ? num(m / 0.112984829, 0) + " lbf·in" : num(m, 0) + " N·m"; }
  function plot(id, xs, ys, unitQ, label){
    var el = $(id); if (!el) return;
    var draw = function(){ var W = el.clientWidth || 600, H = 150, pad = 34, xm = xs[xs.length - 1] || 1;
      var ymin = Math.min(0, Math.min.apply(null, ys)), ymax = Math.max(0, Math.max.apply(null, ys)); if (ymax - ymin < 1e-30){ ymax = 1; ymin = -1; }
      var X = function(x){ return pad + (W - pad - 8) * x / xm; }, Y = function(y){ return 12 + (H - 32) * (ymax - y) / (ymax - ymin); };
      var pts = xs.map(function(x, i){ return X(x).toFixed(1) + "," + Y(ys[i]).toFixed(1); }).join(" ");
      var peak = ys.reduce(function(a, b){ return Math.abs(b) > Math.abs(a) ? b : a; }, 0), ip = ys.indexOf(peak);
      el.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" height="' + H + '" role="img" aria-label="' + esc(label) + '">' +
        '<line x1="' + pad + '" y1="' + Y(0) + '" x2="' + (W - 8) + '" y2="' + Y(0) + '" stroke="#3a4558"/>' +
        (R0.feaLt ? '<line x1="' + X(R0.feaLt) + '" y1="8" x2="' + X(R0.feaLt) + '" y2="' + (H - 18) + '" stroke="#46536a" stroke-dasharray="3 3"/><text x="' + (X(R0.feaLt) + 4) + '" y="18" fill="#7f8a9c" font-size="11">gland</text>' : "") +
        '<polyline points="' + pts + '" fill="none" stroke="#f0a33a" stroke-width="2"/>' +
        '<circle cx="' + X(xs[ip]) + '" cy="' + Y(peak) + '" r="3.5" fill="#4fb3c9"/>' +
        '<text x="' + Math.min(X(xs[ip]) + 6, W - 120) + '" y="' + Math.max(Y(peak) - 6, 22) + '" fill="#e8ecf2" font-size="12">' + esc(unitQ === "mom" ? mfmt(peak) : fmt(peak, unitQ, unitQ === "len" ? (sys === "i" ? 4 : 3) : null)) + "</text>" +
        '<text x="' + pad + '" y="' + (H - 4) + '" fill="#7f8a9c" font-size="11">mount</text><text x="' + (W - 8) + '" y="' + (H - 4) + '" fill="#7f8a9c" font-size="11" text-anchor="end">rod end · ' + esc(fmt(xm, "len")) + "</text></svg>"; };
    draw(); if (window.ResizeObserver && !el._ro){ el._ro = new ResizeObserver(function(){ draw(); }); el._ro.observe(el); }
  }
  var R0 = {};
  function renderFEA(R){
    R0 = R; var o = $("fea-out"); if (!o) return;
    if (!R.fea){ o.innerHTML = '<p class="bad">Enter the tube outside diameter (step 5) and a pin-to-pin length longer than the rod stick-out (step 4).</p>'; return; }
    var f = R.fea, rodY = S.Syrod, tubeY = S.Sytube;
    var h = '<h4>Buckling (eigenvalue)</h4>' + row("Buckling load of the whole cylinder", fmt(f.Pcr,"force")) +
      row("Axial load applied", fmt(R.feaP,"force")) + (R.feaP > 0 ? row("Factor = buckling load ÷ applied", num(f.Pcr / R.feaP), f.Pcr / R.feaP < S.SFb ? "bad" : "good") : "") +
      row("Gland joint", S.Kf > 0 ? "flexible, Kf " + fmt(S.Kf,"rstiff") : "rigid (no Kf entered — upper bound)") +
      row("End conditions", { "1":"pinned – pinned", "0.7":"fixed – pinned", "0.5":"fixed – fixed", "2":"fixed – free" }[S.K]);
    if (f.unstable) return (o.innerHTML = h + '<p class="bad">The axial load is above the buckling load — no static solution exists.</p>');
    var sm = f.smax, inRod = sm.si === 1, SFs = (inRod ? rodY : tubeY) / sm.total;
    h += '<h4>Bending under the loads (static, includes the P-delta effect)</h4>' +
      row("Largest sideways deflection", fmt(Math.abs(f.maxV),"len", sys === "i" ? 4 : 3) + " at " + fmt(f.xV,"len") + " from the mount") +
      row("Largest bending moment", mfmt(Math.abs(f.maxM)) + " at " + fmt(f.xM,"len")) +
      row("Amplification by the axial load", f.amp ? "× " + num(f.amp, 3) : "—") +
      row("Highest stress", fmt(sm.total,"stress") + " in the " + (inRod ? "rod (axial + bending)" : "tube (bending; pressure stress is in step 5)") + " at " + fmt(sm.x,"len")) +
      row("Safety factor on " + (inRod ? "rod" : "tube") + " yield", num(SFs), SFs < S.SFt ? "bad" : "good") +
      row("Lateral loads used", "self-weight " + (R.feaW[0] ? fmt(R.feaW[0],"force",3) + "/m tube + oil, " + fmt(R.feaW[1],"force",3) + "/m rod" : "off") + " · side load " + fmt(S.feaSide || 0,"force"));
    h += '<div class="fig"><h4>Deflection along the cylinder</h4><div id="pl-v"></div><h4>Bending moment</h4><div id="pl-m"></div><h4>Stress (rod: axial + bending · tube: bending)</h4><div id="pl-s"></div></div>';
    h += '<h4>Mesh convergence</h4><table class="ft"><tr><th>Elements / segment</th><th>Buckling load</th><th>Max deflection</th><th>Max moment</th></tr>' +
      R.feaConv.map(function(c){ return "<tr><td>" + c.n + "</td><td>" + fmt(c.Pcr,"force") + "</td><td>" + (c.v == null ? "—" : fmt(Math.abs(c.v),"len", sys === "i" ? 5 : 3)) + "</td><td>" + (c.M == null ? "—" : mfmt(Math.abs(c.M))) + "</td></tr>"; }).join("") + "</table>";
    o.innerHTML = h;
    plot("pl-v", f.x, f.v, "len", "deflection"); plot("pl-m", f.x, f.M, "mom", "bending moment");
    var sx = f.stress.map(function(t){ return t.x; }), sy = f.stress.map(function(t){ return t.total; }); plot("pl-s", sx, sy, "stress", "stress");
  }

  /* to-scale side view */
  function drawCyl(R){
    var svg = $("cyl"); if (!svg) return;
    var D = S.D || 0.1, d = Math.min(S.d || 0.05, D * 0.95), st = S.stroke || 0.5, Do = S.Do > D ? S.Do : D * 1.2;
    var body = st + D * 0.9, total = body + st + D * 0.6, W = 720, H = 150, sc = Math.min((W - 40) / total, (H - 40) / Do);
    var x0 = 20, cy = H / 2, tl = body * sc, ho = Do * sc / 2, hi = D * sc / 2, hr = d * sc / 2, pist = Math.max(6, D * 0.25 * sc);
    var px = x0 + D * 0.45 * sc + st * sc * 0.65;
    var s = '<rect x="' + x0 + '" y="' + (cy - ho) + '" width="' + tl + '" height="' + (2 * ho) + '" rx="3" class="tb"/>' +
      '<rect x="' + (x0 + 4) + '" y="' + (cy - hi) + '" width="' + (tl - 8) + '" height="' + (2 * hi) + '" class="bo"/>' +
      '<rect x="' + px + '" y="' + (cy - hi) + '" width="' + pist + '" height="' + (2 * hi) + '" class="pi"/>' +
      '<rect x="' + (px + pist) + '" y="' + (cy - hr) + '" width="' + (x0 + tl + st * sc * 0.35 + D * 0.3 * sc - px - pist) + '" height="' + (2 * hr) + '" class="ro"/>' +
      '<line x1="' + (x0 + 6) + '" y1="' + (cy + ho + 12) + '" x2="' + (x0 + 6 + st * sc) + '" y2="' + (cy + ho + 12) + '" class="dim"/>' +
      '<text x="' + (x0 + 6 + st * sc / 2) + '" y="' + (cy + ho + 26) + '" class="dt">stroke ' + fmt(st,"len") + '</text>' +
      '<text x="' + (x0 + tl / 2) + '" y="' + (cy - ho - 8) + '" class="dt">bore ' + fmt(D,"len") + " · rod " + fmt(d,"len") + " · tube OD " + fmt(Do,"len") + "</text>";
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.innerHTML = s;
  }

  /* ---------- events ---------- */
  document.addEventListener("input", function(e){
    var k = e.target.getAttribute("data-k"); if (!k) return; var f = FD[k];
    if (f.q === "sel") S[k] = e.target.value;
    else { var v = parseFloat(e.target.value); S[k] = isFinite(v) ? v * uf(f.q)[0] : (f.def == null ? null : S[k]); }
    if (k === "thrSys" || k === "constr") visibility();
    save(); update();
  });
  document.addEventListener("change", function(e){
    var iso = e.target.getAttribute("data-iso");
    if (iso && e.target.value){ S[iso] = e.target.getAttribute("data-mm") ? +e.target.value / 1000 : +e.target.value; var inp = $("in-" + iso); if (inp) inp.value = +(S[iso] / uf("len")[0]).toFixed(6); e.target.value = ""; save(); update(); }
    var k = e.target.getAttribute("data-k"); if (k && FD[k].q === "sel"){ S[k] = e.target.value; visibility(); save(); update(); }
  });
  function setUnits(u){ sys = u; document.querySelectorAll("[data-units]").forEach(function(b){ b.setAttribute("aria-pressed", b.getAttribute("data-units") === u ? "true" : "false"); }); save(); renderSteps(); update(); }
  document.querySelectorAll("[data-units]").forEach(function(b){ b.onclick = function(){ setUnits(b.getAttribute("data-units")); }; });
  $("btnReset").onclick = function(){ loadExample(); save(); renderSteps(); update(); };
  $("btnClear").onclick = function(){ F.forEach(function(f){ var d = FD[f[0]]; if (d.q !== "sel" && ["eff","etaP","nu","Erod","Etube","beta","SFb","SFt","K"].indexOf(d.k) < 0) S[d.k] = null; }); save(); renderSteps(); update(); };
  $("toc").addEventListener("click", function(e){ var a = e.target.closest('a[href^="#step"]'); if (a) setOpen(+a.getAttribute("href").slice(5), true); });
  if ($("btnOpenAll")) $("btnOpenAll").onclick = function(){ setAll(true); };
  if ($("btnCloseAll")) $("btnCloseAll").onclick = function(){ setAll(false); };
  /* Guide: the same step pictures beside each step's write-up */
  if (window.FIGS) for (var gi = 1; gi <= 12; gi++){ var ga = $("g-s" + gi), gf = FIGS[gi]; if (ga && gf){ var gh = ga.querySelector("h2");
    gh.insertAdjacentHTML("afterend", '<figure class="pic">' + gf.svg + '<figcaption>' + esc(gf.cap) + '</figcaption></figure>'); } }
  /* views */
  function show(v){ document.querySelectorAll(".view").forEach(function(s){ s.hidden = s.id !== "view-" + v; });
    document.querySelectorAll("[data-view]").forEach(function(b){ b.setAttribute("aria-current", b.getAttribute("data-view") === v ? "page" : "false"); });
    try { history.replaceState(null, "", v === "design" ? location.pathname : "#" + v); } catch(e){} window.scrollTo(0, 0); }
  document.querySelectorAll("[data-view]").forEach(function(b){ b.onclick = function(){ show(b.getAttribute("data-view")); }; });
  window.CDshow = show;

  setUnits(sys);
  if (/^#(guide|fea|learn|refs)$/.test(location.hash)) show(location.hash.slice(1));
})();
