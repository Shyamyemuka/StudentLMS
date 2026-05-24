"use client";

import { useState, useEffect } from "react";
import ResourceTabs from "./resource-tabs";
import ChatBox from "../chat/chat-box";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Resource } from "@/types/database";

interface SubjectContentProps {
  subjectId: number;
  initialVideos: Resource[];
  initialPdfs: Resource[];
  initialNotes: Resource[];
  userRole: string;
}

export default function SubjectContent({
  subjectId,
  initialVideos,
  initialPdfs,
  initialNotes,
  userRole,
}: SubjectContentProps) {
  const [videos, setVideos] = useState(initialVideos);
  const [pdfs, setPdfs] = useState(initialPdfs);
  const [notes, setNotes] = useState(initialNotes);

  // Debug logging
  console.log("=== SUBJECT CONTENT DEBUG ===");
  console.log("Initial videos:", initialVideos);
  console.log("Current videos state:", videos);
  console.log("Videos length:", videos?.length || 0);

  const fetchResources = async () => {
    const supabase = createClient();
    const { data: resources } = await supabase
      .from("resources")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (resources) {
      setVideos(resources.filter((r) => r.type === "video"));
      setPdfs(resources.filter((r) => r.type === "pdf"));
      setNotes(resources.filter((r) => r.type === "notes"));
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("resources-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resources",
          filter: `subject_id=eq.${subjectId}`,
        },
        () => {
          fetchResources();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Resource Tabs - Takes up 2 columns */}
      <div className="lg:col-span-2">
        <ResourceTabs
          subjectId={subjectId}
          videos={videos}
          pdfs={pdfs}
          notes={notes}
          userRole={userRole}
          onResourceDeleted={fetchResources}
        />
      </div>

      {/* Chat Box - Takes up 1 column */}
      <div className="lg:col-span-1">
        <div className="sticky top-8 h-[calc(100vh-12rem)]">
          <ChatBox subjectId={subjectId.toString()} />
        </div>
      </div>
    </div>
  );
}
