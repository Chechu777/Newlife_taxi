"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRCodeGen({ text }: { text: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return setSrc(null);
    QRCode.toDataURL(text, { margin: 2, scale: 6 })
      .then((url: string) => setSrc(url))
      .catch(() => setSrc(null));
  }, [text]);

  if (!text) return null;

  return (
    <div className="mt-4">
      {src ? (
        <img src={src} alt="QR" width={220} height={220} className="rounded shadow" />
      ) : (
        <div className="p-6 border rounded">Generando QR…</div>
      )}
    </div>
  );
}
