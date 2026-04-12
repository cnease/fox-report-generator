"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import UserHeader from "@/components/user-header";
import BottomNav from "@/components/bottom-nav";
import CopyButton from "@/components/copy-button";

type VisualFinding = {
  finding: string;
  category: string;
  clearly_visible: boolean;
};

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
  notes: string | null;
  generated_email: string | null;
  image_urls: string[] | null;
  visual_findings_json: VisualFinding[] | null;
  created_at: string;
};

type DateFilter = "all" | "today" | "7d" | "30d" | "custom";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [pestFilter, setPestFilter] = useState("");
  const [photoFilter, setPhotoFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDate, setCustomDate] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

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

  const technicianOptions = useMemo(() => {
    const names = reports
      .map((report) => report.technician_name || report.technician_email || "")
      .filter(Boolean);

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [reports]);

  const pestOptions = useMemo(() => {
    const pests = reports
      .map((report) => (report.pest_type || "").trim())
      .filter(Boolean);

    return [...new Set(pests)].sort((a, b) => a.localeCompare(b));
  }, [reports]);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();

    return reports.filter((report) => {
      const matchesSearch =
        !term ||
        report.customer_name.toLowerCase().includes(term) ||
        report.service_address.toLowerCase().includes(term) ||
        (report.pest_type || "").toLowerCase().includes(term) ||
        (report.technician_name || "").toLowerCase().includes(term) ||
        (report.technician_email || "").toLowerCase().includes(term) ||
        (report.notes || "").toLowerCase().includes(term) ||
        (report.findings || "").toLowerCase().includes(term);

      const technicianNameOrEmail =
        report.technician_name || report.technician_email || "";

      const matchesTechnician =
        !technicianFilter || technicianNameOrEmail === technicianFilter;

      const matchesPest = !pestFilter || (report.pest_type || "") === pestFilter;

      const hasPhotos = (report.image_urls?.length ?? 0) > 0;
      const matchesPhotoFilter =
        photoFilter === "all" ||
        (photoFilter === "with" && hasPhotos) ||
        (photoFilter === "without" && !hasPhotos);

      const reportDateObj = new Date(report.created_at);
      const reportDate = reportDateObj.toISOString().slice(0, 10);

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = reportDateObj.toDateString() === now.toDateString();
      } else if (dateFilter === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = reportDateObj >= sevenDaysAgo;
      } else if (dateFilter === "30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        matchesDate = reportDateObj >= thirtyDaysAgo;
      } else if (dateFilter === "custom") {
        matchesDate = !customDate || reportDate === customDate;
      }

      return (
        matchesSearch &&
        matchesTechnician &&
        matchesPest &&
        matchesPhotoFilter &&
        matchesDate
      );
    });
  }, [
    reports,
    search,
    technicianFilter,
    pestFilter,
    photoFilter,
    dateFilter,
    customDate,
  ]);

  const stats = useMemo(() => {
    const now = new Date();

    const totalReports = reports.length;

    const reportsToday = reports.filter((report) => {
      return new Date(report.created_at).toDateString() === now.toDateString();
    }).length;

    const reportsWithPhotos = reports.filter(
      (report) => (report.image_urls?.length ?? 0) > 0
    ).length;

    const reportsWithAIFindings = reports.filter(
      (report) => (report.visual_findings_json?.length ?? 0) > 0
    ).length;

    return {
      totalReports,
      reportsToday,
      reportsWithPhotos,
      reportsWithAIFindings,
    };
  }, [reports]);

  function resetFilters() {
    setSearch("");
    setTechnicianFilter("");
    setPestFilter("");
    setPhotoFilter("all");
    setDateFilter("all");
    setCustomDate("");
  }

  function escapeCsv(value: unknown) {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  function exportFilteredReportsToCsv() {
    if (filteredReports.length === 0) {
      setMessage("No reports to export.");
      return;
    }

    const headers = [
      "Created At",
      "Customer Name",
      "Service Address",
      "Technician Name",
      "Technician Email",
      "Pest Type",
      "Findings",
      "Treatment",
      "Notes",
      "Generated Email",
      "Photo Count",
      "Photo URLs",
      "AI Finding Count",
      "AI Findings",
      "User ID",
      "Report ID",
    ];

    const rows = filteredReports.map((report) => {
      const photoUrls = (report.image_urls || []).join(" | ");
      const aiFindings = (report.visual_findings_json || [])
        .map((item) => item.finding)
        .join(" | ");

      return [
        report.created_at,
        report.customer_name,
        report.service_address,
        report.technician_name || "",
        report.technician_email || "",
        report.pest_type || "",
        report.findings || "",
        report.treatment || "",
        report.notes || "",
        report.generated_email || "",
        report.image_urls?.length ?? 0,
        photoUrls,
        report.visual_findings_json?.length ?? 0,
        aiFindings,
        report.user_id,
        report.id,
      ];
    });

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    link.href = url;
    link.setAttribute("download", `admin-reports-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage(`Exported ${filteredReports.length} report(s) to CSV.`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="safe-top sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <UserHeader />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 pb-32 pt-4 sm:px-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  All Technician Reports
                </h1>
                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  Admin dashboard for reviewing all Fox Pest Control reports.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={exportFilteredReportsToCsv}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Export CSV
                </button>

                <Link
                  href="/admin"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back to Admin
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Reports</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.totalReports}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Reports Today</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.reportsToday}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">With Photos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.reportsWithPhotos}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">With AI Findings</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.reportsWithAIFindings}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Search
                </label>
                <input
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-black"
                  type="text"
                  placeholder="Customer, address, pest, technician, notes, findings"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Technician
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-black"
                  value={technicianFilter}
                  onChange={(e) => setTechnicianFilter(e.target.value)}
                >
                  <option value="">All Technicians</option>
                  {technicianOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Pest Type
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-black"
                  value={pestFilter}
                  onChange={(e) => setPestFilter(e.target.value)}
                >
                  <option value="">All Pest Types</option>
                  {pestOptions.map((pest) => (
                    <option key={pest} value={pest}>
                      {pest}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Photos
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-black"
                  value={photoFilter}
                  onChange={(e) => setPhotoFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="with">With Photos</option>
                  <option value="without">Without Photos</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date Range
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-black"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="custom">Specific Date</option>
                </select>
              </div>

              {dateFilter === "custom" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Date
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-black"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset Filters
              </button>

              <p className="text-sm text-gray-500">
                {loading
                  ? "Loading reports..."
                  : `${filteredReports.length} of ${reports.length} reports shown`}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
            {message && (
              <div className="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {message}
              </div>
            )}

            {loading ? (
              <div className="p-6 text-gray-900">Loading all reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="p-6 text-gray-900">No matching reports found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm text-gray-900">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Address</th>
                      <th className="px-4 py-3 font-semibold">Technician</th>
                      <th className="px-4 py-3 font-semibold">Pest Type</th>
                      <th className="px-4 py-3 font-semibold">Photos</th>
                      <th className="px-4 py-3 font-semibold">AI Findings</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReports.map((report) => {
                      const photoCount = report.image_urls?.length ?? 0;
                      const aiFindingCount =
                        report.visual_findings_json?.length ?? 0;

                      return (
                        <tr
                          key={report.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(report.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {report.customer_name}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate">
                            {report.service_address}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {report.technician_name || "Unknown Technician"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {report.technician_email || report.user_id}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {report.pest_type || "-"}
                          </td>
                          <td className="px-4 py-3">{photoCount}</td>
                          <td className="px-4 py-3">{aiFindingCount}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setSelectedReport(report)}
                              className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      <BottomNav />

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 border-b bg-white px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedReport.customer_name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedReport.service_address}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-6 px-5 py-5 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Technician</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedReport.technician_name || "Unknown Technician"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedReport.technician_email || selectedReport.user_id}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Pest Type</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedReport.pest_type || "-"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    Findings
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedReport.findings || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    Treatment
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedReport.treatment || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    Notes
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedReport.notes || "-"}
                  </p>
                </div>
              </div>

              {(selectedReport.visual_findings_json?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">
                    AI-Detected Visual Findings
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {selectedReport.visual_findings_json?.map((item, index) => (
                      <li key={`${item.finding}-${index}`}>
                        • {item.finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(selectedReport.image_urls?.length ?? 0) > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">
                    Uploaded Photos
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedReport.image_urls?.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                      >
                        <img
                          src={url}
                          alt={`Report photo ${index + 1}`}
                          className="h-32 w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">
                    Generated Email
                  </h3>
                  <CopyButton text={selectedReport.generated_email || ""} />
                </div>

                <pre className="whitespace-pre-wrap rounded-xl border bg-gray-50 p-4 text-sm text-gray-900">
                  {selectedReport.generated_email || "-"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}