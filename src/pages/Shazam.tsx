import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Home, Download, Heart, RotateCcw, Loader2 } from "lucide-react";
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
  
  const { 
    isConnected, 
    isSpeaking, 
    messages, 
    designSummary,
    setOnGenerateDesign,
    setIsGeneratingFromVoice
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
  };

  const getStatusText = () => {
    if (isGenerating) return "";
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-6">
        {/* Kyle Avatar - Central Element */}
        <div className="flex flex-col items-center gap-4">
          <KyleAvatar size="xxl" />
          
          {/* Audio Waves */}
          <div className={`transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
            <AudioWaves isActive={isConnected} isSpeaking={isSpeaking} />
          </div>
          
          {/* Status Text - Fixed height to avoid layout shift */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Image Area */}
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
