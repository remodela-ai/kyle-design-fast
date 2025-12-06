import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Send, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center gap-2 md:gap-3">
        {/* Voice button */}
        <Button
          variant="icon"
          size="icon-lg"
          onClick={toggleListening}
          className={cn(
            "shrink-0 transition-all duration-300 h-10 w-10 md:h-12 md:w-12",
            isListening && "bg-primary glow-red animate-pulse"
          )}
        >
          {isListening ? (
            <MicOff className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
          ) : (
            <Mic className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>

        {/* Input field */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Click to talk..."
            className="w-full h-10 md:h-12 px-4 md:px-5 pr-12 md:pr-14 rounded-full bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm md:text-base"
          />
          
          {/* Go button */}
          <Button
            variant="kyle"
            size="icon"
            className="absolute right-1 md:right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 md:h-9 md:w-9"
          >
            <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>

      {/* Voice status */}
      {isListening && (
        <div className="mt-3 md:mt-4 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Kyle is listening... Speak in any of 32 languages
          </p>
        </div>
      )}
    </div>
  );
}
