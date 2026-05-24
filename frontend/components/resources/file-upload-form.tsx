"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { sanitizeFilename } from "@/lib/utils/filename";

interface FileUploadFormProps {
  subjectId: number;
  type: "pdf" | "notes";
}

export default function FileUploadForm({
  subjectId,
  type,
}: FileUploadFormProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const supabase = createClient();

  const acceptedTypes = type === "pdf" ? ".pdf" : ".txt,.md,.doc,.docx";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !file) {
      toast.error("Please fill in all fields and select a file");
      return;
    }

    setIsLoading(true);

    try {
      // Get current user - middleware should have refreshed the session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Auth error:", authError);
        toast.error("Your session has expired. Redirecting to login...");
        setTimeout(() => {
          router.push(
            `/login?redirectTo=/subjects/${subjectId}/add-resource?type=${type}`,
          );
        }, 1000);
        return;
      }

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      // Use user-entered title if available, otherwise use original filename
      const baseFilename = title.trim() ? `${title}.${fileExt}` : file.name;
      const sanitizedFilename = sanitizeFilename(baseFilename);
      const fileName = `${subjectId}/${sanitizedFilename}`;
      const bucket = type === "pdf" ? "pdfs" : "notes";

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        setIsLoading(false);
        return;
      }

      // Create resource record
      const { error: dbError } = await supabase.from("resources").insert({
        subject_id: subjectId,
        type: type,
        title: title.trim(),
        source: "upload",
        storage_path: `${bucket}/${fileName}`, // Include bucket name in storage path
        created_by: user.id,
        approved: true, // Faculty/Admin uploads are auto-approved
      });

      if (dbError) {
        toast.error(dbError.message);
        setIsLoading(false);
        return;
      }

      toast.success(
        `${type === "pdf" ? "PDF" : "Notes"} uploaded successfully!`,
      );
      router.push(`/subjects/${subjectId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "An error occurred during upload");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-[#B0B0B0] mb-2">
          {type === "pdf" ? "PDF" : "Notes"} Title{" "}
          <span className="text-[#C94A4A]">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#0B0D10] border border-[#2A2F35] rounded-lg px-4 py-3 text-[#EAEAEA] placeholder:text-[#707070] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-colors"
          placeholder={`e.g., Chapter 1 - ${
            type === "pdf" ? "Lecture Slides" : "Study Notes"
          }`}
          required
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-[#B0B0B0] mb-2">
          Upload File <span className="text-[#C94A4A]">*</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#2A2F35] rounded-lg p-8 text-center cursor-pointer hover:border-[#D4AF37] transition-colors">
          {file ? (
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#4CAF8F]/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#4CAF8F]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-[#EAEAEA] font-medium">{file.name}</p>
              <p className="text-[#707070] text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-2 text-[#C94A4A] text-sm hover:underline">
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#D4AF37]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <p className="text-[#EAEAEA]">Click to upload or drag and drop</p>
              <p className="text-[#707070] text-sm mt-1">
                {type === "pdf" ? "PDF files" : "TXT, MD, DOC, DOCX files"}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !file}
        className="w-full bg-[#D4AF37] text-[#0B0D10] py-3 rounded-lg font-medium hover:bg-[#E6C76A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Uploading...
          </span>
        ) : (
          `Upload ${type === "pdf" ? "PDF" : "Notes"}`
        )}
      </button>
    </form>
  );
}
