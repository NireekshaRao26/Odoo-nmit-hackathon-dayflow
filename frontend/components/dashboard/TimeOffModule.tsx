"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// TYPES
// ============================================================
export interface LeaveRequest {
  id: string;
  user_id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewer_comments?: string;
  attachment_url?: string;
  applied_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
    department?: string;
  };
}

export interface LeaveBalance {
  id?: string;
  user_id: string;
  employee_id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  year: number;
  profiles?: {
    full_name?: string;
    email?: string;
    employee_id?: string;
    department?: string;
  };
}

interface TimeOffModuleProps {
  isHr: boolean;
  userId: string;
  employeeId: string;
  fullName?: string;
  onRefresh?: () => void;
}

// ============================================================
// UTILITIES
// ============================================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const LEAVE_TYPES = ["Paid Time Off", "Sick Leave", "Unpaid Leave"];

function calculateWorkingDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  let count = 0;
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  if (start > end) return 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return Math.max(0, count);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusColor(status: string): string {
  switch (status) {
    case "approved":  return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "rejected":  return "bg-red-500/10 text-red-400 border border-red-500/20";
    default:          return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  }
}

function leaveTypeColor(lt: string): string {
  if (lt.includes("Paid")) return "text-purple-300";
  if (lt.includes("Sick")) return "text-blue-300";
  return "text-zinc-300";
}

// ============================================================
// MINI CALENDAR COMPONENT
// ============================================================
function LeaveCalendar({ leaveRequests }: { leaveRequests: LeaveRequest[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function getDayStatus(day: number): "approved" | "pending" | "today" | null {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    for (const req of leaveRequests) {
      if (req.start_date <= dateStr && dateStr <= req.end_date) {
        if (req.status === "approved") return "approved";
        if (req.status === "pending") return "pending";
      }
    }
    if (dateStr === todayStr) return "today";
    return null;
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const blanks = Array.from({ length: firstDay });
  const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth}
          className="text-zinc-400 hover:text-white transition px-1 cursor-pointer">‹</button>
        <span className="text-xs font-bold text-white uppercase tracking-widest">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth}
          className="text-zinc-400 hover:text-white transition px-1 cursor-pointer">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const status = getDayStatus(day);
          let cls = "flex items-center justify-center text-[11px] rounded h-7 w-full font-medium transition ";
          if (status === "approved") cls += "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
          else if (status === "pending") cls += "bg-amber-500/15 text-amber-300 border border-amber-500/25";
          else if (status === "today") cls += "bg-purple-600/20 text-purple-300 border border-purple-500/40 font-bold";
          else cls += "text-zinc-400 hover:bg-zinc-800/60";
          return <div key={day} className={cls}>{day}</div>;
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500/60 inline-block" />Approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500/60 inline-block" />Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-500/60 inline-block" />Today
        </span>
      </div>
    </div>
  );
}

