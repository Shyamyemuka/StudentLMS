import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { FileText, Plus, CheckCircle, Clock, Award } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AssignmentsListPageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function AssignmentsListPage({
  params,
}: AssignmentsListPageProps) {
  const { subjectId } = await params;
  const subjectIdNum = parseInt(subjectId, 10);

  if (isNaN(subjectIdNum)) {
    notFound();
  }

  const supabase = await createClient();

  // Get current user and profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/subjects/${subjectId}/assignments`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const isFacultyOrAdmin =
    profile?.role === "admin" || profile?.role === "faculty";

  // Fetch subject details
  const { data: subject, error: subError } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectIdNum)
    .single();

  if (subError || !subject) {
    notFound();
  }

  // Fetch assignments
  const { data: assignments, error: assError } = await supabase
    .from("assignments")
    .select("*")
    .eq("subject_id", subjectIdNum)
    .order("created_at", { ascending: false });

  // Fetch student's submissions if they are a student
  let submissionsMap: Record<number, any> = {};
  let submissionCountsMap: Record<number, number> = {};

  if (!isFacultyOrAdmin) {
    const { data: studentSubmissions } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("student_id", user.id);

    (studentSubmissions || []).forEach((sub) => {
      submissionsMap[sub.assignment_id] = sub;
    });
  } else {
    // If faculty or admin, fetch count of submissions for each assignment
    const { data: allSubmissions } = await supabase
      .from("assignment_submissions")
      .select("assignment_id");

    (allSubmissions || []).forEach((sub) => {
      submissionCountsMap[sub.assignment_id] =
        (submissionCountsMap[sub.assignment_id] || 0) + 1;
    });
  }

  return (
    <PageContainer
      title="Assignments"
      subtitle={`${subject.subject_code} - ${subject.title}`}
      showBackButton
      backHref={`/subjects/${subjectId}`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Creation Option */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">
              Course Worksheets
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              Submit your answers and get instant evaluation
            </p>
          </div>
          {isFacultyOrAdmin && (
            <Link
              href={`/subjects/${subjectId}/assignments/create`}
              style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-2 border-border px-4 py-2.5 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-hard-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </Link>
          )}
        </div>

        {/* Assignments List */}
        {!assignments || assignments.length === 0 ? (
          <Card className="bg-card border-2 border-border rounded-xl p-12 text-center shadow-hard-md">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground font-heading mb-1">
              No assignments posted yet
            </h3>
            <p className="text-muted-foreground text-sm font-bold">
              {isFacultyOrAdmin
                ? "Click the button above to post your first assignment sheet."
                : "Check back later! Faculty has not published any worksheets for this course."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submission = submissionsMap[assignment.id];
              const submissionCount = submissionCountsMap[assignment.id] || 0;

              return (
                <Card
                  key={assignment.id}
                  className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md hover:border-primary transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground font-heading">
                          {assignment.title}
                        </h3>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold">
                          Max Score: {assignment.max_score} pts
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm font-medium line-clamp-2">
                        {assignment.description}
                      </p>
                      <p className="text-xs text-muted-foreground/60 font-bold">
                        Created on {formatDate(assignment.created_at)}
                      </p>
                    </div>

                    {/* Action Block */}
                    <div className="flex items-center md:self-center shrink-0">
                      {isFacultyOrAdmin ? (
                        <div className="flex flex-col md:items-end gap-2">
                          <span className="text-sm font-bold text-foreground bg-muted border-2 border-border px-3 py-1 rounded-xl">
                            👥 {submissionCount} Submission{submissionCount !== 1 ? "s" : ""}
                          </span>
                          <Link
                            href={`/subjects/${subjectId}/assignments/${assignment.id}`}
                            className="inline-flex items-center justify-center bg-secondary/10 hover:bg-secondary/20 text-secondary border-2 border-secondary/30 px-4 py-1.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-hard-sm cursor-pointer"
                          >
                            View Submissions
                          </Link>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {submission ? (
                            <div className="flex flex-col items-end gap-2">
                              {submission.status === "graded" ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-bold">
                                  <Award className="w-3.5 h-3.5" />
                                  Graded: {submission.score} / {assignment.max_score}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold">
                                  <Clock className="w-3.5 h-3.5" />
                                  Grading Assistance Pending
                                </div>
                              )}
                              <Link
                                href={`/subjects/${subjectId}/assignments/${assignment.id}`}
                                className="inline-flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground border-2 border-border px-4 py-1.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-hard-sm cursor-pointer"
                              >
                                View Details
                              </Link>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold">
                                ❌ Not Submitted
                              </div>
                              <Link
                                href={`/subjects/${subjectId}/assignments/${assignment.id}`}
                                className="inline-flex items-center justify-center bg-primary text-primary-foreground border-2 border-border px-4 py-1.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-hard-sm cursor-pointer"
                              >
                                Write Answer
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
