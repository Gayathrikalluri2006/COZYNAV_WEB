import { createClientOnlyFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useState } from "react";
import type { MapRoute, MapIncident } from "./SafetyMap.client";

const SafetyMap = lazy(
  createClientOnlyFn(() => import("./SafetyMap.client").then((m) => ({ default: m.SafetyMap }))),
);

export function MapWrapper(props: {
  routes?: MapRoute[];
  incidents?: MapIncident[];
  fit?: boolean;
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  pin?: { lat: number; lng: number } | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted)
    return (
      <div className="h-full w-full bg-card grid place-items-center text-muted-foreground text-sm">
        Loading map…
      </div>
    );
  return (
    <Suspense
      fallback={
        <div className="h-full w-full bg-card grid place-items-center text-muted-foreground text-sm">
          Loading map…
        </div>
      }
    >
      <SafetyMap {...props} />
    </Suspense>
  );
}

export type { MapRoute, MapIncident };
