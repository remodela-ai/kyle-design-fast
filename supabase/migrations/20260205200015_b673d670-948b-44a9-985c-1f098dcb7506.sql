-- ============================================
-- PHASE 1: AUTOMATED NURTURING SEQUENCES
-- ============================================

-- Nurturing sequences table
CREATE TABLE public.nurturing_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_status public.lead_status NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Nurturing steps table
CREATE TABLE public.nurturing_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.nurturing_sequences(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  delay_hours integer NOT NULL DEFAULT 24,
  email_subject text NOT NULL,
  email_body text NOT NULL,
  include_moodboard boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

-- Nurturing log table
CREATE TABLE public.nurturing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.nurturing_steps(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES public.nurturing_sequences(id) ON DELETE CASCADE,
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================
-- PHASE 2: DEMO SCHEDULING
-- ============================================

-- Appointment type enum
CREATE TYPE public.appointment_type AS ENUM ('discovery', 'site_visit', 'design_review', 'follow_up');

-- Appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Scheduling availability table
CREATE TABLE public.scheduling_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, day_of_week)
);

-- Appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE SET NULL,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  type public.appointment_type NOT NULL DEFAULT 'discovery',
  location text,
  video_link text,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes text,
  reminder_24h_sent boolean NOT NULL DEFAULT false,
  reminder_1h_sent boolean NOT NULL DEFAULT false,
  google_event_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================
-- PHASE 3: ELECTRONIC SIGNATURES
-- ============================================

-- Add signature columns to proposals table
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS signature_url text,
ADD COLUMN IF NOT EXISTS signed_by_name text,
ADD COLUMN IF NOT EXISTS signed_by_email text,
ADD COLUMN IF NOT EXISTS signed_ip text,
ADD COLUMN IF NOT EXISTS pdf_url text;

-- Signature audit log table
CREATE TABLE public.signature_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================
-- PHASE 4: PAYMENT PROCESSING
-- ============================================

-- Payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Payment milestone enum
CREATE TYPE public.payment_milestone AS ENUM ('deposit', 'design_phase', 'procurement', 'installation', 'final');

-- Payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  milestone public.payment_milestone NOT NULL,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  stripe_checkout_session_id text,
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  receipt_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Payment schedules table
CREATE TABLE public.payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  milestone public.payment_milestone NOT NULL,
  percentage integer NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount numeric,
  due_date date,
  reminder_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, milestone)
);

-- ============================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================

ALTER TABLE public.nurturing_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurturing_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurturing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: NURTURING
-- ============================================

-- Nurturing sequences policies
CREATE POLICY "Users can view sequences in their office"
ON public.nurturing_sequences FOR SELECT
USING (user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Managing partners can manage sequences"
ON public.nurturing_sequences FOR ALL
USING (has_kustr_role(auth.uid(), 'managing_partner') AND user_belongs_to_office(auth.uid(), office_id));

-- Nurturing steps policies
CREATE POLICY "Users can view steps of their office sequences"
ON public.nurturing_steps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.nurturing_sequences ns
  WHERE ns.id = nurturing_steps.sequence_id
  AND user_belongs_to_office(auth.uid(), ns.office_id)
));

CREATE POLICY "Managing partners can manage steps"
ON public.nurturing_steps FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.nurturing_sequences ns
  WHERE ns.id = nurturing_steps.sequence_id
  AND has_kustr_role(auth.uid(), 'managing_partner')
  AND user_belongs_to_office(auth.uid(), ns.office_id)
));

-- Nurturing log policies
CREATE POLICY "Users can view nurturing logs in their office"
ON public.nurturing_log FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.leads l
  WHERE l.id = nurturing_log.lead_id
  AND user_belongs_to_office(auth.uid(), l.office_id)
));

CREATE POLICY "System can insert nurturing logs"
ON public.nurturing_log FOR INSERT
WITH CHECK (true);

-- ============================================
-- RLS POLICIES: SCHEDULING
-- ============================================

-- Scheduling availability policies
CREATE POLICY "Users can view availability in their office"
ON public.scheduling_availability FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.team_members tm
  WHERE tm.id = scheduling_availability.team_member_id
  AND user_belongs_to_office(auth.uid(), tm.office_id)
));

CREATE POLICY "Users can manage their own availability"
ON public.scheduling_availability FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.team_members tm
  WHERE tm.id = scheduling_availability.team_member_id
  AND tm.user_id = auth.uid()
));

-- Appointments policies
CREATE POLICY "Users can view appointments in their office"
ON public.appointments FOR SELECT
USING (user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can manage appointments in their office"
ON public.appointments FOR ALL
USING (user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Public can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (true);

-- ============================================
-- RLS POLICIES: SIGNATURES
-- ============================================

-- Signature audit log policies
CREATE POLICY "Users can view audit logs in their office"
ON public.signature_audit_log FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.proposals p
  WHERE p.id = signature_audit_log.proposal_id
  AND user_belongs_to_office(auth.uid(), p.office_id)
));

CREATE POLICY "System can insert audit logs"
ON public.signature_audit_log FOR INSERT
WITH CHECK (true);

-- ============================================
-- RLS POLICIES: PAYMENTS
-- ============================================

-- Payments policies
CREATE POLICY "Users can view payments in their office"
ON public.payments FOR SELECT
USING (user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "Users can manage payments in their office"
ON public.payments FOR ALL
USING (user_belongs_to_office(auth.uid(), office_id));

CREATE POLICY "System can insert payments"
ON public.payments FOR INSERT
WITH CHECK (true);

-- Payment schedules policies
CREATE POLICY "Users can view payment schedules in their office"
ON public.payment_schedules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.proposals p
  WHERE p.id = payment_schedules.proposal_id
  AND user_belongs_to_office(auth.uid(), p.office_id)
));

CREATE POLICY "Users can manage payment schedules in their office"
ON public.payment_schedules FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.proposals p
  WHERE p.id = payment_schedules.proposal_id
  AND user_belongs_to_office(auth.uid(), p.office_id)
));

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_nurturing_sequences_updated_at
BEFORE UPDATE ON public.nurturing_sequences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nurturing_steps_updated_at
BEFORE UPDATE ON public.nurturing_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at
BEFORE UPDATE ON public.payment_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_nurturing_sequences_office ON public.nurturing_sequences(office_id);
CREATE INDEX idx_nurturing_sequences_trigger ON public.nurturing_sequences(trigger_status, is_active);
CREATE INDEX idx_nurturing_log_lead ON public.nurturing_log(lead_id);
CREATE INDEX idx_nurturing_log_status ON public.nurturing_log(status);
CREATE INDEX idx_appointments_lead ON public.appointments(lead_id);
CREATE INDEX idx_appointments_team_member ON public.appointments(team_member_id);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_at, status);
CREATE INDEX idx_payments_proposal ON public.payments(proposal_id);
CREATE INDEX idx_payments_lead ON public.payments(lead_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_signature_audit_proposal ON public.signature_audit_log(proposal_id);