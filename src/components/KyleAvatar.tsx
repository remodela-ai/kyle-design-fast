import { cn } from "@/lib/utils";
import kylePhoto from "@/assets/kyle-avatar.jpeg";
import { useKyle } from "@/contexts/KyleContext";

interface KyleAvatarProps {
  size?: "sm" | "md" | "lg";
}

export function KyleAvatar({ size = "lg" }: KyleAvatarProps) {
  const { toggleConversation, isConnected, isSpeaking } = useKyle();

  const sizeClasses = {
    sm: "w-12 h-16",
    md: "w-[4.5rem] h-24",
    lg: "w-[6.3rem] h-36",
  };

  const speaking = isConnected && isSpeaking;

  return (
    <button
      onClick={toggleConversation}
      className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
    >
      {/* Outer glow ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-[50%] bg-gradient-to-br from-primary/40 to-transparent",
          speaking && "animate-pulse-glow",
          size === "lg" && "-inset-3",
          size === "md" && "-inset-2",
          size === "sm" && "-inset-1"
        )}
      />
      
      {/* Inner ring */}
      <div
        className={cn(
          "absolute rounded-[50%] border-2 border-primary/30",
          size === "lg" && "-inset-2",
          size === "md" && "-inset-1.5",
          size === "sm" && "-inset-1"
        )}
      />
      
      {/* Avatar container */}
      <div
        className={cn(
          "relative rounded-[50%] overflow-hidden border-2 border-primary/50 bg-card",
          sizeClasses[size],
          (speaking || isConnected) && "glow-red"
        )}
      >
        {/* Kyle's photo */}
        <img 
          src={kylePhoto} 
          alt="Kyle - AI Design Agent" 
          className="w-full h-full object-cover object-top scale-110"
        />
      </div>

      {/* Status indicator */}
      <div
        className={cn(
          "absolute bottom-1 right-1 rounded-full border-2 border-background",
          isConnected ? "bg-green-500" : "bg-primary",
          size === "lg" && "w-4 h-4",
          size === "md" && "w-3 h-3",
          size === "sm" && "w-2 h-2",
          speaking && "animate-pulse"
        )}
      />
    </button>
  );
}
