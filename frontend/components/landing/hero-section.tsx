"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Decorative Squiggles & Hand-drawn elements */}
      <div className="absolute top-1/4 left-10 text-accent opacity-20 hidden md:block select-none pointer-events-none animate-sketch-bounce">
        <GraduationCap size={72} strokeWidth={1.5} />
      </div>
      <div className="absolute bottom-1/4 right-10 text-secondary opacity-20 hidden md:block select-none pointer-events-none animate-sketch-bounce [animation-delay:1.5s]">
        <BookOpen size={72} strokeWidth={1.5} />
      </div>

      {/* Hero Content Grid */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
        {/* Rough badge circle around top icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 border-2 border-dashed border-accent animate-sketch-bounce">
          <Sparkles className="w-10 h-10 text-accent" strokeWidth={2.5} />
        </div>

        {/* Headline with rotating exclamation */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 font-heading font-bold max-w-4xl mx-auto">
          Learn Without <span className="text-accent inline-block rotate-1 hover:-rotate-2 transition-transform">Limits!</span>
        </h1>

        {/* Body Text */}
        <p className="text-foreground/90 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-bold leading-relaxed font-body">
          Welcome to <span className="border-b-2 border-dashed border-secondary text-secondary">Student LMS</span>, a human-centered space designed for authentic learning. 
          Access course resources, study with bookmarks, and build communities at your own pace!
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <Link
            href="/signup"
            style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
            className="w-full sm:w-auto bg-accent text-accent-foreground text-lg px-8 py-3.5 border-[3px] border-border font-bold shadow-hard-lg hover:scale-105 active:scale-95 hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </Link>
          <Link
            href="/dashboard"
            style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
            className="w-full sm:w-auto bg-card text-foreground text-lg px-8 py-3.5 border-[3px] border-border font-bold shadow-hard-lg hover:scale-105 active:scale-95 hover:bg-muted transition-all flex items-center justify-center gap-2 animate-sketch-bounce"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
            className="w-full sm:w-auto bg-card text-foreground text-lg px-8 py-3.5 border-[3px] border-border font-bold shadow-hard-lg hover:scale-105 active:scale-95 hover:bg-muted transition-all flex items-center justify-center"
          >
            Sign In
          </Link>
        </div>

        {/* Sketched Mockup Placeholder (Hand-drawn visual signature instead of raw image) */}
        <div 
          style={{ borderRadius: "15px 255px 15px 225px / 255px 15px 225px 15px" }}
          className="mt-16 max-w-3xl mx-auto bg-card border-[3px] border-border p-3 shadow-hard-lg relative group overflow-hidden"
        >
          {/* Paper tape tags */}
          <div className="absolute top-[-10px] left-1/4 transform -rotate-3 bg-muted border border-border px-4 py-1 text-xs font-bold text-foreground/70 shadow-hard-sm">
            📒 Notebook Page
          </div>
          <div className="absolute top-[-8px] right-1/4 transform rotate-2 bg-accent/20 border border-border px-4 py-1 text-xs font-bold text-accent shadow-hard-sm">
            ✨ Interactive
          </div>

          <div 
            style={{ borderRadius: "12px 240px 12px 210px / 210px 12px 240px 12px" }}
            className="bg-background border-2 border-dashed border-border py-20 px-6 flex flex-col items-center justify-center text-muted-foreground"
          >
            <GraduationCap className="size-16 mb-4 text-border opacity-70 animate-sketch-bounce" strokeWidth={1.5} />
            <p className="font-heading font-bold text-xl text-foreground/80 mb-1">Interactive Student Workspace</p>
            <p className="font-body text-sm font-medium">No strict lines, pure authentic growth.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
