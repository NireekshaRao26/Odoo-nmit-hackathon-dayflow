-- Dayflow HRMS Schema Migration
-- Run this in the Supabase SQL Editor to update your profiles table.

-- Add columns if they do not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joining_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update any existing null values
UPDATE public.profiles SET joining_year = EXTRACT(YEAR FROM CURRENT_DATE) WHERE joining_year IS NULL;
UPDATE public.profiles SET must_change_password = FALSE WHERE must_change_password IS NULL;

-- ----------------------------------------------------
-- PROFILE EXTENSIONS & NEW PROFILE TABLES
-- ----------------------------------------------------

-- Alter Profiles to support Resume & Header
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_love TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}'::TEXT[];

-- Create private_info table
CREATE TABLE IF NOT EXISTS public.private_info (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  dob DATE,
  address TEXT DEFAULT '',
  nationality TEXT DEFAULT '',
  personal_email TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  marital_status TEXT DEFAULT '',
  joining_date DATE DEFAULT CURRENT_DATE,
  bank_name TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  ifsc_code TEXT DEFAULT '',
  pan_number TEXT DEFAULT '',
  uan_number TEXT DEFAULT '',
  employee_code TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for private_info
ALTER TABLE public.private_info ENABLE ROW LEVEL SECURITY;

-- Select policy: User can read their own, HR can read all
DROP POLICY IF EXISTS "private_info_select_policy" ON public.private_info;
CREATE POLICY "private_info_select_policy" ON public.private_info
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = id) OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'hr'))
  );

-- Update policy: User can update their own, HR can update all
DROP POLICY IF EXISTS "private_info_update_policy" ON public.private_info;
CREATE POLICY "private_info_update_policy" ON public.private_info
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = id) OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'hr'))
  );

-- Insert policy: User or HR can insert
DROP POLICY IF EXISTS "private_info_insert_policy" ON public.private_info;
CREATE POLICY "private_info_insert_policy" ON public.private_info
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = id) OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'hr'))
  );

-- Create salary_info table
CREATE TABLE IF NOT EXISTS public.salary_info (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  wage_type TEXT DEFAULT 'Fixed Wage',
  monthly_wage NUMERIC(12, 2) DEFAULT 0.00,
  yearly_wage NUMERIC(12, 2) DEFAULT 0.00,
  working_days_per_week INTEGER DEFAULT 5,
  break_hours NUMERIC(4, 2) DEFAULT 1.00,
  pf_employee_rate NUMERIC(5, 2) DEFAULT 12.00,
  pf_employer_rate NUMERIC(5, 2) DEFAULT 12.00,
  professional_tax NUMERIC(10, 2) DEFAULT 200.00,
  basic_salary_type TEXT DEFAULT 'percentage',
  basic_salary_value NUMERIC(12, 2) DEFAULT 50.00,
  hra_type TEXT DEFAULT 'percentage',
  hra_value NUMERIC(12, 2) DEFAULT 50.00,
  standard_allowance_type TEXT DEFAULT 'fixed',
  standard_allowance_value NUMERIC(12, 2) DEFAULT 0.00,
  performance_bonus_type TEXT DEFAULT 'fixed',
  performance_bonus_value NUMERIC(12, 2) DEFAULT 0.00,
  leave_travel_allowance_type TEXT DEFAULT 'fixed',
  leave_travel_allowance_value NUMERIC(12, 2) DEFAULT 0.00,
  fixed_allowance_type TEXT DEFAULT 'fixed',
  fixed_allowance_value NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for salary_info
ALTER TABLE public.salary_info ENABLE ROW LEVEL SECURITY;

-- Select/Update/Insert policy: HR ONLY (standard employee receives access denial)
DROP POLICY IF EXISTS "salary_info_all_hr_policy" ON public.salary_info;
CREATE POLICY "salary_info_all_hr_policy" ON public.salary_info
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'hr')
  );

-- ----------------------------------------------------
-- ATTENDANCE SECURITY & UNIQUE CONSTRAINT
-- ----------------------------------------------------

-- Deduplicate attendance records (keeping the earliest record for each user/date pair)
DELETE FROM public.attendance a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (user_id, date) id
  FROM public.attendance
  ORDER BY user_id, date, created_at ASC
);

-- Apply unique constraint on user_id and date to prevent duplicate shifts
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS unique_user_date;
ALTER TABLE public.attendance ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);

-- Enable RLS for attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Select policy: User can read their own, HR can read all
DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance;
CREATE POLICY "attendance_select_policy" ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'hr'))
  );

-- Insert policy: User can insert their own, HR can insert all
DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance;
CREATE POLICY "attendance_insert_policy" ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id) OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'hr'))
  );

-- Update policy: User can update their own, HR can update all
DROP POLICY IF EXISTS "attendance_update_policy" ON public.attendance;
CREATE POLICY "attendance_update_policy" ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'hr'))
  );
