"use client";

import { useState } from "react";

interface SubjectSearchProps {
  onSearch: (query: string) => void;
  onRegulationFilter: (regulation: string) => void;
  regulations: string[];
  selectedRegulation: string;
}

export default function SubjectSearch({
  onSearch,
  onRegulationFilter,
  regulations,
  selectedRegulation,
}: SubjectSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      {/* Search Input */}
      <div className="relative flex-1">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#707070]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by subject code or title..."
          className="w-full pl-12 pr-4 py-3 bg-[#14181D] border border-[#2A2F35] rounded-lg text-[#EAEAEA] placeholder:text-[#707070] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-colors"
        />
      </div>

      {/* Regulation Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onRegulationFilter("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRegulation === ""
              ? "bg-[#D4AF37] text-[#0B0D10]"
              : "bg-[#14181D] text-[#B0B0B0] border border-[#2A2F35] hover:border-[#D4AF37] hover:text-[#D4AF37]"
          }`}>
          All
        </button>
        {regulations.map((reg) => (
          <button
            key={reg}
            onClick={() => onRegulationFilter(reg)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRegulation === reg
                ? "bg-[#D4AF37] text-[#0B0D10]"
                : "bg-[#14181D] text-[#B0B0B0] border border-[#2A2F35] hover:border-[#D4AF37] hover:text-[#D4AF37]"
            }`}>
            {reg}
          </button>
        ))}
      </div>
    </div>
  );
}
