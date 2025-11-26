"use client";

import { useEffect, useState, useRef } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (data: { address: string; lat: number; lng: number }) => void;
  onFocus?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onFocus,
  inputRef
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);  // 🔥 Autosuggest OFF por defecto
  const containerRef = useRef(null);

  // Fetch suggestions
  useEffect(() => {
    if (!enabled) return;             // ❗ Solo busca si el usuario activó
    if (!value || value.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const query = async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          value
        )}&format=json&addressdetails=1&limit=5`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        setSuggestions(
          data.map((item) => ({
            address: item.display_name,
            lat: item.lat,
            lng: item.lon
          }))
        );
      } catch {}
      setLoading(false);
    };

    const t = setTimeout(query, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [value, enabled]);

  // Ocultar sugerencias si pierde foco
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setEnabled(false);       // 🔥 Se desactiva el autosuggest
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (onFocus) onFocus(); }}
          className="w-full border px-3 py-2 rounded-l text-slate-900"
          placeholder="Escribe una dirección"
        />

        {/* 🔘 BOTON DE ACTIVAR AUTOSUGERENCIAS */}
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`px-3 rounded-r text-white text-sm font-bold ${
            enabled ? "bg-emerald-600" : "bg-slate-400"
          }`}
          title="Activar sugerencias"
        >
          🔍
        </button>
      </div>

      {/* LISTA DE SUGERENCIAS */}
      {enabled && suggestions.length > 0 && (
        <ul className="absolute z-20 bg-white text-slate-900 border rounded mt-1 w-full shadow-lg max-h-56 overflow-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-3 py-2 hover:bg-emerald-100 cursor-pointer text-sm"
              onClick={() => {
                onSelect(s);
                setEnabled(false);
                setSuggestions([]);
              }}
            >
              {s.address}
            </li>
          ))}
        </ul>
      )}

      {enabled && loading && (
        <div className="absolute z-20 bg-white text-slate-900 border rounded mt-1 w-full p-2 text-sm">
          Buscando…
        </div>
      )}
    </div>
  );
}
