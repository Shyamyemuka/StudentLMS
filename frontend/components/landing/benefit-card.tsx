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
    <div 
      style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
      className="bg-card border-2 border-border p-6 shadow-hard-sm hover:shadow-hard-md hover:-translate-y-1 hover:rotate-1 transition-all duration-200 group text-center"
    >
      {/* Icon Wrapper styled sketch-style */}
      <div 
        style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
        className="w-16 h-16 mx-auto mb-5 bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary group-hover:bg-secondary/20 transition-all duration-200 animate-sketch-bounce"
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors font-heading">
        {title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-sm font-medium leading-relaxed font-body">
        {description}
      </p>
    </div>
  );
}
