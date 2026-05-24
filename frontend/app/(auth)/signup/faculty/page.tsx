import Link from "next/link";
import SignUpForm from "@/components/auth/signup-form";

export const dynamic = "force-dynamic";

export default function FacultySignUpPage() {
  return (
    <div className="w-full max-w-md">
      {/* Back Button */}
      <Link
        href="/signup"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors group font-bold">
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
        <span className="font-bold">Back to Role Selection</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div 
          style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
          className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-border shadow-hard-sm"
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
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">
          Create Faculty Account
        </h1>
        <p className="text-muted-foreground font-bold">
          Join as an educator and share knowledge
        </p>
      </div>

      {/* Notice */}
      <div 
        style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        className="bg-primary/5 border-2 border-border p-4 mb-6 shadow-hard-sm"
      >
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-foreground font-bold leading-relaxed">
            Faculty accounts require admin approval. You&apos;ll receive access
            once your account is verified by the administrator.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div 
        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
        className="bg-card border-2 border-border shadow-hard-md p-6 md:p-8 relative"
      >
        <div className="tape-decor" />
        <SignUpForm role="faculty" />
      </div>

      {/* Links */}
      <div className="mt-6 text-center space-y-2 font-bold text-muted-foreground">
        <p>
          Are you a student?{" "}
          <Link href="/signup/student" className="text-accent hover:underline">
            Register as Student
          </Link>
        </p>
        <p>
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
