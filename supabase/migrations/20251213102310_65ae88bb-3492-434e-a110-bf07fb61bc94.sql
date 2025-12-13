-- Create person_profiles table for storing psychological profiles
CREATE TABLE public.person_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL UNIQUE,
  communication_style TEXT,
  priorities JSONB DEFAULT '[]'::jsonb,
  frustrations JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  decision_style TEXT,
  feedback_preferences TEXT,
  work_style TEXT,
  values_and_motivations TEXT,
  personality_summary TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  sessions_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding_sessions table for recording intake sessions
CREATE TABLE public.onboarding_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL,
  session_number INTEGER NOT NULL,
  conversation_transcript TEXT,
  extracted_insights JSONB,
  session_focus TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.person_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for person_profiles
CREATE POLICY "Allow public read person_profiles" ON public.person_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert person_profiles" ON public.person_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update person_profiles" ON public.person_profiles FOR UPDATE USING (true);

-- RLS policies for onboarding_sessions
CREATE POLICY "Allow public read onboarding_sessions" ON public.onboarding_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert onboarding_sessions" ON public.onboarding_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update onboarding_sessions" ON public.onboarding_sessions FOR UPDATE USING (true);

-- Create trigger for updated_at on person_profiles
CREATE TRIGGER update_person_profiles_updated_at
  BEFORE UPDATE ON public.person_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_syncs_updated_at();