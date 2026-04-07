"use client";

import CopyButton from "@/components/copy-button";
import { useEffect, useMemo, useState } from "react";
import InstallAppButton from "@/components/install-app-button";
import BottomNav from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase/client";

type VisualFinding = {
  finding: string;
  category: string;
  clearly_visible: boolean;
};

type Report = {
  id: string;
  customer_name: string;
  service_address: string;
  pest_type: string | null;
  findings: string | null;
  treatment: string | null;
  notes: string | null;
  generated_email: string | null;
  image_urls: string[] | null;
  visual_findings_json: VisualFinding[] | null;
  created_at: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("reports")
          .select(
            "id, customer_name, service_address, pest_type, findings, treatment, notes, generated_email, image_urls, visual_findings_json, created_at"
          )
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        setReports(data || []);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to load reports."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return reports;

    return reports.filter((report) => {
      return (
        report.customer_name.toLowerCase().includes(term) ||
        report.service_address.toLowerCase().includes(term) ||
        (report.pest_type || "").toLowerCase().includes(term)
      );
    });
  }, [reports, search]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

      <main className="flex-1 overflow-y-auto px-3 pb-32 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm sm:p-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Saved Reports
          </h1>
          <p className="mb-4 text-sm text-gray-700 sm:text-base">
            View previously generated Fox Pest Control service reports.
          </p>

          <div className="mb-6">
            <input
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-black sm:text-base"
              type="text"
              placeholder="Search by customer, address, or pest type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading && <p className="text-gray-900">Loading reports...</p>}

          {message && (
            <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {message}
            </p>
          )}

          {!loading && !message && filteredReports.length === 0 && (
            <p className="rounded-xl bg-gray-100 p-4 text-sm text-gray-900">
              No matching reports found.
            </p>
          )}

          <div className="space-y-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-gray-900"
              >
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {report.customer_name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {report.service_address}
                    </p>
                  </div>

                  <p className="text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="mb-4 grid gap-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Pest Type:</span>{" "}
                    {report.pest_type || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Findings:</span>{" "}
                    {report.findings || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Treatment:</span>{" "}
                    {report.treatment || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Notes:</span>{" "}
                    {report.notes || "-"}
                  </p>
                </div>

                {report.visual_findings_json &&
                  report.visual_findings_json.length > 0 && (
                    <div className="mb-4 rounded-xl bg-blue-50 p-4">
                      <h3 className="mb-2 font-semibold text-gray-900">
                        AI-Detected Visual Findings
                      </h3>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {report.visual_findings_json.map((item, index) => (
                          <li key={`${item.finding}-${index}`}>
                            • {item.finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {report.image_urls && report.image_urls.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-2 font-semibold text-gray-900">
                      Uploaded Photos
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {report.image_urls.map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-xl border bg-white"
                        >
                          <img
                            src={url}
                            alt={`Report photo ${index + 1}`}
                            className="h-28 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">
                      Generated Email
                    </h3>
                    <CopyButton text={report.generated_email || ""} />
                  </div>

                  <pre className="whitespace-pre-wrap rounded-xl border bg-white p-4 text-sm text-gray-900">
                    {report.generated_email || "-"}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}