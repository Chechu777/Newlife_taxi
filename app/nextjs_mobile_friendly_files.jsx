// pages.tsx
"use client";
import Map from "./map";
import { useState } from "react";

export default function Page() {
  const [pickup, setPickup] = useState("");

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-center">NewLife Taxi</h1>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Punto de recogida</label>
        <input
          type="text"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          placeholder="Ingresa la dirección"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="text-sm whitespace-pre-line">
        para traslados largos y/o aeropuerto (llevar y recoger)
        {"\n"}Horario:
        {"\n"}Horario corrido De 8:00 AM a 20:00 PM
      </div>

      <div className="h-64 md:h-96 w-full">
        <Map address={pickup} />
      </div>
    </div>
  );
}


// map.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MoveToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 17);
  }, [position, map]);
  return null;
}

export default function Map({ address }) {
  const [pos, setPos] = useState([40.4168, -3.7038]);

  useEffect(() => {
    if (!address) return;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          const { lat, lon } = data[0];
          setPos([parseFloat(lat), parseFloat(lon)]);
        }
      })
      .catch(() => {});
  }, [address]);

  return (
    <MapContainer
      center={pos}
      zoom={15}
      scrollWheelZoom={false}
      className="w-full h-full rounded-lg"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={pos} icon={markerIcon}>
        <Popup>{address || "Selecciona un punto"}</Popup>
      </Marker>
      <MoveToPosition position={pos} />
    </MapContainer>
  );
}
