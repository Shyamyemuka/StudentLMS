import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '❌ Missing Supabase environment variables!\n' +
      'Please check your frontend/.env.local file:\n' +
      '1. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set\n' +
      '2. File should be at: frontend/.env.local (not in root)\n' +
      '3. Restart your dev server after updating .env.local\n\n' +
      `Current URL: ${supabaseUrl || 'undefined'}\n` +
      `Current Key: ${supabaseKey ? 'exists but may be invalid' : 'undefined'}`
    );
  }

  // Trim whitespace
  const trimmedUrl = supabaseUrl.trim();
  const trimmedKey = supabaseKey.trim();

  // Validate URL format
  if (!trimmedUrl.startsWith('http')) {
    throw new Error(
      `❌ Invalid Supabase URL format!\n` +
      `Expected: https://your-project.supabase.co\n` +
      `Got: ${trimmedUrl}`
    );
  }

  // Check for placeholder values
  if (trimmedUrl.includes('your_') || trimmedKey.includes('your_')) {
    throw new Error(
      '❌ Placeholder values detected in .env.local!\n' +
      'Please replace "your_..." with actual credentials from Supabase dashboard'
    );
  }

  return createServerClient(
    trimmedUrl,
    trimmedKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
      // Set a short timeout for fetch to prevent server-side hangs
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });
        },
      },
    }
  );
}

export async function getUser() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch (err) {
    console.error("Supabase getUser timeout/error:", err);
    return null;
  }
}

export async function getSession() {
  const supabase = await createClient();
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) return null;
    return session;
  } catch (err) {
    console.error("Supabase getSession timeout/error:", err);
    return null;
  }
}