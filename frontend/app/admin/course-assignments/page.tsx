import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseAssignmentManager } from "@/components/admin/course-assignment-manager";
import Link from "next/link";

export default async function CourseAssignmentsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Check if user is admin or faculty
  if (!profile || (profile.role !== "admin" && profile.role !== "faculty")) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0B0D10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-[#B0B0B0] hover:text-[#D4AF37] transition-colors mb-6">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Student Management
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#EAEAEA]">
            Assigning Courses
          </h1>
          <p className="text-[#B0B0B0] mt-2">
            Assign courses to students and manage their access
          </p>
        </div>

        {/* Course Assignment Manager Component */}
        <CourseAssignmentManager />
      </div>
    </div>
  );
}
