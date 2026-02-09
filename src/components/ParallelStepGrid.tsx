import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Step {
  stepNumber: number;
  stepName: string;
  status: "pending" | "processing" | "completed" | "error";
  visualOutcomeUrl?: string;
}

interface ParallelStepGridProps {
  steps: Step[];
  title: string;
  onStepClick?: (step: Step) => void;
}

function StepIcon({ status }: { status: Step["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-primary" />;
    case "processing":
      return <Loader2 className="h-5 w-5 text-accent-foreground animate-spin" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground/40" />;
  }
}

export function ParallelStepGrid({ steps, title, onStepClick }: ParallelStepGridProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const processingCount = steps.filter((s) => s.status === "processing").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          {processingCount > 0 && (
            <span className="text-xs text-accent-foreground animate-pulse">
              {processingCount} processing...
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => (
          <Tooltip key={step.stepNumber}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onStepClick?.(step)}
                disabled={step.status === "pending"}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all",
                  "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                  step.status === "pending" && "opacity-50 cursor-not-allowed",
                  step.status === "processing" && "border-accent-foreground/50 bg-accent/10",
                  step.status === "completed" && "border-primary/50 bg-primary/5",
                  step.status === "error" && "border-destructive/50 bg-destructive/5"
                )}
              >
                {step.visualOutcomeUrl ? (
                  <div className="absolute inset-0 rounded-lg overflow-hidden opacity-20">
                    <img
                      src={step.visualOutcomeUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                <StepIcon status={step.status} />
                <span className="mt-1 text-[10px] text-center text-muted-foreground line-clamp-2">
                  {step.stepName}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{step.stepName}</p>
              <p className="text-xs text-muted-foreground capitalize">{step.status}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
