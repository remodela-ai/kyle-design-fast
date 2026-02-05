 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { 
   FlaskConical, 
   X, 
   ChevronDown, 
   ChevronRight,
   Users, 
   MessageSquare, 
   FileText, 
   BarChart3, 
   Code, 
   Mic,
   Circle,
   CheckCircle2
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface TestStep {
   text: string;
   completed: boolean;
 }
 
 interface TestScenario {
   id: string;
   category: string;
   title: string;
   steps: TestStep[];
   priority: "high" | "medium" | "low";
   icon: React.ReactNode;
   expanded: boolean;
 }
 
 const initialScenarios: TestScenario[] = [
   {
     id: "1",
     category: "Lead Capture",
     title: "Kyle Voice Widget",
     steps: [
       { text: "Navigate to /kyle", completed: false },
       { text: "Start conversation with Kyle", completed: false },
       { text: "Provide project details", completed: false },
       { text: "Share style preferences", completed: false },
       { text: "Provide contact info", completed: false },
       { text: "Verify lead in /kustr/leads", completed: false }
     ],
     priority: "high",
     icon: <Mic className="h-4 w-4" />,
     expanded: false
   },
   {
     id: "2",
     category: "Lead Management",
     title: "Lead Status Workflow",
     steps: [
       { text: "Open lead from /kustr/leads", completed: false },
       { text: "Change status to 'qualified'", completed: false },
       { text: "Assign to team member", completed: false },
       { text: "Add internal notes", completed: false },
       { text: "Move to 'contacted'", completed: false }
     ],
     priority: "high",
     icon: <Users className="h-4 w-4" />,
     expanded: false
   },
   {
     id: "3",
     category: "Messaging",
     title: "Lead Communication",
     steps: [
       { text: "Open lead detail page", completed: false },
       { text: "Send a message", completed: false },
       { text: "Verify message in thread", completed: false },
       { text: "Check timestamp", completed: false }
     ],
     priority: "high",
     icon: <MessageSquare className="h-4 w-4" />,
     expanded: false
   },
   {
     id: "4",
     category: "Proposals",
     title: "Generate Proposal",
     steps: [
       { text: "Navigate to qualified lead", completed: false },
       { text: "Click 'Generate Proposal'", completed: false },
       { text: "Review fee breakdown", completed: false },
       { text: "Send proposal", completed: false }
     ],
     priority: "high",
     icon: <FileText className="h-4 w-4" />,
     expanded: false
   },
   {
     id: "5",
     category: "Analytics",
     title: "Dashboard Metrics",
     steps: [
       { text: "Check leads count", completed: false },
       { text: "Verify conversion rate", completed: false },
       { text: "Test date filters", completed: false }
     ],
     priority: "medium",
     icon: <BarChart3 className="h-4 w-4" />,
     expanded: false
   },
   {
     id: "6",
     category: "Widget",
     title: "Kyle Embed Code",
     steps: [
       { text: "Go to /kustr/embed", completed: false },
       { text: "Configure widget", completed: false },
       { text: "Copy embed code", completed: false },
       { text: "Test externally", completed: false }
     ],
     priority: "medium",
     icon: <Code className="h-4 w-4" />,
     expanded: false
   },
   {
     id: "7",
     category: "Auth",
     title: "Office Onboarding",
     steps: [
       { text: "Sign up at /kustr/auth", completed: false },
       { text: "Complete onboarding", completed: false },
       { text: "Verify office created", completed: false },
       { text: "Confirm dashboard access", completed: false }
     ],
     priority: "high",
     icon: <Users className="h-4 w-4" />,
     expanded: false
   }
 ];
 
 const priorityColors = {
   high: "bg-destructive/10 text-destructive",
   medium: "bg-yellow-500/10 text-yellow-600",
   low: "bg-muted text-muted-foreground"
 };
 
 export function TestGuideFloating() {
   const [isOpen, setIsOpen] = useState(false);
   const [scenarios, setScenarios] = useState<TestScenario[]>(initialScenarios);
 
   const toggleScenario = (id: string) => {
     setScenarios(prev => 
       prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s)
     );
   };
 
   const toggleStep = (scenarioId: string, stepIndex: number) => {
     setScenarios(prev =>
       prev.map(s => {
         if (s.id === scenarioId) {
           const newSteps = [...s.steps];
           newSteps[stepIndex] = { ...newSteps[stepIndex], completed: !newSteps[stepIndex].completed };
           return { ...s, steps: newSteps };
         }
         return s;
       })
     );
   };
 
   const completedCount = scenarios.reduce(
     (acc, s) => acc + s.steps.filter(step => step.completed).length, 
     0
   );
   const totalSteps = scenarios.reduce((acc, s) => acc + s.steps.length, 0);
   const progress = Math.round((completedCount / totalSteps) * 100);
 
   return (
     <>
       {/* Floating Button */}
       <Button
         onClick={() => setIsOpen(!isOpen)}
         className={cn(
           "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
           "bg-primary hover:bg-primary/90 text-primary-foreground",
           "transition-transform hover:scale-105"
         )}
         size="icon"
       >
         {isOpen ? <X className="h-6 w-6" /> : <FlaskConical className="h-6 w-6" />}
       </Button>
 
       {/* Progress indicator on button */}
       {!isOpen && completedCount > 0 && (
         <div className="fixed bottom-[4.5rem] right-6 z-50 bg-background border border-border rounded-full px-2 py-0.5 text-xs font-medium shadow">
           {progress}%
         </div>
       )}
 
       {/* Popup Panel */}
       {isOpen && (
         <div className="fixed bottom-24 right-6 z-50 w-80 max-h-[70vh] bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
           {/* Header */}
           <div className="p-4 border-b border-border bg-muted/30">
             <div className="flex items-center justify-between mb-2">
               <h3 className="font-semibold text-foreground flex items-center gap-2">
                 <FlaskConical className="h-4 w-4 text-primary" />
                 Test Guide
               </h3>
               <Badge variant="outline" className="text-xs">
                 {completedCount}/{totalSteps}
               </Badge>
             </div>
             {/* Progress bar */}
             <div className="h-1.5 bg-muted rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-300"
                 style={{ width: `${progress}%` }}
               />
             </div>
           </div>
 
           {/* Scenarios List */}
           <ScrollArea className="h-[calc(70vh-8rem)]">
             <div className="p-2 space-y-1">
               {scenarios.map((scenario) => {
                 const scenarioCompleted = scenario.steps.filter(s => s.completed).length;
                 const isComplete = scenarioCompleted === scenario.steps.length;
                 
                 return (
                   <div key={scenario.id} className="rounded-lg overflow-hidden">
                     {/* Scenario Header */}
                     <button
                       onClick={() => toggleScenario(scenario.id)}
                       className={cn(
                         "w-full flex items-center gap-2 p-2.5 text-left transition-colors",
                         "hover:bg-muted/50 rounded-lg",
                         isComplete && "opacity-60"
                       )}
                     >
                       <div className={cn("p-1.5 rounded", priorityColors[scenario.priority])}>
                         {scenario.icon}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium text-foreground truncate">
                           {scenario.title}
                         </div>
                         <div className="text-xs text-muted-foreground">
                           {scenarioCompleted}/{scenario.steps.length} steps
                         </div>
                       </div>
                       {scenario.expanded ? (
                         <ChevronDown className="h-4 w-4 text-muted-foreground" />
                       ) : (
                         <ChevronRight className="h-4 w-4 text-muted-foreground" />
                       )}
                     </button>
 
                     {/* Steps */}
                     {scenario.expanded && (
                       <div className="pl-4 pr-2 pb-2 space-y-1">
                         {scenario.steps.map((step, idx) => (
                           <button
                             key={idx}
                             onClick={() => toggleStep(scenario.id, idx)}
                             className={cn(
                               "w-full flex items-start gap-2 p-2 text-left rounded-md",
                               "hover:bg-muted/50 transition-colors",
                               step.completed && "opacity-60"
                             )}
                           >
                             {step.completed ? (
                               <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                             ) : (
                               <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                             )}
                             <span className={cn(
                               "text-xs",
                               step.completed ? "line-through text-muted-foreground" : "text-foreground"
                             )}>
                               {step.text}
                             </span>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </ScrollArea>
 
           {/* Footer */}
           <div className="p-3 border-t border-border bg-muted/30">
             <Button
               variant="outline"
               size="sm"
               className="w-full text-xs"
               onClick={() => setScenarios(initialScenarios)}
             >
               Reset Progress
             </Button>
           </div>
         </div>
       )}
     </>
   );
 }