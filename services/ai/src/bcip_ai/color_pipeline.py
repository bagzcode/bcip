"""Deterministic Hue Seer baseline / stub pipeline (Phase 2).

When image bytes are unavailable, generates a stable synthetic RGB field from
input_object_key + parameters (clearly labelled deterministic_stub). Does not
invent cultural meanings or recommendations.
"""

from __future__ import annotations

import hashlib
import json
import math
from collections import Counter
from typing import Any

from bcip_ai.color_science import (
    lab_to_lch,
    rgb_to_hex,
    rgb_to_hsv,
    rgb_to_lab,
    round4,
)

ALGORITHM_NAME = "bcip-color-pipeline"
ALGORITHM_VERSION = "0.2.0"
EXPLORATORY_WARNING = (
    "EXPLORATORY: ordinary photograph / uncalibrated capture — "
    "not a calibrated scientific measurement."
)
CALIBRATED_LABEL = (
    "CALIBRATED: analysis used an explicit calibration target/profile. "
    "Still not a cultural claim."
)


def _stable_u32(seed: str) -> int:
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "big")


def _synthetic_pixels(seed: str, count: int = 256) -> list[tuple[int, int, int]]:
    """Deterministic pseudo-image pixels from seed (no GPU / no file I/O)."""
    pixels: list[tuple[int, int, int]] = []
    base = _stable_u32(seed)
    for i in range(count):
        x = (base + i * 1103515245 + 12345) & 0xFFFFFFFF
        r = (x >> 16) & 0xFF
        g = (x >> 8) & 0xFF
        b = x & 0xFF
        # Bias toward mid-chroma textile-like ranges without claiming heritage colors.
        r = 40 + (r % 180)
        g = 30 + (g % 170)
        b = 25 + (b % 160)
        pixels.append((r, g, b))
    return pixels


