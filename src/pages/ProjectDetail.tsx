 import { useState } from "react";
 import { useParams, Link, useNavigate } from "react-router-dom";
 import { ArrowLeft, Image, FileText, Play, CheckCircle, Clock, AlertCircle, Mic } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { useProjectFolder } from "@/hooks/useProjectFolder";
 import { KyleAvatar } from "@/components/KyleAvatar";
 import { formatDistanceToNow } from "date-fns";
 
 const VISUAL_STEPS = [
   "Spatial Analysis",
   "Architectural Plans",
   "Items Extraction",
   "Design Moodboard",
   "Material Flatlay",
   "Colors & Textures",
   "Your Story Book",
   "Video Presentation",
 ];
 
 const MANAGEMENT_STEPS = [
   "Proposal & Budget",
   "Bill of Materials",
   "Project Timeline",
   "Technical Specs",
   "Supplier Directory",
   "Installation Plan",
   "Delivery Checklist",
   "Project Cover",
 ];
 
 function StepStatusIcon({ status }: { status: string }) {
   switch (status) {
     case "completed":
       return <CheckCircle className="h-4 w-4 text-primary" />;
     case "processing":
       return <Clock className="h-4 w-4 text-accent-foreground animate-pulse" />;
     case "error":
       return <AlertCircle className="h-4 w-4 text-destructive" />;
     default:
       return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
   }
 }
 
 export default function ProjectDetail() {
   const { sessionId } = useParams<{ sessionId: string }>();
   const navigate = useNavigate();
   const { folder, loading, error } = useProjectFolder(sessionId || null);
   const [selectedIteration, setSelectedIteration] = useState<number>(0);
 
   if (loading) {
     return (
       <div className="p-6 space-y-6">
         <Skeleton className="h-8 w-48" />
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Skeleton className="h-96" />
           <Skeleton className="h-96" />
         </div>
       </div>
     );
   }
 
   if (error || !folder.session) {
     return (
       <div className="p-6 text-center">
         <p className="text-muted-foreground">Project not found</p>
         <Button variant="outline" onClick={() => navigate("/dashboard")} className="mt-4">
           Back to Dashboard
         </Button>
       </div>
     );
   }
 
   const { session, iterations, pipelineSteps, managementSteps } = folder;
   const currentImage = iterations[selectedIteration]?.image_url || session.design_image_url;
   const pipelineProgress = pipelineSteps.filter(s => s.status === "completed").length;
   const managementProgress = managementSteps.filter(s => s.status === "completed").length;
 
   return (
     <div className="p-6 space-y-6 max-w-7xl mx-auto">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <Link to="/dashboard">
             <Button variant="ghost" size="icon">
               <ArrowLeft className="h-5 w-5" />
             </Button>
           </Link>
           <div>
             <h1 className="text-2xl font-bold">
               {session.project_name || `Project ${session.session_id.slice(0, 8)}`}
             </h1>
             <p className="text-sm text-muted-foreground">
               Last updated {formatDistanceToNow(new Date(session.updated_at || session.created_at))} ago
             </p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <Badge variant={session.pipeline_completed ? "default" : "secondary"}>
             {session.pipeline_completed ? "Pipeline Complete" : "In Progress"}
           </Badge>
           <Button 
             variant="kyle" 
             size="sm"
             onClick={() => navigate(`/shazam?session=${sessionId}`)}
             className="gap-2"
           >
             <Mic className="h-4 w-4" />
             Continue with Kyle
           </Button>
         </div>
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Design Image */}
         <div className="lg:col-span-2 space-y-4">
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Image className="h-5 w-5" />
                 Approved Design
               </CardTitle>
             </CardHeader>
             <CardContent>
               {currentImage ? (
                 <img
                   src={currentImage}
                   alt="Design"
                   className="w-full aspect-square object-cover rounded-lg"
                 />
               ) : (
                 <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                   <p className="text-muted-foreground">No design yet</p>
                 </div>
               )}
             </CardContent>
           </Card>
 
           {/* Iterations Gallery */}
           {iterations.length > 0 && (
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-lg">
                   Versions ({iterations.length})
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex gap-2 overflow-x-auto pb-2">
                   {iterations.map((iter, idx) => (
                     <button
                       key={iter.id}
                       onClick={() => setSelectedIteration(idx)}
                       className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                         selectedIteration === idx 
                           ? "border-primary ring-2 ring-primary/20" 
                           : "border-transparent hover:border-muted-foreground/30"
                       }`}
                     >
                       <img
                         src={iter.image_url}
                         alt={`Version ${idx + 1}`}
                         className="w-full h-full object-cover"
                       />
                     </button>
                   ))}
                 </div>
               </CardContent>
             </Card>
           )}
         </div>
 
         {/* Pipeline Status */}
         <div className="space-y-4">
           {/* Visual Pipeline */}
           <Card>
             <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-lg flex items-center gap-2">
                   <FileText className="h-5 w-5" />
                   Visual Pipeline
                 </CardTitle>
                 <Badge variant="outline">{pipelineProgress}/8</Badge>
               </div>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 {VISUAL_STEPS.map((stepName, idx) => {
                   const step = pipelineSteps.find(s => s.step_number === idx + 1);
                   return (
                     <div
                       key={stepName}
                       className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => {
                         if (step?.visual_outcome_url) {
                           window.open(step.visual_outcome_url, "_blank");
                         }
                       }}
                     >
                       <StepStatusIcon status={step?.status || "pending"} />
                       <span className="text-sm flex-1">{stepName}</span>
                       {step?.visual_outcome_url && (
                         <Play className="h-3 w-3 text-muted-foreground" />
                       )}
                     </div>
                   );
                 })}
               </div>
             </CardContent>
           </Card>
 
           {/* Management Pipeline */}
           <Card>
             <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-lg flex items-center gap-2">
                   <FileText className="h-5 w-5" />
                   Management Docs
                 </CardTitle>
                 <Badge variant="outline">{managementProgress}/8</Badge>
               </div>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 {MANAGEMENT_STEPS.map((stepName, idx) => {
                   const step = managementSteps.find(s => s.step_number === idx + 9);
                   return (
                     <div
                       key={stepName}
                       className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => {
                         if (step?.visual_outcome_url) {
                           window.open(step.visual_outcome_url, "_blank");
                         }
                       }}
                     >
                       <StepStatusIcon status={step?.status || "pending"} />
                       <span className="text-sm flex-1">{stepName}</span>
                       {step?.visual_outcome_url && (
                         <Play className="h-3 w-3 text-muted-foreground" />
                       )}
                     </div>
                   );
                 })}
               </div>
             </CardContent>
           </Card>
 
           {/* Kyle Integration */}
           <Card className="bg-primary/5 border-primary/20">
             <CardContent className="pt-6">
               <div className="flex flex-col items-center gap-3 text-center">
                 <KyleAvatar size="md" />
                 <p className="text-sm text-muted-foreground">
                   Talk to Kyle about this project
                 </p>
                 <Button 
                   variant="kyle" 
                   size="sm"
                   onClick={() => navigate(`/shazam?session=${sessionId}`)}
                   className="gap-2"
                 >
                   <Mic className="h-4 w-4" />
                   Start Conversation
                 </Button>
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
     </div>
   );
 }