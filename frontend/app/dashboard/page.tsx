"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserSession {
  id: string;
  employeeId: string;
  email: string;
  role: string;
  companyName?: string;
  companyLogo?: string;
  must_change_password?: boolean;
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
  company_code?: string;
  company_logo?: string;
  joining_year?: number;
  must_change_password?: boolean;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  status: string;
}

interface LeaveRequest {
  id: string;
  user_id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_comments?: string;
  applied_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  employee_id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
}

interface EmployeeSummary extends Profile {
  today_status: string;
  check_in: string | null;
  check_out: string | null;
  pending_leaves_count: number;
}

export default function DashboardPage() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Active View Tab: 'overview' | 'attendance' | 'leaves' | 'employees' | 'profile'
  const [activeTab, setActiveTab] = useState<string>("overview");

  // HR Employee Context Switching
  const [switchedEmployee, setSwitchedEmployee] = useState<Profile | null>(null);

  // Data States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // HR / Admin Data States
  const [allEmployees, setAllEmployees] = useState<EmployeeSummary[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [overviewStats, setOverviewStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    checkedInNow: 0,
    pendingLeaveApprovals: 0
  });

  // UI Modals & Form States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showLeaveReviewModal, setShowLeaveReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  // Change Password State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");
  const [showNewPasswordToggle, setShowNewPasswordToggle] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");

  // Add Employee Modal States
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [addEmployeeForm, setAddEmployeeForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Engineering",
    position: "Software Engineer"
  });
  const [addEmployeeError, setAddEmployeeError] = useState("");
  const [addEmployeeSuccess, setAddEmployeeSuccess] = useState<{
    loginId: string;
    initialPassword: string;
    email: string;
    fullName: string;
  } | null>(null);
  const [addEmployeeCopied, setAddEmployeeCopied] = useState(false);

  // Form Field Inputs
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    department: "",
    phone: "",
    position: ""
  });

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Paid Leave",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: ""
  });

  const [reviewComments, setReviewComments] = useState("");
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState("");

  // Loading indicator for actions
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Determine active context ID & employeeId
  const activeUserId = switchedEmployee ? switchedEmployee.id : currentUser?.id || "";
  const activeEmployeeId = switchedEmployee ? switchedEmployee.employee_id : currentUser?.employeeId || "";
  const isHr = currentUser?.role === "hr";

  // 1. Fetch User Profile & Data
  const fetchUserData = useCallback(async (userId: string, empId: string) => {
    try {
      // Profile
      const profRes = await fetch(`${API_BASE}/api/profile?userId=${userId}&employeeId=${empId}`);
      if (profRes.ok) {
        const pData = await profRes.json();
        setProfile(pData.profile);
        if (pData.profile?.must_change_password) {
          setShowChangePasswordModal(true);
        }
        setProfileForm({
          full_name: pData.profile?.full_name || "",
          department: pData.profile?.department || "Engineering",
          phone: pData.profile?.phone || "",
          position: pData.profile?.position || "Software Engineer"
        });
      }

      // Today's Attendance
      const attRes = await fetch(`${API_BASE}/api/attendance/today?userId=${userId}&employeeId=${empId}`);
      if (attRes.ok) {
        const aData = await attRes.json();
        setTodayAttendance(aData.attendance);
      }

      // Attendance History
      const histRes = await fetch(`${API_BASE}/api/attendance/history?userId=${userId}&employeeId=${empId}`);
      if (histRes.ok) {
        const hData = await histRes.json();
        setAttendanceHistory(hData.history || []);
      }

      // Leave Requests
      const leavesRes = await fetch(`${API_BASE}/api/leaves/user?userId=${userId}&employeeId=${empId}`);
      if (leavesRes.ok) {
        const lData = await leavesRes.json();
        setLeaveRequests(lData.requests || []);
      }

      // Activity Feed
      const actRes = await fetch(`${API_BASE}/api/activity?userId=${userId}&employeeId=${empId}`);
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData.activities || []);
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  }, []);

  // 2. Fetch Admin / HR Data
  const fetchAdminData = useCallback(async () => {
    try {
      // All Employees
      const empRes = await fetch(`${API_BASE}/api/admin/employees`);
      if (empRes.ok) {
        const eData = await empRes.json();
        setAllEmployees(eData.employees || []);
      }

      // All Attendance
      const attRes = await fetch(`${API_BASE}/api/attendance/all`);
      if (attRes.ok) {
        const aData = await attRes.json();
        setAllAttendance(aData.records || []);
      }

      // All Leaves
      const leavesRes = await fetch(`${API_BASE}/api/leaves/all`);
      if (leavesRes.ok) {
        const lData = await leavesRes.json();
        setAllLeaves(lData.requests || []);
      }

      // Overview Stats
      const statsRes = await fetch(`${API_BASE}/api/admin/overview`);
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setOverviewStats(sData.stats);
      }
    } catch (e) {
      console.error("Error fetching admin data:", e);
    }
  }, []);

  // Initial Auth Check
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      router.push("/");
    } else {
      try {
        const user: UserSession = JSON.parse(userStr);
        setCurrentUser(user);
        setLoading(false);
      } catch (e) {
        localStorage.removeItem("currentUser");
        router.push("/");
      }
    }
  }, [router]);

  // Load Data on User/Context Change
  useEffect(() => {
    if (activeUserId && activeEmployeeId) {
      fetchUserData(activeUserId, activeEmployeeId);
    }
    if (isHr) {
      fetchAdminData();
    }
  }, [activeUserId, activeEmployeeId, isHr, fetchUserData, fetchAdminData]);

  // Actions
  const handleSignOut = () => {
    localStorage.removeItem("currentUser");
    router.push("/");
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, employeeId: activeEmployeeId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clock-in failed");

      showToast("Checked in successfully!");
      fetchUserData(activeUserId, activeEmployeeId);
      if (isHr) fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Clock-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, employeeId: activeEmployeeId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clock-out failed");

      showToast("Checked out successfully!");
      fetchUserData(activeUserId, activeEmployeeId);
      if (isHr) fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Clock-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          ...profileForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      showToast("Profile updated successfully!");
      setProfile(data.profile);
      setShowProfileModal(false);
      if (isHr) fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to update profile");
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
          userId: activeUserId,
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
      
      // Update local profile state
      if (profile) {
        setProfile({ ...profile, must_change_password: false });
      }
    } catch (err: any) {
      setChangePasswordError(err.message || "Failed to update password.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddEmployeeError("");
    setAddEmployeeSuccess(null);

    if (!addEmployeeForm.name.trim() || !addEmployeeForm.email.trim() || !addEmployeeForm.phone.trim()) {
      setAddEmployeeError("Name, Email, and Phone number are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addEmployeeForm.email.trim())) {
      setAddEmployeeError("Please enter a valid email address.");
      return;
    }

    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{6,15}$/;
    if (!phoneRegex.test(addEmployeeForm.phone.trim())) {
      setAddEmployeeError("Please enter a valid phone number format.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/create-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addEmployeeForm.name.trim(),
          email: addEmployeeForm.email.trim(),
          phone: addEmployeeForm.phone.trim(),
          department: addEmployeeForm.department.trim(),
          position: addEmployeeForm.position.trim(),
          hrUserId: currentUser?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee.");

      setAddEmployeeSuccess(data.credentials);
      setAddEmployeeForm({
        name: "",
        email: "",
        phone: "",
        department: "Engineering",
        position: "Software Engineer"
      });
      fetchAdminData();
      showToast("Employee account created successfully!");
    } catch (err: any) {
      setAddEmployeeError(err.message || "Failed to create employee.");
    } finally {
      setActionLoading(false);
    }
  };

  const copyEmployeeCredentials = () => {
    if (!addEmployeeSuccess) return;
    const text = `Dayflow Employee Credentials:\nName: ${addEmployeeSuccess.fullName}\nEmail: ${addEmployeeSuccess.email}\nLogin ID: ${addEmployeeSuccess.loginId}\nInitial Password: ${addEmployeeSuccess.initialPassword}`;
    navigator.clipboard.writeText(text);
    setAddEmployeeCopied(true);
    setTimeout(() => setAddEmployeeCopied(false), 3000);
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    try {
      const res = await fetch(`${API_BASE}/api/leaves/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          employeeId: activeEmployeeId,
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          daysCount: daysCount > 0 ? daysCount : 1,
          reason: leaveForm.reason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit leave request");

      showToast("Leave request submitted!");
      setShowApplyLeaveModal(false);
      setLeaveForm({
        leaveType: "Paid Leave",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        reason: ""
      });
      fetchUserData(activeUserId, activeEmployeeId);
      if (isHr) fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to submit leave request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewLeave = async (status: "approved" | "rejected") => {
    if (!selectedLeave) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId: selectedLeave.id,
          status,
          comments: reviewComments,
          reviewerId: currentUser?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${status} leave`);

      showToast(`Leave request ${status}!`);
      setShowLeaveReviewModal(false);
      setSelectedLeave(null);
      setReviewComments("");
      fetchAdminData();
      fetchUserData(activeUserId, activeEmployeeId);
    } catch (err: any) {
      showToast(err.message || `Failed to process leave`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitchToEmployee = (emp: EmployeeSummary) => {
    setSwitchedEmployee(emp);
    setActiveTab("overview");
    showToast(`Switched context to view dashboard as ${emp.full_name || emp.employee_id}`);
  };

  const handleReturnToHrView = () => {
    setSwitchedEmployee(null);
    setActiveTab("overview");
    showToast("Returned to HR Admin view.");
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-zinc-400">Initializing Dayflow HRMS...</span>
        </div>
      </div>
    );
  }

  const avatarText = (profile?.full_name || currentUser.email).substring(0, 2).toUpperCase();
  const filteredEmployees = allEmployees.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-zinc-900 bg-zinc-950/60 backdrop-blur-md sticky top-0 h-screen">
        <div className="p-6 border-b border-zinc-900 flex items-center space-x-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
            <span className="text-base font-bold text-white">D</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">Dayflow</h1>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">HRMS Portal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
            {switchedEmployee ? "Employee Context View" : isHr ? "HR Management" : "Employee Portal"}
          </div>

          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            <span>Overview Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition cursor-pointer ${
              activeTab === "profile"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile Card</span>
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition cursor-pointer ${
              activeTab === "attendance"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Attendance Records</span>
          </button>

          <button
            onClick={() => setActiveTab("leaves")}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition cursor-pointer ${
              activeTab === "leaves"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Leave Requests</span>
          </button>

          {isHr && !switchedEmployee && (
            <>
              <div className="pt-4 px-3 py-2 text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                HR Admin Tools
              </div>

              <button
                onClick={() => setActiveTab("employees")}
                className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition cursor-pointer ${
                  activeTab === "employees"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Employee List</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("employees");
                  setAddEmployeeSuccess(null);
                  setAddEmployeeError("");
                  setShowAddEmployeeModal(true);
                }}
                className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>+ Register Employee</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center space-x-3 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 px-4 py-3 text-sm font-medium transition cursor-pointer border border-transparent hover:border-rose-500/20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Context Switching Top Banner for HR */}
        {switchedEmployee && (
          <div className="bg-gradient-to-r from-violet-900/90 to-indigo-900/90 border-b border-violet-700/40 px-8 py-3 flex items-center justify-between z-30 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-violet-100">
                Viewing workspace context as Employee: <strong className="text-white">{switchedEmployee.full_name || switchedEmployee.employee_id}</strong> ({switchedEmployee.employee_id})
              </span>
            </div>
            <button
              onClick={handleReturnToHrView}
              className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white border border-white/20 transition cursor-pointer"
            >
              Return to HR Admin View
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            {profile?.company_logo ? (
              <img src={profile.company_logo} alt="Company Logo" className="h-10 w-10 rounded-xl object-cover border border-zinc-800" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-indigo-400">
                {(profile?.company_name || currentUser?.companyName || "OI").substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">
                  {switchedEmployee ? `Dashboard - ${switchedEmployee.full_name}` : isHr ? "HR Manager Dashboard" : "Employee Dashboard"}
                </h2>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {profile?.company_name || currentUser?.companyName || "Odoo India"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Logged in as {currentUser.email} • Login ID: <strong className="text-zinc-200">{activeEmployeeId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer flex items-center space-x-1.5"
            >
              <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Change Password</span>
            </button>

            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-zinc-200">
                {profile?.full_name || activeEmployeeId}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                {profile?.position || currentUser.role}
              </span>
            </div>

            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg font-bold text-white border border-indigo-400/20">
              {avatarText}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-8 max-w-7xl w-full mx-auto flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              {/* HR Summary Metric Cards */}
              {isHr && !switchedEmployee && (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Staff</span>
                    <div className="text-3xl font-extrabold text-white">{overviewStats.totalEmployees}</div>
                    <span className="text-[11px] text-zinc-500">Registered Employees</span>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Present Today</span>
                    <div className="text-3xl font-extrabold text-emerald-400">{overviewStats.presentToday}</div>
                    <span className="text-[11px] text-zinc-500">Logged work hours</span>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Checked In Now</span>
                    <div className="text-3xl font-extrabold text-indigo-400">{overviewStats.checkedInNow}</div>
                    <span className="text-[11px] text-zinc-500">Currently Active</span>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending Leaves</span>
                    <div className="text-3xl font-extrabold text-amber-400">{overviewStats.pendingLeaveApprovals}</div>
                    <span className="text-[11px] text-zinc-500">Awaiting HR Review</span>
                  </div>
                </section>
              )}

              {/* 3.2.1 Employee Dashboard Quick Access Cards */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Quick Access Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                  {/* Quick Card 1: Profile */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition shadow-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        <span className="text-xs font-mono text-zinc-400">{profile?.employee_id || activeEmployeeId}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{profile?.full_name || "Employee Profile"}</h4>
                        <p className="text-xs text-zinc-400">{profile?.position || "Team Member"}</p>
                        <p className="text-xs text-zinc-500 mt-1">{profile?.department || "Engineering"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-semibold text-zinc-200 transition cursor-pointer border border-zinc-700/50"
                    >
                      Edit Profile
                    </button>
                  </div>

                  {/* Quick Card 2: Attendance */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition shadow-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            todayAttendance?.status === "checked-in"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : todayAttendance?.status === "present"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {todayAttendance?.status === "checked-in"
                            ? "Checked In"
                            : todayAttendance?.status === "present"
                            ? "Completed"
                            : "Not Checked In"}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Attendance Clock</h4>
                        <p className="text-xs text-zinc-400">
                          {todayAttendance?.check_in
                            ? `In at ${new Date(todayAttendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : "No check-in logged today"}
                        </p>
                        {todayAttendance?.work_hours ? (
                          <p className="text-xs text-emerald-400 mt-1">Logged: {todayAttendance.work_hours} hrs</p>
                        ) : null}
                      </div>
                    </div>
                    {todayAttendance?.status === "checked-in" ? (
                      <button
                        onClick={handleClockOut}
                        disabled={actionLoading}
                        className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold text-white transition cursor-pointer shadow-md"
                      >
                        {actionLoading ? "Processing..." : "Clock Out"}
                      </button>
                    ) : (
                      <button
                        onClick={handleClockIn}
                        disabled={actionLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-2.5 text-xs font-semibold text-white transition cursor-pointer shadow-md"
                      >
                        {actionLoading ? "Processing..." : "Clock In Now"}
                      </button>
                    )}
                  </div>

                  {/* Quick Card 3: Leave Requests */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition shadow-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <span className="text-xs font-bold text-amber-400">12 Days Rem.</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Leave Requests</h4>
                        <p className="text-xs text-zinc-400">
                          {leaveRequests.filter(l => l.status === "pending").length} Pending approval
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowApplyLeaveModal(true)}
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 py-2.5 text-xs font-semibold text-white transition cursor-pointer shadow-md"
                    >
                      + Apply for Leave
                    </button>
                  </div>

                  {/* Quick Card 4: Logout */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition shadow-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </span>
                        <span className="text-xs font-mono text-zinc-500">Session</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Sign Out</h4>
                        <p className="text-xs text-zinc-400">End your active portal session safely</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 py-2.5 text-xs font-semibold text-rose-400 transition cursor-pointer"
                    >
                      Logout Session
                    </button>
                  </div>

                </div>
              </div>

              {/* Recent Activity & System Alerts */}
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Recent Activity Feed & Alerts</h3>
                  <span className="text-xs text-zinc-500">Live system updates</span>
                </div>

                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.map((act) => (
                      <div key={act.id} className="flex items-start space-x-4 border-b border-zinc-900 pb-4 last:border-0 last:pb-0">
                        <div className="mt-1">
                          {act.type === "attendance" ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block" />
                          ) : act.type === "leave" ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block" />
                          ) : (
                            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 block" />
                          )}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-200">{act.title}</span>
                            <span className="text-zinc-500 text-[11px]">
                              {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">{act.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500">No activity recorded yet today.</p>
                  )}
                </div>
              </section>
            </>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === "profile" && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-6 max-w-3xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Profile Details</h3>
                  <p className="text-xs text-zinc-400 mt-1">Manage your employee information</p>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Full Name</label>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">{profile?.full_name || "Not specified"}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Employee ID</label>
                  <p className="text-sm font-mono font-semibold text-zinc-200 mt-1">{profile?.employee_id || activeEmployeeId}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Email</label>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">{profile?.email || currentUser.email}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Department</label>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">{profile?.department || "Engineering"}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Position</label>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">{profile?.position || "Software Engineer"}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Phone Number</label>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">{profile?.phone || "Not set"}</p>
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === "attendance" && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Attendance Logs & History</h3>
                  <p className="text-xs text-zinc-400 mt-1">Detailed records of clock-in and clock-out hours</p>
                </div>

                {todayAttendance?.status === "checked-in" ? (
                  <button
                    onClick={handleClockOut}
                    disabled={actionLoading}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Clock Out Now
                  </button>
                ) : (
                  <button
                    onClick={handleClockIn}
                    disabled={actionLoading}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Clock In Now
                  </button>
                )}
              </div>

              {/* History Table */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Check In</th>
                      <th className="px-6 py-4">Check Out</th>
                      <th className="px-6 py-4">Work Hours</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {attendanceHistory.length > 0 ? (
                      attendanceHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-zinc-900/60 transition">
                          <td className="px-6 py-4 font-mono font-medium text-white">{rec.date}</td>
                          <td className="px-6 py-4">
                            {rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            {rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-indigo-400">{rec.work_hours || 0} hrs</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              rec.status === "present" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              rec.status === "checked-in" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                              "bg-zinc-800 text-zinc-400"
                            }`}>
                              {rec.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 4: LEAVE REQUESTS */}
          {activeTab === "leaves" && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">My Leave Requests</h3>
                  <p className="text-xs text-zinc-400 mt-1">Submit and track your time-off applications</p>
                </div>
                <button
                  onClick={() => setShowApplyLeaveModal(true)}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 px-5 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
                >
                  + Apply for Leave
                </button>
              </div>

              {/* Leaves Table */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Days</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {leaveRequests.length > 0 ? (
                      leaveRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-zinc-900/60 transition">
                          <td className="px-6 py-4 font-semibold text-white">{req.leave_type}</td>
                          <td className="px-6 py-4 text-zinc-400">{req.start_date} to {req.end_date}</td>
                          <td className="px-6 py-4 font-bold text-indigo-400">{req.days_count} d</td>
                          <td className="px-6 py-4 max-w-xs truncate text-zinc-300">{req.reason}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              req.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              req.status === "rejected" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                            }`}>
                              {req.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                          No leave applications submitted yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 5: ADMIN / HR EMPLOYEE LIST & LEAVE APPROVALS */}
          {activeTab === "employees" && isHr && (
            <section className="space-y-8">
              {/* Section 1: Employee Directory */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Employee Directory</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">View employee list and switch workspace context</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <input
                      type="text"
                      placeholder="Search by name, ID, or department..."
                      value={searchEmployeeQuery}
                      onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none min-w-[200px]"
                    />
                    <button
                      onClick={() => {
                        setAddEmployeeSuccess(null);
                        setAddEmployeeError("");
                        setShowAddEmployeeModal(true);
                      }}
                      className="rounded-md bg-purple-600 hover:bg-purple-750 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      + Add Employee
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Today&apos;s Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-zinc-900/60 transition">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{emp.full_name || emp.email}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{emp.employee_id} • {emp.email}</div>
                          </td>
                          <td className="px-6 py-4 text-zinc-300">{emp.department || "Engineering"}</td>
                          <td className="px-6 py-4">
                            <span className="uppercase text-[10px] font-semibold text-zinc-400">{emp.role}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              emp.today_status === "checked-in" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                              emp.today_status === "present" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              "bg-zinc-800 text-zinc-400"
                            }`}>
                              {emp.today_status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSwitchToEmployee(emp)}
                              className="rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer"
                            >
                              Switch View to Employee
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Organization Leave Approvals */}
              <div className="space-y-4 pt-6 border-t border-zinc-900">
                <div>
                  <h3 className="text-xl font-bold text-white">Leave Approvals</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Manage and review employee leave applications</p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4">Employee ID</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Dates</th>
                        <th className="px-6 py-4">Reason</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {allLeaves.length > 0 ? (
                        allLeaves.map((req) => (
                          <tr key={req.id} className="hover:bg-zinc-900/60 transition">
                            <td className="px-6 py-4 font-mono text-zinc-200">{req.employee_id}</td>
                            <td className="px-6 py-4 font-semibold text-white">{req.leave_type}</td>
                            <td className="px-6 py-4 text-zinc-400">{req.start_date} to {req.end_date} ({req.days_count}d)</td>
                            <td className="px-6 py-4 max-w-xs truncate text-zinc-300">{req.reason}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                req.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                req.status === "rejected" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {req.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {req.status === "pending" ? (
                                <button
                                  onClick={() => {
                                    setSelectedLeave(req);
                                    setShowLeaveReviewModal(true);
                                  }}
                                  className="rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Review Request
                                </button>
                              ) : (
                                <span className="text-[11px] text-zinc-500">Processed</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No leave requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* MODAL 1: EDIT PROFILE */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
            <div>
              <h3 className="text-xl font-bold text-white">Edit Profile Details</h3>
              <p className="text-xs text-zinc-400 mt-1">Update employee information</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Position</label>
                <input
                  type="text"
                  required
                  value={profileForm.position}
                  onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 555-0199"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPLY LEAVE */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowApplyLeaveModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
            <div>
              <h3 className="text-xl font-bold text-white">Apply for Leave</h3>
              <p className="text-xs text-zinc-400 mt-1">Submit a leave request for approval</p>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the reason for leave..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 px-5 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
                >
                  {actionLoading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LEAVE REVIEW (HR) */}
      {showLeaveReviewModal && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowLeaveReviewModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
            <div>
              <h3 className="text-xl font-bold text-white">Review Leave Request</h3>
              <p className="text-xs text-zinc-400 mt-1">Submitted by Employee ID: {selectedLeave.employee_id}</p>
            </div>

            <div className="rounded-xl bg-zinc-950 p-4 space-y-2 border border-zinc-800 text-xs">
              <div className="flex justify-between"><span className="text-zinc-500">Leave Type</span><span className="font-semibold text-white">{selectedLeave.leave_type}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Dates</span><span className="text-zinc-300">{selectedLeave.start_date} to {selectedLeave.end_date} ({selectedLeave.days_count}d)</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Reason</span><span className="text-zinc-200">{selectedLeave.reason}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Reviewer Note / Feedback</label>
              <textarea
                rows={2}
                placeholder="Optional reviewer comment..."
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between space-x-3 pt-2">
              <button
                type="button"
                onClick={() => handleReviewLeave("rejected")}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white py-2.5 text-xs font-semibold transition cursor-pointer"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => handleReviewLeave("approved")}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-semibold transition cursor-pointer shadow-md"
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CHANGE PASSWORD */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 relative">
            {!profile?.must_change_password && (
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
            <div>
              <h3 className="text-xl font-bold text-white">
                {profile?.must_change_password ? "Secure Your Account" : "Change Password"}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {profile?.must_change_password
                  ? "First login detected. You must change your system-generated password to continue."
                  : "Update your system password securely"}
              </p>
            </div>

            {changePasswordError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {changePasswordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPasswordToggle ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-4 pr-10 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordToggle(!showNewPasswordToggle)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer text-xs"
                  >
                    {showNewPasswordToggle ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showNewPasswordToggle ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmNewPasswordInput}
                  onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                {!profile?.must_change_password && (
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="rounded-md border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 px-5 py-2.5 text-xs font-semibold text-white transition cursor-pointer shadow-md"
                >
                  {actionLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD EMPLOYEE (HR ONLY) */}
      {showAddEmployeeModal && isHr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAddEmployeeModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
            <div>
              <h3 className="text-xl font-bold text-white">Create Employee Account</h3>
              <p className="text-xs text-zinc-400 mt-1">Add a new team member and generate system credentials</p>
            </div>

            {addEmployeeError && (
              <div className="rounded-md bg-red-950/30 border border-red-900/50 p-3 text-xs text-red-400">
                {addEmployeeError}
              </div>
            )}

            {addEmployeeSuccess ? (
              <div className="space-y-4">
                <div className="rounded-md bg-emerald-950/20 border border-emerald-900/30 p-4 text-xs text-emerald-400 font-medium">
                  Employee account created successfully! Please share these credentials with the employee.
                </div>

                <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-sans text-xs">
                  <div className="flex justify-between border-b border-zinc-850 pb-2">
                    <span className="text-zinc-500">Name</span>
                    <span className="font-semibold text-white">{addEmployeeSuccess.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-2">
                    <span className="text-zinc-500">Email</span>
                    <span className="font-semibold text-white">{addEmployeeSuccess.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-2">
                    <span className="text-purple-400 font-medium">Generated Login ID</span>
                    <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{addEmployeeSuccess.loginId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-400 font-medium">Initial Password</span>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{addEmployeeSuccess.initialPassword}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={copyEmployeeCredentials}
                    className="w-full flex items-center justify-center space-x-2 rounded-md bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 transition"
                  >
                    <span>{addEmployeeCopied ? "Copied to Clipboard!" : "Copy Credentials"}</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddEmployeeSuccess(null);
                        setAddEmployeeError("");
                      }}
                      className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:border-zinc-700 transition"
                    >
                      + Add Another
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddEmployeeModal(false)}
                      className="rounded-md bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-750 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Smith"
                    value={addEmployeeForm.name}
                    onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, name: e.target.value })}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="alice.smith@company.com"
                    value={addEmployeeForm.email}
                    onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, email: e.target.value })}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={addEmployeeForm.phone}
                    onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, phone: e.target.value })}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Department</label>
                    <input
                      type="text"
                      value={addEmployeeForm.department}
                      onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, department: e.target.value })}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Position</label>
                    <input
                      type="text"
                      value={addEmployeeForm.position}
                      onChange={(e) => setAddEmployeeForm({ ...addEmployeeForm, position: e.target.value })}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEmployeeModal(false)}
                    className="rounded-md border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-md bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-xs font-semibold text-white transition"
                  >
                    {actionLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
