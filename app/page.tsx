import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import InstallAppButton from "@/components/install-app-button";
import BottomNav from "@/components/bottom-nav";

const ReportGenerator = dynamic(
  () => import("@/components/report-generator"),
  {
    loading: () => (
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded-xl bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-12 rounded-xl bg-gray-200" />
          <div className="h-12 rounded-xl bg-gray-200" />
          <div className="h-12 rounded-xl bg-gray-200" />
          <div className="h-28 rounded-xl bg-gray-200" />
          <div className="h-28 rounded-xl bg-gray-200" />
          <div className="h-28 rounded-xl bg-gray-200" />
          <div className="h-12 rounded-xl bg-gray-200" />
        </div>
      </div>
    ),
  }
);

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

      {/* Main App */}
      <main className="flex-1 overflow-y-auto px-3 pb-32 pt-4 sm:px-6">
        <ReportGenerator />
      </main>

      <BottomNav />
    </div>
  );
}