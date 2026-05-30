"use client";

import { useState, useEffect } from "react";
import { Resource, Assignment, AssignmentSubmission } from "@/types/database";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, FileText, CheckCircle, Clock, Award } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import AttentionHeatmap from "../analytics/attention-heatmap";

interface ResourceTabsProps {
  subjectId: number;
  videos: Resource[];
  pdfs: Resource[];
  notes: Resource[];
  userRole: string;
  onResourceDeleted?: () => void;
}

type TabType = "videos" | "pdfs" | "notes" | "assignments";

export default function ResourceTabs({
  subjectId,
  videos,
  pdfs,
  notes,
  userRole,
  onResourceDeleted,
}: ResourceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("videos");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<number, AssignmentSubmission>>({});
  const [submissionCountsMap, setSubmissionCountsMap] = useState<Record<number, number>>({});
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const fetchAssignmentsAndSubmissions = async () => {
    setLoadingAssignments(true);
    try {
      const supabase = createClient();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false });

      const loadedAssignments = (assignmentsData as Assignment[]) || [];
      setAssignments(loadedAssignments);

      if (loadedAssignments.length > 0) {
        const assignmentIds = loadedAssignments.map((a) => a.id);

        if (userRole === "admin" || userRole === "faculty") {
          // Fetch submission counts for faculty
          const { data: allSubmissions } = await supabase
            .from("assignment_submissions")
            .select("assignment_id")
            .in("assignment_id", assignmentIds);

          const counts: Record<number, number> = {};
          (allSubmissions || []).forEach((sub) => {
            counts[sub.assignment_id] = (counts[sub.assignment_id] || 0) + 1;
          });
          setSubmissionCountsMap(counts);
        } else {
          // Fetch student's own submissions
          const { data: studentSubmissions } = await supabase
            .from("assignment_submissions")
            .select("*")
            .eq("student_id", user.id)
            .in("assignment_id", assignmentIds);

          const subsMap: Record<number, AssignmentSubmission> = {};
          (studentSubmissions || []).forEach((sub) => {
            subsMap[sub.assignment_id] = sub as AssignmentSubmission;
          });
          setSubmissionsMap(subsMap);
        }
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsAndSubmissions();
  }, [subjectId, userRole]);

  const tabs = [
    {
      id: "videos" as TabType,
      label: "Videos",
      count: videos.length,
      icon: "🎥",
    },
    { id: "pdfs" as TabType, label: "PDFs", count: pdfs.length, icon: "📄" },
    { id: "notes" as TabType, label: "Notes", count: notes.length, icon: "📝" },
    {
      id: "assignments" as TabType,
      label: "Assignments",
      count: assignments.length,
      icon: "📋",
    },
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

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div>
            {canUpload && (
              <Link
                href={`/subjects/${subjectId}/assignments/create`}
                style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-2 border-border px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-hard-sm cursor-pointer mb-6">
                <Plus className="w-4.5 h-4.5 text-primary-foreground" />
                Create Assignment
              </Link>
            )}

            {loadingAssignments ? (
              <div className="text-center py-12 text-muted-foreground font-bold font-body">
                Loading worksheets...
              </div>
            ) : assignments.length === 0 ? (
              <EmptyState
                icon="📋"
                message="No assignments posted yet"
                subMessage={
                  canUpload ? "Create the first worksheet for this course" : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assignment) => {
                  const submission = submissionsMap[assignment.id];
                  const submissionCount = submissionCountsMap[assignment.id] || 0;

                  return (
                    <div
                      key={assignment.id}
                      className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md hover:border-primary transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between h-full font-body text-left relative group/card"
                    >
                      <div>
                        {/* Icon & Max Score badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xl">
                            📋
                          </div>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold">
                            {assignment.max_score} pts
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-foreground font-bold font-heading line-clamp-2 text-base mb-2 group-hover:text-primary transition-colors">
                          {assignment.title}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground/60 font-bold mb-4">
                          Created: {formatDate(assignment.created_at)}
                        </p>
                      </div>

                      {/* Action block */}
                      <div className="pt-3 border-t-2 border-dashed border-border/30 mt-auto">
                        {canUpload ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-foreground bg-muted border-2 border-border px-2 py-0.5 rounded-lg">
                              👥 {submissionCount} Sub
                            </span>
                            <Link
                              href={`/subjects/${subjectId}/assignments/${assignment.id}`}
                              className="inline-flex items-center justify-center bg-secondary/15 hover:bg-secondary/25 text-secondary border-2 border-secondary/35 px-3 py-1 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-hard-sm cursor-pointer"
                            >
                              Assess
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            {submission ? (
                              <>
                                {submission.status === "graded" && submission.marks_published ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-bold">
                                    Graded: {submission.score}/{assignment.max_score}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] font-bold">
                                    Grading Pending
                                  </span>
                                )}
                                <Link
                                  href={`/subjects/${subjectId}/assignments/${assignment.id}`}
                                  className="inline-flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground border-2 border-border px-3 py-1 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-hard-sm cursor-pointer"
                                >
                                  View
                                </Link>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-bold">
                                  Not Written
                                </span>
                                <Link
                                  href={`/subjects/${subjectId}/assignments/${assignment.id}`}
                                  className="inline-flex items-center justify-center bg-primary text-primary-foreground border-2 border-border px-3 py-1 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-hard-sm cursor-pointer"
                                >
                                  Write
                                </Link>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
  const [showAnalytics, setShowAnalytics] = useState(false);
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
          <div className="bg-card border-2 border-border rounded-xl p-4 hover:border-primary transition-all duration-300 hover:shadow-hard-md group h-full shadow-hard-sm flex flex-col justify-between">
            <div>
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
            </div>

            <div className="flex items-center justify-between mt-3">
              {/* Date */}
              <p className="text-muted-foreground/80 text-xs font-bold font-body">
                {formatDate(resource.created_at)}
              </p>

              {/* View AI Heatmap Button (Visible to faculty/admins on videos) */}
              {canDelete && resource.type === "video" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAnalytics(true);
                  }}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="px-2.5 py-1 text-[11px] bg-primary text-primary-foreground font-bold border-2 border-border shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1 font-body z-10 animate-sketch-bounce"
                >
                  📊 AI Analytics
                </button>
              )}
            </div>
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
      {/* AI Attention Heatmap Modal overlay */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
            className="bg-[#14181D] border-4 border-[#BFA55A] p-6 max-w-4xl w-full shadow-hard-xl relative text-left"
          >
            <button
              onClick={() => setShowAnalytics(false)}
              className="absolute top-4 right-4 text-[#B0B0B0] hover:text-[#EAEAEA] font-bold p-2 cursor-pointer transition-colors border-2 border-[#BFA55A]/30 rounded-lg hover:bg-muted/10 bg-transparent flex items-center justify-center font-body text-xs"
            >
              ✕ Close
            </button>
            <div className="mt-8">
              <AttentionHeatmap resourceId={resource.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
