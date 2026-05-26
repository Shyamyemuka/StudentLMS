"use client";

import { CourseProgress } from "@/types/database";
import ProgressBar from "./progress-bar";
import { formatDistanceToNow } from "date-fns";

interface StudentProgressTableProps {
  progressList: Array<CourseProgress & { user?: any }>;
  onStudentClick?: (userId: string) => void;
}

export default function StudentProgressTable({
  progressList,
  onStudentClick,
}: StudentProgressTableProps) {
  if (progressList.length === 0) {
    return (
      <div className="text-center py-12 bg-card border-2 border-border rounded-xl shadow-hard-sm">
        <p className="text-muted-foreground font-bold">No student progress data available</p>
      </div>
    );
  }

  // Sort by progress percentage (descending)
  const sortedProgress = [...progressList].sort(
    (a, b) => b.progress_percentage - a.progress_percentage,
  );

  return (
    <div className="bg-card border-2 border-border rounded-xl shadow-hard-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/40 border-b-2 border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Resources
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-border">
            {sortedProgress.map((progress) => (
              <tr
                key={progress.user_id}
                className={`hover:bg-muted/30 transition-colors ${
                  onStudentClick ? "cursor-pointer" : ""
                }`}
                onClick={() =>
                  onStudentClick && onStudentClick(progress.user_id)
                }>
                {/* Student Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-border flex items-center justify-center mr-3">
                      <span className="text-primary font-bold text-sm">
                        {progress.user?.full_name?.charAt(0).toUpperCase() ||
                          "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {progress.user?.full_name || "Unknown Student"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Progress Bar */}
                <td className="px-6 py-4">
                  <div className="w-48">
                    <ProgressBar
                      progress={progress.progress_percentage}
                      size="sm"
                      showLabel={false}
                    />
                    <p className="text-xs text-muted-foreground font-bold mt-1">
                      {progress.progress_percentage}%
                    </p>
                  </div>
                </td>

                {/* Resources Count */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-foreground font-bold">
                    {progress.completed_resources} / {progress.total_resources}
                  </p>
                </td>

                {/* Last Active */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {progress.last_accessed ? (
                    <p className="text-sm text-muted-foreground font-bold">
                      {formatDistanceToNow(new Date(progress.last_accessed), {
                        addSuffix: true,
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 font-bold">Never</p>
                  )}
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {progress.progress_percentage === 100 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-hard-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Completed
                    </span>
                  ) : progress.progress_percentage >= 50 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border-2 border-primary/30 rounded-full text-xs font-bold text-primary shadow-hard-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      In Progress
                    </span>
                  ) : progress.progress_percentage > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/10 border-2 border-secondary/30 rounded-full text-xs font-bold text-secondary shadow-hard-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      Started
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted border-2 border-border/30 rounded-full text-xs font-bold text-muted-foreground shadow-hard-sm">
                      Not Started
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
