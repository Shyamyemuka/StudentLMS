/**
 * Course Progress Utilities
 * Functions for tracking and calculating student progress through courses
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  CourseProgress,
  UserResourceProgress,
  CreateResourceProgress,
} from "@/types/database";

/**
 * Calculate course progress for a specific user and course
 */
export async function calculateCourseProgress(
  supabase: SupabaseClient,
  userId: string,
  subjectId: number
): Promise<CourseProgress> {
  // Get total approved resources for this course
  const { data: resources, error: resourceError } = await supabase
    .from("resources")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("approved", true);

  if (resourceError) {
    throw new Error(`Failed to fetch resources: ${resourceError.message}`);
  }

  const totalResources = resources?.length || 0;

  // Get completed resources for this user
  const { data: progress, error: progressError } = await supabase
    .from("user_resource_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .eq("completed", true);

  if (progressError) {
    throw new Error(
      `Failed to fetch user progress: ${progressError.message}`
    );
  }

  const completedResources = progress?.length || 0;
  const progressPercentage =
    totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;

  // Get first and last access times
  const { data: allProgress } = await supabase
    .from("user_resource_progress")
    .select("last_accessed, completed_at")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .order("last_accessed", { ascending: false })
    .limit(1);

  const lastAccessed = allProgress?.[0]?.last_accessed || null;

  // Get earliest access
  const { data: earliestProgress } = await supabase
    .from("user_resource_progress")
    .select("created_at")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true })
    .limit(1);

  const startedAt = earliestProgress?.[0]?.created_at || null;

  // Check if course is completed (100%)
  const completedAt =
    progressPercentage === 100 ? progress?.[0]?.completed_at || null : null;

  return {
    subject_id: subjectId,
    user_id: userId,
    total_resources: totalResources,
    completed_resources: completedResources,
    progress_percentage: progressPercentage,
    last_accessed: lastAccessed,
    started_at: startedAt,
    completed_at: completedAt,
  };
}

/**
 * Mark a resource as completed for a user
 */
export async function markResourceCompleted(
  supabase: SupabaseClient,
  userId: string,
  subjectId: number,
  resourceId: number
): Promise<UserResourceProgress> {
  const now = new Date().toISOString();

  // Check if progress record exists
  const { data: existing } = await supabase
    .from("user_resource_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .single();

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from("user_resource_progress")
      .update({
        completed: true,
        completed_at: now,
        last_accessed: now,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new progress record
    const { data, error } = await supabase
      .from("user_resource_progress")
      .insert({
        user_id: userId,
        subject_id: subjectId,
        resource_id: resourceId,
        completed: true,
        completed_at: now,
        last_accessed: now,
        time_spent_seconds: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Update resource access time (track that user is viewing/studying)
 */
export async function updateResourceAccess(
  supabase: SupabaseClient,
  userId: string,
  subjectId: number,
  resourceId: number,
  timeSpentSeconds?: number
): Promise<void> {
  const now = new Date().toISOString();

  // Check if progress record exists
  const { data: existing } = await supabase
    .from("user_resource_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .single();

  if (existing) {
    // Update last accessed and time spent
    const updateData: any = {
      last_accessed: now,
      updated_at: now,
    };

    if (timeSpentSeconds !== undefined) {
      updateData.time_spent_seconds = existing.time_spent_seconds + timeSpentSeconds;
    }

    const { error } = await supabase
      .from("user_resource_progress")
      .update(updateData)
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    // Create new progress record
    const { error } = await supabase
      .from("user_resource_progress")
      .insert({
        user_id: userId,
        subject_id: subjectId,
        resource_id: resourceId,
        completed: false,
        last_accessed: now,
        time_spent_seconds: timeSpentSeconds || 0,
      });

    if (error) throw error;
  }
}

/**
 * Get resource completion status for a user
 */
export async function getResourceProgress(
  supabase: SupabaseClient,
  userId: string,
  resourceId: number
): Promise<UserResourceProgress | null> {
  const { data, error } = await supabase
    .from("user_resource_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" error
    throw error;
  }

  return data || null;
}

/**
 * Get all course progress for a user
 */
export async function getUserCourseProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<CourseProgress[]> {
  // Get all subjects the user has started (has any progress)
  const { data: progressData, error } = await supabase
    .from("user_resource_progress")
    .select("subject_id")
    .eq("user_id", userId);

  if (error) throw error;

  // Get unique subject IDs
  const subjectIds = [...new Set(progressData?.map((p) => p.subject_id) || [])];

  // Calculate progress for each subject
  const progressPromises = subjectIds.map((subjectId) =>
    calculateCourseProgress(supabase, userId, subjectId)
  );

  return Promise.all(progressPromises);
}

/**
 * Get course progress for all students (Admin/Faculty view)
 */
export async function getAllStudentProgress(
  supabase: SupabaseClient,
  subjectId: number
): Promise<Array<CourseProgress & { user?: any }>> {
  // Get all users who have progress in this course
  const { data: progressData, error } = await supabase
    .from("user_resource_progress")
    .select("user_id, profiles(*)")
    .eq("subject_id", subjectId);

  if (error) throw error;

  // Get unique students
  const uniqueStudents = progressData?.reduce((acc, curr) => {
    if (!acc.find((u: any) => u.user_id === curr.user_id)) {
      acc.push(curr);
    }
    return acc;
  }, [] as any[]);

  // Calculate progress for each student
  const progressPromises =
    uniqueStudents?.map(async (student) => {
      const progress = await calculateCourseProgress(
        supabase,
        student.user_id,
        subjectId
      );
      return {
        ...progress,
        user: student.profiles,
      };
    }) || [];

  return Promise.all(progressPromises);
}

/**
 * Get completion status for multiple resources at once
 */
export async function getBulkResourceProgress(
  supabase: SupabaseClient,
  userId: string,
  resourceIds: number[]
): Promise<Record<number, boolean>> {
  if (resourceIds.length === 0) return {};

  const { data, error } = await supabase
    .from("user_resource_progress")
    .select("resource_id, completed")
    .eq("user_id", userId)
    .in("resource_id", resourceIds);

  if (error) throw error;

  // Convert to map for easy lookup
  const progressMap: Record<number, boolean> = {};
  data?.forEach((item) => {
    progressMap[item.resource_id] = item.completed;
  });

  return progressMap;
}

/**
 * Reset progress for a course (useful for retaking)
 */
export async function resetCourseProgress(
  supabase: SupabaseClient,
  userId: string,
  subjectId: number
): Promise<void> {
  const { error } = await supabase
    .from("user_resource_progress")
    .delete()
    .eq("user_id", userId)
    .eq("subject_id", subjectId);

  if (error) throw error;
}
