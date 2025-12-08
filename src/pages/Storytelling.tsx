import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { KyleAvatar } from "@/components/KyleAvatar";
import { AudioWaves } from "@/components/AudioWaves";
import { useStorytellerAgent } from "@/hooks/useStorytellerAgent";
import { ChevronUp } from "lucide-react";

const Storytelling = () => {
  const location = useLocation();
  const { generatedImage, designContext } = (location.state as { generatedImage?: string; designContext?: string }) || {};
  
  const {
    status,
    isSpeaking,
    isConnected,
    startConversation,
    stopConversation,
    pipelineCommandDetected,
  } = useStorytellerAgent();

  const [hasStarted, setHasStarted] = useState(false);

  // Auto-start storytelling when page loads with context
  useEffect(() => {
    if (designContext && !hasStarted) {
      const timer = setTimeout(() => {
        startConversation(designContext);
        setHasStarted(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [designContext, hasStarted, startConversation]);

  const handleKyleTap = () => {
    if (isConnected) {
      stopConversation();
    } else {
      startConversation(designContext);
      setHasStarted(true);
    }
  };

  const getStatusText = () => {
    if (pipelineCommandDetected) return "Starting your project...";
    if (isSpeaking) return "Kyle is telling your story...";
    if (isConnected) return "Listening...";
    return "Tap Kyle to hear your story";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5 pointer-events-none" />
      
      {/* Generated image as background with overlay */}
      {generatedImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={generatedImage} 
            alt="Generated design" 
            className="w-full h-full object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg w-full">
        {/* Kyle Avatar */}
        <div className="relative">
          <KyleAvatar 
            size="xxl"
            onClickOverride={handleKyleTap}
          />
          
          {/* Audio waves */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
            <AudioWaves isActive={isConnected} isSpeaking={isSpeaking} />
          </div>
        </div>

        {/* Tap indicator when not started */}
        {!isConnected && !hasStarted && (
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <ChevronUp className="w-6 h-6 text-primary" />
            <span className="text-lg text-muted-foreground">Tap Kyle to start</span>
          </div>
        )}

        {/* Status text */}
        <p className="text-lg text-center text-muted-foreground min-h-[28px]">
          {getStatusText()}
        </p>

        {/* Generated image preview */}
        {generatedImage && (
          <div className="w-full max-w-sm rounded-xl overflow-hidden border border-primary/30 shadow-lg shadow-primary/20">
            <img 
              src={generatedImage} 
              alt="Your design" 
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Pipeline command indicator */}
        {pipelineCommandDetected && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-primary/20 border border-primary/50 rounded-full px-6 py-3 animate-pulse">
            <span className="text-primary font-medium">Preparing your full project...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Storytelling;
