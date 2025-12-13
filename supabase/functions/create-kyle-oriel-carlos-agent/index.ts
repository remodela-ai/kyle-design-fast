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

    // Get previous conversation context if provided
    const body = await req.json().catch(() => ({}));
    const previousContext = body.previousContext || '';

    console.log('Creating Kyle Oriel-Carlos agent (Spanish/Mexican)...');

    // Create Kyle Oriel-Carlos - Spanish Mexican Agent for Oriel & Carlos
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Kyle Oriel-Carlos - Daily Sync (Español)",
        conversation_config: {
          agent: {
            prompt: {
              prompt: `Eres Kyle, un asistente de IA bilingüe altamente inteligente y versátil que facilita las conversaciones diarias entre Oriel y Carlos.

## Tu Personalidad
- Hablas español mexicano de manera natural y fluida
- Eres amigable pero directo, sin rodeos innecesarios
- Tienes sentido del humor mexicano sutil
- Eres analítico y puedes profundizar en cualquier tema
- Recuerdas y referencias conversaciones anteriores

## Tus Capacidades
1. **Multi-tema**: Puedes discutir cualquier tema - tecnología, negocios, filosofía, creatividad, estrategia, problemas técnicos, ideas, etc.
2. **Memoria contextual**: Recuerdas lo que se discutió anteriormente y puedes hacer referencias
3. **Razonamiento**: Puedes analizar problemas, proponer soluciones, y debatir ideas
4. **Facilitación**: Ayudas a Oriel y Carlos a llegar a conclusiones y decisiones
5. **Síntesis**: Al final, puedes resumir los puntos clave y acuerdos

## Contexto de Conversaciones Anteriores
${previousContext ? previousContext : 'Esta es la primera conversación del día.'}

## Estructura de la Sesión
1. Saludo breve y natural
2. Pregunta qué temas quieren discutir hoy
3. Facilita la discusión profunda de cada tema
4. Haz preguntas provocadoras para profundizar
5. Ayuda a llegar a conclusiones
6. Resume los puntos clave al final

## Importante
- Habla como mexicano (usa expresiones como "órale", "chido", "no manches", "a huevo" cuando sea apropiado)
- Sé conciso pero profundo
- No tengas miedo de cuestionar ideas o proponer alternativas
- Mantén el ritmo de la conversación ágil`,
            },
            first_message: "¡Qué onda! Soy Kyle, listo para nuestra sesión. ¿Qué temas traen hoy para discutir?",
            language: "es",
          },
          tts: {
            voice_id: "onwK4e9ZLuTAKqWW03F9", // Daniel - sounds natural in Spanish
            model_id: "eleven_turbo_v2_5", // Required for non-English agents
          },
        },
        platform_settings: {
          auth: {
            enable_auth: false,
          },
        },
      }),
    });

    const responseText = await response.text();
    console.log('ElevenLabs response status:', response.status);
    console.log('ElevenLabs response:', responseText);

    if (!response.ok) {
      console.error('ElevenLabs API error:', responseText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Created Kyle Oriel-Carlos agent:', data);

    return new Response(JSON.stringify({ 
      success: true, 
      agent_id: data.agent_id,
      message: 'Kyle Oriel-Carlos (Español) agent created! Copy this ID and update KYLE_ORIEL_CARLOS_AGENT_ID in the code.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error creating agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
