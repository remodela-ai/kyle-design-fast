 import { useState, useCallback, useEffect } from "react";
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
 import { CheckCircle, Clock, AlertCircle, FileText, ExternalLink, Play, RotateCcw, Loader2, Check } from "lucide-react";
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
   stepNumber: number;
   isVisualPipeline: boolean;
   sessionId: string;
   designImageUrl: string | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onStepExecuted?: () => void;
 }
 
 function StepStatusBadge({ status }: { status: string }) {
   switch (status) {
     case "completed":
       return (
         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
           <CheckCircle className="h-3 w-3" />
           Completed
         </span>
       );
     case "processing":
       return (
         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium">
           <Clock className="h-3 w-3 animate-pulse" />
           Processing
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
           Pending
         </span>
       );
   }
 }
 
 interface StepContentProps {
   step: PipelineStepData | null;
   stepName: string;
   stepNumber: number;
   isVisualPipeline: boolean;
   sessionId: string;
   designImageUrl: string | null;
   isExecuting: boolean;
   onExecute: () => void;
   onRegenerate: () => void;
 }
 
 function StepContent({
   step,
   stepName,
   stepNumber,
   isVisualPipeline,
   sessionId,
   designImageUrl,
   isExecuting,
   onExecute,
   onRegenerate,
 }: StepContentProps) {
   const canExecute = sessionId && designImageUrl;
 
   // Show executing state with spinner
   if (isExecuting) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
           <Loader2 className="h-8 w-8 text-primary animate-spin" />
         </div>
         <h3 className="text-lg font-medium mb-2">Generating...</h3>
         <p className="text-sm text-muted-foreground max-w-sm">
           Kyle is working on this step. Please wait a moment.
         </p>
       </div>
     );
   }
 
   if (!step || step.status === "pending") {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
           <FileText className="h-8 w-8 text-muted-foreground" />
         </div>
         <h3 className="text-lg font-medium mb-2">Pending Document</h3>
         <p className="text-sm text-muted-foreground max-w-sm">
           This pipeline step has not been executed yet.
         </p>
         {canExecute && (
           <Button
             variant="kyle"
             size="sm"
             className="mt-4 gap-2"
             onClick={onExecute}
           >
             <Play className="h-4 w-4" />
             Execute Step
           </Button>
         )}
       </div>
     );
   }
 
   if (step.status === "processing") {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
           <Clock className="h-8 w-8 text-accent-foreground animate-pulse" />
         </div>
         <h3 className="text-lg font-medium mb-2">Generating document...</h3>
         <p className="text-sm text-muted-foreground max-w-sm">
           Kyle is working on generating this document. Please wait a moment.
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
         <h3 className="text-lg font-medium mb-2">Generation Error</h3>
         <p className="text-sm text-muted-foreground max-w-sm mb-4">
           {step.error_message || "An error occurred while generating this document."}
         </p>
         {canExecute && (
           <Button
             variant="outline"
             size="sm"
             className="gap-2"
             onClick={onRegenerate}
           >
             <RotateCcw className="h-4 w-4" />
             Retry
           </Button>
         )}
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
             Open in new tab
           </Button>
         </div>
       )}
 
       {step.output_data && Object.keys(step.output_data).length > 0 && (
         <div className="space-y-2">
           <h4 className="text-sm font-medium">Document Data</h4>
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
           <h3 className="text-lg font-medium mb-2">Step Completed</h3>
           <p className="text-sm text-muted-foreground">
             This step has been processed successfully.
           </p>
         </div>
       )}
       
       {/* Action buttons for completed steps */}
       {canExecute && (
         <div className="flex gap-2 pt-4 border-t">
           <Button
             variant="outline"
             size="sm"
             className="flex-1 gap-2"
             onClick={onRegenerate}
           >
             <RotateCcw className="h-4 w-4" />
             Regenerate
           </Button>
           <Button
             variant="kyle"
             size="sm"
             className="flex-1 gap-2"
           >
             <Check className="h-4 w-4" />
             Approve
           </Button>
         </div>
       )}
     </div>
   );
 }
 
 export function PipelineStepDialog({ 
   step, 
   stepName, 
   stepNumber,
   isVisualPipeline,
   sessionId,
   designImageUrl,
   open, 
   onOpenChange,
   onStepExecuted,
 }: PipelineStepDialogProps) {
   const isMobile = useIsMobile();
   const [isExecuting, setIsExecuting] = useState(false);
   const [localStep, setLocalStep] = useState<PipelineStepData | null>(step);
 
   // Sync local step with prop when dialog opens or step changes
   useEffect(() => {
     setLocalStep(step);
   }, [step, open]);
 
   const handleExecuteStep = useCallback(async () => {
     if (!sessionId || !designImageUrl) return;
     
     setIsExecuting(true);
     
     try {
       // Import supabase dynamically to avoid circular deps
       const { supabase } = await import("@/integrations/supabase/client");
       
       // Determine which function to call based on step number and pipeline type
       const visualFunctions: Record<number, string> = {
         1: "pipeline-spatial-analysis",
         2: "nano-planta", // Step 2 needs special handling
         3: "pipeline-items-extraction",
         4: "pipeline-moodboard",
         5: "pipeline-flatlay",
         6: "pipeline-colors-textures",
         7: "pipeline-storybook",
         8: "pipeline-video-presentation",
       };
       
       const managementFunctions: Record<number, string> = {
         9: "management-proposal-budget",
         10: "management-bom",
         11: "management-timeline",
         12: "management-specs",
         13: "management-suppliers",
         14: "management-installation",
         15: "management-checklist",
         16: "management-cover",
       };
       
       const functionName = isVisualPipeline 
         ? visualFunctions[stepNumber] 
         : managementFunctions[stepNumber];
       
       if (!functionName) {
         throw new Error(`No function found for step ${stepNumber}`);
       }
       
       // Check if step exists, if not create it
       const { data: existingStep } = await supabase
          .from("pipeline_steps")
          .select("id")
          .eq("session_id", sessionId)
          .eq("step_number", stepNumber)
          .maybeSingle();
       
       if (!existingStep) {
         // Create the step first
         console.log(`Creating pipeline step ${stepNumber} for session ${sessionId}`);
         const { error: createError } = await supabase
            .from("pipeline_steps")
            .insert({
              session_id: sessionId,
              step_number: stepNumber,
              step_name: stepName,
              status: "processing",
              started_at: new Date().toISOString(),
            });
         
         if (createError) {
           console.error("Error creating step:", createError);
           throw createError;
         }
       } else {
         // Update existing step to processing
         await supabase.from("pipeline_steps").update({
           status: "processing",
           started_at: new Date().toISOString(),
           error_message: null,
         }).eq("session_id", sessionId).eq("step_number", stepNumber);
       }
       
       // Get spatial analysis data for context (needed by most steps) - use maybeSingle to avoid error
       const { data: spatialStep } = await supabase
         .from("pipeline_steps")
         .select("output_data")
         .eq("session_id", sessionId)
         .eq("step_number", 1)
         .maybeSingle();
       
       const spatialOutput = spatialStep?.output_data as { 
         parsedAnalysis?: { 
           elements?: unknown[]; 
           roomType?: string; 
           styleIdentified?: string;
         } 
       } | null;
       
       const elements = spatialOutput?.parsedAnalysis?.elements || [];
       const roomType = spatialOutput?.parsedAnalysis?.roomType || "living room";
       const styleIdentified = spatialOutput?.parsedAnalysis?.styleIdentified || "modern";
       
       // Execute the step
       console.log(`Executing step ${stepNumber}: ${functionName}`);
       
       const { data, error } = await supabase.functions.invoke(functionName, {
         body: { 
           sessionId, 
           designImageUrl,
           elements,
           roomType,
           styleIdentified,
           spatialAnalysis: spatialOutput?.parsedAnalysis,
         },
       });
       
       if (error) throw error;
       
       console.log(`Step ${stepNumber} completed:`, data);
       
       // Update step to completed
       await supabase.from("pipeline_steps").update({
         status: "completed",
         output_data: data?.output || data,
         visual_outcome_url: data?.imageUrl || null,
         completed_at: new Date().toISOString(),
       }).eq("session_id", sessionId).eq("step_number", stepNumber);
       
       // Fetch updated step data to show in dialog
       const { data: updatedStep } = await supabase
         .from("pipeline_steps")
         .select("*")
         .eq("session_id", sessionId)
         .eq("step_number", stepNumber)
         .maybeSingle();
       
       if (updatedStep) {
         setLocalStep(updatedStep as PipelineStepData);
       }
       
       onStepExecuted?.();
       
     } catch (error) {
       console.error(`Error executing step ${stepNumber}:`, error);
       
       // Update step to error
       const { supabase } = await import("@/integrations/supabase/client");
       await supabase.from("pipeline_steps").upsert({
         session_id: sessionId,
         step_number: stepNumber,
         step_name: stepName,
         status: "error",
         error_message: error instanceof Error ? error.message : "Unknown error",
         completed_at: new Date().toISOString(),
       }, { onConflict: "session_id,step_number" });
       
       // Fetch error step to show in dialog
       const { data: errorStep } = await supabase
         .from("pipeline_steps")
         .select("*")
         .eq("session_id", sessionId)
         .eq("step_number", stepNumber)
         .maybeSingle();
       
       if (errorStep) {
         setLocalStep(errorStep as PipelineStepData);
       }
       
       onStepExecuted?.();
     } finally {
       setIsExecuting(false);
     }
   }, [sessionId, designImageUrl, stepNumber, stepName, isVisualPipeline, onStepExecuted]);
 
   const content = (
     <ScrollArea className="max-h-[70vh]">
       <div className="p-1">
         <div className="flex items-center justify-between mb-4">
           <StepStatusBadge status={localStep?.status || "pending"} />
           {localStep?.created_at && localStep?.status === "completed" && (
             <span className="text-xs text-muted-foreground">
               {new Date(localStep.created_at).toLocaleDateString()}
             </span>
           )}
         </div>
         <StepContent 
           step={localStep} 
           stepName={stepName}
           stepNumber={stepNumber}
           isVisualPipeline={isVisualPipeline}
           sessionId={sessionId}
           designImageUrl={designImageUrl}
           isExecuting={isExecuting}
           onExecute={handleExecuteStep}
           onRegenerate={handleExecuteStep}
         />
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