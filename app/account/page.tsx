"use client";

import { useState } from "react";
import InstallAppButton from "@/components/install-app-button";
import BottomNav from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/client";

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
      {/* App Header */}
      <header className="safe-top sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Fox Reports"
              className="h-10 w-10 rounded-xl sm:h-11 sm:w-11"
            />
            <div className="flex flex-col">
              <h1 className="text-[clamp(1rem,2.4vw,1.2rem)] font-semibold leading-tight">
                Fox Reports
              </h1>
              <span className="text-[clamp(0.72rem,1.8vw,0.82rem)] text-gray-500">
                Pest Control Report Generator
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <InstallAppButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-3 pb-32 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Account</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your account settings below.
          </p>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">Change Password</p>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
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

      <BottomNav />
    </div>
  );
}