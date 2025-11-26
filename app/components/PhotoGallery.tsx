"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

type Props = {
  main?: string;
  others?: string[];
};

export default function PhotoGallery({
  main = "/car1.jpg",
  others = ["/car2.jpg", "/car3.jpg", "/car4.jpg", "/car5.jpg"],
}: Props) {
  const [openGallery, setOpenGallery] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => [main, ...others], [main, others]);

  return (
    <div className="w-full max-w-3xl">
      <div className="flex justify-center">
        <button
          onClick={() => setOpenGallery(v => !v)}
          className="inline-flex items-center gap-2 bg-white/95 text-slate-900 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition"
        >
          <span className="text-sm font-semibold">
            {openGallery ? "▲ Ocultar fotos" : "▼ Ver fotos"}
          </span>
        </button>
      </div>

      {openGallery && (
        <div className="mt-4 bg-white/95 rounded shadow p-3 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {slides.map((src, i) => (
              <div
                key={i}
                className="h-24 relative rounded overflow-hidden cursor-pointer"
                onClick={() => {
                  setIndex(i);
                  setTimeout(() => setLightboxOpen(true), 80);
                }}
              >
                <Image
                  src={src}
                  alt={`Mini ${i+1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <Lightbox
        open={lightboxOpen}
        index={index}
        close={() => setLightboxOpen(false)}
        slides={slides.map(s => ({ src: s }))}
        plugins={[Fullscreen, Thumbnails]}
        render={{
          buttonClose: () => (
            <button
              aria-label="Cerrar"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 bg-black/60 text-white p-2 rounded-full"
            >
              ✕
            </button>
          ),
        }}
      />
    </div>
  );
}
