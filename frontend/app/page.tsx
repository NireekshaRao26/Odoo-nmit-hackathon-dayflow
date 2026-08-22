"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface UserSession {
  id: string;
  employeeId: string;
  email: string;
  role: string;
}

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if user is logged in via localStorage
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: loginEmail.trim(),
            password: loginPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      // Save user to localStorage to simulate logged-in session
      if (data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        setCurrentUser(data.user);
      }

      setShowLoginModal(false);
      // Clear inputs
      setLoginEmail("");
      setLoginPassword("");
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 font-sans relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-10 sticky top-0">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/10">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Dayflow</span>
          </div>

          <nav className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-xs text-zinc-400 hidden sm:inline-block">
                  Logged in as <strong className="text-zinc-200">{currentUser.email}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 text-xs font-semibold hover:bg-rose-500/20 transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:from-indigo-600 hover:to-violet-700 shadow-md shadow-indigo-500/10 transition cursor-pointer"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Hero & Actions */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 z-10">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-500/5 px-3 py-1 text-xs text-indigo-400">
            <span>✨ Dayflow HRMS v1.0 Sign Up is Active</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">
            Simplify Workspace Management with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dayflow
            </span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Register your Employee profile or coordinate operations as HR. Experience a human
            resource management system crafted with exceptional security, role management, and sleek interfaces.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            {currentUser ? (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-4 text-sm font-semibold text-white hover:from-indigo-600 hover:to-violet-700 shadow-xl shadow-indigo-500/10 transition active:scale-[0.98] cursor-pointer"
              >
                <span>Enter User Dashboard</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-4 text-sm font-semibold text-white hover:from-indigo-600 hover:to-violet-700 shadow-xl shadow-indigo-500/10 transition active:scale-[0.98] cursor-pointer"
                >
                  <span>Get Started / Sign Up</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </Link>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-8 py-4 text-sm font-semibold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/30 transition active:scale-[0.98] cursor-pointer"
                >
                  Sign In (Existing Accounts)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24">
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Supabase Authentication</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Passwords managed and encrypted safely using Supabase Auth. Never exposed to frontends or client apps.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Role-Based Guarding</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Profiles strictly categorized into `employee` and `hr` with constraints verified at the database level.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-6 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Express API Verification</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Strict endpoint checks validating Employee IDs, password criteria, emails, and roles server-side.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 z-10 bg-zinc-950/60 mt-auto">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Dayflow HRMS Project. All rights reserved.
          </p>
          <div className="flex space-x-6 text-xs text-zinc-400">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Mock Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-white">Sign In</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your credentials to access the simulated session
              </p>
            </div>

            {loginError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2 ${
                  isLoggingIn
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750"
                }`}
              >
                {isLoggingIn ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-zinc-500 border-t border-zinc-800/80 pt-4">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  window.location.href = "/signup";
                }}
                className="text-indigo-400 hover:underline cursor-pointer"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
