import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const KYLE_TASKS_AGENT_ID = "agent_4501kc9n5339ffxaymhzm1d9cgen";

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useKyleTasksAgent(onAlarmCreated?: () => void, onTasksChanged?: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const conversationHistoryRef = useRef<ConversationMessage[]>([]);
  const { toast } = useToast();

  const processVoiceCommand = useCallback(async (userMessage: string) => {
    console.log("Processing voice command:", userMessage);
    setIsProcessingCommand(true);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('kyle-tasks-ai', {
        body: {
          userMessage,
          conversationHistory: conversationHistoryRef.current.slice(-6) // Last 6 messages for context
        }
      });

      if (fnError) throw fnError;

      console.log("Command result:", data);

      // Add to conversation history
      conversationHistoryRef.current.push({ role: 'user', content: userMessage });
      conversationHistoryRef.current.push({ role: 'assistant', content: data?.message || 'Done' });

      // Notify about changes
      if (data?.success) {
        if (data.action === 'set_alarm' && onAlarmCreated) {
          onAlarmCreated();
        }
        if (['create_task', 'complete_task', 'delete_task'].includes(data.action) && onTasksChanged) {
          onTasksChanged();
        }
        
        toast({
          title: "Command executed",
          description: data.message,
        });
      } else if (data?.message) {
        toast({
          title: "Kyle",
          description: data.message,
          variant: "default",
        });
      }

      return data;
    } catch (err) {
      console.error("Error processing command:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to process command",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessingCommand(false);
    }
  }, [onAlarmCreated, onTasksChanged, toast]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle Tasks connected");
      setError(null);
      conversationHistoryRef.current = []; // Reset history on new conversation
    },
    onDisconnect: () => {
      console.log("Kyle Tasks disconnected");
    },
    onMessage: async (message) => {
      console.log("Kyle Tasks message:", message);
      
      // Detect user messages and process them through our AI
      if (message.source === 'user' && message.message && typeof message.message === 'string') {
        const userText = message.message.trim();
        if (userText.length > 2) {
          // Process the voice command through Lovable AI
          await processVoiceCommand(userText);
        }
      }
    },
    onError: (errorMessage) => {
      console.error("Kyle Tasks error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Kyle");
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
    isProcessingCommand,
    error,
    startConversation,
    stopConversation,
    toggleConversation,
    processVoiceCommand, // Expose for manual testing
  };
}
