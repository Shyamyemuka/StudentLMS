import { createClient } from "@/lib/supabase/server";
import PageContainer from "@/components/layout/page-container";
import CreateCourseForm from "@/components/subjects/create-course-form";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CreateCoursePage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  // Only faculty and admin can create courses
  if (profile?.role !== "faculty" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <PageContainer
      title="Create New Course"
      subtitle="Add a new subject to the learning platform"
      showBackButton={true}
      backHref="/dashboard">
      <div className="max-w-2xl mx-auto">
        {/* Form Card */}
        <div className="bg-[#14181D] border border-[#BFA55A]/30 rounded-xl p-6 md:p-8">
          <CreateCourseForm userRole={profile?.role || "student"} />
        </div>
      </div>
    </PageContainer>
  );
}
