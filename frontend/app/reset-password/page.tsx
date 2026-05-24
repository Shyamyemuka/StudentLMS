"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import Navigation from "@/components/landing/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-24 relative overflow-x-hidden">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-primary mb-2">
              Reset Password
            </h1>
            <p className="text-muted-foreground font-bold">Enter your new password</p>
          </div>

          <div 
            style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
            className="bg-card border-2 border-border shadow-hard-md p-8 relative"
          >
            <div className="tape-decor" />
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-foreground mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="w-full bg-background border-2 border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-bold text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="w-full bg-background border-2 border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-body"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                className="w-full bg-primary text-primary-foreground border-[3px] border-border py-3.5 font-bold shadow-hard-md hover:bg-accent hover:text-accent-foreground btn-sketch-interactive active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer">
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
