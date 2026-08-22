"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Logo upload validation
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, WebP, SVG).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds the 5MB limit.");
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
    setSuccessMsg("");

    // Validations
    if (!companyName.trim()) {
      setErrorMsg("Company Name is required.");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Name is required.");
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

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passRegex.test(password)) {
      setErrorMsg("Password must contain uppercase, lowercase, digit, and special character.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

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
            companyLogo,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up.");
      }

      setSuccessMsg("Registration successful! Redirecting to Sign In...");
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during sign up.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100 font-sans selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-lg space-y-8">
        
        {/* Header Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase tracking-widest text-zinc-300">
            Human Resource Management System
          </h2>
          <p className="mt-2 text-xs text-zinc-500 uppercase tracking-wider">
            Register Company and HR Account
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-md shadow-lg space-y-6">
          
          {errorMsg && (
            <div className="rounded-md bg-red-950/30 border border-red-900/50 p-4 text-xs text-red-400 flex items-start space-x-2">
              <svg className="h-4.5 w-4.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-md bg-emerald-950/30 border border-emerald-900/50 p-4 text-xs text-emerald-400 flex items-start space-x-2">
              <svg className="h-4.5 w-4.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Logo Upload control */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Company Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden">
                  {companyLogoPreview ? (
                    <img src={companyLogoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
                  ) : (
                    <svg className="h-6 w-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center w-full h-14 rounded-md border border-dashed border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950 hover:border-purple-500/50 cursor-pointer transition-all">
                    <span className="text-xs text-zinc-400 font-semibold flex items-center space-x-1.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>{companyLogoPreview ? "Change Logo" : "Upload Logo"}</span>
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-0.5">Max size 5MB (PNG, JPG, WebP)</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <label htmlFor="company-name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                required
                placeholder="e.g. Odoo India"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4.5 py-3 text-sm text-white placeholder-zinc-600 transition focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* HR Manager Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                HR Manager Name *
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4.5 py-3 text-sm text-white placeholder-zinc-600 transition focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 transition focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 transition focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 pl-4 pr-11 py-2.5 text-sm text-white placeholder-zinc-600 transition focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 pl-4 pr-11 py-2.5 text-sm text-white placeholder-zinc-600 transition focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              disabled={isLoading}
              className={`w-full rounded-md py-3 text-sm font-semibold text-white shadow-md transition-all duration-150 cursor-pointer flex items-center justify-center space-x-2 ${
                isLoading
                  ? "bg-zinc-800 text-zinc-500 border border-zinc-750 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:outline-none"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Registering Company...</span>
                </>
              ) : (
                <span>SIGN UP</span>
              )}
            </button>
          </form>

          {/* Footer Link to Sign In */}
          <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-800/80 pt-4">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
