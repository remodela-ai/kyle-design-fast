import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Image,
  Play,
  Mic,
  Timer,
  Sparkles,
  Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useProjectFolder } from "@/hooks/useProjectFolder";
import { useParallelPipeline } from "@/hooks/useParallelPipeline";
import { KyleAvatar } from "@/components/KyleAvatar";
import { ParallelStepGrid } from "@/components/ParallelStepGrid";
import { ClientDataPanel } from "@/components/ClientDataPanel";
import { DeliverablesThumbnails } from "@/components/DeliverablesThumbnails";
import { PipelineStepDialog } from "@/components/PipelineStepDialog";
import { PipelineStepData } from "@/hooks/useProjectFolder";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

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

export default function IntelligentFolder() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { folder, loading, error, refresh } = useProjectFolder(sessionId || null);
  const parallelPipeline = useParallelPipeline();

  const [lead, setLead] = useState<LeadData | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedStep, setSelectedStep] = useState<{
    step: PipelineStepData | null;
    name: string;
    stepNumber: number;
    isVisualPipeline: boolean;
  } | null>(null);

  // Timer for running pipeline
  useEffect(() => {
    if (!parallelPipeline.isRunning && !parallelPipeline.startTime) return;

    const interval = setInterval(() => {
      if (parallelPipeline.startTime) {
        setElapsedTime(
          Math.floor((Date.now() - parallelPipeline.startTime.getTime()) / 1000)
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [parallelPipeline.isRunning, parallelPipeline.startTime]);

  // Fetch lead data if linked
  useEffect(() => {
    async function fetchLead() {
      const leadId = (folder.session as { lead_id?: string })?.lead_id;
      if (!leadId) return;

      setLeadLoading(true);
      try {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .eq("id", leadId)
          .single();
        setLead(data as LeadData);
      } catch (err) {
        console.error("Error fetching lead:", err);
      } finally {
        setLeadLoading(false);
      }
    }

    if (folder.session) {
      fetchLead();
    }
  }, [folder.session]);

  const handleStartPipeline = useCallback(() => {
    if (!folder.session?.design_image_url) return;
    parallelPipeline.startPipeline(
      folder.session.design_image_url,
      folder.session.conversation_summary || undefined,
      folder.session.designer_id || undefined,
      (folder.session as { lead_id?: string })?.lead_id || undefined
    );
  }, [folder.session, parallelPipeline]);

  const handleStepClick = useCallback(
    (step: { stepNumber: number; stepName: string; status: string; visualOutcomeUrl?: string }) => {
      const pipelineStep = folder.pipelineSteps.find(
        (s) => s.step_number === step.stepNumber
      );
      const managementStep = folder.managementSteps.find(
        (s) => s.step_number === step.stepNumber
      );
      const foundStep = pipelineStep || managementStep;

      setSelectedStep({
        step: foundStep || null,
        name: step.stepName,
        stepNumber: step.stepNumber,
        isVisualPipeline: step.stepNumber <= 8,
      });
    },
    [folder.pipelineSteps, folder.managementSteps]
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !folder.session) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const { session, iterations, pipelineSteps, managementSteps } = folder;
  const currentImage =
    iterations[0]?.image_url || session.design_image_url;

  // Convert folder steps to parallel grid format
  const visualSteps = [
    "Spatial Analysis",
    "Architectural Plans",
    "Items Extraction",
    "Design Moodboard",
    "Material Flatlay",
    "Colors & Textures",
    "Your Story Book",
    "Video Presentation",
  ].map((name, idx) => {
    const step = pipelineSteps.find((s) => s.step_number === idx + 1);
    return {
      stepNumber: idx + 1,
      stepName: name,
      status: (step?.status || "pending") as "pending" | "processing" | "completed" | "error",
      visualOutcomeUrl: step?.visual_outcome_url || undefined,
    };
  });

  const mgmtSteps = [
    "Proposal & Budget",
    "Bill of Materials",
    "Project Timeline",
    "Technical Specs",
    "Supplier Directory",
    "Installation Plan",
    "Delivery Checklist",
    "Project Cover",
  ].map((name, idx) => {
    const step = managementSteps.find((s) => s.step_number === idx + 9);
    return {
      stepNumber: idx + 9,
      stepName: name,
      status: (step?.status || "pending") as "pending" | "processing" | "completed" | "error",
      visualOutcomeUrl: step?.visual_outcome_url || undefined,
    };
  });

  const allDeliverables = [...visualSteps, ...mgmtSteps];
  const completedCount =
    visualSteps.filter((s) => s.status === "completed").length +
    mgmtSteps.filter((s) => s.status === "completed").length;
  const totalSteps = 16;
  const progressPercent = (completedCount / totalSteps) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">
                  {session.project_name || `Project ${session.session_id.slice(0, 8)}`}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(session.updated_at || session.created_at))} ago
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              {(parallelPipeline.isRunning || elapsedTime > 0) && (
                <Badge variant="outline" className="gap-1.5 font-mono">
                  <Timer className="h-3.5 w-3.5" />
                  {formatTime(elapsedTime)}
                </Badge>
              )}

              {/* Progress */}
              <Badge variant={completedCount === totalSteps ? "default" : "secondary"}>
                {completedCount}/{totalSteps} Complete
              </Badge>

              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-1.5" />
                Share
              </Button>

              <Button
                variant="kyle"
                size="sm"
                onClick={() => navigate(`/shazam?session=${sessionId}`)}
              >
                <Mic className="h-4 w-4 mr-1.5" />
                Talk to Kyle
              </Button>
            </div>
          </div>

          {/* Global Progress Bar */}
          {parallelPipeline.isRunning && (
            <div className="mt-3">
              <Progress value={progressPercent} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                Processing {visualSteps.filter((s) => s.status === "processing").length + mgmtSteps.filter((s) => s.status === "processing").length} steps in parallel...
                {parallelPipeline.estimatedCompletion && (
                  <span className="ml-2">
                    ETA: ~{Math.ceil(parallelPipeline.estimatedCompletion)}s
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Design Image + Deliverables */}
          <div className="lg:col-span-2 space-y-6">
            {/* Approved Design */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Approved Design
                  </CardTitle>
                  {!session.pipeline_completed && !parallelPipeline.isRunning && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleStartPipeline}
                      className="gap-1.5"
                    >
                      <Play className="h-4 w-4" />
                      Run Pipeline
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentImage ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={currentImage}
                      alt="Approved Design"
                      className="w-full aspect-video object-cover"
                    />
                    {parallelPipeline.isRunning && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Sparkles className="h-8 w-8 mx-auto animate-pulse" />
                          <p className="mt-2 font-medium">Processing...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No design yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Processing Grid */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Live Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ParallelStepGrid
                  steps={visualSteps}
                  title="Visual Design"
                  onStepClick={handleStepClick}
                />
                <ParallelStepGrid
                  steps={mgmtSteps}
                  title="Management Docs"
                  onStepClick={handleStepClick}
                />
              </CardContent>
            </Card>

            {/* Deliverables */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliverablesThumbnails
                  deliverables={allDeliverables}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Client Data + Kyle */}
          <div className="space-y-6">
            {/* Client Data */}
            <ClientDataPanel
              lead={lead}
              loading={leadLoading}
              conversationSummary={session.conversation_summary}
            />

            {/* Kyle Integration */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <KyleAvatar size="lg" />
                  <div>
                    <p className="text-sm font-medium">Kyle AI Assistant</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {parallelPipeline.pipelineComplete
                        ? "All deliverables ready! Want me to refine anything?"
                        : parallelPipeline.isRunning
                        ? "Processing your project..."
                        : "Ready to help with this project"}
                    </p>
                  </div>
                  <Button
                    variant="kyle"
                    onClick={() => navigate(`/shazam?session=${sessionId}`)}
                    className="gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Start Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Versions */}
            {iterations.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Versions ({iterations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {iterations.slice(0, 6).map((iter, idx) => (
                      <div
                        key={iter.id}
                        className="aspect-square rounded-lg overflow-hidden border"
                      >
                        <img
                          src={iter.image_url}
                          alt={`Version ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Step Dialog */}
      <PipelineStepDialog
        step={selectedStep?.step || null}
        stepName={selectedStep?.name || ""}
        stepNumber={selectedStep?.stepNumber || 0}
        isVisualPipeline={selectedStep?.isVisualPipeline ?? true}
        sessionId={sessionId || ""}
        designImageUrl={session?.design_image_url || null}
        open={!!selectedStep}
        onOpenChange={(open) => !open && setSelectedStep(null)}
        onStepExecuted={() => {
          refresh();
        }}
      />
    </div>
  );
}
