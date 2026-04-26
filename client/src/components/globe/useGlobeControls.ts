import { useCallback, useEffect, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import { CAMERA_SAMPLE_MS, DEFAULT_CAMERA_DISTANCE } from "./constants";

export function useGlobeControls(globeRef: React.RefObject<GlobeMethods | undefined>) {
  const controlsCleanupRef = useRef<null | (() => void)>(null);
  const zoomRafRef = useRef<number | null>(null);
  const lastSampleRef = useRef<number>(0);
  const povRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const zoomRef = useRef<number>(DEFAULT_CAMERA_DISTANCE);

  const [zoom, setZoom] = useState(DEFAULT_CAMERA_DISTANCE);
  const [pov, setPov] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  useEffect(() => {
    return () => {
      controlsCleanupRef.current?.();
      controlsCleanupRef.current = null;
      if (zoomRafRef.current != null) {
        window.cancelAnimationFrame(zoomRafRef.current);
        zoomRafRef.current = null;
      }
    };
  }, []);

  const distanceToAltitude = useCallback(
    (distance: number) => {
      const radius = globeRef.current?.getGlobeRadius() ?? 100;
      return Math.max(0.01, distance / radius - 1);
    },
    [globeRef],
  );

  const flyToDistance = useCallback(
    (lat: number, lng: number, distance: number, transitionMs = 1200) => {
      globeRef.current?.pointOfView(
        { lat, lng, altitude: distanceToAltitude(distance) },
        transitionMs,
      );
    },
    [distanceToAltitude, globeRef],
  );

  const handleGlobeReady = useCallback(() => {
    const ctrl = globeRef.current?.controls();
    if (!ctrl) return;

    ctrl.autoRotate = true;
    ctrl.autoRotateSpeed = 0.3;
    ctrl.enableDamping = true;
    ctrl.dampingFactor = 0.1;
    ctrl.minDistance = 101;
    ctrl.maxDistance = DEFAULT_CAMERA_DISTANCE;

    globeRef.current?.pointOfView(
      { lat: 15, lng: 0, altitude: distanceToAltitude(DEFAULT_CAMERA_DISTANCE) },
      0,
    );

    const onChange = () => {
      if (zoomRafRef.current != null) return;
      zoomRafRef.current = window.requestAnimationFrame(() => {
        zoomRafRef.current = null;
        const dist =
          (globeRef.current?.camera().position.length() as number | undefined) ??
          DEFAULT_CAMERA_DISTANCE;
        zoomRef.current = dist;
        const nextPov = globeRef.current?.pointOfView();
        if (nextPov) povRef.current = { lat: nextPov.lat, lng: nextPov.lng };

        const now = performance.now();
        if (now - lastSampleRef.current < CAMERA_SAMPLE_MS) return;
        lastSampleRef.current = now;

        setZoom(zoomRef.current);
        setPov(povRef.current);
      });
    };

    const onStart = () => {
      ctrl.autoRotate = false;
    };

    ctrl.addEventListener("change", onChange);
    ctrl.addEventListener("start", onStart);
    onChange();

    controlsCleanupRef.current = () => {
      ctrl.removeEventListener("change", onChange);
      ctrl.removeEventListener("start", onStart);
    };
  }, [distanceToAltitude, globeRef]);

  return { zoom, pov, flyToDistance, handleGlobeReady };
}

