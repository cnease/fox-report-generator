import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/bottom-nav";
import UserHeader from "@/components/user-header";

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
      <header className="safe-top sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6">
          <UserHeader />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 pb-32 pt-4 sm:px-6">
        <ReportGenerator />
      </main>

      <BottomNav />
    </div>
  );
}