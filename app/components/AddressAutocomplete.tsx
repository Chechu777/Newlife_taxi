"use client";

import { useEffect, useState, useRef } from "react";

interface Suggestion {
  address: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: Suggestion) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<HTMLInputElement> | null;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onFocus,
  inputRef
}: AddressAutocompleteProps) {

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const timeoutRef = useRef<any>(null);

  function fetchSuggestions(query: string) {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSuggestions(data);
      })
      .catch(() => {});
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);
    setShowSuggestions(true);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(v);
    }, 300);
  }

  function handleBlur() {
    setTimeout(() => setShowSuggestions(false), 150);
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef || undefined}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          onFocus && onFocus();
          setShowSuggestions(true);
        }}
        onBlur={handleBlur}
        type="text"
        className="mt-1 w-full border px-3 py-2 rounded text-slate-900"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 bg-white border rounded shadow mt-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => {
                onSelect(s);
                setShowSuggestions(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-slate-100 text-slate-800 text-sm"
            >
              {s.address}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
