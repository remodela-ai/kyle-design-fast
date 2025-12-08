import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Sparkles, Heart, RotateCcw, Loader2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useKyle } from "@/contexts/KyleContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Shazam() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { 
    isConnected: kyleConnected, 
    isSpeaking: kyleSpeaking, 
    messages, 
    designSummary,
    setOnGenerateDesign,
    setIsGeneratingFromVoice,
    stopConversation: stopKyle
  } = useKyle();

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
      }
    } catch (error) {
      console.error('Error generating design:', error);
      toast.error("Failed to generate design");
    } finally {
      setIsGenerating(false);
      setIsGeneratingFromVoice(false);
    }
  }, [setIsGeneratingFromVoice]);

  // Register the voice generate callback
  useEffect(() => {
    const voiceGenerateHandler = () => {
      const promptToUse = buildPromptFromConversation || designSummary || "";
      if (promptToUse) {
        // Scroll down to image area when voice command triggers
        imageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        generateDesign(promptToUse);
      }
    };

    setOnGenerateDesign(() => voiceGenerateHandler);
    return () => setOnGenerateDesign(null);
  }, [buildPromptFromConversation, designSummary, generateDesign, setOnGenerateDesign]);

  // After image generation, wait 5 minutes then navigate to /storytelling
  useEffect(() => {
    if (generatedImage && !isGenerating) {
      console.log("🎭 Image generated! Will navigate to storytelling in 5 minutes...");
      
      // Stop Kyle if still connected
      if (kyleConnected) {
        stopKyle();
      }
      
      // Wait 5 minutes (300000ms) then navigate to storytelling
      const timer = setTimeout(() => {
        console.log("🎭 Navigating to storytelling page...");
        const designContext = designSummary || buildPromptFromConversation || "";
        
        navigate('/storytelling', {
          state: {
            generatedImage,
            designContext
          }
        });
      }, 300000); // 5 minutes
      
      return () => clearTimeout(timer);
    }
  }, [generatedImage, isGenerating, kyleConnected, stopKyle, designSummary, buildPromptFromConversation, navigate]);

  const handleFreeProject = () => {
    navigate('/pipeline-diseno');
  };

  const handleNewDesign = () => {
    setGeneratedImage(null);
  };

  const getStatusText = () => {
    if (isGenerating) return "";
    if (kyleConnected) return "";
    if (generatedImage) return "Navigating to storytelling...";
    return "Tap Kyle to start";
  };

  // Audio waves state
  const isAnyAgentConnected = kyleConnected;
  const isAnyAgentSpeaking = kyleSpeaking;

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
      <main className="flex-1 flex flex-col items-center justify-start px-4 pb-8 overflow-y-auto">

        {/* Kyle Section - Fixed height to prevent layout shift */}
        <div className="flex flex-col items-center gap-4 min-h-[400px] justify-end pt-16">
          <KyleAvatar size="xxl" />
          
          {/* Audio Waves - Fixed height container */}
          <div className="h-12 flex items-center justify-center">
            <div className={`transition-opacity duration-300 ${isAnyAgentConnected ? 'opacity-100' : 'opacity-0'}`}>
              <AudioWaves isActive={isAnyAgentConnected} isSpeaking={isAnyAgentSpeaking} />
            </div>
          </div>
          
          {/* Status Text with Bouncing Arrow */}
          <div className="flex flex-col items-center gap-3">
            {!kyleConnected && !generatedImage && !isGenerating && (
              <ChevronUp className="h-10 w-10 text-foreground animate-bounce" />
            )}
            <p className="text-muted-foreground text-lg font-medium">
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Separator Line with Glow */}
        <div className="w-full max-w-md my-6">
          <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
        </div>

        {/* Image Area - Separate section */}
        <div ref={imageRef} className="w-full max-w-md aspect-square relative">
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
          <div className="flex gap-3 mt-4">
            <Button 
              size="sm" 
              onClick={handleFreeProject}
              className="rounded-full gap-2 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
            >
              <Sparkles className="h-4 w-4" />
              Free Project
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
