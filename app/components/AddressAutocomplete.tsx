// app/components/AddressAutocomplete.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

export interface Suggestion {
  lat: number;
  lng: number;
  address: string; // display_name from nominatim
  raw?: any; // optional full data
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (s: Suggestion) => void;
  inputRef?: RefObject<HTMLInputElement>;
  placeholder?: string;
  disabled?: boolean;
  showToggle?: boolean;
  // suppressOpen not required here; parent controls disabled
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  inputRef,
  placeholder,
  disabled = false,
  showToggle = true,
}: Props) {
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const idleTimer = useRef<number | null>(null);

  // Format short address per your spec:
  // "C. de Ezequiel Solana, 21, Cdad. Lineal, 28017 Madrid"
  function formatShortFromNominatimItem(item: any) {
    try {
      const addr = item.address || {};
      const house = addr.house_number || "";
      const road = addr.road || addr.pedestrian || addr.cycleway || addr.footway || item.name || "";
      const suburb = addr.suburb || addr.city_district || addr.neighbourhood || addr.village || "";
      const city = addr.city || addr.town || addr.village || "Madrid";
      const postcode = addr.postcode || "";

      // street short
      let streetShort = road;
      if (streetShort) {
        streetShort = streetShort.replace(/^Calle\s+de\s+/i, "").replace(/^Calle\s+/i, "");
        streetShort = `C. de ${streetShort}`;
      }

      // district short: "Ciudad Lineal" -> "Cdad. Lineal"
      let districtShort = suburb;
      districtShort = districtShort.replace(/Ciudad\s+/i, "Cdad. ").replace(/CiudadLineal/i, "Cdad. Lineal");

      const parts: string[] = [];
      if (streetShort) parts.push(streetShort + (house ? `, ${house}` : ""));
      if (districtShort) parts.push(districtShort);
      if (postcode || city) parts.push(`${postcode ? postcode + " " : ""}${city}`);

      return parts.join(", ").replace(/\s+,/g, ",").trim();
    } catch {
      return item.display_name || "";
    }
  }

  async function search(q: string) {
    if (!suggestionsEnabled) return;
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (controller.current) controller.current.abort();
    controller.current = new AbortController();

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        q
      )}&limit=8&addressdetails=1&accept-language=es`;
      const r = await fetch(url, { signal: controller.current.signal });
      const data = await r.json();
      const mapped = (data || []).map((d: any) => ({
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        address: formatShortFromNominatimItem(d) || d.display_name || `${d.lat}, ${d.lon}`,
        raw: d,
      })) as Suggestion[];

      setSuggestions(mapped);
      if (mapped.length > 0) setOpen(true);
      else setOpen(false);

      // idle close timer 3s
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setOpen(false), 3000);
    } catch {
      // ignore network errors
    }
  }

  // debounce input
  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = window.setTimeout(() => search(value), 350);
    return () => {
      window.clearTimeout(t);
      if (controller.current) controller.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, suggestionsEnabled]);

  // reset idle timer on typing
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setOpen(false), 3000);
    }
  }

  function handleSelect(s: Suggestion) {
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          disabled={disabled}
          value={value}
          onChange={handleInput}
          placeholder={placeholder}
          className={`w-full border px-3 py-2 rounded text-slate-900 ${disabled ? "bg-gray-200 cursor-not-allowed" : "bg-white"}`}
        />

        {showToggle && (
          <button
            disabled={disabled}
            type="button"
            onClick={() => setSuggestionsEnabled((v) => !v)}
            className={`px-3 py-2 rounded text-white ${suggestionsEnabled ? "bg-emerald-600" : "bg-gray-400"}`}
            title={suggestionsEnabled ? "Sugerencias ON" : "Sugerencias OFF"}
          >
            🔍
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && !disabled && suggestionsEnabled && (
        <div className="absolute z-50 w-full bg-white text-black shadow border rounded mt-1 max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => handleSelect(s)}
              className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
            >
              {s.address}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
