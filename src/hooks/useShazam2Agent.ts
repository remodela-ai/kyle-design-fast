import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";

const SHAZAM2_AGENT_ID = "agent_9301kbtp61qqf0hbtzpjkgjypazk";

export function useShazam2Agent() {
  const [error, setError] = useState<string | null>(null);

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
  }, [conversation]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    startConversation,
    stopConversation,
  };
}
