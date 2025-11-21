"use client";
export const dynamic = "force-dynamic";
export const ssr = false;
export const runtime = "edge";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import AddressAutocomplete from "../components/AddressAutocomplete";
import MapComponent from "../components/MapComponent";
import QRCodeGen from "../components/QRCodeGen";

const WHATSAPP_NUMBER = "34640796659";

export default function Page() {
  const [pickup, setPickup] = useState<{ lat?: number; lng?: number; address?: string } | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  // Inicializar fecha y hora por defecto (hoy y hora actual sin segundos)
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
    // Generar QR del link de WhatsApp (link completo)
    const msg = buildMessage(addressInput, date, time);
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    QRCode.toDataURL(waLink, { margin: 2, scale: 6 })
      .then((url: string) => setQrSrc(url))
      .catch(() => setQrSrc(null));
  }, [addressInput, date, time]);

  function handlePick(p: { lat: number; lng: number; address?: string }) {
    // p.address viene en formato compacto desde MapComponent; si quieres más limpio, puedes procesarlo
    setPickup(p);
    // Convertir la dirección compacta (si viene con coma larga de Nominatim), intentar acortar:
    const short = shortenAddress(p.address || `${p.lat}, ${p.lng}`);
    setAddressInput(short);
  }

  function shortenAddress(full: string) {
    // Intento simple: buscar número de casa y formato "Calle X, 19, Barrio, 28017 Ciudad"
    // Si no se puede, devuelvo la cadena entera.
    if (!full) return "";
    // Nominatim often returns long display_name; we try to extract first 3 parts
    const parts = full.split(",").map(s => s.trim());
    if (parts.length >= 3) {
      // road + housenr (maybe part0), district (part2), post/city (last)
      const roadPart = parts[0];
      const maybeNumber = parts[1] && /^\d+/.test(parts[1]) ? `, ${parts[1]}` : "";
      const district = parts.length >= 4 ? parts[2] : parts[1];
      const last = parts[parts.length - 2] ? parts[parts.length - 2] : parts[parts.length - 1];
      return `${roadPart}${maybeNumber}${district ? `, ${district}` : ""}${last ? `, ${last}` : ""}`;
    }
    return full;
  }

  function buildMessage(address: string, date: string, time: string) {
    // Mensaje limpio ASCII sin emojis para evitar problemas al codificar
    return `Hola, quiero reservar un viaje.\nRecogida: ${address || "-----"}\nFecha: ${date || "-----"}\nHora: ${time || "-----"}\nGracias.`;
  }

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(addressInput, date, time))}`;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="max-w-6xl mx-auto flex items-center justify-between py-6 px-4">
        <div className="flex items-center gap-4">
          <div className="w-[120px]">
            <Image src="/Logo.png" alt="NewLife Taxi" width={300} height={80} priority />
          </div>
          <div className="hidden md:block text-sm text-slate-300">
            <div className="font-semibold">Movilidad premium 100% eléctrica</div>
            <div className="text-xs">Rápido • Silencioso • Cero emisiones</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="bg-emerald-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-emerald-600">
            Reservar por WhatsApp
          </a>
          <a href="tel:+34640796659" className="px-3 py-2 border rounded text-sm text-white/90">Llamar</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-12">

        <section className="grid md:grid-cols-1 gap-6">
          {/* FOTO + VENTAJAS + SERVICIO ESPECIAL */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* FOTO */}
            <div className="md:col-span-2">
              <div className="rounded-lg overflow-hidden shadow">
                <Image
                  src="/Taxi.jpg"
                  alt="Taxi"
                  width={1600}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* VENTAJAS + SERVICIO */}
            <div className="space-y-4">
              <div className="bg-white text-slate-900 p-4 rounded shadow-sm">
                <h3 className="font-semibold">Ventajas</h3>
                <ul className="mt-3 text-sm space-y-2 text-slate-700">
                  <li>🚗 Vehículo 100% eléctrico</li>
                  <li>👌 Interior amplio y confortable</li>
                  <li>📦 Gran maletero</li>
                  <li>🕒 Puntualidad y seriedad</li>
                </ul>
              </div>

              <div className="bg-amber-50 text-slate-900 p-4 rounded border">
                <div className="font-semibold">Servicio especial</div>

                <div className="text-sm mt-2 whitespace-pre-line">
                  {`Para traslados largos y/o aeropuerto (llevar y recoger)

        `}
                </div>

                <div className="font-semibold mt-2">HORARIO 🕒</div>
                <div className="text-sm mt-2 whitespace-pre-line">
                  {`Horario corrido
        De 8:00 AM a 20:00 PM`}
                </div>
              </div>
            </div>
          </div>

          {/* DESCRIPCIÓN + MAPA + FORMULARIO */}
          <div>
            <div className="mt-6 bg-white text-slate-900 p-6 rounded shadow-sm">
              <h1 className="text-2xl md:text-3xl font-bold">Descubre nuestro Servicio de Taxi de Lujo en Madrid</h1>
              <p className="mt-3 text-slate-700 leading-relaxed">
                ¿Buscas un taxi privado de alta gama en Madrid? En <strong>NewLife Taxi</strong> ofrecemos un servicio premium,
                eléctrico, amplio y silencioso. Realizamos traslados en todos los distritos de la capital con puntualidad, seguridad
                y trato profesional. Nuestro vehículo cuenta con gran capacidad de maletero y un interior muy cómodo.
                Reserva indicando punto de recogida y hora exacta pulsando el icono verde para reservar vía WhatsApp.
              </p>
              <p className="mt-3 font-medium">Puntualidad, seriedad, calidad y un servicio personalizado te esperan.</p>
            </div>

            <div className="mt-6 bg-white text-slate-900 p-6 rounded shadow-sm">
              <h2 className="font-semibold mb-3">Mapa y recogida</h2>
              <p className="text-sm text-slate-600 mb-3">
                Haz clic en el mapa para elegir tu punto de recogida. Se autocompletará la casilla.
              </p>

              <MapComponent onPick={handlePick} initialPick={pickup} />

              <div className="mt-4 grid md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500">Punto de recogida</label>
                  <AddressAutocomplete
                    value={addressInput}
                    onChange={(v) => setAddressInput(v)}
                    onSelect={(s) => {
                      setAddressInput(s.address);
                      setPickup({ lat: s.lat, lng: s.lng, address: s.address });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500">Fecha</label>
                  <input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    type="date"
                    className="mt-1 w-full border px-3 py-2 rounded text-slate-900"
                  />
                </div>

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

              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-500 text-white px-5 py-3 rounded-full font-semibold hover:bg-emerald-600"
                >
                  Reservar mi viaje (WhatsApp)
                </a>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-500">QR con el mensaje de reserva:</div>
                  {qrSrc ? (
                    <img src={qrSrc} alt="QR" width={120} height={120} className="rounded shadow" />
                  ) : (
                    <div className="p-3 border rounded">Generando QR…</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        .
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-400">
        © NewLife Taxi — Madrid • Tel: +34 640 796 659
      </footer>
    </div>
  );
}
