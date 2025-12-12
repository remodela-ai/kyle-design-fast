-- Create table for daily GTM syncs
CREATE TABLE public.daily_syncs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_date DATE NOT NULL DEFAULT CURRENT_DATE,
  oriel_notes TEXT,
  james_notes TEXT,
  synthesis TEXT,
  knowledge_base TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for conversation messages within a sync
CREATE TABLE public.sync_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_id UUID NOT NULL REFERENCES public.daily_syncs(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  speaker TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this internal tool)
CREATE POLICY "Allow public read daily_syncs" 
ON public.daily_syncs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert daily_syncs" 
ON public.daily_syncs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update daily_syncs" 
ON public.daily_syncs 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete daily_syncs" 
ON public.daily_syncs 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read sync_messages" 
ON public.sync_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert sync_messages" 
ON public.sync_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update sync_messages" 
ON public.sync_messages 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete sync_messages" 
ON public.sync_messages 
FOR DELETE 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_sync_messages_sync_id ON public.sync_messages(sync_id);
CREATE INDEX idx_daily_syncs_date ON public.daily_syncs(sync_date DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_daily_syncs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_syncs_updated_at
BEFORE UPDATE ON public.daily_syncs
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_syncs_updated_at();