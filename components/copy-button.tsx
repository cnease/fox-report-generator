"use client";

type Props = {
  text: string;
};

export default function CopyButton({ text }: Props) {
  async function handleCopy() {
    try {
      const testValue = "HELLO TEST 123";
      await navigator.clipboard.writeText(testValue);
      alert(`Copied: ${testValue}`);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Copy failed");
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-red-600 px-3 py-1 text-sm font-bold text-white"
    >
      COPY TEST LIVE
    </button>
  );
}