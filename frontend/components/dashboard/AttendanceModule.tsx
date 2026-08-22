"use client";

import React, { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface AttendanceRecord {
  id: string;
  user_id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  status: string;
}

interface AttendanceModuleProps {
  viewerId: string;
  viewerRole: string;
}

interface SummaryStats {
  selectedMonth: string;
  daysPresent: number;
  leavesCount: number;
  totalWorkingDays: number;
  payableDays: number;
}

interface HRRecord {
  id: string;
  user_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  status: string;
}

interface EmployeeRecord {
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  extra_hours: number;
  status: string;
}

export default function AttendanceModule({ viewerId, viewerRole }: AttendanceModuleProps) {
  const isHr = viewerRole === "hr";

  // Date states
  const getInitialLocalDateStr = () => {
    const offset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - offset).toISOString().split("T")[0];
  };

  const getInitialLocalMonthStr = () => {
    const offset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - offset).toISOString().substring(0, 7);
  };

  const [selectedDate, setSelectedDate] = useState(getInitialLocalDateStr());
  const [selectedMonth, setSelectedMonth] = useState(getInitialLocalMonthStr());
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyLogged, setOnlyLogged] = useState(false);

  // Data states
  const [hrRecords, setHrRecords] = useState<HRRecord[]>([]);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Load HR Daily Records
  const loadHRData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/attendance/all?date=${selectedDate}&search=${encodeURIComponent(searchQuery)}&onlyLogged=${onlyLogged}&requesterId=${viewerId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load employee records.");
      setHrRecords(data.records || []);
    } catch (err: any) {
      setError(err.message || "Failed to load attendance directory.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, searchQuery, onlyLogged, viewerId]);

  // 2. Load Employee Monthly Calendar & Summary
  const loadEmployeeData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/attendance/history?userId=${viewerId}&requesterId=${viewerId}&month=${selectedMonth}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load attendance history.");
      setEmployeeRecords(data.history || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || "Failed to load attendance history.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, viewerId]);

  useEffect(() => {
    if (isHr) {
      loadHRData();
    } else {
      loadEmployeeData();
    }
  }, [isHr, loadHRData, loadEmployeeData]);

  // Adjust date (HR View) - Timezone Safe Day Navigation
  const handleAdjustDate = (amount: number) => {
    const current = new Date(selectedDate + "T12:00:00");
    current.setDate(current.getDate() + amount);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleResetToToday = () => {
    setSelectedDate(getInitialLocalDateStr());
  };

  // Formatting helpers
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "present":
        return "bg-[#8FBF9F]/10 text-[#8FBF9F] border border-[#8FBF9F]/20";
      case "checked-in":
        return "bg-[#D6AA5C]/10 text-[#D6AA5C] border border-[#D6AA5C]/20";
      case "leave":
        return "bg-[#8C9BB3]/10 text-[#8C9BB3] border border-[#8C9BB3]/20";
      case "weekend":
        return "bg-[#222B25] text-[#9B9D96] border border-[rgba(242,240,232,0.08)]";
      case "data-unavailable":
      case "future":
        return "bg-[#D6AA5C]/10 text-[#D6AA5C] border border-[#D6AA5C]/20";
      case "absent":
      default:
        return "bg-[#D98282]/10 text-[#D98282] border border-[#D98282]/20";
    }
  };

  const isFutureSelectedDate = selectedDate > getInitialLocalDateStr();

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-[#3F6B4F] px-4 py-2.5 text-xs font-semibold text-[#F2F0E8] shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* HR / ADMIN ATTENDANCE VIEW */}
      {/* ---------------------------------------------------- */}
      {isHr && (
        <div className="space-y-6">
          {/* Header & Date Navigation Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(242,240,232,0.04)]">
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-[#F2F0E8] uppercase tracking-wide">
                Attendance Directory
              </h1>
              <p className="text-xs text-[#9B9D96] mt-0.5">
                Showing attendance logs for <strong className="text-[#8FBF9F] font-mono font-semibold">{formatDateLabel(selectedDate)}</strong>
              </p>
            </div>

            {/* Toolbar controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Toggle: All Employees vs Only Logged */}
              <button
                type="button"
                onClick={() => setOnlyLogged(!onlyLogged)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${onlyLogged
                  ? "bg-[#3F6B4F]/20 text-[#8FBF9F] border-[#8FBF9F]/40"
                  : "bg-[#0D0F0E] text-[#9B9D96] border-[rgba(242,240,232,0.08)] hover:text-[#F2F0E8]"
                  }`}
              >
                {onlyLogged ? "✓ Active Logs Only" : "All Employees"}
              </button>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Employee / ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#8FBF9F] w-48"
                />
              </div>

              {/* Date navigation */}
              <div className="flex items-center space-x-1.5 bg-[#1A211C] p-1 border border-[rgba(242,240,232,0.08)] rounded-xl">
                <button
                  type="button"
                  onClick={() => handleAdjustDate(-1)}
                  title="Previous Day"
                  className="hover:bg-[#222B25] text-[#9B9D96] hover:text-[#F2F0E8] px-2 py-1 text-xs rounded transition font-mono cursor-pointer font-bold"
                >
                  ←
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="bg-transparent text-[#F2F0E8] text-xs border-none outline-none px-1.5 py-0.5 focus:ring-0 font-medium cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustDate(1)}
                  title="Next Day"
                  className="hover:bg-[#222B25] text-[#9B9D96] hover:text-[#F2F0E8] px-2 py-1 text-xs rounded transition font-mono cursor-pointer font-bold"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={handleResetToToday}
                  title="Jump to Today"
                  className="bg-[#222B25] hover:bg-[#2F523C] text-[#F2F0E8] px-2 py-1 text-[10px] uppercase font-bold rounded transition cursor-pointer ml-1"
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Future Date Alert Banner */}
          {isFutureSelectedDate && (
            <div className="rounded-xl border border-[#D6AA5C]/20 bg-[#D6AA5C]/5 p-4 flex items-center justify-between text-xs text-[#D6AA5C]">
              <div className="flex items-center space-x-2.5">
                <svg className="h-5 w-5 text-[#D6AA5C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Data Unavailable:</strong> Future date selected ({formatDateLabel(selectedDate)}). Attendance records are not available for upcoming days.
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToToday}
                className="bg-[#D6AA5C]/20 hover:bg-[#D6AA5C]/30 text-[#F2F0E8] border border-[#D6AA5C]/30 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ml-4"
              >
                Return to Today
              </button>
            </div>
          )}

          {/* Table display */}
          <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] overflow-hidden shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F2F0E8] min-w-[700px]">
                <thead className="bg-[#0D0F0E] text-[#686C66] uppercase tracking-wider text-[10px] border-b border-[rgba(242,240,232,0.08)]">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Login ID</th>
                    <th className="px-5 py-3">Check In</th>
                    <th className="px-5 py-3">Check Out</th>
                    <th className="px-5 py-3">Work Hours</th>
                    <th className="px-5 py-3">Extra Hours</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(242,240,232,0.04)]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[#9B9D96]">
                        <div className="flex flex-col items-center space-y-2">
                          <svg className="animate-spin h-5 w-5 text-[#8FBF9F]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Loading employee attendance...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-[#D98282] font-semibold">
                        {error}
                      </td>
                    </tr>
                  ) : hrRecords.length > 0 ? (
                    hrRecords.map((rec) => {
                      const extraHrs = Math.max(0, rec.work_hours - 8.0);
                      return (
                        <tr key={rec.id} className="hover:bg-[#141A16] transition">
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-[#F2F0E8]">{rec.full_name}</div>
                            <div className="text-[10px] text-[#9B9D96] mt-0.5">{rec.position} • {rec.department}</div>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-medium text-[#9B9D96]">
                            {rec.employee_id}
                          </td>
                          <td className="px-5 py-3.5 text-[#F2F0E8]">
                            {formatTime(rec.check_in)}
                          </td>
                          <td className="px-5 py-3.5 text-[#F2F0E8]">
                            {formatTime(rec.check_out)}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[#F2F0E8]">
                            {rec.work_hours > 0 ? `${rec.work_hours.toFixed(2)} hrs` : "-"}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[#8FBF9F] font-semibold">
                            {extraHrs > 0 ? `+${extraHrs.toFixed(2)} hrs` : "-"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${getStatusBadgeClass(rec.status)}`}>
                              {rec.status === "data-unavailable" ? "Data Unavailable" : rec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[#9B9D96]">
                        {isFutureSelectedDate
                          ? "Attendance data unavailable for future dates."
                          : "No attendance records found for this date."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EMPLOYEE PERSONAL ATTENDANCE VIEW */}
      {/* ---------------------------------------------------- */}
      {!isHr && (
        <div className="space-y-6">
          {/* Summary widgets at the top */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(242,240,232,0.04)] pb-4">
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-[#F2F0E8] uppercase tracking-wide">
                My Attendance
              </h1>
              <p className="text-xs text-[#9B9D96] mt-0.5">
                Track your personal check-ins, working days, and payable payroll stats.
              </p>
            </div>

            {/* Month Picker */}
            <div className="flex items-center space-x-2 bg-[#1A211C] px-3 py-1.5 border border-[rgba(242,240,232,0.08)] rounded-xl shrink-0">
              <span className="text-[10px] text-[#686C66] uppercase font-bold tracking-wider">Select Month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-[#F2F0E8] text-xs border-none outline-none focus:ring-0 font-semibold cursor-pointer"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[rgba(242,240,232,0.04)] bg-[#141A16] p-4.5 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#686C66]">Days Present</span>
              <strong className="text-2xl font-bold text-[#8FBF9F] block font-mono">
                {loading ? "-" : summary?.daysPresent || 0}
              </strong>
            </div>

            <div className="rounded-2xl border border-[rgba(242,240,232,0.04)] bg-[#141A16] p-4.5 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#686C66]">Leaves Count</span>
              <strong className="text-2xl font-bold text-[#8C9BB3] block font-mono">
                {loading ? "-" : summary?.leavesCount || 0}
              </strong>
            </div>

            <div className="rounded-2xl border border-[rgba(242,240,232,0.04)] bg-[#141A16] p-4.5 shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#686C66]">Total Weekdays</span>
              <strong className="text-2xl font-bold text-[#F2F0E8] block font-mono">
                {loading ? "-" : summary?.totalWorkingDays || 0}
              </strong>
            </div>

            <div className="rounded-2xl border border-[#3F6B4F]/20 bg-[#1A211C] p-4.5 shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] space-y-1 border-t-[3px] border-t-[#8FBF9F]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8FBF9F]">Payable Days</span>
              <strong className="text-2xl font-bold text-[#F2F0E8] block font-mono">
                {loading ? "-" : summary?.payableDays || 0}
              </strong>
            </div>
          </div>

          {/* Attendance History Calendar Table */}
          <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] overflow-hidden shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F2F0E8] min-w-[600px]">
                <thead className="bg-[#0D0F0E] text-[#686C66] uppercase tracking-wider text-[10px] border-b border-[rgba(242,240,232,0.08)]">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Check In</th>
                    <th className="px-5 py-3">Check Out</th>
                    <th className="px-5 py-3">Work Hours</th>
                    <th className="px-5 py-3">Extra Hours</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(242,240,232,0.04)]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-[#9B9D96]">
                        <div className="flex flex-col items-center space-y-2">
                          <svg className="animate-spin h-5 w-5 text-[#8FBF9F]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Loading personal calendar history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[#D98282] font-semibold">
                        {error}
                      </td>
                    </tr>
                  ) : employeeRecords.length > 0 ? (
                    employeeRecords.map((rec, index) => (
                      <tr key={index} className="hover:bg-[#141A16] transition">
                        <td className="px-5 py-3.5 font-mono font-medium text-[#F2F0E8]">
                          {formatDateLabel(rec.date)}
                        </td>
                        <td className="px-5 py-3.5 text-[#F2F0E8]">
                          {formatTime(rec.check_in)}
                        </td>
                        <td className="px-5 py-3.5 text-[#F2F0E8]">
                          {formatTime(rec.check_out)}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[#F2F0E8]">
                          {rec.work_hours > 0 ? `${rec.work_hours.toFixed(2)} hrs` : "-"}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[#8FBF9F] font-semibold">
                          {rec.extra_hours > 0 ? `+${rec.extra_hours.toFixed(2)} hrs` : "-"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${getStatusBadgeClass(rec.status)}`}>
                            {rec.status === "data-unavailable" ? "Data Unavailable" : rec.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-[#9B9D96]">
                        No calendar records logged for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
