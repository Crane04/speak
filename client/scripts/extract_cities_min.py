#!/usr/bin/env python3

import argparse
import json
from typing import Any, List, Optional, Tuple


def _compute_bbox(
    node: Any, acc: Optional[Tuple[float, float, float, float]] = None
) -> Optional[Tuple[float, float, float, float]]:
    # Returns (minLng, maxLng, minLat, maxLat)
    if isinstance(node, list):
        if (
            len(node) >= 2
            and isinstance(node[0], (int, float))
            and isinstance(node[1], (int, float))
        ):
            lng = float(node[0])
            lat = float(node[1])
            if acc is None:
                return (lng, lng, lat, lat)
            min_lng, max_lng, min_lat, max_lat = acc
            return (
                min(min_lng, lng),
                max(max_lng, lng),
                min(min_lat, lat),
                max(max_lat, lat),
            )
        cur = acc
        for child in node:
            cur = _compute_bbox(child, cur)
        return cur
    return acc


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract minimal city records from a GeoJSON points file."
    )
    parser.add_argument("--in", dest="in_path", required=True)
    parser.add_argument("--out", dest="out_path", required=True)
    args = parser.parse_args()

    with open(args.in_path, "r", encoding="utf-8") as fp:
        data = json.load(fp)

    out: List[List[Any]] = []
    for feat in data.get("features", []):
        if not isinstance(feat, dict):
            continue
        geom = feat.get("geometry") or {}
        coords = geom.get("coordinates")
        bbox = _compute_bbox(coords)
        if bbox is None:
            continue
        min_lng, max_lng, min_lat, max_lat = bbox
        lat = (min_lat + max_lat) / 2.0
        lng = (min_lng + max_lng) / 2.0
        props = feat.get("properties") or {}
        name = props.get("NAME")
        if not isinstance(name, str) or not name.strip():
            continue
        out.append([lat, lng, name.strip()])  # [lat,lng,name]

    with open(args.out_path, "w", encoding="utf-8") as fp:
        json.dump(out, fp, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
