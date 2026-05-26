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
        if (type.includes("approved")) return "text-emerald-500";
        if (type.includes("rejected")) return "text-destructive";
        if (type === "new_submission" || type === "new_faculty_signup") return "text-primary";
        return "text-muted-foreground";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-muted border-2 border-transparent hover:border-border transition-all cursor-pointer wobbly-border"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-destructive text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-border shadow-hard-sm animate-sketch-bounce">
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
                    <div 
                        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border-2 border-border rounded-xl shadow-hard-lg z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b-2 border-border flex items-center justify-between">
                            <h3 className="text-foreground font-bold font-heading">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-bold cursor-pointer"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-muted border-2 border-transparent hover:border-border rounded transition-all md:hidden cursor-pointer"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="px-4 py-8 text-center text-muted-foreground font-bold">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <Bell className="w-8 h-8 text-muted/60 mx-auto mb-2" />
                                    <p className="text-muted-foreground font-bold text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <ul>
                                    {notifications.map((notification) => (
                                        <li key={notification.id}>
                                            <button
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`w-full px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b-2 border-border/40 last:border-b-0 cursor-pointer ${!notification.is_read ? "bg-muted/30" : ""
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
                                                                className={`text-sm font-bold truncate ${!notification.is_read
                                                                        ? "text-foreground"
                                                                        : "text-muted-foreground"
                                                                    }`}
                                                            >
                                                                {notification.title}
                                                            </p>
                                                            {!notification.is_read && (
                                                                <span className="w-2.5 h-2.5 bg-primary border-2 border-border rounded-full flex-shrink-0 mt-1.5 shadow-hard-sm" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 font-bold">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/60 mt-1 font-bold">
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
                            <div className="px-4 py-2 border-t-2 border-border bg-muted/40">
                                <p className="text-xs text-muted-foreground/60 text-center font-bold">
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
