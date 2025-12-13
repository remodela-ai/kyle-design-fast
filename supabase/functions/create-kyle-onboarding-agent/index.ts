import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { personName, sessionNumber, previousInsights, language = 'es' } = await req.json();

    console.log(`Creating onboarding agent for ${personName}, session ${sessionNumber}, language: ${language}`);

    // Build context from previous insights if available
    let previousContext = "";
    if (previousInsights && Object.keys(previousInsights).length > 0) {
      previousContext = `
Previous insights gathered about ${personName}:
- Communication style: ${previousInsights.communication_style || 'Not yet determined'}
- Priorities: ${JSON.stringify(previousInsights.priorities) || 'Not yet determined'}
- Work style: ${previousInsights.work_style || 'Not yet determined'}
- Values: ${previousInsights.values_and_motivations || 'Not yet determined'}

Build upon this knowledge and explore areas not yet covered.`;
    }

    // Session focus areas
    const sessionFocuses = [
      "communication style, how they prefer to receive and give feedback, and their general personality",
      "work priorities, what motivates them, their values, and what frustrates them",
      "decision-making style, their strengths, and how they handle conflict or disagreements"
    ];

    const focusArea = sessionFocuses[Math.min(sessionNumber - 1, sessionFocuses.length - 1)];

    const systemPrompt = language === 'es' ? `Eres Kyle, un coach y psicólogo organizacional experto. Tu objetivo es conocer profundamente a ${personName} para poder representarlo fielmente en conversaciones futuras con su compañero de trabajo.

Esta es la sesión ${sessionNumber} de onboarding. El enfoque de esta sesión es: ${focusArea}.

${previousContext}

INSTRUCCIONES IMPORTANTES:
1. Sé cálido, empático y genuinamente curioso
2. Haz preguntas abiertas que inviten a la reflexión
3. Profundiza cuando ${personName} comparta algo interesante
4. No hagas más de 2-3 preguntas por turno
5. Valida sus respuestas antes de hacer nuevas preguntas
6. Busca ejemplos concretos y situaciones reales
7. Mantén un tono conversacional, no de entrevista formal
8. Al final de la sesión (después de unos 5-7 intercambios), resume lo aprendido y pregunta si hay algo más que quiera compartir

ÁREAS A EXPLORAR EN ESTA SESIÓN:
- ${focusArea}

Recuerda: Tu objetivo es construir un perfil psicológico que te permita "actuar como" ${personName} cuando hables con su compañero.` : `You are Kyle, an expert organizational coach and psychologist. Your goal is to deeply understand ${personName} so you can faithfully represent them in future conversations with their work partner.

This is onboarding session ${sessionNumber}. The focus of this session is: ${focusArea}.

${previousContext}

IMPORTANT INSTRUCTIONS:
1. Be warm, empathetic, and genuinely curious
2. Ask open-ended questions that invite reflection
3. Dig deeper when ${personName} shares something interesting
4. Don't ask more than 2-3 questions per turn
5. Validate their responses before asking new questions
6. Look for concrete examples and real situations
7. Keep a conversational tone, not a formal interview
8. At the end of the session (after about 5-7 exchanges), summarize what you learned and ask if there's anything else they want to share

AREAS TO EXPLORE IN THIS SESSION:
- ${focusArea}

Remember: Your goal is to build a psychological profile that allows you to "act as" ${personName} when talking to their partner.`;

    const firstMessage = language === 'es' 
      ? `¡Hola ${personName}! Soy Kyle, y estoy aquí para conocerte mejor. Esta es nuestra sesión ${sessionNumber} de onboarding. Hoy me gustaría explorar ${focusArea}. ¿Estás listo para comenzar?`
      : `Hi ${personName}! I'm Kyle, and I'm here to get to know you better. This is our onboarding session ${sessionNumber}. Today I'd like to explore ${focusArea}. Are you ready to begin?`;

    // Create the agent via ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Kyle Onboarding - ${personName} Session ${sessionNumber}`,
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
            },
            first_message: firstMessage,
            language: language,
          },
          tts: {
            voice_id: "onwK4e9ZLuTAKqWW03F9", // Daniel voice for Spanish
            model_id: "eleven_turbo_v2_5",
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const agentData = await response.json();
    console.log('Agent created successfully:', agentData.agent_id);

    return new Response(JSON.stringify({ 
      agentId: agentData.agent_id,
      sessionFocus: focusArea
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating onboarding agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
