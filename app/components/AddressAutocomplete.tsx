"use client";

import { useEffect, useState } from "react";

type Suggest = {
  display_name: string;
  lat: string;
  lon: string;
  address: any;
};

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: { address: string; lat?: number; lng?: number }) => void;
}) {
  const [items, setItems] = useState<Suggest[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  // === FORMATEADOR EXACTO COMO EN EL MAPA ===
  function formatAddress(item: any) {
    if (!item?.address) return item.display_name;

    const a = item.address;

    const street =
      a.road || a.pedestrian || a.cycleway || a.footway || "";
    const house = a.house_number ? `, ${a.house_number}` : "";
    const district = a.suburb || a.neighbourhood || "";
    const city = a.city || a.town || a.village || "";
    const postcode = a.postcode || "";

    return `${street}${house}, ${district}, ${city} ${postcode}`.replace(
      /,\s*,/g,
      ","
    );
  }

  // === BÚSQUEDA CON DELAY ===
  useEffect(() => {
    if (timer) window.clearTimeout(timer);
    if (!value || value.length < 3) {
      setItems([]);
      return;
    }

    setLoading(true);

    const t = window.setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          value
        )}&addressdetails=1&limit=6&accept-language=es`
      )
        .then((r) => r.json())
        .then((json) => {
          setItems(json || []);
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 350);

    setTimer(t);

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Selecciona en el mapa o escribe la dirección"
        className="mt-1 w-full border px-3 py-2 rounded"
      />

      {items.length > 0 && (
        <ul className="absolute z-20 bg-white shadow rounded mt-1 w-full max-h-56 overflow-auto">
          {items.map((it, i) => {
            const clean = formatAddress(it);

            return (
              <li
                key={i}
                className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                onClick={() => {
                  onSelect({
                    address: clean,
                    lat: Number(it.lat),
                    lng: Number(it.lon),
                  });
                  setItems([]); // cierra sugerencias
                }}
              >
                {clean}
              </li>
            );
          })}
        </ul>
      )}

      {loading && (
        <div className="text-xs mt-1 text-zinc-500">Buscando...</div>
      )}
    </div>
  );
}
