// app/components/PhotoGallery.tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Slider from "react-slick";
import { motion, AnimatePresence } from "framer-motion";
import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

type Props = {
  main?: string;
  others?: string[];
};

export default function PhotoGallery({
  main = "/car1.jpg",
  others = ["/car2.jpg", "/car3.jpg", "/car4.jpg", "/car5.jpg"],
}: Props) {
  // abrir/cerrar lista desplegable ▼
  const [openGallery, setOpenGallery] = useState(false);

  // abrir lightbox fullscreen
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // índice de imagen en lightbox
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => [main, ...others], [main, others]);

  // Slider premium
  const settings = useMemo(
    () => ({
      dots: true,
      infinite: true,
      speed: 450,
      slidesToShow: 1,
      slidesToScroll: 1,
      adaptiveHeight: true,
      arrows: true,
      swipeToSlide: true,
      lazyLoad: "ondemand" as const,
    }),
    []
  );

  return (
    <div className="w-full max-w-3xl">
      {/* BOTÓN desplegable */}
      <div className="flex justify-center">
        <button
          onClick={() => setOpenGallery((v) => !v)}
          className="inline-flex items-center gap-2 bg-white/95 text-slate-900 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition"
          aria-expanded={openGallery}
        >
          <span className="text-sm font-semibold">
            {openGallery ? "▲ Ocultar fotos" : "▼ Ver fotos"}
          </span>
        </button>
      </div>

      {/* GALERÍA ANIMADA */}
      <AnimatePresence initial={false}>
        {openGallery && (
          <motion.div
            key="gallery"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-4 bg-white/95 rounded shadow p-3 overflow-hidden"
          >
            {/* SLIDER grande */}
            <div className="mb-3">
              <Slider {...settings}>
                {slides.map((src, i) => (
                  <div key={i} className="h-64 md:h-96 relative">
                    <div
                      onClick={() => {
                        setIndex(i);
                        setLightboxOpen(true); // abre fullscreen
                      }}
                      className="w-full h-full cursor-pointer"
                    >
                      <Image
                        src={src}
                        alt={`Foto ${i + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    </div>
                  </div>
                ))}
              </Slider>
            </div>

            {/* MINIATURAS */}
            <div className="grid grid-cols-4 gap-2">
              {slides.map((src, i) => (
                <div
                  key={i}
                  className="h-20 relative rounded overflow-hidden cursor-pointer hover:opacity-80"
                  onClick={() => {
                    setIndex(i);
                    setLightboxOpen(true);
                  }}
                >
                  <Image
                    src={src}
                    alt={`Mini ${i + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX ULTRA-PREMIUM */}
      <Lightbox
        open={lightboxOpen}
        index={index}
        close={() => setLightboxOpen(false)}
        slides={slides.map((src) => ({ src }))}
        plugins={[Fullscreen, Thumbnails]}
      />
    </div>
  );
}
