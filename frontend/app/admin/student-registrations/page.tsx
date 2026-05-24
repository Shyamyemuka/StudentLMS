import { RegistrationManagement } from "@/components/admin/registration-management";
import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Student Registrations | Admin",
  description:
    "Manage student registration applications and assign credentials",
};

export const dynamic = "force-dynamic";

export default async function StudentRegistrationsPage() {
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

  // Only allow admin and faculty
  if (profile?.role !== "admin" && profile?.role !== "faculty") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0B0D10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/admin/students"
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
          Back to Student Management
        </Link>

        <RegistrationManagement />
      </div>
    </div>
  );
}
