"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  function getCleanText(value: string) {
    try {
      if (value.includes("%20") || value.includes("%0A") || value.includes("%2")) {
        return decodeURIComponent(value);
      }
      return value;
    } catch {
      return value;
    }
  }

  async function handleCopy() {
    try {
      const cleanText = getCleanText(text);
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-900"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}