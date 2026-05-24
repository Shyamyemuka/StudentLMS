"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import SwitchToggleThemeDemo from "@/components/ui/toggle-theme";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 ${
        scrolled
          ? "bg-card/95 backdrop-blur-md shadow-hard-sm border-b-2 border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden group-hover:scale-105 transition-transform border-2 border-border shadow-hard-sm wobbly-border">
              <img
                src="/images/logo.png"
                alt="Student LMS Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground leading-tight font-heading">
                Student LMS
              </span>
              <span className="text-xs text-muted-foreground leading-tight font-bold italic">
                Knowledge Archive
              </span>
            </div>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Theme Toggle */}
            <div className="mr-2">
              <SwitchToggleThemeDemo />
            </div>

            <Link
              href="/signup"
              style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
              className="bg-accent text-accent-foreground text-sm px-4 sm:px-5 py-2 border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all"
            >
              Sign Up
            </Link>
            
            <Link
              href="/login"
              style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
              className="bg-card text-foreground text-sm px-4 sm:px-5 py-2 border-2 border-border font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
