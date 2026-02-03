-- Create enum for design specializations
CREATE TYPE public.design_specialization AS ENUM (
  'residential',
  'commercial', 
  'hospitality',
  'retail',
  'healthcare',
  'office',
  'sustainable',
  'luxury',
  'minimalist',
  'traditional'
);

-- Create enum for sharing visibility
CREATE TYPE public.visibility_type AS ENUM (
  'private',
  'shared',
  'public'
);

-- Create designer profiles table
CREATE TABLE public.designer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  company_name TEXT,
  bio TEXT,
  website_url TEXT,
  portfolio_url TEXT,
  contact_email TEXT,
  specializations design_specialization[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collections table for organizing designs
CREATE TABLE public.design_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  visibility visibility_type NOT NULL DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create design generations table
CREATE TABLE public.design_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES public.designer_profiles(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES public.design_collections(id) ON DELETE SET NULL,
  session_id TEXT,
  image_url TEXT NOT NULL,
  prompt TEXT,
  style_notes TEXT,
  metadata JSONB DEFAULT '{}',
  visibility visibility_type NOT NULL DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add designer_id to existing project_sessions table
ALTER TABLE public.project_sessions 
ADD COLUMN designer_id UUID REFERENCES public.designer_profiles(id) ON DELETE CASCADE;

-- Enable RLS on all new tables
ALTER TABLE public.designer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_generations ENABLE ROW LEVEL SECURITY;

-- Designer profiles policies
CREATE POLICY "Users can view their own profile"
ON public.designer_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profiles"
ON public.designer_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can create their own profile"
ON public.designer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.designer_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Collections policies
CREATE POLICY "Designers can view their own collections"
ON public.design_collections FOR SELECT
USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view public/shared collections"
ON public.design_collections FOR SELECT
USING (visibility IN ('public', 'shared'));

CREATE POLICY "Designers can create their own collections"
ON public.design_collections FOR INSERT
WITH CHECK (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Designers can update their own collections"
ON public.design_collections FOR UPDATE
USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Designers can delete their own collections"
ON public.design_collections FOR DELETE
USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

-- Generations policies
CREATE POLICY "Designers can view their own generations"
ON public.design_generations FOR SELECT
USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view public/shared generations"
ON public.design_generations FOR SELECT
USING (visibility IN ('public', 'shared'));

CREATE POLICY "Designers can create their own generations"
ON public.design_generations FOR INSERT
WITH CHECK (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Designers can update their own generations"
ON public.design_generations FOR UPDATE
USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Designers can delete their own generations"
ON public.design_generations FOR DELETE
USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()));

-- Update project_sessions RLS policies for multi-tenant
CREATE POLICY "Designers can view their own sessions"
ON public.project_sessions FOR SELECT
USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()) OR designer_id IS NULL);

CREATE POLICY "Designers can create their own sessions"
ON public.project_sessions FOR INSERT
WITH CHECK (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()) OR designer_id IS NULL);

CREATE POLICY "Designers can update their own sessions"
ON public.project_sessions FOR UPDATE
USING (designer_id IN (SELECT id FROM public.designer_profiles WHERE user_id = auth.uid()) OR designer_id IS NULL);

-- Create storage bucket for designer avatars and design images
INSERT INTO storage.buckets (id, name, public) VALUES ('designer-assets', 'designer-assets', true);

-- Storage policies
CREATE POLICY "Anyone can view designer assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'designer-assets');

CREATE POLICY "Authenticated users can upload their assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'designer-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'designer-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'designer-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_designer_profiles_updated_at
BEFORE UPDATE ON public.designer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_design_collections_updated_at
BEFORE UPDATE ON public.design_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();