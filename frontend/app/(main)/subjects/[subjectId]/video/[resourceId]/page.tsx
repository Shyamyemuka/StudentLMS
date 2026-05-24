import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import VideoPlayer from "@/components/video-player/video-player";
import BookmarkList from "@/components/video-player/bookmark-list";
import ResourceCompletionButton from "@/components/progress/resource-completion-button";

export const dynamic = "force-dynamic";

interface VideoPageProps {
  params: Promise<{
    subjectId: string;
    resourceId: string;
  }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { subjectId, resourceId } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch resource details
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select(
      `
      *,
      subject:subjects(id, subject_code, title, regulation)
    `,
    )
    .eq("id", resourceId)
    .eq("type", "video")
    .single();

  if (resourceError || !resource) {
    notFound();
  }

  // Get video URL - either external or from storage
  let videoUrl = "";
  if (resource.source === "external" && resource.external_url) {
    videoUrl = resource.external_url;
  } else if (resource.source === "upload" && resource.storage_path) {
    // For uploaded videos, get the public URL
    const pathParts = resource.storage_path.split("/");
    const bucket = pathParts[0];
    const filePath = pathParts.slice(1).join("/");

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (publicUrlData && publicUrlData.publicUrl) {
      videoUrl = publicUrlData.publicUrl;
    }
  }

  // Fetch user's bookmarks for this video
  const { data: bookmarks } = await supabase
    .from("video_bookmarks")
    .select("*")
    .eq("resource_id", resourceId)
    .eq("user_id", user.id)
    .order("timestamp_sec", { ascending: true });

  // Check if user has completed this resource
  const { data: progressData } = await supabase
    .from("user_resource_progress")
    .select("completed")
    .eq("user_id", user.id)
    .eq("resource_id", resourceId)
    .eq("subject_id", subjectId)
    .single();

  const isCompleted = progressData?.completed || false;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <div className="mb-6">
        <a
          href={`/subjects/${subjectId}`}
          className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#E6C76A] transition-colors text-sm font-medium group">
          <svg
            className="w-5 h-5 transition-transform group-hover:-translate-x-1"
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
          Back to Subject
        </a>
      </div>

      {/* Video Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-[#D4AF37] mb-2">
          {resource.title}
        </h1>
        <div className="flex items-center gap-4 text-[#B0B0B0]">
          <span className="flex items-center gap-2">
            📚
            <span>
              {resource.subject?.subject_code} - {resource.subject?.title}
            </span>
          </span>
          <span className="text-[#707070]">•</span>
          <span>{resource.subject?.regulation}</span>
        </div>
      </div>

      {/* Video Player */}
      <div className="mb-8">
        <VideoPlayer
          resourceId={parseInt(resourceId)}
          videoUrl={videoUrl}
          title={resource.title}
          initialBookmarks={bookmarks || []}
        />

        {/* Completion Button - Right aligned below video */}
        <div className="flex justify-end mt-4">
          <ResourceCompletionButton
            resourceId={parseInt(resourceId)}
            subjectId={parseInt(subjectId)}
            userId={user.id}
            isCompleted={isCompleted}
          />
        </div>
      </div>

      {/* Bookmarks Section */}
      <div className="bg-[#14181D] border border-[#2A2F35] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold text-[#EAEAEA]">
            My Bookmarks
          </h2>
          <span className="text-sm text-[#707070]">
            {bookmarks?.length || 0} saved
          </span>
        </div>

        <BookmarkList
          resourceId={parseInt(resourceId)}
          initialBookmarks={bookmarks || []}
        />
      </div>
    </div>
  );
}
