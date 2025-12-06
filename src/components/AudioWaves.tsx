import { cn } from "@/lib/utils";

interface AudioWavesProps {
  isActive: boolean;
  isSpeaking: boolean;
  barCount?: number;
  className?: string;
}

export function AudioWaves({ 
  isActive, 
  isSpeaking, 
  barCount = 5,
  className 
}: AudioWavesProps) {
  if (!isActive) return null;

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {[...Array(barCount)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full bg-primary transition-all duration-150",
            isSpeaking 
              ? "animate-audio-wave" 
              : "animate-audio-idle"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isSpeaking ? undefined : "8px",
          }}
        />
      ))}
    </div>
  );
}
