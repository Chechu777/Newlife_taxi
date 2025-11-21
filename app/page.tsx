"use client";
export const dynamic = "force-dynamic";
export const ssr = false;
export const runtime = "edge";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import AddressAutocomplete from "./components/AddressAutocomplete";
import MapComponent from "./components/MapComponent";

const WHATSAPP_NUMBER = "34640796659";

export default function Page() {
  const [pickup, setPickup] = useState<{ lat?: number; lng?: number; address?: string } | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  // Fecha y hora iniciales
  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);

    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    setTime(`${hh}:${min}`);
  }, []);

  // QR dinámico
  useEffect(() => {
    const msg = `Hola, quiero reservar un viaje.\nRecogida: ${addressInput}\nFecha: ${date}\nHora: ${time}\nGracias.`;
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    QRCode.toDataURL(waLink, { margin: 2, scale: 6 })
      .then((url: string) => setQrSrc(url))
      .catch(() => setQrSrc(null));
  }, [addressInput, date, time]);

  function handlePick(p: { lat: number; lng: number; address?: string }) {
    setPickup(p);
    setAddressInput(p.address || `${p.lat}, ${p.lng}`);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-10">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex items-center justify-between py-6 px-4">
        <div className="flex items-center gap-4">
          <div className="w-[110px] md:w-[140px]">
            <Image src="/Logo.png" alt="NewLife Taxi" width={300} height={80} priority />
          </div>

          <div className="hidden md:block text-sm text-slate-300">
            <div className="font-semibold">Movilidad premium 100% eléctrica</div>
            <div className="text-xs">Rápido • Silencioso • Cero emisiones</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-emerald-600 text-sm"
          >
            WhatsApp
          </a>
          <a href="tel:+34640796659" className="px-3 py-2 border rounded text-sm text-white/90">
            Llamar
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        {/* FOTO + INFO */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Image
              src="/Taxi.jpg"
              alt="Taxi"
              width={1600}
              height={900}
              className="rounded-lg overflow-hidden shadow w-full h-auto"
            />
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div className="bg-white text-slate-900 p-4 rounded shadow-sm">
              <h3 className="font-semibold">Ventajas</h3>
              <ul className="mt-3 text-sm space-y-2 text-slate-700">
                <li>🚗 100% eléctrico</li>
                <li>👌 Interior amplio y confortable</li>
                <li>📦 Gran maletero</li>
                <li>🕒 Puntualidad y seriedad</li>
              </ul>
            </div>

            <div className="bg-amber-50 text-slate-900 p-4 rounded border shadow-sm">
              <div className="font-semibold">Servicio especial</div>
              <p className="text-sm mt-2">Traslados largos / Aeropuerto</p>

              <div className="font-semibold mt-2">HORARIO 🕒</div>
              <p className="text-sm">De 8:00 AM a 20:00 PM</p>
            </div>
          </div>
        </section>

        {/* DESCRIPCIÓN */}
        <section className="mt-6 bg-white text-slate-900 p-6 rounded shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold">
            Descubre nuestro Servicio de Taxi de Lujo en Madrid
          </h1>
          <p className="mt-3 text-slate-700 leading-relaxed text-sm md:text-base">
            ¿Buscas un taxi privado de alta gama? En <strong>NewLife Taxi</strong> ofrecemos un
            servicio eléctrico, amplio y silencioso, con puntualidad y trato profesional.
          </p>
        </section>

        {/* MAPA + FORM */}
        <section className="mt-6 bg-white text-slate-900 p-6 rounded shadow-sm">
          <h2 className="font-semibold mb-3 text-lg">Mapa y recogida</h2>
          <p className="text-sm text-slate-600 mb-3">
            Toca el mapa para elegir el punto de recogida.
          </p>

          <MapComponent onPick={handlePick} initialPick={pickup} />

          <div className="mt-4 grid md:grid-cols-4 gap-3 items-end">
            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500">Punto de recogida</label>
              <AddressAutocomplete
                value={addressInput}
                onChange={setAddressInput}
                onSelect={(s) => {
                  setAddressInput(s.address);
                  setPickup({ lat: s.lat, lng: s.lng, address: s.address });
                }}
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs text-slate-500">Fecha</label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                className="mt-1 w-full border px-3 py-2 rounded text-slate-900"
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-xs text-slate-500">Hora</label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                type="time"
                className="mt-1 w-full border px-3 py-2 rounded text-slate-900"
              />
            </div>
          </div>

          {/* Botón + QR */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `Hola, quiero reservar un viaje. Recogida: ${addressInput} Fecha: ${date} Hora: ${time}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500 text-white px-5 py-3 rounded-full font-semibold hover:bg-emerald-600 text-center"
            >
              Reservar por WhatsApp
            </a>

            <div className="flex items-center gap-4 justify-center">
              <div className="text-xs text-slate-500">QR para reservar:</div>
              {qrSrc ? (
                <img src={qrSrc} alt="QR" width={110} height={110} className="rounded shadow" />
              ) : (
                <div className="p-3 border rounded">Generando QR...</div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-400 text-center">
        © NewLife Taxi — Madrid • Tel: +34 640 796 659
      </footer>
    </div>
  );
}
