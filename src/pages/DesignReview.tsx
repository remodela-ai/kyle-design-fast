import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Home, CheckCircle, Loader2, Image as ImageIcon, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { InsightsEditor } from "@/components/InsightsEditor";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useConversation } from "@11labs/react";

// Kyle Iteration Agent - specialized for design refinement
const KYLE_ITERATION_AGENT_ID = "agent_1501kbtjqq0pezxrrhkv2hvjync6";

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
  const [transcript, setTranscript] = useState(state?.transcript || "");
  const [currentInsights, setCurrentInsights] = useState(state?.extractedInsights || "");
  const [referenceImage] = useState(state?.referenceImage);
  const [source] = useState<"voice" | "pdf">(state?.source || "voice");
  
  const [iterationCount, setIterationCount] = useState(1);
  const [isIterating, setIsIterating] = useState(false);
  const [iterationFeedback, setIterationFeedback] = useState<string[]>([]);
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
        handleVoiceIteration();
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

  // Handle voice-based iteration
  const handleVoiceIteration = useCallback(async () => {
    if (iterationFeedback.length === 0) return;
    
    setIsIterating(true);
    const feedback = iterationFeedback.join(" ");
    
    try {
      // Combine current insights with voice feedback
      const refinedPrompt = `${currentInsights}\n\nAdditional refinements requested: ${feedback}`;
      
      const { data, error } = await supabase.functions.invoke('blink-design', {
        body: { 
          prompt: refinedPrompt,
          referenceImage: referenceImage || undefined
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setDesignImageUrl(data.imageUrl);
        setIterationCount(prev => prev + 1);
        
        // Append feedback to transcript
        setTranscript(prev => prev + `\n\n--- Iteration ${iterationCount + 1} Feedback ---\n${feedback}`);
        
        // Update insights if LLM refined them
        if (data.optimizedPrompt) {
          setCurrentInsights(data.optimizedPrompt);
        }
        
        toast.success(`Iteration ${iterationCount + 1} complete!`);
      }
    } catch (error) {
      console.error('Voice iteration error:', error);
      toast.error("Failed to regenerate design");
    } finally {
      setIsIterating(false);
      setIterationFeedback([]);
    }
  }, [iterationFeedback, currentInsights, referenceImage, iterationCount]);

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
      
      // Start without overrides - use the agent's default configuration
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
              isEditable={!isIterating && !isConnected}
            />
          </div>

          {/* Right Column: Image Preview + Voice Iteration + Actions */}
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

            {/* Voice Iteration Section */}
            <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-border bg-card">
              <div className="text-center">
                <h3 className="font-semibold text-sm mb-1">
                  {isConnected ? "Tell Kyle what to change" : "Talk to Kyle to iterate"}
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
                disabled={isIterating}
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

            {/* Approve Button */}
            <div className="space-y-3">
              <Button
                variant="kyle"
                size="lg"
                onClick={handleApprove}
                disabled={isIterating || isConnected}
                className="w-full gap-2 h-12"
              >
                <CheckCircle className="h-5 w-5" />
                Approve & Run Pipeline
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Talk to Kyle to iterate. When satisfied, approve to run the 16-step pipeline.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
