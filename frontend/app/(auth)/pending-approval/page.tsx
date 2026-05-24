"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleBackToHome = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="w-full max-w-md text-center">
      {/* Back Button */}
      <button
        onClick={handleBackToHome}
        className="inline-flex items-center gap-2 text-[#B0B0B0] hover:text-[#D4AF37] mb-8 transition-colors group">
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
        <span className="font-medium">Back to Home</span>
      </button>

      {/* Icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-[#D4AF37]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl text-[#D4AF37] mb-4 font-semibold">
        Account Pending Approval
      </h1>

      {/* Description */}
      <div className="bg-[#14181D] border border-[#BFA55A]/30 rounded-xl p-6 mb-8 text-left">
        <p className="text-[#B0B0B0] mb-4">
          Thank you for registering. Your account is currently pending approval
          by an administrator.
        </p>
        <p className="text-[#B0B0B0]">
          You will receive an email once your account has been approved and you
          can access the platform.
        </p>
      </div>

      {/* What happens next */}
      <div className="text-left mb-8">
        <h2 className="text-lg text-[#EAEAEA] mb-4 font-semibold">
          What happens next?
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#D4AF37] font-bold">1</span>
            </div>
            <span className="text-[#B0B0B0] text-sm">
              Admin reviews your registration request
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#D4AF37] font-bold">2</span>
            </div>
            <span className="text-[#B0B0B0] text-sm">
              Once approved, you&apos;ll receive an email notification
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-[#D4AF37] font-bold">3</span>
            </div>
            <span className="text-[#B0B0B0] text-sm">
              Sign in and start using the platform
            </span>
          </li>
        </ul>
      </div>

      {/* Back to home */}
      <button
        onClick={handleBackToHome}
        className="inline-block border border-[#D4AF37] text-[#D4AF37] px-8 py-3 rounded-lg font-medium hover:bg-[#D4AF37]/10 transition-colors">
        Back to Home
      </button>
    </div>
  );
}
