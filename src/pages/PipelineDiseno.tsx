import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Layers, Compass, ClipboardList, Grid2X2, LayoutGrid, Palette, BookOpen, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const VISUAL_DESIGN_STEPS = [
  { icon: Compass, label: "Spatial", sublabel: "Analysis" },
  { icon: ClipboardList, label: "Architectural", sublabel: "Plans" },
  { icon: Grid2X2, label: "Items", sublabel: "Extraction" },
  { icon: LayoutGrid, label: "Design", sublabel: "Moodboard" },
  { icon: LayoutGrid, label: "Material", sublabel: "Flatlay" },
  { icon: Palette, label: "Colors &", sublabel: "Textures" },
  { icon: BookOpen, label: "Your Story", sublabel: "Book" },
  { icon: Video, label: "Video", sublabel: "Presentation" },
];

const MANAGEMENT_STEPS = [
  { icon: ClipboardList, label: "Project", sublabel: "Brief" },
  { icon: Grid2X2, label: "Budget", sublabel: "Estimate" },
  { icon: Compass, label: "Timeline", sublabel: "Planning" },
  { icon: LayoutGrid, label: "Vendor", sublabel: "List" },
];

type TabType = "visual" | "management";

export default function PipelineDiseno() {
  const [activeTab, setActiveTab] = useState<TabType>("visual");

  const steps = activeTab === "visual" ? VISUAL_DESIGN_STEPS : MANAGEMENT_STEPS;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-8">
        {/* Logo Icon */}
        <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mb-6">
          <Layers className="h-8 w-8 text-primary-foreground" />
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          360° Design Project
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Complete AI-powered interior design pipeline
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-card/50 rounded-full p-1 mb-10 border border-border/30">
          <button
            onClick={() => setActiveTab("visual")}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
              activeTab === "visual"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Visual Design
          </button>
          <button
            onClick={() => setActiveTab("management")}
            className={cn(
              "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
              activeTab === "management"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Management
          </button>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-4 gap-4 max-w-md w-full">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-shadow duration-300">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground leading-tight">{step.label}</p>
                <p className="text-xs text-muted-foreground leading-tight">{step.sublabel}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <Button 
          className="mt-12 rounded-full px-8 py-6 text-lg font-semibold shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-all duration-300"
        >
          Start Pipeline
        </Button>
      </main>
    </div>
  );
}
