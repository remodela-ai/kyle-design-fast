-- Kitchen Redesign Studio - Supabase Schema
-- Run this in your Supabase SQL editor to create the required tables.

-- Projects table
CREATE TABLE IF NOT EXISTS kitchen_projects (
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
CREATE TABLE IF NOT EXISTS kitchen_catalog_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT DEFAULT 'LayoutGrid',
  color TEXT DEFAULT '#CCCCCC',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalog items
CREATE TABLE IF NOT EXISTS kitchen_catalog_items (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES kitchen_catalog_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  material TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kitchen_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_catalog_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own projects" ON kitchen_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON kitchen_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON kitchen_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON kitchen_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Catalog is public read
CREATE POLICY "Anyone can view catalog categories" ON kitchen_catalog_categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view catalog items" ON kitchen_catalog_items
  FOR SELECT USING (true);

-- Storage bucket for kitchen images
-- Run in Supabase Dashboard > Storage > Create bucket: "kitchen-images" (public)

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kitchen_projects_updated_at
  BEFORE UPDATE ON kitchen_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
