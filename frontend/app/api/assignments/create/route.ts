import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface QuestionInput {
  id: number;
  question_text: string;
  ideal_answer: string;
  max_score: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "faculty") {
      return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { subjectId, title, questions } = body; // questions is QuestionInput[]

    if (!subjectId || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const processedQuestions: QuestionInput[] = [];

    // 3. Process questions and generate reference answers if empty
    for (const q of questions) {
      let idealAnswer = (q.ideal_answer || "").trim();

      if (!idealAnswer) {
        if (apiKey) {
          try {
            console.log(`Generating AI reference correct answer for question: "${q.question_text}"`);
            const prompt = `
              You are an expert academic evaluator. Please write a highly detailed, professional, and technically accurate reference correct answer for the following question. 
              This will serve as the master grading rubric against which student answers will be evaluated.
              
              Question: "${q.question_text}"
              
              Respond with only the clean reference answer text. Do not include any intros or extra conversation. Just the ideal correct response.
            `;

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: prompt,
                        },
                      ],
                    },
                  ],
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textResponse) {
                idealAnswer = textResponse.trim();
              }
            }
          } catch (err) {
            console.error("AI ideal answer generation failed, using fallback:", err);
          }
        }

        // Fallback if API key is missing or fails
        if (!idealAnswer) {
          idealAnswer = "Reference details compiled based on course syllabus guidelines.";
        }
      }

      processedQuestions.push({
        id: q.id,
        question_text: q.question_text.trim(),
        ideal_answer: idealAnswer,
        max_score: Number(q.max_score),
      });
    }

    // Calculate total max score
    const totalMaxScore = processedQuestions.reduce(
      (sum, q) => sum + q.max_score,
      0
    );

    // 4. Save assignment to database
    const { data: assignment, error: dbError } = await supabase
      .from("assignments")
      .insert({
        subject_id: Number(subjectId),
        title: title.trim(),
        questions: processedQuestions,
        max_score: totalMaxScore,
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
