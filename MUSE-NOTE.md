# Note for Muse — v2: full imperial (NFPA) support (2026-11-23)

Harsh: "some people use imperial as well". The in·psi switch already converted every input and result; what was
missing was the inch SIZE SERIES. Added:
- NFPA bores 1.50, 2.00, 2.50, 3.25, 4.00, 5.00, 6.00, 8.00 in — Parker Series H (HY08-AC1314-1NA), Bosch Rexroth NFPA
  Industrial (RA 17038/08.13), Hydraulic Cylinders Inc. NFPA catalogue: all three agree.
- NFPA rods 0.625, 1.000, 1.375, 1.750, 2.000 in (same three) and 2.50, 3.00, 3.50, 4.00 in (Parker Series H + an
  independent NFPA size listing at hydraulics.ezvirtualtools.com — weaker source, flagged).
- Withheld, one source each: bore 7.00 in (Parker H only), rods 4.50–5.50 in, bores above 8 in → GAPS.md #10.
- Size pickers now list NFPA (inch) and ISO 3320 (metric) as two groups — inch first when inch units are on.
- Tie-rod threads follow the thread system (inch TPI or metric pitch); new field tieTPI.
- "Load the example" loads an inch worked example (NFPA 4.00 bore × 2.50 rod × 24 in, 2300 / 2900 psi) when inch
  units are on; metric example otherwise. Inch example: 12 OK, 4 to check, 0 failing.
Tests: 44 engine checks (2 new: the two NFPA series). Headless iPhone viewport: inch example, NFPA pick (5.00 in),
ISO stroke pick in inch mode (3.937 in), switch back to metric (127 mm) — 0 errors. sw.js cylinder-designer-v2-inch.

---

# Note for Muse — Cylinder Designer v1 (new app, 2026-11-23)

Harsh asked for a new interactive site covering "everything about hydraulic cylinders and design", research left to me.
Built as a separate repo (cylinder-designer), same conventions as SPC Tools / Materials Atlas.

## What it is
- **Design** tab: 11 guided steps, live results, OK / Check / Fails chips, printable report.
  1 Application (forces, mass, direction, stroke, speeds, working + relief pressure, efficiency) ·
  2 Bore and rod (required bore, smallest ISO 3320 bore, areas, φ, forces at working and relief pressure) ·
  3 Speed, flow and power (flows, pump size, times, out-flows incl. φ×Q on retract, oil volume, power, regeneration,
    meter-out intensification) · 4 Rod buckling (Euler / Johnson at stall force, min ISO rod, stroke-factor basic
    length + stop tube, stepped tube+rod FE model — informative) · 5 Tube (Barlow, Lamé, von Mises, min wall, bore
    growth, optional test pressure) · 6 Cap and welds (flat plate clamped / simple, min thickness, weld throat shear) ·
    7 Rod end (thread stress area metric/inch, pull and push, rod body, pin shear and bearing) · 8 Tie rods ·
    9 Cushioning (work–energy, average pressure, deceleration) · 10 Ports (velocity vs two published bands) ·
    11 Dynamics (natural frequency over stroke, oil compression).
- **Learn** tab: how it works, types, parts, design process, formulas, seals, mountings, materials, tolerances,
  failures and troubleshooting, testing, standards map, glossary.
- **Sources** tab + named gaps. Units mm·bar ↔ in·psi. Offline after first visit. Inputs remembered on the device.

## Sources (two per standard value / catalogue rule)
- ISO 3320:2013 bores/rods: ISO 2013 preview text + ISO 3320:1987 (= IS 8208:2004) + DIN ISO 3320:2013 change list.
  Bore 60 withheld (conflict). ISO 4393:2015 strokes: ISO preview + Atos KTC catalogue.
- Stroke factors (10 rows): Parker 2H HY07-1110, Parker 0106/HMI, Norgren NFPA, Atos KTC — identical.
- Stop tube 1 in per 10 in (or part) over 40 in: Peninsular, Milwaukee Cylinder, Advance Automation, ARO.
- Line velocities: STLE and HydraulicSupermarket shown side by side (they differ; not merged).
- Natural frequency: Ulrich 1971 (Int. J. Mach. Tool Des. Res.), HAWE lexicon; 4× rule Delta Motion.
- Formulas: Euler/Johnson (Shigley, Machinery's Handbook), Lamé/Barlow (Shigley, Roark), flat plates (Roark 11.2,
  RoyMech, Engineers Edge), stress area (ISO 898-1, ASME B1.1).

## Verification
tests/engine.test.js — 42 checks: forces/areas; Euler; Johnson; Euler = Johnson at the transition; FE buckling vs
Euler for 4 end conditions; FE stepped column vs the EXACT pin-pin characteristic equation (bisection, pole-free form)
within 0.2 %; stop-tube rule edges; Lamé vs Barlow and thin-wall limit; min-wall inverse; bore growth; plate
formulas and inverse; published stress areas (M20 245 mm², M24 353 mm², 1-8 0.606 in², 1/2-13 0.1419 in²);
cushion energy; natural frequency at mid-stroke. Headless Chromium desktop + iPhone viewport: 0 errors, no sideways
scroll, unit toggle, all 11 steps and the 16-row report render.

## Engineering decisions to review
- Buckling, threads, pins, tube, cap, tie rods are all checked at the RELIEF pressure (stall), not the working load.
- Cushion pressure is NOT judged against the relief setting: with drive pressure on, it always exceeds
  p_drive·A_drive/A_cushion. The user enters the cushion-chamber rating; until then the check shows "Check".
- Stepped (tube + rod) buckling is informative only — rigid gland joint overstates strength vs NFPA T3.6.37.
- Material strengths are inputs only; example values are labelled "example".

## Status
Repo: needs Harsh to create empty public repo `cylinder-designer`; code committed locally. Preview published as a
private artifact meanwhile. GAPS.md lists 9 named gaps.
