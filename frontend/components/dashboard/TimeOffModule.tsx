"use client";

import React, { useState } from "react";

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
  applied_at: string;
}

interface TimeOffModuleProps {
  leaveRequests: LeaveRequest[];
  isHr: boolean;
  userId: string;
  employeeId: string;
  onApplyLeave: (form: { leaveType: string; startDate: string; endDate: string; reason: string }) => Promise<void>;
  onReviewLeave: (leaveId: string, status: "approved" | "rejected", comments: string) => Promise<void>;
  loading?: boolean;
}

export default function TimeOffModule({
  leaveRequests,
  isHr,
  userId,
  employeeId,
  onApplyLeave,
  onReviewLeave,
  loading = false,
}: TimeOffModuleProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [applyForm, setApplyForm] = useState({
    leaveType: "Paid Leave",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await onApplyLeave(applyForm);
      setShowApplyModal(false);
      setApplyForm({
        leaveType: "Paid Leave",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        reason: "",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewAction = async (status: "approved" | "rejected") => {
    if (!selectedLeave) return;
    setActionLoading(true);
    try {
      await onReviewLeave(selectedLeave.id, status, reviewComments);
      setSelectedLeave(null);
      setReviewComments("");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">Time Off Module</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isHr ? "Review employee time-off requests and approvals" : "Apply for leave and view leave history"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowApplyModal(true)}
          className="rounded-md bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-4 py-2 text-xs font-semibold transition cursor-pointer shadow-md flex items-center space-x-1.5"
        >
          <span>+ Apply for Time Off</span>
        </button>
      </div>

      {/* Table of Requests */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
            <tr>
              <th className="px-5 py-3">Employee ID</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Days</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Status</th>
              {isHr && <th className="px-5 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={isHr ? 7 : 6} className="px-5 py-8 text-center text-zinc-500">
                  Loading time-off applications...
                </td>
              </tr>
            ) : leaveRequests.length > 0 ? (
              leaveRequests.map((req) => (
                <tr key={req.id} className="hover:bg-zinc-900/90 transition">
                  <td className="px-5 py-3.5 font-mono font-semibold text-purple-300">{req.employee_id}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">{req.leave_type}</td>
                  <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">
                    {req.start_date} to {req.end_date}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-purple-400">{req.days_count} d</td>
                  <td className="px-5 py-3.5 max-w-xs truncate text-zinc-300">{req.reason}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        req.status === "approved"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : req.status === "rejected"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {req.status === "approved" ? "🔵 APPROVED LEAVE" : req.status.toUpperCase()}
                    </span>
                  </td>
                  {isHr && (
                    <td className="px-5 py-3.5 text-right">
                      {req.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedLeave(req)}
                          className="rounded bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Processed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isHr ? 7 : 6} className="px-5 py-8 text-center text-zinc-500">
                  No time-off requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: APPLY TIME OFF */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowApplyModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                Apply for Time Off
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Submit your leave request for approval.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Leave Type
                </label>
                <select
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State reason for absence..."
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-md border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-md bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-semibold transition shadow-md cursor-pointer"
                >
                  {actionLoading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HR REVIEW LEAVE */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setSelectedLeave(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                Review Time-Off Application
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Applicant Employee ID: <span className="text-purple-300 font-mono font-bold">{selectedLeave.employee_id}</span>
              </p>
            </div>

            <div className="rounded bg-zinc-950 p-3 space-y-1.5 border border-zinc-800 text-xs">
              <div className="flex justify-between"><span className="text-zinc-500">Type</span><span className="font-semibold text-white">{selectedLeave.leave_type}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Dates</span><span className="text-zinc-300">{selectedLeave.start_date} to {selectedLeave.end_date} ({selectedLeave.days_count}d)</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Reason</span><span className="text-zinc-200">{selectedLeave.reason}</span></div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Reviewer Note / Feedback
              </label>
              <textarea
                rows={2}
                placeholder="Optional reviewer note..."
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between space-x-3 pt-2">
              <button
                type="button"
                onClick={() => handleReviewAction("rejected")}
                disabled={actionLoading}
                className="flex-1 rounded-md bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-semibold py-2 text-xs transition cursor-pointer"
              >
                Reject Leave
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction("approved")}
                disabled={actionLoading}
                className="flex-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 text-xs transition shadow-md cursor-pointer"
              >
                Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
