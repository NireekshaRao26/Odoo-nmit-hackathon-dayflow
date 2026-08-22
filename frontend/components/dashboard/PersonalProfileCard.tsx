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
    <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] p-6 shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(242,240,232,0.08)] pb-5">
        <div className="flex items-center space-x-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-14 w-14 rounded-xl object-cover border border-[rgba(242,240,232,0.08)] shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-[#3F6B4F]/20 border border-[#8FBF9F]/30 flex items-center justify-center font-mono font-bold text-[#8FBF9F] text-base shrink-0 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.035)]">
              {avatarText}
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-display font-bold text-[#F2F0E8]">{fullName || "Employee Profile"}</h2>
              <span className="rounded-lg bg-[#8FBF9F]/10 border border-[#8FBF9F]/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#8FBF9F]">
                EMPLOYEE ACCOUNT
              </span>
            </div>
            <p className="text-xs text-[#9B9D96] mt-0.5">
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
        <div className="rounded-xl bg-[#141A16] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] p-3.5 border-none">
          <span className="text-[10px] font-mono font-semibold text-[#686C66] uppercase tracking-wider block">
            Employee ID
          </span>
          <span className="font-mono text-[#8FBF9F] font-bold mt-1 block">{employeeId}</span>
        </div>

        <div className="rounded-xl bg-[#141A16] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] p-3.5 border-none">
          <span className="text-[10px] font-mono font-semibold text-[#686C66] uppercase tracking-wider block">
            Email Address
          </span>
          <span className="text-[#F2F0E8] font-medium mt-1 block truncate">{email}</span>
        </div>

        <div className="rounded-xl bg-[#141A16] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] p-3.5 border-none">
          <span className="text-[10px] font-mono font-semibold text-[#686C66] uppercase tracking-wider block">
            Phone Number
          </span>
          <span className="text-[#F2F0E8] font-medium mt-1 block">{phone || "Not specified"}</span>
        </div>

        <div className="rounded-xl bg-[#141A16] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] p-3.5 border-none">
          <span className="text-[10px] font-mono font-semibold text-[#686C66] uppercase tracking-wider block">
            Department
          </span>
          <span className="text-[#F2F0E8] font-medium mt-1 block">{department}</span>
        </div>

        <div className="rounded-xl bg-[#141A16] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] p-3.5 border-none">
          <span className="text-[10px] font-mono font-semibold text-[#686C66] uppercase tracking-wider block">
            Position / Title
          </span>
          <span className="text-[#F2F0E8] font-medium mt-1 block">{position}</span>
        </div>

        <div className="rounded-xl bg-[#141A16] shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] p-3.5 border-none">
          <span className="text-[10px] font-mono font-semibold text-[#686C66] uppercase tracking-wider block">
            Organization & Joined
          </span>
          <span className="text-[#F2F0E8] font-medium mt-1 block">
            {companyName} ({joiningYear})
          </span>
        </div>
      </div>
    </div>
  );
}
