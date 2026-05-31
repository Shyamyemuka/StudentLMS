"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, HelpCircle } from "lucide-react";

interface Subject {
  id: number;
  title: string;
  subject_code: string;
}

interface QuestionInput {
  question_text: string;
  ideal_answer: string;
  max_score: number;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.subjectId as string;
  const subjectIdNum = parseInt(subjectId, 10);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { question_text: "", ideal_answer: "", max_score: 25 },
  ]);

  const supabase = createClient();

  useEffect(() => {
    if (isNaN(subjectIdNum)) {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [subjectIdNum]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check auth and role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirectTo=/subjects/${subjectId}/assignments/create`);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profile?.role !== "admin" && profile?.role !== "faculty") {
        toast.error("Permission denied. Only faculty or admin can create worksheets.");
        router.push(`/subjects/${subjectId}`);
        return;
      }

      // Fetch subject info
      const { data: subjectData, error: subError } = await supabase
        .from("subjects")
        .select("id, title, subject_code")
        .eq("id", subjectIdNum)
        .single();

      if (subError || !subjectData) {
        toast.error("Subject not found");
        router.push("/dashboard");
        return;
      }

      setSubject(subjectData);
    } catch (err: any) {
      console.error("Error loading create assignment page:", err);
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: "", ideal_answer: "", max_score: 25 },
    ]);
    toast.success("New question added to worksheet.");
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error("At least one question is required.");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
    toast.success("Question removed from worksheet.");
  };

  const handleQuestionChange = (
    index: number,
    field: keyof QuestionInput,
    value: string | number
  ) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Please enter the question text for Question ${i + 1}`);
        return;
      }
      if (isNaN(q.max_score) || q.max_score <= 0) {
        toast.error(`Please enter a valid maximum score greater than 0 for Question ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Session expired");

      // Structure questions with unique IDs
      const structuredQuestions = questions.map((q, idx) => ({
        id: idx + 1,
        question_text: q.question_text.trim(),
        ideal_answer: q.ideal_answer.trim(),
        max_score: Number(q.max_score),
      }));

      const response = await fetch("/api/assignments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: subjectIdNum,
          title: title.trim(),
          questions: questions.map((q, idx) => ({
            id: idx + 1,
            question_text: q.question_text.trim(),
            ideal_answer: q.ideal_answer.trim(),
            max_score: Number(q.max_score),
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to publish worksheet");
      }

      toast.success("Worksheet published successfully!");
      router.push(`/subjects/${subjectId}`);
    } catch (err: any) {
      console.error("Error creating assignment:", err);
      toast.error(err?.message || "Failed to publish assignment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="New Worksheet" subtitle="Loading..." showBackButton backHref={`/subjects/${subjectId}`}>
        <div className="text-center py-12 text-muted-foreground font-bold font-body">
          Validating authorization credentials...
        </div>
      </PageContainer>
    );
  }

  const totalPoints = questions.reduce(
    (sum, q) => sum + (Number(q.max_score) || 0),
    0
  );

  return (
    <PageContainer
      title="Create Assignment"
      subtitle={subject ? `${subject.subject_code} - ${subject.title}` : ""}
      showBackButton
      backHref={`/subjects/${subjectId}`}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Metadata Card */}
          <Card className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md relative">
            <div className="tape-decor" />
            <h3 className="text-base font-bold text-foreground font-heading mb-4 pt-3 flex items-center gap-1.5">
              Worksheet Information
            </h3>
            
            <div className="space-y-4 font-body">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Worksheet Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Unit 3: Advanced Thermodynamics Problems"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl focus:border-primary focus:outline-none font-bold"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Total points summary */}
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/40">
                <span>Number of Questions: {questions.length}</span>
                <span className="text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                  Total points: {totalPoints}
                </span>
              </div>
            </div>
          </Card>

          {/* Questions Editor Series */}
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <Card
                key={idx}
                className="bg-card border-2 border-border rounded-xl p-6 shadow-hard-md space-y-4 relative"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-border/40">
                  <span className="px-3 py-1 bg-primary text-primary-foreground border-2 border-border rounded-xl text-xs font-bold font-body shadow-hard-sm">
                    Question {idx + 1}
                  </span>
                  
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg border-2 border-transparent hover:border-destructive/20 hover:bg-destructive/10 transition-all cursor-pointer"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4 font-body">
                  {/* Question Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Question</label>
                    <textarea
                      placeholder="Write your question details or prompts..."
                      value={q.question_text}
                      onChange={(e) => handleQuestionChange(idx, "question_text", e.target.value)}
                      rows={3}
                      className="w-full bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl p-3 focus:border-primary focus:outline-none font-bold font-body resize-none"
                      disabled={submitting}
                      required
                    />
                  </div>

                  {/* Ideal Reference Answer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-xs font-bold text-foreground">
                        Ideal Answer Criteria <span className="text-[10px] text-muted-foreground font-normal">(Optional: AI will auto-generate if left blank)</span>
                      </label>
                      <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        💡 Key terms used by AI evaluator
                      </span>
                    </div>
                    <textarea
                      placeholder="Write the ideal correct response... or leave completely blank for auto AI generation."
                      value={q.ideal_answer}
                      onChange={(e) => handleQuestionChange(idx, "ideal_answer", e.target.value)}
                      rows={3}
                      className="w-full bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl p-3 focus:border-primary focus:outline-none font-bold font-body resize-none"
                      disabled={submitting}
                    />
                  </div>

                  {/* Question Score */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Max Question Score (Points)</label>
                    <Input
                      type="number"
                      placeholder="25"
                      value={q.max_score}
                      onChange={(e) => handleQuestionChange(idx, "max_score", parseInt(e.target.value, 10) || 0)}
                      className="bg-background border-2 border-border text-foreground placeholder:text-muted-foreground/60 rounded-xl focus:border-primary focus:outline-none font-bold"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add Question Button */}
          <Button
            type="button"
            onClick={handleAddQuestion}
            disabled={submitting}
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            className="w-full bg-secondary/15 hover:bg-secondary/20 text-secondary border-2 border-secondary/30 rounded-xl font-bold p-3 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-hard-sm"
          >
            <Plus className="w-4 h-4" />
            Add Another Question
          </Button>

          {/* Submit Block */}
          <div className="pt-4 flex gap-4">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-primary-foreground border-2 border-border rounded-xl font-bold p-3 shadow-hard-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              {submitting ? "Publishing Worksheet..." : "Publish Assignment"}
            </Button>
            <Button
              type="button"
              onClick={() => router.push(`/subjects/${subjectId}`)}
              variant="outline"
              className="bg-transparent border-2 border-border text-muted-foreground hover:bg-muted font-bold rounded-xl p-3 shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
