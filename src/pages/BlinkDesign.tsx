import { useState } from "react";
import { Zap, Home, Loader2, Download, Heart, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BlinkDesign = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const generateDesign = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a design description");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-design", {
        body: { prompt: prompt.trim() },
      });

      if (error) {
        console.error("Error generating design:", error);
        toast.error(error.message || "Failed to generate design");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setDescription(data.description);
        toast.success("Design generated successfully!");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isGenerating) {
      generateDesign();
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `blink-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

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
        <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg shadow-primary/5 dark:shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:shadow-primary/10 dark:hover:shadow-[0_0_30px_rgba(220,38,38,0.25)] transition-all duration-300 mb-8">
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

        {/* Design Generation Area */}
        <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg shadow-primary/5 dark:shadow-[0_0_20px_rgba(220,38,38,0.15)]">
          {/* Input */}
          <div className="flex gap-3 mb-6">
            <Input
              placeholder="Describe your interior design idea..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isGenerating}
              className="flex-1 h-12 shadow-lg shadow-primary/10 dark:shadow-[0_0_10px_rgba(220,38,38,0.2)] focus:shadow-primary/20 dark:focus:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-300"
            />
            <Button
              onClick={generateDesign}
              disabled={isGenerating || !prompt.trim()}
              className="h-12 px-6 shadow-lg shadow-primary/30 dark:shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-primary/50 dark:hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all duration-300"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Generated Image */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p>Generating your design inspiration...</p>
            </div>
          )}

          {generatedImage && !isGenerating && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden shadow-lg shadow-primary/10 dark:shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                <img
                  src={generatedImage}
                  alt="Generated design"
                  className="w-full h-auto"
                />
              </div>
              
              {description && (
                <p className="text-sm text-muted-foreground text-center">
                  {description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadImage}
                  className="flex items-center gap-2 shadow-lg shadow-primary/10 dark:shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:shadow-primary/20 dark:hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-300"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Saved to favorites!")}
                  className="flex items-center gap-2 shadow-lg shadow-primary/10 dark:shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:shadow-primary/20 dark:hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-300"
                >
                  <Heart className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGeneratedImage(null);
                    setPrompt("");
                  }}
                  className="flex items-center gap-2 shadow-lg shadow-primary/10 dark:shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:shadow-primary/20 dark:hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4" />
                  New
                </Button>
              </div>
            </div>
          )}

          {!generatedImage && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
              <Zap className="h-8 w-8 mb-3 text-primary/50" />
              <p className="text-sm">Your generated design will appear here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlinkDesign;
