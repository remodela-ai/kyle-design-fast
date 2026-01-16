import { createContext, useContext, ReactNode, useCallback, useState, useRef } from "react";
import { useConversation } from "@11labs/react";

const KYLE_AGENT_ID = "agent_1501kbtjqq0pezxrrhkv2hvjync6";

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
  isGenerating: boolean;
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  toggleConversation: () => Promise<void>;
  clearMessages: () => void;
  triggerGeneration: () => void;
  setGenerationCallback: (callback: (() => void) | null) => void;
  resetGenerating: () => void;
}

const KyleContext = createContext<KyleContextType | null>(null);

function KyleProviderWithRouter({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [designSummary, setDesignSummary] = useState<string | null>(null);
  const [voiceCommandDetected, setVoiceCommandDetected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationCallbackRef = useRef<(() => void) | null>(null);

  const extractDesignSummary = (allMessages: ConversationMessage[]) => {
    const text = allMessages.map(m => m.content).join(" ").toLowerCase();
    
    const styles = ["modern", "minimalist", "industrial", "bohemian", "scandinavian", "rustic", "contemporary", "traditional", "luxury", "cozy"];
    const rooms = ["living room", "bedroom", "kitchen", "bathroom", "office", "dining room", "studio"];
    const colors = ["white", "black", "gray", "beige", "wood", "blue", "green", "neutral"];
    
    const found = {
      styles: styles.filter(s => text.includes(s)),
      rooms: rooms.filter(r => text.includes(r)),
      colors: colors.filter(c => text.includes(c))
    };

    const parts: string[] = [];
    if (found.rooms.length) parts.push(`Room: ${found.rooms.join(", ")}`);
    if (found.styles.length) parts.push(`Style: ${found.styles.join(", ")}`);
    if (found.colors.length) parts.push(`Colors: ${found.colors.join(", ")}`);

    return parts.length ? parts.join(" | ") : null;
  };

  const triggerGeneration = useCallback(async () => {
    console.log("🚀 Generation triggered");
    setVoiceCommandDetected(true);
    setIsGenerating(true);
    
    // Stop Kyle
    try {
      await conversation.endSession();
    } catch (e) {
      console.log("Could not stop:", e);
    }
    
    setTimeout(() => setVoiceCommandDetected(false), 2000);
    
    if (generationCallbackRef.current) {
      generationCallbackRef.current();
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle connected");
      setError(null);
      setMessages([]);
      setDesignSummary(null);
      setIsGenerating(false);
    },
    onDisconnect: () => {
      console.log("Kyle disconnected");
    },
    onMessage: (message) => {
      console.log("Message:", message);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = message as any;
      
      if (msg?.message && msg?.source) {
        const newMessage: ConversationMessage = {
          role: msg.source === "user" ? "user" : "assistant",
          content: msg.message,
          timestamp: new Date(),
        };
        
        setMessages(prev => {
          const updated = [...prev, newMessage];
          setDesignSummary(extractDesignSummary(updated));
          return updated;
        });

        // Detect voice command from user - STRICT matching
        if (msg.source === "user") {
          const text = msg.message.toLowerCase().replace(/[.,!?;:]/g, '');
          
          // Must contain explicit command phrases, NOT just "generate" in normal conversation
          const isExplicitCommand = 
            text.includes("hey kyle generate") || 
            text.includes("kyle generate the") ||
            text.includes("kyle generate image") ||
            text.includes("kyle generate my") ||
            text.includes("kyle please generate") ||
            text.includes("kyle can you generate") ||
            // Only trigger if "kyle" and "generate" are close together and NOT part of casual phrases
            (text.includes("kyle") && 
             text.includes("generate") && 
             !text.includes("let's generate") && 
             !text.includes("lets generate") && 
             !text.includes("want to generate") && 
             !text.includes("going to generate") && 
             !text.includes("we generate") &&
             !text.includes("preliminary"));
          
          if (isExplicitCommand) {
            console.log("🎯 VOICE COMMAND DETECTED!");
            triggerGeneration();
          }
        }
      }
    },
    onError: (err) => {
      console.error("Kyle error:", err);
      if (typeof err === "string") setError(err);
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
        agentId: KYLE_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start:", err);
      setError(err instanceof Error ? err.message : "Failed to start");
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

  const setGenerationCallback = useCallback((callback: (() => void) | null) => {
    generationCallbackRef.current = callback;
  }, []);

  const resetGenerating = useCallback(() => {
    setIsGenerating(false);
  }, []);

  const value: KyleContextType = {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    messages,
    designSummary,
    voiceCommandDetected,
    isGenerating,
    startConversation,
    stopConversation,
    toggleConversation,
    clearMessages,
    triggerGeneration,
    setGenerationCallback,
    resetGenerating,
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
