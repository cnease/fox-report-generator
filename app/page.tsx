import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportGenerator from "@/components/report-generator";
import InstallAppButton from "@/components/install-app-button";
import BottomNav from "@/components/bottom-nav";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App Header */}
      <div className="safe-top sticky top-0 z-50 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src="/icons/icon-192.png"
            alt="Fox Reports"
            className="h-9 w-9 rounded-lg"
          />
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">
              Fox Reports
            </h1>
            <span className="text-xs text-gray-500">
              Pest Control Report Generator
            </span>
          </div>
        </div>

        <InstallAppButton />
      </div>

      {/* Main App */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-4 shadow-sm">
          <ReportGenerator />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}