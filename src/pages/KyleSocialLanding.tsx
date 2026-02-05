import { useNavigate } from "react-router-dom";
import { KyleAvatar } from "@/components/KyleAvatar";
import { ChevronUp } from "lucide-react";

const KyleSocialLanding = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/shazam");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Subtle top glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.08)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center gap-8">
        
        {/* Hero headline - punchy and direct */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            Dreaming of a new<br />
            <span className="text-primary">Kitchen or Bathroom?</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xs mx-auto">
            Get your free design concept in 5 minutes.<br />
            Connect with certified pros near you.
          </p>
        </div>

        {/* Kyle Avatar - the hero element */}
        <button
          onClick={handleStart}
          className="group relative focus:outline-none focus:ring-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Start conversation with Kyle"
        >
          {/* Outer glow ring */}
          <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-colors" />
          
          <KyleAvatar size="lg" />
          
          {/* Online indicator */}
          <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-primary border-2 border-background animate-pulse" />
        </button>

        {/* CTA indicator */}
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ChevronUp className="h-5 w-5 animate-bounce" />
          <span className="text-sm font-medium">Tap Kyle to start</span>
        </div>

        {/* Trust line */}
        <p className="text-xs text-muted-foreground/70 mt-4">
          Free • No commitment • 100% AI-powered
        </p>
      </div>
    </div>
  );
};

export default KyleSocialLanding;