def _quantize_key(rgb: tuple[int, int, int], step: int = 32) -> tuple[int, int, int]:
    return (rgb[0] // step * step, rgb[1] // step * step, rgb[2] // step * step)


def _extract_palette(
    pixels: list[tuple[int, int, int]],
    palette_size: int,
) -> list[dict[str, Any]]:
    counts = Counter(_quantize_key(p) for p in pixels)
    total = sum(counts.values()) or 1
    top = counts.most_common(palette_size)
    if not top:
        top = [((128, 128, 128), 1)]
        total = 1

    # Renormalize proportions over selected colors.
    selected_total = sum(c for _, c in top) or 1
    swatches: list[dict[str, Any]] = []
    for rank, (rgb, count) in enumerate(top, start=1):
        lab = rgb_to_lab(*rgb)
        lch = lab_to_lch(*lab)
        hsv = rgb_to_hsv(*rgb)
        swatches.append(
            {
                "rank": rank,
                "proportion": round4(count / selected_total),
                "lab": [round4(lab[0]), round4(lab[1]), round4(lab[2])],
                "lch": [round4(lch[0]), round4(lch[1]), round4(lch[2])],
                "hsv": [round4(hsv[0]), round4(hsv[1]), round4(hsv[2])],
                "rgb": [int(rgb[0]), int(rgb[1]), int(rgb[2])],
                "display_hex": rgb_to_hex(*rgb),
            }
        )
    # Ensure proportions sum ~1 after rounding
    prop_sum = sum(s["proportion"] for s in swatches) or 1.0
    if swatches and abs(prop_sum - 1.0) > 1e-6:
        swatches[0]["proportion"] = round4(swatches[0]["proportion"] + (1.0 - prop_sum))
    _ = total  # reserved for future full-image mass reporting
    return swatches


def _features(pixels: list[tuple[int, int, int]], palette: list[dict[str, Any]]) -> dict[str, Any]:
    labs = [rgb_to_lab(*p) for p in pixels]
    mean_L = sum(L for L, _, _ in labs) / len(labs)
    chromas = [math.hypot(a, b) for _, a, b in labs]
    mean_C = sum(chromas) / len(chromas)

    # Entropy over quantized hues (8 bins).
    bins = [0] * 8
    warm = 0
    cool = 0
    for p in pixels:
        h, _, _ = rgb_to_hsv(*p)
        bins[min(7, int(h // 45))] += 1
        # Warm: red-yellow-orange (~0-90 and 330-360); cool: green-blue-cyan.
        if h < 90 or h >= 330:
            warm += 1
        elif 150 <= h <= 270:
            cool += 1
        else:
            # Magenta/green-yellow split evenly for density stability.
            if h < 150:
                warm += 1
            else:
                cool += 1

    total = len(pixels) or 1
    probs = [c / total for c in bins if c]
    entropy = -sum(p * math.log(p + 1e-12, 2) for p in probs) / math.log(8, 2)
    warm_cool = warm / max(warm + cool, 1)

    hue_distribution = {
        f"bin_{i}": round4(bins[i] / total) for i in range(8)
    }
    hue_distribution["warm"] = round4(warm / total)
    hue_distribution["cool"] = round4(cool / total)
    # Palette mean lightness for cross-check
    if palette:
        mean_L = sum(s["lab"][0] * s["proportion"] for s in palette)
        mean_C = sum(s["lch"][1] * s["proportion"] for s in palette)

    return {
        "mean_lightness": round4(mean_L),
        "mean_chroma": round4(mean_C),
        "color_entropy": round4(entropy),
        "warm_cool_ratio": round4(warm_cool),
        "hue_distribution": hue_distribution,
    }


def _result_checksum(payload: dict[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def run_color_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Run deterministic baseline analysis.

    Same input_object_key + parameters + mode + calibration → stable checksum.
    """
    analysis_mode = payload.get("analysis_mode", "exploratory")
    calibration = payload.get("calibration")
    params = dict(payload.get("parameters") or {})
    palette_size = int(params.get("palette_size") or 6)
    palette_size = max(1, min(32, palette_size))
    segmentation = params.get("segmentation_method") or "baseline-v1"
    clustering = params.get("clustering_method") or "quantize-rgb-v1"
    params["palette_size"] = palette_size
    params["segmentation_method"] = segmentation
    params["clustering_method"] = clustering

    warnings: list[str] = []
    is_calibrated = False
    if analysis_mode == "calibrated":
        if isinstance(calibration, dict) and calibration.get("target_id"):
            is_calibrated = True
            warnings.append(CALIBRATED_LABEL)
        else:
            warnings.append(
                "Calibration target/profile absent — result is NOT marked calibrated scientific data."
            )
            warnings.append(EXPLORATORY_WARNING)
    else:
        warnings.append(EXPLORATORY_WARNING)

    seed = params.get("synthetic_seed") or str(payload.get("input_object_key") or "demo")
    pixels = _synthetic_pixels(f"{seed}|{palette_size}|{segmentation}|{clustering}")
    warnings.append(
        "PIPELINE: deterministic_stub — synthetic pixels from seed "
        "(no image decode in Phase 2 MVP). Numeric features only."
    )

    palette = _extract_palette(pixels, palette_size)
    features = _features(pixels, palette)

    algorithm = {"name": ALGORITHM_NAME, "version": ALGORITHM_VERSION}
    dependency_versions = {
        "python_color_pipeline": ALGORITHM_VERSION,
        "color_science": "0.2.0",
        "illuminant_assumption": "D65",
        "rgb_space_assumption": "sRGB",
    }

    core_for_checksum = {
        "algorithm": algorithm,
        "analysis_mode": analysis_mode,
        "is_calibrated": is_calibrated,
        "parameters": params,
        "calibration": calibration,
        "palette": palette,
        "features": features,
    }
    checksum = _result_checksum(core_for_checksum)

    mask_key = f"derived/masks/{payload.get('job_id', 'unknown')}/baseline-v1.json"
    return {
        "job_id": payload.get("job_id"),
        "color_analysis_job_id": payload.get("color_analysis_job_id"),
        "asset_version_id": payload.get("asset_version_id"),
        "status": "completed",
        "analysis_mode": analysis_mode,
        "is_calibrated": is_calibrated,
        "algorithm": algorithm,
        "parameters": params,
        "dependency_versions": dependency_versions,
        "calibration": calibration if is_calibrated else None,
        "quality": {
            "calibrated": is_calibrated,
            "warnings": warnings,
            "mask_confidence": 0.55 if segmentation == "baseline-v1" else 0.4,
            "pipeline": "deterministic_stub",
        },
        "palette": palette,
        "features": features,
        "result_checksum": checksum,
        "derived_objects": [
            {
                "type": "mask",
                "object_key": mask_key,
                "checksum_sha256": hashlib.sha256(mask_key.encode()).hexdigest(),
            }
        ],
    }
