import { useConversation } from "@11labs/react";
import { useCallback, useState, useRef } from "react";

const KYLE_AGENT_ID = "agent_7901k7fa0g8dfhft7a2v69ejya4m";

export interface SkillBuilderFields {
  name: string;
  role: string;
  knowledgeBase: string;
  instructions: string;
}

type SkillBuilderStep = 1 | 2 | 3 | 4;

const FULL_PROMPT = `You are Kyle, the AI design assistant for Kuester Design. You're helping a designer create a new custom skill through a natural, guided conversation.

You will guide the user through 4 steps, one at a time. Stay on the current step until you have enough information, then use the "advance_step" tool to move forward. Do NOT skip steps.

## STEP 1: Define the Role
- Discover a clear NAME for the skill (short, like "Supplier Comparator" or "Budget Analyzer")
- Discover a ROLE DESCRIPTION explaining what this skill does
- When you have both, use "update_skill_fields" tool with name and role, then use "advance_step"

## STEP 2: Knowledge Base  
- Ask what domain knowledge, data, or references this skill needs
- If they mention files, encourage them to use the upload button on screen
- When you have enough context, use "update_skill_fields" with knowledgeBase, then "advance_step"

## STEP 3: Instructions & Behavior
- Ask how the skill should behave: output format (tables, reports, checklists), rules, constraints
- When captured, use "update_skill_fields" with instructions, then "advance_step"

## STEP 4: Review & Generate
- Summarize everything you've captured
- Ask if they want changes or are ready to generate
- When they confirm, use "generate_skill" tool

## RULES:
- Be conversational, warm, brief. Speak like a creative colleague.
- NEVER make it feel like a form. Guide naturally.
- Use the tools to save data — the forms on screen will auto-fill.
- Stay in the current step until you've gathered enough info.
- Always respond in English.
- Keep responses SHORT (2-3 sentences max). This is a voice conversation.`;

export function useSkillBuilderVoice(
  onFieldsUpdate: (fields: Partial<SkillBuilderFields>) => void,
  onStepAdvance: () => void,
  onGenerate: () => void
) {
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const currentStepRef = useRef<SkillBuilderStep>(1);

  const conversationRef = useRef<ReturnType<typeof useConversation> | null>(null);
  const stepRef = useRef<SkillBuilderStep>(1);
  const fieldsRef = useRef<Partial<SkillBuilderFields>>({});

  // Build the dynamic prompt based on current step and fields
  const buildPrompt = useCallback(() => {
    let prompt = FULL_PROMPT + `\n\nYou are currently on STEP ${stepRef.current}.`;
    const f = fieldsRef.current;
    const parts: string[] = [];
    if (f.name) parts.push(`Skill name: "${f.name}"`);
    if (f.role) parts.push(`Role: "${f.role}"`);
    if (f.knowledgeBase) parts.push(`Knowledge base: "${f.knowledgeBase}"`);
    if (f.instructions) parts.push(`Instructions: "${f.instructions}"`);
    if (parts.length > 0) {
      prompt += `\n\nALREADY CAPTURED:\n${parts.join("\n")}`;
    }
    return prompt;
  }, []);

  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: {
          prompt: buildPrompt(),
        },
        firstMessage: "Hey! I'm Kyle. Let's build a new skill together. First, tell me — what kind of tool would help you most in your design practice? What would you call it?",
        language: "en",
      },
    },
    onConnect: () => {
      console.log("Kyle Skill Builder connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Kyle Skill Builder disconnected");
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript" && message.user_transcription_event?.user_transcript) {
        setTranscript(prev => [...prev, `You: ${message.user_transcription_event.user_transcript}`]);
      }
      if (message.type === "agent_response" && message.agent_response_event?.agent_response) {
        setTranscript(prev => [...prev, `Kyle: ${message.agent_response_event.agent_response}`]);
      }
    },
    onError: (errorMessage: any) => {
      console.error("Kyle SB error:", errorMessage);
      setError(typeof errorMessage === "string" ? errorMessage : "Error connecting to Kyle");
    },
    clientTools: {
      update_skill_fields: (params: any) => {
        console.log("Kyle updating fields:", params);
        const fields: Partial<SkillBuilderFields> = {};
        if (params.name) fields.name = params.name;
        if (params.role) fields.role = params.role;
        if (params.knowledgeBase || params.knowledge_base) fields.knowledgeBase = params.knowledgeBase || params.knowledge_base;
        if (params.instructions) fields.instructions = params.instructions;
        fieldsRef.current = { ...fieldsRef.current, ...fields };
        onFieldsUpdate(fields);
        return "Fields updated successfully. The forms on screen have been auto-filled.";
      },
      advance_step: () => {
        console.log("Kyle advancing step");
        currentStepRef.current = Math.min(currentStepRef.current + 1, 4) as SkillBuilderStep;
        stepRef.current = currentStepRef.current;
        onStepAdvance();
        return `Advanced to step ${currentStepRef.current}. Continue guiding the user.`;
      },
      generate_skill: () => {
        console.log("Kyle triggering generation");
        onGenerate();
        return "Generation started! The skill is being built.";
      },
    },
  });

  const startConversation = useCallback(async (step: SkillBuilderStep, existingFields?: Partial<SkillBuilderFields>) => {
    try {
      currentStepRef.current = step;
      stepRef.current = step;
      if (existingFields) fieldsRef.current = { ...fieldsRef.current, ...existingFields };
      setTranscript([]);
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId: KYLE_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start skill builder conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Send context update without restarting the session
  const updateContext = useCallback((step: SkillBuilderStep, fields?: Partial<SkillBuilderFields>) => {
    if (conversation.status !== "connected") return;
    
    const parts: string[] = [`The user is now on STEP ${step}.`];
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
