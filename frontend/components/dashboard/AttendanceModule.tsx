"use client";

import React from "react";

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
  records: AttendanceRecord[];
  isHr: boolean;
  loading?: boolean;
}

export default function AttendanceModule({ records, isHr, loading = false }: AttendanceModuleProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">Attendance Module</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isHr ? "Company-wide employee attendance records" : "Your daily attendance history"}
          </p>
        </div>

        <span className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-400 font-mono">
          Total Records: {records.length}
        </span>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
            <tr>
              {isHr && <th className="px-5 py-3">Employee ID</th>}
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Check In</th>
              <th className="px-5 py-3">Check Out</th>
              <th className="px-5 py-3">Working Duration</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={isHr ? 6 : 5} className="px-5 py-8 text-center text-zinc-500">
                  Loading attendance records...
                </td>
              </tr>
            ) : records.length > 0 ? (
              records.map((rec) => (
                <tr key={rec.id} className="hover:bg-zinc-900/90 transition">
                  {isHr && <td className="px-5 py-3.5 font-mono font-semibold text-purple-300">{rec.employee_id}</td>}
                  <td className="px-5 py-3.5 font-mono font-medium text-white">{rec.date}</td>
                  <td className="px-5 py-3.5 text-zinc-300">
                    {rec.check_in
                      ? new Date(rec.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "-"}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-300">
                    {rec.check_out
                      ? new Date(rec.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "-"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-purple-400 font-semibold">
                    {rec.work_hours || 0} hrs
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        rec.status === "present"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : rec.status === "checked-in"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isHr ? 6 : 5} className="px-5 py-8 text-center text-zinc-500">
                  No attendance records logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
