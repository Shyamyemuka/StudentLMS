import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import { Profile } from "@/types/database";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get current user (if exists)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile only if user is logged in
  let profile = null;
  if (user) {
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profileError) {
      profile = userProfile;

      // If pending faculty, redirect to pending page (students skip pending approvals)
      if (profile?.role === "faculty_pending") {
        redirect("/pending-approval");
      }
    } else {
      console.error("Error fetching profile:", profileError);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header profile={profile as Profile | null} />
      <main>{children}</main>
    </div>
  );
}
