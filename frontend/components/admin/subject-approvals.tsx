"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, XCircle, Clock } from "lucide-react";
import { createNotification } from "@/lib/notifications/notification-service";
import { formatDate } from "@/lib/utils";

interface Subject {
  id: number;
  title: string;
  subject_code: string;
  regulation: string;
  description: string | null;
  created_by: string;
  created_at: string;
  approved: boolean;
  profiles: {
    full_name: string;
    email: string;
    role: string;
  } | null;
}

export default function SubjectApprovals() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchPendingSubjects();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("subjects_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subjects",
        },
        () => {
          fetchPendingSubjects();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingSubjects = async () => {
    setLoading(true);
    try {
      const { data: subjectsData, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      console.log("Fetching pending subjects...");
      console.log("Data:", subjectsData);
      console.log("Error:", error);

      if (error) throw error;

      // Fetch creator profiles
      const enrichedSubjects = await Promise.all(
        (subjectsData || []).map(async (subject) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, role")
            .eq("user_id", subject.created_by)
            .single();

          return {
            ...subject,
            profiles: profile,
          };
        }),
      );

      console.log("Enriched subjects:", enrichedSubjects);
      setSubjects(enrichedSubjects);
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
      toast.error(error?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (subjectId: number) => {
    setProcessing(subjectId);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("subjects")
        .update({
          status: "approved",
          approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", subjectId);

      if (error) throw error;

      // Send notification to the creator (only for students - faculty subjects are auto-approved)
      const subject = subjects.find((s) => s.id === subjectId);
      if (subject && subject.profiles?.role === "student") {
        await createNotification({
          user_id: subject.created_by,
          type: "subject_approved",
          title: "Course Approved! 🎉",
          message: `Your course "${subject.title}" has been approved and is now visible to everyone.`,
          link: `/subjects/${subjectId}`,
        });
      }

      toast.success("Subject approved successfully");
      fetchPendingSubjects();
    } catch (error: any) {
      console.error("Error approving subject:", error);
      toast.error(error?.message || "Failed to approve subject");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (subjectId: number) => {
    if (
      !confirm(
        "Are you sure you want to reject this subject? All associated resources will be permanently deleted from storage.",
      )
    ) {
      return;
    }

    setProcessing(subjectId);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First, fetch and delete all resources associated with this subject
      const { data: resources } = await supabase
        .from("resources")
        .select("id, storage_path, source")
        .eq("subject_id", subjectId);

      // Delete uploaded files from storage
      if (resources && resources.length > 0) {
        for (const resource of resources) {
          if (resource.source === "upload" && resource.storage_path) {
            const [bucket, ...pathParts] = resource.storage_path.split("/");
            const filePath = pathParts.join("/");

            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);

            if (deleteError) {
              console.error("Error deleting resource file:", deleteError);
              // Continue even if file deletion fails
            }
          }
        }
      }

      // Delete resource submissions
      const { data: submissions } = await supabase
        .from("resource_submissions")
        .select("id, storage_path, type")
        .eq("subject_id", subjectId);

      if (submissions && submissions.length > 0) {
        for (const submission of submissions) {
          if (
            (submission.type === "pdf" || submission.type === "notes") &&
            submission.storage_path
          ) {
            const [bucket, ...pathParts] = submission.storage_path.split("/");
            const filePath = pathParts.join("/");

            const { error: deleteError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);

            if (deleteError) {
              console.error("Error deleting submission file:", deleteError);
              // Continue even if file deletion fails
            }
          }
        }
      }

      // Send notification to the creator BEFORE deleting (only for students)
      const subject = subjects.find((s) => s.id === subjectId);
      if (subject && subject.profiles?.role === "student") {
        await createNotification({
          user_id: subject.created_by,
          type: "subject_rejected",
          title: "Course Not Approved",
          message: `Your course "${subject.title}" was not approved. You can submit a new course with the same code if needed.`,
        });
      }

      // Delete the subject entirely (so the subject code can be reused)
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);

      if (error) throw error;

      toast.success("Subject rejected and deleted from database");
      fetchPendingSubjects();
    } catch (error: any) {
      console.error("Error rejecting subject:", error);
      toast.error(error?.message || "Failed to reject subject");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-bold">
          Loading pending subjects...
        </div>
      ) : subjects.length === 0 ? (
        <Card 
          style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
          className="bg-card border-2 border-border p-8 text-center shadow-hard-md"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground font-heading mb-2">
            All Caught Up!
          </h3>
          <p className="text-muted-foreground font-bold">
            There are no pending subject approvals at the moment.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
              className="bg-card border-2 border-border p-6 shadow-hard-md">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-primary/10 border border-border/20 rounded-lg text-primary">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold">
                          {subject.subject_code}
                        </span>
                        <span className="px-2.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/20 rounded text-xs font-bold">
                          {subject.regulation}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground font-heading mb-1">
                        {subject.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-bold">
                        <span>Created by {subject.profiles?.full_name}</span>
                        <span className="text-border">•</span>
                        <span className="capitalize">
                          {subject.profiles?.role}
                        </span>
                        <span className="text-border">•</span>
                        <span>{formatDate(subject.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-500 border-2 border-amber-500/30 font-bold px-2.5 py-1 rounded-full shadow-hard-sm">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Pending
                  </Badge>
                </div>

                {/* Description */}
                {subject.description && (
                  <div className="pl-11">
                    <p className="text-sm text-muted-foreground font-medium">
                      {subject.description}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pl-11">
                  <Button
                    onClick={() => handleApprove(subject.id)}
                    disabled={processing === subject.id}
                    style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 cursor-pointer transition-all">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Subject
                  </Button>
                  <Button
                    onClick={() => handleReject(subject.id)}
                    disabled={processing === subject.id}
                    variant="destructive"
                    style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                    className="border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 cursor-pointer transition-all">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject & Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
