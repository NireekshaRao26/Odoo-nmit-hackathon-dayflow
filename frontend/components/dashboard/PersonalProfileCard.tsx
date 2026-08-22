"use client";

import React from "react";
import StatusIndicator, { EmployeeWorkStatus } from "./StatusIndicator";

interface PersonalProfileCardProps {
  fullName: string;
  employeeId: string;
  email: string;
  department?: string;
  position?: string;
  phone?: string;
  companyName?: string;
  joiningYear?: number;
  avatarUrl?: string;
  status: EmployeeWorkStatus;
}

export default function PersonalProfileCard({
  fullName,
  employeeId,
  email,
  department = "Engineering",
  position = "Software Engineer",
  phone,
  companyName = "Dayflow",
  joiningYear = new Date().getFullYear(),
  avatarUrl,
  status,
}: PersonalProfileCardProps) {
  const avatarText = (fullName || email || "U").substring(0, 2).toUpperCase();

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
        <div className="flex items-center space-x-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-14 w-14 rounded-md object-cover border border-zinc-700 shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-md bg-purple-950/50 border border-purple-700/50 flex items-center justify-center font-bold text-purple-300 text-base shrink-0">
              {avatarText}
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">{fullName || "Employee Profile"}</h2>
              <span className="rounded bg-purple-600/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                EMPLOYEE ACCOUNT
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {position} • {department}
            </p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center space-x-2">
          <StatusIndicator status={status} showLabel={true} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
        <div className="rounded-md bg-zinc-950/60 p-3.5 border border-zinc-800/80">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Employee ID
          </span>
          <span className="font-mono text-purple-300 font-bold mt-1 block">{employeeId}</span>
        </div>

        <div className="rounded-md bg-zinc-950/60 p-3.5 border border-zinc-800/80">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Email Address
          </span>
          <span className="text-zinc-200 font-medium mt-1 block truncate">{email}</span>
        </div>

        <div className="rounded-md bg-zinc-950/60 p-3.5 border border-zinc-800/80">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Phone Number
          </span>
          <span className="text-zinc-200 font-medium mt-1 block">{phone || "Not specified"}</span>
        </div>

        <div className="rounded-md bg-zinc-950/60 p-3.5 border border-zinc-800/80">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Department
          </span>
          <span className="text-zinc-200 font-medium mt-1 block">{department}</span>
        </div>

        <div className="rounded-md bg-zinc-950/60 p-3.5 border border-zinc-800/80">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Position / Title
          </span>
          <span className="text-zinc-200 font-medium mt-1 block">{position}</span>
        </div>

        <div className="rounded-md bg-zinc-950/60 p-3.5 border border-zinc-800/80">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
            Organization & Joined
          </span>
          <span className="text-zinc-200 font-medium mt-1 block">
            {companyName} ({joiningYear})
          </span>
        </div>
      </div>
    </div>
  );
}
