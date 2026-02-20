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

const STEP_PROMPTS: Record<SkillBuilderStep, string> = {
  1: `You are Kyle, the AI design assistant. You're helping a designer create a new custom skill through a natural conversation. 

RIGHT NOW you are on STEP 1: Defining the Role.

Your goal is to naturally discover:
1. A clear NAME for the skill (short, like "Supplier Comparator" or "Budget Analyzer")
2. A ROLE DESCRIPTION explaining what this skill does

Start by warmly greeting the user and asking what kind of tool or skill they'd like to create for their design practice. Be conversational, don't make it feel like a form. 

When you've gathered enough info, use the "update_skill_fields" tool to save the name and role. Then tell the user you've captured it and suggest moving to the next step.

Keep it brief and natural. Speak like a creative colleague, not a robot.`,

  2: `You are Kyle, the AI design assistant, continuing the skill creation conversation.

RIGHT NOW you are on STEP 2: Knowledge Base.

The user already defined the skill name and role in step 1. Now you need to discover:
- What domain knowledge this skill should have
- What reference materials, data, or context it needs
- Whether they want to upload any files (templates, PDFs, etc.)

Ask naturally about what information the skill needs to be effective. If they mention files or templates, encourage them to use the upload button on screen.

When you've gathered enough context, use the "update_skill_fields" tool to save the knowledge base text. Then suggest moving forward.`,

  3: `You are Kyle, the AI design assistant, continuing the skill creation conversation.

RIGHT NOW you are on STEP 3: Instructions & Behavior.

The user already defined the role and knowledge base. Now discover:
- How the skill should behave and respond
- What output format it should use (tables, reports, checklists, etc.)
- Any specific rules or constraints

Ask about their preferred output style, any must-haves, and how they envision using this skill day-to-day.

When you've captured the behavior rules, use the "update_skill_fields" tool. Then tell the user everything looks great and suggest reviewing + generating.`,

  4: `You are Kyle, the AI design assistant. The user has completed all steps!

RIGHT NOW you are on STEP 4: Review & Generate.

Summarize what you've captured: the skill name, role, knowledge base, and instructions. Ask if they want to change anything or if they're ready to generate. 

If they confirm, tell them to hit the Generate button or say "generate" and you'll kick it off.

Be enthusiastic! They're about to create something awesome.`,
};

export function useSkillBuilderVoice(
  onFieldsUpdate: (fields: Partial<SkillBuilderFields>) => void,
  onStepAdvance: () => void,
  onGenerate: () => void
) {
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const currentStepRef = useRef<SkillBuilderStep>(1);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Kyle Skill Builder connected");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Kyle Skill Builder disconnected");
    },
    onMessage: (message: any) => {
      console.log("Kyle SB message:", message);
      
      // Capture transcripts for display
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
        onFieldsUpdate(fields);
        return "Fields updated successfully";
      },
      advance_step: () => {
        console.log("Kyle advancing step");
        onStepAdvance();
        return "Advanced to next step";
      },
      generate_skill: () => {
        console.log("Kyle triggering generation");
        onGenerate();
        return "Generation started";
      },
    },
  });

  const startConversation = useCallback(async (step: SkillBuilderStep, existingFields?: Partial<SkillBuilderFields>) => {
    try {
      currentStepRef.current = step;
      setTranscript([]);
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Build context from existing fields
      let contextPrefix = "";
      if (existingFields) {
        const parts: string[] = [];
        if (existingFields.name) parts.push(`The skill name is: "${existingFields.name}"`);
        if (existingFields.role) parts.push(`The role description is: "${existingFields.role}"`);
        if (existingFields.knowledgeBase) parts.push(`The knowledge base contains: "${existingFields.knowledgeBase}"`);
        if (existingFields.instructions) parts.push(`The instructions are: "${existingFields.instructions}"`);
        if (parts.length > 0) {
          contextPrefix = `\n\nCONTEXT FROM PREVIOUS STEPS:\n${parts.join("\n")}\n`;
        }
      }

      await conversation.startSession({
        agentId: KYLE_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: {
              prompt: STEP_PROMPTS[step] + contextPrefix,
            },
            firstMessage: step === 1 
              ? "Hey! I'm Kyle. Let's create something awesome together. What kind of tool would help you the most in your design practice? Maybe a calculator, a comparator, a report generator... just tell me what you need!"
              : step === 2
              ? "Great, now let's talk about what this skill needs to know. What kind of information, data, or references should it have access to? And feel free to upload any files using the button on screen."
              : step === 3
              ? "Awesome! Now the fun part — how should this skill behave? What kind of output do you want? Tables, reports, checklists? Any specific rules?"
              : "Let me recap everything we've set up. Take a look at the summary on screen — does everything look good? Say 'generate' when you're ready to go!",
            language: "en",
          },
        },
      });
    } catch (err) {
      console.error("Failed to start skill builder conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    }
  }, [conversation, onFieldsUpdate, onStepAdvance, onGenerate]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const restartForStep = useCallback(async (step: SkillBuilderStep, existingFields?: Partial<SkillBuilderFields>) => {
    if (conversation.status === "connected") {
      await conversation.endSession();
    }
    // Small delay before reconnecting
    setTimeout(() => {
      startConversation(step, existingFields);
    }, 500);
  }, [conversation, startConversation]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnected: conversation.status === "connected",
    error,
    transcript,
    startConversation,
    stopConversation,
    restartForStep,
  };
}
