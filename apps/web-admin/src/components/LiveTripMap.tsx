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
const DESTINATION_GRAY = "#334155";
const DRIVER_GREEN = "#16A34A";

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

function FitBounds({
  points,
  center,
  zoom,
}: {
  points: LiveMapPoint[];
  center: LiveMapPoint;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(
        points.map((point) => [point.lat, point.lng]),
      );
      map.fitBounds(bounds.pad(0.2), { animate: true, maxZoom: 15 });
      return;
    }
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, map, points, zoom]);

  return null;
}

type LiveTripMapProps = {
  origin: LiveMapPoint;
  destination: LiveMapPoint;
  driver: LiveMapPoint | null;
  trail: LiveMapPoint[];
  center: LiveMapPoint;
  zoom: number;
};

export function LiveTripMap({
  origin,
  destination,
  driver,
  trail,
  center,
  zoom,
}: LiveTripMapProps) {
  const fitPoints = useMemo(() => {
    const points = [origin, destination, ...trail];
    if (driver !== null) {
      points.push(driver);
    }
    return points;
  }, [destination, driver, origin, trail]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={fitPoints} center={center} zoom={zoom} />
      <Marker position={[origin.lat, origin.lng]} icon={pickupIcon} />
      <Marker
        position={[destination.lat, destination.lng]}
        icon={destinationIcon}
      />
      {trail.length > 1 && (
        <Polyline
          positions={trail.map(
            (point) => [point.lat, point.lng] as [number, number],
          )}
          pathOptions={{ color: HERCOM_BLUE, weight: 4 }}
        />
      )}
      {driver !== null && (
        <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />
      )}
    </MapContainer>
  );
}
