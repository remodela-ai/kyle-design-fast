import { useConversation } from "@11labs/react";
import { useState, useCallback, useRef } from "react";

// Kyle 4 - Storyteller agent (tells design story + offers full pipeline)
const KYLE4_AGENT_ID = "agent_1601kbtrnzncfsmvxn8gyefn0b15";

export interface Kyle4Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useKyle4Agent() {
  const [messages, setMessages] = useState<Kyle4Message[]>([]);
  const [pipelineCommandDetected, setPipelineCommandDetected] = useState(false);
  const onPipelineCommandRef = useRef<(() => void) | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle 4 connected - starting storytelling");
    },
    onDisconnect: () => {
      console.log("Kyle 4 disconnected");
    },
    onMessage: (message) => {
      console.log("Kyle 4 message:", message);
      
      if (message && typeof message === "object") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = message as any;
        
        if (msg.message && typeof msg.message === "string" && msg.source) {
          const newMessage: Kyle4Message = {
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
            
            console.log("📝 Kyle 4 - User message:", messageText);
            
            // Check for "hey kyle send me the complete project" command
            const hasKyle = messageText.includes("kyle");
            const hasComplete = messageText.includes("complete");
            const hasProject = messageText.includes("project");
            const hasSend = messageText.includes("send");
            
            const isPipelineCommand = hasKyle && (hasComplete || hasProject) && (hasSend || hasProject);

            if (isPipelineCommand) {
              console.log("🚀 Kyle 4 - PIPELINE COMMAND DETECTED!");
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
      console.error("Kyle 4 error:", error);
    },
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: KYLE4_AGENT_ID,
        connectionType: "webrtc",
      });
      
      console.log("Kyle 4 started");
    } catch (err) {
      console.error("Failed to start Kyle 4:", err);
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
