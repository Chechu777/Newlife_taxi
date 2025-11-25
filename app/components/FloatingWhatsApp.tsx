// app/components/FloatingWhatsApp.tsx
"use client";

export default function FloatingWhatsApp({ href }: { href: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition transform"
      >
        Reserva por WhatsApp
      </a>
    </div>
  );
}
