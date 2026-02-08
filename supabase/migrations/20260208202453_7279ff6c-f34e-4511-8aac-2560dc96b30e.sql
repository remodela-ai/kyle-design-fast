-- Update kitchen_projects RLS policies to include super admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own kitchen projects" ON public.kitchen_projects;
DROP POLICY IF EXISTS "Users can create own kitchen projects" ON public.kitchen_projects;
DROP POLICY IF EXISTS "Users can update own kitchen projects" ON public.kitchen_projects;
DROP POLICY IF EXISTS "Users can delete own kitchen projects" ON public.kitchen_projects;

-- Recreate policies with super admin access
CREATE POLICY "Users can view own kitchen projects" 
ON public.kitchen_projects 
FOR SELECT 
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

CREATE POLICY "Users can create own kitchen projects" 
ON public.kitchen_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR is_super_admin(auth.uid()));

CREATE POLICY "Users can update own kitchen projects" 
ON public.kitchen_projects 
FOR UPDATE 
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

CREATE POLICY "Users can delete own kitchen projects" 
ON public.kitchen_projects 
FOR DELETE 
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));