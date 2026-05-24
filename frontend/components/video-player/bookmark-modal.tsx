"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number;
  currentTime: number;
  onBookmarkCreated?: () => void;
}

export default function BookmarkModal({
  isOpen,
  onClose,
  resourceId,
  currentTime,
  onBookmarkCreated,
}: BookmarkModalProps) {
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleCancel = () => {
    setNote("");
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }

    if (note.length > 500) {
      toast.error("Note must be less than 500 characters");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      toast.error(
        "You must be logged in. Please refresh the page and try again."
      );
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("video_bookmarks").insert({
      user_id: user.id,
      resource_id: resourceId,
      timestamp_sec: Math.floor(currentTime),
      note: note.trim(),
    });

    if (error) {
      toast.error("Failed to create bookmark");
      setIsLoading(false);
      return;
    }

    toast.success("Bookmark created!");
    setNote("");
    setIsLoading(false);

    // Notify parent components
    if (onBookmarkCreated) {
      onBookmarkCreated();
    }

    // Dispatch event for BookmarkList to refresh
    window.dispatchEvent(
      new CustomEvent("bookmarkCreated", {
        detail: { resourceId },
      })
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bg-black/95 backdrop-blur-sm p-6 border-t border-gray-700">
      <div className="max-w-3xl mx-auto">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Timestamp: </span>
            <span className="text-[#D4AF37] font-semibold">
              {formatTime(currentTime)}
            </span>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close (ESC)"
            type="button">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-colors resize-none"
            placeholder="Add a note for this timestamp..."
            rows={3}
            maxLength={500}
            required
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#D4AF37] text-[#0B0D10] rounded-lg font-semibold hover:bg-[#E6C76A] transition-colors disabled:opacity-50">
              {isLoading ? "Saving..." : "Save Bookmark"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
