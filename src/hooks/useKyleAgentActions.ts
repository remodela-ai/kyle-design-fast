import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useKustrOffice } from "@/contexts/KustrOfficeContext";

export interface KyleTask {
  id: string;
  status: 'pending' | 'working' | 'completed' | 'failed';
  command: string;
  result?: unknown;
  startedAt: Date;
  completedAt?: Date;
  connectorsUsed?: number;
}

interface KyleActionContext {
  lead_id?: string;
  office_id?: string;
  team_member_id?: string;
  conversation_transcript?: string;
  additional_context?: string;
}

// Command patterns that trigger background tasks
const TASK_TRIGGERS = [
  { pattern: /research|find out|look up|investigate/i, type: 'research' as const },
  { pattern: /create|generate|design/i, type: 'create' as const },
  { pattern: /analyze|review|evaluate/i, type: 'analyze' as const },
  { pattern: /automate|schedule|setup|configure/i, type: 'automate' as const },
];

export function useKyleAgentActions() {
  const [activeTasks, setActiveTasks] = useState<KyleTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { teamMember, office } = useKustrOffice();
  const taskIdCounter = useRef(0);

  const detectTaskType = useCallback((command: string): 'research' | 'create' | 'analyze' | 'automate' | null => {
    for (const trigger of TASK_TRIGGERS) {
      if (trigger.pattern.test(command)) {
        return trigger.type;
      }
    }
    return null;
  }, []);

  const executeTask = useCallback(async (
    command: string,
    context?: KyleActionContext,
    actionType?: 'research' | 'create' | 'analyze' | 'automate'
  ): Promise<KyleTask> => {
    const taskId = `kyle-task-${++taskIdCounter.current}-${Date.now()}`;
    
    const newTask: KyleTask = {
      id: taskId,
      status: 'pending',
      command,
      startedAt: new Date(),
    };

    setActiveTasks(prev => [...prev, newTask]);
    setIsProcessing(true);

    // Show abstract message - no mention of external services
    toast({
      title: "🔄 Kyle is working",
      description: "Processing your request...",
    });

    try {
      // Update to working status
      setActiveTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, status: 'working' as const } : t)
      );

      // Automatically inject team_member_id and office_id from context
      const enrichedContext: KyleActionContext = {
        ...context,
        team_member_id: context?.team_member_id || teamMember?.id,
        office_id: context?.office_id || office?.id,
      };

      const { data, error } = await supabase.functions.invoke('kyle-manus-bridge', {
        body: {
          command,
          context: enrichedContext,
          action_type: actionType || detectTaskType(command) || 'research',
        }
      });

      if (error) throw error;

      const completedTask: KyleTask = {
        ...newTask,
        status: 'completed',
        result: data,
        completedAt: new Date(),
        connectorsUsed: data?.connectors_used || 0,
      };

      setActiveTasks(prev => 
        prev.map(t => t.id === taskId ? completedTask : t)
      );

    const connectorsMsg = completedTask.connectorsUsed 
        ? ` (${completedTask.connectorsUsed} tools used)`
        : '';

      toast({
        title: "✅ Task completed",
        description: `Kyle has finished processing your request${connectorsMsg}.`,
      });

      return completedTask;

    } catch (err) {
      console.error('[KyleAgentActions] Task failed:', err);
      
      const failedTask: KyleTask = {
        ...newTask,
        status: 'failed',
        result: { error: err instanceof Error ? err.message : 'Unknown error' },
        completedAt: new Date(),
      };

      setActiveTasks(prev => 
        prev.map(t => t.id === taskId ? failedTask : t)
      );

      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not complete the task. Please try again.",
      });

      return failedTask;
    } finally {
      setIsProcessing(false);
    }
  }, [detectTaskType, toast, teamMember?.id, office?.id]);

  const shouldTriggerTask = useCallback((transcript: string): boolean => {
    return TASK_TRIGGERS.some(trigger => trigger.pattern.test(transcript));
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setActiveTasks(prev => prev.filter(t => t.status === 'pending' || t.status === 'working'));
  }, []);

  const getLatestResult = useCallback(() => {
    const completed = activeTasks.filter(t => t.status === 'completed');
    return completed.length > 0 ? completed[completed.length - 1] : null;
  }, [activeTasks]);

  return {
    activeTasks,
    isProcessing,
    executeTask,
    shouldTriggerTask,
    detectTaskType,
    clearCompletedTasks,
    getLatestResult,
  };
}
