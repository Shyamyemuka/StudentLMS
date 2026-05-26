import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseAssignmentManager } from "@/components/admin/course-assignment-manager";
import PageContainer from "@/components/layout/page-container";

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
    <PageContainer
      title="Assigning Courses"
      subtitle="Assign courses to students and manage their access"
      showBackButton
      backHref="/admin/students"
    >
      <CourseAssignmentManager />
    </PageContainer>
  );
}
