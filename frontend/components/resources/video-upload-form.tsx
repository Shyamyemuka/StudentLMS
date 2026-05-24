"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { sanitizeFilename } from "@/lib/utils/filename";

interface VideoUploadFormProps {
  subjectId: number;
}

export default function VideoUploadForm({ subjectId }: VideoUploadFormProps) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("file");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const supabase = createClient();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a video file
      if (!selectedFile.type.startsWith("video/")) {
        toast.error("Please select a valid video file");
        return;
      }
      setVideoFile(selectedFile);
    }
  };
  const validateVideoUrl = (url: string): boolean => {
    // Check for YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return true;
    }
    // Check for Vimeo
    if (url.includes("vimeo.com")) {
      return true;
    }
    // Check for Google Drive
    if (url.includes("drive.google.com")) {
      return true;
    }
    // Check for Dropbox
    if (url.includes("dropbox.com")) {
      return true;
    }
    // Check for direct video URL
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
      return true;
    }
    // Check if it's a valid URL
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a video title");
      return;
    }

    if (uploadMode === "url" && !videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    if (uploadMode === "file" && !videoFile) {
      toast.error("Please select a video file");
      return;
    }

    if (uploadMode === "url" && !validateVideoUrl(videoUrl)) {
      toast.error(
        "Please enter a valid video URL (YouTube, Vimeo, Drive, Dropbox, or direct link)",
      );
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      toast.error(
        "You must be logged in. Please refresh the page and try again.",
      );
      setIsLoading(false);
      return;
    }

    try {
      let storagePath: string | null = null;
      let externalUrl: string | null = null;
      let source: "upload" | "external" = "external";

      if (uploadMode === "file" && videoFile) {
        // Upload video file to storage
        const fileExt = videoFile.name.split(".").pop();
        const baseFilename = title.trim()
          ? `${title}.${fileExt}`
          : videoFile.name;
        const sanitizedFilename = sanitizeFilename(baseFilename);
        const fileName = `${subjectId}/${Date.now()}-${sanitizedFilename}`;

        toast.info("Uploading video... This may take a while for large files.");

        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(fileName, videoFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`);
          setIsLoading(false);
          return;
        }

        storagePath = `videos/${fileName}`;
        source = "upload";
      } else {
        // Use external URL
        externalUrl = videoUrl.trim();
        source = "external";
      }

      // Create resource record
      const { error: dbError } = await supabase.from("resources").insert({
        subject_id: subjectId,
        type: "video",
        title: title.trim(),
        source: source,
        storage_path: storagePath,
        external_url: externalUrl,
        created_by: user.id,
        approved: true, // Faculty/Admin uploads are auto-approved
      });

      if (dbError) {
        toast.error(dbError.message);
        setIsLoading(false);
        return;
      }

      toast.success("Video added successfully!");
      router.push(`/subjects/${subjectId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "An error occurred during upload");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-[#B0B0B0] mb-2">
          Video Title <span className="text-[#C94A4A]">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#0B0D10] border border-[#2A2F35] rounded-lg px-4 py-3 text-[#EAEAEA] placeholder:text-[#707070] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-colors"
          placeholder="e.g., Introduction to Data Structures"
          required
        />
      </div>

      {/* Upload Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-[#B0B0B0] mb-3">
          Upload Method <span className="text-[#C94A4A]">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              uploadMode === "file"
                ? "bg-[#D4AF37] text-[#0B0D10]"
                : "bg-[#14181D] border border-[#2A2F35] text-[#B0B0B0] hover:border-[#D4AF37]/50"
            }`}>
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload File
            </div>
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("url")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              uploadMode === "url"
                ? "bg-[#D4AF37] text-[#0B0D10]"
                : "bg-[#14181D] border border-[#2A2F35] text-[#B0B0B0] hover:border-[#D4AF37]/50"
            }`}>
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              External URL
            </div>
          </button>
        </div>
      </div>

      {/* File Upload */}
      {uploadMode === "file" && (
        <div>
          <label className="block text-sm font-medium text-[#B0B0B0] mb-2">
            Upload Video File <span className="text-[#C94A4A]">*</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#2A2F35] rounded-lg p-8 text-center cursor-pointer hover:border-[#D4AF37] transition-colors">
            {videoFile ? (
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
                <p className="text-[#EAEAEA] font-medium">{videoFile.name}</p>
                <p className="text-[#707070] text-sm mt-1">
                  {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoFile(null);
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
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-[#EAEAEA]">
                  Click to upload or drag and drop
                </p>
                <p className="text-[#707070] text-sm mt-1">
                  MP4, WebM, OGG, or other video formats
                </p>
                <p className="text-[#4CAF8F] text-xs mt-2">
                  ✓ Uses enhanced video player with bookmarks
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Video URL */}
      {uploadMode === "url" && (
        <div>
          <label
            htmlFor="videoUrl"
            className="block text-sm font-medium text-[#B0B0B0] mb-2">
            Video URL <span className="text-[#C94A4A]">*</span>
          </label>
          <input
            id="videoUrl"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full bg-[#0B0D10] border border-[#2A2F35] rounded-lg px-4 py-3 text-[#EAEAEA] placeholder:text-[#707070] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-colors"
            placeholder="https://youtube.com/... or https://dropbox.com/... or direct .mp4 link"
            required
          />
          <p className="text-[#707070] text-xs mt-2">
            Supported: YouTube, Vimeo, Google Drive, Dropbox, or direct video
            links (.mp4, .webm)
          </p>
        </div>
      )}

      {/* Supported Platforms (only for URL mode) */}
      {uploadMode === "url" && (
        <div className="bg-[#0B0D10] border border-[#2A2F35] rounded-lg p-4">
          <p className="text-sm text-[#B0B0B0] mb-3">Supported platforms:</p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-[#FF0000]/10 text-[#FF6B6B] rounded text-xs">
              YouTube
            </span>
            <span className="px-3 py-1 bg-[#1AB7EA]/10 text-[#1AB7EA] rounded text-xs">
              Vimeo
            </span>
            <span className="px-3 py-1 bg-[#4285F4]/10 text-[#4285F4] rounded text-xs">
              Google Drive
            </span>
            <span className="px-3 py-1 bg-[#0061FF]/10 text-[#0061FF] rounded text-xs">
              Dropbox
            </span>
            <span className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded text-xs">
              Direct Links
            </span>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isLoading && uploadMode === "file" && uploadProgress > 0 && (
        <div className="bg-[#0B0D10] border border-[#2A2F35] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#B0B0B0]">Uploading video...</span>
            <span className="text-sm text-[#D4AF37] font-medium">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-[#2A2F35] rounded-full h-2">
            <div
              className="bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
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
            {uploadMode === "file" ? "Uploading..." : "Adding Video..."}
          </span>
        ) : (
          `Add Video ${uploadMode === "file" ? "(Upload)" : "(URL)"}`
        )}
      </button>
    </form>
  );
}
