import { createContext, useContext, ReactNode, useRef } from "react";
import { useConversation } from "@11labs/react";
import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const KYLE_AGENT_ID = "agent_1501kbtjqq0pezxrrhkv2hvjync6"; // Kyle Blink Design

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
  voiceCommandDetected: boolean;
  isGeneratingFromVoice: boolean;
  setIsGeneratingFromVoice: (value: boolean) => void;
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
  const [voiceCommandDetected, setVoiceCommandDetected] = useState(false);
  const [isGeneratingFromVoice, setIsGeneratingFromVoice] = useState(false);
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

  // Use ref to store the endSession function so it's always current
  const endSessionRef = useRef<(() => Promise<void>) | null>(null);
  const onGenerateDesignRef = useRef<(() => void) | null>(null);

  // Keep the ref updated
  useEffect(() => {
    onGenerateDesignRef.current = onGenerateDesign;
  }, [onGenerateDesign]);

  // Function to handle voice command detection
  const handleVoiceCommand = useCallback(async () => {
    console.log("🚀 handleVoiceCommand called");
    
    setVoiceCommandDetected(true);
    setIsGeneratingFromVoice(true);
    
    // Stop Kyle from talking IMMEDIATELY
    if (endSessionRef.current) {
      try {
        console.log("🛑 Stopping Kyle...");
        await endSessionRef.current();
        console.log("✅ Kyle stopped");
      } catch (e) {
        console.log("⚠️ Could not stop conversation:", e);
      }
    }
    
    // Reset command detected after a short delay
    setTimeout(() => setVoiceCommandDetected(false), 3000);
    
    // Trigger generation using the ref
    if (onGenerateDesignRef.current) {
      console.log("🎨 Triggering image generation...");
      onGenerateDesignRef.current();
    } else {
      console.log("⚠️ No onGenerateDesign callback registered");
      setIsGeneratingFromVoice(false);
    }
  }, []);

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

          // Detect the command from USER messages only
          if (msg.source === "user") {
            // Normalize: remove punctuation and extra spaces
            const messageText = msg.message
              .toLowerCase()
              .replace(/[.,!?;:]/g, '') // Remove punctuation
              .replace(/\s+/g, ' ')     // Normalize spaces
              .trim();
            
            console.log("📝 User message normalized:", messageText);
            
            // Check for "hey kyle generate" command (no need for "image")
            const hasKyle = messageText.includes("kyle");
            const hasGenerate = messageText.includes("generate");
            
            const isGenerateCommand = hasKyle && hasGenerate;

            if (isGenerateCommand) {
              console.log("🎯 VOICE COMMAND DETECTED! Stopping Kyle and generating...");
              // Immediately trigger - no delay
              handleVoiceCommand();
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

  // Update the ref after conversation is created
  useEffect(() => {
    endSessionRef.current = conversation.endSession;
  }, [conversation.endSession]);

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: KYLE_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            firstMessage: "Hey there. I am Kyle your AI interior design assistant. Welcome to Next Interiors, a digital platform where you can get your dream interior design project in just five minutes!",
          },
        },
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
    voiceCommandDetected,
    isGeneratingFromVoice,
    setIsGeneratingFromVoice,
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
