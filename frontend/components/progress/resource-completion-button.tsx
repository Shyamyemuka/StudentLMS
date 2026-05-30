"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markResourceCompleted } from "@/lib/utils/course-progress";
import { toast } from "sonner";
import { Check, CheckCircle2 } from "lucide-react";

interface ResourceCompletionButtonProps {
  resourceId: number;
  subjectId: number;
  userId: string;
  isCompleted: boolean;
  onComplete?: () => void;
}

export default function ResourceCompletionButton({
  resourceId,
  subjectId,
  userId,
  isCompleted,
  onComplete,
}: ResourceCompletionButtonProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (completed) return; // Don't allow un-marking as complete

    setIsLoading(true);
    try {
      const supabase = createClient();
      await markResourceCompleted(supabase, userId, subjectId, resourceId);

      setCompleted(true);
      toast.success("Resource marked as complete!");

      // Call callback if provided
      onComplete?.();
    } catch (error: any) {
      console.error("Error marking resource as complete:", error);
      toast.error(error?.message || "Failed to update progress");
    } finally {
      setIsLoading(false);
    }
  };

  if (completed) {
    return (
      <button
        disabled
        suppressHydrationWarning
        className="flex items-center gap-2 px-4 py-2 bg-success/20 border-2 border-success/30 rounded-xl text-success text-sm font-bold cursor-default font-body shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.02)]">
        <CheckCircle2 className="w-4 h-4" />
        Completed
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      suppressHydrationWarning
      style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
      className="flex items-center gap-2 px-4 py-2 bg-card border-2 border-border rounded-xl text-muted-foreground text-sm font-bold hover:border-primary/50 hover:text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-body shadow-hard-sm">
      <Check className="w-4 h-4" />
      {isLoading ? "Marking..." : "Mark as Complete"}
    </button>
  );
}
