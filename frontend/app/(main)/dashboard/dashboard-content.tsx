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

      {/* Subject Grid */}
      <SubjectGrid
        subjects={filteredSubjects}
        unlockedSubjectIds={unlockedSubjectIds}
        userRole={userRole}
        isGuest={isGuest}
        emptyMessage={
          searchQuery || selectedRegulation
            ? "No courses match your search criteria"
            : userRole === "student"
              ? "No courses available yet. Check back later!"
              : "No courses available yet. Create one to get started!"
        }
        canDelete={userRole === "faculty" || userRole === "admin"}
        onSubjectDeleted={() => router.refresh()}
      />
    </>
  );
}
