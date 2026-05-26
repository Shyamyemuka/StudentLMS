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
    if (clampedProgress === 100) return "bg-success"; // Green for complete
    if (clampedProgress >= 70) return "bg-primary"; // Gold for high progress
    if (clampedProgress >= 40) return "bg-secondary"; // Secondary for medium
    return "bg-muted-foreground/60"; // Muted for low progress
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden border-2 border-border",
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
            "text-xs text-muted-foreground font-bold font-body mt-1.5 text-right",
            labelClassName,
          )}>
          {clampedProgress === 100 ? (
            <span className="text-success font-black">✓ Completed</span>
          ) : (
            `${clampedProgress}% Complete`
          )}
        </p>
      )}
    </div>
  );
}
