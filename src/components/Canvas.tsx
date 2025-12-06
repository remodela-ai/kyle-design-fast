import { KyleAvatar } from "./KyleAvatar";
import { VoiceInput } from "./VoiceInput";
import { PipelineSection } from "./PipelineSection";
import { ThemeToggle } from "./ThemeToggle";

export function Canvas() {
  return (
    <div className="flex-1 flex flex-col items-center p-8 relative overflow-y-auto">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-[var(--gradient-glow)] pointer-events-none" />
      
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-6xl w-full animate-fade-in py-8">
        {/* Kyle Avatar */}
        <div className="animate-float">
          <KyleAvatar size="lg" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            AI Design-OS
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Your personalized AI Design Operating System
          </p>
        </div>

        {/* Description */}
        <p className="text-center text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Meet <span className="text-primary font-semibold">Kyle</span>, your super voice agent. 
          In just <span className="text-primary font-semibold">5 minutes</span> instead of 5 weeks, 
          get complete interior design proposals with floor plans, moodboards, measurements, 
          and professional documents delivered to your email.
        </p>

        {/* Voice Input */}
        <VoiceInput />

        {/* Pipeline Section */}
        <PipelineSection />
      </div>
    </div>
  );
}
