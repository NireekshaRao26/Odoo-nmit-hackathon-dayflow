"use client";

import React from "react";
import StatusIndicator, { EmployeeWorkStatus } from "./StatusIndicator";

export interface EmployeeData {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department?: string;
  position?: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  status: EmployeeWorkStatus;
}

interface EmployeeCardProps {
  employee: EmployeeData;
  onClick: (employee: EmployeeData) => void;
}

export default function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const avatarText = (employee.full_name || employee.email || "E")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      onClick={() => onClick(employee)}
      className="group relative flex flex-col justify-between rounded-md border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm hover:border-purple-500/40 hover:bg-zinc-900 transition-all duration-200 cursor-pointer"
    >
      {/* Top-Right Status Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <StatusIndicator status={employee.status} showLabel={false} />
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Avatar & Name Header */}
        <div className="flex items-center space-x-3.5">
          {employee.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={employee.full_name}
              className="h-12 w-12 rounded-md object-cover border border-zinc-700 shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-md bg-purple-950/40 border border-purple-800/40 flex items-center justify-center font-bold text-purple-300 text-sm shrink-0">
              {avatarText}
            </div>
          )}

          <div className="min-w-0 flex-1 pr-6">
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
              {employee.full_name || "Employee"}
            </h3>
            <p className="text-xs text-zinc-400 truncate">
              {employee.position || "Team Member"}
            </p>
          </div>
        </div>

        {/* Basic Details List */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono text-zinc-500">ID</span>
            <span className="font-mono text-zinc-300 font-semibold">{employee.employee_id}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Dept</span>
            <span className="text-zinc-300 truncate max-w-[150px]">{employee.department || "Engineering"}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Email</span>
            <span className="text-zinc-300 truncate max-w-[160px]">{employee.email}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Indicator Bar */}
      <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between text-[11px]">
        <span className="text-zinc-500 uppercase tracking-wider font-semibold">View Details</span>
        <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to View →
        </span>
      </div>
    </div>
  );
}
