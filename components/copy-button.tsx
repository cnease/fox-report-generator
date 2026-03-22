"use client";

export default function CopyButton() {
  async function handleCopy() {
    await navigator.clipboard.writeText("HELLO TEST 123");
    alert("Copied!");
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-red-600 px-3 py-1 text-sm text-white"
    >
      Copy Test
    </button>
  );
}