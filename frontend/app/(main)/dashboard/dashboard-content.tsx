"use client";

import { useState, useMemo } from "react";
import { Subject } from "@/types/database";
import SubjectGrid from "@/components/subjects/subject-grid";
import SubjectSearch from "@/components/subjects/subject-search";
import { useRouter } from "next/navigation";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");

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
          style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
          className="bg-card border-2 border-border p-5 shadow-hard-sm"
        >
          <p className="text-muted-foreground text-sm font-bold">Total Courses</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {subjects.length}
          </p>
        </div>
        <div 
          style={{ borderRadius: "100px 10px 100px 10px / 10px 100px 10px 100px" }}
          className="bg-card border-2 border-border p-5 shadow-hard-sm"
        >
          <p className="text-muted-foreground text-sm font-bold">Regulations</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {regulations.length}
          </p>
        </div>
        <div 
          style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
          className="bg-card border-2 border-border p-5 shadow-hard-sm"
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
              <span className="text-3xl animate-sketch-bounce">📝</span>
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
              <span className="text-3xl text-secondary">🌐</span>
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
            style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
            className="bg-card border-2 border-border p-8 text-center shadow-hard-sm"
          >
            <p className="text-xl font-bold text-foreground font-heading">🎉 You have unlocked all available courses!</p>
            <p className="text-muted-foreground mt-2">Check back later for new subjects and content uploads.</p>
          </div>
        )}
      </div>
    </>
  );
}
