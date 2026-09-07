"""Reproduce the P032 orientation measurement and fit (requires Pillow and NumPy).

Usage: python3 measure-focus.py /path/to/P032.png
Use the official image at width=1400, linked in sources.json. Grid centers were
located manually; this is a measurement of one reference, not a general detector.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

image = np.array(Image.open(sys.argv[1]).convert('RGB'))
if image.shape[1] != 1400:
    raise SystemExit('Use the 1400 px wide P032 reference image.')
angles = []
for row in range(12):
    line = []
    for col in range(24):
        x, y = 123 + 50.3 * col, 118 + 50.4 * row
        x0, y0 = int(x - 22), int(y - 22)
        crop = image[y0:int(y + 23), x0:int(x + 23)]
        yy, xx = np.mgrid[:crop.shape[0], :crop.shape[1]]
        xx, yy = xx + x0 - x, yy + y0 - y
        mask = (xx**2 + yy**2 < 22**2) & (crop.max(axis=2) < 100)
        points = np.array([xx[mask], yy[mask]])
        axis = np.linalg.eigh(np.cov(points))[1][:, -1]
        line.append(np.arctan2(axis[1], axis[0]))
    angles.append(line)
a = np.rad2deg(np.unwrap(np.unwrap(np.array(angles) * 2, axis=1), axis=0) / 2)
yy, xx = np.mgrid[:12, :24]
best = None
for x in np.arange(10.5, 11.61, .025):
    for y in np.arange(-1.5, .51, .025):
        radius = np.hypot(xx - x, yy - y)
        design = np.column_stack([radius.flatten(), np.ones(288)])
        slope, offset = np.linalg.lstsq(design, a.flatten(), rcond=None)[0]
        residual = np.std(design @ [slope, offset] - a.flatten())
        candidate = (residual, x, y, slope, offset)
        if best is None or residual < best[0]:
            best = candidate
keys = ['rmsDegrees', 'focusColumn', 'focusRow', 'degreesPerCell', 'offsetDegrees']
print(json.dumps(dict(zip(keys, map(float, best))), indent=2))
