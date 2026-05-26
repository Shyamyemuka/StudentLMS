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
      className={`bg-card border-2 border-border rounded-xl p-5 shadow-hard-sm transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:border-primary/50 hover:scale-[1.01]"
          : ""
      }`}
      onClick={onClick}>
      {/* Course Name */}
      {progress.subject && (
        <h3 className="text-lg font-bold text-foreground mb-3 font-heading">
          {progress.subject.title}
        </h3>
      )}

      {/* Progress Bar */}
      <ProgressBar progress={progress.progress_percentage} size="lg" />

      {/* Details */}
      {showDetails && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-body font-bold">
          {/* Resources Completed */}
          <div>
            <p className="text-muted-foreground/80 text-xs mb-1">Resources</p>
            <p className="text-foreground font-black">
              {progress.completed_resources} / {progress.total_resources}
            </p>
          </div>

          {/* Last Accessed */}
          {progress.last_accessed && (
            <div>
              <p className="text-muted-foreground/80 text-xs mb-1">Last Accessed</p>
              <p className="text-foreground font-black">
                {formatDistanceToNow(new Date(progress.last_accessed), {
                  addSuffix: true,
                })}
              </p>
            </div>
          )}

          {/* Started Date */}
          {progress.started_at && (
            <div>
              <p className="text-muted-foreground/80 text-xs mb-1">Started</p>
              <p className="text-foreground font-black">
                {formatDate(progress.started_at)}
              </p>
            </div>
          )}

          {/* Completed Date */}
          {progress.completed_at && (
            <div>
              <p className="text-muted-foreground/80 text-xs mb-1">Completed</p>
              <p className="text-success font-black">
                {formatDate(progress.completed_at)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status Badge */}
      {progress.progress_percentage === 100 && (
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-success/20 border-2 border-success/30 rounded-full font-body font-bold">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          <span className="text-success text-xs font-black">
            Course Completed
          </span>
        </div>
      )}
    </div>
  );
}
