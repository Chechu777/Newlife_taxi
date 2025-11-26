"use client";

import { useState } from "react";
import Image from "next/image";

export type Place = {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  category: "airport" | "station";
  coords: { lat: number; lng: number };
  variants?: { key: string; label: string; coords?: { lat: number; lng: number } }[];
};

const PLACES: Place[] = [
  {
    id: "t2",
    title: "Aeropuerto Adolfo Suárez - T2",
    subtitle: "Terminal 2",
    icon: "/icons/t2_salidas.png",
    category: "airport",
    coords: { lat: 40.468648, lng: -3.569882 },
    variants: [
      { key: "salidas", label: "Salidas", coords: { lat: 40.468648, lng: -3.569882 } },
      { key: "llegadas", label: "Llegadas", coords: { lat: 40.468956, lng: -3.569345 } },
    ],
  },
  {
    id: "t4",
    title: "Aeropuerto Adolfo Suárez - T4",
    subtitle: "Terminal 4",
    icon: "/icons/t4_salidas.png",
    category: "airport",
    coords: { lat: 40.492075, lng: -3.593294 },
    variants: [
      { key: "salidas", label: "Salidas", coords: { lat: 40.492075, lng: -3.593294 } },
      { key: "llegadas", label: "Llegadas", coords: { lat: 40.4910469, lng: -3.5936118 } },
    ],
  },
  {
    id: "atocha",
    title: "Atocha",
    subtitle: "Estación",
    icon: "/icons/atocha.png",
    category: "station",
    coords: { lat: 40.406987, lng: -3.689682 },
    variants: [{ key: "salidas", label: "Salidas / Llegadas", coords: { lat: 40.406987, lng: -3.689682 } }],
  },
  {
    id: "chamartin",
    title: "Chamartín",
    subtitle: "Estación",
    icon: "/icons/chamartin.png",
    category: "station",
    coords: { lat: 40.472219, lng: -3.683699 },
    variants: [{ key: "salidas", label: "Salidas / Llegadas", coords: { lat: 40.472219, lng: -3.683699 } }],
  },
];

export default function FrequentPlaces({
  onSelect,
  initialOpen = false,
}: {
  onSelect: (coords: { lat: number; lng: number; address?: string }) => void;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [category, setCategory] = useState<"airport" | "station" | "all">("airport");

  function tapPlace(p: Place, variantKey?: string) {
    const v = p.variants?.find((x) => x.key === variantKey) || p.variants?.[0];
    const coords = v?.coords || p.coords;
    if (coords) onSelect({ lat: coords.lat, lng: coords.lng, address: `${p.title} ${v ? `- ${v.label}` : ""}` });
  }

  return (
    <div>
      <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-lg">
        <div>
          <div className="text-sm text-slate-300">Aeropuertos y estaciones</div>
          <div className="text-lg font-semibold">Lugares rápidos</div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="bg-white/10 text-slate-200 p-2 rounded"
          >
            <option value="airport">Aeropuertos</option>
            <option value="station">Estaciones</option>
            <option value="all">Todos</option>
          </select>

          <button
            onClick={() => setOpen((v) => !v)}
            className="px-3 py-1 rounded-md bg-white/10 text-slate-200"
            aria-expanded={open}
          >
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>

      <div className={`mt-3 overflow-hidden transition-all ${open ? "max-h-[1200px]" : "max-h-0"}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {PLACES.filter((p) => (category === "all" ? true : p.category === category)).map((p) => (
            <div key={p.id} className="bg-white/95 text-slate-900 p-3 rounded-lg shadow flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 relative flex-shrink-0 rounded-lg overflow-hidden">
                  <Image src={p.icon} alt={p.title} fill style={{ objectFit: "cover" }} unoptimized />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-slate-600 mt-1">{p.subtitle}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {p.variants?.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => tapPlace(p, v.key)}
                    className="text-sm p-2 bg-emerald-50 text-emerald-700 rounded shadow-sm hover:bg-emerald-100"
                  >
                    {v.label}
                  </button>
                ))}

                {!p.variants && (
                  <button
                    className="text-sm p-2 bg-emerald-50 text-emerald-700 rounded shadow-sm hover:bg-emerald-100"
                    onClick={() => tapPlace(p)}
                  >
                    Seleccionar
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs text-slate-500">
                <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 rounded">One-tap</span>
                <span className="ml-2">Añadir como { /* context dependent */ "recogida/destino"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
