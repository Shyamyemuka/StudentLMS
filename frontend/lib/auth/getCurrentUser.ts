import { createClient } from '@/lib/supabase/client';

/**
 * Get the current authenticated user
 * This uses getSession instead of getUser for more reliable auth checks
 * @returns The user object or null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = createClient();
  
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Auth error:', error);
    return null;
  }

  return session?.user || null;
}

/**
 * Check if user is authenticated
 * @returns boolean indicating if user is logged in
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Get current user ID
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}
