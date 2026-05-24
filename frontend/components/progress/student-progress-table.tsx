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
      <div className="text-center py-12 bg-[#14181D] border border-[#2A2F35] rounded-lg">
        <p className="text-[#707070]">No student progress data available</p>
      </div>
    );
  }

  // Sort by progress percentage (descending)
  const sortedProgress = [...progressList].sort(
    (a, b) => b.progress_percentage - a.progress_percentage,
  );

  return (
    <div className="bg-[#14181D] border border-[#2A2F35] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0B0D10] border-b border-[#2A2F35]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#707070] uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#707070] uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#707070] uppercase tracking-wider">
                Resources
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#707070] uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#707070] uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2F35]">
            {sortedProgress.map((progress) => (
              <tr
                key={progress.user_id}
                className={`hover:bg-[#0B0D10]/50 transition-colors ${
                  onStudentClick ? "cursor-pointer" : ""
                }`}
                onClick={() =>
                  onStudentClick && onStudentClick(progress.user_id)
                }>
                {/* Student Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mr-3">
                      <span className="text-[#D4AF37] font-medium text-sm">
                        {progress.user?.full_name?.charAt(0).toUpperCase() ||
                          "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#EAEAEA]">
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
                    <p className="text-xs text-[#B0B0B0] mt-1">
                      {progress.progress_percentage}%
                    </p>
                  </div>
                </td>

                {/* Resources Count */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-[#EAEAEA]">
                    {progress.completed_resources} / {progress.total_resources}
                  </p>
                </td>

                {/* Last Active */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {progress.last_accessed ? (
                    <p className="text-sm text-[#B0B0B0]">
                      {formatDistanceToNow(new Date(progress.last_accessed), {
                        addSuffix: true,
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-[#707070]">Never</p>
                  )}
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {progress.progress_percentage === 100 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#4CAF8F]/10 border border-[#4CAF8F]/30 rounded-full text-xs font-medium text-[#4CAF8F]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF8F]"></span>
                      Completed
                    </span>
                  ) : progress.progress_percentage >= 50 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-xs font-medium text-[#D4AF37]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                      In Progress
                    </span>
                  ) : progress.progress_percentage > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-medium text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      Started
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#707070]/10 border border-[#707070]/30 rounded-full text-xs font-medium text-[#707070]">
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
