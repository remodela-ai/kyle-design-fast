import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Home, CheckCircle, RefreshCw, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { InsightsEditor } from "@/components/InsightsEditor";
import { ImageCarousel } from "@/components/ImageCarousel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useConversation } from "@11labs/react";
import { useDesignerSessions } from "@/hooks/useDesignerSessions";

// Kyle Iteration Agent - specialized for design refinement
const KYLE_ITERATION_AGENT_ID = "agent_8001kgg465sff939tkr973cqkesw";

interface LocationState {
  designImageUrl: string;
  transcript: string;
  extractedInsights: string;
  referenceImage?: string;
  source?: "voice" | "pdf";
  sessionId?: string; // Allow passing session from Shazam
}

interface ImageItem {
  url: string;
  label: string;
  iteration: number;
  prompt?: string;
}

export default function DesignReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as LocationState | null;
  
  // Session management - create intelligent folder
  const { upsertSession } = useDesignerSessions();
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    // Priority: URL param > state > generate new
    return searchParams.get('session') || state?.sessionId || crypto.randomUUID();
  });

  // State management
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (state?.designImageUrl) {
      return [{
        url: state.designImageUrl,
        label: "Original",
        iteration: 0,
        prompt: state.extractedInsights || ""
      }];
    }
    return [];
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [transcript, setTranscript] = useState(state?.transcript || "");
  const [currentInsights, setCurrentInsights] = useState(state?.extractedInsights || "");
  const [initialReferenceImage] = useState(state?.referenceImage);
  const [source] = useState<"voice" | "pdf">(state?.source || "voice");
  const [useImageAsReference, setUseImageAsReference] = useState(true);
  
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [iterationFeedback, setIterationFeedback] = useState<string[]>([]);
  
  // Get the current reference image based on toggle
  // IMPORTANT: use the currently selected image from the carousel to maintain consistency
  const currentReferenceImage = useImageAsReference 
    ? (images[selectedImageIndex]?.url || state?.designImageUrl)
    : initialReferenceImage;
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Ref to track if we should iterate on disconnect
  const shouldIterateOnDisconnect = useRef(false);
  const feedbackRef = useRef<string[]>([]);

  // Voice conversation for iteration
  const conversation = useConversation({
    onConnect: () => {
      console.log("✅ Kyle Iteration connected successfully");
      setIsVoiceActive(true);
      shouldIterateOnDisconnect.current = false;
    },
    onDisconnect: () => {
      console.log("Kyle Iteration disconnected, shouldIterate:", shouldIterateOnDisconnect.current);
      setIsVoiceActive(false);
      
      // Only trigger iteration if we explicitly set the flag
      if (shouldIterateOnDisconnect.current && feedbackRef.current.length > 0) {
        console.log("🚀 Triggering iteration with feedback:", feedbackRef.current);
        handleVoiceIteration(feedbackRef.current.join(" "));
      }
      shouldIterateOnDisconnect.current = false;
    },
    onMessage: (message) => {
      console.log("Kyle Iteration message:", message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = message as any;
      
      if (msg?.message && msg?.source === "user") {
        // Collect user feedback
        const newFeedback = [...feedbackRef.current, msg.message];
        feedbackRef.current = newFeedback;
        setIterationFeedback(newFeedback);
        
        // Detect iteration command
        const text = msg.message.toLowerCase().replace(/[.,!?;:]/g, '');
        const isIterateCommand = 
          text.includes("iterate") ||
          text.includes("generate") ||
          text.includes("apply") ||
          text.includes("update") ||
          text.includes("refresh") ||
          text.includes("cambiar") ||
          text.includes("actualizar") ||
          text.includes("aplicar");
        
        if (isIterateCommand) {
          console.log("🎯 ITERATE COMMAND DETECTED!");
          shouldIterateOnDisconnect.current = true;
          conversation.endSession();
        }
      }
    },
    onError: (err) => {
      console.error("❌ Kyle Iteration error:", err);
      setIsVoiceActive(false);
      toast.error("Voice connection error. Please try again.");
    },
  });

  // Handle regeneration (manual button or voice)
  const handleRegenerate = useCallback(async (additionalFeedback?: string) => {
    setIsRegenerating(true);
    
    try {
      // Build the refined prompt
      let refinedPrompt = currentInsights;
      if (additionalFeedback) {
        refinedPrompt = `${currentInsights}\n\nRefinement request: ${additionalFeedback}`;
      }
      
      // Add instruction to maintain consistency
      const consistencyPrompt = `${refinedPrompt}\n\nIMPORTANT: Maintain the same camera angle, room layout, architectural elements, and overall composition as the original design. Only modify the specific elements mentioned in the refinement request.`;
      
      console.info("[DesignReview] blink-design invoke", {
        hasReferenceImage: !!currentReferenceImage,
        referenceImage: currentReferenceImage ? `${currentReferenceImage.slice(0, 60)}...` : null,
      });
      
      const { data, error } = await supabase.functions.invoke('blink-design', {
        body: { 
          prompt: consistencyPrompt,
          referenceImage: currentReferenceImage || undefined
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        const newIteration = images.length;
        // Store the prompt used for this iteration
        const iterationPrompt = additionalFeedback 
          ? `${currentInsights}\n\nRefinement: ${additionalFeedback}`
          : currentInsights;
        const newImage: ImageItem = {
          url: data.imageUrl,
          label: `Iteration ${newIteration}`,
          iteration: newIteration,
          prompt: iterationPrompt
        };
        
        setImages(prev => [...prev, newImage]);
        setSelectedImageIndex(newIteration);
        
        // Append feedback to transcript if provided
        if (additionalFeedback) {
          setTranscript(prev => prev + `\n\n--- Iteration ${newIteration} Feedback ---\n${additionalFeedback}`);
        }
        
        // Update insights if LLM refined them
        if (data.optimizedPrompt) {
          setCurrentInsights(data.optimizedPrompt);
        }
        
        // Save session to create smart project folder
        await upsertSession({
          session_id: currentSessionId,
          design_image_url: data.imageUrl,
          conversation_summary: iterationPrompt.substring(0, 500),
        });
        console.log("[DesignReview] Session saved:", currentSessionId);
        
        toast.success(`Iteration ${newIteration} generated!`);
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      toast.error("Failed to regenerate design");
    } finally {
      setIsRegenerating(false);
      setIterationFeedback([]);
      feedbackRef.current = [];
    }
  }, [currentInsights, currentReferenceImage, images.length, upsertSession, currentSessionId]);

  // Handle voice-based iteration
  const handleVoiceIteration = useCallback((feedback: string) => {
    handleRegenerate(feedback);
  }, [handleRegenerate]);

  // Start voice iteration session
  const startVoiceIteration = useCallback(async () => {
    try {
      console.log("🎤 Requesting microphone access...");
      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log("✅ Microphone access granted");
      
      // Reset feedback
      setIterationFeedback([]);
      feedbackRef.current = [];
      shouldIterateOnDisconnect.current = false;
      
      console.log("🚀 Starting Kyle iteration session with agent:", KYLE_ITERATION_AGENT_ID);
      
      await conversation.startSession({
        agentId: KYLE_ITERATION_AGENT_ID,
        connectionType: "webrtc",
      });
      
      console.log("✅ Session started successfully");
    } catch (err) {
      console.error("❌ Failed to start voice iteration:", err);
      toast.error("Could not start voice. Please check microphone permissions.");
    }
  }, [conversation]);

  // Stop voice and trigger iteration
  const stopVoiceAndIterate = useCallback(async () => {
    console.log("🛑 Stop voice and iterate called");
    shouldIterateOnDisconnect.current = true;
    await conversation.endSession();
  }, [conversation]);

  // Redirect if no data
  useEffect(() => {
    if (!state?.designImageUrl || !state?.extractedInsights) {
      toast.error("No design data found. Please start from Shazam.");
      navigate("/shazam");
    }
  }, [state, navigate]);

  // Save initial session when component mounts (create smart folder)
  useEffect(() => {
    if (state?.designImageUrl && currentSessionId) {
      upsertSession({
        session_id: currentSessionId,
        design_image_url: state.designImageUrl,
        conversation_summary: state.extractedInsights?.substring(0, 500) || "",
      }).then(() => {
        console.log("[DesignReview] Initial session created:", currentSessionId);
      });
    }
  }, []); // Only run on mount

  // Handle approval - navigate to pipeline with selected image
  const handleApprove = () => {
    const selectedImage = images[selectedImageIndex];
    navigate("/360-free-project", {
      state: {
        designImageUrl: selectedImage.url,
        conversationSummary: currentInsights,
        transcript,
        iterationCount: images.length
      }
    });
  };

  if (!state) {
    return null; // Will redirect via useEffect
  }

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

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
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Transcript + Insights + Regenerate */}
          <div className="space-y-6">
            {/* Transcript Panel */}
            <TranscriptViewer 
              transcript={transcript} 
              source={source}
            />
            
            {/* Insights Panel - Editable */}
            <InsightsEditor
              insights={currentInsights}
              onInsightsChange={setCurrentInsights}
              isEditable={!isRegenerating && !isConnected}
            />
            
            {/* Image Reference Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2">
                <Switch
                  id="use-image-ref"
                  checked={useImageAsReference}
                  onCheckedChange={setUseImageAsReference}
                />
                <Label htmlFor="use-image-ref" className="text-sm font-medium cursor-pointer">
                  Use current image as reference
                </Label>
              </div>
              {useImageAsReference && (
                <span className="text-xs text-muted-foreground">
                  Maintains visual consistency
                </span>
              )}
            </div>
            
            {/* Regenerate Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleRegenerate()}
              disabled={isRegenerating || isConnected}
              className="w-full gap-2 h-12"
            >
              <RefreshCw className={`h-5 w-5 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate from Edited Insights
            </Button>
            
            {/* Voice Iteration Section */}
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-border bg-card">
              <div className="text-center">
                <h3 className="font-semibold text-sm mb-1">
                  {isConnected ? "Tell Kyle what to change" : "Or talk to Kyle to iterate"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isConnected 
                    ? "Say 'iterate' when ready to apply changes" 
                    : "Describe what you'd like to change in the design"}
                </p>
              </div>
              
              {/* Kyle Avatar for voice */}
              <KyleAvatar 
                size="md"
                onClickOverride={isConnected ? stopVoiceAndIterate : startVoiceIteration}
                isConnectedOverride={isConnected}
                isSpeakingOverride={isSpeaking}
              />
              
              {/* Audio waves when active */}
              {isConnected && (
                <AudioWaves 
                  isActive={isConnected} 
                  isSpeaking={isSpeaking} 
                  barCount={5}
                  className="h-6"
                />
              )}
              
              {/* Voice toggle button */}
              <Button
                variant={isConnected ? "destructive" : "outline"}
                size="sm"
                onClick={isConnected ? stopVoiceAndIterate : startVoiceIteration}
                disabled={isRegenerating}
                className="gap-2"
              >
                {isConnected ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    Stop & Iterate
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start Voice Feedback
                  </>
                )}
              </Button>
              
              {/* Collected feedback preview */}
              {iterationFeedback.length > 0 && (
                <div className="w-full p-3 rounded-lg bg-muted text-xs">
                  <p className="font-medium mb-1">Feedback collected:</p>
                  <p className="text-muted-foreground">{iterationFeedback.join(" ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Image Carousel + Actions */}
          <div className="space-y-6">
            {/* Image Carousel */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Design Versions</h3>
              <ImageCarousel
                images={images}
                selectedIndex={selectedImageIndex}
                onSelect={setSelectedImageIndex}
                isLoading={isRegenerating}
              />
            </div>

            {/* Approve Button */}
            <div className="space-y-3">
              <Button
                variant="kyle"
                size="lg"
                onClick={handleApprove}
                disabled={isRegenerating || isConnected}
                className="w-full gap-2 h-12"
              >
                <CheckCircle className="h-5 w-5" />
                Approve & Run Pipeline
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Edit insights and regenerate, or talk to Kyle. Select your preferred version, then approve to run the 16-step pipeline.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
