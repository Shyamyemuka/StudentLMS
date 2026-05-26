import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import VideoUploadForm from "@/components/resources/video-upload-form";
import FileUploadForm from "@/components/resources/file-upload-form";

export const dynamic = "force-dynamic";

interface AddResourcePageProps {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function AddResourcePage({
  params,
  searchParams,
}: AddResourcePageProps) {
  const { subjectId } = await params;
  const { type } = await searchParams;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  // Only faculty and admin can add resources
  if (profile?.role !== "admin" && profile?.role !== "faculty") {
    redirect(`/subjects/${subjectId}`);
  }

  // Get subject details
  const { data: subject, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .single();

  if (error || !subject) {
    notFound();
  }

  const resourceType = (type as "video" | "pdf" | "notes") || "video";

  const titles: Record<string, string> = {
    video: "Add Video",
    pdf: "Upload PDF",
    notes: "Upload Notes",
  };

  return (
    <PageContainer
      title={titles[resourceType]}
      subtitle={`Adding to: ${subject.subject_code} - ${subject.title}`}
      showBackButton
      backHref={`/subjects/${subjectId}`}>
      <div className="max-w-2xl mx-auto">
        {/* Type Selector */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["video", "pdf", "notes"] as const).map((t) => (
            <a
              key={t}
              href={`/subjects/${subjectId}/add-resource?type=${t}`}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 border-border transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95 ${
                resourceType === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:border-primary hover:text-primary"
              }`}>
              {t === "video" ? "🎥 Video" : t === "pdf" ? "📄 PDF" : "📝 Notes"}
            </a>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-card border-2 border-border rounded-xl p-6 md:p-8 shadow-hard-lg">
          {resourceType === "video" ? (
            <VideoUploadForm subjectId={parseInt(subjectId)} />
          ) : (
            <FileUploadForm
              subjectId={parseInt(subjectId)}
              type={resourceType}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
