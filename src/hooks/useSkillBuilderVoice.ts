import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useRef } from "react";

const KYLE_AGENT_ID = "agent_2801khy9cgzfehzr50j4bwnpejwj";

const SKILL_BUILDER_CONTEXT = `IMPORTANT CONTEXT UPDATE: You are now in SKILL BUILDER MODE.

Your job is to have a SHORT, focused conversation with the designer to understand what custom skill/tool they want to build. You are Kyle, the AI design assistant for Kuester Design.

CRITICAL: Right after receiving this context, your VERY NEXT spoken sentence MUST be: "Let's build something new together! Tell me — what kind of tool would make your design work easier?" — say this naturally.

YOU MUST ONLY ASK 4 ESSENTIAL QUESTIONS (one at a time, naturally):
1. What should this tool DO? (its core purpose)
2. What DATA or KNOWLEDGE does it need? (files, catalogs, databases, references)
3. What should the OUTPUT look like? (format, layout, style)
4. Any specific RULES or BEHAVIOR? (calculations, constraints, interaction patterns)

RULES:
- Respond in English only
- Keep responses SHORT (1-2 sentences max). This is voice.
- Be warm and conversational, like a creative colleague
- Ask exactly 4 questions, one per exchange — no more, no less
- After the 4th answer, immediately summarize what you understood in 2 sentences and say "I've got everything I need — hit the build button whenever you're ready!"
- Do NOT ask "Should I go ahead and build this?" — the user will tap the build button themselves
- Don't mention steps, forms, or technical implementation details`;

export function useSkillBuilderVoice() {
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const contextSentRef = useRef(false);
  const nudgeSentRef = useRef(false);
  const connectionStableRef = useRef(false);
  const contextRetryRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle Skill Builder connected");
      connectionStableRef.current = true;
      setError(null);
      setTimeout(() => sendContext(), 500);
    },
    onDisconnect: () => {
      console.log("Kyle Skill Builder disconnected");
      contextSentRef.current = false;
      nudgeSentRef.current = false;
      connectionStableRef.current = false;
      if (contextRetryRef.current) {
        clearTimeout(contextRetryRef.current);
        contextRetryRef.current = null;
      }
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript" && message.user_transcription_event?.user_transcript) {
        setTranscript(prev => [...prev, `You: ${message.user_transcription_event.user_transcript}`]);
      }
      if (message.type === "agent_response" && message.agent_response_event?.agent_response) {
        const agentText = message.agent_response_event.agent_response;
        setTranscript(prev => [...prev, `Kyle: ${agentText}`]);
        
        if (!contextSentRef.current && connectionStableRef.current) {
          sendContext();
          if (!nudgeSentRef.current) {
            nudgeSentRef.current = true;
            setTimeout(() => {
              try {
                conversation.sendUserMessage("I want to build a new skill, let's do it!");
                console.log("Kyle nudge sent after greeting");
              } catch (e) {
                console.warn("Could not send nudge:", e);
              }
            }, 4000);
          }
        }
      }
    },
    onError: (errorMessage: any) => {
      console.error("Kyle SB error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Kyle");
    },
  });

  const sendContext = useCallback(() => {
    if (contextSentRef.current) return;
    try {
      conversation.sendContextualUpdate(SKILL_BUILDER_CONTEXT);
      contextSentRef.current = true;
      console.log("Kyle Skill Builder context injected");
    } catch (e) {
      console.warn("Could not send skill builder context:", e);
    }
  }, [conversation]);

  const startConversation = useCallback(async () => {
    try {
      contextSentRef.current = false;
      nudgeSentRef.current = false;
      connectionStableRef.current = false;
      setTranscript([]);

      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: KYLE_AGENT_ID,
        connectionType: "webrtc",
      });

      const retryTimes = [1000, 3000, 5000];
      retryTimes.forEach((delay) => {
        const timer = setTimeout(() => {
          if (!contextSentRef.current) sendContext();
        }, delay);
        contextRetryRef.current = timer;
      });

    } catch (err) {
      console.error("Failed to start skill builder conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }, [conversation, sendContext]);

  const stopConversation = useCallback(async () => {
    if (contextRetryRef.current) {
      clearTimeout(contextRetryRef.current);
      contextRetryRef.current = null;
    }
    await conversation.endSession();
  }, [conversation]);

  const getFullTranscript = useCallback(() => {
    return transcript.join("\n");
  }, [transcript]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    transcript,
    startConversation,
    stopConversation,
    getFullTranscript,
  };
}
