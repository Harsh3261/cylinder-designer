# Open gaps — Cylinder Designer (ranked)

Research-only: free previews, maker catalogues, cross-standard equivalents, open papers. Nothing bought.

| # | Gap | Status / why open | What would close it |
|---|-----|-------------------|---------------------|
| 1b | ISO/TS 13725:2021 (max allowable load vs rod yield) and NFPA T3.6.37 verbatim | Paywalled | — (stays named) |
| 1c | Gland joint stiffness Kf from wear-ring geometry | Baragetti & Villa Eq. 33 as extracted does not reproduce their own Table 3 Kf (units/×10³ unclear) | A clean copy of Eq. 33 + their worked numbers. Meanwhile Kf is a user input; the model itself is validated |
| 2 | Head retention: thread, wire ring, bolted head | Not researched to two sources yet | Wire-ring: ring-maker thrust-load method + a design text; threaded head: thread shear area (FED-STD-H28 / Machinery's Handbook) |
| 3 | Thread stripping and rod-eye section (2D plane-stress lug FEA proposed, not built) | Stripping needs thread limit dimensions (Kn max, Es min); rod eye = pin-connected plate method | Machinery's Handbook / FED-STD-H28 stripping area + ISO 965 limits (SPC Tools has them); ASME BTH-1 pin-connected plates. Lug FEA needs pin–hole CONTACT (bearing pressure is not a known distribution) and published pin-loaded-lug Kt data to verify against (Peterson — not free); the open-hole K = 3 check alone would not verify a pin-loaded lug |
| 5 | ISO 3320:2013 rod (120) | ISO 2013 text shows (120) in a rod row; the DIN change list read earlier says (120) deleted — conflict | ISO 3320:2013 Table 3 itself |
| 6 | ISO 3320 Table 4 area ratios | Preferred φ list known (1.06, 1.12, 1.25, 1.33, 1.4, 1.6, 2, 2.5, 5 — ISO 3320:2013 §6.2), full table not extracted; φ itself is computed | A readable Table 4 + one catalogue |
| 7 | ISO 4395 rod-end thread per rod size | ISO 4395 lists KK sizes but not rod pairing; candidate pairs from Parker MMB + Atos KTC: rod 22→M16×1.5, 28→M20×1.5, 36→M27×2 (agree); others unpaired | ISO 6020-2 tables (rod → KK) + a second catalogue |
| 8 | Seal friction model; fatigue (NFPA T2.6.1 / ISO 10771) | Not modelled | Seal-maker friction data; fatigue standard previews |
| 9 | Peak cushion pressure | Only the average is computed (and used for the tube check) | Cushion design paper + a maker's method |

## Closed
- 2026-11-27: #1a′ DNV mountings other than pinned–pinned — CG-0194 (Jul 2017) has NO fixation figures in §4 (its Figure 4 is the clause 9.2 welding steering-edge figure; no Figure 5; Figs. 1–3 are arrangement sketches without factors — Satureday, full 15-page read). The rule is text, §4.4: "For other mounting configurations, L1 and L2 shall be calculated as effective lengths described by Euler method." Implemented as K·L1, K·L2 with the step-4 K; test: uniform column reduces to Euler with K for all four end conditions. §4.5.2 (≥ 2.7 for a Society-approved more accurate method) recorded on the Sources tab.
- 2026-11-27: #1a DNV-GL CG-0194 whole-cylinder buckling (Edition July 2017, §4.2) — transcribed by Satureday; confirmed by independent derivation (flexibility-weighted sine mode), reduction to Euler for I1 = I2, and the printed mm/kN form = engine SI form. Narvydas 2016 Table 1 could NOT serve as the check: it has no DNV column, and its "linear TRD" FEA values fall below rod-only Euler, which a rigid-joint two-segment column cannot do. Finding: DNV reads 0–18 % above the exact rigid-joint elastic load (e.g. 4.054 vs 3.855 kN on the Baragetti actuator).
- 2026-11-27: #4 ISO 3320 bore 60 — not in the standard's bore list (ISO 3320:2013 Table 4 bore row) and DIN change list agrees; "60" was the non-preferred rod.
- 2026-11-27: #10 NFPA bore 7.00, 10, 12, 14 in and rods 4.50, 5.00, 5.50 in — paired (see engine.js comment).
- 2026-11-27: tube + rod buckling with gland flexibility (substance of old gap 1) — Baragetti & Villa 2016 model implemented and reproduced (3855 / 3111 / 3629 N).
