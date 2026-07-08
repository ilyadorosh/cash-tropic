#!/usr/bin/env python3
"""Quantize NCA weights to uint16 for the web (8x smaller, ~3e-5 max error).

Usage: python3 scripts/quantize-nca.py [public/nca_weights.json]
Writes <input-dir>/nca_weights.q16.json, which the engine
(app/nca/player/engine.ts fetchWeights/normalizeWeights) loads preferentially.
Re-run after every retrain/export from the notebook.
"""
import base64
import json
import os
import struct
import sys

src = sys.argv[1] if len(sys.argv) > 1 else "public/nca_weights.json"
dst = os.path.join(os.path.dirname(src), "nca_weights.q16.json")

d = json.load(open(src))
out = {"meta": d["meta"], "q": 16, "arrays": {}}
for k in ["w1", "w2", "b1", "b2", "embed"]:
    arr = d[k]
    lo, hi = min(arr), max(arr)
    span = (hi - lo) or 1.0
    qs = [round((v - lo) / span * 65535) for v in arr]
    out["arrays"][k] = {
        "lo": lo,
        "hi": hi,
        "n": len(arr),
        "b64": base64.b64encode(struct.pack("<%dH" % len(qs), *qs)).decode(),
    }
    err = max(abs((lo + q / 65535 * span) - v) for q, v in zip(qs, arr))
    print(f"{k}: n={len(arr)} range=[{lo:.4f},{hi:.4f}] max_err={err:.2e}")

json.dump(out, open(dst, "w"), separators=(",", ":"))
print(f"{src}: {os.path.getsize(src)} B -> {dst}: {os.path.getsize(dst)} B")
