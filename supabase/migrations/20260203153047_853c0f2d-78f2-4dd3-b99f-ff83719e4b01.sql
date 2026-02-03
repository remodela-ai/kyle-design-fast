
-- =====================================================
-- KUSTR DESIGN MULTI-OFFICE PLATFORM
-- Phase 1: Database Structure
-- =====================================================

-- 1. Create Enums
CREATE TYPE public.kustr_role AS ENUM ('managing_partner', 'collaborator', 'admin');
CREATE TYPE public.client_status AS ENUM ('lead', 'active', 'completed', 'inactive');
CREATE TYPE public.project_status AS ENUM ('planning', 'in_progress', 'review', 'completed');
CREATE TYPE public.marketing_platform AS ENUM ('linkedin', 'facebook', 'instagram', 'tiktok', 'x');
CREATE TYPE public.post_status AS ENUM ('draft', 'scheduled', 'published');

-- 2. Create offices table
CREATE TABLE public.offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create user_roles table (separate from profiles as per security requirements)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role kustr_role NOT NULL,
    office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role, office_id)
);

-- 4. Create team_members table
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    title TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, office_id)
);

-- 5. Create clients table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    status client_status DEFAULT 'lead',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Create service_providers table
CREATE TABLE public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. Create material_vendors table
CREATE TABLE public.material_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    discount_terms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 8. Create strategic_alliances table
CREATE TABLE public.strategic_alliances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    partner_name TEXT NOT NULL,
    partnership_type TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    agreement_details TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 9. Create projects table
CREATE TABLE public.kustr_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'planning',
    budget DECIMAL(12, 2),
    start_date DATE,
    end_date DATE,
    cover_image_url TEXT,
    assigned_members UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 10. Create project_files table
CREATE TABLE public.kustr_project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.kustr_projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 11. Create marketing_posts table
CREATE TABLE public.marketing_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    platform marketing_platform NOT NULL,
    status post_status DEFAULT 'draft',
    scheduled_date TIMESTAMP WITH TIME ZONE,
    image_urls TEXT[],
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 12. Create marketing_budgets table
CREATE TABLE public.marketing_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    total_budget DECIMAL(10, 2) DEFAULT 0,
    linkedin_budget DECIMAL(10, 2) DEFAULT 0,
    facebook_budget DECIMAL(10, 2) DEFAULT 0,
    instagram_budget DECIMAL(10, 2) DEFAULT 0,
    tiktok_budget DECIMAL(10, 2) DEFAULT 0,
    x_budget DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (office_id, month)
);

-- =====================================================
-- SECURITY: has_role() function (Security Definer)
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_kustr_role(_user_id UUID, _role kustr_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get user's office_id
CREATE OR REPLACE FUNCTION public.get_user_office_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT office_id
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- Function to check if user belongs to office
CREATE OR REPLACE FUNCTION public.user_belongs_to_office(_user_id UUID, _office_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND office_id = _office_id
    )
$$;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kustr_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kustr_project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_budgets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Offices: Anyone authenticated can view offices (for registration)
CREATE POLICY "Anyone can view offices" ON public.offices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage offices" ON public.offices
    FOR ALL TO authenticated USING (public.has_kustr_role(auth.uid(), 'admin'));

-- User Roles: Users can view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL TO authenticated USING (public.has_kustr_role(auth.uid(), 'admin'));

CREATE POLICY "Managing partners can manage roles in their office" ON public.user_roles
    FOR ALL TO authenticated USING (
        public.has_kustr_role(auth.uid(), 'managing_partner') 
        AND public.user_belongs_to_office(auth.uid(), office_id)
    );

-- Team Members: Office-scoped access
CREATE POLICY "Team members can view colleagues in their office" ON public.team_members
    FOR SELECT TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can update their own profile" ON public.team_members
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.team_members
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managing partners can manage team in their office" ON public.team_members
    FOR ALL TO authenticated USING (
        public.has_kustr_role(auth.uid(), 'managing_partner') 
        AND public.user_belongs_to_office(auth.uid(), office_id)
    );

-- Clients: Office-scoped access
CREATE POLICY "Users can view clients in their office" ON public.clients
    FOR SELECT TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can manage clients in their office" ON public.clients
    FOR ALL TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

-- Service Providers: Office-scoped access
CREATE POLICY "Users can view providers in their office" ON public.service_providers
    FOR SELECT TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can manage providers in their office" ON public.service_providers
    FOR ALL TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

-- Material Vendors: Office-scoped access
CREATE POLICY "Users can view vendors in their office" ON public.material_vendors
    FOR SELECT TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can manage vendors in their office" ON public.material_vendors
    FOR ALL TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

-- Strategic Alliances: Office-scoped access
CREATE POLICY "Users can view alliances in their office" ON public.strategic_alliances
    FOR SELECT TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can manage alliances in their office" ON public.strategic_alliances
    FOR ALL TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

-- Projects: Office-scoped access
CREATE POLICY "Users can view projects in their office" ON public.kustr_projects
    FOR SELECT TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can manage projects in their office" ON public.kustr_projects
    FOR ALL TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

-- Project Files: Access through project
CREATE POLICY "Users can view files of their office projects" ON public.kustr_project_files
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.kustr_projects p
            WHERE p.id = project_id
            AND public.user_belongs_to_office(auth.uid(), p.office_id)
        )
    );

