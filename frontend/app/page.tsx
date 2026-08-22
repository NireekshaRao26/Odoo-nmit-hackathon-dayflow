"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserSession {
  id: string;
  employeeId: string;
  email: string;
  role: string;
}

/* ---------------------------------------------------------------------- */
/* Signature element: "The Day Ruler" — a horizontal time ledger that     */
/* reappears (in two variants) as the visual thread through the page.     */
/* Hours run 08:00–18:00 since that's the real shape of a workday.        */
/* ---------------------------------------------------------------------- */

interface RulerMark {
  pct: number; // 0-100 position along the ruler
  label: string;
  sub: string;
  color: string;
}

function DayRuler({
  marks,
  variant = "light",
}: {
  marks: RulerMark[];
  variant?: "light" | "dark";
}) {
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i); // 08..18
  const line = variant === "light" ? "rgba(242,240,232,0.08)" : "rgba(242,240,232,0.04)";
  const tick = variant === "light" ? "rgba(242,240,232,0.15)" : "rgba(242,240,232,0.08)";
  const label = variant === "light" ? "#686C66" : "rgba(242,240,232,0.5)";

  return (
    <div className="relative w-full pt-10 pb-2">
      {/* base rule */}
      <div className="relative h-px w-full" style={{ backgroundColor: line }}>
        {hours.map((h) => {
          const pct = ((h - 8) / 10) * 100;
          return (
            <div
              key={h}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
            >
              <div className="h-2 w-px" style={{ backgroundColor: tick }} />
              <span
                className="font-mono mt-1.5 text-[10px] tracking-wide"
                style={{ color: label }}
              >
                {String(h).padStart(2, "0")}
              </span>
            </div>
          );
        })}

        {/* annotated marks */}
        {marks.map((m, i) => (
          <div
            key={i}
            className="absolute -top-9 flex flex-col items-center"
            style={{ left: `${m.pct}%`, transform: "translateX(-50%)" }}
          >
            <span
              className="font-mono whitespace-nowrap text-[10px] font-medium mb-1"
              style={{ color: variant === "light" ? "#F2F0E8" : "#F2F0E8" }}
            >
              {m.label}
            </span>
            <span
              className="font-mono whitespace-nowrap text-[9px] mb-1.5"
              style={{ color: variant === "light" ? "#9B9D96" : "rgba(242,240,232,0.5)" }}
            >
              {m.sub}
            </span>
            <span
              className="relative flex h-2.5 w-2.5"
              style={{ marginTop: "1px" }}
            >
              <span
                className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ backgroundColor: m.color }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full ring-2"
                style={{
                  backgroundColor: m.color,
                  boxShadow: `0 0 0 2px ${variant === "light" ? "#1A211C" : "#141A16"}`,
                }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginIdOrEmail, setLoginIdOrEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if user is logged in via localStorage
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginIdOrEmail.trim() || !loginPassword) {
      setLoginError("Please enter your Login ID / Email and password.");
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
            loginIdOrEmail: loginIdOrEmail.trim(),
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
      setLoginIdOrEmail("");
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

  const heroMarks: RulerMark[] = [
    { pct: 10.7, label: "09:04", sub: "Checked in", color: "#8FBF9F" },
    { pct: 45, label: "12d", sub: "Leave left", color: "#D6AA5C" },
    { pct: 90, label: "Payroll", sub: "Available", color: "#D6AA5C" },
  ];

  const stepMarks: RulerMark[] = [
    { pct: 5, label: "Sign in", sub: "09:00", color: "#D6AA5C" },
    { pct: 38, label: "Manage", sub: "12:00", color: "#D6AA5C" },
    { pct: 68, label: "Review", sub: "15:00", color: "#D6AA5C" },
    { pct: 95, label: "Sync", sub: "18:00", color: "#D6AA5C" },
  ];

  const features = [
    {
      tag: "PROFILES",
      title: "Employee Management",
      desc: "Centralized profiles for all team members. Keep track of personal info, documents, and roles easily.",
    },
    {
      tag: "TRACK",
      title: "Attendance Tracking",
      desc: "Seamlessly log check-ins and check-outs. HR gets a bird's-eye view of daily presence and working hours.",
    },
    {
      tag: "APPROVE",
      title: "Leave & Time-Off",
      desc: "Employees can request days off effortlessly while balances update automatically upon HR approval.",
    },
    {
      tag: "PAYROLL",
      title: "Payroll Visibility",
      desc: "Securely store salary structures and allow employees to view their compensation breakdowns with ease.",
    },
    {
      tag: "ACCESS",
      title: "Role-Based Guarding",
      desc: "Profiles strictly categorized into employee and hr with constraints verified directly at the database level.",
    },
    {
      tag: "SECURE",
      title: "Secure Auth",
      desc: "Passwords managed and encrypted safely using Supabase. Never exposed to frontends or client apps.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0F0E] text-[#F2F0E8] font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
        .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .font-body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(242,240,232,0.08)] bg-[rgba(13,15,14,0.88)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8FBF9F] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8FBF9F]" />
            </span>
            <span className="font-mono text-[15px] font-semibold tracking-[0.08em] text-[#F2F0E8]">
              DAYFLOW
            </span>
            <span className="hidden sm:inline font-mono text-[10px] tracking-widest text-[#686C66] border-l border-[rgba(242,240,232,0.08)] pl-2.5 ml-0.5">
              WORKFORCE LEDGER
            </span>
          </div>

          <nav className="flex items-center space-x-3 sm:space-x-5">
            {currentUser ? (
              <>
                <span className="font-mono text-xs text-[#9B9D96] hidden md:inline-block">
                  {currentUser.email}
                </span>
                <Link
                  href="/dashboard"
                  className="rounded-md border-none bg-[#1A211C] px-4 py-2 text-xs font-mono font-semibold tracking-wide text-[#9B9D96] hover:bg-[#222B25] hover:text-[#8FBF9F] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBF9F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F0E]"
                >
                  DASHBOARD
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-mono font-semibold tracking-wide text-[#D98282] hover:text-[#e49b9b] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D98282] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F0E] rounded"
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-xs font-mono font-semibold tracking-wide text-[#9B9D96] hover:text-[#F2F0E8] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBF9F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F0E] rounded px-1"
                >
                  SIGN IN
                </button>
                <Link
                  href="/signup"
                  className="rounded-md bg-[#3F6B4F] px-5 py-2.5 text-xs font-mono font-semibold tracking-wide text-[#F2F0E8] hover:bg-[#4D7D5E] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBF9F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F0E]"
                >
                  REGISTER
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-28">
        {/* HERO */}
        <section className="px-6 py-16 sm:py-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center font-mono text-[11px] tracking-[0.15em] text-[#686C66] border border-[rgba(242,240,232,0.08)] rounded-full px-3 py-1.5">
              DAYFLOW HRMS — VOL. 01
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.5rem] leading-[1.05] tracking-tight text-[#F2F0E8]">
              Your workday,
              <br />
              <span className="italic text-[#8FBF9F]">perfectly aligned.</span>
            </h1>

            <p className="text-lg text-[#9B9D96] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              A premium human resource management system designed to make employee
              tracking, attendance, leaves, and payroll feel effortless and clearly
              accounted for — like a ledger that keeps itself.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 pt-2">
              {currentUser ? (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 rounded-xl bg-[#3F6B4F] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] px-7 py-3.5 text-sm font-mono font-semibold tracking-wide text-[#F2F0E8] hover:bg-[#4D7D5E] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.2)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBF9F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F0E]"
                >
                  <span>ENTER DASHBOARD</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="flex items-center space-x-2 rounded-xl bg-[#3F6B4F] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] px-7 py-3.5 text-sm font-mono font-semibold tracking-wide text-[#F2F0E8] hover:bg-[#4D7D5E] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.2)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBF9F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F0E]"
                  >
                    <span>GET STARTED</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="rounded-xl bg-[#1A211C] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] px-7 py-3.5 text-sm font-mono font-semibold tracking-wide text-[#9B9D96] hover:text-[#8FBF9F] hover:bg-[#222B25] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.05)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBF9F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F0E]"
                  >
                    SIGN IN
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Day Ruler card */}
          <div className="w-full">
            <div className="rounded-2xl border-none bg-[#1A211C] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] p-8 pt-6">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] tracking-[0.15em] text-[#686C66]">
                  TODAY&apos;S LEDGER
                </span>
                <span className="font-mono text-[11px] tracking-[0.1em] text-[#8FBF9F] font-semibold">
                  96% ATTENDANCE
                </span>
              </div>

              <DayRuler marks={heroMarks} variant="light" />

              <div className="mt-8 pt-6 border-t border-[rgba(242,240,232,0.08)] flex items-center space-x-4">
                <div className="h-11 w-11 rounded-md bg-[#222B25] flex items-center justify-center flex-shrink-0 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.04)]">
                  <span className="font-mono text-sm font-semibold text-[#8FBF9F]">AJ</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold text-[#F2F0E8] truncate">
                    Alex Johnson
                  </h3>
                  <p className="font-mono text-[11px] text-[#686C66] truncate">
                    SENIOR PRODUCT DESIGNER
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full bg-[#8FBF9F]/10 text-[#8FBF9F] text-[10px] font-mono font-semibold tracking-wide">
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 py-24 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl mb-16">
            <span className="font-mono text-[11px] tracking-[0.15em] text-[#686C66]">
              WHAT&apos;S IN THE LEDGER
            </span>
            <h2 className="font-display text-3xl sm:text-4xl mt-3 text-[#F2F0E8]">
              Everything you need to manage your workforce
            </h2>
            <p className="text-[#9B9D96] mt-4 text-lg leading-relaxed">
              Six ledger entries, always in view. No feature buried, no balance
              unaccounted for.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#1A211C] p-8 shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] hover:-translate-y-1 transition-transform group"
              >
                <span className="font-mono text-[10px] tracking-[0.15em] text-[#D6AA5C] font-semibold">
                  {f.tag}
                </span>
                <h3 className="font-display text-xl mt-3 mb-2.5 text-[#F2F0E8] group-hover:text-[#8FBF9F] transition-colors">
                  {f.title}
                </h3>
                <p className="text-[#9B9D96] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS — dark ledger panel with the ruler reprised */}
        <section className="px-6 py-20 max-w-7xl mx-auto w-full">
          <div className="rounded-[32px] bg-[#141A16] px-8 py-14 sm:px-14 sm:py-16 shadow-[inset_0px_0px_40px_rgba(0,0,0,0.5)] border border-[rgba(242,240,232,0.04)]">
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] tracking-[0.15em] text-[#D6AA5C]">
                THE DAILY CYCLE
              </span>
              <h2 className="font-display text-3xl sm:text-4xl mt-3 text-[#F2F0E8]">
                How Dayflow works
              </h2>
              <p className="text-[#9B9D96] mt-3 text-lg">
                One ledger, read the same way by employees and HR — start to close,
                across a single working day.
              </p>
            </div>

            <div className="mt-16">
              <DayRuler marks={stepMarks} variant="dark" />
            </div>
          </div>
        </section>

        {/* EMPLOYEE VS HR */}
        <section className="px-6 py-24 max-w-6xl mx-auto w-full">
          <div className="max-w-2xl mb-16">
            <span className="font-mono text-[11px] tracking-[0.15em] text-[#686C66]">
              TWO STAMPS, ONE LEDGER
            </span>
            <h2 className="font-display text-3xl sm:text-4xl mt-3 text-[#F2F0E8]">
              One platform, two distinct experiences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Employee */}
            <div className="rounded-3xl bg-[#1A211C] p-10 relative overflow-hidden shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] border border-[rgba(242,240,232,0.04)]">
              <div className="inline-flex items-center rounded-full border-2 border-dashed border-[#8FBF9F]/30 px-4 py-1.5 -rotate-2 mb-7">
                <span className="font-mono text-xs font-semibold tracking-[0.1em] text-[#8FBF9F]">
                  EMPLOYEE ACCESS
                </span>
              </div>
              <h3 className="font-display text-2xl mb-6 text-[#F2F0E8] leading-snug">
                Focus on your work.
                <br />
                We&apos;ll handle the rest.
              </h3>
              <ul className="space-y-4">
                {[
                  "Personal profile management",
                  "Daily attendance logging",
                  "Leave request submissions",
                  "Salary & document visibility",
                ].map((feat, i) => (
                  <li key={i} className="flex items-center text-[#9B9D96]">
                    <svg className="w-4 h-4 text-[#8FBF9F] mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* HR */}
            <div className="rounded-3xl bg-[#1A211C] p-10 relative overflow-hidden shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] border border-[rgba(242,240,232,0.04)]">
              <div className="inline-flex items-center rounded-full border-2 border-dashed border-[#D6AA5C]/30 px-4 py-1.5 rotate-2 mb-7">
                <span className="font-mono text-xs font-semibold tracking-[0.1em] text-[#D6AA5C]">
                  HR &amp; ADMIN ACCESS
                </span>
              </div>
              <h3 className="font-display text-2xl mb-6 text-[#F2F0E8] leading-snug">
                Maintain control.
                <br />
                Empower your team.
              </h3>
              <ul className="space-y-4">
                {[
                  "Company-wide employee directory",
                  "Attendance & shift oversight",
                  "One-click leave approvals",
                  "Payroll & compliance controls",
                ].map((feat, i) => (
                  <li key={i} className="flex items-center text-[#9B9D96]">
                    <svg className="w-4 h-4 text-[#D6AA5C] mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 py-16 max-w-5xl mx-auto w-full">
          <div className="rounded-[32px] bg-[#141A16] px-8 py-16 sm:px-16 sm:py-20 text-center shadow-[inset_0px_0px_40px_rgba(0,0,0,0.5)] border border-[rgba(242,240,232,0.04)]">
            <span className="font-mono text-[11px] tracking-[0.15em] text-[#D6AA5C]">
              CLOSE THE LEDGER
            </span>
            <h2 className="font-display text-3xl sm:text-5xl mt-4 mb-6 text-[#F2F0E8] tracking-tight">
              Ready to streamline your HR?
            </h2>
            <p className="text-lg text-[#9B9D96] mb-10 max-w-2xl mx-auto">
              Join the future of workspace management. Clear-eyed, well-kept, and
              always accounted for.
            </p>
            <div className="flex justify-center">
              {currentUser ? (
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-[#D6AA5C] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] px-9 py-4 text-sm font-mono font-semibold tracking-wide text-[#0D0F0E] hover:bg-[#E2BB72] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer border-none"
                >
                  ENTER USER DASHBOARD
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#D6AA5C] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] px-9 py-4 text-sm font-mono font-semibold tracking-wide text-[#0D0F0E] hover:bg-[#E2BB72] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3)] transition-all cursor-pointer border-none"
                >
                  CREATE YOUR FREE ACCOUNT
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(242,240,232,0.08)] py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8FBF9F]" />
            <span className="font-mono text-sm font-semibold tracking-[0.08em] text-[#F2F0E8]">
              DAYFLOW
            </span>
          </div>
          <p className="font-mono text-xs text-[#686C66]">
            &copy; {new Date().getFullYear()} DAYFLOW HRMS PROJECT — ALL RIGHTS RESERVED
          </p>
          <div className="flex space-x-6 font-mono text-xs text-[#686C66]">
            <a href="#" className="hover:text-[#8FBF9F] transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-[#8FBF9F] transition-colors">TERMS</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000000]/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#1A211C] relative shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] border border-[rgba(242,240,232,0.04)]">
            {/* perforated edge */}
            <div
              className="h-3 w-full rounded-t-3xl"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(242,240,232,0.08) 0, rgba(242,240,232,0.08) 6px, transparent 6px, transparent 14px)",
                backgroundPosition: "top",
                backgroundSize: "100% 2px",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#222B25",
              }}
            />
            <div className="p-8 sm:p-10 border-t border-t-[rgba(242,240,232,0.08)] rounded-b-3xl">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute right-6 top-7 h-9 w-9 rounded-md text-[#686C66] hover:text-[#8FBF9F] hover:bg-[#222B25] flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBF9F]"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-8 mt-1">
                <span className="font-mono text-[11px] tracking-[0.15em] text-[#686C66]">
                  DAYFLOW — ID CARD
                </span>
                <h3 className="font-display text-3xl mt-2 text-[#F2F0E8]">Welcome back</h3>
                <p className="text-sm text-[#9B9D96] mt-1.5">Sign in to your account</p>
              </div>

              {loginError && (
                <div className="rounded-md bg-[#D98282]/10 border border-[#D98282]/30 p-4 text-sm font-medium text-[#D98282] mb-6">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block font-mono text-[10px] font-semibold text-[#686C66] tracking-[0.1em] mb-2">
                    LOGIN ID / EMAIL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OIJODO20260001 or name@company.com"
                    value={loginIdOrEmail}
                    onChange={(e) => setLoginIdOrEmail(e.target.value)}
                    className="w-full rounded-xl border-none shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] bg-[#141A16] px-4 py-3.5 text-sm font-medium text-[#F2F0E8] placeholder-[#686C66] focus:ring-2 focus:ring-[#8FBF9F] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-semibold text-[#686C66] tracking-[0.1em] mb-2">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showModalPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full rounded-xl border-none shadow-[inset_3px_3px_7px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.02)] bg-[#141A16] pl-4 pr-11 py-3.5 text-sm font-medium text-[#F2F0E8] placeholder-[#686C66] focus:ring-2 focus:ring-[#8FBF9F] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#686C66] hover:text-[#8FBF9F] transition-colors cursor-pointer"
                      aria-label={showModalPassword ? "Hide password" : "Show password"}
                    >
                      {showModalPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className={`w-full rounded-xl py-3.5 text-sm font-mono font-semibold tracking-wide transition-all flex items-center justify-center space-x-2 mt-2 border-none ${isLoggingIn
                    ? "bg-[#222B25] text-[#9B9D96] cursor-not-allowed"
                    : "bg-[#3F6B4F] text-[#F2F0E8] hover:bg-[#4D7D5E] shadow-[10px_10px_24px_rgba(0,0,0,0.45),-8px_-8px_20px_rgba(255,255,255,0.025),inset_2px_2px_5px_rgba(255,255,255,0.035)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)] cursor-pointer"
                    }`}
                >
                  {isLoggingIn ? (
                    <>
                      <svg className="motion-safe:animate-spin -ml-1 mr-1 h-4 w-4 text-[#9B9D96]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>SIGNING IN...</span>
                    </>
                  ) : (
                    <span>SIGN IN</span>
                  )}
                </button>
              </form>

              <div className="text-center text-sm text-[#9B9D96] pt-8 mt-6 border-t border-[rgba(242,240,232,0.08)]">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    window.location.href = "/signup";
                  }}
                  className="text-[#8FBF9F] hover:text-[#B7F397] font-semibold transition-colors cursor-pointer"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}