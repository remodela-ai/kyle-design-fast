import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Home, RefreshCw, CheckCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { InsightsEditor } from "@/components/InsightsEditor";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LocationState {
  designImageUrl: string;
  transcript: string;
  extractedInsights: string;
  referenceImage?: string;
  source?: "voice" | "pdf";
}

export default function DesignReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // State management
  const [designImageUrl, setDesignImageUrl] = useState(state?.designImageUrl || "");
  const [transcript] = useState(state?.transcript || "");
  const [currentInsights, setCurrentInsights] = useState(state?.extractedInsights || "");
  const [referenceImage] = useState(state?.referenceImage);
  const [source] = useState<"voice" | "pdf">(state?.source || "voice");
  
  const [iterationCount, setIterationCount] = useState(1);
  const [isIterating, setIsIterating] = useState(false);

  // Redirect if no data
  useEffect(() => {
    if (!state?.designImageUrl || !state?.extractedInsights) {
      toast.error("No design data found. Please start from Shazam.");
      navigate("/shazam");
    }
  }, [state, navigate]);

  // Handle iteration - regenerate image with current insights
  const handleIterate = async () => {
    if (!currentInsights.trim()) {
      toast.error("Please add some design insights first");
      return;
    }

    setIsIterating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('blink-design', {
        body: { 
          prompt: currentInsights,
          referenceImage: referenceImage || undefined
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setDesignImageUrl(data.imageUrl);
        setIterationCount(prev => prev + 1);
        
        // Update insights if LLM refined them
        if (data.optimizedPrompt) {
          setCurrentInsights(data.optimizedPrompt);
        }
        
        toast.success(`Iteration ${iterationCount + 1} complete!`);
      }
    } catch (error) {
      console.error('Iteration error:', error);
      toast.error("Failed to regenerate design");
    } finally {
      setIsIterating(false);
    }
  };

  // Handle approval - navigate to pipeline
  const handleApprove = () => {
    navigate("/360-free-project", {
      state: {
        designImageUrl,
        conversationSummary: currentInsights,
        transcript,
        iterationCount
      }
    });
  };

  if (!state) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Design Review</h1>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Transcript + Insights */}
          <div className="space-y-6">
            {/* Transcript Panel */}
            <TranscriptViewer 
              transcript={transcript} 
              source={source}
            />
            
            {/* Insights Panel */}
            <InsightsEditor
              insights={currentInsights}
              onInsightsChange={setCurrentInsights}
              isEditable={!isIterating}
            />
          </div>

          {/* Right Column: Image Preview + Actions */}
          <div className="space-y-6">
            {/* Design Preview */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Design Preview</h3>
                <span className="text-xs text-muted-foreground">
                  Iteration {iterationCount}
                </span>
              </div>
              
              <div className="rounded-xl overflow-hidden border border-border shadow-lg">
                <AspectRatio ratio={1}>
                  {isIterating ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Regenerating design...</p>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={designImageUrl} 
                      alt="Design preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </AspectRatio>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleIterate}
                disabled={isIterating}
                className="w-full gap-2 h-12"
              >
                {isIterating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                {isIterating ? "Regenerating..." : "Iterate Design"}
              </Button>
              
              <Button
                variant="kyle"
                size="lg"
                onClick={handleApprove}
                disabled={isIterating}
                className="w-full gap-2 h-12"
              >
                <CheckCircle className="h-5 w-5" />
                Approve & Run Pipeline
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Iterate as many times as you need. When satisfied, approve to run the 16-step pipeline.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
