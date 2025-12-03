// app/components/QuickPlaces.tsx
"use client";

import React, { useState } from "react";

interface Props {
  onSelect: (coords: { lat: number; lng: number; address?: string }) => void;
  disabled?: boolean;
  initialOpen?: boolean;
}

export default function QuickPlaces({ onSelect, disabled = false, initialOpen = false }: Props) {
  const [open, setOpen] = useState(initialOpen);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const CATEGORIES = [
    { key: "air", label: "✈️ Aeropuertos" },
    { key: "train", label: "🚆 Renfe / AVE" },
    { key: "bus", label: "🚌 Autobuses" },
    { key: "tour", label: "🏛️ Turísticos" },
    { key: "shop", label: "🛍️ Comercios" },
  ];

  const PLACES: Record<string, any[]> = {
    air: [
      { name: "T2 Salidas", lat: 40.4719, lng: -3.5626, address: "T2 Salidas, Aeropuerto Adolfo Suárez Madrid-Barajas" },
      { name: "T2 Llegadas", lat: 40.4712, lng: -3.5621, address: "T2 Llegadas, Aeropuerto Adolfo Suárez Madrid-Barajas" },
      { name: "T4 Salidas", lat: 40.4911, lng: -3.5930, address: "T4 Salidas, Aeropuerto Adolfo Suárez Madrid-Barajas" },
      { name: "T4 Llegadas", lat: 40.4915, lng: -3.5920, address: "T4 Llegadas, Aeropuerto Adolfo Suárez Madrid-Barajas" },
    ],
    train: [
      { name: "Atocha", lat: 40.4066, lng: -3.6910, address: "Estación Atocha, Madrid" },
      { name: "Chamartín", lat: 40.4723, lng: -3.6831, address: "Estación Chamartín, Madrid" },
    ],
    bus: [
      { name: "Av América", lat: 40.4397, lng: -3.6766, address: "Av. América, Madrid" },
      { name: "Plaza Elíptica", lat: 40.3855, lng: -3.7187, address: "Plaza Elíptica, Madrid" },
    ],
    tour: [
      { name: "Puerta del Sol", lat: 40.4169, lng: -3.7035, address: "Puerta del Sol, Madrid" },
      { name: "Plaza Mayor", lat: 40.4153, lng: -3.7074, address: "Plaza Mayor, Madrid" },
      { name: "Palacio Real", lat: 40.4179, lng: -3.7143, address: "Palacio Real, Madrid" },
    ],
    shop: [
      { name: "Gran Vía", lat: 40.4203, lng: -3.7058, address: "Gran Vía, Madrid" },
      { name: "Serrano", lat: 40.4301, lng: -3.6867, address: "C. de Serrano, Madrid" },
    ],
  };

  const placesList = selectedCategory ? PLACES[selectedCategory] : [];

  return (
    <div className="w-full">
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex justify-between items-center px-4 py-3 rounded bg-white text-black font-semibold shadow
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        Ubicaciones rápidas
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {open && !disabled && (
        <div className="mt-2 bg-white text-black rounded shadow p-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-full border ${selectedCategory === c.key ? "bg-emerald-600 text-white" : "bg-gray-200"}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <select
              onChange={(e) => {
                const p = placesList.find((z) => z.name === e.target.value);
                if (!p) return;
                onSelect({ lat: p.lat, lng: p.lng, address: p.address });
                setOpen(false);
                setSelectedCategory(null);
              }}
              className="w-full mt-3 border p-2 rounded"
            >
              <option value="">Selecciona un lugar</option>
              {placesList.map((p, i) => (
                <option key={i} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
