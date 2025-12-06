import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Scan,
  Building2,
  Package,
  LayoutGrid,
  Layers,
  Palette,
  BookOpen,
  Video,
  FileText,
  Users,
  Calculator,
  ShoppingCart,
  MapPin,
  Handshake,
  Gift,
  Camera,
} from "lucide-react";

const designPipeline = [
  { icon: Scan, label: "Spatial Analysis", description: "AI detects dimensions, furniture & lighting", step: 1 },
  { icon: Building2, label: "Architectural Plans", description: "Floor plans & elevation views", step: 2 },
  { icon: Package, label: "Items Extraction", description: "Isolate design elements", step: 3 },
  { icon: LayoutGrid, label: "Design Moodboard", description: "Visual inspiration board", step: 4 },
  { icon: Layers, label: "Material Flatlay", description: "Textures & materials", step: 5 },
  { icon: Palette, label: "Colors & Textures", description: "HEX color palette", step: 6 },
  { icon: BookOpen, label: "Your Story Book", description: "Design narrative & concept", step: 7 },
  { icon: Video, label: "Video Presentation", description: "James Kuster (24s)", step: 8 },
];

const managementPipeline = [
  { icon: FileText, label: "Proposal & Budget", description: "Scope, timeline & cost breakdown", step: 1 },
  { icon: Users, label: "Client Onboarding", description: "Contracts & kickoff meeting", step: 2 },
  { icon: Calculator, label: "Financial Planning", description: "Cash flow & payment schedule", step: 3 },
  { icon: ShoppingCart, label: "Procurement", description: "Sourcing, orders & logistics", step: 4 },
  { icon: MapPin, label: "Site Coordination", description: "Installations & supervision", step: 5 },
  { icon: Handshake, label: "Vendor Management", description: "Contractors & quality control", step: 6 },
  { icon: Gift, label: "Final Delivery", description: "Styling, staging & handover", step: 7 },
  { icon: Camera, label: "Closeout & Portfolio", description: "Documentation & feedback", step: 8 },
];

type PipelineType = "design" | "management";

export function PipelineSection() {
  const [activeTab, setActiveTab] = useState<PipelineType>("design");

  const pipeline = activeTab === "design" ? designPipeline : managementPipeline;

  return (
    <div className="w-full max-w-6xl mx-auto mt-12">
      {/* Header */}
      <div className="text-center mb-8">
        {/* Logo icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-primary flex items-center justify-center">
          <div className="w-8 h-8 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-2">360° Design Project</h2>
        <p className="text-muted-foreground">
          Complete AI-powered interior design pipeline from photo to video presentation
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex items-center justify-between mb-8 px-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-medium">How It Works</span>
        </div>

        <div className="flex rounded-full bg-secondary p-1">
          <button
            onClick={() => setActiveTab("design")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
              activeTab === "design"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Visual Design
          </button>
          <button
            onClick={() => setActiveTab("management")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
              activeTab === "management"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Management
          </button>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="relative px-4">
        {/* Connection line */}
        <div className="absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

        <div className="grid grid-cols-4 md:grid-cols-8 gap-4 relative">
          {pipeline.map((item, index) => (
            <div
              key={item.label}
              className="flex flex-col items-center text-center group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Step indicator with icon */}
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200 glow-red-subtle">
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                {/* Step number badge */}
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">{item.step}</span>
                </div>
              </div>

              {/* Label */}
              <h4 className="text-xs font-semibold text-foreground mb-1 leading-tight">
                {item.label}
              </h4>

              {/* Description */}
              <p className="text-[10px] text-muted-foreground leading-tight hidden md:block">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
