import { useConversation } from "@11labs/react";
import { useState, useCallback, useRef } from "react";

// Kyle Storyteller agent - tells immersive stories about generated designs
const KYLE_STORYTELLER_AGENT_ID = "agent_1601kbtrnzncfsmvxn8gyefn0b15";

export interface StorytellerMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useStorytellerAgent() {
  const [messages, setMessages] = useState<StorytellerMessage[]>([]);
  const [pipelineCommandDetected, setPipelineCommandDetected] = useState(false);
  const onPipelineCommandRef = useRef<(() => void) | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("🎭 Kyle Storyteller connected");
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
          const newMessage: StorytellerMessage = {
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
            
            console.log("📝 Storyteller - User message:", messageText);
            
            // Check for "hey kyle send me the complete project" command
            const hasKyle = messageText.includes("kyle");
            const hasComplete = messageText.includes("complete");
            const hasProject = messageText.includes("project");
            const hasSend = messageText.includes("send");
            
            const isPipelineCommand = hasKyle && (hasComplete || hasProject) && (hasSend || hasProject);

            if (isPipelineCommand) {
              console.log("🚀 PIPELINE COMMAND DETECTED!");
              setPipelineCommandDetected(true);
              
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
      
      // Start without overrides - agent config is set in ElevenLabs dashboard
      await conversation.startSession({
        agentId: KYLE_STORYTELLER_AGENT_ID,
        connectionType: "webrtc",
      });
      
      console.log("🎭 Kyle Storyteller started with context:", context?.substring(0, 50));
    } catch (err) {
      console.error("Failed to start Kyle Storyteller:", err);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setMessages([]);
    setPipelineCommandDetected(false);
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
