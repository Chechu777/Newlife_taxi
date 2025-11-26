"use client";

export default function FloatingScroll() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  return (
    <div className="fixed right-4 bottom-8 z-50 flex flex-col gap-3">
      <button
        onClick={scrollToTop}
        className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center touch-manipulation"
        aria-label="Subir"
      >
        ▲
      </button>

      <button
        onClick={scrollToBottom}
        className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center touch-manipulation"
        aria-label="Bajar"
      >
        ▼
      </button>
    </div>
  );
}
