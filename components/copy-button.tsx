"use client";

import { useState } from "react";

type Props = {
  text: string;
};

function cleanCopiedText(value: string) {
  try {
    let cleaned = value.trim();

    if (cleaned.toLowerCase().startsWith("mailto:")) {
      const bodyMatch = cleaned.match(/[?&]body=([^&]*)/i);
      if (bodyMatch?.[1]) {
        cleaned = bodyMatch[1];
      }
    }

    while (/%[0-9A-Fa-f]{2}/.test(cleaned)) {
      const decoded = decodeURIComponent(cleaned);
      if (decoded === cleaned) break;
      cleaned = decoded;
    }

    return cleaned;
  } catch {
    return value;
  }
}

function copyWithTextareaFallback(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  textArea.style.left = "-9999px";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);

  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  const successful = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!successful) {
    throw new Error("Fallback copy failed.");
  }
}

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const cleanText = cleanCopiedText(text);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanText);
      } else {
        copyWithTextareaFallback(cleanText);
      }
    } catch {
      try {
        copyWithTextareaFallback(cleanText);
      } catch (error) {
        console.error("Copy failed:", error);
        return;
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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