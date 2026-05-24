"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

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
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[#14181D] border border-[#BFA55A]/30 rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#D4AF37]"
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
              <h2 className="text-2xl font-heading font-bold text-[#EAEAEA] mb-2">
                Check Your Email
              </h2>
              <p className="text-[#B0B0B0]">
                We've sent a password reset link to{" "}
                <span className="text-[#D4AF37]">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-[#707070] text-center">
                Click the link in the email to reset your password. The link
                will expire in 1 hour.
              </p>

              <Link
                href="/login"
                className="block w-full text-center bg-[#D4AF37] text-[#0B0D10] py-3 px-4 rounded-lg font-semibold hover:bg-[#E6C76A] transition-colors">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-[#D4AF37] mb-2">
            Forgot Password?
          </h1>
          <p className="text-[#B0B0B0]">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-[#14181D] border border-[#BFA55A]/30 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#EAEAEA] mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0B0D10] border border-[#2A2F35] rounded-lg text-[#EAEAEA] placeholder-[#707070] focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#0B0D10] py-3 px-4 rounded-lg font-semibold hover:bg-[#E6C76A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[#707070] hover:text-[#D4AF37] transition-colors">
              Remember your password? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
