"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const icon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
});

export default function MapComponent({ selectedCoords }: any) {
  const defaultPosition: [number, number] = [40.4167, -3.70325]; // Km0 Sol

  function ClickHandler() {
    const map = useMapEvents({
      async click(e) {
        const { lat, lng } = e.latlng;
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(url);
        const data = await res.json();
        map.flyTo([lat, lng], 17);
        // page.tsx recibirá la actualización desde selectedCoords
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={selectedCoords || defaultPosition}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler />
      <Marker position={selectedCoords || defaultPosition} icon={icon} />
    </MapContainer>
  );
}
