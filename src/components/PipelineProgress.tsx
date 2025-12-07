import { 
  Scan, 
  FileText, 
  Package, 
  Palette, 
  Layers, 
  Droplet, 
  Book, 
  Video,
  CheckCircle2,
  Loader2,
  Circle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStep {
  stepNumber: number;
  stepName: string;
  status: "pending" | "processing" | "completed" | "error";
  output?: Record<string, unknown>;
  visualOutcomeUrl?: string;
  error?: string;
}

interface PipelineProgressProps {
  steps: PipelineStep[];
  currentStep: number;
}

const STEP_ICONS = [
  Scan,
  FileText,
  Package,
  Palette,
  Layers,
  Droplet,
  Book,
  Video,
];

export function PipelineProgress({ steps, currentStep }: PipelineProgressProps) {
  return (
    <div className="w-full max-w-md space-y-3 p-4">
      <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
        Creating Your Full Design Package
      </h3>
      
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[index] || Circle;
        const isActive = step.stepNumber === currentStep;
        const isCompleted = step.status === "completed";
        const isError = step.status === "error";
        const isProcessing = step.status === "processing";
        
        return (
          <div
            key={step.stepNumber}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
              isActive && "bg-primary/10 border border-primary/30",
              isCompleted && "bg-green-500/10 border border-green-500/30",
              isError && "bg-red-500/10 border border-red-500/30",
              !isActive && !isCompleted && !isError && "bg-card/30 border border-border/20"
            )}
          >
            {/* Status Icon */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isCompleted && "bg-green-500/20",
              isProcessing && "bg-primary/20",
              isError && "bg-red-500/20",
              !isCompleted && !isProcessing && !isError && "bg-muted/20"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : isProcessing ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : isError ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground/50"
                )} />
              )}
            </div>
            
            {/* Step Info */}
            <div className="flex-1">
              <p className={cn(
                "font-medium text-sm",
                isCompleted && "text-green-500",
                isProcessing && "text-primary",
                isError && "text-red-500",
                !isCompleted && !isProcessing && !isError && "text-muted-foreground"
              )}>
                {step.stepName}
              </p>
              {isProcessing && (
                <p className="text-xs text-muted-foreground">
                  Processing...
                </p>
              )}
              {isError && step.error && (
                <p className="text-xs text-red-400">
                  {step.error}
                </p>
              )}
            </div>
            
            {/* Step Number */}
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              isCompleted && "bg-green-500 text-white",
              isProcessing && "bg-primary text-white",
              isError && "bg-red-500 text-white",
              !isCompleted && !isProcessing && !isError && "bg-muted/30 text-muted-foreground"
            )}>
              {step.stepNumber}
            </div>
          </div>
        );
      })}
    </div>
  );
}
