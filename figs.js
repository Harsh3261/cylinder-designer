/* Cylinder Designer — step pictures. Explanatory sketches (not to scale), one per design step.
   UI only: no data, no calculations. Each picture has a plain-language caption saying what the step checks. */
var FIGS = (function(){
  var C = { tube:"#2a3444", tubeL:"#46536a", bore:"#1a2a33", rod:"#c9d3df", rodL:"#8d99a8", pis:"#f0a33a", acc:"#4fb3c9", txt:"#9aa6b8", ink:"#e8ecf2", oil:"#3a6e7c", bad:"#e5604d", ok:"#3fb87a" };
  var defs = '<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + C.acc + '"/></marker>' +
    '<marker id="fo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + C.pis + '"/></marker></defs>';
  function svg(body, label){ return '<svg viewBox="0 0 340 130" role="img" aria-label="' + label + '" xmlns="http://www.w3.org/2000/svg">' + defs + body + "</svg>"; }
  function t(x, y, s, o){ o = o || {}; return '<text x="' + x + '" y="' + y + '" fill="' + (o.c || C.txt) + '" font-size="' + (o.fs || 11) + '" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif"' + (o.a ? ' text-anchor="' + o.a + '"' : "") + (o.b ? ' font-weight="700"' : "") + ">" + s + "</text>"; }
  function arrow(x1, y1, x2, y2, c, w){ return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c === "o" ? C.pis : C.acc) + '" stroke-width="' + (w || 2) + '" marker-end="url(#' + (c === "o" ? "fo" : "fa") + ')"/>'; }
  /* a plain cylinder side view: tube x0..x1, rod out to xr, centre y */
  function cyl(x0, x1, xr, y, h, rh, cut){
    h = h || 34; rh = rh || 12; var s = "";
    s += '<rect x="' + (x0 - 10) + '" y="' + (y - 7) + '" width="12" height="14" rx="6" fill="' + C.tube + '" stroke="' + C.tubeL + '"/>';
    s += '<rect x="' + x0 + '" y="' + (y - h / 2) + '" width="' + (x1 - x0) + '" height="' + h + '" rx="3" fill="' + C.tube + '" stroke="' + C.tubeL + '"/>';
    if (cut) s += '<rect x="' + (x0 + 6) + '" y="' + (y - h / 2 + 5) + '" width="' + (x1 - x0 - 12) + '" height="' + (h - 10) + '" fill="' + C.bore + '"/>';
    var px = cut ? x0 + (x1 - x0) * 0.45 : null;
    if (cut) s += '<rect x="' + px + '" y="' + (y - h / 2 + 5) + '" width="8" height="' + (h - 10) + '" fill="' + C.pis + '"/>';
    s += '<rect x="' + (cut ? px + 8 : x1) + '" y="' + (y - rh / 2) + '" width="' + (xr - (cut ? px + 8 : x1)) + '" height="' + rh + '" fill="' + C.rod + '" stroke="' + C.rodL + '"/>';
    s += '<circle cx="' + (xr + 6) + '" cy="' + y + '" r="8" fill="' + C.tube + '" stroke="' + C.tubeL + '"/><circle cx="' + (xr + 6) + '" cy="' + y + '" r="3" fill="' + C.bore + '"/>';
    return s;
  }
  var P = {};
  P[1] = { cap:"Say what the cylinder must do: how hard it pushes and pulls, how far, how fast, and at what pressure. The maximum (relief) pressure is the one every strength check uses.",
    svg:svg(cyl(30, 170, 236, 62, 36, 12, true) +
      '<rect x="252" y="36" width="56" height="52" rx="4" fill="#1b212b" stroke="' + C.tubeL + '"/>' + t(280, 66, "load", { a:"middle", c:C.ink }) +
      arrow(250, 104, 310, 104) + t(280, 122, "push (extend)", { a:"middle" }) + arrow(310, 22, 250, 22, "o") + t(280, 15, "pull (retract)", { a:"middle" }) +
      '<line x1="104" y1="96" x2="170" y2="96" stroke="' + C.acc + '" stroke-dasharray="3 3"/>' + t(137, 112, "stroke", { a:"middle" }) +
      t(30, 20, "pressure p", { c:C.pis }) + arrow(60, 30, 85, 50, "o", 1.5), "Cylinder pushing and pulling a load") };
  P[2] = { cap:"Force = pressure × area. Pushing uses the full bore area A1; pulling only gets the ring around the rod, A2. The ratio A1/A2 tells you how much weaker and faster the retract stroke is.",
    svg:svg('<circle cx="80" cy="64" r="44" fill="' + C.pis + '" fill-opacity=".35" stroke="' + C.pis + '"/>' + t(80, 68, "A1", { a:"middle", c:C.ink, fs:14, b:1 }) + t(80, 124, "push: full bore", { a:"middle" }) +
      '<circle cx="230" cy="64" r="44" fill="' + C.acc + '" fill-opacity=".35" stroke="' + C.acc + '"/><circle cx="230" cy="64" r="22" fill="' + C.rod + '" stroke="' + C.rodL + '"/>' +
      t(230, 68, "rod", { a:"middle", c:"#1a1205" }) + t(268, 30, "A2", { c:C.ink, fs:14, b:1 }) + t(230, 124, "pull: ring only", { a:"middle" }) +
      t(150, 60, "F = p × A", { a:"middle", c:C.ink, fs:12 }), "Bore area versus ring area") };
  P[3] = { cap:"Speed comes from oil flow: speed = flow ÷ area. The small ring area makes retraction faster for the same pump flow. This step sizes the pump and its power.",
    svg:svg('<circle cx="40" cy="66" r="20" fill="#1b212b" stroke="' + C.tubeL + '"/>' + t(40, 70, "pump", { a:"middle", c:C.ink, fs:10 }) +
      '<path d="M60 66H104" stroke="' + C.oil + '" stroke-width="6"/>' + arrow(66, 50, 100, 50) + t(83, 42, "flow Q", { a:"middle" }) +
      cyl(110, 230, 290, 66, 36, 12, true) + arrow(240, 100, 300, 100, "o") + t(270, 118, "speed v = Q ÷ A", { a:"middle" }), "Pump flow driving the rod") };
  P[4] = { cap:"Pushing makes the rod a long, thin column. Fully extended it can bow sideways and buckle well below its yield strength. This step checks the rod alone and the whole tube + rod.",
    svg:svg('<circle cx="22" cy="66" r="7" fill="' + C.tube + '" stroke="' + C.tubeL + '"/>' +
      '<rect x="30" y="49" width="120" height="34" rx="3" fill="' + C.tube + '" stroke="' + C.tubeL + '" transform="rotate(-3 90 66)"/>' +
      '<path d="M150 62 Q230 30 306 66" fill="none" stroke="' + C.rod + '" stroke-width="11"/>' +
      '<circle cx="312" cy="66" r="7" fill="' + C.tube + '" stroke="' + C.tubeL + '"/>' +
      arrow(8, 104, 40, 104) + arrow(330, 104, 296, 104) + t(170, 120, "compression from both pins", { a:"middle" }) +
      '<path d="M150 66H306" stroke="' + C.acc + '" stroke-dasharray="3 3"/>' + t(228, 28, "bows sideways", { a:"middle", c:C.bad }), "Rod bowing under compression") };
  P[5] = { cap:"Oil pressure pushes the tube wall outward. The wall must hold the highest pressure any chamber can see, including cushion spikes and rod-side intensification, with your safety factor.",
    svg:svg('<circle cx="100" cy="66" r="52" fill="' + C.tube + '" stroke="' + C.tubeL + '"/><circle cx="100" cy="66" r="38" fill="' + C.oil + '"/>' +
      arrow(100, 66, 100, 32) + arrow(100, 66, 134, 66) + arrow(100, 66, 66, 66) + arrow(100, 66, 100, 100) + t(100, 125, "pressure on the bore", { a:"middle" }) +
      '<path d="M100 12 A54 54 0 0 1 152 52" fill="none" stroke="' + C.pis + '" stroke-width="2" marker-end="url(#fo)"/>' + t(160, 30, "hoop stress", { c:C.pis }) +
      t(190, 70, "wall thickness t", { c:C.ink }) + t(190, 88, "too thin → bulges or bursts", {}), "Pressure inside the tube") };
  P[6] = { cap:"The cap closing the bore acts like a flat plate under pressure, and its weld carries the full end load (pressure × bore area). Both are checked against yield.",
    svg:svg('<rect x="110" y="20" width="200" height="16" fill="' + C.tube + '" stroke="' + C.tubeL + '"/><rect x="110" y="96" width="200" height="16" fill="' + C.tube + '" stroke="' + C.tubeL + '"/>' +
      '<rect x="110" y="36" width="200" height="60" fill="' + C.oil + '"/>' +
      '<path d="M80 20H104V112H80Z" fill="' + C.tube + '" stroke="' + C.tubeL + '"/><path d="M104 36 Q96 66 104 96" fill="none" stroke="' + C.bad + '" stroke-dasharray="3 2"/>' +
      '<path d="M104 20 L114 20 L104 10Z M104 112 L114 112 L104 122Z" fill="' + C.pis + '"/>' + t(124, 12, "weld", { c:C.pis }) +
      arrow(180, 66, 112, 66) + t(200, 70, "pressure on the cap", {}) + t(40, 70, "cap", { a:"middle", c:C.ink }), "Cap plate and weld under pressure") };
  P[7] = { cap:"The rod end carries the load into the machine. Pulling stretches the threads and any neck undercut; the pin shears across its planes. Each is checked at maximum pressure.",
    svg:svg('<rect x="20" y="54" width="150" height="24" fill="' + C.rod + '" stroke="' + C.rodL + '"/>' +
      '<path d="M170 56 l6 -4 l6 4 l6 -4 l6 4 l6 -4 l6 4 l6 -4 l6 4V76 l-6 4 l-6 -4 l-6 4 l-6 -4 l-6 4 l-6 -4 l-6 4 l-6 -4Z" fill="' + C.rod + '" stroke="' + C.pis + '"/>' +
      t(196, 46, "thread", { a:"middle", c:C.pis }) +
      '<rect x="224" y="44" width="70" height="44" rx="22" fill="' + C.tube + '" stroke="' + C.tubeL + '"/><circle cx="270" cy="66" r="11" fill="' + C.rod + '" stroke="' + C.rodL + '"/>' +
      '<line x1="270" y1="34" x2="270" y2="98" stroke="' + C.bad + '" stroke-dasharray="3 2"/>' + t(270, 116, "pin in shear", { a:"middle" }) +
      arrow(60, 104, 20, 104) + t(80, 118, "pull = tension", {}), "Rod end thread and pin") };
  P[8] = { cap:"In tie-rod cylinders the long rods clamp the caps to the tube. Together they carry pressure × bore area; each rod's thread stress is checked.",
    svg:svg('<rect x="60" y="40" width="200" height="52" fill="' + C.tube + '" stroke="' + C.tubeL + '"/>' +
      '<rect x="40" y="26" width="22" height="80" fill="#1b212b" stroke="' + C.tubeL + '"/><rect x="258" y="26" width="22" height="80" fill="#1b212b" stroke="' + C.tubeL + '"/>' +
      '<line x1="30" y1="32" x2="292" y2="32" stroke="' + C.pis + '" stroke-width="4"/><line x1="30" y1="100" x2="292" y2="100" stroke="' + C.pis + '" stroke-width="4"/>' +
      '<rect x="24" y="27" width="8" height="10" fill="' + C.rodL + '"/><rect x="290" y="27" width="8" height="10" fill="' + C.rodL + '"/><rect x="24" y="95" width="8" height="10" fill="' + C.rodL + '"/><rect x="290" y="95" width="8" height="10" fill="' + C.rodL + '"/>' +
      t(160, 20, "tie rods hold the caps on", { a:"middle", c:C.pis }) + arrow(150, 66, 70, 66) + arrow(170, 66, 250, 66) + t(160, 124, "pressure pushes the caps apart", { a:"middle" }), "Tie rods clamping the caps") };
  P[9] = { cap:"Near the end of stroke a spear or collar traps a small ring of oil, which brakes the load. That trapped oil can reach pressures far above the relief setting, so it is checked against your limit.",
    svg:svg('<rect x="30" y="30" width="230" height="72" fill="' + C.tube + '" stroke="' + C.tubeL + '"/><rect x="36" y="36" width="218" height="60" fill="' + C.bore + '"/>' +
      '<rect x="150" y="36" width="10" height="60" fill="' + C.pis + '"/><rect x="160" y="58" width="130" height="16" fill="' + C.rod + '" stroke="' + C.rodL + '"/>' +
      '<rect x="96" y="56" width="54" height="20" fill="' + C.rod + '" stroke="' + C.rodL + '"/>' + t(116, 50, "spear", { a:"middle", c:C.ink }) +
      '<rect x="36" y="48" width="40" height="36" fill="' + C.bad + '" fill-opacity=".5"/>' + t(56, 118, "trapped oil: high pressure", { a:"middle", c:C.bad }) +
      arrow(250, 20, 180, 20, "o") + t(300, 24, "moving in", { a:"middle" }), "Cushion spear trapping oil") };
  P[10] = { cap:"All the oil goes through the ports. Too small a passage means high oil velocity, heat, noise and pressure loss. The cap port carries the most flow on extension.",
    svg:svg(cyl(40, 250, 300, 76, 40, 12, true) +
      '<rect x="56" y="30" width="18" height="26" fill="#1b212b" stroke="' + C.tubeL + '"/><rect x="216" y="30" width="18" height="26" fill="#1b212b" stroke="' + C.tubeL + '"/>' +
      arrow(65, 6, 65, 52) + t(80, 16, "cap port: big flow", {}) + arrow(225, 52, 225, 6) + t(240, 16, "rod port", {}) +
      t(150, 124, "velocity = flow ÷ passage area", { a:"middle" }), "Oil flowing through the ports") };
  P[11] = { cap:"Oil is slightly springy. The piston sits between two oil springs with the load mass on it, so the system has a natural frequency. Too low a frequency gives bounce and jerky motion.",
    svg:svg('<rect x="20" y="40" width="20" height="52" fill="' + C.tube + '"/>' +
      '<path d="M40 66 l10 -14 l10 28 l10 -28 l10 28 l10 -28 l10 28 l10 -14" fill="none" stroke="' + C.acc + '" stroke-width="2.5"/>' +
      '<rect x="120" y="38" width="14" height="56" fill="' + C.pis + '"/>' +
      '<path d="M134 66 l10 -14 l10 28 l10 -28 l10 28 l10 -28 l10 28 l10 -14" fill="none" stroke="' + C.acc + '" stroke-width="2.5"/>' +
      '<rect x="214" y="40" width="20" height="52" fill="' + C.tube + '"/>' + '<line x1="127" y1="94" x2="127" y2="104" stroke="' + C.rodL + '" stroke-width="4"/>' +
      '<rect x="100" y="104" width="54" height="20" rx="3" fill="#1b212b" stroke="' + C.tubeL + '"/>' + t(127, 118, "mass", { a:"middle", c:C.ink }) +
      t(80, 30, "oil spring", { a:"middle", c:C.acc }) + t(174, 30, "oil spring", { a:"middle", c:C.acc }) +
      t(250, 62, "springy oil", {}) + t(250, 78, "+ heavy load", {}) + t(250, 94, "= it can bounce", { c:C.ink }), "Oil springs either side of the piston") };
  P[12] = { cap:"Pressure on the rod side pushes the gland out of the tube and pushes the piston against its nut. Their threads (or the ring holding the gland) must not strip or shear at the highest rod-side pressure.",
    svg:svg('<rect x="20" y="24" width="250" height="84" fill="' + C.tube + '" stroke="' + C.tubeL + '"/><rect x="26" y="36" width="190" height="60" fill="' + C.oil + '"/>' +
      '<rect x="60" y="36" width="14" height="60" fill="' + C.pis + '"/><rect x="48" y="54" width="12" height="24" fill="' + C.rodL + '"/>' + t(54, 50, "nut", { a:"middle", c:C.ink, fs:10 }) +
      '<rect x="74" y="58" width="246" height="16" fill="' + C.rod + '" stroke="' + C.rodL + '"/>' +
      '<rect x="216" y="36" width="54" height="22" fill="#1b212b" stroke="' + C.tubeL + '"/><rect x="216" y="74" width="54" height="22" fill="#1b212b" stroke="' + C.tubeL + '"/>' +
      '<path d="M216 36 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" fill="none" stroke="' + C.pis + '" stroke-width="2"/>' +
      t(243, 18, "gland thread", { a:"middle", c:C.pis }) + arrow(150, 44, 206, 44) + arrow(150, 88, 206, 88) + arrow(140, 66, 82, 66, "o") +
      t(150, 124, "rod-side pressure pushes both ways", { a:"middle" }), "Gland and piston nut under rod-side pressure") };
  return P;
})();
