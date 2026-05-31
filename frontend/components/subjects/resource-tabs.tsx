"use client";

import { useState, useEffect } from "react";
import { Resource, Assignment, AssignmentSubmission } from "@/types/database";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, FileText, CheckCircle, Clock, Award, Sparkles } from "lucide-react";
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
  funContext?: string | null;
}

type TabType = "videos" | "pdfs" | "notes" | "assignments" | "ai-explainer";

export default function ResourceTabs({
  subjectId,
  videos,
  pdfs,
  notes,
  userRole,
  onResourceDeleted,
  funContext,
}: ResourceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("videos");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<number, AssignmentSubmission>>({});
  const [submissionCountsMap, setSubmissionCountsMap] = useState<Record<number, number>>({});
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [analogyType, setAnalogyType] = useState<"movie" | "series" | "superhero-fight">("movie");
  const [targetName, setTargetName] = useState("");
  const [includeResources, setIncludeResources] = useState(false);
  const [explainerResult, setExplainerResult] = useState("");
  const [generating, setGenerating] = useState(false);

  const [currentFunContext, setCurrentFunContext] = useState(funContext || "");
  const [showEditContextDialog, setShowEditContextDialog] = useState(false);
  const [editContextVal, setEditContextVal] = useState(funContext || "");
  const [updatingContext, setUpdatingContext] = useState(false);

  useEffect(() => {
    setCurrentFunContext(funContext || "");
    setEditContextVal(funContext || "");
  }, [funContext]);

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

  const fetchSavedExplainer = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("subject_explainers")
        .select("*")
        .eq("subject_id", subjectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setAnalogyType(data.analogy_type as "movie" | "series" | "superhero-fight");
        setTargetName(data.target_name);
        setIncludeResources(data.include_resources);
        setExplainerResult(data.explanation);
      }
    } catch (err) {
      console.error("Error fetching saved explainer:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "ai-explainer") {
      fetchSavedExplainer();
    }
  }, [activeTab, subjectId]);

  const handleUpdateContext = async () => {
    setUpdatingContext(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("subjects")
        .update({ fun_context: editContextVal.trim() || null })
        .eq("id", subjectId);

      if (error) {
        throw error;
      }

      setCurrentFunContext(editContextVal.trim());
      toast.success("AI Explainer Context updated successfully");
      setShowEditContextDialog(false);
    } catch (err: any) {
      console.error("Error updating context:", err);
      toast.error(err.message || "Failed to update context");
    } finally {
      setUpdatingContext(false);
    }
  };

  const handleGenerateExplainer = async () => {
    if (!targetName.trim()) {
      toast.error("Please enter a title/target name for your analogy");
      return;
    }

    setGenerating(true);
    setExplainerResult("");

    try {
      const res = await fetch("/api/ai/explainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          analogyType,
          targetName: targetName.trim(),
          includeResources,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate explanation");
      }

      setExplainerResult(data.explanation || "");
      toast.success("Explanation generated successfully");
    } catch (err: any) {
      console.error("Explainer error:", err);
      toast.error(err.message || "Failed to generate explanation");
    } finally {
      setGenerating(false);
    }
  };

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
    {
      id: "ai-explainer" as TabType,
      label: "AI Explainer",
      icon: <Sparkles className="w-4 h-4 text-foreground/80" />,
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

        {/* AI Explainer Tab */}
        {activeTab === "ai-explainer" && (
          <div className="space-y-6">
            <div className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md text-left font-body relative">
              <div className="tape-decor" />
              <h3 className="text-xl font-bold font-heading text-foreground mb-2 pt-2">
                Fun AI Explainer Mode
              </h3>
              <p className="text-muted-foreground text-sm font-medium mb-6">
                Understand this subject through creative, pop-culture analogies. Select an analogy style, type in a target movie, series, or superhero match-up, and let the AI explain the scientific/engineering concepts of the syllabus in a highly engaging, wobbly classroom style.
              </p>

              {/* Faculty Context Management Block */}
              {(userRole === "faculty" || userRole === "admin") && (
                <div className="bg-muted/40 border-2 border-dashed border-border rounded-xl p-5 shadow-hard-sm text-left relative mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-1 uppercase tracking-wider font-heading">
                        Faculty AI Explainer Context
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-xl">
                        {currentFunContext
                          ? "A custom syllabus context is configured for this course. The AI will prioritize this summary to deliver highly aligned pop-culture explanations."
                          : "No custom context is configured. The AI will fall back to the standard course description. Provide a summary of core topics to improve accuracy."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditContextVal(currentFunContext);
                        setShowEditContextDialog(true);
                      }}
                      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                      className="px-4 py-2 bg-secondary/15 hover:bg-secondary/25 text-secondary border-2 border-secondary/35 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-hard-sm cursor-pointer shrink-0"
                    >
                      {currentFunContext ? "Update Context" : "Add Context"}
                    </button>
                  </div>
                  {currentFunContext && (
                    <div className="mt-4 p-3 bg-card border-2 border-border rounded-lg text-xs text-foreground font-medium leading-relaxed font-body whitespace-pre-wrap">
                      {currentFunContext}
                    </div>
                  )}
                </div>
              )}

              {/* Analogy Style Selectors */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-foreground mb-3">
                  Select Analogy Style
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "movie" as const,
                      title: "Movie Analogy",
                      desc: "Explain syllabus concepts in terms of a feature film plot, world, or character arcs.",
                    },
                    {
                      id: "series" as const,
                      title: "Series Analogy",
                      desc: "Map course topics to the episodes, seasons, or lore of a popular web/television series.",
                    },
                    {
                      id: "superhero-fight" as const,
                      title: "Superhero Fight",
                      desc: "Break down principles using the dynamics, powers, and tactics of a battle between two heroes.",
                    },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setAnalogyType(style.id)}
                      className={`p-4 text-left border-2 rounded-xl transition-all shadow-hard-sm cursor-pointer hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-full ${
                        analogyType === style.id
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-background border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      <div>
                        <span className="block font-bold text-sm mb-1">{style.title}</span>
                        <span className="block text-xs text-muted-foreground font-medium leading-relaxed">
                          {style.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input for target name */}
              <div className="mb-6">
                <label htmlFor="targetName" className="block text-sm font-bold text-foreground mb-2">
                  Pop-Culture Analogy Target
                </label>
                <input
                  id="targetName"
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium"
                  placeholder={
                    analogyType === "movie"
                      ? "e.g., Bahubali, Harry Potter, Inception"
                      : analogyType === "series"
                      ? "e.g., Stranger Things, Game of Thrones, Dark"
                      : "e.g., Iron Man vs Batman, Thor vs Superman"
                  }
                  required
                />
              </div>

              {/* Cost-saving checkbox */}
              <div className="mb-6 flex items-start gap-3 bg-muted/40 border-2 border-dashed border-border/80 rounded-xl p-4">
                <input
                  id="includeResources"
                  type="checkbox"
                  checked={includeResources}
                  onChange={(e) => setIncludeResources(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-2 border-border accent-primary cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="includeResources" className="block text-sm font-bold text-foreground cursor-pointer">
                    Include PDFs and Videos metadata for deeper context
                  </label>
                  <p className="text-xs text-muted-foreground/80 font-medium mt-1 leading-relaxed">
                    By default, the explainer uses the context supplied by the faculty to build high-quality matches. Tick this option if you want the AI to also map the titles and descriptions of all uploaded resources, which enables deeper analysis of specific topics but increases API costs.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateExplainer}
                disabled={generating}
                style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
                className="w-full bg-primary text-primary-foreground border-2 border-border py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-hard-sm cursor-pointer font-heading text-lg flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-1" viewBox="0 0 24 24">
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
                    Generating Analogy...
                  </>
                ) : (
                  "Generate Fun Explanation"
                )}
              </button>
            </div>

            {/* Blackboard styled Canvas */}
            {(generating || explainerResult) && (
              <div
                style={{ borderRadius: "12px 12px 12px 12px" }}
                className="bg-[#12161A] border-4 border-[#BFA55A] p-6 md:p-8 shadow-hard-lg relative text-left"
              >
                <div className="flex items-center justify-between border-b border-[#BFA55A]/30 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[#B0B0B0] font-heading text-sm font-bold ml-2 tracking-wider">
                      CHALKBOARD WORKSPACE
                    </span>
                  </div>
                  {explainerResult && (
                    <span className="text-[#BFA55A] font-body text-xs font-bold bg-[#BFA55A]/10 border border-[#BFA55A]/20 px-2 py-0.5 rounded">
                      Success
                    </span>
                  )}
                </div>

                {generating && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-dashed border-[#BFA55A] rounded-full animate-spin" />
                    <p className="text-[#B0B0B0] font-body font-bold text-sm tracking-wide">
                      Writing on chalkboard... please wait.
                    </p>
                  </div>
                )}

                {explainerResult && (
                  <div className="prose prose-invert max-w-none text-[#EAEAEA] font-body text-base leading-relaxed selection:bg-[#BFA55A] selection:text-[#12161A]">
                    {parseMarkdownToReact(explainerResult)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit AI Explainer Context Dialog */}
      <Dialog
        isOpen={showEditContextDialog}
        onClose={() => !updatingContext && setShowEditContextDialog(false)}
        title={currentFunContext ? "Update AI Explainer Context" : "Add AI Explainer Context"}
        confirmText={updatingContext ? "Saving..." : "Save"}
        cancelText="Cancel"
        onConfirm={handleUpdateContext}
        onCancel={() => setShowEditContextDialog(false)}
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-muted-foreground font-medium leading-relaxed font-body">
            Provide a summary of the core scientific/engineering concepts, primary learning objectives, or key mathematical formulations taught in this subject. Keep it descriptive (do not include any emojis in the text).
          </p>
          <textarea
            value={editContextVal}
            onChange={(e) => setEditContextVal(e.target.value)}
            rows={6}
            disabled={updatingContext}
            className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none font-body font-medium"
            placeholder="e.g. This course introduces graph theory, focusing on pathfinding algorithms (Dijkstra, A*), minimum spanning trees (Kruskal, Prim), and basic topological concepts..."
          />
        </div>
      </Dialog>
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

// Custom Lightweight Markdown Parser for Chalkboard Workspace to ensure full compatibility without ESM module bugs
function parseMarkdownToReact(text: string): React.ReactNode[] {
  if (!text) return [];

  // Split by paragraphs
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs.map((para, paraIdx) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Check for Horizontal Rule
    if (trimmed === "***" || trimmed === "---" || trimmed === "___") {
      return <hr key={paraIdx} className="border-t-2 border-dashed border-[#BFA55A]/30 my-6" />;
    }

    // Check for Headings
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={paraIdx} className="text-base font-bold font-heading text-[#BFA55A] mt-5 mb-2 text-left">
          {renderInlineMarkdown(trimmed.substring(4))}
        </h3>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={paraIdx} className="text-lg font-bold font-heading text-[#BFA55A] mt-6 mb-3 text-left">
          {renderInlineMarkdown(trimmed.substring(3))}
        </h2>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h1 key={paraIdx} className="text-xl font-bold font-heading text-[#BFA55A] mt-8 mb-4 text-left">
          {renderInlineMarkdown(trimmed.substring(2))}
        </h1>
      );
    }

    // Check for List Items
    const lines = trimmed.split("\n");
    const isBulletList = lines.every(line => line.trim().startsWith("* ") || line.trim().startsWith("- ") || line.trim().startsWith("*") || line.trim().startsWith("-"));

    if (isBulletList && lines.length > 1) {
      return (
        <ul key={paraIdx} className="list-disc pl-6 mb-4 space-y-2 text-left">
          {lines.map((line, lineIdx) => {
            const cleanLine = line.trim().replace(/^[\*\-]\s*/, "");
            return <li key={lineIdx} className="font-medium text-[#EAEAEA]">{renderInlineMarkdown(cleanLine)}</li>;
          })}
        </ul>
      );
    }

    // Check for a single bullet item in the paragraph
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const cleanLine = trimmed.replace(/^[\*\-]\s*/, "");
      return (
        <ul key={paraIdx} className="list-disc pl-6 mb-4 space-y-2 text-left">
          <li className="font-medium text-[#EAEAEA]">{renderInlineMarkdown(cleanLine)}</li>
        </ul>
      );
    }

    // Check for Numbered List
    const isNumberedList = lines.every(line => /^\d+\.\s/.test(line.trim()));
    if (isNumberedList && lines.length > 1) {
      return (
        <ol key={paraIdx} className="list-decimal pl-6 mb-4 space-y-2 text-left">
          {lines.map((line, lineIdx) => {
            const cleanLine = line.trim().replace(/^\d+\.\s*/, "");
            return <li key={lineIdx} className="font-medium text-[#EAEAEA]">{renderInlineMarkdown(cleanLine)}</li>;
          })}
        </ol>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const cleanLine = trimmed.replace(/^\d+\.\s*/, "");
      return (
        <ol key={paraIdx} className="list-decimal pl-6 mb-4 space-y-2 text-left">
          <li className="font-medium text-[#EAEAEA]">{renderInlineMarkdown(cleanLine)}</li>
        </ol>
      );
    }

    // Handle normal multi-line paragraph block or individual lines
    return (
      <p key={paraIdx} className="mb-4 leading-relaxed font-medium text-[#EAEAEA] text-left">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Simple inline parser for bold (**) and italic (*)
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-extrabold text-[#BFA55A]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx} className="italic text-foreground/90">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
