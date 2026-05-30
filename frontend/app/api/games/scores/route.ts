import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { game_id, score } = await req.json();

    if (!game_id || score === undefined || score < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { error } = await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id,
      score,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("game_id");

    if (!gameId) {
      return NextResponse.json({ error: "Missing game_id" }, { status: 400 });
    }

    // Dynamic query: get high scores joined with student profile names
    const { data, error } = await supabase
      .from("game_scores")
      .select(`
        score,
        user_id,
        created_at,
        profile:profiles (
          full_name,
          role
        )
      `)
      .eq("game_id", gameId)
      .order("score", { ascending: false });

    if (error) throw error;

    // Deduplicate profiles to show only the absolute MAX score per user
    const uniqueLeadersMap = new Map<string, any>();
    for (const entry of (data || [])) {
      const uId = entry.user_id;
      // profiles joins can return arrays or objects from Supabase depending on mapping
      const profileInfo = Array.isArray(entry.profile) ? entry.profile[0] : entry.profile;
      
      if (!uniqueLeadersMap.has(uId)) {
        uniqueLeadersMap.set(uId, {
          user_id: uId,
          full_name: profileInfo?.full_name || "Anonymous Learner",
          score: entry.score,
          created_at: entry.created_at,
        });
      }
    }

    const leaderboard = Array.from(uniqueLeadersMap.values()).slice(0, 10);

    return NextResponse.json({ leaderboard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
