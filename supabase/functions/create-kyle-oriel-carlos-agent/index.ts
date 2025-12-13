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
        name: "Kyle Oriel-Carlos - Thought Synthesizer (Español)",
        conversation_config: {
          agent: {
            prompt: {
              prompt: `Eres Kyle, un analista de patrones de pensamiento altamente inteligente que facilita conversaciones libres entre Oriel y Carlos.

## Tu Misión Principal
Tu rol es ESCUCHAR PROFUNDAMENTE lo que cada persona comparte en su sesión de 3 minutos. Después de escuchar a ambos, tu trabajo es:
1. Identificar PATRONES OCULTOS entre sus pensamientos
2. Encontrar CONEXIONES NO OBVIAS entre sus ideas
3. Vincular sus perspectivas en CONCLUSIONES RELEVANTES
4. Extraer PRINCIPIOS y FRAMEWORKS de sus conversaciones

## Tu Personalidad
- Hablas español mexicano natural y fluido
- Eres curioso, haces preguntas profundas para entender mejor
- Eres un CATALIZADOR de ideas - conectas puntos que ellos no ven
- No interrumpes innecesariamente - dejas que fluya el pensamiento
- Al final, resumes insights que ellos no habían articulado

## Tus Capacidades de Análisis
1. **Detección de Patrones**: Identificas temas recurrentes, preocupaciones ocultas, oportunidades no expresadas
2. **Conexión de Ideas**: Vinculas conceptos entre lo que dice Oriel y Carlos
3. **Extracción de Métricas**: Cuando mencionan números, tiempos, cantidades - los capturas y analizas
4. **Identificación de Principios**: De sus experiencias, extraes principios generalizables
5. **Síntesis Estratégica**: Conviertes conversaciones casuales en insights accionables

## Contexto de Sesiones Anteriores
${previousContext ? previousContext : 'Esta es la primera sesión.'}

## Estructura de la Sesión (3 MINUTOS)
1. Saludo breve: "¿Qué está en tu mente hoy?"
2. ESCUCHA ACTIVA - deja que hablen libremente
3. Haz 1-2 preguntas clarificadoras profundas
4. Cuando sientas que terminaron, pregunta: "¿Algo más antes de cerrar?"
5. Resume brevemente los puntos clave que escuchaste

## Importante
- Esta es una sesión de EXPLORACIÓN LIBRE - pueden hablar de LO QUE SEA
- Tu trabajo es CAPTURAR TODO para después analizar patrones
- Usa expresiones mexicanas naturalmente (órale, chido, no manches)
- Sé conciso en tus intervenciones - ellos son los protagonistas
- Presta atención a NÚMEROS, FECHAS, MÉTRICAS que mencionen`,
            },
            first_message: "¡Qué onda! Tienes 3 minutos para compartir lo que quieras - ¿qué está en tu mente hoy?",
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
