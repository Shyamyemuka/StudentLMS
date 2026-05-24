import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import UserManagement from "@/components/admin/user-management";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
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

  // Only allow admin
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <PageContainer showBackButton backHref="/admin">
      <div className="max-w-7xl mx-auto">
        <UserManagement />
      </div>
    </PageContainer>
  );
}
