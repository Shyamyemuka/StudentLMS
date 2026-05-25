"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

interface SignUpFormProps {
  role: "student" | "faculty";
}

export default function SignUpForm({ role }: SignUpFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role === "faculty" ? "faculty_pending" : "student",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Failed to create account");
        setIsLoading(false);
        return;
      }

      // Wait for database trigger/webhook to create profile
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const profileRole =
        role === "faculty" ? "faculty_pending" : "student";

      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("user_id", data.user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Profile fetch error:", fetchError);
      }

      if (!existingProfile) {
        // Create profile manually
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name: fullName,
          role: profileRole,
        });

        if (insertError) {
          console.error("Profile insert error:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          });
          toast.error(`Profile creation failed: ${insertError.message}`);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
      if (role === "student") {
        toast.success("Account created successfully! Welcome to your dashboard!");
        router.push("/dashboard");
      } else {
        toast.success("Account created! Please check your email to verify.");
        router.push("/pending-approval");
      }
    } catch (err: any) {
      console.error("Signup exception:", err);
      toast.error(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);

    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?role=${role}`
          : `/auth/callback?role=${role}`;

      console.log("Initiating Google OAuth with redirect:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error("OAuth initiation error:", error);
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      console.log("OAuth initiated successfully:", data);
    } catch (err: any) {
      console.error("OAuth exception:", err);
      toast.error(err.message || "Failed to initiate Google sign-in");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Google Sign Up */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 rounded-lg font-bold border-2 border-[#2d2d2d] shadow-hard-sm hover:bg-gray-100 transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
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
            or continue with email
          </span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-bold text-foreground mb-2"
          >
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            className="w-full bg-background border-2 border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-bold text-foreground mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            className="w-full bg-background border-2 border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-bold text-foreground mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              className="w-full bg-background border-2 border-border px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
              placeholder="Create a password (min. 8 characters)"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-bold text-foreground mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              className="w-full bg-background border-2 border-border px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
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
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
          className="w-full bg-primary text-primary-foreground border-[3px] border-border py-3.5 font-bold shadow-hard-md hover:bg-accent hover:text-accent-foreground btn-sketch-interactive active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
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
              Creating account...
            </span>
          ) : (
            `Create ${role === "faculty" ? "Faculty" : "Student"} Account`
          )}
        </button>
      </form>

      {/* Faculty note */}
      {role === "faculty" && (
        <p className="text-center text-muted-foreground text-sm mt-4 italic font-bold">
          * Faculty accounts require admin approval before activation
        </p>
      )}
    </div>
  );
}
