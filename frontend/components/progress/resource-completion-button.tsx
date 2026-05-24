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
        className="flex items-center gap-2 px-4 py-2 bg-[#4CAF8F]/10 border border-[#4CAF8F]/30 rounded-lg text-[#4CAF8F] text-sm font-medium cursor-default">
        <CheckCircle2 className="w-4 h-4" />
        Completed
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-[#14181D] border border-[#2A2F35] rounded-lg text-[#B0B0B0] text-sm font-medium hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      <Check className="w-4 h-4" />
      {isLoading ? "Marking..." : "Mark as Complete"}
    </button>
  );
}
