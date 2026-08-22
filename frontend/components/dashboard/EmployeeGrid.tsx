"use client";

import React from "react";
import EmployeeCard, { EmployeeData } from "./EmployeeCard";

interface EmployeeGridProps {
  employees: EmployeeData[];
  loading?: boolean;
  onCardClick: (employee: EmployeeData) => void;
}

export default function EmployeeGrid({ employees, loading = false, onCardClick }: EmployeeGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-44 rounded-md border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-md bg-zinc-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/2 bg-zinc-800 rounded" />
                <div className="h-3 w-1/3 bg-zinc-800/60 rounded" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="h-3 w-full bg-zinc-800/40 rounded" />
              <div className="h-3 w-4/5 bg-zinc-800/40 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-900/30 py-16 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 mb-3">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-zinc-300">No employees found</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          No employee records match your search criteria. Try clearing or adjusting your search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((emp) => (
        <EmployeeCard key={emp.id || emp.employee_id} employee={emp} onClick={onCardClick} />
      ))}
    </div>
  );
}
