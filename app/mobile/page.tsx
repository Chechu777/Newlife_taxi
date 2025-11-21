"use client";
export const dynamic = "force-dynamic";
export const ssr = false;
export const runtime = "edge";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import QRCode from "qrcode";
import AddressAutocomplete from "../components/AddressAutocomplete";

const MapComponent = dynamic(() => import("../components/MapComponent"), { ssr: false });

const WHATSAPP_NUMBER = "34640796659";

export default function MobilePage() {
  const [pickup, setPickup] = useState<{ lat?: number; lng?: number; address?: string } | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [qrSrc, setQrSrc] = useState<string | null>(null);

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

  useEffect(() => {
    const msg = buildMessage(addressInput, date, time);
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    QRCode.toDataURL(waLink, { margin: 2, scale: 6 })
      .then(setQrSrc)
      .catch(() => setQrSrc(null));
  }, [addressInput, date, time]);

  function buildMessage(address: string, date: string, time: string) {
    return `Hola, quiero reservar un viaje.\nRecogida: ${address || "-----"}\nFecha: ${date || "-----"}\nHora: ${time || "-----"}\nGracias.`;
  }

  function handlePick(p: { lat: number; lng: number; address?: string }) {
    setPickup(p);
    setAddressInput(p.address || `${p.lat}, ${p.lng}`);
  }

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(addressInput, date, time))}`;

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      {/* HEADER */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-[100px]">
            <Image src="/Logo.png" alt="NewLife Taxi" width={200} height={50} priority />
          </div>
          <div className="text-xs text-white/80 hidden sm:block">
            <div className="font-semibold">Movilidad premium 100% eléctrica</div>
            <div className="mt-1">Rápido • Silencioso • Cero emisiones</div>
          </div>
        </div>
        <a
          href={`tel:+${WHATSAPP_NUMBER}`}
          className="px-3 py-2 border rounded text-white/90 text-sm"
        >
          Llamar
        </a>
      </header>

      <main className="px-4 space-y-4">
        {/* FOTO DEL TAXI */}
        <div className="rounded-lg overflow-hidden shadow">
          <Image src="/Taxi.jpg" alt="Taxi" width={1600} height={800} className="w-full h-auto" />
        </div>

        {/* VENTAJAS Y SERVICIO ESPECIAL */}
        <div className="space-y-2">
          <div className="bg-white text-slate-900 p-3 rounded shadow-sm">
            <h3 className="font-semibold">Ventajas</h3>
            <ul className="mt-2 text-sm space-y-1 text-slate-700">
              <li>🚗 Vehículo 100% eléctrico</li>
              <li>👌 Interior amplio y confortable</li>
              <li>📦 Gran maletero</li>
              <li>🕒 Puntualidad y seriedad</li>
            </ul>
          </div>

          <div className="bg-amber-50 text-slate-900 p-3 rounded border">
            <div className="font-semibold">Servicio especial</div>
            <p className="text-sm mt-1">
              Para traslados largos y/o aeropuerto (llevar y recoger)
            </p>
            <div className="font-semibold mt-2">HORARIO 🕒</div>
            <p className="text-sm mt-1">Horario corrido De 8:00 AM a 20:00 PM</p>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="bg-white text-slate-900 p-3 rounded shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">Reserva tu viaje</h2>

          <AddressAutocomplete
            value={addressInput}
            onChange={setAddressInput}
            onSelect={(s) => {
              setAddressInput(s.address);
              handlePick({ lat: s.lat!, lng: s.lng!, address: s.address });
            }}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border px-2 py-2 rounded text-slate-900 text-sm"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border px-2 py-2 rounded text-slate-900 text-sm"
            />
          </div>

          <MapComponent onPick={handlePick} initialPick={pickup} />

          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 text-white px-4 py-3 rounded-full font-semibold block text-center mt-2 hover:bg-emerald-600"
          >
            Reservar mi viaje (WhatsApp)
          </a>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-500">QR con el mensaje:</span>
            {qrSrc ? (
              <img src={qrSrc} alt="QR" width={60} height={60} className="rounded shadow" />
            ) : (
              <div className="p-2 border rounded text-xs">Generando QR…</div>
            )}
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-sm text-slate-400">
        © NewLife Taxi — Madrid • Tel: +34 640 796 659
      </footer>
    </div>
  );
}
