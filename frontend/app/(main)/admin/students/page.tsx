import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/page-container";

export default async function StudentsManagementPage() {
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
      title="Student Management"
      subtitle="Manage students, their course assignments, and track their progress"
      showBackButton
      backHref="/dashboard"
    >
      {/* Quick Actions for Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/course-assignments">
          <Card className="bg-card border-2 border-border p-6 hover:border-primary transition-colors cursor-pointer group shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors font-heading">
                  Assign Courses
                </h3>
                <p className="text-sm text-muted-foreground font-medium font-body">
                  Manage student course assignments
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/student-progress">
          <Card className="bg-card border-2 border-border p-6 hover:border-secondary transition-colors cursor-pointer group shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 border-2 border-secondary/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-secondary transition-colors font-heading">
                  Track Progress
                </h3>
                <p className="text-sm text-muted-foreground font-medium font-body">
                  Monitor student course completion
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="bg-card border-2 border-border rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
        <CardHeader>
          <CardTitle className="text-foreground font-heading">
            About Student Management
          </CardTitle>
        </CardHeader>
        <CardContent className="text-foreground/90 space-y-3 font-medium font-body">
          <p>
            This page provides centralized access to all student-related
            management functions:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong className="text-foreground">Assign Courses:</strong>{" "}
              Assign specific courses to approved students
            </li>
            <li>
              <strong className="text-foreground">Track Progress:</strong>{" "}
              Monitor individual student progress and completion rates
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground italic font-bold">
            For general user management (viewing all users, roles, etc.), use
            the &quot;Manage Users&quot; option from the main admin dashboard.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
