"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Message {
  id: number;
  subject_id: number;
  sender_id: string;
  body: string;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  };
}

interface ChatBoxProps {
  subjectId: string;
}

export default function ChatBox({ subjectId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      // First try to get messages without join
      const { data: rawMessages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("subject_id", parseInt(subjectId))
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Messages query error:", messagesError);
        throw messagesError;
      }

      console.log("Raw messages:", rawMessages);

      // Then get profile data for each sender
      if (rawMessages && rawMessages.length > 0) {
        const senderIds = [
          ...new Set(rawMessages.map((m: any) => m.sender_id)),
        ];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, role")
          .in("user_id", senderIds);

        if (profilesError) {
          console.error("Profiles query error:", profilesError);
        }

        console.log("Profiles data:", profilesData);

        // Combine messages with profiles
        const messagesWithProfiles = rawMessages.map((msg: any) => ({
          ...msg,
          profiles: profilesData?.find(
            (p: any) => p.user_id === msg.sender_id,
          ) || {
            full_name: "Unknown User",
            role: "student",
          },
        }));

        setMessages(messagesWithProfiles);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Get current user
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  // Handle typing indicator
  const handleTyping = async () => {
    if (!currentUserId) return;

    const channel = supabase.channel(`chat:${subjectId}`);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", currentUserId)
      .single();

    await channel.track({
      user_id: currentUserId,
      full_name: profile?.full_name || "Unknown User",
      typing: true,
      online_at: new Date().toISOString(),
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      await channel.track({
        user_id: currentUserId,
        full_name: profile?.full_name || "Unknown User",
        typing: false,
        online_at: new Date().toISOString(),
      });
    }, 3000);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Auth error:", authError);
        toast.error(
          "You must be logged in. Please refresh the page and try again.",
        );
        return;
      }

      // Stop typing indicator
      const channel = supabase.channel(`chat:${subjectId}`);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      await channel.track({
        user_id: user.id,
        full_name: profile?.full_name || "Unknown User",
        typing: false,
        online_at: new Date().toISOString(),
      });

      console.log("Attempting to insert message:", {
        subject_id: parseInt(subjectId),
        sender_id: user.id,
        body: newMessage.trim(),
      });

      const { data, error } = await supabase
        .from("messages")
        .insert({
          subject_id: parseInt(subjectId),
          sender_id: user.id,
          body: newMessage.trim(),
        })
        .select();

      if (error) {
        console.error("Insert error details:", {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          fullError: error,
        });
        throw error;
      }

      console.log("Message inserted successfully:", data);
      setNewMessage("");
      toast.success("Message sent");

      // Fetch messages again to ensure the new message appears
      // even if real-time subscription hasn't caught up
      await fetchMessages();
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      console.error("Error sending message:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error,
      });
      toast.error(error?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat:${subjectId}`, {
        config: {
          presence: {
            key: currentUserId || "anonymous",
          },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `subject_id=eq.${parseInt(subjectId)}`,
        },
        async (payload) => {
          console.log("New message received:", payload.new);
          // Fetch the profile data for the sender
          const { data: profileData } = await supabase
            .from("profiles")
            .select("user_id, full_name, role")
            .eq("user_id", payload.new.sender_id)
            .single();

          const newMessage: Message = {
            id: payload.new.id,
            subject_id: payload.new.subject_id,
            sender_id: payload.new.sender_id,
            body: payload.new.body,
            created_at: payload.new.created_at,
            profiles: profileData || {
              full_name: "Unknown User",
              role: "student",
            },
          };

          console.log("Adding message to state:", newMessage);
          setMessages((prev) => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
        },
      )
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState();
        const typing: Record<string, string> = {};

        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (
              presence.typing &&
              presence.user_id !== currentUserId &&
              presence.full_name
            ) {
              typing[presence.user_id] = presence.full_name;
            }
          });
        });

        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && currentUserId) {
          // Get current user profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", currentUserId)
            .single();

          await channel.track({
            user_id: currentUserId,
            full_name: profile?.full_name || "Unknown User",
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectId, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
          Admin
        </span>
      );
    }
    if (role === "faculty") {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
          Faculty
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
        Student
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#14181D] rounded-lg border border-[#BFA55A]/30">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-[#BFA55A]/30">
        <h3 className="text-lg font-semibold text-[#EAEAEA]">Discussion</h3>
        <p className="text-sm text-[#B0B0B0]">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </p>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-3">
              <svg
                className="w-8 h-8 text-[#D4AF37]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-[#B0B0B0]">No messages yet</p>
            <p className="text-sm text-[#808080] mt-1">
              Be the first to start the conversation
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  isOwnMessage ? "flex-row-reverse" : ""
                }`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#BFA55A] flex items-center justify-center text-[#0B0D10] font-semibold text-sm">
                    {getInitials(message.profiles.full_name)}
                  </div>
                </div>

                {/* Message Content */}
                <div
                  className={`flex-1 flex flex-col ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}>
                  <div
                    className={`flex items-center gap-2 mb-1 ${
                      isOwnMessage ? "flex-row-reverse" : ""
                    }`}>
                    <span className="text-sm font-medium text-[#EAEAEA]">
                      {isOwnMessage ? "You" : message.profiles.full_name}
                    </span>
                    {getRoleBadge(message.profiles.role)}
                    <span className="text-xs text-[#808080]">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[70%] ${
                      isOwnMessage
                        ? "bg-[#2A2F35] text-[#EAEAEA] border border-[#D4AF37]/50"
                        : "bg-[#1A1F25] text-[#EAEAEA]"
                    }`}>
                    <p className="text-sm font-medium whitespace-pre-wrap break-words">
                      {message.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-[#B0B0B0]">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span>
              {Object.values(typingUsers).length === 1
                ? `${Object.values(typingUsers)[0]} is typing...`
                : `${Object.values(typingUsers).length} people are typing...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-[#BFA55A]/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-[#1A1F25] border border-[#BFA55A]/30 rounded-lg text-[#EAEAEA] placeholder:text-[#808080] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-[#D4AF37] text-[#0B0D10] rounded-lg font-medium hover:bg-[#E6C76A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B0D10]" />
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
