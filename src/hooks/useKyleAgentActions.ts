import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface KyleTask {
  id: string;
  status: 'pending' | 'working' | 'completed' | 'failed';
  command: string;
  result?: unknown;
  startedAt: Date;
  completedAt?: Date;
}

interface KyleActionContext {
  lead_id?: string;
  office_id?: string;
  conversation_transcript?: string;
  additional_context?: string;
}

// Command patterns that trigger background tasks
const TASK_TRIGGERS = [
  { pattern: /investiga|research|busca información|find out|look up/i, type: 'research' as const },
  { pattern: /crea|create|genera|generate|diseña|design/i, type: 'create' as const },
  { pattern: /analiza|analyze|revisa|review|evalua|evaluate/i, type: 'analyze' as const },
  { pattern: /automatiza|automate|programa|schedule|configura|setup/i, type: 'automate' as const },
];

export function useKyleAgentActions() {
  const [activeTasks, setActiveTasks] = useState<KyleTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
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
      title: "🔄 Kyle está trabajando",
      description: "Procesando tu solicitud...",
    });

    try {
      // Update to working status
      setActiveTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, status: 'working' as const } : t)
      );

      const { data, error } = await supabase.functions.invoke('kyle-manus-bridge', {
        body: {
          command,
          context,
          action_type: actionType || detectTaskType(command) || 'research',
        }
      });

      if (error) throw error;

      const completedTask: KyleTask = {
        ...newTask,
        status: 'completed',
        result: data,
        completedAt: new Date(),
      };

      setActiveTasks(prev => 
        prev.map(t => t.id === taskId ? completedTask : t)
      );

      toast({
        title: "✅ Tarea completada",
        description: "Kyle ha terminado de procesar tu solicitud.",
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
        description: "No pude completar la tarea. Intenta de nuevo.",
      });

      return failedTask;
    } finally {
      setIsProcessing(false);
    }
  }, [detectTaskType, toast]);

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
