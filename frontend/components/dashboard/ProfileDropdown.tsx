"use client";

import React, { useState, useRef, useEffect } from "react";

interface ProfileDropdownProps {
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  onMyProfileClick: () => void;
  onLogoutClick: () => void;
}

export default function ProfileDropdown({
  userName,
  userEmail,
  avatarUrl,
  onMyProfileClick,
  onLogoutClick,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const avatarText = (userName || userEmail || "U").substring(0, 2).toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 rounded-full p-1 hover:bg-zinc-900 transition focus:outline-none cursor-pointer"
        aria-label="User Menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="h-9 w-9 rounded-full object-cover border border-zinc-700"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-xs shadow-sm">
            {avatarText}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-zinc-800 bg-zinc-900 shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-semibold text-white truncate">{userName || "User Profile"}</p>
            <p className="text-[11px] text-zinc-400 truncate">{userEmail}</p>
          </div>

          {/* Menu Actions */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onMyProfileClick();
              }}
              className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition flex items-center space-x-2 cursor-pointer"
            >
              <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>My Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogoutClick();
              }}
              className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition flex items-center space-x-2 cursor-pointer"
            >
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
