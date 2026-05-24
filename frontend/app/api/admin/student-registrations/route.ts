import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
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

    if (profile?.role !== "admin" && profile?.role !== "faculty") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "pending";

    // Query profiles table
    let query = supabase
      .from("profiles")
      .select("user_id, full_name, phone, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (filter === "pending") {
      query = query.eq("role", "student_pending");
    } else if (filter === "approved") {
      query = query.eq("role", "student");
    } else if (filter === "rejected") {
      query = query.eq("role", "rejected_student");
    } else {
      // All: show student_pending and student roles
      query = query.in("role", ["student_pending", "student"]);
    }

    const { data: profiles, error: profileError } = await query;

    if (profileError) throw profileError;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ registrations: [] });
    }

    // Get emails using the database function (no service role key needed)
    const { data: emailsData, error: emailsError } = await supabase
      .rpc('get_pending_student_emails');

    if (emailsError) {
      console.error("Error fetching user emails:", emailsError);
      // Return profiles without emails if function call fails
      const registrationsWithoutEmail = profiles.map((profile) => ({
        ...profile,
        email: "No email (function error)",
      }));
      return NextResponse.json({ registrations: registrationsWithoutEmail });
    }

    // Map emails to profiles
    const registrations = profiles.map((profile) => {
      const emailRecord = emailsData?.find((e: any) => e.user_id === profile.user_id);
      return {
        ...profile,
        email: emailRecord?.email || "No email found",
      };
    });

    console.log("Total email records:", emailsData?.length || 0);
    console.log("Total profiles:", profiles.length);
    console.log("Registrations with emails:", registrations);

    return NextResponse.json({ registrations });
  } catch (error: any) {
    console.error("Error fetching student registrations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
