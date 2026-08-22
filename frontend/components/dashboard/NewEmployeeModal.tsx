"use client";

import React, { useState } from "react";

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hrUserId: string;
  onEmployeeCreated: () => void;
}

export default function NewEmployeeModal({
  isOpen,
  onClose,
  hrUserId,
  onEmployeeCreated,
}: NewEmployeeModalProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Engineering",
    position: "Software Engineer",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{
    loginId: string;
    initialPassword: string;
    email: string;
    fullName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCreatedCredentials(null);

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setErrorMsg("Name, Email, and Phone number are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/create-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          department: form.department.trim(),
          position: form.position.trim(),
          hrUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee.");

      setCreatedCredentials(data.credentials);
      setForm({
        name: "",
        email: "",
        phone: "",
        department: "Engineering",
        position: "Software Engineer",
      });
      onEmployeeCreated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create employee.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    const text = `Dayflow Employee Credentials:\nName: ${createdCredentials.fullName}\nEmail: ${createdCredentials.email}\nLogin ID: ${createdCredentials.loginId}\nInitial Password: ${createdCredentials.initialPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] p-6 shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#9B9D96] hover:text-[#F2F0E8] transition cursor-pointer"
        >
          ✕
        </button>

        <div>
          <h3 className="text-lg font-display font-bold text-[#F2F0E8] uppercase tracking-wide">
            Register New Employee
          </h3>
          <p className="text-xs text-[#9B9D96] mt-1">
            Fill out employee details to auto-generate Login ID and credentials.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-950/30 border border-red-900/50 p-3 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {createdCredentials ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#3F6B4F]/10 border border-[#8FBF9F]/20 p-4 space-y-2">
              <span className="text-xs font-bold text-[#8FBF9F] uppercase tracking-wider block">
                Employee Created Successfully!
              </span>
              <div className="text-xs space-y-1 font-mono text-[#F2F0E8]">
                <p><strong className="text-[#9B9D96] font-sans">Name:</strong> {createdCredentials.fullName}</p>
                <p><strong className="text-[#9B9D96] font-sans">Email:</strong> {createdCredentials.email}</p>
                <p><strong className="text-[#9B9D96] font-sans">Login ID:</strong> <span className="text-[#8FBF9F] font-bold">{createdCredentials.loginId}</span></p>
                <p><strong className="text-[#9B9D96] font-sans">Password:</strong> <span className="text-[#D6AA5C] font-bold">{createdCredentials.initialPassword}</span></p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 rounded-xl bg-[#3F6B4F] hover:bg-[#2F523C] text-[#F2F0E8] font-semibold py-2 text-xs transition cursor-pointer"
              >
                {copied ? "Copied to Clipboard!" : "Copy Credentials"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedCredentials(null);
                  onClose();
                }}
                className="rounded-xl border border-[rgba(242,240,232,0.08)] px-4 py-2 text-xs font-semibold text-[#F2F0E8] hover:bg-[#222B25] transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#9B9D96] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-[rgba(242,240,232,0.08)] bg-[#0D0F0E] px-3 py-2 text-xs text-[#F2F0E8] placeholder-[#686C66] focus:border-[#8FBF9F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#9B9D96] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="jane.smith@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-[rgba(242,240,232,0.08)] bg-[#0D0F0E] px-3 py-2 text-xs text-[#F2F0E8] placeholder-[#686C66] focus:border-[#8FBF9F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#9B9D96] uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                placeholder="+1 555-0199"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-[rgba(242,240,232,0.08)] bg-[#0D0F0E] px-3 py-2 text-xs text-[#F2F0E8] placeholder-[#686C66] focus:border-[#8FBF9F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#9B9D96] uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full rounded-xl border border-[rgba(242,240,232,0.08)] bg-[#0D0F0E] px-3 py-2 text-xs text-[#F2F0E8] focus:border-[#8FBF9F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9B9D96] uppercase tracking-wider mb-1">
                  Position
                </label>
                <input
                  type="text"
                  required
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full rounded-xl border border-[rgba(242,240,232,0.08)] bg-[#0D0F0E] px-3 py-2 text-xs text-[#F2F0E8] focus:border-[#8FBF9F] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[rgba(242,240,232,0.08)]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[rgba(242,240,232,0.08)] px-4 py-2 text-xs font-semibold text-[#9B9D96] hover:bg-[#222B25] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#3F6B4F] hover:bg-[#2F523C] text-[#F2F0E8] px-5 py-2 text-xs font-semibold transition shadow-md cursor-pointer"
              >
                {loading ? "Creating Employee..." : "Create Employee"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
