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
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
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
          className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]"
        />
      </div>

      {/* Regulation Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onRegulationFilter("")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 border-border cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95 ${
            selectedRegulation === ""
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:border-primary hover:text-primary"
          }`}>
          All
        </button>
        {regulations.map((reg) => (
          <button
            key={reg}
            onClick={() => onRegulationFilter(reg)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 border-border cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95 ${
              selectedRegulation === reg
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:border-primary hover:text-primary"
            }`}>
            {reg}
          </button>
        ))}
      </div>
    </div>
  );
}
