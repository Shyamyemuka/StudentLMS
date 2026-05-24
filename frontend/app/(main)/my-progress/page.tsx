import { createClient } from "@/lib/supabase/server";
import PageContainer from "@/components/layout/page-container";
import { getUserCourseProgress } from "@/lib/utils/course-progress";
import CourseProgressCard from "@/components/progress/course-progress-card";
import Link from "next/link";
import { CourseProgress } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function MyProgressPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageContainer
        title="My Progress"
        subtitle="Track your learning journey"
        showBackButton
        backHref="/dashboard">
        <p className="text-[#B0B0B0]">Please log in to view your progress.</p>
      </PageContainer>
    );
  }

  // Get user's course progress
  let progressList: any[] = [];
  try {
    progressList = await getUserCourseProgress(supabase, user.id);

    // Fetch subject details for each progress
    for (const progress of progressList) {
      const { data: subject } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", progress.subject_id)
        .single();

      if (subject) {
        progress.subject = subject;
      }
    }
  } catch (error) {
    console.error("Error fetching progress:", error);
  }

  // Calculate stats
  const completedCourses = progressList.filter(
    (p) => p.progress_percentage === 100,
  ).length;
  const inProgressCourses = progressList.filter(
    (p) => p.progress_percentage > 0 && p.progress_percentage < 100,
  ).length;
  const totalResources = progressList.reduce(
    (acc, p) => acc + p.total_resources,
    0,
  );
  const completedResources = progressList.reduce(
    (acc, p) => acc + p.completed_resources,
    0,
  );

  return (
    <PageContainer
      title="My Progress"
      subtitle="Track your learning journey"
      showBackButton
      backHref="/dashboard">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#14181D] border border-[#4CAF8F]/30 rounded-lg p-4">
          <p className="text-[#707070] text-sm mb-1">Completed Courses</p>
          <p className="text-3xl font-bold text-[#4CAF8F]">
            {completedCourses}
          </p>
        </div>
        <div className="bg-[#14181D] border border-[#D4AF37]/30 rounded-lg p-4">
          <p className="text-[#707070] text-sm mb-1">In Progress</p>
          <p className="text-3xl font-bold text-[#D4AF37]">
            {inProgressCourses}
          </p>
        </div>
        <div className="bg-[#14181D] border border-blue-500/30 rounded-lg p-4">
          <p className="text-[#707070] text-sm mb-1">Total Courses</p>
          <p className="text-3xl font-bold text-blue-400">
            {progressList.length}
          </p>
        </div>
        <div className="bg-[#14181D] border border-[#2A2F35] rounded-lg p-4">
          <p className="text-[#707070] text-sm mb-1">Resources Completed</p>
          <p className="text-3xl font-bold text-[#EAEAEA]">
            {completedResources}/{totalResources}
          </p>
        </div>
      </div>

      {/* Progress Cards */}
      {progressList.length > 0 ? (
        <div className="space-y-6">
          {/* Completed Courses */}
          {completedCourses > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-[#4CAF8F] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4CAF8F]"></span>
                Completed Courses ({completedCourses})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {progressList
                  .filter((p) => p.progress_percentage === 100)
                  .map((progress) => (
                    <CourseProgressCard
                      key={progress.subject_id}
                      progress={progress}
                      onClick={() =>
                        (window.location.href = `/subjects/${progress.subject_id}`)
                      }
                    />
                  ))}
              </div>
            </div>
          )}

          {/* In Progress Courses */}
          {inProgressCourses > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                In Progress ({inProgressCourses})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {progressList
                  .filter(
                    (p) =>
                      p.progress_percentage > 0 && p.progress_percentage < 100,
                  )
                  .sort((a, b) => b.progress_percentage - a.progress_percentage)
                  .map((progress) => (
                    <CourseProgressCard
                      key={progress.subject_id}
                      progress={progress}
                      onClick={() =>
                        (window.location.href = `/subjects/${progress.subject_id}`)
                      }
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#14181D] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#707070]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-[#707070] mb-4">
            You haven&apos;t started any courses yet
          </p>
          <Link
            href="/subjects"
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#0B0D10] px-6 py-2 rounded-lg font-medium hover:bg-[#E6C76A] transition-colors">
            Browse Courses
          </Link>
        </div>
      )}
    </PageContainer>
  );
}
