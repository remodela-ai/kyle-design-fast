import { Button } from "@/components/ui/button";
import { Mic, Send, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKyle } from "@/contexts/KyleContext";
import { AudioWaves } from "./AudioWaves";

export function VoiceInput() {
  const { toggleConversation, isConnected, isSpeaking, error } = useKyle();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center gap-2 md:gap-3">
        {/* Voice button */}
        <Button
          variant="icon"
          size="icon-lg"
          onClick={toggleConversation}
          className={cn(
            "shrink-0 transition-all duration-300 h-10 w-10 md:h-12 md:w-12 shadow-lg shadow-primary/20 dark:shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-primary/40 dark:hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] hover:scale-105",
            isConnected && "bg-primary glow-red animate-pulse"
          )}
        >
          {isConnected ? (
            <MicOff className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
          ) : (
            <Mic className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>

        {/* Input field - clicking activates voice */}
        <div className="flex-1 relative">
          <button
            onClick={toggleConversation}
            className="w-full h-10 md:h-12 px-4 md:px-5 pr-12 md:pr-14 rounded-full bg-input border border-border text-muted-foreground text-left focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 text-sm md:text-base cursor-pointer hover:border-primary/50 shadow-lg shadow-primary/10 dark:shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:shadow-primary/20 dark:hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            {isConnected ? "Talking to Kyle..." : "Click to talk..."}
          </button>
          
          {/* Go button */}
          <Button
            variant="kyle"
            size="icon"
            onClick={toggleConversation}
            className="absolute right-1 md:right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 md:h-9 md:w-9 shadow-lg shadow-primary/30 dark:shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-primary/50 dark:hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] hover:scale-110 transition-all duration-300"
          >
            <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>

      {/* Voice status with audio waves */}
      {isConnected && (
        <div className="mt-3 md:mt-4 text-center animate-fade-in">
          <AudioWaves 
            isActive={isConnected} 
            isSpeaking={isSpeaking} 
            barCount={7}
            className="mb-2 h-8"
          />
          <p className="text-xs md:text-sm text-muted-foreground">
            {isSpeaking ? "Kyle is speaking..." : "Kyle is listening... Speak in any of 32 languages"}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-center text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
