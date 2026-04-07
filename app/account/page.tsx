"use client";

import { useState } from "react";
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
    <div className="min-h-screen bg-gray-50 px-4 pb-28 pt-4">
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Account</h1>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">
              Change Password
            </p>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            />

            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="mt-3 w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            {message && (
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}