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
}: DashboardNavbarProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left Section: Company Logo + Navigation Tabs */}
          <div className="flex items-center space-x-8">
            
            {/* Company Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange("employees")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-600 font-bold text-white shadow-sm text-sm">
                {companyName.substring(0, 1).toUpperCase()}
              </div>
              <span className="text-base font-bold tracking-tight text-white hidden sm:inline-block">
                {companyName}
              </span>
            </div>

            {/* Navigation Items */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => onTabChange("employees")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeTab === "employees"
                    ? "bg-purple-600/15 text-purple-400 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                Employees
              </button>

              <button
                type="button"
                onClick={() => onTabChange("attendance")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeTab === "attendance"
                    ? "bg-purple-600/15 text-purple-400 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                Attendance
              </button>

              <button
                type="button"
                onClick={() => onTabChange("time-off")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                  activeTab === "time-off"
                    ? "bg-purple-600/15 text-purple-400 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
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
