-- Dayflow HRMS Schema Migration
-- Run this in the Supabase SQL Editor to update your profiles table.

-- Add columns if they do not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joining_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update any existing null values
UPDATE public.profiles SET joining_year = EXTRACT(YEAR FROM CURRENT_DATE) WHERE joining_year IS NULL;
UPDATE public.profiles SET must_change_password = FALSE WHERE must_change_password IS NULL;
