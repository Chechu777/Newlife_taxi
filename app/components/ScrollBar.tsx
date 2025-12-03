"use client";

import { useEffect, useState } from "react";

export default function ScrollBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  let timeoutRef: NodeJS.Timeout | null = null;

  useEffect(() => {
    const handleScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;

      setProgress(pct);
      setVisible(true);

      // Ocultar después de 800 ms sin movimiento
      if (timeoutRef) clearTimeout(timeoutRef);
      timeoutRef = setTimeout(() => setVisible(false), 800);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef) clearTimeout(timeoutRef);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 h-1 bg-emerald-500 transition-opacity duration-300 z-[9999] ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ width: `${progress}%` }}
    />
  );
}
