"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
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