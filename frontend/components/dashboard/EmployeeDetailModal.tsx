"use client";

import React from "react";
import StatusIndicator, { EmployeeWorkStatus } from "./StatusIndicator";

export interface DetailedEmployeeInfo {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department?: string;
  position?: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  company_name?: string;
  joining_year?: number;
  status?: EmployeeWorkStatus;
}

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: DetailedEmployeeInfo | null;
  title?: string;
}

export default function EmployeeDetailModal({
  isOpen,
  onClose,
  employee,
  title = "Employee Details",
}: EmployeeDetailModalProps) {
  if (!isOpen || !employee) return null;

  const avatarText = (employee.full_name || employee.email || "E")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-4 border-b border-zinc-800 pb-4">
          {employee.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={employee.full_name}
              className="h-16 w-16 rounded-md object-cover border border-zinc-700 shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-md bg-purple-950/50 border border-purple-700/50 flex items-center justify-center font-bold text-purple-300 text-lg shrink-0">
              {avatarText}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-semibold">
                {title} • VIEW MODE
              </span>
              {employee.status && (
                <StatusIndicator status={employee.status} showLabel={true} />
              )}
            </div>

            <h3 className="text-xl font-bold text-white truncate mt-0.5">
              {employee.full_name || "Employee Profile"}
            </h3>

            <p className="text-xs text-zinc-400 truncate">
              {employee.position || "Team Member"} • {employee.department || "Engineering"}
            </p>
          </div>
        </div>

        {/* Non-Editable Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-md bg-zinc-950/60 p-3 border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Employee ID</span>
            <span className="font-mono text-zinc-200 font-bold mt-1 block">{employee.employee_id}</span>
          </div>

          <div className="rounded-md bg-zinc-950/60 p-3 border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Email Address</span>
            <span className="text-zinc-200 font-medium mt-1 block truncate">{employee.email}</span>
          </div>

          <div className="rounded-md bg-zinc-950/60 p-3 border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Department</span>
            <span className="text-zinc-200 font-medium mt-1 block">{employee.department || "Engineering"}</span>
          </div>

          <div className="rounded-md bg-zinc-950/60 p-3 border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Position / Role</span>
            <span className="text-zinc-200 font-medium mt-1 block">{employee.position || employee.role || "Software Engineer"}</span>
          </div>

          <div className="rounded-md bg-zinc-950/60 p-3 border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Phone Number</span>
            <span className="text-zinc-200 font-medium mt-1 block">{employee.phone || "Not specified"}</span>
          </div>

          <div className="rounded-md bg-zinc-950/60 p-3 border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Company / Joined</span>
            <span className="text-zinc-200 font-medium mt-1 block">
              {employee.company_name || "Dayflow"} ({employee.joining_year || new Date().getFullYear()})
            </span>
          </div>
        </div>

        {/* Footer info note */}
        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Non-Editable View Mode</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-800 hover:bg-zinc-750 px-4 py-1.5 text-xs font-semibold text-zinc-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
