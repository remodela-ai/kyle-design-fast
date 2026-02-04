import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadStatus } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

interface StatusWorkflowProps {
  currentStatus: LeadStatus;
  onStatusChange: (status: LeadStatus) => void;
  isUpdating?: boolean;
}

// Define valid transitions for each status
const validTransitions: Record<LeadStatus, LeadStatus[]> = {
  new: ['qualified', 'lost'],
  qualified: ['contacted', 'lost'],
  contacted: ['proposal_sent', 'lost'],
  proposal_sent: ['converted', 'lost'],
  converted: [],
  lost: ['new'], // Allow reopening
};

const statusConfig: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  new: { 
    label: 'New', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30'
  },
  qualified: { 
    label: 'Qualified', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30'
  },
  contacted: { 
    label: 'Contacted', 
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30'
  },
  proposal_sent: { 
    label: 'Proposal Sent', 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30'
  },
  converted: { 
    label: 'Converted', 
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
  },
  lost: { 
    label: 'Lost', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30'
  },
};

const statusOrder: LeadStatus[] = ['new', 'qualified', 'contacted', 'proposal_sent', 'converted'];

export function StatusWorkflow({ currentStatus, onStatusChange, isUpdating }: StatusWorkflowProps) {
  const nextStatuses = validTransitions[currentStatus];
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  // Get the primary next status (the forward progression)
  const primaryNext = nextStatuses.find(s => s !== 'lost' && s !== 'new');
  
  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-1">
        {statusOrder.map((status, index) => {
          const isPast = index < currentIndex;
          const isCurrent = status === currentStatus;
          const config = statusConfig[status];
          
          return (
            <div key={status} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all",
                  isPast && "bg-primary text-primary-foreground",
                  isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary text-primary-foreground",
                  !isPast && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isPast ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < statusOrder.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    index < currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Status labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {statusOrder.map((status) => (
          <span key={status} className={cn(
            "text-center",
            status === currentStatus && "font-medium text-foreground"
          )}>
            {statusConfig[status].label}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {primaryNext && (
            <Button
              onClick={() => onStatusChange(primaryNext)}
              disabled={isUpdating}
              className={cn(
                "gap-2 border",
                statusConfig[primaryNext].bgColor,
                statusConfig[primaryNext].color
              )}
              variant="outline"
            >
              <ArrowRight className="w-4 h-4" />
              Move to {statusConfig[primaryNext].label}
            </Button>
          )}
          
          {nextStatuses.includes('lost') && currentStatus !== 'lost' && (
            <Button
              onClick={() => onStatusChange('lost')}
              disabled={isUpdating}
              variant="outline"
              className="gap-2 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
              Mark as Lost
            </Button>
          )}
          
          {currentStatus === 'lost' && (
            <Button
              onClick={() => onStatusChange('new')}
              disabled={isUpdating}
              variant="outline"
              className="gap-2"
            >
              Reopen Lead
            </Button>
          )}
        </div>
      )}
      
      {currentStatus === 'converted' && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          🎉 This lead has been converted to a client!
        </p>
      )}
    </div>
  );
}

export { statusConfig, validTransitions };
