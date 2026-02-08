import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Upload, Palette, ShoppingCart, FileText, ArrowRight, Sparkles, Box } from "lucide-react";
import { toast } from "sonner";
import { useCreateProject } from "@/hooks/useKitchenApi";

export default function KitchenHome() {
  const navigate = useNavigate();
  const createProject = useCreateProject();

  const handleStartProject = async () => {
    try {
      const result = await createProject.mutateAsync("My Kitchen Redesign");
      navigate(`/studio/${result.id}`);
    } catch (err: any) {
      toast.error("Failed to create project: " + err.message);
    }
  };

  const features = [
    { icon: Sparkles, title: "AI Detection", desc: "Automatically identify cabinets, countertops, appliances, and more from a single photo", color: "bg-red-100 text-red-600" },
    { icon: Palette, title: "Product Catalog", desc: "Browse curated kitchen products and select replacements for each detected element", color: "bg-amber-100 text-amber-600" },
    { icon: ShoppingCart, title: "AI Rendering", desc: "See your redesigned kitchen with Nano Banana Pro AI visualization in seconds", color: "bg-blue-100 text-blue-600" },
    { icon: Box, title: "3D Visualization", desc: "Generate architectural views — floor plan, elevations, and 3D perspective from your photo", color: "bg-emerald-100 text-emerald-600" },
    { icon: FileText, title: "Professional Proposals", desc: "Get a detailed proposal with itemized pricing, storytelling, and professional formatting", color: "bg-rose-100 text-rose-600" },
  ];

  const steps = [
    { num: "01", title: "Upload Photo", desc: "Take a photo of your current kitchen" },
    { num: "02", title: "AI Detection", desc: "AI identifies all kitchen elements" },
    { num: "03", title: "Select Products", desc: "Choose replacements from our catalog" },
    { num: "04", title: "AI Render", desc: "See your redesigned kitchen instantly" },
    { num: "05", title: "Get Proposal", desc: "Receive a professional proposal" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Next Kuster Design — AI-Powered Kitchen Design
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 text-foreground">Kitchen Redesign Studio</h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-6">Transform your kitchen with AI. Upload a photo, select premium products, and get a professional redesign proposal — all in minutes.</p>
        <div className="flex gap-3">
          <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700" onClick={handleStartProject} disabled={createProject.isPending}>
            {createProject.isPending ? "Creating..." : "Start New Project"}<ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate("/projects")}>View Projects</Button>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">What You Can Do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-3`}><feature.icon className="w-5 h-5" /></div>
                <h3 className="font-semibold text-sm mb-1.5">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="flex flex-col md:flex-row gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex-1 relative">
              <Card className="border-border/50 h-full">
                <CardContent className="p-4">
                  <span className="text-2xl font-bold text-red-200">{step.num}</span>
                  <h3 className="font-semibold text-sm mt-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </CardContent>
              </Card>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-2 z-10 w-4 h-4 items-center justify-center"><ArrowRight className="w-3 h-3 text-muted-foreground/50" /></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
