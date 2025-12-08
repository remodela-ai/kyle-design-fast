import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Home, Download, Heart, RotateCcw, Loader2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { PipelineProgress } from "@/components/PipelineProgress";
import { useKyle } from "@/contexts/KyleContext";
import { useShazam3Agent } from "@/hooks/useShazam3Agent";
import { usePipeline } from "@/hooks/usePipeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Shazam() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [shazam3Active, setShazam3Active] = useState(false);
  
  const mainRef = useRef<HTMLElement>(null);
  
  const { 
    isConnected: kyleConnected, 
    isSpeaking: kyleSpeaking, 
    messages, 
    designSummary,
    setOnGenerateDesign,
    setIsGeneratingFromVoice,
    stopConversation: stopKyle
  } = useKyle();

  const shazam3 = useShazam3Agent();
  const pipeline = usePipeline();

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
        generateDesign(promptToUse);
      }
    };

    setOnGenerateDesign(() => voiceGenerateHandler);
    return () => setOnGenerateDesign(null);
  }, [buildPromptFromConversation, designSummary, generateDesign, setOnGenerateDesign]);

  // After image generation, scroll up and activate Shazam 3
  useEffect(() => {
    if (generatedImage && !shazam3Active && !isGenerating) {
      console.log("Image generated! Preparing Shazam 3...");
      
      // Scroll to top smoothly
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Wait for scroll animation, then activate Shazam 3
      const timer = setTimeout(async () => {
        console.log("Activating Shazam 3 storyteller...");
        setShazam3Active(true);
        
        // Stop Kyle if still connected
        if (kyleConnected) {
          await stopKyle();
        }
        
        // Start Shazam 3
        await shazam3.startConversation();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [generatedImage, shazam3Active, isGenerating, kyleConnected, stopKyle, shazam3]);

  // Handle pipeline command from Shazam 3
  useEffect(() => {
    shazam3.setOnPipelineCommand(() => {
      console.log("Pipeline command received! Starting full design package...");
      
      // Stop Shazam 3
      shazam3.stopConversation();
      setShazam3Active(false);
      
      toast.success("Starting your full design package!");
      
      // Start the pipeline
      if (generatedImage) {
        pipeline.startPipeline(generatedImage, designSummary || undefined);
      }
    });
    
    return () => shazam3.setOnPipelineCommand(null);
  }, [shazam3, generatedImage, designSummary, pipeline]);

  // Handle tapping Kyle to stop Shazam 3
  const handleKyleTap = useCallback(async () => {
    if (shazam3Active && shazam3.isConnected) {
      console.log("Stopping Shazam 3 via Kyle tap...");
      await shazam3.stopConversation();
      setShazam3Active(false);
      toast.info("Shazam 3 stopped");
    }
  }, [shazam3Active, shazam3]);

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
    setShazam3Active(false);
    pipeline.resetPipeline();
    if (shazam3.isConnected) {
      shazam3.stopConversation();
    }
  };

  const getStatusText = () => {
    if (pipeline.isRunning) return "";
    if (isGenerating) return "";
    if (shazam3Active && shazam3.isConnected) return "Tap Kyle to stop";
    if (kyleConnected) return "";
    if (generatedImage) return "";
    return "Tap Kyle to start";
  };

  // Determine which agent is active for audio waves
  const isAnyAgentConnected = kyleConnected || shazam3.isConnected;
  const isAnyAgentSpeaking = kyleSpeaking || shazam3.isSpeaking;

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
      <main ref={mainRef} className="flex-1 flex flex-col items-center justify-start px-4 pb-8 overflow-y-auto">
        
        {/* Pipeline Progress - Shows when pipeline is running */}
        {pipeline.isRunning && (
          <div className="w-full animate-fade-in mb-6">
            <PipelineProgress 
              steps={pipeline.steps} 
              currentStep={pipeline.currentStep} 
            />
          </div>
        )}

        {/* Kyle Section - Fixed height to prevent layout shift */}
        {!pipeline.isRunning && (
          <div className="flex flex-col items-center gap-4 min-h-[400px] justify-end pt-16">
            <div onClick={shazam3Active ? handleKyleTap : undefined}>
              <KyleAvatar 
                size="xxl" 
                onClickOverride={shazam3Active ? handleKyleTap : undefined}
              />
            </div>
            
            {/* Audio Waves - Fixed height container */}
            <div className="h-12 flex items-center justify-center">
              <div className={`transition-opacity duration-300 ${isAnyAgentConnected ? 'opacity-100' : 'opacity-0'}`}>
                <AudioWaves isActive={isAnyAgentConnected} isSpeaking={isAnyAgentSpeaking} />
              </div>
            </div>
            
            {/* Status Text with Bouncing Arrow */}
            <div className="flex flex-col items-center gap-2">
              {!kyleConnected && !generatedImage && !isGenerating && (
                <ChevronUp className="h-6 w-6 text-foreground animate-bounce" />
              )}
              <p className="text-muted-foreground text-sm">
                {getStatusText()}
              </p>
            </div>
            
            {/* Shazam 3 indicator */}
            {shazam3Active && (
              <div className="animate-fade-in">
                <p className="text-primary text-xs font-medium">
                  ✨ Shazam 3 is telling your design story...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Separator Line with Glow */}
        {!pipeline.isRunning && (
          <div className="w-full max-w-md my-6">
            <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
          </div>
        )}

        {/* Image Area - Separate section */}
        {!pipeline.isRunning && (
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
        )}

        {/* Action Buttons - Only show when image exists and no pipeline */}
        {generatedImage && !isGenerating && !pipeline.isRunning && (
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
