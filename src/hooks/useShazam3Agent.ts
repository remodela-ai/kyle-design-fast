import { useConversation } from "@11labs/react";
import { useState, useCallback, useEffect, useRef } from "react";

// Shazam 3 - Design Storyteller agent
// This agent activates after image generation to tell a design story and offer the full pipeline
const SHAZAM3_AGENT_ID = "agent_1601kbtrnzncfsmvxn8gyefn0b15";

export interface Shazam3Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useShazam3Agent() {
  const [messages, setMessages] = useState<Shazam3Message[]>([]);
  const [pipelineCommandDetected, setPipelineCommandDetected] = useState(false);
  const onPipelineCommandRef = useRef<(() => void) | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Shazam 3 connected - starting storytelling");
    },
    onDisconnect: () => {
      console.log("Shazam 3 disconnected");
    },
    onMessage: (message) => {
      console.log("Shazam 3 message:", message);
      
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
            
            console.log("📝 Shazam 3 - User message:", messageText);
            
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
      console.error("Shazam 3 error:", error);
    },
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: SHAZAM3_AGENT_ID,
        connectionType: "webrtc",
      });
      
      console.log("Shazam 3 started");
    } catch (err) {
      console.error("Failed to start Shazam 3:", err);
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
