"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  // Form Field States
  const [companyName, setCompanyName] = useState("Odoo India");
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string>("");
  const [employeeName, setEmployeeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"employee" | "hr">("employee");

  // Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{
    loginId: string;
    initialPassword: string;
    email: string;
    fullName: string;
    companyName: string;
  } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Check current user session for HR authorization check
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUserRole(u.role || null);
      } catch (e) {}
    }
  }, []);

  // Password strength checklist states
  const [strengthChecklist, setStrengthChecklist] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasDigit: false,
    hasSpecial: false,
  });

  useEffect(() => {
    setStrengthChecklist({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasDigit: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const isPasswordStrong =
    password.length === 0 ||
    (strengthChecklist.minLength &&
      strengthChecklist.hasUpper &&
      strengthChecklist.hasLower &&
      strengthChecklist.hasDigit &&
      strengthChecklist.hasSpecial);

  // Handle Logo Upload File Selection
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, WebP, SVG, or GIF).");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds the 5MB limit. Please select a smaller image.");
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCompanyLogo(result);
      setCompanyLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validations
    if (!companyName.trim()) {
      setErrorMsg("Company Name is required.");
      return;
    }

    if (!employeeName.trim()) {
      setErrorMsg("Employee/User Name is required.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!phone.trim()) {
      setErrorMsg("Phone number is required.");
      return;
    }

    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{6,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      setErrorMsg("Please enter a valid phone number format.");
      return;
    }

    if (password && !isPasswordStrong) {
      setErrorMsg("Please ensure your password meets all strength criteria.");
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: companyName.trim(),
            companyLogo: companyLogo,
            fullName: employeeName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: password || undefined,
            role: role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create employee account. Please try again.");
      }

      if (data.credentials) {
        setCreatedCredentials(data.credentials);
      } else {
        router.push("/signin");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register employee. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!createdCredentials) return;
    const textToCopy = `Dayflow Employee Credentials:\nCompany: ${createdCredentials.companyName}\nName: ${createdCredentials.fullName}\nLogin ID: ${createdCredentials.loginId}\nInitial Password: ${createdCredentials.initialPassword}\nEmail: ${createdCredentials.email}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl z-10">
        {/* Header / Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center space-x-3 mb-3 group">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <span className="text-xl font-bold text-white">D</span>
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Dayflow HRMS
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            HR / Admin Employee Account Creation Flow
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300 hover:border-zinc-700">
          {/* Authorization Warning for non-HR users */}
          {currentUserRole === "employee" && (
            <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-400 flex items-start space-x-3">
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong className="block font-semibold mb-1">HR / Admin Feature</strong>
                You are currently logged in as a normal Employee. Standard employees cannot create user accounts. Please sign in as HR to register employees.
              </div>
            </div>
          )}

          {/* Success State: Display Generated Credentials */}
          {createdCredentials ? (
            <div className="py-4 space-y-6">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4 ring-1 ring-emerald-500/20">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Employee Created Successfully</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  System has automatically generated the employee credentials below.
                </p>
              </div>

              {/* Generated Credential Box */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                  <span className="text-xs text-zinc-400 font-medium">Employee Name</span>
                  <span className="text-sm font-semibold text-white">{createdCredentials.fullName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                  <span className="text-xs text-zinc-400 font-medium">Company Name</span>
                  <span className="text-sm font-semibold text-white">{createdCredentials.companyName}</span>
                </div>

                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                  <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider">
                    Generated Login ID
                  </span>
                  <span className="font-mono text-base font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/30">
                    {createdCredentials.loginId}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                  <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider">
                    Initial Password
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                    {createdCredentials.initialPassword}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">Email Address</span>
                  <span className="text-sm font-medium text-zinc-300">{createdCredentials.email}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={copyCredentialsToClipboard}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{copiedToast ? "Copied to Clipboard!" : "Copy Generated Credentials"}</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCredentials(null);
                      setEmployeeName("");
                      setEmail("");
                      setPhone("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-semibold text-zinc-300 hover:border-zinc-700 transition cursor-pointer"
                  >
                    + Add Another Employee
                  </button>

                  <Link
                    href="/signin"
                    className="flex items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition cursor-pointer"
                  >
                    Proceed to Sign In &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Banner */}
              {errorMsg && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 flex items-start space-x-3">
                  <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login ID Generator Notice */}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-start space-x-3 text-xs text-indigo-300">
                <svg className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold text-white">Automatic Login ID Generation</span>
                  <p className="mt-0.5 text-zinc-400">
                    The Login ID is automatically computed format: <code className="text-indigo-300 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800">[CompanyCode][Initials][Year][Serial]</code> (e.g. <span className="text-indigo-400 font-mono">OIJODO20260001</span>). Manual entry is disabled.
                  </p>
                </div>
              </div>

              {/* Role Picker (Employee / HR) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("employee")}
                    className={`flex items-center justify-center rounded-xl border p-3 text-sm font-medium transition cursor-pointer ${
                      role === "employee"
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-md shadow-indigo-500/5"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("hr")}
                    className={`flex items-center justify-center rounded-xl border p-3 text-sm font-medium transition cursor-pointer ${
                      role === "hr"
                        ? "border-violet-500 bg-violet-500/10 text-violet-400 shadow-md shadow-violet-500/5"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    HR Manager / Admin
                  </button>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="company-name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Company Name *
                </label>
                <input
                  id="company-name"
                  type="text"
                  required
                  placeholder="e.g. Odoo India"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Company Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Company Logo Upload
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                    {companyLogoPreview ? (
                      <img src={companyLogoPreview} alt="Company Logo Preview" className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-14 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 hover:bg-zinc-950 hover:border-indigo-500/50 cursor-pointer transition">
                      <span className="text-xs text-zinc-400 font-medium">
                        {companyLogoPreview ? "Change Logo Image" : "Upload Company Logo (PNG, JPG, WebP)"}
                      </span>
                      <span className="text-[10px] text-zinc-600 mt-0.5">Max size 5MB</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Employee / User Name */}
              <div>
                <label htmlFor="employee-name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Employee Name *
                </label>
                <input
                  id="employee-name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Initial Password (Optional)
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Auto-generated if empty"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-4 pr-10 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-4 pr-10 py-3 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 ${
                  isSubmitting
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 shadow-indigo-500/10 active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating Credentials & Creating Employee...</span>
                  </>
                ) : (
                  <span>Create Employee & Generate Credentials</span>
                )}
              </button>

              {/* Link to Sign In */}
              <div className="text-center text-xs text-zinc-400 border-t border-zinc-800/80 pt-5">
                Already have an account?{" "}
                <Link href="/signin" className="text-indigo-400 font-semibold hover:underline cursor-pointer">
                  Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
