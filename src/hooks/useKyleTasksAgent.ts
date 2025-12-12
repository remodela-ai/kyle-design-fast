import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";

const KYLE_TASKS_AGENT_ID = "agent_4501kc9n5339ffxaymhzm1d9cgen";

export function useKyleTasksAgent() {
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
