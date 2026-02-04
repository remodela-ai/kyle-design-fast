-- Create lead-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-assets', 'lead-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for lead assets
CREATE POLICY "Public read access for lead assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'lead-assets');

-- Allow service role to upload lead assets
CREATE POLICY "Service role can upload lead assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lead-assets');

-- Allow service role to update lead assets
CREATE POLICY "Service role can update lead assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lead-assets');

-- Allow service role to delete lead assets
CREATE POLICY "Service role can delete lead assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'lead-assets');