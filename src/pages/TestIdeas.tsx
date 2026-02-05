 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { CheckCircle2, Circle, Users, MessageSquare, FileText, BarChart3, Code, Mic } from "lucide-react";
 
 interface TestScenario {
   id: string;
   category: string;
   title: string;
   description: string;
   steps: string[];
   priority: "high" | "medium" | "low";
   icon: React.ReactNode;
 }
 
 const testScenarios: TestScenario[] = [
   {
     id: "1",
     category: "Lead Capture",
     title: "Kyle Voice Widget - Full Conversation",
     description: "Test the complete lead capture flow through Kyle voice assistant",
     steps: [
       "Navigate to /kyle",
       "Start a conversation with Kyle",
       "Provide project details (kitchen remodel, budget $50k-80k)",
       "Share style preferences (modern, minimalist)",
       "Provide contact information",
       "Verify lead appears in /kustr/leads"
     ],
     priority: "high",
     icon: <Mic className="h-5 w-5" />
   },
   {
     id: "2",
     category: "Lead Management",
     title: "Lead Status Workflow",
     description: "Test transitioning leads through all status stages",
     steps: [
       "Open a lead from /kustr/leads",
       "Change status from 'new' to 'qualified'",
       "Assign to a team member",
       "Add internal notes",
       "Move to 'contacted' status",
       "Verify status history is recorded"
     ],
     priority: "high",
     icon: <Users className="h-5 w-5" />
   },
   {
     id: "3",
     category: "Messaging",
     title: "Lead Communication Thread",
     description: "Test sending and receiving messages with leads",
     steps: [
       "Open lead detail page",
       "Send a message to the lead",
       "Verify message appears in thread",
       "Check message timestamp",
       "Test message read status"
     ],
     priority: "high",
     icon: <MessageSquare className="h-5 w-5" />
   },
   {
     id: "4",
     category: "Proposals",
     title: "Generate Design Proposal",
     description: "Test the proposal generation workflow",
     steps: [
       "Navigate to qualified lead",
       "Click 'Generate Proposal'",
       "Review fee breakdown calculation",
       "Customize terms if needed",
       "Send proposal to client",
       "Verify proposal status updates"
     ],
     priority: "high",
     icon: <FileText className="h-5 w-5" />
   },
   {
     id: "5",
     category: "Analytics",
     title: "Dashboard Metrics Accuracy",
     description: "Verify dashboard KPIs reflect actual data",
     steps: [
       "Check total leads count vs database",
       "Verify conversion rate calculation",
       "Test date range filters",
       "Compare chart data with raw data",
       "Check real-time updates"
     ],
     priority: "medium",
     icon: <BarChart3 className="h-5 w-5" />
   },
   {
     id: "6",
     category: "Widget Embed",
     title: "Kyle Widget Integration",
     description: "Test embedding Kyle widget on external site",
     steps: [
       "Go to /kustr/embed",
       "Configure widget settings",
       "Copy embed code",
       "Test in external HTML page",
       "Verify lead capture works",
       "Check office_id attribution"
     ],
     priority: "medium",
     icon: <Code className="h-5 w-5" />
   },
   {
     id: "7",
     category: "Authentication",
     title: "Office Onboarding Flow",
     description: "Test new design studio registration",
     steps: [
       "Sign up new account at /kustr/auth",
       "Complete onboarding at /kustr/onboarding",
       "Verify office creation",
       "Check team member profile",
       "Confirm dashboard access"
     ],
     priority: "high",
     icon: <Users className="h-5 w-5" />
   },
   {
     id: "8",
     category: "Edge Cases",
     title: "Empty States & Error Handling",
     description: "Test UI behavior with no data or errors",
     steps: [
       "View leads page with no leads",
       "Test invalid lead ID navigation",
       "Simulate network errors",
       "Check loading states",
       "Verify error messages are helpful"
     ],
     priority: "medium",
     icon: <Circle className="h-5 w-5" />
   }
 ];
 
 const priorityColors = {
   high: "bg-destructive/10 text-destructive border-destructive/20",
   medium: "bg-warning/10 text-warning border-warning/20",
   low: "bg-muted text-muted-foreground border-border"
 };
 
 const TestIdeas = () => {
   return (
     <div className="min-h-screen bg-background p-6 md:p-8">
       <div className="max-w-6xl mx-auto">
         <div className="mb-8">
           <h1 className="text-3xl font-bold text-foreground mb-2">Test Scenarios</h1>
           <p className="text-muted-foreground">
             Comprehensive testing checklist for Kustr Design platform
           </p>
         </div>
 
         <div className="grid gap-6 md:grid-cols-2">
           {testScenarios.map((scenario) => (
             <Card key={scenario.id} className="border-border">
               <CardHeader className="pb-3">
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-primary/10 text-primary">
                       {scenario.icon}
                     </div>
                     <div>
                       <Badge variant="outline" className="mb-1 text-xs">
                         {scenario.category}
                       </Badge>
                       <CardTitle className="text-lg">{scenario.title}</CardTitle>
                     </div>
                   </div>
                   <Badge className={priorityColors[scenario.priority]}>
                     {scenario.priority}
                   </Badge>
                 </div>
                 <CardDescription className="mt-2">
                   {scenario.description}
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-2">
                   <span className="text-sm font-medium text-foreground">Steps:</span>
                   <ol className="space-y-1.5">
                     {scenario.steps.map((step, idx) => (
                       <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                         <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                           {idx + 1}
                         </span>
                         {step}
                       </li>
                     ))}
                   </ol>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
 
         <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
           <h3 className="font-semibold text-foreground mb-2">Quick Links</h3>
           <div className="flex flex-wrap gap-2">
             <a href="/kyle" className="text-sm text-primary hover:underline">/kyle</a>
             <a href="/kustr/dashboard" className="text-sm text-primary hover:underline">/kustr/dashboard</a>
             <a href="/kustr/leads" className="text-sm text-primary hover:underline">/kustr/leads</a>
             <a href="/kustr/analytics" className="text-sm text-primary hover:underline">/kustr/analytics</a>
             <a href="/kustr/embed" className="text-sm text-primary hover:underline">/kustr/embed</a>
             <a href="/kustr/auth" className="text-sm text-primary hover:underline">/kustr/auth</a>
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 export default TestIdeas;