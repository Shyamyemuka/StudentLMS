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
    console.error('Please create frontend/.env.local with your actual Supabase credentials');
    console.error('Copy from .env.local.example and fill in your values');
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
              // Use 'lax' for better compatibility, but allow secure cross-site
              sameSite: 'lax',
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              // Ensure cookies persist across UA changes (mobile desktop mode)
              // Use longer maxAge for session cookies
              maxAge: options?.maxAge ?? 60 * 60 * 24 * 30, // 30 days default
            })
          );
        },
      },
    }
  );

  // Refresh session if expired - this keeps users logged in
  // Wrap in try-catch to handle edge cases like flow_state errors
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Only log errors in development and if they're not "Auth session missing"
      if (process.env.NODE_ENV === 'development' && !error.message.includes('Auth session missing')) {
        console.warn('Session refresh warning:', error.message);
      }

      // If it's a flow_state error, the user just needs to re-authenticate
      // Don't return the error, just return null user
      if (error.message.includes('flow_state') || error.message.includes('invalid_grant')) {
        return { supabaseResponse, user: null };
      }
    }

    return { supabaseResponse, user };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Session refresh error:', err);
    }
    return { supabaseResponse, user: null };
  }
}