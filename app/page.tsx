"use client";

import { FormEvent, useState } from "react";
import UserHeader from "@/components/user-header";
import { createClient } from "@/lib/supabase/client";
import CopyButton from "@/components/copy-button";

function cleanGeneratedText(value: string) {
  try {
    let cleaned = value.trim();

    if (cleaned.toLowerCase().startsWith("mailto:")) {
      const bodyMatch = cleaned.match(/[?&]body=([^&]*)/i);
      if (bodyMatch?.[1]) {
        cleaned = bodyMatch[1];
      }
    }

    while (/%[0-9A-Fa-f]{2}/.test(cleaned)) {
      const decoded = decodeURIComponent(cleaned);
      if (decoded === cleaned) break;
      cleaned = decoded;
    }

    return cleaned;
  } catch {
    return value;
  }
}

export default function Home() {
  const [customerName, setCustomerName] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [pestType, setPestType] = useState("");
  const [findings, setFindings] = useState("");
  const [treatment, setTreatment] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          serviceAddress,
          pestType,
          findings,
          treatment,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned HTML instead of JSON.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const cleanOutput = cleanGeneratedText(data.output);
      setOutput(cleanOutput);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await fetch("/api/save-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            customerName,
            serviceAddress,
            pestType,
            findings,
            treatment,
            generatedEmail: cleanOutput,
          }),
        });
      }
    } catch (error) {
      console.error(error);
      setOutput(
        error instanceof Error
          ? error.message
          : "There was an error generating the email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-gray-900 shadow">
        <UserHeader />

        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Fox Pest Control Report Generator
        </h1>
        <p className="mb-6 text-gray-700">
          Enter inspection details and generate a standardized customer email.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <input
            className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Service Address"
            value={serviceAddress}
            onChange={(e) => setServiceAddress(e.target.value)}
          />

          <input
            className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Pest Type"
            value={pestType}
            onChange={(e) => setPestType(e.target.value)}
          />

          <textarea
            className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Inspection Findings"
            rows={4}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
          />

          <textarea
            className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Treatment Performed"
            rows={4}
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-green-600 p-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Email"}
          </button>
        </form>

        {output && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Email
              </h2>
              <CopyButton text={output} />
            </div>

            <textarea
              readOnly
              value={output}
              className="min-h-[250px] w-full rounded-lg bg-gray-100 p-4 text-sm text-gray-900"
            />
          </div>
        )}
      </div>
    </main>
  );
}