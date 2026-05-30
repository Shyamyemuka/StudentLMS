import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
    const { resourceId, timestamp, summaryType } = body;

    if (!resourceId) {
      return NextResponse.json({ error: "Missing resourceId" }, { status: 400 });
    }

    // Fetch resource details to provide rich context to the AI model
    const { data: resource } = await supabase
      .from("resources")
      .select("*, subject:subjects(title, subject_code)")
      .eq("id", resourceId)
      .single();

    const resourceTitle = resource?.title || "Video Lecture";
    const subjectTitle = resource?.subject?.title || "LMS Subject";
    const subjectCode = resource?.subject?.subject_code || "LMS101";

    const minutes = Math.floor((timestamp || 0) / 60);
    const seconds = Math.floor((timestamp || 0) % 60);
    const timeFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    let aiResponseText = "";

    if (summaryType === "fatigue") {
      // Generate fatigue intervention/stretch suggestion
      if (apiKey) {
        try {
          const prompt = `You are a supportive, high-fidelity AI Study Companion built inside a Student Learning Management System (LMS) portal. 
          A student is watching a video lecture titled "${resourceTitle}" in the course "${subjectCode}: ${subjectTitle}".
          At the timestamp ${timeFormatted}, they are showing signs of heavy fatigue (study tiredness, eyes drooping).
          Suggest a quick, encouraging 2-minute physical stretch break or a focus resetting exercise. 
          Respond in exactly 2-3 warm, motivating sentences. Use a friendly chalkboard style tone. No emojis in output.`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );
          const data = await res.json();
          aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (err) {
          console.error("Gemini API error for fatigue:", err);
        }
      }

      // High-quality fallback if no API key or request fails
      if (!aiResponseText) {
        const fallbacks = [
          `You look like you're working hard on "${resourceTitle}". Let's take a 2-minute screen-free break. Try standing up, rolling your shoulders back, and looking out a window to rest your eyes before continuing.`,
          `Study fatigue is completely normal during tough topics like "${resourceTitle}". Close your eyes, take three deep, slow breaths, and stretch your arms overhead. When you open them, we will tackle the next part together.`,
          `Time for a quick stretch check. Stand up, touch your toes, and stretch your neck side to side to release tension. Your brain will thank you, and we'll resume "${resourceTitle}" in two minutes.`
        ];
        aiResponseText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

    } else {
      // Generate Lecture Summary
      if (apiKey) {
        try {
          const prompt = `You are a supportive, high-fidelity AI Study Companion built inside a Student Learning Management System (LMS) portal. 
          A student is watching a video lecture titled "${resourceTitle}" in the course "${subjectCode}: ${subjectTitle}".
          They are currently at timestamp ${timeFormatted} and are feeling fatigued.
          Generate a concise, professional 3-sentence summary of what was likely discussed in the last 5 minutes of this lecture (leading up to ${timeFormatted}).
          Keep it highly educational, relevant to "${resourceTitle}", and helpful for study review. Do not use emojis.`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );
          const data = await res.json();
          aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (err) {
          console.error("Gemini API error for summary:", err);
        }
      }

      // High-quality fallback if no API key or request fails
      if (!aiResponseText) {
        aiResponseText = `In this segment of "${resourceTitle}", the lecture dives deep into the foundational methodologies and core principles of the topic. The instructor highlights how these concepts integrate with the broader curriculum of ${subjectCode}. Understanding this section is critical, as it forms the basis for the advanced practical applications covered later in the course.`;
      }
    }

    return NextResponse.json({ summary: aiResponseText.trim() });
  } catch (err: any) {
    console.error("Gemini API server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
