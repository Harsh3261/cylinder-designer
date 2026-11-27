# Note for Muse — v5: Guide tab for Harsh (2026-11-27)

Harsh: "i have no idea what this is". Added a **Guide** tab on the site (between Design and Learn), plain language:
what the site is; what OK / Check / Fails mean (Check = within 15 % under the requirement, a recommendation, or a
missing input); what to have in hand before checking a real cylinder; all 11 steps — what each asks, what it tells you,
the worked example's numbers and why, and a one-line "say it out loud"; the report; honest limits (rod-only
Euler/Johnson governs; DNV reads 0–18 % high and is judged only against its own 4; open gaps listed); glossary.
Every number quoted was read from the live app with "Load the example" (metric): 125.66 / 64.09 kN at 160 bar;
157.08 / 80.11 kN stall; φ 1.961; smallest bore 85.4 mm (ISO 90); 47.1 L/min; 92.4 L/min cap outflow; 12.57 kW;
392.2 bar intensification; Euler 663.78 kN, SF 4.23; stop tube 76.2 mm from basic length 1,600 mm; rigid 1,188.25 kN;
DNV 1,403.47 kN (8.93); tube 16.5 mm wall, SF 4.45 at relief, 2.14 at 415.5 bar rod cushion; bore growth 34.1 µm;
cap 42 MPa SF 8.52 (min 14.5 mm); weld 47 MPa factor 2.55; rod thread 63 MPa SF 8.21; piston thread 88 MPa SF 5.94;
rod 41 / 21 MPa; pin 63 MPa SF 5.91; cushions 122.0 / 415.5 bar (3 J kinetic vs 3,929 J total); ports 4.90 / 2.50 m/s;
natural frequency 40.7 Hz at 512 mm; report 15 OK / 4 Check / 0 failing.
Deep link: …/cylinder-designer/#guide. Headless desktop + iPhone: 17 sections, 0 errors, no sideways scroll.
sw.js cylinder-designer-v5-guide. No engine change (54 tests pass).

---

# Note for Muse — v4: DNV-GL CG-0194 buckling implemented, gap 1a closed (2026-11-27)

Satureday's transcription (CG-0194 Edition July 2017, §4.2, page image):
  Z = L1/I1 + L2/I2 + (1/I2 − 1/I1)·L/(2π)·sin(2π·L1/L);   F_E = E·π²/(1000·L·Z) kN (mm, N/mm²); accept F_E/Pa ≥ 4.

## How it was checked (Narvydas Table 1 could not be the check)
- Narvydas 2016 Table 1 has NO DNV column (Euler, Tetmajer, FEA linear/nonlinear TRD, Johnson only), and its "linear
  TRD" FEA stresses sit BELOW rod-only Euler (142 vs 153 MPa at λ = 113) — impossible for a rigid-joint two-segment
  column, so his FEA includes joint behaviour not specified in the paper. It cannot validate the formula.
- Instead: (1) independent derivation — a pinned–pinned column with a sine mode and flexibility (1/EI) weighting along
  tube and rod gives exactly L·Z with Z as transcribed, L1 = tube segment, so the transcription (including which length
  goes with which inertia) is confirmed; (2) I1 = I2 reduces exactly to Euler; (3) the printed mm/kN form with the 1000
  factor equals the engine's SI form (test).
- FINDING for Harsh: DNV reads 0–18 % ABOVE the exact rigid-joint elastic load from the same geometry (Baragetti
  actuator 4.054 vs exact 3.855 kN, +5 %; 100/70 × 800 example +18 %; equal-I 0 %). It is an assumed-mode estimate;
  DNV's factor 4 covers it. The app shows F_E only against DNV's own ≥ 4, never as the exact load.

## In the app
- Step 4: "DNV-GL CG-0194 (Jul 2017) whole-cylinder load F_E" + factor vs ≥ 4; report check "Whole-cylinder buckling
  per DNV-GL CG-0194 (F_E / stall ≥ 4)" — pass ≥ 4 else "Check". Load = stall at relief (worst case).
- Applied only for pinned–pinned (K = 1.0); other fixations → new gap 1a′ (Figs. 4–5 length rules, garbled in free
  copies). Governing check stays rod-only Euler/Johnson.
- Edition: July 2017 is the edition read. If a later CG-0194 edition exists, the edition watch should flag it.

Tests: 54 (new: printed kN form = SI form; Baragetti actuator 4.054 kN; I1 = I2 → Euler; DNV ≥ exact and within 20 %).
Metric example: 15 OK / 4 to check / 0 failing; DNV F_E 1,403.47 kN, factor 8.93. sw.js cylinder-designer-v4-dnv.

---

# Note for Muse — v3: real two-direction worst-case checker + gap wave (2026-11-27)

