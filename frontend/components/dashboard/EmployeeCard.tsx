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
      className="group relative flex flex-col justify-between rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] p-5 shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] hover:border-[#8FBF9F]/40 hover:bg-[#141A16] hover:translate-y-[-2px] transition-all duration-200 cursor-pointer"
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
              className="h-12 w-12 rounded-xl object-cover border border-[rgba(242,240,232,0.08)] shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-[#3F6B4F]/20 border border-[#8FBF9F]/30 flex items-center justify-center font-mono font-bold text-[#8FBF9F] text-sm shrink-0 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.035)]">
              {avatarText}
            </div>
          )}

          <div className="min-w-0 flex-1 pr-6">
            <h3 className="text-sm font-display font-bold text-[#F2F0E8] group-hover:text-[#8FBF9F] transition-colors truncate">
              {employee.full_name || "Employee"}
            </h3>
            <p className="text-xs text-[#9B9D96] truncate">
              {employee.position || "Team Member"}
            </p>
          </div>
        </div>

        {/* Basic Details List */}
        <div className="space-y-1.5 pt-2 border-t border-[rgba(242,240,232,0.08)] text-xs">
          <div className="flex items-center justify-between text-[#9B9D96]">
            <span className="text-[11px] font-mono text-[#686C66]">ID</span>
            <span className="font-mono text-[#F2F0E8] font-semibold">{employee.employee_id}</span>
          </div>

          <div className="flex items-center justify-between text-[#9B9D96]">
            <span className="text-[11px] font-mono text-[#686C66] uppercase tracking-wider">Dept</span>
            <span className="text-[#F2F0E8] truncate max-w-[150px]">{employee.department || "Engineering"}</span>
          </div>

          <div className="flex items-center justify-between text-[#9B9D96]">
            <span className="text-[11px] font-mono text-[#686C66] uppercase tracking-wider">Email</span>
            <span className="text-[#F2F0E8] truncate max-w-[160px]">{employee.email}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Indicator Bar */}
      <div className="mt-4 pt-3 border-t border-[rgba(242,240,232,0.08)] flex items-center justify-between text-[11px]">
        <span className="text-[#686C66] font-mono uppercase tracking-wider font-semibold">View Details</span>
        <span className="text-[#8FBF9F] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
          Click to View →
        </span>
      </div>
    </div>
  );
}
