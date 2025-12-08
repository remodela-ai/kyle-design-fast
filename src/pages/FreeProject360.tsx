import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Layers, Grid3X3, Box, Palette, Image, Brush, BookOpen, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  { icon: Grid3X3, label: "Spatial Analysis" },
  { icon: Layers, label: "Architectural Plans" },
  { icon: Box, label: "Items Extraction" },
  { icon: Palette, label: "Design Moodboard" },
  { icon: Image, label: "Material Flatlay" },
  { icon: Brush, label: "Colors & Textures" },
  { icon: BookOpen, label: "Your Story Book" },
  { icon: Video, label: "Video Presentation" },
];

export default function FreeProject360() {
  const [activeTab, setActiveTab] = useState<"visual" | "management">("visual");

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
      <main className="flex-1 flex flex-col items-center px-4 pb-8 pt-4">
        {/* Logo Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
          <Layers className="h-8 w-8 text-primary-foreground" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
          360° Design Project
        </h1>
        <p className="text-muted-foreground text-center text-base mb-8">
          Complete AI-powered interior design pipeline
        </p>

        {/* Tabs */}
        <div className="flex bg-secondary rounded-full p-1 mb-10">
          <button
            onClick={() => setActiveTab("visual")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "visual"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Visual Design
          </button>
          <button
            onClick={() => setActiveTab("management")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "management"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Management
          </button>
        </div>

        {/* Features Grid */}
        {activeTab === "visual" && (
          <div className="grid grid-cols-4 gap-4 md:gap-6 max-w-md w-full">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 cursor-pointer">
                  <feature.icon className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
                </div>
                <span className="text-xs text-center text-muted-foreground leading-tight">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "management" && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Layers className="h-12 w-12 mb-4 text-primary/50" />
            <p className="text-center">Management features coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}