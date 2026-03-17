"use client";

import { useState } from "react";

export default function AdminPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Fox12345!");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create technician.");
      }

      setMessage("Technician created successfully.");
      setFullName("");
      setEmail("");
      setPassword("Fox12345!");
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
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-3xl font-bold">Admin - Add Technician</h1>
        <p className="mb-6 text-gray-600">
          Create technician accounts with a starter password.
        </p>

        <form onSubmit={handleCreateTechnician} className="grid gap-4">
          <input
            className="rounded border p-3"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <input
            className="rounded border p-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="rounded border p-3"
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
          <p className="mt-4 rounded bg-gray-100 p-3 text-sm">{message}</p>
        )}
      </div>
    </main>
  );
}