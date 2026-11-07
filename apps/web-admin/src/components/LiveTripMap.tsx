import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LiveMapPoint } from "../lib/liveTrip";
import "leaflet/dist/leaflet.css";

const HERCOM_BLUE = "#007AFF";
const ROUTE_OUTLINE = "#ffffff";
const DESTINATION_GRAY = "#334155";
const DRIVER_GREEN = "#16A34A";
const REPLAY_ORANGE = "#EA580C";

/** Calles y etiquetas más legibles que OSM estándar. */
const STREET_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const STREET_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${HERCOM_BLUE};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destinationIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${DESTINATION_GRAY};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${DRIVER_GREEN};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const replayIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:${REPLAY_ORANGE};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({
  points,
  center,
  zoom,
  maxZoom,
}: {
  points: LiveMapPoint[];
  center: LiveMapPoint;
  zoom: number;
  maxZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (points.length >= 2) {
      const bounds = L.latLngBounds(
        points.map((point) => [point.lat, point.lng]),
      );
      map.fitBounds(bounds.pad(0.15), { animate: true, maxZoom });
      return;
    }
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, map, maxZoom, points, zoom]);

  return null;
}

type LiveTripMapProps = {
  origin: LiveMapPoint;
  destination: LiveMapPoint;
  driver: LiveMapPoint | null;
  trail: LiveMapPoint[];
  /** Ruta pedida: origen, paradas y destino. Solo en tiempo real. */
  planned?: LiveMapPoint[];
  center: LiveMapPoint;
  zoom: number;
  /** Punto actual al reproducir la ruta grabada. */
  replayPosition?: LiveMapPoint | null;
  /** En grabado se prioriza callejero y zoom más cercano. */
  recordedRoute?: boolean;
  /** Ruta guardada: no une origen y destino. Un solo punto si no hubo desplazamiento. */
  savedRoute?: boolean;
};

export function LiveTripMap({
  origin,
  destination,
  driver,
  trail,
  planned = [],
  center,
  zoom,
  replayPosition = null,
  recordedRoute = false,
  savedRoute = false,
}: LiveTripMapProps) {
  const maxFitZoom = recordedRoute ? 17 : 15;

  const stationaryPoint = savedRoute && trail.length > 0 && trail.length < 2 ? trail[0]! : null;

  const fitPoints = useMemo(() => {
    if (savedRoute) {
      const points = [...trail];
      if (replayPosition !== null) {
        points.push(replayPosition);
      }
      return points.length > 0 ? points : [origin];
    }
    const points = [origin, destination, ...planned, ...trail];
    if (driver !== null) {
      points.push(driver);
    }
    if (replayPosition !== null) {
      points.push(replayPosition);
    }
    return points;
  }, [destination, driver, origin, planned, replayPosition, savedRoute, trail]);

  const trailPositions = useMemo(
    () =>
      trail.map((point) => [point.lat, point.lng] as [number, number]),
    [trail],
  );

  const plannedPositions = useMemo(
    () =>
      planned.map((point) => [point.lat, point.lng] as [number, number]),
    [planned],
  );

  const replayTrailPositions = useMemo(() => {
    if (replayPosition === null || trail.length < 2) {
      return [];
    }
    const idx = trail.findIndex(
      (p) => p.lat === replayPosition.lat && p.lng === replayPosition.lng,
    );
    const end = idx >= 0 ? idx + 1 : trail.length;
    return trail.slice(0, end).map((point) => [point.lat, point.lng] as [number, number]);
  }, [replayPosition, trail]);

  const showDriver =
    driver !== null && replayPosition === null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className="h-full w-full rounded-lg"
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer attribution={STREET_TILE_ATTRIBUTION} url={STREET_TILE_URL} />
      <FitBounds
        points={fitPoints}
        center={center}
        zoom={zoom}
        maxZoom={maxFitZoom}
      />
      {!savedRoute && (
        <Marker position={[origin.lat, origin.lng]} icon={pickupIcon} />
      )}
      {!savedRoute && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destinationIcon}
        />
      )}
      {!savedRoute && plannedPositions.length > 1 && (
        <Polyline
          positions={plannedPositions}
          pathOptions={{
            color: DESTINATION_GRAY,
            weight: 4,
            opacity: 0.85,
            dashArray: "8 8",
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
      {stationaryPoint !== null && replayPosition === null && (
        <Marker
          position={[stationaryPoint.lat, stationaryPoint.lng]}
          icon={replayIcon}
        />
      )}
      {trail.length > 1 && (
        <>
          <Polyline
            positions={trailPositions}
            pathOptions={{
              color: ROUTE_OUTLINE,
              weight: recordedRoute ? 9 : 7,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <Polyline
            positions={trailPositions}
            pathOptions={{
              color: HERCOM_BLUE,
              weight: recordedRoute ? 6 : 4,
              opacity: 0.92,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </>
      )}
      {recordedRoute && replayTrailPositions.length > 1 && (
        <Polyline
          positions={replayTrailPositions}
          pathOptions={{
            color: REPLAY_ORANGE,
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
      {replayPosition !== null && (
        <Marker
          position={[replayPosition.lat, replayPosition.lng]}
          icon={replayIcon}
        />
      )}
      {showDriver && (
        <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />
      )}
    </MapContainer>
  );
}
