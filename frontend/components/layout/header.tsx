"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Profile } from "@/types/database";
import NotificationBell from "@/components/notifications/notification-bell";

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
      // Use replace to prevent back button returning to authenticated state
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
      admin: "bg-[#C94A4A] text-white",
      faculty: "bg-[#4CAF8F] text-white",
      faculty_pending: "bg-[#D4AF37] text-[#0B0D10]",
      student: "bg-[#3B82F6] text-white",
      student_pending: "bg-[#FFA500] text-[#0B0D10]",
    };

    const roleLabels: Record<string, string> = {
      admin: "Admin",
      faculty: "Faculty",
      faculty_pending: "Pending",
      student: "Student",
      student_pending: "Pending",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          roleColors[profile.role] || "bg-gray-500"
        }`}>
        {roleLabels[profile.role] || profile.role}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-[#14181D] border-b border-[#BFA55A]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src="/images/logo.png"
                alt="Student LMS Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-lg text-[#D4AF37] leading-tight">
                Student LMS
              </span>
              <span className="text-xs text-[#B0B0B0] leading-tight">
                Knowledge Archive
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-[#B0B0B0] hover:text-[#D4AF37] transition-colors text-sm font-medium">
              Dashboard
            </Link>
            <Link
              href="/my-courses"
              className="text-[#B0B0B0] hover:text-[#D4AF37] transition-colors text-sm font-medium">
              My Courses
            </Link>
            <Link
              href="/fun"
              className="text-[#B0B0B0] hover:text-[#D4AF37] transition-colors text-sm font-medium">
              Fun Zone
            </Link>
            {/* Faculty/Admin Management Links */}
            {(profile?.role === "admin" || profile?.role === "faculty") && (
              <>
                <Link
                  href="/admin/students"
                  className="text-[#B0B0B0] hover:text-[#4CAF8F] transition-colors text-sm font-medium">
                  Student Management
                </Link>
                <Link
                  href="/admin/student-progress"
                  className="text-[#B0B0B0] hover:text-[#4CAF8F] transition-colors text-sm font-medium">
                  Student Progress
                </Link>
              </>
            )}
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="text-[#C94A4A] hover:text-[#E05555] transition-colors text-sm font-medium">
                Admin Panel
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            {profile && <NotificationBell userId={profile.user_id} />}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1A1F25] transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-medium text-sm">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                {/* Name & Role */}
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-[#EAEAEA] text-sm font-medium">
                    {profile?.full_name || "User"}
                  </span>
                  {getRoleBadge()}
                </div>

                {/* Dropdown Arrow */}
                <svg
                  className={`w-4 h-4 text-[#B0B0B0] transition-transform ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
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
                  <div className="absolute right-0 mt-2 w-56 bg-[#14181D] border border-[#BFA55A]/30 rounded-lg shadow-lg z-20 py-2">
                    {/* Mobile Navigation */}
                    <div className="md:hidden border-b border-[#2A2F35] pb-2 mb-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-[#EAEAEA] hover:bg-[#1A1F25] text-sm">
                        Dashboard
                      </Link>
                      <Link
                        href="/my-courses"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-[#EAEAEA] hover:bg-[#1A1F25] text-sm">
                        My Courses
                      </Link>
                      <Link
                        href="/fun"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-[#EAEAEA] hover:bg-[#1A1F25] text-sm">
                        Fun Zone
                      </Link>
                      {/* Faculty/Admin Management Links */}
                      {(profile?.role === "admin" ||
                        profile?.role === "faculty") && (
                        <>
                          <Link
                            href="/admin/students"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-[#4CAF8F] hover:bg-[#1A1F25] text-sm font-medium">
                            Student Management
                          </Link>
                          <Link
                            href="/admin/student-progress"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-[#4CAF8F] hover:bg-[#1A1F25] text-sm font-medium">
                            Student Progress
                          </Link>
                        </>
                      )}
                      {profile?.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="block px-4 py-2 text-[#C94A4A] hover:bg-[#1A1F25] text-sm">
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-[#2A2F35]">
                      <p className="text-[#EAEAEA] font-medium text-sm">
                        {profile?.full_name}
                      </p>
                      <p className="text-[#707070] text-xs">{profile?.role}</p>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 text-[#C94A4A] hover:bg-[#1A1F25] text-sm disabled:opacity-50">
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
