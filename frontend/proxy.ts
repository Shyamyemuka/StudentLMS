import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/auth/callback", "/dashboard"];

// Routes only for admin
const adminRoutes = ["/admin"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname, searchParams } = request.nextUrl;

  // Allow auth callback route - must happen before session update
  if (pathname.startsWith("/auth/callback")) {
    return supabaseResponse;
  }

  // Handle login page with error fragment (from failed OAuth attempts)
  // These can happen when mobile browsers cache stale auth URLs
  if (pathname === "/login") {
    const error = searchParams.get("error");
    // If there's a flow_state error, clear the URL to prevent confusion
    if (error === "server_error" || error === "flow_state_not_found") {
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.search = ""; // Clear all query params
      return NextResponse.redirect(cleanUrl);
    }
    return supabaseResponse;
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return supabaseResponse;
  }

  // Check if user is authenticated for protected routes
  if (!user && !publicRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Only add redirectTo if it's not an error redirect
    if (!searchParams.has("error")) {
      url.searchParams.set("redirectTo", pathname);
    }
    // Clear any hash/fragment that might contain error info
    url.hash = "";
    return NextResponse.redirect(url);
  }

  // For admin routes, we'll check role in the page itself
  // (since we need to query the database)

  return supabaseResponse;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|api).*)",
  ],
};