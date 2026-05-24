"use client";

import { CourseProgress } from "@/types/database";
import ProgressBar from "./progress-bar";
import { formatDistanceToNow } from "date-fns";
import { formatDate } from "@/lib/utils";

interface CourseProgressCardProps {
  progress: CourseProgress;
  showDetails?: boolean;
  onClick?: () => void;
}

export default function CourseProgressCard({
  progress,
  showDetails = true,
  onClick,
}: CourseProgressCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`bg-[#14181D] border border-[#2A2F35] rounded-lg p-5 ${
        isClickable
          ? "cursor-pointer hover:border-[#D4AF37]/50 transition-colors"
          : ""
      }`}
      onClick={onClick}>
      {/* Course Name */}
      {progress.subject && (
        <h3 className="text-lg font-semibold text-[#EAEAEA] mb-3">
          {progress.subject.title}
        </h3>
      )}

      {/* Progress Bar */}
      <ProgressBar progress={progress.progress_percentage} size="lg" />

      {/* Details */}
      {showDetails && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {/* Resources Completed */}
          <div>
            <p className="text-[#707070] text-xs mb-1">Resources</p>
            <p className="text-[#EAEAEA] font-medium">
              {progress.completed_resources} / {progress.total_resources}
            </p>
          </div>

          {/* Last Accessed */}
          {progress.last_accessed && (
            <div>
              <p className="text-[#707070] text-xs mb-1">Last Accessed</p>
              <p className="text-[#EAEAEA] font-medium">
                {formatDistanceToNow(new Date(progress.last_accessed), {
                  addSuffix: true,
                })}
              </p>
            </div>
          )}

          {/* Started Date */}
          {progress.started_at && (
            <div>
              <p className="text-[#707070] text-xs mb-1">Started</p>
              <p className="text-[#EAEAEA] font-medium">
                {formatDate(progress.started_at)}
              </p>
            </div>
          )}

          {/* Completed Date */}
          {progress.completed_at && (
            <div>
              <p className="text-[#707070] text-xs mb-1">Completed</p>
              <p className="text-[#4CAF8F] font-semibold">
                {formatDate(progress.completed_at)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status Badge */}
      {progress.progress_percentage === 100 && (
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#4CAF8F]/10 border border-[#4CAF8F]/30 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#4CAF8F]"></span>
          <span className="text-[#4CAF8F] text-xs font-medium">
            Course Completed
          </span>
        </div>
      )}
    </div>
  );
}
