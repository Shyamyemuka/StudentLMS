import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    const supabase = await createClient();

    // Sign out from Supabase
    await supabase.auth.signOut({ scope: "global" });

    // Get all cookies and clear any Supabase-related ones
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Create response that redirects to home page
    const response = NextResponse.json({ success: true });

    // Clear all Supabase auth cookies by setting them to expire
    allCookies.forEach((cookie) => {
        if (cookie.name.startsWith("sb-")) {
            response.cookies.set(cookie.name, "", {
                expires: new Date(0),
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
        }
    });

    return response;
}
