import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Download, Heart, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useKyle } from "@/contexts/KyleContext";
import { useShazam2Agent } from "@/hooks/useShazam2Agent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Shazam() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [shazam2Started, setShazam2Started] = useState(false);
  
  const { 
    isConnected, 
    isSpeaking, 
    messages, 
    designSummary,
    setOnGenerateDesign,
    setIsGeneratingFromVoice
  } = useKyle();

  const shazam2 = useShazam2Agent();

  const buildPromptFromConversation = useMemo(() => {
    if (messages.length === 0) return null;
    
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    
    return `Based on this interior design conversation, generate a photorealistic interior design visualization:\n\n${conversationText}\n\nCreate a beautiful, professional interior design image that matches the discussed preferences.`;
  }, [messages]);

  const generateDesign = useCallback(async (promptToUse: string) => {
    if (!promptToUse.trim()) {
      toast.error("Start a conversation with Kyle first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-design', {
        body: { prompt: promptToUse }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success("Design created!");
        
        // Auto-start Shazam 2 agent after image generation
        setTimeout(async () => {
          try {
            await shazam2.startConversation();
            setShazam2Started(true);
          } catch (err) {
            console.error("Failed to start Shazam 2:", err);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error generating design:', error);
      toast.error("Failed to generate design");
    } finally {
      setIsGenerating(false);
      setIsGeneratingFromVoice(false);
    }
  }, [setIsGeneratingFromVoice, shazam2]);

  // Register the voice generate callback
  useEffect(() => {
    const voiceGenerateHandler = () => {
      const promptToUse = buildPromptFromConversation || designSummary || "";
      if (promptToUse) {
        generateDesign(promptToUse);
      }
    };

    setOnGenerateDesign(() => voiceGenerateHandler);
    return () => setOnGenerateDesign(null);
  }, [buildPromptFromConversation, designSummary, generateDesign, setOnGenerateDesign]);

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  const handleNewDesign = () => {
    setGeneratedImage(null);
    setShazam2Started(false);
  };

  // Stop Shazam 2 when tapping Kyle while Shazam 2 is active
  const handleStopShazam2 = useCallback(async () => {
    if (shazam2.isConnected) {
      await shazam2.stopConversation();
      setShazam2Started(false);
      toast.info("Shazam 2 stopped");
    }
  }, [shazam2]);

  // Detect "full project" command from Shazam 2 messages
  useEffect(() => {
    if (!shazam2.isConnected) return;
    
    const lastUserMessage = shazam2.messages
      .filter(m => m.role === "user")
      .pop();
    
    if (lastUserMessage) {
      const content = lastUserMessage.content.toLowerCase();
      // Detect: "hey kyle give me the full project"
      if (content.includes("kyle") && content.includes("full") && content.includes("project")) {
        console.log("FULL PROJECT COMMAND DETECTED");
        shazam2.stopConversation().then(() => {
          toast.success("Starting full project generation!");
          navigate("/project");
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shazam2.messages, shazam2.isConnected, navigate]);

  const getStatusText = () => {
    if (isGenerating) return "";
    if (shazam2.isConnected) return "Tap Kyle to stop";
    if (isConnected) return "";
    if (generatedImage) return "";
    return "Tap Kyle to start";
  };

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
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Kyle Section - Fixed height to prevent layout shift */}
        <div className="flex flex-col items-center gap-4 min-h-[320px] justify-center">
          <KyleAvatar size="xxl" onClickOverride={shazam2.isConnected ? handleStopShazam2 : undefined} />
          
          {/* Audio Waves - Fixed height container */}
          <div className="h-12 flex items-center justify-center">
            <div className={`transition-opacity duration-300 ${(isConnected || shazam2.isConnected) ? 'opacity-100' : 'opacity-0'}`}>
              <AudioWaves isActive={isConnected || shazam2.isConnected} isSpeaking={isSpeaking || shazam2.isSpeaking} />
            </div>
          </div>
          
          {/* Status Text - Fixed height */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Separator Line with Glow */}
        <div className="w-full max-w-md my-6">
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
        </div>

        {/* Image Area - Separate section */}
        <div className="w-full max-w-md aspect-square relative">
          {isGenerating ? (
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

        {/* Action Buttons - Only show when image exists */}
        {generatedImage && !isGenerating && (
          <div className="flex gap-3">
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
