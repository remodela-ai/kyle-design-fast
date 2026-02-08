-- Kitchen Redesign Studio Tables
-- From merged Manus kitchen-redesign-app

-- Projects table
CREATE TABLE IF NOT EXISTS public.kitchen_projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Kitchen',
  status TEXT NOT NULL DEFAULT 'upload' CHECK (status IN ('upload', 'segmenting', 'segmented', 'rendering', 'rendered')),
  original_image_url TEXT,
  redesign_image_url TEXT,
  segmentation_data JSONB DEFAULT '{}',
  items JSONB DEFAULT '[]',
  layout_3d JSONB,
  proposal_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalog categories
CREATE TABLE IF NOT EXISTS public.kitchen_catalog_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT DEFAULT 'LayoutGrid',
  color TEXT DEFAULT '#CCCCCC',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalog items
CREATE TABLE IF NOT EXISTS public.kitchen_catalog_items (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES public.kitchen_catalog_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  material TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.kitchen_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_catalog_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for kitchen_projects
CREATE POLICY "Users can view own kitchen projects" ON public.kitchen_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own kitchen projects" ON public.kitchen_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kitchen projects" ON public.kitchen_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kitchen projects" ON public.kitchen_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Catalog is public read
CREATE POLICY "Anyone can view catalog categories" ON public.kitchen_catalog_categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view catalog items" ON public.kitchen_catalog_items
  FOR SELECT USING (true);

-- Updated_at trigger for kitchen_projects
CREATE TRIGGER kitchen_projects_updated_at
  BEFORE UPDATE ON public.kitchen_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for kitchen images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kitchen-images', 'kitchen-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kitchen-images bucket
CREATE POLICY "Anyone can view kitchen images" ON storage.objects
  FOR SELECT USING (bucket_id = 'kitchen-images');

CREATE POLICY "Authenticated users can upload kitchen images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kitchen-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their kitchen images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'kitchen-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their kitchen images" ON storage.objects
  FOR DELETE USING (bucket_id = 'kitchen-images' AND auth.uid() IS NOT NULL);