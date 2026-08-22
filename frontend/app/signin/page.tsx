"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [loginIdOrEmail, setLoginIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginIdOrEmail.trim() || !password) {
      setErrorMsg("Please enter your Login ID / Email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loginIdOrEmail: loginIdOrEmail.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid Login ID / Email or password.");
      }

      if (data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      }

      // Check if user needs password change on first login
      if (data.user?.must_change_password) {
        // We will store session and redirect to dashboard, which will open the change password modal
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0F0E] px-4 py-16 text-[#F2F0E8] font-sans selection:bg-[#3F6B4F] selection:text-white">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight uppercase tracking-widest text-[#F2F0E8]">
            Human Resource Management System
          </h2>
          <p className="mt-2 text-xs text-[#686C66] uppercase tracking-wider">
            Workspace Authentication Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#1A211C] border border-[rgba(242,240,232,0.04)] p-8 rounded-3xl shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] space-y-6">
          
          {/* Logo Placeholder */}
          <div className="flex justify-center pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3F6B4F]/10 border border-[#8FBF9F]/20 text-[#8FBF9F]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-md bg-[#D98282]/10 border border-[#D98282]/30 p-4 text-xs text-[#D98282] flex items-start space-x-2">
              <svg className="h-4.5 w-4.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Login ID / Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-id-email" className="block text-xs font-semibold text-[#686C66] uppercase tracking-wider">
                Login ID / Email
              </label>
              <input
                id="login-id-email"
                type="text"
                required
                placeholder="Enter your Login ID or Email"
                value={loginIdOrEmail}
                onChange={(e) => setLoginIdOrEmail(e.target.value)}
                className="w-full rounded-xl border-none shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] bg-[#141A16] px-4.5 py-3.5 text-sm text-[#F2F0E8] placeholder-[#686C66] transition focus:ring-2 focus:ring-[#8FBF9F] focus:outline-none"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-[#686C66] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-none shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] bg-[#141A16] pl-4.5 pr-11 py-3.5 text-sm text-[#F2F0E8] placeholder-[#686C66] transition focus:ring-2 focus:ring-[#8FBF9F] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#686C66] hover:text-[#8FBF9F] transition focus:outline-none cursor-pointer"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-xl py-3.5 text-sm font-semibold text-[#F2F0E8] transition-all duration-150 flex items-center justify-center space-x-2 border-none ${
                isLoading
                  ? "bg-[#222B25] text-[#9B9D96] cursor-not-allowed"
                  : "bg-[#3F6B4F] hover:bg-[#4D7D5E] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8FBF9F]"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#9B9D96]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>SIGN IN</span>
              )}
            </button>
          </form>

          {/* Footer Link to Sign Up */}
          <div className="text-center text-xs text-[#9B9D96] pt-2">
            Don&apos;t have an Account?{" "}
            <Link
              href="/signup"
              className="text-[#8FBF9F] font-semibold hover:text-[#B7F397] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
