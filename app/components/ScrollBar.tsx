"use client";

import { useEffect, useState } from "react";

/**
 * ScrollBar.tsx
 * Barra lateral premium, visible en móviles, draggable.
 */

export default function ScrollBar() {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(1);
  const [clientHeight, setClientHeight] = useState(1);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function update() {
      setScrollTop(window.scrollY || window.pageYOffset);
      setScrollHeight(document.documentElement.scrollHeight || document.body.scrollHeight);
      setClientHeight(window.innerHeight);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // barra visible proporcional
  const visibleHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 48); // mínimo 48px
  const maxTop = clientHeight - visibleHeight;
  const trackScrollable = scrollHeight - clientHeight;
  const topPos = trackScrollable > 0 ? Math.min((scrollTop / trackScrollable) * maxTop, maxTop) : 0;

  // START / STOP dragging
  function startDrag(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function stopDrag() {
    setDragging(false);
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragging) return;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    // calcular porcentaje relativo al viewport
    const containerTop = 0; // está pegado a top del viewport
    const relative = clientY - containerTop - visibleHeight / 2;
    const pct = Math.max(0, Math.min(relative / maxTop, 1));
    const newScroll = pct * (scrollHeight - clientHeight);
    window.scrollTo({ top: newScroll, behavior: "auto" });
  }

  return (
    <div
      aria-hidden
       className="fixed right-2 top-0 bottom-0 z-[9999] hidden md:block"
      //className="fixed right-2 top-0 bottom-0 z-[9999] block"

      style={{ width: 28, pointerEvents: "auto", touchAction: "none" }}
      onMouseMove={onMove as any}
      onTouchMove={onMove as any}
      onMouseUp={stopDrag}
      onTouchEnd={stopDrag}
    >
      {/* Track (sutil, glass) */}
      <div
        style={{ right: 6 }}
        className="absolute top-4 bottom-4 right-0 w-2 rounded-full bg-white/6 backdrop-blur-sm"
      />

      {/* Thumb */}
      <div
        onMouseDown={startDrag as any}
        onTouchStart={startDrag as any}
        style={{
          top: `${topPos}px`,
          height: `${visibleHeight}px`,
          transition: dragging ? "none" : "top .12s ease",
        }}
        className="absolute right-0 w-3 rounded-full bg-emerald-400/65 shadow-lg border border-white/10"
      >
        {/* subtle handle visual */}
        <div className="h-full w-full rounded-full flex items-center justify-center">
          <div className="w-1.5 h-7 rounded-full bg-white/18" />
        </div>
      </div>
    </div>
  );
}
