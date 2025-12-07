import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Home, Download, Heart, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { PipelineProgress } from "@/components/PipelineProgress";
import { useKyle } from "@/contexts/KyleContext";
import { useKyle4Agent } from "@/hooks/useKyle4Agent";
import { usePipeline } from "@/hooks/usePipeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Shazam() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [kyle4Active, setKyle4Active] = useState(false);
  
  const mainRef = useRef<HTMLElement>(null);
  
  const { 
    isConnected: kyle3Connected, 
    isSpeaking: kyle3Speaking, 
    messages, 
    designSummary,
    setOnGenerateDesign,
    setIsGeneratingFromVoice,
    stopConversation: stopKyle3
  } = useKyle();

  const kyle4 = useKyle4Agent();
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

  // After image generation, scroll up and activate Kyle 4
  useEffect(() => {
    if (generatedImage && !kyle4Active && !isGenerating) {
      console.log("Image generated! Preparing Kyle 4...");
      
      // Scroll to top smoothly
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Wait for scroll animation, then activate Kyle 4
      const timer = setTimeout(async () => {
        console.log("Activating Kyle 4 storyteller...");
        setKyle4Active(true);
        
        // Stop Kyle 3 if still connected
        if (kyle3Connected) {
          await stopKyle3();
        }
        
        // Start Kyle 4
        await kyle4.startConversation();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [generatedImage, kyle4Active, isGenerating, kyle3Connected, stopKyle3, kyle4]);

  // Handle pipeline command from Kyle 4
  useEffect(() => {
    kyle4.setOnPipelineCommand(() => {
      console.log("Pipeline command received! Starting full design package...");
      
      // Stop Kyle 4
      kyle4.stopConversation();
      setKyle4Active(false);
      
      toast.success("Starting your full design package!");
      
      // Start the pipeline
      if (generatedImage) {
        pipeline.startPipeline(generatedImage, designSummary || undefined);
      }
    });
    
    return () => kyle4.setOnPipelineCommand(null);
  }, [kyle4, generatedImage, designSummary, pipeline]);

  // Handle tapping Kyle to stop Kyle 4
  const handleKyleTap = useCallback(async () => {
    if (kyle4Active && kyle4.isConnected) {
      console.log("Stopping Kyle 4 via Kyle tap...");
      await kyle4.stopConversation();
      setKyle4Active(false);
      toast.info("Kyle 4 stopped");
    }
  }, [kyle4Active, kyle4]);

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
    setKyle4Active(false);
    pipeline.resetPipeline();
    if (kyle4.isConnected) {
      kyle4.stopConversation();
    }
  };

  const getStatusText = () => {
    if (pipeline.isRunning) return "";
    if (isGenerating) return "";
    if (kyle4Active && kyle4.isConnected) return "Tap Kyle to stop";
    if (kyle3Connected) return "";
    if (generatedImage) return "";
    return "Tap Kyle to start";
  };

  // Determine which agent is active for audio waves
  const isAnyAgentConnected = kyle3Connected || kyle4.isConnected;
  const isAnyAgentSpeaking = kyle3Speaking || kyle4.isSpeaking;

  // Debug: determine active agent name
  const getActiveAgentName = () => {
    if (kyle4.isConnected) return "Kyle 4";
    if (kyle3Connected) return "Kyle 3";
    return "None";
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
      <main ref={mainRef} className="flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-8 overflow-y-auto">
        
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
          <div className="flex flex-col items-center gap-4 min-h-[320px] justify-center">
            {/* Kyle Avatar + Debug Badge Container */}
            <div className="flex items-center gap-4">
              <div onClick={kyle4Active ? handleKyleTap : undefined}>
                <KyleAvatar 
                  size="xxl" 
                  onClickOverride={kyle4Active ? handleKyleTap : undefined}
                />
              </div>
              
              {/* Debug Badge - Right side of Kyle */}
              <div className="flex flex-col gap-1 bg-card/80 border border-border/50 rounded-lg p-3 text-xs font-mono min-w-[120px]">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isAnyAgentConnected ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  <span className="text-foreground font-semibold">{getActiveAgentName()}</span>
                </div>
                <div className="text-muted-foreground">
                  {kyle3Connected ? '🟢' : '⚪'} Kyle 3: {kyle3Connected ? 'ON' : 'OFF'}
                </div>
                <div className="text-muted-foreground">
                  {kyle4.isConnected ? '🟢' : '⚪'} Kyle 4: {kyle4.isConnected ? 'ON' : 'OFF'}
                </div>
                <div className="text-muted-foreground mt-1 pt-1 border-t border-border/30">
                  Speaking: {isAnyAgentSpeaking ? '🔊' : '🔇'}
                </div>
              </div>
            </div>
            
            {/* Audio Waves - Fixed height container */}
            <div className="h-12 flex items-center justify-center">
              <div className={`transition-opacity duration-300 ${isAnyAgentConnected ? 'opacity-100' : 'opacity-0'}`}>
                <AudioWaves isActive={isAnyAgentConnected} isSpeaking={isAnyAgentSpeaking} />
              </div>
            </div>
            
            {/* Status Text - Fixed height */}
            <div className="h-6 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                {getStatusText()}
              </p>
            </div>
            
            {/* Kyle 4 indicator */}
            {kyle4Active && (
              <div className="animate-fade-in">
                <p className="text-primary text-xs font-medium">
                  ✨ Kyle 4 is telling your design story...
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
