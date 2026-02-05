-- Create table for inspiration gallery images
CREATE TABLE public.inspiration_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspiration_gallery ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view images (public gallery)
CREATE POLICY "Anyone can view inspiration gallery"
ON public.inspiration_gallery
FOR SELECT
USING (true);

-- Allow anyone to insert (for now, public landing page)
CREATE POLICY "Anyone can add to inspiration gallery"
ON public.inspiration_gallery
FOR INSERT
WITH CHECK (true);

-- Allow anyone to delete
CREATE POLICY "Anyone can delete from inspiration gallery"
ON public.inspiration_gallery
FOR DELETE
USING (true);