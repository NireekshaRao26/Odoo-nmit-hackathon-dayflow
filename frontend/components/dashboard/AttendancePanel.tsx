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
    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Attendance Panel</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
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
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : isCheckedOut
              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isCheckedIn
                ? "bg-emerald-400 animate-pulse"
                : isCheckedOut
                ? "bg-purple-400"
                : "bg-amber-400"
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
        <div className="rounded-md bg-zinc-950/80 border border-zinc-800/80 p-3 flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Session Active</span>
          <span className="text-emerald-400 font-medium font-mono">Since {checkInFormatted}</span>
        </div>
      )}

      {/* Button Action Area */}
      <div>
        {isCheckedIn ? (
          <button
            type="button"
            onClick={onClockOut}
            disabled={loading}
            className="w-full rounded-md bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold py-2.5 text-xs transition duration-150 shadow-md cursor-pointer flex items-center justify-center space-x-2"
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
            className="w-full rounded-md bg-zinc-800 border border-zinc-700/50 text-zinc-500 font-semibold py-2.5 text-xs cursor-not-allowed text-center"
          >
            Attendance Completed Today
          </button>
        ) : (
          <button
            type="button"
            onClick={onClockIn}
            disabled={loading}
            className="w-full rounded-md bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold py-2.5 text-xs transition duration-150 shadow-md cursor-pointer flex items-center justify-center space-x-2"
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
