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
      <div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          ✕
        </button>

        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wide">
            Register New Employee
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Fill out employee details to auto-generate Login ID and credentials.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-md bg-red-950/30 border border-red-900/50 p-3 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {createdCredentials ? (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-950/30 border border-emerald-800/40 p-4 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Employee Created Successfully!
              </span>
              <div className="text-xs space-y-1 font-mono text-zinc-300">
                <p><strong className="text-zinc-400 font-sans">Name:</strong> {createdCredentials.fullName}</p>
                <p><strong className="text-zinc-400 font-sans">Email:</strong> {createdCredentials.email}</p>
                <p><strong className="text-zinc-400 font-sans">Login ID:</strong> <span className="text-purple-300 font-bold">{createdCredentials.loginId}</span></p>
                <p><strong className="text-zinc-400 font-sans">Password:</strong> <span className="text-amber-300 font-bold">{createdCredentials.initialPassword}</span></p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 text-xs transition cursor-pointer"
              >
                {copied ? "Copied to Clipboard!" : "Copy Credentials"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedCredentials(null);
                  onClose();
                }}
                className="rounded-md border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="jane.smith@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                placeholder="+1 555-0199"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Position
                </label>
                <input
                  type="text"
                  required
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-semibold transition shadow-md cursor-pointer"
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
