"use client";

import { useState } from "react";
import { Resource } from "@/types/database";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface ResourceTabsProps {
  subjectId: number;
  videos: Resource[];
  pdfs: Resource[];
  notes: Resource[];
  userRole: string;
  onResourceDeleted?: () => void;
}

type TabType = "videos" | "pdfs" | "notes";

export default function ResourceTabs({
  subjectId,
  videos,
  pdfs,
  notes,
  userRole,
  onResourceDeleted,
}: ResourceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("videos");

  const tabs = [
    {
      id: "videos" as TabType,
      label: "Videos",
      count: videos.length,
      icon: "🎥",
    },
    { id: "pdfs" as TabType, label: "PDFs", count: pdfs.length, icon: "📄" },
    { id: "notes" as TabType, label: "Notes", count: notes.length, icon: "📝" },
  ];

  const canUpload = userRole === "admin" || userRole === "faculty";

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex flex-wrap gap-2 border-b-2 border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            <span className="flex items-center gap-2">
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border-2 border-border ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                  {tab.count}
                </span>
              )}
            </span>
            {/* Active indicator */}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Videos Tab */}
        {activeTab === "videos" && (
          <div>
            {canUpload && (
              <Link
                href={`/subjects/${subjectId}/add-resource?type=video`}
                style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-2 border-border px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-hard-sm cursor-pointer mb-6">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Video
              </Link>
            )}

            {videos.length === 0 ? (
              <EmptyState
                icon="🎥"
                message="No videos available yet"
                subMessage={
                  canUpload ? "Add the first video to this course" : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <ResourceCard
                    key={video.id}
                    resource={video}
                    subjectId={subjectId}
                    canDelete={canUpload}
                    onDelete={onResourceDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PDFs Tab */}
        {activeTab === "pdfs" && (
          <div>
            {canUpload && (
              <Link
                href={`/subjects/${subjectId}/add-resource?type=pdf`}
                style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-2 border-border px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-hard-sm cursor-pointer mb-6">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add PDF
              </Link>
            )}

            {pdfs.length === 0 ? (
              <EmptyState
                icon="📄"
                message="No PDFs available yet"
                subMessage={
                  canUpload ? "Upload the first PDF to this course" : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pdfs.map((pdf) => (
                  <ResourceCard
                    key={pdf.id}
                    resource={pdf}
                    subjectId={subjectId}
                    canDelete={canUpload}
                    onDelete={onResourceDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div>
            {canUpload && (
              <Link
                href={`/subjects/${subjectId}/add-resource?type=notes`}
                style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-2 border-border px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-hard-sm cursor-pointer mb-6">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Notes
              </Link>
            )}

            {notes.length === 0 ? (
              <EmptyState
                icon="📝"
                message="No notes available yet"
                subMessage={
                  canUpload ? "Add the first notes to this course" : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <ResourceCard
                    key={note.id}
                    resource={note}
                    subjectId={subjectId}
                    canDelete={canUpload}
                    onDelete={onResourceDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({
  icon,
  message,
  subMessage,
}: {
  icon: string;
  message: string;
  subMessage?: string;
}) {
  return (
    <div className="text-center py-12 font-body font-bold">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border-2 border-border flex items-center justify-center text-3xl shadow-hard-sm">
        {icon}
      </div>
      <p className="text-muted-foreground">{message}</p>
      {subMessage && (
        <p className="text-muted-foreground/80 text-sm mt-1">{subMessage}</p>
      )}
    </div>
  );
}

// Resource Card Component
function ResourceCard({
  resource,
  subjectId,
  canDelete = false,
  onDelete,
}: {
  resource: Resource;
  subjectId: number;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const supabase = createClient();

  const typeIcons: Record<string, string> = {
    video: "🎥",
    pdf: "📄",
    notes: "📝",
  };

  // Determine the correct href based on resource type
  const getHref = () => {
    if (resource.type === "video") {
      return `/subjects/${subjectId}/video/${resource.id}`;
    }
    // For PDFs and notes, use the document viewer page
    return `/subjects/${subjectId}/document/${resource.id}`;
  };

  const href = getHref();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // SAFETY CHECK: Ensure we have a valid resource ID
      if (!resource || !resource.id) {
        toast.error("Invalid resource");
        setIsDeleting(false);
        return;
      }

      console.log(
        `Attempting to delete resource: ${resource.id} (${resource.title})`,
      );

      // If this is an uploaded file (not external link), delete from storage
      if (resource.source === "upload" && resource.storage_path) {
        const [bucket, ...pathParts] = resource.storage_path.split("/");
        const filePath = pathParts.join("/");

        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (deleteError) {
          console.error("Error deleting file from storage:", deleteError);
          // Continue anyway to delete the record
        }
      }

      // Delete ONLY this specific resource by ID from the database
      // Using eq() ensures we only delete the resource with this exact ID
      const { error: dbError, data: deletedData } = await supabase
        .from("resources")
        .delete()
        .eq("id", resource.id)
        .select();

      if (dbError) {
        console.error("Error deleting resource from database:", dbError);

        // Check user's role to provide better error message
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user?.id)
          .single();

        const roleInfo = profile?.role ? ` (Your role: ${profile.role})` : "";
        toast.error(
          `Failed to delete resource: ${dbError.message}${roleInfo}. You may need faculty or admin permissions.`,
        );
        setIsDeleting(false);
        return;
      }

      // Verify the resource was actually deleted
      if (!deletedData || deletedData.length === 0) {
        console.error("Resource was not deleted from database!");

        // Check user's role
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user?.id)
          .single();

        toast.error(
          `Failed to delete resource. Permission denied. Your role: ${
            profile?.role || "unknown"
          }. Please ensure you have faculty or admin permissions, or run the SQL fix in Supabase.`,
        );
        setIsDeleting(false);
        return;
      }

      // Double-check by trying to fetch the resource (should fail)
      const { data: checkData } = await supabase
        .from("resources")
        .select("id")
        .eq("id", resource.id)
        .single();

      if (checkData) {
        console.error("Resource still exists in database after deletion!");
        toast.error(
          "Resource was not deleted. Please run the SQL fix in Supabase.",
        );
        setIsDeleting(false);
        return;
      }

      console.log(
        `✓ Successfully deleted resource from database: ${resource.id}`,
      );
      toast.success("Resource deleted successfully from database");
      setShowDeleteDialog(false);
      onDelete?.();
    } catch (error: any) {
      console.error("Error in handleDelete:", error);
      toast.error(
        `Failed to delete resource: ${error.message || "Unknown error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative group/card">
        <Link href={href}>
          <div className="bg-card border-2 border-border rounded-xl p-4 hover:border-primary transition-all duration-300 hover:shadow-hard-md group h-full shadow-hard-sm">
            {/* Icon & Type */}
            <div className="flex items-center justify-between mb-3 font-body font-bold">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xl">
                  {typeIcons[resource.type]}
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {resource.type}
                </span>
              </div>
            </div>

            {/* Title */}
            <h4 className="text-foreground font-bold font-heading group-hover:text-primary transition-colors line-clamp-2 text-base">
              {resource.title}
            </h4>

            {/* Date */}
            <p className="text-muted-foreground/80 text-xs mt-2 font-bold font-body">
              {formatDate(resource.created_at)}
            </p>
          </div>
        </Link>

        {/* Delete Button - Visible on hover (desktop) and always (mobile) */}
        {canDelete && (
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground border-2 border-border p-2 rounded-xl opacity-0 md:group-hover/card:opacity-100 md:opacity-0 opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed z-10 hover:scale-105 active:scale-95 cursor-pointer shadow-hard-sm"
            title="Delete resource">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => !isDeleting && setShowDeleteDialog(false)}
        title="Delete Resource?"
        description="Are you sure you want to delete this resource? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
