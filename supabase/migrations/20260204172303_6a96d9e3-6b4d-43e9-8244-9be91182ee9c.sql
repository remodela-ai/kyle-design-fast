-- Allow authenticated users to create their own office during onboarding
CREATE POLICY "Authenticated users can create offices"
ON public.offices
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own office (where they are the managing partner)
CREATE POLICY "Managing partners can update their office"
ON public.offices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.office_id = offices.id
    AND user_roles.role = 'managing_partner'
  )
);