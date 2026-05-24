/**
 * Course Access Control Utility
 * Checks if a user has access to a specific course based on course assignment status
 */

import { createClient } from "@/lib/supabase/server";

export interface CourseAccessResult {
  hasAccess: boolean;
  reason?: string;
  assignmentStatus?: "not_assigned" | "active" | "suspended" | "completed";
}

/**
 * Check if a user has access to a course
 * @param userId - User's ID
 * @param subjectId - Subject/Course ID
 * @returns Object indicating access status and reason
 */
export async function checkCourseAccess(
  userId: string,
  subjectId: number
): Promise<CourseAccessResult> {
  const supabase = await createClient();

  try {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    // Admin and faculty have full access to all approved courses
    if (profile?.role === "admin" || profile?.role === "faculty") {
      return {
        hasAccess: true,
        assignmentStatus: "active",
      };
    }

    // For students, check if course is assigned to them
    const { data: assignment, error: assignmentError } = await supabase
      .from("course_assignments")
      .select("status")
      .eq("user_id", userId)
      .eq("subject_id", subjectId)
      .single();

    // If no assignment exists
    if (assignmentError || !assignment) {
      return {
        hasAccess: false,
        assignmentStatus: "not_assigned",
        reason: "This course has not been assigned to you. Contact your faculty or admin.",
      };
    }

    // Check assignment status
    if (assignment.status === "active") {
      return {
        hasAccess: true,
        assignmentStatus: "active",
      };
    }

    if (assignment.status === "suspended") {
      return {
        hasAccess: false,
        assignmentStatus: "suspended",
        reason: "Your access to this course has been suspended. Contact your faculty or admin.",
      };
    }

    if (assignment.status === "completed") {
      return {
        hasAccess: true,
        assignmentStatus: "completed",
      };
    }

    // Default: no access
    return {
      hasAccess: false,
      assignmentStatus: "not_assigned",
      reason: "Unable to determine course access. Contact your faculty or admin.",
    };
  } catch (error) {
    console.error("Error checking course access:", error);
    // In case of error, deny access but provide helpful message
    return {
      hasAccess: false,
      reason: "Unable to verify course access. Please try again later.",
    };
  }
}

/**
 * Check if user has access to a resource (video, document, etc.)
 * Resources inherit access control from their parent subject
 */
export async function checkResourceAccess(
  userId: string,
  resourceId: number
): Promise<CourseAccessResult> {
  const supabase = await createClient();

  try {
    // Get the resource's subject ID
    const { data: resource, error } = await supabase
      .from("resources")
      .select("subject_id")
      .eq("id", resourceId)
      .single();

    if (error || !resource) {
      return {
        hasAccess: false,
        reason: "Resource not found.",
      };
    }

    // Check access to the parent subject
    return await checkCourseAccess(userId, resource.subject_id);
  } catch (error) {
    console.error("Error checking resource access:", error);
    return {
      hasAccess: false,
      reason: "Unable to verify resource access. Please try again later.",
    };
  }
}

/**
 * Get all assigned courses for a user (student)
 */
export async function getUserAssignedCourses(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_assignments")
    .select(
      `
      *,
      subject:subjects(*),
      assigner:profiles!course_assignments_assigned_by_fkey(full_name, role)
    `
    )
    .eq("user_id", userId)
    .in("status", ["active", "completed"])
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("Error fetching course assignments:", error);
    return [];
  }

  return data || [];
}

/**
 * Check if a course is already assigned to a user
 */
export async function isCourseAssigned(
  userId: string,
  subjectId: number
): Promise<{ isAssigned: boolean; status?: string }> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("course_assignments")
    .select("status")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .single();

  if (!assignment) {
    return { isAssigned: false };
  }

  return { 
    isAssigned: true, 
    status: assignment.status 
  };
}

/**
 * Get all students assigned to a specific course (for faculty/admin)
 */
export async function getCourseStudents(subjectId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_assignments")
    .select(
      `
      *,
      student:profiles!course_assignments_user_id_fkey(
        user_id,
        full_name,
        role
      )
    `
    )
    .eq("subject_id", subjectId)
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("Error fetching course students:", error);
    return [];
  }

  return data || [];
}
