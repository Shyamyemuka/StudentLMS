import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subjectId, videoTimestampSec, fatigueLevel, engagementLevel } = body;

    if (
      subjectId === undefined ||
      videoTimestampSec === undefined ||
      fatigueLevel === undefined ||
      engagementLevel === undefined
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("video_attention_logs")
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        resource_id: parseInt(resourceId),
        video_timestamp_sec: Math.floor(videoTimestampSec),
        fatigue_level: parseFloat(fatigueLevel),
        engagement_level: parseFloat(engagementLevel),
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting attention log:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message || "Invalid payload" }, { status: 400 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const supabase = await createClient();

  // Check authentication & role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isFacultyOrAdmin = profile && (profile.role === "admin" || profile.role === "faculty");

  if (!isFacultyOrAdmin) {
    return NextResponse.json({ error: "Access denied. Faculty or Admin only." }, { status: 403 });
  }

  try {
    // Fetch all logs for this resource to aggregate
    const { data: logs, error } = await supabase
      .from("video_attention_logs")
      .select("video_timestamp_sec, fatigue_level, engagement_level")
      .eq("resource_id", parseInt(resourceId));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({ timeline: [] });
    }

    // Aggregate data into 5-second bins to create a smooth timeline
    const binSize = 5;
    const bins: Record<number, { fatigueSum: number; engagementSum: number; count: number }> = {};

    logs.forEach((log) => {
      const binTime = Math.floor(log.video_timestamp_sec / binSize) * binSize;
      if (!bins[binTime]) {
        bins[binTime] = { fatigueSum: 0, engagementSum: 0, count: 0 };
      }
      bins[binTime].fatigueSum += Number(log.fatigue_level);
      bins[binTime].engagementSum += Number(log.engagement_level);
      bins[binTime].count += 1;
    });

    // Format for the frontend chart
    const timeline = Object.keys(bins)
      .map((key) => {
        const time = parseInt(key);
        const bin = bins[time];
        return {
          timestamp: time,
          avgFatigue: Math.round(bin.fatigueSum / bin.count),
          avgEngagement: Math.round(bin.engagementSum / bin.count),
          count: bin.count,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json({ timeline });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
