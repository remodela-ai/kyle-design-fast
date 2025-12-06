import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, Loader2, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Progress } from "@/components/ui/progress";

interface PipelineStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed";
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  progress: number;
}

export default function Project() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: "visual-design",
      name: "Visual Design Pipeline",
      description: "Generating complete visual design package",
      steps: [
        { id: "mood", name: "Mood Board Generation", status: "pending" },
        { id: "floorplan", name: "Floor Plan Analysis", status: "pending" },
        { id: "3d", name: "3D Visualization", status: "pending" },
        { id: "materials", name: "Materials & Finishes", status: "pending" },
      ],
      progress: 0,
    },
    {
      id: "project-management",
      name: "Project Management Pipeline",
      description: "Creating project documentation and specifications",
      steps: [
        { id: "specs", name: "Technical Specifications", status: "pending" },
        { id: "budget", name: "Budget Estimation", status: "pending" },
        { id: "timeline", name: "Project Timeline", status: "pending" },
        { id: "vendors", name: "Vendor Recommendations", status: "pending" },
      ],
      progress: 0,
    },
  ]);

  // Auto-start pipelines when page loads
  useEffect(() => {
    const runPipelines = async () => {
      // Start both pipelines simultaneously
      for (let pipelineIndex = 0; pipelineIndex < pipelines.length; pipelineIndex++) {
        runPipeline(pipelineIndex);
      }
    };

    // Small delay before starting
    const timer = setTimeout(runPipelines, 500);
    return () => clearTimeout(timer);
  }, []);

  const runPipeline = async (pipelineIndex: number) => {
    const pipeline = pipelines[pipelineIndex];
    const totalSteps = pipeline.steps.length;

    for (let stepIndex = 0; stepIndex < totalSteps; stepIndex++) {
      // Set current step to running
      setPipelines(prev => {
        const updated = [...prev];
        updated[pipelineIndex] = {
          ...updated[pipelineIndex],
          steps: updated[pipelineIndex].steps.map((step, idx) => ({
            ...step,
            status: idx === stepIndex ? "running" : step.status,
          })),
        };
        return updated;
      });

      // Simulate step processing (2-4 seconds per step)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

      // Mark step as completed and update progress
      setPipelines(prev => {
        const updated = [...prev];
        updated[pipelineIndex] = {
          ...updated[pipelineIndex],
          steps: updated[pipelineIndex].steps.map((step, idx) => ({
            ...step,
            status: idx === stepIndex ? "completed" : step.status,
          })),
          progress: ((stepIndex + 1) / totalSteps) * 100,
        };
        return updated;
      });
    }
  };

  const getStepIcon = (status: PipelineStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/40" />;
    }
  };

  const allCompleted = pipelines.every(p => p.progress === 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link to="/shazam">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-8 pt-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Full Project Generation
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Kyle is preparing your complete design package
        </p>

        {/* Pipelines */}
        <div className="w-full max-w-2xl space-y-8">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="bg-card/50 border border-border/30 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {pipeline.name}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {Math.round(pipeline.progress)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {pipeline.description}
              </p>
              
              <Progress value={pipeline.progress} className="h-2 mb-4" />

              <div className="space-y-3">
                {pipeline.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    {getStepIcon(step.status)}
                    <span
                      className={
                        step.status === "completed"
                          ? "text-foreground"
                          : step.status === "running"
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {allCompleted && (
          <div className="mt-8 text-center animate-fade-in">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Project Complete!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your full design package is ready
            </p>
            <Button variant="outline" className="rounded-full">
              View Deliverables
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
