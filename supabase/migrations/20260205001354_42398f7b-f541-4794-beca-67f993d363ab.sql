-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  new_lead_email BOOLEAN DEFAULT true,
  lead_assigned_email BOOLEAN DEFAULT true,
  new_message_email BOOLEAN DEFAULT true,
  proposal_viewed_email BOOLEAN DEFAULT true,
  email_frequency TEXT DEFAULT 'instant' CHECK (email_frequency IN ('instant', 'hourly', 'daily', 'weekly')),
  quiet_hours_start TIME DEFAULT NULL,
  quiet_hours_end TIME DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_member_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences FOR SELECT
USING (
  team_member_id IN (
    SELECT id FROM public.team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences FOR UPDATE
USING (
  team_member_id IN (
    SELECT id FROM public.team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (
  team_member_id IN (
    SELECT id FROM public.team_members WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification log table for tracking sent notifications
CREATE TABLE public.notification_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_team_member_id UUID REFERENCES public.team_members(id),
  lead_id UUID REFERENCES public.leads(id),
  proposal_id UUID REFERENCES public.proposals(id),
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notification log
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Allow team members to view notifications for their office
CREATE POLICY "Team members can view office notifications"
ON public.notification_log FOR SELECT
USING (
  recipient_team_member_id IN (
    SELECT tm.id FROM public.team_members tm
    WHERE tm.office_id IN (
      SELECT office_id FROM public.team_members WHERE user_id = auth.uid()
    )
  )
);