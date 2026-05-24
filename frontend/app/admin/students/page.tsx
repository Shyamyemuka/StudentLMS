import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="min-h-screen bg-[#0B0D10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[#B0B0B0] hover:text-[#D4AF37] transition-colors mb-6">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#EAEAEA]">
            Student Management
          </h1>
          <p className="text-[#B0B0B0] mt-2">
            Manage students, their course assignments, and track their progress
          </p>
        </div>

        {/* Quick Actions for Students */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/student-registrations">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#4CAF8F] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#4CAF8F]/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#4CAF8F]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#EAEAEA] group-hover:text-[#4CAF8F] transition-colors">
                    Approve Students
                  </h3>
                  <p className="text-sm text-[#707070]">
                    Review pending registrations
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/course-assignments">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#D4AF37] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#D4AF37]"
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
                  <h3 className="text-lg font-semibold text-[#EAEAEA] group-hover:text-[#D4AF37] transition-colors">
                    Assign Courses
                  </h3>
                  <p className="text-sm text-[#707070]">
                    Manage course assignments
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/student-progress">
            <Card className="bg-[#14181D] border-[#2A2F35] p-6 hover:border-[#6B9FDB] transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#6B9FDB]/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#6B9FDB]"
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
                  <h3 className="text-lg font-semibold text-[#EAEAEA] group-hover:text-[#6B9FDB] transition-colors">
                    Track Progress
                  </h3>
                  <p className="text-sm text-[#707070]">
                    Monitor student performance
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Info Card */}
        <Card className="bg-[#14181D] border-[#2A2F35]">
          <CardHeader>
            <CardTitle className="text-[#EAEAEA]">
              About Student Management
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[#B0B0B0] space-y-3">
            <p>
              This page provides centralized access to all student-related
              management functions:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-[#EAEAEA]">Approve Students:</strong>{" "}
                Review and approve pending student registration applications
              </li>
              <li>
                <strong className="text-[#EAEAEA]">Assign Courses:</strong>{" "}
                Assign specific courses to approved students
              </li>
              <li>
                <strong className="text-[#EAEAEA]">Track Progress:</strong>{" "}
                Monitor individual student progress and completion rates
              </li>
            </ul>
            <p className="mt-4 text-sm text-[#707070]">
              For general user management (viewing all users, roles, etc.), use
              the "Manage Users" option from the main admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
