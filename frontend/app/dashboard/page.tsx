"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserSession {
  id: string;
  employeeId: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      // Redirect to home if not logged in
      router.push("/");
    } else {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        localStorage.removeItem("currentUser");
        router.push("/");
      }
      setLoading(false);
    }
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("currentUser");
    router.push("/");
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium text-zinc-400">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  // Get initial letters of email for avatar
  const avatarText = currentUser.email.substring(0, 2).toUpperCase();
  const isHr = currentUser.role === "hr";

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar Component */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-zinc-900 bg-zinc-900/20 backdrop-blur-md">
        <div className="p-6 border-b border-zinc-900 flex items-center space-x-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Dayflow HRMS</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <a
            href="#"
            className="flex items-center space-x-3 rounded-lg bg-indigo-500/10 text-indigo-400 px-4 py-3 text-sm font-medium transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
              />
            </svg>
            <span>Overview</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 px-4 py-3 text-sm font-medium transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>Employee Directory</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 px-4 py-3 text-sm font-medium transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Leave Management</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 px-4 py-3 text-sm font-medium transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Timesheets</span>
          </a>
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center space-x-3 rounded-lg text-zinc-450 hover:text-rose-400 hover:bg-rose-500/5 px-4 py-3 text-sm font-medium transition cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Container */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-white">Workspace Overview</h1>
            <p className="text-xs text-zinc-500 hidden sm:block">Welcome back, {currentUser.email}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-zinc-200">{currentUser.employeeId}</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                {currentUser.role}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 font-bold text-white border border-indigo-400/20">
              {avatarText}
            </div>
          </div>
        </header>

        {/* Dashboard Content Grid */}
        <main className="p-8 space-y-8 max-w-6xl w-full mx-auto">
          {/* User Session Info Banner Card */}
          <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/60 to-zinc-900/20 p-8 shadow-xl">
            {/* Ambient background decoration */}
            <div className="absolute right-0 top-0 h-[200px] w-[200px] rounded-full bg-indigo-500/10 blur-[40px] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                  Authentication Successful
                </span>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Logged in as {currentUser.role === "hr" ? "HR Manager" : "Employee"}
                </h2>
                <p className="text-zinc-400 text-sm max-w-xl">
                  Your profile has been created and verified. You have full access to your respective features in the Dayflow HRMS database.
                </p>
              </div>

              {/* Status Credentials Box */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 min-w-[260px] shadow-inner">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Employee ID</span>
                  <span className="font-mono text-zinc-200">{currentUser.employeeId}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500">Email</span>
                  <span className="text-zinc-200">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Role Status</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isHr
                        ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {currentUser.role.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* HRMS Dashboard Summary Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-900/40 p-6 space-y-4 shadow-sm hover:border-zinc-800 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Leave Balance
                </span>
                <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold text-white">12 Days</h3>
                <p className="text-xs text-zinc-500">Remaining leaves for the year</p>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-2 w-[60%] rounded-full" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-900/40 p-6 space-y-4 shadow-sm hover:border-zinc-800 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Timesheet Hours
                </span>
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-extrabold text-white">38.5 hrs</h3>
                <p className="text-xs text-zinc-500">Worked this week (Target: 40 hrs)</p>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-2 w-[96%] rounded-full" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-900/40 p-6 space-y-4 shadow-sm hover:border-zinc-800 transition sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Announcements
                </span>
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </span>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-zinc-200">System Maintenance Tomorrow</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Supabase services and API gateways will undergo schedule patches on Aug 23, 02:00 UTC.
                </p>
              </div>
            </div>
          </section>

          {/* Recent Activity Log Placeholder */}
          <section className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-white">Recent Activity Log</h3>
            <div className="space-y-4">
              <div className="flex items-start justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-zinc-350">Sign Up registration completed successfully</span>
                </div>
                <span className="text-zinc-500">Just now</span>
              </div>
              <div className="flex items-start justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-zinc-350">User Profile linked with Employee ID `{currentUser.employeeId}`</span>
                </div>
                <span className="text-zinc-500">Just now</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
