import { cn } from "@/lib/utils";
import kylePhoto from "@/assets/kyle-avatar.jpeg";
import { useKyle } from "@/contexts/KyleContext";

interface KyleAvatarProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
}

export function KyleAvatar({ size = "lg" }: KyleAvatarProps) {
  const { toggleConversation, isConnected, isSpeaking } = useKyle();

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-36 h-36",
    xl: "w-48 h-48",
    xxl: "w-64 h-64",
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
          "absolute inset-0 rounded-full bg-gradient-to-br from-primary/60 to-primary/20 blur-sm",
          speaking && "animate-pulse-glow from-primary/80 to-primary/40",
          size === "xxl" && "-inset-6",
          size === "xl" && "-inset-4",
          size === "lg" && "-inset-3",
          size === "md" && "-inset-2",
          size === "sm" && "-inset-1"
        )}
      />
      
      {/* Secondary glow layer for more impact */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-primary/20 blur-xl",
          speaking && "bg-primary/40 animate-pulse",
          size === "xxl" && "-inset-10",
          size === "xl" && "-inset-6",
          size === "lg" && "-inset-4",
          size === "md" && "-inset-3",
          size === "sm" && "-inset-2"
        )}
      />
      
      {/* Inner ring */}
      <div
        className={cn(
          "absolute rounded-full border-2 border-primary/40",
          speaking && "border-primary/60",
          size === "xxl" && "-inset-3",
          size === "xl" && "-inset-2.5",
          size === "lg" && "-inset-2",
          size === "md" && "-inset-1.5",
          size === "sm" && "-inset-1"
        )}
      />
      
      {/* Avatar container */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden border-2 border-primary/50 bg-card",
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
          size === "xxl" && "w-6 h-6 bottom-2 right-2",
          size === "xl" && "w-5 h-5 bottom-1.5 right-1.5",
          size === "lg" && "w-4 h-4",
          size === "md" && "w-3 h-3",
          size === "sm" && "w-2 h-2",
          speaking && "animate-pulse"
        )}
      />
    </button>
  );
}
