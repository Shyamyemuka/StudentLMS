"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { notifyFacultyAndAdmin } from "@/lib/notifications/notification-service";

interface CreateCourseFormProps {
  userRole: string;
}

export default function CreateCourseForm({ userRole }: CreateCourseFormProps) {
  const [subjectCode, setSubjectCode] = useState("");
  const [title, setTitle] = useState("");
  const [regulation, setRegulation] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("499");
  const [durationNum, setDurationNum] = useState("6");
  const [durationUnit, setDurationUnit] = useState<"months" | "years">("months");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectCode.trim() || !title.trim() || !regulation.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      toast.error(
        "You must be logged in. Please refresh the page and try again.",
      );
      setIsLoading(false);
      return;
    }

    const isAutoApproved = userRole === "admin" || userRole === "faculty";

    const { error } = await supabase.from("subjects").insert({
      subject_code: subjectCode.toUpperCase().trim(),
      title: title.trim(),
      regulation: regulation.toUpperCase().trim(),
      description: description.trim() || null,
      created_by: user.id,
      // Faculty and admin get auto-approved
      status: isAutoApproved ? "approved" : "pending",
      approved_by: isAutoApproved ? user.id : null,
      approved_at: isAutoApproved ? new Date().toISOString() : null,
      price: parseFloat(price) || 0,
      access_duration_months: durationNum ? (durationUnit === "years" ? parseInt(durationNum) * 12 : parseInt(durationNum)) : null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error(
          "A course with this subject code and regulation already exists",
        );
      } else {
        toast.error(error.message);
      }
      setIsLoading(false);
      return;
    }

    if (isAutoApproved) {
      toast.success("Course created successfully!");
    } else {
      toast.success("Course submitted for approval!");

      // Notify faculty and admin about new course requiring approval
      await notifyFacultyAndAdmin(
        "new_submission",
        "New Course Awaiting Approval",
        `A new course "${title.trim()}" (${subjectCode.toUpperCase().trim()}) has been submitted and requires approval.`,
        "/admin/course-approvals",
      );
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Subject Code */}
      <div>
        <label
          htmlFor="subjectCode"
          className="block text-sm font-bold text-foreground mb-2 font-body">
          Subject Code <span className="text-destructive">*</span>
        </label>
        <input
          id="subjectCode"
          type="text"
          value={subjectCode}
          onChange={(e) => setSubjectCode(e.target.value)}
          className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium uppercase"
          placeholder="e.g., CS101, MA201"
          required
        />
        <p className="text-muted-foreground/80 text-xs mt-1 font-bold font-body">
          Unique identifier for the course
        </p>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-bold text-foreground mb-2 font-body">
          Course Title <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium"
          placeholder="e.g., Data Structures and Algorithms"
          required
        />
      </div>

      {/* Regulation */}
      <div>
        <label
          htmlFor="regulation"
          className="block text-sm font-bold text-foreground mb-2 font-body">
          Regulation <span className="text-destructive">*</span>
        </label>
        <input
          id="regulation"
          type="text"
          value={regulation}
          onChange={(e) => setRegulation(e.target.value)}
          className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium uppercase"
          placeholder="e.g., R20, R21, R22"
          required
          list="regulation-suggestions"
        />
        <datalist id="regulation-suggestions">
          <option value="R20" />
          <option value="R21" />
          <option value="R22" />
          <option value="R23" />
          <option value="R24" />
        </datalist>
        <p className="text-muted-foreground/80 text-xs mt-1 font-bold font-body">
          Academic regulation/curriculum version
        </p>
      </div>
 
      {/* Price and Access Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Price */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-bold text-foreground mb-2 font-body">
            Course Price (₹) <span className="text-destructive">*</span>
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium"
            placeholder="e.g., 499, 999"
            required
          />
          <p className="text-muted-foreground/80 text-xs mt-1 font-bold font-body">
            Set to 0 for a completely free subject
          </p>
        </div>

        {/* Access Duration (Validity) */}
        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-bold text-foreground mb-2 font-body">
            Access Validity Limit <span className="text-muted-foreground/80">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="duration"
              type="number"
              min="1"
              value={durationNum}
              onChange={(e) => setDurationNum(e.target.value)}
              className="w-2/3 bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium"
              placeholder="e.g., 6, 12, 1"
            />
            <div className="w-1/3 flex border-2 border-border rounded-xl overflow-hidden bg-muted font-bold font-body text-xs">
              <button
                type="button"
                onClick={() => setDurationUnit("months")}
                className={`flex-1 text-center py-2 transition-all cursor-pointer ${
                  durationUnit === "months"
                    ? "bg-primary text-primary-foreground font-black"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => setDurationUnit("years")}
                className={`flex-1 text-center py-2 transition-all cursor-pointer ${
                  durationUnit === "years"
                    ? "bg-primary text-primary-foreground font-black"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Y
              </button>
            </div>
          </div>
          <p className="text-muted-foreground/80 text-xs mt-1 font-bold font-body">
            Clear duration field to grant unlimited lifetime access
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-bold text-foreground mb-2 font-body">
          Description <span className="text-muted-foreground/80">(Optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium resize-none"
          placeholder="Brief description of the course content..."
        />
      </div>

      {/* Info Note for Students */}
      {userRole === "student" && (
        <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-foreground font-medium font-body">
              As a student, your course will be submitted for admin approval
              before it becomes visible to others.
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
        className="w-full bg-primary text-primary-foreground border-2 border-border py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-hard-sm cursor-pointer font-heading text-lg">
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creating...
          </span>
        ) : userRole === "student" ? (
          "Submit for Approval"
        ) : (
          "Create Course"
        )}
      </button>
    </form>
  );
}
