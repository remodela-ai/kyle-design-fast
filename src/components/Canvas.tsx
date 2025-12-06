import { KyleAvatar } from "./KyleAvatar";
import { VoiceInput } from "./VoiceInput";
import { FeatureGrid } from "./FeatureGrid";

export function Canvas() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-[var(--gradient-glow)] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-4xl w-full animate-fade-in">
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

        {/* Feature Grid */}
        <div className="mt-8 w-full">
          <FeatureGrid />
        </div>
      </div>
    </div>
  );
}
