import { Zap, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const BlinkDesign = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 shadow-lg shadow-primary/10 dark:shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:shadow-primary/30 dark:hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all duration-300"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:py-12">
        {/* Hero Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20 dark:shadow-[0_0_25px_rgba(220,38,38,0.4)] transition-all duration-300 hover:shadow-primary/40 dark:hover:shadow-[0_0_35px_rgba(220,38,38,0.6)] hover:scale-105">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-primary flex items-center justify-center bg-background dark:bg-primary shadow-lg shadow-primary/30 dark:shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <Zap className="h-6 w-6 md:h-7 md:w-7 text-primary dark:text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 text-center">
          Blink Design
        </h1>
        <p className="text-muted-foreground text-center text-base md:text-lg max-w-md mb-10">
          Instant creative inspiration for your design projects
        </p>

        {/* How It Works Card */}
        <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg shadow-primary/5 dark:shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:shadow-primary/10 dark:hover:shadow-[0_0_30px_rgba(220,38,38,0.25)] transition-all duration-300">
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              How It Works
            </h2>
          </div>
          <p className="text-muted-foreground text-sm md:text-base mb-8">
            Lightning-fast AI-powered inspiration engine that generates unique and personalized ideas
          </p>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-primary text-primary text-xs font-medium mb-3 shadow-lg shadow-primary/20 dark:shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                Step 1
              </span>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Describe
              </h3>
              <p className="text-muted-foreground text-sm">
                Simply type what you want to see - the image generates automatically
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-primary text-primary text-xs font-medium mb-3 shadow-lg shadow-primary/20 dark:shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                Step 2
              </span>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Save & Use
              </h3>
              <p className="text-muted-foreground text-sm">
                Download, save to favorites or select as reference for other agents
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for future content */}
        <div className="w-full max-w-2xl mt-8 p-6 border border-dashed border-border rounded-2xl text-center">
          <p className="text-muted-foreground text-sm">
            Design generation area coming soon...
          </p>
        </div>
      </main>
    </div>
  );
};

export default BlinkDesign;
