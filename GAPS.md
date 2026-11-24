# Open gaps — Cylinder Designer (ranked)

| # | Gap | Why open | What would close it |
|---|-----|----------|---------------------|
| 1 | NFPA T3.6.37 buckling (rod + tube with gland bearing clearance) | Standard not read; the app's stepped-column model assumes a rigid gland joint (unconservative, labelled informative) | NFPA T3.6.37 text + a worked example to test against |
| 2 | Head retention: thread, wire ring, bolted head | Not modelled | Formulas from a design text + a manufacturer's method |
| 3 | Thread stripping and rod-eye section | Not modelled | ISO / Machinery's Handbook stripping method; rod-eye (lug) method (e.g. ASME BTH-1 pin-connected plates) |
| 4 | ISO 3320 bore 60 mm | DIN ISO 3320:2013 says deleted; ISO 3320:2013 preview text lists it | ISO 3320:2013 Table 2 itself |
| 5 | ISO 3320:2013 rod list — which values are parenthesised beyond (30), (60) | Built from the 1987 table + DIN change list | ISO 3320:2013 Table 3 itself |
| 6 | ISO 3320 Table 4 area ratios | Not in readable sources | ISO 3320:2013 |
| 7 | ISO 4395 rod-end thread table (rod Ø → thread) | Not loaded | ISO 4395 + a catalogue |
| 8 | Seal friction model; fatigue life of tube and mounts (NFPA T2.6.1 / ISO 10771) | Not modelled | Seal-maker friction data; fatigue standard |
| 10 | NFPA bore 7.00 in; rods 4.50, 5.00, 5.50 in; bores 10–14 in | Only one catalogue each so far | A second NFPA catalogue (e.g. Rexroth / Milwaukee / Sheffer) listing them |
| 9 | Peak cushion pressure (profile-dependent) | Only the average is computed | Cushion design paper (Rao & Sanaullah, IISc) + a manufacturer's method |
