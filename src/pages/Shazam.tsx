import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Home, Download, Heart, RotateCcw, Loader2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useKyle } from "@/contexts/KyleContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Shazam() {
  const [localGenerating, setLocalGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    isSpeaking, 
    messages, 
    designSummary,
    voiceCommandDetected,
    isGenerating,
    setGenerationCallback,
    resetGenerating
  } = useKyle();

  // Build prompt from conversation
  const prompt = useMemo(() => {
    if (messages.length === 0) return null;
    
    const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    return `Based on this interior design conversation, generate a photorealistic interior design visualization:\n\n${text}\n\nCreate a beautiful, professional interior design image.`;
  }, [messages]);

  // Generate design function
  const generateDesign = useCallback(async () => {
    const promptToUse = prompt || designSummary || "";
    if (!promptToUse.trim()) {
      toast.error("Start a conversation with Kyle first");
      return;
    }

    setLocalGenerating(true);
    
    // Scroll to image area
    if (imageAreaRef.current) {
      imageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-design', {
        body: { prompt: promptToUse }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success("Design created!");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to generate design");
    } finally {
      setLocalGenerating(false);
      resetGenerating();
    }
  }, [prompt, designSummary, resetGenerating]);

  // Register generation callback
  useEffect(() => {
    setGenerationCallback(generateDesign);
    return () => setGenerationCallback(null);
  }, [generateDesign, setGenerationCallback]);

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded!");
  };

  const handleNewDesign = () => {
    setGeneratedImage(null);
  };

  const getStatusText = () => {
    if (localGenerating || isGenerating) return "Creating your design...";
    if (voiceCommandDetected) return "Voice command detected!";
    if (isConnected) return "";
    if (generatedImage) return "";
    return "Tap Kyle to start";
  };

  const showLoading = localGenerating || isGenerating;

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
      <main className="flex-1 flex flex-col items-center justify-start px-4 pb-8">
        
        {/* Kyle Section */}
        <div className="flex flex-col items-center gap-4 min-h-[400px] justify-end pt-16">
          <KyleAvatar size="xxl" />
          
          {/* Audio Waves */}
          <div className="h-12 flex items-center justify-center">
            <div className={`transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
              <AudioWaves isActive={isConnected} isSpeaking={isSpeaking} />
            </div>
          </div>
          
          {/* Status Text with Bouncing Arrow */}
          <div className="flex flex-col items-center gap-3">
            {!isConnected && !generatedImage && !showLoading && (
              <ChevronUp className="h-10 w-10 text-foreground animate-bounce" />
            )}
            <p className="text-muted-foreground text-lg font-medium">
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full max-w-md my-6">
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
        </div>

        {/* Image Area */}
        <div ref={imageAreaRef} className="w-full max-w-md aspect-square relative">
          {showLoading ? (
            <div className="w-full h-full rounded-2xl bg-card/50 border border-border/30 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : generatedImage ? (
            <img 
              src={generatedImage} 
              alt="Generated design" 
              className="w-full h-full object-cover rounded-2xl shadow-2xl"
            />
          ) : (
            <div className="w-full h-full rounded-2xl bg-card/30 border border-border/20 flex items-center justify-center">
              <p className="text-muted-foreground/50 text-sm text-center px-8">
                Describe your dream space to Kyle and say "Hey Kyle Generate"
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {generatedImage && !showLoading && (
          <div className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadImage}
              className="rounded-full gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toast.success("Saved to favorites!")}
              className="rounded-full gap-2"
            >
              <Heart className="h-4 w-4" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewDesign}
              className="rounded-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              New
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
