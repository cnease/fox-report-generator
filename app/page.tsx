"use client";

import { FormEvent, useRef, useState } from "react";
import UserHeader from "@/components/user-header";
import { createClient } from "@/lib/supabase/client";
import CopyButton from "@/components/copy-button";

type UploadedImage = {
  name: string;
  type: string;
  publicUrl: string;
  path: string;
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

  const addPhotosInputRef = useRef<HTMLInputElement | null>(null);
  const replacePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

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
    setOutput("");
  }

  async function uploadFile(file: File): Promise<UploadedImage> {
    const supabase = createClient();
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

    const { data } = supabase.storage
      .from("report-images")
      .getPublicUrl(filePath);

    return {
      name: file.name,
      type: file.type,
      publicUrl: data.publicUrl,
      path: filePath,
    };
  }

  async function deleteImageFromStorage(path: string) {
    try {
      const supabase = createClient();
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

            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:bg-gray-100">
              <input
                ref={addPhotosInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddImages}
              />

              <div className="space-y-2">
                <p className="text-base font-semibold text-gray-900">
                  {images.length > 0
                    ? images.length < 3
                      ? "Tap here to add more photos"
                      : "Maximum of 3 photos uploaded"
                    : "Tap here to upload photos"}
                </p>
                <p className="text-sm text-gray-600">
                  Upload clear images of pest activity, conducive conditions, or treatment areas
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, HEIC • Up to 3 images
                </p>
              </div>
            </label>

            <input
              ref={replacePhotoInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={handleReplaceImage}
            />

            {images.length > 0 && (
              <div className="mt-3 rounded bg-gray-100 p-3">
                <p className="text-sm font-medium text-gray-900">
                  {images.length} image(s) uploaded
                </p>

                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {images.map((image, index) => (
                    <li key={`${image.name}-${index}`}>• {image.name}</li>
                  ))}
                </ul>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={`${image.publicUrl}-${index}`}
                      className="overflow-hidden rounded-lg border bg-white"
                    >
                      <img
                        src={image.publicUrl}
                        alt={image.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="p-2">
                        <div className="truncate text-xs text-gray-600">
                          {image.name}
                        </div>

                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartReplace(index)}
                            className="flex-1 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white"
                          >
                            Replace
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="flex-1 rounded bg-red-100 px-3 py-2 text-xs font-medium text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded bg-green-600 p-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Summary"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded bg-gray-200 p-3 font-semibold text-gray-900 hover:bg-gray-300"
            >
              Reset Form
            </button>
          </div>
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