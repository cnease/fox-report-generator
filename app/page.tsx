import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportGenerator from "@/components/report-generator";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ReportGenerator />;
}