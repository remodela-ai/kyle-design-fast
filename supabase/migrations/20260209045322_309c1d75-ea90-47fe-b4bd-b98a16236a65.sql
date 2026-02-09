-- Create enum for connector types
CREATE TYPE connector_type AS ENUM ('gmail', 'google_calendar', 'notion', 'slack', 'github', 'google_drive');

-- Create table for storing user connectors
CREATE TABLE kyle_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
    connector_type connector_type NOT NULL,
    connector_uuid TEXT NOT NULL,
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_member_id, connector_type)
);

-- Enable RLS
ALTER TABLE kyle_connectors ENABLE ROW LEVEL SECURITY;

-- Users can view their own connectors
CREATE POLICY "Users can view their own connectors"
ON kyle_connectors FOR SELECT
USING (team_member_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
));

-- Users can insert their own connectors
CREATE POLICY "Users can insert their own connectors"
ON kyle_connectors FOR INSERT
WITH CHECK (team_member_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
));

-- Users can update their own connectors
CREATE POLICY "Users can update their own connectors"
ON kyle_connectors FOR UPDATE
USING (team_member_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
));

-- Users can delete their own connectors
CREATE POLICY "Users can delete their own connectors"
ON kyle_connectors FOR DELETE
USING (team_member_id IN (
    SELECT id FROM team_members WHERE user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_kyle_connectors_updated_at
BEFORE UPDATE ON kyle_connectors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();