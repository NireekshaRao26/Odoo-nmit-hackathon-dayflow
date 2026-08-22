"use client";

import React, { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserProfileViewProps {
  employeeId: string; // The target employee's employee_id (e.g. ODALDE...)
  viewerId: string; // Current user ID
  viewerRole: string; // Current user role
  onClose: () => void;
}

interface ProfileData {
  id: string;
  employee_id: string;
  role: string;
  email: string;
  full_name: string;
  department: string;
  phone: string;
  position: string;
  avatar_url: string;
  company_name: string;
  joining_year: number;
  manager: string;
  location: string;
  about: string;
  job_love: string;
  interests: string;
  skills: string[];
  certifications: string[];
  must_change_password?: boolean;
}

interface PrivateInfoData {
  dob: string;
  address: string;
  nationality: string;
  personal_email: string;
  gender: string;
  marital_status: string;
  joining_date: string;
  bank_name: string;
  bank_account: string;
  ifsc_code: string;
  pan_number: string;
  uan_number: string;
  employee_code: string;
}

interface SalaryInfoData {
  wage_type: string;
  monthly_wage: number;
  yearly_wage: number;
  working_days_per_week: number;
  break_hours: number;
  pf_employee_rate: number;
  pf_employer_rate: number;
  professional_tax: number;
  basic_salary_type: string;
  basic_salary_value: number;
  hra_type: string;
  hra_value: number;
  standard_allowance_type: string;
  standard_allowance_value: number;
  performance_bonus_type: string;
  performance_bonus_value: number;
  leave_travel_allowance_type: string;
  leave_travel_allowance_value: number;
  fixed_allowance_type: string;
  fixed_allowance_value: number;
}

type TabType = "resume" | "private" | "salary" | "security";

export default function UserProfileView({
  employeeId,
  viewerId,
  viewerRole,
  onClose,
}: UserProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("resume");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Profile data state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editProfileForm, setEditProfileForm] = useState<Partial<ProfileData>>({});
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);
  
  // Private Info data state
  const [privateInfo, setPrivateInfo] = useState<PrivateInfoData | null>(null);
  const [editPrivateForm, setEditPrivateForm] = useState<Partial<PrivateInfoData>>({});
  const [isEditingPrivate, setIsEditingPrivate] = useState(false);
  
  // Salary Info data state
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfoData | null>(null);
  const [editSalaryForm, setEditSalaryForm] = useState<Partial<SalaryInfoData>>({});
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState("");

  // Resume Helpers
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");

  // Security tab states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPasswordToggle, setShowNewPasswordToggle] = useState(false);
  const [secError, setSecError] = useState("");

  const isHr = viewerRole === "hr";
  const isOwner = profile?.id === viewerId;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch all user profile information
  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      const profRes = await fetch(`${API_BASE}/api/profile?employeeId=${employeeId}`);
      if (!profRes.ok) throw new Error("Failed to load profile.");
      const pData = await profRes.json();
      const p = pData.profile as ProfileData;
      setProfile(p);
      setEditProfileForm(p);

      // 2. Fetch Private Info (Owner or HR only)
      if (p.id === viewerId || isHr) {
        const privRes = await fetch(`${API_BASE}/api/profile/private?userId=${p.id}&requesterId=${viewerId}`);
        if (privRes.ok) {
          const privData = await privRes.json();
          setPrivateInfo(privData.privateInfo);
          setEditPrivateForm(privData.privateInfo);
        }
      }

      // 3. Fetch Salary Info (HR only)
      if (isHr) {
        const salRes = await fetch(`${API_BASE}/api/profile/salary?userId=${p.id}&requesterId=${viewerId}`);
        if (salRes.ok) {
          const salData = await salRes.json();
          setSalaryInfo(salData.salaryInfo);
          setEditSalaryForm(salData.salaryInfo);
        }
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load employee details.");
    } finally {
      setLoading(false);
    }
  }, [employeeId, viewerId, isHr]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Handle Header details update (HR only)
  const handleSaveHeader = async () => {
    if (!profile) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          full_name: editProfileForm.full_name,
          position: editProfileForm.position,
          department: editProfileForm.department,
          phone: editProfileForm.phone,
          manager: editProfileForm.manager,
          location: editProfileForm.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update header details");

      setProfile(data.profile);
      setIsEditingHeader(false);
      showToast("Profile header updated successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to save profile changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Resume details update
  const handleSaveResume = async () => {
    if (!profile) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          about: editProfileForm.about,
          job_love: editProfileForm.job_love,
          interests: editProfileForm.interests,
          skills: editProfileForm.skills,
          certifications: editProfileForm.certifications,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update resume details");

      setProfile(data.profile);
      setIsEditingResume(false);
      showToast("Resume details updated successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to save resume changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Add a skill tag locally
  const handleAddSkill = () => {
    if (!newSkill.trim() || !editProfileForm.skills) return;
    if (editProfileForm.skills.includes(newSkill.trim())) return;
    setEditProfileForm({
      ...editProfileForm,
      skills: [...editProfileForm.skills, newSkill.trim()],
    });
    setNewSkill("");
  };

  // Remove skill tag locally
  const handleRemoveSkill = (skill: string) => {
    if (!editProfileForm.skills) return;
    setEditProfileForm({
      ...editProfileForm,
      skills: editProfileForm.skills.filter((s) => s !== skill),
    });
  };

  // Add certification locally
  const handleAddCert = () => {
    if (!newCert.trim() || !editProfileForm.certifications) return;
    if (editProfileForm.certifications.includes(newCert.trim())) return;
    setEditProfileForm({
      ...editProfileForm,
      certifications: [...editProfileForm.certifications, newCert.trim()],
    });
    setNewCert("");
  };

  // Remove certification locally
  const handleRemoveCert = (cert: string) => {
    if (!editProfileForm.certifications) return;
    setEditProfileForm({
      ...editProfileForm,
      certifications: editProfileForm.certifications.filter((c) => c !== cert),
    });
  };

  // Handle Private info update
  const handleSavePrivate = async () => {
    if (!profile) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/private/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          requesterId: viewerId,
          ...editPrivateForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update private info");

      setPrivateInfo(data.privateInfo);
      setIsEditingPrivate(false);
      showToast("Private information updated successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to save private info.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Change Password Form
  const handleSecurityChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecError("");

    if (!newPassword || !confirmPassword) {
      setSecError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecError("Passwords do not match.");
      return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passRegex.test(newPassword)) {
      setSecError("Password must be at least 8 characters, containing uppercase, lowercase, digit, and special character.");
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: viewerId,
          email: userEmail(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      showToast("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setSecError(err.message || "Failed to update password.");
    } finally {
      setSaveLoading(false);
    }
  };

  const userEmail = () => {
    if (profile?.id === viewerId) return profile.email;
    return "";
  };

  // ------------------------------------------------------------------------
  // payroll / salary calculations
  // ------------------------------------------------------------------------
  const calculateComponentAmount = (
    type: string,
    val: number,
    monthlyWage: number,
    basicSalaryAmt: number
  ) => {
    if (type === "percentage") {
      // Basic Salary percentage is based on Monthly Wage
      // HRA and allowance percentages are based on Basic Salary
      return Number(((val * (basicSalaryAmt > 0 ? basicSalaryAmt : monthlyWage)) / 100).toFixed(2));
    }
    return Number(val.toFixed(2));
  };

  // Calculate current computed salary structures
  const getSalaryCalculations = (form: Partial<SalaryInfoData>) => {
    const monthlyWage = Number(form.monthly_wage || 0);
    
    // 1. Basic Salary
    const basicAmt = calculateComponentAmount(
      form.basic_salary_type || "percentage",
      Number(form.basic_salary_value || 0),
      monthlyWage,
      0
    );

    // 2. HRA (Percentage of Basic Salary)
    const hraAmt = calculateComponentAmount(
      form.hra_type || "percentage",
      Number(form.hra_value || 0),
      monthlyWage,
      basicAmt
    );

    // 3. Allowances (Percentage of Basic Salary)
    const stdAllowanceAmt = calculateComponentAmount(
      form.standard_allowance_type || "fixed",
      Number(form.standard_allowance_value || 0),
      monthlyWage,
      basicAmt
    );
    const bonusAmt = calculateComponentAmount(
      form.performance_bonus_type || "fixed",
      Number(form.performance_bonus_value || 0),
      monthlyWage,
      basicAmt
    );
    const ltaAmt = calculateComponentAmount(
      form.leave_travel_allowance_type || "fixed",
      Number(form.leave_travel_allowance_value || 0),
      monthlyWage,
      basicAmt
    );
    const fixedAmt = calculateComponentAmount(
      form.fixed_allowance_type || "fixed",
      Number(form.fixed_allowance_value || 0),
      monthlyWage,
      basicAmt
    );

    const totalCalculated = basicAmt + hraAmt + stdAllowanceAmt + bonusAmt + ltaAmt + fixedAmt;

    // PF Calculations (based on Basic Salary)
    const employeePf = Number(((basicAmt * Number(form.pf_employee_rate || 12)) / 100).toFixed(2));
    const employerPf = Number(((basicAmt * Number(form.pf_employer_rate || 12)) / 100).toFixed(2));

    return {
      basicAmt,
      hraAmt,
      stdAllowanceAmt,
      bonusAmt,
      ltaAmt,
      fixedAmt,
      totalCalculated,
      employeePf,
      employerPf,
    };
  };

  const calcs = editSalaryForm ? getSalaryCalculations(editSalaryForm) : null;

  // Handle Salary config update
  const handleSaveSalary = async () => {
    if (!profile || !calcs || !editSalaryForm) return;
    setSalaryError("");

    const monthlyWage = Number(editSalaryForm.monthly_wage || 0);

    // 12. Validate total components <= monthly wage
    if (calcs.totalCalculated > monthlyWage) {
      setSalaryError(
        `Total of salary components (₹${calcs.totalCalculated.toLocaleString()}) cannot exceed the monthly wage (₹${monthlyWage.toLocaleString()}). Difference: ₹${(
          calcs.totalCalculated - monthlyWage
        ).toLocaleString()}`
      );
      return;
    }

    setSaveLoading(true);
    try {
      const yearlyWage = monthlyWage * 12;
      const res = await fetch(`${API_BASE}/api/profile/salary/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          requesterId: viewerId,
          ...editSalaryForm,
          yearly_wage: yearlyWage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save salary settings");

      setSalaryInfo(data.salaryInfo);
      setEditSalaryForm(data.salaryInfo);
      setIsEditingSalary(false);
      showToast("Salary configurations updated successfully!");
    } catch (err: any) {
      setSalaryError(err.message || "Failed to update salary configuration.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#0D0F0E] text-[#9B9D96]">
        <div className="flex flex-col items-center space-y-3">
          <svg className="animate-spin h-7 w-7 text-[#8FBF9F]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">Loading Profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-[#686C66]">
        <p>Could not retrieve profile information.</p>
        <button onClick={onClose} className="mt-4 text-xs text-[#8FBF9F] underline">
          Return to Employees
        </button>
      </div>
    );
  }

  const avatarLetters = profile.full_name.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-[#3F6B4F] px-4 py-2.5 text-xs font-semibold text-[#F2F0E8] shadow-2xl transition animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Profile Header Details card */}
      <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 flex flex-col md:flex-row md:items-start md:space-x-6 gap-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-xs text-[#686C66] hover:text-[#F2F0E8] flex items-center space-x-1 cursor-pointer"
        >
          <span>✕ Close</span>
        </button>

        {/* Profile Picture */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="h-24 w-24 rounded-xl object-cover border border-[rgba(242,240,232,0.08)]"
            />
          ) : (
            <div className="h-24 w-24 rounded-xl bg-purple-950/40 border border-[#8FBF9F]/25 flex items-center justify-center font-bold text-[#8FBF9F] text-3xl">
              {avatarLetters}
            </div>
          )}
        </div>

        {/* Information Fields Column */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#F2F0E8] text-center md:text-left">
              {profile.full_name}
            </h1>
            <p className="text-sm text-[#9B9D96] text-center md:text-left mt-0.5">
              {profile.position} • {profile.department}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs text-[#9B9D96] border-t border-[rgba(242,240,232,0.04)] pt-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Login ID</span>
              <strong className="text-[#F2F0E8] mt-0.5 block font-mono">{profile.employee_id}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Email</span>
              <span className="text-[#F2F0E8] mt-0.5 block truncate">{profile.email}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Phone</span>
              <span className="text-[#F2F0E8] mt-0.5 block">{profile.phone || "Not Specified"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Company</span>
              <span className="text-[#F2F0E8] mt-0.5 block">{profile.company_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Manager</span>
              {isEditingHeader ? (
                <input
                  type="text"
                  value={editProfileForm.manager || ""}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, manager: e.target.value })}
                  placeholder="Manager name"
                  className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2 py-0.5 text-xs w-full mt-1 focus:outline-none focus:border-[#8FBF9F]"
                />
              ) : (
                <span className="text-[#F2F0E8] mt-0.5 block">{profile.manager || "Not Assigned"}</span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Location</span>
              {isEditingHeader ? (
                <input
                  type="text"
                  value={editProfileForm.location || ""}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, location: e.target.value })}
                  placeholder="Office Location"
                  className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2 py-0.5 text-xs w-full mt-1 focus:outline-none focus:border-[#8FBF9F]"
                />
              ) : (
                <span className="text-[#F2F0E8] mt-0.5 block">{profile.location || "Not Specified"}</span>
              )}
            </div>
          </div>

          {/* HR-only Header Controls */}
          {isHr && (
            <div className="pt-2 flex justify-center md:justify-start">
              {isEditingHeader ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveHeader}
                    disabled={saveLoading}
                    className="bg-[#3F6B4F] hover:bg-[#2F523C] text-[#F2F0E8] px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                  >
                    {saveLoading ? "Saving..." : "Save Details"}
                  </button>
                  <button
                    onClick={() => {
                      setEditProfileForm(profile);
                      setIsEditingHeader(false);
                    }}
                    className="bg-[#141A16] hover:bg-[#222B25] text-[#F2F0E8] px-3 py-1 rounded text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingHeader(true)}
                  className="text-xs text-[#8FBF9F] hover:text-[#8FBF9F] flex items-center space-x-1 cursor-pointer"
                >
                  <span>✏️ Edit Location & Manager</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex items-center space-x-2 border-b border-[rgba(242,240,232,0.08)] pb-px">
        <button
          onClick={() => setActiveTab("resume")}
          className={`px-4 py-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-px ${
            activeTab === "resume"
              ? "border-[#8FBF9F] text-[#8FBF9F]"
              : "border-transparent text-[#9B9D96] hover:text-[#F2F0E8]"
          }`}
        >
          Resume
        </button>

        <button
          onClick={() => setActiveTab("private")}
          className={`px-4 py-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-px ${
            activeTab === "private"
              ? "border-[#8FBF9F] text-[#8FBF9F]"
              : "border-transparent text-[#9B9D96] hover:text-[#F2F0E8]"
          }`}
        >
          Private Info
        </button>

        {isHr && (
          <button
            onClick={() => setActiveTab("salary")}
            className={`px-4 py-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-px ${
              activeTab === "salary"
                ? "border-[#8FBF9F] text-[#8FBF9F]"
                : "border-transparent text-[#9B9D96] hover:text-[#F2F0E8]"
            }`}
          >
            Salary Info (HR Only)
          </button>
        )}

        {isOwner && (
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-px ${
              activeTab === "security"
                ? "border-[#8FBF9F] text-[#8FBF9F]"
                : "border-transparent text-[#9B9D96] hover:text-[#F2F0E8]"
            }`}
          >
            Security
          </button>
        )}
      </div>

      {/* TAB CONTENT AREAS */}
      <div className="min-h-96">
        
        {/* RESUME TAB */}
        {activeTab === "resume" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: About, Job Love, Hobbies (2 Columns wide) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[rgba(242,240,232,0.04)] pb-3">
                  <h3 className="text-sm font-display font-bold text-[#F2F0E8] uppercase tracking-wider">Professional Bio</h3>
                  {(isOwner || isHr) && !isEditingResume && (
                    <button
                      onClick={() => setIsEditingResume(true)}
                      className="text-xs text-[#8FBF9F] hover:text-[#8FBF9F] cursor-pointer"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-[#9B9D96] uppercase tracking-wide text-[10px]">About Me</h4>
                    {isEditingResume ? (
                      <textarea
                        value={editProfileForm.about || ""}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, about: e.target.value })}
                        placeholder="Share a short bio..."
                        className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded p-2 text-xs w-full mt-2 focus:outline-none focus:border-[#8FBF9F] h-20 resize-none"
                      />
                    ) : (
                      <p className="text-[#F2F0E8] leading-relaxed mt-1.5 whitespace-pre-line">
                        {profile.about || "No information added yet."}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#9B9D96] uppercase tracking-wide text-[10px] mt-4">What I Love About My Job</h4>
                    {isEditingResume ? (
                      <textarea
                        value={editProfileForm.job_love || ""}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, job_love: e.target.value })}
                        placeholder="What drives you in your daily work?..."
                        className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded p-2 text-xs w-full mt-2 focus:outline-none focus:border-[#8FBF9F] h-20 resize-none"
                      />
                    ) : (
                      <p className="text-[#F2F0E8] leading-relaxed mt-1.5 whitespace-pre-line">
                        {profile.job_love || "No information added yet."}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#9B9D96] uppercase tracking-wide text-[10px] mt-4">Interests & Hobbies</h4>
                    {isEditingResume ? (
                      <textarea
                        value={editProfileForm.interests || ""}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, interests: e.target.value })}
                        placeholder="Reading, Chess, Football..."
                        className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded p-2 text-xs w-full mt-2 focus:outline-none focus:border-[#8FBF9F] h-20 resize-none"
                      />
                    ) : (
                      <p className="text-[#F2F0E8] leading-relaxed mt-1.5 whitespace-pre-line">
                        {profile.interests || "No information added yet."}
                      </p>
                    )}
                  </div>

                  {isEditingResume && (
                    <div className="pt-2 flex space-x-2">
                      <button
                        onClick={handleSaveResume}
                        disabled={saveLoading}
                        className="bg-[#3F6B4F] hover:bg-[#2F523C] text-[#F2F0E8] px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
                      >
                        {saveLoading ? "Saving..." : "Save Resume"}
                      </button>
                      <button
                        onClick={() => {
                          setEditProfileForm(profile);
                          setIsEditingResume(false);
                        }}
                        className="bg-[#141A16] hover:bg-[#222B25] text-[#F2F0E8] px-4 py-1.5 rounded text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Skills & Certifications (1 Column wide) */}
            <div className="space-y-6">
              
              {/* Skills section */}
              <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                <h3 className="text-sm font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[rgba(242,240,232,0.04)] pb-3">Skills</h3>
                
                {/* Skill Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {(editProfileForm.skills || []).length > 0 ? (
                    (editProfileForm.skills || []).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded bg-purple-950/30 px-2 py-0.5 text-xs font-semibold text-[#8FBF9F] border border-[#8FBF9F]/10"
                      >
                        {skill}
                        {isEditingResume && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 text-[#8FBF9F] hover:text-rose-400 font-bold focus:outline-none"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#686C66]">No skills listed yet.</span>
                  )}
                </div>

                {isEditingResume && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-[rgba(242,240,232,0.04)]">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add skill (e.g. React)"
                      className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full focus:outline-none focus:border-[#8FBF9F]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-[#141A16] hover:bg-[#222B25] text-[#F2F0E8] px-3 py-1 rounded text-xs cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Certifications section */}
              <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                <h3 className="text-sm font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[rgba(242,240,232,0.04)] pb-3">Certifications</h3>

                <div className="space-y-2.5">
                  {(editProfileForm.certifications || []).length > 0 ? (
                    (editProfileForm.certifications || []).map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs text-[#F2F0E8] bg-[#0D0F0E]/40 p-2.5 border border-[rgba(242,240,232,0.04)] rounded"
                      >
                        <span className="font-medium">{cert}</span>
                        {isEditingResume && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCert(cert)}
                            className="text-rose-500 hover:text-rose-400 font-bold ml-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-[#686C66] block">No certifications listed yet.</span>
                  )}
                </div>

                {isEditingResume && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-[rgba(242,240,232,0.04)]">
                    <input
                      type="text"
                      value={newCert}
                      onChange={(e) => setNewCert(e.target.value)}
                      placeholder="AWS, Scrum, Salesforce..."
                      className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full focus:outline-none focus:border-[#8FBF9F]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCert}
                      className="bg-[#141A16] hover:bg-[#222B25] text-[#F2F0E8] px-3 py-1 rounded text-xs cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* PRIVATE INFO TAB */}
        {activeTab === "private" && (
          <div className="space-y-6">
            
            {/* Header controls for HR edits */}
            {isHr && (
              <div className="flex justify-end">
                {isEditingPrivate ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSavePrivate}
                      disabled={saveLoading}
                      className="bg-[#3F6B4F] hover:bg-[#2F523C] text-[#F2F0E8] px-4 py-1.5 rounded text-xs font-semibold cursor-pointer shadow-md"
                    >
                      {saveLoading ? "Saving..." : "Save Private Info"}
                    </button>
                    <button
                      onClick={() => {
                        setEditPrivateForm(privateInfo || {});
                        setIsEditingPrivate(false);
                      }}
                      className="bg-[#141A16] hover:bg-[#222B25] text-[#F2F0E8] px-4 py-1.5 rounded text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingPrivate(true)}
                    className="bg-[#1A211C] border border-[rgba(242,240,232,0.08)] hover:bg-zinc-850 text-[#F2F0E8] font-semibold px-4 py-2 text-xs rounded-lg cursor-pointer transition shadow-md"
                  >
                    ✏️ Edit Private & Banking Info
                  </button>
                )}
              </div>
            )}

            {!privateInfo && !isEditingPrivate ? (
              <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-8 text-center text-[#686C66] text-xs">
                No private information has been configured for this employee yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Personal Information */}
                <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                  <h3 className="text-sm font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[rgba(242,240,232,0.04)] pb-3">Personal Details</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Date of Birth</span>
                      {isEditingPrivate ? (
                        <input
                          type="date"
                          value={editPrivateForm.dob || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, dob: e.target.value })}
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium">{privateInfo?.dob || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Nationality</span>
                      {isEditingPrivate ? (
                        <input
                          type="text"
                          value={editPrivateForm.nationality || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, nationality: e.target.value })}
                          placeholder="e.g. Indian"
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium">{privateInfo?.nationality || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-sans font-semibold">Gender</span>
                      {isEditingPrivate ? (
                        <select
                          value={editPrivateForm.gender || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, gender: e.target.value })}
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium">{privateInfo?.gender || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Marital Status</span>
                      {isEditingPrivate ? (
                        <select
                          value={editPrivateForm.marital_status || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, marital_status: e.target.value })}
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        >
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium">{privateInfo?.marital_status || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Date of Joining</span>
                      {isEditingPrivate ? (
                        <input
                          type="date"
                          value={editPrivateForm.joining_date || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, joining_date: e.target.value })}
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium">{privateInfo?.joining_date || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-semibold">Personal Email</span>
                      {isEditingPrivate ? (
                        <input
                          type="email"
                          value={editPrivateForm.personal_email || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, personal_email: e.target.value })}
                          placeholder="personal@email.com"
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium truncate">{privateInfo?.personal_email || "Not configured"}</span>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Residential Address</span>
                      {isEditingPrivate ? (
                        <input
                          type="text"
                          value={editPrivateForm.address || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, address: e.target.value })}
                          placeholder="123 Main St, Apartment 4B"
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium leading-relaxed">{privateInfo?.address || "Not configured"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Banking & Registration Info */}
                <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                  <h3 className="text-sm font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[rgba(242,240,232,0.04)] pb-3">Banking & Statutory Code</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-semibold">Bank Name</span>
                      {isEditingPrivate ? (
                        <input
                          type="text"
                          value={editPrivateForm.bank_name || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, bank_name: e.target.value })}
                          placeholder="HDFC Bank"
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium">{privateInfo?.bank_name || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-mono font-semibold">Account Number</span>
                      {isEditingPrivate ? (
                        <input
                          type="text"
                          value={editPrivateForm.bank_account || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, bank_account: e.target.value })}
                          placeholder="501000..."
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium font-mono">{privateInfo?.bank_account || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-mono font-semibold">IFSC Code</span>
                      {isEditingPrivate ? (
                        <input
                          type="text"
                          value={editPrivateForm.ifsc_code || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, ifsc_code: e.target.value })}
                          placeholder="HDFC0000..."
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium font-mono">{privateInfo?.ifsc_code || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-mono font-semibold">PAN Number</span>
                      {isEditingPrivate ? (
                        <input
                          type="text"
                          value={editPrivateForm.pan_number || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, pan_number: e.target.value })}
                          placeholder="ABCDE1234F"
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium font-mono">{privateInfo?.pan_number || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-mono font-semibold">UAN Number</span>
                      {isEditingPrivate ? (
                        <input
                          type="text"
                          value={editPrivateForm.uan_number || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, uan_number: e.target.value })}
                          placeholder="1005..."
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium font-mono">{privateInfo?.uan_number || "Not configured"}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-mono font-semibold">Employee Code</span>
                      {isEditingPrivate ? (
                        <input
                          type="text"
                          value={editPrivateForm.employee_code || ""}
                          onChange={(e) => setEditPrivateForm({ ...editPrivateForm, employee_code: e.target.value })}
                          placeholder="e.g. EC-123"
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-medium font-mono">{privateInfo?.employee_code || "Not configured"}</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* SALARY INFO TAB (HR ONLY) */}
        {activeTab === "salary" && isHr && (
          <div className="space-y-6">
            
            {/* Header controls for HR edits */}
            <div className="flex justify-between items-center pb-3 border-b border-[rgba(242,240,232,0.08)]">
              <div>
                <h3 className="text-sm font-display font-bold text-[#F2F0E8] uppercase tracking-wider">Payroll & Wage Configurations</h3>
                <p className="text-[11px] text-[#9B9D96] mt-0.5">Define wage types, working schedule, professional tax, and PF rates.</p>
              </div>

              {isEditingSalary ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveSalary}
                    disabled={saveLoading}
                    className="bg-[#3F6B4F] hover:bg-[#2F523C] text-[#F2F0E8] px-4 py-1.5 rounded text-xs font-semibold cursor-pointer shadow-md"
                  >
                    {saveLoading ? "Saving..." : "Save Salary Config"}
                  </button>
                  <button
                    onClick={() => {
                      setEditSalaryForm(salaryInfo || {});
                      setSalaryError("");
                      setIsEditingSalary(false);
                    }}
                    className="bg-[#141A16] hover:bg-[#222B25] text-[#F2F0E8] px-4 py-1.5 rounded text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingSalary(true)}
                  className="bg-[#1A211C] border border-[rgba(242,240,232,0.08)] hover:bg-zinc-850 text-[#F2F0E8] font-semibold px-4 py-2 text-xs rounded-lg cursor-pointer transition shadow-md"
                >
                  ✏️ Edit Payroll Configuration
                </button>
              )}
            </div>

            {salaryError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs font-medium text-rose-400">
                ⚠️ {salaryError}
              </div>
            )}

            {!salaryInfo && !isEditingSalary ? (
              <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-8 text-center text-[#686C66] text-xs">
                No salary configuration has been created for this employee yet. Click 'Edit Payroll Configuration' to configure.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left & Middle: Salary Config and Components (2 Cols wide) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Wage and Working Schedule */}
                  <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                    <h4 className="text-xs font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[rgba(242,240,232,0.04)] pb-2.5">Wage & Schedule</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Wage Type</span>
                        {isEditingSalary ? (
                          <input
                            type="text"
                            value={editSalaryForm.wage_type || ""}
                            onChange={(e) => setEditSalaryForm({ ...editSalaryForm, wage_type: e.target.value })}
                            className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                          />
                        ) : (
                          <span className="text-[#F2F0E8] mt-1 block font-medium">{salaryInfo?.wage_type}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-semibold">Monthly Wage</span>
                        {isEditingSalary ? (
                          <input
                            type="number"
                            value={editSalaryForm.monthly_wage || 0}
                            onChange={(e) => setEditSalaryForm({ ...editSalaryForm, monthly_wage: Number(e.target.value) })}
                            className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                          />
                        ) : (
                          <span className="text-[#F2F0E8] mt-1 block font-semibold text-[#8FBF9F]">
                            ₹{Number(salaryInfo?.monthly_wage).toLocaleString()} / month
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Yearly Wage (Calculated)</span>
                        <span className="text-[#9B9D96] mt-2 block font-medium">
                          ₹{Number((isEditingSalary ? editSalaryForm.monthly_wage || 0 : salaryInfo?.monthly_wage || 0) * 12).toLocaleString()} / year
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-semibold">Working Days / Week</span>
                        {isEditingSalary ? (
                          <input
                            type="number"
                            value={editSalaryForm.working_days_per_week || 5}
                            onChange={(e) => setEditSalaryForm({ ...editSalaryForm, working_days_per_week: Number(e.target.value) })}
                            className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                          />
                        ) : (
                          <span className="text-[#F2F0E8] mt-1 block font-medium">{salaryInfo?.working_days_per_week} days</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-semibold">Daily Break Time</span>
                        {isEditingSalary ? (
                          <input
                            type="number"
                            step="0.5"
                            value={editSalaryForm.break_hours || 1}
                            onChange={(e) => setEditSalaryForm({ ...editSalaryForm, break_hours: Number(e.target.value) })}
                            className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                          />
                        ) : (
                          <span className="text-[#F2F0E8] mt-1 block font-medium">{salaryInfo?.break_hours} hours</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 10. Salary Components Config */}
                  <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[rgba(242,240,232,0.04)] pb-2.5">
                      <h4 className="text-xs font-display font-bold text-[#F2F0E8] uppercase tracking-wider">Salary Components Breakup</h4>
                      {calcs && (
                        <span className="text-[11px] font-semibold text-[#9B9D96]">
                          Sum: <strong className="text-[#8FBF9F]">₹{calcs.totalCalculated.toLocaleString()}</strong> / ₹{Number(isEditingSalary ? editSalaryForm.monthly_wage || 0 : salaryInfo?.monthly_wage || 0).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Component Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-[#9B9D96] items-end">
                        {/* Headers */}
                        <div className="hidden sm:block text-[10px] uppercase text-[#686C66]">Component Name</div>
                        <div className="hidden sm:block text-[10px] uppercase text-[#686C66]">Calc Type & Value</div>
                        <div className="hidden sm:block text-[10px] uppercase text-[#686C66] text-right">Calculated Amount</div>

                        {/* Basic Salary */}
                        <div className="text-[#F2F0E8] font-bold self-center">1. Basic Salary</div>
                        <div>
                          {isEditingSalary ? (
                            <div className="flex space-x-1.5 items-center">
                              <select
                                value={editSalaryForm.basic_salary_type || "percentage"}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, basic_salary_type: e.target.value })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs focus:outline-none"
                              >
                                <option value="percentage">% of Wage</option>
                                <option value="fixed">Fixed Amt</option>
                              </select>
                              <input
                                type="number"
                                value={editSalaryForm.basic_salary_value || 0}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, basic_salary_value: Number(e.target.value) })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs w-20 text-right focus:outline-none focus:border-[#8FBF9F]"
                              />
                            </div>
                          ) : (
                            <span>{salaryInfo?.basic_salary_type === "percentage" ? `${salaryInfo.basic_salary_value}% of Wage` : `Fixed ₹${salaryInfo?.basic_salary_value}`}</span>
                          )}
                        </div>
                        <div className="text-right text-[#F2F0E8] font-mono">
                          ₹{calcs?.basicAmt.toLocaleString()}
                        </div>

                        {/* HRA */}
                        <div className="text-[#F2F0E8] font-bold self-center">2. House Rent Allowance (HRA)</div>
                        <div>
                          {isEditingSalary ? (
                            <div className="flex space-x-1.5 items-center">
                              <select
                                value={editSalaryForm.hra_type || "percentage"}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, hra_type: e.target.value })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs focus:outline-none"
                              >
                                <option value="percentage">% of Basic</option>
                                <option value="fixed">Fixed Amt</option>
                              </select>
                              <input
                                type="number"
                                value={editSalaryForm.hra_value || 0}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, hra_value: Number(e.target.value) })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs w-20 text-right focus:outline-none focus:border-[#8FBF9F]"
                              />
                            </div>
                          ) : (
                            <span>{salaryInfo?.hra_type === "percentage" ? `${salaryInfo.hra_value}% of Basic` : `Fixed ₹${salaryInfo?.hra_value}`}</span>
                          )}
                        </div>
                        <div className="text-right text-[#F2F0E8] font-mono">
                          ₹{calcs?.hraAmt.toLocaleString()}
                        </div>

                        {/* Standard Allowance */}
                        <div className="text-[#F2F0E8] font-medium self-center text-[#F2F0E8] font-semibold">3. Standard Allowance</div>
                        <div>
                          {isEditingSalary ? (
                            <div className="flex space-x-1.5 items-center">
                              <select
                                value={editSalaryForm.standard_allowance_type || "fixed"}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, standard_allowance_type: e.target.value })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs focus:outline-none"
                              >
                                <option value="fixed">Fixed Amt</option>
                                <option value="percentage">% of Basic</option>
                              </select>
                              <input
                                type="number"
                                value={editSalaryForm.standard_allowance_value || 0}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, standard_allowance_value: Number(e.target.value) })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs w-20 text-right focus:outline-none focus:border-[#8FBF9F]"
                              />
                            </div>
                          ) : (
                            <span>{salaryInfo?.standard_allowance_type === "percentage" ? `${salaryInfo.standard_allowance_value}% of Basic` : `Fixed ₹${salaryInfo?.standard_allowance_value}`}</span>
                          )}
                        </div>
                        <div className="text-right text-[#F2F0E8] font-mono">
                          ₹{calcs?.stdAllowanceAmt.toLocaleString()}
                        </div>

                        {/* Performance Bonus */}
                        <div className="text-[#F2F0E8] font-medium self-center text-[#F2F0E8] font-semibold">4. Performance Bonus</div>
                        <div>
                          {isEditingSalary ? (
                            <div className="flex space-x-1.5 items-center">
                              <select
                                value={editSalaryForm.performance_bonus_type || "fixed"}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, performance_bonus_type: e.target.value })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs focus:outline-none"
                              >
                                <option value="fixed">Fixed Amt</option>
                                <option value="percentage">% of Basic</option>
                              </select>
                              <input
                                type="number"
                                value={editSalaryForm.performance_bonus_value || 0}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, performance_bonus_value: Number(e.target.value) })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs w-20 text-right focus:outline-none focus:border-[#8FBF9F]"
                              />
                            </div>
                          ) : (
                            <span>{salaryInfo?.performance_bonus_type === "percentage" ? `${salaryInfo.performance_bonus_value}% of Basic` : `Fixed ₹${salaryInfo?.performance_bonus_value}`}</span>
                          )}
                        </div>
                        <div className="text-right text-[#F2F0E8] font-mono">
                          ₹{calcs?.bonusAmt.toLocaleString()}
                        </div>

                        {/* Leave Travel Allowance */}
                        <div className="text-[#F2F0E8] font-medium self-center text-[#F2F0E8] font-semibold">5. Leave Travel Allowance</div>
                        <div>
                          {isEditingSalary ? (
                            <div className="flex space-x-1.5 items-center">
                              <select
                                value={editSalaryForm.leave_travel_allowance_type || "fixed"}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, leave_travel_allowance_type: e.target.value })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs focus:outline-none"
                              >
                                <option value="fixed">Fixed Amt</option>
                                <option value="percentage">% of Basic</option>
                              </select>
                              <input
                                type="number"
                                value={editSalaryForm.leave_travel_allowance_value || 0}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, leave_travel_allowance_value: Number(e.target.value) })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs w-20 text-right focus:outline-none focus:border-[#8FBF9F]"
                              />
                            </div>
                          ) : (
                            <span>{salaryInfo?.leave_travel_allowance_type === "percentage" ? `${salaryInfo.leave_travel_allowance_value}% of Basic` : `Fixed ₹${salaryInfo?.leave_travel_allowance_value}`}</span>
                          )}
                        </div>
                        <div className="text-right text-[#F2F0E8] font-mono">
                          ₹{calcs?.ltaAmt.toLocaleString()}
                        </div>

                        {/* Fixed Allowance */}
                        <div className="text-[#F2F0E8] font-medium self-center text-[#F2F0E8] font-semibold">6. Fixed Allowance</div>
                        <div>
                          {isEditingSalary ? (
                            <div className="flex space-x-1.5 items-center">
                              <select
                                value={editSalaryForm.fixed_allowance_type || "fixed"}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, fixed_allowance_type: e.target.value })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs focus:outline-none"
                              >
                                <option value="fixed">Fixed Amt</option>
                                <option value="percentage">% of Basic</option>
                              </select>
                              <input
                                type="number"
                                value={editSalaryForm.fixed_allowance_value || 0}
                                onChange={(e) => setEditSalaryForm({ ...editSalaryForm, fixed_allowance_value: Number(e.target.value) })}
                                className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-1.5 py-0.5 text-xs w-20 text-right focus:outline-none focus:border-[#8FBF9F]"
                              />
                            </div>
                          ) : (
                            <span>{salaryInfo?.fixed_allowance_type === "percentage" ? `${salaryInfo.fixed_allowance_value}% of Basic` : `Fixed ₹${salaryInfo?.fixed_allowance_value}`}</span>
                          )}
                        </div>
                        <div className="text-right text-[#F2F0E8] font-mono">
                          ₹{calcs?.fixedAmt.toLocaleString()}
                        </div>

                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: PF, Tax and Final Summary Panel */}
                <div className="space-y-6">
                  
                  {/* PF Contributions */}
                  <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                    <h4 className="text-xs font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[rgba(242,240,232,0.04)] pb-2.5">Provident Fund (PF)</h4>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Employee PF Contribution (%)</span>
                        {isEditingSalary ? (
                          <input
                            type="number"
                            value={editSalaryForm.pf_employee_rate || 12}
                            onChange={(e) => setEditSalaryForm({ ...editSalaryForm, pf_employee_rate: Number(e.target.value) })}
                            className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                          />
                        ) : (
                          <span className="text-[#F2F0E8] mt-1 block font-medium">{salaryInfo?.pf_employee_rate}%</span>
                        )}
                        {calcs && (
                          <span className="text-[10px] text-[#9B9D96] mt-1 block">
                            Computed: <strong className="text-[#F2F0E8] font-mono">₹{calcs.employeePf.toLocaleString()} / month</strong>
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#686C66] block">Employer PF Contribution (%)</span>
                        {isEditingSalary ? (
                          <input
                            type="number"
                            value={editSalaryForm.pf_employer_rate || 12}
                            onChange={(e) => setEditSalaryForm({ ...editSalaryForm, pf_employer_rate: Number(e.target.value) })}
                            className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                          />
                        ) : (
                          <span className="text-[#F2F0E8] mt-1 block font-medium">{salaryInfo?.pf_employer_rate}%</span>
                        )}
                        {calcs && (
                          <span className="text-[10px] text-[#9B9D96] mt-1 block">
                            Computed: <strong className="text-[#F2F0E8] font-mono">₹{calcs.employerPf.toLocaleString()} / month</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Professional Tax */}
                  <div className="rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
                    <h4 className="text-xs font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[rgba(242,240,232,0.04)] pb-2.5">Professional Tax</h4>

                    <div className="text-xs">
                      <span className="text-[10px] uppercase font-semibold text-[#686C66] block font-semibold">Monthly Professional Tax</span>
                      {isEditingSalary ? (
                        <input
                          type="number"
                          value={editSalaryForm.professional_tax || 200}
                          onChange={(e) => setEditSalaryForm({ ...editSalaryForm, professional_tax: Number(e.target.value) })}
                          className="bg-[#0D0F0E] border border-[rgba(242,240,232,0.08)] text-[#F2F0E8] rounded px-2.5 py-1 text-xs w-full mt-1.5 focus:outline-none focus:border-[#8FBF9F]"
                        />
                      ) : (
                        <span className="text-[#F2F0E8] mt-1 block font-semibold text-rose-400 font-mono">
                          ₹{Number(salaryInfo?.professional_tax).toLocaleString()} / month
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 11. Salary Summary Box */}
                  <div className="rounded-3xl border border-[#3F6B4F]/20 bg-[#1A211C] p-6 space-y-3.5 shadow-md">
                    <h4 className="text-xs font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[#8FBF9F]/10 pb-2">Wage Summary</h4>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#9B9D96]">Total Monthly Wage:</span>
                        <span className="font-bold text-[#F2F0E8]">₹{Number(isEditingSalary ? editSalaryForm.monthly_wage || 0 : salaryInfo?.monthly_wage || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#9B9D96]">Calculated Components:</span>
                        <span className="font-bold text-indigo-400">₹{calcs?.totalCalculated.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#8FBF9F]/10 pt-2 font-bold text-[#8FBF9F]">
                        <span>Professional Tax Deducted:</span>
                        <span className="font-mono">₹{Number(isEditingSalary ? editSalaryForm.professional_tax || 0 : salaryInfo?.professional_tax || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#686C66]">
                        <span>PF Employee Share:</span>
                        <span>- ₹{calcs?.employeePf.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && isOwner && (
          <div className="max-w-md mx-auto rounded-3xl border border-[rgba(242,240,232,0.04)] bg-[#1A211C] shadow-[14px_14px_30px_rgba(0,0,0,0.50),-8px_-8px_22px_rgba(255,255,255,0.025),inset_2px_2px_6px_rgba(255,255,255,0.04)] p-6 space-y-4">
            <h3 className="text-sm font-display font-bold text-[#F2F0E8] uppercase tracking-wider border-b border-[rgba(242,240,232,0.04)] pb-3">Update Security Password</h3>
            
            {secError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs text-rose-400">
                {secError}
              </div>
            )}

            <form onSubmit={handleSecurityChangePassword} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#9B9D96]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPasswordToggle ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[rgba(242,240,232,0.08)] bg-[#0D0F0E] px-3.5 py-2 text-sm text-[#F2F0E8] placeholder-zinc-750 focus:border-[#8FBF9F] focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordToggle(!showNewPasswordToggle)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#686C66] hover:text-[#F2F0E8] font-semibold cursor-pointer"
                  >
                    {showNewPasswordToggle ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#9B9D96]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[rgba(242,240,232,0.08)] bg-[#0D0F0E] px-3.5 py-2 text-sm text-[#F2F0E8] placeholder-zinc-750 focus:border-[#8FBF9F] focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full rounded-lg bg-[#3F6B4F] hover:bg-[#2F523C] active:bg-[#222B25] text-[#F2F0E8] font-semibold py-2.5 text-xs transition duration-150 shadow-md cursor-pointer disabled:opacity-50 mt-2"
              >
                {saveLoading ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
