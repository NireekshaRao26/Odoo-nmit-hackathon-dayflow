"use client";

import React from "react";
import ProfileDropdown from "./ProfileDropdown";

export type DashboardTab = "employees" | "attendance" | "time-off";

interface DashboardNavbarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  companyName?: string;
  onMyProfileClick: () => void;
  onLogoutClick: () => void;
  isHr?: boolean;
}

export default function DashboardNavbar({
  activeTab,
  onTabChange,
  userName,
  userEmail,
  userAvatar,
  companyName = "Dayflow",
  onMyProfileClick,
  onLogoutClick,
  isHr = false,
}: DashboardNavbarProps) {
  return (
    <header className="border-b border-[rgba(242,240,232,0.08)] bg-[#0D0F0E]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left Section: Company Logo + Navigation Tabs */}
          <div className="flex items-center space-x-8">
            
            {/* Company Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange("employees")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3F6B4F] font-mono font-bold text-[#F2F0E8] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.035)] text-sm">
                {companyName.substring(0, 1).toUpperCase()}
              </div>
              <span className="text-base font-display font-bold tracking-tight text-[#F2F0E8] hidden sm:inline-block">
                {companyName}
              </span>
            </div>
 
            {/* Navigation Items */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => onTabChange("employees")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === "employees"
                    ? "bg-[#8FBF9F]/10 text-[#8FBF9F] border border-[#8FBF9F]/20"
                    : "text-[#686C66] hover:text-[#9B9D96] hover:bg-[#1A211C] border border-transparent"
                }`}
              >
                {isHr ? "Employees" : "My Workspace"}
              </button>

              <button
                type="button"
                onClick={() => onTabChange("attendance")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === "attendance"
                    ? "bg-[#8FBF9F]/10 text-[#8FBF9F] border border-[#8FBF9F]/20"
                    : "text-[#686C66] hover:text-[#9B9D96] hover:bg-[#1A211C] border border-transparent"
                }`}
              >
                Attendance
              </button>

              <button
                type="button"
                onClick={() => onTabChange("time-off")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === "time-off"
                    ? "bg-[#8FBF9F]/10 text-[#8FBF9F] border border-[#8FBF9F]/20"
                    : "text-[#686C66] hover:text-[#9B9D96] hover:bg-[#1A211C] border border-transparent"
                }`}
              >
                Time Off
              </button>
            </nav>
          </div>

          {/* Right Section: User Profile Avatar Dropdown */}
          <div className="flex items-center space-x-4">
            <ProfileDropdown
              userName={userName}
              userEmail={userEmail}
              avatarUrl={userAvatar}
              onMyProfileClick={onMyProfileClick}
              onLogoutClick={onLogoutClick}
            />
          </div>

        </div>
      </div>
    </header>
  );
}
