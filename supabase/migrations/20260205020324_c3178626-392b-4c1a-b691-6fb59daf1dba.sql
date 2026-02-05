-- Allow authenticated users to insert their own role during onboarding
-- This is safe because:
-- 1. Users can only insert rows where user_id = their own auth.uid()
-- 2. The unique constraint prevents duplicate roles
CREATE POLICY "Users can create their own initial role"
ON public.user_roles
FOR INSERT
WITH CHECK (user_id = auth.uid());