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
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors group font-bold">
        <svg
          className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="font-bold">Back to Home</span>
      </button>

      {/* Icon */}
      <div 
        style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        className="w-16 h-16 mx-auto mb-6 bg-primary/10 flex items-center justify-center border-2 border-border shadow-hard-sm"
      >
        <svg
          className="w-8 h-8 text-primary"
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
      <h1 className="text-3xl font-heading font-bold text-primary mb-4">
        Account Pending Approval
      </h1>

      {/* Description */}
      <div 
        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
        className="bg-card border-2 border-border shadow-hard-md p-6 mb-8 text-left relative"
      >
        <div className="tape-decor" />
        <p className="text-muted-foreground mb-4 font-bold">
          Thank you for registering. Your account is currently pending approval
          by an administrator.
        </p>
        <p className="text-muted-foreground font-bold">
          You will receive an email once your account has been approved and you
          can access the platform.
        </p>
      </div>

      {/* What happens next */}
      <div className="text-left mb-8">
        <h2 className="text-xl text-foreground mb-4 font-bold font-heading">
          What happens next?
        </h2>
        <ul className="space-y-3 font-bold text-muted-foreground text-sm">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border-2 border-border flex items-center justify-center flex-shrink-0 mt-0.5 font-bold shadow-hard-sm">
              1
            </div>
            <span className="font-medium">
              Admin reviews your registration request
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border-2 border-border flex items-center justify-center flex-shrink-0 mt-0.5 font-bold shadow-hard-sm">
              2
            </div>
            <span className="font-medium">
              Once approved, you&apos;ll receive an email notification
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border-2 border-border flex items-center justify-center flex-shrink-0 mt-0.5 font-bold shadow-hard-sm">
              3
            </div>
            <span className="font-medium">
              Sign in and start using the platform
            </span>
          </li>
        </ul>
      </div>

      {/* Back to home */}
      <button
        onClick={handleBackToHome}
        style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        className="inline-block bg-primary text-primary-foreground border-[3px] border-border px-8 py-3 font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer">
        Back to Home
      </button>
    </div>
  );
}
