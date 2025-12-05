// app/components/PageClient.tsx
"use client";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Image from "next/image";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

import "yet-another-react-lightbox/styles.css";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

import AddressAutocomplete, { Suggestion } from "./AddressAutocomplete";
import QuickPlaces from "./QuickPlaces";

// PhotoGallery embebido (fallback simple para que veas fotos y el desplegable "Más fotos")
function PhotoGallery({
  main = "/Taxi.jpg",
  others = ["/car1.jpg", "/car2.jpg", "/car3.jpg", "/car4.jpg"]
}) {
  const [open, setOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = [main, ...others];

  return (
    <div className="w-full">
      {/* FOTO PRINCIPAL */}
      <div
        className="rounded overflow-hidden shadow mb-3 cursor-pointer"
        onClick={() => {
          setIndex(0);
          setTimeout(() => setLightboxOpen(true), 80);
        }}
      >
        <Image
          src={main}
          alt="Foto principal"
          width={1600}
          height={900}
          className="w-full h-56 object-cover rounded"
          unoptimized
        />
      </div>

      {/* BOTÓN */}
      <div className="text-center">
        <button
          onClick={() => setOpen(o => !o)}
          className="text-sm px-3 py-2 rounded bg-slate-200 text-slate-900"
        >
          {open ? "Ocultar fotos" : "Más fotos"}
        </button>
      </div>

      {/* MINIATURAS */}
      {open && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {slides.map((src, i) => (
            <div
              key={i}
              className="border rounded overflow-hidden cursor-pointer h-24 relative"
              onClick={() => {
                setIndex(i);
                setTimeout(() => setLightboxOpen(true), 80);
              }}
            >
              <Image src={src} alt={`thumb${i}`} fill className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={index}
        slides={slides.map(s => ({ src: s }))}
        plugins={[Fullscreen, Thumbnails]}
      />
    </div>
  );
}

// MapComponent import dinámico (debes usar ssr:false)
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false,  loading: () => <div className="w-full h-64 bg-gray-200 animate-pulse rounded" />});

// Define la interfaz mínima que esperamos del Map ref (fitMarkers, lock, unlock)
export type MapHandle = {
  fitMarkers?: () => void;
  lock?: () => void;
  unlock?: () => void;
  moveTo?: (lat: number, lng: number) => void; 
};

const WHATSAPP_NUMBER = "+34640796659";

export default function PageClient() {
  // estado local
  type LatLngObj = { lat: number; lng: number; address?: string };
  const [pickup, setPickup] = useState<LatLngObj | null>(null);
  const [destination, setDestination] = useState<LatLngObj | null>(null);

  const [addressInput, setAddressInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [extras, setExtras] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [routeMin, setRouteMin] = useState<number | null>(null);

  const [selectedField, setSelectedField] = useState<"pickup" | "destination" | null>("pickup");
  const [lockedUI, setLockedUI] = useState(false);

  // ref al map (métodos expuestos por MapComponent)
  const mapRef = useRef<MapHandle | null>(null);
  const pickupRef = useRef<HTMLInputElement | null>(null);
  const destRef = useRef<HTMLInputElement | null>(null);

  // init fecha actual
  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split("T")[0]);
  }, []);

  function handleWhatsAppClick() {
    // Parche silencioso: evita errores si el build anterior aún lo busca
  }

  // Construcción del mensaje de WhatsApp
  function buildMapsLink(lat?: number, lng?: number) {
    if (!lat || !lng) return "";
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  function formatWhatsAppMessage(addr: string, dest: string, dt: string, tm: string, ex: string) {
    return (
      `Buen día Pablo,\n` +
      `Quiero reservar un viaje.\n\n` +
      `Recogida: ${addr || "-----"}\n` +
      `Destino: ${dest || "-----"}\n` +
      `Fecha: ${dt || "-----"}\n` +
      `Hora: ${tm || "-----"}\n` +
      `Extras: ${ex || "Ninguno"}\n\n` +
      (routeKm != null ? `Distancia estimada: ${routeKm.toFixed(1)} km\nDuración aprox.: ${routeMin?.toFixed(0)} min\n\n` : "") +
      (pickup ? buildMapsLink(pickup.lat, pickup.lng) : "")
    );
  }

  const whatsappMessage = formatWhatsAppMessage(addressInput, destinationInput, date, time, extras);
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  // Genera QR
  useEffect(() => {
    async function generateQR() {
      try {
        const url: string = await QRCode.toDataURL(whatsappLink, { margin: 2, scale: 6 });
        setQrSrc(url);
      } catch {
        setQrSrc(null);
      }
    }
    generateQR();
  }, [whatsappMessage]);
  // ---------------------------
  // UTIL: formateo corto de direcciones según tu especificación
  // Input de nominatim: display_name largo. Convertir a: "C. de {calle}, {número}, {Distrito corto}, {CP} {Ciudad}"
  function formatShortAddress(longAddress: string) {
    if (!longAddress) return "";

    // separar por comas y limpiar
    const parts = longAddress.split(",").map((p) => p.trim()).filter(Boolean);

    try {
      // Buscar CP y ciudad
      let city = "Madrid";
      let cp = "";

      const lastIdx = parts.findIndex((p) => /Madrid/i.test(p) || /\d{5}/.test(p));

      if (lastIdx >= 0) {
        const tail = parts.slice(lastIdx);

        // CP
        const cpElem = tail.find((t) => /\b\d{5}\b/.test(t));
        if (cpElem) cp = (cpElem.match(/\b\d{5}\b/) || [""])[0];

        // Ciudad
        const cityElem = tail.find((t) =>
          /\b\d{5}\b/.test(t) ? false : /Madrid/i.test(t)
        );
        if (cityElem) city = "Madrid";
      }

      // Detectar calle y número
      let house = "";
      let street = "";

      if (parts.length >= 2) {
        if (/^\d+/.test(parts[0])) {
          // caso típico: "21, Calle de Ejemplo"
          house = parts[0];
          street = parts[1];
        } else {
          // caso: "Calle de Ejemplo 21"
          const m = parts[0].match(/^(.*)\s+(\d+)$/);
          if (m) {
            street = m[1];
            house = m[2];
          } else {
            street = parts[0];
            if (parts[1] && /^\d+$/.test(parts[1])) house = parts[1];
          }
        }
      } else {
        street = parts[0] || "";
      }

      // Detectar distrito
      const districtPart = parts.find((p) =>
        /Ciudad Lineal|Chamberí|Salamanca|Arganzuela|Centro|Retiro|Moncloa|Latina|Carabanchel|Tetuan|Usera|Fuencarral|Chamartín|Atocha|Pueblo Nuevo/i.test(
          p
        )
      );

      let district = districtPart || parts[2] || "";

      // Corregir abreviaciones
      district = district
        .replace(/Ciudad Lineal/i, "Cdad. Lineal")
        .replace(/\bCiudad\b/i, "Cdad.");

      // Abreviar "Calle"
      const streetShort = street
        ? street
            .replace(/^Calle\s+de\s+/i, "C. de ")
            .replace(/^Calle\s+/i, "C. ")
        : "";

      const housePart = house ? `, ${house}` : "";
      const cpCity = cp ? `${cp} ${city}` : city;

      const formatted = `${streetShort}${housePart}${
        district ? `, ${district}` : ""
      }${cp ? `, ${cpCity}` : `, ${city}`}`;

      return formatted
        .replace(/\s+,/g, ",")
        .replace(/,\s*,/g, ",")
        .trim();
    } catch (err) {
      return longAddress;
    }
  }


  // ---------------------------
  // AUTO-GEOLOCALIZACIÓN al cargar: pedir permiso, rellenar pickup y centrar mapa con punto azul + halo
  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return; 

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`);
          const json = await r.json();
          const longAddr = json.display_name || "";
          const formatted = formatShortAddress(longAddr || `${lat}, ${lng}`);

          // set pickup & input
          setPickup({ lat, lng, address: formatted });
          setTimeout(() => {try {mapRef.current?.fitMarkers?.();} catch {}
          }, 150);
          setAddressInput(formatted);
          setSelectedField("pickup");
          setLockedUI(false);

          // pedir al map que haga zoom y centro suave
          setTimeout(() => {
            try {
              mapRef.current?.fitMarkers?.();
            } catch {}
          }, 300);
        } catch (err) {
          // fallback simple
          setPickup({ lat, lng, address: `${lat}, ${lng}` });
          setTimeout(() => {try {mapRef.current?.fitMarkers?.();} catch {}
          }, 150);
          setAddressInput(`${lat}, ${lng}`);
        }
      },
      (err) => {
        // denied o timeout -> no hacemos nada, conservar estado
        console.warn("Geolocation denied or failed", err);
      },
      { maximumAge: 60_000, timeout: 7000, enableHighAccuracy: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando ambos puntos existen -> lock map, quitar selección y pedir fitMarkers
  // AUTO-ZOOM cuando pickup + destino están definidos
  useEffect(() => {
    const pickupValid =
      pickup && typeof pickup.lat === "number" && typeof pickup.lng === "number";
    const destValid =
      destination && typeof destination.lat === "number" &&
      typeof destination.lng === "number";

    if (pickupValid && destValid) {
      // se bloquea input pero NO el movimiento del mapa durante el fitBounds
      setSelectedField(null);
      setLockedUI(true);

      // pedir al map que haga fitBounds suave
      setTimeout(() => {
        try {
          mapRef.current?.fitMarkers?.();
        } catch {}
      }, 150);

      return;
    }

    // si falta algún punto -> desbloquear UI
    setLockedUI(false);
  }, [pickup, destination]);

  // toggle select field (pickup/destination)
  function toggleSelectField(field: "pickup" | "destination") {
    if (selectedField === field) {
      setSelectedField(null);
      return;
    }
    setSelectedField(field);
    setLockedUI(false);
    setTimeout(() => {
      if (field === "pickup") pickupRef.current?.focus();
      else destRef.current?.focus();
    }, 50);
  }

  // Manejo cuando MapComponent reporta una pick por click o reverse geocode
  function onMapPick(type: "pickup" | "destination", loc: { lat: number; lng: number; address?: string } | null) {
    if (!loc) return;
    const formatted = loc.address ? formatShortAddress(loc.address) : loc.address || `${loc.lat}, ${loc.lng}`;
    if (type === "pickup") {
      setPickup({ lat: loc.lat, lng: loc.lng, address: formatted });
      setTimeout(() => {try {mapRef.current?.fitMarkers?.();} catch {}
      }, 150);
      setAddressInput(formatted);
    } else {
      setDestination({ lat: loc.lat, lng: loc.lng, address: formatted });
      setDestinationInput(formatted);
    }
  }

  // Manejo arrastre de marker desde MapComponent
  function onMarkerDrag(which: "pickup" | "destination", loc: { lat: number; lng: number; address?: string }) {
    const formatted = loc.address ? formatShortAddress(loc.address) : loc.address || `${loc.lat}, ${loc.lng}`;
    if (which === "pickup") {
      setPickup({ lat: loc.lat, lng: loc.lng, address: formatted });
      setTimeout(() => {try {mapRef.current?.fitMarkers?.();} catch {}
      }, 150);
      setAddressInput(formatted);
    } else {
      setDestination({ lat: loc.lat, lng: loc.lng, address: formatted });
      setDestinationInput(formatted);
    }
  }

  // Cuando MapComponent calcula ruta (si usa OSRM/GraphHopper y nos pasa km y mins)
  function onRouteCalculated(km: number | null, minutes: number | null) {
    if (km == null || minutes == null) {
      // fallback: calcular por Haversine + velocidad estimada 40 km/h
      if (pickup && destination) {
        const kmCalc = haversineKm(pickup.lat!, pickup.lng!, destination.lat!, destination.lng!);
        const minutesCalc = Math.round((kmCalc / 40) * 60);
        setRouteKm(kmCalc);
        setRouteMin(minutesCalc);
      } else {
        setRouteKm(null);
        setRouteMin(null);
      }
    } else {
      setRouteKm(km);
      setRouteMin(minutes);
    }
  }

  // QuickPlaces selection
  function handleQuickPlaceSelect(coords: { lat: number; lng: number; address?: string }) {
    const formatted = coords.address ? formatShortAddress(coords.address) : coords.address || `${coords.lat}, ${coords.lng}`;
    if (selectedField === "destination") {
      setDestination({ lat: coords.lat, lng: coords.lng, address: formatted });
      setDestinationInput(formatted);
    } else {
      // default pickup
      setPickup({ lat: coords.lat, lng: coords.lng, address: formatted });
      setTimeout(() => {try {mapRef.current?.fitMarkers?.();} catch {}
      }, 150);
      setAddressInput(formatted);
    }

    // after quick place, fit if both set (effect above will handle lock + fit)
    setTimeout(() => {
      try {
        mapRef.current?.fitMarkers?.();
      } catch {}
    }, 200);
  }

  function handleAddressSelectFromAutocomplete(selected: any, field: "pickup" | "destination") {
    if (!selected) return;

    const latNum = Number(selected.lat);
    const lonNum = Number(selected.lon);
    if (isNaN(latNum) || isNaN(lonNum)) return;

    // ← Usa tu formateador corto
    const formatted = formatShortAddress(selected.display_name || "");

    if (field === "pickup") {
      setPickup({ lat: latNum, lng: lonNum, address: formatted });
      setAddressInput(formatted);          // ← Esto escribe en el input
      mapRef.current?.moveTo?.(latNum, lonNum);
    }

    if (field === "destination") {
      setDestination({ lat: latNum, lng: lonNum, address: formatted });
      setDestinationInput(formatted);      // ← Esto escribe en el input
    }

    // Ajustar zoom si ambos están definidos
    const pickupValid = field === "pickup" ? { lat: latNum, lng: lonNum } : pickup;
    const destValid = field === "destination" ? { lat: latNum, lng: lonNum } : destination;

    if (pickupValid && destValid) {
      mapRef.current?.fitMarkers?.();
    }
  }

  // ---------------------------
  // util: haversine para distancia en km
  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 10) / 10; // redondeo 1 decimal
  }

  // ---------------------------
  // UI render
  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      <header className="max-w-6xl mx-auto px-4 py-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">✨ NewLife Taxi</h1>
        <p className="text-slate-300 mt-1">Traslados privados de lujo en Madrid</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* SECCIÓN 1 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <aside>
            <div className="bg-[#e4eaf1] text-slate-900 p-4 rounded shadow-sm mb-4">
              <h3 className="font-semibold">Ventajas</h3>
              <ul className="mt-3 text-sm space-y-2 text-slate-700">
                <li>🚗 Vehículo 100% eléctrico</li>
                <li>👌 Interior amplio y confortable</li>
                <li>📦 Gran maletero</li>
                <li>🕒 Puntualidad y seriedad</li>
              </ul>
            </div>
          </aside>

          <div>
            <div className="mt-4 flex justify-center">
              <PhotoGallery main="/Taxi.jpg" others={["/car5.jpg", "/car4.jpg", "/car3.jpg", "/car2.jpg"]} />
            </div>
          </div>

          <aside>
            <div className="bg-[#e4eaf1] text-slate-900 p-4 rounded border shadow-sm">
              <div className="font-semibold">Servicio especial ⭐</div>
              <div className="text-sm mt-2">Traslados largos y/o aeropuerto</div>
              <div className="font-semibold mt-3">HORARIO 🕒</div>
              <div className="text-sm mt-2">De 8:00h a 20:00h</div>
            </div>
          </aside>
        </section>

        {/* SECCIÓN 2: FORM + MAP */}
        <section className="mt-6 bg-[#e4eaf1] text-slate-900 p-6 rounded shadow-sm">
          <div className="max-w-4xl mx-auto flex gap-3 mb-6">
            {/* Columna de botones */}
            <div className="flex flex-col gap-4 w-28">
              <button
                type="button"
                onClick={() => {
                  setSelectedField("pickup");
                  setLockedUI(false);         // <-- evita que lockedUI quede atascado
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold ${
                  selectedField === "pickup"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-300 text-slate-800"
                }`}
              >
                🚕 Recogida
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedField("destination");
                  setLockedUI(false);         // <-- igual aquí
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold ${
                  selectedField === "destination"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-300 text-slate-800"
                }`}
              >
                🏁 Destino
              </button>
            </div>

            {/* Inputs */}
            <div className="flex-1 flex flex-col gap-4">
              <AddressAutocomplete
                inputRef={pickupRef}
                value={addressInput}
                disabled={selectedField !== "pickup" || lockedUI}
                placeholder="Escribe punto de recogida..."
                hideSearchIcon={true}
                onChange={(v) => {
                  setSelectedField("pickup");        // <-- PARCHE IMPORTANTE
                  setAddressInput(v);
                }}
                onSelect={(s) => handleAddressSelectFromAutocomplete(s, "pickup")}
              />

              <AddressAutocomplete
                inputRef={destRef}
                value={destinationInput}
                disabled={selectedField !== "destination" || lockedUI}
                placeholder="Escribe destino..."
                hideSearchIcon={true}
                onChange={(v) => {
                  setSelectedField("destination");   // <-- PARCHE IMPORTANTE
                  setDestinationInput(v);
                }}
                onSelect={(s) => handleAddressSelectFromAutocomplete(s, "destination")}
              />
            </div>
          </div>

<div className="mt-4 max-w-4xl mx-auto">
            <QuickPlaces onSelect={handleQuickPlaceSelect} disabled={!selectedField || lockedUI} />
          </div>

          <div className="mt-6">
            <div className="w-full h-[420px] rounded overflow-hidden">
              <MapComponent
                ref={mapRef}
                pickupInitial={pickup}
                destinationInitial={destination}
                selectedField={selectedField}
                lockedUI={!selectedField || lockedUI}
                onPick={(type: "pickup" | "destination", loc) => onMapPick(type, loc)}
                onMarkerDrag={(which: "pickup" | "destination", loc) => onMarkerDrag(which, loc)}
                onRouteCalculated={(km: number | null, minutes: number | null) => onRouteCalculated(km, minutes)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mt-6">
            <div className="md:col-span-2">
              {routeKm != null ? (
                <div className="text-sm mt-1 text-slate-700 bg-white/60 p-2 rounded">
                  <div><strong>Distancia estimada:</strong> {routeKm.toFixed(1)} km</div>
                  <div><strong>Duración aprox.:</strong> {routeMin?.toFixed(0)} min</div>
                </div>
              ) : (
                <div className="text-sm mt-1 text-slate-700 bg-white/10 p-2 rounded">—</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Fecha</label>
              <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="mt-1 w-full border px-3 py-2 rounded text-slate-900" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Hora</label>
              <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="mt-1 w-full border px-3 py-2 rounded text-slate-900" />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700">Notas Extras</label>
              <input value={extras} onChange={(e) => setExtras(e.target.value)} type="text" placeholder="Ej: 2 maletas grandes y 2 pequeñas" className="mt-1 w-full border px-3 py-2 rounded text-slate-900" />
            </div>
          </div>

          <div className="mt-4 max-w-4xl mx-auto">
            <div className="text-lg font-bold text-emerald-700 mb-2">💬 Vista previa del mensaje que enviarás por WhatsApp</div>
            <textarea readOnly rows={10} value={whatsappMessage} className="w-full p-3 rounded text-slate-900 border-2 border-emerald-200 bg-white/95" />
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-4xl mx-auto">
            <a href={whatsappLink} onClick={handleWhatsAppClick} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white px-5 py-3 rounded-full font-semibold hover:bg-emerald-700 text-center w-full md:w-auto">
              Reservar por WhatsApp
            </a>

            <div className="flex items-center gap-4 justify-center">
              <div className="text-xs text-slate-500">QR con la reserva</div>
              {qrSrc ? <img src={qrSrc} width={110} height={110} className="rounded shadow" alt="QR" /> : <div className="p-3 border rounded">Generando QR…</div>}
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-400 text-center">© NewLife Taxi — Madrid • Tel: +34 640 796 659</footer>
    </div>
  );
}
