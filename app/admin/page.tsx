"use client";

import { useEffect, useState } from "react";

type Technician = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  must_change_password: boolean | null;
  created_at: string | null;
};

export default function AdminPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Fox12345!");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(true);

  async function loadTechnicians() {
    try {
      setLoadingTechs(true);

      const res = await fetch("/api/admin/list-technicians");
      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response from list-technicians:", text);
        throw new Error("Server returned HTML instead of JSON.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load technicians.");
      }

      setTechnicians(data.technicians || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load technicians."
      );
    } finally {
      setLoadingTechs(false);
    }
  }

  useEffect(() => {
    loadTechnicians();
  }, []);

  async function handleCreateTechnician(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/create-technician", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response from create-technician:", text);
        throw new Error("Server returned HTML instead of JSON.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create technician.");
      }

      setMessage("Technician created successfully.");
      setFullName("");
      setEmail("");
      setPassword("Fox12345!");
      loadTechnicians();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-2xl bg-white p-8 text-gray-900 shadow">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mb-6 text-gray-700">
            Create technician accounts and manage access.
          </p>

          <form onSubmit={handleCreateTechnician} className="grid gap-4">
            <input
              className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
              type="text"
              placeholder="Starter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black p-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Technician"}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded bg-gray-100 p-3 text-sm text-gray-900">
              {message}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-8 text-gray-900 shadow">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Technicians</h2>

          {loadingTechs ? (
            <p className="text-gray-900">Loading technicians...</p>
          ) : technicians.length === 0 ? (
            <p className="text-gray-900">No technicians found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-gray-900">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Must Change Password</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((tech) => (
                    <tr key={tech.id} className="border-b">
                      <td className="p-3">{tech.full_name || "-"}</td>
                      <td className="p-3">{tech.email}</td>
                      <td className="p-3">{tech.role || "-"}</td>
                      <td className="p-3">
                        {tech.must_change_password ? "Yes" : "No"}
                      </td>
                      <td className="p-3">
                        {tech.created_at
                          ? new Date(tech.created_at).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}