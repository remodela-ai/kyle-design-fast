import { Badge } from "@/components/ui/badge";
import { LeadStatus } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { 
    label: 'New', 
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
  },
  qualified: { 
    label: 'Qualified', 
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20'
  },
  contacted: { 
    label: 'Contacted', 
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
  },
  proposal_sent: { 
    label: 'Proposal Sent', 
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20'
  },
  converted: { 
    label: 'Converted', 
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
  },
  lost: { 
    label: 'Lost', 
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-4 py-2',
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

export { statusConfig };
