-- Add lead_id column to link projects with leads
ALTER TABLE public.project_sessions 
ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_sessions_lead_id ON public.project_sessions(lead_id);

-- Add index for session_id lookups (used frequently in pipeline)
CREATE INDEX IF NOT EXISTS idx_pipeline_steps_session_id ON public.pipeline_steps(session_id);