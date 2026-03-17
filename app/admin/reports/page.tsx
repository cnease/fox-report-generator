"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import UserHeader from "@/components/user-header";

type Report = {
  id: string;
  user_id: string;
  technician_name: string | null;
  technician_email: string | null;
  customer_name: string;
  service_address: string;
  pest_type: string | null;
  findings: string | null;
  treatment: string | null;
  generated_email: string | null;
  created_at: string;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadAllReports() {
      try {
        const res = await fetch("/api/admin/all-reports");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load reports.");
        }

        setReports(data.reports || []);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to load reports."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAllReports();
  }, []);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return reports;

    return reports.filter((report) => {
      return (
        report.customer_name.toLowerCase().includes(term) ||
        report.service_address.toLowerCase().includes(term) ||
        (report.pest_type || "").toLowerCase().includes(term) ||
        (report.technician_name || "").toLowerCase().includes(term) ||
        (report.technician_email || "").toLowerCase().includes(term)
      );
    });
  }, [reports, search]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
        <UserHeader />

        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">All Technician Reports</h1>
            <p className="text-gray-600">
              Admin view of all saved Fox Pest Control reports.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Back to Admin
          </Link>
        </div>

        <div className="mb-6">
          <input
            className="w-full rounded-lg border p-3"
            type="text"
            placeholder="Search by customer, address, pest type, technician name, or technician email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p>Loading all reports...</p>}

        {message && (
          <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        )}

        {!loading && !message && filteredReports.length === 0 && (
          <p className="rounded bg-gray-100 p-4 text-sm">
            No matching reports found.
          </p>
        )}

        <div className="space-y-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-5"
            >
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {report.customer_name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {report.service_address}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Technician: {report.technician_name || "Unknown Technician"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {report.technician_email || report.user_id}
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
                <h3 className="mb-2 font-semibold">Generated Email</h3>
                <pre className="whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm">
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