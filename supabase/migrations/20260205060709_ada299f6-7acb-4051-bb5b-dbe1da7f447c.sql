-- Smart Project Folders: Add columns and update RLS

-- 1. Add new columns to project_sessions
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS pipeline_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS management_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE project_sessions ADD COLUMN IF NOT EXISTS iteration_count INTEGER DEFAULT 0;

-- 2. Add designer_id to pipeline_steps
ALTER TABLE pipeline_steps ADD COLUMN IF NOT EXISTS designer_id UUID REFERENCES designer_profiles(id);

-- 3. Create security definer function for super admin check
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_kustr_role(_user_id, 'admin'::kustr_role)
$$;

-- 4. Drop existing public policies on project_sessions
DROP POLICY IF EXISTS "Allow public insert project_sessions" ON project_sessions;
DROP POLICY IF EXISTS "Allow public read project_sessions" ON project_sessions;
DROP POLICY IF EXISTS "Allow public update project_sessions" ON project_sessions;
DROP POLICY IF EXISTS "Designers can create their own sessions" ON project_sessions;
DROP POLICY IF EXISTS "Designers can update their own sessions" ON project_sessions;
DROP POLICY IF EXISTS "Designers can view their own sessions" ON project_sessions;

-- 5. Create new multi-tenant RLS policies for project_sessions
CREATE POLICY "Designers can view own projects"
  ON project_sessions FOR SELECT
  USING (
    designer_id IN (SELECT id FROM designer_profiles WHERE user_id = auth.uid())
    OR designer_id IS NULL
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Designers can create own projects"
  ON project_sessions FOR INSERT
  WITH CHECK (
    designer_id IN (SELECT id FROM designer_profiles WHERE user_id = auth.uid())
    OR designer_id IS NULL
  );

CREATE POLICY "Designers can update own projects"
  ON project_sessions FOR UPDATE
  USING (
    designer_id IN (SELECT id FROM designer_profiles WHERE user_id = auth.uid())
    OR designer_id IS NULL
  );

-- 6. Drop existing public policies on pipeline_steps
DROP POLICY IF EXISTS "Allow public insert pipeline_steps" ON pipeline_steps;
DROP POLICY IF EXISTS "Allow public read pipeline_steps" ON pipeline_steps;
DROP POLICY IF EXISTS "Allow public update pipeline_steps" ON pipeline_steps;

-- 7. Create new multi-tenant RLS policies for pipeline_steps
CREATE POLICY "Users can view own pipeline steps"
  ON pipeline_steps FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM project_sessions 
      WHERE designer_id IN (SELECT id FROM designer_profiles WHERE user_id = auth.uid())
      OR designer_id IS NULL
    )
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Users can create pipeline steps"
  ON pipeline_steps FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT session_id FROM project_sessions 
      WHERE designer_id IN (SELECT id FROM designer_profiles WHERE user_id = auth.uid())
      OR designer_id IS NULL
    )
    OR designer_id IN (SELECT id FROM designer_profiles WHERE user_id = auth.uid())
    OR designer_id IS NULL
  );

CREATE POLICY "Users can update own pipeline steps"
  ON pipeline_steps FOR UPDATE
  USING (
    session_id IN (
      SELECT session_id FROM project_sessions 
      WHERE designer_id IN (SELECT id FROM designer_profiles WHERE user_id = auth.uid())
      OR designer_id IS NULL
    )
    OR is_super_admin(auth.uid())
  );