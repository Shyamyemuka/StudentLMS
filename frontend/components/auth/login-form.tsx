"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for errors in URL on mount
  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error) {
      if (error === "auth_callback_error") {
        toast.error("Authentication failed. Please try again.");
      } else if (error === "session_error") {
        toast.error(message || "Session error. Please try again.");
      } else if (error === "no_code") {
        toast.error("Invalid authentication callback.");
      } else if (message) {
        toast.error(decodeURIComponent(message));
      } else {
        toast.error(`Authentication error: ${error}`);
      }

      // Clean up URL
      router.replace("/login");
    }
  }, [searchParams, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if it's an email confirmation error
      if (error.message.includes("Email not confirmed")) {
        toast.error(
          "Please verify your email address before logging in. Check your inbox for the confirmation link.",
        );
      } else {
        toast.error(error.message);
      }
      setIsLoading(false);
      return;
    }

    // Check if session was created
    if (!data.session) {
      toast.error("Unable to create session. Please try again.");
      setIsLoading(false);
      return;
    }

    // Check user role after login
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (profile?.role === "faculty_pending") {
        toast.info("Your account is pending approval");
        router.push("/pending-approval");
        return;
      }
    }

    const redirectTo = searchParams.get("redirectTo") || "/dashboard";
    toast.success("Welcome back!");
    router.push(redirectTo);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    // Use current origin for redirect (works for both local and production)
    const redirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "/auth/callback";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        suppressHydrationWarning
        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card text-foreground border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center cursor-pointer mb-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-card text-muted-foreground font-bold">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-bold text-foreground mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            suppressHydrationWarning
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            className="w-full bg-background border-2 border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-bold text-foreground mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suppressHydrationWarning
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              className="w-full bg-background border-2 border-border px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              suppressHydrationWarning
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          suppressHydrationWarning
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          className="w-full bg-primary text-primary-foreground border-[3px] border-border py-3.5 font-bold shadow-hard-md hover:bg-accent hover:text-accent-foreground btn-sketch-interactive active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer mt-4"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Forgot password link */}
      <div className="mt-4 text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-primary transition-colors font-bold">
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}
