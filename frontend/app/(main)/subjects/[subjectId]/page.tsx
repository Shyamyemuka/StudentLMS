import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import SubjectContent from "@/components/subjects/subject-content";
import SubjectLockOverlay from "@/components/subjects/subject-lock-overlay";

export const dynamic = "force-dynamic";

interface SubjectPageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subjectId } = await params;
  const subjectIdNum = parseInt(subjectId, 10);

  if (isNaN(subjectIdNum)) {
    notFound();
  }

  const supabase = await createClient();

  // Get current user and session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/subjects/" + subjectId);
  }

  // Fetch data in parallel for better performance
  const [
    { data: profile },
    { data: subject, error },
    { data: videos },
    { data: pdfs },
    { data: notes },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase
      .from("subjects")
      .select("id, title, subject_code, regulation, description, price, access_duration_months, certificate_enabled")
      .eq("id", subjectIdNum)
      .single(),
    supabase
      .from("resources")
      .select("*")
      .eq("subject_id", subjectIdNum)
      .eq("approved", true)
      .eq("type", "video")
      .order("created_at", { ascending: false }),
    supabase
      .from("resources")
      .select("*")
      .eq("subject_id", subjectIdNum)
      .eq("approved", true)
      .eq("type", "pdf")
      .order("created_at", { ascending: false }),
    supabase
      .from("resources")
      .select("*")
      .eq("subject_id", subjectIdNum)
      .eq("approved", true)
      .eq("type", "notes")
      .order("created_at", { ascending: false }),
  ]);

  if (error || !subject) {
    notFound();
  }

  // PAID GATEKEEPING CHECKS:
  // - Admin and Faculty have access to all subjects by default.
  // - Students have access if they have an active assignment record or a completed purchase.
  let isUnlocked = false;

  if (profile?.role === "admin" || profile?.role === "faculty") {
    isUnlocked = true;
  } else {
    // Check assignments
    const { data: assignments } = await supabase
      .from("course_assignments")
      .select("id")
      .eq("user_id", user.id)
      .eq("subject_id", subjectIdNum)
      .eq("status", "active");

    const hasAssignment = assignments && assignments.length > 0;

    // Check payments
    const { data: payments } = await supabase
      .from("subject_payments")
      .select("id")
      .eq("user_id", user.id)
      .eq("subject_id", subjectIdNum)
      .eq("status", "completed");

    const hasPaid = payments && payments.length > 0;

    isUnlocked = !!(hasAssignment || hasPaid);
  }

  return (
    <PageContainer showBackButton backHref="/dashboard">
      {/* Subject Header Card */}
      <div 
        className="bg-card border-2 border-border rounded-xl p-6 md:p-8 mb-8 shadow-hard-md relative"
      >
        <div className="tape-decor" />
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pt-4">
          <div>
            {/* Subject Code Badge */}
            <div className="inline-block px-3 py-1 bg-secondary/15 text-secondary border border-secondary/30 rounded-md text-sm font-bold mb-3">
              {subject.subject_code}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 font-heading">
              {subject.title}
            </h1>

            {/* Regulation */}
            <div className="flex items-center gap-4 text-muted-foreground font-bold text-sm">
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-border"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Regulation: {subject.regulation}
              </span>
            </div>

            {/* Description */}
            {subject.description && (
              <p className="text-foreground/90 mt-4 max-w-2xl font-medium text-base leading-relaxed font-body">
                {subject.description}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 shrink-0 font-bold">
            <div 
              className="text-center px-4 py-3 bg-background border-2 border-border rounded-xl shadow-hard-sm"
            >
              <p className="text-2xl font-bold text-primary">
                {videos?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground font-bold">Videos</p>
            </div>
            <div 
              className="text-center px-4 py-3 bg-background border-2 border-border rounded-xl shadow-hard-sm"
            >
              <p className="text-2xl font-bold text-primary">
                {pdfs?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground font-bold">PDFs</p>
            </div>
            <div 
              className="text-center px-4 py-3 bg-background border-2 border-border rounded-xl shadow-hard-sm"
            >
              <p className="text-2xl font-bold text-primary">
                {notes?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground font-bold">Notes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (Blurred if locked, showing buy dashboard in center) */}
      <div className="relative">
        {!isUnlocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
            <SubjectLockOverlay
              subjectId={subjectIdNum}
              subjectTitle={subject.title}
              userId={user.id}
              userEmail={user.email || ""}
              userName={profile?.full_name || "Student"}
              subjectPrice={subject.price}
              subjectDuration={subject.access_duration_months}
            />
          </div>
        )}

        <div className={!isUnlocked ? "filter blur-md opacity-35 select-none pointer-events-none" : ""}>
          <SubjectContent
            subjectId={subjectIdNum}
            initialVideos={videos || []}
            initialPdfs={pdfs || []}
            initialNotes={notes || []}
            userRole={profile?.role || "student"}
            initialCertificateEnabled={subject.certificate_enabled}
            studentName={profile?.full_name || "Student"}
            courseName={subject.title}
          />
        </div>
      </div>
    </PageContainer>
  );
}
