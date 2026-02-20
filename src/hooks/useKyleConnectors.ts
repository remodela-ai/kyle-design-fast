import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useKustrOffice } from "@/contexts/KustrOfficeContext";
import { useToast } from "@/hooks/use-toast";

export type ConnectorType = 
  | 'gmail' 
  | 'google_calendar' 
  | 'notion' 
  | 'slack' 
  | 'github' 
  | 'google_drive';

export interface KyleConnector {
  id: string;
  team_member_id: string;
  office_id: string;
  connector_type: ConnectorType;
  connector_uuid: string;
  display_name: string | null;
  is_active: boolean;
  connected_at: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectorConfig {
  type: ConnectorType;
  name: string;
  icon: string;
  description: string;
}

export const AVAILABLE_CONNECTORS: ConnectorConfig[] = [
  {
    type: 'gmail',
    name: 'Gmail',
    icon: '📧',
    description: 'Kyle can read and manage your email',
  },
  {
    type: 'google_calendar',
    name: 'Google Calendar',
    icon: '📅',
    description: 'Kyle can schedule appointments and check your calendar',
  },
  {
    type: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Kyle accesses your knowledge base and documents',
  },
  {
    type: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Kyle can send notifications and messages',
  },
  {
    type: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Kyle can review repositories and code',
  },
  {
    type: 'google_drive',
    name: 'Google Drive',
    icon: '📁',
    description: 'Kyle accesses your cloud files',
  },
];

export function useKyleConnectors() {
  const [connectors, setConnectors] = useState<KyleConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const { teamMember, office } = useKustrOffice();
  const { toast } = useToast();

  const fetchConnectors = useCallback(async () => {
    if (!teamMember?.id) {
      setConnectors([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('kyle_connectors')
        .select('*')
        .eq('team_member_id', teamMember.id)
        .order('connector_type');

      if (error) throw error;
      
      // Cast the data to our type since the DB types aren't updated yet
      setConnectors((data || []) as unknown as KyleConnector[]);
    } catch (error) {
      console.error('Error fetching connectors:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load connections",
      });
    } finally {
      setLoading(false);
    }
  }, [teamMember?.id, toast]);

  const addConnector = useCallback(async (
    type: ConnectorType, 
    uuid: string, 
    displayName?: string
  ): Promise<boolean> => {
    if (!teamMember?.id || !office?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must sign in to connect tools",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('kyle_connectors')
        .insert({
          team_member_id: teamMember.id,
          office_id: office.id,
          connector_type: type,
          connector_uuid: uuid,
          display_name: displayName || null,
        });

      if (error) throw error;

      toast({
        title: "✓ Connected",
        description: `${AVAILABLE_CONNECTORS.find(c => c.type === type)?.name} connected successfully`,
      });

      await fetchConnectors();
      return true;
    } catch (error: any) {
      console.error('Error adding connector:', error);
      
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Already connected",
          description: "This tool is already connected to your account",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not connect the tool",
        });
      }
      return false;
    }
  }, [teamMember?.id, office?.id, toast, fetchConnectors]);

  const removeConnector = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('kyle_connectors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: "The tool has been disconnected",
      });

      await fetchConnectors();
      return true;
    } catch (error) {
      console.error('Error removing connector:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not disconnect the tool",
      });
      return false;
    }
  }, [toast, fetchConnectors]);

  const toggleConnector = useCallback(async (
    id: string, 
    isActive: boolean
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('kyle_connectors')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isActive ? "Activated" : "Deactivated",
        description: `The tool has been ${isActive ? 'activated' : 'deactivated'}`,
      });

      await fetchConnectors();
      return true;
    } catch (error) {
      console.error('Error toggling connector:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update the status",
      });
      return false;
    }
  }, [toast, fetchConnectors]);

  const getConnectorByType = useCallback((type: ConnectorType): KyleConnector | undefined => {
    return connectors.find(c => c.connector_type === type);
  }, [connectors]);

  const getActiveConnectorTypes = useCallback((): ConnectorType[] => {
    return connectors
      .filter(c => c.is_active)
      .map(c => c.connector_type);
  }, [connectors]);

  const getActiveConnectorUuids = useCallback((): string[] => {
    return connectors
      .filter(c => c.is_active)
      .map(c => c.connector_uuid);
  }, [connectors]);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  return {
    connectors,
    loading,
    addConnector,
    removeConnector,
    toggleConnector,
    getConnectorByType,
    getActiveConnectorTypes,
    getActiveConnectorUuids,
    refetch: fetchConnectors,
  };
}
