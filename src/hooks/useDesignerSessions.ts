import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDesignerProfile } from './useDesignerProfile';

export interface DesignerSession {
  id: string;
  session_id: string;
  designer_id: string | null;
  design_image_url: string | null;
  conversation_summary: string | null;
   project_name?: string | null;
   status?: string;
   pipeline_completed?: boolean;
   management_completed?: boolean;
   iteration_count?: number;
  created_at: string;
  updated_at: string;
}

 export interface CreateSessionParams {
   session_id: string;
   design_image_url?: string;
   conversation_summary?: string;
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

   // Create or update a session
   const upsertSession = useCallback(async (params: CreateSessionParams) => {
     const designerId = profile?.id;
     
     try {
       const { data, error: upsertError } = await supabase
         .from('project_sessions')
         .upsert({
           session_id: params.session_id,
           design_image_url: params.design_image_url || null,
           conversation_summary: params.conversation_summary || null,
           designer_id: designerId || null,
           updated_at: new Date().toISOString(),
         }, {
           onConflict: 'session_id'
         })
         .select()
         .single();
 
       if (upsertError) throw upsertError;
 
       // Update local state
       setSessions(prev => {
         const existing = prev.find(s => s.session_id === params.session_id);
         if (existing) {
           return prev.map(s => s.session_id === params.session_id ? (data as DesignerSession) : s);
         }
         return [data as DesignerSession, ...prev];
       });
 
       return { data: data as DesignerSession, error: null };
     } catch (err) {
       console.error('Error upserting session:', err);
       return { data: null, error: err instanceof Error ? err : new Error('Failed to save session') };
     }
   }, [profile?.id]);
 
   // Get a session by ID
   const getSession = useCallback(async (sessionId: string) => {
     try {
       const { data, error: fetchError } = await supabase
         .from('project_sessions')
         .select('*')
         .eq('session_id', sessionId)
         .single();
 
       if (fetchError) throw fetchError;
 
       return { data: data as DesignerSession, error: null };
     } catch (err) {
       console.error('Error fetching session:', err);
       return { data: null, error: err instanceof Error ? err : new Error('Failed to fetch session') };
     }
   }, []);
 
  return {
    sessions,
    loading,
    error,
    refreshSessions: fetchSessions,
    getDesignerId,
     upsertSession,
     getSession,
  };
};
