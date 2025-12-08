import { useConversation } from "@11labs/react";
import { useState, useCallback, useRef } from "react";

// Kyle Storyteller - Design Narrator agent
// This agent activates after image generation to tell an immersive story about the design
const KYLE_STORYTELLER_AGENT_ID = "agent_1601kbtrnzncfsmvxn8gyefn0b15";

export interface Shazam3Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useShazam3Agent() {
  const [messages, setMessages] = useState<Shazam3Message[]>([]);
  const [pipelineCommandDetected, setPipelineCommandDetected] = useState(false);
  const [designContext, setDesignContext] = useState<string>("");
  const onPipelineCommandRef = useRef<(() => void) | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("🎭 Kyle Storyteller connected - beginning design narrative");
    },
    onDisconnect: () => {
      console.log("🎭 Kyle Storyteller disconnected");
    },
    onMessage: (message) => {
      console.log("🎭 Kyle Storyteller message:", message);
      
      if (message && typeof message === "object") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = message as any;
        
        if (msg.message && typeof msg.message === "string" && msg.source) {
          const newMessage: Shazam3Message = {
            role: msg.source === "user" ? "user" : "assistant",
            content: msg.message,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, newMessage]);

          // Detect pipeline command from USER messages
          if (msg.source === "user") {
            const messageText = msg.message
              .toLowerCase()
              .replace(/[.,!?;:]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            
            console.log("📝 Kyle Storyteller - User message:", messageText);
            
            // Check for "hey kyle send me the complete project" command
            const hasKyle = messageText.includes("kyle");
            const hasComplete = messageText.includes("complete");
            const hasProject = messageText.includes("project");
            const hasSend = messageText.includes("send");
            
            const isPipelineCommand = hasKyle && (hasComplete || hasProject) && (hasSend || hasProject);

            if (isPipelineCommand) {
              console.log("🚀 PIPELINE COMMAND DETECTED!");
              setPipelineCommandDetected(true);
              
              // Trigger the pipeline callback
              if (onPipelineCommandRef.current) {
                onPipelineCommandRef.current();
              }
            }
          }
        }
      }
    },
    onError: (error) => {
      console.error("🎭 Kyle Storyteller error:", error);
    },
  });

  const startConversation = useCallback(async (context?: string) => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Store the design context for reference
      if (context) {
        setDesignContext(context);
      }
      
      // Start with dynamic first message based on design context
      const dynamicPrompt = context 
        ? `You just generated a beautiful design based on this description: "${context}". Now tell an immersive, emotional story about this space. Describe how it feels to walk through, the light, the textures, the atmosphere. Make the user FEEL like they are there. Be passionate and poetic!`
        : undefined;

      await conversation.startSession({
        agentId: KYLE_STORYTELLER_AGENT_ID,
        connectionType: "webrtc",
        overrides: context ? {
          agent: {
            prompt: {
              prompt: `You are Kyle, a passionate interior design storyteller. You've just helped create a beautiful design and now you're going to tell an IMMERSIVE, EMOTIONAL story about this space.

The design you're describing: "${context}"

YOUR MISSION:
1. Paint a vivid picture with words - describe the light, textures, colors, atmosphere
2. Make the user FEEL like they're walking through their dream space
3. Be poetic, passionate, and emotionally engaging
4. Keep it to about 1 minute of storytelling
5. After your story, offer them the complete design package with this exact phrase:
   "If you want the complete project with floor plans, mood boards, and everything you need to bring this to life - just say: Hey Kyle, send me the complete project!"

Start immediately with the storytelling - no need for introductions. Just dive into the sensory experience of the space.`,
            },
            firstMessage: "Imagina esto...",
          },
        } : undefined,
      });
      
      console.log("🎭 Kyle Storyteller started with context:", context?.substring(0, 50));
    } catch (err) {
      console.error("Failed to start Kyle Storyteller:", err);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setMessages([]);
  }, [conversation]);

  const setOnPipelineCommand = useCallback((callback: (() => void) | null) => {
    onPipelineCommandRef.current = callback;
  }, []);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    messages,
    pipelineCommandDetected,
    startConversation,
    stopConversation,
    setOnPipelineCommand,
  };
}
