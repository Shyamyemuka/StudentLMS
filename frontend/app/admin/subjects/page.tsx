import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import SubjectManagement from "@/components/admin/subject-management";

export const dynamic = "force-dynamic";

export default async function SubjectManagementPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // Only allow faculty and admin
  if (profile?.role !== "faculty" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <PageContainer showBackButton backHref="/dashboard">
      <div className="max-w-6xl mx-auto">
        <SubjectManagement />
      </div>
    </PageContainer>
  );
}
