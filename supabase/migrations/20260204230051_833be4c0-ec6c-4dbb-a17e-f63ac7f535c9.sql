-- Create table to track lead status history
CREATE TABLE public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status lead_status,
  to_status lead_status NOT NULL,
  changed_by UUID REFERENCES public.team_members(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view history for leads in their office
CREATE POLICY "Users can view lead status history in their office"
ON public.lead_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_status_history.lead_id
    AND user_belongs_to_office(auth.uid(), leads.office_id)
  )
);

-- Users can insert history for leads in their office
CREATE POLICY "Users can insert lead status history in their office"
ON public.lead_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_status_history.lead_id
    AND user_belongs_to_office(auth.uid(), leads.office_id)
  )
);

-- Add index for faster queries
CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_changed_at ON public.lead_status_history(changed_at);