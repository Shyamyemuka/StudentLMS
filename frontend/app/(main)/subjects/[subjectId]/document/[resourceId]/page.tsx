"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ResourceCompletionButton from "@/components/progress/resource-completion-button";

interface ResourceData {
  id: number;
  title: string;
  type: string;
  source: string;
  storage_path: string | null;
  external_url: string | null;
  subject_id: number;
}

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const resourceId = params.resourceId as string;

  const [resource, setResource] = useState<ResourceData | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchResource = async () => {
      try {
        // Refresh session first
        await supabase.auth.getSession();

        // Get user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        // Fetch resource details
        const { data: resourceData, error: resourceError } = await supabase
          .from("resources")
          .select("*")
          .eq("id", resourceId)
          .single();

        if (resourceError || !resourceData) {
          setError("Resource not found");
          setLoading(false);
          return;
        }

        setResource(resourceData);

        // Check completion status
        const { data: progressData } = await supabase
          .from("user_resource_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("resource_id", resourceId)
          .eq("subject_id", subjectId)
          .single();

        setIsCompleted(progressData?.completed || false);

        // Generate public URL for viewing (buckets are public)
        if (resourceData.source === "upload" && resourceData.storage_path) {
          const pathParts = resourceData.storage_path.split("/");
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join("/");

          // Use getPublicUrl for public buckets (videos, pdfs, notes are all public)
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          if (!publicUrlData || !publicUrlData.publicUrl) {
            setError("Failed to load document");
            setLoading(false);
            return;
          }

          setSignedUrl(publicUrlData.publicUrl);
        } else if (
          resourceData.source === "external" &&
          resourceData.external_url
        ) {
          setSignedUrl(resourceData.external_url);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching resource:", err);
        setError("Failed to load document");
        setLoading(false);
      }
    };

    fetchResource();
  }, [resourceId, router, supabase]);

  const getFileExtension = (path: string | null): string => {
    if (!path) return "";
    return path.split(".").pop()?.toLowerCase() || "";
  };

  const isPdf = (path: string | null): boolean => {
    return getFileExtension(path) === "pdf";
  };

  const isDoc = (path: string | null): boolean => {
    const ext = getFileExtension(path);
    return ext === "doc" || ext === "docx";
  };

  const getViewerUrl = (): string | null => {
    if (!signedUrl) return null;

    const ext = getFileExtension(
      resource?.storage_path ?? resource?.external_url ?? null,
    );

    // For DOC/DOCX files, use Google Docs Viewer or Office Online
    if (ext === "doc" || ext === "docx") {
      // Google Docs Viewer
      return `https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`;
    }

    // For PDF and other files, return the direct URL
    return signedUrl;
  };

  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-[#B0B0B0]">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-xl font-bold text-[#EAEAEA] mb-2">
            Document Not Found
          </h1>
          <p className="text-[#B0B0B0] mb-4">{error}</p>
          <Link
            href={`/subjects/${subjectId}`}
            className="text-[#D4AF37] hover:underline">
            ← Back to Subject
          </Link>
        </div>
      </div>
    );
  }

  const viewerUrl = getViewerUrl();
  const fileExt = getFileExtension(
    resource?.storage_path ?? resource?.external_url ?? null,
  );

  return (
    <div className="min-h-screen bg-[#0B0D10] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#14181D] border-b border-[#2A2F35] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/subjects/${subjectId}`}
              className="text-[#B0B0B0] hover:text-[#EAEAEA] transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[#EAEAEA]">
                {resource?.title || "Document"}
              </h1>
              <p className="text-sm text-[#707070]">
                {fileExt.toUpperCase()} Document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Completion Button */}
            {userId && (
              <ResourceCompletionButton
                resourceId={parseInt(resourceId)}
                subjectId={parseInt(subjectId)}
                userId={userId}
                isCompleted={isCompleted}
                onComplete={() => setIsCompleted(true)}
              />
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#0B0D10] rounded-lg font-medium hover:bg-[#E6C76A] transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto h-full">
          {viewerUrl ? (
            <div className="w-full h-[calc(100vh-140px)] bg-[#14181D] rounded-lg overflow-hidden border border-[#2A2F35]">
              {isPdf(resource?.storage_path ?? null) ? (
                // PDF - embed directly
                <iframe
                  src={viewerUrl}
                  className="w-full h-full"
                  title={resource?.title || "Document"}
                />
              ) : isDoc(resource?.storage_path ?? null) ? (
                // DOC/DOCX - use Google Docs Viewer
                <iframe
                  src={viewerUrl}
                  className="w-full h-full"
                  title={resource?.title || "Document"}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              ) : (
                // Other files - show message with download option
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📄</div>
                    <h2 className="text-xl font-bold text-[#EAEAEA] mb-2">
                      Preview not available
                    </h2>
                    <p className="text-[#B0B0B0] mb-4">
                      This file type cannot be previewed in the browser.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-3 bg-[#D4AF37] text-[#0B0D10] rounded-lg font-medium hover:bg-[#E6C76A] transition-colors">
                      Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[calc(100vh-140px)] bg-[#14181D] rounded-lg flex items-center justify-center border border-[#2A2F35]">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-[#B0B0B0]">Unable to load document viewer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
