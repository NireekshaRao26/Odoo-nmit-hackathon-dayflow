"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// Modular Dashboard Components
import DashboardNavbar, { DashboardTab } from "@/components/dashboard/DashboardNavbar";
import EmployeeSearch from "@/components/dashboard/EmployeeSearch";
import EmployeeGrid from "@/components/dashboard/EmployeeGrid";
import { EmployeeData } from "@/components/dashboard/EmployeeCard";
import AttendancePanel from "@/components/dashboard/AttendancePanel";
import NewEmployeeModal from "@/components/dashboard/NewEmployeeModal";
import UserProfileView from "@/components/dashboard/UserProfileView";
import AttendanceModule, { AttendanceRecord } from "@/components/dashboard/AttendanceModule";
import TimeOffModule from "@/components/dashboard/TimeOffModule";
import type { LeaveRequest } from "@/components/dashboard/TimeOffModule";
import PersonalProfileCard from "@/components/dashboard/PersonalProfileCard";
import { EmployeeWorkStatus } from "@/components/dashboard/StatusIndicator";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserSession {
  id: string;
  employeeId: string;
  email: string;
  role: string;
  fullName?: string;
  companyName?: string;
  companyLogo?: string;
}

interface Profile {
  id: string;
  employee_id: string;
  role: string;
  email: string;
  full_name: string;
  department: string;
  phone: string;
  position: string;
  avatar_url: string;
  company_name?: string;
  joining_year?: number;
  must_change_password?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();

  // Session & Auth
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab navigation: 'employees' (default) | 'attendance' | 'time-off'
  const [activeTab, setActiveTab] = useState<DashboardTab>("employees");

