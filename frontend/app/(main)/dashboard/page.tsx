import { createClient } from "@/lib/supabase/server";
import DashboardContent from "./dashboard-content";
import NoticeBoard from "@/components/layout/notice-board";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user (if exists)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile only if user is logged in
  let profile: any = null;
  if (user) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    profile = userProfile;
  }

  // Redirect pending faculty to pending approval page
  if (profile && profile?.role === "faculty_pending") {
    redirect("/pending-approval");
  }

  // ALL users (including guests) see all approved courses in the marketplace/dashboard
  const { data: allSubjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (subjectsError) {
    console.error("Error fetching subjects:", subjectsError);
  }

  const subjects = allSubjects || [];

  // Determine which subjects are unlocked for the current user
  let unlockedSubjectIds: number[] = [];
  if (user && profile?.role === "student") {
    // 1. Fetch assigned courses
    const { data: assignments } = await supabase
      .from("course_assignments")
      .select("subject_id")
      .eq("user_id", user.id)
      .eq("status", "active");

    // 2. Fetch paid courses
    const { data: payments } = await supabase
      .from("subject_payments")
      .select("subject_id")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const assignedIds = assignments?.map((a: any) => Number(a.subject_id)) || [];
    const paidIds = payments?.map((p: any) => Number(p.subject_id)) || [];
    
    // Combine both sources
    unlockedSubjectIds = Array.from(new Set([...assignedIds, ...paidIds]));
  } else if (user && (profile?.role === "faculty" || profile?.role === "admin")) {
    // Faculty and Admin have all subjects unlocked by default
    unlockedSubjectIds = subjects.map((s) => Number(s.id));
  } else {
    // Guest sessions have no subjects unlocked!
    unlockedSubjectIds = [];
  }

  // Get unique regulations for filter
  const regulations = [
    ...new Set(subjects.map((s) => s.regulation) || []),
  ].sort();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-heading">
              {profile ? `Welcome back, ${profile.full_name.split(" ")[0]}!` : "Welcome to Student LMS!"}
              <span className="inline-block ml-2 animate-wave">👋</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">
              {profile ? "Ready to continue your learning journey?" : "Explore our wobbly courses chalkboard marketplace!"}
            </p>
          </div>

          {/* Create Course & Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Create Course Button - Only for Faculty and Admin */}
            {profile && (profile.role === "faculty" || profile.role === "admin") && (
              <Link
                href="/create-course"
                style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                className="flex items-center gap-2 bg-primary text-primary-foreground border-[3px] border-border px-5 py-3 text-sm font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer animate-sketch-bounce"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Course
              </Link>
            )}

            {/* If guest, display a Sign In/Sign Up Callout Button */}
            {!user && (
              <Link
                href="/login"
                style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                className="bg-accent text-accent-foreground border-[3px] border-border px-5 py-3 text-sm font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                🔒 Sign In to Unlock Subjects
              </Link>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dashboard Content - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <DashboardContent
              subjects={subjects}
              regulations={regulations}
              userRole={profile?.role || "student"}
              unlockedSubjectIds={unlockedSubjectIds}
              isGuest={!user}
            />
          </div>

          {/* Notice Board - Takes up 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="h-[calc(100vh-12rem)] min-h-[400px]">
                <NoticeBoard
                  userRole={profile?.role || "student"}
                  userId={user?.id || ""}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
