import { createClient } from "@/lib/supabase/client";
import { CreateNotification, NotificationType } from "@/types/database";

const supabase = createClient();

/**
 * Create a notification for a specific user
 */
export async function createNotification(
    notification: CreateNotification
): Promise<{ error: string | null }> {
    const { error } = await supabase.from("notifications").insert({
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
    });

    if (error) {
        console.error("Error creating notification:", error);
        return { error: error.message };
    }

    return { error: null };
}

/**
 * Create notifications for all users with a specific role
 */
export async function createNotificationForRole(
    role: "admin" | "faculty" | "student",
    type: NotificationType,
    title: string,
    message: string,
    link?: string
): Promise<{ error: string | null }> {
    // First, get all users with the specified role
    const { data: users, error: fetchError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("role", role);

    if (fetchError) {
        console.error("Error fetching users:", fetchError);
        return { error: fetchError.message };
    }

    if (!users || users.length === 0) {
        return { error: null }; // No users to notify
    }

    // Create notifications for all users
    const notifications = users.map((user) => ({
        user_id: user.user_id,
        type,
        title,
        message,
        link: link || null,
    }));

    const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

    if (insertError) {
        console.error("Error creating notifications:", insertError);
        return { error: insertError.message };
    }

    return { error: null };
}

/**
 * Create notifications for both faculty and admin roles
 */
export async function notifyFacultyAndAdmin(
    type: NotificationType,
    title: string,
    message: string,
    link?: string
): Promise<{ error: string | null }> {
    // Get all faculty and admin users
    const { data: users, error: fetchError } = await supabase
        .from("profiles")
        .select("user_id")
        .in("role", ["faculty", "admin"]);

    if (fetchError) {
        console.error("Error fetching users:", fetchError);
        return { error: fetchError.message };
    }

    if (!users || users.length === 0) {
        return { error: null };
    }

    const notifications = users.map((user) => ({
        user_id: user.user_id,
        type,
        title,
        message,
        link: link || null,
    }));

    const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

    if (insertError) {
        console.error("Error creating notifications:", insertError);
        return { error: insertError.message };
    }

    return { error: null };
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
    notificationId: number
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

    if (error) {
        console.error("Error marking notification as read:", error);
        return { error: error.message };
    }

    return { error: null };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
    userId: string
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

    if (error) {
        console.error("Error marking all notifications as read:", error);
        return { error: error.message };
    }

    return { error: null };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(
    userId: string
): Promise<{ count: number; error: string | null }> {
    const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

    if (error) {
        console.error("Error getting unread count:", error);
        return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
}

/**
 * Fetch notifications for a user
 */
export async function fetchNotifications(
    userId: string,
    limit: number = 20
): Promise<{ data: any[]; error: string | null }> {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching notifications:", error);
        return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
}
