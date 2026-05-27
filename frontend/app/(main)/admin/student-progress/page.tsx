import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentProgressViewer } from "@/components/admin/student-progress-viewer";
import PageContainer from "@/components/layout/page-container";

export default async function StudentProgressPage() {
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
      title="Student Progress Tracking"
      subtitle="Monitor and track individual student progress across courses"
      showBackButton
      backHref="/dashboard"
    >
      <StudentProgressViewer />
    </PageContainer>
  );
}