## 1. Buckling (old gap 1) — what was closable for free, and what was not
- DONE (route B): tube + rod column with gland joint stiffness Kf, per Baragetti & Villa 2016 (Math. Probl. Eng.
  3781397, open PDF at aisberg.unibg.it). The FE model (Euler–Bernoulli + geometric stiffness, rotational spring at the
  gland) reproduces their Table 3: rigid (Timoshenko) 3855 N → app 3855.5; Kf 8071·10³ N·mm/rad → 3111.1 (paper 3111);
  Kf 29777·10³ → 3629.4 (paper 3629). Their own Eq. 11 (rigid characteristic equation), solved independently in the
  test, gives the same 3856 N.
  Paper inconsistency recorded: Table 1 prints Jc = 16,286 mm⁴, but its stated 25/30 mm cylinder gives 20,586 mm⁴; only
  20,586 reproduces 3855 N. Table 1 Kf 26,111·10³ matches neither Table 3 row.
- NOT DONE (route A, DNV): Narvydas 2016 (KTU open PDF) + DNVGL-CG-0194 confirm the structure PE = π²E/(L·Z) with
  Z(I1, I2, L1, L2) and acceptance PE/Pa ≥ 4 (≥ 2.7 with approved accurate methods; cranes 2.3). The Z expression did not
  survive text extraction from ANY free copy I could reach (DNV PDF robots-blocked for my fetcher; KTU, studylib, Gale,
  researchgate copies garble it). → Gap 1a. REQUEST: Satureday, please quote CG-0194 §4 Z verbatim from the DNV PDF
  (or Narvydas Eq. 4); I will implement and test it against Narvydas Table 1 the same day.
- App labelling: rod-only Euler/Johnson stays the GOVERNING check. Tube + rod is shown as "informative": rigid joint
  (upper bound) and, if Kf is entered, the Baragetti joint-stiffness result with its factor. The DNV ≥ 4 criterion is
  quoted as DNV's, not applied to a non-DNV result. ISO/TS 13725 (max allowable load vs rod yield) named as different and
  not implemented (1b).

## 2. Real checker, both directions, worst case (Harsh's directive)
- Step 2 now shows a force table: extension vs retraction × needed / working / relief-stall, and what each does to
  the rod (compression + buckling vs tension).
- RETRACTION (tension) checks added, all at relief stall: rod body tension; rod neck at the thread relief (new optional
  input); piston-to-rod thread (new inputs: piston-end thread d × P / TPI), load = relief × A2 (rod side pressurised,
  cap to tank — the nut/thread holds the piston); rod-end thread on pull (existing).
- EXTENSION: rod compression, rod buckling (governing), stepped column informative, stop tube.
- INTENSIFICATION: new input "Can the rod side be metered out or blocked?" (default yes = worst case). The tube is now
  checked at the HIGHEST chamber pressure: max(relief, relief·φ, cap-cushion p̄, rod-cushion p̄), with the governing
  case named. Previously the tube was checked at relief only — unconservative when φ > 1 or with cushions.
- Every check label says direction + load case; Sources/Learn list method + source.

## 3. Adversarial self-review — bugs found and fixed
1. Cushion gravity SIGN was inverted at both cushions (vertical cylinders): cap cushion (end of retract) on an
   upward-extending cylinder must ADD m·g (load falling into it); it subtracted. Fixed; engine test added.
2. Tube check at relief only (see above) — fixed.
3. Worked examples: with the tube now checked at cushion pressure, the metric example's 80 mm rod collar in a 100 mm bore
   gave 556 bar average cushion pressure → tube safety factor 1.17 (real physics: relief × A1 / small annulus). Example
   changed to collar 72 mm + tube OD 133 mm (415 bar, SF 2.14); inch example collar 2.625 in + tube OD 5.25 in.
   Both examples: 14 OK, 4 to check, 0 failing.
4. Cushion drive pressure kept at RELIEF (worst case per Harsh). Parker's method uses operating pressure; flagged here.

## 4. Gap wave
- Closed: #4 (no ISO 3320 bore 60 — standard's bore list + DIN), #10 (NFPA 7.00, 10, 12, 14 in bores; 4.50, 5.00,
  5.50 in rods — sources in engine.js), old #1 substance (route B).
- Researched, still open, with the route recorded: 1a DNV Z, 1b ISO/NFPA text, 1c Kf from geometry, 2 head retention,
  3 stripping / rod eye, 5 rod (120) conflict, 6 Table 4, 7 ISO 4395 pairing (3 agreeing pairs found), 8 friction /
  fatigue, 9 peak cushion. See GAPS.md.

## Verification
tests/engine.test.js: 50 checks (new: Baragetti rigid 3855, Kf 3111, Kf 3629, Eq. 11 root, Kf monotonic, cushion
gravity, NFPA series). Headless desktop + iPhone, metric and inch examples: 0 page errors, no sideways scroll.
sw.js cylinder-designer-v3-checker.

Smoke values for live verification (metric example): status 14 OK / 4 to check / 0 failing; push stall 157.08 kN;
pull stall 80.11 kN; tube SF 2.14 at 415.5 bar (rod cushion); piston thread SF 5.94; rod tension SF 24.98.

---

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
