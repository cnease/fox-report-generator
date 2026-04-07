"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import InstallAppButton from "@/components/install-app-button";
import BottomNav from "@/components/bottom-nav";
import FontSizeControl from "@/components/font-size-control";

export default function AccountPage() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChangePassword = async () => {
    if (!password) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully!");
      setPassword("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="safe-top sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Fox Reports"
              className="h-10 w-10 rounded-xl"
            />
            <div className="flex flex-col">
              <h1 className="text-base font-semibold">Fox Reports</h1>
              <span className="text-xs text-gray-500">
                Account Settings
              </span>
            </div>
          </div>

          <InstallAppButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 pb-32 pt-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Font Size */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Text Size</p>

            <div className="mt-3">
              <FontSizeControl />
            </div>
          </div>

          {/* Change Password */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-700">
              Change Password
            </p>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
            />

            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="mt-3 w-full rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            {message && (
              <p className="mt-3 text-sm text-gray-600">{message}</p>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}