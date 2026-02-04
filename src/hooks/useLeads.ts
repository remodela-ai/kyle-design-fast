import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'proposal_sent' | 'converted' | 'lost';

export interface Lead {
  id: string;
  office_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  project_type: string | null;
  room_dimensions: Json;
  style_preferences: string[];
  appliance_brands: string[];
  plumbing_brands: string[];
  furniture_brands: string[];
  budget_min: number | null;
  budget_max: number | null;
  budget_flexibility: string | null;
  conversation_transcript: string | null;
  conversation_id: string | null;
  extracted_insights: Json;
  preliminary_design_url: string | null;
  moodboard_url: string | null;
  status: LeadStatus;
  qualified_at: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadMessage {
  id: string;
  lead_id: string;
  sender: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export function useLeads(officeId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ['leads', officeId],
    queryFn: async () => {
      if (!officeId) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('office_id', officeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!officeId,
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      const updateData: { status: LeadStatus; qualified_at?: string } = { status };
      if (status === 'qualified') {
        updateData.qualified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', officeId] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      toast({
        title: "Lead updated",
        description: "Lead status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignLead = useMutation({
    mutationFn: async ({ leadId, teamMemberId }: { leadId: string; teamMemberId: string | null }) => {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: teamMemberId })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', officeId] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      toast({
        title: "Lead assigned",
        description: "Lead has been assigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    error: leadsQuery.error,
    refetch: leadsQuery.refetch,
    updateLeadStatus,
    assignLead,
  };
}

export function useLead(leadId: string | null) {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!leadId,
  });
}

export function useLeadMessages(leadId: string | null) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['lead-messages', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('lead_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as LeadMessage[];
    },
    enabled: !!leadId,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, sender }: { content: string; sender: string }) => {
      if (!leadId) throw new Error('No lead ID');
      
      const { error } = await supabase
        .from('lead_messages')
        .insert({
          lead_id: leadId,
          content,
          sender,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-messages', leadId] });
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage,
  };
}
