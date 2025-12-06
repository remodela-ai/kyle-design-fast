import { createContext, useContext, ReactNode } from "react";
import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

// Eric voice ID from ElevenLabs
const ERIC_VOICE_ID = "cjVigY5qzO86Huf0OWal";
const KYLE_AGENT_ID = "agent_7901k7fa0g8dfhft7a2v69ejya4m";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface KyleContextType {
  status: string;
  isSpeaking: boolean;
  isConnected: boolean;
  error: string | null;
  messages: ConversationMessage[];
  designSummary: string | null;
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  toggleConversation: () => Promise<void>;
  clearMessages: () => void;
}

const KyleContext = createContext<KyleContextType | null>(null);

function KyleProviderWithRouter({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [designSummary, setDesignSummary] = useState<string | null>(null);
  const navigate = useNavigate();

  // Extract design-related keywords from messages
  const extractDesignSummary = (allMessages: ConversationMessage[]) => {
    const designKeywords = allMessages
      .map(m => m.content)
      .join(" ");
    
    // Simple extraction - look for design-related terms
    const styleTerms = ["modern", "minimalist", "industrial", "bohemian", "scandinavian", "rustic", "contemporary", "traditional", "luxury", "cozy", "elegant", "warm", "cool", "bright", "dark"];
    const roomTerms = ["living room", "bedroom", "kitchen", "bathroom", "office", "dining room", "studio", "loft", "apartment"];
    const colorTerms = ["white", "black", "gray", "beige", "wood", "blue", "green", "neutral", "earth tones", "pastel"];
    
    const foundStyles = styleTerms.filter(term => 
      designKeywords.toLowerCase().includes(term)
    );
    const foundRooms = roomTerms.filter(term => 
      designKeywords.toLowerCase().includes(term)
    );
    const foundColors = colorTerms.filter(term => 
      designKeywords.toLowerCase().includes(term)
    );

    const summaryParts: string[] = [];
    if (foundRooms.length > 0) summaryParts.push(`Room: ${foundRooms.join(", ")}`);
    if (foundStyles.length > 0) summaryParts.push(`Style: ${foundStyles.join(", ")}`);
    if (foundColors.length > 0) summaryParts.push(`Colors: ${foundColors.join(", ")}`);

    return summaryParts.length > 0 ? summaryParts.join(" | ") : null;
  };

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
      
      // Handle different message types from ElevenLabs
      if (message && typeof message === "object") {
        const msg = message as { message?: string; source?: string; type?: string };
        
        // Only capture final transcriptions, not tentative ones
        if (msg.message && msg.source) {
          const newMessage: ConversationMessage = {
            role: msg.source === "user" ? "user" : "assistant",
            content: msg.message,
            timestamp: new Date(),
          };
          
          setMessages(prev => {
            const updated = [...prev, newMessage];
            // Update design summary with new messages
            const summary = extractDesignSummary(updated);
            setDesignSummary(summary);
            return updated;
          });
        }
      }
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
              prompt: `You are Kyle, an AI assistant for Next Interiors, a modern interior design company. 
              You help users explore design inspiration and navigate the platform.
              
              When users describe their design preferences, always acknowledge and summarize:
              - Room type (living room, bedroom, kitchen, etc.)
              - Style preferences (modern, minimalist, industrial, etc.)
              - Color preferences
              - Any specific elements they want
              
              You have access to tools to navigate between pages:
              - Use navigateToBlinkDesign when users want to explore design inspiration, generate ideas, or use Blink Design
              - Use navigateToHome when users want to go back to the main page
              
              Be helpful, creative, and guide users through the design experience. Ask clarifying questions about their design vision.`,
            },
            firstMessage: "Hello! I'm Kyle, your Next Interiors design assistant. Tell me about the space you'd like to design - what room, style, and atmosphere are you envisioning?",
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

  const clearMessages = useCallback(() => {
    setMessages([]);
    setDesignSummary(null);
  }, []);

  const value = {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    messages,
    designSummary,
    startConversation,
    stopConversation,
    toggleConversation,
    clearMessages,
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
