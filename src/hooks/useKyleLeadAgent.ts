import { useConversation } from "@11labs/react";
import { useCallback, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Default public lead agent ID - can be overridden per office
const DEFAULT_LEAD_AGENT_ID = "agent_7901k7fa0g8dfhft7a2v69ejya4m";

interface UseKyleLeadAgentProps {
  officeId: string;
  agentId?: string;
  onLeadCaptured?: (leadId: string) => void;
}

export function useKyleLeadAgent({ officeId, agentId, onLeadCaptured }: UseKyleLeadAgentProps) {
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const transcriptRef = useRef<string[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle Lead Agent connected");
      setError(null);
      transcriptRef.current = [];
    },
    onDisconnect: async () => {
      console.log("Kyle Lead Agent disconnected");
      // Capture lead on disconnect if we have conversation data
      if (transcriptRef.current.length > 0) {
        await captureLead();
      }
    },
    onMessage: (message) => {
      console.log("Kyle Lead Agent message:", message);
      // Collect transcript messages - message is of type MessagePayload
      // We need to handle different message types based on the structure
      if (message && typeof message === 'object') {
        const msg = message as unknown as Record<string, unknown>;
        if ('user_transcription_event' in msg) {
          const event = msg.user_transcription_event as { user_transcript?: string };
          if (event?.user_transcript) {
            transcriptRef.current.push(`User: ${event.user_transcript}`);
          }
        } else if ('agent_response_event' in msg) {
          const event = msg.agent_response_event as { agent_response?: string };
          if (event?.agent_response) {
            transcriptRef.current.push(`Kyle: ${event.agent_response}`);
          }
        }
      }
    },
    onError: (errorMessage) => {
      console.error("Kyle Lead Agent error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Kyle");
    },
  });

  const captureLead = useCallback(async (additionalData?: { name?: string; email?: string; phone?: string }) => {
    if (isCapturing) return;
    
    setIsCapturing(true);
    try {
      const transcript = transcriptRef.current.join('\n');
      
      const { data, error: captureError } = await supabase.functions.invoke('kyle-lead-capture', {
        body: {
          office_id: officeId,
          conversation_id: conversation.getId?.() || `conv_${Date.now()}`,
          conversation_transcript: transcript,
          name: additionalData?.name,
          email: additionalData?.email,
          phone: additionalData?.phone,
        }
      });

      if (captureError) {
        console.error("Lead capture error:", captureError);
        throw captureError;
      }

      console.log("Lead captured:", data);
      if (data?.lead_id && onLeadCaptured) {
        onLeadCaptured(data.lead_id);
      }

      return data;
    } catch (err) {
      console.error("Failed to capture lead:", err);
      setError(err instanceof Error ? err.message : "Failed to capture lead");
    } finally {
      setIsCapturing(false);
    }
  }, [officeId, isCapturing, onLeadCaptured, conversation]);

  const startConversation = useCallback(async () => {
    try {
      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with the lead agent
      await conversation.startSession({
        agentId: agentId || DEFAULT_LEAD_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start lead conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }, [conversation, agentId]);

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
    isCapturing,
    error,
    startConversation,
    stopConversation,
    toggleConversation,
    captureLead,
    transcript: transcriptRef.current,
  };
}
