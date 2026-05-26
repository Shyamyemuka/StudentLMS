import { createClient } from "@/lib/supabase/server";
import PageContainer from "@/components/layout/page-container";
import SubjectGrid from "@/components/subjects/subject-grid";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user?.id)
    .single();

  // Get courses created by this user
  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("created_by", user?.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching subjects:", error);
  }

  // Group by status
  const approvedCourses =
    subjects?.filter((s) => s.status === "approved") || [];
  const pendingCourses = subjects?.filter((s) => s.status === "pending") || [];
  const rejectedCourses =
    subjects?.filter((s) => s.status === "rejected") || [];

  // Only show create course button for faculty and admin
  const canCreateCourse =
    profile?.role === "faculty" || profile?.role === "admin";

  return (
    <PageContainer
      title="My Courses"
      subtitle="Courses you have created"
      showBackButton={true}
      backHref="/dashboard"
      action={
        canCreateCourse ? (
          <Link
            href="/create-course"
            style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
            className="flex items-center gap-2 bg-primary text-primary-foreground border-2 border-border px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-hard-sm cursor-pointer">
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
            Create Course
          </Link>
        ) : undefined
      }>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 font-body font-bold">
        <div className="bg-card border-2 border-border rounded-xl p-4 shadow-hard-sm">
          <p className="text-muted-foreground text-sm">Approved</p>
          <p className="text-2xl font-black text-success">
            {approvedCourses.length}
          </p>
        </div>
        <div className="bg-card border-2 border-border rounded-xl p-4 shadow-hard-sm">
          <p className="text-muted-foreground text-sm">Pending</p>
          <p className="text-2xl font-black text-primary">
            {pendingCourses.length}
          </p>
        </div>
        <div className="bg-card border-2 border-border rounded-xl p-4 shadow-hard-sm">
          <p className="text-muted-foreground text-sm">Rejected</p>
          <p className="text-2xl font-black text-destructive">
            {rejectedCourses.length}
          </p>
        </div>
      </div>

      {/* Pending Courses */}
      {pendingCourses.length > 0 && (
        <div className="mb-12 font-heading">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary border border-border"></span>
            Pending Approval
          </h2>
          <SubjectGrid subjects={pendingCourses} showStatus />
        </div>
      )}

      {/* Approved Courses */}
      {approvedCourses.length > 0 && (
        <div className="mb-12 font-heading">
          <h2 className="text-xl font-bold text-success mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success border border-border"></span>
            Approved Courses
          </h2>
          <SubjectGrid subjects={approvedCourses} showStatus />
        </div>
      )}

      {/* Rejected Courses */}
      {rejectedCourses.length > 0 && (
        <div className="mb-12 font-heading">
          <h2 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-destructive border border-border"></span>
            Rejected
          </h2>
          <SubjectGrid subjects={rejectedCourses} showStatus />
        </div>
      )}

      {/* Empty State */}
      {subjects?.length === 0 && (
        <div className="text-center py-16 font-body font-bold">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-hard-sm">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <p className="text-muted-foreground mb-4">
            {canCreateCourse
              ? "You haven't created any courses yet"
              : "No courses available"}
          </p>
          {canCreateCourse && (
            <Link
              href="/create-course"
              style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-2 border-border px-6 py-2 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-hard-sm cursor-pointer">
              Create Your First Course
            </Link>
          )}
        </div>
      )}
    </PageContainer>
  );
}
