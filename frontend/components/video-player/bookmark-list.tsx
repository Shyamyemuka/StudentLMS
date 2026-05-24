"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Bookmark {
  id: number;
  timestamp_sec: number;
  note: string;
  created_at: string;
}

interface BookmarkListProps {
  resourceId: number;
  initialBookmarks: Bookmark[];
}

export default function BookmarkList({
  resourceId,
  initialBookmarks,
}: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Listen for new bookmarks
  useEffect(() => {
    const handleBookmarkCreated = async (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.resourceId === resourceId) {
        // Fetch updated bookmarks
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("video_bookmarks")
            .select("*")
            .eq("resource_id", resourceId)
            .eq("user_id", user.id)
            .order("timestamp_sec", { ascending: true });

          if (data) {
            setBookmarks(data);
          }
        }
      }
    };

    window.addEventListener("bookmarkCreated", handleBookmarkCreated);
    return () =>
      window.removeEventListener("bookmarkCreated", handleBookmarkCreated);
  }, [resourceId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (bookmarkId: number) => {
    if (!confirm("Are you sure you want to delete this bookmark?")) {
      return;
    }

    setDeletingId(bookmarkId);
    const supabase = createClient();

    const { error } = await supabase
      .from("video_bookmarks")
      .delete()
      .eq("id", bookmarkId);

    if (error) {
      toast.error("Failed to delete bookmark");
      setDeletingId(null);
      return;
    }

    toast.success("Bookmark deleted");
    setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    setDeletingId(null);
  };

  const handleSeekToBookmark = (timestamp: number) => {
    // Scroll to top where video is
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Dispatch custom event to video player
    window.dispatchEvent(
      new CustomEvent("seekToBookmark", { detail: { timestamp } })
    );
  };

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-3xl">
          🔖
        </div>
        <p className="text-[#707070] mb-2">No bookmarks yet</p>
        <p className="text-[#707070] text-sm">
          Click the bookmark button while watching to save important moments
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bg-[#0B0D10] border border-[#2A2F35] rounded-lg p-4 hover:border-[#D4AF37] transition-all group">
          <div className="flex items-start gap-4">
            {/* Timestamp Button */}
            <button
              onClick={() => handleSeekToBookmark(bookmark.timestamp_sec)}
              className="flex-shrink-0 w-16 h-16 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-semibold hover:bg-[#D4AF37]/20 transition-colors"
              suppressHydrationWarning>
              {formatTime(bookmark.timestamp_sec)}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[#EAEAEA] mb-2">{bookmark.note}</p>
              <p className="text-[#707070] text-xs">
                {formatDate(bookmark.created_at)}
              </p>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(bookmark.id)}
              disabled={deletingId === bookmark.id}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#C94A4A] hover:text-[#FF6B6B] disabled:opacity-50"
              suppressHydrationWarning>
              {deletingId === bookmark.id ? (
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
