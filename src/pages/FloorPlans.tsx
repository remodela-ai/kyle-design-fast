import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { Ruler, ArrowRight, Clock, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { KitchenLayout3D } from "@/types/kitchen3d";
import { useProject, useProjects, useGenerate3DLayout } from "@/hooks/useKitchenApi";

const FloorPlan2D = lazy(() => import("@/components/kitchen/FloorPlan2D"));

export default function FloorPlans() {
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;
  const navigate = useNavigate();
  const [layout3D, setLayout3D] = useState<KitchenLayout3D | null>(null);

  const { data: projectsList, isLoading: projectsLoading } = useProjects();
  const { data: projectData, isLoading: projectLoading } = useProject(projectId || 0, !!projectId);
  const generate3D = useGenerate3DLayout();

  const handleGenerate = () => {
    if (!projectId) return;
    generate3D.mutate(projectId, {
      onSuccess: (data) => {
        setLayout3D(data);
        toast.success("2D floor plans generated successfully!");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to generate floor plans");
      },
    });
  };

  // Project-specific 2D plans
  if (projectId && projectData) {
    const hasDetection = !!projectData.segmentation_data && Object.keys(projectData.segmentation_data).length > 0;

    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-white/80 backdrop-blur">
          <div>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground mb-1" onClick={() => navigate("/floor-plans")}>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />Back
            </Button>
            <h1 className="text-xl font-bold tracking-tight">2D Floor Plans</h1>
            <p className="text-xs text-muted-foreground">{projectData.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {!layout3D && hasDetection && (
              <Button onClick={handleGenerate} disabled={generate3D.isPending} className="gap-2">
                {generate3D.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Estimating Dimensions...</> : <><Sparkles className="w-4 h-4" />Generate Floor Plans</>}
              </Button>
            )}
            {layout3D && (
              <Button onClick={handleGenerate} variant="outline" disabled={generate3D.isPending} className="gap-2">
                {generate3D.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Re-generate
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {layout3D ? (
            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
              <FloorPlan2D layout={layout3D} />
            </Suspense>
          ) : generate3D.isPending ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
                  <Ruler className="w-10 h-10 text-red-600 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Estimating Dimensions</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">AI is analyzing your kitchen photo and estimating real-world dimensions to generate architectural floor plans...</p>
              </div>
            </div>
          ) : !hasDetection ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">Detection Required</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">You need to run AI detection on your kitchen photo first. Go to the Design Studio to detect kitchen elements.</p>
                <Button className="mt-4 gap-2" onClick={() => navigate(`/studio/${projectId}`)}><Sparkles className="w-4 h-4" />Go to Design Studio</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
                <Ruler className="w-10 h-10 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-xl mb-2">AutoCAD-Style 2D Floor Plans</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-1">Generate professional architectural floor plans with dimension annotations. Switch between millimeters and inches. Export as PNG or SVG.</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4 mb-6">
                  <Badge variant="secondary" className="text-xs">Floor Plan</Badge>
                  <Badge variant="secondary" className="text-xs">Front Elevation</Badge>
                  <Badge variant="secondary" className="text-xs">Rear Elevation</Badge>
                  <Badge variant="secondary" className="text-xs">Left Side</Badge>
                  <Badge variant="secondary" className="text-xs">Right Side</Badge>
                  <Badge variant="secondary" className="text-xs gap-1">mm / inches switch</Badge>
                </div>
                <Button onClick={handleGenerate} className="gap-2 bg-red-600 hover:bg-red-700"><Sparkles className="w-4 h-4" />Generate Floor Plans</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (projectId && projectLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-4rem)]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const readyProjects = projectsList?.filter((p) => p.original_image_url) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">2D Floor Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate AutoCAD-style architectural floor plans with dimension annotations</p>
      </div>

      {projectsLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : readyProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {readyProjects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 group" onClick={() => navigate(`/floor-plans/${project.id}`)}>
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img src={project.original_image_url!} alt={project.name} className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-500/90 text-white text-[10px] gap-1"><Ruler className="w-3 h-3" />2D Plans</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />{new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4"><Ruler className="w-8 h-8 text-red-600" /></div>
            <h3 className="font-semibold text-lg mb-2">No projects available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">Upload a kitchen photo in the Design Studio first, then come back here for 2D floor plans.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