  // Data states
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [rawEmployees, setRawEmployees] = useState<Profile[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [userAttendanceHistory, setUserAttendanceHistory] = useState<AttendanceRecord[]>([]);
  // leaveRequests used only for employee-card on-leave status calculation
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Popups
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [profileViewEmployeeId, setProfileViewEmployeeId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Forced Password Change Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");
  const [showNewPasswordToggle, setShowNewPasswordToggle] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const isHr = currentUser?.role === "hr";

  // 1. Fetch Current User Profile & Specific Data
  const fetchUserData = useCallback(async (userId: string, empId: string) => {
    try {
      // User Profile
      const profRes = await fetch(`${API_BASE}/api/profile?userId=${userId}&employeeId=${empId}`);
      if (profRes.ok) {
        const pData = await profRes.json();
        setUserProfile(pData.profile);
        if (pData.profile?.must_change_password) {
          setShowChangePasswordModal(true);
        }
      }

      // Today's Attendance for User
      const attRes = await fetch(`${API_BASE}/api/attendance/today?userId=${userId}&employeeId=${empId}`);
      if (attRes.ok) {
        const aData = await attRes.json();
        setTodayAttendance(aData.attendance);
      }

      // User Attendance History
      const histRes = await fetch(`${API_BASE}/api/attendance/history?userId=${userId}&employeeId=${empId}`);
      if (histRes.ok) {
        const hData = await histRes.json();
        setUserAttendanceHistory(hData.history || []);
      }
    } catch (e) {
      console.error("Error fetching user attendance data:", e);
    }
  }, []);

  // 2. Fetch All Organization Data (Employees, Attendance, Leaves)
  const fetchOrgData = useCallback(async (userId: string, empId: string, isHrUser: boolean) => {
    try {
      if (isHrUser) {
        // Employees
        const empRes = await fetch(`${API_BASE}/api/admin/employees?requesterId=${userId}`);
        if (empRes.ok) {
          const eData = await empRes.json();
          setRawEmployees(eData.employees || []);
        }

        // All Attendance
        const attAllRes = await fetch(`${API_BASE}/api/attendance/all?requesterId=${userId}`);
        if (attAllRes.ok) {
          const aAllData = await attAllRes.json();
          setAllAttendance(aAllData.records || []);
        }
      } else {
        setRawEmployees([]);
        setAllAttendance([]);
      }

      // Leaves (lightweight fetch for employee status cards only)
      const leavesEndpoint = isHrUser
        ? `${API_BASE}/api/leaves/all?requesterId=${userId}`
        : `${API_BASE}/api/leaves/user?userId=${userId}&employeeId=${empId}`;
      const leavesRes = await fetch(leavesEndpoint);
      if (leavesRes.ok) {
        const lData = await leavesRes.json();
        setLeaveRequests(lData.requests || []);
      }
    } catch (e) {
      console.error("Error fetching organization data:", e);
    }
  }, []);

  // Initial Authentication Check
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      router.push("/signin");
    } else {
      try {
        const user: UserSession = JSON.parse(userStr);
        setCurrentUser(user);
        setLoading(false);
      } catch (e) {
        localStorage.removeItem("currentUser");
        router.push("/signin");
      }
    }
  }, [router]);

  // Load Data
  useEffect(() => {
    if (currentUser?.id && currentUser?.employeeId) {
      fetchUserData(currentUser.id, currentUser.employeeId);
      fetchOrgData(currentUser.id, currentUser.employeeId, currentUser.role === "hr");
    }
  }, [currentUser, fetchUserData, fetchOrgData]);

  // Actions
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/signin");
  };

  const handleClockIn = async () => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, employeeId: currentUser.employeeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clock-in failed");

      showToast("Checked in successfully!");
      fetchUserData(currentUser.id, currentUser.employeeId);
      fetchOrgData(currentUser.id, currentUser.employeeId, isHr);
    } catch (err: any) {
      showToast(err.message || "Clock-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, employeeId: currentUser.employeeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clock-out failed");

      showToast("Checked out successfully!");
      fetchUserData(currentUser.id, currentUser.employeeId);
      fetchOrgData(currentUser.id, currentUser.employeeId, isHr);
    } catch (err: any) {
      showToast(err.message || "Clock-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError("");

    if (!newPasswordInput) {
      setChangePasswordError("New password is required.");
      return;
    }

    if (newPasswordInput !== confirmNewPasswordInput) {
      setChangePasswordError("Passwords do not match.");
      return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passRegex.test(newPasswordInput)) {
      setChangePasswordError("Password must be at least 8 characters long, containing uppercase, lowercase, digit, and special character.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          email: currentUser?.email,
          newPassword: newPasswordInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");

      showToast("Password updated successfully!");
      setShowChangePasswordModal(false);
      setNewPasswordInput("");
      setConfirmNewPasswordInput("");
      
      if (userProfile) {
        setUserProfile({ ...userProfile, must_change_password: false });
      }
    } catch (err: any) {
      setChangePasswordError(err.message || "Failed to update password.");
    } finally {
      setActionLoading(false);
    }
  };

  // Leave actions are now handled inside TimeOffModule (self-contained)
  // This callback refreshes the parent's lightweight leave list (for employee status cards)
  const handleLeaveRefresh = () => {
    if (currentUser?.id && currentUser?.employeeId) {
      fetchOrgData(currentUser.id, currentUser.employeeId, isHr);
    }
  };

  const handleOpenMyProfile = () => {
    if (!userProfile && !currentUser) return;
    setProfileViewEmployeeId(userProfile?.employee_id || currentUser!.employeeId);
  };

  const handleCardClick = (emp: EmployeeData) => {
    setProfileViewEmployeeId(emp.employee_id);
  };

  // Compute Employee Work Status (🟢 Green Present, 🔵 Airplane On Approved Leave, 🟡 Yellow Absent)
  const todayStr = new Date().toISOString().split("T")[0];

  // Filter raw employees based on role: HR sees all employees, normal Employee sees only themselves
  const userOwnEmployees = rawEmployees.filter(
    (emp) => emp.id === currentUser?.id || emp.employee_id === currentUser?.employeeId
  );

  const visibleRawEmployees = isHr
    ? rawEmployees
    : userOwnEmployees.length > 0
    ? userOwnEmployees
    : userProfile
    ? [userProfile]
    : [];

  const processedEmployees: EmployeeData[] = visibleRawEmployees.map((emp) => {
    // 1. Check if employee is on approved leave today
    const isOnApprovedLeave = leaveRequests.some((lr) => {
      if (lr.status !== "approved") return false;
      const isUserMatch = lr.user_id === emp.id || lr.employee_id === emp.employee_id;
      if (!isUserMatch) return false;
      return lr.start_date <= todayStr && todayStr <= lr.end_date;
    });

    // 2. Check if employee has checked in today
    const hasAttendanceToday = allAttendance.some((att) => {
      const isUserMatch = att.user_id === emp.id || att.employee_id === emp.employee_id;
      return isUserMatch && att.date === todayStr && (att.status === "checked-in" || att.status === "present");
    });

    let status: EmployeeWorkStatus = "absent";
    if (isOnApprovedLeave) {
      status = "on-leave";
    } else if (hasAttendanceToday) {
      status = "present";
    } else {
      status = "absent";
    }

    return {
      id: emp.id,
      employee_id: emp.employee_id,
      full_name: emp.full_name || emp.email,
      email: emp.email,
      department: emp.department || "Engineering",
      position: emp.position || "Software Engineer",
      phone: emp.phone,
      role: emp.role,
      avatar_url: emp.avatar_url,
      status,
    };
  });

  // Filter Employees by search query
  const filteredEmployees = processedEmployees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.full_name.toLowerCase().includes(q) ||
      emp.employee_id.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q))
    );
  });

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Loading Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Toast Alert Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl transition animate-in fade-in slide-in-from-bottom-3 duration-150">
          {toastMsg}
        </div>
      )}

      {/* Top Navbar */}
      <DashboardNavbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setProfileViewEmployeeId(null);
          setActiveTab(tab);
        }}
        userName={userProfile?.full_name || currentUser.fullName || currentUser.email}
        userEmail={currentUser.email}
        userAvatar={userProfile?.avatar_url}
        companyName={userProfile?.company_name || currentUser.companyName || "Dayflow"}
        onMyProfileClick={handleOpenMyProfile}
        onLogoutClick={handleLogout}
        isHr={isHr}
      />

      {/* Main Dashboard Layout */}
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {profileViewEmployeeId ? (
          <UserProfileView
            employeeId={profileViewEmployeeId}
            viewerId={currentUser.id}
            viewerRole={currentUser.role}
            onClose={() => setProfileViewEmployeeId(null)}
          />
        ) : (
          <>
            {/* TAB 1: EMPLOYEES DASHBOARD (Main Landing Page) */}
            {activeTab === "employees" && (
          <div className="space-y-8">
            {isHr ? (
              <>
                {/* HR Toolbar Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-wide">
                      Employee Workspace
                    </h1>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Directory of organization staff and attendance states
                    </p>
                  </div>

                  {/* Search Field & Prominent Purple NEW Button */}
                  <div className="flex items-center space-x-3">
                    <EmployeeSearch query={searchQuery} onChange={setSearchQuery} />

                    <button
                      type="button"
                      onClick={() => setShowNewEmployeeModal(true)}
                      className="rounded-md bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold px-4 py-2 text-xs transition duration-150 shadow-md cursor-pointer flex items-center space-x-1.5 shrink-0"
                    >
                      <span>+ NEW</span>
                    </button>
                  </div>
                </div>

                {/* Attendance Check-In Panel for Logged-In HR User */}
                <section className="max-w-md">
                  <AttendancePanel
                    todayAttendance={todayAttendance}
                    loading={actionLoading}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                  />
                </section>

                {/* Staff Directory Cards Grid (HR ONLY) */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500">
                      Staff Directory ({filteredEmployees.length})
                    </span>
                    <div className="flex items-center space-x-4 text-[11px]">
                      <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span>Present</span></span>
                      <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-blue-500" /><span>On Leave</span></span>
                      <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-amber-400" /><span>Absent</span></span>
                    </div>
                  </div>

                  <EmployeeGrid
                    employees={filteredEmployees}
                    loading={loading}
                    onCardClick={handleCardClick}
                  />
                </section>
              </>
            ) : (
              <>
                {/* Employee User Workspace Header */}
                <div className="pb-4 border-b border-zinc-800">
                  <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-wide">
                    My Workspace
                  </h1>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Welcome back, {userProfile?.full_name || currentUser.fullName || currentUser.email}
                  </p>
                </div>

                {/* Attendance Check-In Panel */}
                <section className="max-w-md">
                  <AttendancePanel
                    todayAttendance={todayAttendance}
                    loading={actionLoading}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                  />
                </section>

                {/* Personal Profile Details Card (EMPLOYEE ONLY) */}
                <section className="space-y-3">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-500 block">
                    Account Details
                  </span>

                  <PersonalProfileCard
                    fullName={userProfile?.full_name || currentUser.fullName || currentUser.email}
                    employeeId={userProfile?.employee_id || currentUser.employeeId}
                    email={userProfile?.email || currentUser.email}
                    department={userProfile?.department || "Engineering"}
                    position={userProfile?.position || "Software Engineer"}
                    phone={userProfile?.phone}
                    companyName={userProfile?.company_name || currentUser.companyName || "Dayflow"}
                    joiningYear={userProfile?.joining_year}
                    avatarUrl={userProfile?.avatar_url}
                    status={
                      leaveRequests.some((lr) => {
                        if (lr.status !== "approved") return false;
                        const isMatch = lr.user_id === currentUser.id || lr.employee_id === currentUser.employeeId;
                        return isMatch && lr.start_date <= todayStr && todayStr <= lr.end_date;
                      })
                        ? "on-leave"
                        : todayAttendance?.status === "checked-in" || todayAttendance?.status === "present"
                        ? "present"
                        : "absent"
                    }
                  />
                </section>
              </>
            )}
          </div>
        )}

        {/* TAB 2: ATTENDANCE MODULE */}
        {activeTab === "attendance" && (
          <AttendanceModule
            viewerId={currentUser.id}
            viewerRole={currentUser.role}
          />
        )}

        {/* TAB 3: TIME OFF MODULE (self-contained) */}
        {activeTab === "time-off" && (
          <TimeOffModule
            isHr={isHr}
            userId={currentUser.id}
            employeeId={currentUser.employeeId}
            fullName={userProfile?.full_name || currentUser.fullName}
            onRefresh={handleLeaveRefresh}
          />
        )}
        </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <span>&copy; {new Date().getFullYear()} Dayflow HRMS. All rights reserved.</span>
          <div className="flex space-x-4 text-[11px]">
            <span>Role: <strong className="text-zinc-400 uppercase">{currentUser.role}</strong></span>
            <span>ID: <strong className="text-zinc-400 font-mono">{currentUser.employeeId}</strong></span>
          </div>
        </div>
      </footer>

      {/* HR New Employee Modal */}
      <NewEmployeeModal
        isOpen={showNewEmployeeModal}
        onClose={() => setShowNewEmployeeModal(false)}
        hrUserId={currentUser.id}
        onEmployeeCreated={() => fetchOrgData(currentUser.id, currentUser.employeeId, isHr)}
      />



      {/* Forced Password Change Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">Secure Your Account</h2>
              <p className="text-xs text-zinc-400 max-w-sm">
                Since this is your first sign-in, you are required to change your initial password before accessing the dashboard.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {changePasswordError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs text-rose-400">
                  {changePasswordError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPasswordToggle ? "text" : "password"}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordToggle(!showNewPasswordToggle)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300"
                  >
                    {showNewPasswordToggle ? (
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPasswordInput}
                  onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold py-2.5 text-xs transition duration-150 shadow-md cursor-pointer disabled:opacity-50 mt-2"
              >
                {actionLoading ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
