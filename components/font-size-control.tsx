"use client";

import { useEffect, useState } from "react";

const OPTIONS = [
  { label: "Small", value: 14 },
  { label: "Default", value: 16 },
  { label: "Large", value: 20 },
  { label: "Extra Large", value: 26 },
];

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
    setSize(value);

    document.documentElement.style.setProperty(
      "--app-font-size",
      `${value}px`
    );

    localStorage.setItem("app-font-size", value.toString());
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((option) => {
          const isActive = size === option.value;

          return (
            <button
              key={option.value}
              onClick={() => updateSize(option.value)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-500">
        Current: {size}px
      </p>
    </div>
  );
}