import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl.includes('your_') || 
      supabaseKey.includes('your_') ||
      !supabaseUrl.startsWith('http')) {
    console.error('❌ Invalid or missing Supabase environment variables');
    return { supabaseResponse, user: null };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              maxAge: options?.maxAge ?? 60 * 60 * 24 * 30, // 30 days default
            })
          );
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

  // Race the Supabase call against a 5-second timeout.
  // Without this, a slow/offline Supabase connection blocks EVERY page request
  // for 60-70 seconds, causing the 4-6 minute render times seen in the terminal.
  try {
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>(
      (resolve) =>
        setTimeout(
          () =>
            resolve({
              data: { user: null },
              error: new Error("Supabase auth timeout"),
            }),
          5000
        )
    );

    const {
      data: { user },
      error,
    } = await Promise.race([supabase.auth.getUser(), timeoutPromise]);

    if (error) {
      const msg = error.message ?? "";
      const isNoisy =
        msg.includes("Auth session missing") ||
        msg.includes("Supabase auth timeout") ||
        msg.includes("fetch failed");
      if (process.env.NODE_ENV === "development" && !isNoisy) {
        console.warn("Session refresh warning:", msg);
      }

      if (
        msg.includes("flow_state") ||
        msg.includes("invalid_grant") ||
        msg.includes("Supabase auth timeout") ||
        msg.includes("fetch failed")
      ) {
        return { supabaseResponse, user: null };
      }
    }

    return { supabaseResponse, user };
  } catch (err) {
    // Network error — don't block the request, just proceed as unauthenticated
    return { supabaseResponse, user: null };
  }
}