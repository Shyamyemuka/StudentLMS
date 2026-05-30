"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageContainer from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  CheckCircle,
  Award,
  Sparkles,
  User,
  ThumbsUp,
  AlertTriangle,
  PenTool,
  Check,
  Eye,
  EyeOff,
  Unlock,
  Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface AssignmentQuestion {
  id: number;
  question_text: string;
  ideal_answer: string;
  max_score: number;
}

interface Assignment {
  id: number;
  subject_id: number;
  title: string;
  questions: AssignmentQuestion[];
  max_score: number;
  created_at: string;
}

interface Submission {
  id: number;
  assignment_id: number;
  student_id: string;
  answers: Record<number, string>; // Maps question ID to answer
  score: number | null;
  feedback: string | null;
  ai_analysis: {
    questions: Record<number, {
      score: number;
      feedback: string;
      strengths: string[];
      areas_for_improvement: string[];
      accuracy_score: number;
      completeness_score: number;
      grammar_score: number;
    }>;
  } | null;
  status: "submitted" | "graded";
  marks_published: boolean;
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
  profiles?: Profile; // Enriched student profile
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.subjectId as string;
  const assignmentId = params.assignmentId as string;
  const assignmentIdNum = parseInt(assignmentId, 10);

  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  
  // Student state
  const [studentSubmission, setStudentSubmission] = useState<Submission | null>(null);
  const [answersInput, setAnswersInput] = useState<Record<number, string>>({});
  const [activeQuestionTab, setActiveQuestionTab] = useState<number>(1);
  
