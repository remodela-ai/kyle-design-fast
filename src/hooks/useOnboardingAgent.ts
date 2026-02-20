import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const AUTO_SAVE_INTERVAL = 60000; // Save every 60 seconds

export function useOnboardingAgent(personName: string) {
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionFocus, setSessionFocus] = useState<string>("");
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const messagesRef = useRef<OnboardingMessage[]>([]);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionNumberRef = useRef<number>(1);
  const agentIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    agentIdRef.current = agentId;
  }, [agentId]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Auto-save function to persist transcript periodically
  const autoSaveTranscript = useCallback(async () => {
    if (messagesRef.current.length === 0) return;
    
    const transcript = messagesRef.current.map(m => 
      `${m.role === 'user' ? personName : 'Kyle'}: ${m.content}`
    ).join('\n\n');

    try {
      // Save a draft/backup of the conversation
      await supabase.from('onboarding_sessions').insert({
        person_name: personName,
        session_number: currentSessionNumberRef.current,
        conversation_transcript: transcript,
        session_focus: `Auto-saved draft - ${new Date().toLocaleString()}`,
        extracted_insights: {
          auto_saved: true,
          message_count: messagesRef.current.length,
          agent_id: agentIdRef.current,
          conversation_id: conversationIdRef.current,
          saved_at: new Date().toISOString(),
        }
      });
      
      setLastAutoSave(new Date());
      console.log('Auto-saved transcript with', messagesRef.current.length, 'messages');
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [personName]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Onboarding agent connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Onboarding agent disconnected");
      // Auto-save on disconnect
      if (messagesRef.current.length > 0) {
        autoSaveTranscript();
      }
    },
    onMessage: (message: any) => {
      console.log("Onboarding message:", message);
      
      // Capture conversation_id from initiation metadata
      if (message.type === 'conversation_initiation_metadata' && message.conversation_initiation_metadata_event?.conversation_id) {
        setConversationId(message.conversation_initiation_metadata_event.conversation_id);
        console.log("Conversation ID:", message.conversation_initiation_metadata_event.conversation_id);
      }
      
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
      // Try to save on error too
      if (messagesRef.current.length > 0) {
        autoSaveTranscript();
      }
    },
  });

  // Set up auto-save interval when connected
  useEffect(() => {
    if (conversation.status === "connected") {
      // Start auto-save interval
      autoSaveIntervalRef.current = setInterval(autoSaveTranscript, AUTO_SAVE_INTERVAL);
      console.log('Auto-save enabled (every 60s)');
    } else {
      // Clear interval when disconnected
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [conversation.status, autoSaveTranscript]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (messagesRef.current.length > 0) {
        autoSaveTranscript();
      }
    };
  }, [autoSaveTranscript]);

  const createOnboardingAgent = useCallback(async (
    sessionNumber: number, 
    previousInsights: any,
    language: string = 'es'
  ) => {
    setIsCreatingAgent(true);
    currentSessionNumberRef.current = sessionNumber;
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
      setConversationId(null);

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

  // Recover conversation from ElevenLabs API
  const recoverConversation = useCallback(async (specificConversationId?: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('recover-elevenlabs-conversation', {
        body: {
          agentId: agentId,
          conversationId: specificConversationId,
          personName,
          sessionNumber: currentSessionNumberRef.current
        }
      });

      if (fnError) throw fnError;
      return data;
    } catch (err) {
      console.error('Failed to recover conversation:', err);
      return null;
    }
  }, [agentId, personName]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    isCreatingAgent,
    error,
    agentId,
    conversationId,
    sessionFocus,
    messages,
    lastAutoSave,
    createOnboardingAgent,
    startConversation,
    stopConversation,
    getTranscript,
    extractInsights,
    recoverConversation,
    autoSaveTranscript,
  };
}
