"use client";

import React from "react";

interface AttendanceRecord {
  id: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  status: string;
}

interface AttendancePanelProps {
  todayAttendance: AttendanceRecord | null;
  loading: boolean;
  onClockIn: () => Promise<void>;
  onClockOut: () => Promise<void>;
}

export default function AttendancePanel({
  todayAttendance,
  loading,
  onClockIn,
  onClockOut,
}: AttendancePanelProps) {
  const isCheckedIn = todayAttendance?.status === "checked-in" && todayAttendance?.check_in && !todayAttendance?.check_out;
  const isCheckedOut = todayAttendance?.check_out != null || todayAttendance?.status === "present";

  // Format check-in time string e.g., "09:00 AM"
  const checkInFormatted = todayAttendance?.check_in
    ? new Date(todayAttendance.check_in).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-display font-bold text-[#F2F0E8] uppercase tracking-wider">Attendance Panel</h3>
          <p className="text-xs text-[#9B9D96] mt-0.5">
            {isCheckedIn
              ? `Currently checked in`
              : isCheckedOut
              ? `Day completed (${todayAttendance?.work_hours || 0} hrs logged)`
              : `Not checked in today`}
          </p>
        </div>

        {/* Status Pill */}
        <span
          className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isCheckedIn
              ? "bg-[#8FBF9F]/10 text-[#8FBF9F] border border-[#8FBF9F]/20"
              : isCheckedOut
              ? "bg-[#8C9BB3]/10 text-[#8C9BB3] border border-[#8C9BB3]/20"
              : "bg-[#D6AA5C]/10 text-[#D6AA5C] border border-[#D6AA5C]/20"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isCheckedIn
                ? "bg-[#8FBF9F] animate-pulse"
                : isCheckedOut
                ? "bg-[#8C9BB3]"
                : "bg-[#D6AA5C]"
            }`}
          />
          <span>
            {isCheckedIn
              ? "CHECKED IN"
              : isCheckedOut
              ? "CHECKED OUT"
              : "OFFLINE"}
          </span>
        </span>
      </div>

      {/* Since Time Indicator */}
      {checkInFormatted && (
        <div className="rounded-xl bg-[#0D0F0E]/80 border border-[rgba(242,240,232,0.08)] p-3 flex items-center justify-between text-xs">
          <span className="text-[#686C66] font-semibold uppercase text-[10px] tracking-wider">Session Active</span>
          <span className="text-[#8FBF9F] font-medium font-mono">Since {checkInFormatted}</span>
        </div>
      )}

      {/* Button Action Area */}
      <div>
        {isCheckedIn ? (
          <button
            type="button"
            onClick={onClockOut}
            disabled={loading}
            className="w-full rounded-xl bg-[#3F6B4F] hover:bg-[#2F523C] active:bg-[#222B25] text-[#F2F0E8] font-semibold py-2.5 text-xs transition duration-150 shadow-md cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Recording Check Out...</span>
            ) : (
              <>
                <span>CHECK OUT</span>
                <span>→</span>
              </>
            )}
          </button>
        ) : isCheckedOut ? (
          <button
            type="button"
            disabled
            className="w-full rounded-xl bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#686C66] font-semibold py-2.5 text-xs cursor-not-allowed text-center"
          >
            Attendance Completed Today
          </button>
        ) : (
          <button
            type="button"
            onClick={onClockIn}
            disabled={loading}
            className="w-full rounded-xl bg-[#3F6B4F] hover:bg-[#2F523C] active:bg-[#222B25] text-[#F2F0E8] font-semibold py-2.5 text-xs transition duration-150 shadow-md cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Recording Check In...</span>
            ) : (
              <>
                <span>CHECK IN</span>
                <span>→</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
