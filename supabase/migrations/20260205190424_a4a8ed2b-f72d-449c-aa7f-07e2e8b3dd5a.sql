-- Create bathroom inspiration gallery table (same structure as inspiration_gallery)
CREATE TABLE public.bathroom_inspiration_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bathroom_inspiration_gallery ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read bathroom inspiration gallery
CREATE POLICY "Anyone can view bathroom inspiration gallery"
ON public.bathroom_inspiration_gallery
FOR SELECT
USING (true);

-- Allow authenticated users to insert bathroom inspirations
CREATE POLICY "Authenticated users can insert bathroom inspirations"
ON public.bathroom_inspiration_gallery
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to delete bathroom inspirations
CREATE POLICY "Authenticated users can delete bathroom inspirations"
ON public.bathroom_inspiration_gallery
FOR DELETE
USING (true);