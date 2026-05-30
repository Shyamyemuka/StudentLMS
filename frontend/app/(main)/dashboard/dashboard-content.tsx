"use client";

import { useState, useMemo, useEffect } from "react";
import { Subject } from "@/types/database";
import SubjectGrid from "@/components/subjects/subject-grid";
import SubjectSearch from "@/components/subjects/subject-search";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface DashboardContentProps {
  subjects: Subject[];
  regulations: string[];
  userRole?: string;
  unlockedSubjectIds?: number[];
  isGuest?: boolean;
}

export default function DashboardContent({
  subjects,
  regulations,
  userRole,
  unlockedSubjectIds = [],
  isGuest = false,
}: DashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [failedSubject, setFailedSubject] = useState("");
  const [failedReason, setFailedReason] = useState("");

  useEffect(() => {
    const paymentFailed = searchParams.get("payment_failed");
    const subjectTitle = searchParams.get("subject_title");
    const reason = searchParams.get("reason");

    if (paymentFailed) {
      const displayReason = reason || "Transaction rejected.";
      setFailedSubject(subjectTitle || "Subject");
      setFailedReason(displayReason);
      setShowErrorBanner(true);

      const timer = setTimeout(() => {
        toast.error(
          `Payment failed for course "${subjectTitle || "Subject"}": ${displayReason}. The subject remains locked.`,
          {
            duration: 6000,
          }
        );

        // Clean up the URL parameters so the toast doesn't re-trigger on reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        subject.subject_code
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        subject.title.toLowerCase().includes(searchQuery.toLowerCase());

      // Regulation filter
      const matchesRegulation =
        selectedRegulation === "" || subject.regulation === selectedRegulation;

      return matchesSearch && matchesRegulation;
    });
  }, [subjects, searchQuery, selectedRegulation]);

  // Split subjects into enrolled/paid (My Courses) and available (unpaid)
  const myCourses = useMemo(() => {
    return filteredSubjects.filter((subject) =>
      unlockedSubjectIds.includes(Number(subject.id))
    );
  }, [filteredSubjects, unlockedSubjectIds]);

  const availableCourses = useMemo(() => {
    return filteredSubjects.filter((subject) =>
      !unlockedSubjectIds.includes(Number(subject.id))
    );
  }, [filteredSubjects, unlockedSubjectIds]);

  const isStudent = userRole === "student";

  return (
    <>
      {showErrorBanner && (
        <div 
          className="bg-[#C94A4A]/10 border-2 border-[#C94A4A] rounded-xl p-4 mb-6 flex items-start justify-between gap-3 font-heading shadow-hard-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-sketch-bounce">⚠️</span>
            <div>
              <p className="font-bold text-[#C94A4A] text-lg">Payment Unsuccessful</p>
              <p className="text-xs text-foreground font-bold mt-1 leading-relaxed">
                The payment for course <span className="underline decoration-dashed font-black">{failedSubject}</span> failed ({failedReason}). The subject remains locked.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowErrorBanner(false)}
            className="text-[#C94A4A] font-black hover:scale-110 active:scale-90 transition-all text-sm shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <SubjectSearch
        onSearch={setSearchQuery}
        onRegulationFilter={setSelectedRegulation}
        regulations={regulations}
        selectedRegulation={selectedRegulation}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div 
          className="bg-card border-2 border-border rounded-xl p-5 shadow-hard-sm"
        >
          <p className="text-muted-foreground text-sm font-bold">Total Courses</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {subjects.length}
          </p>
        </div>
        <div 
          className="bg-card border-2 border-border rounded-xl p-5 shadow-hard-sm"
        >
          <p className="text-muted-foreground text-sm font-bold">Regulations</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {regulations.length}
          </p>
        </div>
        <div 
          className="bg-card border-2 border-border rounded-xl p-5 shadow-hard-sm"
        >
          <p className="text-muted-foreground text-sm font-bold">Filtered Results</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {filteredSubjects.length}
          </p>
        </div>
      </div>

      {/* Courses Display */}
      <div className="space-y-12">
        {/* My Courses Section - Only display if student has paid courses, or if admin/faculty */}
        {((isStudent && myCourses.length > 0) || (!isStudent && !isGuest)) && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground font-heading flex items-center gap-2">
              {isStudent ? "My Courses" : "All Courses"}
            </h2>
            <SubjectGrid
              subjects={isStudent ? myCourses : filteredSubjects}
              unlockedSubjectIds={unlockedSubjectIds}
              userRole={userRole}
              isGuest={isGuest}
              emptyMessage={
                searchQuery || selectedRegulation
                  ? "No enrolled courses match your search"
                  : "You haven't enrolled in any courses yet!"
              }
              canDelete={userRole === "faculty" || userRole === "admin"}
              onSubjectDeleted={() => router.refresh()}
            />
          </div>
        )}

        {/* Available Courses Section - Display for students (if there are unpaid courses) or guests */}
        {((isStudent && availableCourses.length > 0) || isGuest) && (
          <div className={`space-y-4 ${isStudent && myCourses.length > 0 ? "pt-8 border-t-2 border-dashed border-border" : ""}`}>
            <h2 className="text-2xl font-bold text-foreground font-heading flex items-center gap-2">
              Available Courses
            </h2>
            <SubjectGrid
              subjects={isStudent ? availableCourses : filteredSubjects}
              unlockedSubjectIds={unlockedSubjectIds}
              userRole={userRole}
              isGuest={isGuest}
              emptyMessage={
                searchQuery || selectedRegulation
                  ? "No available courses match your search"
                  : "No courses available for enrollment right now."
              }
              canDelete={userRole === "faculty" || userRole === "admin"}
              onSubjectDeleted={() => router.refresh()}
            />
          </div>
        )}

        {/* Clean Call to Action if Student has purchased everything */}
        {isStudent && myCourses.length > 0 && availableCourses.length === 0 && (
          <div 
            className="bg-card border-2 border-border rounded-xl p-8 text-center shadow-hard-sm"
          >
            <p className="text-xl font-bold text-foreground font-heading">🎉 You have unlocked all available courses!</p>
            <p className="text-muted-foreground mt-2">Check back later for new subjects and content uploads.</p>
          </div>
        )}
      </div>
    </>
  );
}
