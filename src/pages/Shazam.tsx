import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Gift, Heart, RotateCcw, Loader2, ChevronUp, ImagePlus, X, FileText, Upload, Check, Sparkles } from "lucide-react";
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
  const [uploadedConversation, setUploadedConversation] = useState<string | null>(null);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [usedLLM, setUsedLLM] = useState(false);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
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

  // Handle PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error("Please upload a PDF file");
      return;
    }

    setParsingPdf(true);
    toast.info("Parsing conversation from PDF...");

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call edge function to parse PDF
      const { data, error } = await supabase.functions.invoke('parse-pdf-conversation', {
        body: { pdfBase64: base64 }
      });

      if (error) throw error;

      if (data?.conversationText) {
        setUploadedConversation(data.conversationText);
        toast.success("Conversation loaded from PDF!");
      }
    } catch (error) {
      console.error("PDF parsing error:", error);
      toast.error("Failed to parse PDF");
    } finally {
      setParsingPdf(false);
      // Reset input
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  // Build prompt from FULL conversation transcript OR uploaded conversation
  const prompt = useMemo(() => {
    // Use uploaded conversation if available, otherwise use voice messages
    const transcriptSource = uploadedConversation || (messages.length > 0 
      ? messages.map(m => {
          const role = m.role === "user" ? "Client" : "Kyle";
          return `${role}: ${m.content}`;
        }).join('\n\n')
      : null);
    
    if (!transcriptSource) return null;
    
    console.log("📝 Using transcript source:", uploadedConversation ? "PDF upload" : "voice messages");
    console.log("📝 Transcript:", transcriptSource.substring(0, 300) + "...");
    
    return `Based on the following interior design consultation between Kyle (design assistant) and a client, create a photorealistic interior design visualization that captures ALL discussed requirements:

---CONVERSATION TRANSCRIPT---
${transcriptSource}
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
  }, [messages, uploadedConversation]);

  // Generate design function
  const generateDesign = useCallback(async () => {
    const promptToUse = prompt || designSummary || "";
    if (!promptToUse.trim()) {
      toast.error("Start a conversation with Kyle first");
      return;
    }

    setLocalGenerating(true);
    setOptimizedPrompt(null);
    setUsedLLM(false);
    
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
        
        // Store the optimized prompt if LLM was used
        if (data.optimizedPrompt) {
          setOptimizedPrompt(data.optimizedPrompt);
          setUsedLLM(true);
        }
        
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
    setOptimizedPrompt(null);
    setUsedLLM(false);
  };

  const clearUploadedConversation = () => {
    setUploadedConversation(null);
    toast.success("Conversation cleared");
  };

  const getStatusText = () => {
    if (localGenerating || isGenerating) return "Creating your design...";
    if (voiceCommandDetected) return "Voice command detected!";
    if (uploadedConversation) return ""; // Hide status when PDF loaded
    if (isConnected) return "";
    if (generatedImage) return "";
    return "Tap Kyle to start";
  };

  const showLoading = localGenerating || isGenerating;

  // Get the original source text for the dialog
  const originalSourceText = useMemo(() => {
    return uploadedConversation || messages.map(m => `${m.role === "user" ? "Client" : "Kyle"}: ${m.content}`).join('\n\n') || "No source available";
  }, [uploadedConversation, messages]);

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
          {/* PDF Upload Button */}
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
            id="pdf-upload"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full relative"
            onClick={() => pdfInputRef.current?.click()}
            disabled={parsingPdf}
          >
            {parsingPdf ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            {uploadedConversation && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
            )}
          </Button>
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
          
          {/* Status Text with Bouncing Arrow OR Uploaded Conversation Card */}
          <div className="flex flex-col items-center gap-3">
            {uploadedConversation && !generatedImage && !showLoading ? (
              <div className="bg-card border border-border rounded-xl p-4 max-w-sm w-full shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-foreground">Conversation loaded</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {uploadedConversation.substring(0, 150)}...
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="kyle" 
                    size="sm" 
                    onClick={generateDesign}
                    className="flex-1 gap-2"
                  >
                    <Loader2 className={`h-4 w-4 ${showLoading ? 'animate-spin' : 'hidden'}`} />
                    Generate Design
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearUploadedConversation}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {!isConnected && !generatedImage && !showLoading && !uploadedConversation && (
                  <ChevronUp className="h-10 w-10 text-foreground animate-bounce" />
                )}
                <p className="text-muted-foreground text-lg font-medium">
                  {getStatusText()}
                </p>
              </>
            )}
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
              onClick={() => navigate("/design-review", { 
                state: { 
                  designImageUrl: generatedImage,
                  transcript: originalSourceText,
                  extractedInsights: optimizedPrompt || designSummary || "Design based on conversation",
                  referenceImage: referenceImage || undefined,
                  source: uploadedConversation ? "pdf" : "voice"
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
              See prompt
            </Button>
          </div>
        )}

        {/* Prompt Comparison Dialog */}
        <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prompt Analysis</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Original Source */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <h3 className="font-semibold text-sm">Original Source</h3>
                  <span className="text-xs text-muted-foreground">
                    ({uploadedConversation ? 'PDF Upload' : 'Voice Conversation'})
                  </span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {originalSourceText}
                </div>
              </div>

              {/* LLM Extraction Indicator */}
              {usedLLM && optimizedPrompt ? (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-medium text-purple-600">
                        Insights extracted by Gemini AI
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Optimized Prompt from LLM */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <h3 className="font-semibold text-sm">Optimized Prompt</h3>
                      <span className="text-xs text-muted-foreground">(sent to Flux 2 Pro)</span>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {optimizedPrompt}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Similarity Indicator for direct prompts */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium text-green-600">
                        100% transcript included
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Final Prompt */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <h3 className="font-semibold text-sm">Prompt Sent to AI</h3>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {prompt || "No prompt available"}
                    </div>
                  </div>
                </>
              )}

              {/* Explanation */}
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">How the prompt is built:</p>
                <ul className="list-disc list-inside space-y-1">
                  {usedLLM ? (
                    <>
                      <li>Your full conversation is analyzed by Gemini AI</li>
                      <li>Design insights are extracted: room type, style, colors, materials, exclusions</li>
                      <li>An optimized 200-300 word prompt is generated for Flux 2 Pro</li>
                      <li>The image reflects ONLY what was discussed in the conversation</li>
                    </>
                  ) : (
                    <>
                      <li>Your full conversation is embedded in the prompt</li>
                      <li>Instructions guide the AI to extract: room type, style, colors, materials, exclusions</li>
                      <li>The AI generates a design that matches ALL discussed requirements</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
