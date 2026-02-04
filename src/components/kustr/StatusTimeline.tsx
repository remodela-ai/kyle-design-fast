import { format } from "date-fns";
import { Circle, CheckCircle2, XCircle } from "lucide-react";
import { LeadStatus } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

interface StatusHistoryItem {
  id: string;
  from_status: LeadStatus | null;
  to_status: LeadStatus;
  changed_at: string;
  changed_by: string | null;
  notes: string | null;
}

interface StatusTimelineProps {
  history: StatusHistoryItem[];
  createdAt: string;
}

const statusConfig: Record<LeadStatus, { label: string; colorClass: string }> = {
  new: { label: 'New', colorClass: 'text-blue-500' },
  qualified: { label: 'Qualified', colorClass: 'text-green-500' },
  contacted: { label: 'Contacted', colorClass: 'text-yellow-500' },
  proposal_sent: { label: 'Proposal Sent', colorClass: 'text-purple-500' },
  converted: { label: 'Converted', colorClass: 'text-emerald-500' },
  lost: { label: 'Lost', colorClass: 'text-red-500' },
};

export function StatusTimeline({ history, createdAt }: StatusTimelineProps) {
  // Build timeline including lead creation
  const timelineItems = [
    {
      id: 'created',
      from_status: null,
      to_status: 'new' as LeadStatus,
      changed_at: createdAt,
      changed_by: null,
      notes: 'Lead created',
    },
    ...history,
  ].sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());

  if (timelineItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No status changes yet.</p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border" />
      
      <div className="space-y-4">
        {timelineItems.map((item, index) => {
          const config = statusConfig[item.to_status];
          const isLast = index === timelineItems.length - 1;
          const isConverted = item.to_status === 'converted';
          const isLost = item.to_status === 'lost';
          
          const Icon = isConverted ? CheckCircle2 : isLost ? XCircle : Circle;
          
          return (
            <div key={item.id} className="relative flex gap-4 pl-0">
              {/* Icon */}
              <div className={cn(
                "relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-background",
                isLast && "ring-2 ring-offset-2 ring-offset-background ring-primary"
              )}>
                <Icon className={cn("w-5 h-5", config.colorClass)} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("font-medium", config.colorClass)}>
                    {config.label}
                  </span>
                  {item.from_status && (
                    <span className="text-xs text-muted-foreground">
                      from {statusConfig[item.from_status]?.label || item.from_status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(item.changed_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
