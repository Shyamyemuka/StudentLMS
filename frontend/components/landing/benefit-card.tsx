"use client";

import { ReactNode } from "react";

interface BenefitCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function BenefitCard({
  icon,
  title,
  description,
}: BenefitCardProps) {
  return (
    <div className="bg-[#14181D] border border-[#BFA55A]/30 rounded-xl p-6 hover:border-[#D4AF37] transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:-translate-y-1 group text-center">
      {/* Icon */}
      <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37]/20 transition-colors">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl text-[#EAEAEA] mb-3 group-hover:text-[#D4AF37] transition-colors font-semibold">
        {title}
      </h3>

      {/* Description */}
      <p className="text-[#B0B0B0] text-sm leading-relaxed">{description}</p>
    </div>
  );
}
