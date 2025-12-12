import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KYLE_TASKS_AGENT_ID = "agent_4501kc9n5339ffxaymhzm1d9cgen";

interface TaskToolParams {
  title?: string;
  description?: string;
  due_date?: string;
  reminder_time?: string;
  priority?: string;
  task_id?: string;
}

interface AlarmToolParams {
  time: string;
  label?: string;
}

export function useKyleTasksAgent(onAlarmCreated?: () => void) {
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle Tasks connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Kyle Tasks disconnected");
    },
    onMessage: (message) => {
      console.log("Kyle Tasks message:", message);
    },
    onError: (errorMessage) => {
      console.error("Kyle Tasks error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Kyle");
    },
    clientTools: {
      create_task: async (params: TaskToolParams) => {
        console.log("Creating task:", params);
        try {
          const { data, error } = await supabase.functions.invoke('kyle-tasks', {
            body: {
              action: 'create',
              task: {
                title: params.title || "New task",
                description: params.description,
                due_date: params.due_date,
                reminder_time: params.reminder_time,
                priority: params.priority || 'medium',
              }
            }
          });
          
          if (error) throw error;
          return data?.message || "Task created successfully";
        } catch (err) {
          console.error("Error creating task:", err);
          return "Sorry, I couldn't create the task. Please try again.";
        }
      },
      
      complete_task: async (params: TaskToolParams) => {
        console.log("Completing task:", params);
        try {
          if (params.task_id) {
            const { data, error } = await supabase.functions.invoke('kyle-tasks', {
              body: { action: 'complete', task: { id: params.task_id } }
            });
            if (error) throw error;
            return data?.message || "Task completed";
          }
          
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('is_completed', false)
            .ilike('title', `%${params.title}%`)
            .limit(1);
          
          if (!tasks || tasks.length === 0) {
            return `I couldn't find a task matching "${params.title}"`;
          }
          
          const { data, error } = await supabase.functions.invoke('kyle-tasks', {
            body: { action: 'complete', task: { id: tasks[0].id } }
          });
          
          if (error) throw error;
          return data?.message || `Task "${tasks[0].title}" marked as complete`;
        } catch (err) {
          console.error("Error completing task:", err);
          return "Sorry, I couldn't complete the task. Please try again.";
        }
      },
      
      delete_task: async (params: TaskToolParams) => {
        console.log("Deleting task:", params);
        try {
          if (params.task_id) {
            const { data, error } = await supabase.functions.invoke('kyle-tasks', {
              body: { action: 'delete', task: { id: params.task_id } }
            });
            if (error) throw error;
            return data?.message || "Task deleted";
          }
          
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title')
            .ilike('title', `%${params.title}%`)
            .limit(1);
          
          if (!tasks || tasks.length === 0) {
            return `I couldn't find a task matching "${params.title}"`;
          }
          
          const { data, error } = await supabase.functions.invoke('kyle-tasks', {
            body: { action: 'delete', task: { id: tasks[0].id } }
          });
          
          if (error) throw error;
          return data?.message || `Task "${tasks[0].title}" deleted`;
        } catch (err) {
          console.error("Error deleting task:", err);
          return "Sorry, I couldn't delete the task. Please try again.";
        }
      },
      
      list_tasks: async () => {
        console.log("Listing tasks");
        try {
          const { data, error } = await supabase.functions.invoke('kyle-tasks', {
            body: { action: 'list', task: {} }
          });
          
          if (error) throw error;
          
          const tasks = data?.tasks || [];
          if (tasks.length === 0) {
            return "You don't have any pending tasks.";
          }
          
          const taskList = tasks.map((t: { title: string; priority: string }) => 
            `${t.title} (${t.priority} priority)`
          ).join(", ");
          
          return `You have ${tasks.length} pending tasks: ${taskList}`;
        } catch (err) {
          console.error("Error listing tasks:", err);
          return "Sorry, I couldn't get your tasks. Please try again.";
        }
      },
      
      set_alarm: async (params: AlarmToolParams) => {
        console.log("Setting alarm:", params);
        try {
          const { error } = await supabase
            .from('alarms')
            .insert({
              time: params.time,
              label: params.label || "Alarm",
              is_active: true,
            });
          
          if (error) throw error;
          
          if (onAlarmCreated) {
            onAlarmCreated();
          }
          
          return `Alarm set for ${params.time}${params.label ? ` - ${params.label}` : ""}`;
        } catch (err) {
          console.error("Error setting alarm:", err);
          return "Sorry, I couldn't set the alarm. Please try again.";
        }
      },
    },
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      await conversation.startSession({
        agentId: KYLE_TASKS_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleConversation = useCallback(async () => {
    if (conversation.status === "connected") {
      await stopConversation();
    } else {
      await startConversation();
    }
  }, [conversation.status, startConversation, stopConversation]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    startConversation,
    stopConversation,
    toggleConversation,
  };
}
