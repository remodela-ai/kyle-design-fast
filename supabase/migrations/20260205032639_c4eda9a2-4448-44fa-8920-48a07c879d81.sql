-- Create storage bucket for documentation screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('doc-screenshots', 'doc-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to screenshots
CREATE POLICY "Public can view doc screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'doc-screenshots');

-- Allow authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload doc screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'doc-screenshots' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete doc screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'doc-screenshots' AND auth.uid() IS NOT NULL);