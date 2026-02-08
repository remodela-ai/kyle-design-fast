import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useProject, useCatalogCategories, useSegmentDino, useRenderRedesign } from "@/hooks/useKitchenApi";
import { ArrowLeft, Wand2, Paintbrush, Box, FileText, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function DesignStudio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id, 10) : null;
  
  const { data: project, isLoading: projectLoading, refetch } = useProject(projectId || 0);
  const { data: categories, isLoading: catalogLoading } = useCatalogCategories();
  const segmentMutation = useSegmentDino();
  const renderMutation = useRenderRedesign();

  const [selectedItems, setSelectedItems] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project?.items) {
      const items: Record<string, string> = {};
      project.items.forEach((item) => {
        items[item.category] = item.catalogItemId;
      });
      setSelectedItems(items);
    }
  }, [project?.items]);

  if (!projectId) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Invalid project ID</p>
        <Button onClick={() => navigate("/projects")} className="mt-4">
          Go to Projects
        </Button>
      </div>
    );
  }

  const handleSegment = async () => {
    try {
      await segmentMutation.mutateAsync(projectId);
      toast.success("Segmentation started");
      refetch();
    } catch (error) {
      toast.error("Segmentation failed");
    }
  };

  const handleRender = async () => {
    try {
      await renderMutation.mutateAsync(projectId);
      toast.success("Rendering started");
      refetch();
    } catch (error) {
      toast.error("Rendering failed");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      upload: { variant: "outline", label: "Upload" },
      segmenting: { variant: "secondary", label: "Segmenting..." },
      segmented: { variant: "default", label: "Segmented" },
      rendering: { variant: "secondary", label: "Rendering..." },
      rendered: { variant: "default", label: "Rendered" },
    };
    const config = variants[status] || variants.upload;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (projectLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => navigate("/projects")} className="mt-4">
          Go to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(project.status)}
              <span className="text-sm text-muted-foreground">
                Created {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Kitchen Image</CardTitle>
            </CardHeader>
            <CardContent>
              {project.redesign_image_url ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={project.redesign_image_url}
                      alt="Redesigned kitchen"
                      className="w-full rounded-lg object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-green-600">Redesigned</Badge>
                  </div>
                  {project.original_image_url && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View original
                      </summary>
                      <img
                        src={project.original_image_url}
                        alt="Original kitchen"
                        className="w-full rounded-lg object-cover mt-2"
                      />
                    </details>
                  )}
                </div>
              ) : project.original_image_url ? (
                <img
                  src={project.original_image_url}
                  alt="Original kitchen"
                  className="w-full rounded-lg object-cover"
                />
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No image uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSegment}
                  disabled={!project.original_image_url || segmentMutation.isPending || project.status === "segmenting"}
                  variant="outline"
                >
                  {segmentMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Segment
                </Button>
                <Button
                  onClick={handleRender}
                  disabled={project.status !== "segmented" || renderMutation.isPending}
                  variant="outline"
                >
                  {renderMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Paintbrush className="mr-2 h-4 w-4" />
                  )}
                  Render
                </Button>
                <Button
                  onClick={() => navigate(`/3d-viewer/${projectId}`)}
                  disabled={project.status !== "rendered"}
                  variant="outline"
                >
                  <Box className="mr-2 h-4 w-4" />
                  3D View
                </Button>
                <Button
                  onClick={() => navigate(`/proposal/${projectId}`)}
                  disabled={project.status !== "rendered"}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Catalog Sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Product Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : categories && categories.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {categories.map((category) => (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.label}
                          {selectedItems[category.id] && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {category.items.length > 0 ? (
                          <div className="grid gap-2">
                            {category.items.map((item) => (
                              <button
                                key={item.id}
                                className={`p-2 rounded-lg border text-left transition-colors ${
                                  selectedItems[category.id] === item.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() =>
                                  setSelectedItems((prev) => ({
                                    ...prev,
                                    [category.id]: item.id,
                                  }))
                                }
                              >
                                <div className="flex items-center gap-2">
                                  {item.imageUrl && (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.brand} • ${item.price}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">No items in this category</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">No catalog categories available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
