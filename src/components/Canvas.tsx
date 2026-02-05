import { KyleAvatar } from "./KyleAvatar";
import { PipelineSection } from "./PipelineSection";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Canvas() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-8 relative overflow-y-auto">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-[var(--gradient-glow)] pointer-events-none" />
      
      {/* Theme toggle - fixed/floating, subtle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 max-w-6xl w-full animate-fade-in py-12 md:py-8">
        {/* Kyle Avatar */}
        <div className="animate-float">
          <KyleAvatar size="lg" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Kyle
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-lg">
            Your AI Design Colleague for the Modern Creative
          </p>
        </div>

        {/* Description */}
        <p className="text-center text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed px-4">
          The virtual design partner built for <span className="text-primary font-semibold">2026 and beyond</span>. 
          Brainstorm concepts, co-create stunning interiors, and transform ideas into 
          <span className="text-primary font-semibold"> preliminary projects</span> — all through 
          natural conversation in just <span className="text-primary font-semibold">minutes</span>, not weeks.
        </p>

        {/* CTA Button with prominent animation */}
        <div className="relative group">
          {/* Animated glow ring behind button */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-xl blur-md opacity-60 group-hover:opacity-100 animate-pulse-glow transition-opacity duration-500" />
          
          <Button
            variant="outline"
            onClick={() => navigate("/shazam")}
            className="relative flex items-center gap-3 px-8 py-4 h-auto bg-background border-2 border-primary/50 hover:border-primary hover:bg-primary/10 shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all duration-300"
          >
            {/* Animated icon container */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-full blur-sm animate-pulse" />
              <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            
            <div className="text-left">
              <span className="font-bold text-lg text-foreground">Co-create with Kyle</span>
              <p className="text-sm text-muted-foreground">Start your design journey</p>
            </div>
          </Button>
        </div>

        {/* Pipeline Section */}
        <PipelineSection />
      </div>
    </div>
  );
}
