// app/components/AddressAutocomplete.tsx
"use client";

import React, { useEffect, useRef, useState, RefObject } from "react";

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
  inputRef?: RefObject<HTMLInputElement | null>;
  placeholder?: string;
  disabled?: boolean;
  hideSearchIcon?: boolean; // <-- NUEVO
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  inputRef,
  placeholder,
  disabled = false,
  hideSearchIcon = false, // por defecto falso
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const idleTimer = useRef<number | null>(null);

  async function search(q: string) {
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
      const mapped = (data || []).map((d: any) => {
        const addressObj = d.address || {};

        return {
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),

          // address = display_name (cadena completa)
          address: d.display_name || `${d.lat}, ${d.lon}`,

          // raw = objeto completo (incluye d.address con street, city, etc.)
          raw: {
            display_name: d.display_name,
            address: addressObj,
            lat: d.lat,
            lon: d.lon,
          },
        };
      }) as Suggestion[];

      setSuggestions(mapped);
      setOpen(mapped.length > 0);

      // cerrar después de 3s
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setOpen(false), 3000);
    } catch {
      // ignore
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
  }, [value]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setOpen(false), 3000);
    }
  }

  function handleSelect(s: Suggestion) {
    onSelect({
      lat: s.lat,
      lng: s.lng,
      address: s.address,
      raw: s.raw,
    });

    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        disabled={disabled}
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        className={`w-full border px-3 py-2 rounded text-slate-900 ${disabled ? "bg-gray-200 cursor-not-allowed" : "bg-white"}`}
      />

      {!hideSearchIcon && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
      )}

      {open && suggestions.length > 0 && !disabled && (
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
