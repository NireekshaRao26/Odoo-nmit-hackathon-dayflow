"use client";

import React from "react";

export type EmployeeWorkStatus = "present" | "on-leave" | "absent";

interface StatusIndicatorProps {
  status: EmployeeWorkStatus;
  className?: string;
  showLabel?: boolean;
}

export default function StatusIndicator({ status, className = "", showLabel = false }: StatusIndicatorProps) {
  if (status === "present") {
    return (
      <div className={`flex items-center space-x-1.5 ${className}`} title="Present in Office">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        {showLabel && <span className="text-[11px] font-medium text-emerald-400">Present</span>}
      </div>
    );
  }

  if (status === "on-leave") {
    return (
      <div className={`flex items-center space-x-1.5 ${className}`} title="On Approved Leave">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30">
          {/* Airplane Icon */}
          <svg className="h-3 w-3 transform -rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        {showLabel && <span className="text-[11px] font-medium text-blue-400">On Leave</span>}
      </div>
    );
  }

  // Absent state (Yellow)
  return (
    <div className={`flex items-center space-x-1.5 ${className}`} title="Absent / Not Checked In">
      <span className="inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
      {showLabel && <span className="text-[11px] font-medium text-amber-400">Absent</span>}
    </div>
  );
}
