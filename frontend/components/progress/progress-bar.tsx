"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  labelClassName?: string;
}

export default function ProgressBar({
  progress,
  showLabel = true,
  size = "md",
  className,
  labelClassName,
}: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Size variants
  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  // Color based on progress
  const getProgressColor = () => {
    if (clampedProgress === 100) return "bg-[#4CAF8F]"; // Green for complete
    if (clampedProgress >= 70) return "bg-[#D4AF37]"; // Gold for high progress
    if (clampedProgress >= 40) return "bg-blue-500"; // Blue for medium
    return "bg-gray-500"; // Gray for low progress
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full bg-[#14181D] rounded-full overflow-hidden border border-[#2A2F35]",
          heights[size],
        )}>
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            getProgressColor(),
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p
          className={cn(
            "text-xs text-[#B0B0B0] mt-1.5 text-right",
            labelClassName,
          )}>
          {clampedProgress === 100 ? (
            <span className="text-[#4CAF8F] font-semibold">✓ Completed</span>
          ) : (
            `${clampedProgress}% Complete`
          )}
        </p>
      )}
    </div>
  );
}
