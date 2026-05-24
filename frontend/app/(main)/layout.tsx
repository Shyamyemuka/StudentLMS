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

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    redirect("/login");
  }

  // If pending (faculty or student), redirect to pending page
  if (
    profile?.role === "faculty_pending" ||
    profile?.role === "student_pending"
  ) {
    redirect("/pending-approval");
  }

  return (
    <div className="min-h-screen bg-[#0B0D10]">
      <Header profile={profile as Profile} />
      <main>{children}</main>
    </div>
  );
}
