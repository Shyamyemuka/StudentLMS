"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BookOpen, Trash2, Search } from "lucide-react";
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
  status: string;
  profiles: {
    full_name: string;
    email: string;
    role: string;
  } | null;
}

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchApprovedSubjects();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("subjects_management_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subjects",
        },
        () => {
          fetchApprovedSubjects();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Filter subjects based on search query
    if (searchQuery.trim() === "") {
      setFilteredSubjects(subjects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = subjects.filter(
        (subject) =>
          subject.title.toLowerCase().includes(query) ||
          subject.subject_code.toLowerCase().includes(query) ||
          subject.regulation.toLowerCase().includes(query) ||
          subject.description?.toLowerCase().includes(query),
      );
      setFilteredSubjects(filtered);
    }
  }, [searchQuery, subjects]);

  const fetchApprovedSubjects = async () => {
    setLoading(true);
    try {
      const { data: subjectsData, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

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

      setSubjects(enrichedSubjects);
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
      toast.error(error?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subjectId: number, subjectTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${subjectTitle}"?\n\nThis will also delete:\n- All resources associated with this subject\n- All enrollments for this subject\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(subjectId);
    try {
      // First, check if there are resources
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
              console.error(
                `Error deleting file ${resource.storage_path}:`,
                deleteError,
              );
              // Continue anyway
            }
          }
        }
      }



      // Delete the subject (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);

      if (deleteError) throw deleteError;

      toast.success("Subject and all associated data deleted successfully");
      fetchApprovedSubjects();
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error(error?.message || "Failed to delete subject");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground font-bold">Loading subjects...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground font-heading mb-1">
            Manage Subjects
          </h2>
          <p className="text-muted-foreground text-sm font-bold">
            {filteredSubjects.length} approved subject
            {filteredSubjects.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl focus:border-primary focus:outline-none font-bold"
          />
        </div>
      </div>

      {/* Subjects List */}
      {filteredSubjects.length === 0 ? (
        <Card 
          className="bg-card border-2 border-border rounded-xl p-12 text-center shadow-hard-md"
        >
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-bold">
            {searchQuery
              ? "No subjects found matching your search"
              : "No approved subjects yet"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubjects.map((subject) => (
            <Card
              key={subject.id}
              className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md hover:border-primary transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Subject Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground font-heading">
                          {subject.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border border-primary/25 rounded font-bold">
                          {subject.subject_code}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm font-bold mb-2">
                        Regulation: {subject.regulation}
                      </p>
                      {subject.description && (
                        <p className="text-muted-foreground text-sm font-medium line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold mt-3 pt-3 border-t-2 border-dashed border-border/40">
                    <span>
                      Created by:{" "}
                      <span className="text-foreground font-bold">
                        {subject.profiles?.full_name || "Unknown"}
                      </span>
                    </span>
                    <span className="text-border">•</span>
                    <span>{formatDate(subject.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:ml-4">
                  <Button
                    onClick={() => handleDelete(subject.id, subject.title)}
                    disabled={deleting === subject.id}
                    variant="outline"
                    size="sm"
                    className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-2 border-destructive/30 rounded-xl font-bold shadow-hard-sm cursor-pointer transition-all active:scale-95">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting === subject.id ? "Deleting..." : "Delete"}
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
