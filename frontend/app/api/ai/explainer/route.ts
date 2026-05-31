import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const { subjectId, analogyType, targetName, includeResources } = body;

    const subjectIdNum = parseInt(subjectId, 10);
    if (isNaN(subjectIdNum) || !targetName) {
      return NextResponse.json(
        { error: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    // Fetch subject details (title, description, code, and curated fun_context)
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id, title, subject_code, regulation, description, fun_context")
      .eq("id", subjectIdNum)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    const subjectTitle = subject.title;
    const subjectCode = subject.subject_code;
    const description = subject.description || "";
    const funContext = subject.fun_context || "";

    let resourcesText = "";
    let contextSourceText = "";

    // If requested, include resources metadata to keep token costs under control while providing deep context
    if (includeResources) {
      const { data: resources } = await supabase
        .from("resources")
        .select("title, description, type")
        .eq("subject_id", subjectIdNum)
        .eq("approved", true);

      if (resources && resources.length > 0) {
        resourcesText = resources
          .map(
            (r, index) =>
              `${index + 1}. [Type: ${r.type.toUpperCase()}] Title: "${
                r.title
              }"${r.description ? `, Description: "${r.description}"` : ""}`
          )
          .join("\n");
      }
    }

    // Construct the syllabus context based on what is available and selected
    let syllabusContext = "";
    if (funContext) {
      syllabusContext = `Faculty Curated Course Summary:\n${funContext}\n\n`;
      contextSourceText = "Use the faculty-curated course summary as the primary source of context.";
    } else {
      syllabusContext = `Course Title: ${subjectTitle}\nCourse Description: ${description}\n\n`;
      contextSourceText = "Use the course title and standard description as the primary source of context.";
    }

    if (includeResources && resourcesText) {
      syllabusContext += `Specific Course Materials & Lecture Topics:\n${resourcesText}`;
      contextSourceText += " Additionally, map specific course lectures and files listed below to enrich the analogy details.";
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    let aiResponseText = "";

    if (apiKey) {
      try {
        const prompt = `You are a supportive, wittily creative AI Study Companion built inside a Student Learning Management System (LMS) portal.
Your task is to explain the technical syllabus and concepts of the course "${subjectCode}: ${subjectTitle}" using a detailed pop-culture analogy.

Analogy Style: ${analogyType === "movie" ? "Movie" : analogyType === "series" ? "Series" : "Superhero Fight"}
Analogy Target: ${targetName}

${contextSourceText}

Syllabus/Context to Explain:
${syllabusContext}

Requirements:
1. Explain the scientific, mathematical, or engineering concepts in a highly educational, precise, yet fun and engaging manner.
2. Form clear, direct mappings between the pop-culture characters, plots, powers, or lore of "${targetName}" and the actual technical concepts of this course.
3. Keep the tone warm, clear, and encouraging, structured like a neat chalkboard blackboard presentation.
4. STRICT RULES: Do NOT include ANY emojis in your explanation. Ensure there are zero unicode pictographs, emoji icons, or colorful symbols in the final output. End statements with periods, and describe things factually.`;

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
        console.error("Gemini API error for explainer:", err);
      }
    }

    // High-quality mock fallback if no API key or request fails
    if (!aiResponseText) {
      if (analogyType === "superhero-fight") {
        aiResponseText = `Welcome to the Chalkboard. Today, we are mapping the core principles of "${subjectTitle}" (${subjectCode}) to the legendary showdown: ${targetName}.

In this arena:
- Defender 1 represents the active variables, inputs, and force vectors of our subject. Their combat moves align with the active systems we study, driving the core logic forward.
- Defender 2 represents the constraints, boundary conditions, and equilibrium requirements. Their counter-maneuvers map directly to the resistance, safety margins, and structural limits of the system.

Much like this superhero clash, balance in our course is achieved when these opposing forces interact. The dynamic collision teaches us that no variable works in isolation; every system requires calculated control and steady feedback loops to remain stable.`;
      } else {
        aiResponseText = `Welcome to the Chalkboard. Today, we are mapping the core principles of "${subjectTitle}" (${subjectCode}) to the epic narrative of ${targetName}.

Key Analogies:
- The Protagonist / Main Theme: Maps directly to the primary subject matter of our course. Just as the main lead drives the story forward, this central concept drives the application of all scientific rules.
- The Conflict / Rules of the World: Represents the physical laws, database schemas, or mathematical equations governing our course. Every event in the plot conforms strictly to these operational constraints.
- The Resolving Force: Maps to the optimization methods and problem-solving strategies we employ. The satisfying climax is reached when all variables align perfectly under these logical proofs.

In conclusion, understanding the structural layers of ${targetName} mirrors how we untangle the complex layers of "${subjectTitle}". Keep studying, and let the rules of the narrative guide your technical mastery.`;
      }
    }

    // Save/persist to database for cross-login persistence
    try {
      await supabase
        .from("subject_explainers")
        .upsert({
          user_id: user.id,
          subject_id: subjectIdNum,
          analogy_type: analogyType,
          target_name: targetName,
          explanation: aiResponseText.trim(),
          include_resources: includeResources,
        }, {
          onConflict: "user_id,subject_id"
        });
    } catch (dbErr) {
      console.error("Failed to save explanation in subject_explainers:", dbErr);
    }

    return NextResponse.json({ explanation: aiResponseText.trim() });
  } catch (err: any) {
    console.error("Explainer API server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
