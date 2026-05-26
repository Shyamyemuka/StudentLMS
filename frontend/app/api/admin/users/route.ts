import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Only allow admin
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Query profiles table
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (profileError) throw profileError;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Get emails using the database function (no service role key needed)
    const { data: emailsData, error: emailsError } = await supabase
      .rpc('get_all_user_emails');

    if (emailsError) {
      console.error("Error fetching user emails:", emailsError);
      // Return profiles without emails if function call fails
      const usersWithoutEmail = profiles.map((profile) => ({
        ...profile,
        email: "No email (function error)",
      }));
      return NextResponse.json({ users: usersWithoutEmail });
    }

    // Map emails to profiles
    const users = profiles.map((profile) => {
      const emailRecord = emailsData?.find((e: any) => e.user_id === profile.user_id);
      return {
        ...profile,
        email: emailRecord?.email || "No email found",
      };
    });

    console.log("Total email records:", emailsData?.length || 0);
    console.log("Total profiles:", profiles.length);

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}
