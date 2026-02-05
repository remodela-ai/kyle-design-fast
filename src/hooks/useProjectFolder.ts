 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useDesignerProfile } from './useDesignerProfile';
 
 export interface ProjectSession {
   id: string;
   session_id: string;
   designer_id: string | null;
   design_image_url: string | null;
   conversation_summary: string | null;
   project_name: string | null;
   status: string;
   pipeline_completed: boolean;
   management_completed: boolean;
   iteration_count: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface DesignIteration {
   id: string;
   designer_id: string;
   session_id: string | null;
   image_url: string;
   prompt: string | null;
   style_notes: string | null;
   metadata: Record<string, unknown> | null;
   created_at: string;
 }
 
 export interface PipelineStepData {
   id: string;
   session_id: string;
   step_number: number;
   step_name: string;
   status: string;
   visual_outcome_url: string | null;
   output_data: Record<string, unknown> | null;
   error_message: string | null;
   created_at: string;
 }
 
 export interface ProjectFolder {
   session: ProjectSession | null;
   iterations: DesignIteration[];
   pipelineSteps: PipelineStepData[];
   managementSteps: PipelineStepData[];
 }
 
 export function useProjectFolder(sessionId: string | null) {
   const { profile } = useDesignerProfile();
   const [folder, setFolder] = useState<ProjectFolder>({
     session: null,
     iterations: [],
     pipelineSteps: [],
     managementSteps: [],
   });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const fetchFolder = useCallback(async () => {
     if (!sessionId) {
       setLoading(false);
       return;
     }
 
     try {
       setLoading(true);
       setError(null);
 
       // Fetch session, iterations, and pipeline steps in parallel
       const [sessionRes, iterationsRes, stepsRes] = await Promise.all([
         supabase
           .from('project_sessions')
           .select('*')
           .eq('session_id', sessionId)
           .single(),
         supabase
           .from('design_generations')
           .select('*')
           .eq('session_id', sessionId)
           .order('created_at', { ascending: true }),
         supabase
           .from('pipeline_steps')
           .select('*')
           .eq('session_id', sessionId)
           .order('step_number', { ascending: true }),
       ]);
 
       if (sessionRes.error && sessionRes.error.code !== 'PGRST116') {
         throw sessionRes.error;
       }
 
       const allSteps = (stepsRes.data || []) as PipelineStepData[];
       const pipelineSteps = allSteps.filter(s => s.step_number <= 8);
       const managementSteps = allSteps.filter(s => s.step_number > 8);
 
       setFolder({
         session: sessionRes.data as ProjectSession | null,
         iterations: (iterationsRes.data || []) as DesignIteration[],
         pipelineSteps,
         managementSteps,
       });
     } catch (err) {
       console.error('Error fetching project folder:', err);
       setError(err instanceof Error ? err.message : 'Failed to fetch project');
     } finally {
       setLoading(false);
     }
   }, [sessionId]);
 
   useEffect(() => {
     fetchFolder();
   }, [fetchFolder]);
 
   // Add a new iteration to the project
   const addIteration = useCallback(async (imageUrl: string, prompt: string, metadata?: Record<string, unknown>) => {
     if (!sessionId || !profile?.id) return { error: new Error('No session or profile') };
 
     try {
       const { data, error: insertError } = await supabase
         .from('design_generations')
         .insert([{
           designer_id: profile.id,
           session_id: sessionId,
           image_url: imageUrl,
           prompt,
           metadata: (metadata || {}) as Record<string, never>,
         }])
         .select()
         .single();
 
       if (insertError) throw insertError;
 
       // Update local state
       setFolder(prev => ({
         ...prev,
         iterations: [...prev.iterations, data as DesignIteration],
       }));
 
       // Update iteration count in session
       await supabase
         .from('project_sessions')
         .update({ 
           iteration_count: folder.iterations.length + 1,
           design_image_url: imageUrl,
           updated_at: new Date().toISOString(),
         })
         .eq('session_id', sessionId);
 
       return { data, error: null };
     } catch (err) {
       console.error('Error adding iteration:', err);
       return { data: null, error: err };
     }
   }, [sessionId, profile?.id, folder.iterations.length]);
 
   // Update session metadata
   const updateSession = useCallback(async (updates: Partial<ProjectSession>) => {
     if (!sessionId) return { error: new Error('No session') };
 
     try {
       const { data, error: updateError } = await supabase
         .from('project_sessions')
         .update({
           ...updates,
           updated_at: new Date().toISOString(),
         })
         .eq('session_id', sessionId)
         .select()
         .single();
 
       if (updateError) throw updateError;
 
       setFolder(prev => ({
         ...prev,
         session: data as ProjectSession,
       }));
 
       return { data, error: null };
     } catch (err) {
       console.error('Error updating session:', err);
       return { data: null, error: err };
     }
   }, [sessionId]);
 
   // Mark pipeline as complete
   const markPipelineComplete = useCallback(async () => {
     return updateSession({ pipeline_completed: true });
   }, [updateSession]);
 
   // Mark management as complete
   const markManagementComplete = useCallback(async () => {
     return updateSession({ management_completed: true });
   }, [updateSession]);
 
   return {
     folder,
     loading,
     error,
     refresh: fetchFolder,
     addIteration,
     updateSession,
     markPipelineComplete,
     markManagementComplete,
   };
 }