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
          className="block text-sm font-bold text-foreground mb-2 font-body">
          {type === "pdf" ? "PDF" : "Notes"} Title{" "}
          <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium"
          placeholder={`e.g., Chapter 1 - ${
            type === "pdf" ? "Lecture Slides" : "Study Notes"
          }`}
          required
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-bold text-foreground mb-2 font-body">
          Upload File <span className="text-destructive">*</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.02)]">
          {file ? (
            <div className="font-body font-bold">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-success/15 border-2 border-success/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-success"
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
              <p className="text-foreground font-black">{file.name}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-2 text-destructive text-sm hover:underline font-bold cursor-pointer">
                Remove
              </button>
            </div>
          ) : (
            <div className="font-body font-bold">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
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
              <p className="text-foreground">Click to upload or drag and drop</p>
              <p className="text-muted-foreground text-sm mt-1">
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
        style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
        className="w-full bg-primary text-primary-foreground border-2 border-border py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-hard-sm cursor-pointer font-heading text-lg">
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
