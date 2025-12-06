import { createContext, useContext, ReactNode } from "react";
import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  onGenerateDesign: (() => void) | null;
  setOnGenerateDesign: (callback: (() => void) | null) => void;
}

const KyleContext = createContext<KyleContextType | null>(null);

function KyleProviderWithRouter({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [designSummary, setDesignSummary] = useState<string | null>(null);
  const [onGenerateDesign, setOnGenerateDesign] = useState<(() => void) | null>(null);
  const navigate = useNavigate();

  // Extract design-related keywords from messages
  const extractDesignSummary = (allMessages: ConversationMessage[]) => {
    const designKeywords = allMessages
      .map(m => m.content)
      .join(" ");
    
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

  // Reference to track if we should trigger generation
  const onGenerateDesignRef = useCallback(() => {
    if (onGenerateDesign) {
      onGenerateDesign();
    }
  }, [onGenerateDesign]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Kyle disconnected");
    },
    onMessage: (message) => {
      console.log("Kyle message:", message);
      
      // Handle different message types from ElevenLabs
      if (message && typeof message === "object") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = message as any;
        
        // Capture transcriptions
        if (msg.message && typeof msg.message === "string" && msg.source) {
          const newMessage: ConversationMessage = {
            role: msg.source === "user" ? "user" : "assistant",
            content: msg.message,
            timestamp: new Date(),
          };
          
          setMessages(prev => {
            const updated = [...prev, newMessage];
            const summary = extractDesignSummary(updated);
            setDesignSummary(summary);
            return updated;
          });

          // Detect generation command variations from user messages
          if (msg.source === "user") {
            const messageText = msg.message.toLowerCase();
            
            // Check if message mentions Kyle and generation intent
            const mentionsKyle = messageText.includes("kyle");
            const hasGenerateIntent = 
              messageText.includes("generate") || 
              messageText.includes("genera") ||
              messageText.includes("create") ||
              messageText.includes("make") ||
              messageText.includes("show") ||
              messageText.includes("render") ||
              messageText.includes("produce") ||
              messageText.includes("build") ||
              messageText.includes("design") ||
              messageText.includes("visualize") ||
              messageText.includes("crea") ||
              messageText.includes("haz") ||
              messageText.includes("muestra");
            
            const hasImageIntent = 
              messageText.includes("image") || 
              messageText.includes("imagen") ||
              messageText.includes("picture") ||
              messageText.includes("visual") ||
              messageText.includes("render") ||
              messageText.includes("design") ||
              messageText.includes("photo") ||
              messageText.includes("graphic");

            // Trigger if mentions Kyle + generate intent + image intent
            const isGenerateCommand = mentionsKyle && hasGenerateIntent && hasImageIntent;

            if (isGenerateCommand) {
              console.log("Generation command detected:", msg.message);
              setTimeout(() => {
                onGenerateDesignRef();
              }, 1500);
            }
          }
        }
      }
    },
    onError: (errorMessage) => {
      console.error("Kyle error:", errorMessage);
      // Don't set error for internal SDK issues
      if (errorMessage && typeof errorMessage === "string") {
        setError(errorMessage);
      }
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
      generateDesignImage: async () => {
        console.log("Generating design image via voice command...");
        if (onGenerateDesign) {
          onGenerateDesign();
          return "Starting design generation. I'll create an interior design visualization based on our conversation.";
        }
        return "Please navigate to the Blink Design page first to generate images.";
      },
    },
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use the public agent 
      await conversation.startSession({
        agentId: KYLE_AGENT_ID,
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
    onGenerateDesign,
    setOnGenerateDesign,
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