  // Faculty state
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showIdealAnswersMap, setShowIdealAnswersMap] = useState<Record<number, boolean>>({});
  
  // Faculty Grading override state
  const [scoreOverride, setScoreOverride] = useState("");
  const [feedbackOverride, setFeedbackOverride] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (isNaN(assignmentIdNum)) {
      router.push(`/subjects/${subjectId}/assignments`);
      return;
    }
    fetchData();
  }, [assignmentIdNum]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirectTo=/subjects/${subjectId}/assignments/${assignmentId}`);
        return;
      }

      setCurrentUserId(user.id);

      // Fetch user profile to check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const userRole = profile?.role || "student";
      setRole(userRole);

      // Fetch assignment info
      const { data: assignmentData, error: assError } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", assignmentIdNum)
        .single();

      if (assError || !assignmentData) {
        toast.error("Assignment not found");
        router.push(`/subjects/${subjectId}`);
        return;
      }

      setAssignment(assignmentData);

      if (userRole === "admin" || userRole === "faculty") {
        // Faculty View: Fetch all submissions
        const { data: subsData, error: subsError } = await supabase
          .from("assignment_submissions")
          .select("*, profiles:student_id(user_id, full_name, avatar_url)")
          .eq("assignment_id", assignmentIdNum)
          .order("submitted_at", { ascending: false });

        if (subsError) throw subsError;
        setAllSubmissions(subsData || []);
      } else {
        // Student View: Fetch own submission
        const { data: subData } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("assignment_id", assignmentIdNum)
          .eq("student_id", user.id)
          .maybeSingle();

        if (subData) {
          setStudentSubmission(subData);
          // Load existing answers
          const savedAnswers: Record<number, string> = {};
          Object.keys(subData.answers || {}).forEach((k) => {
            savedAnswers[parseInt(k, 10)] = subData.answers[k];
          });
          setAnswersInput(savedAnswers);
        }
      }
    } catch (err: any) {
      console.error("Error loading assignment details:", err);
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    // Validate that all questions are answered
    for (const q of assignment.questions) {
      if (!answersInput[q.id]?.trim()) {
        toast.error(`Please answer Question ${q.id} before submitting.`);
        return;
      }
    }

    setEvaluating(true);
    try {
      console.log("Submitting student answers for AI evaluation...");
      const response = await fetch("/api/assignments/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: assignmentIdNum,
          answers: answersInput,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "AI evaluation failed");
      }

      const resData = await response.json();
      if (resData.success) {
        toast.success("AI Grading completed. Worksheet submitted successfully.");
        setStudentSubmission(resData.submission);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err?.message || "Evaluation failed. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handlePublishMarks = async (submission: Submission, publishState: boolean) => {
    setPublishing(true);
    try {
      const { data: updatedSub, error } = await supabase
        .from("assignment_submissions")
        .update({
          marks_published: publishState,
        })
        .eq("id", submission.id)
        .select("*, profiles:student_id(user_id, full_name, avatar_url)")
        .single();

      if (error) throw error;

      // Notify the student
      if (publishState) {
        await supabase.from("notifications").insert({
          user_id: submission.student_id,
          type: "enrollment",
          title: "Marks Released! 🏆",
          message: `Grades have been published for worksheet "${assignment?.title}". Click here to view details.`,
          link: `/subjects/${subjectId}/assignments/${assignment?.id}`,
        });
      }

      toast.success(publishState ? "Grades released to student." : "Grades hidden from student.");
      
      // Update local feeds
      setAllSubmissions(allSubmissions.map((s) => (s.id === submission.id ? updatedSub : s)));
      setSelectedSubmission(updatedSub);
    } catch (err: any) {
      console.error("Publishing error:", err);
      toast.error("Failed to alter publication state");
    } finally {
      setPublishing(false);
    }
  };

  const selectSubmissionForGrading = (sub: Submission) => {
    setSelectedSubmission(sub);
    setScoreOverride(sub.score?.toString() || "");
    setFeedbackOverride(sub.feedback || "");
  };

  const handleFacultySubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !assignment) return;

    const finalScore = parseFloat(scoreOverride);
    if (isNaN(finalScore) || finalScore < 0 || finalScore > assignment.max_score) {
      toast.error(`Please enter a valid score between 0 and ${assignment.max_score}`);
      return;
    }

    setGrading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: updatedSub, error } = await supabase
        .from("assignment_submissions")
        .update({
          score: finalScore,
          feedback: feedbackOverride.trim(),
          status: "graded",
          graded_at: new Date().toISOString(),
          graded_by: user?.id,
        })
        .eq("id", selectedSubmission.id)
        .select("*, profiles:student_id(user_id, full_name, avatar_url)")
        .single();

      if (error) throw error;

      toast.success("Review score and comments logged successfully.");
      
      // Update local list
      setAllSubmissions(
        allSubmissions.map((s) => (s.id === selectedSubmission.id ? updatedSub : s))
      );
      setSelectedSubmission(updatedSub);
    } catch (err: any) {
      console.error("Grading overrides save error:", err);
      toast.error(err?.message || "Failed to save review");
    } finally {
      setGrading(false);
    }
  };

  if (!assignment) {
    return (
      <PageContainer title="Error" showBackButton backHref={`/subjects/${subjectId}`}>
        <div className="text-center py-12 text-muted-foreground font-bold font-body">
          Worksheet could not be loaded.
        </div>
      </PageContainer>
    );
  }

  const isFacultyOrAdmin = role === "admin" || role === "faculty";
  const hasSubmitted = !!studentSubmission;
  const isMarksPublished = studentSubmission?.marks_published;

  return (
    <PageContainer
      title={assignment.title}
      subtitle="Worksheet Workspace"
      showBackButton
      backHref={`/subjects/${subjectId}`}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Worksheet & Inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STUDENT WORKSPACE FLOW */}
          {!isFacultyOrAdmin && (
            <>
              {/* Unsubmitted Form: Answering multiple questions */}
              {!hasSubmitted ? (
                <Card className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
                      <PenTool className="w-5 h-5 text-primary" />
                      Write Worksheet Answers
                    </h3>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold font-body">
                      Total points: {assignment.max_score}
                    </span>
                  </div>

                  {/* Question Index Navigator */}
                  <div className="flex flex-wrap gap-2">
                    {assignment.questions.map((q, idx) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setActiveQuestionTab(q.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
                          activeQuestionTab === q.id
                            ? "bg-primary text-primary-foreground border-border"
                            : "bg-muted text-muted-foreground border-transparent hover:border-border"
                        }`}
                      >
                        Q{idx + 1} ({q.max_score}pts)
                      </button>
                    ))}
                  </div>

                  {/* Question Details and Answer fields */}
                  {assignment.questions.map((q, idx) => {
                    if (q.id !== activeQuestionTab) return null;

                    return (
                      <div key={q.id} className="space-y-4 font-body animate-fadeIn">
                        {/* Question description */}
                        <div className="bg-muted/40 p-4 border border-border/80 rounded-xl relative">
                          <span className="absolute -top-3 left-4 px-2 py-0.5 bg-primary text-primary-foreground border border-border text-[9px] rounded-full font-bold">
                            Question Prompt
                          </span>
                          <p className="text-foreground/90 font-medium text-sm pt-1 whitespace-pre-wrap leading-relaxed">
                            {q.question_text}
                          </p>
                        </div>

                        {/* Textarea answer input */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Your Answer response</label>
                          <textarea
                            placeholder="Write your answer explanation response here..."
                            value={answersInput[q.id] || ""}
                            onChange={(e) =>
                              setAnswersInput({ ...answersInput, [q.id]: e.target.value })
                            }
                            rows={10}
                            disabled={evaluating}
                            className="w-full bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl p-4 focus:border-primary focus:outline-none font-bold font-body resize-none"
                          />
                        </div>
                      </div>
                    );
                  })}

                  <form onSubmit={handleStudentSubmit} className="pt-2 border-t border-border/40 flex justify-between gap-4">
                    {/* Left/Right navigator shortcuts */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const idx = assignment.questions.findIndex((q) => q.id === activeQuestionTab);
                          if (idx > 0) setActiveQuestionTab(assignment.questions[idx - 1].id);
                        }}
                        className="bg-transparent border-2 border-border text-muted-foreground font-bold rounded-xl cursor-pointer"
                        disabled={assignment.questions.findIndex((q) => q.id === activeQuestionTab) === 0}
                      >
                        Previous Q
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const idx = assignment.questions.findIndex((q) => q.id === activeQuestionTab);
                          if (idx < assignment.questions.length - 1)
                            setActiveQuestionTab(assignment.questions[idx + 1].id);
                        }}
                        className="bg-transparent border-2 border-border text-muted-foreground font-bold rounded-xl cursor-pointer"
                        disabled={
                          assignment.questions.findIndex((q) => q.id === activeQuestionTab) ===
                          assignment.questions.length - 1
                        }
                      >
                        Next Q
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      disabled={evaluating}
                      className="bg-primary text-primary-foreground border-2 border-border rounded-xl font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {evaluating ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin text-primary-foreground" />
                          AI Evaluator Grading Worksheet...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                          Submit Worksheet for AI evaluation
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              ) : (
                /* Submitted Read-Only Dashboard */
                <div className="space-y-6">
                  {/* Lock illustration if grades are NOT released */}
                  {!isMarksPublished ? (
                    <Card className="bg-card border-2 border-border rounded-xl p-8 text-center shadow-hard-md space-y-4">
                      <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center text-3xl mx-auto animate-sketch-bounce">
                        🔒
                      </div>
                      <h3 className="text-xl font-bold text-foreground font-heading">
                        Worksheet Answers Logged Successfully
                      </h3>
                      <p className="text-muted-foreground text-sm font-bold max-w-lg mx-auto font-body leading-relaxed">
                        Your answers have been uploaded and analyzed by our AI Assistant. Once your course instructor releases the worksheet scores, your final points, AI assessment reports, and grammar analytics will be visible here.
                      </p>
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold font-body">
                          Awaiting Instructor Release
                        </span>
                      </div>
                    </Card>
                  ) : (
                    /* Graded Details Feed (Marks Published) */
                    <Card className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <h3 className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          Graded Worksheet Feed
                        </h3>
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-xs font-bold">
                          Final Grade Released
                        </span>
                      </div>

                      {/* Question selection Tabs for review */}
                      <div className="flex flex-wrap gap-2 font-body">
                        {assignment.questions.map((q, idx) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setActiveQuestionTab(q.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
                              activeQuestionTab === q.id
                                ? "bg-primary text-primary-foreground border-border"
                                : "bg-muted text-muted-foreground border-transparent hover:border-border"
                            }`}
                          >
                            Q{idx + 1} Grade
                          </button>
                        ))}
                      </div>

                      {assignment.questions.map((q, idx) => {
                        if (q.id !== activeQuestionTab) return null;
                        const qAnalysis = studentSubmission.ai_analysis?.questions?.[q.id];

                        return (
                          <div key={q.id} className="space-y-4 font-body animate-fadeIn">
                            {/* Question prompt */}
                            <div className="bg-muted/40 p-4 border border-border/80 rounded-xl relative">
                              <span className="absolute -top-3 left-4 px-2 py-0.5 bg-primary text-primary-foreground border border-border text-[9px] rounded-full font-bold">
                                Question {idx + 1} Prompt
                              </span>
                              <p className="text-foreground/90 font-medium text-sm pt-1 whitespace-pre-wrap leading-relaxed">
                                {q.question_text}
                              </p>
                            </div>

                            {/* Student Answer */}
                            <div className="bg-background border-2 border-border p-4 rounded-xl">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Your Answer response</span>
                              <p className="text-foreground text-sm font-medium pt-1 whitespace-pre-wrap leading-relaxed">
                                {studentSubmission.answers[q.id]}
                              </p>
                            </div>

                            {/* AI Analysis per question */}
                            {qAnalysis && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/20">
                                {/* Details feedback */}
                                <div className="space-y-3 bg-muted/20 p-4 border border-border/40 rounded-xl">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                                      <Sparkles className="w-3.5 h-3.5" /> AI Feedback
                                    </span>
                                    <span className="text-xs font-bold text-primary">
                                      Grade: {qAnalysis.score} / {q.max_score}pts
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                    {qAnalysis.feedback}
                                  </p>
                                </div>

                                {/* Strengths / Improvements */}
                                <div className="space-y-3 bg-muted/20 p-4 border border-border/40 rounded-xl text-xs">
                                  <div className="space-y-1.5">
                                    <span className="font-extrabold text-emerald-500 uppercase tracking-wide flex items-center gap-1.5">
                                      ✓ Strengths
                                    </span>
                                    <ul className="space-y-1">
                                      {qAnalysis.strengths.map((str, i) => (
                                        <li key={i} className="font-medium text-foreground leading-relaxed flex items-start gap-1">
                                          <span>•</span> <span>{str}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="space-y-1.5 pt-1.5 border-t border-border/40">
                                    <span className="font-extrabold text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                                      • Areas of Improvement
                                    </span>
                                    <ul className="space-y-1">
                                      {qAnalysis.areas_for_improvement.map((imp, i) => (
                                        <li key={i} className="font-medium text-foreground leading-relaxed flex items-start gap-1">
                                          <span>•</span> <span>{imp}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Card>
                  )}
                </div>
              )}
            </>
          )}

          {/* FACULTY SUBMISSIONS TABLE FLOW */}
          {isFacultyOrAdmin && (
            <Card className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground font-heading">
                  Student Submissions
                </h3>
                <span className="px-2.5 py-0.5 bg-muted text-muted-foreground border-2 border-border rounded-lg text-xs font-bold font-body">
                  Total: {allSubmissions.length}
                </span>
              </div>

              {allSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-bold font-body">
                  No students have submitted answers yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body">
                    <thead>
                      <tr className="border-b-2 border-border text-xs text-muted-foreground uppercase font-bold">
                        <th className="pb-3 pl-2">Student Name</th>
                        <th className="pb-3">Submit Date</th>
                        <th className="pb-3 text-center">Score</th>
                        <th className="pb-3 text-center">Visibility</th>
                        <th className="pb-3 pr-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border/20 text-sm font-bold">
                      {allSubmissions.map((sub) => (
                        <tr
                          key={sub.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            selectedSubmission?.id === sub.id ? "bg-muted/40" : ""
                          }`}
                        >
                          <td className="py-3 pl-2 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                              {sub.profiles?.avatar_url ? (
                                <img
                                  src={sub.profiles.avatar_url}
                                  alt="avatar"
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-foreground truncate max-w-[120px]">
                              {sub.profiles?.full_name || "Unknown Student"}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground text-xs font-bold">
                            {formatDate(sub.submitted_at)}
                          </td>
                          <td className="py-3 text-center font-bold">
                            {sub.score !== null ? (
                              <span className="text-primary">{sub.score}</span>
                            ) : (
                              <span className="text-muted-foreground/60">-</span>
                            )}
                            <span className="text-muted-foreground/60 text-xs">/{assignment.max_score}</span>
                          </td>
                          <td className="py-3 text-center">
                            {sub.marks_published ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[10px]">
                                Released
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[10px]">
                                Hidden
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <button
                              onClick={() => selectSubmissionForGrading(sub)}
                              className="text-xs bg-muted hover:bg-muted/80 text-foreground border-2 border-border px-3 py-1 rounded-xl shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
                            >
                              Assess
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column: AI Analysis Report / Grading Override Dashboard */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* STUDENT VIEW - GENERAL SUBMISSION METRICS CARD (Only if marks are published!) */}
          {!isFacultyOrAdmin && hasSubmitted && (
            <>
              {isMarksPublished ? (
                <Card className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md space-y-6 sticky top-8">
                  {/* Score Display Header */}
                  <div className="text-center pb-4 border-b-2 border-border">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border-2 border-primary/20 rounded-full text-2xl mb-2">
                      🎖️
                    </div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase font-body tracking-wide">
                      {studentSubmission.status === "graded" ? "Final Worksheet Score" : "Suggested AI Score"}
                    </h4>
                    <p className="text-4xl font-extrabold text-primary font-heading mt-1">
                      {studentSubmission.score} <span className="text-base font-bold text-muted-foreground/60">/ {assignment.max_score}</span>
                    </p>
                    {studentSubmission.status === "graded" && (
                      <span className="inline-block mt-2 px-3 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold">
                        ✓ Reviewed by Faculty
                      </span>
                    )}
                  </div>

                  {/* General Feedback Comments */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 font-body">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Overall Feedback Summary
                    </h5>
                    <p className="text-foreground text-xs font-medium font-body bg-background border border-border p-3 rounded-xl leading-relaxed">
                      {studentSubmission.feedback}
                    </p>
                  </div>
                </Card>
              ) : null}
            </>
          )}

          {/* FACULTY VIEW - INSTRUCTOR GRADING OVERLAY */}
          {isFacultyOrAdmin && (
            <div className="space-y-6 sticky top-8">
              
              {/* Grading override form */}
              {selectedSubmission ? (
                <Card className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md space-y-6">
                  {/* Submission student details */}
                  <div className="pb-3 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {selectedSubmission.profiles?.avatar_url ? (
                          <img
                            src={selectedSubmission.profiles.avatar_url}
                            alt="avatar"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                      </div>
                      <div className="min-w-0 font-body">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {selectedSubmission.profiles?.full_name || "Student"}
                        </h4>
                        <p className="text-[9px] text-muted-foreground/80 font-bold">
                          Submitted: {formatDate(selectedSubmission.submitted_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Marks Release / Visibility Control */}
                  <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-2 font-body text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>Student Grade Release</span>
                      <span>
                        {selectedSubmission.marks_published ? (
                          <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                            <Unlock className="w-3.5 h-3.5" /> Released
                          </span>
                        ) : (
                          <span className="text-amber-500 font-extrabold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Hidden
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold">
                      Control whether this student can see their score feedback details.
                    </p>
                    <div className="pt-1">
                      {selectedSubmission.marks_published ? (
                        <Button
                          type="button"
                          onClick={() => handlePublishMarks(selectedSubmission, false)}
                          disabled={publishing}
                          className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-[10px] font-bold p-1 cursor-pointer"
                        >
                          Hide Grades from Student
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handlePublishMarks(selectedSubmission, true)}
                          disabled={publishing}
                          className="w-full bg-emerald-500 text-white border-2 border-border rounded-lg text-[10px] font-bold p-1 shadow-hard-sm cursor-pointer hover:scale-[1.01]"
                        >
                          Release Grades to Student
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Worksheet answers scrolling drawer */}
                  <div className="space-y-3 font-body">
                    <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                      Answers Sheet
                    </label>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {assignment.questions.map((q, idx) => {
                        const showIdeal = showIdealAnswersMap[q.id];
                        const qAnalysis = selectedSubmission.ai_analysis?.questions?.[q.id];

                        return (
                          <div key={q.id} className="p-3 bg-background border border-border rounded-xl space-y-2">
                            <div className="flex justify-between items-center border-b border-border/40 pb-1.5 text-[10px] font-bold text-muted-foreground">
                              <span>Q{idx + 1} response ({q.max_score}pts)</span>
                              {qAnalysis && <span className="text-primary">Suggested AI: {qAnalysis.score}pts</span>}
                            </div>
                            
                            <p className="text-[10px] text-foreground/80 font-bold whitespace-pre-wrap leading-relaxed italic">
                              "{q.question_text}"
                            </p>

                            <div className="text-[11px] font-medium leading-relaxed text-foreground whitespace-pre-wrap bg-muted/20 p-2 border border-border/20 rounded-lg">
                              {selectedSubmission.answers[q.id] || "No answer submitted."}
                            </div>

                            {/* Ideal reveal */}
                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowIdealAnswersMap({
                                    ...showIdealAnswersMap,
                                    [q.id]: !showIdeal,
                                  })
                                }
                                className="text-[9px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                              >
                                {showIdeal ? "Hide Ideal Answer" : "Reveal Ideal Answer"}
                              </button>
                              {showIdeal && (
                                <p className="mt-1 text-[10px] text-muted-foreground bg-muted/40 p-2 border border-border/20 rounded leading-relaxed whitespace-pre-wrap font-medium">
                                  {q.ideal_answer}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Override Review form */}
                  <form onSubmit={handleFacultySubmitGrade} className="space-y-4 pt-3 border-t border-border/40">
                    <div className="space-y-1.5 font-body">
                      <label className="text-xs font-bold text-foreground">Final worksheet Score</label>
                      <Input
                        type="number"
                        placeholder={`Suggested Total: ${selectedSubmission.score}`}
                        value={scoreOverride}
                        onChange={(e) => setScoreOverride(e.target.value)}
                        className="bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl focus:border-primary focus:outline-none font-bold text-sm"
                        disabled={grading}
                        required
                      />
                      <span className="text-[9px] text-muted-foreground font-bold">Max points limit: {assignment.max_score}</span>
                    </div>

                    <div className="space-y-1.5 font-body">
                      <label className="text-xs font-bold text-foreground">Instructor Feedback Comments</label>
                      <textarea
                        placeholder="Provide overall feedback..."
                        value={feedbackOverride}
                        onChange={(e) => setFeedbackOverride(e.target.value)}
                        rows={4}
                        className="w-full bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl p-3 focus:border-primary focus:outline-none text-xs font-bold font-body resize-none"
                        disabled={grading}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={grading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-border rounded-xl font-bold shadow-hard-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs p-2.5"
                    >
                      {grading ? "Saving Review..." : "Confirm Grade & Feedback"}
                    </Button>
                  </form>
                </Card>
              ) : (
                <Card className="bg-card border-2 border-border rounded-xl p-8 text-center shadow-hard-sm">
                  <PenTool className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs font-bold text-muted-foreground font-body">
                    Select a student submission from the list to assess, publish grades, and override final scores.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
