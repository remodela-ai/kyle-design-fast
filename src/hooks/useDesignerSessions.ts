import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDesignerProfile } from './useDesignerProfile';

export interface DesignerSession {
  id: string;
  session_id: string;
  designer_id: string | null;
  design_image_url: string | null;
  conversation_summary: string | null;
  created_at: string;
  updated_at: string;
}

export const useDesignerSessions = () => {
  const { profile } = useDesignerProfile();
  const [sessions, setSessions] = useState<DesignerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!profile?.id) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('project_sessions')
        .select('*')
        .eq('designer_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSessions((data || []) as DesignerSession[]);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Get the designer's profile ID for creating sessions
  const getDesignerId = useCallback(() => {
    return profile?.id || null;
  }, [profile?.id]);

  return {
    sessions,
    loading,
    error,
    refreshSessions: fetchSessions,
    getDesignerId,
  };
};
