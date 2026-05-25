"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Profile } from "@/types/database";
import NotificationBell from "@/components/notifications/notification-bell";
import SwitchToggleThemeDemo from "@/components/ui/toggle-theme";

interface HeaderProps {
  profile: Profile | null;
}

export default function Header({ profile }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Call server-side logout API to properly clear httpOnly cookies
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout API failed");
      }

      // Also sign out on client side
      await supabase.auth.signOut({ scope: "global" });

      // Clear any cached data in browser storage
      if (typeof window !== "undefined") {
        // Force clear local storage items related to supabase
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-")) {
            localStorage.removeItem(key);
          }
        });

        // Also clear session storage
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("sb-")) {
            sessionStorage.removeItem(key);
          }
        });

        // Clear all accessible cookies related to supabase auth
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name =
            eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
          if (name.startsWith("sb-")) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
          }
        });
      }

      toast.success("Logged out successfully");

      // Force hard redirect with cache busting to ensure fresh page load
      window.location.replace("/?logout=" + Date.now());
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      setIsLoggingOut(false);
    }
  };

  const getRoleBadge = () => {
    if (!profile) return null;

    const roleColors: Record<string, string> = {
      admin: "bg-[#C94A4A] text-white border-2 border-border shadow-hard-sm",
      faculty: "bg-[#4CAF8F] text-white border-2 border-border shadow-hard-sm",
      faculty_pending: "bg-[#D4AF37] text-[#0B0D10] border-2 border-border shadow-hard-sm",
      student: "bg-[#3B82F6] text-white border-2 border-border shadow-hard-sm",
    };

    const roleLabels: Record<string, string> = {
      admin: "Admin",
      faculty: "Faculty",
      faculty_pending: "Pending",
      student: "Student",
    };

    return (
      <span
        style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        className={`px-2 py-0.5 rounded text-xs font-bold ${
          roleColors[profile.role] || "bg-gray-500"
        }`}>
        {roleLabels[profile.role] || profile.role}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b-2 border-border shadow-hard-sm transition-all duration-300 py-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg overflow-hidden group-hover:scale-105 transition-transform border-2 border-border shadow-hard-sm wobbly-border">
              <img
                src="/images/logo.png"
                alt="Student LMS Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-lg text-foreground font-heading leading-tight">
                Student LMS
              </span>
              <span className="text-xs text-muted-foreground font-bold italic leading-tight">
                Knowledge Archive
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold">
              Dashboard
            </Link>
            <Link
              href="/my-courses"
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold">
              My Courses
            </Link>
            <Link
              href="/fun"
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold">
              Fun Zone
            </Link>
            {/* Faculty/Admin Management Links */}
            {(profile?.role === "admin" || profile?.role === "faculty") && (
              <>
                <Link
                  href="/admin/students"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold">
                  Student Management
                </Link>
                <Link
                  href="/admin/student-progress"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold">
                  Student Progress
                </Link>
              </>
            )}
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="text-destructive hover:text-primary transition-colors text-sm font-bold">
                Admin Panel
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="mr-1">
              <SwitchToggleThemeDemo />
            </div>

            {/* Notification Bell */}
            {profile && <NotificationBell userId={profile.user_id} />}

            {/* Profile Dropdown or CTAs */}
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-muted border-2 border-transparent hover:border-border wobbly-border transition-all">
                  {/* Avatar */}
                  <div 
                    style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                    className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border-2 border-border shadow-hard-sm"
                  >
                    {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  {/* Name & Role */}
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-foreground text-sm font-bold">
                      {profile?.full_name || "User"}
                    </span>
                    {getRoleBadge()}
                  </div>

                  {/* Dropdown Arrow */}
                  <svg
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      isMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Menu */}
                    <div 
                      style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
                      className="absolute right-0 mt-2 w-56 bg-card border-2 border-border shadow-hard-md z-20 py-2 wobbly-border"
                    >
                      {/* Mobile Navigation */}
                      <div className="md:hidden border-b-2 border-dashed border-border pb-2 mb-2">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-foreground hover:bg-muted text-sm font-bold">
                          Dashboard
                        </Link>
                        <Link
                          href="/my-courses"
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-foreground hover:bg-muted text-sm font-bold">
                          My Courses
                        </Link>
                        <Link
                          href="/fun"
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-foreground hover:bg-muted text-sm font-bold">
                          Fun Zone
                        </Link>
                        {/* Faculty/Admin Management Links */}
                        {(profile?.role === "admin" ||
                          profile?.role === "faculty") && (
                          <>
                            <Link
                              href="/admin/students"
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-4 py-2 text-[#4CAF8F] hover:bg-muted text-sm font-bold">
                              Student Management
                            </Link>
                            <Link
                              href="/admin/student-progress"
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-4 py-2 text-[#4CAF8F] hover:bg-muted text-sm font-bold">
                              Student Progress
                            </Link>
                          </>
                        )}
                        {profile?.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-destructive hover:bg-muted text-sm font-bold">
                            Admin Panel
                          </Link>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="px-4 py-2 border-b-2 border-dashed border-border mb-1">
                        <p className="text-foreground font-bold text-sm">
                          {profile?.full_name}
                        </p>
                        <p className="text-muted-foreground text-xs font-bold capitalize">{profile?.role?.replace("_", " ")}</p>
                      </div>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 text-destructive hover:bg-muted text-sm font-bold disabled:opacity-50 cursor-pointer transition-colors">
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/signup"
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="bg-accent text-accent-foreground text-xs sm:text-sm px-3 sm:px-4 py-2 border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
                  className="bg-card text-foreground text-xs sm:text-sm px-3 sm:px-4 py-2 border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
