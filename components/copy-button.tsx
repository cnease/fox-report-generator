"use client";

import { useState } from "react";

type Props = {
  text: string;
};

function cleanCopiedText(value: string) {
  try {
    let cleaned = value;

    if (cleaned.startsWith("mailto:")) {
      const bodyMatch = cleaned.match(/[?&]body=([^&]*)/i);
      if (bodyMatch?.[1]) {
        cleaned = bodyMatch[1];
      }
    }

    return decodeURIComponent(cleaned);
  } catch {
    return value;
  }
}

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const cleanText = cleanCopiedText(text);
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