"use client";

export default function CopyButton() {
  return (
    <button
      className="rounded bg-red-600 px-3 py-1 text-sm font-bold text-white"
      onClick={() => alert("NEW COPY BUTTON IS LIVE")}
    >
      COPY TEST LIVE
    </button>
  );
}