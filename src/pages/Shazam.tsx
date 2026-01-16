import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Gift, Heart, RotateCcw, Loader2, ChevronUp, ImagePlus, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useKyle } from "@/contexts/KyleContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUploadDialog } from "@/components/ImageUploadDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Shazam() {
  const navigate = useNavigate();
  const [localGenerating, setLocalGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
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

  // Build prompt from FULL conversation transcript - Kyle's questions + user responses
  const prompt = useMemo(() => {
    if (messages.length === 0) return null;
    
    // Log all messages for debugging
    console.log("📝 Full transcript for prompt:", messages.map(m => `[${m.role}] ${m.content}`));
    
    // Build full conversation transcript with both roles
    const fullTranscript = messages.map(m => {
      const role = m.role === "user" ? "Client" : "Kyle";
      return `${role}: ${m.content}`;
    }).join('\n\n');
    
    console.log("📝 Full transcript:", fullTranscript);
    
    return `Based on the following interior design consultation between Kyle (design assistant) and a client, create a photorealistic interior design visualization that captures ALL discussed requirements:

---CONVERSATION TRANSCRIPT---
${fullTranscript}
---END TRANSCRIPT---

INSTRUCTIONS: Analyze the full conversation to extract:
1. Room type and dimensions mentioned
2. Style preferences (modern, minimalist, cozy, etc.)
3. Specific furniture and colors requested
4. Materials and textures discussed
5. Items to EXCLUDE (if client said "no plants", "no rug", etc.)
6. Lighting preferences
7. Any reference images or inspirations mentioned

Create a design that accurately reflects everything discussed in the conversation. Do NOT add elements not discussed or ignore specific exclusions.`;
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
      const { data, error } = await supabase.functions.invoke('blink-design', {
        body: { 
          prompt: promptToUse,
          referenceImage: referenceImage || undefined
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success("Design created with Flux 2 Pro!");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to generate design");
    } finally {
      setLocalGenerating(false);
      resetGenerating();
    }
  }, [prompt, designSummary, referenceImage, resetGenerating]);

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
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full relative"
            onClick={() => setShowUploadDialog(true)}
          >
            <ImagePlus className="h-5 w-5" />
            {referenceImage && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
            )}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Reference Image Preview */}
      {referenceImage && (
        <div className="absolute top-16 right-4 z-10">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-primary shadow-lg">
            <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
            <button 
              onClick={() => setReferenceImage(null)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
            >
              <X className="h-3 w-3 text-destructive-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onImageSelected={(imageData) => {
          setReferenceImage(imageData);
          toast.success("Reference image added!");
        }}
      />

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
              variant="kyle" 
              size="sm" 
              onClick={() => navigate("/360-free-project", { 
                state: { 
                  designImageUrl: generatedImage,
                  conversationSummary: designSummary || messages.map(m => `${m.role}: ${m.content}`).join('\n')
                } 
              })}
              className="rounded-full gap-2"
            >
              <Gift className="h-4 w-4" />
              I want my free project
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPromptDialog(true)}
              className="rounded-full gap-2"
            >
              <FileText className="h-4 w-4" />
              Ver prompt
            </Button>
          </div>
        )}

        {/* Prompt Dialog */}
        <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prompt utilizado</DialogTitle>
            </DialogHeader>
            <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono">
              {prompt || "No prompt available"}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
