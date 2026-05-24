import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    // Only allow admin and faculty
    if (profile?.role !== "admin" && profile?.role !== "faculty") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get request body
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Use database function to reject student (no service role key needed)
    const { data, error: rejectError } = await supabase
      .rpc('reject_student_registration', { target_user_id: user_id });

    if (rejectError) {
      console.error("Error rejecting student:", rejectError);
      return NextResponse.json(
        { error: rejectError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in reject endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject student" },
      { status: 500 }
    );
  }
}
