#!/usr/bin/env python3

import argparse
import json
import math
from typing import Any, List, Tuple


Point = Tuple[float, float]  # (lng, lat)


def _point_line_distance(p: Point, a: Point, b: Point) -> float:
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx = bx - ax
    dy = by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    proj_x = ax + t * dx
    proj_y = ay + t * dy
    return math.hypot(px - proj_x, py - proj_y)


def _rdp(points: List[Point], epsilon: float) -> List[Point]:
    if len(points) <= 2:
        return points

    a = points[0]
    b = points[-1]
    max_dist = -1.0
    idx = -1
    for i in range(1, len(points) - 1):
        d = _point_line_distance(points[i], a, b)
        if d > max_dist:
            max_dist = d
            idx = i

    if max_dist > epsilon and idx != -1:
        left = _rdp(points[: idx + 1], epsilon)
        right = _rdp(points[idx:], epsilon)
        return left[:-1] + right

    return [a, b]


def simplify_ring(coords: List[Any], epsilon: float) -> List[Any]:
    # Expect [[lng,lat], ...] with possible closing point.
    pts: List[Point] = []
    for c in coords:
        if not isinstance(c, list) or len(c) < 2:
            continue
        lng, lat = c[0], c[1]
        if isinstance(lng, (int, float)) and isinstance(lat, (int, float)):
            pts.append((float(lng), float(lat)))

    if len(pts) < 4:
        return coords

    closed = pts[0] == pts[-1]
    core = pts[:-1] if closed else pts
    if len(core) < 3:
        return coords

    simplified = _rdp(core, epsilon)

    # Ensure polygon ring has enough points
    if len(simplified) < 3:
        simplified = core[:3]

    if simplified[0] != simplified[-1]:
        simplified = simplified + [simplified[0]]

    return [[lng, lat] for (lng, lat) in simplified]


def simplify_geometry(geom: Any, epsilon: float) -> Any:
    if not isinstance(geom, dict):
        return geom
    gtype = geom.get("type")
    coords = geom.get("coordinates")

    if gtype == "Polygon" and isinstance(coords, list):
        out = []
        for ring in coords:
            if isinstance(ring, list):
                out.append(simplify_ring(ring, epsilon))
            else:
                out.append(ring)
        return {**geom, "coordinates": out}

    if gtype == "MultiPolygon" and isinstance(coords, list):
        out_polys = []
        for poly in coords:
            if not isinstance(poly, list):
                out_polys.append(poly)
                continue
            out_rings = []
            for ring in poly:
                if isinstance(ring, list):
                    out_rings.append(simplify_ring(ring, epsilon))
                else:
                    out_rings.append(ring)
            out_polys.append(out_rings)
        return {**geom, "coordinates": out_polys}

    return geom


def main() -> None:
    parser = argparse.ArgumentParser(description="Simplify GeoJSON polygons using RDP.")
    parser.add_argument("--in", dest="in_path", required=True)
    parser.add_argument("--out", dest="out_path", required=True)
    parser.add_argument("--epsilon", type=float, required=True)
    args = parser.parse_args()

    with open(args.in_path, "r", encoding="utf-8") as fp:
        data = json.load(fp)

    features = data.get("features")
    if isinstance(features, list):
        out_features = []
        for feat in features:
            if not isinstance(feat, dict):
                out_features.append(feat)
                continue
            geom = feat.get("geometry")
            out_geom = simplify_geometry(geom, args.epsilon)
            out_features.append({**feat, "geometry": out_geom})
        data = {**data, "features": out_features}

    with open(args.out_path, "w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False)


if __name__ == "__main__":
    main()

