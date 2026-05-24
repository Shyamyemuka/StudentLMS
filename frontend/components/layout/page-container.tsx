"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

export default function PageContainer({
  children,
  title,
  subtitle,
  action,
  showBackButton = false,
  backHref,
}: PageContainerProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B0D10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        {showBackButton && (
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-[#B0B0B0] hover:text-[#D4AF37] mb-6 transition-colors group">
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        )}

        {/* Page Header */}
        {(title || subtitle || action) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              {title && (
                <h1 className="text-2xl md:text-3xl font-semibold text-[#D4AF37]">
                  {title}
                </h1>
              )}
              {subtitle && <p className="text-[#B0B0B0] mt-1">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
