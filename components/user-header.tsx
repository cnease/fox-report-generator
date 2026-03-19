"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  function linkClass(path: string, baseColor: string) {
    const isActive = pathname === path;
    return `rounded px-4 py-2 text-sm font-medium text-white ${
      isActive ? "bg-black" : baseColor
    }`;
  }

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
      <div className="mb-6 rounded-xl bg-gray-100 p-4 text-gray-900">
        <p className="text-sm text-gray-600">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl bg-gray-100 p-4 text-gray-900 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* USER INFO */}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Signed in as
          </p>
          <p className="text-base font-semibold text-gray-900">
            {profile?.full_name || profile?.email || "Unknown User"}
          </p>
          <p className="text-sm text-gray-600">
            Role:{" "}
            <span className="font-medium capitalize">
              {profile?.role || "unknown"}
            </span>
          </p>
        </div>

        {/* NAV BUTTONS */}
        <div className="flex flex-wrap gap-2">
          <Link href="/" className={linkClass("/", "bg-gray-800 hover:bg-gray-900")}>
            Home
          </Link>

          <Link
            href="/reports"
            className={linkClass("/reports", "bg-green-600 hover:bg-green-700")}
          >
            Reports
          </Link>

          {profile?.role === "admin" && (
            <>
              <Link
                href="/admin"
                className={linkClass("/admin", "bg-blue-600 hover:bg-blue-700")}
              >
                Admin
              </Link>

              <Link
                href="/admin/reports"
                className={linkClass(
                  "/admin/reports",
                  "bg-purple-600 hover:bg-purple-700"
                )}
              >
                All Reports
              </Link>
            </>
          )}

          <LogoutButton />
        </div>
      </div>
    </div>
  );
}