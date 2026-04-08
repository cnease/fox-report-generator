"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    const ios =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !standalone;

    setIsInstalled(standalone);
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setMessage("");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setMessage('On iPhone, tap Share, then "Add to Home Screen".');
      return;
    }

    if (!installPrompt) {
      setMessage(
        "Install is not available yet. Try refreshing in Chrome or using the browser menu."
      );
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setMessage("");
    } else {
      setMessage("Install was dismissed.");
    }
  };

  if (isInstalled) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleInstallClick}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Install App
      </button>

      {message ? (
        <p className="max-w-[220px] text-right text-xs text-gray-500">
          {message}
        </p>
      ) : null}
    </div>
  );
}