"use client";

import { useEffect, useRef, useState } from "react";

type Suggest = {
  display_name: string;
  lat: string;
  lon: string;
  address: any;
};

export default function AddressAutocomplete({
  inputRef,
  value,
  onChange,
  onSelect,
  onFocus,
}: {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: { address: string; lat?: number; lng?: number }) => void;
  onFocus?: () => void;
}) {
  const [items, setItems] = useState<Suggest[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);

  // === FORMATEADOR ===
  function formatAddress(item: any) {
    if (!item?.address) return item.display_name;

    const a = item.address;
    const street = a.road || a.pedestrian || a.cycleway || a.footway || "";
    const house = a.house_number ? `, ${a.house_number}` : "";
    const district = a.suburb || a.neighbourhood || "";
    const city = a.city || a.town || a.village || "";
    const postcode = a.postcode || "";

    return `${street}${house}${district ? `, ${district}` : ""}${city ? `, ${city}` : ""}${postcode ? ` ${postcode}` : ""}`.replace(/,\s*,/g, ",");
  }

  // search effect
  useEffect(() => {
    if (typeof window === "undefined") return; // avoid SSR

    if (!value || value.length < 3) {
      setItems([]);
      setOpen(false);
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
          setOpen(true);
        })
        .catch(() => {
          setItems([]);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(t);
  }, [value]);

  // handlers for blur to close dropdown safely
  function handleBlur() {
    // delay closing so a click on item registers
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    blurTimer.current = window.setTimeout(() => {
      setOpen(false);
    }, 150);
  }

  function handleFocus() {
    if (onFocus) onFocus();
    if (items.length > 0) setOpen(true);
  }

  return (
    <div className="relative" onBlur={handleBlur}>
      <input
        ref={(el) => {
          if (inputRef && typeof inputRef === "object") (inputRef as any).current = el;
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder="Selecciona en el mapa o escribe la dirección"
        className="mt-1 w-full border px-3 py-2 rounded"
      />

      {open && items.length > 0 && (
        <ul className="absolute z-50 bg-white shadow rounded mt-1 w-full max-h-56 overflow-auto text-sm">
          {items.map((it, i) => {
            const clean = formatAddress(it);
            return (
              <li
                key={i}
                className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                onMouseDown={(ev) => {
                  // prevent blur from hiding before click
                  ev.preventDefault();
                }}
                onClick={() => {
                  onSelect({
                    address: clean,
                    lat: Number(it.lat),
                    lng: Number(it.lon),
                  });
                  setItems([]);
                  setOpen(false);
                }}
              >
                {clean}
              </li>
            );
          })}
        </ul>
      )}

      {loading && <div className="text-xs mt-1 text-zinc-500">Buscando...</div>}
    </div>
  );
}
