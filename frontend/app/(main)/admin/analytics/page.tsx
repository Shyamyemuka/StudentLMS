import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

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

  // Only admins can access analytics
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return <AnalyticsDashboard />;
}
