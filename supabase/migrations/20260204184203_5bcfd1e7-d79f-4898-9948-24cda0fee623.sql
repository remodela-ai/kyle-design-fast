-- Create lead status enum
CREATE TYPE public.lead_status AS ENUM ('new', 'qualified', 'contacted', 'proposal_sent', 'converted', 'lost');

-- Create leads table for capturing website visitor inquiries
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE NOT NULL,
  
  -- Contact Information
  name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Project Requirements
  project_type TEXT, -- kitchen, bathroom, bedroom, etc.
  room_dimensions JSONB DEFAULT '{}'::jsonb, -- { width, height, depth }
  style_preferences TEXT[] DEFAULT '{}',
  
  -- Brand Preferences (James's specific request)
  appliance_brands TEXT[] DEFAULT '{}',
  plumbing_brands TEXT[] DEFAULT '{}',
  furniture_brands TEXT[] DEFAULT '{}',
  
  -- Budget
  budget_min NUMERIC,
  budget_max NUMERIC,
  budget_flexibility TEXT, -- strict, flexible, open
  
  -- Conversation Data
  conversation_transcript TEXT,
  conversation_id TEXT, -- ElevenLabs conversation ID
  extracted_insights JSONB DEFAULT '{}'::jsonb,
  
  -- Generated Assets
  preliminary_design_url TEXT,
  moodboard_url TEXT,
  
  -- Status Tracking
  status lead_status DEFAULT 'new',
  qualified_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create lead_messages table for async Kyle-client communication
CREATE TABLE public.lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL, -- 'kyle' or 'client' or 'designer'
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on both tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads table
-- Users can view leads in their office
CREATE POLICY "Users can view leads in their office"
ON public.leads
FOR SELECT
USING (user_belongs_to_office(auth.uid(), office_id));

-- Users can manage leads in their office
CREATE POLICY "Users can manage leads in their office"
ON public.leads
FOR ALL
USING (user_belongs_to_office(auth.uid(), office_id));

-- Public insert for webhook (no auth required for lead capture)
CREATE POLICY "Allow public lead creation"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- RLS Policies for lead_messages table
-- Users can view messages for leads in their office
CREATE POLICY "Users can view lead messages in their office"
ON public.lead_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_messages.lead_id
    AND user_belongs_to_office(auth.uid(), leads.office_id)
  )
);

-- Users can manage messages for leads in their office
CREATE POLICY "Users can manage lead messages in their office"
ON public.lead_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_messages.lead_id
    AND user_belongs_to_office(auth.uid(), leads.office_id)
  )
);

-- Public insert for client/kyle messages via webhook
CREATE POLICY "Allow public message creation"
ON public.lead_messages
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_leads_office_id ON public.leads(office_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_conversation_id ON public.leads(conversation_id);
CREATE INDEX idx_lead_messages_lead_id ON public.lead_messages(lead_id);
CREATE INDEX idx_lead_messages_created_at ON public.lead_messages(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();