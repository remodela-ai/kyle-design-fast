import { User, Phone, Mail, DollarSign, Palette, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeadData {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  style_preferences?: string[] | null;
  project_type?: string | null;
  conversation_transcript?: string | null;
  extracted_insights?: Record<string, unknown> | null;
}

interface ClientDataPanelProps {
  lead: LeadData | null;
  loading?: boolean;
  conversationSummary?: string | null;
}

export function ClientDataPanel({ lead, loading, conversationSummary }: ClientDataPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Client Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!lead && !conversationSummary) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <User className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No client data linked</p>
          <p className="text-xs text-muted-foreground/60">
            Link a lead to see client information
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return null;
  };

  const budget = lead ? formatBudget(lead.budget_min, lead.budget_max) : null;
  const insights = lead?.extracted_insights as Record<string, string> | undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Client Data
          </CardTitle>
          {lead?.project_type && (
            <Badge variant="secondary" className="text-xs">
              {lead.project_type}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        {lead && (lead.name || lead.email || lead.phone) && (
          <div className="space-y-2">
            {lead.name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{lead.name}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Budget */}
        {budget && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{budget}</span>
          </div>
        )}

        {/* Style Preferences */}
        {lead?.style_preferences && lead.style_preferences.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Palette className="h-3.5 w-3.5" />
              Style Preferences
            </div>
            <div className="flex flex-wrap gap-1">
              {lead.style_preferences.map((style, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {style}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {insights && Object.keys(insights).length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <p className="text-xs text-muted-foreground">AI Insights</p>
            <div className="space-y-1">
              {Object.entries(insights).slice(0, 4).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>{" "}
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Summary */}
        {conversationSummary && (
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              Conversation Summary
            </div>
            <ScrollArea className="h-24">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {conversationSummary}
              </p>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
