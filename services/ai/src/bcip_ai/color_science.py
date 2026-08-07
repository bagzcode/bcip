"""Pure-Python color conversions and CIEDE2000 for Hue Seer baseline.

Assumptions (documented for reproducibility):
- Display RGB is sRGB (IEC 61966-2-1), D65 white point, 2° observer.
- Lab uses CIE 1976 L*a*b* with D65 reference white (Xn,Yn,Zn)=(0.95047,1.0,1.08883).
- CIEDE2000 follows Sharma, Wu, Dalal (2005).
- Ordinary photograph RGB values are NOT treated as calibrated measurements.
"""

from __future__ import annotations

import math
from typing import Sequence

# D65 / 2°
_XN, _YN, _ZN = 0.95047, 1.0, 1.08883


def _srgb_to_linear(c: float) -> float:
    c = c / 255.0
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def rgb_to_xyz(r: int, g: int, b: int) -> tuple[float, float, float]:
    rl, gl, bl = _srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b)
    x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
    y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
    z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041
    return x, y, z


def _f_lab(t: float) -> float:
    delta = 6 / 29
    if t > delta**3:
        return t ** (1 / 3)
    return t / (3 * delta**2) + 4 / 29


def xyz_to_lab(x: float, y: float, z: float) -> tuple[float, float, float]:
    fx, fy, fz = _f_lab(x / _XN), _f_lab(y / _YN), _f_lab(z / _ZN)
    L = 116 * fy - 16
    a = 500 * (fx - fy)
    b = 200 * (fy - fz)
    return L, a, b


def rgb_to_lab(r: int, g: int, b: int) -> tuple[float, float, float]:
    return xyz_to_lab(*rgb_to_xyz(r, g, b))


def lab_to_lch(L: float, a: float, b: float) -> tuple[float, float, float]:
    C = math.hypot(a, b)
    h = math.degrees(math.atan2(b, a)) % 360
    return L, C, h


def rgb_to_hsv(r: int, g: int, b: int) -> tuple[float, float, float]:
    rf, gf, bf = r / 255.0, g / 255.0, b / 255.0
    mx, mn = max(rf, gf, bf), min(rf, gf, bf)
    v = mx
    d = mx - mn
    s = 0.0 if mx == 0 else d / mx
    if d == 0:
        h = 0.0
    elif mx == rf:
        h = (60 * ((gf - bf) / d) + 360) % 360
    elif mx == gf:
        h = (60 * ((bf - rf) / d) + 120) % 360
    else:
        h = (60 * ((rf - gf) / d) + 240) % 360
    return h, s, v


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02X}{g:02X}{b:02X}"


def ciede2000(
    lab1: Sequence[float],
    lab2: Sequence[float],
) -> float:
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    kL = kC = kH = 1.0

    C1 = math.hypot(a1, b1)
    C2 = math.hypot(a2, b2)
    Cab = (C1 + C2) / 2.0
    Cab7 = Cab**7
    G = 0.5 * (1 - math.sqrt(Cab7 / (Cab7 + 25**7)))
    a1p = (1 + G) * a1
    a2p = (1 + G) * a2
    C1p = math.hypot(a1p, b1)
    C2p = math.hypot(a2p, b2)

    def _hue(ap: float, bp: float) -> float:
        if ap == 0 and bp == 0:
            return 0.0
        h = math.degrees(math.atan2(bp, ap))
        return h + 360 if h < 0 else h

    h1p = _hue(a1p, b1)
    h2p = _hue(a2p, b2)

    dLp = L2 - L1
    dCp = C2p - C1p
    if C1p * C2p == 0:
        dhp = 0.0
    else:
        dhp = h2p - h1p
        if dhp > 180:
            dhp -= 360
        elif dhp < -180:
            dhp += 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2.0))

    Lbar = (L1 + L2) / 2.0
    Cpbar = (C1p + C2p) / 2.0
    if C1p * C2p == 0:
        hbar = h1p + h2p
    else:
        if abs(h1p - h2p) > 180:
            hbar = (h1p + h2p + 360) / 2.0 if h1p + h2p < 360 else (h1p + h2p - 360) / 2.0
        else:
            hbar = (h1p + h2p) / 2.0

    T = (
        1
        - 0.17 * math.cos(math.radians(hbar - 30))
        + 0.24 * math.cos(math.radians(2 * hbar))
        + 0.32 * math.cos(math.radians(3 * hbar + 6))
        - 0.2 * math.cos(math.radians(4 * hbar - 63))
    )
    dTheta = 30 * math.exp(-(((hbar - 275) / 25) ** 2))
    Rc = 2 * math.sqrt(Cpbar**7 / (Cpbar**7 + 25**7))
    Sl = 1 + (0.015 * (Lbar - 50) ** 2) / math.sqrt(20 + (Lbar - 50) ** 2)
    Sc = 1 + 0.045 * Cpbar
    Sh = 1 + 0.015 * Cpbar * T
    Rt = -math.sin(math.radians(2 * dTheta)) * Rc

    return math.sqrt(
        (dLp / (kL * Sl)) ** 2
        + (dCp / (kC * Sc)) ** 2
        + (dHp / (kH * Sh)) ** 2
        + Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh))
    )


def round4(x: float) -> float:
    return round(x, 4)
