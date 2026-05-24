"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

import Navigation from "@/components/landing/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset link sent to your email!");
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col pt-24 relative overflow-x-hidden">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div 
              style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
              className="bg-card border-2 border-border shadow-hard-md p-8 relative"
            >
              <div className="tape-decor" />
              <div className="text-center mb-6">
                <div 
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4 border-2 border-border shadow-hard-sm wobbly-border"
                >
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                  Check Your Email
                </h2>
                <p className="text-muted-foreground font-bold">
                  We've sent a password reset link to{" "}
                  <span className="text-primary font-bold">{email}</span>
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center font-medium">
                  Click the link in the email to reset your password. The link
                  will expire in 1 hour.
                </p>

                <Link
                  href="/login"
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="block w-full text-center bg-primary text-primary-foreground py-3 px-4 border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-24 relative overflow-x-hidden">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-primary mb-2">
              Forgot Password?
            </h1>
            <p className="text-muted-foreground font-bold">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <div 
            style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
            className="bg-card border-2 border-border shadow-hard-md p-8 relative"
          >
            <div className="tape-decor" />
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  required
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="w-full bg-background border-2 border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                className="w-full bg-primary text-primary-foreground border-[3px] border-border py-3.5 font-bold shadow-hard-md hover:bg-accent hover:text-accent-foreground btn-sketch-interactive active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary font-bold transition-colors">
                Remember your password? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
