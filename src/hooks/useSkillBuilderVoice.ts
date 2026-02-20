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

IMPORTANT: You only have ONE tool: "update_skill_fields". This tool handles EVERYTHING — it fills the form, plays the animation, AND advances to the next step automatically. You just call it once per step and wait.

SEQUENCING RULES:
1. Gather info from the user for the CURRENT step through conversation.
2. When you have enough info, call "update_skill_fields" with the data.
3. WAIT for the tool response — the system is playing a typewriter animation on screen.
4. ONLY AFTER the tool responds, speak your transition sentence for the next step.

STEP 1 (Define Role): Get a short NAME (like "Supplier Comparator") and a ROLE DESCRIPTION. Call update_skill_fields with {name, role}. Wait for response. Then say "Great, now let's add the knowledge base your skill will need."
STEP 2 (Knowledge Base): Ask what data/knowledge the skill needs. Call update_skill_fields with {knowledgeBase}. Wait for response. Then say "Perfect, now let's define how it should behave."
STEP 3 (Instructions): Ask how it should behave (output format, rules). Call update_skill_fields with {instructions}. Wait for response. Then say "Awesome, let me generate this for you."
STEP 4 (Generate): Summarize and confirm. Call generate_skill when ready.

RULES:
- Respond in English only
- Keep responses SHORT (2-3 sentences). This is voice.
- Be warm and conversational, like a creative colleague
- NEVER skip steps. Stay on the current step until you have enough info.
- ALWAYS wait for the tool response before speaking your transition.`;

/**
 * onFieldsUpdate now receives a `done` callback. The parent MUST call done()
 * when the typewriter animation finishes, so the async tool can resolve.
 */
export function useSkillBuilderVoice(
  onFieldsUpdate: (fields: Partial<SkillBuilderFields>, done: () => void) => void,
  onStepAdvance: () => void,
  onGenerate: () => void,
) {
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const currentStepRef = useRef<SkillBuilderStep>(1);
  const fieldsRef = useRef<Partial<SkillBuilderFields>>({});
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
        
        // On first agent response, send context then nudge
        if (!contextSentRef.current && connectionStableRef.current) {
          sendContext();
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
      // ASYNC tool: returns a Promise that resolves only after animation completes
      update_skill_fields: async (params: any): Promise<string> => {
        console.log("Kyle updating fields via tool (async):", params);
        const fields: Partial<SkillBuilderFields> = {};
        if (params.name) fields.name = params.name;
        if (params.role) fields.role = params.role;
        if (params.knowledgeBase || params.knowledge_base) {
          fields.knowledgeBase = params.knowledgeBase || params.knowledge_base;
        }
        if (params.instructions) fields.instructions = params.instructions;
        fieldsRef.current = { ...fieldsRef.current, ...fields };

        // Return a promise that resolves when animation is done
        return new Promise<string>((resolve) => {
          // Pass fields + done callback to parent
          onFieldsUpdate(fields, () => {
            // Animation finished → advance step
            currentStepRef.current = Math.min(currentStepRef.current + 1, 4) as SkillBuilderStep;
            onStepAdvance();
            console.log("Animation done, step advanced to", currentStepRef.current);
            resolve(`Fields saved and animated on screen. Step advanced to ${currentStepRef.current}. NOW say your transition sentence to guide the user to this new step.`);
          });
        });
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
    }
  }, [conversation]);

  const startConversation = useCallback(async (step: SkillBuilderStep, existingFields?: Partial<SkillBuilderFields>) => {
    try {
      currentStepRef.current = step;
      if (existingFields) fieldsRef.current = { ...fieldsRef.current, ...existingFields };
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
