import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";

// Kyle 1 - Basic public agent (legacy)
const KYLE1_AGENT_ID = "agent_7901k7fa0g8dfhft7a2v69ejya4m";

export function useKyle1Agent() {
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle 1 connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Kyle 1 disconnected");
    },
    onMessage: (message) => {
      console.log("Kyle 1 message:", message);
    },
    onError: (errorMessage) => {
      console.error("Kyle 1 error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Kyle 1");
    },
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: KYLE1_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start Kyle 1 conversation:", err);
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
