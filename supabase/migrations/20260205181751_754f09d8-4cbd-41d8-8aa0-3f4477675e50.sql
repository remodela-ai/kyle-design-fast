-- Add DELETE policy for project_sessions
CREATE POLICY "Designers can delete own projects"
ON public.project_sessions
FOR DELETE
USING (
  (designer_id IN (
    SELECT designer_profiles.id
    FROM designer_profiles
    WHERE designer_profiles.user_id = auth.uid()
  ))
  OR (designer_id IS NULL)
);

-- Add DELETE policy for pipeline_steps
CREATE POLICY "Users can delete own pipeline steps"
ON public.pipeline_steps
FOR DELETE
USING (
  (session_id IN (
    SELECT project_sessions.session_id
    FROM project_sessions
    WHERE (
      (project_sessions.designer_id IN (
        SELECT designer_profiles.id
        FROM designer_profiles
        WHERE designer_profiles.user_id = auth.uid()
      ))
      OR (project_sessions.designer_id IS NULL)
    )
  ))
  OR is_super_admin(auth.uid())
);