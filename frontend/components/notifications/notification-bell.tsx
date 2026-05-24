"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types/database";
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "@/lib/notifications/notification-service";
import { Bell, Check, CheckCheck, BookOpen, FileText, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface NotificationBellProps {
    userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const supabase = createClient();

    // Fetch notifications
    const loadNotifications = async () => {
        const { data, error } = await fetchNotifications(userId, 20);
        if (!error) {
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
        }
        setLoading(false);
    };

    // Initial load and realtime subscription
    useEffect(() => {
        loadNotifications();

        // Subscribe to realtime changes
        const channel = supabase
            .channel("notifications_realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    loadNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle notification click
    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.is_read) {
            await markNotificationAsRead(notification.id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Navigate to link if exists
        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead(userId);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    // Get icon for notification type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "subject_approved":
            case "subject_rejected":
                return <BookOpen className="w-4 h-4" />;
            case "resource_approved":
            case "resource_rejected":
            case "new_submission":
                return <FileText className="w-4 h-4" />;
            case "new_faculty_signup":
                return <UserPlus className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    // Get color for notification type
    const getNotificationColor = (type: string) => {
        if (type.includes("approved")) return "text-[#4CAF8F]";
        if (type.includes("rejected")) return "text-[#C94A4A]";
        if (type === "new_submission" || type === "new_faculty_signup") return "text-[#D4AF37]";
        return "text-[#B0B0B0]";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-[#1A1F25] transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-[#B0B0B0] hover:text-[#D4AF37] transition-colors" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#C94A4A] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <div
                        className="fixed inset-0 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#14181D] border border-[#2A2F35] rounded-xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-[#2A2F35] flex items-center justify-between">
                            <h3 className="text-[#EAEAEA] font-semibold">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-[#D4AF37] hover:text-[#E6C76A] transition-colors flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-[#1A1F25] rounded transition-colors md:hidden"
                                >
                                    <X className="w-4 h-4 text-[#707070]" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="px-4 py-8 text-center text-[#707070]">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <Bell className="w-8 h-8 text-[#2A2F35] mx-auto mb-2" />
                                    <p className="text-[#707070] text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <ul>
                                    {notifications.map((notification) => (
                                        <li key={notification.id}>
                                            <button
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`w-full px-4 py-3 text-left hover:bg-[#1A1F25] transition-colors border-b border-[#2A2F35]/50 last:border-b-0 ${!notification.is_read ? "bg-[#1A1F25]/50" : ""
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Icon */}
                                                    <div
                                                        className={`mt-0.5 ${getNotificationColor(
                                                            notification.type
                                                        )}`}
                                                    >
                                                        {getNotificationIcon(notification.type)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p
                                                                className={`text-sm font-medium truncate ${!notification.is_read
                                                                        ? "text-[#EAEAEA]"
                                                                        : "text-[#B0B0B0]"
                                                                    }`}
                                                            >
                                                                {notification.title}
                                                            </p>
                                                            {!notification.is_read && (
                                                                <span className="w-2 h-2 bg-[#D4AF37] rounded-full flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-[#707070] mt-0.5 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-[#505050] mt-1">
                                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                                addSuffix: true,
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-2 border-t border-[#2A2F35] bg-[#0B0D10]">
                                <p className="text-xs text-[#505050] text-center">
                                    Showing last {notifications.length} notifications
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
