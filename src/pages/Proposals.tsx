import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { useProjects } from "@/hooks/useKitchenApi";

export default function Proposals() {
  const navigate = useNavigate();
  const { data: projectsList, isLoading } = useProjects();

  const proposedProjects = projectsList?.filter(
    (p) => p.status === "proposal" || p.redesign_image_url
  ) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage your kitchen redesign proposals</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 bg-muted rounded w-2/3 mb-3" /><div className="h-3 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-1/3" /></CardContent></Card>
          ))}
        </div>
      ) : proposedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proposedProjects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 group" onClick={() => navigate(`/proposal/${project.id}`)}>
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  {project.redesign_image_url ? (
                    <img src={project.redesign_image_url} alt={project.name} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                  ) : project.original_image_url ? (
                    <img src={project.original_image_url} alt={project.name} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded-lg shrink-0 flex items-center justify-center"><FileText className="w-6 h-6 text-muted-foreground/50" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">{project.status === "proposal" ? "Proposal Ready" : "Render Complete"}</Badge>
                    </div>
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
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-red-600" /></div>
            <h3 className="font-semibold text-lg mb-2">No proposals yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">Complete a kitchen redesign with AI rendering to generate your first proposal.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
