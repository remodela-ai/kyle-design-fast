 import { useState } from "react";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   Drawer,
   DrawerContent,
   DrawerHeader,
   DrawerTitle,
 } from "@/components/ui/drawer";
 import { useIsMobile } from "@/hooks/use-mobile";
 import { CheckCircle, Clock, AlertCircle, FileText, ExternalLink } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 interface PipelineStepData {
   id: string;
   session_id: string;
   step_number: number;
   step_name: string;
   status: string;
   visual_outcome_url: string | null;
   output_data: Record<string, unknown> | null;
   error_message: string | null;
   created_at: string;
 }
 
 interface PipelineStepDialogProps {
   step: PipelineStepData | null;
   stepName: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 function StepStatusBadge({ status }: { status: string }) {
   switch (status) {
     case "completed":
       return (
         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
           <CheckCircle className="h-3 w-3" />
           Completado
         </span>
       );
     case "processing":
       return (
         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium">
           <Clock className="h-3 w-3 animate-pulse" />
           Procesando
         </span>
       );
     case "error":
       return (
         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
           <AlertCircle className="h-3 w-3" />
           Error
         </span>
       );
     default:
       return (
         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
           <FileText className="h-3 w-3" />
           Pendiente
         </span>
       );
   }
 }
 
 function StepContent({ step, stepName }: { step: PipelineStepData | null; stepName: string }) {
   if (!step || step.status === "pending") {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
           <FileText className="h-8 w-8 text-muted-foreground" />
         </div>
         <h3 className="text-lg font-medium mb-2">Documento pendiente</h3>
         <p className="text-sm text-muted-foreground max-w-sm">
           Este paso del pipeline aún no ha sido ejecutado. Completa los pasos anteriores para generar este documento.
         </p>
       </div>
     );
   }
 
   if (step.status === "processing") {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
           <Clock className="h-8 w-8 text-accent-foreground animate-pulse" />
         </div>
         <h3 className="text-lg font-medium mb-2">Generando documento...</h3>
         <p className="text-sm text-muted-foreground max-w-sm">
           Kyle está trabajando en generar este documento. Por favor espera unos momentos.
         </p>
       </div>
     );
   }
 
   if (step.status === "error") {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
           <AlertCircle className="h-8 w-8 text-destructive" />
         </div>
         <h3 className="text-lg font-medium mb-2">Error en la generación</h3>
         <p className="text-sm text-muted-foreground max-w-sm mb-4">
           {step.error_message || "Ocurrió un error al generar este documento."}
         </p>
       </div>
     );
   }
 
   // Completed step - show content
   return (
     <div className="space-y-4">
       {step.visual_outcome_url && (
         <div className="space-y-3">
           <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
             <img
               src={step.visual_outcome_url}
               alt={stepName}
               className="w-full h-full object-contain"
             />
           </div>
           <Button
             variant="outline"
             size="sm"
             className="w-full gap-2"
             onClick={() => window.open(step.visual_outcome_url!, "_blank")}
           >
             <ExternalLink className="h-4 w-4" />
             Abrir en nueva pestaña
           </Button>
         </div>
       )}
 
       {step.output_data && Object.keys(step.output_data).length > 0 && (
         <div className="space-y-2">
           <h4 className="text-sm font-medium">Datos del documento</h4>
           <div className="bg-muted rounded-lg p-3 text-sm">
             <pre className="whitespace-pre-wrap text-xs text-muted-foreground overflow-auto max-h-48">
               {JSON.stringify(step.output_data, null, 2)}
             </pre>
           </div>
         </div>
       )}
 
       {!step.visual_outcome_url && (!step.output_data || Object.keys(step.output_data).length === 0) && (
         <div className="flex flex-col items-center justify-center py-8 text-center">
           <CheckCircle className="h-12 w-12 text-primary mb-4" />
           <h3 className="text-lg font-medium mb-2">Paso completado</h3>
           <p className="text-sm text-muted-foreground">
             Este paso ha sido procesado exitosamente.
           </p>
         </div>
       )}
     </div>
   );
 }
 
 export function PipelineStepDialog({ step, stepName, open, onOpenChange }: PipelineStepDialogProps) {
   const isMobile = useIsMobile();
 
   const content = (
     <ScrollArea className="max-h-[70vh]">
       <div className="p-1">
         <div className="flex items-center justify-between mb-4">
           <StepStatusBadge status={step?.status || "pending"} />
           {step?.created_at && step.status === "completed" && (
             <span className="text-xs text-muted-foreground">
               {new Date(step.created_at).toLocaleDateString()}
             </span>
           )}
         </div>
         <StepContent step={step} stepName={stepName} />
       </div>
     </ScrollArea>
   );
 
   if (isMobile) {
     return (
       <Drawer open={open} onOpenChange={onOpenChange}>
         <DrawerContent>
           <DrawerHeader>
             <DrawerTitle>{stepName}</DrawerTitle>
           </DrawerHeader>
           <div className="px-4 pb-6">
             {content}
           </div>
         </DrawerContent>
       </Drawer>
     );
   }
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl">
         <DialogHeader>
           <DialogTitle>{stepName}</DialogTitle>
         </DialogHeader>
         {content}
       </DialogContent>
     </Dialog>
   );
 }