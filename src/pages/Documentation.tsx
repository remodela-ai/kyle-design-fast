 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, ArrowLeft, Lightbulb, Target, Users, Palette, Image } from "lucide-react";
 import { useNavigate } from "react-router-dom";

// Import screenshots
import screenshotDashboard from "@/assets/docs/screenshot-dashboard.jpg";
import screenshotLeads from "@/assets/docs/screenshot-leads.jpg";
import screenshotKyleVoice from "@/assets/docs/screenshot-kyle-voice.jpg";
import screenshotAnalytics from "@/assets/docs/screenshot-analytics.jpg";
import screenshotEmbed from "@/assets/docs/screenshot-embed.jpg";
import screenshotProposal from "@/assets/docs/screenshot-proposal.jpg";

// Screenshot component for documentation
const DocScreenshot = ({ src, alt, caption }: { src: string; alt: string; caption: string }) => (
  <figure className="my-6 not-prose">
    <div className="border border-border rounded-lg overflow-hidden shadow-lg">
      <img src={src} alt={alt} className="w-full h-auto" />
    </div>
    <figcaption className="text-sm text-muted-foreground text-center mt-2 flex items-center justify-center gap-2">
      <Image className="h-4 w-4" />
      {caption}
    </figcaption>
  </figure>
);
 
 const Documentation = () => {
   const navigate = useNavigate();
   const [language, setLanguage] = useState<"es" | "en">("en");
 
   const handleDownloadPDF = () => {
     window.print();
   };
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header - Hidden in print */}
       <div className="print:hidden sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
         <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
           <Button variant="ghost" onClick={() => navigate(-1)}>
             <ArrowLeft className="h-4 w-4 mr-2" />
             Back
           </Button>
           <div className="flex items-center gap-4">
             <Tabs value={language} onValueChange={(v) => setLanguage(v as "es" | "en")}>
               <TabsList>
                 <TabsTrigger value="es">Español</TabsTrigger>
                 <TabsTrigger value="en">English</TabsTrigger>
               </TabsList>
             </Tabs>
             <Button onClick={handleDownloadPDF}>
               <Download className="h-4 w-4 mr-2" />
               Download PDF
             </Button>
           </div>
         </div>
       </div>
 
       {/* Document Content */}
       <div className="max-w-5xl mx-auto px-6 py-8 print:py-0 print:px-0 print:max-w-none">
         {language === "es" ? <SpanishDocumentation /> : <EnglishDocumentation />}
       </div>
     </div>
   );
 };
 
 const SpanishDocumentation = () => (
   <article className="prose prose-slate dark:prose-invert max-w-none print:prose-sm">
    {/* Storytelling / Pitch Section */}
    <section className="py-8 print:page-break-after-always">
      <div className="not-prose bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl p-8 mb-8 print:bg-white print:border print:border-gray-300">
        <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-primary" />
          La Historia de Kyle
        </h2>
        
        {/* Problem */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-destructive mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            El Problema
          </h3>
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
            <p className="text-foreground leading-relaxed mb-4">
              <strong>Los estudios de diseño de interiores enfrentan un desafío crítico:</strong> el 73% de los prospectos 
              que visitan su sitio web abandonan sin dejar información de contacto. ¿Por qué? Porque esperan respuestas 
              inmediatas, visualizaciones personalizadas y cotizaciones al instante.
            </p>
            <ul className="space-y-2 text-muted-foreground list-none pl-0">
              <li>• Los clientes potenciales contactan a las 11 PM y no reciben respuesta hasta las 9 AM del día siguiente</li>
              <li>• Los diseñadores pasan 40% de su tiempo en tareas administrativas en lugar de crear</li>
              <li>• Las cotizaciones manuales toman 2-3 días, perdiendo oportunidades frente a competidores más ágiles</li>
              <li>• La comunicación fragmentada entre email, WhatsApp y llamadas genera confusión y proyectos perdidos</li>
            </ul>
          </div>
        </div>

        {/* Solution */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            La Solución: Kyle AI
          </h3>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
            <p className="text-foreground leading-relaxed mb-4">
              <strong>Kyle es un asistente de inteligencia artificial</strong> diseñado específicamente para estudios de 
              diseño de interiores. Opera 24/7, capturando prospectos, generando visualizaciones preliminares en segundos, 
              y creando propuestas profesionales automáticamente.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Disponibilidad</div>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">&lt;30s</div>
                <div className="text-sm text-muted-foreground">Tiempo de respuesta</div>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">+45%</div>
                <div className="text-sm text-muted-foreground">Conversión de leads</div>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">¿Cómo Funciona?</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
              <h4 className="font-semibold mb-2">Captura</h4>
              <p className="text-sm text-muted-foreground">Kyle conversa con visitantes del sitio web, recopilando preferencias y presupuesto</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
              <h4 className="font-semibold mb-2">Visualiza</h4>
              <p className="text-sm text-muted-foreground">Genera renders preliminares con IA basados en las preferencias del cliente</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
              <h4 className="font-semibold mb-2">Propone</h4>
              <p className="text-sm text-muted-foreground">Calcula honorarios y genera contratos de diseño profesionales automáticamente</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">4</div>
              <h4 className="font-semibold mb-2">Gestiona</h4>
              <p className="text-sm text-muted-foreground">Asiste al equipo de diseño con búsqueda de productos y comunicación con clientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <h2 className="text-2xl font-bold border-b pb-2 mt-8">Casos de Uso Reales</h2>
      
      <DocScreenshot 
        src={screenshotDashboard} 
        alt="Dashboard principal de Kyle" 
        caption="Fig. 1: Panel de control principal mostrando métricas de leads y actividad del equipo"
      />

      {/* Client Use Cases */}
      <div className="not-prose mt-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Para Clientes
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h4 className="font-bold text-foreground mb-3">🏠 María: La Ejecutiva Nocturna</h4>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Contexto:</strong> María es CFO de una empresa tecnológica. Trabaja hasta las 10 PM y solo tiene 
              tiempo para buscar diseñadores de noche.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span><strong>11:30 PM:</strong> María visita el sitio web del estudio. Kyle la saluda inmediatamente.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span><strong>11:35 PM:</strong> Describe su cocina ideal: "Algo moderno con isla, electrodomésticos Sub-Zero, cuarzo blanco".</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span><strong>11:36 PM:</strong> Kyle genera un render preliminar de su cocina soñada en 30 segundos.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                <span><strong>11:40 PM:</strong> María recibe una propuesta con honorarios estimados en $8,500.</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <strong className="text-green-600">Resultado:</strong> María agenda una consulta para el día siguiente. 
              Sin Kyle, hubiera abandonado el sitio y contactado a un competidor.
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h4 className="font-bold text-foreground mb-3">🏢 Roberto: El Desarrollador Inmobiliario</h4>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Contexto:</strong> Roberto necesita diseñar 12 departamentos modelo para un nuevo desarrollo. 
              Requiere respuestas rápidas y documentación profesional.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span><strong>Día 1:</strong> Contacta al estudio explicando el proyecto. Kyle captura todos los requisitos.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span><strong>Día 1:</strong> Kyle genera visualizaciones preliminares de 3 estilos diferentes.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span><strong>Día 2:</strong> Recibe propuesta formal con desglose de honorarios por unidad.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                <span><strong>Día 3:</strong> Firma el contrato de diseño digitalmente desde su teléfono.</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <strong className="text-green-600">Resultado:</strong> Proyecto de $120,000 cerrado en 3 días. 
              El proceso tradicional hubiera tomado 2-3 semanas.
            </div>
          </div>
        </div>
      </div>

      <DocScreenshot 
        src={screenshotKyleVoice} 
        alt="Interfaz de voz de Kyle" 
        caption="Fig. 2: Interfaz de conversación por voz de Kyle para captura de leads"
      />

      {/* Designer Use Cases */}
      <div className="not-prose mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          Para Diseñadores
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
            <h4 className="font-bold text-foreground mb-3">🎨 Ana: La Diseñadora Multitarea</h4>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Contexto:</strong> Ana maneja 5 proyectos simultáneamente y necesita encontrar productos 
              específicos sin perder horas navegando catálogos.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span><strong>Comando:</strong> "Kyle, busca lámparas colgantes de latón para comedor, máximo $800"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span><strong>Respuesta:</strong> Kyle presenta 5 opciones de proveedores verificados con precios y disponibilidad.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span><strong>Comando:</strong> "Kyle, envía un mensaje a la Sra. González diciendo que su pedido llegará el viernes"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                <span><strong>Resultado:</strong> Kyle envía el mensaje profesionalmente formateado al cliente.</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <strong className="text-green-600">Impacto:</strong> Ana ahorra 2 horas diarias en búsqueda de productos 
              y comunicación con clientes.
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
            <h4 className="font-bold text-foreground mb-3">📊 Carlos: El Socio Fundador</h4>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Contexto:</strong> Carlos dirige un estudio con 4 diseñadores. Necesita visibilidad 
              del pipeline de ventas y métricas de conversión.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span><strong>Comando:</strong> "Kyle, muéstrame los leads de hoy"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span><strong>Respuesta:</strong> "Hoy tienes 3 leads nuevos: cocina de María ($8.5K), baño de Pedro ($3.2K), y sala de Lucía ($5.1K)"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span><strong>Dashboard:</strong> Visualiza tasas de conversión, tiempo promedio de cierre, y revenue proyectado.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                <span><strong>Comando:</strong> "Kyle, genera propuesta para María"</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <strong className="text-green-600">Impacto:</strong> Carlos tiene visibilidad completa del negocio 
              y toma decisiones basadas en datos en tiempo real.
            </div>
          </div>
        </div>
      </div>

      <DocScreenshot 
        src={screenshotAnalytics} 
        alt="Dashboard de analytics" 
        caption="Fig. 3: Panel de analytics con métricas de conversión y revenue"
      />
    </section>

     {/* Cover Page */}
     <div className="text-center py-16 print:py-24 border-b print:border-0 print:page-break-after-always">
       <div className="flex justify-center mb-8">
         <FileText className="h-20 w-20 text-primary" />
       </div>
       <h1 className="text-4xl font-bold mb-4">Kyle AI Platform</h1>
       <p className="text-xl text-muted-foreground mb-2">Documentación Técnica Completa</p>
       <p className="text-muted-foreground">Kuester Design Studio</p>
       <p className="text-sm text-muted-foreground mt-8">Versión 1.0 | Febrero 2026</p>
     </div>
 
     {/* Table of Contents */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">Tabla de Contenidos</h2>
       <ol className="list-decimal list-inside space-y-2 mt-4">
         <li>Resumen Ejecutivo</li>
         <li>Arquitectura del Sistema</li>
         <li>Esquema de Base de Datos</li>
         <li>Casos de Uso Principales</li>
         <li>Flujos de Usuario</li>
         <li>Catálogo de Edge Functions</li>
         <li>Integraciones Externas</li>
         <li>Sistema de Notificaciones</li>
         <li>Seguridad y RLS</li>
         <li>Guía de Mantenimiento</li>
       </ol>
     </section>
 
     {/* Page 1: Executive Summary */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">1. Resumen Ejecutivo</h2>
       <p className="mt-4">
         Kyle AI Platform es una solución integral de propósito dual diseñada para Kuester Design Studio 
         que revoluciona la captación de clientes y la gestión de proyectos de diseño de interiores.
       </p>
       
       <h3 className="text-xl font-semibold mt-6">Objetivos Principales</h3>
       <ul className="list-disc list-inside space-y-2 mt-2">
         <li><strong>Captación Automatizada:</strong> Kyle interactúa con visitantes del sitio web mediante conversaciones por voz</li>
         <li><strong>Cualificación de Leads:</strong> Extracción estructurada de requisitos, preferencias y presupuesto</li>
         <li><strong>Generación Visual:</strong> Creación de visualizaciones preliminares usando IA (Flux 2 Pro)</li>
         <li><strong>Propuestas Automáticas:</strong> Cálculo de tarifas y generación de contratos de diseño</li>
         <li><strong>Asistente Backend:</strong> Kyle ayuda al equipo con sourcing de productos y comunicación</li>
       </ul>
 
       <h3 className="text-xl font-semibold mt-6">Stack Tecnológico</h3>
       <div className="overflow-x-auto mt-2">
         <table className="min-w-full border">
           <thead>
             <tr className="bg-muted">
               <th className="border px-4 py-2 text-left">Capa</th>
               <th className="border px-4 py-2 text-left">Tecnología</th>
             </tr>
           </thead>
           <tbody>
             <tr><td className="border px-4 py-2">Frontend</td><td className="border px-4 py-2">React 18 + TypeScript + Vite</td></tr>
             <tr><td className="border px-4 py-2">Estilos</td><td className="border px-4 py-2">Tailwind CSS + shadcn/ui</td></tr>
             <tr><td className="border px-4 py-2">Estado</td><td className="border px-4 py-2">TanStack Query + React Context</td></tr>
             <tr><td className="border px-4 py-2">Backend</td><td className="border px-4 py-2">Supabase (PostgreSQL + Edge Functions)</td></tr>
             <tr><td className="border px-4 py-2">Voz/TTS</td><td className="border px-4 py-2">ElevenLabs Conversational AI</td></tr>
             <tr><td className="border px-4 py-2">NLP/Insights</td><td className="border px-4 py-2">Google Gemini 2.5</td></tr>
             <tr><td className="border px-4 py-2">Generación de Imágenes</td><td className="border px-4 py-2">Flux 2 Pro (Replicate)</td></tr>
             <tr><td className="border px-4 py-2">Email</td><td className="border px-4 py-2">Resend</td></tr>
           </tbody>
         </table>
       </div>
     </section>
 
     {/* Page 2: System Architecture */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">2. Arquitectura del Sistema</h2>
      
      <DocScreenshot 
        src={screenshotDashboard} 
        alt="Vista general del sistema" 
        caption="Fig. 4: Vista general del sistema mostrando navegación y componentes principales"
      />
       
       <h3 className="text-xl font-semibold mt-6">Diagrama de Arquitectura</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`┌─────────────────────────────────────────────────────────────┐
 │                    SITIO WEB PÚBLICO                        │
 │  ┌─────────────────────────────────────────────────────┐   │
 │  │   Kyle Widget (Chatbot Embebible)                   │   │
 │  │   • Saluda visitantes                               │   │
 │  │   • Recolecta requisitos del proyecto               │   │
 │  │   • Genera visualización preliminar                 │   │
 │  │   • Captura datos del lead                          │   │
 │  └─────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  CAPA DE GESTIÓN DE LEADS                   │
 │  ┌─────────────────────────────────────────────────────┐   │
 │  │  Tabla leads                                        │   │
 │  │  • Información de contacto                          │   │
 │  │  • Requisitos del proyecto                          │   │
 │  │  • Rango de presupuesto                             │   │
 │  │  • Preferencias de marcas                           │   │
 │  │  • Transcripción de conversación                    │   │
 │  │  • URL de diseño generado                           │   │
 │  │  • Estado (nuevo/cualificado/convertido)            │   │
 │  └─────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               DASHBOARD DE DISEÑADORES                      │
 │  ┌─────────────────────────────────────────────────────┐   │
 │  │  • Ver leads entrantes                              │   │
 │  │  • Revisar conversaciones de Kyle                   │   │
 │  │  • Generar propuestas                               │   │
 │  │  • Enviar contratos de diseño                       │   │
 │  │  • Asignar a miembros del equipo                    │   │
 │  └─────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────┘`}
       </pre>
 
       <h3 className="text-xl font-semibold mt-6">Flujo de Datos</h3>
       <ol className="list-decimal list-inside space-y-2 mt-2">
         <li>Visitante inicia conversación con Kyle Widget</li>
         <li>ElevenLabs procesa voz → texto y genera respuestas</li>
         <li>Al finalizar, webhook dispara <code>kyle-lead-capture</code></li>
         <li>Gemini extrae insights estructurados del transcript</li>
         <li>Flux genera imagen de diseño preliminar</li>
         <li>Lead se guarda en base de datos con todos los datos</li>
         <li>Notificación enviada al equipo de diseño</li>
       </ol>
     </section>
 
     {/* Page 3: Database Schema */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">3. Esquema de Base de Datos</h2>
      
      <DocScreenshot 
        src={screenshotLeads} 
        alt="Gestión de leads" 
        caption="Fig. 5: Panel de gestión de leads mostrando el pipeline de estados"
      />
       
       <h3 className="text-xl font-semibold mt-6">Diagrama Entidad-Relación</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`┌──────────────┐       ┌──────────────┐       ┌──────────────┐
 │   offices    │       │    leads     │       │  proposals   │
 ├──────────────┤       ├──────────────┤       ├──────────────┤
 │ id (PK)      │◄──────│ office_id    │       │ id (PK)      │
 │ name         │       │ id (PK)      │◄──────│ lead_id (FK) │
 │ location     │       │ name         │       │ office_id    │
 │ email        │       │ email        │       │ total_fee    │
 │ phone        │       │ phone        │       │ status       │
 │ timezone     │       │ project_type │       │ agreement    │
 └──────────────┘       │ budget_min   │       └──────────────┘
        │               │ budget_max   │
        │               │ status       │
        ▼               │ assigned_to  │
 ┌──────────────┐       └──────────────┘
 │ team_members │              │
 ├──────────────┤              ▼
 │ id (PK)      │       ┌──────────────┐
 │ office_id    │       │lead_messages │
 │ user_id      │       ├──────────────┤
 │ display_name │       │ id (PK)      │
 │ title        │       │ lead_id (FK) │
 │ is_active    │       │ sender       │
 └──────────────┘       │ content      │
                        │ read_at      │
                        └──────────────┘`}
       </pre>
 
       <h3 className="text-xl font-semibold mt-6">Tabla: leads</h3>
       <div className="overflow-x-auto mt-2">
         <table className="min-w-full border text-sm">
           <thead>
             <tr className="bg-muted">
               <th className="border px-3 py-2">Columna</th>
               <th className="border px-3 py-2">Tipo</th>
               <th className="border px-3 py-2">Descripción</th>
             </tr>
           </thead>
           <tbody>
             <tr><td className="border px-3 py-2">id</td><td className="border px-3 py-2">UUID</td><td className="border px-3 py-2">Identificador único</td></tr>
             <tr><td className="border px-3 py-2">office_id</td><td className="border px-3 py-2">UUID (FK)</td><td className="border px-3 py-2">Referencia a oficina</td></tr>
             <tr><td className="border px-3 py-2">name</td><td className="border px-3 py-2">TEXT</td><td className="border px-3 py-2">Nombre del cliente</td></tr>
             <tr><td className="border px-3 py-2">email</td><td className="border px-3 py-2">TEXT</td><td className="border px-3 py-2">Email de contacto</td></tr>
             <tr><td className="border px-3 py-2">project_type</td><td className="border px-3 py-2">TEXT</td><td className="border px-3 py-2">kitchen, bathroom, bedroom, etc.</td></tr>
             <tr><td className="border px-3 py-2">budget_min/max</td><td className="border px-3 py-2">NUMERIC</td><td className="border px-3 py-2">Rango de presupuesto</td></tr>
             <tr><td className="border px-3 py-2">status</td><td className="border px-3 py-2">ENUM</td><td className="border px-3 py-2">new, qualified, contacted, proposal_sent, converted, lost</td></tr>
             <tr><td className="border px-3 py-2">appliance_brands</td><td className="border px-3 py-2">TEXT[]</td><td className="border px-3 py-2">Marcas de electrodomésticos preferidas</td></tr>
             <tr><td className="border px-3 py-2">extracted_insights</td><td className="border px-3 py-2">JSONB</td><td className="border px-3 py-2">Insights extraídos por Gemini</td></tr>
           </tbody>
         </table>
       </div>
 
       <h3 className="text-xl font-semibold mt-6">Pipeline de Estados</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm mt-4">
 {`NEW ──► QUALIFIED ──► CONTACTED ──► PROPOSAL_SENT ──► CONVERTED
  │                                                        │
  └────────────────────► LOST ◄────────────────────────────┘`}
       </pre>
     </section>
 
     {/* Page 4-5: Use Cases */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">4. Casos de Uso Principales</h2>
      
      <DocScreenshot 
        src={screenshotKyleVoice} 
        alt="Captura de leads con Kyle" 
        caption="Fig. 6: Interfaz de captura de leads mediante conversación de voz"
      />
       
       <div className="mt-6 space-y-8">
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">UC-001: Captación de Lead via Kyle Widget</h3>
           <p className="text-sm text-muted-foreground mt-1">Actor: Visitante del sitio web</p>
           <div className="mt-3">
             <p><strong>Precondiciones:</strong></p>
             <ul className="list-disc list-inside text-sm ml-4">
               <li>Kyle Widget embebido en sitio web del cliente</li>
               <li>Visitante tiene micrófono habilitado</li>
             </ul>
           </div>
           <div className="mt-3">
             <p><strong>Flujo Principal:</strong></p>
             <ol className="list-decimal list-inside text-sm ml-4 space-y-1">
               <li>Visitante hace clic en widget de Kyle</li>
               <li>Kyle saluda y pregunta sobre el proyecto</li>
               <li>Visitante describe sus necesidades por voz</li>
               <li>Kyle pregunta sobre tipo de proyecto, estilo, marcas preferidas</li>
               <li>Kyle pregunta sobre rango de presupuesto</li>
               <li>Visitante dice frase mágica para generar diseño</li>
               <li>Sistema genera visualización con Flux 2 Pro</li>
               <li>Kyle muestra diseño y solicita datos de contacto</li>
               <li>Lead guardado con todos los datos capturados</li>
             </ol>
           </div>
           <div className="mt-3">
             <p><strong>Postcondiciones:</strong></p>
             <ul className="list-disc list-inside text-sm ml-4">
               <li>Lead creado con status "new"</li>
               <li>Equipo de diseño notificado</li>
               <li>Imagen de diseño preliminar generada</li>
             </ul>
           </div>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">UC-002: Generación de Propuesta</h3>
           <p className="text-sm text-muted-foreground mt-1">Actor: Diseñador</p>
           <div className="mt-3">
             <p><strong>Flujo Principal:</strong></p>
             <ol className="list-decimal list-inside text-sm ml-4 space-y-1">
               <li>Diseñador accede a dashboard de leads</li>
               <li>Selecciona lead cualificado</li>
               <li>Revisa insights extraídos de la conversación</li>
               <li>Hace clic en "Generar Propuesta"</li>
               <li>Sistema calcula tarifa basada en tipo/complejidad</li>
               <li>Sistema genera contrato de diseño</li>
               <li>Diseñador revisa y personaliza si necesario</li>
               <li>Envía propuesta al cliente por email</li>
             </ol>
           </div>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">UC-003: Búsqueda de Productos via Kyle</h3>
           <p className="text-sm text-muted-foreground mt-1">Actor: Diseñador</p>
           <div className="mt-3">
             <p><strong>Flujo Principal:</strong></p>
             <ol className="list-decimal list-inside text-sm ml-4 space-y-1">
               <li>Diseñador activa Kyle en modo backend</li>
               <li>Dice: "Kyle, busca lámparas de cobre modernas bajo $500"</li>
               <li>Kyle procesa comando via kyle-tasks-ai</li>
               <li>Sistema llama a kyle-product-search</li>
               <li>Kyle responde con opciones encontradas</li>
             </ol>
           </div>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">UC-004: Mensajería Asíncrona</h3>
           <p className="text-sm text-muted-foreground mt-1">Actor: Diseñador</p>
           <div className="mt-3">
             <p><strong>Flujo Principal:</strong></p>
             <ol className="list-decimal list-inside text-sm ml-4 space-y-1">
               <li>Diseñador dice: "Kyle, mensaje a María diciendo que su moodboard está listo"</li>
               <li>Kyle identifica lead por nombre</li>
               <li>Sistema llama a kyle-send-message</li>
               <li>Email enviado al cliente</li>
               <li>Mensaje guardado en lead_messages</li>
               <li>Kyle confirma envío exitoso</li>
             </ol>
           </div>
         </div>
       </div>
     </section>
 
     {/* Page 6: User Flows */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">5. Flujos de Usuario</h2>
      
      <DocScreenshot 
        src={screenshotProposal} 
        alt="Sistema de propuestas" 
        caption="Fig. 7: Generación y visualización de propuestas de diseño"
      />
       
       <h3 className="text-xl font-semibold mt-6">Flujo: Captación de Lead</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
 │Visitante│     │  Kyle   │     │ElevenLabs│    │ Gemini  │
 └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
      │               │               │               │
      │ Click widget  │               │               │
      │──────────────►│               │               │
      │               │ Start session │               │
      │               │──────────────►│               │
      │               │◄──────────────│               │
      │ "Hola Kyle"   │               │               │
      │──────────────►│ Speech-to-text│               │
      │               │──────────────►│               │
      │               │◄──────────────│               │
      │◄──────────────│ TTS Response  │               │
      │               │               │               │
      │ [Conversación completa...]    │               │
      │               │               │               │
      │ "Finalizar"   │               │               │
      │──────────────►│ End session   │               │
      │               │──────────────►│               │
      │               │  Webhook      │               │
      │               │◄──────────────│               │
      │               │               │ Extract       │
      │               │               │ insights      │
      │               │──────────────────────────────►│
      │               │◄──────────────────────────────│
      │               │               │               │
      │               │ Generate image (Flux)         │
      │               │─────────────────────────────► │
      │               │◄─────────────────────────────│ │
      │               │               │               │
      │               │ Save lead + Notify team       │
      │               │─────────────────────────────► │
      └───────────────┴───────────────┴───────────────┘`}
       </pre>
 
       <h3 className="text-xl font-semibold mt-6">Flujo: Generación de Propuesta</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
 │Diseñador│     │Dashboard│     │Edge Func│     │  Email  │
 └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
      │               │               │               │
      │ Ver lead      │               │               │
      │──────────────►│               │               │
      │◄──────────────│ Datos + insights              │
      │               │               │               │
      │ Generar prop. │               │               │
      │──────────────►│ calculate-fee │               │
      │               │──────────────►│               │
      │               │◄──────────────│ Fee breakdown │
      │               │               │               │
      │               │ generate-agreement            │
      │               │──────────────►│               │
      │               │◄──────────────│ HTML contract │
      │               │               │               │
      │ Revisar/Edit  │               │               │
      │──────────────►│               │               │
      │               │               │               │
      │ Enviar        │               │               │
      │──────────────►│ send-notification             │
      │               │──────────────────────────────►│
      │               │               │               │
      │◄──────────────│ Confirmación  │◄──────────────│
      └───────────────┴───────────────┴───────────────┘`}
       </pre>
     </section>
 
     {/* Page 7: Edge Functions */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">6. Catálogo de Edge Functions</h2>
      
      <DocScreenshot 
        src={screenshotEmbed} 
        alt="Generador de embed" 
        caption="Fig. 8: Configurador del widget embebible de Kyle"
      />
       
       <div className="overflow-x-auto mt-4">
         <table className="min-w-full border text-sm">
           <thead>
             <tr className="bg-muted">
               <th className="border px-3 py-2">Función</th>
               <th className="border px-3 py-2">Propósito</th>
               <th className="border px-3 py-2">Integraciones</th>
             </tr>
           </thead>
           <tbody>
             <tr>
               <td className="border px-3 py-2 font-mono">create-kyle-lead-agent</td>
               <td className="border px-3 py-2">Crea agente ElevenLabs para captación</td>
               <td className="border px-3 py-2">ElevenLabs</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">kyle-lead-capture</td>
               <td className="border px-3 py-2">Procesa webhook al finalizar conversación</td>
               <td className="border px-3 py-2">Gemini, Flux, Supabase</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">kyle-tasks-ai</td>
               <td className="border px-3 py-2">Procesa comandos de voz del diseñador</td>
               <td className="border px-3 py-2">Gemini</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">kyle-product-search</td>
               <td className="border px-3 py-2">Busca productos en catálogos</td>
               <td className="border px-3 py-2">Gemini, APIs externas</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">kyle-send-message</td>
               <td className="border px-3 py-2">Envía mensajes a clientes</td>
               <td className="border px-3 py-2">Resend, Supabase</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">calculate-design-fee</td>
               <td className="border px-3 py-2">Calcula tarifa de diseño</td>
               <td className="border px-3 py-2">Supabase</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">generate-design-agreement</td>
               <td className="border px-3 py-2">Genera contrato de diseño</td>
               <td className="border px-3 py-2">Gemini</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">send-notification</td>
               <td className="border px-3 py-2">Envía notificaciones por email</td>
               <td className="border px-3 py-2">Resend</td>
             </tr>
           </tbody>
         </table>
       </div>
 
       <h3 className="text-xl font-semibold mt-6">Ejemplo: kyle-tasks-ai</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`// Comandos soportados:
 
 "Kyle, busca lámparas de cobre modernas"
 → action: "search_products"
 → Llama: kyle-product-search
 
 "Kyle, mensaje a María diciendo que su moodboard está listo"
 → action: "send_message"
 → Llama: kyle-send-message
 
 "Kyle, ¿cuál es el estado del proyecto de Juan?"
 → action: "check_status"
 → Consulta: leads table
 
 "Kyle, genera una propuesta para María"
 → action: "generate_proposal"
 → Retorna: navigate_to URL
 
 "Kyle, muéstrame los leads de hoy"
 → action: "list_leads"
 → Consulta: leads WHERE created_at = today`}
       </pre>
     </section>
 
     {/* Page 8: External Integrations */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">7. Integraciones Externas</h2>
       
       <div className="grid gap-6 mt-6">
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">ElevenLabs Conversational AI</h3>
           <p className="text-sm text-muted-foreground mt-2">
             Proporciona capacidades de voz bidireccional para Kyle.
           </p>
           <ul className="list-disc list-inside text-sm mt-2 space-y-1">
             <li><strong>Speech-to-Text:</strong> Transcripción en tiempo real</li>
             <li><strong>Text-to-Speech:</strong> Voz natural de Kyle</li>
             <li><strong>Webhooks:</strong> Notificación al finalizar conversación</li>
             <li><strong>Tool Calling:</strong> Dispara funciones durante conversación</li>
           </ul>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">Google Gemini 2.5</h3>
           <p className="text-sm text-muted-foreground mt-2">
             Motor de NLP para extracción de insights y procesamiento de comandos.
           </p>
           <ul className="list-disc list-inside text-sm mt-2 space-y-1">
             <li><strong>Extracción estructurada:</strong> JSON de preferencias/requisitos</li>
             <li><strong>Clasificación de comandos:</strong> Identifica acción + parámetros</li>
             <li><strong>Generación de contratos:</strong> Texto legal personalizado</li>
           </ul>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">Flux 2 Pro (Replicate)</h3>
           <p className="text-sm text-muted-foreground mt-2">
             Generación de imágenes de diseño de interiores.
           </p>
           <ul className="list-disc list-inside text-sm mt-2 space-y-1">
             <li><strong>Resolución:</strong> 1024x1024 (configurable)</li>
             <li><strong>Estilo:</strong> Renderizado fotorealista de interiores</li>
             <li><strong>Tiempo:</strong> ~15-30 segundos por imagen</li>
           </ul>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">Resend</h3>
           <p className="text-sm text-muted-foreground mt-2">
             Servicio de email transaccional para notificaciones.
           </p>
           <ul className="list-disc list-inside text-sm mt-2 space-y-1">
             <li><strong>Nuevo lead:</strong> Notifica al equipo</li>
             <li><strong>Propuesta:</strong> Envía al cliente</li>
             <li><strong>Mensajes:</strong> Comunicación asíncrona</li>
           </ul>
         </div>
       </div>
     </section>
 
     {/* Page 9: Security */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">8. Seguridad y RLS</h2>
      
      <DocScreenshot 
        src={screenshotAnalytics} 
        alt="Panel de analytics" 
        caption="Fig. 9: Dashboard de métricas para monitoreo de seguridad y rendimiento"
      />
       
       <h3 className="text-xl font-semibold mt-6">Políticas de Row Level Security</h3>
       <p className="mt-2">
         Todas las tablas principales tienen RLS habilitado para garantizar aislamiento de datos por oficina.
       </p>
 
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`-- Ejemplo: Política para tabla leads
 CREATE POLICY "Users can view leads from their office"
 ON public.leads
 FOR SELECT
 USING (
   office_id IN (
     SELECT office_id FROM team_members
     WHERE user_id = auth.uid()
   )
 );
 
 CREATE POLICY "Users can insert leads to their office"
 ON public.leads
 FOR INSERT
 WITH CHECK (
   office_id IN (
     SELECT office_id FROM team_members
     WHERE user_id = auth.uid()
   )
 );
 
 -- Política para acceso público (widget)
 CREATE POLICY "Allow public lead creation"
 ON public.leads
 FOR INSERT
 WITH CHECK (true);  -- Controlado por edge function`}
       </pre>
 
       <h3 className="text-xl font-semibold mt-6">Autenticación</h3>
       <ul className="list-disc list-inside space-y-2 mt-2">
         <li><strong>Método:</strong> Email + contraseña via Supabase Auth</li>
         <li><strong>Verificación:</strong> Email de confirmación requerido</li>
         <li><strong>Sesión:</strong> JWT tokens con refresh automático</li>
         <li><strong>Roles:</strong> managing_partner, collaborator, admin</li>
       </ul>
 
       <h3 className="text-xl font-semibold mt-6">Secrets Management</h3>
       <div className="overflow-x-auto mt-2">
         <table className="min-w-full border text-sm">
           <thead>
             <tr className="bg-muted">
               <th className="border px-3 py-2">Secret</th>
               <th className="border px-3 py-2">Uso</th>
             </tr>
           </thead>
           <tbody>
             <tr><td className="border px-3 py-2 font-mono">ELEVENLABS_API_KEY</td><td className="border px-3 py-2">API de voz</td></tr>
             <tr><td className="border px-3 py-2 font-mono">GEMINI_API_KEY</td><td className="border px-3 py-2">API de NLP (opcional, usa Lovable AI)</td></tr>
             <tr><td className="border px-3 py-2 font-mono">REPLICATE_API_TOKEN</td><td className="border px-3 py-2">Generación de imágenes</td></tr>
             <tr><td className="border px-3 py-2 font-mono">RESEND_API_KEY</td><td className="border px-3 py-2">Email transaccional</td></tr>
           </tbody>
         </table>
       </div>
     </section>
 
     {/* Page 10: Maintenance Guide */}
     <section className="py-8">
       <h2 className="text-2xl font-bold border-b pb-2">9. Guía de Mantenimiento</h2>
       
       <h3 className="text-xl font-semibold mt-6">Monitoreo</h3>
       <ul className="list-disc list-inside space-y-2 mt-2">
         <li><strong>Logs de Edge Functions:</strong> Disponibles en Lovable Cloud</li>
         <li><strong>Métricas de Base de Datos:</strong> Queries lentas, uso de almacenamiento</li>
         <li><strong>Analytics:</strong> Dashboard en /kustr/analytics</li>
       </ul>
 
       <h3 className="text-xl font-semibold mt-6">Troubleshooting Común</h3>
       <div className="overflow-x-auto mt-2">
         <table className="min-w-full border text-sm">
           <thead>
             <tr className="bg-muted">
               <th className="border px-3 py-2">Problema</th>
               <th className="border px-3 py-2">Causa</th>
               <th className="border px-3 py-2">Solución</th>
             </tr>
           </thead>
           <tbody>
             <tr>
               <td className="border px-3 py-2">Kyle no responde</td>
               <td className="border px-3 py-2">API key expirada</td>
               <td className="border px-3 py-2">Verificar ELEVENLABS_API_KEY</td>
             </tr>
             <tr>
               <td className="border px-3 py-2">Imagen no genera</td>
               <td className="border px-3 py-2">Límite de Replicate</td>
               <td className="border px-3 py-2">Verificar créditos y token</td>
             </tr>
             <tr>
               <td className="border px-3 py-2">Lead no se guarda</td>
               <td className="border px-3 py-2">Error de RLS</td>
               <td className="border px-3 py-2">Verificar políticas de inserción</td>
             </tr>
             <tr>
               <td className="border px-3 py-2">Email no llega</td>
               <td className="border px-3 py-2">Dominio no verificado</td>
               <td className="border px-3 py-2">Configurar DNS en Resend</td>
             </tr>
           </tbody>
         </table>
       </div>
 
       <h3 className="text-xl font-semibold mt-6">Actualizaciones Recomendadas</h3>
       <ul className="list-disc list-inside space-y-2 mt-2">
         <li>Revisar API keys cada 90 días</li>
         <li>Actualizar system prompts según feedback</li>
         <li>Monitorear tasas de conversión semanalmente</li>
         <li>Backup de base de datos diario (automático)</li>
       </ul>
 
       <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
         <p>© 2026 Kuester Design Studio. Todos los derechos reservados.</p>
         <p className="mt-2">Kyle AI Platform - Documentación Técnica v1.0</p>
       </div>
     </section>
   </article>
 );
 
 const EnglishDocumentation = () => (
   <article className="prose prose-slate dark:prose-invert max-w-none print:prose-sm">
    {/* Storytelling / Pitch Section */}
    <section className="py-8 print:page-break-after-always">
      <div className="not-prose bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl p-8 mb-8 print:bg-white print:border print:border-gray-300">
        <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-primary" />
          The Kyle Story
        </h2>
        
        {/* Problem */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-destructive mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            The Problem
          </h3>
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
            <p className="text-foreground leading-relaxed mb-4">
              <strong>Interior design studios face a critical challenge:</strong> 73% of prospects visiting their 
              website leave without providing contact information. Why? Because they expect immediate responses, 
              personalized visualizations, and instant quotes.
            </p>
            <ul className="space-y-2 text-muted-foreground list-none pl-0">
              <li>• Potential clients reach out at 11 PM and don't get a response until 9 AM the next day</li>
              <li>• Designers spend 40% of their time on administrative tasks instead of creating</li>
              <li>• Manual quotes take 2-3 days, losing opportunities to faster competitors</li>
              <li>• Fragmented communication across email, WhatsApp, and calls creates confusion and lost projects</li>
            </ul>
          </div>
        </div>

        {/* Solution */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            The Solution: Kyle AI
          </h3>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
            <p className="text-foreground leading-relaxed mb-4">
              <strong>Kyle is an artificial intelligence assistant</strong> designed specifically for interior 
              design studios. It operates 24/7, capturing leads, generating preliminary visualizations in seconds, 
              and creating professional proposals automatically.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Availability</div>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">&lt;30s</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">+45%</div>
                <div className="text-sm text-muted-foreground">Lead Conversion</div>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">How Does It Work?</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
              <h4 className="font-semibold mb-2">Capture</h4>
              <p className="text-sm text-muted-foreground">Kyle chats with website visitors, collecting preferences and budget</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
              <h4 className="font-semibold mb-2">Visualize</h4>
              <p className="text-sm text-muted-foreground">Generates AI preliminary renders based on client preferences</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
              <h4 className="font-semibold mb-2">Propose</h4>
              <p className="text-sm text-muted-foreground">Calculates fees and generates professional design contracts automatically</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-bold">4</div>
              <h4 className="font-semibold mb-2">Manage</h4>
              <p className="text-sm text-muted-foreground">Assists the design team with product sourcing and client communication</p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <h2 className="text-2xl font-bold border-b pb-2 mt-8">Real Use Cases</h2>
      
      <DocScreenshot 
        src={screenshotDashboard} 
        alt="Kyle main dashboard" 
        caption="Fig. 1: Main control panel showing lead metrics and team activity"
      />

      {/* Client Use Cases */}
      <div className="not-prose mt-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          For Clients
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h4 className="font-bold text-foreground mb-3">🏠 Maria: The Night-Owl Executive</h4>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Context:</strong> Maria is CFO of a tech company. She works until 10 PM and only has 
              time to search for designers at night.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span><strong>11:30 PM:</strong> Maria visits the studio website. Kyle greets her immediately.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span><strong>11:35 PM:</strong> She describes her ideal kitchen: "Something modern with an island, Sub-Zero appliances, white quartz".</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span><strong>11:36 PM:</strong> Kyle generates a preliminary render of her dream kitchen in 30 seconds.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                <span><strong>11:40 PM:</strong> Maria receives a proposal with estimated fees of $8,500.</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <strong className="text-green-600">Result:</strong> Maria schedules a consultation for the next day. 
              Without Kyle, she would have left the site and contacted a competitor.
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h4 className="font-bold text-foreground mb-3">🏢 Robert: The Real Estate Developer</h4>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Context:</strong> Robert needs to design 12 model apartments for a new development. 
              He requires fast responses and professional documentation.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span><strong>Day 1:</strong> Contacts the studio explaining the project. Kyle captures all requirements.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span><strong>Day 1:</strong> Kyle generates preliminary visualizations of 3 different styles.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span><strong>Day 2:</strong> Receives formal proposal with fee breakdown per unit.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                <span><strong>Day 3:</strong> Signs the design contract digitally from his phone.</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <strong className="text-green-600">Result:</strong> $120,000 project closed in 3 days. 
              The traditional process would have taken 2-3 weeks.
            </div>
          </div>
        </div>
      </div>

      <DocScreenshot 
        src={screenshotKyleVoice} 
        alt="Kyle voice interface" 
        caption="Fig. 2: Kyle voice conversation interface for lead capture"
      />

      {/* Designer Use Cases */}
      <div className="not-prose mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          For Designers
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
            <h4 className="font-bold text-foreground mb-3">🎨 Ana: The Multitasking Designer</h4>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Context:</strong> Ana manages 5 projects simultaneously and needs to find specific 
              products without spending hours browsing catalogs.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span><strong>Command:</strong> "Kyle, search for brass pendant lights for dining room, max $800"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span><strong>Response:</strong> Kyle presents 5 options from verified suppliers with prices and availability.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span><strong>Command:</strong> "Kyle, send a message to Mrs. González saying her order will arrive Friday"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                <span><strong>Result:</strong> Kyle sends the professionally formatted message to the client.</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <strong className="text-green-600">Impact:</strong> Ana saves 2 hours daily on product sourcing 
              and client communication.
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
            <h4 className="font-bold text-foreground mb-3">📊 Carlos: The Founding Partner</h4>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Context:</strong> Carlos runs a studio with 4 designers. He needs visibility 
              into the sales pipeline and conversion metrics.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span><strong>Command:</strong> "Kyle, show me today's leads"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span><strong>Response:</strong> "Today you have 3 new leads: Maria's kitchen ($8.5K), Pedro's bathroom ($3.2K), and Lucia's living room ($5.1K)"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span><strong>Dashboard:</strong> Visualizes conversion rates, average closing time, and projected revenue.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                <span><strong>Command:</strong> "Kyle, generate proposal for Maria"</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
              <strong className="text-green-600">Impact:</strong> Carlos has complete visibility into the business 
              and makes data-driven decisions in real time.
            </div>
          </div>
        </div>
      </div>

      <DocScreenshot 
        src={screenshotAnalytics} 
        alt="Analytics dashboard" 
        caption="Fig. 3: Analytics panel with conversion and revenue metrics"
      />
    </section>

     {/* Cover Page */}
     <div className="text-center py-16 print:py-24 border-b print:border-0 print:page-break-after-always">
       <div className="flex justify-center mb-8">
         <FileText className="h-20 w-20 text-primary" />
       </div>
       <h1 className="text-4xl font-bold mb-4">Kyle AI Platform</h1>
       <p className="text-xl text-muted-foreground mb-2">Complete Technical Documentation</p>
       <p className="text-muted-foreground">Kuester Design Studio</p>
       <p className="text-sm text-muted-foreground mt-8">Version 1.0 | February 2026</p>
     </div>
 
     {/* Table of Contents */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">Table of Contents</h2>
       <ol className="list-decimal list-inside space-y-2 mt-4">
         <li>Executive Summary</li>
         <li>System Architecture</li>
         <li>Database Schema</li>
         <li>Core Use Cases</li>
         <li>User Flows</li>
         <li>Edge Functions Catalog</li>
         <li>External Integrations</li>
         <li>Notification System</li>
         <li>Security & RLS</li>
         <li>Maintenance Guide</li>
       </ol>
     </section>
 
     {/* Page 1: Executive Summary */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">1. Executive Summary</h2>
       <p className="mt-4">
         Kyle AI Platform is a comprehensive dual-purpose solution designed for Kuester Design Studio 
         that revolutionizes client acquisition and interior design project management.
       </p>
       
       <h3 className="text-xl font-semibold mt-6">Primary Objectives</h3>
       <ul className="list-disc list-inside space-y-2 mt-2">
         <li><strong>Automated Capture:</strong> Kyle interacts with website visitors through voice conversations</li>
         <li><strong>Lead Qualification:</strong> Structured extraction of requirements, preferences, and budget</li>
         <li><strong>Visual Generation:</strong> Creation of preliminary visualizations using AI (Flux 2 Pro)</li>
         <li><strong>Automatic Proposals:</strong> Fee calculation and design contract generation</li>
         <li><strong>Backend Assistant:</strong> Kyle helps the team with product sourcing and communication</li>
       </ul>
 
       <h3 className="text-xl font-semibold mt-6">Technology Stack</h3>
       <div className="overflow-x-auto mt-2">
         <table className="min-w-full border">
           <thead>
             <tr className="bg-muted">
               <th className="border px-4 py-2 text-left">Layer</th>
               <th className="border px-4 py-2 text-left">Technology</th>
             </tr>
           </thead>
           <tbody>
             <tr><td className="border px-4 py-2">Frontend</td><td className="border px-4 py-2">React 18 + TypeScript + Vite</td></tr>
             <tr><td className="border px-4 py-2">Styling</td><td className="border px-4 py-2">Tailwind CSS + shadcn/ui</td></tr>
             <tr><td className="border px-4 py-2">State</td><td className="border px-4 py-2">TanStack Query + React Context</td></tr>
             <tr><td className="border px-4 py-2">Backend</td><td className="border px-4 py-2">Supabase (PostgreSQL + Edge Functions)</td></tr>
             <tr><td className="border px-4 py-2">Voice/TTS</td><td className="border px-4 py-2">ElevenLabs Conversational AI</td></tr>
             <tr><td className="border px-4 py-2">NLP/Insights</td><td className="border px-4 py-2">Google Gemini 2.5</td></tr>
             <tr><td className="border px-4 py-2">Image Generation</td><td className="border px-4 py-2">Flux 2 Pro (Replicate)</td></tr>
             <tr><td className="border px-4 py-2">Email</td><td className="border px-4 py-2">Resend</td></tr>
           </tbody>
         </table>
       </div>
     </section>
 
     {/* Page 2: System Architecture */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">2. System Architecture</h2>
      
      <DocScreenshot 
        src={screenshotDashboard} 
        alt="System overview" 
        caption="Fig. 4: System overview showing navigation and main components"
      />
       
       <h3 className="text-xl font-semibold mt-6">Architecture Diagram</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`┌─────────────────────────────────────────────────────────────┐
 │                    PUBLIC WEBSITE                           │
 │  ┌─────────────────────────────────────────────────────┐   │
 │  │   Kyle Widget (Embeddable Chatbot)                  │   │
 │  │   • Greets visitors                                 │   │
 │  │   • Collects project requirements                   │   │
 │  │   • Generates preliminary visualization             │   │
 │  │   • Captures lead data                              │   │
 │  └─────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  LEAD MANAGEMENT LAYER                      │
 │  ┌─────────────────────────────────────────────────────┐   │
 │  │  leads table                                        │   │
 │  │  • Contact information                              │   │
 │  │  • Project requirements                             │   │
 │  │  • Budget range                                     │   │
 │  │  • Brand preferences                                │   │
 │  │  • Conversation transcript                          │   │
 │  │  • Generated design URL                             │   │
 │  │  • Status (new/qualified/converted)                 │   │
 │  └─────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               DESIGNER DASHBOARD                            │
 │  ┌─────────────────────────────────────────────────────┐   │
 │  │  • View incoming leads                              │   │
 │  │  • Review Kyle conversations                        │   │
 │  │  • Generate proposals                               │   │
 │  │  • Send design agreements                           │   │
 │  │  • Assign to team members                           │   │
 │  └─────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────┘`}
       </pre>
 
       <h3 className="text-xl font-semibold mt-6">Data Flow</h3>
       <ol className="list-decimal list-inside space-y-2 mt-2">
         <li>Visitor initiates conversation with Kyle Widget</li>
         <li>ElevenLabs processes voice → text and generates responses</li>
         <li>On completion, webhook triggers <code>kyle-lead-capture</code></li>
         <li>Gemini extracts structured insights from transcript</li>
         <li>Flux generates preliminary design image</li>
         <li>Lead saved to database with all data</li>
         <li>Notification sent to design team</li>
       </ol>
     </section>
 
     {/* Page 3: Database Schema */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">3. Database Schema</h2>
      
      <DocScreenshot 
        src={screenshotLeads} 
        alt="Lead management" 
        caption="Fig. 5: Lead management panel showing the status pipeline"
      />
       
       <h3 className="text-xl font-semibold mt-6">Entity-Relationship Diagram</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`┌──────────────┐       ┌──────────────┐       ┌──────────────┐
 │   offices    │       │    leads     │       │  proposals   │
 ├──────────────┤       ├──────────────┤       ├──────────────┤
 │ id (PK)      │◄──────│ office_id    │       │ id (PK)      │
 │ name         │       │ id (PK)      │◄──────│ lead_id (FK) │
 │ location     │       │ name         │       │ office_id    │
 │ email        │       │ email        │       │ total_fee    │
 │ phone        │       │ phone        │       │ status       │
 │ timezone     │       │ project_type │       │ agreement    │
 └──────────────┘       │ budget_min   │       └──────────────┘
        │               │ budget_max   │
        │               │ status       │
        ▼               │ assigned_to  │
 ┌──────────────┐       └──────────────┘
 │ team_members │              │
 ├──────────────┤              ▼
 │ id (PK)      │       ┌──────────────┐
 │ office_id    │       │lead_messages │
 │ user_id      │       ├──────────────┤
 │ display_name │       │ id (PK)      │
 │ title        │       │ lead_id (FK) │
 │ is_active    │       │ sender       │
 └──────────────┘       │ content      │
                        │ read_at      │
                        └──────────────┘`}
       </pre>
 
       <h3 className="text-xl font-semibold mt-6">Table: leads</h3>
       <div className="overflow-x-auto mt-2">
         <table className="min-w-full border text-sm">
           <thead>
             <tr className="bg-muted">
               <th className="border px-3 py-2">Column</th>
               <th className="border px-3 py-2">Type</th>
               <th className="border px-3 py-2">Description</th>
             </tr>
           </thead>
           <tbody>
             <tr><td className="border px-3 py-2">id</td><td className="border px-3 py-2">UUID</td><td className="border px-3 py-2">Unique identifier</td></tr>
             <tr><td className="border px-3 py-2">office_id</td><td className="border px-3 py-2">UUID (FK)</td><td className="border px-3 py-2">Office reference</td></tr>
             <tr><td className="border px-3 py-2">name</td><td className="border px-3 py-2">TEXT</td><td className="border px-3 py-2">Client name</td></tr>
             <tr><td className="border px-3 py-2">email</td><td className="border px-3 py-2">TEXT</td><td className="border px-3 py-2">Contact email</td></tr>
             <tr><td className="border px-3 py-2">project_type</td><td className="border px-3 py-2">TEXT</td><td className="border px-3 py-2">kitchen, bathroom, bedroom, etc.</td></tr>
             <tr><td className="border px-3 py-2">budget_min/max</td><td className="border px-3 py-2">NUMERIC</td><td className="border px-3 py-2">Budget range</td></tr>
             <tr><td className="border px-3 py-2">status</td><td className="border px-3 py-2">ENUM</td><td className="border px-3 py-2">new, qualified, contacted, proposal_sent, converted, lost</td></tr>
             <tr><td className="border px-3 py-2">appliance_brands</td><td className="border px-3 py-2">TEXT[]</td><td className="border px-3 py-2">Preferred appliance brands</td></tr>
             <tr><td className="border px-3 py-2">extracted_insights</td><td className="border px-3 py-2">JSONB</td><td className="border px-3 py-2">Insights extracted by Gemini</td></tr>
           </tbody>
         </table>
       </div>
 
       <h3 className="text-xl font-semibold mt-6">Status Pipeline</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm mt-4">
 {`NEW ──► QUALIFIED ──► CONTACTED ──► PROPOSAL_SENT ──► CONVERTED
  │                                                        │
  └────────────────────► LOST ◄────────────────────────────┘`}
       </pre>
     </section>
 
     {/* Page 4-5: Use Cases */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">4. Core Use Cases</h2>
      
      <DocScreenshot 
        src={screenshotKyleVoice} 
        alt="Lead capture with Kyle" 
        caption="Fig. 6: Lead capture interface via voice conversation"
      />
       
       <div className="mt-6 space-y-8">
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">UC-001: Lead Capture via Kyle Widget</h3>
           <p className="text-sm text-muted-foreground mt-1">Actor: Website Visitor</p>
           <div className="mt-3">
             <p><strong>Preconditions:</strong></p>
             <ul className="list-disc list-inside text-sm ml-4">
               <li>Kyle Widget embedded on client website</li>
               <li>Visitor has microphone enabled</li>
             </ul>
           </div>
           <div className="mt-3">
             <p><strong>Main Flow:</strong></p>
             <ol className="list-decimal list-inside text-sm ml-4 space-y-1">
               <li>Visitor clicks on Kyle widget</li>
               <li>Kyle greets and asks about the project</li>
               <li>Visitor describes needs via voice</li>
               <li>Kyle asks about project type, style, preferred brands</li>
               <li>Kyle asks about budget range</li>
               <li>Visitor says magic phrase to generate design</li>
               <li>System generates visualization with Flux 2 Pro</li>
               <li>Kyle shows design and requests contact details</li>
               <li>Lead saved with all captured data</li>
             </ol>
           </div>
           <div className="mt-3">
             <p><strong>Postconditions:</strong></p>
             <ul className="list-disc list-inside text-sm ml-4">
               <li>Lead created with "new" status</li>
               <li>Design team notified</li>
               <li>Preliminary design image generated</li>
             </ul>
           </div>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">UC-002: Proposal Generation</h3>
           <p className="text-sm text-muted-foreground mt-1">Actor: Designer</p>
           <div className="mt-3">
             <p><strong>Main Flow:</strong></p>
             <ol className="list-decimal list-inside text-sm ml-4 space-y-1">
               <li>Designer accesses leads dashboard</li>
               <li>Selects qualified lead</li>
               <li>Reviews extracted conversation insights</li>
               <li>Clicks "Generate Proposal"</li>
               <li>System calculates fee based on type/complexity</li>
               <li>System generates design contract</li>
               <li>Designer reviews and customizes if needed</li>
               <li>Sends proposal to client via email</li>
             </ol>
           </div>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">UC-003: Product Search via Kyle</h3>
           <p className="text-sm text-muted-foreground mt-1">Actor: Designer</p>
           <div className="mt-3">
             <p><strong>Main Flow:</strong></p>
             <ol className="list-decimal list-inside text-sm ml-4 space-y-1">
               <li>Designer activates Kyle in backend mode</li>
               <li>Says: "Kyle, search for modern copper lamps under $500"</li>
               <li>Kyle processes command via kyle-tasks-ai</li>
               <li>System calls kyle-product-search</li>
               <li>Kyle responds with found options</li>
             </ol>
           </div>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">UC-004: Async Messaging</h3>
           <p className="text-sm text-muted-foreground mt-1">Actor: Designer</p>
           <div className="mt-3">
             <p><strong>Main Flow:</strong></p>
             <ol className="list-decimal list-inside text-sm ml-4 space-y-1">
               <li>Designer says: "Kyle, message Maria saying her moodboard is ready"</li>
               <li>Kyle identifies lead by name</li>
               <li>System calls kyle-send-message</li>
               <li>Email sent to client</li>
               <li>Message saved in lead_messages</li>
               <li>Kyle confirms successful delivery</li>
             </ol>
           </div>
         </div>
       </div>
     </section>
 
     {/* Page 6: User Flows */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">5. User Flows</h2>
      
      <DocScreenshot 
        src={screenshotProposal} 
        alt="Proposal system" 
        caption="Fig. 7: Design proposal generation and preview"
      />
       
       <h3 className="text-xl font-semibold mt-6">Flow: Lead Capture</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
 │ Visitor │     │  Kyle   │     │ElevenLabs│    │ Gemini  │
 └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
      │               │               │               │
      │ Click widget  │               │               │
      │──────────────►│               │               │
      │               │ Start session │               │
      │               │──────────────►│               │
      │               │◄──────────────│               │
      │ "Hello Kyle"  │               │               │
      │──────────────►│ Speech-to-text│               │
      │               │──────────────►│               │
      │               │◄──────────────│               │
      │◄──────────────│ TTS Response  │               │
      │               │               │               │
      │ [Full conversation...]        │               │
      │               │               │               │
      │ "Finish"      │               │               │
      │──────────────►│ End session   │               │
      │               │──────────────►│               │
      │               │  Webhook      │               │
      │               │◄──────────────│               │
      │               │               │ Extract       │
      │               │               │ insights      │
      │               │──────────────────────────────►│
      │               │◄──────────────────────────────│
      │               │               │               │
      │               │ Generate image (Flux)         │
      │               │─────────────────────────────► │
      │               │◄─────────────────────────────│ │
      │               │               │               │
      │               │ Save lead + Notify team       │
      │               │─────────────────────────────► │
      └───────────────┴───────────────┴───────────────┘`}
       </pre>
 
       <h3 className="text-xl font-semibold mt-6">Flow: Proposal Generation</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
 │Designer │     │Dashboard│     │Edge Func│     │  Email  │
 └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
      │               │               │               │
      │ View lead     │               │               │
      │──────────────►│               │               │
      │◄──────────────│ Data + insights               │
      │               │               │               │
      │ Generate prop.│               │               │
      │──────────────►│ calculate-fee │               │
      │               │──────────────►│               │
      │               │◄──────────────│ Fee breakdown │
      │               │               │               │
      │               │ generate-agreement            │
      │               │──────────────►│               │
      │               │◄──────────────│ HTML contract │
      │               │               │               │
      │ Review/Edit   │               │               │
      │──────────────►│               │               │
      │               │               │               │
      │ Send          │               │               │
      │──────────────►│ send-notification             │
      │               │──────────────────────────────►│
      │               │               │               │
      │◄──────────────│ Confirmation  │◄──────────────│
      └───────────────┴───────────────┴───────────────┘`}
       </pre>
     </section>
 
     {/* Page 7: Edge Functions */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">6. Edge Functions Catalog</h2>
      
      <DocScreenshot 
        src={screenshotEmbed} 
        alt="Embed generator" 
        caption="Fig. 8: Kyle widget embed configurator"
      />
       
       <div className="overflow-x-auto mt-4">
         <table className="min-w-full border text-sm">
           <thead>
             <tr className="bg-muted">
               <th className="border px-3 py-2">Function</th>
               <th className="border px-3 py-2">Purpose</th>
               <th className="border px-3 py-2">Integrations</th>
             </tr>
           </thead>
           <tbody>
             <tr>
               <td className="border px-3 py-2 font-mono">create-kyle-lead-agent</td>
               <td className="border px-3 py-2">Creates ElevenLabs agent for lead capture</td>
               <td className="border px-3 py-2">ElevenLabs</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">kyle-lead-capture</td>
               <td className="border px-3 py-2">Processes webhook when conversation ends</td>
               <td className="border px-3 py-2">Gemini, Flux, Supabase</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">kyle-tasks-ai</td>
               <td className="border px-3 py-2">Processes designer voice commands</td>
               <td className="border px-3 py-2">Gemini</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">kyle-product-search</td>
               <td className="border px-3 py-2">Searches products in catalogs</td>
               <td className="border px-3 py-2">Gemini, External APIs</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">kyle-send-message</td>
               <td className="border px-3 py-2">Sends messages to clients</td>
               <td className="border px-3 py-2">Resend, Supabase</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">calculate-design-fee</td>
               <td className="border px-3 py-2">Calculates design fee</td>
               <td className="border px-3 py-2">Supabase</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">generate-design-agreement</td>
               <td className="border px-3 py-2">Generates design contract</td>
               <td className="border px-3 py-2">Gemini</td>
             </tr>
             <tr>
               <td className="border px-3 py-2 font-mono">send-notification</td>
               <td className="border px-3 py-2">Sends email notifications</td>
               <td className="border px-3 py-2">Resend</td>
             </tr>
           </tbody>
         </table>
       </div>
 
       <h3 className="text-xl font-semibold mt-6">Example: kyle-tasks-ai</h3>
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`// Supported commands:
 
 "Kyle, search for modern copper lamps"
 → action: "search_products"
 → Calls: kyle-product-search
 
 "Kyle, message Maria saying her moodboard is ready"
 → action: "send_message"
 → Calls: kyle-send-message
 
 "Kyle, what's the status of Juan's project?"
 → action: "check_status"
 → Queries: leads table
 
 "Kyle, generate a proposal for Maria"
 → action: "generate_proposal"
 → Returns: navigate_to URL
 
 "Kyle, show me today's leads"
 → action: "list_leads"
 → Queries: leads WHERE created_at = today`}
       </pre>
     </section>
 
     {/* Page 8: External Integrations */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">7. External Integrations</h2>
       
       <div className="grid gap-6 mt-6">
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">ElevenLabs Conversational AI</h3>
           <p className="text-sm text-muted-foreground mt-2">
             Provides bidirectional voice capabilities for Kyle.
           </p>
           <ul className="list-disc list-inside text-sm mt-2 space-y-1">
             <li><strong>Speech-to-Text:</strong> Real-time transcription</li>
             <li><strong>Text-to-Speech:</strong> Kyle's natural voice</li>
             <li><strong>Webhooks:</strong> Notification on conversation end</li>
             <li><strong>Tool Calling:</strong> Triggers functions during conversation</li>
           </ul>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">Google Gemini 2.5</h3>
           <p className="text-sm text-muted-foreground mt-2">
             NLP engine for insight extraction and command processing.
           </p>
           <ul className="list-disc list-inside text-sm mt-2 space-y-1">
             <li><strong>Structured extraction:</strong> JSON of preferences/requirements</li>
             <li><strong>Command classification:</strong> Identifies action + parameters</li>
             <li><strong>Contract generation:</strong> Customized legal text</li>
           </ul>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">Flux 2 Pro (Replicate)</h3>
           <p className="text-sm text-muted-foreground mt-2">
             Interior design image generation.
           </p>
           <ul className="list-disc list-inside text-sm mt-2 space-y-1">
             <li><strong>Resolution:</strong> 1024x1024 (configurable)</li>
             <li><strong>Style:</strong> Photorealistic interior rendering</li>
             <li><strong>Time:</strong> ~15-30 seconds per image</li>
           </ul>
         </div>
 
         <div className="border rounded-lg p-4">
           <h3 className="text-lg font-semibold">Resend</h3>
           <p className="text-sm text-muted-foreground mt-2">
             Transactional email service for notifications.
           </p>
           <ul className="list-disc list-inside text-sm mt-2 space-y-1">
             <li><strong>New lead:</strong> Notifies team</li>
             <li><strong>Proposal:</strong> Sends to client</li>
             <li><strong>Messages:</strong> Async communication</li>
           </ul>
         </div>
       </div>
     </section>
 
     {/* Page 9: Security */}
     <section className="py-8 print:page-break-after-always">
       <h2 className="text-2xl font-bold border-b pb-2">8. Security & RLS</h2>
      
      <DocScreenshot 
        src={screenshotAnalytics} 
        alt="Analytics panel" 
        caption="Fig. 9: Metrics dashboard for security and performance monitoring"
      />
       
       <h3 className="text-xl font-semibold mt-6">Row Level Security Policies</h3>
       <p className="mt-2">
         All main tables have RLS enabled to ensure data isolation by office.
       </p>
 
       <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-4">
 {`-- Example: Policy for leads table
 CREATE POLICY "Users can view leads from their office"
 ON public.leads
 FOR SELECT
 USING (
   office_id IN (
     SELECT office_id FROM team_members
     WHERE user_id = auth.uid()
   )
 );
 
 CREATE POLICY "Users can insert leads to their office"
 ON public.leads
 FOR INSERT
 WITH CHECK (
   office_id IN (
     SELECT office_id FROM team_members
     WHERE user_id = auth.uid()
   )
 );
 
 -- Policy for public access (widget)
 CREATE POLICY "Allow public lead creation"
 ON public.leads
 FOR INSERT
 WITH CHECK (true);  -- Controlled by edge function`}
       </pre>
 
       <h3 className="text-xl font-semibold mt-6">Authentication</h3>
       <ul className="list-disc list-inside space-y-2 mt-2">
         <li><strong>Method:</strong> Email + password via Supabase Auth</li>
         <li><strong>Verification:</strong> Email confirmation required</li>
         <li><strong>Session:</strong> JWT tokens with automatic refresh</li>
         <li><strong>Roles:</strong> managing_partner, collaborator, admin</li>
       </ul>
 
       <h3 className="text-xl font-semibold mt-6">Secrets Management</h3>
       <div className="overflow-x-auto mt-2">
         <table className="min-w-full border text-sm">
           <thead>
             <tr className="bg-muted">
               <th className="border px-3 py-2">Secret</th>
               <th className="border px-3 py-2">Usage</th>
             </tr>
           </thead>
           <tbody>
             <tr><td className="border px-3 py-2 font-mono">ELEVENLABS_API_KEY</td><td className="border px-3 py-2">Voice API</td></tr>
             <tr><td className="border px-3 py-2 font-mono">GEMINI_API_KEY</td><td className="border px-3 py-2">NLP API (optional, uses Lovable AI)</td></tr>
             <tr><td className="border px-3 py-2 font-mono">REPLICATE_API_TOKEN</td><td className="border px-3 py-2">Image generation</td></tr>
             <tr><td className="border px-3 py-2 font-mono">RESEND_API_KEY</td><td className="border px-3 py-2">Transactional email</td></tr>
           </tbody>
         </table>
       </div>
     </section>
 
     {/* Page 10: Maintenance Guide */}
     <section className="py-8">
       <h2 className="text-2xl font-bold border-b pb-2">9. Maintenance Guide</h2>
       
       <h3 className="text-xl font-semibold mt-6">Monitoring</h3>
       <ul className="list-disc list-inside space-y-2 mt-2">
         <li><strong>Edge Function Logs:</strong> Available in Lovable Cloud</li>
         <li><strong>Database Metrics:</strong> Slow queries, storage usage</li>
         <li><strong>Analytics:</strong> Dashboard at /kustr/analytics</li>
       </ul>
 
       <h3 className="text-xl font-semibold mt-6">Common Troubleshooting</h3>
       <div className="overflow-x-auto mt-2">
         <table className="min-w-full border text-sm">
           <thead>
             <tr className="bg-muted">
               <th className="border px-3 py-2">Issue</th>
               <th className="border px-3 py-2">Cause</th>
               <th className="border px-3 py-2">Solution</th>
             </tr>
           </thead>
           <tbody>
             <tr>
               <td className="border px-3 py-2">Kyle not responding</td>
               <td className="border px-3 py-2">Expired API key</td>
               <td className="border px-3 py-2">Verify ELEVENLABS_API_KEY</td>
             </tr>
             <tr>
               <td className="border px-3 py-2">Image not generating</td>
               <td className="border px-3 py-2">Replicate limit</td>
               <td className="border px-3 py-2">Verify credits and token</td>
             </tr>
             <tr>
               <td className="border px-3 py-2">Lead not saving</td>
               <td className="border px-3 py-2">RLS error</td>
               <td className="border px-3 py-2">Verify insert policies</td>
             </tr>
             <tr>
               <td className="border px-3 py-2">Email not arriving</td>
               <td className="border px-3 py-2">Unverified domain</td>
               <td className="border px-3 py-2">Configure DNS in Resend</td>
             </tr>
           </tbody>
         </table>
       </div>
 
       <h3 className="text-xl font-semibold mt-6">Recommended Updates</h3>
       <ul className="list-disc list-inside space-y-2 mt-2">
         <li>Review API keys every 90 days</li>
         <li>Update system prompts based on feedback</li>
         <li>Monitor conversion rates weekly</li>
         <li>Daily database backup (automatic)</li>
       </ul>
 
       <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
         <p>© 2026 Kuester Design Studio. All rights reserved.</p>
         <p className="mt-2">Kyle AI Platform - Technical Documentation v1.0</p>
       </div>
     </section>
   </article>
 );
 
 export default Documentation;