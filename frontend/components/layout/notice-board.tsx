"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Bell,
  Send,
  Trash2,
  Calendar,
  User,
  Megaphone,
  X,
  Pin,
  PinOff,
  Loader2,
} from "lucide-react";

interface Notice {
  id: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface NoticeBoardProps {
  userRole: string;
  userId: string;
}

export default function NoticeBoard({ userRole, userId }: NoticeBoardProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [pinning, setPinning] = useState<number | null>(null);

  const supabase = createClient();
  const canPost = userRole === "admin" || userRole === "faculty";
  const isAdmin = userRole === "admin";

  // Debounce ref for real-time updates
  const debouncedFetchRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    fetchNotices();

    // Subscribe to realtime updates with debouncing for better performance
    const channel = supabase
      .channel("notices_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notices",
        },
        () => {
          // Debounce updates by 300ms to prevent rapid refetches
          if (debouncedFetchRef.current) {
            clearTimeout(debouncedFetchRef.current);
          }
          debouncedFetchRef.current = setTimeout(fetchNotices, 300);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToTop = () => {
    const noticesList = document.querySelector(".notices-list");
    noticesList?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchNotices = async () => {
    try {
      // Optimized query: only select needed columns and limit to 20 notices
      const { data, error } = await supabase
        .from("notices")
        .select(
          `
          id,
          title,
          content,
          created_by,
          created_at,
          pinned,
          pinned_at,
          pinned_by,
          profiles:created_by (
            full_name,
            role
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform the data to match Notice interface (profiles comes as array from Supabase)
      const transformedData: Notice[] = (data || []).map((notice: any) => ({
        ...notice,
        profiles: Array.isArray(notice.profiles)
          ? notice.profiles[0]
          : notice.profiles,
      }));

      // Sort: pinned notices first (by pinned_at desc), then unpinned by created_at desc
      const sorted = [...transformedData].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.pinned && b.pinned) {
          return (
            new Date(b.pinned_at!).getTime() - new Date(a.pinned_at!).getTime()
          );
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setNotices(sorted);
    } catch (error: any) {
      // Silently handle error - notices are optional feature
      // Only log in development mode
      if (process.env.NODE_ENV === "development") {
        console.error(
          "Error fetching notices:",
          error?.message || error?.toString() || "Unknown error",
        );
        if (error?.details) console.error("Error details:", error.details);
        if (error?.hint) console.error("Error hint:", error.hint);
        if (error?.code) console.error("Error code:", error.code);
      }
      // Set empty array so UI shows "No notices yet"
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("notices").insert({
        title: title.trim(),
        content: content.trim(),
        created_by: userId,
      });

      if (error) throw error;

      toast.success("Notice posted successfully");
      setTitle("");
      setContent("");
      setShowForm(false);
      fetchNotices();
      // Scroll to top to show newly posted notice (likely pinned or at top)
      setTimeout(scrollToTop, 100);
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error posting notice:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        });
      }
      toast.error(error?.message || "Failed to post notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noticeId: number) => {
    if (!confirm("Are you sure you want to delete this notice?")) {
      return;
    }

    setDeleting(noticeId);
    try {
      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", noticeId);

      if (error) throw error;

      toast.success("Notice deleted successfully");
      fetchNotices();
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting notice:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        });
      }
      toast.error(error?.message || "Failed to delete notice");
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePin = async (noticeId: number, currentPinned: boolean) => {
    // Check if trying to pin and already have 3 pinned
    if (!currentPinned) {
      const pinnedCount = notices.filter((n) => n.pinned).length;
      if (pinnedCount >= 3) {
        toast.error("Maximum 3 notices can be pinned at a time");
        return;
      }
    }

    setPinning(noticeId);
    try {
      const { error } = await supabase
        .from("notices")
        .update({
          pinned: !currentPinned,
          pinned_at: !currentPinned ? new Date().toISOString() : null,
          pinned_by: !currentPinned ? userId : null,
        })
        .eq("id", noticeId);

      if (error) throw error;

      toast.success(currentPinned ? "Notice unpinned" : "Notice pinned");
      fetchNotices();
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error toggling pin:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        });
      }
      toast.error(error?.message || "Failed to update notice");
    } finally {
      setPinning(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-[#C94A4A]";
      case "faculty":
        return "text-[#6B9FDB]";
      default:
        return "text-[#B0B0B0]";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "faculty":
        return "Faculty";
      default:
        return "";
    }
  };

  return (
    <Card className="bg-[#14181D] border-[#2A2F35] h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2F35]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-lg font-semibold text-[#EAEAEA]">
              Notice Board
            </h3>
          </div>
          {canPost && !showForm && (
            <Button
              onClick={() => setShowForm(true)}
              size="sm"
              className="bg-[#D4AF37] hover:bg-[#E6C76A] text-[#0B0D10]">
              <Bell className="w-4 h-4 mr-2" />
              Post Notice
            </Button>
          )}
        </div>
        <p className="text-xs text-[#707070]">
          {canPost
            ? "Post important announcements for all users"
            : "View announcements from faculty and admin"}
        </p>
      </div>

      {/* Post Form */}
      {showForm && (
        <div className="p-4 border-b border-[#2A2F35] bg-[#0B0D10]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-[#EAEAEA]">
              Create Notice
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-[#707070] hover:text-[#EAEAEA] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Notice title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#14181D] border border-[#2A2F35] rounded-lg px-3 py-2 text-sm text-[#EAEAEA] placeholder:text-[#707070] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
              maxLength={100}
              disabled={submitting}
            />
            <textarea
              placeholder="Notice content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#14181D] border border-[#2A2F35] rounded-lg px-3 py-2 text-sm text-[#EAEAEA] placeholder:text-[#707070] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none"
              rows={3}
              maxLength={500}
              disabled={submitting}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="outline"
                size="sm"
                className="bg-transparent border-[#2A2F35] text-[#B0B0B0] hover:bg-[#1A1F25]"
                disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#E6C76A] text-[#0B0D10]"
                disabled={submitting}>
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notices List */}
      <div className="notices-list flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-[#707070]">
            Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-[#707070] mx-auto mb-3" />
            <p className="text-[#707070] text-sm">No notices yet</p>
            {canPost && (
              <p className="text-[#707070] text-xs mt-1">
                Be the first to post an announcement
              </p>
            )}
          </div>
        ) : (
          <>
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-[#0B0D10] border rounded-lg p-4 hover:border-[#D4AF37]/30 transition-colors ${
                  notice.pinned
                    ? "border-[#D4AF37] bg-[#D4AF37]/5"
                    : "border-[#2A2F35]"
                }`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notice.pinned && (
                        <Pin className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                      )}
                      <h4 className="text-[#EAEAEA] font-semibold text-sm break-words">
                        {notice.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#707070]">
                      <span
                        className={`flex items-center gap-1 ${getRoleColor(
                          notice.profiles?.role || "",
                        )}`}>
                        <User className="w-3 h-3" />
                        {notice.profiles?.full_name}
                      </span>
                      {notice.profiles?.role && (
                        <>
                          <span>•</span>
                          <span className="text-[#D4AF37] text-xs px-2 py-0.5 bg-[#D4AF37]/10 rounded">
                            {getRoleBadge(notice.profiles.role)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <button
                        onClick={() =>
                          handleTogglePin(notice.id, notice.pinned)
                        }
                        disabled={pinning === notice.id}
                        className={`transition-colors disabled:opacity-50 ${
                          notice.pinned
                            ? "text-[#D4AF37] hover:text-[#D4AF37]/80"
                            : "text-[#707070] hover:text-[#D4AF37]"
                        }`}
                        title={
                          notice.pinned ? "Unpin notice" : "Pin notice (max 3)"
                        }>
                        {pinning === notice.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : notice.pinned ? (
                          <PinOff className="w-4 h-4" />
                        ) : (
                          <Pin className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {(notice.created_by === userId || isAdmin) && (
                      <button
                        onClick={() => handleDelete(notice.id)}
                        disabled={deleting === notice.id}
                        className="text-[#707070] hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete notice">
                        {deleting === notice.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-[#B0B0B0] text-sm mb-2 whitespace-pre-wrap break-words">
                  {notice.content}
                </p>

                {/* Footer */}
                <div className="flex items-center gap-1 text-xs text-[#707070]">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(notice.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  );
}
