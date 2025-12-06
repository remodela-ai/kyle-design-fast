import { KyleAvatar } from "./KyleAvatar";
import { VoiceInput } from "./VoiceInput";
import { PipelineSection } from "./PipelineSection";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";

interface CanvasProps {
  onMenuClick?: () => void;
}

export function Canvas({ onMenuClick }: CanvasProps) {
  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8 relative overflow-y-auto">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-[var(--gradient-glow)] pointer-events-none" />
      
      {/* Mobile header */}
      <div className="absolute top-4 left-4 z-20 md:hidden">
        <Button variant="icon" size="icon" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 max-w-6xl w-full animate-fade-in py-12 md:py-8">
        {/* Kyle Avatar */}
        <div className="animate-float">
          <KyleAvatar size="lg" />
        </div>

        {/* Title */}
        <div className="text-center space-y-1 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Next Interiors
          </h1>
          <p className="text-xs md:text-lg text-muted-foreground max-w-md">
            The First Full Stack AI Interior Design Company.
          </p>
        </div>

        {/* Description */}
        <p className="text-center text-muted-foreground max-w-2xl text-xs md:text-sm leading-relaxed px-4">
          Meet <span className="text-primary font-semibold">Kyle</span>, your super voice agent. 
          In just <span className="text-primary font-semibold">5 minutes</span> instead of 5 weeks, 
          get complete interior design proposals with floor plans, moodboards, measurements, 
          and professional documents delivered to your email.
        </p>

        {/* Voice Input */}
        <div className="w-full px-4">
          <VoiceInput />
        </div>

        {/* Pipeline Section */}
        <PipelineSection />
      </div>
    </div>
  );
}
