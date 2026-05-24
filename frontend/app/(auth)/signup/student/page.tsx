import Link from "next/link";
import SignUpForm from "@/components/auth/signup-form";

export const dynamic = "force-dynamic";

export default function StudentSignUpPage() {
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
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">
          Create Student Account
        </h1>
        <p className="text-muted-foreground font-bold">Begin your learning journey with us</p>
      </div>

      {/* Form Card */}
      <div 
        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
        className="bg-card border-2 border-border shadow-hard-md p-6 md:p-8 relative"
      >
        <div className="tape-decor" />
        <SignUpForm role="student" />
      </div>

      {/* Links */}
      <div className="mt-6 text-center space-y-2 font-bold text-muted-foreground">
        <p>
          Want to join as faculty?{" "}
          <Link href="/signup/faculty" className="text-accent hover:underline">
            Register as Faculty
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
