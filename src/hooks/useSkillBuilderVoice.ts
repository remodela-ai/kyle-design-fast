import { useConversation } from "@elevenlabs/react";
import { useCallback, useState, useRef, useEffect } from "react";

const KYLE_AGENT_ID = "agent_7901k7fa0g8dfhft7a2v69ejya4m";

export interface SkillBuilderFields {
  name: string;
  role: string;
  knowledgeBase: string;
  instructions: string;
}

type SkillBuilderStep = 1 | 2 | 3 | 4;

const SKILL_BUILDER_CONTEXT = `IMPORTANT CONTEXT UPDATE: You are now in SKILL BUILDER MODE.

Your job right now is to guide the user through building a new custom skill in 4 steps. You are Kyle, the AI design assistant for Kuester Design.

CRITICAL: Right after receiving this context, your VERY NEXT spoken sentence MUST be: "How about we build a new skill together? What kind of tool would help you most in your design practice?" — say this naturally as a follow-up to whatever you just said.

CURRENT TASK: Guide the user through creating a new skill step by step.

IMPORTANT SEQUENCING RULES:
1. First, use "update_skill_fields" to save the data for the CURRENT step.
2. WAIT for the tool response confirming fields were saved.
3. ONLY THEN use "advance_step" to move to the next step.
4. WAIT for the advance_step response.
5. ONLY AFTER advance_step confirms, speak your transition sentence for the next step.

STEP 1 (Define Role): Get a short NAME (like "Supplier Comparator") and a ROLE DESCRIPTION. Use update_skill_fields with {name, role}. Wait for confirmation. Then use advance_step. Then say "Great, now let's add the knowledge base your skill will need."
STEP 2 (Knowledge Base): Ask what data/knowledge the skill needs. Use update_skill_fields with {knowledgeBase}. Wait. Then advance_step. Then say "Perfect, now let's define how it should behave."
STEP 3 (Instructions): Ask how it should behave (output format, rules). Use update_skill_fields with {instructions}. Wait. Then advance_step. Then say "Awesome, let me generate this for you."
STEP 4 (Generate): Summarize and confirm. Use generate_skill when ready.

RULES:
- Respond in English only
- Keep responses SHORT (2-3 sentences). This is voice.
- Be warm and conversational, like a creative colleague
- Use the tools to fill forms on screen — they auto-fill as you save data
- NEVER skip steps. Stay on the current step until you have enough info.
- ALWAYS call update_skill_fields BEFORE advance_step. Never advance without filling fields first.`;

