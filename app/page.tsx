"use client";

import { FormEvent, useState } from "react";
import UserHeader from "@/components/user-header";
import { createClient } from "@/lib/supabase/client";
import CopyButton from "@/components/copy-button";

type UploadedImage = {
  name: string;
  type: string;
  publicUrl: string;
};

export default function Home() {
  const [customerName, setCustomerName] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [pestType, setPestType] = useState("");
  const [findings, setFindings] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3);

    if (files.length === 0) {
      setImages([]);
      return;
    }

    try {
      const supabase = createClient();
      const uploaded: UploadedImage[] = [];

      for (const file of files) {
        const filePath = `reports/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("report-images")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data } = supabase.storage
          .from("report-images")
          .getPublicUrl(filePath);

        uploaded.push({
          name: file.name,
          type: file.type,
          publicUrl: data.publicUrl,
        });
      }

      setImages(uploaded);
    } catch (error) {
      console.error("Image upload error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "There was a problem uploading one or more images."
      );
    }
  }

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
          notes,
          images,
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

      setOutput(data.output);

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
            notes,
            generatedEmail: data.output,
            imageUrls: images.map((image) => image.publicUrl),
          }),
        });
      }
    } catch (error) {
      console.error(error);
      setOutput(
        error instanceof Error
          ? error.message
          : "There was an error generating the summary."
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
          Enter inspection details, notes, and photos to generate a standardized customer summary.
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

          <textarea
            className="rounded border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Technician Notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="rounded border bg-white p-3">
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Upload Photos (up to 3)
            </label>
            <input
              className="block w-full text-sm text-gray-900"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            {images.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {images.length} image(s) uploaded
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-green-600 p-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
        </form>

        {output && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Summary
              </h2>
              <CopyButton text={output} />
            </div>

            <pre className="whitespace-pre-wrap rounded-lg bg-gray-100 p-4 text-sm text-gray-900">
              {output}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}