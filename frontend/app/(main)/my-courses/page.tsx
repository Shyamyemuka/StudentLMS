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
            className="flex items-center gap-2 bg-[#D4AF37] text-[#0B0D10] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#E6C76A] transition-colors">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#14181D] border border-[#4CAF8F]/30 rounded-lg p-4">
          <p className="text-[#707070] text-sm">Approved</p>
          <p className="text-2xl font-semibold text-[#4CAF8F]">
            {approvedCourses.length}
          </p>
        </div>
        <div className="bg-[#14181D] border border-[#D4AF37]/30 rounded-lg p-4">
          <p className="text-[#707070] text-sm">Pending</p>
          <p className="text-2xl font-semibold text-[#D4AF37]">
            {pendingCourses.length}
          </p>
        </div>
        <div className="bg-[#14181D] border border-[#C94A4A]/30 rounded-lg p-4">
          <p className="text-[#707070] text-sm">Rejected</p>
          <p className="text-2xl font-semibold text-[#C94A4A]">
            {rejectedCourses.length}
          </p>
        </div>
      </div>

      {/* Pending Courses */}
      {pendingCourses.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            Pending Approval
          </h2>
          <SubjectGrid subjects={pendingCourses} showStatus />
        </div>
      )}

      {/* Approved Courses */}
      {approvedCourses.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-[#4CAF8F] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4CAF8F]"></span>
            Approved Courses
          </h2>
          <SubjectGrid subjects={approvedCourses} showStatus />
        </div>
      )}

      {/* Rejected Courses */}
      {rejectedCourses.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-[#C94A4A] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C94A4A]"></span>
            Rejected
          </h2>
          <SubjectGrid subjects={rejectedCourses} showStatus />
        </div>
      )}

      {/* Empty State */}
      {subjects?.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#14181D] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#707070]"
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
          <p className="text-[#707070] mb-4">
            {canCreateCourse
              ? "You haven't created any courses yet"
              : "No courses available"}
          </p>
          {canCreateCourse && (
            <Link
              href="/create-course"
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#0B0D10] px-6 py-2 rounded-lg font-medium hover:bg-[#E6C76A] transition-colors">
              Create Your First Course
            </Link>
          )}
        </div>
      )}
    </PageContainer>
  );
}
