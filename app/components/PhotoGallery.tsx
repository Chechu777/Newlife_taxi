// app/components/PageClient.tsx  (SECCIÓN PhotoGallery — REEMPLAZO COMPLETO)

function PhotoGallery({
  main = "/Taxi.jpg",
  others = ["/car1.jpg", "/car2.jpg", "/car3.jpg", "/car4.jpg"]
}: {
  main?: string;
  others?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // Lista completa de fotos
  const slides = [main, ...others];

  return (
    <div className="w-full">

      {/* FOTO PRINCIPAL — ÚNICA */}
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

      {/* BOTÓN "MÁS FOTOS" */}
      <div className="text-center">
        <button
          onClick={() => setOpen(o => !o)}
          className="text-sm px-3 py-2 rounded bg-slate-200 text-slate-900"
        >
          {open ? "Ocultar fotos" : "Más fotos"}
        </button>
      </div>

      {/* MINIATURAS — SOLO CUANDO OPEN = TRUE */}
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
              <Image
                src={src}
                alt={`thumb${i}`}
                fill
                className="object-cover"
                unoptimized
              />
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
