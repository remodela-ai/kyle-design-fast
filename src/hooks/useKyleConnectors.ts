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
    description: 'Kyle puede leer y gestionar tu correo electrónico',
  },
  {
    type: 'google_calendar',
    name: 'Google Calendar',
    icon: '📅',
    description: 'Kyle puede agendar citas y revisar tu calendario',
  },
  {
    type: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Kyle accede a tu base de conocimiento y documentos',
  },
  {
    type: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Kyle puede enviar notificaciones y mensajes',
  },
  {
    type: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Kyle puede revisar repositorios y código',
  },
  {
    type: 'google_drive',
    name: 'Google Drive',
    icon: '📁',
    description: 'Kyle accede a tus archivos en la nube',
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
        description: "No se pudieron cargar las conexiones",
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
        description: "Debes iniciar sesión para conectar herramientas",
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
        title: "✓ Conectado",
        description: `${AVAILABLE_CONNECTORS.find(c => c.type === type)?.name} conectado exitosamente`,
      });

      await fetchConnectors();
      return true;
    } catch (error: any) {
      console.error('Error adding connector:', error);
      
      if (error.code === '23505') {
        toast({
          variant: "destructive",
          title: "Ya conectado",
          description: "Esta herramienta ya está conectada a tu cuenta",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo conectar la herramienta",
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
        title: "Desconectado",
        description: "La herramienta ha sido desconectada",
      });

      await fetchConnectors();
      return true;
    } catch (error) {
      console.error('Error removing connector:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo desconectar la herramienta",
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
        title: isActive ? "Activado" : "Desactivado",
        description: `La herramienta ha sido ${isActive ? 'activada' : 'desactivada'}`,
      });

      await fetchConnectors();
      return true;
    } catch (error) {
      console.error('Error toggling connector:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado",
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
