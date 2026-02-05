 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Download, FileText, ArrowLeft } from "lucide-react";
 import { useNavigate } from "react-router-dom";
 
 const Documentation = () => {
   const navigate = useNavigate();
   const [language, setLanguage] = useState<"es" | "en">("es");
 
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