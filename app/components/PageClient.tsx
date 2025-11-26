"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import dynamic from "next/dynamic";
import ScrollBar from "./ScrollBar";

import AddressAutocomplete from "./AddressAutocomplete";
import PhotoGallery from "./PhotoGallery";
import FrequentPlaces from "./FrequentPlaces";
import FloatingScroll from "./FloatingScroll";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

const WHATSAPP_NUMBER = "34640796659";

export default function PageClient() {
  // Estados
  const [pickup, setPickup] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);

  const [addressInput, setAddressInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [extras, setExtras] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [routeMin, setRouteMin] = useState<number | null>(null);

  const [selectedField, setSelectedField] = useState<"pickup" | "destination">("pickup");

  const [showTariffs, setShowTariffs] = useState(false);

  const pickupRef = useRef<HTMLInputElement | null>(null);
  const destRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split("T")[0]);
  }, []);
  function buildMapsLink(lat?: number, lng?: number) {
    if (!lat || !lng) return "";
    return `https://maps.google.com/?q=${lat},${lng}`;
  }

  function buildMessage(
    address: string | null,
    destination: string | null,
    date: string | null,
    time: string | null,
    extras: string | null
  ) {

    return (
      `Buen día Pablo,\n` +
      `Quiero reservar un viaje.\n` +
      `Recogida: ${address || "-----"}\n` +
      `Destino: ${destination || "-----"}\n` +
      `Fecha: ${date || "-----"}\n` +
      `Hora: ${time || "-----"}\n` +
      `Extras: ${extras || "Ninguno"}\n\n` +
      (routeKm != null
        ? `Distancia estimada: ${routeKm.toFixed(1)} km\nDuración aprox.: ${routeMin?.toFixed(0)} min\n`
        : "") +
      (buildMapsLink(pickup?.lat, pickup?.lng))

    );
  }

  const whatsappMessage = buildMessage(addressInput, destinationInput, date, time, extras);
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  useEffect(() => {
    QRCode.toDataURL(whatsappLink, { margin: 2, scale: 6 })
      .then((url) => setQrSrc(url))
      .catch(() => setQrSrc(null));
  }, [whatsappMessage]);

  // map callbacks
  function handleMapPick(type: "pickup" | "destination", loc: any) {
    if (!loc) return;
    if (type === "pickup") {
      setPickup(loc);
      setAddressInput(loc.address || `${loc.lat}, ${loc.lng}`);
      setSelectedField("pickup");
      setTimeout(() => pickupRef.current?.focus(), 50);
    } else {
      setDestination(loc);
      setDestinationInput(loc.address || `${loc.lat}, ${loc.lng}`);
      setSelectedField("destination");
      setTimeout(() => destRef.current?.focus(), 50);
    }
  }

  function handleMarkerDrag(which: "pickup" | "destination", loc: any) {
    if (which === "pickup") {
      setPickup(loc);
      setAddressInput(loc.address || `${loc.lat}, ${loc.lng}`);
    } else {
      setDestination(loc);
      setDestinationInput(loc.address || `${loc.lat}, ${loc.lng}`);
    }
  }

  function handleRouteCalculated(km: number | null, minutes: number | null) {
    setRouteKm(km);
    setRouteMin(minutes);
  }

  function handleWhatsAppClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!addressInput || !destinationInput || !time) {
      e.preventDefault();
      alert(
        "📣🔔 Alerta NewLife Taxi !\n\n" +
          "Por favor complete:\n" +
          "Punto de recogida y/o Destino\n" +
          "Verificar Fecha/Hora.."
      );
    }
  }

  // handler for FrequentPlaces: sets coords + address text depending on selectedField
  function handleFrequentPlaceSelect(coords: { lat: number; lng: number; address?: string }) {
    if (selectedField === "pickup") {
      setPickup(coords);
      setAddressInput(coords.address || `${coords.lat}, ${coords.lng}`);
      setTimeout(() => pickupRef.current?.focus(), 50);
    } else {
      setDestination(coords);
      setDestinationInput(coords.address || `${coords.lat}, ${coords.lng}`);
      setTimeout(() => destRef.current?.focus(), 50);
    }
  }
  useEffect(() => {
    let timeout: any;

    function handleScroll() {
      document.body.classList.add("scrolling");
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        document.body.classList.remove("scrolling");
      }, 600);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24">
      <header className="max-w-6xl mx-auto px-4 py-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">✨ NewLife Taxi</h1>
        <p className="text-slate-300 mt-1">Traslados privados de lujo en Madrid</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* TOP */}
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
            <div className="rounded-lg overflow-hidden shadow">
              <Image src="/car1.jpg" alt="Taxi principal" width={1600} height={900} className="w-full h-auto object-cover" unoptimized />
            </div>

            <div className="mt-4 flex justify-center">
              <PhotoGallery main="/car1.jpg" others={["/car2.jpg", "/car3.jpg", "/car4.jpg", "/car5.jpg"]} />
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

        {/* DESCRIPCIÓN */}
        <section className="mt-6 bg-[#e4eaf1] text-slate-900 p-6 rounded shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold">Tu taxi premium en Madrid</h2>
          <p className="mt-3 text-slate-700 text-sm md:text-base">Servicio privado, eléctrico y silencioso. Puntualidad y confort para todos tus traslados.</p>
        </section>

        {/* MAPA + FORM */}
        <section className="mt-6 bg-[#e4eaf1] text-slate-900 p-6 rounded shadow-sm">
          <h2 className="font-semibold mb-3 text-lg">Mapa y recogida</h2>
          <p className="text-sm text-slate-600 mb-3">Toca el mapa para elegir tu punto de recogida o escribe las direcciones abajo.</p>

          <MapComponent
            onPick={(type, loc) => handleMapPick(type, loc)}
            onMarkerDrag={(which, loc) => handleMarkerDrag(which, loc)}
            pickupInitial={pickup}
            destinationInitial={destination}
            selectedField={selectedField}
            onRouteCalculated={(km, minutes) => handleRouteCalculated(km, minutes)}
          />

          {/* Selector */}
          <div className="flex gap-2 mt-6 mb-4 justify-center">
            <button onClick={() => { setSelectedField("pickup"); setTimeout(() => pickupRef.current?.focus(), 50); }} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedField === "pickup" ? "bg-emerald-600 text-white shadow" : "bg-slate-300 text-slate-800"}`}>
              Punto de recogida
            </button>

            <button onClick={() => { setSelectedField("destination"); setTimeout(() => destRef.current?.focus(), 50); }} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedField === "destination" ? "bg-emerald-600 text-white shadow" : "bg-slate-300 text-slate-800"}`}>
              Destino
            </button>
          </div>

          {/* FrequentPlaces (collapsed by default) */}
          <div className="mt-4">
            <FrequentPlaces onSelect={(coords) => handleFrequentPlaceSelect(coords)} initialOpen={false} />
          </div>

          {/* FORM */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mt-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700">Punto de recogida</label>
              <AddressAutocomplete inputRef={pickupRef} value={addressInput} onChange={(v) => { setAddressInput(v); setSelectedField("pickup"); }} onFocus={() => setSelectedField("pickup")} onSelect={(s) => { setAddressInput(s.address); setPickup(s); setSelectedField("pickup"); }} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700">Destino</label>
              <AddressAutocomplete inputRef={destRef} value={destinationInput} onChange={(v) => { setDestinationInput(v); setSelectedField("destination"); }} onFocus={() => setSelectedField("destination")} onSelect={(s) => { setDestination(s); setDestinationInput(s.address); setSelectedField("destination"); }} />
            </div>

            <div className="md:col-span-2">
              {routeKm != null ? (
                <div className="text-sm mt-1 text-slate-700 bg-white/60 p-2 rounded">
                  <div><strong>Distancia estimada:</strong> {routeKm.toFixed(1)} km</div>
                  <div><strong>Duración aprox.:</strong> {routeMin?.toFixed(0)} min (sin trafico)</div>
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
              <input value={time} onChange={(e) => setTime(e.target.value)} type="time" placeholder="Selecciona hora" className="mt-1 w-full border px-3 py-2 rounded text-slate-900" />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700">Notas Extras</label>
              <input value={extras} onChange={(e) => setExtras(e.target.value)} type="text" placeholder="Ej: 2 maletas grandes y 2 pequeñas" className="mt-1 w-full border px-3 py-2 rounded text-slate-900" />
            </div>
          </div>

          {/* Vista previa WhatsApp (con borde) */}
          <div className="mt-4">
            <div className="text-lg font-bold text-emerald-700 mb-2">💬 Vista previa del mensaje que enviarás por WhatsApp</div>

            <textarea readOnly rows={10} value={whatsappMessage} className="w-full p-3 rounded text-slate-900 border-2 border-emerald-200 bg-white/95" />
          </div>

          {/* Botón + QR */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <a href={whatsappLink} onClick={handleWhatsAppClick} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white px-5 py-3 rounded-full font-semibold hover:bg-emerald-700 text-center w-full md:w-auto">Reservar por WhatsApp</a>

            <div className="flex items-center gap-4 justify-center">
              <div className="text-xs text-slate-500">QR con la reserva</div>
              {qrSrc ? <img src={qrSrc} alt="QR" width={110} height={110} className="rounded shadow" /> : <div className="p-3 border rounded">Generando QR…</div>}
            </div>
          </div>
        </section>

        {/* Tarifas */}
        <section className="mt-6">
          <button className="w-full bg-[#e4eaf1] text-slate-900 p-3 rounded shadow-sm font-semibold flex justify-between items-center" onClick={() => setShowTariffs(!showTariffs)}>
            Tarifas oficiales del taxi en Madrid
            <span>{showTariffs ? "▲" : "▼"}</span>
          </button>

          {showTariffs && (
            <div className="bg-[#e4eaf1] text-slate-900 mt-2 p-4 rounded shadow-sm text-sm leading-relaxed">
              <p>Las tarifas están reguladas oficialmente por el Ayuntamiento de Madrid. Incluyen suplementos por aeropuerto, servicios nocturnos y festivos.</p>
              <p className="mt-3">Para ver la información oficial completa, visita:</p>
              <a target="_blank" rel="noreferrer" className="text-blue-700 underline" href="https://www.madrid.es/portales/munimadrid/es/Inicio/El-Ayuntamiento/Moncloa-Aravaca/Taxi/?vgnextfmt=default&vgnextoid=4813dc0bffa41110VgnVCM1000000b205a0aRCRD&vgnextchannel=e9a3ca5d5fb96010VgnVCM100000dc0ca8c0RCRD&idCapitulo=11086871">Tarifas oficiales del taxi — Ayuntamiento de Madrid</a>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-400 text-center">© NewLife Taxi — Madrid • Tel: +34 640 796 659</footer>

      {/* Floating scroll for easy thumb navigation */}
      <FloatingScroll />
      
    </div>
  );
}
