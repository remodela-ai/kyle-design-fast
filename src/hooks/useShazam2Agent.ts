import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";

const SHAZAM2_AGENT_ID = "agent_9301kbtp61qqf0hbtzpjkgjypazk";

interface Message {
  role: "user" | "agent";
  content: string;
}

export function useShazam2Agent() {
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Shazam 2 connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Shazam 2 disconnected");
    },
    onMessage: (message) => {
      console.log("Shazam 2 message:", message);
      
      // Capture messages for command detection using type guard
      const msg = message as { type?: string; user_transcript?: string; agent_response?: string };
      
      if (msg.type === "user_transcript" && msg.user_transcript) {
        setMessages(prev => [...prev, { role: "user", content: msg.user_transcript! }]);
      } else if (msg.type === "agent_response" && msg.agent_response) {
        setMessages(prev => [...prev, { role: "agent", content: msg.agent_response! }]);
      }
    },
    onError: (errorMessage) => {
      console.error("Shazam 2 error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Shazam 2");
    },
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with the Shazam 2 agent
      await conversation.startSession({
        agentId: SHAZAM2_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start Shazam 2 conversation:", err);
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
