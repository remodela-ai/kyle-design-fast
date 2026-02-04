import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Sparkles, Zap, MessageSquare, FileText, Mail, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BacklogItem {
  id: string;
  sprint: number;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "database" | "edge-function" | "frontend" | "integration";
  prompt: string;
  completed: boolean;
}

const backlogItems: BacklogItem[] = [
  // Sprint 2
  {
    id: "s2-1",
    sprint: 2,
    title: "Automated Flux Render on Lead Capture",
    description: "Generate a preliminary design rendering using Flux 2 Pro when a lead is captured, storing the URL in preliminary_design_url",
    priority: "high",
    category: "edge-function",
    prompt: `Enhance the kyle-lead-capture edge function to automatically generate a Flux 2 Pro design rendering after extracting insights from the conversation.

Requirements:
1. After extracting insights with Gemini, use the conversation summary to generate a design prompt
2. Call the Flux 2 Pro API via Lovable AI gateway to generate the rendering
3. Upload the generated image to Supabase storage bucket "lead-assets"
4. Update the lead record with the preliminary_design_url
5. Include project_type, style_preferences, and any brand mentions in the Flux prompt

The flow should be: Conversation ends → Extract insights → Generate Flux render → Save to storage → Update lead record`,
    completed: true,
  },
  {
    id: "s2-2",
    sprint: 2,
    title: "Lead Assignment to Team Members",
    description: "Add UI to assign leads to specific team members from the lead detail page",
    priority: "medium",
    category: "frontend",
    prompt: `Add lead assignment functionality to the LeadDetail page:

1. Create a dropdown/select component that lists all team_members from the current office
2. When a team member is selected, update the leads.assigned_to field
3. Show the currently assigned team member's name and avatar in the lead detail header
4. Add a filter in the Leads dashboard to filter by assigned_to
5. Use the existing useLeads hook and add an updateLead mutation

The assignment should be immediate (no save button needed) and show a success toast.`,
    completed: true,
  },
  {
    id: "s2-3",
    sprint: 2,
    title: "Lead Status Workflow",
    description: "Add status transition buttons and automatic qualified_at timestamp",
    priority: "medium",
    category: "frontend",
    prompt: `Implement a lead status workflow system:

1. Add status transition buttons in LeadDetail (New → Qualified → Contacted → Proposal Sent → Converted/Lost)
2. When status changes to "qualified", automatically set qualified_at timestamp
3. Add a status timeline/history visualization showing when each status was reached
4. Add color-coded status badges throughout the UI
5. Prevent invalid transitions (e.g., can't go from "new" to "converted" directly)

Use the existing lead_status enum: new, qualified, contacted, proposal_sent, converted, lost`,
    completed: true,
  },
  // Sprint 3
  {
    id: "s3-1",
    sprint: 3,
    title: "Design Fee Calculator",
    description: "Edge function that calculates design fees based on project scope, dimensions, and complexity",
    priority: "high",
    category: "edge-function",
    prompt: `Create a new edge function "calculate-design-fee" that computes design fees:

Input parameters:
- project_type (kitchen, bathroom, bedroom, etc.)
- room_dimensions (width, height, depth in feet)
- style_complexity (simple, moderate, luxury)
- includes_appliances (boolean)
- includes_custom_furniture (boolean)

Fee calculation logic:
- Base fee by project type: kitchen=$5000, bathroom=$3000, bedroom=$2500, living_room=$4000
- Size multiplier: square footage / 100 * $500
- Complexity multiplier: simple=1.0, moderate=1.3, luxury=1.8
- Add-ons: appliances +$1500, custom furniture +$2000

Return: { base_fee, adjustments[], total_fee, payment_schedule: [{deposit: 50%, milestone: 25%, final: 25%}] }`,
    completed: false,
  },
  {
    id: "s3-2",
    sprint: 3,
    title: "Proposal Generator Page",
    description: "UI page to generate and preview design proposals for leads",
    priority: "high",
    category: "frontend",
    prompt: `Create a new page "src/pages/kustr/Proposal.tsx" at route "/kustr/leads/:id/proposal":

1. Fetch lead data and extracted insights
2. Show a form to adjust fee calculation inputs (pre-filled from lead data)
3. Real-time fee calculation preview using the calculate-design-fee edge function
4. Editable proposal text sections (scope of work, timeline, terms)
5. Preview mode that shows the proposal as the client would see it
6. "Send Proposal" button that updates lead status to "proposal_sent"

Use a clean, professional design with the studio branding.`,
    completed: false,
  },
  {
    id: "s3-3",
    sprint: 3,
    title: "Design Agreement Generator",
    description: "Generate legally-formatted design agreements using AI",
    priority: "high",
    category: "edge-function",
    prompt: `Create edge function "generate-design-agreement" that produces a design contract:

Input:
- lead_id (to fetch client info and project details)
- fee_breakdown (from calculate-design-fee)
- custom_terms (optional additional clauses)

Use Gemini to generate a professional design agreement including:
- Client and designer information
- Scope of work based on extracted_insights
- Fee schedule and payment terms
- Project timeline
- Revision policy
- Intellectual property clause
- Cancellation terms
- Signature blocks

Return: { agreement_html, agreement_text, generated_at }

Store generated agreements in a new "proposals" table for tracking.`,
    completed: false,
  },
  // Sprint 4
  {
    id: "s4-1",
    sprint: 4,
    title: "Kyle Product Search",
    description: "Edge function for AI-powered product sourcing from vendor database",
    priority: "medium",
    category: "edge-function",
    prompt: `Create edge function "kyle-product-search" for intelligent product sourcing:

1. Accept natural language queries like "modern pendant light under $500"
2. Parse the query with Gemini to extract: category, style, price_range, brand_preference
3. Search the material_vendors table for matching vendors
4. Generate product recommendations with:
   - Vendor name and contact
   - Estimated price range
   - Style match score
   - Availability notes
5. Return structured results that can be displayed in the designer dashboard

Future: integrate with external product APIs (Wayfair, Build.com) for real product data.`,
    completed: false,
  },
  {
    id: "s4-2",
    sprint: 4,
    title: "Async Client Messaging System",
    description: "Allow designers to send messages to leads via Kyle at any hour",
    priority: "medium",
    category: "frontend",
    prompt: `Enhance the lead messaging system for async communication:

1. Create a message composer in LeadDetail with rich text support
2. Add a "Send via Kyle" option that will use TTS to deliver the message
3. Create edge function "kyle-send-message" that:
   - Stores message in lead_messages table
   - Optionally sends email notification to lead
   - Queues voice message for next Kyle interaction
4. Show message thread with sender avatars (Kyle, Designer, Client)
5. Add "Mark as Read" functionality
6. Real-time updates using Supabase realtime subscription

The goal is to enable 1 AM communication as James requested.`,
    completed: false,
  },
  {
    id: "s4-3",
    sprint: 4,
    title: "Email Notification System",
    description: "Send email notifications for new leads and status changes",
    priority: "medium",
    category: "edge-function",
    prompt: `Create an email notification system using Supabase Edge Functions:

1. Create edge function "send-notification" that uses Resend API
2. Notification triggers:
   - New lead captured → notify office team
   - Lead assigned → notify assigned team member
   - New message from client → notify assigned designer
   - Proposal viewed → notify designer
3. Create email templates with studio branding
4. Add user preferences for notification frequency
5. Store RESEND_API_KEY in secrets

Templates needed: new_lead, lead_assigned, new_message, proposal_viewed`,
    completed: false,
  },
  // Sprint 5
  {
    id: "s5-1",
    sprint: 5,
    title: "Embeddable Kyle Widget",
    description: "Create embed code for external websites to include Kyle chatbot",
    priority: "low",
    category: "frontend",
    prompt: `Create an embeddable Kyle widget for external websites:

1. Create a standalone widget bundle at "/kyle-widget.js"
2. Widget initialization: <script src="https://app.url/kyle-widget.js"></script><kyle-widget office-id="xxx"></kyle-widget>
3. Widget features:
   - Floating chat bubble in corner
   - Expandable to full conversation view
   - Mobile responsive
   - Customizable colors via data attributes
4. Create embed code generator page at /kustr/embed
5. Preview the widget with different configurations

Use Shadow DOM to prevent CSS conflicts with host sites.`,
    completed: false,
  },
  {
    id: "s5-2",
    sprint: 5,
    title: "Lead Analytics Dashboard",
    description: "Visualizations for lead conversion rates, sources, and trends",
    priority: "low",
    category: "frontend",
    prompt: `Create an analytics dashboard at "/kustr/analytics":

1. Key metrics cards:
   - Total leads this month
   - Conversion rate (leads → clients)
   - Average time to proposal
   - Revenue from converted leads
2. Charts using Recharts:
   - Lead volume over time (line chart)
   - Status distribution (pie chart)
   - Project type breakdown (bar chart)
   - Budget range distribution (histogram)
3. Filters: date range, project type, assigned designer
4. Export to CSV functionality

Query data from leads table with aggregations.`,
    completed: false,
  },
  {
    id: "s5-3",
    sprint: 5,
    title: "Kyle Voice Commands for Designers",
    description: "Extend kyle-tasks-ai with product sourcing and client messaging commands",
    priority: "low",
    category: "edge-function",
    prompt: `Enhance the existing kyle-tasks-ai edge function with new commands:

New commands to add:
1. "Kyle, search for [product description]" → calls kyle-product-search
2. "Kyle, message [client name] saying [message]" → calls kyle-send-message
3. "Kyle, what's the status of [client name]'s project?" → queries leads table
4. "Kyle, generate a proposal for [client name]" → triggers proposal generation
5. "Kyle, show me today's leads" → lists new leads

Update the system prompt to understand these commands and route to appropriate handlers.
Return voice-friendly responses that Kyle can speak back.`,
    completed: false,
  },
];

