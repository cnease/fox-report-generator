"use client";

import CopyButton from "@/components/copy-button";
import { useEffect, useMemo, useState } from "react";
import UserHeader from "@/components/user-header";
import { createClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  customer_name: string;
  service_address: string;
  pest_type: string | null;
  findings: string | null;
  treatment: string | null;
  generated_email: string | null;
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
            "id, customer_name, service_address, pest_type, findings, treatment, generated_email, created_at"
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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 text-gray-900 shadow">
        <UserHeader />

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Saved Reports</h1>
        <p className="mb-4 text-gray-700">
          View previously generated Fox Pest Control service reports.
        </p>

        <div className="mb-6">
          <input
            className="w-full rounded-lg border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            type="text"
            placeholder="Search by customer, address, or pest type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="text-gray-900">Loading reports...</p>}

        {message && (
          <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        )}

        {!loading && !message && filteredReports.length === 0 && (
          <p className="rounded bg-gray-100 p-4 text-sm text-gray-900">
            No matching reports found.
          </p>
        )}

        <div className="space-y-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-900"
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
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Generated Email</h3>
                  <CopyButton text={report.generated_email || ""} />
                </div>

                <pre className="whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm text-gray-900">
                  {report.generated_email || "-"}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}