// ============================================================
// BALANCE CARDS COMPONENT
// ============================================================
function BalanceCards({ balances }: { balances: LeaveBalance[] }) {
  const icons: Record<string, string> = {
    "Paid Time Off": "💼",
    "Sick Leave": "🏥",
    "Unpaid Leave": "📋",
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {LEAVE_TYPES.map(lt => {
        const bal = balances.find(b => b.leave_type === lt);
        const allocated = bal?.allocated_days ?? 0;
        const used = bal?.used_days ?? 0;
        const remaining = Math.max(0, allocated - used);
        const pct = allocated > 0 ? Math.round((used / allocated) * 100) : 0;
        return (
          <div key={lt} className="rounded-md border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{lt}</span>
              <span className="text-lg">{icons[lt]}</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">{String(remaining).padStart(2, "0")}</span>
              <span className="text-xs text-zinc-500 ml-1.5">days available</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>{used} used</span>
                <span>{allocated} total</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN TIME OFF MODULE
// ============================================================
export default function TimeOffModule({ isHr, userId, employeeId, fullName, onRefresh }: TimeOffModuleProps) {
  // Tab state (HR only)
  const [hrTab, setHrTab] = useState<"requests" | "allocation">("requests");

  // Data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [allBalances, setAllBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // HR search
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [reviewModal, setReviewModal] = useState<LeaveRequest | null>(null);

  // New request form
  const [form, setForm] = useState({
    leaveType: "Paid Time Off",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Review modal
  const [reviewComment, setReviewComment] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null); // leaveId being acted on

  // Allocation editing
  const [editingAlloc, setEditingAlloc] = useState<{ userId: string; leaveType: string; value: string } | null>(null);
  const [allocSaving, setAllocSaving] = useState(false);

  const workingDays = calculateWorkingDays(form.startDate, form.endDate);

  // --------------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------------
  const fetchLeaves = useCallback(async (searchQuery = "") => {
    try {
      let url: string;
      if (isHr) {
        url = `${API_BASE}/api/leaves/all?requesterId=${userId}&search=${encodeURIComponent(searchQuery)}`;
      } else {
        url = `${API_BASE}/api/leaves/user?userId=${userId}&employeeId=${employeeId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setLeaveRequests(data.requests || []);
    } catch {
      setError("Unable to load time-off records.");
    }
  }, [isHr, userId, employeeId]);

  const fetchBalances = useCallback(async () => {
    try {
      if (isHr) {
        const res = await fetch(`${API_BASE}/api/leaves/balances?isHr=true`);
        if (res.ok) {
          const data = await res.json();
          setAllBalances(data.balances || []);
        }
        // Also fetch own balances for HR user
        const res2 = await fetch(`${API_BASE}/api/leaves/balances?userId=${userId}&employeeId=${employeeId}`);
        if (res2.ok) {
          const data2 = await res2.json();
          setBalances(data2.balances || []);
        }
      } else {
        const res = await fetch(`${API_BASE}/api/leaves/balances?userId=${userId}&employeeId=${employeeId}`);
        if (res.ok) {
          const data = await res.json();
          setBalances(data.balances || []);
        }
      }
    } catch {
      // Silently fail — balances will show zeros
    }
  }, [isHr, userId, employeeId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchLeaves(), fetchBalances()]);
    setLoading(false);
  }, [fetchLeaves, fetchBalances]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // HR search with debounce
  const handleSearch = (q: string) => {
    setSearch(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchLeaves(q), 350);
  };

  // --------------------------------------------------------
  // ATTACHMENT UPLOAD
  // --------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError("");
    const file = e.target.files?.[0];
    if (!file) { setAttachmentFile(null); return; }
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setAttachmentError("Only JPEG, PNG, or PDF files allowed.");
      setAttachmentFile(null); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError("File must be under 5 MB.");
      setAttachmentFile(null); return;
    }
    setAttachmentFile(file);
  };

  const uploadAttachment = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("userId", userId);
    const res = await fetch(`${API_BASE}/api/leaves/upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.attachmentUrl || "";
  };

  // --------------------------------------------------------
  // SUBMIT NEW REQUEST
  // --------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.startDate || !form.endDate) {
      setFormError("Start date and end date are required.");
      return;
    }
    if (form.startDate > form.endDate) {
      setFormError("Start date must be on or before end date.");
      return;
    }
    if (!form.reason.trim()) {
      setFormError("Please provide a reason for your leave.");
      return;
    }
    if (workingDays === 0) {
      setFormError("The selected dates contain no working days.");
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl = "";
      if (attachmentFile) {
        try {
          attachmentUrl = await uploadAttachment(attachmentFile);
        } catch (uploadErr: unknown) {
          // Non-fatal: warn but continue
          console.warn("Attachment upload failed:", uploadErr);
        }
      }

      const res = await fetch(`${API_BASE}/api/leaves/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          employeeId,
          leaveType: form.leaveType,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason.trim(),
          attachmentUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");

      // Reset and close
      setShowNewModal(false);
      setForm({
        leaveType: "Paid Time Off",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        reason: "",
      });
      setAttachmentFile(null);
      setFormError("");
      await loadAll();
      onRefresh?.();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------------
  // APPROVE / REJECT
  // --------------------------------------------------------
  const handleReview = async (leaveId: string, status: "approved" | "rejected") => {
    setActionLoading(leaveId);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status, comments: reviewComment, reviewerId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      setReviewModal(null);
      setReviewComment("");
      await loadAll();
      onRefresh?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  // --------------------------------------------------------
  // ALLOCATION UPDATE
  // --------------------------------------------------------
  const handleSaveAlloc = async () => {
    if (!editingAlloc) return;
    setAllocSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/balances`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingAlloc.userId,
          leaveType: editingAlloc.leaveType,
          allocatedDays: Number(editingAlloc.value),
          reviewerId: userId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update allocation.");
      setEditingAlloc(null);
      await fetchBalances();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update allocation.");
    } finally {
      setAllocSaving(false);
    }
  };

  // --------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------
  const RequestsTable = ({ rows }: { rows: LeaveRequest[] }) => (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300 min-w-[640px]">
          <thead className="bg-zinc-950 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Status</th>
              {isHr && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isHr ? 7 : 6} className="px-4 py-10 text-center text-zinc-500">
                  No time-off requests found.
                </td>
              </tr>
            ) : rows.map(req => (
              <tr key={req.id} className="hover:bg-zinc-900/80 transition group">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-white text-[11px]">
                    {req.profiles?.full_name || req.employee_id}
                  </div>
                  <div className="text-zinc-500 text-[10px] font-mono">{req.employee_id}</div>
                </td>
                <td className={`px-4 py-3.5 font-semibold text-[11px] ${leaveTypeColor(req.leave_type)}`}>
                  {req.leave_type}
                </td>
                <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px]">{formatDate(req.start_date)}</td>
                <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px]">{formatDate(req.end_date)}</td>
                <td className="px-4 py-3.5 font-bold text-white">{req.days_count}d</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor(req.status)}`}>
                    {req.status}
                  </span>
                </td>
                {isHr && (
                  <td className="px-4 py-3.5 text-right">
                    {req.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setReviewModal(req); setReviewComment(""); }}
                          disabled={!!actionLoading}
                          className="rounded px-3 py-1 text-[10px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => { setReviewModal(req); setReviewComment(""); }}
                          disabled={!!actionLoading}
                          className="rounded px-3 py-1 text-[10px] font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-600 capitalize">{req.status}</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --------------------------------------------------------
  // ALLOCATION TABLE (HR)
  // --------------------------------------------------------
  const groupedBalances = allBalances.reduce((acc, b) => {
    const uid = b.user_id;
    if (!acc[uid]) acc[uid] = { profile: b.profiles, balances: [] };
    acc[uid].balances.push(b);
    return acc;
  }, {} as Record<string, { profile: LeaveBalance["profiles"]; balances: LeaveBalance[] }>);

  // --------------------------------------------------------
  // LOADING / ERROR
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">
        <svg className="animate-spin h-5 w-5 mr-3 text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading time-off records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={loadAll} className="text-xs text-zinc-400 hover:text-white underline cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  // ============================================================
  // HR VIEW
  // ============================================================
  if (isHr) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-wide">Time Off</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Review and manage employee leave requests</p>
          </div>
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-md p-1">
            <button
              type="button"
              onClick={() => setHrTab("requests")}
              className={`px-4 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                hrTab === "requests"
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Time Off
            </button>
            <button
              type="button"
              onClick={() => setHrTab("allocation")}
              className={`px-4 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                hrTab === "allocation"
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Allocation
            </button>
          </div>
        </div>

        {/* ── TIME OFF TAB ── */}
        {hrTab === "requests" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, ID or email..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900/60 pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="text-[11px] text-zinc-500">
                {leaveRequests.length} request{leaveRequests.length !== 1 ? "s" : ""}
              </div>
            </div>

            <RequestsTable rows={leaveRequests} />
          </div>
        )}

        {/* ── ALLOCATION TAB ── */}
        {hrTab === "allocation" && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">
              Manage annual leave allocations. Click a value to edit.
            </p>
            {Object.keys(groupedBalances).length === 0 ? (
              <div className="rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-12 text-center text-zinc-500 text-sm">
                No allocation records found. Leave balances are created automatically when employees submit requests.
              </div>
            ) : (
              <div className="rounded-md border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300 min-w-[640px]">
                    <thead className="bg-zinc-950 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Leave Type</th>
                        <th className="px-4 py-3 text-center">Allocated</th>
                        <th className="px-4 py-3 text-center">Used</th>
                        <th className="px-4 py-3 text-center">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {Object.entries(groupedBalances).flatMap(([uid, { profile, balances: bals }]) =>
                        bals.map((b, i) => {
                          const remaining = Math.max(0, b.allocated_days - b.used_days);
                          const isEditing = editingAlloc?.userId === uid && editingAlloc?.leaveType === b.leave_type;
                          return (
                            <tr key={`${uid}-${b.leave_type}`} className="hover:bg-zinc-900/80 transition">
                              {i === 0 ? (
                                <td className="px-4 py-3.5" rowSpan={bals.length}>
                                  <div className="font-semibold text-white text-[11px]">
                                    {profile?.full_name || b.employee_id}
                                  </div>
                                  <div className="text-zinc-500 text-[10px] font-mono">{b.employee_id}</div>
                                </td>
                              ) : null}
                              <td className={`px-4 py-3.5 font-semibold text-[11px] ${leaveTypeColor(b.leave_type)}`}>
                                {b.leave_type}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={365}
                                      value={editingAlloc!.value}
                                      onChange={e => setEditingAlloc({ ...editingAlloc!, value: e.target.value })}
                                      className="w-16 rounded border border-purple-500/50 bg-zinc-900 px-2 py-1 text-center text-xs text-white focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleSaveAlloc}
                                      disabled={allocSaving}
                                      className="text-emerald-400 hover:text-emerald-300 cursor-pointer text-[10px] font-semibold disabled:opacity-40"
                                    >
                                      {allocSaving ? "…" : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingAlloc(null)}
                                      className="text-zinc-500 hover:text-white cursor-pointer text-[10px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingAlloc({ userId: uid, leaveType: b.leave_type, value: String(b.allocated_days) })}
                                    className="font-bold text-white hover:text-purple-400 transition cursor-pointer"
                                    title="Click to edit"
                                  >
                                    {b.allocated_days}
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center text-amber-400 font-semibold">
                                {b.used_days}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`font-bold ${remaining > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {remaining}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HR Review Modal */}
        {reviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 relative">
              <button type="button" onClick={() => setReviewModal(null)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer text-lg leading-none">
                ✕
              </button>

              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">Review Leave Request</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {reviewModal.profiles?.full_name || reviewModal.employee_id} · {reviewModal.employee_id}
                </p>
              </div>

              <div className="rounded bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Type</span>
                  <span className={`font-semibold ${leaveTypeColor(reviewModal.leave_type)}`}>{reviewModal.leave_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Period</span>
                  <span className="text-zinc-200">{formatDate(reviewModal.start_date)} → {formatDate(reviewModal.end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Duration</span>
                  <span className="font-bold text-white">{reviewModal.days_count} working day{reviewModal.days_count !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Reason</span>
                  <span className="text-zinc-200 text-right max-w-[60%]">{reviewModal.reason}</span>
                </div>
                {reviewModal.attachment_url && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Attachment</span>
                    <a href={reviewModal.attachment_url} target="_blank" rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline text-[10px]">
                      View Document
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Comment (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add a note for the employee..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleReview(reviewModal.id, "rejected")}
                  disabled={!!actionLoading}
                  className="flex-1 rounded-md bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-semibold py-2 text-xs transition cursor-pointer disabled:opacity-40"
                >
                  {actionLoading === reviewModal.id ? "Rejecting..." : "Reject"}
                </button>
                <button
                  type="button"
                  onClick={() => handleReview(reviewModal.id, "approved")}
                  disabled={!!actionLoading}
                  className="flex-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 text-xs transition shadow cursor-pointer disabled:opacity-40"
                >
                  {actionLoading === reviewModal.id ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // EMPLOYEE VIEW
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-wide">Time Off</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage your leave requests and view balances</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowNewModal(true); setFormError(""); }}
          className="rounded-md bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-5 py-2 text-xs font-semibold transition shadow-md cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>
      </div>

      {/* Balance Cards */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Leave Balances</p>
        <BalanceCards balances={balances} />
      </section>

      {/* Calendar + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Leave Calendar</p>
          <LeaveCalendar leaveRequests={leaveRequests} />
        </div>

        {/* Request History */}
        <div className="lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            My Requests ({leaveRequests.length})
          </p>
          <RequestsTable rows={leaveRequests} />
        </div>
      </div>

      {/* ── NEW REQUEST MODAL ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => { setShowNewModal(false); setFormError(""); setAttachmentFile(null); }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer text-lg leading-none"
            >
              ✕
            </button>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Time Off Type Request</h3>
              <p className="text-xs text-zinc-400 mt-1">Submit a leave request for HR approval.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee (read-only) */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Employee
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${fullName || "You"} (${employeeId})`}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                />
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Time Off Type
                </label>
                <select
                  value={form.leaveType}
                  onChange={e => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  {LEAVE_TYPES.map(lt => (
                    <option key={lt} value={lt}>{lt}</option>
                  ))}
                </select>
              </div>

              {/* Validity Period */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Validity Period
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Start Date</p>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">End Date</p>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      min={form.startDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Allocation (auto-calculated) */}
              <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Allocation</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Working days (excl. weekends)</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-white">{workingDays}</span>
                  <span className="text-xs text-zinc-500 ml-1">day{workingDays !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Briefly describe the reason for your leave..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Attachment <span className="text-zinc-600 normal-case font-normal">(optional – required for Sick Leave)</span>
                </label>
                <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-950 px-4 py-4 text-center">
                  <input
                    id="attachment-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="attachment-upload" className="cursor-pointer block">
                    {attachmentFile ? (
                      <div className="space-y-1">
                        <p className="text-xs text-emerald-400 font-semibold">✓ {attachmentFile.name}</p>
                        <p className="text-[10px] text-zinc-500">{(attachmentFile.size / 1024).toFixed(0)} KB — click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-400">Click to upload a document</p>
                        <p className="text-[10px] text-zinc-600">JPEG, PNG, PDF · max 5 MB</p>
                      </div>
                    )}
                  </label>
                </div>
                {attachmentError && (
                  <p className="text-[10px] text-red-400 mt-1">{attachmentError}</p>
                )}
              </div>

              {formError && (
                <div className="rounded bg-red-950/40 border border-red-800/40 px-3 py-2 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setShowNewModal(false); setFormError(""); setAttachmentFile(null); }}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!attachmentError}
                  className="rounded-md bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-semibold transition shadow cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