CREATE POLICY "Users can manage files of their office projects" ON public.kustr_project_files
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.kustr_projects p
            WHERE p.id = project_id
            AND public.user_belongs_to_office(auth.uid(), p.office_id)
        )
    );

-- Marketing Posts: Office-scoped access
CREATE POLICY "Users can view posts in their office" ON public.marketing_posts
    FOR SELECT TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can manage posts in their office" ON public.marketing_posts
    FOR ALL TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

-- Marketing Budgets: Office-scoped, managing partners only for write
CREATE POLICY "Users can view budgets in their office" ON public.marketing_budgets
    FOR SELECT TO authenticated USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Managing partners can manage budgets" ON public.marketing_budgets
    FOR ALL TO authenticated USING (
        public.has_kustr_role(auth.uid(), 'managing_partner') 
        AND public.user_belongs_to_office(auth.uid(), office_id)
    );

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER update_offices_updated_at
    BEFORE UPDATE ON public.offices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
    BEFORE UPDATE ON public.service_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_material_vendors_updated_at
    BEFORE UPDATE ON public.material_vendors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategic_alliances_updated_at
    BEFORE UPDATE ON public.strategic_alliances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kustr_projects_updated_at
    BEFORE UPDATE ON public.kustr_projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_posts_updated_at
    BEFORE UPDATE ON public.marketing_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_budgets_updated_at
    BEFORE UPDATE ON public.marketing_budgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_office_id ON public.user_roles(office_id);
CREATE INDEX idx_team_members_office_id ON public.team_members(office_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_clients_office_id ON public.clients(office_id);
CREATE INDEX idx_service_providers_office_id ON public.service_providers(office_id);
CREATE INDEX idx_material_vendors_office_id ON public.material_vendors(office_id);
CREATE INDEX idx_strategic_alliances_office_id ON public.strategic_alliances(office_id);
CREATE INDEX idx_kustr_projects_office_id ON public.kustr_projects(office_id);
CREATE INDEX idx_kustr_projects_client_id ON public.kustr_projects(client_id);
CREATE INDEX idx_kustr_project_files_project_id ON public.kustr_project_files(project_id);
CREATE INDEX idx_marketing_posts_office_id ON public.marketing_posts(office_id);
CREATE INDEX idx_marketing_budgets_office_id ON public.marketing_budgets(office_id);

-- =====================================================
-- PRE-CREATE THE THREE OFFICES
-- =====================================================

INSERT INTO public.offices (name, location, address, timezone) VALUES
    ('New York', 'New York, NY', NULL, 'America/New_York'),
    ('Arizona', 'Phoenix, AZ', NULL, 'America/Phoenix'),
    ('Wisconsin', 'Milwaukee, WI', NULL, 'America/Chicago');
