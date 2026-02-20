
-- Create kyle_custom_skills table
CREATE TABLE public.kyle_custom_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID REFERENCES public.offices(id),
  created_by UUID,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🧩',
  action_type TEXT NOT NULL DEFAULT 'create',
  manus_task_id TEXT,
  status TEXT NOT NULL DEFAULT 'building',
  result_url TEXT,
  result_html TEXT,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyle_custom_skills ENABLE ROW LEVEL SECURITY;

-- Public insert (anyone can create a skill request)
CREATE POLICY "Anyone can insert custom skills"
ON public.kyle_custom_skills FOR INSERT
WITH CHECK (true);

-- Public select (for now, allow all to view)
CREATE POLICY "Anyone can view custom skills"
ON public.kyle_custom_skills FOR SELECT
USING (true);

-- Public update (for status updates from edge functions)
CREATE POLICY "Anyone can update custom skills"
ON public.kyle_custom_skills FOR UPDATE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_kyle_custom_skills_updated_at
BEFORE UPDATE ON public.kyle_custom_skills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
