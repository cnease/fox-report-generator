"use client";

import { useEffect, useState } from "react";

export default function FontSizeControl() {
  const [size, setSize] = useState(16);

  useEffect(() => {
    const saved = localStorage.getItem("app-font-size");
    if (saved) {
      const parsed = Number(saved);
      setSize(parsed);
      document.documentElement.style.setProperty(
        "--app-font-size",
        `${parsed}px`
      );
    }
  }, []);

  const updateSize = (value: number) => {
    const newSize = Math.min(20, Math.max(14, value));
    setSize(newSize);

    document.documentElement.style.setProperty(
      "--app-font-size",
      `${newSize}px`
    );

    localStorage.setItem("app-font-size", newSize.toString());
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => updateSize(size - 1)}
        className="rounded-lg border px-3 py-1 text-sm"
      >
        A-
      </button>

      <span className="text-xs text-gray-500">{size}px</span>

      <button
        onClick={() => updateSize(size + 1)}
        className="rounded-lg border px-3 py-1 text-sm"
      >
        A+
      </button>
    </div>
  );
}