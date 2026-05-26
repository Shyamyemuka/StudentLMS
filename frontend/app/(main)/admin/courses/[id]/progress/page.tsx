import { createClient } from "@/lib/supabase/server";
import PageContainer from "@/components/layout/page-container";
import { getAllStudentProgress } from "@/lib/utils/course-progress";
import StudentProgressTable from "@/components/progress/student-progress-table";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface CourseProgressPageProps {
  params: {
    id: string;
  };
}

export default async function CourseProgressPage({
  params,
}: CourseProgressPageProps) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Only admin and faculty can view this page
  if (!profile || (profile.role !== "admin" && profile.role !== "faculty")) {
    redirect("/dashboard");
  }

  const subjectId = parseInt(params.id);

  // Get subject details
  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .single();

  if (!subject) {
    return (
      <PageContainer
        title="Course Not Found"
        subtitle="The requested course could not be found"
        showBackButton
        backHref="/dashboard">
        <p className="text-muted-foreground font-bold">Course not found.</p>
      </PageContainer>
    );
  }

  // Get all student progress for this course
  let progressList: any[] = [];
  try {
    progressList = await getAllStudentProgress(supabase, subjectId);
  } catch (error) {
    console.error("Error fetching student progress:", error);
  }

  // Calculate stats
  const totalStudents = progressList.length;
  const completedStudents = progressList.filter(
    (p) => p.progress_percentage === 100,
  ).length;
  const activeStudents = progressList.filter(
    (p) => p.progress_percentage > 0 && p.progress_percentage < 100,
  ).length;
  const averageProgress =
    totalStudents > 0
      ? Math.round(
          progressList.reduce((acc, p) => acc + p.progress_percentage, 0) /
            totalStudents,
        )
      : 0;

  return (
    <PageContainer
      title={`Progress: ${subject.title}`}
      subtitle={`${subject.subject_code} - Student Progress Tracking`}
      showBackButton
      backHref={`/subjects/${subjectId}`}>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border-2 border-border rounded-xl p-4 shadow-hard-sm">
          <p className="text-muted-foreground text-sm font-bold mb-1">Total Students</p>
          <p className="text-3xl font-bold text-foreground font-heading">{totalStudents}</p>
        </div>
        <div className="bg-card border-2 border-emerald-500/40 rounded-xl p-4 shadow-hard-sm">
          <p className="text-muted-foreground text-sm font-bold mb-1">Completed</p>
          <p className="text-3xl font-bold text-emerald-500 font-heading">
            {completedStudents}
          </p>
        </div>
        <div className="bg-card border-2 border-primary/40 rounded-xl p-4 shadow-hard-sm">
          <p className="text-muted-foreground text-sm font-bold mb-1">In Progress</p>
          <p className="text-3xl font-bold text-primary font-heading">{activeStudents}</p>
        </div>
        <div className="bg-card border-2 border-secondary/40 rounded-xl p-4 shadow-hard-sm">
          <p className="text-muted-foreground text-sm font-bold mb-1">Average Progress</p>
          <p className="text-3xl font-bold text-secondary font-heading">{averageProgress}%</p>
        </div>
      </div>

      {/* Student Progress Table */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground font-heading mb-4">
          Student Progress
        </h2>
        <StudentProgressTable progressList={progressList} />
      </div>

      {/* Note */}
      <div className="bg-card border-2 border-border rounded-xl p-4 shadow-hard-sm">
        <p className="text-muted-foreground text-sm font-bold">
          <strong className="text-foreground">Note:</strong> Progress is
          calculated based on resources marked as complete by each student. Only
          students who have started the course are shown in this list.
        </p>
      </div>
    </PageContainer>
  );
}
