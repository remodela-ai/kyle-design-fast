-- Create alarms table
CREATE TABLE public.alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Alarm',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required per project pattern)
CREATE POLICY "Allow public read alarms" ON public.alarms FOR SELECT USING (true);
CREATE POLICY "Allow public insert alarms" ON public.alarms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update alarms" ON public.alarms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete alarms" ON public.alarms FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.alarms;