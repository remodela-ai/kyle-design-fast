import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, Upload, Sparkles, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useProjects, useCreateProject } from "@/hooks/useKitchenApi";

const STATUS_COLORS: Record<string, string> = {
  upload: "bg-blue-100 text-blue-700",
  segmenting: "bg-amber-100 text-amber-700",
  segmented: "bg-purple-100 text-purple-700",
  rendering: "bg-orange-100 text-orange-700",
  rendered: "bg-green-100 text-green-700",
};

export default function Projects() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: projectsList, isLoading } = useProjects();

  const handleCreateProject = async () => {
    try {
      const result = await createProject.mutateAsync("My Kitchen Redesign");
      navigate(`/studio/${result.id}`);
    } catch (err: any) {
      toast.error("Failed to create project: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your kitchen redesign projects</p>
        </div>
        <Button onClick={handleCreateProject} disabled={createProject.isPending} className="gap-2">
          <Plus className="w-4 h-4" />{createProject.isPending ? "Creating..." : "New Project"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="w-full h-44 bg-muted rounded-lg mb-3" /><div className="h-4 bg-muted rounded w-2/3 mb-2" /><div className="h-3 bg-muted rounded w-1/3" /></CardContent></Card>
          ))}
        </div>
      ) : projectsList && projectsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsList.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 group" onClick={() => navigate(`/studio/${project.id}`)}>
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  {project.original_image_url ? (
                    <img src={project.original_image_url} alt={project.name} className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-44 bg-muted flex items-center justify-center"><Upload className="w-8 h-8 text-muted-foreground/50" /></div>
                  )}
                  {project.redesign_image_url && (
                    <div className="absolute top-2 right-2"><Badge className="bg-green-500/90 text-white text-[10px] gap-1"><Sparkles className="w-3 h-3" />AI Rendered</Badge></div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[project.status] || ""}`}>{project.status}</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4"><Sparkles className="w-8 h-8 text-red-600" /></div>
            <h3 className="font-semibold text-lg mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">Start your first kitchen redesign project. Upload a photo and let AI transform your space.</p>
            <Button onClick={handleCreateProject} disabled={createProject.isPending} className="gap-2 bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4" />Create Your First Project</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
