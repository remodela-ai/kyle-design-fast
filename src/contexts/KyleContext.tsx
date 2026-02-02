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

        // Detect voice command from user - More robust matching
        if (msg.source === "user") {
          const text = msg.message.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
          
          // Normalize common speech-to-text variations
          const normalizedText = text
            .replace(/hey\s+kyle/g, 'hey kyle')
            .replace(/kyle\s+generate/g, 'kyle generate');
          
          // Check for explicit generation commands - handle variations in speech
          const hasKyle = normalizedText.includes("kyle");
          const hasGenerate = normalizedText.includes("generate");
          const hasHeyKyle = normalizedText.includes("hey kyle");
          
          // Primary trigger patterns (most reliable)
          const isPrimaryCommand = 
            normalizedText.includes("hey kyle generate") ||
            normalizedText.includes("kyle generate image") ||
            normalizedText.includes("kyle generate the") ||
            normalizedText.includes("kyle generate my") ||
            normalizedText.includes("kyle please generate") ||
            normalizedText.includes("kyle can you generate") ||
            normalizedText.includes("kyle genera") || // Spanish "genera"
            normalizedText.includes("kyle generar"); // Spanish "generar"
          
          // Secondary: "hey kyle" + "generate" anywhere in same message
          const isSecondaryCommand = hasHeyKyle && hasGenerate;
          
          // Tertiary: Both "kyle" and "generate" present (but not in exclusion phrases)
          const exclusionPhrases = [
            "let's generate", "lets generate", "want to generate", 
            "going to generate", "we generate", "should generate",
            "will generate", "can generate ideas", "preliminary"
          ];
          const hasExclusion = exclusionPhrases.some(phrase => normalizedText.includes(phrase));
          const isTertiaryCommand = hasKyle && hasGenerate && !hasExclusion;
          
          // Trigger if ANY of the command patterns match
          if (isPrimaryCommand || isSecondaryCommand || isTertiaryCommand) {
            console.log("🎯 VOICE COMMAND DETECTED!", { 
              isPrimaryCommand, 
              isSecondaryCommand, 
              isTertiaryCommand, 
              text: normalizedText 
            });
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
