CREATE POLICY "Anyone can delete custom skills"
ON public.kyle_custom_skills
FOR DELETE
USING (true);