import Link from "next/link";
import SignUpForm from "@/components/auth/signup-form";

export const dynamic = "force-dynamic";

export default function FacultySignUpPage() {
  return (
    <div className="w-full max-w-md">
      {/* Back Button */}
      <Link
        href="/signup"
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
        <span className="font-medium">Back to Role Selection</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#D4AF37]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl text-[#D4AF37] mb-2 font-semibold">
          Create Faculty Account
        </h1>
        <p className="text-[#B0B0B0]">
          Join as an educator and share knowledge
        </p>
      </div>

      {/* Notice */}
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-[#EAEAEA]">
            Faculty accounts require admin approval. You&apos;ll receive access
            once your account is verified.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-[#14181D] border border-[#BFA55A]/30 rounded-xl p-6 md:p-8">
        <SignUpForm role="faculty" />
      </div>

      {/* Links */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-[#B0B0B0]">
          Are you a student?{" "}
          <Link href="/signup/student" className="text-[#D4AF37] font-medium">
            Register as Student
          </Link>
        </p>
        <p className="text-[#B0B0B0]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#D4AF37] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
