import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";

// TODO: Replace with actual agent ID after creation
const SHAZAM3_AGENT_ID = "PLACEHOLDER_AGENT_ID";

interface Message {
  role: "user" | "agent";
  content: string;
}

export function useShazam3Agent() {
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Shazam 3 connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Shazam 3 disconnected");
    },
    onMessage: (message) => {
      console.log("Shazam 3 message:", message);
      
      // Capture messages for command detection using type guard
      const msg = message as { type?: string; user_transcript?: string; agent_response?: string };
      
      if (msg.type === "user_transcript" && msg.user_transcript) {
        setMessages(prev => [...prev, { role: "user", content: msg.user_transcript! }]);
      } else if (msg.type === "agent_response" && msg.agent_response) {
        setMessages(prev => [...prev, { role: "agent", content: msg.agent_response! }]);
      }
    },
    onError: (errorMessage) => {
      console.error("Shazam 3 error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Shazam 3");
    },
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with the Shazam 3 agent
      await conversation.startSession({
        agentId: SHAZAM3_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start Shazam 3 conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setMessages([]);
  }, [conversation]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    messages,
    startConversation,
    stopConversation,
  };
}
