-- Dayflow HRMS Database Schema

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'hr')),
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  department TEXT DEFAULT 'Engineering',
  phone TEXT DEFAULT '',
  position TEXT DEFAULT 'Software Engineer',
  avatar_url TEXT DEFAULT '',
  company_name TEXT DEFAULT 'Odoo India',
  company_code TEXT DEFAULT 'OI',
  company_logo TEXT DEFAULT '',
  joining_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  must_change_password BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1b. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  work_hours NUMERIC(4,2) DEFAULT 0,
  status TEXT DEFAULT 'present' CHECK (status IN ('checked-in', 'present', 'half-day', 'absent', 'late')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Paid Leave', 'Casual Leave', 'Sick Leave', 'Unpaid Leave')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_comments TEXT DEFAULT '',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('attendance', 'leave', 'profile', 'system', 'alert')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
