
CREATE POLICY "Anyone can upload skill files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'skill-files');

CREATE POLICY "Anyone can read skill files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'skill-files');
