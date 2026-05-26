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
          className="block text-sm font-bold text-foreground mb-2 font-body">
          Video Title <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium"
          placeholder="e.g., Introduction to Data Structures"
          required
        />
      </div>

      {/* Upload Mode Toggle */}
      <div>
        <label className="block text-sm font-bold text-foreground mb-3 font-body">
          Upload Method <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 border-border hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] ${
              uploadMode === "file"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:border-primary/50"
            }`}>
            <div className="flex items-center justify-center gap-2 font-body">
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
            className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 border-border hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] ${
              uploadMode === "url"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:border-primary/50"
            }`}>
            <div className="flex items-center justify-center gap-2 font-body">
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
          <label className="block text-sm font-bold text-foreground mb-2 font-body">
            Upload Video File <span className="text-destructive">*</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.02)]">
            {videoFile ? (
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
                <p className="text-foreground font-black">{videoFile.name}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoFile(null);
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
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  MP4, WebM, OGG, or other video formats
                </p>
                <p className="text-success text-xs mt-2">
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
            className="block text-sm font-bold text-foreground mb-2 font-body">
            Video URL <span className="text-destructive">*</span>
          </label>
          <input
            id="videoUrl"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium"
            placeholder="https://youtube.com/... or https://dropbox.com/... or direct .mp4 link"
            required
          />
          <p className="text-muted-foreground/80 text-xs mt-2 font-bold font-body">
            Supported: YouTube, Vimeo, Google Drive, Dropbox, or direct video
            links (.mp4, .webm)
          </p>
        </div>
      )}

      {/* Supported Platforms (only for URL mode) */}
      {uploadMode === "url" && (
        <div className="bg-background border-2 border-border rounded-xl p-4 font-body font-bold">
          <p className="text-sm text-muted-foreground mb-3">Supported platforms:</p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-destructive/10 text-destructive rounded border border-destructive/20 text-xs">
              YouTube
            </span>
            <span className="px-3 py-1 bg-info/10 text-info rounded border border-info/20 text-xs">
              Vimeo
            </span>
            <span className="px-3 py-1 bg-secondary/15 text-secondary rounded border border-secondary/30 text-xs font-bold">
              Google Drive
            </span>
            <span className="px-3 py-1 bg-[#0061FF]/10 text-[#0061FF] rounded border border-[#0061FF]/20 text-xs">
              Dropbox
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded border border-primary/20 text-xs">
              Direct Links
            </span>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isLoading && uploadMode === "file" && uploadProgress > 0 && (
        <div className="bg-background border-2 border-border rounded-xl p-4 font-body font-bold">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Uploading video...</span>
            <span className="text-sm text-primary font-black">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-muted border border-border rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
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
            {uploadMode === "file" ? "Uploading..." : "Adding Video..."}
          </span>
        ) : (
          `Add Video ${uploadMode === "file" ? "(Upload)" : "(URL)"}`
        )}
      </button>
    </form>
  );
}
