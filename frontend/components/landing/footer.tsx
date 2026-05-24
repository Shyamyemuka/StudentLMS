"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 bg-[#0B0D10] border-t border-[#BFA55A]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[#707070] text-sm">
          © StudentLMS {currentYear}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
