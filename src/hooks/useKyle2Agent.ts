import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

// Kyle 2 - Navigation agent (Next Interiors with custom prompt)
const ERIC_VOICE_ID = "cjVigY5qzO86Huf0OWal";
const KYLE2_AGENT_ID = "agent_7901k7fa0g8dfhft7a2v69ejya4m";

export function useKyle2Agent() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle 2 connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Kyle 2 disconnected");
    },
    onMessage: (message) => {
      console.log("Kyle 2 message:", message);
    },
    onError: (errorMessage) => {
      console.error("Kyle 2 error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Kyle 2");
    },
    clientTools: {
      navigateToBlinkDesign: async () => {
        console.log("Kyle 2: Navigating to Blink Design...");
        navigate("/blink-design");
        return "Successfully navigated to Blink Design page";
      },
      navigateToHome: async () => {
        console.log("Kyle 2: Navigating to Home...");
        navigate("/");
        return "Successfully navigated to Home page";
      },
    },
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: KYLE2_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            language: "en",
            prompt: {
              prompt: `You are an AI assistant for Next Interiors, a modern interior design company. 
              You help users explore design inspiration and navigate the platform.
              You have access to tools to navigate between pages:
              - Use navigateToBlinkDesign when users want to explore design inspiration or generate ideas
              - Use navigateToHome when users want to go back to the main page
              Be helpful, creative, and guide users through the design experience.`,
            },
            firstMessage: "Hello! I'm your Next Interiors assistant. How can I help you with your design journey today?",
          },
          tts: {
            voiceId: ERIC_VOICE_ID,
          },
        },
      });
    } catch (err) {
      console.error("Failed to start Kyle 2 conversation:", err);
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
