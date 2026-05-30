"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Subject } from "@/types/database";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Lock, Unlock, Calendar, BookOpen } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import ProgressBar from "@/components/progress/progress-bar";

interface SubjectCardProps {
  subject: Subject;
  isLocked?: boolean;
  isGuest?: boolean;
  showStatus?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  progressPercentage?: number;
  showProgress?: boolean;
}

export default function SubjectCard({
  subject,
  isLocked = false,
  isGuest = false,
  showStatus = false,
  canDelete = false,
  onDelete,
  progressPercentage,
  showProgress = false,
}: SubjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const isRejected = subject.status === "rejected";
  
  const statusColors: Record<string, string> = {
    approved: "bg-[#4CAF8F]/20 text-[#4CAF8F] border-[#4CAF8F]/30",
    pending: "bg-primary/20 text-primary border-primary/30",
    rejected: "bg-destructive/20 text-destructive border-destructive/30",
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // First, check if there are resources
      const { data: resources } = await supabase
        .from("resources")
        .select("id, storage_path, source")
        .eq("subject_id", subject.id);

      // Delete uploaded files from storage
      if (resources && resources.length > 0) {
        for (const resource of resources) {
          if (resource.source === "upload" && resource.storage_path) {
            const [bucket, ...pathParts] = resource.storage_path.split("/");
            const filePath = pathParts.join("/");

            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);

            if (deleteError) {
              console.error(
                `Error deleting file ${resource.storage_path}:`,
                deleteError,
              );
            }
          }
        }
      }

      // Check if there are submissions
      const { data: submissions } = await supabase
        .from("resource_submissions")
        .select("id, storage_path, type")
        .eq("subject_id", subject.id);

      // Delete submission files from storage
      if (submissions && submissions.length > 0) {
        for (const submission of submissions) {
          if (
            (submission.type === "pdf" || submission.type === "notes") &&
            submission.storage_path
          ) {
            const [bucket, ...pathParts] = submission.storage_path.split("/");
            const filePath = pathParts.join("/");

            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);

            if (deleteError) {
              console.error(
                `Error deleting submission file ${submission.storage_path}:`,
                deleteError,
              );
            }
          }
        }
      }

      // Delete the subject
      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subject.id);

      if (deleteError) throw deleteError;

      toast.success("Subject and all associated data deleted successfully");
      setShowDeleteDialog(false);
      router.refresh();
      onDelete?.();
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error(error?.message || "Failed to delete subject");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative group/card h-full">
        {isRejected ? (
          <div 
            className="bg-card border-2 border-destructive rounded-xl p-6 h-full cursor-not-allowed opacity-75 shadow-hard-sm"
          >
            {/* Rejection Banner */}
            <div className="bg-destructive/10 border-2 border-dashed border-destructive rounded-lg p-3 mb-4">
              <p className="text-destructive text-sm font-bold">
                ❌ Subject Rejected
              </p>
              <p className="text-muted-foreground text-xs mt-1 font-bold">
                This subject was not approved and cannot be accessed
              </p>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="inline-block px-3 py-1 bg-destructive/10 text-destructive rounded-md text-sm font-bold border border-destructive/20 mb-2">
                  {subject.subject_code}
                </div>
                <h3 className="text-lg font-bold text-muted-foreground truncate">
                  {subject.title}
                </h3>
              </div>
            </div>

            {/* Regulation */}
            <div className="flex items-center gap-2 mb-3 font-medium text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Regulation: {subject.regulation}</span>
            </div>

            {/* Description */}
            {subject.description && (
              <p className="text-muted-foreground text-sm line-clamp-2 font-medium">
                {subject.description}
              </p>
            )}
          </div>
        ) : (
          <Link href={isGuest ? `/login?redirectTo=/subjects/${subject.id}` : `/subjects/${subject.id}`} className="block h-full">
            <div 
              className={`bg-card border-2 rounded-xl p-6 transition-all duration-200 shadow-hard-md hover:-translate-y-1 hover:shadow-hard-lg hover:rotate-1 group h-full relative ${
                isLocked 
                  ? "border-accent/40 hover:border-accent" 
                  : "border-border hover:border-primary"
              }`}
            >
              {/* Locked Badge Decor */}
              {isLocked && (
                <div className="absolute top-[-10px] right-4 bg-accent text-accent-foreground border-2 border-border px-3 py-0.5 text-xs font-bold shadow-hard-sm rounded-xl uppercase tracking-wider flex items-center gap-1.5 animate-sketch-bounce">
                  <Lock className="size-3" strokeWidth={3} />
                  Locked
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  {/* Subject Code */}
                  <div className="inline-block px-3 py-1 bg-secondary/15 text-secondary border border-secondary/30 rounded-md text-sm font-bold mb-2">
                    {subject.subject_code}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate font-heading">
                    {subject.title}
                  </h3>
                </div>

                {/* Status Badge */}
                {showStatus && !isLocked && (
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold border ${
                      statusColors[subject.status]
                    }`}
                  >
                    {subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}
                  </span>
                )}
              </div>

              {/* Regulation */}
              <div className="flex items-center gap-2 mb-3 text-muted-foreground text-sm font-bold">
                <Calendar className="w-4 h-4 text-border" />
                <span>Regulation: {subject.regulation}</span>
              </div>

              {/* Description */}
              {subject.description && (
                <p className="text-foreground/80 text-sm line-clamp-2 font-medium">
                  {subject.description}
                </p>
              )}

              {/* Progress Bar (Only if unlocked) */}
              {!isLocked && showProgress && progressPercentage !== undefined && (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-muted">
                  <ProgressBar progress={progressPercentage} size="sm" />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-dashed border-muted">
                <span className="text-muted-foreground text-xs font-bold">
                  {formatDate(subject.created_at)}
                </span>
                {isLocked ? (
                  <span className="text-accent text-sm font-bold group-hover:underline flex items-center gap-1">
                    Buy Course (₹{subject.price !== undefined ? Math.round(subject.price) : 499}) 🔒
                  </span>
                ) : (
                  <span className="text-primary text-sm font-bold group-hover:underline flex items-center gap-1">
                    Start Learning 🔓 →
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Delete Button */}
        {canDelete && (
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground border-2 border-border p-2 rounded-xl opacity-0 md:group-hover/card:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed z-10 cursor-pointer shadow-hard-sm"
            title="Delete subject"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => !isDeleting && setShowDeleteDialog(false)}
        title={`Delete "${subject.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      >
        <div className="space-y-4 font-medium text-foreground">
          <p className="text-muted-foreground text-sm font-bold">
            This will permanently delete:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>All resources associated with this subject</li>
            <li>All submissions for this subject</li>
            <li>All enrollments for this subject</li>
          </ul>
          <p className="text-destructive text-sm font-bold">
            This action cannot be undone.
          </p>
        </div>
      </Dialog>
    </>
  );
}
