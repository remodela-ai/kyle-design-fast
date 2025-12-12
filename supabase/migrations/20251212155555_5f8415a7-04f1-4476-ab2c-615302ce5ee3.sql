-- Create tasks table for Kyle-managed reminders
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  reminder_time TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public access since no auth)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow public access for this demo (no auth required)
CREATE POLICY "Allow public read access" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.tasks FOR DELETE USING (true);

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;