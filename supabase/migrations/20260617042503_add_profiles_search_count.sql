-- Add search_count to profiles for tracking number of successful searches per user.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS search_count INTEGER NOT NULL DEFAULT 0;
