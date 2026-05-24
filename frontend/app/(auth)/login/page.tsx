import Link from "next/link";
import LoginForm from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      {/* Back Button */}
      <Link
        href="/"
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
        <span className="font-bold">Back to Home</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl text-primary mb-2 font-bold font-heading">
          Welcome Back
        </h1>
        <p className="text-muted-foreground font-bold">
          Sign in to continue your learning journey
        </p>
      </div>

      {/* Form Card */}
      <div 
        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
        className="bg-card border-2 border-border shadow-hard-md p-6 md:p-8 relative"
      >
        <div className="tape-decor" />
        <LoginForm />
      </div>

      {/* Sign up link */}
      <p className="mt-6 text-center text-muted-foreground font-bold">
        New user?{" "}
        <Link
          href="/signup"
          className="text-accent font-bold hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
