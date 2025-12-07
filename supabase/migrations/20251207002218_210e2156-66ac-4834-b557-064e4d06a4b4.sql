-- Table for project sessions
CREATE TABLE public.project_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  design_image_url TEXT,
  conversation_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for pipeline steps
CREATE TABLE public.pipeline_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES public.project_sessions(session_id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  input_data JSONB,
  output_data JSONB,
  visual_outcome_url TEXT,
  memory_context JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_pipeline_steps_session ON public.pipeline_steps(session_id);
CREATE INDEX idx_pipeline_steps_status ON public.pipeline_steps(status);

-- Enable RLS
ALTER TABLE public.project_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_steps ENABLE ROW LEVEL SECURITY;

-- Allow public access (no auth required for this app)
CREATE POLICY "Allow public read project_sessions"
  ON public.project_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert project_sessions"
  ON public.project_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update project_sessions"
  ON public.project_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read pipeline_steps"
  ON public.pipeline_steps FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert pipeline_steps"
  ON public.pipeline_steps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update pipeline_steps"
  ON public.pipeline_steps FOR UPDATE
  USING (true);

-- Enable realtime for pipeline_steps
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_steps;