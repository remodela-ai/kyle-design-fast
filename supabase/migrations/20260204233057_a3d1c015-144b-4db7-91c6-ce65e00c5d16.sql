-- Create proposals table for tracking generated agreements
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES public.offices(id),
  
  -- Fee information
  total_fee NUMERIC NOT NULL,
  fee_breakdown JSONB NOT NULL,
  
  -- Agreement content
  agreement_html TEXT NOT NULL,
  agreement_text TEXT NOT NULL,
  custom_terms TEXT,
  
  -- Tracking
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, viewed, signed, expired
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view proposals in their office"
  ON public.proposals FOR SELECT
  USING (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can create proposals in their office"
  ON public.proposals FOR INSERT
  WITH CHECK (public.user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can update proposals in their office"
  ON public.proposals FOR UPDATE
  USING (public.user_belongs_to_office(auth.uid(), office_id));

-- Indexes
CREATE INDEX idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX idx_proposals_office_id ON public.proposals(office_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);

-- Trigger for updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();