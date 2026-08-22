"use client";

import React from "react";

interface EmployeeSearchProps {
  query: string;
  onChange: (query: string) => void;
}

export default function EmployeeSearch({ query, onChange }: EmployeeSearchProps) {
  return (
    <div className="relative w-full max-w-xs sm:max-w-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg className="h-4 w-4 text-[#686C66]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <input
        type="text"
        placeholder="Search employee by name, ID, or email..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[inset_2px_2px_6px_rgba(255,255,255,0.04)] pl-9 pr-8 py-2 text-xs text-[#F2F0E8] placeholder-[#686C66] transition focus:border-[#8FBF9F] focus:outline-none"
      />

      {query && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#686C66] hover:text-[#F2F0E8] transition cursor-pointer"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
