"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";

type Pick = {
  lat: number;
  lng: number;
  address?: string;
};

const KM0 = [40.416775, -3.70379] as [number, number];
const RADIUS_METERS = 15000;

// ICONO DEL MARCADOR
const markerIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconSize: [25, 41],
  shadowUrl: "/marker-shadow.png",
  shadowSize: [41, 41],
});

export default function MapComponent({
  onPick,
  initialPick
}: {
  onPick: (p: Pick) => void;
  initialPick?: Pick | null;
}) {
  const [picked, setPicked] = useState<Pick | null>(initialPick ?? null);

  // referencia al mapa para poder moverlo
  const mapRef = useRef<any>(null);

  // formateo correcto de dirección
  function formatAddress(item: any) {
    const a = item.address || {};

    const street = a.road || a.pedestrian || a.cycleway || a.footway || "";
    const house = a.house_number ? `, ${a.house_number}` : "";
    const district = a.suburb || a.neighbourhood || "";
    const city = a.city || a.town || a.village || "";
    const postcode = a.postcode || "";

    return `${street}${house}, ${district}, ${city} ${postcode}`.replace(/,\s*,/g, ",");
  }

  // click en el mapa
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`
        )
          .then((r) => r.json())
          .then((json) => {
            const addr = formatAddress(json);
            const p = { lat, lng, address: addr };
            setPicked(p);
            onPick(p);

            // mover el mapa a la nueva posición
            if (mapRef.current) {
              mapRef.current.setView([lat, lng], 16);
            }
          })
          .catch(() => {
            const p = { lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
            setPicked(p);
            onPick(p);
          });
      }
    });
    return null;
  }

  // cuando viene una dirección desde AddressAutocomplete → mueve el mapa
  useEffect(() => {
    if (initialPick) {
      setPicked(initialPick);

      if (mapRef.current) {
        mapRef.current.setView([initialPick.lat, initialPick.lng], 16);
      }
    }
  }, [initialPick]);

  return (
    <div className="w-full h-80 md:h-96 rounded-lg overflow-hidden border shadow-sm">
      <MapContainer
        center={KM0}
        zoom={12}
        whenCreated={(map) => (mapRef.current = map)}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={KM0}
          radius={RADIUS_METERS}
          pathOptions={{ color: "#60a5fa", fillOpacity: 0.08 }}
        />

        {/* Marcador dinámico */}
        {picked && (
          <Marker
            position={[picked.lat, picked.lng]}
            icon={markerIcon as any}
          />
        )}

        <MapClickHandler />
      </MapContainer>
    </div>
  );
}
