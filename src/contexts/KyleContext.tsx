import { createContext, useContext, ReactNode } from "react";
import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

// Eric voice ID from ElevenLabs
const ERIC_VOICE_ID = "cjVigY5qzO86Huf0OWal";
const KYLE_AGENT_ID = "agent_7901k7fa0g8dfhft7a2v69ejya4m";

interface KyleContextType {
  status: string;
  isSpeaking: boolean;
  isConnected: boolean;
  error: string | null;
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  toggleConversation: () => Promise<void>;
}

const KyleContext = createContext<KyleContextType | null>(null);

function KyleProviderWithRouter({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Next Interiors Agent connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Next Interiors Agent disconnected");
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: KYLE_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            language: "en",
            prompt: {
              prompt: `You are an AI assistant for Next Interiors, a modern interior design company. 
              You help users explore design inspiration and navigate the platform.
              You have access to tools to navigate between pages:
              - Use navigateToBlinkDesign when users want to explore design inspiration, generate ideas, or use Blink Design
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

  const value = {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    startConversation,
    stopConversation,
    toggleConversation,
  };

  return (
    <KyleContext.Provider value={value}>
      {children}
    </KyleContext.Provider>
  );
}

export function KyleProvider({ children }: { children: ReactNode }) {
  return <KyleProviderWithRouter>{children}</KyleProviderWithRouter>;
}

export function useKyle() {
  const context = useContext(KyleContext);
  if (!context) {
    throw new Error("useKyle must be used within a KyleProvider");
  }
  return context;
}
