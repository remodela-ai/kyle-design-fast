import { useNavigate } from "react-router-dom";
import { KyleAvatar } from "@/components/KyleAvatar";
import { ChevronUp } from "lucide-react";
import kitchenHero from "@/assets/kitchen-hero.jpg";

const KyleSocialLanding = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/shazam");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0">
        <img 
          src={kitchenHero} 
          alt="Luxury modern kitchen" 
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-12 px-6">
        <div className="flex flex-col items-center max-w-md w-full text-center gap-6">
          
          {/* Hero headline - punchy and direct */}
          <div className="space-y-3">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
              Meet <span className="text-primary">Kyle</span>,<br />
              Your Expert Kitchen Designer
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-sm mx-auto">
              Get a stunning design concept in under 5 minutes.<br />
              100% free. Zero commitment.
            </p>
          </div>

          {/* Kyle Avatar - the hero element */}
          <button
            onClick={handleStart}
            className="group relative focus:outline-none focus:ring-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Start conversation with Kyle"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-4 rounded-full bg-primary/30 blur-xl group-hover:bg-primary/40 transition-colors" />
            
            <KyleAvatar size="lg" />
            
            {/* Online indicator */}
            <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-primary border-2 border-background animate-pulse" />
          </button>

          {/* CTA indicator */}
          <div className="flex flex-col items-center gap-2 text-foreground">
            <ChevronUp className="h-5 w-5 animate-bounce" />
            <span className="text-sm font-medium">Tap Kyle to start designing</span>
          </div>

          {/* Trust line */}
          <p className="text-xs text-muted-foreground mt-2">
            Powered by AI • Connect with certified pros near you
          </p>
        </div>
      </div>
    </div>
  );
};

export default KyleSocialLanding;
