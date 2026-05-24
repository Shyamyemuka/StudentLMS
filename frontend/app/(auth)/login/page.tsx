import Link from "next/link";
import LoginForm from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      {/* Back Button */}
      <Link
        href="/"
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
        <span className="font-medium">Back to Home</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl text-[#D4AF37] mb-2 font-semibold">
          Welcome Back
        </h1>
        <p className="text-[#B0B0B0]">
          Sign in to continue your learning journey
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[#14181D] border border-[#BFA55A]/30 rounded-xl p-6 md:p-8">
        <LoginForm />
      </div>

      {/* Sign up link */}
      <p className="mt-6 text-center text-[#B0B0B0]">
        New user?{" "}
        <Link
          href="/signup"
          className="text-[#D4AF37] font-medium hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