const categoryIcons = {
  "database": Sparkles,
  "edge-function": Zap,
  "frontend": Code,
  "integration": MessageSquare,
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-muted",
};

export default function Backlog() {
  const { toast } = useToast();
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (item: BacklogItem) => {
    await navigator.clipboard.writeText(item.prompt);
    setCopiedId(item.id);
    toast({
      title: "Copied to clipboard",
      description: `Prompt for "${item.title}" is ready to paste`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCompleted = (id: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const sprints = [2, 3, 4, 5];
  
  const getSprintProgress = (sprint: number) => {
    const sprintItems = backlogItems.filter(i => i.sprint === sprint);
    const completed = sprintItems.filter(i => completedItems.has(i.id)).length;
    return { completed, total: sprintItems.length };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Kyle AI Platform Backlog</h1>
          <p className="text-muted-foreground">
            Copy prompts and send to Lovable to implement each feature. Check items as you complete them.
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-4 gap-4">
          {sprints.map(sprint => {
            const { completed, total } = getSprintProgress(sprint);
            return (
              <Card key={sprint} className="bg-card">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Sprint {sprint}</div>
                  <div className="text-2xl font-bold">{completed}/{total}</div>
                  <div className="h-2 bg-muted rounded-full mt-2">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(completed / total) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Backlog Items by Sprint */}
        {sprints.map(sprint => (
          <div key={sprint} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              Sprint {sprint}
              <Badge variant="outline" className="ml-2">
                {backlogItems.filter(i => i.sprint === sprint).length} items
              </Badge>
            </h2>

            <div className="space-y-3">
              {backlogItems
                .filter(item => item.sprint === sprint)
                .map(item => {
                  const Icon = categoryIcons[item.category];
                  const isCompleted = completedItems.has(item.id);
                  
                  return (
                    <Card 
                      key={item.id} 
                      className={`transition-all ${isCompleted ? "opacity-50" : ""}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleCompleted(item.id)}
                              className="mt-1"
                            />
                            <div className="space-y-1">
                              <CardTitle className={`text-lg ${isCompleted ? "line-through" : ""}`}>
                                {item.title}
                              </CardTitle>
                              <CardDescription>{item.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={priorityColors[item.priority]}>
                              {item.priority}
                            </Badge>
                            <Badge variant="secondary" className="gap-1">
                              <Icon className="h-3 w-3" />
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {item.prompt}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 gap-2"
                          onClick={() => handleCopy(item)}
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="h-4 w-4 text-primary" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy Prompt
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
