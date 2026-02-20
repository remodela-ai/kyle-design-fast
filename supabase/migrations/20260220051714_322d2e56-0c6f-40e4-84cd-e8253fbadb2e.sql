-- Create storage bucket for skill builder file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('skill-files', 'skill-files', true);

-- Allow anyone to read skill files (they're used in prompts)
CREATE POLICY "Skill files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'skill-files');

-- Allow authenticated users to upload skill files
CREATE POLICY "Authenticated users can upload skill files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'skill-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their skill files
CREATE POLICY "Authenticated users can delete skill files"
ON storage.objects FOR DELETE
USING (bucket_id = 'skill-files' AND auth.role() = 'authenticated');
