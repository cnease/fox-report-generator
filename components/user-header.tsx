"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/logout-button";

type Profile = {
  email: string;
  full_name: string | null;
  role: string | null;
};

export default function UserHeader() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("email, full_name, role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Profile load error:", error.message);
          setLoading(false);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error("Unexpected profile error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="mb-4 flex items-center justify-between gap-4 rounded-xl bg-gray-100 p-4">
        <p className="text-sm text-gray-500">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl bg-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-gray-500">Signed in as</p>
        <p className="font-semibold">
          {profile?.full_name || profile?.email || "Unknown User"}
        </p>
        <p className="text-sm text-gray-600">
          Role: {profile?.role || "unknown"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
  {/* ✅ Home Button */}
  <Link
    href="/"
    className="rounded bg-gray-800 px-4 py-2 text-white"
  >
    Home
  </Link>

  {/* Reports */}
  <Link
    href="/reports"
    className="rounded bg-green-600 px-4 py-2 text-white"
  >
    View Reports
  </Link>

  {/* Admin buttons */}
  {profile?.role === "admin" && (
    <>
      <Link
        href="/admin"
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Admin Dashboard
      </Link>

      <Link
        href="/admin/reports"
        className="rounded bg-purple-600 px-4 py-2 text-white"
      >
        All Reports
      </Link>
    </>
  )}

  {/* Logout */}
  <LogoutButton />
</div>
    </div>
  );
}