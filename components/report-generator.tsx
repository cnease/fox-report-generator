"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CopyButton from "@/components/copy-button";

type UploadedImage = {
  name: string;
  type: string;
  publicUrl: string;
  path: string;
};

type FinalReport = {
  subject: string;
  greeting: string;
  whatISaw: string;
  whatIDid: string;
  whatToExpect: string;
  whatIRecommend: string;
  closing: string;
};

type ReportDraft = {
  customerName: string;
  serviceAddress: string;
  pestType: string;
  findings: string;
  treatment: string;
  notes: string;
};

const DRAFT_STORAGE_KEY = "fox-report-generator-draft";

export default function ReportGenerator() {
  const supabase = useMemo(() => createClient(), []);

  const [customerName, setCustomerName] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [pestType, setPestType] = useState("");
  const [findings, setFindings] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");

  const addPhotosInputRef = useRef<HTMLInputElement | null>(null);
  const replacePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!savedDraft) return;

      const parsed: ReportDraft = JSON.parse(savedDraft);

      setCustomerName(parsed.customerName || "");
      setServiceAddress(parsed.serviceAddress || "");
      setPestType(parsed.pestType || "");
      setFindings(parsed.findings || "");
      setTreatment(parsed.treatment || "");
      setNotes(parsed.notes || "");
      setDraftStatus("Draft restored");
    } catch (error) {
      console.error("Failed to restore draft:", error);
    }
  }, []);

  useEffect(() => {
    const draft: ReportDraft = {
      customerName,
      serviceAddress,
      pestType,
      findings,
      treatment,
      notes,
    };

    const hasContent = Object.values(draft).some(
      (value) => value.trim().length > 0
    );

    if (!hasContent) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraftStatus("");
      return;
    }

    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setDraftStatus("Draft saved");
      } catch (error) {
        console.error("Failed to save draft:", error);
        setDraftStatus("Draft save failed");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [customerName, serviceAddress, pestType, findings, treatment, notes]);

  function handleClearDraft() {
    const confirmClear = confirm("Clear saved draft and form fields?");
    if (!confirmClear) return;

    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setCustomerName("");
    setServiceAddress("");
    setPestType("");
    setFindings("");
    setTreatment("");
    setNotes("");
    setImages([]);
    setReport(null);
    setOutput("");
    setDraftStatus("Draft cleared");
  }

  function handleReset() {
    const confirmReset = confirm("Clear all inputs and uploaded photos?");
    if (!confirmReset) return;

    setCustomerName("");
    setServiceAddress("");
    setPestType("");
    setFindings("");
    setTreatment("");
    setNotes("");
    setImages([]);
    setReport(null);
    setOutput("");
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraftStatus("");
  }

  async function uploadFile(file: File): Promise<UploadedImage> {
    const filePath = `reports/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("report-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("report-images").getPublicUrl(filePath);

    return {
      name: file.name,
      type: file.type,
      publicUrl: data.publicUrl,
      path: filePath,
    };
  }

  async function deleteImageFromStorage(path: string) {
    try {
      await supabase.storage.from("report-images").remove([path]);
    } catch (error) {
      console.error("Image delete error:", error);
    }
  }

  async function handleAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 3 - images.length;

    if (remainingSlots <= 0) {
      alert("You can upload up to 3 images.");
      e.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    try {
      const uploaded = await Promise.all(filesToUpload.map(uploadFile));
      setImages((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error("Image upload error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "There was a problem uploading one or more images."
      );
    } finally {
      e.target.value = "";
    }
  }

  async function handleRemoveImage(index: number) {
    const imageToRemove = images[index];
    if (!imageToRemove) return;

    const confirmRemove = confirm(`Remove photo "${imageToRemove.name}"?`);
    if (!confirmRemove) return;

    await deleteImageFromStorage(imageToRemove.path);
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleStartReplace(index: number) {
    setReplaceIndex(index);
    replacePhotoInputRef.current?.click();
  }

  async function handleReplaceImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || replaceIndex === null) {
      e.target.value = "";
      return;
    }

    const oldImage = images[replaceIndex];
    if (!oldImage) {
      e.target.value = "";
      setReplaceIndex(null);
      return;
    }

    try {
      const newImage = await uploadFile(file);
      await deleteImageFromStorage(oldImage.path);

      setImages((prev) =>
        prev.map((img, i) => (i === replaceIndex ? newImage : img))
      );
    } catch (error) {
      console.error("Image replace error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "There was a problem replacing the image."
      );
    } finally {
      e.target.value = "";
      setReplaceIndex(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setOutput("");
    setReport(null);

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

      setReport(data.report);
      setOutput(data.output || "");

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
            visualFindings: data.visualFindings || [],
          }),
        });
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraftStatus("");
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "There was an error generating the summary.";

      setOutput(message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
            <p className="text-base font-semibold text-gray-900">
              Generating summary...
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-4 text-gray-900 shadow sm:p-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Fox Pest Control Report Generator
        </h1>
        <p className="mb-6 text-sm text-gray-700 sm:text-base">
          Enter inspection details, notes, and photos to generate a standardized customer summary.
        </p>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Draft Status</p>
            <p className="text-sm text-gray-600">
              {draftStatus || "No draft saved yet"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearDraft}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Clear Draft
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <input
            className="rounded-xl border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            className="rounded-xl border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Service Address"
            value={serviceAddress}
            onChange={(e) => setServiceAddress(e.target.value)}
          />

          <input
            className="rounded-xl border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Pest Type"
            value={pestType}
            onChange={(e) => setPestType(e.target.value)}
          />

          <textarea
            className="rounded-xl border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Inspection Findings"
            rows={4}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
          />

          <textarea
            className="rounded-xl border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Treatment Performed"
            rows={4}
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
          />

          <textarea
            className="rounded-xl border bg-white p-3 text-gray-900 placeholder:text-gray-400"
            placeholder="Technician Notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="rounded-xl border border-dashed border-gray-300 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Photos</h2>
                <p className="text-sm text-gray-600">
                  Upload up to 3 images. Photos are used internally to support the summary but are not mentioned directly in the final email.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addPhotosInputRef.current?.click()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Photos
              </button>
            </div>

            <input
              ref={addPhotosInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddImages}
              className="hidden"
            />

            <input
              ref={replacePhotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleReplaceImage}
              className="hidden"
            />

            {images.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => (
                  <div
                    key={`${image.path}-${index}`}
                    className="overflow-hidden rounded-xl border bg-white"
                  >
                    <img
                      src={image.publicUrl}
                      alt={image.name}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />

                    <div className="p-3">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {image.name}
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartReplace(index)}
                          className="flex-1 rounded-lg bg-yellow-100 px-3 py-2 text-xs font-medium text-yellow-800"
                        >
                          Replace
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-green-600 p-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Summary"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl bg-gray-200 p-3 font-semibold text-gray-900 hover:bg-gray-300"
            >
              Reset Form
            </button>
          </div>
        </form>

        {report && output && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Summary
              </h2>
              <CopyButton text={output} />
            </div>

            <div className="space-y-4 rounded-xl bg-gray-100 p-4 text-sm text-gray-900">
              <div>
                <p className="font-semibold">{report.subject}</p>
              </div>

              <div>
                <p>{report.greeting}</p>
              </div>

              <div>
                <h3 className="font-semibold">WHAT I SAW</h3>
                <p className="whitespace-pre-wrap">{report.whatISaw}</p>
              </div>

              <div>
                <h3 className="font-semibold">WHAT I DID</h3>
                <p className="whitespace-pre-wrap">{report.whatIDid}</p>
              </div>

              <div>
                <h3 className="font-semibold">WHAT TO EXPECT</h3>
                <p className="whitespace-pre-wrap">{report.whatToExpect}</p>
              </div>

              <div>
                <h3 className="font-semibold">WHAT I RECOMMENDED</h3>
                <p className="whitespace-pre-wrap">{report.whatIRecommend}</p>
              </div>

              <div>
                <p className="whitespace-pre-wrap">{report.closing}</p>
              </div>
            </div>
          </div>
        )}

        {!report && output && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Summary
              </h2>
              <CopyButton text={output} />
            </div>

            <pre className="whitespace-pre-wrap rounded-xl bg-gray-100 p-4 text-sm text-gray-900">
              {output}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}