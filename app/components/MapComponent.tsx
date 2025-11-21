"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix de iconos Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapComponent({ onPick, initialPick }: any) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // =============== INICIALIZAR MAPA ===============
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("theMap", {
      center: [40.416775, -3.70379],
      zoom: 13,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // CLICK EN EL MAPA → MARCADOR + DIRECCIÓN
    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;

      // mover marcador
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      // reverse geocoding con formato personalizado
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

      try {
        const r = await fetch(url);
        const data = await r.json();

        const a = data.address;

        const road = a.road || "";
        const house = a.house_number || "";
        const district = a.city_district || a.suburb || "";
        const city = a.city || a.town || a.village || "Madrid";
        const postcode = a.postcode || "";

        const formatted = [
          `${road}${house ? `, ${house}` : ""}`,
          district,
          city,
          postcode,
        ]
          .filter(Boolean)
          .join(", ");

        onPick({ lat, lng, address: formatted });
      } catch {
        onPick({ lat, lng, address: `${lat}, ${lng}` });
      }
    });
  }, [onPick]);

  // =============== SI LLEGAN COORDENADAS INICIALES ===============
  useEffect(() => {
    if (!initialPick || !mapRef.current) return;
    if (!initialPick.lat || !initialPick.lng) return;

    const { lat, lng } = initialPick;

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    mapRef.current.setView([lat, lng], 16);
  }, [initialPick]);

  return (
    <div
      id="theMap"
      style={{
        width: "100%",
        height: "300px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}
