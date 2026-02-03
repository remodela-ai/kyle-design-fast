import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

// Eric voice ID from ElevenLabs
const ERIC_VOICE_ID = "cjVigY5qzO86Huf0OWal";

// Using the same public agent but with overrides for James Kuster
const KYLE_AGENT_ID = "agent_7901k7fa0g8dfhft7a2v69ejya4m";

export function useNextInteriorsAgent() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const conversation = useConversation({
    onConnect: () => {
      console.log("James Kuster Agent connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("James Kuster Agent disconnected");
    },
    onMessage: (message) => {
      console.log("Agent message:", message);
    },
    onError: (errorMessage) => {
      console.error("Agent error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to agent");
    },
    clientTools: {
      navigateToBlinkDesign: async () => {
        console.log("Navigating to Blink Design...");
        navigate("/blink-design");
        return "Successfully navigated to Blink Design page";
      },
      navigateToHome: async () => {
        console.log("Navigating to Home...");
        navigate("/");
        return "Successfully navigated to Home page";
      },
    },
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with overrides for James Kuster
      await conversation.startSession({
        agentId: KYLE_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            language: "en",
            prompt: {
              prompt: `You are an AI assistant for James Kuster, a modern interior design company. 
              You help users explore design inspiration and navigate the platform.
              You have access to tools to navigate between pages:
              - Use navigateToBlinkDesign when users want to explore design inspiration or generate ideas
              - Use navigateToHome when users want to go back to the main page
              Be helpful, creative, and guide users through the design experience.`,
            },
            firstMessage: "Hello! I'm your James Kuster assistant. How can I help you with your design journey today?",
          },
          tts: {
            voiceId: ERIC_VOICE_ID,
          },
        },
      });
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }, [conversation, navigate]);

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
    navigate,
  };
}
