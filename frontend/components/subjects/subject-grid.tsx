"use client";

import { Subject } from "@/types/database";
import SubjectCard from "./subject-card";
import { GraduationCap } from "lucide-react";

interface SubjectGridProps {
  subjects: Subject[];
  unlockedSubjectIds?: number[];
  userRole?: string;
  isGuest?: boolean;
  showStatus?: boolean;
  emptyMessage?: string;
  canDelete?: boolean;
  onSubjectDeleted?: () => void;
}

export default function SubjectGrid({
  subjects,
  unlockedSubjectIds = [],
  userRole = "student",
  isGuest = false,
  showStatus = false,
  emptyMessage = "No courses found",
  canDelete = false,
  onSubjectDeleted,
}: SubjectGridProps) {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-hard-sm wobbly-border animate-sketch-bounce">
          <GraduationCap className="w-8 h-8 text-muted-foreground" strokeWidth={2} />
        </div>
        <p className="text-muted-foreground font-bold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject) => {
        // A subject is locked if the user is not an admin/faculty and this subject ID is NOT in the unlocked array
        const isLocked = userRole !== "admin" && userRole !== "faculty" && !unlockedSubjectIds.includes(Number(subject.id));

        return (
          <SubjectCard
            key={subject.id}
            subject={subject}
            isLocked={isLocked}
            isGuest={isGuest}
            showStatus={showStatus}
            canDelete={canDelete}
            onDelete={onSubjectDeleted}
          />
        );
      })}
    </div>
  );
}