export function useSkillBuilderVoice(
  onFieldsUpdate: (fields: Partial<SkillBuilderFields>) => void,
  onStepAdvance: () => void,
  onGenerate: () => void,
  onTypewriterDone?: () => void
) {
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const currentStepRef = useRef<SkillBuilderStep>(1);
  const fieldsRef = useRef<Partial<SkillBuilderFields>>({});
  const contextSentRef = useRef(false);
  const nudgeSentRef = useRef(false);
  const connectionStableRef = useRef(false);
  const contextRetryRef = useRef<NodeJS.Timeout | null>(null);
  const greetingReceivedRef = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle Skill Builder connected");
      connectionStableRef.current = true;
      setError(null);
      // Try sending context immediately on connect
      setTimeout(() => sendContext(), 500);
    },
    onDisconnect: () => {
      console.log("Kyle Skill Builder disconnected");
      contextSentRef.current = false;
      nudgeSentRef.current = false;
      connectionStableRef.current = false;
      greetingReceivedRef.current = false;
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
        
        // On first agent response (greeting), send context then nudge after he finishes speaking
        if (!contextSentRef.current && connectionStableRef.current) {
          sendContext();
          // Wait ~4s for Kyle to finish speaking his greeting, then send user message to trigger pivot
          if (!nudgeSentRef.current) {
            nudgeSentRef.current = true;
            setTimeout(() => {
              try {
                conversation.sendUserMessage("I want to build a new skill, let's do it!");
                console.log("Kyle nudge user message sent after greeting");
              } catch (e) {
                console.warn("Could not send nudge user message:", e);
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
    clientTools: {
      update_skill_fields: (params: any) => {
        console.log("Kyle updating fields via tool:", params);
        const fields: Partial<SkillBuilderFields> = {};
        if (params.name) fields.name = params.name;
        if (params.role) fields.role = params.role;
        if (params.knowledgeBase || params.knowledge_base) {
          fields.knowledgeBase = params.knowledgeBase || params.knowledge_base;
        }
        if (params.instructions) fields.instructions = params.instructions;
        fieldsRef.current = { ...fieldsRef.current, ...fields };
        onFieldsUpdate(fields);
        return "Fields updated successfully. The forms are now filling on screen with a typewriter animation. The user can see it happening. DO NOT advance_step yet — wait 2-3 seconds for the animation to finish, then call advance_step.";
      },
      advance_step: () => {
        console.log("Kyle advancing step via tool");
        currentStepRef.current = Math.min(currentStepRef.current + 1, 4) as SkillBuilderStep;
        // Delay step advance to let typewriter finish
        setTimeout(() => {
          onStepAdvance();
        }, 500);
        return `Moved to step ${currentStepRef.current}. The next step is now illuminated on screen. NOW say your transition sentence to guide the user to this new step.`;
      },
      generate_skill: () => {
        console.log("Kyle triggering generation via tool");
        onGenerate();
        return "Generation started! The skill is being built. Let the user know it's cooking.";
      },
    },
  });

  const sendContext = useCallback(() => {
    if (contextSentRef.current) return;
    // Don't check conversation.status — it may be stale in closures.
    // Instead just try/catch the call.
    
    const step = currentStepRef.current;
    const f = fieldsRef.current;
    
    let context = SKILL_BUILDER_CONTEXT + `\n\nYou are currently on STEP ${step}.`;
    const parts: string[] = [];
    if (f.name) parts.push(`Skill name: "${f.name}"`);
    if (f.role) parts.push(`Role: "${f.role}"`);
    if (f.knowledgeBase) parts.push(`Knowledge base: "${f.knowledgeBase}"`);
    if (f.instructions) parts.push(`Instructions: "${f.instructions}"`);
    if (parts.length > 0) {
      context += `\n\nALREADY CAPTURED:\n${parts.join("\n")}`;
    }

    try {
      conversation.sendContextualUpdate(context);
      contextSentRef.current = true;
      console.log("Kyle Skill Builder context injected for step", step);
    } catch (e) {
      console.warn("Could not send skill builder context:", e);
      // Don't set contextSentRef — allow retry
    }
  }, [conversation]);

  const startConversation = useCallback(async (step: SkillBuilderStep, existingFields?: Partial<SkillBuilderFields>) => {
    try {
      currentStepRef.current = step;
      if (existingFields) fieldsRef.current = { ...fieldsRef.current, ...existingFields };
      contextSentRef.current = false;
      nudgeSentRef.current = false;
      greetingReceivedRef.current = false;
      connectionStableRef.current = false;
      setTranscript([]);

      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: KYLE_AGENT_ID,
        connectionType: "webrtc",
      });

      // Retry context injection at 1s, 3s, 5s
      const retryTimes = [1000, 3000, 5000];
      retryTimes.forEach((delay) => {
        const timer = setTimeout(() => {
          if (!contextSentRef.current) sendContext();
        }, delay);
        // Store last timer for cleanup
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

  const updateContext = useCallback((step: SkillBuilderStep, fields?: Partial<SkillBuilderFields>) => {
    if (conversation.status !== "connected") return;
    currentStepRef.current = step;
    if (fields) fieldsRef.current = { ...fieldsRef.current, ...fields };

    const parts: string[] = [
      `STEP UPDATE: The user is now on STEP ${step}.`,
      "Continue guiding them through this step using the tools."
    ];
    if (fields?.name) parts.push(`Skill name: "${fields.name}"`);
    if (fields?.role) parts.push(`Role: "${fields.role}"`);
    if (fields?.knowledgeBase) parts.push(`Knowledge base: "${fields.knowledgeBase}"`);
    if (fields?.instructions) parts.push(`Instructions: "${fields.instructions}"`);

    try {
      conversation.sendContextualUpdate(parts.join(" "));
    } catch (e) {
      console.warn("Could not send contextual update:", e);
    }
  }, [conversation]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    transcript,
    startConversation,
    stopConversation,
    updateContext,
  };
}
