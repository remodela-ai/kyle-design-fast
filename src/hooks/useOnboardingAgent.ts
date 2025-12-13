import { useConversation } from "@11labs/react";
import { useCallback, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export function useOnboardingAgent(personName: string) {
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [sessionFocus, setSessionFocus] = useState<string>("");
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const messagesRef = useRef<OnboardingMessage[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Onboarding agent connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Onboarding agent disconnected");
    },
    onMessage: (message: any) => {
      console.log("Onboarding message:", message);
      
      // Capture messages for transcript
      if (message.type === 'user_transcript' && message.user_transcription_event?.user_transcript) {
        const newMessage: OnboardingMessage = {
          role: 'user',
          content: message.user_transcription_event.user_transcript,
          timestamp: new Date()
        };
        messagesRef.current = [...messagesRef.current, newMessage];
        setMessages([...messagesRef.current]);
      }
      
      if (message.type === 'agent_response' && message.agent_response_event?.agent_response) {
        const newMessage: OnboardingMessage = {
          role: 'agent',
          content: message.agent_response_event.agent_response,
          timestamp: new Date()
        };
        messagesRef.current = [...messagesRef.current, newMessage];
        setMessages([...messagesRef.current]);
      }
    },
    onError: (errorMessage) => {
      console.error("Onboarding agent error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to agent");
    },
  });

  const createOnboardingAgent = useCallback(async (
    sessionNumber: number, 
    previousInsights: any,
    language: string = 'es'
  ) => {
    setIsCreatingAgent(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-kyle-onboarding-agent', {
        body: { 
          personName, 
          sessionNumber, 
          previousInsights,
          language 
        }
      });

      if (fnError) throw fnError;
      if (!data?.agentId) throw new Error('No agent ID returned');

      setAgentId(data.agentId);
      setSessionFocus(data.sessionFocus || '');
      return data.agentId;
    } catch (err) {
      console.error('Failed to create onboarding agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agent');
      return null;
    } finally {
      setIsCreatingAgent(false);
    }
  }, [personName]);

  const startConversation = useCallback(async (agentIdToUse?: string) => {
    const id = agentIdToUse || agentId;
    if (!id) {
      setError('No agent ID available');
      return;
    }

    try {
      // Reset messages for new session
      messagesRef.current = [];
      setMessages([]);

      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      await conversation.startSession({
        agentId: id,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }, [conversation, agentId]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const getTranscript = useCallback(() => {
    return messagesRef.current.map(m => 
      `${m.role === 'user' ? personName : 'Kyle'}: ${m.content}`
    ).join('\n\n');
  }, [personName]);

  const extractInsights = useCallback(async (
    sessionNumber: number,
    existingProfile: any
  ) => {
    const transcript = getTranscript();
    if (!transcript) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('extract-onboarding-insights', {
        body: {
          personName,
          transcript,
          sessionNumber,
          existingProfile
        }
      });

      if (fnError) throw fnError;
      return data?.insights || null;
    } catch (err) {
      console.error('Failed to extract insights:', err);
      return null;
    }
  }, [personName, getTranscript]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    isCreatingAgent,
    error,
    agentId,
    sessionFocus,
    messages,
    createOnboardingAgent,
    startConversation,
    stopConversation,
    getTranscript,
    extractInsights,
  };
}
