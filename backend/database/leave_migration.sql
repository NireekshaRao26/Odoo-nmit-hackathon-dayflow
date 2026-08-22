-- ============================================================
-- Dayflow HRMS — Leave Module Migration
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Relax leave_type CHECK to support both old and new type names
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_leave_type_check;
ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_leave_type_check
  CHECK (leave_type IN ('Paid Leave', 'Paid Time Off', 'Casual Leave', 'Sick Leave', 'Unpaid Leave'));

-- 2. Add attachment_url column to leave_requests
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT '';

-- 3. Expand attendance status CHECK to include 'leave'
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('checked-in', 'present', 'half-day', 'absent', 'late', 'leave'));

-- ============================================================
-- 4. Create leave_balances table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Paid Time Off', 'Sick Leave', 'Unpaid Leave')),
  allocated_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, leave_type, year)
);

-- Enable RLS on leave_balances
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS Policies for leave_requests
-- ============================================================
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: Employee sees own, HR sees all
DROP POLICY IF EXISTS "leave_requests_select_policy" ON public.leave_requests;
CREATE POLICY "leave_requests_select_policy" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'hr'))
  );

-- INSERT: Employee can only insert their own
DROP POLICY IF EXISTS "leave_requests_insert_policy" ON public.leave_requests;
CREATE POLICY "leave_requests_insert_policy" ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only HR can approve/reject
DROP POLICY IF EXISTS "leave_requests_update_policy" ON public.leave_requests;
CREATE POLICY "leave_requests_update_policy" ON public.leave_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'hr')
  );

-- ============================================================
-- 6. RLS Policies for leave_balances
-- ============================================================

-- SELECT: Employee sees own, HR sees all
DROP POLICY IF EXISTS "leave_balances_select_policy" ON public.leave_balances;
CREATE POLICY "leave_balances_select_policy" ON public.leave_balances
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = user_id) OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'hr'))
  );

-- INSERT: Only HR (or service role)
DROP POLICY IF EXISTS "leave_balances_insert_policy" ON public.leave_balances;
CREATE POLICY "leave_balances_insert_policy" ON public.leave_balances
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'hr')
  );

-- UPDATE: Only HR (or service role)
DROP POLICY IF EXISTS "leave_balances_update_policy" ON public.leave_balances;
CREATE POLICY "leave_balances_update_policy" ON public.leave_balances
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'hr')
  );

-- ============================================================
-- DONE
-- Note: The backend uses supabaseAdmin (service role) which bypasses RLS.
-- RLS protects direct client access. Backend enforces auth via request body.
-- ============================================================
