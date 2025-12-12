-- Add recurrence fields to alarms table
ALTER TABLE public.alarms
ADD COLUMN recurrence TEXT DEFAULT 'none',
ADD COLUMN recurrence_days TEXT[] DEFAULT NULL;

-- recurrence can be: 'none', 'daily', 'weekly'
-- recurrence_days is for weekly: array of day names like ['monday', 'wednesday', 'friday']